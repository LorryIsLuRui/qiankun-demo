# 共享 Redux Store 树架构文档

## 架构概述

所有子应用和模块联邦应用共享同一个 Redux Store 树，通过**动态注入 reducer**的方式实现。

### Store 树结构

```javascript
{
  // 主应用的 reducers
  user: { userInfo, loading, error },
  
  // Shop 子应用动态注入的 reducer
  shop_products: { productList, cart, loading, error },
  
  // 其他子应用可以继续注入
  admin_dashboard: { ... },
  order_management: { ... },
}
```

## 实现原理

### 1. 动态 Reducer Manager

主应用的 store 使用 **Reducer Manager** 模式，支持运行时动态添加/移除 reducer。

**核心代码 (packages/main/lib/store/index.js):**

```javascript
function createReducerManager(initialReducers) {
  const reducers = { ...initialReducers };
  let combinedReducer = combineReducers(reducers);
  
  return {
    // 动态添加 reducer
    add: (key, reducer) => {
      if (!key || reducers[key]) return;
      reducers[key] = reducer;
      combinedReducer = combineReducers(reducers);
      console.log(`✅ 动态注入 reducer: ${key}`);
    },
    
    // 动态移除 reducer
    remove: (key) => {
      if (!key || !reducers[key]) return;
      delete reducers[key];
      combinedReducer = combineReducers(reducers);
      console.log(`❌ 移除 reducer: ${key}`);
    },
    
    // reducer 函数
    reduce: (state, action) => combinedReducer(state, action),
  };
}
```

### 2. 子应用注入 Reducer

子应用在 `mount` 生命周期时注入自己的 reducer。

**子应用代码 (packages/shop/lib/life-cycles.js):**

```javascript
export async function mount(props) {
  // 注入 reducer 到主应用的 store
  if (props.injectReducer && !isReducerInjected) {
    props.injectReducer('shop_products', productsReducer);
    isReducerInjected = true;
  }
  
  render(props);
}

export async function unmount(props) {
  // 卸载时移除 reducer（可选）
  if (props.removeReducer && isReducerInjected) {
    props.removeReducer('shop_products');
    isReducerInjected = false;
  }
}
```

### 3. 使用共享 Store

子应用使用主应用传递的 store，而不是创建自己的 store。

```javascript
// ❌ 旧方式：子应用独立 store
<Provider store={shopStore}>
  <App />
</Provider>

// ✅ 新方式：使用主应用的 store
<Provider store={props.mainStore}>
  <App />
</Provider>
```

## 使用指南

### 主应用配置

**1. 创建支持动态注入的 Store**

```javascript
// packages/main/lib/store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';

const reducerManager = createReducerManager({
  user: userReducer,  // 主应用的 reducer
});

export const store = configureStore({
  reducer: reducerManager.reduce,
});

store.reducerManager = reducerManager;

export const injectReducer = (key, reducer) => {
  store.reducerManager.add(key, reducer);
  store.dispatch({ type: '@@REDUCER_INJECTED', key });
};

export const removeReducer = (key) => {
  store.reducerManager.remove(key);
  store.dispatch({ type: '@@REDUCER_REMOVED', key });
};
```

**2. 注册子应用时传递方法**

```javascript
// packages/main/lib/bootstrap.js
import { store, injectReducer, removeReducer } from './store';

registerMicroApps([
  {
    name: 'shop',
    props: { 
      mainStore: store,
      injectReducer: injectReducer,
      removeReducer: removeReducer,
      getMainState: () => store.getState(),
      dispatchMainAction: (action) => store.dispatch(action),
    },
  },
]);
```

### 子应用配置

**1. 只导出 Reducer，不创建 Store**

```javascript
// packages/shop/lib/store/slices/productsSlice.js
const productsSlice = createSlice({
  name: 'products',
  initialState: { productList: [], cart: [] },
  reducers: { /* ... */ },
});

export default productsSlice.reducer;  // 只导出 reducer
```

**2. 生命周期中注入 Reducer**

```javascript
// packages/shop/lib/life-cycles.js
import productsReducer from './store/slices/productsSlice';

let isReducerInjected = false;

export async function mount(props) {
  // 注入 reducer
  if (props.injectReducer && !isReducerInjected) {
    props.injectReducer('shop_products', productsReducer);
    isReducerInjected = true;
  }
  
  // 使用主应用的 store 渲染
  root.render(
    <Provider store={props.mainStore}>
      <App />
    </Provider>
  );
}

export async function unmount(props) {
  // 移除 reducer（可选）
  if (props.removeReducer) {
    props.removeReducer('shop_products');
    isReducerInjected = false;
  }
}
```

**3. 组件中使用**

```javascript
// packages/shop/lib/main.jsx
const ShopApp = () => {
  const dispatch = useDispatch();
  
  // 访问子应用自己的状态（注意路径是注入的 key）
  const products = useSelector(state => state.shop_products?.productList || []);
  
  // 访问主应用的状态（同一个 store 树）
  const userInfo = useSelector(state => state.user?.userInfo);
  
  // 分发 action（会更新对应的 reducer）
  dispatch(fetchProducts());
  
  return (
    <div>
      <h3>商品列表: {products.length}</h3>
      <h3>用户: {userInfo?.name}</h3>
    </div>
  );
};
```

## 命名规范

### Reducer Key 命名

为避免冲突，建议使用 `{应用名}_{模块名}` 的格式：

