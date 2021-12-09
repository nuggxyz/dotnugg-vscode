import * as vscode from 'vscode';

import { REGEX } from '../constants/regex';
import tokens from '../constants/tokens';
import { dotnugg } from '../../../dotnugg-sdk/src';

type RegExpData = { regex: RegExp; tablen: number; groupMember: boolean };

export class Formatter3 {
    public static _instance: vscode.Disposable;

    public compiler: dotnugg.compile.Compiler;

    public document: vscode.TextDocument;

    constructor(document: vscode.TextDocument) {
        this.compiler = dotnugg.compile.Compiler.parseData(document.getText());
        this.document = document;
    }

    public static defaults = {
        t: '    ',
        s: ' ',
        n: '',
    };

    public static init() {
        Formatter3._instance = vscode.languages.registerDocumentFormattingEditProvider('dotnugg', {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                const formatter = new Formatter3(document);

                return [...formatter.format()];
            },
        });
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
        //   if (Compiler.tokenSelect(lineScope, [tokens.ItemOpen, tokens.CollectionOpen])) {
        //       Logger.out(lineScope);
        //   }
        switch (true) {
            // zero tab footers
            case this.compiler.parser.checkScopesOnLine(line, [tokens.ItemOpen, tokens.CollectionOpen]):
                return { regex: REGEX.HEADER, tablen: 0, groupMember: false };
            // zero tab footers
            case this.compiler.parser.checkScopesOnLine(line, [tokens.ItemClose, tokens.CollectionClose]):
                return { regex: REGEX.FOOTER, tablen: 0, groupMember: false };
            // one tab headers
            case this.compiler.parser.checkScopesOnLine(line, [
                tokens.ItemVersionsOpen,
                tokens.CollectionFeaturesOpen,
                tokens.GeneralColorsOpen,
            ]):
                return { regex: REGEX.HEADER, tablen: 1, groupMember: false };
            // one tab headers
            // one tab footers
            case this.compiler.parser.checkScopesOnLine(line, [
                tokens.ItemVersionsClose,
                tokens.CollectionFeaturesClose,
                tokens.GeneralColorsClose,
            ]):
                return { regex: REGEX.FOOTER, tablen: 1, groupMember: false };
            // two tab headers
            case this.compiler.parser.checkScopesOnLine(line, [tokens.ItemVersionOpen, tokens.CollectionFeatureLongOpen]):
                return { regex: REGEX.HEADER, tablen: 2, groupMember: false };
            // two tab footers
            case this.compiler.parser.checkScopesOnLine(line, [tokens.ItemVersionClose, tokens.CollectionFeatureLongClose]):
                return { regex: REGEX.FOOTER, tablen: 2, groupMember: false };
            // two tab headers
            case this.compiler.parser.checkScopesOnLine(line, [tokens.GeneralDataOpen]) &&
                this.compiler.parser.checkScopesOnLine(line, [tokens.Item]):
                return { regex: REGEX.HEADER, tablen: 3, groupMember: false };
            // two tab footers
            case this.compiler.parser.checkScopesOnLine(line, [tokens.GeneralDataClose]) &&
                this.compiler.parser.checkScopesOnLine(line, [tokens.Item]):
                return { regex: REGEX.FOOTER, tablen: 3, groupMember: false };
            // three tab headers
            case this.compiler.parser.checkScopesOnLine(line, [tokens.ItemVersionDataOpen]):
                return { regex: REGEX.HEADER, tablen: 3, groupMember: false };
            // three tab footers
            case this.compiler.parser.checkScopesOnLine(line, [tokens.ItemVersionDataClose]):
                return { regex: REGEX.FOOTER, tablen: 3, groupMember: false };
            // two tab two arg
            case this.compiler.parser.checkScopesOnLine(line, [tokens.GeneralColor]):
                return { regex: REGEX.TWO_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // two tab three arg
            case this.compiler.parser.checkScopesOnLine(line, [tokens.CollectionFeature]):
                return { regex: REGEX.ONE_FOUR_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // case this.compiler.parser.checkScopesOnLine(line, [tokens.CollectionFeatureLong]):
            //     return { regex: REGEX.ONE_FOUR_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // two tab three arg
            // case this.compiler.parser.checkScopesOnLine(line, [tokens.BaseFilter]):
            //     return { regex: REGEX.THREE_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // three tab two arg
            case this.compiler.parser.checkScopesOnLine(line, [tokens.CollectionFeatureLongZIndex]):
                return { regex: REGEX.ONE_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            case this.compiler.parser.checkScopesOnLine(line, [tokens.ItemVersionAnchor]):
                return { regex: REGEX.TWO_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            // three tab 3 arg
            case this.compiler.parser.checkScopesOnLine(line, [tokens.ItemVersionRadii, tokens.GeneralReceiver]):
                return { regex: REGEX.THREE_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            case this.compiler.parser.checkScopesOnLine(line, [
                tokens.ItemVersionRadii,
                tokens.ItemVersionExpanders,
                tokens.CollectionFeatureLongExpandableAt,
            ]):
                return { regex: REGEX.FOUR_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            // three tab data content
            // case this.compiler.parser.checkScopesOnLine(line, [tokens.GeneralDataRow]) && this.compiler.parser.checkScopesOnLine(line, [tokens.Base]):
            //     return { regex: REGEX.ANY_NONSPACE_WITH_TAB, tablen: 2, groupMember: false };
            // four tab data content
            case this.compiler.parser.checkScopesOnLine(line, [tokens.GeneralDataRow]) &&
                this.compiler.parser.checkScopesOnLine(line, [tokens.Item]):
                return { regex: REGEX.ANY_NONSPACE_WITH_TAB, tablen: 4, groupMember: false };
            default:
                //  if (this.compiler.parser.checkScopesOnLine(line, [tokens.ItemOpen, tokens.CollectionOpen])) {
                //  }

                //  Logger.out(lineScope);

                return { regex: REGEX.NIL, tablen: 0, groupMember: false };
        }
    }

    public static update(r: RegExp, line: vscode.TextLine, options?: { spaceNum?: number; tablength?: number }): vscode.TextEdit[] {
        //   try {
        const update = [];
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
