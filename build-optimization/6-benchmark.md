# 性能基准线

## 1. 建立基准指标

### 1.1 核心 Web Vitals 基准

| 指标 | 当前值 | 目标值 | 优秀 | 需改进 | 备注 |
|------|--------|--------|------|--------|------|
| **FCP** (First Contentful Paint) | ___ ms | < 1800ms | < 1800ms | > 3000ms | 首次内容绘制 |
| **LCP** (Largest Contentful Paint) | ___ ms | < 2500ms | < 2500ms | > 4000ms | 最大内容绘制 |
| **FID** (First Input Delay) | ___ ms | < 100ms | < 100ms | > 300ms | 首次输入延迟 |
| **TTI** (Time to Interactive) | ___ ms | < 3800ms | < 3800ms | > 7300ms | 可交互时间 |
| **TBT** (Total Blocking Time) | ___ ms | < 200ms | < 200ms | > 600ms | 总阻塞时间 |
| **CLS** (Cumulative Layout Shift) | ___ | < 0.1 | < 0.1 | > 0.25 | 累积布局偏移 |

**测量方法**：
- 使用 Lighthouse（DevTools 或 CLI）
- Web Vitals 库集成
- Chrome DevTools Performance 面板

### 1.2 qiankun 特定基准

| 指标 | 当前值 | 目标值 | 备注 |
|------|--------|--------|------|
| **主应用加载时间** | ___ ms | < 2000ms | 从 HTML 到 DOMContentLoaded |
| **qiankun 注册耗时** | ___ ms | < 100ms | registerMicroApps + start |
| **shop bootstrap** | ___ ms | < 50ms | shop 应用 bootstrap 生命周期 |
| **shop mount** | ___ ms | < 500ms | shop 应用 mount 生命周期 |
| **Redux 注入** | ___ ms | < 50ms | 动态注入 productsSlice |
| **shop 完整启动** | ___ ms | < 550ms | bootstrap + mount 总时间 |
| **子应用切换时间** | ___ ms | < 300ms | 点击链接到子应用渲染 |

**测量方法**：
- 在生命周期函数中添加 performance.now() 埋点
- 使用 Performance API marks 和 measures

### 1.3 Module Federation 基准

| 指标 | 当前值 | 目标值 | 备注 |
|------|--------|--------|------|
| **utils remoteEntry.js** | ___ KB | < 20KB | 入口文件大小 |
| **components remoteEntry.js** | ___ KB | < 20KB | 入口文件大小 |
| **utils remoteEntry 加载** | ___ ms | < 100ms | 网络加载时间 |
| **components remoteEntry 加载** | ___ ms | < 100ms | 网络加载时间 |
| **Header 组件加载** | ___ ms | < 200ms | 从 components 加载 Header |
| **utils 函数调用** | ___ ms | < 50ms | utilsSayHi 等函数 |

**测量方法**：
- Network 面板查看资源大小和加载时间
- Performance API 测量导入时间

### 1.4 Bundle 大小基准

| 应用/资源 | 当前值 | 目标值 | 备注 |
|-----------|--------|--------|------|
| **main.js** | ___ KB | < 150KB | 主应用代码 |
| **main-vendors.js** | ___ KB | < 250KB | React + Redux + qiankun |
| **shop.js** | ___ KB | < 100KB | shop 业务代码 |
| **shop runtime** | ___ KB | < 10KB | Webpack runtime |
| **utils bundle** | ___ KB | < 50KB | utils 整体 |
| **components bundle** | ___ KB | < 80KB | components 整体 |
| **总下载大小（未压缩）** | ___ KB | < 800KB | 所有资源 |
| **总下载大小（gzip）** | ___ KB | < 300KB | gzip 压缩后 |

**测量方法**：
- Webpack Bundle Analyzer
- Network 面板 Size 列

## 2. 数据收集模板

### 2.1 性能测试记录表

创建 `build-optimization/performance-log.md`：

```markdown
# 性能测试记录

## 测试环境
- 浏览器: Chrome 120.0.0.0
- 网络: Fast 3G / WiFi / 4G
- CPU: 4x slowdown / No throttling
- 测试时间: 2026-01-20 10:00:00

## 基线数据 (2026-01-20)

### Web Vitals
- FCP: 1234ms
- LCP: 2345ms
- FID: 12ms
- TTI: 3456ms
- TBT: 234ms
- CLS: 0.05

### qiankun 指标
- 主应用加载: 1500ms
- qiankun 注册: 45ms
- shop bootstrap: 23ms
- shop mount: 345ms
- Redux 注入: 12ms
- shop 完整启动: 368ms

### Module Federation
- utils remoteEntry: 15KB / 67ms
- components remoteEntry: 18KB / 72ms
- Header 加载: 123ms

### Bundle 大小
- main.js: 125KB
- main-vendors.js: 220KB
- shop.js: 85KB
- 总大小: 650KB
- gzip 后: 245KB

### Network 请求
- 总请求数: 12
- JS 请求: 8
- CSS 请求: 2
- 并行度: 6

## 优化1: prefetch: false (2026-01-20)

### 变更说明
- 关闭 qiankun 预加载

### 结果
- FCP: 1100ms (-134ms ✅)
- TTI: 3200ms (-256ms ✅)
- shop 激活: 450ms (+82ms ❌)

### 结论
主应用性能提升，但子应用响应变慢。不采用。

## 优化2: eager: true (2026-01-20)

### 变更说明
- 将 React shared 配置为 eager: true

### 结果
- ...

---
```

### 2.2 自动化数据收集

