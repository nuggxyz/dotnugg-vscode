import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { dotnugg } from '@nuggxyz/dotnugg-sdk';
import { ParsedToken } from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';

import { Config } from './Config';

type LinterRule = {
    has: string[];
    not: string[];
    message: string;
};

const rules: LinterRule[] = [];

// function tokenHasScope(token: ParserTypes.ParsedToken, scope: string): boolean {
//     return token.token.scopes.includes(scope);
// }

// function lineHasText(parser: parser, token: ParserTypes.ParsedToken, scope: string): boolean {
//     return token.token.scopes.includes(scope);
// }

export class Linter {
    private static innerRangeOf(start: ParserTypes.RangeOf<any>): Range {
        const res = {
            start: { line: start.token.lineNumber, character: start.token.token.endIndex },
            end: { line: start.endToken.lineNumber, character: start.endToken.token.endIndex },
        };

        console.log(JSON.stringify(res));
        return res;
    }
    private static rangeOf(token: ParserTypes.ParsedToken): Range {
        const res = {
            start: { line: token.lineNumber, character: token.token.startIndex },
            end: { line: token.lineNumber, character: token.token.endIndex },
        };

        console.log(JSON.stringify(res));
        return res;
    }
    private static rangeOfLine(line: number, length: number): Range {
        return {
            start: { line, character: 0 },
            end: { line, character: length },
        };
    }

    public diagnostics: CustomDiagnostic[] = [];

    private parser: dotnugg.parser;

    private doc: TextDocument;

    constructor(doc: TextDocument) {
        this.parser = dotnugg.parser.parseData(doc.getText());
        this.doc = doc;
        this.validate();
    }

    private validate() {
        console.log('herhereher');
        try {
            if (Config.collection) {
                for (let i = 0; i < this.doc.lineCount; i++) {
                    this.validateLine(i);
                }

                for (let i = 0; i < this.parser.tokens.length; i++) {
                    this.validateToken(this.parser.tokens[i]);
                }

                this.validateResultRule();
                this.validateItemName();
                this.validateZindex();
            } else {
                const diag = {
                    message: 'no collection file found',
                    range: Linter.innerRangeOf(this.parser.results.items[0]),
                    code: 'UNDEFINED:ITEM:0x72',
                    severity: DiagnosticSeverity.Error,
                    source: 'dotnugg',
                    data: null,
                };
                console.log(diag);
                console.log(this.parser.results.items);
                console.log(diag.range);

                this.diagnostics.push(diag);
            }
        } catch (err) {
            console.log({ message: 'language server crashed, skipping validtion', err });
        }
    }

    private validateZindex() {
        this.parser.results.items.forEach((x) => {
            Object.values(x.value.colors.value).forEach((x) => {
                if (x.value.zindex.value.offset > 10 && x.value.zindex.value.offset !== 100) {
                    this.diagnostics.push({
                        message:
                            'invalid zindex\n - must be between -4 and +9 (inclusive)\n - for default value from collection.nugg, use "+D"\n - sign is required',
                        range: Linter.rangeOf(x.value.zindex.token),
                        code: 'UNDEFINED:ZINDEX:0x75',
                        severity: DiagnosticSeverity.Error,
                        source: 'dotnugg',
                        data: null,
                    });
                } else {
                    if (x.value.zindex.value.direction === '-') {
                        if (x.value.zindex.value.offset > 4) {
                            this.diagnostics.push({
                                message:
                                    'invalid zindex\n - must be between -4 and +9 (inclusive)\n - for default value from collection.nugg, use "+D"\n - sign is required',
                                range: Linter.rangeOf(x.value.zindex.token),
                                code: 'UNDEFINED:ZINDEX:0x75',
                                severity: DiagnosticSeverity.Error,
                                source: 'dotnugg',
                                data: null,
                            });
                        }
                    }
                }
            });
        });
    }

