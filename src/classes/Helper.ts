import path from 'path';
import * as fs from 'fs';

import * as vscode from 'vscode';
import { Disposable, LanguageClientOptions, RevealOutputChannelOn } from 'vscode-languageclient';
import { LanguageClient, ServerOptions } from 'vscode-languageclient/node';
import * as ParserTypes from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';
import { Collection } from '@nuggxyz/dotnugg-sdk/dist/builder/types/TransformTypes';
import { dotnugg } from '@nuggxyz/dotnugg-sdk';

import Decorator from './Decorator';
import { Formatter3 } from './Formatter3';
import { CodeLens } from './CodeLens';
// import { Config } from './Config';

class Helper {
    private static _active_editor: vscode.TextEditor;
    private static languageId = 'dotnugg';
    private static selector = {
        language: 'dotnugg',
        scheme: 'file',
    };

    private static client: LanguageClient = undefined;

    private static _collection: Collection;

    private static diagnosticCollection: vscode.DiagnosticCollection = null;

    public static get editor() {
        return Helper._active_editor;
    }

    public static get collection(): Collection {
        return Helper._collection;
    }

    private static precent: { parser: dotnugg.parser; file: string; version: number };

    public static recentParser(doc: vscode.TextDocument) {
        console.log(doc);
        console.log(doc.getText());

        if (Helper.precent) {
            if (Helper.precent.file === doc.uri.fsPath) {
                if (Helper.precent.version >= doc.version) {
                    return Helper.precent.parser;
                }
            }
        }

        Helper.precent = {
            parser: dotnugg.parser.parseData(doc.getText()),
            version: doc.version,
            file: doc.uri.fsPath,
        };

        return Helper.precent.parser;
    }

    private static updateCollection() {
        const filePath = path.join(Helper.workingDirPath, '/collection.nugg');
        if (fs.existsSync(filePath)) {
            const parser = dotnugg.parser.parsePath(filePath);
            Helper._collection = dotnugg.builder.transform.fromParser(parser).input.collection;
        } else {
            Helper._collection = undefined;
        }
    }

    public static vscodeRange(token: ParserTypes.ParsedToken) {
        return new vscode.Range(
            new vscode.Position(token.lineNumber, token.token.startIndex),
            new vscode.Position(token.lineNumber, token.token.endIndex),
        );
    }

    public static vscodeRangeOffset(token: ParserTypes.ParsedToken, prefix: number, suffix: number) {
        return new vscode.Range(
            new vscode.Position(token.lineNumber, token.token.startIndex - prefix),
            new vscode.Position(token.lineNumber, token.token.endIndex + suffix),
        );
    }

