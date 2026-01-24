# 浏览器开发者工具分析

## 1. Chrome DevTools Performance 面板

### 1.1 录制冷启动性能

步骤：
1. 打开 Chrome DevTools (F12 或 Cmd+Option+I)
2. 切换到 **Performance** 面板
3. 勾选以下选项：
   - ✅ Screenshots - 查看加载过程截图
   - ✅ Web Vitals - 显示核心指标
   - ✅ Memory - 内存使用情况（可选）
4. 点击 ⭕ **Record** 按钮开始录制
5. **硬刷新页面** (Cmd+Shift+R / Ctrl+Shift+F5)
6. 等待页面完全加载（看到 shop 内容渲染完成）
7. 停止录制

### 1.2 分析录制结果

#### 关键区域说明

```
┌─────────────────────────────────────┐
│  Screenshots (加载过程截图)          │
├─────────────────────────────────────┤
│  Frames (帧率，绿色=流畅)            │
├─────────────────────────────────────┤
│  Main (主线程活动)                   │
│   ├─ Parse HTML                     │
│   ├─ Evaluate Script                │
│   └─ Recalculate Style              │
├─────────────────────────────────────┤
│  Network (网络请求瀑布图)            │
│   ├─ HTML                            │
│   ├─ JS/CSS                          │
│   └─ XHR                             │
├─────────────────────────────────────┤
│  Timings (关键时间点标记)            │
│   ├─ FCP (First Contentful Paint)   │
│   ├─ LCP (Largest Contentful Paint) │
│   └─ DCL (DOMContentLoaded)         │
└─────────────────────────────────────┘
```

#### 重点关注指标

1. **FCP (First Contentful Paint)**
   - 蓝色竖线标记
   - 目标：< 1.8s
   - 首次绘制任何内容的时间

2. **LCP (Largest Contentful Paint)**
   - 绿色竖线标记
   - 目标：< 2.5s
   - 最大内容元素绘制时间

3. **Long Tasks (长任务)**
   - 红色三角标记
   - 任何 > 50ms 的任务
   - 会阻塞用户交互

### 1.3 识别性能瓶颈

#### 主线程阻塞分析

点击 **Main** 区域，查看火焰图：

```
Main Thread
├─ Parse HTML (解析 HTML)
├─ Evaluate Script (执行 JS)
│   ├─ (anonymous) - main.js      ← 主应用脚本执行
│   ├─ bootstrap (qiankun)        ← qiankun 初始化
│   └─ __webpack_require__        ← Module Federation 加载
├─ Recalculate Style (重算样式)
└─ Layout (布局计算)
```

**优化目标**：
- 单个任务 < 50ms
- 总脚本执行时间 < 2s
- 避免长时间阻塞

#### Network 瀑布图分析

查看资源加载顺序：

```
时间轴 ──────────────────────────────►
HTML        ████
main.js          ████████
runtime.js           ████
vendors.js               ████████
utils/remoteEntry        ████     ← 是否串行？
components/remoteEntry        ████ ← 是否串行？
shop/remoteEntry                  ████
shop.js                                ████
Header (MF)                                 ████
```

**检查项**：
- [ ] remoteEntry.js 是否并行加载？
- [ ] 是否有资源被阻塞？
- [ ] 关键资源是否优先加载？

## 2. Network 面板详细分析

### 2.1 过滤和排序

在 Network 面板：
1. 清空缓存并刷新 (Cmd+Shift+R)
2. 按类型过滤：JS / XHR / All
3. 右键列头添加列：
   - Priority (优先级)
   - Initiator (发起者)
   - Size / Time

### 2.2 关键资源检查表

| 资源 | 预期大小 | 优先级 | 备注 |
|------|----------|--------|------|
| index.html | < 10KB | Highest | 主应用入口 |
| main.[hash].js | 50-150KB | High | 主应用代码 |
| runtime.[hash].js | 5-10KB | High | Webpack runtime |
| vendors.[hash].js | 150-300KB | High | 第三方库 |
| utils/remoteEntry.js | < 20KB | High | MF 入口 |
| components/remoteEntry.js | < 20KB | High | MF 入口 |
| shop/remoteEntry.js | < 20KB | Medium | 子应用入口 |

### 2.3 识别串行加载

查看 **Initiator** 列：
- `document` - HTML 直接引用
- `script` - 脚本动态加载
- `Other` - 可能是 Module Federation

**优化机会**：
```html
<!-- 在 index.html 中预加载 remoteEntry -->
<link rel="modulepreload" href="http://localhost:8082/remoteEntry.js">
<link rel="modulepreload" href="http://localhost:8083/remoteEntry.js">
```

### 2.4 资源时间分解

点击任意资源，查看 **Timing** 标签：

```
Queuing            ████           - 排队等待
Stalled            ████           - 停滞（TCP连接限制）
DNS Lookup         ██             - DNS 查询
Initial Connection ███            - TCP 握手
SSL                ██             - SSL 握手
Request Sent       █              - 发送请求
Waiting (TTFB)     ████████       - 等待首字节
Content Download   ████           - 下载内容
```