    private validateItemName() {
        // if collection does not contain feature name

        const found = this.parser.results.items[0].value.feature;
        console.log({ found });

        if (Config.collectionFeatureKeys.indexOf(found.value) === -1) {
            const diag = {
                message: `undefined item type "${found.value}" - collection only has ` + JSON.stringify(Config.collectionFeatureKeys),
                range: Linter.rangeOf(found.token),
                code: 'UNDEFINED:ITEM:0x72',
                severity: DiagnosticSeverity.Error,
                source: 'dotnugg',
                data: null,
            };
            console.log(diag);
            console.log(this.parser.results.items);
            console.log(diag.range);
            this.diagnostics.push(diag);
        }
    }

    private validateResultRule() {
        const matrix = this.parser.results.items[0].value.versions.value[0].value.data.value.matrix;

        let last = undefined;
        for (let i = 0; i < matrix.length; i++) {
            if (last !== undefined && last !== matrix[i].value.length) {
                this.diagnostics.push({
                    message: 'expected row to be length ' + last + ' - instead it is ' + matrix[i].value.length,
                    range: Linter.innerRangeOf(matrix[i]),
                    code: 'INVALID:ROW:LEN:0x66',
                    severity: DiagnosticSeverity.Error,
                    source: 'dotnugg',
                    data: null,
                });
            }
            last = matrix[i].value.length;
        }

        const anchor = this.parser.results.items[0].value.versions.value[0].value.anchor;
        const actualYLen = matrix.length;
        const actualXLen = matrix[0].value.length;
        if (anchor.value.x.value > actualXLen || anchor.value.x.value < 1) {
            this.diagnostics.push({
                message: `invaid x anchor - must be between 1 and ${actualXLen} (inclusive)`,
                range: Linter.rangeOf(anchor.value.x.token),
                code: 'INVALID:ANCHOR:X:0x66',
                severity: DiagnosticSeverity.Error,
                source: 'dotnugg',
                data: null,
            });
        }

        if (anchor.value.y.value > actualYLen || anchor.value.y.value < 1) {
            this.diagnostics.push({
                message: `invaid y anchor - must be between 1 and ${actualYLen} (inclusive)`,
                range: Linter.rangeOf(anchor.value.y.token),
                code: 'INVALID:ANCHOR:Y:0x70',
                severity: DiagnosticSeverity.Error,
                source: 'dotnugg',
                data: null,
            });
        }
    }

    private validateToken(token: ParsedToken) {}

    private validateLine(line: number) {
        this.invalidColorRule(line);
        this.invalidZindexRule(line);
    }

    private invalidZindexRule(line: number) {}

    private invalidColorRule(line: number) {
        if (this.parser.checkScopesOnLine(line, ['dotnugg.general.colors.content'])) {
            if (!this.parser.checkTextOnLine(line, [':='])) {
                const range = {
                    start: { line, character: 0 },
                    end: { line, character: this.parser.lineAt(line).length },
                };
                console.log(range);
                this.diagnostics.push({
                    message: 'missing color assignment operator - fix by using ":="',
                    range,
                    code: 'INVALID:COLOR:0x67',
                    severity: DiagnosticSeverity.Error,
                    source: 'dotnugg linter',
                    data: null,
                });
            } else if (!this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralColorName])) {
                this.diagnostics.push({
                    message: 'missing color variable - variables have to be only 1 alphabetical character',
                    range: Linter.rangeOfLine(line, this.parser.lineAt(line).length),
                    code: 'INVALID:COLOR:0x66',
                    severity: DiagnosticSeverity.Error,
                    source: 'dotnugg linter',
                    data: { range: Linter.rangeOfLine(line, this.parser.lineAt(line).length), text: 'lol' },
                });
            } else if (!this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralColorDetails])) {
                this.diagnostics.push({
                    message: 'invalid color definition -- missing color details',
                    range: Linter.rangeOfLine(line, this.parser.lineAt(line).length),
                    code: 'INVALID:COLOR:0x65',
                    severity: DiagnosticSeverity.Error,
                    source: 'dotnugg linter',
                    data: { range: Linter.rangeOfLine(line, this.parser.lineAt(line).length), text: 'lol' },
                });
            }
        }
    }
}

export type CustomDiagnostic = Diagnostic & {
    data: CustomFix;
};

export type CustomFix = {
    range: Range;
    text: string;
};
