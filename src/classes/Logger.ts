import * as vscode from 'vscode';

class Logger {
    static _config: { debug: any; debugToChannel: any };
    static get config() {
        //debug
        if (Logger._config === undefined) {
            Logger._config = {
                debug: vscode.workspace.getConfiguration().get('VBI.debug'),
                debugToChannel: vscode.workspace.getConfiguration().get('VBI.debugToChannel'), //Instead into dev-tools-console
            };
        }

        return Logger._config;
    }

    static _info: vscode.OutputChannel;

    /**
     * @param cat Type String --> define Cathegory [info,warn,error]
     * @param o   Rest Parameter, Type Any --> Data to Log
     */
    static get info() {
        if (Logger._info === undefined) {
            Logger._info = vscode.window.createOutputChannel('DotNugg');
        }
        return Logger._info;
    }
    static out(...o: any) {
        Logger.log('other', JSON.stringify(o, null, 4));
    }
    static out2(o: any) {
        Logger.log('error', JSON.stringify(o, null, 4));
    }
    static log(cat: 'info' | 'warn' | 'error' | 'other', ...o: any) {
        function mapObject(obj: any) {
            switch (typeof obj) {
                case 'undefined':
                    return 'undefined';

                case 'string':
                    return obj;

                case 'number':
                    return obj.toString();

                case 'object':
                    let ret: string = '';
                    for (const [key, value] of Object.entries(obj)) {
                        ret += `${key}: ${value}\n`;
                    }
                    return ret;

                default:
                    return obj; //function,symbol,boolean
            }
        }

        // if (this.config.debug) {
        //     if (this.config.debugToChannel) {
        switch (cat.toLowerCase()) {
            case 'info':
                this.info.appendLine('INFO:');
                o.map((args: any) => {
                    this.info.appendLine('' + mapObject(args));
                });
                // this.info.show();
                return;

            case 'warn':
                this.info.appendLine('WARN:');
                o.map((args: any) => {
                    this.info.appendLine('' + mapObject(args));
                });
                // this.info.show();
                return;

            case 'error':
                let err: string = '';
                this.info.appendLine('ERROR: ');
                //err += mapObject(cat) + ": \r\n";
                o.map((args: any) => {
                    err += mapObject(args);
                });
                this.info.appendLine(err);
                vscode.window.showErrorMessage(err); //.replace(/(\r\n|\n|\r)/gm,"")
                // this.info.show();
                return;

            default:
                this.info.appendLine('INFO-Other:');
                this.info.appendLine(mapObject(cat));
                o.map((args: any) => {
                    this.info.appendLine('' + mapObject(args));
                });
            // this.info.show();
        }
        // } else {
        //     switch (cat.toLowerCase()) {
        //         case 'info':
        //             console.log('INFO:', o);
        //             return;
        //         case 'warn':
        //             console.log('WARNING:', o);
        //             return;
        //         case 'error':
        //             console.log('ERROR:', o);
        //             return;
        //         default:
        //             console.log('log:', cat, o);
        //     }
        // }
    }
}
export default Logger;
