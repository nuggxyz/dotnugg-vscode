import * as vscode from 'vscode';

export function getCurrentWorkspaceRootFsPath() {
	return getCurrentWorkspaceRootFolder().uri.fsPath;
}

export function getCurrentWorkspaceRootFolder() {
	const editor = vscode.window.activeTextEditor;
	const currentDocument = editor.document.uri;
	return vscode.workspace.getWorkspaceFolder(currentDocument);
}