**关注点**：
- TTFB (Waiting) 过长？→ 服务器响应慢
- Stalled 过长？→ 并发连接限制
- Content Download 过长？→ 文件太大或网速慢

## 3. Coverage 面板 - 代码利用率

### 3.1 启动 Coverage

1. DevTools → More tools → Coverage
2. 点击 ⭕ 开始记录
3. 刷新页面
4. 等待加载完成
5. 停止记录

### 3.2 分析结果

Coverage 面板显示：
- **红色柱** - 未使用的代码
- **蓝色柱** - 已使用的代码
- **百分比** - 未使用代码占比

#### 理想状态

| 文件 | 首屏利用率目标 |
|------|---------------|
| main.js | > 60% |
| vendors.js | > 40% |
| shop.js | > 70% (激活后) |

#### 优化策略

对于未使用代码 > 50% 的文件：
1. **代码分割** - 将未使用部分拆分到异步 chunk
2. **动态导入** - 使用 `import()` 懒加载
3. **Tree Shaking** - 移除未使用的导出

示例：
```javascript
// ❌ 同步导入大型库
import { Header, Footer, Sidebar } from 'components';

// ✅ 按需导入
import { Header } from 'components/Header';
// Footer 和 Sidebar 懒加载
```

## 4. Memory 面板 - 内存分析

### 4.1 堆快照 (Heap Snapshot)

步骤：
1. DevTools → Memory 面板
2. 选择 **Heap snapshot**
3. 点击 **Take snapshot**
4. 分析大对象

#### 关注点
- Detached DOM nodes - 应为 0
- 大型数组/对象 - 是否必要？
- 重复的字符串/对象 - 可以复用？

### 4.2 内存泄漏检测

在不同操作阶段拍摄多个快照：
1. 初始加载后
2. 激活 shop 子应用后
3. 卸载 shop 后
4. 再次激活 shop

比较快照，检查内存是否持续增长。

## 5. Lighthouse 自动化分析

### 5.1 运行 Lighthouse

在 DevTools：
1. 切换到 **Lighthouse** 面板
2. 选择类别：
   - ✅ Performance
   - ✅ Best Practices
   - Accessibility (可选)
   - SEO (可选)
3. 选择设备：Desktop / Mobile
4. 点击 **Analyze page load**

### 5.2 解读报告

#### Performance Score 构成

- **FCP (10%)** - First Contentful Paint
- **SI (10%)** - Speed Index
- **LCP (25%)** - Largest Contentful Paint
- **TTI (10%)** - Time to Interactive
- **TBT (30%)** - Total Blocking Time
- **CLS (15%)** - Cumulative Layout Shift

#### 关键建议

常见优化建议：
1. **Eliminate render-blocking resources**
   - 延迟加载非关键 CSS/JS
   
2. **Reduce unused JavaScript**
   - 使用 Coverage 工具识别
   
3. **Minimize main-thread work**
   - 减少脚本执行时间
   
4. **Keep request counts low and transfer sizes small**
   - 减少 HTTP 请求
   - 压缩资源

### 5.3 命令行 Lighthouse

使用脚本 `build-optimization/scripts/perf-analysis.js`:

```bash
node build-optimization/scripts/perf-analysis.js
```

生成 `lighthouse-report.html`

## 6. 实战分析清单

### 冷启动分析流程

```
1. 清空缓存
   ├─ Application → Clear site data
   └─ 勾选所有选项

2. 录制 Performance
   ├─ 启用 Screenshots + Web Vitals
   ├─ 硬刷新页面
   └─ 等待完全加载

3. 分析 Network 瀑布图
   ├─ 识别串行加载
   ├─ 检查资源大小
   └─ 查看 TTFB

4. 运行 Coverage
   ├─ 识别未使用代码
   └─ 标记懒加载候选

5. 运行 Lighthouse
   ├─ 获取整体评分
   └─ 查看优化建议

6. 记录数据到基准线文档
```

### qiankun 特定检查

**Performance 面板**：
- [ ] 找到 `bootstrap` 函数调用，查看耗时
- [ ] 找到 `mount` 函数调用，查看耗时
- [ ] 检查是否有重复的 React render

**Network 面板**：
- [ ] remoteEntry.js 加载顺序
- [ ] 子应用资源是否预加载（如配置了 prefetch）
- [ ] 是否有 304 缓存命中

**Console 面板**：
- [ ] 查看自定义性能埋点输出
- [ ] 检查是否有错误/警告

## 7. 对比测试

### 测试不同配置的影响

建立对比测试：

| 场景 | FCP | LCP | TTI | 备注 |
|------|-----|-----|-----|------|
| 基线（当前配置） | - | - | - | - |
| prefetch: false | - | - | - | 测试预加载影响 |
| eager: true (React) | - | - | - | 测试同步加载影响 |
| 关闭沙箱 | - | - | - | 测试沙箱开销 |
| 优化后 | - | - | - | 最终优化结果 |

每次修改配置后：
1. 清空缓存
2. 录制 Performance
3. 运行 Lighthouse
4. 记录数据

---

**下一步**: 继续阅读 [qiankun 特定优化](./4-qiankun-optimization.md)
