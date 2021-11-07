// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as _ from '../syntaxes/dotnugg.tmLanguage.json';

import Helper from './classes/Helper';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
// export async function activate(context: vscode.ExtensionContext) {
//     // Use the console to output diagnostic information (console.log) and errors (console.error)
//     // This line of code will only be executed once when your extension is activated
//     Logger.log('error', 'test');

//     console.log('Congratulations, your extension "dotnugg" is now active!');
//     Parser.init(context);

//     const waited = await Parser.grammer;

//     vscode.window.createTextEditorDecorationType({ backgroundColor: '#FF4040' });
//     // The command has been defined in the package.json file
//     // Now provide the implementation of the command with registerCommand
//     // The commandId parameter must match the command field in package.json
//     const disposable = vscode.commands.registerCommand('dotnugg.helloWorld', () => {
//         // The code you place here will be executed every time your command is executed
//         // Display a message box to the user

//         Logger.log(
//             'error',
//             waited.tokenizeLine('@COLLECTION(32, 32) := { }', null).tokens[0].startIndex.toString(),
//             waited.tokenizeLine('@COLLECTION(32, 32) := { }', null).tokens[0].endIndex.toString(),
//             waited.tokenizeLine('@COLLECTION(32, 32) := { }', null).tokens[0].scopes,
//         );

//         vscode.window.showInformationMessage('Hello World from dotnugg!');
//     });
//     start();

//     context.subscriptions.push(disposable);
// }

// const start = async () => {
//     const waited = await Parser.grammer;
//     if (waited) {
//         const res = waited.tokenizeLine2('@COLLECTION(32, 32) := { }', null);
//         console.log('result', res);
//     }
// };

export const tmp = _;
export const the_dirname = __dirname;
exports.activate = Helper.onActivate;

// this method is called when your extension is deactivated
export function deactivate() {}
