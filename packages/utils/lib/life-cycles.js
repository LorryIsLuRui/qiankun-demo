// 子应用utils
import {createRoot} from 'react-dom/client';

const App = () => (
  <></>
);

let root = null;

// 渲染函数
function render(props) {
  const mountNode = props.container ? props.container.querySelector('#root') : document.getElementById('root');
  root = createRoot(mountNode);
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

export async function unmount() {
  console.log('utils app unmount');
  root.unmount();
}

// 独立运行逻辑
if (!window.__POWERED_BY_QIANKUN__) {
  render({});
}
