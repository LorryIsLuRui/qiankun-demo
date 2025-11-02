// 注册子应用
import { registerMicroApps, start } from 'qiankun';
const SHOP_PORT = 8081;

registerMicroApps([
  {
    name: 'shop',
    entry: `//localhost:${SHOP_PORT}`,
    container: '#child-container',
    activeRule: '/shop',
  },
//   {
//     name: 'shop',
//     entry: { scripts: ['//localhost:7100/main.js'] },
//     container: '#shop',
//     activeRule: '/yourActiveRule2',
//   },
]);

start();