import * as vscode from 'vscode';

import { REGEX } from '../constants/regex';
import tokens from '../constants/tokens';

import { Compiler } from './Compiler';
import Logger from './Logger';

type RegExpData = { regex: RegExp; tablen: number; groupMember: boolean };

export class Formatter3 {
    public _instance: vscode.Disposable;

    public static defaults = {
        t: '    ',
        s: ' ',
        n: '',
    };

    public static init() {
        const hold = new Formatter3();
        hold._instance = vscode.languages.registerDocumentFormattingEditProvider('dotnugg', {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                const comp = Compiler.init(document);

                return [...hold.format(comp)];
            },
        });
        return hold;
    }

    private format(comp: Compiler): vscode.TextEdit[] {
        try {
            const res: vscode.TextEdit[] = [];
            let groupWorker: (RegExpData & { line: vscode.TextLine })[] = [];

            for (let i = 0; i < comp.document.lineCount; i++) {
                const data = Formatter3.regexFor(comp.linescopes[i]);

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
                    groupWorker.push({ ...data, line: comp.document.lineAt(i) });
                } else {
                    res.push(...Formatter3.update(data.regex, comp.document.lineAt(i), { tablength: data.tablen }));
                }
            }

            return res;
        } catch (err) {
            Logger.log('error', JSON.stringify(err));
        }
    }

    public static regexFor(lineScope: string[]): RegExpData {
        switch (true) {
            // zero tab footers
            case Compiler.tokenSelect(lineScope, [tokens.AttributeOpen, tokens.BaseOpen, tokens.CollectionOpen]):
                return { regex: REGEX.HEADER, tablen: 0, groupMember: false };
            // zero tab footers
            case Compiler.tokenSelect(lineScope, [tokens.AttributeClose, tokens.BaseClose, tokens.CollectionClose]):
                return { regex: REGEX.FOOTER, tablen: 0, groupMember: false };
            // one tab headers
            case (Compiler.tokenSelect(lineScope, [tokens.GeneralColorsOpen, tokens.GeneralFiltersOpen, tokens.GeneralDataOpen]) &&
                Compiler.tokenSelect(lineScope, [tokens.Collection, tokens.Base])) ||
                Compiler.tokenSelect(lineScope, [tokens.AttributeVersionsOpen, tokens.CollectionFeaturesOpen]):
                return { regex: REGEX.HEADER, tablen: 1, groupMember: false };
            // one tab headers
            case Compiler.tokenSelect(lineScope, [tokens.GeneralColorsOpen]) && Compiler.tokenSelect(lineScope, [tokens.Attribute]):
                return { regex: REGEX.HEADER, tablen: 1, groupMember: false };
            case Compiler.tokenSelect(lineScope, [tokens.GeneralColorsClose]) && Compiler.tokenSelect(lineScope, [tokens.Attribute]):
                return { regex: REGEX.FOOTER, tablen: 1, groupMember: false };
            // one tab footers
            case (Compiler.tokenSelect(lineScope, [tokens.GeneralColorsClose, tokens.GeneralFiltersClose, tokens.GeneralDataClose]) &&
                Compiler.tokenSelect(lineScope, [tokens.Collection, tokens.Base])) ||
                Compiler.tokenSelect(lineScope, [tokens.AttributeVersionsClose, tokens.CollectionFeaturesClose]):
                return { regex: REGEX.FOOTER, tablen: 1, groupMember: false };
            // two tab headers
            case Compiler.tokenSelect(lineScope, [tokens.AttributeVersionOpen]):
                return { regex: REGEX.HEADER, tablen: 2, groupMember: false };
            // two tab footers
            case Compiler.tokenSelect(lineScope, [tokens.AttributeVersionClose]):
                return { regex: REGEX.FOOTER, tablen: 2, groupMember: false };
            // two tab headers
            case Compiler.tokenSelect(lineScope, [tokens.GeneralDataOpen]) && Compiler.tokenSelect(lineScope, [tokens.Attribute]):
                return { regex: REGEX.HEADER, tablen: 3, groupMember: false };
            // two tab footers
            case Compiler.tokenSelect(lineScope, [tokens.GeneralDataClose]) && Compiler.tokenSelect(lineScope, [tokens.Attribute]):
                return { regex: REGEX.FOOTER, tablen: 3, groupMember: false };
            // three tab headers
            case Compiler.tokenSelect(lineScope, [tokens.AttributeVersionDataOpen]):
                return { regex: REGEX.HEADER, tablen: 3, groupMember: false };
            // three tab footers
            case Compiler.tokenSelect(lineScope, [tokens.AttributeVersionDataClose]):
                return { regex: REGEX.FOOTER, tablen: 3, groupMember: false };
            // two tab two arg
            case Compiler.tokenSelect(lineScope, [tokens.GeneralColor, tokens.GeneralFilter]):
                return { regex: REGEX.TWO_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // two tab three arg
            case Compiler.tokenSelect(lineScope, [tokens.CollectionFeature]):
                return { regex: REGEX.ONE_ONE_FOUR_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // two tab three arg
            case Compiler.tokenSelect(lineScope, [tokens.BaseFilter]):
                return { regex: REGEX.THREE_ARG_ASSIGNMENT, tablen: 2, groupMember: true };
            // three tab two arg
            case Compiler.tokenSelect(lineScope, [tokens.AttributeVersionAnchor]):
                return { regex: REGEX.TWO_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            // three tab four arg
            case Compiler.tokenSelect(lineScope, [tokens.AttributeVersionRadii, tokens.AttributeVersionExpanders]):
                return { regex: REGEX.FOUR_ARG_ASSIGNMENT, tablen: 3, groupMember: false };
            // three tab data content
            case Compiler.tokenSelect(lineScope, [tokens.GeneralDataRow]) && Compiler.tokenSelect(lineScope, [tokens.Base]):
                return { regex: REGEX.ANY_NONSPACE_WITH_TAB, tablen: 2, groupMember: false };
            // four tab data content
            case Compiler.tokenSelect(lineScope, [tokens.GeneralDataRow]) && Compiler.tokenSelect(lineScope, [tokens.Attribute]):
                return { regex: REGEX.ANY_NONSPACE_WITH_TAB, tablen: 4, groupMember: false };
            default:
                return { regex: REGEX.NIL, tablen: 0, groupMember: false };
        }
    }

    public static update(r: RegExp, line: vscode.TextLine, options?: { spaceNum?: number; tablength?: number }): vscode.TextEdit[] {
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
                        }
                    });
                }

                return [...update];
            }
        } while (reg);

        return [];
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
