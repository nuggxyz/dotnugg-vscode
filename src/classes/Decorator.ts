/* eslint-disable prefer-const */
import * as vscode from 'vscode';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';
import { dotnugg } from '@nuggxyz/dotnugg-sdk';

import Helper from './Helper';

let decD = vscode.window.createTextEditorDecorationType({
    // isWholeLine: true,

    light: {
        // this color will be used in light color themes
        borderStyle: 'solid none none none',
        borderColor: 'red',
        borderWidth: '2px',
    },
    dark: {
        // this color will be used in dark color themes
        borderStyle: 'solid none none none',
        borderColor: 'red',
        borderWidth: '2px',
    },
});

let decU = vscode.window.createTextEditorDecorationType({
    // isWholeLine: true,
    // rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen,

    light: {
        // this color will be used in light color themes
        borderStyle: 'none none solid none',
        borderColor: 'red',
        borderWidth: '2px',
    },
    dark: {
        // this color will be used in dark color themes
        borderStyle: 'none none solid none',
        borderColor: 'red',
        borderWidth: '2px',
    },
});

let decL = vscode.window.createTextEditorDecorationType({
    light: {
        // this color will be used in light color themes
        borderStyle: 'none solid none none',
        borderColor: 'red',
        borderWidth: '2px',
    },
    dark: {
        // this color will be used in dark color themes
        borderStyle: 'none solid none none',
        borderColor: 'red',
        borderWidth: '2px',
    },
});

let decR = vscode.window.createTextEditorDecorationType({
    light: {
        // this color will be used in light color themes
        borderStyle: 'none none none solid',
        borderColor: 'red',
        borderWidth: '2px',
    },
    dark: {
        // this color will be used in dark color themes
        borderWidth: '2px',
        borderStyle: 'none none none solid',
        borderColor: 'red',
    },
});

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

let radiiDec = vscode.window.createTextEditorDecorationType({
    light: {
        // this color will be used in light color themes
        backgroundColor: 'rgba(5,6,255,0.4)',
    },
    dark: {
        // this color will be used in dark color themes
        backgroundColor: 'rgba(5,6,255,0.4)',
    },
});

let fadedDec = vscode.window.createTextEditorDecorationType({
    light: {
        // this color will be used in light color themes
        color: 'rgba(225,40,40,0.2)',
    },
    dark: {
        // this color will be used in dark color themes
        color: 'rgba(225,40,40,0.2)',
    },
});

