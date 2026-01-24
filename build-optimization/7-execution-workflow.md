# 完整执行流程

本文档提供一个循序渐进的性能分析执行清单，按照此流程可以系统性地完成 qiankun-demo 的冷启动性能分析。

## 阶段 1: 准备工作 (30分钟)

### ✅ 1.1 安装必要依赖

```bash
cd /Users/ruilu/Desktop/code/frontend-collections/study-demo-collections/qiankun-demo

# 安装性能分析工具
npm install --save-dev \
  webpack-bundle-analyzer \
  speed-measure-webpack-plugin \
  lighthouse \
  chrome-launcher

# 安装 Web Vitals（主应用）
cd packages/main
npm install --save web-vitals

cd ../..
```

### ✅ 1.2 确认配置已就绪

检查 shop 应用的 webpack 配置：

```bash
cat packages/shop/webpack.dev.config.js | grep -A 10 "BundleAnalyzerPlugin"
```

应该看到类似配置（已存在）：
```javascript
isAnalyze && new BundleAnalyzerPlugin({
  analyzerMode: 'static',
  openAnalyzer: false,
  reportFilename: 'bundle-report.html',
})
```

### ✅ 1.3 启动所有服务

```bash
# 启动所有应用
npm run start

# 验证服务运行
# 主应用: http://localhost:8080
# shop: http://localhost:8081
# utils: http://localhost:8082
# components: http://localhost:8083
```

等待所有服务启动成功后，访问 http://localhost:8080 确认页面正常。

---

## 阶段 2: 建立基线数据 (45分钟)

### ✅ 2.1 生成 Bundle 分析报告

```bash
# shop 应用
cd packages/shop
npm run analyze

# 查看报告
open dist/bundle-report.html

# 主应用
cd ../main
analyze=analyze npm run build
open dist/bundle-report.html

# utils 和 components（如需要）
cd ../utils
analyze=analyze npm run build
open dist/bundle-report.html
```

**记录数据**：
- [ ] main.js 大小: ______ KB
- [ ] vendors.js 大小: ______ KB
- [ ] shop.js 大小: ______ KB
- [ ] remoteEntry.js (utils) 大小: ______ KB
- [ ] remoteEntry.js (components) 大小: ______ KB

### ✅ 2.2 Chrome DevTools Performance 录制

步骤：
1. 打开 http://localhost:8080
2. 打开 DevTools (F12)
3. 切换到 Performance 面板
4. 勾选 ✅ Screenshots 和 ✅ Web Vitals
5. 点击 ⭕ 开始录制
6. 硬刷新页面 (Cmd+Shift+R)
7. 等待页面完全加载
8. 停止录制
9. 保存录制文件 (右键 → Save Profile)

**记录数据**：
- [ ] FCP: ______ ms
- [ ] LCP: ______ ms
- [ ] DCL (DOMContentLoaded): ______ ms
- [ ] Load: ______ ms
- [ ] 主线程长任务数: ______
- [ ] 最长任务耗时: ______ ms

### ✅ 2.3 Network 面板分析

1. 切换到 Network 面板
2. 清空 (Clear)
3. 硬刷新页面
4. 等待加载完成

**记录数据**：
- [ ] 总请求数: ______
- [ ] JS 文件数: ______
- [ ] 总下载大小: ______ KB
- [ ] DOMContentLoaded: ______ ms
- [ ] Load: ______ ms
- [ ] remoteEntry.js 加载顺序: 串行 / 并行

**检查关键资源**：
```
资源                        大小        时间        优先级
index.html                 _____KB    _____ms     Highest
main.[hash].js             _____KB    _____ms     High
runtime.[hash].js          _____KB    _____ms     High
vendors.[hash].js          _____KB    _____ms     High
utils/remoteEntry.js       _____KB    _____ms     _____
components/remoteEntry.js  _____KB    _____ms     _____
```

### ✅ 2.4 Coverage 面板分析

1. More tools → Coverage
2. 点击 ⭕ 开始记录
3. 刷新页面
4. 等待加载完成
5. 停止记录

**记录数据**：
- [ ] main.js 未使用代码: ______%
- [ ] vendors.js 未使用代码: ______%
- [ ] shop.js 未使用代码: ______%

### ✅ 2.5 运行 Lighthouse

在 DevTools Lighthouse 面板：
1. 选择 ✅ Performance
2. 选择 Desktop
3. 点击 "Analyze page load"
4. 等待分析完成
5. 导出报告 (Export report)

**运行 3 次取平均值**：

| 指标 | 第1次 | 第2次 | 第3次 | 平均值 |
|------|-------|-------|-------|--------|
| Performance Score | ___ | ___ | ___ | ___ |
| FCP | ___ | ___ | ___ | ___ |
| LCP | ___ | ___ | ___ | ___ |
| TBT | ___ | ___ | ___ | ___ |
| CLS | ___ | ___ | ___ | ___ |
| TTI | ___ | ___ | ___ | ___ |

