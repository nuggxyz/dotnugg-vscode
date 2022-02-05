import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { dotnugg } from '../../../../../nuggxyz/github/dotnugg-sdk/src';
import { ParsedToken } from '../../../../../nuggxyz/github/dotnugg-sdk/src/parser/types/ParserTypes';

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
    private static rangeOf(token: ParserTypes.ParsedToken): Range {
        return {
            start: { line: token.lineNumber, character: token.token.startIndex },
            end: { line: token.lineNumber, character: token.token.endIndex },
        };
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

        for (let i = 0; i < this.doc.lineCount; i++) {
            this.validateLine(i);
        }

        for (let i = 0; i < this.parser.tokens.length; i++) {
            this.validateToken(this.parser.tokens[i]);
        }
    }

    private validateToken(token: ParsedToken) {}

    private validateLine(line: number) {
        this.invalidColorRule(line);
    }

    private invalidColorRule(line: number) {
        if (
            this.parser.checkTextOnLine(line, ['rgba']) &&
            this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralColors]) &&
            !this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralColorDetails])
        ) {
            this.diagnostics.push({
                message: 'invalid color definition',
                range: Linter.rangeOfLine(line, this.parser.lineAt(line).length),
                code: 'INVALID COLOR',
                severity: DiagnosticSeverity.Error,
                source: 'dotnugg linter',
                data: { range: Linter.rangeOfLine(line, this.parser.lineAt(line).length), text: 'lol' },
            });
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