let decUarrow = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '⬆︎',
        fontStyle: 'normal',
        color: 'rgba(255, 255, 255, 1)',
    },
});
let decDarrow = vscode.window.createTextEditorDecorationType({
    after: {
        contentText: '⬇︎ ',
        fontStyle: 'normal',
        color: 'rgba(255, 255, 255, 1)',
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

let ledgendDecorator = vscode.window.createTextEditorDecorationType({
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

//

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
    // Calculate the perceptive luminance (aka luma) - human eye favors green color...
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for bright colors, white for dark colors
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
        return Decorator.codeLens;
    }
}

class Decorator {
    public static codeLens: vscode.CodeLens[] = [];
    public static colorDecorators: { [_: Rgba]: vscode.TextEditorDecorationType } = {};

    public static decorateActiveFile() {
        // invariant(false, '');
        try {
            const parser = dotnugg.parser.parseData(Helper.editor.document.getText());

            // Helper.editor.setDecorations(decU, []);
            // Helper.editor.setDecorations(decD, []);
            // Helper.editor.setDecorations(decL, []);
            // Helper.editor.setDecorations(decR, []);
            // Helper.editor.setDecorations(anchorDec, []);
            // Helper.editor.setDecorations(radiiDec, []);
            // Helper.editor.setDecorations(fadedDec, []);

            // Helper.editor.setDecorations(decUarrow, []);
            // Helper.editor.setDecorations(decDarrow, []);
            // // Helper.editor.setDecorations(decLarrow, []);
            // // Helper.editor.setDecorations(decRarrow, []);
            // Helper.editor.setDecorations(decSpace, []);

            // Decorator.colorDecorators.forEach((x) => {
            //     Helper.editor.setDecorations(x, []);
            // });

            let allRanges = [];
            let expanderRanges: ParserTypes.Dictionary<vscode.Range[]> = {
                D: [],
                U: [],
                R: [],
                L: [],
            };
            let radiiRanges: vscode.Range[] = [];

            let anchorRanges: vscode.Range[] = [];
            let fadedRanges: vscode.Range[] = [];

            const versionsWithColors: ({
                colors: ParserTypes.RangeOf<ParserTypes.Colors>;
                feature: ParserTypes.RangeOf<string>;
            } & ParserTypes.Version)[] = [];

            for (let i = 0; i < parser.results.items.length; i++) {
                const attr = parser.results.items[i].value;
                const colors = attr.colors;
                const versionKeys = Object.keys(attr.versions.value);

                for (let j = 0; j < versionKeys.length; j++) {
                    versionsWithColors.push({ ...attr.versions.value[versionKeys[j]].value, colors, feature: attr.feature });
                }
            }

            [...versionsWithColors].forEach((x) => {
                if (x.name.value !== 'BASE') {
                    let colorRanges = {};

                    // let upRange, downRange, rightRange, leftRange;
                    x.data.value.matrix.forEach((r, yindex) => {
                        r.value.forEach((c, xindex) => {
                            try {
                                const token = Helper.vscodeRange(c.value.label.token);
                                if ((yindex === 0 || yindex === x.data.value.matrix.length - 1) && (xindex + 1) % 2 === 1) {
                                    // this.codeLens.push(new vscode.CodeLens(token, { title: String(xindex + 1), command: '' }));
                                }
                                allRanges.push(token);

                                // if (dotnugg.parser.globalCollection) {
                                //     const feature = dotnugg.parser.globalCollection.value.features.value[x.feature.value].value;
                                //     if (
                                //         feature.expandableAt.value.r.value > 0 &&
                                //         yindex + 1 === x.anchor.value.y.value &&
                                //         xindex + 1 > x.anchor.value.x.value &&
                                //         xindex + 1 < x.anchor.value.x.value + x.radii.value.r.value
                                //     ) {
                                //         radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                                //     } else if (
                                //         feature.expandableAt.value.l.value > 0 &&
                                //         yindex + 1 === x.anchor.value.y.value &&
                                //         xindex + 1 < x.anchor.value.x.value &&
                                //         xindex + 1 > x.anchor.value.x.value - x.radii.value.l.value
                                //     ) {
                                //         radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                                //     } else if (
                                //         feature.expandableAt.value.d.value > 0 &&
                                //         xindex + 1 === x.anchor.value.x.value &&
                                //         yindex + 1 > x.anchor.value.y.value &&
                                //         yindex + 1 < x.anchor.value.y.value + x.radii.value.d.value
                                //     ) {
                                //         radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                                //     } else if (
                                //         feature.expandableAt.value.u.value > 0 &&
                                //         xindex + 1 === x.anchor.value.x.value &&
                                //         yindex + 1 < x.anchor.value.y.value &&
                                //         yindex + 1 > x.anchor.value.y.value - x.radii.value.u.value
                                //     ) {
                                //         radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                                //     }

                                //     // if (
                                //     //     feature.expandableAt.value.r.value === 0 &&
                                //     //     feature.expandableAt.value.l.value === 0 &&
                                //     //     feature.expandableAt.value.d.value === 0 &&
                                //     //     feature.expandableAt.value.u.value === 0
                                //     // ) {
                                //     //     fadedRanges.push(x.radii.token.range);
                                //     //     fadedRanges.push(x.expanders.token.range);
                                //     // }

                                //     //   vscode.window.activeTextEditor
                                //     //       .edit((builder) => {
                                //     //           if (feature.expandableAt.value.r.value === 0 && x.radii.value.r.value !== 0) {
                                //     //               builder.replace(x.radii.value.r.token.range, '0');
                                //     //           }
                                //     //           if (feature.expandableAt.value.l.value === 0 && x.radii.value.l.value !== 0) {
                                //     //               builder.replace(x.radii.value.l.token.range, '0');
                                //     //           }
                                //     //           if (feature.expandableAt.value.d.value === 0 && x.radii.value.d.value !== 0) {
                                //     //               builder.replace(x.radii.value.d.token.range, '0');
                                //     //           }
                                //     //           if (feature.expandableAt.value.u.value === 0 && x.radii.value.u.value !== 0) {
                                //     //               builder.replace(x.radii.value.u.token.range, '0');
                                //     //           }
                                //     //           if (feature.expandableAt.value.r.value === 0 && x.expanders.value.r.value !== 0) {
                                //     //               builder.replace(Helper.vscodeRange(x.expanders.value.r.token), '0');
                                //     //           }
                                //     //           if (feature.expandableAt.value.l.value === 0 && x.expanders.value.l.value !== 0) {
                                //     //               builder.replace(x.expanders.value.l.token.range, '0');
                                //     //           }
                                //     //           if (feature.expandableAt.value.d.value === 0 && x.expanders.value.d.value !== 0) {
                                //     //               builder.replace(x.expanders.value.d.token.range, '0');
                                //     //           }
                                //     //           if (feature.expandableAt.value.u.value === 0 && x.expanders.value.u.value !== 0) {
                                //     //               builder.replace(x.expanders.value.u.token.range, '0');
                                //     //           }
                                //     //       })
                                //     //       .then();

                                //     if (feature.expandableAt.value.r.value === 0) {
                                //         // fadedRanges.push(x.radii.value.r.token.range);
                                //         fadedRanges.push(Helper.vscodeRange(x.expanders.value.r.token));
                                //     }
                                //     if (feature.expandableAt.value.l.value === 0) {
                                //         // fadedRanges.push(x.radii.value.l.token.range);
                                //         fadedRanges.push(Helper.vscodeRange(x.expanders.value.l.token));
                                //     }
                                //     if (feature.expandableAt.value.d.value === 0) {
                                //         // fadedRanges.push(x.radii.value.d.token));
                                //         fadedRanges.push(Helper.vscodeRange(x.expanders.value.d.token));
                                //     }
                                //     if (feature.expandableAt.value.u.value === 0) {
                                //         // fadedRanges.push(x.radii.value.u.token));
                                //         fadedRanges.push(Helper.vscodeRange(x.expanders.value.u.token));
                                //     }
                                // }

                                if (x.anchor.value.x.value === xindex + 1 && x.anchor.value.y.value === yindex + 1) {
                                    // if (cindex === r.value.length - 1) {
                                    //     downRange = Helper.vscodeRange(c.value.label.token);
                                    // }
                                    anchorRanges.push(Helper.vscodeRange(c.value.label.token));
                                }

                                if (x.expanders !== undefined) {
                                    if (x.expanders.value.d.value === yindex + 1) {
                                        // if (cindex === r.value.length - 1) {
                                        //     downRange = Helper.vscodeRange(c.value.label.token);
                                        // }
                                        expanderRanges.D.push(Helper.vscodeRange(c.value.label.token));
                                    }
                                    if (x.expanders.value.u.value === yindex + 1) {
                                        // if (cindex === r.value.length - 1) {
                                        //     upRange = Helper.vscodeRange(c.value.label.token);
                                        // }
                                        expanderRanges.U.push(Helper.vscodeRange(c.value.label.token));
                                    }
                                    if (x.expanders.value.r.value === xindex + 1) {
                                        if (yindex === 0) {
                                            // rightRange = c.label.token.range;
                                        }
                                        expanderRanges.R.push(Helper.vscodeRange(c.value.label.token));
                                    }
                                    if (x.expanders.value.l.value === xindex + 1) {
                                        if (yindex === x.data.value.matrix.length - 1) {
                                            // leftRange = c.label.token.range;
                                        }
                                        expanderRanges.L.push(Helper.vscodeRange(c.value.label.token));
                                    }
                                }

                                if (c.value.type.value === 'color' || c.value.type.value === 'filter') {
                                    const color = x.colors.value[c.value.label.value].value.rgba.value;
                                    if (!colorRanges[color]) {
                                        colorRanges[color] = [];
                                    }
                                    colorRanges[color].push(Helper.vscodeRange(c.value.type.token));
                                }
                            } catch (err) {}
                        });
                    });

                    Object.keys(colorRanges).forEach((rgba) => {
                        if (!Decorator.colorDecorators[rgba]) {
                            Decorator.colorDecorators[rgba] = vscode.window.createTextEditorDecorationType({
                                light: {
                                    backgroundColor: rgba,
                                    color: luma(rgba) > 0.5 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
                                    // cursor: 'crosshair',
                                },
                                dark: {
                                    backgroundColor: rgba,
                                    color: luma(rgba) > 0.5 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
                                    // cursor: 'crosshair',
                                },
                            });
                        }

                        Helper.editor.setDecorations(Decorator.colorDecorators[rgba], colorRanges[rgba]);
                    });

                    if (Decorator.colorDecorators['ledgend'] !== undefined) {
                        Decorator.colorDecorators['ledgend'].dispose();
                    }

                    Decorator.colorDecorators['ledgend'] = vscode.window.createTextEditorDecorationType({
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
                    Helper.editor.setDecorations(Decorator.colorDecorators['ledgend'], [
                        Helper.editor.document.lineAt(Helper.vscodeRange(x.data.token).start.line),
                    ]);

                    // if (Decorator.colorDecorators['top-ruler'] !== undefined) {
                    //     Decorator.colorDecorators['top-ruler'].dispose();
                    // }

                    // Decorator.colorDecorators['top-ruler'] = vscode.window.createTextEditorDecorationType({
                    //     dark: {
                    //         after: {
                    //             contentText: `3 4 5 6 7 8 9 0 `,
                    //             fontWeight: 'bold',
                    //             color: 'rgba(200,200,200,1)',
                    //         },
                    //     },
                    //     light: {
                    //         after: {
                    //             contentText: `3 4 5 6 7 8 9 0 `,
                    //             fontWeight: 'bold',
                    //             color: 'rgba(50,50,50,1)',
                    //         },
                    //     },
                    // });
                    // Helper.editor.setDecorations(Decorator.colorDecorators['top-ruler'], [
                    //     Helper.editor.document.lineAt(Helper.vscodeRange(x.data.token).start.line + 1),
                    // ]);

                    // Helper.editor.setDecorations(decUarrow, [upRange]);
                    // Helper.editor.setDecorations(decDarrow, [downRange]);
                } else {
                    let colorRanges = {};
                    const half = Math.floor(x.data.value.matrix.length / 2) + 1;

                    const offsets = findOffsets(half, half, x.data.value);

                    // let upRange, downRange, rightRange, leftRange;
                    // Logger.out(x.colors.);
                    x.data.value.matrix.forEach((r, yindex) => {
                        r.value.forEach((c, xindex) => {
                            allRanges.push(Helper.vscodeRange(c.value.label.token));

                            if (xindex === offsets.centerx && yindex === offsets.centery) {
                                anchorRanges.push(Helper.vscodeRange(c.value.label.token));
                            }

                            // if (
                            //     yindex + 1 === offsets.centery &&
                            //     xindex + 1 > offsets.centerx &&
                            //     xindex + 1 < offsets.centerx + offsets.side
                            // ) {
                            //     radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                            // } else if (
                            //     yindex + 1 === offsets.centery &&
                            //     xindex + 1 < offsets.centerx &&
                            //     xindex + 1 > offsets.centerx - offsets.side
                            // ) {
                            //     radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                            // } else if (
                            //     xindex + 1 === offsets.centerx &&
                            //     yindex + 1 > offsets.centery &&
                            //     yindex + 1 < offsets.centery + offsets.bot
                            // ) {
                            //     radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                            // } else if (
                            //     xindex + 1 === offsets.centerx &&
                            //     yindex + 1 < offsets.centery &&
                            //     yindex + 1 > offsets.centery - offsets.top
                            // ) {
                            //     radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                            // }

                            // if (
                            //     xindex > offsets.top &&
                            //     xindex < offsets.bot &&
                            //     yindex < offsets.centery + offsets.side &&
                            //     yindex > offsets.centery - offsets.side
                            // ) {
                            //     radiiRanges.push(Helper.vscodeRange(c.value.label.token));
                            // }
                            if (c.value.type.value === 'color' || c.value.type.value === 'filter') {
                                const color = x.colors.value[c.value.label.value].value.rgba.value;
                                if (!colorRanges[color]) {
                                    colorRanges[color] = [];
                                }
                                colorRanges[color].push(Helper.vscodeRange(c.value.type.token));
                            }
                        });
                    });
                    Object.keys(colorRanges).forEach((rgba) => {
                        if (!Decorator.colorDecorators[rgba]) {
                            Decorator.colorDecorators[rgba] = vscode.window.createTextEditorDecorationType({
                                light: {
                                    backgroundColor: rgba,
                                    color: luma(rgba) > 0.5 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
                                    // cursor: 'crosshair',
                                },
                                dark: {
                                    backgroundColor: rgba,
                                    color: luma(rgba) > 0.5 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)',
                                    // cursor: 'crosshair',
                                },
                            });
                        }

                        Helper.editor.setDecorations(Decorator.colorDecorators[rgba], colorRanges[rgba]);
                    });

                    if (Decorator.colorDecorators['ledgend'] !== undefined) {
                        Decorator.colorDecorators['ledgend'].dispose();
                    }

                    Decorator.colorDecorators['ledgend'] = vscode.window.createTextEditorDecorationType({
                        dark: {
                            after: {
                                contentText: ` (${x.data.value.matrix[0].value.length}, ${x.data.value.matrix.length})`,
                                fontWeight: 'bold',
                                color: 'rgba(5,6,255,0.4)',
                            },
                        },
                        light: {
                            after: {
                                contentText: ` (${x.data.value.matrix[0].value.length}, ${x.data.value.matrix.length})`,
                                fontWeight: 'bold',
                                color: 'rgba(5,6,255,0.4)',
                            },
                        },
                    });
                    Helper.editor.setDecorations(Decorator.colorDecorators['ledgend'], [
                        Helper.editor.document.lineAt(Helper.vscodeRange(x.data.token).start.line),
                    ]);
                }
            });

            [...parser.results.items].forEach((x) => {
                // Helper.editor.setDecorations(decUarrow, [upRange]);
                // Helper.editor.setDecorations(decDarrow, [downRange]);
            });

            // Helper.editor.setDecorations(decU, expanderRanges.U);
            // Helper.editor.setDecorations(decD, expanderRanges.D);
            // Helper.editor.setDecorations(decL, expanderRanges.L);
            // Helper.editor.setDecorations(decR, expanderRanges.R);
            Helper.editor.setDecorations(decSpace, allRanges);
            Helper.editor.setDecorations(anchorDec, anchorRanges);
            // Helper.editor.setDecorations(radiiDec, radiiRanges);

            // Helper.editor.setDecorations(fadedDec, fadedRanges);
        } catch (err) {
            console.error({ msg: 'ERROR in decorator', err: JSON.stringify(err) });
        }
    }
}
export default Decorator;
