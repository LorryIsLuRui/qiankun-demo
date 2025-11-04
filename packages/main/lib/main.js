// 项目入口文件

import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './bootstrap';

const render = () => {
  const root = createRoot(document.querySelector('#root'));
  root.render(<App />);
}

if (!window.__POWERED_BY_QIANKUN__) {
  render({});
}

// let root = null;
// const render = () => {
//     console.log('====main render====');
//   if (!root) {
//     root = createRoot(document.querySelector('#root'));
//   }
//   root.render(<App />);
// }

// render({});
