const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require('webpack').container;
const { name } = require('./package.json');
const UTILS_PORT = 8082;

module.exports = {
    mode: 'development',
    entry: {
        app: './lib/index.js',
    },
    output: {
        publicPath: `http://localhost:${UTILS_PORT}/`,
        path: path.resolve(__dirname, 'dist'),
        library: { type: 'window', name: 'utils' },
        chunkLoadingGlobal: `webpackJsonp_${name}`,
        // libraryTarget: 'window',
        // filename: '[name].js',
        // globalObject: 'this',  // 解决浏览器/Node 环境下的全局对象冲突
        // umdNamedDefine: true,
    },
    plugins: [
        new ModuleFederationPlugin({
            name: 'utils',
            filename: 'utilsEntry.js',
            exposes: {
                './index': './lib/utils.js',
            },
            shared: {
                react: { singleton: true, eager: true, requiredVersion: '^19.2.0', shareScope: 'default' },
                'react-dom': { singleton: true, eager: true, requiredVersion: '^19.2.0', shareScope: 'default' },
            },
        }),
        new HtmlWebpackPlugin({
            template: "./public/index.html",
            chunks: ['utils', 'app'],
            chunksSortMode: "manual"
        }),
    ],
    devServer: {
        static: './dist',
        port: UTILS_PORT,
        historyApiFallback: true,
        headers: {
            'Access-Control-Allow-Origin': '*'  // 允许主应用跨域访问
        }
    },
    resolve: { extensions: ['.js', '.jsx'] },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(js|jsx)$/,  // 同时匹配 js 和 jsx 文件
                exclude: /node_modules/,  // 排除第三方依赖
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            // 1. 处理 ES6+ 语法
                            ['@babel/preset-env', {
                                targets: 'last 2 versions, > 0.2%', // 兼容目标浏览器
                                useBuiltIns: 'usage', // 自动引入 polyfill
                                corejs: 3 // 配合 useBuiltIns 使用
                            }],
                            // 2. 处理 React JSX
                            ['@babel/preset-react', {
                                runtime: 'automatic' // 自动导入 React（无需手动写 import React from 'react'）
                            }]
                        ]
                    }
                }
            },
        ],
    },
};