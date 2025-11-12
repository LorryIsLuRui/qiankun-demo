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

// 需要设置sanbox:false, 否则子应用无法访问共享的utils、components包
// 不设置报错如下：application 'shop' died in status LOADING_SOURCE_CODE: Loading script failed.(missing: http://localhost:8083/componentsEntry.js) while loading "./Header" 
start({ sandbox: false });
// start();