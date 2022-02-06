/* eslint-disable prefer-const */
import * as vscode from 'vscode';
import { dotnugg } from '@nuggxyz/dotnugg-sdk';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';

import Helper from './Helper';
import { CodeLens } from './CodeLens';

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

let layerColors = {
    '-4': 'rgba(0,180,255,1)',
    '-3': 'rgba(0,212,255,1)',
    '-2': 'rgba(0,255,244,1)',
    '-1': 'rgba(0,255,168,1)',
    '+D': 'rgba(0,255,92,1)',
    '+0': 'rgba(23,255,0,1)',
    '+1': 'rgba(176,255,0,1)',
    '+2': 'rgba(253,255,0,1)',
    '+3': 'rgba(255,240,0,1)',
    '+4': 'rgba(255,210,0,1)',
    '+5': 'rgba(255,180,0,1)',
    '+6': 'rgba(255,150,0,1)',
    '+7': 'rgba(255,120,0,1)',
    '+8': 'rgba(255,90,0,1)',
    '+9': 'rgba(255,60,0,1)',
};

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

class Decorator {
    public static colorDecorators: { [_: Rgba]: vscode.TextEditorDecorationType } = {};
    public static textDecorators: { [_: string]: vscode.TextEditorDecorationType } = {};

    public static lay: { [_: string]: vscode.TextEditorDecorationType } = {};
    public static anchor: vscode.TextEditorDecorationType;
    public static background: vscode.TextEditorDecorationType;

    public static axis: { [_: string]: vscode.TextEditorDecorationType } = {};
    public static uris: { [_: string]: Decorator } = {};

    public lastEditor: vscode.TextEditor;

    public ttl: Date;

    constructor(uri: string) {
        Decorator.uris[uri] = this;
    }

