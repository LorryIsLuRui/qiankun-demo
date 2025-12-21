// 子应用shop
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import App from './main.jsx';

const CHILD_CONTAINER_ID = 'child-container';
let root = null;

// 渲染函数
function render(props) {
  const mountNode = props.container ? props.container.querySelector(`#${CHILD_CONTAINER_ID}`) : document.getElementById('root');
  if (!root) {
    root = createRoot(mountNode);
  }

  // 将 props 传递给子应用组件
  root.render(<App qiankunProps={props} />);
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
  
  // 如果主应用传递了 Redux store，可以订阅变化
  if (props.mainStore) {
    console.log('子应用接收到主应用 store');
    
    // 订阅主应用 Redux store 的变化
    props.mainStore.subscribe(() => {
      const mainState = props.mainStore.getState();
      console.log('主应用 Redux 状态变化:', mainState);
    });
    
    // 获取当前状态
    const currentState = props.getMainState();
    console.log('主应用当前状态:', currentState);
  }
  
  render(props);
}

export async function unmount(props) {
  console.log('shop app unmount');
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
  const root = createRoot(document.getElementById(CHILD_CONTAINER_ID));
  root.render(<App />);
}
