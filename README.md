# qiankun-demo
qiankun webpack typescript javascript
使用webpack+react+qiankun搭建微应用结构，使用lerna管理多个子应用的升级发布
1. 其中webpack.workspaces实现子包依赖安装到根目录的link
2. lerna run start --parallel替代lerna watch，同时运行多个包的 dev server
    ·lerna watch 的作用是监听文件变化后自动重启对应包任务（类似 nodemon），但在前端微应用里，webpack 自带的 watch 功能已经足够了，不需要额外层级。

# 新增子应用
根目录运行lerna create utils
## main更改
bootstrap新增子应用配置
## 子应用更改
1. 创建webpack.dev.config.js 改配置中的name
2. package.json的script增加 "start": "webpack serve --config webpack.dev.config.js --open"
3. 新建public/index.html
4. 新建life-cycles.js 导出三个钩子


# TODO:
1. 集成一个创建子应用的cli
2. 子应用间通信？模块联邦？

