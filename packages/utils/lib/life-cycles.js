// 子应用utils
import {createRoot} from 'react-dom/client';
import ReactDOM from 'react-dom';

const App = () => (
  <></>
);

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
  console.log('utils app bootstrap');
}

export async function mount(props) {
  console.log('utils app mount');
  render(props);
}

export async function unmount(props) {
  console.log('utils app unmount');
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
}
