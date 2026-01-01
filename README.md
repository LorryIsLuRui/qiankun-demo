# qiankun-demo
qiankun webpack mf typescript javascript
使用webpack ModuleFederationPlugin + react+qiankun搭建微应用结构，with-lerna分支版本使用lerna管理多个子应用的升级发布
1. npm的workspaces实现子包依赖安装到根目录的link
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

# 线上部署
1. 初始版本
2. 自动化部署


# TODO:
1. 集成一个创建子应用的cli
2. 子应用间通信？模块联邦？
3. qiankun工作原理？lerna？模块联邦
4. （Y）还原高版本后，再试试（还原高版本后，也可以跑通utils、components模块作为共享资源）
5. 构建部署上线


# 问题记录
1. 使用webpack的module federation作为资源通信的方式，会有如下问题
- 资源共享的模块如通用utils、components包，不应该作为qiankun子应用在bootstrap register，仅仅是模块联邦应用

2. (❌) qiankun启动调用start时应该start({ sandbox: false });否则会报miss script错误
原因：sandbox=true时：shop子应用启动，有代理window_1,调用的utils components注册在window_1，webpack runtime执行下面的代码就会报错：

    ```
        const container = window["utils"]; // 👈 直接从全局 window 获取容器
        await container.init(__webpack_share_scopes__.default);
        const factory = await container.get("./index");
        const module = factory();
    ```
    最优解决方案：提前在基座上加载utils components，子应用不再加载，直接调引用。 https://chatgpt.com/s/t_69158c3bbf908191a466469f7bb9dd4f

3. qiankun+moduleFederationPlugin架构中，将模块联邦应用的library.type设置为window/umd，就可以搭配qiankun的沙箱机制运行
原因：var 声明永远不会变成 proxyWindow.xxx，因为 with(proxyWindow) 只能影响“查找”，不能影响“var 的声明归属”。所以使用var导致proxyWindow和真实window上都找不到。
qiankun内源码：
```
    with (proxyWindow) {
        var utils = {...}
    }
```


# 服务器相关
项目路径：/www/wwwroot/microfrontend/main/
密钥：~/.ssh
nginx配置：/www/server/panel/vhost/nginx/microfrontend.conf
页面访问：http://211.159.158.196/microfrontend/main/
SERVER_HOST: 211.159.158.196





