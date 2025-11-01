// 主应用
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'main',
    entry: '//localhost:8081',
    container: '#root',
    activeRule: '/main',
  },
//   {
//     name: 'shop',
//     entry: { scripts: ['//localhost:7100/main.js'] },
//     container: '#shop',
//     activeRule: '/yourActiveRule2',
//   },
]);

start();