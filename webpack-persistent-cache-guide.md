# Webpack 持久化缓存完整注意事项

## 1. **Webpack 配置层面**

### ✅ 基础配置
```javascript
cache: {
  type: 'filesystem',
  cacheDirectory: path.resolve(__dirname, '../../.cache/webpack'),
  buildDependencies: {
    config: [__filename], // ⚠️ 配置文件变化时自动失效缓存
  },
}
```

### ⚠️ 关键注意点

**a) 缓存目录要统一**
```javascript
// ❌ 错误：多个项目共用同一缓存目录会冲突
cacheDirectory: path.resolve(__dirname, '.cache/webpack')

// ✅ 正确：monorepo 中每个包用独立目录
cacheDirectory: path.resolve(__dirname, '../../.cache/webpack', name)
```

**b) buildDependencies 要配全**
```javascript
buildDependencies: {
  config: [__filename],  // webpack 配置文件
  // 如果有其他配置依赖也要加上
  // tsconfig: [path.resolve(__dirname, 'tsconfig.json')],
  // babel: [path.resolve(__dirname, '.babelrc')],
}
```

**c) 使用 contenthash 而非 hash**
```javascript
// ✅ 正确：文件内容变化才改变 hash
filename: 'assets/[name].[contenthash].js'
chunkFilename: 'assets/[name].[contenthash].js'

// ❌ 错误：每次构建都会变
filename: 'assets/[name].[hash].js'
```

**d) 缓存 name/version 配置**（可选但推荐）
```javascript
cache: {
  type: 'filesystem',
  version: 'v1', // 手动控制缓存版本，大改时可以升级
  name: process.env.NODE_ENV, // dev/prod 分开缓存
  cacheDirectory: path.resolve(__dirname, '../../.cache/webpack'),
}
```

---

## 2. **.gitignore 配置**

```gitignore
# ⚠️ 必须忽略缓存目录
.cache/
node_modules/.cache/

# 构建产物
dist/
build/
```

---

## 3. **CI/CD 配置（GitHub Actions）**

### ⚠️ 关键点

**a) 缓存路径必须与 webpack 配置一致**
```yaml
# webpack 配置：../../.cache/webpack
# 所以在项目根目录是：.cache/webpack
path: .cache/webpack  # ✅
```

**b) cache key 要合理设计**
```yaml
# ❌ 过于宽泛：永远命中缓存，依赖更新不生效
key: ${{ runner.os }}-webpack

# ❌ 过于严格：任何文件变化都失效
key: ${{ runner.os }}-webpack-${{ hashFiles('**/*') }}

# ✅ 推荐：依赖 + webpack 配置
key: ${{ runner.os }}-webpack-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ hashFiles('**/webpack*.js') }}
restore-keys: |
  ${{ runner.os }}-webpack-${{ hashFiles('**/pnpm-lock.yaml') }}-
  ${{ runner.os }}-webpack-
```

**c) restore-keys 降级策略**
```yaml
restore-keys: |
  ${{ runner.os }}-webpack-${{ hashFiles('**/pnpm-lock.yaml') }}-
  ${{ runner.os }}-webpack-
```
- 第一优先：依赖相同，配置可能不同的缓存
- 第二优先：任意同平台的 webpack 缓存

**d) 必须先安装依赖再恢复缓存**
```yaml
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v2
  - run: pnpm install          # ⚠️ 先装依赖
  - uses: actions/cache@v3     # ⚠️ 再恢复缓存
    with:
      path: .cache/webpack
```

**e) 完整的 CI workflow 示例**
```yaml
name: Cache Webpack Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Get pnpm store directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV
      
      - name: Cache pnpm dependencies
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-
      
      - name: Cache webpack build
        uses: actions/cache@v3
        with:
          path: .cache/webpack
          key: ${{ runner.os }}-webpack-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ hashFiles('**/webpack*.js') }}
          restore-keys: |
            ${{ runner.os }}-webpack-${{ hashFiles('**/pnpm-lock.yaml') }}-
            ${{ runner.os }}-webpack-
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
```

---

## 4. **清除缓存的场景**

### 手动清除
```bash
# 本地开发
rm -rf .cache/webpack

# 或在 package.json 添加脚本
"scripts": {
  "clean:cache": "rm -rf .cache node_modules/.cache",
  "build:fresh": "npm run clean:cache && npm run build"
}
```

