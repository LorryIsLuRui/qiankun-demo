const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './index.js'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'app.js',
    publicPath: '//localhost:8081',  // 微应用自身地址
    library: 'react-app1',  // 需与注册时的 name 一致
    libraryTarget: 'umd',   // 暴露为 umd 模块
    chunkLoadingGlobal: `webpackJsonp_react_app1`  // 避免 chunk 冲突
  },
  devServer: {
    port: 8081,
    headers: {
      'Access-Control-Allow-Origin': '*'  // 允许主应用跨域访问
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html')
    })
  ]
};