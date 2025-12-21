// 子应用shop
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import productsSlice from './store/slices/productsSlice';
import App from './main.jsx';

const CHILD_CONTAINER_ID = 'child-container';
let root = null;
let isReducerInjected = false;

// 渲染函数
function render(props) {
  const mountNode = props.container ? props.container.querySelector(`#${CHILD_CONTAINER_ID}`) : document.getElementById('root');
  if (!root) {
    root = createRoot(mountNode);
  }

  // 使用主应用的 store（所有应用共享同一个 store）
  const store = props.mainStore || createFallbackStore();
  
  root.render(
    <Provider store={store}>
      <App qiankunProps={props} />
    </Provider>
  );
}

// 独立运行时的降级 store
function createFallbackStore() {
  const { configureStore } = require('@reduxjs/toolkit');
  return configureStore({
    reducer: {
      products: productsSlice,
    },
  });
}

// 命名导出生命周期（关键）
export async function bootstrap() {
  console.log('shop app bootstrap');
}

export async function mount(props) {
  console.log('shop app mount');
  
  // 监听 qiankun 全局状态变化
  props.onGlobalStateChange((state, prev) => {
    console.log('====shop qiankun state change', state, prev);
  });
  
  // 将子应用的 reducer 注入到主应用的 store
  if (props.injectReducer && !isReducerInjected) {
    console.log('🔌 Shop 子应用注入 reducer 到主应用 store');
    props.injectReducer('shop_products', productsSlice);
    isReducerInjected = true;
    
    // 打印当前 store 的状态树结构
    const state = props.getMainState();
    console.log('📦 当前 Store 树结构:', Object.keys(state));
  }
  
  render(props);
}

export async function unmount(props) {
  console.log('shop app unmount');
  
  // 卸载时移除 reducer（可选，根据需求决定是否保留状态）
  if (props.removeReducer && isReducerInjected) {
    console.log('🔌 Shop 子应用移除 reducer');
    props.removeReducer('shop_products');
    isReducerInjected = false;
  }
  
  const { container } = props;
  const dom = container
    ? container.querySelector(`#${CHILD_CONTAINER_ID}`)
    : document.querySelector('#root');

  if (root) {
    root.unmount();
    root = null;
  } else {
    ReactDOM.unmountComponentAtNode(dom); // 兼容 React 17 fallback
  }
}

// 独立运行逻辑
if (!window.__POWERED_BY_QIANKUN__) {
  const fallbackStore = createFallbackStore();
  const root = createRoot(document.getElementById('root'));
  root.render(
    <Provider store={fallbackStore}>
      <App qiankunProps={{}} />
    </Provider>
  );
}
