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
