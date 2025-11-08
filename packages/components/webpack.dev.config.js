const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require('webpack').container;
const { name } = require('./package.json');
const COMPONENTS_PORT = 8083;

module.exports = {
    mode: 'development',
    entry: {
        app: './src/index.js',
    },
    output: {
        filename: '[name].[contenthash].js',
        publicPath: `http://localhost:${COMPONENTS_PORT}/`,
        path: path.resolve(__dirname, 'dist'),
        library: `${name}-[name]`,
        libraryTarget: 'umd',
        chunkLoadingGlobal: `webpackJsonp_${name}`,
        globalObject: 'window',
        // library: { type: 'var', name: 'components' },
        // filename: '[name].js',
        // umdNamedDefine: true,
    },
    plugins: [
        new ModuleFederationPlugin({
            name: 'components',
            library: { type: "var", name: "components" },
            filename: 'componentsEntry.js',
            exposes: {
                './Header': './src/header/Header.jsx',
            },
            shared: {
                react: { singleton: true, eager: true, requiredVersion: '^19.2.0'},
                'react-dom': { singleton: true, eager: true, requiredVersion: '^19.2.0',  },
            },
        }),
        new HtmlWebpackPlugin({
            template: "./public/index.html",
            chunks: ['components','app'],
            chunksSortMode: "manual"
        }),
    ],
    devServer: {
        // static: './dist',
        port: COMPONENTS_PORT,
        // historyApiFallback: true,
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