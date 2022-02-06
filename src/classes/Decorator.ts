/* eslint-disable prefer-const */
import * as vscode from 'vscode';
import { dotnugg } from '@nuggxyz/dotnugg-sdk';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';

import Helper from './Helper';

let anchorDec = vscode.window.createTextEditorDecorationType({
    light: {
        // this color will be used in light color themes
        borderStyle: 'solid',
        borderColor: 'rgba(139,0,0,1)',
        borderWidth: '2px',
        borderRadius: '3px',
        backgroundColor: 'rgba(255,204,203,.5)',
        fontWeight: 'bold',
        textDecoration: 'wavy',
    },
    dark: {
        // this color will be used in dark color themes
        borderRadius: '3px',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: 'rgba(139,0,0,1)',
        backgroundColor: 'rgba(255,204,203,.5)',
        fontWeight: 'bold',
        textDecoration: 'wavy',
    },
});

let decSpace = vscode.window.createTextEditorDecorationType({
    // letterSpacing: '5px',
    before: {
        width: '5px',
        contentText: '',
    },
    after: {
        width: '5px',
        contentText: '',
    },
});

type Rgba = `rgba(${number},${number},${number},${number})`;

let getRGBA = function (a: string) {
    let match = a.match(/^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+|\d{1,3})?)\)$/);
    return match
        ? {
              r: Number(match[1]),
              g: Number(match[2]),
              b: Number(match[3]),
              a: Number(match[4]),
          }
        : {};
};

function luma(rgba: string): number {
    const { r, g, b } = getRGBA(rgba);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function findOffsets(
    centerx: number,
    centery: number,
    data: ParserTypes.Data,
): { top: number; bot: number; side: number; centerx: number; centery: number } {
    let topFound = false;
    let bottomFound = false;
    let shouldExpandSide = false;

    let top = 6; // put these into constants later
    let bot = 6;
    let side = 4;

    while (!topFound && !bottomFound) {
        if (shouldExpandSide) {
            side++;
        }
        shouldExpandSide = !shouldExpandSide;

        if (!topFound) {
            if (
                data.matrix[centery - side].value[centerx + top].value.type.value !== 'transparent' &&
                data.matrix[centery + side].value[centerx + top].value.type.value !== 'transparent'
            ) {
                top++;
            } else {
                topFound = true;
            }
        }

        if (!bottomFound) {
            if (
                data.matrix[centery - side].value[centerx - bot].value.type.value !== 'transparent' &&
                data.matrix[centery + side].value[centerx - bot].value.type.value !== 'transparent'
            ) {
                bot++;
            } else {
                bottomFound = true;
            }
        }
    }

    // if (top > bot) {
    //     centery++;
    //     // center = {
    //     //     x: Math.floor((top + bot + 1) / 2),
    //     //     y: center.y,
    //     // };
    // } else if (top < bot) {
    //     centery--;
    // }
    // Logger.out({ top, bot, side, centerx, centery });
    return { top, bot, side, centerx, centery };
}

export class DotnuggCodeLensProvider {
    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
        return Decorator.uris[document.uri.fsPath].codeLens;
    }
}

class Decorator {
    public codeLens: vscode.CodeLens[] = [];
    public static colorDecorators: { [_: Rgba]: vscode.TextEditorDecorationType } = {};
    public static axis: { [_: string]: vscode.TextEditorDecorationType } = {};
    public static uris: { [_: string]: Decorator } = {};

    public ttl: Date;