### ✅ 2.6 记录基线到文档

创建性能日志文件：

```bash
cat > build-optimization/baseline-2026-01-20.md << 'EOF'
# 性能基线 - 2026-01-20

## 测试环境
- 浏览器: Chrome 120.0.0.0
- 网络: No throttling
- CPU: No throttling
- 时间: 2026-01-20 14:00

## Web Vitals
- FCP: _____ ms
- LCP: _____ ms
- FID: _____ ms
- TTI: _____ ms
- TBT: _____ ms
- CLS: _____

## Bundle 大小
- main.js: _____ KB
- vendors.js: _____ KB
- shop.js: _____ KB
- 总大小: _____ KB

## Network
- 总请求: _____
- 总下载: _____ KB
- DOMContentLoaded: _____ ms
- Load: _____ ms

EOF
```

---

## 阶段 3: 添加性能埋点 (30分钟)

### ✅ 3.1 主应用性能监控

编辑 `packages/main/lib/main.js`，参考 [examples/main-with-perf.js](./examples/main-with-perf.js)：

```javascript
// 在文件顶部添加
const perfMarks = {
  mainScriptStart: performance.now(),
};

performance.mark('qiankun-register-start');

// 在 bootstrap() 后
performance.mark('qiankun-register-end');
performance.measure('qiankun-register', 'qiankun-register-start', 'qiankun-register-end');

// 在文件末尾添加性能收集代码（完整代码见示例文件）
```

### ✅ 3.2 shop 生命周期埋点

编辑 `packages/shop/lib/life-cycles.js`，参考 [examples/shop-lifecycle-perf.js](./examples/shop-lifecycle-perf.js):

在 bootstrap 和 mount 函数中添加性能埋点。

### ✅ 3.3 Web Vitals 集成

