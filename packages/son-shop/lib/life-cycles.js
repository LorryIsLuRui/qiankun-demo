// 子应用shop
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './main.jsx';

const CHILD_CONTAINER_ID = 'child-container';
let root = null;

// 渲染函数
function render(props) {
  const mountNode = props.container ? props.container.querySelector(`#${CHILD_CONTAINER_ID}`) : document.getElementById('root');
  if (!root) {
    root = createRoot(mountNode);
  }

  // 使用主应用的 store（所有应用共享同一个 store）
  const store = props.mainStore;
  
  root.render(
    <Provider store={store}>
      <App qiankunProps={props} />
    </Provider>
  );
}


// 命名导出生命周期（关键）
export async function bootstrap() {

}

export async function mount(props) {
  render(props);
}

export async function unmount(props) {

  
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
  const root = createRoot(document.getElementById('root'));
  root.render(
    <Provider>
      <App qiankunProps={{}} />
    </Provider>
  );
}
