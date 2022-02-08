/* eslint-disable prefer-const */
import * as vscode from 'vscode';
import { Pixel, RangeOf } from '@nuggxyz/dotnugg-sdk/dist/parser/types/ParserTypes';

import Helper from './Helper';
import Decorator from './Decorator';

export class CodeLens {
    private static map: { [_: string]: CodeLens } = {};

    public stor: vscode.CodeLens[] = [];

    public static exists(doc: vscode.TextDocument) {
        return CodeLens.map[doc.uri.fsPath] !== undefined;
    }

    constructor(doc: vscode.TextDocument) {
        this.init(doc);
    }

    private init(doc: vscode.TextDocument) {
        const parser = Helper.recentParser(doc);

        let token: vscode.Range;

        if (parser.results.items.length > 0) {
            const matrix = parser.results.items[0].value.versions.value[0].value.data.value.matrix;
            token = Helper.vscodeRange(matrix[0].token);
        }

        this.stor = [];

        this.stor.push(
            new vscode.CodeLens(token, {
                title: 'toggle colors',
                command: 'dotnugg.showLayerColorsInActiveDoc',
            }),
        );

        this.stor.push(
            new vscode.CodeLens(token, {
                title: 'toggle background',
                command: 'dotnugg.showBackground',
            }),
        );

        this.stor.push(
            new vscode.CodeLens(token, {
                title: 'crop rows',
                command: 'dotnugg.cropMatrixRows',
            }),
        );

        this.stor.push(
            new vscode.CodeLens(token, {
                title: 'crop columns',
                command: 'dotnugg.cropMatrixColumns',
            }),
        );
    }

    public static update(document: vscode.TextDocument) {
        let me = CodeLens.map[document.uri.fsPath];

        if (!me) {
            me = new CodeLens(Helper.editor.document);
        }

        me.init(document);
    }

    public backgroundVisible = false;
    public layerColorsVisible = false;

    public static checkBackgroundVisible(document: vscode.TextDocument) {
        let me = CodeLens.map[document.uri.fsPath];

        if (!me) {
            me = new CodeLens(Helper.editor.document);
        }

        return me.backgroundVisible;
    }

    public static checkLayerColorsVisible(document: vscode.TextDocument) {
        let me = CodeLens.map[document.uri.fsPath];

        if (!me) {
            me = new CodeLens(Helper.editor.document);
        }

        return me.layerColorsVisible;
    }

    public static switchActiveDocToLayerColors() {
        let me = CodeLens.map[Helper.editor.document.uri.fsPath];

        if (!me) {
            me = new CodeLens(Helper.editor.document);
        }

        me.layerColorsVisible = !me.layerColorsVisible;

        Decorator.decorateActiveFile(Helper.editor.document);
    }

    public static switchBackgroundVisible() {
        let me = CodeLens.map[Helper.editor.document.uri.fsPath];

        if (!me) {
            me = new CodeLens(Helper.editor.document);
        }

        me.backgroundVisible = !me.backgroundVisible;

        Decorator.decorateActiveFile(Helper.editor.document);
    }

    public static _moveAnchorUp(edit: vscode.TextEditorEdit) {
        const doc = Helper.editor.document;

        const parser = Helper.recentParser(doc);

        let anchor = parser.results.items[0].value.versions.value[0].value.anchor.value.y;
        edit.replace(Helper.vscodeRange(anchor.token), String(anchor.value - 1));
    }

    public static moveAnchorUp() {
        Helper.editor.edit(CodeLens._moveAnchorUp);
    }

    public static _moveAnchorDown(edit: vscode.TextEditorEdit) {
        const doc = Helper.editor.document;

        const parser = Helper.recentParser(doc);

        let anchor = parser.results.items[0].value.versions.value[0].value.anchor.value.y;
        edit.replace(Helper.vscodeRange(anchor.token), String(anchor.value + 1));
    }

    public static moveAnchorDown() {
        Helper.editor.edit(CodeLens._moveAnchorDown);
    }

    public static _moveAnchorRight(edit: vscode.TextEditorEdit) {
        const doc = Helper.editor.document;

        const parser = Helper.recentParser(doc);

        let anchor = parser.results.items[0].value.versions.value[0].value.anchor.value.x;
        edit.replace(Helper.vscodeRange(anchor.token), String(anchor.value + 1));
    }

