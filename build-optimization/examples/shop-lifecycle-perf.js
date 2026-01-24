/**
 * shop 应用生命周期性能监控示例
 * 
 * 文件: packages/shop/lib/life-cycles.js
 * 
 * 替换现有的 bootstrap 和 mount 函数
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import productsSlice from './store/slices/productsSlice';
import App from './main.jsx';

const CHILD_CONTAINER_ID = 'child-container';
let root = null;
let isReducerInjected = false;

// ==================== 性能监控变量 ====================
const shopPerfMarks = {
  scriptLoadStart: performance.now()
};
// ====================================================

// 渲染函数
function render(props) {
  const mountNode = props.container 
    ? props.container.querySelector(`#${CHILD_CONTAINER_ID}`) 
    : document.getElementById('root');
  
  if (!root) {
    root = createRoot(mountNode);
  }

  // 使用主应用的 store（所有应用共享同一个 store）
  const store = props.mainStore || createFallbackStore();
  
  root.render(
    <Provider store={store}>
      <App qiankunProps={props} />
    </Provider>
  );
}

// 独立运行时的降级 store
function createFallbackStore() {
  const { configureStore } = require('@reduxjs/toolkit');
  return configureStore({
    reducer: {
      products: productsSlice,
    },
  });
}

// ==================== 生命周期 (带性能监控) ====================

export async function bootstrap() {
  shopPerfMarks.bootstrapStart = performance.now();
  performance.mark('shop-bootstrap-start');
  
  console.log('🔧 shop app bootstrap');
  
  // 原有 bootstrap 逻辑...
  
  performance.mark('shop-bootstrap-end');
  performance.measure('shop-bootstrap', 'shop-bootstrap-start', 'shop-bootstrap-end');
  
  shopPerfMarks.bootstrapEnd = performance.now();
  const bootstrapTime = shopPerfMarks.bootstrapEnd - shopPerfMarks.bootstrapStart;
  
  console.log(`⏱️  [shop] bootstrap 耗时: ${bootstrapTime.toFixed(2)}ms`);
  
  // 性能警告
  if (bootstrapTime > 50) {
    console.warn(`⚠️  [shop] bootstrap 耗时过长 (目标 < 50ms)`);
  }
}

export async function mount(props) {
  shopPerfMarks.mountStart = performance.now();
  performance.mark('shop-mount-start');
  
  console.log('🚀 shop app mount');
  
  // 监听 qiankun 全局状态变化
  const stateListenerStart = performance.now();
  props.onGlobalStateChange((state, prev) => {
    console.log('====shop qiankun state change', state, prev);
  });
  const stateListenerTime = performance.now() - stateListenerStart;
  
  // Redux reducer 注入（带性能监控）
  const injectStart = performance.now();
  performance.mark('shop-redux-inject-start');
  
  if (props.injectReducer && !isReducerInjected) {
    props.injectReducer('products', productsSlice);
    isReducerInjected = true;
    
    performance.mark('shop-redux-inject-end');
    performance.measure('shop-redux-inject', 'shop-redux-inject-start', 'shop-redux-inject-end');
    
    const injectTime = performance.now() - injectStart;
    console.log(`⏱️  [shop] Redux reducer 注入耗时: ${injectTime.toFixed(2)}ms`);
    
    if (injectTime > 50) {
      console.warn(`⚠️  [shop] Redux 注入耗时过长 (目标 < 50ms)`);
    }
  }
  
  // 渲染（带性能监控）
  const renderStart = performance.now();
  performance.mark('shop-render-start');
  
  render(props);
  
  performance.mark('shop-render-end');
  performance.measure('shop-render', 'shop-render-start', 'shop-render-end');
  
  const renderTime = performance.now() - renderStart;
  console.log(`⏱️  [shop] 渲染耗时: ${renderTime.toFixed(2)}ms`);
  
  performance.mark('shop-mount-end');
  performance.measure('shop-mount', 'shop-mount-start', 'shop-mount-end');
  
  shopPerfMarks.mountEnd = performance.now();
  
  // 汇总输出
  const bootstrapTime = shopPerfMarks.bootstrapEnd - shopPerfMarks.bootstrapStart;
  const mountTime = shopPerfMarks.mountEnd - shopPerfMarks.mountStart;
  const totalTime = shopPerfMarks.mountEnd - shopPerfMarks.bootstrapStart;
  const scriptToCompleteTime = shopPerfMarks.mountEnd - shopPerfMarks.scriptLoadStart;
  
  console.group('📊 shop 应用性能汇总');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Bootstrap:           ${bootstrapTime.toFixed(2)}ms`);
  console.log(`  └─ 状态监听:       ${stateListenerTime.toFixed(2)}ms`);
  console.log(`Mount:               ${mountTime.toFixed(2)}ms`);
  console.log(`  ├─ Redux 注入:     ${(performance.now() - injectStart).toFixed(2)}ms`);
  console.log(`  └─ 渲染:           ${renderTime.toFixed(2)}ms`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`完整启动 (B+M):      ${totalTime.toFixed(2)}ms`);
  console.log(`脚本加载到完成:      ${scriptToCompleteTime.toFixed(2)}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.groupEnd();
  
  // 性能评估
  if (totalTime > 550) {
    console.warn(`⚠️  [shop] 总启动时间超过目标 (目标 < 550ms, 实际 ${totalTime.toFixed(2)}ms)`);
  } else {
    console.log(`✅ [shop] 性能良好 (${totalTime.toFixed(2)}ms < 550ms)`);
  }
  
  // 记录到全局（便于后续分析）
  if (!window.qiankunPerfMetrics) {
    window.qiankunPerfMetrics = {};
  }
  window.qiankunPerfMetrics.shop = {
    bootstrap: bootstrapTime,
    mount: mountTime,
    total: totalTime,
    scriptToComplete: scriptToCompleteTime,
    timestamp: new Date().toISOString(),
  };
}

export async function unmount(props) {
  performance.mark('shop-unmount-start');
  const unmountStart = performance.now();
  
  console.log('👋 shop app unmount');
  
  // 卸载 React 应用
  if (root) {
    root.unmount();
    root = null;
  }
  
  // 移除 reducer（如果需要）
  if (props.removeReducer && isReducerInjected) {
    props.removeReducer('products');
    isReducerInjected = false;
  }
  
  // 清理性能标记（可选）
  // performance.clearMarks();
  // performance.clearMeasures();
  
  performance.mark('shop-unmount-end');
  performance.measure('shop-unmount', 'shop-unmount-start', 'shop-unmount-end');
  
  const unmountTime = performance.now() - unmountStart;
  console.log(`⏱️  [shop] unmount 耗时: ${unmountTime.toFixed(2)}ms`);
}

// ==================== 独立运行模式 ====================

if (!window.__POWERED_BY_QIANKUN__) {
  console.log('🔧 shop 应用以独立模式运行');
  bootstrap().then(() => {
    mount({});
  });
}
