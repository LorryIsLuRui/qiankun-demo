// Redux Store 配置
// 使用 Redux Toolkit (RTK) 简化 Redux 配置
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';

// 配置 store
export const store = configureStore({
  reducer: {
    user: userReducer,
    // 在这里添加其他 slice reducers
    // posts: postsReducer,
    // comments: commentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // 配置序列化检查（针对大型对象或特殊类型）
      serializableCheck: {
        // 忽略这些 action types 的序列化检查
        ignoredActions: ['your/action/type'],
        // 忽略这些字段路径的序列化检查
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }),
  // 开发环境下启用 Redux DevTools
  devTools: process.env.NODE_ENV !== 'production',
});

// 导出类型（用于 TypeScript，如果使用 JS 可以忽略）
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
