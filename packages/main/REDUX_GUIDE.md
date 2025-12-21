# Redux 集成文档

## 概述

本项目使用 **Redux Toolkit (RTK)** 作为状态管理方案，这是 Redux 官方推荐的最佳实践工具集。

### 为什么选择 Redux Toolkit？

- ✅ **简化配置** - 减少样板代码，开箱即用
- ✅ **内置最佳实践** - 集成 Immer、Redux Thunk、Redux DevTools
- ✅ **类型安全** - 对 TypeScript 友好
- ✅ **业界标准** - 阿里、腾讯、字节等大厂广泛使用

## 项目结构

```
packages/main/lib/
├── store/
│   ├── index.js              # Store 配置文件
│   └── slices/
│       └── userSlice.js      # User 模块的 slice
├── main.js                   # 入口文件（集成 Provider）
└── App.jsx                   # 示例组件（使用 Redux）
```

## 核心概念

### 1. Store（存储）

全局状态树，所有的状态都存储在这里。

**文件位置**: `lib/store/index.js`

```javascript
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    // 添加其他 reducers
  },
});
```

### 2. Slice（切片）

一个功能模块的状态管理单元，包含：
- 初始状态（initialState）
- 同步操作（reducers）
- 异步操作（extraReducers）
- 选择器（selectors）

**文件位置**: `lib/store/slices/userSlice.js`

### 3. Actions（动作）

触发状态变化的事件。

#### 同步 Actions
```javascript
import { updateUserField } from './store/slices/userSlice';

dispatch(updateUserField({ field: 'name', value: '新名字' }));
```

#### 异步 Actions (Thunk)
```javascript
import { fetchUserInfo } from './store/slices/userSlice';

dispatch(fetchUserInfo('123'));
```

### 4. Selectors（选择器）

从 state 中获取数据的函数。

```javascript
import { selectUser, selectUserLoading } from './store/slices/userSlice';

const userInfo = useSelector(selectUser);
const loading = useSelector(selectUserLoading);
```

## 使用指南

### 步骤 1: 在组件中导入 Hooks

```javascript
import { useSelector, useDispatch } from 'react-redux';
```

### 步骤 2: 导入所需的 Actions 和 Selectors

```javascript
import { 
  fetchUserInfo,      // 异步 action
  updateUserField,    // 同步 action
  selectUser,         // selector
  selectUserLoading   // selector
} from './store/slices/userSlice';
```

### 步骤 3: 在组件中使用

```javascript
const MyComponent = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector(selectUser);
  const loading = useSelector(selectUserLoading);

  useEffect(() => {
    // 触发异步请求
    dispatch(fetchUserInfo('123'));
  }, [dispatch]);

  const handleUpdate = () => {
    // 触发同步更新
    dispatch(updateUserField({ field: 'name', value: '新值' }));
  };

  return (
    <div>
      {loading ? '加载中...' : userInfo?.name}
      <button onClick={handleUpdate}>更新</button>
    </div>
  );
};
```

## 创建新的 Slice

### 1. 创建 Slice 文件

在 `lib/store/slices/` 目录下创建新文件，例如 `productsSlice.js`:

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 异步操作
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/products');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    addProduct: (state, action) => {
      state.items.push(action.payload);
    },
    removeProduct: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addProduct, removeProduct } = productsSlice.actions;
export const selectProducts = (state) => state.products.items;
export default productsSlice.reducer;
```

### 2. 注册到 Store

在 `lib/store/index.js` 中添加：

```javascript
import productsReducer from './slices/productsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    products: productsReducer,  // 新增
  },
});
```

## 异步请求最佳实践

### 1. 使用 createAsyncThunk

```javascript
export const fetchData = createAsyncThunk(
  'slice/fetchData',
  async (params, { rejectWithValue, getState, dispatch }) => {
    try {
      // 可以访问当前 state
      const currentState = getState();
      
      // 发起请求
      const response = await apiService.getData(params);
      
      // 可以触发其他 actions
      dispatch(otherAction());
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
```

### 2. 处理加载状态

```javascript
extraReducers: (builder) => {
  builder
    .addCase(fetchData.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchData.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
    })
    .addCase(fetchData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
}
```

### 3. 条件请求（避免重复请求）

```javascript
export const fetchDataIfNeeded = () => (dispatch, getState) => {
  const { data, loading } = getState().mySlice;
  
  if (!data && !loading) {
    dispatch(fetchData());
  }
};
```

## 调试

### Redux DevTools

项目已自动集成 Redux DevTools，在浏览器中安装扩展后即可使用：

1. 安装 [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
2. 打开浏览器开发者工具
3. 切换到 "Redux" 标签页
4. 查看 state 变化、action 历史、时间旅行等

### 日志调试

```javascript
// 在 store/index.js 中添加日志中间件
const logger = (store) => (next) => (action) => {
  console.group(action.type);
  console.info('dispatching', action);
  let result = next(action);
  console.log('next state', store.getState());
  console.groupEnd();
  return result;
};

export const store = configureStore({
  reducer: { /* ... */ },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logger),
});
```

## 性能优化

### 1. 使用 Reselect 缓存计算结果

```javascript
import { createSelector } from '@reduxjs/toolkit';

export const selectExpensiveData = createSelector(
  [selectRawData],
  (rawData) => {
    // 复杂计算只在 rawData 变化时执行
    return rawData.map(/* ... */);
  }
);
```

### 2. 使用 shallowEqual 避免不必要的重渲染

```javascript
import { shallowEqual, useSelector } from 'react-redux';

const data = useSelector(selectData, shallowEqual);
```

### 3. 拆分 Selector

```javascript
// ❌ 不好 - 一个变化导致整个对象重新创建
const data = useSelector(state => ({
  user: state.user,
  products: state.products,
}));

// ✅ 好 - 分别订阅
const user = useSelector(selectUser);
const products = useSelector(selectProducts);
```

## 常见问题

### Q: 如何处理多个异步请求的依赖关系？

```javascript
const handleComplexFlow = async (dispatch, getState) => {
  const userResult = await dispatch(fetchUser()).unwrap();
  const productsResult = await dispatch(fetchProducts(userResult.id)).unwrap();
  return productsResult;
};
```

### Q: 如何在 Slice 外部访问 Store？

```javascript
// store/index.js
export const store = configureStore({ /* ... */ });

// 其他文件
import { store } from './store';
const state = store.getState();
store.dispatch(someAction());
```

### Q: 如何重置整个 Store？

```javascript
// 在 root reducer 中添加
const rootReducer = combineReducers({
  user: userReducer,
  // ...
});

export const resetStore = createAction('RESET_STORE');

const resettableReducer = (state, action) => {
  if (action.type === resetStore.type) {
    return rootReducer(undefined, action);
  }
  return rootReducer(state, action);
};
```

## 参考资料

- [Redux Toolkit 官方文档](https://redux-toolkit.js.org/)
- [React Redux 官方文档](https://react-redux.js.org/)
- [Redux 风格指南](https://redux.js.org/style-guide/)
- [阿里 Ant Design Pro 状态管理方案](https://pro.ant.design/zh-CN/docs/state-management)

## 下一步

- [ ] 添加更多业务 Slices
- [ ] 集成真实 API 服务
- [ ] 添加 TypeScript 类型支持
- [ ] 配置持久化（redux-persist）
- [ ] 添加单元测试