    public static get workingdir(): vscode.WorkspaceFolder {
        for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
            const p = vscode.workspace.workspaceFolders[i].uri;
            if (fs.existsSync(path.join(p.fsPath, './collection.nugg'))) {
                return vscode.workspace.workspaceFolders[i];
            }
        }
        return vscode.workspace.workspaceFolders[0];
    }

    public static get workingDirPath() {
        return Helper.workingdir.uri.fsPath;
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

    static async onDidSave(doc: vscode.TextDocument) {
        Decorator.decorateActiveFile(doc);

        CodeLens.update(doc);

        Helper.cancelationTokens.onDidSave.dispose();
        Helper.cancelationTokens.onDidSave = new vscode.CancellationTokenSource();
    }

    static onDidChange(doc: vscode.TextDocument) {
        if (!doc) {
            console.log('warn', 'change event on non-document');
            return;
        }
        if (doc.languageId !== Helper.languageId) {
            console.log('info', 'ondidchange: wrong langid');
            return;
        }

        Helper.updateCollection();

        Decorator.decorateActiveFile(doc);

        Helper.cancelationTokens.onDidChange.dispose();
        Helper.cancelationTokens.onDidChange = new vscode.CancellationTokenSource();

        console.log('info', '✓✓✓ on-did-change - resolved');
    }

    static isDotnuggFile(document: vscode.TextDocument) {
        return document && document.languageId === Helper.languageId && !document.uri.fsPath.endsWith('.git');
    }

    static async onActivate(context: vscode.ExtensionContext) {
        await dotnugg.parser.init();

        Helper.updateCollection();
        if (vscode.window.activeTextEditor !== undefined) {
            Helper._active_editor = vscode.window.activeTextEditor;
            if (Helper.isDotnuggFile(Helper._active_editor.document)) {
                Helper.onDidSave(Helper._active_editor.document);
            }
        }

        context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(Helper.selector, Formatter3));
        context.subscriptions.push(vscode.languages.registerCodeLensProvider(Helper.selector, CodeLens));

        context.subscriptions.push(
            vscode.commands.registerCommand('dotnugg.showLayerColorsInActiveDoc', () => {
                CodeLens.switchActiveDocToLayerColors();
            }),
            vscode.commands.registerCommand('dotnugg.showBackground', () => {
                CodeLens.switchBackgroundVisible();
            }),

            vscode.commands.registerCommand('dotnugg.cropMatrixRows', () => {
                CodeLens.cropMatrixRows();
            }),
            vscode.commands.registerCommand('dotnugg.cropMatrixColumns', () => {
                CodeLens.cropMatrixColumns();
            }),
            vscode.commands.registerCommand('dotnugg.moveAnchorLeft', () => {
                CodeLens.moveAnchorLeft();
            }),
            vscode.commands.registerCommand('dotnugg.moveAnchorRight', () => {
                CodeLens.moveAnchorRight();
            }),
            vscode.commands.registerCommand('dotnugg.moveAnchorUp', () => {
                CodeLens.moveAnchorUp();
            }),
            vscode.commands.registerCommand('dotnugg.moveAnchorDown', () => {
                CodeLens.moveAnchorDown();
            }),
        );

        vscode.window.onDidChangeActiveTextEditor(
            (editor) => {
                if (editor === undefined) {
                    throw new Error('onActivate called with inactivae text editor');
                }
                Helper._active_editor = editor;
                if (editor && Helper.isDotnuggFile(editor.document)) {
                    Helper.onDidChange(editor.document);
                }
            },
            null,
            context.subscriptions,
        );
        vscode.workspace.onDidChangeTextDocument(
            (event) => {
                if (Helper._active_editor && Helper.isDotnuggFile(event.document)) {
                    Helper.onDidChange(event.document);
                }
            },
            null,
            context.subscriptions,
        );

        /***** OnSave */
        vscode.workspace.onDidSaveTextDocument(
            (document) => {
                if (Helper.isDotnuggFile(document)) {
                    Helper.onDidSave(document);
                }
            },
            null,
            context.subscriptions,
        );

        /****** OnOpen */
        vscode.workspace.onDidOpenTextDocument(
            (document) => {
                if (Helper.isDotnuggFile(document)) {
                    Helper.onDidSave(document);
                }
            },
            null,
            context.subscriptions,
        );

        // LANGUAGE SERVER

        const ws = vscode.workspace.workspaceFolders;

        const serverModule = path.join(__dirname, 'server.js');
        const serverOptions: ServerOptions = {
            debug: {
                module: serverModule,
                options: {
                    execArgv: ['--nolazy', '--inspect=6004'],
                },
                transport: 1, //TransportKind.ipc
            },

            run: {
                module: serverModule,
                transport: 1, //TransportKind.ipc
            },
        };

        const clientOptions: LanguageClientOptions = {
            documentSelector: [
                { language: 'dotnugg', scheme: 'file' },
                { language: 'dotnugg', scheme: 'untitled' },
            ],
            revealOutputChannelOn: RevealOutputChannelOn.Never,

            diagnosticCollectionName: Helper.languageId,
            synchronize: {
                // Synchronize the setting section 'dotnugg' to the server
                configurationSection: 'dotnugg',

                // // Notify the server about file changes to '.sol.js files contain in the workspace (TODO node, linter)
                fileEvents: vscode.workspace.createFileSystemWatcher('{**/collection.nugg}'),
            },

            initializationOptions: context.extensionPath,
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

export default Helper;
