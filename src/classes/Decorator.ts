/* eslint-disable prefer-const */
import * as vscode from 'vscode';

import { Compiler } from './Compiler';
import Helper from './Helper';
import Logger from './Logger';

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
        borderColor: 'green',
        borderWidth: '2px',
    },
    dark: {
        // this color will be used in dark color themes
        borderWidth: '2px',
        borderStyle: 'none none none solid',
        borderColor: 'red',
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

const getRadiiRanges = () => {};

function findOffsets(
    centerx: number,
    centery: number,
    data: NL.DotNugg.Data,
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
    Logger.out({ top, bot, side, centerx, centery });
    return { top, bot, side, centerx, centery };
}

class Decorator {
    public static colorDecorators: vscode.TextEditorDecorationType[] = [];

    public static addColorsToData(file: Compiler) {
        try {
            Helper.editor.setDecorations(decU, []);
            Helper.editor.setDecorations(decD, []);
            Helper.editor.setDecorations(decL, []);
            Helper.editor.setDecorations(decR, []);
            Helper.editor.setDecorations(anchorDec, []);
            Helper.editor.setDecorations(radiiDec, []);
            Helper.editor.setDecorations(fadedDec, []);

            Helper.editor.setDecorations(decUarrow, []);
            Helper.editor.setDecorations(decDarrow, []);
            // Helper.editor.setDecorations(decLarrow, []);
            // Helper.editor.setDecorations(decRarrow, []);
            Helper.editor.setDecorations(decSpace, []);

            Decorator.colorDecorators.forEach((x) => {
                Helper.editor.setDecorations(x, []);
            });

            let allRanges = [];
            let expanderRanges: NL.DotNugg.Dictionary<vscode.Range[]> = {
                D: [],
                U: [],
                R: [],
                L: [],
            };
            let radiiRanges: vscode.Range[] = [];

            let anchorRanges: vscode.Range[] = [];
            let fadedRanges: vscode.Range[] = [];

            const versionsWithColors: ({
                colors: NL.DotNugg.RangeOf<NL.DotNugg.Colors>;
                feature: NL.DotNugg.RangeOf<string>;
            } & NL.DotNugg.Version)[] = [];

            for (let i = 0; i < file.results.items.length; i++) {
                const attr = file.results.items[i].value;
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
                                allRanges.push(c.value.label.token.range);

                                const feature = file.results.collection.value.features.value[x.feature.value].value;
                                if (
                                    feature.expandableAt.value.r.value > 0 &&
                                    yindex + 1 === x.anchor.value.y.value &&
                                    xindex + 1 > x.anchor.value.x.value &&
                                    xindex + 1 < x.anchor.value.x.value + x.radii.value.r.value
                                ) {
                                    radiiRanges.push(c.value.label.token.range);
                                } else if (
                                    feature.expandableAt.value.l.value > 0 &&
                                    yindex + 1 === x.anchor.value.y.value &&
                                    xindex + 1 < x.anchor.value.x.value &&
                                    xindex + 1 > x.anchor.value.x.value - x.radii.value.l.value
                                ) {
                                    radiiRanges.push(c.value.label.token.range);
                                } else if (
                                    feature.expandableAt.value.d.value > 0 &&
                                    xindex + 1 === x.anchor.value.x.value &&
                                    yindex + 1 > x.anchor.value.y.value &&
                                    yindex + 1 < x.anchor.value.y.value + x.radii.value.d.value
                                ) {
                                    radiiRanges.push(c.value.label.token.range);
                                } else if (
                                    feature.expandableAt.value.u.value > 0 &&
                                    xindex + 1 === x.anchor.value.x.value &&
                                    yindex + 1 < x.anchor.value.y.value &&
                                    yindex + 1 > x.anchor.value.y.value - x.radii.value.u.value
                                ) {
                                    radiiRanges.push(c.value.label.token.range);
                                }

                                // if (
                                //     feature.expandableAt.value.r.value === 0 &&
                                //     feature.expandableAt.value.l.value === 0 &&
                                //     feature.expandableAt.value.d.value === 0 &&
                                //     feature.expandableAt.value.u.value === 0
                                // ) {
                                //     fadedRanges.push(x.radii.token.range);
                                //     fadedRanges.push(x.expanders.token.range);
                                // }

                                //   vscode.window.activeTextEditor
                                //       .edit((builder) => {
                                //           if (feature.expandableAt.value.r.value === 0 && x.radii.value.r.value !== 0) {
                                //               builder.replace(x.radii.value.r.token.range, '0');
                                //           }
                                //           if (feature.expandableAt.value.l.value === 0 && x.radii.value.l.value !== 0) {
                                //               builder.replace(x.radii.value.l.token.range, '0');
                                //           }
                                //           if (feature.expandableAt.value.d.value === 0 && x.radii.value.d.value !== 0) {
                                //               builder.replace(x.radii.value.d.token.range, '0');
                                //           }
                                //           if (feature.expandableAt.value.u.value === 0 && x.radii.value.u.value !== 0) {
                                //               builder.replace(x.radii.value.u.token.range, '0');
                                //           }
                                //           if (feature.expandableAt.value.r.value === 0 && x.expanders.value.r.value !== 0) {
                                //               builder.replace(x.expanders.value.r.token.range, '0');
                                //           }
                                //           if (feature.expandableAt.value.l.value === 0 && x.expanders.value.l.value !== 0) {
                                //               builder.replace(x.expanders.value.l.token.range, '0');
                                //           }
                                //           if (feature.expandableAt.value.d.value === 0 && x.expanders.value.d.value !== 0) {
                                //               builder.replace(x.expanders.value.d.token.range, '0');
                                //           }
                                //           if (feature.expandableAt.value.u.value === 0 && x.expanders.value.u.value !== 0) {
                                //               builder.replace(x.expanders.value.u.token.range, '0');
                                //           }
                                //       })
                                //       .then();

                                if (feature.expandableAt.value.r.value === 0) {
                                    // fadedRanges.push(x.radii.value.r.token.range);
                                    fadedRanges.push(x.expanders.value.r.token.range);
                                }
                                if (feature.expandableAt.value.l.value === 0) {
                                    // fadedRanges.push(x.radii.value.l.token.range);
                                    fadedRanges.push(x.expanders.value.l.token.range);
                                }
                                if (feature.expandableAt.value.d.value === 0) {
                                    // fadedRanges.push(x.radii.value.d.token.range);
                                    fadedRanges.push(x.expanders.value.d.token.range);
                                }
                                if (feature.expandableAt.value.u.value === 0) {
                                    // fadedRanges.push(x.radii.value.u.token.range);
                                    fadedRanges.push(x.expanders.value.u.token.range);
                                }

                                if (x.anchor.value.x.value === xindex + 1 && x.anchor.value.y.value === yindex + 1) {
                                    // if (cindex === r.value.length - 1) {
                                    //     downRange = c.value.label.token.range;
                                    // }
                                    anchorRanges.push(c.value.label.token.range);
                                }
                                if (x.expanders.value.d.value === yindex + 1) {
                                    // if (cindex === r.value.length - 1) {
                                    //     downRange = c.value.label.token.range;
                                    // }
                                    expanderRanges.D.push(c.value.label.token.range);
                                }
                                if (x.expanders.value.u.value === yindex + 1) {
                                    // if (cindex === r.value.length - 1) {
                                    //     upRange = c.value.label.token.range;
                                    // }
                                    expanderRanges.U.push(c.value.label.token.range);
                                }
                                if (x.expanders.value.r.value === xindex + 1) {
                                    if (yindex === 0) {
                                        // rightRange = c.label.token.range;
                                    }
                                    expanderRanges.R.push(c.value.label.token.range);
                                }
                                if (x.expanders.value.l.value === xindex + 1) {
                                    if (yindex === x.data.value.matrix.length - 1) {
                                        // leftRange = c.label.token.range;
                                    }
                                    expanderRanges.L.push(c.value.label.token.range);
                                }

                                if (c.value.type.value === 'color' || c.value.type.value === 'filter') {
                                    const color = x.colors.value[c.value.label.value].value.rgba.value;
                                    if (!colorRanges[color]) {
                                        colorRanges[color] = [];
                                    }
                                    colorRanges[color].push(c.value.type.token.range);
                                }
                            } catch (err) {
                                Logger.out(err);
                            }
                        });
                    });
                    Object.keys(colorRanges).forEach((rgba) => {
                        const dec = vscode.window.createTextEditorDecorationType({
                            light: {
                                backgroundColor: rgba,
                            },
                            dark: {
                                backgroundColor: rgba,
                            },
                        });
                        Decorator.colorDecorators.push(dec);
                        Helper.editor.setDecorations(dec, colorRanges[rgba]);
                    });

                    const dec = vscode.window.createTextEditorDecorationType({
                        dark: {
                            after: {
                                contentText: ` (${x.data.value.matrix[0].value.length}, ${x.data.value.matrix.length})`,
                                fontStyle: 'bold',
                                color: 'rgba(5,6,255,0.4)',
                            },
                        },
                        light: {
                            after: {
                                contentText: ` (${x.data.value.matrix[0].value.length}, ${x.data.value.matrix.length})`,
                                fontStyle: 'bold',
                                color: 'rgba(5,6,255,0.4)',
                            },
                        },
                    });
                    Decorator.colorDecorators.push(dec);
                    Helper.editor.setDecorations(dec, [file.document.lineAt(x.data.token.range.start.line)]);

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
                            allRanges.push(c.value.label.token.range);

                            if (xindex === offsets.centerx && yindex === offsets.centery) {
                                anchorRanges.push(c.value.label.token.range);
                            }

                            if (
                                yindex + 1 === offsets.centery &&
                                xindex + 1 > offsets.centerx &&
                                xindex + 1 < offsets.centerx + offsets.side
                            ) {
                                radiiRanges.push(c.value.label.token.range);
                            } else if (
                                yindex + 1 === offsets.centery &&
                                xindex + 1 < offsets.centerx &&
                                xindex + 1 > offsets.centerx - offsets.side
                            ) {
                                radiiRanges.push(c.value.label.token.range);
                            } else if (
                                xindex + 1 === offsets.centerx &&
                                yindex + 1 > offsets.centery &&
                                yindex + 1 < offsets.centery + offsets.bot
                            ) {
                                radiiRanges.push(c.value.label.token.range);
                            } else if (
                                xindex + 1 === offsets.centerx &&
                                yindex + 1 < offsets.centery &&
                                yindex + 1 > offsets.centery - offsets.top
                            ) {
                                radiiRanges.push(c.value.label.token.range);
                            }

                            if (
                                xindex > offsets.top &&
                                xindex < offsets.bot &&
                                yindex < offsets.centery + offsets.side &&
                                yindex > offsets.centery - offsets.side
                            ) {
                                radiiRanges.push(c.value.label.token.range);
                            }
                            if (c.value.type.value === 'color' || c.value.type.value === 'filter') {
                                const color = x.colors.value[c.value.label.value].value.rgba.value;
                                if (!colorRanges[color]) {
                                    colorRanges[color] = [];
                                }
                                colorRanges[color].push(c.value.type.token.range);
                            }
                        });
                    });
                    Object.keys(colorRanges).forEach((rgba) => {
                        const dec = vscode.window.createTextEditorDecorationType({
                            light: {
                                backgroundColor: rgba,
                            },
                            dark: {
                                backgroundColor: rgba,
                            },
                        });
                        Decorator.colorDecorators.push(dec);
                        Helper.editor.setDecorations(dec, colorRanges[rgba]);
                    });

                    const dec = vscode.window.createTextEditorDecorationType({
                        dark: {
                            after: {
                                contentText: ` (${x.data.value.matrix[0].value.length}, ${x.data.value.matrix.length})`,
                                fontStyle: 'bold',
                                color: 'rgba(5,6,255,0.4)',
                            },
                        },
                        light: {
                            after: {
                                contentText: ` (${x.data.value.matrix[0].value.length}, ${x.data.value.matrix.length})`,
                                fontStyle: 'bold',
                                color: 'rgba(5,6,255,0.4)',
                            },
                        },
                    });
                    Decorator.colorDecorators.push(dec);
                    Helper.editor.setDecorations(dec, [file.document.lineAt(x.data.token.range.start.line)]);
                }
            });

            [...file.results.items].forEach((x) => {
                // Helper.editor.setDecorations(decUarrow, [upRange]);
                // Helper.editor.setDecorations(decDarrow, [downRange]);
            });

            Helper.editor.setDecorations(decU, expanderRanges.U);
            Helper.editor.setDecorations(decD, expanderRanges.D);
            Helper.editor.setDecorations(decL, expanderRanges.L);
            Helper.editor.setDecorations(decR, expanderRanges.R);
            Helper.editor.setDecorations(decSpace, allRanges);
            Helper.editor.setDecorations(anchorDec, anchorRanges);
            Helper.editor.setDecorations(radiiDec, radiiRanges);

            Helper.editor.setDecorations(fadedDec, fadedRanges);
        } catch (err) {
            Logger.out({ msg: 'ERROR', err: JSON.stringify(err) });
        }
    }
}
export default Decorator;
