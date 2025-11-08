// 注册子应用
import { registerMicroApps, start } from 'qiankun';
const SHOP_PORT = 8081;
const UTILS_PORT = 8082;
const COMPONENTS_PORT = 8083;

registerMicroApps([
  {
    name: 'shop',
    entry: `//localhost:${SHOP_PORT}`,
    container: '#child-container',
    activeRule: '/shop',
    props: { monorepoName: 'shop' }
  },
  {
    name: 'utils',
    entry: `//localhost:${UTILS_PORT}`,
    container: '#child-container',
    activeRule: '/utils',
  },
  {
    name: 'components',
    entry: `//localhost:${COMPONENTS_PORT}`,
    container: '#child-container',
    activeRule: '/components',
  },
]);

start({ sandbox: false });