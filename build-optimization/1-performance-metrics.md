# 性能指标收集

## 1. 浏览器原生 Performance API

### 1.1 主应用性能监控

在 `packages/main/lib/main.js` 添加：

```javascript
// ==================== 性能监控代码 START ====================
const perfMarks = {
  mainScriptStart: performance.now(),
};

// 在 bootstrap() 调用前
performance.mark('qiankun-register-start');

// 在文件末尾添加（bootstrap() 调用后）
performance.mark('qiankun-register-end');
performance.measure('qiankun-register', 'qiankun-register-start', 'qiankun-register-end');

// 收集所有性能数据
window.addEventListener('load', () => {
  setTimeout(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const measures = performance.getEntriesByType('measure');
    const paint = performance.getEntriesByType('paint');
    
    console.group('📊 主应用性能数据');
    console.log('DNS 查询:', `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`);
    console.log('TCP 连接:', `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`);
    console.log('首字节时间 (TTFB):', `${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`);
    console.log('DOM 解析:', `${(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)}ms`);
    console.log('页面完全加载:', `${(navigation.loadEventEnd - navigation.fetchStart).toFixed(2)}ms`);
    
    console.log('\n🎨 绘制指标:');
    paint.forEach(entry => {
      console.log(`${entry.name}:`, `${entry.startTime.toFixed(2)}ms`);
    });
    
    console.log('\n📦 资源加载详情:');
    const resourcesByType = resources.reduce((acc, r) => {
      const type = r.initiatorType || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push({
        name: r.name.split('/').pop(),
        duration: r.duration.toFixed(2),
        size: r.transferSize
      });
      return acc;
    }, {});
    console.table(resourcesByType);
    
    console.log('\n⏱️ 自定义测量:');
    console.table(measures.map(m => ({
      name: m.name,
      duration: `${m.duration.toFixed(2)}ms`
    })));
    
    console.groupEnd();
  }, 3000);
});
// ==================== 性能监控代码 END ====================
```

### 1.2 子应用生命周期埋点

在 `packages/shop/lib/life-cycles.js` 添加：

```javascript
// ==================== 性能监控代码 START ====================
const shopPerfMarks = {
  scriptLoadStart: performance.now()
};

export async function bootstrap() {
  shopPerfMarks.bootstrapStart = performance.now();
  console.log('🔧 shop app bootstrap');
  
  // 原有代码...
  
  shopPerfMarks.bootstrapEnd = performance.now();
  console.log(`⏱️  [shop] bootstrap 耗时: ${(shopPerfMarks.bootstrapEnd - shopPerfMarks.bootstrapStart).toFixed(2)}ms`);
}

export async function mount(props) {
  shopPerfMarks.mountStart = performance.now();
  console.log('🚀 shop app mount');
  
  // 监听 qiankun 全局状态变化
  props.onGlobalStateChange((state, prev) => {
    console.log('====shop qiankun state change', state, prev);
  });
  
  // 注入 reducer 前打点
  const injectStart = performance.now();
  if (props.injectReducer && !isReducerInjected) {
    props.injectReducer('products', productsSlice);
    isReducerInjected = true;
    console.log(`⏱️  [shop] Redux reducer 注入耗时: ${(performance.now() - injectStart).toFixed(2)}ms`);
  }
  
  // 渲染前打点
  const renderStart = performance.now();
  render(props);
  console.log(`⏱️  [shop] 渲染耗时: ${(performance.now() - renderStart).toFixed(2)}ms`);
  
  shopPerfMarks.mountEnd = performance.now();
  
  // 汇总输出
  console.group('📊 shop 应用性能汇总');
  console.log(`Bootstrap: ${(shopPerfMarks.bootstrapEnd - shopPerfMarks.bootstrapStart).toFixed(2)}ms`);
  console.log(`Mount: ${(shopPerfMarks.mountEnd - shopPerfMarks.mountStart).toFixed(2)}ms`);
  console.log(`完整启动: ${(shopPerfMarks.mountEnd - shopPerfMarks.bootstrapStart).toFixed(2)}ms`);
  console.log(`从脚本加载到完成: ${(shopPerfMarks.mountEnd - shopPerfMarks.scriptLoadStart).toFixed(2)}ms`);
  console.groupEnd();
}
// ==================== 性能监控代码 END ====================
```

### 1.3 Module Federation 加载监控

在 `packages/shop/lib/main.jsx` 添加：

```javascript
// 在文件顶部
const mfLoadStart = performance.now();

// 在 import 语句之前记录
performance.mark('mf-header-import-start');

import { Header } from 'components/Header';

performance.mark('mf-header-import-end');
performance.measure('mf-header-load', 'mf-header-import-start', 'mf-header-import-end');

const mfLoadEnd = performance.now();
console.log(`⏱️  [MF] Header 组件加载耗时: ${(mfLoadEnd - mfLoadStart).toFixed(2)}ms`);
```

## 2. Web Vitals 监控

### 2.1 安装 web-vitals 库

```bash
npm install --save web-vitals
```

### 2.2 在主应用中集成

在 `packages/main/lib/main.js` 添加：

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log(`📈 [Web Vitals] ${metric.name}:`, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id
  });
  
  // 这里可以发送到分析服务
  // analytics.send(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

完整示例见 [examples/web-vitals-integration.js](./examples/web-vitals-integration.js)

## 3. 性能指标说明

### 关键指标定义

| 指标 | 全称 | 说明 | 优秀 | 需改进 |
|------|------|------|------|--------|
| FCP | First Contentful Paint | 首次内容绘制 | < 1.8s | > 3.0s |
| LCP | Largest Contentful Paint | 最大内容绘制 | < 2.5s | > 4.0s |
| FID | First Input Delay | 首次输入延迟 | < 100ms | > 300ms |
| TTI | Time to Interactive | 可交互时间 | < 3.8s | > 7.3s |
| TBT | Total Blocking Time | 总阻塞时间 | < 200ms | > 600ms |
| CLS | Cumulative Layout Shift | 累积布局偏移 | < 0.1 | > 0.25 |

### qiankun 特定指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| 子应用 bootstrap 时间 | qiankun 生命周期初始化 | < 50ms |
| 子应用 mount 时间 | 渲染和挂载 | < 500ms |
| Redux 注入时间 | 动态添加 reducer | < 50ms |
| 子应用完整启动 | bootstrap + mount | < 550ms |

### Module Federation 指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| remoteEntry.js 加载 | 远程入口文件下载 | < 100ms |
| 远程模块加载 | 具体组件/函数加载 | < 200ms |
| Shared 库初始化 | React 等共享库 | < 50ms |

## 4. 数据收集工具脚本

使用 `build-optimization/scripts/collect-metrics.js` 在浏览器控制台收集性能数据。

在控制台执行：

```javascript
// 复制 scripts/collect-metrics.js 的内容到控制台
// 或者在页面中加载该脚本
collectPerformanceMetrics()
```

## 5. 持续监控

### 5.1 添加到 CI/CD

在 `package.json` 添加：

```json
{
  "scripts": {
    "perf:analyze": "node build-optimization/scripts/perf-analysis.js",
    "perf:ci": "npm run build && npm run perf:analyze"
  }
}
```

### 5.2 性能预算

在 webpack 配置中添加性能预算（已在 shop 应用配置）：

```javascript
performance: {
  hints: 'warning',
  maxAssetSize: 500000, // 500KB
  maxEntrypointSize: 500000,
  assetFilter: function(assetFilename) {
    return !/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename);
  }
}
```

---

**下一步**: 继续阅读 [Webpack 构建分析](./2-webpack-analysis.md)
