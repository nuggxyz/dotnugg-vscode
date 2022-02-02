//@ts-check

'use strict';

const path = require('path');

// const webpack = require('webpack');

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'webworker',

    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]',
        publicPath: 'dist/',
        // wasmLoading: 'fetch',
    },
    devtool: 'source-map',
    externals: {
        fs: 'commonjs fs',
        util: 'commonjs util',
        vscode: 'commonjs vscode',
    },

    resolve: {
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.ts', '.js', '.wasm'],
        alias: {},
        fallback: {
            path: require.resolve('path-browserify'),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                // exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
            {
                test: /\.wasm$/,
                type: 'javascript/auto',
                loader: 'arraybuffer-loader',
            },
        ],
    },
    node: {
        __dirname: true,
    },
};
module.exports = config;
