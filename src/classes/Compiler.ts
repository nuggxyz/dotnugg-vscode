/* eslint-disable prefer-const */
import * as vscode from 'vscode';
import * as vsctm from 'vscode-textmate';

import tokens from '../constants/tokens';

import Logger from './Logger';
import { Parser } from './Parser';
import { Validator } from './Validator';

function iterate(obj) {
    for (let key in obj) {
        // may have to do some checking to ignore any keys you don't care about
        // // if value is an object, will use this same function to push to whitelist array
        // if (typeof obj[key] === 'object') {
        //     if (key === 'token') {
        //         return {};
        //     } else if (key === 'value') {
        //         return iterate(obj[key]);
        //     } else {
        //         return { ...obj, ...iterate(obj[key]) };
        //     }
        // } else {
        //     return obj[key];
        // }
    }
}

export class Compiler {
    public tokens: NL.DotNugg.ParsedToken[] = [];

    private index: number = 0;

    public document: vscode.TextDocument;

    public linescopes: { [_: number]: string[] } = {};

    public results: NL.DotNugg.Document = {
        collection: undefined,
        bases: [],
        attributes: [],
    };

    private get next() {
        if (this.hasNext) {
            this.index++;
            return true;
        }
        return false;
    }

    private back() {
        this.index--;
    }

    public get json() {
        return JSON.stringify(
            this.results,
            function (key, value) {
                if (this[key].value !== undefined) {
                    return this[key].value;
                } else {
                    return value;
                }
            },
            4,
        );
    }

    private get hasNext() {
        if (this.index + 1 < this.tokens.length) {
            return true;
        }
        return false;
    }

    private get current() {
        return this.tokens[this.index];
    }

    private static range(line: vscode.TextLine, token: import('vscode-textmate').IToken) {
        return new vscode.Range(
            new vscode.Position(line.lineNumber, token.startIndex),
            new vscode.Position(line.lineNumber, token.endIndex),
        );
    }

    private get currentValue() {
        return this.current.line.text.slice(this.current.token.startIndex, this.current.token.endIndex);
    }

    private has(str: string) {
        return Compiler.tokenHas(this.current.token, str);
    }

    public static tokenHas(token: vsctm.IToken, str: string) {
        return token.scopes.indexOf(str) > -1;
    }

    public static tokenSelect(scopes: string[], strs: string[]) {
        return strs.reduce((prev, curr) => {
            if (prev || scopes.indexOf(curr) > -1) {
                return true;
            }
        }, false);
    }

    private constructor(file: vscode.TextDocument) {
        this.document = file;
    }

    public static init(document: vscode.TextDocument) {
        const instance = new Compiler(document);

        const tokens: NL.DotNugg.ParsedToken[] = [];

        for (let i = 0; i < instance.document.lineCount; i++) {
            let p = Parser.grammer.tokenizeLine(instance.document.lineAt(i).text, vsctm.INITIAL);

            while (p.ruleStack.depth > 1) {
                p.tokens.forEach((x) => {
                    if (instance.linescopes[i] === undefined) {
                        instance.linescopes[i] = [...x.scopes];
                    } else {
                        instance.linescopes[i].push(...x.scopes);
                    }

                    tokens.push({
                        token: x,
                        ruleStack: p.ruleStack,
                        line: instance.document.lineAt(i),
                        range: Compiler.range(instance.document.lineAt(i), x),
                    });
                });

                p = Parser.grammer.tokenizeLine(instance.document.lineAt(++i).text, p.ruleStack);
            }
            p.tokens.forEach((x) => {
                if (instance.linescopes[i] === undefined) {
                    instance.linescopes[i] = [...x.scopes];
                } else {
                    instance.linescopes[i].push(...x.scopes);
                }

                tokens.push({
                    token: x,
                    ruleStack: p.ruleStack,
                    line: instance.document.lineAt(i),
                    range: Compiler.range(instance.document.lineAt(i), x),
                });
            });
        }

        instance.tokens = tokens;

        return instance;
    }

    compile() {
        try {
            for (; this.hasNext; this.next) {
                this.compileCollection();
                this.compileBase();
                this.compileAttribute();

                // this.compileColorGroup();
                // this.compileExpanderGroup();
                // this.compileGeneralData();
            }
        } catch (err) {
            Logger.out('ERROR', 'failed compilattion', { err });
        }
    }

