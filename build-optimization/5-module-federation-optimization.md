# Module Federation 优化

## 1. shared 配置优化

### 1.1 当前配置分析

在 `packages/shop/webpack.dev.config.js`:

```javascript
shared: {
  react: {
    singleton: true,
    // eager: true,  // 当前注释掉
    requiredVersion: '^19.2.0',
    shareScope: 'default'
  },
  'react-dom': {
    singleton: true,
    // eager: true,  // 当前注释掉
    requiredVersion: '^19.2.0',
    shareScope: 'default'
  },
}
```

### 1.2 eager 配置对比

#### 方案1: eager: false (默认，当前配置)

```javascript
shared: {
  react: {
    singleton: true,
    eager: false,  // 或不设置
    requiredVersion: '^19.2.0',
  },
}
```

**Bundle 结构**：
```
shop/
├── remoteEntry.js         (~10KB)   ← 入口
├── shop.[hash].js         (~80KB)   ← 业务代码
├── runtime.[hash].js      (~8KB)    ← Webpack runtime
└── vendors_react.[hash].js (~150KB) ← React 异步 chunk
```

**影响**：
- ✅ 初始 bundle 小（shop.js + runtime.js ~88KB）
- ✅ React 异步加载，可以并行
- ❌ 多一个 HTTP 请求
- ❌ 首次渲染需等待 React 加载

**加载时序**：
```
remoteEntry.js → shop.js → vendors_react.js
                              ↓
                           渲染开始
```

#### 方案2: eager: true

```javascript
shared: {
  react: {
    singleton: true,
    eager: true,  // 👈 打入主 bundle
    requiredVersion: '^19.2.0',
  },
}
```

**Bundle 结构**：
```
shop/
├── remoteEntry.js    (~10KB)
├── shop.[hash].js    (~230KB)  ← React 已打入
└── runtime.[hash].js (~8KB)
```

**影响**：
- ❌ 初始 bundle 大（~230KB）
- ✅ 减少一个 HTTP 请求
- ✅ 首次渲染更快（无需等待异步加载）
- ⚠️ 如果主应用已加载 React，会重复下载

**加载时序**：
```
remoteEntry.js → shop.js (含 React)
                  ↓
               渲染开始
```

#### 方案3: 主应用 eager，子应用 lazy

**主应用** (`packages/main/webpack.dev.config.js`):
```javascript
// 主应用不使用 ModuleFederationPlugin，直接引入 React
// 无需配置 shared
```

**子应用** (`packages/shop/webpack.dev.config.js`):
```javascript
shared: {
  react: {
    singleton: true,
    eager: false,  // 从主应用获取
    requiredVersion: '^19.2.0',
  },
}
```

**影响**：
- ✅ React 只在主应用加载一次
- ✅ 子应用 bundle 最小
- ✅ 利用浏览器缓存
- ⚠️ 需要确保主应用先加载 React

### 1.3 推荐配置

基于你的架构（主应用 + qiankun + Module Federation）：

**主应用** - 不使用 Module Federation 的 shared（直接引入）:
```javascript
// 主应用直接 import React，不通过 MF
import React from 'react';
import ReactDOM from 'react-dom/client';
```

**utils** (`packages/utils/webpack.dev.config.js`):
```javascript
new ModuleFederationPlugin({
  name: 'utils',
  filename: 'remoteEntry.js',
  library: { type: "umd", name: "utils" },
  exposes: {
    './index': './lib/utils.js',
  },
  shared: {
    react: {
      singleton: true,
      eager: false,  // 让主应用提供
      requiredVersion: '^19.2.0',
    },
    'react-dom': {
      singleton: true,
      eager: false,
      requiredVersion: '^19.2.0',
    },
  },
}),
```

**components** - 同 utils

**shop** - 同 utils

### 1.4 测试对比

| 配置 | 初始 bundle | HTTP 请求数 | 首次渲染时间 | 总下载大小 |
|------|------------|------------|-------------|-----------|
| 全部 eager: false | ~88KB | 4 | - | ~250KB |
| 全部 eager: true | ~230KB | 3 | - | ~250KB |
| 主应用 eager，子应用 lazy | ~88KB | 3 | - | ~250KB |

## 2. exposes 优化

### 2.1 当前配置

**utils** (`packages/utils/webpack.dev.config.js`):
```javascript
exposes: {
  './index': './lib/utils.js',
}
```

**components** (`packages/components/webpack.dev.config.js`):
```javascript
exposes: {
  './Header': './src/header/Header.jsx',
}
```

### 2.2 优化建议

#### ✅ 只暴露必要的模块

```javascript
// ❌ 暴露整个目录
exposes: {
  './components': './src/index.js',  // 包含所有组件
}

// ✅ 按需暴露
exposes: {
  './Header': './src/header/Header.jsx',
  './Footer': './src/footer/Footer.jsx',
  // 只暴露实际使用的组件
}
```

#### ✅ 避免暴露大型依赖

```javascript
// ❌ 暴露带有大型依赖的模块
exposes: {
  './ChartComponent': './src/ChartComponent.jsx',  // 包含 echarts (1MB+)
}

// ✅ 让使用者自己安装大型依赖
// 或者单独暴露
exposes: {
  './ChartComponent': './src/ChartComponent.jsx',
  './charts': 'echarts',  // 明确暴露依赖
}
```

### 2.3 remoteEntry.js 大小控制

目标：每个 remoteEntry.js < 20KB

检查当前大小：
```bash
ls -lh packages/utils/dist/remoteEntry.js
ls -lh packages/components/dist/remoteEntry.js
```

如果过大，检查：
1. 是否暴露了太多模块？
2. 是否有大型依赖被打入？

## 3. remotes 配置优化

### 3.1 当前配置

