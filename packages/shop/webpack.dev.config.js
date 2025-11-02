const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { library } = require('webpack');
const packageName = require('./package.json').name;
const SHOP_PORT = 8081;

module.exports = {
    mode: 'development',
    entry: {
        shop: './lib/shop.js',
    },
    output: {
        // filename: '[name].bundle.js',
        // clean: true,
        path: path.resolve(__dirname, 'dist'),
        library: { type: 'umd', name: 'shop' },
        libraryTarget: 'umd',
        filename: '[name].js',
        globalObject: 'this',  // 解决浏览器/Node 环境下的全局对象冲突
        umdNamedDefine: true,
        // jsonpFunction: `webpackJsonp_${packageName}`,
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Development Qiankun Demo',
            template: path.resolve(__dirname, './public/index.html'),
        })
    ],
    optimization: {
        // was added because in this example we have more than one entrypoint on a single HTML page. 
        // Without this, we could get into trouble described here. Read the Code Splitting chapter for more details.
        runtimeChunk: 'single',
    },
    devServer: {
        static: './dist',
        port: SHOP_PORT,
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
                    // Babel 配置直接写在这里
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