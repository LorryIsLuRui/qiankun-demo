require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const { ModuleFederationPlugin } = require('webpack').container;
const { name } = require('./package.json');
const path = require('path');

const SHOP_PORT = 8084;
const devPublicPath = `${process.env.PUBLIC_PATH}:${SHOP_PORT}/`;
const prefix = '/microfrontend/';
const onlinePublicPath = `${prefix}shop/`;
const isDev = process.env.NODE_ENV === 'development';
const isAnalyze = process.env.analyze === 'analyze';
const clsPrefix = 'shop-app';

const smp = new SpeedMeasurePlugin();
const config = {
    mode: `${process.env.NODE_ENV || 'development'}`,
    entry: `./lib/${name}.js`,
    output: {
        publicPath: isDev ? devPublicPath : onlinePublicPath,
        path: path.resolve(__dirname, 'dist'),
        library: `${name}-[name]`,
        filename: 'assets/[name].[contenthash].js', // 入口模块 + 同步依赖模块（初始加载的核心代码）。
        chunkFilename: 'assets/[name].[contenthash].js', // 异步依赖模块（按需加载的代码）。
        libraryTarget: 'umd',
        chunkLoadingGlobal: `webpackJsonp_${name}`,
        clean: true,
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
            name,
            remotes: {
                utils: `utils@${process.env.PUBLIC_PATH}${isDev ? ':8082' : prefix + 'utils'}/remoteEntry.js`,
                components: `components@${process.env.PUBLIC_PATH}${isDev ? ':8083' : prefix + 'components'}/remoteEntry.js`,
            },
            shared: {
                react: {
                    // singleton pattern 确保所有微前端子应用和主应用使用同一个 React 实例，避免版本冲突和重复加载。
                    singleton: true,
                    // 默认false，库提取成单独的异步 chunk，入口文件不能直接import这些库
                    // true, 将其直接打入主入口文件bundle中, 
                    eager: false,
                    requiredVersion: '^19.2.0',
                    // 确保在不同的模块联邦实例之间共享相同版本的 React。
                    shareScope: 'default'
                },
                'react-dom': {
                    singleton: true,
                    eager: false,
                    requiredVersion: '^19.2.0',
                    shareScope: 'default'
                },
            }
        }),
        isAnalyze && (
            new BundleAnalyzerPlugin({
                analyzerMode: 'static', // 生成静态 HTML 文件
                openAnalyzer: false,   // 不自动打开报告页面
                reportFilename: 'bundle-report.html', // 报告文件名
            })
        )
    ].filter(Boolean),
    optimization: {
        // was added because in this example we have more than one entrypoint on a single HTML page. 
        // Without this, we could get into trouble described here. Read the Code Splitting chapter for more details.
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: `${name}-vendors`,
                    chunks: 'all', // 提取第三方库，它们通常不怎么变，利于强缓存
                },
            },
        }
    },
    devServer: {
        static: './dist',
        port: SHOP_PORT,
        historyApiFallback: true,
        headers: {
            'Access-Control-Allow-Origin': '*'  // 允许主应用跨域访问
        }
    },
    // extensions 用于在引入模块时省略文件后缀名，例如 import MyComponent from './MyComponent'，webpack 会依次尝试添加 .js 和 .jsx 后缀进行解析。
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
    stats: {
        preset: 'normal',
        timings: true
    },
    performance: {
        hints: 'warning',
        maxAssetSize: 500000, // 500kb
        maxEntrypointSize: 500000,
    }
};
module.exports = smp.wrap(config);