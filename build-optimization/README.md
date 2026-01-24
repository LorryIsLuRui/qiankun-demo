# qiankun-demo 冷启动性能分析指南

> 完整的性能分析和优化工作流，专为 qiankun + Module Federation 微前端架构设计

## 🎯 目标

分析并优化 qiankun-demo 的冷启动性能，包括：
- 主应用加载时间
- 子应用激活时间
- Module Federation 远程模块加载
- 整体用户体验指标 (FCP, LCP, TTI)

## 📚 文档导航

1. [性能指标收集](./1-performance-metrics.md) - 使用浏览器 API 和自定义埋点收集数据
2. [Webpack 构建分析](./2-webpack-analysis.md) - 分析 bundle 大小、依赖关系和构建性能
3. [浏览器开发者工具](./3-browser-devtools.md) - 使用 Chrome DevTools 深度分析
4. [qiankun 特定优化](./4-qiankun-optimization.md) - 预加载、沙箱等配置优化
5. [Module Federation 优化](./5-module-federation-optimization.md) - shared、eager 等配置优化
6. [性能基准线](./6-benchmark.md) - 建立和跟踪性能指标
7. [完整执行流程](./7-execution-workflow.md) - 按步骤执行的完整分析流程

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install --save-dev \
  webpack-bundle-analyzer \
  speed-measure-webpack-plugin \
  lighthouse \
  chrome-launcher \
  web-vitals
```

### 2. 运行性能分析

```bash
# 启动所有服务
npm run start

# 生成 bundle 分析报告（已配置）
cd packages/shop
npm run analyze

# 运行自动化性能测试
node build-optimization/scripts/perf-analysis.js
```

### 3. 查看报告

- Bundle 报告: `packages/*/dist/bundle-report.html`
- Lighthouse 报告: `lighthouse-report.html`
- 性能数据: 浏览器控制台

## 📊 当前架构概览

```
主应用 (main:8080)
  ├─ qiankun 框架
  ├─ Redux store (共享)
  └─ Module Federation 消费者
      ├─ utils (8082) - 工具函数库
      └─ components (8083) - 共享组件库

子应用 (shop:8081)
  ├─ qiankun 子应用
  ├─ Module Federation 消费者
  │   ├─ utils
  │   └─ components
  └─ Redux slice (动态注入)
```

## 🔍 关键性能点

基于当前架构，重点关注：

1. **Module Federation remoteEntry.js 加载**
   - utils/remoteEntry.js
   - components/remoteEntry.js
   - 是否并行加载？是否有重复？

2. **qiankun 子应用启动**
   - shop 应用的 bootstrap/mount 耗时
   - Redux reducer 动态注入耗时

3. **React 共享策略**
   - singleton 是否生效？
   - eager vs lazy 加载影响

4. **沙箱开销**
   - experimentalStyleIsolation 性能影响
   - excludeAssetFilter 配置是否正确

## 📈 优化检查清单

- [ ] 生成并分析 webpack bundle 报告
- [ ] 添加性能埋点到关键路径
- [ ] 使用 Chrome DevTools Performance 录制冷启动
- [ ] 分析 Network waterfall 找出串行加载
- [ ] 测试不同 prefetch 策略
- [ ] 测试不同 shared eager 配置
- [ ] 优化 remoteEntry.js 预加载
- [ ] 建立性能基准线和监控
- [ ] 实施优化并对比数据

## 📂 文件组织

```
build-optimization/
├── README.md                              # 本文件 - 总览和快速开始
├── 1-performance-metrics.md               # 性能指标收集方法
├── 2-webpack-analysis.md                  # Webpack 构建分析
├── 3-browser-devtools.md                  # Chrome DevTools 使用
├── 4-qiankun-optimization.md              # qiankun 优化策略
├── 5-module-federation-optimization.md    # Module Federation 优化
├── 6-benchmark.md                         # 性能基准线
├── 7-execution-workflow.md                # 完整执行流程
├── scripts/
│   ├── perf-analysis.js                  # 自动化 Lighthouse 分析
│   ├── collect-metrics.js                # 收集浏览器性能指标
│   └── analyze-all.sh                    # 批量分析所有应用
└── examples/
    ├── main-with-perf.js                 # 主应用性能监控示例
    ├── shop-lifecycle-perf.js            # shop 生命周期性能监控
    └── web-vitals-integration.js         # Web Vitals 集成示例
```

## 📞 相关资源

- [qiankun 官方文档](https://qiankun.umijs.org/)
- [Module Federation 文档](https://webpack.js.org/concepts/module-federation/)
- [Web Vitals](https://web.dev/vitals/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**开始分析**: 从 [性能指标收集](./1-performance-metrics.md) 开始你的优化之旅！
