require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const { name } = require('./package.json');
const path = require('path');

const SHOP_PORT = 8081;
const devPublicPath = `${process.env.PUBLIC_PATH}:${SHOP_PORT}/`;
const prefix = '/microfrontend/';
const onlinePublicPath = `${prefix}shop/`;
const isDev = process.env.NODE_ENV === 'development';
const clsPrefix = 'shop-app';

module.exports = {
    mode: `${process.env.NODE_ENV}`,
    entry: {
        shop: './lib/shop.js',
    },
    output: {
        publicPath: isDev ? devPublicPath :  onlinePublicPath,
        path: path.resolve(__dirname, 'dist'),
        library: `${name}-[name]`,
        filename: 'assets/[name].[contenthash].js', // 入口模块 + 同步依赖模块（初始加载的核心代码）。
        chunkFilename: 'assets/[name].[contenthash].js', // 异步依赖模块（按需加载的代码）。
        libraryTarget: 'umd',
        chunkLoadingGlobal: `webpackJsonp_${name}`,
    },
    plugins: [
        new Dotenv({
            path: `./.env.${process.env.NODE_ENV}`,
            systemvars: true, // 允许读取系统环境变量
            silent: true,     // 没找到文件时打印 warning
        }),
        new HtmlWebpackPlugin({
            title: 'Development Qiankun Demo',
            template: path.resolve(__dirname, './public/index.html'),
        }),
        new ModuleFederationPlugin({
            name: 'shop',
            remotes: {
                utils: `utils@${process.env.PUBLIC_PATH}${isDev ? ':8082' : prefix + 'utils'}/remoteEntry.js`,
                components: `components@${process.env.PUBLIC_PATH}${isDev ? ':8083' : prefix + 'components'}/remoteEntry.js`,
            },
            shared: {
                react: { singleton: true, eager: true, requiredVersion: '^19.2.0', shareScope: 'default' },
                'react-dom': { singleton: true, eager: true, requiredVersion: '^19.2.0', shareScope: 'default' },
            }
        }),
    ],
    optimization: {
        // was added because in this example we have more than one entrypoint on a single HTML page. 
        // Without this, we could get into trouble described here. Read the Code Splitting chapter for more details.
        runtimeChunk: 'single'
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
                test: /\.less$/i,
                use: ['style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 2, // 允许在 CSS 中通过 @import 引入的文件也能被后面的 loader 处理
                        }
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    require("postcss-prefix-selector")({
                                        prefix: `.${clsPrefix}`
                                    })
                                ]
                            }
                        },
                    },
                    'less-loader'
                ],
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