// 注册子应用
import {
  registerMicroApps,
  start,
  initGlobalState,
} from 'qiankun';
import { store } from './store';

const SHOP_PORT = 8081;
const UTILS_PORT = 8082;
const COMPONENTS_PORT = 8083;

const isDev = process.env.NODE_ENV === 'development';
const prefix = isDev ? '/shop' : '/microfrontend/shop';
const entryHost = `${process.env.PUBLIC_PATH}${isDev ? ':' + SHOP_PORT : prefix}/`;

// 初始化 state
const actions = initGlobalState({
  monorepoName: ['shop'],
});

actions.onGlobalStateChange((state, prev) => {
  // state: 变更后的状态; prev 变更前的状态
  console.log(state, prev);
});
// actions.setGlobalState(state);
// actions.offGlobalStateChange();


registerMicroApps([
  {
    name: 'shop',
    entry: entryHost,
    container: '#app-child-container',
    activeRule: prefix,
    props: { 
      monorepoName: 'shop',
      // 传递主应用的 Redux store
      mainStore: store,
      // 传递 Redux 相关方法
      getMainState: () => store.getState(),
      dispatchMainAction: (action) => store.dispatch(action),
    },
    sandbox: {
        strictStyleIsolation: true,
        experimentalStyleIsolation: true,
        excludeAssetFilter: (url) => true,
    },
  },
]);

// 需要设置sanbox:false, 否则子应用无法访问共享的utils、components包
// 不设置报错如下：application 'shop' died in status LOADING_SOURCE_CODE: Loading script failed.(missing: http://localhost:8083/remoteEntry.js) while loading "./Header" 
// 关闭qiankun沙箱，让qiankun子应用可以访问全局window对象，从而获取模块联邦应用
// strict
start({ prefetch: true, singular: true, });
// start();