import {
    createConnection,
    InitializeResult,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind,
    WorkspaceFolder,
    CodeAction,
    HandlerResult,
    CodeActionParams,
    CodeActionKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { dotnugg } from '@nuggxyz/dotnugg-sdk';

import { CustomDiagnostic, Linter } from './server/Linter';
import { Config } from './server/Config';

let validatingDocument = false;
let validatingAllDocuments = false;
const validationDelay = 1500;
let rootPath: string;
let workspaceFolders: WorkspaceFolder[];
let hasWorkspaceFolderCapability = false;

const connection = createConnection(ProposedFeatures.all);

// console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);
const documents = new TextDocuments(TextDocument);

documents.listen(connection);

documents.onDidChangeContent((event) => {
    const document = event.document;
    if (!validatingDocument && !validatingAllDocuments) {
        validatingDocument = true; // control the flag at a higher level
        // slow down, give enough time to type (1.5 seconds?)
        setTimeout(() => validate(document), validationDelay);
    }
});

function initWorkspaceRootFolder(uri: string) {
    if (rootPath !== 'undefined') {
        const fullUri = URI.parse(uri);
        if (!fullUri.fsPath.startsWith(rootPath)) {
            if (workspaceFolders) {
                const newRootFolder = workspaceFolders.find((x) => uri.startsWith(x.uri));
                if (newRootFolder !== undefined) {
                    rootPath = URI.parse(newRootFolder.uri).fsPath;
                    // solcCompiler.rootPath = rootPath;
                    // if (linter !== null) {
                    Config.loadFileConfig(rootPath);
                    // }
                }
            }
        }
    }
}
function validate(document: TextDocument) {
    try {
        initWorkspaceRootFolder(document.uri);
        validatingDocument = true;
        if (!document.getText().includes('@collection')) {
            // console.log(document.uri);
            // console.log(document.getText());

            const uri = document.uri;

            const linter = new Linter(document);

            const diag = linter.diagnostics;
            console.log(diag);
            connection.sendDiagnostics({ diagnostics: diag, uri });
        }
        // connection.client.register}
    } finally {
        validatingDocument = false;
    }
}

function validateAllDocuments() {
    if (!validatingAllDocuments) {
        try {
            validatingAllDocuments = true;
            documents.all().forEach((document) => validate(document));
        } finally {
            validatingAllDocuments = false;
        }
    }
}

// remove diagnostics from the Problems panel when we close the file
documents.onDidClose((event) =>
    connection.sendDiagnostics({
        diagnostics: [],
        uri: event.document.uri,
    }),
);

connection.onInitialize(async (params): Promise<InitializeResult> => {
    rootPath = params.rootPath;
    const capabilities = params.capabilities;

    await dotnugg.parser.init();

    Config.init(rootPath, {});

    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);

    if (params.workspaceFolders) {
        workspaceFolders = params.workspaceFolders;
    }

    // console.log(JSON.stringify(params));

    const result: InitializeResult = {
        capabilities: {
            // completionProvider: {
            //     resolveProvider: false,
            //     triggerCharacters: ['.'],
            // },
            // definitionProvider: true,

            codeActionProvider: { codeActionKinds: [CodeActionKind.QuickFix], resolveProvider: true },
            textDocumentSync: TextDocumentSyncKind.Full,
        },

        serverInfo: { name: 'dotnugg' },
    };

    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }
    return result;
});

connection.onInitialized(() => {
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders((_event) => {
            if (connection.workspace !== undefined) {
                connection.workspace.onDidChangeWorkspaceFolders((event) => {
                    event.removed.forEach((workspaceFolder) => {
                        const index = workspaceFolders.findIndex((folder) => folder.uri === workspaceFolder.uri);
                        if (index !== -1) {
                            workspaceFolders.splice(index, 1);
                        }
                    });
                    event.added.forEach((workspaceFolder) => {
                        workspaceFolders.push(workspaceFolder);
                    });
                });
            }
        });
    }
});

// connection.onCodeAction()

connection.onDidChangeWatchedFiles((_change) => {
    Config.init(rootPath, {});

    validateAllDocuments();
});

export function InterpretFix(uri: string, diagnositc: CustomDiagnostic): CodeAction {
    // console.log(JSON.stringify(diagnositc));
    const data = diagnositc.data;

    if (data) {
        delete diagnositc.data;

        const fix: CodeAction = { title: `fix: ${diagnositc.code}` };
        fix.edit = {};
        fix.edit.changes = {};
        fix.edit.changes[uri] = [{ range: data.range, newText: data.text }];
        fix.diagnostics = [diagnositc];
        fix.isPreferred = true;
        fix.kind = CodeActionKind.QuickFix;
        return fix;
    }
    return undefined;
}

connection.onCodeAction((params: CodeActionParams): HandlerResult<CodeAction[], void> => {
    const diagnostics: CustomDiagnostic[] = params.context.diagnostics as unknown as any;
    if (diagnostics.length > 0) {
        // console.log(JSON.stringify(diagnostics[0].data));
        const fix = InterpretFix(params.textDocument.uri, diagnostics[0]);
        // console.log(JSON.stringify(fix));
        return fix ? [fix] : [];
    } else {
        return [];
    }

    // const res: CodeAction = {
    //     title: 'hello',
    //     diagnostics,
    // };
});

connection.onCodeActionResolve((item: CodeAction): CodeAction => {
    return item;
});

connection.listen();