    public static decorateActiveFile(doc: vscode.TextDocument) {
        let me = this.uris[Helper.editor.document.uri.fsPath];

        if (!me) {
            me = new Decorator();
            this.uris[Helper.editor.document.uri.fsPath] = me;
        }
        let parser: dotnugg.parser;
        // if (me.ttl) {
        try {
            parser = dotnugg.parser.parseData(Helper.editor.document.getText());
        } catch {
            console.log('error in parser');
            return;
        }
        // }
        try {
            let prev = Decorator.colorDecorators;

            Decorator.colorDecorators = {};

            me.ttl = new Date();

            let allRanges = [];

            let anchorRanges: vscode.Range[] = [];

            me.codeLens = [];

            const versionsWithColors: ({
                colors: ParserTypes.RangeOf<ParserTypes.Colors>;
                feature: ParserTypes.RangeOf<string>;
            } & ParserTypes.Version)[] = [];

            let colorRanges: { [_: string]: vscode.Range[] } = {};

            for (let i = 0; i < parser.results.items.length; i++) {
                const attr = parser.results.items[i].value;
                const colors = attr.colors;
                const versionKeys = Object.keys(attr.versions.value);

                for (let j = 0; j < versionKeys.length; j++) {
                    versionsWithColors.push({ ...attr.versions.value[versionKeys[j]].value, colors, feature: attr.feature });
                }
            }

            [...versionsWithColors].forEach((x) => {
                // let upRange, downRange, rightRange, leftRange;
                x.data.value.matrix.forEach((r, yindex) => {
                    if (yindex === 0) {
                        const token = Helper.vscodeRange(r.token);

                        me.codeLens.push(new vscode.CodeLens(token, { title: 'show layers as colors', command: '' }));
                    }
                    r.value.forEach((c, xindex) => {
                        try {
                            const token = Helper.vscodeRange(c.value.label.token);

                            allRanges.push(token);

                            if (x.anchor.value.x.value === xindex + 1 && x.anchor.value.y.value === yindex + 1) {
                                anchorRanges.push(Helper.vscodeRange(c.value.label.token));
                            }

                            if (c.value.type.value === 'color' || c.value.type.value === 'filter') {
                                const color = x.colors.value[c.value.label.value].value.rgba;
                                if (!colorRanges[color.value]) {
                                    colorRanges[color.value] = [Helper.vscodeRange(color.token)];
                                }
                                colorRanges[color.value].push(Helper.vscodeRange(c.value.type.token));
                            }
                        } catch (err) {}
                    });
                });
                console.log('a');
                console.log(prev);

                // if (prev[id]) {
                //     Helper.editor.setDecorations(prev[id], []);
                //     // prev[id as Rgba].dispose();
                //     delete prev[id];
                // }

                if (Decorator.axis[x.name.value] !== undefined) {
                    Decorator.axis[x.name.value].dispose();
                }
                try {
                    Decorator.axis[x.name.value] = vscode.window.createTextEditorDecorationType({
                        dark: {
                            after: {
                                contentText: ` (${x.data.value.matrix[0].value.length}, ${x.data.value.matrix.length})`,
                                fontWeight: 'bold',
                                color: 'rgba(200,200,200,1)',
                            },
                        },
                        light: {
                            after: {
                                contentText: ` (${x.data.value.matrix[0].value.length}, ${x.data.value.matrix.length})`,
                                fontWeight: 'bold',
                                color: 'rgba(50,50,50,1)',
                            },
                        },
                    });

                    Helper.editor.setDecorations(Decorator.axis[x.name.value], [doc.lineAt(Helper.vscodeRange(x.data.token).start.line)]);
                } catch {
                    console.log('error decorating ledgend');
                }
            });
            console.log('b');
            console.log(prev);

            Object.keys(colorRanges).forEach((key) => {
                if (prev[key]) {
                    Decorator.colorDecorators[key] = prev[key];
                    delete prev[key];
                } else {
                    Decorator.colorDecorators[key] = vscode.window.createTextEditorDecorationType({
                        light: {
                            backgroundColor: key,
                            color: luma(key) > 0.5 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
                            // cursor: 'crosshair',
                        },
                        dark: {
                            backgroundColor: key,
                            color: luma(key) > 0.5 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
                            // cursor: 'crosshair',
                        },
                    });
                }

                Helper.editor.setDecorations(Decorator.colorDecorators[key], colorRanges[key]);
            });
            console.log('c');
            console.log(prev);
            Helper.editor.setDecorations(decSpace, allRanges);
            Helper.editor.setDecorations(anchorDec, anchorRanges);

            Object.values(prev).forEach((x) => {
                if (x) {
                    console.log(prev);
                    Helper.editor.setDecorations(x, []);
                    x.dispose();
                }
            });
        } catch (err) {
            console.error({ msg: 'ERROR in decorator', err: doc });
        }
    }
}
export default Decorator;
