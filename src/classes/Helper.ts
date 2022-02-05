import path from 'path';

import * as vscode from 'vscode';
import { Disposable, LanguageClientOptions, RevealOutputChannelOn } from 'vscode-languageclient';
import { LanguageClient, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';
import { dotnugg } from '@nuggxyz/dotnugg-sdk';

import Decorator, { DotnuggCodeLensProvider } from './Decorator';
import { Formatter3 } from './Formatter3';
// import { Config } from './Config';

class Helper {
    private static _active_editor: vscode.TextEditor;
    private static languageId = 'dotnugg';
    private static selector = {
        language: 'dotnugg',
    };

    private static client: LanguageClient = undefined;

    private static diagnosticCollection: vscode.DiagnosticCollection = null;

    public static get editor() {
        return Helper._active_editor;
    }

    public static async files() {
        const f = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');

        return f;
    }

    public static vscodeRange(token: ParserTypes.ParsedToken) {
        return new vscode.Range(
            new vscode.Position(token.lineNumber, token.token.startIndex),
            new vscode.Position(token.lineNumber, token.token.endIndex),
        );
    }

    // public static get compiledDirecory() {
    //     return dotnugg.parser.parseDirectoryCheckCache(this.workingdir);
    // }

    public static get workingdir() {
        return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }

    private static cancelationTokens = {
        onDidChange: new vscode.CancellationTokenSource(),
        onDidSave: new vscode.CancellationTokenSource(),
    };

    static editorJumptoRange(editor: vscode.TextEditor, range: vscode.Range) {
        let revealType = vscode.TextEditorRevealType.InCenter;
        const selection = new vscode.Selection(range.start.line, range.start.character, range.end.line, range.end.character);
        if (range.start.line === editor.selection.active.line) {
            revealType = vscode.TextEditorRevealType.InCenterIfOutsideViewport;
        }

        editor.selection = selection;
        editor.revealRange(selection, revealType);
    }

    static analyzeSourceUnit() {
        const document =
            Helper._active_editor && Helper._active_editor.document
                ? Helper._active_editor.document
                : vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document
                : undefined;
        if (!document) {
            console.warn('change event on non-document');
        }
    }

    static async onDidSave() {
        console.log('info', 'SAVEs');
        // const comp = Compiler.init(Helper._active_editor.document);
        // comp.compile();
        Decorator.decorateActiveFile();
        // console.log({ compiler: 'yo' });

        Helper.cancelationTokens.onDidSave.dispose();
        Helper.cancelationTokens.onDidSave = new vscode.CancellationTokenSource();
    }

    static onDidChange() {
        const document =
            Helper._active_editor && Helper._active_editor.document
                ? Helper._active_editor.document
                : vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document
                : undefined;
        if (!document) {
            console.log('warn', 'change event on non-document');
            return;
        }
        if (document.languageId !== Helper.languageId) {
            console.log('info', 'ondidchange: wrong langid');
            return;
        }

        Decorator.decorateActiveFile();

        Helper.cancelationTokens.onDidChange.dispose();
        Helper.cancelationTokens.onDidChange = new vscode.CancellationTokenSource();

        console.log('info', '✓✓✓ on-did-change - resolved');
    }

    static async onActivate(context: vscode.ExtensionContext) {
        if (vscode.window.activeTextEditor === undefined) {
            throw new Error('onActivate called with inactivae text editor');
        }

        Helper._active_editor = vscode.window.activeTextEditor;

        await dotnugg.parser.init();

        Formatter3.init();

        registerDocType(Helper.languageId);

        async function registerDocType(type: string) {
            context.subscriptions.push(vscode.languages.registerCodeLensProvider('dotnugg', new DotnuggCodeLensProvider()));

            vscode.window.onDidChangeActiveTextEditor(
                (editor) => {
                    if (editor === undefined) {
                        throw new Error('onActivate called with inactivae text editor');
                    }
                    Helper._active_editor = editor;
                    if (editor && editor.document && editor.document.languageId === type) {
                        Helper.onDidChange();
                    }
                },
                null,
                context.subscriptions,
            );
            vscode.workspace.onDidChangeTextDocument(
                (event) => {
                    if (Helper._active_editor && event.document.languageId === type) {
                        Helper.onDidChange();
                    }
                },
                null,
                context.subscriptions,
            );

            /***** OnSave */
            vscode.workspace.onDidSaveTextDocument(
                (document) => {
                    Helper.onDidSave();
                },
                null,
                context.subscriptions,
            );

            /****** OnOpen */
            vscode.workspace.onDidOpenTextDocument(
                (document) => {
                    Helper.onDidSave();
                },
                null,
                context.subscriptions,
            );

            /****** onDidChangeTextEditorSelection */
            // vscode.window.onDidChangeTextEditorSelection(
            //     (event) /* TextEditorVisibleRangesChangeEvent */ => {
            //         cockpit.onDidSelectionChange(event); // let cockpit handle the event
            //     },
            //     null,
            //     context.subscriptions,
            // );

            // context.subscriptions.push(
            //     vscode.languages.registerHoverProvider(type, {
            //         provideHover(document, position, token) {
            //             return mod_hover.provideHoverHandler(document, position, token, type, g_workspace);
            //         },
            //     }),
            // );
        }

        initServer();

        function initServer() {
            const ws = vscode.workspace.workspaceFolders;
            Helper.diagnosticCollection = vscode.languages.createDiagnosticCollection(Helper.languageId);

            context.subscriptions.push(Helper.diagnosticCollection);

            // vscode.languages.registerCodeActionsProvider

            // initDiagnosticCollection(this.diagnosticCollection);

            const serverModule = path.join(__dirname, 'server.js');
            const serverOptions: ServerOptions = {
                debug: {
                    module: serverModule,
                    options: {
                        execArgv: ['--nolazy', '--inspect=6004'],
                    },
                    transport: TransportKind.ipc,
                },

                run: {
                    module: serverModule,
                    transport: TransportKind.ipc,
                },
            };

            const clientOptions: LanguageClientOptions = {
                documentSelector: [
                    { language: 'dotnugg', scheme: 'file' },
                    { language: 'dotnugg', scheme: 'untitled' },
                ],
                revealOutputChannelOn: RevealOutputChannelOn.Never,

                diagnosticCollectionName: Helper.diagnosticCollection.name,
                synchronize: {
                    // Synchronize the setting section 'dotnugg' to the server
                    configurationSection: 'dotnugg',

                    // // Notify the server about file changes to '.sol.js files contain in the workspace (TODO node, linter)
                    // fileEvents: vscode.workspace.createFileSystemWatcher('{**/remappings.txt,**/.solhint.json,**/.soliumrc.json}'),
                },
                initializationOptions: { path: context.extensionPath, codeActionLiteralSupport: true },
            };

            let clientDisposable: Disposable;

            if (ws) {
                Helper.client = new LanguageClient('dotnugg', 'dotnugg Language Server', serverOptions, clientOptions);
                clientDisposable = Helper.client.start();
            }
            // Push the disposable to the context's subscriptions so that the
            // client can be deactivated on extension deactivation
            context.subscriptions.push(clientDisposable);
        }
    }
}

export default Helper;
