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

  root.render(<App />);
}

// 命名导出生命周期（关键）
export async function bootstrap() {
  console.log('shop app bootstrap');
}

export async function mount(props) {
  console.log('shop app mount');
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