```javascript
// ✅ 推荐
injectReducer('shop_products', productsReducer);
injectReducer('shop_cart', cartReducer);
injectReducer('admin_users', usersReducer);
injectReducer('order_list', orderListReducer);

// ❌ 避免
injectReducer('products', productsReducer);  // 可能和其他应用冲突
```

### Selector 使用

```javascript
// 访问注入的 reducer 状态
const products = useSelector(state => state.shop_products?.productList);
const cart = useSelector(state => state.shop_cart?.items);

// 访问主应用状态
const user = useSelector(state => state.user?.userInfo);
```

## 优势与注意事项

### ✅ 优势

1. **统一状态树** - 所有应用的状态在一个地方，易于调试和管理
2. **跨应用通信简单** - 不需要额外的通信机制，直接访问同一个 store
3. **Redux DevTools 友好** - 可以看到完整的 state 树和 action 流
4. **状态持久化容易** - 只需要持久化一个 store
5. **时间旅行调试** - 可以回溯整个应用的状态变化

### ⚠️ 注意事项

1. **命名冲突** - 必须确保 reducer key 不冲突
2. **状态清理** - 子应用卸载时决定是否保留状态
3. **性能考虑** - 一个大的 state 树可能影响性能（但通常不是问题）
4. **独立运行** - 子应用独立运行时需要降级方案

## 降级方案（独立运行）

子应用独立运行时，需要创建自己的 store：

```javascript
// packages/shop/lib/life-cycles.js
function createFallbackStore() {
  const { configureStore } = require('@reduxjs/toolkit');
  return configureStore({
    reducer: {
      products: productsReducer,
    },
  });
}

if (!window.__POWERED_BY_QIANKUN__) {
  const fallbackStore = createFallbackStore();
  root.render(
    <Provider store={fallbackStore}>
      <App />
    </Provider>
  );
}
```

**注意：** 独立运行时的 state 路径不同：
- 在主应用中: `state.shop_products.productList`
- 独立运行: `state.products.productList`

需要在 selector 中处理：

```javascript
const products = useSelector(state => {
  // 优先使用注入的路径，降级到独立路径
  return state.shop_products?.productList || state.products?.productList || [];
});
```

## 调试技巧

### 1. 查看完整 Store 树

```javascript
// 在组件中
useEffect(() => {
  const state = store.getState();
  console.log('🌳 完整 Store 树:', Object.keys(state));
  console.log('📊 Store 数据:', state);
}, []);
```

### 2. Redux DevTools

安装 Redux DevTools 扩展后，可以看到：
- 完整的 state 树结构
- 所有 action 的历史记录
- 每个 action 导致的 state 变化

### 3. 监听 Reducer 注入

```javascript
// 主应用 store
store.subscribe(() => {
  console.log('Store 更新，当前 reducers:', Object.keys(store.getState()));
});
```

## 实际案例

### 案例：电商系统

**Store 树结构：**

```javascript
{
  // 主应用
  user: {
    userInfo: { id: '123', name: '张三' },
    permissions: ['read', 'write'],
    loading: false,
  },
  theme: {
    mode: 'light',
    primaryColor: '#1890ff',
  },
  
  // Shop 子应用注入
  shop_products: {
    productList: [...],
    cart: [...],
  },
  
  // Admin 子应用注入
  admin_users: {
    userList: [...],
  },
  admin_config: {
    settings: {...},
  },
  
  // Order 子应用注入
  order_list: {
    orders: [...],
  },
}
```

**跨应用数据访问：**

```javascript
// Shop 子应用可以访问用户信息
const ShopApp = () => {
  const userInfo = useSelector(state => state.user.userInfo);
  const cart = useSelector(state => state.shop_products.cart);
  
  return <div>欢迎 {userInfo.name}，您的购物车有 {cart.length} 件商品</div>;
};

// Admin 子应用可以看到用户的购物车
const AdminApp = () => {
  const shopCart = useSelector(state => state.shop_products?.cart || []);
  
  return <div>当前有用户的购物车: {shopCart.length} 件</div>;
};
```

## 最佳实践

### 1. Reducer 设计原则

```javascript
// ✅ 推荐：扁平化设计
{
  shop_products: { productList, loading },
  shop_cart: { items, total },
  shop_orders: { list, current },
}

// ❌ 避免：过度嵌套
{
  shop: {
    products: { ... },
    cart: { ... },
    orders: { ... },
  }
}
```

### 2. 状态清理策略

```javascript
// 选项1：卸载时保留状态（用户体验好）
export async function unmount(props) {
  // 不移除 reducer，保留状态
  // 用户再次进入子应用时，状态还在
}

// 选项2：卸载时清理状态（节省内存）
export async function unmount(props) {
  props.removeReducer('shop_products');
  // 用户再次进入需要重新加载数据
}
```

### 3. 避免状态污染

```javascript
// ✅ 好的做法：重置状态
const productsSlice = createSlice({
  name: 'products',
  reducers: {
    reset: () => initialState,  // 提供重置方法
  },
});

// 在卸载时重置而不是删除
export async function unmount(props) {
  props.dispatchMainAction({ type: 'products/reset' });
}
```

## 总结

共享 Redux Store 树的架构让微前端系统的状态管理更加统一和简单：

- ✅ **一个 Store** - 所有应用共享
- ✅ **动态注入** - 子应用按需注入 reducer
- ✅ **统一调试** - Redux DevTools 看到全局
- ✅ **简化通信** - 不需要额外的跨应用通信机制
- ✅ **类型安全** - 可以为整个 store 定义 TypeScript 类型

这是大型微前端项目推荐的状态管理方案。