### 自动失效场景
- ✅ webpack 配置文件修改（已配置 `buildDependencies`）
- ✅ dependencies 版本变化（cache key 包含 lock 文件）
- ⚠️ 环境变量变化（**不会**自动失效，需手动清除或更新 version）
- ⚠️ loader/plugin 内部逻辑变化（需手动清除）

---

## 5. **性能监控与验证**

### a) 验证缓存是否生效
```javascript
// webpack 配置中启用日志
cache: {
  type: 'filesystem',
  profile: true, // 输出详细缓存信息
}

// 或命令行
webpack --profile
```

### b) 查看缓存命中情况
```bash
# 首次构建（冷启动）
rm -rf .cache && time npm run build

# 二次构建（缓存命中）
time npm run build  # 应该明显更快
```

### c) 使用 speed-measure-plugin
```javascript
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
  // ... webpack config
});
```

---

## 6. **常见坑点**

### ❌ 坑 1：缓存目录权限问题
```bash
# CI 环境可能需要
chmod -R 755 .cache
```

### ❌ 坑 2：不同 Node 版本缓存不兼容
```yaml
# CI 中固定 Node 版本
- uses: actions/setup-node@v4
  with:
    node-version: '18'  # ⚠️ 固定版本
```

### ❌ 坑 3：loader 缓存冲突
```javascript
// babel-loader 和 webpack cache 冲突
{
  loader: 'babel-loader',
  options: {
    cacheDirectory: false, // ⚠️ 禁用 babel 自己的缓存
  }
}

// swc-loader 同理
```

### ❌ 坑 4：多进程构建缓存锁
```javascript
// 使用 thread-loader 或 HappyPack 时
cache: {
  type: 'filesystem',
  allowCollectingMemory: true, // ⚠️ 允许在多进程下收集内存
}
```

---

## 7. **本项目特殊注意**

### ✅ 已做对的
1. 用 `swc-loader` 替代 `babel-loader`（速度更快）
2. 缓存目录按包名隔离（`name` 变量）
3. 配置了 `buildDependencies`

### ⚠️ 需要补充的
1. **完善 CI workflow**（缺少构建步骤）
2. **优化 cache key**（加上 webpack 配置文件 hash）
3. **添加 cache version**（便于手动控制缓存版本）

### 推荐配置
```javascript
cache: {
  type: 'filesystem',
  version: `${process.env.NODE_ENV}-v1`, // ⚠️ 加上这个
  name: name,
  cacheDirectory: path.resolve(__dirname, '../../.cache/webpack', name),
  buildDependencies: {
    config: [__filename],
  },
}
```

---

## 8. **测试 Checklist**

```bash
# ✅ 1. 首次构建时间
rm -rf .cache && time npm run build

# ✅ 2. 二次构建时间（应该显著降低）
time npm run build

# ✅ 3. 修改源码后构建（只重新编译变化的模块）
# 修改一个文件
time npm run build

# ✅ 4. 修改 webpack 配置后（缓存应失效）
# 修改 webpack.config.js
time npm run build

# ✅ 5. 清除缓存后（回到首次构建时间）
rm -rf .cache && time npm run build
```

---

## 9. **性能对比参考**

### 本项目实测数据（仅供参考）

| 配置 | 首次构建 | 二次构建 | 说明 |
|------|----------|----------|------|
| 原始（babel-loader） | ~1817ms | ~1657ms | 无缓存 |
| swc-loader | ~1475ms | ~876ms | 编译速度提升 |
| swc + filesystem cache | ~876ms | **~20ms** | 缓存命中 |

### 预期效果
- 首次构建：与无缓存时相近
- 二次构建（完全缓存命中）：**提速 90%+**
- 部分文件修改：仅重新编译变化的模块

---

## 10. **调试技巧**

### 查看缓存统计
```bash
# 添加 webpack 参数
npx webpack --profile --json > stats.json

# 或在 package.json
"build:stats": "webpack --profile --json > stats.json"
```

### 查看缓存目录大小
```bash
du -sh .cache/webpack/*
```

### 清除特定包的缓存
```bash
rm -rf .cache/webpack/shop
rm -rf .cache/webpack/main
```

---

## 总结

持久化缓存的核心是：
1. **正确配置** webpack cache
2. **合理设计** CI cache key
3. **监控验证** 缓存效果
4. **及时清理** 异常缓存

按照本文档检查，确保所有环节配置正确，即可享受极致的构建速度！