使用 `build-optimization/scripts/collect-metrics.js`:

```bash
# 在浏览器控制台运行
node build-optimization/scripts/collect-metrics.js

# 或在页面中集成
<script src="collect-metrics.js"></script>
```

输出 JSON 格式，方便记录和对比：

```json
{
  "timestamp": "2026-01-20T10:00:00Z",
  "webVitals": {
    "FCP": 1234,
    "LCP": 2345,
    "FID": 12,
    "TTI": 3456,
    "TBT": 234,
    "CLS": 0.05
  },
  "qiankun": {
    "mainLoad": 1500,
    "register": 45,
    "shopBootstrap": 23,
    "shopMount": 345
  }
}
```

## 3. 对比测试方法

### 3.1 A/B 测试流程

```
1. 建立基线
   ├─ 清空缓存
   ├─ 录制 Performance
   ├─ 运行 Lighthouse (3次取平均)
   └─ 记录数据

2. 应用优化
   ├─ 修改配置
   ├─ 重新构建
   └─ 部署/启动

3. 测试优化效果
   ├─ 清空缓存
   ├─ 录制 Performance
   ├─ 运行 Lighthouse (3次取平均)
   └─ 记录数据

4. 对比分析
   ├─ 计算差值和百分比
   ├─ 判断是否有改进
   └─ 决定是否采用

5. 更新基线
   └─ 如果采用优化，更新基准数据
```

### 3.2 测试配置对比表

| 配置项 | 基线 | 测试1 | 测试2 | 测试3 | 最终 |
|--------|------|-------|-------|-------|------|
| **prefetch** | true | false | 'all' | hover | true |
| **sandbox** | experimental | false | strict | - | experimental |
| **eager (React)** | false | true | - | - | false |
| **FCP** | 1234ms | 1100ms | 1400ms | 1150ms | 1234ms |
| **LCP** | 2345ms | 2200ms | 2500ms | 2250ms | 2345ms |
| **TTI** | 3456ms | 3200ms | 3800ms | 3300ms | 3456ms |
| **shop 激活** | 350ms | 450ms | 200ms | 320ms | 350ms |

## 4. 性能监控仪表板

### 4.1 创建监控脚本

`build-optimization/scripts/monitor.js`:

```javascript
// 实时监控性能指标
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const metrics = {};

function sendMetric(metric) {
  metrics[metric.name] = metric.value;
  console.log(`📊 ${metric.name}:`, metric.value);
  
  // 发送到监控服务
  // fetch('/api/metrics', { method: 'POST', body: JSON.stringify(metric) });
}

getCLS(sendMetric);
getFID(sendMetric);
getFCP(sendMetric);
getLCP(sendMetric);
getTTFB(sendMetric);

// 导出指标
window.getPerformanceMetrics = () => metrics;
```

### 4.2 集成到 CI/CD

在 `package.json`:

```json
{
  "scripts": {
    "perf:test": "node build-optimization/scripts/perf-analysis.js",
    "perf:compare": "node build-optimization/scripts/compare-metrics.js",
    "perf:ci": "npm run build && npm run perf:test && npm run perf:compare"
  }
}
```

## 5. 性能预算

### 5.1 设置预算

在 `webpack.dev.config.js`:

```javascript
performance: {
  hints: 'error',  // 超出预算报错
  maxAssetSize: 500000,      // 500KB
  maxEntrypointSize: 500000,
  assetFilter: function(assetFilename) {
    // 排除 sourcemap
    return !assetFilename.endsWith('.map');
  }
}
```

### 5.2 Lighthouse 预算

创建 `lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: ['http://localhost:8080'],
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};
```

运行：
```bash
lhci autorun --config=lighthouserc.js
```

## 6. 持续跟踪

### 6.1 性能趋势图

建议使用工具：
- **Lighthouse CI** - 持续集成性能测试
- **SpeedCurve** - 性能监控平台
- **自定义仪表板** - Grafana + 自定义指标

### 6.2 定期回归测试

建议频率：
- **每次发布前** - 完整性能测试
- **每周** - 快速回归测试
- **每月** - 深度性能审计

## 7. 报告模板

### 7.1 性能优化总结

```markdown
# 性能优化报告 - 2026-01-20

## 优化目标
提升 qiankun-demo 冷启动性能，降低 FCP 和 LCP

## 实施的优化

1. **关闭 qiankun 预加载**
   - 变更: prefetch: true → false
   - 影响: FCP -134ms, TTI -256ms
   - 副作用: shop 激活 +82ms
   - 结论: ❌ 不采用

2. **预加载 remoteEntry.js**
   - 变更: 在 HTML 中添加 <link rel="modulepreload">
   - 影响: shop 激活 -120ms
   - 副作用: 无
   - 结论: ✅ 采用

## 优化前后对比

| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| FCP | 1234ms | 1150ms | -84ms (-6.8%) ✅ |
| LCP | 2345ms | 2200ms | -145ms (-6.2%) ✅ |
| TTI | 3456ms | 3300ms | -156ms (-4.5%) ✅ |
| shop 激活 | 350ms | 230ms | -120ms (-34.3%) ✅ |
| Bundle 大小 | 650KB | 620KB | -30KB (-4.6%) ✅ |

## Lighthouse 评分

- 优化前: 78/100
- 优化后: 85/100 (+7 分)

## 下一步计划

1. 测试 React eager 配置
2. 优化图片资源
3. 实施代码分割
```

---

**下一步**: 继续阅读 [完整执行流程](./7-execution-workflow.md)
