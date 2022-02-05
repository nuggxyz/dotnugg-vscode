import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { dotnugg } from '../../../../../nuggxyz/github/dotnugg-sdk/src';

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

    public static validate(path: string, documentText: string, doc: TextDocument): Diagnostic[] {
        console.log('herhereher');

        const res = dotnugg.parser.parseData(doc.getText());

        const diag: Diagnostic[] = [];

        for (let i = 0; i < doc.lineCount; i++) {
            console.log('===============================');

            console.log(JSON.stringify(res.linescopes[i]));

            console.log(res.checkTextOnLine(i, ['rgba']));
            console.log(res.checkScopesOnLine(i, [dotnugg.parser.semanticTokens.GeneralColors]));
            console.log(res.checkScopesOnLine(i, [dotnugg.parser.semanticTokens.GeneralColorDetails]));

            if (
                res.checkTextOnLine(i, ['rgba']) &&
                res.checkScopesOnLine(i, [dotnugg.parser.semanticTokens.GeneralColors]) &&
                !res.checkScopesOnLine(i, [dotnugg.parser.semanticTokens.GeneralColorDetails])
            ) {
                diag.push({
                    message: 'invalid color definition',
                    range: this.rangeOfLine(i, res.lineAt(i).length),
                    code: 'INVALID COLOR',
                    severity: DiagnosticSeverity.Error,
                });
            }
        }

        return diag;
    }
}
