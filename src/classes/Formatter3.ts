import * as vscode from 'vscode';
import { dotnugg } from '@nuggxyz/dotnugg-sdk';

import { REGEX } from '../constants/regex-formatter';

type RegExpData = { regex: RegExp; tablen: number; groupMember: boolean };

export class autoCroper implements vscode.TextEditorEdit {
    public delete(location: vscode.Range | vscode.Selection): void {}
    public replace(location: vscode.Position | vscode.Range | vscode.Selection, value: string): void {}
    public insert(location: vscode.Position, value: string): void {}
    public setEndOfLine() {}
}

export class Formatter3 {
    // public static _instance: vscode.Disposable;

    public parser: dotnugg.parser;

    public document: vscode.TextDocument;

    constructor(document: vscode.TextDocument) {
        this.parser = dotnugg.parser.parseData(document.getText());
        this.document = document;
    }

    public static defaults = {
        t: '    ',
        s: ' ',
        n: '',
    };

    // public static autoCrop(document: vscode.TextDocument): vscode.TextEditorEdit {
    //     const formatter = new Formatter3(document);

    //     const res = new vscode.TextEditorEdit();
    // }

    // public static init(disp: vscode.Disposable) {}

    public static provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        const formatter = new Formatter3(document);

        return [...formatter.format()];
    }

    private format(): vscode.TextEdit[] {
        const res: vscode.TextEdit[] = [];

        try {
            let groupWorker: (RegExpData & { line: vscode.TextLine })[] = [];

            for (let i = 0; i < this.document.lineCount; i++) {
                const data = this.regexFor(i);

                if (!data.groupMember && groupWorker.length > 0) {
                    res.push(
                        ...Formatter3.updateAssignmentGroup(
                            groupWorker[0].regex,
                            groupWorker.map((x) => {
                                return x.line;
                            }),
                            { tablength: groupWorker[0].tablen },
                        ),
                    );
                    groupWorker = [];
                }
                if (data.groupMember) {
                    groupWorker.push({ ...data, line: this.document.lineAt(i) });
                } else {
                    res.push(...Formatter3.update(data.regex, this.document.lineAt(i), { tablength: data.tablen }));
                }
            }

            return res;
        } catch (err) {
            return res;
        }
    }

    public regexFor(line: number): RegExpData {
        //   if (Compiler.tokenSelect(lineScope, [dotnugg.parser.semanticTokens.ItemOpen, dotnugg.parser.semanticTokens.CollectionOpen])) {
        //       Logger.out(lineScope);
        //   }
        switch (true) {
            // zero tab footers
            case this.parser.checkScopesOnLine(line, [
                dotnugg.parser.semanticTokens.ItemOpen,
                dotnugg.parser.semanticTokens.CollectionOpen,
            ]):
                return { regex: REGEX.HEADER, tablen: 0, groupMember: false };
            // zero tab footers
            case this.parser.checkScopesOnLine(line, [
                dotnugg.parser.semanticTokens.ItemClose,
                dotnugg.parser.semanticTokens.CollectionClose,
            ]):
                return { regex: REGEX.FOOTER, tablen: 0, groupMember: false };
            // one tab headers
            case this.parser.checkScopesOnLine(line, [
                dotnugg.parser.semanticTokens.ItemVersionsOpen,
                dotnugg.parser.semanticTokens.CollectionFeaturesOpen,
                dotnugg.parser.semanticTokens.GeneralColorsOpen,
            ]):
                return { regex: REGEX.HEADER, tablen: 1, groupMember: false };
            // one tab headers
            // one tab footers
            case this.parser.checkScopesOnLine(line, [
                dotnugg.parser.semanticTokens.ItemVersionsClose,
                dotnugg.parser.semanticTokens.CollectionFeaturesClose,
                dotnugg.parser.semanticTokens.GeneralColorsClose,
            ]):
                return { regex: REGEX.FOOTER, tablen: 1, groupMember: false };
            // two tab headers
            case this.parser.checkScopesOnLine(line, [
                dotnugg.parser.semanticTokens.ItemVersionOpen,
                dotnugg.parser.semanticTokens.CollectionFeatureLongOpen,
            ]):
                return { regex: REGEX.HEADER, tablen: 2, groupMember: false };
            // two tab footers
            case this.parser.checkScopesOnLine(line, [
                dotnugg.parser.semanticTokens.ItemVersionClose,
                dotnugg.parser.semanticTokens.CollectionFeatureLongClose,
            ]):
                return { regex: REGEX.FOOTER, tablen: 2, groupMember: false };
            // two tab headers
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralDataOpen]) &&
                this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.Item]):
                return { regex: REGEX.HEADER, tablen: 3, groupMember: false };
            // two tab footers
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralDataClose]) &&
                this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.Item]):
                return { regex: REGEX.FOOTER, tablen: 3, groupMember: false };
            // three tab headers
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.ItemVersionDataOpen]):
                return { regex: REGEX.HEADER, tablen: 3, groupMember: false };
            // three tab footers
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.ItemVersionDataClose]):
                return { regex: REGEX.FOOTER, tablen: 3, groupMember: false };
            // two tab two arg
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralColor]):
                return { regex: REGEX.TWO_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // two tab three arg
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.CollectionFeature]):
                return { regex: REGEX.ONE_FOUR_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.CollectionFeatureLong]):
            //     return { regex: REGEX.ONE_FOUR_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // two tab three arg
            // case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.BaseFilter]):
            //     return { regex: REGEX.THREE_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // three tab two arg
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.CollectionFeatureLongZIndex]):
                return { regex: REGEX.ONE_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.ItemVersionAnchor]):
                return { regex: REGEX.TWO_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            // three tab 3 arg
            case this.parser.checkScopesOnLine(line, [
                dotnugg.parser.semanticTokens.ItemVersionRadii,
                dotnugg.parser.semanticTokens.GeneralReceiver,
            ]):
                return { regex: REGEX.THREE_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            case this.parser.checkScopesOnLine(line, [
                dotnugg.parser.semanticTokens.ItemVersionRadii,
                dotnugg.parser.semanticTokens.ItemVersionExpanders,
                dotnugg.parser.semanticTokens.CollectionFeatureLongExpandableAt,
            ]):
                return { regex: REGEX.FOUR_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            // three tab data content
            // case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralDataRow]) && this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.Base]):
            //     return { regex: REGEX.ANY_NONSPACE_WITH_TAB, tablen: 2, groupMember: false };
            // four tab data content
            case this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.GeneralDataRow]) &&
                this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.Item]):
                return { regex: REGEX.ANY_NONSPACE_WITH_TAB, tablen: 4, groupMember: false };
            default:
                //  if (this.parser.checkScopesOnLine(line, [dotnugg.parser.semanticTokens.ItemOpen, dotnugg.parser.semanticTokens.CollectionOpen])) {
                //  }

                //  Logger.out(lineScope);

                return { regex: REGEX.NIL, tablen: 0, groupMember: false };
        }
    }

    public static update(r: RegExp, line: vscode.TextLine, options?: { spaceNum?: number; tablength?: number }): vscode.TextEdit[] {
        //   try {

        const update = [];

        if (
            line.isEmptyOrWhitespace ||
            line.text.includes('radii := { r: 0, l: 0, u: 0, d: 0 }') ||
            line.text.includes('expanders := { r: 0, l: 0, u: 0, d: 0 }')
        ) {
            update.push(vscode.TextEdit.delete(line.rangeIncludingLineBreak));
            return update;
        }

        const regex = new RegExp(r);

        let reg: RegExpExecArray;
        do {
            reg = regex.exec(line.text);
            if (reg) {
                const indices = reg
                    ? ((reg as any).indices as string[][] & {
                          groups?: { [key in keyof typeof reg.groups]: number[] };
                          length?: number;
                      })
                    : undefined;
                if (indices) {
                    Object.keys(reg.groups).forEach((x) => {
                        if (x.startsWith('s')) {
                            update.push(
                                vscode.TextEdit.replace(
                                    new vscode.Range(
                                        new vscode.Position(line.lineNumber, indices.groups[x][0]),
                                        new vscode.Position(line.lineNumber, indices.groups[x][1]),
                                    ),
                                    Formatter3.defaults.s,
                                ),
                            );
                        } else if (x.startsWith('ns')) {
                            update.push(
                                vscode.TextEdit.replace(
                                    new vscode.Range(
                                        new vscode.Position(line.lineNumber, indices.groups[x][0]),
                                        new vscode.Position(line.lineNumber, indices.groups[x][1]),
                                    ),
                                    reg.groups[x].replaceAll(' ', ''),
                                ),
                            );
                        } else if (x.startsWith('n')) {
                            update.push(
                                vscode.TextEdit.replace(
                                    new vscode.Range(
                                        new vscode.Position(line.lineNumber, indices.groups[x][0]),
                                        new vscode.Position(line.lineNumber, indices.groups[x][1]),
                                    ),
                                    Formatter3.defaults.n,
                                ),
                            );
                        } else if (x.startsWith('t')) {
                            update.push(
                                vscode.TextEdit.replace(
                                    new vscode.Range(
                                        new vscode.Position(line.lineNumber, indices.groups[x][0]),
                                        new vscode.Position(line.lineNumber, indices.groups[x][1]),
                                    ),
                                    (options && options.tablength) || options.tablength === 0
                                        ? Formatter3.tabber(options.tablength)
                                        : Formatter3.tabber(0),
                                ),
                            );
                        } else if (x.startsWith('assignment_spacer')) {
                            update.push(
                                vscode.TextEdit.replace(
                                    new vscode.Range(
                                        new vscode.Position(line.lineNumber, indices.groups[x][0]),
                                        new vscode.Position(line.lineNumber, indices.groups[x][1]),
                                    ),
                                    options && options.spaceNum
                                        ? Formatter3.spacer(options.spaceNum - reg.groups.assignment.length)
                                        : Formatter3.defaults.s,
                                ),
                            );
                        } else {
                            //  Logger.out({ x });
                        }
                    });
                }

                return [...update];
            }
        } while (reg);

        return [];
        //   } catch (error) {
        //       Logger.log('error', error.message);
        //   }
    }

    public static getAssignmentSpacer(lines: vscode.TextLine[]) {
        let maxSpace = 0;
        lines.forEach((line) => {
            const regex = new RegExp(REGEX.ASSIGNMENT);
            const reg = regex.exec(line.text);
            if (reg) {
                if (maxSpace < reg.groups.assignment.length) {
                    maxSpace = reg.groups.assignment.length;
                }
            }
        });
        return maxSpace;
    }

    public static updateAssignmentGroup(r: RegExp, lines: vscode.TextLine[], options?: { tablength?: number }): vscode.TextEdit[] {
        const update = [];

        lines.forEach((line) => {
            update.push(
                ...Formatter3.update(r, line, {
                    ...(options ? options : {}),
                    spaceNum: Formatter3.getAssignmentSpacer(lines),
                }),
            );
        });

        return [...update];
    }

    public static spacer(len: number): string {
        return new Array(len).fill(0).reduce((prev) => {
            return prev + Formatter3.defaults.s;
        }, ' ');
    }

    public static tabber(len: number): string {
        if (len === 0) {
            return '';
        }
        return new Array(len).fill(0).reduce((prev) => {
            return prev + Formatter3.defaults.t;
        }, '');
    }
}
