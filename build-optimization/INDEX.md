# 📁 build-optimization 目录索引

快速定位和查找性能分析相关文档和工具。

## 📚 核心文档

| 文件 | 功能描述 | 关键内容 |
|------|---------|---------|
| **[README.md](./README.md)** | 总览和快速开始 | 项目架构、文档导航、优化检查清单 |
| **[1-performance-metrics.md](./1-performance-metrics.md)** | 性能指标收集 | Performance API、Web Vitals、qiankun/MF 指标 |
| **[2-webpack-analysis.md](./2-webpack-analysis.md)** | Webpack 构建分析 | Bundle Analyzer、stats 分析、代码分割 |
| **[3-browser-devtools.md](./3-browser-devtools.md)** | 浏览器开发者工具 | Performance、Network、Coverage、Lighthouse |
| **[4-qiankun-optimization.md](./4-qiankun-optimization.md)** | qiankun 特定优化 | prefetch 策略、沙箱配置、生命周期优化 |
| **[5-module-federation-optimization.md](./5-module-federation-optimization.md)** | Module Federation 优化 | shared 配置、eager 策略、library type |
| **[6-benchmark.md](./6-benchmark.md)** | 性能基准线 | 基准指标、数据收集、性能预算 |
| **[7-execution-workflow.md](./7-execution-workflow.md)** | **完整执行流程** ⭐ | **分阶段操作清单、时间分配、快速参考** |

## 🛠️ 脚本工具

| 文件 | 功能 | 使用方法 |
|------|------|---------|
| **[scripts/perf-analysis.js](./scripts/perf-analysis.js)** | 自动化 Lighthouse 分析 | `node build-optimization/scripts/perf-analysis.js` |
| **[scripts/collect-metrics.js](./scripts/collect-metrics.js)** | 浏览器性能指标收集 | 在浏览器控制台执行 `collectPerformanceMetrics()` |
| **[scripts/analyze-all.sh](./scripts/analyze-all.sh)** | 批量分析所有应用 bundle | `./build-optimization/scripts/analyze-all.sh` |

## 📝 代码示例

| 文件 | 功能 | 应用位置 |
|------|------|---------|
| **[examples/main-with-perf.js](./examples/main-with-perf.js)** | 主应用性能监控示例 | `packages/main/lib/main.js` |
| **[examples/shop-lifecycle-perf.js](./examples/shop-lifecycle-perf.js)** | shop 生命周期性能监控 | `packages/shop/lib/life-cycles.js` |
| **[examples/web-vitals-integration.js](./examples/web-vitals-integration.js)** | Web Vitals 集成示例 | `packages/main/lib/main.js` |

## 🚀 快速开始路径

### 第一次使用？从这里开始：

```
1. 阅读 README.md（5分钟）
   ↓
2. 执行 7-execution-workflow.md 的阶段1和阶段2（1小时）
   ↓
3. 根据结果查阅对应的优化文档
```

### 需要快速定位问题？

| 问题 | 查看文档 | 对应章节 |
|------|---------|---------|
| **Bundle 太大** | [2-webpack-analysis.md](./2-webpack-analysis.md) | 第2、4节 |
| **FCP/LCP 过慢** | [3-browser-devtools.md](./3-browser-devtools.md) | 第1、2节 |
| **子应用激活慢** | [4-qiankun-optimization.md](./4-qiankun-optimization.md) | 第1、3节 |
| **重复加载 React** | [5-module-federation-optimization.md](./5-module-federation-optimization.md) | 第1节 |
| **不知道从哪开始** | [7-execution-workflow.md](./7-execution-workflow.md) | 完整流程 |

## 🔧 常用命令速查

```bash
# 分析 shop 应用 bundle
cd packages/shop && npm run analyze

# 批量分析所有应用
./build-optimization/scripts/analyze-all.sh

# 运行 Lighthouse
node build-optimization/scripts/perf-analysis.js

# 启动所有服务
npm run start
```

## 📊 性能指标快速参考

| 指标 | 优秀 | 需改进 | 测量工具 |
|------|------|--------|---------|
| FCP | < 1.8s | > 3.0s | Lighthouse / Performance API |
| LCP | < 2.5s | > 4.0s | Lighthouse / Performance API |
| TTI | < 3.8s | > 7.3s | Lighthouse |
| TBT | < 200ms | > 600ms | Lighthouse |
| shop bootstrap | < 50ms | > 100ms | 性能埋点 |
| shop mount | < 500ms | > 800ms | 性能埋点 |
| Bundle 大小 | < 500KB | > 1MB | Bundle Analyzer |

## 🎯 推荐阅读顺序

### 首次分析（完整流程）：
1. [README.md](./README.md) - 了解整体
2. [7-execution-workflow.md](./7-execution-workflow.md) - 执行分析
3. [6-benchmark.md](./6-benchmark.md) - 记录基线

### 深入优化（按需查阅）：
- **Bundle 优化** → [2-webpack-analysis.md](./2-webpack-analysis.md)
- **加载性能** → [3-browser-devtools.md](./3-browser-devtools.md)
- **qiankun 调优** → [4-qiankun-optimization.md](./4-qiankun-optimization.md)
- **MF 调优** → [5-module-federation-optimization.md](./5-module-federation-optimization.md)

### 持续监控：
1. [1-performance-metrics.md](./1-performance-metrics.md) - 添加埋点
2. [6-benchmark.md](./6-benchmark.md) - 建立基准
3. 定期运行 `scripts/perf-analysis.js`

## ❓ 常见问题

### Q: 我应该先优化什么？
**A**: 按照 [7-execution-workflow.md](./7-execution-workflow.md) 先建立基线数据，然后根据数据优先优化影响最大的指标。

### Q: 如何对比优化前后的效果？
**A**: 使用 [6-benchmark.md](./6-benchmark.md) 中的对比表格模板记录数据。

### Q: 脚本执行失败怎么办？
**A**: 检查：
1. 依赖是否安装 (`npm install`)
2. 服务是否启动 (`npm run start`)
3. 端口是否可访问 (`http://localhost:8080`)

### Q: 性能埋点没有输出？
**A**: 
1. 检查代码是否正确添加（参考 examples/ 目录）
2. 重启开发服务器
3. 清空浏览器缓存

## 💡 最佳实践

1. **分阶段优化**：不要一次性修改太多配置，每次改一项并记录数据
2. **建立基线**：优化前务必记录当前性能数据
3. **多次测试**：Lighthouse 至少运行 3 次取平均值
4. **清空缓存**：每次测试前清空浏览器缓存
5. **记录环境**：记录测试时的网络、CPU 限制等条件

## 📞 相关资源

- [qiankun 官方文档](https://qiankun.umijs.org/)
- [Module Federation 文档](https://webpack.js.org/concepts/module-federation/)
- [Web Vitals 指南](https://web.dev/vitals/)
- [Chrome DevTools 文档](https://developer.chrome.com/docs/devtools/)

---

**最后更新**: 2026-01-20  
**维护者**: qiankun-demo 团队
