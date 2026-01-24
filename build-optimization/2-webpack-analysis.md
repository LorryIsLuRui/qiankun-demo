# Webpack 构建分析

## 1. Bundle Analyzer 配置

### 1.1 安装依赖

```bash
npm install --save-dev webpack-bundle-analyzer speed-measure-webpack-plugin
```

### 1.2 当前配置状态

shop 应用已配置（`packages/shop/webpack.dev.config.js`）：

```javascript
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

const isAnalyze = process.env.analyze === 'analyze';
const smp = new SpeedMeasurePlugin();

const config = {
  // ... 配置
  plugins: [
    // ... 其他插件
    isAnalyze && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html',
    })
  ].filter(Boolean),
  
  performance: {
    hints: 'warning',
    maxAssetSize: 500000, // 500kb
    maxEntrypointSize: 500000,
  }
};

module.exports = smp.wrap(config);
```

### 1.3 运行分析命令

在 `packages/shop/package.json` 中添加：

```json
{
  "scripts": {
    "analyze": "analyze=analyze npm run build"
  }
}
```

运行：

```bash
cd packages/shop
npm run analyze
```

### 1.4 为其他应用添加配置

对 `main`、`utils`、`components` 应用做相同配置。

## 2. 分析 Bundle 报告

### 2.1 查看报告

打开 `packages/shop/dist/bundle-report.html`，重点关注：

#### ✅ 检查项

1. **重复依赖**
   - 是否有多个版本的 React？
   - 是否有重复的工具库（lodash, moment 等）？
   
2. **大型依赖**
   - 哪些第三方库占用最大空间？
   - 是否可以替换为更小的替代品？
   - 是否有未使用的功能可以tree-shake？

3. **代码分割**
   - Vendor bundle 是否合理？
   - 是否有应该lazy load的组件被打入主bundle？
   
4. **Module Federation**
   - remoteEntry.js 大小是否合理？
   - shared 模块是否正确配置？

### 2.2 预期结果

对于 shop 应用，理想的 bundle 结构：

```
dist/
├── remoteEntry.js          (~10-20KB)   Module Federation 入口
├── runtime.[hash].js       (~5-10KB)    Webpack runtime
├── shop.[hash].js          (~50-100KB)  Shop 业务代码
└── vendors.[hash].js       (~150-250KB) React + 第三方库（如已 shared 则更小）
```

## 3. webpack-stats 深度分析

### 3.1 生成详细统计

```bash
cd packages/shop
npx webpack --config webpack.dev.config.js --profile --json > stats-shop.json

cd ../main
npx webpack --config webpack.dev.config.js --profile --json > stats-main.json
```

### 3.2 使用在线工具分析

上传 `stats-*.json` 到以下工具：

1. **Webpack Analyse** (官方)
   - https://webpack.github.io/analyse/
   - 功能：模块依赖图、chunk详情
   
2. **Statoscope**
   - https://statoscope.tech/
   - 功能：更现代的UI、性能指标、重复检测

3. **Webpack Visualizer**
   - https://chrisbateman.github.io/webpack-visualizer/
   - 功能：树状图可视化

### 3.3 关键指标

在 stats 文件中查找：

```javascript
{
  "time": 5234,              // 总构建时间（毫秒）
  "builtAt": 1642000000000,  // 构建时间戳
  "assets": [...],           // 所有生成的资源
  "chunks": [...],           // 代码块信息
  "modules": [...],          // 模块依赖
  "warnings": [...],         // 警告信息
  "errors": [...]            // 错误信息
}
```

## 4. 优化 splitChunks

### 4.1 当前主应用配置

`packages/main/webpack.dev.config.js`:

```javascript
optimization: {
  runtimeChunk: 'single',
  splitChunks: {
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'main-vendors',
        chunks: 'all',
      },
    },
  },
}
```

### 4.2 优化建议