    compileCollection() {
        if (this.has(tokens.Collection)) {
            let features: NL.DotNugg.RangeOf<NL.DotNugg.CollectionFeatures> = undefined;
            let colors: NL.DotNugg.RangeOf<NL.DotNugg.Colors> = undefined;

            const token = this.current;
            let endToken = undefined;

            for (; this.has(tokens.Collection) && this.hasNext; this.next) {
                const collectionFeatures = this.compileCollectionFeatures();
                if (collectionFeatures) {
                    features = collectionFeatures;
                }
                // Logger.out(this.current.token.scopes);
                const generalColors = this.compileGeneralColors();
                if (generalColors) {
                    colors = generalColors;
                }
                if (this.has(tokens.CollectionClose)) {
                    endToken = this.current;
                }
            }
            const validator = new Validator({ token, endToken, features, colors });
            if (validator.complete) {
                this.results.collection = { value: { features, colors }, token, endToken };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileCollection', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileCollection');
            }
        }
    }

    compileCollectionFeatures() {
        if (this.has(tokens.CollectionFeatures)) {
            const token = this.current;
            let endToken = undefined;

            const collectionFeatures: NL.DotNugg.RangeOf<NL.DotNugg.CollectionFeature>[] = [];

            for (; this.has(tokens.CollectionFeatures) && Validator.anyUndefined({ token, endToken, collectionFeatures }); this.next) {
                const collectionfeature = this.compileCollectionFeature();
                if (collectionfeature) {
                    collectionFeatures.push(collectionfeature);
                }
                if (this.has(tokens.CollectionFeaturesClose)) {
                    endToken = this.current;
                    break;
                }
            }

            const validator = new Validator({ token, endToken, collectionFeatures });

            if (validator.complete) {
                const value: NL.DotNugg.CollectionFeatures = collectionFeatures.reduce((prev, curr) => {
                    return { [curr.value.name.value]: curr, ...prev };
                }, {});

                return {
                    token,
                    value,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileCollectionFeatures', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileCollectionFeatures');
            }
        }
        return undefined;
    }

    compileCollectionFeature() {
        if (this.has(tokens.CollectionFeature)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: NL.DotNugg.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: NL.DotNugg.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: NL.DotNugg.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: NL.DotNugg.ParsedToken = undefined;
            let radiiToken: NL.DotNugg.ParsedToken = undefined;

            let anchorKey: number = undefined;
            let anchorDirection: NL.DotNugg.Operator = undefined;
            let anchorOffset: number = undefined;
            let anchorToken: NL.DotNugg.ParsedToken = undefined;
            let levelDirection: NL.DotNugg.Operator = undefined;
            let levelOffset: number = undefined;
            let levelToken: NL.DotNugg.ParsedToken = undefined;
            let name: string = undefined;
            let nameToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.CollectionFeature) &&
                Validator.anyUndefined({
                    token,
                    anchorKey,
                    anchorDirection,
                    anchorOffset,
                    anchorToken,
                    levelDirection,
                    levelOffset,
                    levelToken,
                    name,
                    nameToken,
                    endToken,
                    r,
                    rToken,
                    l,
                    lToken,
                    d,
                    dToken,
                    u,
                    uToken,
                });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.CollectionFeatureDetailsLevelOffset)) {
                    levelOffset = this.currentValue.toLowerCase() === 'd' ? 100 : +this.currentValue;
                }
                if (this.has(tokens.CollectionFeatureDetailsLevelDirection)) {
                    levelDirection = this.currentValue as NL.DotNugg.Operator;
                }
                if (this.has(tokens.CollectionFeatureDetailsLevel)) {
                    levelToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsAnchor)) {
                    anchorToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsAnchorKey)) {
                    anchorKey = +this.currentValue;
                }
                if (this.has(tokens.CollectionFeatureDetailsAnchorDirection)) {
                    anchorDirection = this.currentValue as NL.DotNugg.Operator;
                }
                if (this.has(tokens.CollectionFeatureDetailsAnchorOffset)) {
                    anchorOffset = this.currentValue.toLowerCase() === 'd' ? 100 : +this.currentValue;
                }
                if (this.has(tokens.CollectionFeatureDetailsRadiiDetails)) {
                    radiiToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsRadiiDetailsR)) {
                    r = +this.currentValue;
                    rToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsRadiiDetailsL)) {
                    l = +this.currentValue;
                    lToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsRadiiDetailsU)) {
                    u = +this.currentValue;
                    uToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsRadiiDetailsD)) {
                    d = +this.currentValue;
                    dToken = this.current;
                }
                if (this.has(tokens.CollectionFeatureDetailsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({
                token,
                anchorKey,
                anchorDirection,
                anchorOffset,
                anchorToken,
                levelDirection,
                levelOffset,
                levelToken,
                name,
                nameToken,
                endToken,
                r,
                rToken,
                l,
                lToken,
                d,
                dToken,
                u,
                uToken,
                radiiToken,
            });

            if (validator.complete) {
                const value: NL.DotNugg.CollectionFeature = {
                    level: {
                        token: levelToken,
                        value: {
                            direction: levelDirection,
                            offset: levelOffset,
                        },
                    },
                    name: {
                        token: nameToken,
                        value: name,
                    },
                    anchor: {
                        token: anchorToken,
                        value: {
                            key: anchorKey,
                            direction: anchorDirection,
                            offset: anchorOffset,
                        },
                    },
                    validRadii: {
                        token: radiiToken,
                        value: {
                            r: {
                                value: r,
                                token: rToken,
                            },
                            l: {
                                value: l,
                                token: lToken,
                            },
                            u: {
                                value: u,
                                token: uToken,
                            },
                            d: {
                                value: d,
                                token: dToken,
                            },
                        },
                    },
                };

                return {
                    value,
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileCollectionFeature', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileCollectionFeature');
            }
        }
        return undefined;
    }

    compileGeneralColors() {
        if (this.has(tokens.GeneralColors)) {
            const token = this.current;
            let endToken = undefined;

            const colors: NL.DotNugg.RangeOf<NL.DotNugg.Color>[] = [];

            for (; this.has(tokens.GeneralColors) && Validator.anyUndefined({ token, endToken, colors }); this.next) {
                const color = this.compileGeneralColor();
                if (color) {
                    colors.push(color);
                }
                if (this.has(tokens.GeneralColorsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, endToken, colors });

            if (validator.complete) {
                const value: NL.DotNugg.Colors = colors.reduce((prev, curr) => {
                    return { [curr.value.name.value]: curr, ...prev };
                }, {});
                return {
                    token,
                    value,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from compileGeneralColors:', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralColors');
            }
        }
        return undefined;
    }

    compileGeneralColor() {
        if (this.has(tokens.GeneralColor)) {
            const token = this.current;
            let endToken = undefined;

            let rgba: NL.DotNugg.RGBA = undefined;
            let rgbaToken: NL.DotNugg.ParsedToken = undefined;
            let levelDirection: NL.DotNugg.Operator = undefined;
            let levelOffset: number = undefined;
            let levelToken: NL.DotNugg.ParsedToken = undefined;
            let name: string = undefined;
            let nameToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.GeneralColor) &&
                Validator.anyUndefined({ token, rgba, rgbaToken, levelDirection, levelOffset, levelToken, name, nameToken, endToken });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.GeneralColorDetailsLevelOffset)) {
                    levelOffset = this.currentValue.toLowerCase() === 'd' ? 100 : +this.currentValue;
                }
                if (this.has(tokens.GeneralColorDetailsLevelDirection)) {
                    levelDirection = this.currentValue as NL.DotNugg.Operator;
                }
                if (this.has(tokens.GeneralColorDetailsLevel)) {
                    levelToken = this.current;
                }
                if (this.has(tokens.GeneralColorName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                if (this.has(tokens.GeneralColorDetailsRgba)) {
                    rgba = this.currentValue as NL.DotNugg.RGBA;
                    rgbaToken = this.current;
                }
                if (this.has(tokens.GeneralColorDetailsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, rgba, rgbaToken, levelDirection, levelOffset, levelToken, name, nameToken, endToken });

            if (validator.complete) {
                const value: NL.DotNugg.Color = {
                    level: {
                        token: levelToken,
                        value: {
                            direction: levelDirection,
                            offset: levelOffset,
                        },
                    },
                    name: {
                        token: nameToken,
                        value: name,
                    },
                    rgba: {
                        value: rgba,
                        token: rgbaToken,
                    },
                };
                return {
                    value,
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileGeneralColor', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralColor');
            }
        }
        return undefined;
    }

    compileGeneralFilters() {
        if (this.has(tokens.GeneralFilters)) {
            const token = this.current;
            let endToken = undefined;

            const filters: NL.DotNugg.RangeOf<NL.DotNugg.Filter>[] = [];

            for (; this.has(tokens.GeneralFilters) && Validator.anyUndefined({ token, endToken, filters }); this.next) {
                const filter = this.compileGeneralFilter();
                if (filter) {
                    filters.push(filter);
                }
                if (this.has(tokens.GeneralFiltersClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, endToken, filters });

            if (validator.complete) {
                const value: NL.DotNugg.Filters = filters.reduce((prev, curr) => {
                    return { [curr.value.name.value]: curr, ...prev };
                }, {});
                return {
                    token,
                    value,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from compileGeneralFilters:', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralFilters');
            }
        }
        return undefined;
    }

    compileGeneralFilter() {
        if (this.has(tokens.GeneralFilter)) {
            const token = this.current;
            let endToken = undefined;

            let arg: number = undefined;
            let argToken: NL.DotNugg.ParsedToken = undefined;
            let type: number = undefined;
            let typeToken: NL.DotNugg.ParsedToken = undefined;
            let levelDirection: NL.DotNugg.Operator = undefined;
            let levelOffset: number = undefined;
            let levelToken: NL.DotNugg.ParsedToken = undefined;
            let name: string = undefined;
            let nameToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.GeneralFilter) &&
                Validator.anyUndefined({
                    token,
                    arg,
                    argToken,
                    type,
                    typeToken,
                    levelDirection,
                    levelOffset,
                    levelToken,
                    name,
                    nameToken,
                    endToken,
                });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.GeneralFilterDetailsLevelOffset)) {
                    levelOffset = this.currentValue.toLowerCase() === 'd' ? 100 : +this.currentValue;
                }
                if (this.has(tokens.GeneralFilterDetailsLevelDirection)) {
                    levelDirection = this.currentValue as NL.DotNugg.Operator;
                }
                if (this.has(tokens.GeneralFilterDetailsLevel)) {
                    levelToken = this.current;
                }
                if (this.has(tokens.GeneralFilterName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                if (this.has(tokens.GeneralFilterDetailsType)) {
                    arg = +this.currentValue;
                    argToken = this.current;
                }
                if (this.has(tokens.GeneralFilterDetailsArg)) {
                    type = +this.currentValue;
                    typeToken = this.current;
                }
                if (this.has(tokens.GeneralFilterDetailsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({
                token,
                arg,
                argToken,
                type,
                typeToken,
                levelDirection,
                levelOffset,
                levelToken,
                name,
                nameToken,
                endToken,
            });

            if (validator.complete) {
                const value: NL.DotNugg.Filter = {
                    level: {
                        token: levelToken,
                        value: {
                            direction: levelDirection,
                            offset: levelOffset,
                        },
                    },
                    name: {
                        token: nameToken,
                        value: name,
                    },
                    arg: {
                        value: arg,
                        token: argToken,
                    },
                    type: {
                        value: type,
                        token: typeToken,
                    },
                };
                return {
                    value,
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileGeneralFilter', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralFilter');
            }
        }
        return undefined;
    }

    compileBase() {
        if (this.has(tokens.Base)) {
            let filters: NL.DotNugg.RangeOf<NL.DotNugg.Filters> = undefined;
            let colors: NL.DotNugg.RangeOf<NL.DotNugg.Colors> = undefined;
            let data: NL.DotNugg.RangeOf<NL.DotNugg.Data> = undefined;

            const token = this.current;
            let endToken = undefined;

            for (; this.has(tokens.Base) && this.hasNext && Validator.anyUndefined({ token, endToken, filters, colors, data }); this.next) {
                const generalFilters = this.compileGeneralFilters();
                if (generalFilters) {
                    filters = generalFilters;
                }
                // Logger.out(this.current.token.scopes);
                const generalColors = this.compileGeneralColors();
                if (generalColors) {
                    colors = generalColors;
                }
                const generalData = this.compileGeneralData();
                if (generalData) {
                    data = generalData;
                }
                if (this.has(tokens.BaseClose)) {
                    endToken = this.current;
                }
            }
            const validator = new Validator({ token, endToken, filters, colors, data });
            if (validator.complete) {
                this.results.bases.push({ value: { filters, colors, data }, token, endToken });
            } else {
                Logger.out('ERROR', 'blank value returned from: compileBase', validator.undefinedVarNames);

                throw new Error('blank value returned from: compileBase');
            }
        }
        return undefined;
    }

    compileGeneralData(): NL.DotNugg.RangeOf<NL.DotNugg.Data> {
        if (this.has(tokens.GeneralData)) {
            let matrix: NL.DotNugg.RangeOf<NL.DotNugg.DataRow>[] = [];
            let token = undefined;
            let endToken = undefined;

            for (; this.has(tokens.GeneralData) && Validator.anyUndefined({ token, matrix, endToken }); this.next) {
                if (!token) {
                    this.back();
                    token = this.current;
                    continue;
                }
                const row = this.compileGeneralDataRow();
                if (row) {
                    matrix.push(row);
                }
                if (this.has(tokens.GeneralDataClose)) {
                    endToken = this.current;
                }
            }
            const validator = new Validator({ token, matrix, endToken });
            if (validator.complete) {
                return {
                    value: {
                        matrix,
                    },
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileGeneralData', validator.undefinedVarNames);

                throw new Error('blank value returned from: compileGeneralData');
            }
        }
        return undefined;
    }

    compileGeneralDataRow(): NL.DotNugg.RangeOf<NL.DotNugg.DataRow> {
        if (this.has(tokens.GeneralDataRow)) {
            const token = this.current;
            let pixels: NL.DotNugg.RangeOf<NL.DotNugg.Pixel>[] = [];
            let lastLine = this.current.line.lineNumber;
            let endToken = undefined;

            for (; this.has(tokens.GeneralDataRow); this.next) {
                if (lastLine !== this.current.line.lineNumber) {
                    this.back();
                    break;
                }
                const pixel = this.compileGeneralDataPixel();

                if (pixel) {
                    pixels.push(pixel);
                    this.back();
                }
                endToken = this.current;
            }
            const validator = new Validator({ token, pixels, endToken });
            if (validator.complete) {
                return {
                    value: pixels,
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compilePixel', validator.undefinedVarNames);

                throw new Error('blank value returned from: compilePixel');
            }
        }
        return undefined;
    }

    compileGeneralDataPixel() {
        if (this.has(tokens.GeneralDataRowPixel)) {
            const token = this.current;
            let endToken = this.current;

            let label: string = undefined;
            let labelToken: NL.DotNugg.ParsedToken = undefined;
            let type: NL.DotNugg.PixelType = undefined;
            let typeToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.GeneralDataRowPixel) && Validator.anyUndefined({ token, labelToken, type, typeToken, label, endToken });
                this.next
            ) {
                if (this.currentValue !== '') {
                    if (this.has(tokens.GeneralDataRowPixelTransparent)) {
                        type = 'transparent';
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                    if (this.has(tokens.GeneralDataRowPixelFilter)) {
                        type = 'filter';
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                    if (this.has(tokens.GeneralDataRowPixelColor)) {
                        type = 'color';
                        typeToken = this.current;
                        labelToken = this.current;
                        label = this.currentValue;
                    }
                }
            }

            const validator = new Validator({ token, labelToken, type, typeToken, endToken, label });
            if (validator.complete) {
                return {
                    value: {
                        label: {
                            value: label,
                            token: labelToken,
                        },
                        type: {
                            value: type,
                            token: typeToken,
                        },
                    },
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compilePixel', validator.undefinedVarNames);

                throw new Error('blank value returned from: compilePixel');
            }
        }
        return undefined;
    }

    compileAttribute() {
        if (this.has(tokens.Attribute)) {
            const token = this.current;
            let endToken = undefined;
            let feature: string = undefined;
            let isDefault: boolean = undefined;

            let featureToken: NL.DotNugg.ParsedToken = undefined;
            let colors = undefined;
            let versions = undefined;

            for (
                ;
                this.has(tokens.Attribute) &&
                this.hasNext &&
                Validator.anyUndefined({ token, endToken, feature, featureToken, colors, versions });
                this.next
            ) {
                if (this.has(tokens.AttributeOpenFeature)) {
                    feature = this.currentValue;
                    featureToken = this.current;
                }
                if (this.has(tokens.AttributeOpenDefaultOrAttribute)) {
                    isDefault = this.currentValue === 'default';
                }
                const colors_ = this.compileGeneralColors();
                if (colors_) {
                    colors = colors_;
                }
                const versions_ = this.compileAttributeVersions();
                if (versions_) {
                    versions = versions_;
                }
                if (this.has(tokens.AttributeClose)) {
                    endToken = this.current;
                }
            }
            // this.results.attributes.push({ value, token, endToken });
            const validator = new Validator({ token, endToken, feature, featureToken, colors, versions, isDefault });
            if (validator.complete) {
                this.results.attributes.push({
                    value: {
                        isDefault,
                        colors,
                        versions,
                        feature: {
                            value: feature,
                            token: featureToken,
                        },
                    },
                    token,
                    endToken,
                });
            } else {
                Logger.out('ERROR', 'blank value returned from: compileAttribute', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileAttribute');
            }
        }
        return undefined;
    }

    compileAttributeVersions() {
        if (this.has(tokens.AttributeVersions)) {
            const token = this.current;
            let endToken = undefined;

            const versions: NL.DotNugg.RangeOf<NL.DotNugg.Version>[] = [];

            for (; this.has(tokens.AttributeVersions) && Validator.anyUndefined({ token, endToken, versions }); this.next) {
                const version = this.compileAttributeVersion();
                if (version) {
                    versions.push(version);
                }
                if (this.has(tokens.AttributeVersionsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, endToken, versions });

            if (validator.complete) {
                const value: NL.DotNugg.Colors = versions.reduce((prev, curr) => {
                    return { [curr.value.name.value]: curr, ...prev };
                }, {});
                return {
                    token,
                    value,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from compileGeneralColors:', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileGeneralColors');
            }
        }
        return undefined;
    }

    compileAttributeVersion() {
        if (this.has(tokens.AttributeVersion)) {
            let data: NL.DotNugg.RangeOf<NL.DotNugg.Data> = undefined;
            let radii: NL.DotNugg.RangeOf<NL.DotNugg.RLUD<number>> = undefined;
            let expanders: NL.DotNugg.RangeOf<NL.DotNugg.RLUD<number>> = undefined;
            let anchor: NL.DotNugg.RangeOf<NL.DotNugg.Coordinate> = undefined;
            let name: string = undefined;
            let nameToken: NL.DotNugg.ParsedToken = undefined;
            const token = this.current;
            let endToken = undefined;

            for (
                ;
                this.has(tokens.AttributeVersion) &&
                Validator.anyUndefined({ token, endToken, radii, expanders, data, anchor, name, nameToken });
                this.next
            ) {
                if (this.has(tokens.AttributeVersionName)) {
                    name = this.currentValue;
                    nameToken = this.current;
                }
                const radii_ = this.compileAttributeVersionRadii();
                if (radii_) {
                    radii = radii_;
                }
                // Logger.out(this.current.token.scopes);
                const expanders_ = this.compileAttributeVersionExpanders();
                if (expanders_) {
                    expanders = expanders_;
                }

                const anchor_ = this.compileAttributeVersionAnchor();
                if (anchor_) {
                    anchor = anchor_;
                }
                const generalData = this.compileGeneralData();
                if (generalData) {
                    data = generalData;
                }
                if (this.has(tokens.AttributeVersionClose)) {
                    endToken = this.current;
                }
            }
            const validator = new Validator({ token, endToken, radii, expanders, data, anchor, name, nameToken });
            if (validator.complete) {
                return { value: { radii, expanders, data, anchor, name: { value: name, token: nameToken } }, token, endToken };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileAttributeVersion', validator.undefinedVarNames);

                throw new Error('blank value returned from: compileAttributeVersion');
            }
        }
    }

    compileAttributeVersionRadii() {
        if (this.has(tokens.AttributeVersionRadii)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: NL.DotNugg.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: NL.DotNugg.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: NL.DotNugg.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.AttributeVersionRadii) &&
                Validator.anyUndefined({ token, r, rToken, l, lToken, d, dToken, u, uToken, endToken });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.AttributeVersionRadiiDetailsR)) {
                    r = +this.currentValue;
                    rToken = this.current;
                }
                if (this.has(tokens.AttributeVersionRadiiDetailsL)) {
                    l = +this.currentValue;
                    lToken = this.current;
                }
                if (this.has(tokens.AttributeVersionRadiiDetailsU)) {
                    u = +this.currentValue;
                    uToken = this.current;
                }
                if (this.has(tokens.AttributeVersionRadiiDetailsD)) {
                    d = +this.currentValue;
                    dToken = this.current;
                }
                if (this.has(tokens.AttributeVersionRadiiDetailsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, r, rToken, l, lToken, d, dToken, u, uToken, endToken });

            if (validator.complete) {
                const value: NL.DotNugg.RLUD<number> = {
                    r: {
                        value: r,
                        token: rToken,
                    },
                    l: {
                        value: l,
                        token: lToken,
                    },
                    u: {
                        value: u,
                        token: uToken,
                    },
                    d: {
                        value: d,
                        token: dToken,
                    },
                };
                return {
                    value,
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileAttributeVersionRadii', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileAttributeVersionRadii');
            }
        }
        return undefined;
    }

    compileAttributeVersionExpanders() {
        if (this.has(tokens.AttributeVersionExpanders)) {
            const token = this.current;
            let endToken = undefined;

            let r: number = undefined;
            let rToken: NL.DotNugg.ParsedToken = undefined;
            let l: number = undefined;
            let lToken: NL.DotNugg.ParsedToken = undefined;
            let u: number = undefined;
            let uToken: NL.DotNugg.ParsedToken = undefined;
            let d: number = undefined;
            let dToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.AttributeVersionExpanders) &&
                Validator.anyUndefined({ token, r, rToken, l, lToken, d, dToken, u, uToken, endToken });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.AttributeVersionExpandersDetailsR)) {
                    r = +this.currentValue;
                    rToken = this.current;
                }
                if (this.has(tokens.AttributeVersionExpandersDetailsL)) {
                    l = +this.currentValue;
                    lToken = this.current;
                }
                if (this.has(tokens.AttributeVersionExpandersDetailsU)) {
                    u = +this.currentValue;
                    uToken = this.current;
                }
                if (this.has(tokens.AttributeVersionExpandersDetailsD)) {
                    d = +this.currentValue;
                    dToken = this.current;
                }
                if (this.has(tokens.AttributeVersionExpandersDetailsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, r, rToken, l, lToken, d, dToken, u, uToken, endToken });

            if (validator.complete) {
                const value: NL.DotNugg.RLUD<number> = {
                    r: {
                        value: r,
                        token: rToken,
                    },
                    l: {
                        value: l,
                        token: lToken,
                    },
                    u: {
                        value: u,
                        token: uToken,
                    },
                    d: {
                        value: d,
                        token: dToken,
                    },
                };
                return {
                    value,
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileAttributeVersionExpanders', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileAttributeVersionExpanders');
            }
        }
        return undefined;
    }
    compileAttributeVersionAnchor() {
        if (this.has(tokens.AttributeVersionAnchor)) {
            const token = this.current;
            let endToken = undefined;

            let x: number = undefined;
            let xToken: NL.DotNugg.ParsedToken = undefined;
            let y: number = undefined;
            let yToken: NL.DotNugg.ParsedToken = undefined;

            for (
                ;
                this.has(tokens.AttributeVersionAnchor) && Validator.anyUndefined({ token, x, xToken, y, yToken, endToken });
                this.next
            ) {
                if (this.currentValue === '') {
                    continue;
                }
                if (this.has(tokens.AttributeVersionAnchorDetailsX)) {
                    x = +this.currentValue;
                    xToken = this.current;
                }
                if (this.has(tokens.AttributeVersionAnchorDetailsY)) {
                    y = +this.currentValue;
                    yToken = this.current;
                }
                if (this.has(tokens.AttributeVersionAnchorDetailsClose)) {
                    endToken = this.current;
                }
            }

            let validator = new Validator({ token, x, xToken, y, yToken, endToken });

            if (validator.complete) {
                const value: NL.DotNugg.Coordinate = {
                    x: {
                        value: x,
                        token: xToken,
                    },
                    y: {
                        value: y,
                        token: yToken,
                    },
                };
                return {
                    value,
                    token,
                    endToken,
                };
            } else {
                Logger.out('ERROR', 'blank value returned from: compileAttributeVersionAnchor', validator.undefinedVarNames);
                throw new Error('blank value returned from: compileAttributeVersionAnchor');
            }
        }
        return undefined;
    }
}
