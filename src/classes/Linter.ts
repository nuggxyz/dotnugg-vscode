import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';

import { dotnugg } from '../../../../../nuggxyz/github/dotnugg-sdk/src';

export class Linter {
    private static rangeOf(token: ParserTypes.ParsedToken): Range {
        return {
            start: { line: token.lineNumber, character: token.token.startIndex },
            end: { line: token.lineNumber, character: token.token.endIndex },
        };
    }

    public static validate(path: string, documentText: string): Diagnostic[] {
        console.log('herhereher');

        const res = dotnugg.parser.parseData(documentText);

        return [
            {
                message: `Linter: 'helo'`,
                range: this.rangeOf(res.tokens[0]),
                severity: DiagnosticSeverity.Error,
            },
        ];
    }
}
