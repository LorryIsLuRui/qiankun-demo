// Shop 子应用的 Redux Store
import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice.js';

// 配置子应用的 store
export const shopStore = configureStore({
  reducer: {
    products: productsReducer,
    // 添加更多子应用的 slices
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default shopStore;
