// 项目入口文件

import {createRoot} from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.jsx';
import './bootstrap';

const render = () => {
  const root = createRoot(document.querySelector('#root'));
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
}

if (!window.__POWERED_BY_QIANKUN__) {
  render({});
}

