import { Range } from 'vscode-languageserver/node';
import * as vscode from 'vscode';
import { URI } from 'vscode-uri';

import { CustomFix } from './Linter';

export type CustomVsCodeDiagnostic = vscode.Diagnostic & {
    data: CustomFix;
};

export function convertRange(input: Range) {
    return new vscode.Range(
        new vscode.Position(input.start.line, input.start.character),
        new vscode.Position(input.end.line, input.end.character),
    );
}

export function InterpretFix(diagnositc: CustomVsCodeDiagnostic): vscode.CodeAction {
    console.log(JSON.stringify(diagnositc));
    const data = diagnositc.data;

    delete diagnositc.data;

    const fix = new vscode.CodeAction(`fix: ${diagnositc.code}`, vscode.CodeActionKind.QuickFix);
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(URI.parse(this.doc.uri), convertRange(data.range), data.text);
    fix.diagnostics = [diagnositc];
    return fix;
}

/**
 * Provides code actions corresponding to diagnostic problems.
 */
export class DiagnosticProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken,
    ): vscode.CodeAction[] {
        // for each diagnostic entry that has the matching `code`, create a code action command
        console.log('hello');
        return (
            context.diagnostics
                // .filter((diagnostic) => diagnostic.code === 'INVALID COLOR')
                .map((diagnostic) => InterpretFix(diagnostic as CustomVsCodeDiagnostic))
        );
    }
}