    public static moveAnchorRight() {
        Helper.editor.edit(CodeLens._moveAnchorRight);
    }

    public static _moveAnchorLeft(edit: vscode.TextEditorEdit) {
        const doc = Helper.editor.document;

        const parser = Helper.recentParser(doc);

        let anchor = parser.results.items[0].value.versions.value[0].value.anchor.value.x;
        edit.replace(Helper.vscodeRange(anchor.token), String(anchor.value - 1));
    }

    public static moveAnchorLeft() {
        Helper.editor.edit(CodeLens._moveAnchorLeft);
    }

    private static _cropMatrixRows(edit: vscode.TextEditorEdit): void {
        const doc = Helper.editor.document;
        const parser = Helper.recentParser(doc);

        const matrix = parser.results.items[0].value.versions.value[0].value.data.value.matrix;
        let anchor = parser.results.items[0].value.versions.value[0].value.anchor.value.y;
        // anchor.value++;

        const rows: vscode.Range[] = [];

        let removedLeft = 0;
        // let removedRight = 0;

        for (let i = matrix.length - 1; i >= 0 && i + 1 !== anchor.value; i--) {
            if (matrix[i].value.every((x) => x.value.type.value === 'transparent')) {
                rows.push(doc.lineAt(matrix[i].token.lineNumber).rangeIncludingLineBreak);
                // removedRight++;
            } else {
                break;
            }
        }

        for (let i = 0; i < matrix.length && i + 1 !== anchor.value; i++) {
            if (matrix[i].value.every((x) => x.value.type.value === 'transparent')) {
                rows.push(doc.lineAt(matrix[i].token.lineNumber).rangeIncludingLineBreak);
                removedLeft++;
            } else {
                break;
            }
        }

        rows.forEach((x) => edit.delete(x));

        // anchor.value--;

        edit.replace(Helper.vscodeRange(anchor.token), String(anchor.value - removedLeft));
    }

    public static cropMatrixRows() {
        let me = CodeLens.map[Helper.editor.document.uri.fsPath];

        if (!me) {
            me = new CodeLens(Helper.editor.document);
        }

        Helper.editor.edit(CodeLens._cropMatrixRows);

        me.init(Helper.editor.document);
    }

    private static _cropMatrixColumns(edit: vscode.TextEditorEdit): void {
        const doc = Helper.editor.document;
        const parser = Helper.recentParser(doc);

        const matrixCorrect = parser.results.items[0].value.versions.value[0].value.data.value.matrix;

        let anchor = parser.results.items[0].value.versions.value[0].value.anchor.value.x;

        // anchor.value++;

        let matrix: RangeOf<Pixel>[][] = [];

        let removedTop = 0;

        for (let i = 0; i < matrixCorrect.length; i++) {
            for (let j = 0; j < matrixCorrect[i].value.length; j++) {
                if (!matrix[j]) {
                    matrix[j] = [];
                }

                matrix[j].push(matrixCorrect[i].value[j]);
            }
        }

        const rows: vscode.Range[] = [];

        for (let i = 0; i < matrix.length && i + 1 !== anchor.value; i++) {
            if (matrix[i].every((x) => x.value.type.value === 'transparent')) {
                matrix[i].forEach((x) => {
                    rows.push(Helper.vscodeRange(x.token));
                });
                removedTop++;
            } else {
                break;
            }
        }

        for (let i = matrix.length - 1; i >= 0 && i + 1 !== anchor.value; i--) {
            if (matrix[i].every((x) => x.value.type.value === 'transparent')) {
                matrix[i].forEach((x) => {
                    rows.push(Helper.vscodeRange(x.token));
                });
            } else {
                break;
            }
        }

        rows.forEach((x) => edit.delete(x));

        // anchor.value--;

        edit.replace(Helper.vscodeRange(anchor.token), String(anchor.value - removedTop));
    }

    public static cropMatrixColumns() {
        let me = CodeLens.map[Helper.editor.document.uri.fsPath];

        if (!me) {
            me = new CodeLens(Helper.editor.document);
        }

        Helper.editor.edit(CodeLens._cropMatrixColumns);

        me.init(Helper.editor.document);
    }

    static provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
        if (!CodeLens.map[document.uri.fsPath]) {
            CodeLens.map[document.uri.fsPath] = new CodeLens(document);
        }
        return CodeLens.map[document.uri.fsPath].stor;
    }
}
