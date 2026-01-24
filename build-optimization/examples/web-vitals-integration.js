/**
 * Web Vitals 集成示例
 * 
 * 文件: packages/main/lib/main.js
 * 
 * 在主应用中集成 Web Vitals 监控
 * 
 * 安装依赖:
 *   npm install --save web-vitals
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// ==================== Web Vitals 监控 START ====================

// 用于存储指标
window.webVitalsMetrics = {};

/**
 * 发送指标到分析服务
 * @param {Object} metric - Web Vitals 指标对象
 */
function sendToAnalytics(metric) {
  const { name, value, rating, delta, id } = metric;
  
  // 存储到全局对象
  window.webVitalsMetrics[name] = {
    value: Math.round(value * 100) / 100,
    rating,
    delta: Math.round(delta * 100) / 100,
    id,
    timestamp: new Date().toISOString(),
  };
  
  // 控制台输出（带颜色）
  const color = rating === 'good' ? '#0CCE6B' : rating === 'needs-improvement' ? '#FFA400' : '#FF4E42';
  
  console.log(
    `%c📈 [Web Vitals] ${name}`,
    `color: ${color}; font-weight: bold;`,
    {
      value: `${Math.round(value)}${name === 'CLS' ? '' : 'ms'}`,
      rating,
      delta: Math.round(delta),
      id,
    }
  );
  
  // 显示性能提示
  if (rating !== 'good') {
    const tips = getOptimizationTips(name, rating);
    if (tips) {
      console.log(`💡 ${tips}`);
    }
  }
  
  // 发送到分析服务（可选）
  // 如果有 GA、Sentry 或其他分析服务，在这里发送
  /*
  if (window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(value),
      event_label: id,
      non_interaction: true,
    });
  }
  
  if (window.Sentry) {
    window.Sentry.captureMessage(`${name}: ${value}`, {
      level: rating === 'good' ? 'info' : 'warning',
      tags: {
        webVital: name,
        rating,
      },
    });
  }
  */
}

/**
 * 获取优化建议
 */
function getOptimizationTips(metric, rating) {
  const tips = {
    FCP: {
      'needs-improvement': '首次内容绘制较慢，考虑减少阻塞渲染的资源',
      poor: '首次内容绘制过慢，优先优化关键渲染路径和减少 JavaScript',
    },
    LCP: {
      'needs-improvement': '最大内容绘制较慢，检查大型图片和资源加载',
      poor: '最大内容绘制过慢，优化图片、使用 CDN、启用懒加载',
    },
    FID: {
      'needs-improvement': '首次输入延迟较长，减少主线程阻塞',
      poor: '首次输入延迟过长，拆分长任务、优化 JavaScript 执行',
    },
    CLS: {
      'needs-improvement': '布局偏移较多，为图片和广告设置尺寸',
      poor: '布局偏移严重，检查动态内容插入和字体加载',
    },
    TTFB: {
      'needs-improvement': '首字节时间较慢，检查服务器响应',
      poor: '首字节时间过慢，优化服务器性能或使用 CDN',
    },
  };
  
  return tips[metric]?.[rating] || null;
}

// 注册所有 Web Vitals 监控
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// 页面可见性变化时输出汇总
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    console.group('📊 Web Vitals 汇总');
    console.table(window.webVitalsMetrics);
    console.groupEnd();
  }
});

// 导出获取指标的函数
window.getWebVitalsMetrics = () => {
  return window.webVitalsMetrics;
};

// 导出 JSON 格式的指标
window.exportWebVitalsJSON = () => {
  const json = JSON.stringify(window.webVitalsMetrics, null, 2);
  console.log('📋 Web Vitals JSON:');
  console.log(json);
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(json).then(() => {
      console.log('✅ 已复制到剪贴板');
    });
  }
  
  return json;
};

// 页面加载完成后输出汇总
window.addEventListener('load', () => {
  setTimeout(() => {
    console.group('📊 Web Vitals 初始汇总');
    console.table(window.webVitalsMetrics);
    console.groupEnd();
    
    // 输出可用命令
    console.log('💡 可用命令:');
    console.log('  - getWebVitalsMetrics()  // 获取所有指标');
    console.log('  - exportWebVitalsJSON()  // 导出 JSON 格式');
  }, 3000);
});

// ==================== Web Vitals 监控 END ====================

// 原有的 bootstrap 调用
// import bootstrap from './bootstrap';
// bootstrap();
