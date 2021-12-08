import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';

import { DotNuggCompiler } from '../../../dotnugg-sdk/src/DotNuggCompiler';

import Decorator from './Decorator';
import { Formatter3 } from './Formatter3';

// import { Config } from './Config';
class Helper {
    private static _active_editor: vscode.TextEditor;
    private static languageId = 'dotnugg';
    private static selector = {
        language: 'dotnugg',
    };

    public static get editor() {
        return Helper._active_editor;
    }

    public static vscodeRange(token: NL.DotNugg.ParsedToken) {
        return new vscode.Range(
            new vscode.Position(token.lineNumber, token.token.startIndex),
            new vscode.Position(token.lineNumber, token.token.endIndex),
        );
    }

    public static get compiledDirecory() {
        return new DotNuggCompiler().compileDirectory(this.workingdir);
    }

    public static get workingdir() {
        return vscode.workspace.asRelativePath(vscode.env.appRoot);
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
        // Config.reinit().then((finished) => {
        //     console.log('✓ workspace ready (linearized, resolved deps, ..)');
        //     console.log('info', JSON.stringify(finished));
        //     // if (cancellationToken.isCancellationRequested || !finished.some((fp) => fp.value && fp.value.filePath === document.fileName)) {
        //     //     //abort - new analysis running already OR our finished task is not in the tasklist :/
        //     // }
        // });
    }

    static async onDidSave() {
        console.log('info', 'SAVEs');
        // const comp = Compiler.init(Helper._active_editor.document);
        // comp.compile();
        Decorator.decorateActiveFile();
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
        // // Config.parse(undefined);
        // const tmp = FileConfig.init(Helper._active_editor.document);

        Helper.cancelationTokens.onDidChange.dispose();
        Helper.cancelationTokens.onDidChange = new vscode.CancellationTokenSource();
        // console.log('info', '--- on-did-change');
        // try {
        //     Helper.analyzeSourceUnit();
        // } catch (err) {
        //     if (typeof err !== 'object') {
        //         //CancellationToken
        //         throw err;
        //     }
        // }

        console.log('info', '✓✓✓ on-did-change - resolved');
    }

    static async onActivate(context: vscode.ExtensionContext) {
        if (vscode.window.activeTextEditor === undefined) {
            throw new Error('onActivate called with inactivae text editor');
        }
        const commandHandler = () => {
            try {
                const data = this.compiledDirecory.parser.json;

                const filepath = path.join(this.workingdir, 'dotnuggParsedItems.json');

                fs.writeFileSync(filepath, data);

                console.log('JSON data is saved.');
            } catch (error) {
                console.error(error);
            }
        };

        context.subscriptions.push(vscode.commands.registerCommand('dotnugg.jsonificationator', commandHandler));

        Helper._active_editor = vscode.window.activeTextEditor;

        await DotNuggCompiler.init();

        new DotNuggCompiler().compileDirectory(vscode.workspace.asRelativePath(vscode.env.appRoot));

        Formatter3.init();

        // // const text = fs.readFileSync('./test/Base.nugg', 'utf-8');
        // const m = new Formatter2(tmp);

        // Logger.log('error', 'onActivate');
        // Config.init(context.extensionPath);

        registerDocType(Helper.languageId);

        async function registerDocType(type: string) {
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
                    // console.log('info', JSON.stringify(Helper._active_editor.document), JSON.stringify(event.document));
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
    }
}

export default Helper;
