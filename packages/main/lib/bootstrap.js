// 注册子应用
import {
  registerMicroApps,
  start,
  initGlobalState,
} from 'qiankun';
import { store, injectReducer, removeReducer } from './store';

const SHOP_PORT = 8081;
const SON_SHOP_PORT = 8084;

const isDev = process.env.NODE_ENV === 'development';
const prefix = isDev ? '/shop' : '/microfrontend/shop';
const entryHost = `${process.env.PUBLIC_PATH}${isDev ? ':' + SHOP_PORT : prefix}/`;
const sonEntryHost = `${process.env.PUBLIC_PATH}${isDev ? ':' + SON_SHOP_PORT : prefix}/`;

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
    // 如果要同屏展示多个子应用，activeRule需要使用函数返回true，同时设置start中singular:false
    // 为什么是函数？因为如果是字符串的话，多个子应用会冲突，只会加载第一个匹配的子应用
    activeRule: () => location.pathname.startsWith(prefix),
    props: {
      monorepoName: 'shop',
      // 传递主应用的 Redux store（所有应用共享同一个 store）
      mainStore: store,
      // 传递 Redux 相关方法
      getMainState: () => store.getState(),
      dispatchMainAction: (action) => store.dispatch(action),
      // 传递动态注入 reducer 的方法
      injectReducer: injectReducer,
      removeReducer: removeReducer,
    },
    sandbox: {
      strictStyleIsolation: false,
      experimentalStyleIsolation: true,
      // excludeAssetFilter是用来排除某些不需要沙箱处理的资源，such as 微前端模块联邦的remoteEntry.js
      excludeAssetFilter: (url) => url.includes('remoteEntry.js'),
    }
  },
  {
    name: 'son-shop',
    entry: sonEntryHost,
    container: '#son-child-container',
    activeRule: () => location.pathname.startsWith(prefix),
    props: {
      monorepoName: 'son-shop',
      mainStore: store,
      getMainState: () => store.getState(),
      dispatchMainAction: (action) => store.dispatch(action),
      injectReducer: injectReducer,
      removeReducer: removeReducer,
    },
    sandbox: {
      strictStyleIsolation: false,
      experimentalStyleIsolation: true,
      // excludeAssetFilter是用来排除某些不需要沙箱处理的资源，such as 微前端模块联邦的remoteEntry.js
      excludeAssetFilter: (url) => url.includes('remoteEntry.js'),
    },
  }
]);

// start({ prefetch: true, singular: true, });
start({ prefetch: true, singular: false, });