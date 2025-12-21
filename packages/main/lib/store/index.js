// Redux Store 配置 - 支持动态注入 reducer
// 使用 Redux Toolkit (RTK) 简化 Redux 配置
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';

// 静态 reducers（主应用的 reducers）
const staticReducers = {
  user: userReducer,
};

// 创建 reducer manager 用于动态注入
function createReducerManager(initialReducers) {
  // 保存已注册的 reducers
  const reducers = { ...initialReducers };
  
  // 创建组合后的 reducer
  let combinedReducer = combineReducers(reducers);
  
  // 保存需要删除的 reducer keys
  let keysToRemove = [];
  
  return {
    getReducerMap: () => reducers,
    
    // reducer 函数
    reduce: (state, action) => {
      // 如果有需要删除的 keys，先清理 state
      if (keysToRemove.length > 0) {
        state = { ...state };
        for (let key of keysToRemove) {
          delete state[key];
        }
        keysToRemove = [];
      }
      
      // 使用组合后的 reducer
      return combinedReducer(state, action);
    },
    
    // 动态添加 reducer
    add: (key, reducer) => {
      if (!key || reducers[key]) {
        return;
      }
      
      // 添加新的 reducer
      reducers[key] = reducer;
      
      // 重新生成组合 reducer
      combinedReducer = combineReducers(reducers);
      
      console.log(`✅ 动态注入 reducer: ${key}`);
    },
    
    // 动态移除 reducer
    remove: (key) => {
      if (!key || !reducers[key]) {
        return;
      }
      
      // 删除 reducer
      delete reducers[key];
      
      // 标记需要清理的 key
      keysToRemove.push(key);
      
      // 重新生成组合 reducer
      combinedReducer = combineReducers(reducers);
      
      console.log(`❌ 移除 reducer: ${key}`);
    },
  };
}

// 创建 reducer manager
const reducerManager = createReducerManager(staticReducers);

// 配置 store
export const store = configureStore({
  reducer: reducerManager.reduce,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['your/action/type'],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// 将 reducer manager 挂载到 store 上
store.reducerManager = reducerManager;

// 提供动态注入 reducer 的方法
export const injectReducer = (key, reducer) => {
  store.reducerManager.add(key, reducer);
  
  // 触发一个 action 让 store 更新
  store.dispatch({ type: '@@REDUCER_INJECTED', key });
};

// 提供移除 reducer 的方法
export const removeReducer = (key) => {
  store.reducerManager.remove(key);
  
  // 触发一个 action 让 store 更新
  store.dispatch({ type: '@@REDUCER_REMOVED', key });
};

// 获取当前所有 reducer 的 keys
export const getReducerKeys = () => {
  return Object.keys(store.reducerManager.getReducerMap());
};

console.log('🏪 主应用 Redux Store 已创建，支持动态注入 reducer');