在 `packages/shop/webpack.dev.config.js`:

```javascript
remotes: {
  utils: `utils@${process.env.PUBLIC_PATH}${isDev ? ':8082' : prefix + 'utils'}/remoteEntry.js`,
  components: `components@${process.env.PUBLIC_PATH}${isDev ? ':8083' : prefix + 'components'}/remoteEntry.js`,
}
```

### 3.2 并行加载优化

确保 remoteEntry.js 并行加载，在主应用 HTML 中预加载：

`packages/main/public/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Qiankun Demo</title>
  
  <!-- 预连接到远程服务器 -->
  <link rel="preconnect" href="http://localhost:8082">
  <link rel="preconnect" href="http://localhost:8083">
  <link rel="preconnect" href="http://localhost:8081">
  
  <!-- 预加载 Module Federation 入口 -->
  <link rel="modulepreload" href="http://localhost:8082/remoteEntry.js">
  <link rel="modulepreload" href="http://localhost:8083/remoteEntry.js">
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

### 3.3 动态 remotes

如果需要运行时确定 remote URL：

```javascript
// webpack.dev.config.js
remotes: {
  utils: 'utils@utils.js',  // 占位符
}

// 在应用启动前设置
// public/index.html
<script>
  window.REMOTE_UTILS_URL = 'http://localhost:8082/remoteEntry.js';
</script>
```

## 4. library 配置优化

### 4.1 当前配置

**utils** (`packages/utils/webpack.dev.config.js`):
```javascript
new ModuleFederationPlugin({
  name: 'utils',
  filename: 'remoteEntry.js',
  library: { type: "umd", name: "utils" },  // ← 关键配置
  // ...
})
```

### 4.2 library type 选择

#### type: "umd" (当前配置，推荐)

```javascript
library: { type: "umd", name: "utils" }
```

**优势**：
- ✅ 兼容 qiankun 沙箱（沙箱使用 Proxy，var 类型会有问题）
- ✅ 可以在 Node.js 和浏览器中使用
- ✅ 挂载到 `window.utils`

**适用**：qiankun + Module Federation 架构

#### type: "var"

```javascript
library: { type: "var", name: "utils" }
```

**问题**：
- ❌ qiankun 沙箱下无法访问（var 不会成为 proxyWindow 的属性）
- ❌ 需要关闭沙箱 `sandbox: false`

**适用**：不使用 qiankun 沙箱的场景

#### type: "window"

```javascript
library: { type: "window", name: "utils" }
```

**优势**：
- ✅ 兼容 qiankun 沙箱
- ✅ 明确挂载到 window

**适用**：仅浏览器环境

### 4.3 当前项目推荐

保持 `type: "umd"`，原因：
1. 已在使用 qiankun 沙箱
2. README 中提到 "var 需要弃用沙箱，umd 不需要"
3. 兼容性最好

## 5. 版本管理

### 5.1 严格版本控制

确保所有应用的 shared 库版本一致：

```bash
# 检查所有应用的 React 版本
grep -r "\"react\":" packages/*/package.json
```

应该都是：
```json
"react": "^19.2.0"
```

### 5.2 版本不匹配处理

在 shared 配置中：

```javascript
shared: {
  react: {
    singleton: true,
    requiredVersion: '^19.2.0',
    strictVersion: false,  // 允许不同小版本
    // strictVersion: true,  // 强制相同版本
  },
}
```

**推荐**：`strictVersion: false`（允许 19.2.0 和 19.2.1 共存）

## 6. 完整优化配置示例

### utils 应用

`packages/utils/webpack.dev.config.js`:

```javascript
new ModuleFederationPlugin({
  name: 'utils',
  filename: 'remoteEntry.js',
  library: { type: "umd", name: "utils" },
  exposes: {
    './index': './lib/utils.js',
    // 只暴露实际使用的模块
  },
  shared: {
    react: {
      singleton: true,
      eager: false,  // 从主应用获取
      requiredVersion: '^19.2.0',
      strictVersion: false,
    },
    'react-dom': {
      singleton: true,
      eager: false,
      requiredVersion: '^19.2.0',
      strictVersion: false,
    },
  },
}),
```

### shop 应用

`packages/shop/webpack.dev.config.js`:

```javascript
new ModuleFederationPlugin({
  name: 'shop',
  remotes: {
    utils: `utils@${process.env.PUBLIC_PATH}${isDev ? ':8082' : prefix + 'utils'}/remoteEntry.js`,
    components: `components@${process.env.PUBLIC_PATH}${isDev ? ':8083' : prefix + 'components'}/remoteEntry.js`,
  },
  shared: {
    react: {
      singleton: true,
      eager: false,
      requiredVersion: '^19.2.0',
      strictVersion: false,
    },
    'react-dom': {
      singleton: true,
      eager: false,
      requiredVersion: '^19.2.0',
      strictVersion: false,
    },
  }
}),
```

## 7. 性能监控

### 7.1 监控 Module Federation 加载

在 shop 应用中：

```javascript
// packages/shop/lib/main.jsx

// 监控远程模块加载
const loadStart = performance.now();
performance.mark('mf-load-start');

import { Header } from 'components/Header';
import { utilsSayHi } from 'utils';

performance.mark('mf-load-end');
performance.measure('mf-load', 'mf-load-start', 'mf-load-end');

const loadEnd = performance.now();
console.log(`Module Federation 加载耗时: ${loadEnd - loadStart}ms`);
```

### 7.2 检查 shared 是否生效

在浏览器控制台：

```javascript
// 检查 React 实例
console.log('React instance:', window.React);

// 应该只有一个 React 实例
// 如果有多个，说明 singleton 未生效
```

---

**下一步**: 继续阅读 [性能基准线](./6-benchmark.md)