```javascript
splitChunks: {
  chunks: 'all',
  maxInitialRequests: 25,
  minSize: 20000,
  cacheGroups: {
    // React 相关（如果未通过 MF shared）
    react: {
      test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
      name: 'react-vendor',
      priority: 20,
      enforce: true,
    },
    // Redux 相关
    redux: {
      test: /[\\/]node_modules[\\/](@reduxjs|react-redux)[\\/]/,
      name: 'redux-vendor',
      priority: 15,
      enforce: true,
    },
    // qiankun
    qiankun: {
      test: /[\\/]node_modules[\\/]qiankun[\\/]/,
      name: 'qiankun-vendor',
      priority: 15,
      enforce: true,
    },
    // 其他第三方库
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendor',
      priority: 10,
    },
    // 公共代码
    common: {
      minChunks: 2,
      name: 'common',
      priority: 5,
      reuseExistingChunk: true,
    },
  },
}
```

## 5. Tree Shaking 检查

### 5.1 确保 sideEffects 配置

在各应用的 `package.json` 中：

```json
{
  "sideEffects": [
    "*.css",
    "*.less",
    "./lib/public-path.js"
  ]
}
```

### 5.2 检查未使用的导出

使用 webpack 的 usedExports 优化：

```javascript
optimization: {
  usedExports: true,  // 标记未使用的导出
  minimize: true,      // 生产环境删除
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true, // 删除 console
        },
      },
    }),
  ],
}
```

### 5.3 分析未使用的代码

使用 Chrome DevTools Coverage 工具：
1. 打开 DevTools → More tools → Coverage
2. 刷新页面
3. 查看红色部分（未使用代码）

## 6. 构建时间优化

### 6.1 使用缓存

```javascript
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
}
```

### 6.2 并行构建

```javascript
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,  // 并行压缩
      }),
    ],
  },
}
```

### 6.3 减少 loader 处理范围

```javascript
module: {
  rules: [
    {
      test: /\.(js|jsx)$/,
      include: path.resolve(__dirname, 'lib'),  // 只处理 lib 目录
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,  // 启用缓存
        },
      },
    },
  ],
}
```

## 7. Module Federation 特定分析

### 7.1 检查 remoteEntry.js 大小

```bash
ls -lh packages/shop/dist/remoteEntry.js
ls -lh packages/utils/dist/remoteEntry.js
ls -lh packages/components/dist/remoteEntry.js
```

目标：每个 < 20KB

### 7.2 分析 shared 配置

检查是否所有应用的 shared 配置一致：

```javascript
// 所有应用应该有相同的 shared 配置
shared: {
  react: {
    singleton: true,
    requiredVersion: '^19.2.0',
    shareScope: 'default'
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '^19.2.0',
    shareScope: 'default'
  },
}
```

## 8. 实用脚本

### 8.1 批量分析脚本

使用 `build-optimization/scripts/analyze-all.sh`:

```bash
chmod +x build-optimization/scripts/analyze-all.sh
./build-optimization/scripts/analyze-all.sh
```

### 8.2 比较构建大小

创建一个脚本记录每次构建的大小变化：

```bash
# 记录当前构建大小
du -sh packages/*/dist > build-sizes-$(date +%Y%m%d).txt
```

## 9. 常见问题诊断

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| React 被打包多次 | shared 配置未生效 | 检查所有应用的 shared 配置是否一致 |
| 体积异常大的 vendor chunk | 所有依赖都打入一个文件 | 优化 splitChunks 配置 |
| remoteEntry.js 过大 | exposes 暴露了太多模块 | 只暴露必要的模块 |
| 未使用的代码太多 | Tree-shaking 未生效 | 确保使用 ES6 模块、设置 sideEffects |
| 构建时间过长 | 缺少缓存 | 启用 filesystem cache 和 babel cache |

---

**下一步**: 继续阅读 [浏览器开发者工具](./3-browser-devtools.md)