编辑 `packages/main/lib/main.js`，参考 [examples/web-vitals-integration.js](./examples/web-vitals-integration.js)：

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log(`📈 [Web Vitals] ${metric.name}:`, metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### ✅ 3.4 验证埋点

1. 重启开发服务器
2. 刷新页面
3. 打开控制台
4. 应该看到类似输出：

```
⏱️  [shop] bootstrap 耗时: 23.45ms
⏱️  [shop] Redux reducer 注入耗时: 12.34ms
⏱️  [shop] 渲染耗时: 234.56ms
📊 shop 应用性能汇总
  Bootstrap: 23.45ms
  Mount: 345.67ms
  完整启动: 369.12ms
📈 [Web Vitals] FCP: { value: 1234.56, ... }
```

---

## 阶段 4: 优化测试 (90分钟)

### ✅ 4.1 测试 prefetch 策略

#### 测试 1: prefetch: false

编辑 `packages/main/lib/bootstrap.js`:

```javascript
start({ 
  prefetch: false,  // ← 改为 false
  singular: true,
});
```

重启 → 清空缓存 → 录制 Performance → 运行 Lighthouse → 记录数据

#### 测试 2: prefetch: 'all'

```javascript
start({ 
  prefetch: 'all',  // ← 改为 'all'
  singular: true,
});
```

重复测试流程

#### 测试 3: 延迟预加载

```javascript
import { start, prefetchApps } from 'qiankun';

start({ 
  prefetch: false,
  singular: true,
});

// 延迟 2 秒预加载
setTimeout(() => {
  prefetchApps([{ name: 'shop', entry: 'http://localhost:8081/' }]);
}, 2000);
```

重复测试流程

**记录对比表**：

| 配置 | FCP | LCP | TTI | shop激活 | 总请求 |
|------|-----|-----|-----|----------|--------|
| true (基线) | ___ | ___ | ___ | ___ | ___ |
| false | ___ | ___ | ___ | ___ | ___ |
| 'all' | ___ | ___ | ___ | ___ | ___ |
| 延迟 2s | ___ | ___ | ___ | ___ | ___ |

### ✅ 4.2 测试 shared eager 配置

#### 测试 1: eager: false (当前)

基线已记录

#### 测试 2: eager: true

编辑 `packages/shop/webpack.dev.config.js`:

```javascript
shared: {
  react: {
    singleton: true,
    eager: true,  // ← 取消注释
    requiredVersion: '^19.2.0',
  },
  'react-dom': {
    singleton: true,
    eager: true,  // ← 取消注释
    requiredVersion: '^19.2.0',
  },
}
```

重新构建 → 重启 → 测试

**记录对比**：

| 配置 | shop.js大小 | HTTP请求数 | shop激活时间 |
|------|------------|-----------|-------------|
| eager: false | ___ KB | ___ | ___ ms |
| eager: true | ___ KB | ___ | ___ ms |

### ✅ 4.3 测试沙箱配置

#### 测试 1: 关闭沙箱

编辑 `packages/main/lib/bootstrap.js`:

```javascript
registerMicroApps([
  {
    name: 'shop',
    // ...
    sandbox: false,  // ← 改为 false
  },
]);
```

重启 → 测试

**警告**: 测试后记得改回原配置！

#### 测试 2: 严格样式隔离

```javascript
sandbox: {
  strictStyleIsolation: true,  // ← 改为 true
}
```

重启 → 测试

**记录对比**：

| 沙箱配置 | mount耗时 | 渲染耗时 | 样式隔离 |
|----------|----------|---------|---------|
| experimental (基线) | ___ | ___ | ✅ |
| false | ___ | ___ | ❌ |
| strict | ___ | ___ | ✅✅ |

### ✅ 4.4 添加资源预加载

编辑 `packages/main/public/index.html`:

```html
<head>
  <!-- ... 现有内容 -->
  
  <!-- 预连接 -->
  <link rel="preconnect" href="http://localhost:8082">
  <link rel="preconnect" href="http://localhost:8083">
  <link rel="preconnect" href="http://localhost:8081">
  
  <!-- 预加载 Module Federation 入口 -->
  <link rel="modulepreload" href="http://localhost:8082/remoteEntry.js">
  <link rel="modulepreload" href="http://localhost:8083/remoteEntry.js">
</head>
```

重启 → 测试 → 记录 shop 激活时间变化

---

## 阶段 5: 分析和总结 (30分钟)

### ✅ 5.1 汇总数据

创建对比表格，填入所有测试数据。

### ✅ 5.2 识别最佳配置

基于数据分析，选择：
- 最优 prefetch 策略
- 最优 shared eager 配置
- 最优沙箱配置
- 是否启用资源预加载

### ✅ 5.3 应用最终配置

将选定的最佳配置应用到项目。

### ✅ 5.4 验证最终结果

应用所有优化后：
1. 清空缓存
2. 录制 Performance
3. 运行 Lighthouse (3次)
4. 记录最终数据

**最终对比**：

| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| FCP | ___ | ___ | ___ |
| LCP | ___ | ___ | ___ |
| TTI | ___ | ___ | ___ |
| TBT | ___ | ___ | ___ |
| shop 激活 | ___ | ___ | ___ |
| Bundle 大小 | ___ | ___ | ___ |
| Lighthouse 分数 | ___ | ___ | ___ |

### ✅ 5.5 编写优化报告

参考 [6-benchmark.md](./6-benchmark.md) 中的报告模板，编写最终优化报告。

---

## 阶段 6: 持续监控 (可选)

### ✅ 6.1 设置性能预算

在 webpack 配置中添加性能预算（已配置）。

### ✅ 6.2 集成 Lighthouse CI

```bash
npm install --save-dev @lhci/cli

# 创建配置
cat > lighthouserc.js << 'EOF'
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
      },
    },
  },
};
EOF

# 运行
npx lhci autorun
```

### ✅ 6.3 添加性能测试到 CI

在 `package.json`:

```json
{
  "scripts": {
    "perf:ci": "npm run build && npx lhci autorun"
  }
}
```

---

## 快速参考检查清单

```
□ 安装依赖
□ 启动所有服务
□ 生成 Bundle 报告
□ Performance 面板录制
□ Network 面板分析
□ Coverage 面板分析
□ Lighthouse 测试 (x3)
□ 记录基线数据
□ 添加性能埋点
□ 验证埋点输出
□ 测试 prefetch 策略
□ 测试 shared eager
□ 测试沙箱配置
□ 测试资源预加载
□ 汇总对比数据
□ 选择最佳配置
□ 应用优化配置
□ 验证最终结果
□ 编写优化报告
□ 设置持续监控
```

---

## 预计时间分配

- **阶段 1** (准备): 30 分钟
- **阶段 2** (基线): 45 分钟
- **阶段 3** (埋点): 30 分钟
- **阶段 4** (优化测试): 90 分钟
- **阶段 5** (总结): 30 分钟
- **阶段 6** (持续监控): 30 分钟 (可选)

**总计**: 约 3.5 - 4 小时

---

## 故障排查

### 问题: Lighthouse 无法运行

解决：
```bash
# 确保端口 8080 可访问
curl http://localhost:8080

# 或使用本地 Lighthouse
npx lighthouse http://localhost:8080 --view
```

### 问题: Bundle Analyzer 报告不生成

解决：
```bash
# 检查环境变量
echo $analyze

# 确保正确设置
analyze=analyze npm run build
```

### 问题: 性能埋点没有输出

解决：
1. 检查代码是否保存
2. 重启开发服务器
3. 清空浏览器缓存
4. 检查控制台是否有错误

---

**完成！** 你现在拥有了完整的性能分析数据和优化方案。
