# qiankun 特定优化

## 1. 预加载策略优化

### 1.1 当前配置

在 `packages/main/lib/bootstrap.js`:

```javascript
start({ 
  prefetch: true,  // 智能预加载
  singular: true,
});
```

### 1.2 预加载策略对比

#### 方案1: 禁用预加载 (baseline)

```javascript
start({ 
  prefetch: false,
  singular: true,
});
```

**影响**：
- ✅ 主应用 TTI 更快（不会预加载子应用）
- ❌ 首次点击 shop 链接响应慢（需现场加载）

**适用场景**：主应用性能优先，子应用访问频率低

#### 方案2: 智能预加载 (当前)

```javascript
start({ 
  prefetch: true,  // 自动在浏览器空闲时预加载
  singular: true,
});
```

**影响**：
- ✅ 平衡主应用和子应用体验
- ✅ 利用 `requestIdleCallback`
- ⚠️ 可能轻微影响主应用 TTI

**适用场景**：默认推荐

#### 方案3: 全量预加载

```javascript
start({ 
  prefetch: 'all',  // 立即预加载所有子应用
  singular: true,
});
```

**影响**：
- ❌ 主应用 TTI 显著延迟
- ✅ 子应用秒开

**适用场景**：网络良好且子应用必定会访问

#### 方案4: 手动控制预加载时机

```javascript
import { start, prefetchApps } from 'qiankun';

// 先不预加载
start({ 
  prefetch: false,
  singular: true,
});

// 主应用渲染完成后再预加载
window.addEventListener('load', () => {
  setTimeout(() => {
    prefetchApps([
      { 
        name: 'shop', 
        entry: 'http://localhost:8081/' 
      }
    ]);
  }, 2000);  // 延迟 2 秒
});
```

**影响**：
- ✅ 主应用性能最优
- ✅ 完全可控
- ⚠️ 需要手动管理

**适用场景**：需要精细控制加载时机

#### 方案5: 基于用户行为预加载

```javascript
import { prefetchApps } from 'qiankun';

// 鼠标悬停在链接上时预加载
document.querySelector('a[href="/shop"]')?.addEventListener('mouseenter', () => {
  prefetchApps([{ name: 'shop', entry: 'http://localhost:8081/' }]);
}, { once: true });
```

**影响**：
- ✅ 主应用零影响
- ✅ 子应用响应快（hover 到 click 有足够时间）

**适用场景**：用户交互驱动的预加载

### 1.3 测试对比

记录不同策略的性能影响：

| 策略 | 主应用 FCP | 主应用 TTI | shop 激活时间 | Network 请求数 |
|------|-----------|-----------|--------------|---------------|
| prefetch: false | - | - | - | - |
| prefetch: true | - | - | - | - |
| prefetch: 'all' | - | - | - | - |
| 手动延迟 2s | - | - | - | - |
| hover 预加载 | - | - | - | - |

## 2. 沙箱配置优化

### 2.1 当前配置

在 `packages/main/lib/bootstrap.js`:

```javascript
registerMicroApps([
  {
    name: 'shop',
    entry: entryHost,
    container: '#app-child-container',
    activeRule: prefix,
    sandbox: {
      strictStyleIsolation: false,
      experimentalStyleIsolation: true,
      excludeAssetFilter: (url) => url.includes('remoteEntry.js'),
    },
  },
]);
```

### 2.2 沙箱策略对比

#### 方案1: 完全关闭沙箱

```javascript
sandbox: false
```

**影响**：
- ✅ 性能最优（无沙箱开销）
- ❌ 全局污染风险
- ❌ 样式冲突风险
- ⚠️ Module Federation 不需要沙箱（已通过 excludeAssetFilter 排除）

**适用场景**：
- 完全可控的内部应用
- 已通过其他方式隔离（如 CSS Module、BEM 命名）

#### 方案2: 仅 JS 沙箱（当前推荐）

```javascript
sandbox: {
  strictStyleIsolation: false,        // 关闭严格样式隔离
  experimentalStyleIsolation: true,   // 启用实验性样式隔离
  excludeAssetFilter: (url) => url.includes('remoteEntry.js'),
}
```

**影响**：
- ✅ JS 隔离（使用 Proxy）
- ✅ 轻量级样式隔离（CSS 选择器前缀）
- ✅ Module Federation 正常工作
- ⚠️ 轻微性能开销

**适用场景**：默认推荐（平衡隔离和性能）

#### 方案3: 严格样式隔离

```javascript
sandbox: {
  strictStyleIsolation: true,  // Shadow DOM
  excludeAssetFilter: (url) => url.includes('remoteEntry.js'),
}
```

**影响**：
- ✅ 完全样式隔离（Shadow DOM）
- ❌ 性能开销较大
- ❌ 可能影响第三方库（antd 等）
- ❌ 调试困难

**适用场景**：样式冲突严重且无法通过命名规范解决

#### 方案4: 自定义手动隔离

```javascript
sandbox: false
```

结合项目现有的样式隔离方案：

1. **PostCSS 前缀**（已在使用）
   ```javascript
   // webpack.dev.config.js
   {
     loader: "postcss-loader",
     options: {
       postcssOptions: {
         plugins: [
           require("postcss-prefix-selector")({
             prefix: `.shop-app`  // shop 应用前缀
           })
         ]
       }
     }
   }
   ```

2. **CSS Modules**
   ```javascript
   {
     loader: 'css-loader',
     options: {
       modules: {
         localIdentName: '[local]_[hash:base64:5]',
       },
     },
   }
   ```

