/* eslint-disable prefer-const */
import * as fs from 'fs';

import * as oniguruma from 'vscode-oniguruma';
import * as vsctm from 'vscode-textmate';
import * as plist from 'plist';

const path = require('path');

// Create a registry that can create a grammar from a scope name.
const registry = (projPath: string) =>
    new vsctm.Registry({
        onigLib: Promise.resolve({
            createOnigScanner: (sources) => new oniguruma.OnigScanner(sources),
            createOnigString: (str) => new oniguruma.OnigString(str),
        }),
        loadGrammar: async () => {
            const wasm = fs.readFileSync(path.join(projPath, 'constants/onig.wasm')).buffer;

            await oniguruma.loadWASM(wasm).then(() => {
                return {
                    createOnigScanner(patterns: string[]) {
                        return new oniguruma.OnigScanner(patterns);
                    },
                    createOnigString(s: string) {
                        return new oniguruma.OnigString(s);
                    },
                };
            });

            return readJSON2plist(path.join(projPath, '../syntaxes', 'dotnugg.tmLanguage.json'))
                .then((data) => {
                    return vsctm.parseRawGrammar(data);
                })
                .catch((e) => {
                    throw new Error(e);
                });
        },
    });

/**
 * Read a json file and convert to plist as a promise
 */
function readJSON2plist(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, (error, data) => {
            if (error) {
                reject(error);
            } else {
                const js_g = data.toString();
                const pl_g = plist.build(JSON.parse(js_g));
                resolve(pl_g);
            }
        });
    });
}

export class Parser {
    /**
     * Utility to read a file as a promise
     */

    public static collection: NL.DotNugg.Collection;
    public static bases: NL.DotNugg.Base[] = [];
    public static attrs: NL.DotNugg.Attribute[] = [];

    static _grammer: vsctm.IGrammar;
    static _registry: vsctm.Registry;

    static async init(extensionPath: string) {
        Parser._registry = registry(extensionPath);

        Parser._grammer = await Parser._registry.loadGrammar('source.dotnugg');
    }

    static async reinit() {
        Parser._grammer = await Parser.registry.loadGrammar('source.dotnugg');
        return Parser._grammer;
    }

    static get registry() {
        return Parser._registry;
    }

    static get grammer() {
        return Parser._grammer;
    }
}