    public static decorateActiveFile(doc: vscode.TextDocument) {
        let me = this.uris[Helper.editor.document.uri.fsPath];

        if (!me) {
            me = new Decorator(Helper.editor.document.uri.fsPath);
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
            let prevColorDecorators = Decorator.colorDecorators;
            let prevLayDecorators = Decorator.lay;
            Decorator.colorDecorators = {};
            Decorator.lay = {};

            let prevBackground = Decorator.background;

            Decorator.background = undefined;

            me.ttl = new Date();

            let allRanges = [];

            let backgroundRanges = [];

            let anchorRanges: vscode.Range[] = [];

            // let prevCodeLens = me.codeLens;

            // me.codeLens = [];

            const versionsWithColors: ({
                colors: ParserTypes.RangeOf<ParserTypes.Colors>;
                feature: ParserTypes.RangeOf<string>;
            } & ParserTypes.Version)[] = [];

            let colorRanges: { [_: string]: vscode.Range[] } = {};

            let featureLayerColorMap = {};

            [...Object.values(prevLayDecorators)].forEach((x) => {
                if (x) {
                    // Helper.editor.setDecorations(x, []);
                    x.dispose();
                }
            });

            for (let i = 0; i < parser.results.items.length; i++) {
                const attr = parser.results.items[i].value;
                const colors = attr.colors;
                const versionKeys = Object.keys(attr.versions.value);

                console.log(attr);

                const attrname = attr.feature.value;
                console.log(attrname);
                console.log(Decorator.lay);

                if (Decorator.lay[attrname] !== undefined) {
                    Decorator.lay[attrname].dispose();
                }

                console.log(Helper.collection);
                console.log(attr);

                // const contentText =
                //     ' default.layer: ' +
                //     Helper.collection.features[attrname].zindex.direction +
                //     Helper.collection.features[attrname].zindex.offset;

                // Decorator.lay[attrname] = vscode.window.createTextEditorDecorationType({
                //     light: {
                //         after: {
                //             color: 'rgba(0,0,0,.5)',
                //             contentText,
                //         },
                //     },
                //     dark: {
                //         after: {
                //             color: 'rgba(255,255,255,.5)',
                //             contentText,
                //         },
                //     },
                // });

                // Helper.editor.setDecorations(Decorator.lay[attrname], [
                //     { range: doc.lineAt(attr.colors.token.lineNumber).range, hoverMessage: 'this is defined in your collection.nugg file' },
                // ]);

                for (let j = 0; j < Object.keys(colors.value).length; j++) {
                    const colorid = colors.value[Object.keys(colors.value)[j]].value.name.value;

                    let layer = colors.value[Object.keys(colors.value)[j]].value.zindex;

                    let layerval =
                        (layer.value.offset === 100 ? Helper.collection.features[attrname].zindex.direction : layer.value.direction) +
                        (layer.value.offset === 100 ? Helper.collection.features[attrname].zindex.offset : layer.value.offset);

                    Decorator.lay[colorid] = vscode.window.createTextEditorDecorationType({
                        light: {
                            after: {
                                color: 'rgba(0,0,0,.5)',
                                contentText: `: ${layerval}`,
                            },
                        },
                        dark: {
                            after: {
                                color: 'rgba(255,255,255,.5)',
                                contentText: `: ${layerval}`,
                            },
                        },
                    });

                    Helper.editor.setDecorations(Decorator.lay[colorid], [
                        {
                            range: Helper.vscodeRange(layer.token),
                        },
                    ]);

                    if (CodeLens.checkLayerColorsVisible(Helper.editor.document)) {
                        if (!layerColors[layerval]) {
                            return;
                        }

                        let color: string = layerColors[layerval];
                        if (!colorRanges[color]) {
                            colorRanges[color] = [];
                        }
                        colorRanges[color].push(Helper.vscodeRangeOffset(layer.token, 1, 0));

                        featureLayerColorMap[colors.value[Object.keys(colors.value)[j]].value.name.value] = color;
                    }

                    let col = colors.value[Object.keys(colors.value)[j]].value.rgba;
                    let color = col.value;

                    if (!colorRanges[color]) {
                        colorRanges[color] = [];
                    }

                    colorRanges[color].push(Helper.vscodeRange(col.token));
                }

                for (let j = 0; j < versionKeys.length; j++) {
                    versionsWithColors.push({ ...attr.versions.value[versionKeys[j]].value, colors, feature: attr.feature });
                }
            }

            [...versionsWithColors].forEach((x) => {
                // let upRange, downRange, rightRange, leftRange;
                x.data.value.matrix.forEach((r, yindex) => {
                    if (yindex === 0) {
                        // const token = Helper.vscodeRange(r.token);
                        // me.codeLens.push(
                        //     new vscode.CodeLens(token, {
                        //         title: 'toggle colors',
                        //         command: 'dotnugg.showLayerColorsInActiveDoc',
                        //     }),
                        // );
                        // me.codeLens.push(
                        //     new vscode.CodeLens(token, {
                        //         title: 'toggle background',
                        //         command: 'dotnugg.showBackground',
                        //     }),
                        // );
                    }
                    r.value.forEach((c, xindex) => {
                        try {
                            const token = Helper.vscodeRange(c.value.label.token);

                            allRanges.push(token);

                            if (x.anchor.value.x.value === xindex + 1 && x.anchor.value.y.value === yindex + 1) {
                                anchorRanges.push(Helper.vscodeRange(c.value.label.token));
                            }

                            if (c.value.type.value === 'color' || c.value.type.value === 'filter') {
                                let color: string; // if layer colors is active
                                if (CodeLens.checkLayerColorsVisible(Helper.editor.document)) {
                                    color = featureLayerColorMap[x.colors.value[c.value.label.value].value.name.value];
                                } else {
                                    color = x.colors.value[c.value.label.value].value.rgba.value;
                                }

                                if (!colorRanges[color]) {
                                    colorRanges[color] = [];
                                }
                                colorRanges[color].push(Helper.vscodeRange(c.value.type.token));
                            } else {
                                backgroundRanges.push(token);
                            }
                        } catch (err) {}
                    });
                });

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

            Object.keys(colorRanges).forEach((key) => {
                if (prevColorDecorators[key]) {
                    Decorator.colorDecorators[key] = prevColorDecorators[key];
                    delete prevColorDecorators[key];
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

            if (CodeLens.checkBackgroundVisible(Helper.editor.document)) {
                Decorator.background = vscode.window.createTextEditorDecorationType({
                    light: {
                        backgroundColor: '#333333',
                    },
                    dark: {
                        backgroundColor: '#bbbbbb',
                    },
                });

                Helper.editor.setDecorations(Decorator.background, backgroundRanges);
            }

            if (prevBackground) {
                prevBackground.dispose();
            }

            Helper.editor.setDecorations(decSpace, allRanges);

            if (Decorator.anchor) {
                Decorator.anchor.dispose();
            }

            Decorator.anchor = vscode.window.createTextEditorDecorationType({
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

            Helper.editor.setDecorations(Decorator.anchor, anchorRanges);

            [...Object.values(prevColorDecorators)].forEach((x) => {
                if (x) {
                    // Helper.editor.setDecorations(x, []);
                    x.dispose();
                }
            });
        } catch (err) {
            console.error({ msg: 'ERROR in decorator', err: doc });
        }
    }
}
export default Decorator;