3. **BEM 命名约定**
   ```css
   /* shop 应用 */
   .shop__header { }
   .shop__content { }
   
   /* main 应用 */
   .main__header { }
   .main__content { }
   ```

### 2.3 沙箱性能测试

测试不同沙箱配置对子应用启动的影响：

| 沙箱配置 | mount 耗时 | 渲染耗时 | 内存占用 |
|----------|-----------|---------|---------|
| sandbox: false | - | - | - |
| 仅 JS 沙箱 | - | - | - |
| experimentalStyleIsolation | - | - | - |
| strictStyleIsolation | - | - | - |

## 3. 生命周期优化

### 3.1 优化 bootstrap

```javascript
// packages/shop/lib/life-cycles.js

export async function bootstrap() {
  console.log('shop app bootstrap');
  
  // ❌ 避免在 bootstrap 中做重操作
  // await fetchInitialData();
  // await loadHeavyLibrary();
  
  // ✅ bootstrap 只做最轻量的初始化
  // 其他操作移到 mount
}
```

### 3.2 优化 mount

```javascript
export async function mount(props) {
  console.log('shop app mount');
  
  // ✅ 先渲染 UI，再做其他操作
  render(props);
  
  // ✅ 延迟非关键操作
  requestIdleCallback(() => {
    // 注入 reducer
    if (props.injectReducer && !isReducerInjected) {
      props.injectReducer('products', productsSlice);
      isReducerInjected = true;
    }
    
    // 监听全局状态
    props.onGlobalStateChange((state, prev) => {
      console.log('shop state change', state, prev);
    });
  });
}
```

### 3.3 优化 unmount

确保清理资源：

```javascript
export async function unmount(props) {
  console.log('shop app unmount');
  
  // 卸载 React 应用
  if (root) {
    root.unmount();
    root = null;
  }
  
  // 移除 reducer（如需要）
  if (props.removeReducer && isReducerInjected) {
    props.removeReducer('products');
    isReducerInjected = false;
  }
  
  // 取消事件监听
  // 清理定时器
  // 取消 API 请求
}
```

## 4. 子应用资源优化

### 4.1 入口 HTML 优化

`packages/shop/public/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shop App</title>
  
  <!-- 预加载关键资源 -->
  <link rel="preconnect" href="http://localhost:8082">
  <link rel="preconnect" href="http://localhost:8083">
  
  <!-- 预加载 Module Federation 入口 -->
  <link rel="modulepreload" href="http://localhost:8082/remoteEntry.js">
  <link rel="modulepreload" href="http://localhost:8083/remoteEntry.js">
</head>
<body>
  <div id="root"></div>
  <div id="child-container"></div>
</body>
</html>
```

### 4.2 按需加载组件

```javascript
// packages/shop/lib/main.jsx

import React, { Suspense, lazy } from 'react';

// ❌ 同步导入
// import { Header } from 'components/Header';

// ✅ 懒加载
const Header = lazy(() => 
  import('components/Header').then(m => ({ default: m.Header }))
);

function App({ qiankunProps }) {
  return (
    <Suspense fallback={<div>Loading Header...</div>}>
      <Header />
      {/* ... */}
    </Suspense>
  );
}
```

## 5. Redux 集成优化

### 5.1 延迟注入 reducer

```javascript
// packages/shop/lib/life-cycles.js

export async function mount(props) {
  // 先渲染基础 UI
  render(props);
  
  // 延迟注入 reducer（如果不是立即需要）
  requestIdleCallback(() => {
    if (props.injectReducer && !isReducerInjected) {
      props.injectReducer('products', productsSlice);
      isReducerInjected = true;
    }
  });
}
```

### 5.2 减少 reducer 复杂度

```javascript
// packages/shop/lib/store/slices/productsSlice.js

import { createSlice } from '@reduxjs/toolkit';

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {
    // ✅ 简单、快速的 reducer
    setProducts: (state, action) => {
      state.items = action.payload;
    },
    // ❌ 避免复杂计算
    // calculateExpensiveMetrics: (state) => { ... }
  },
});

export default productsSlice.reducer;
```

## 6. 通信优化

### 6.1 避免频繁通信

```javascript
// ❌ 频繁更新全局状态
setInterval(() => {
  actions.setGlobalState({ timestamp: Date.now() });
}, 100);

// ✅ 按需更新
function updateImportantState(data) {
  actions.setGlobalState({ importantData: data });
}
```

### 6.2 使用 CustomEvent 替代轮询

```javascript
// 主应用
window.dispatchEvent(new CustomEvent('main-update', {
  detail: { data: 'something' }
}));

// 子应用
window.addEventListener('main-update', (e) => {
  console.log('Received update:', e.detail);
});
```

## 7. 实战优化建议

### 针对当前项目的优化清单

基于你的 qiankun-demo 架构：

- [ ] **预加载策略**: 测试 `prefetch: false` vs `prefetch: true`
  - 当前用户很可能会访问 shop，建议保持 `prefetch: true`
  
- [ ] **沙箱配置**: 保持当前配置
  - 已使用 PostCSS 前缀，experimentalStyleIsolation 足够
  
- [ ] **生命周期**: 
  - 将 Redux reducer 注入改为 `requestIdleCallback`
  - 延迟非关键的 `onGlobalStateChange` 监听
  
- [ ] **资源加载**:
  - 在主应用 HTML 中预加载 remoteEntry.js
  - shop 应用的 Header 组件改为懒加载（如果不是首屏必需）

- [ ] **Redux**:
  - 检查 productsSlice 是否有复杂计算
  - 考虑使用 Reselect 缓存派生数据

---

**下一步**: 继续阅读 [Module Federation 优化](./5-module-federation-optimization.md)
