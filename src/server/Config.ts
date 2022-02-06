import fs from 'fs';

import { dotnugg } from '@nuggxyz/dotnugg-sdk';
import { Collection } from '@nuggxyz/dotnugg-sdk/dist/builder/types/TransformTypes';

export class Config {
    public static readonly EMPTY_CONFIG = { rules: {} };

    private static ideRules: any;
    private static fileConfig: any;
    private static currentWatchFile: string;

    public static collection: Collection;

    public static get collectionFeatureKeys() {
        return Object.keys(this.collection.features);
    }

    public static init(rootPath: string, ideRules: any) {
        this.loadFileConfig(rootPath);
        this.setIdeRules(ideRules);
    }

    public static setIdeRules(rules: any) {
        this.ideRules = rules || {};
    }

    private static readFileConfig(filePath: string) {
        console.log(fs.existsSync(filePath));
        if (fs.existsSync(filePath)) {
            const parser = dotnugg.parser.parsePath(filePath);
            this.collection = dotnugg.builder.transform.fromParser(parser).input.collection;
        }
    }

    public static isRootPathSet(rootPath: string): boolean {
        return typeof rootPath !== 'undefined' && rootPath !== null;
    }

    public static loadFileConfig(rootPath: string) {
        if (this.isRootPathSet(rootPath)) {
            const filePath = `${rootPath}/items/main.collection.nugg`;
            const readConfig = this.readFileConfig.bind(this, filePath);

            readConfig();
            this.currentWatchFile = filePath;
        } else {
            this.fileConfig = Config.EMPTY_CONFIG;
        }
    }
}
