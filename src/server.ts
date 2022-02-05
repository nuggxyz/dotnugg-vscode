import {
    createConnection,
    Diagnostic,
    InitializeResult,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind,
    WorkspaceFolder,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';

import { dotnugg } from '../../../../nuggxyz/github/dotnugg-sdk/src';

import { Linter } from './classes/Linter';

let validatingDocument = false;
let validatingAllDocuments = false;
const validationDelay = 1500;
let rootPath: string;
let workspaceFolders: WorkspaceFolder[];
let hasWorkspaceFolderCapability = false;

const connection = createConnection(ProposedFeatures.all);

console.log = connection.console.log.bind(connection.console);
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
                    //     linter.loadFileConfig(rootPath);
                    // }
                }
            }
        }
    }
}

function validate(document: TextDocument) {
    try {
        console.log(document.uri);
        console.log(document.getText());

        initWorkspaceRootFolder(document.uri);
        validatingDocument = true;
        const uri = document.uri;
        const filePath = URI.parse(uri).fsPath;

        const documentText = document.getText();
        let linterDiagnostics: Diagnostic[] = [];

        linterDiagnostics = Linter.validate(filePath, documentText);

        connection.sendDiagnostics({ diagnostics: linterDiagnostics, uri });
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

connection.onInitialize((params): InitializeResult => {
    rootPath = params.rootPath;
    const capabilities = params.capabilities;

    dotnugg.parser.init();

    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);

    if (params.workspaceFolders) {
        workspaceFolders = params.workspaceFolders;
    }

    const result: InitializeResult = {
        capabilities: {
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: ['.'],
            },
            definitionProvider: true,
            textDocumentSync: TextDocumentSyncKind.Full,
        },
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

connection.onDidChangeWatchedFiles((_change) => {
    // if (linter !== null) {
    //     linter.loadFileConfig(rootPath);
    // }
    validateAllDocuments();
});

connection.listen();
