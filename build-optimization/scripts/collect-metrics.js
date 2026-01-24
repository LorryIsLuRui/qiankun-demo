/**
 * 浏览器性能指标收集脚本
 * 
 * 使用方法:
 *   在浏览器控制台中复制粘贴此文件内容，然后执行:
 *   collectPerformanceMetrics()
 * 
 * 或者在页面中加载:
 *   <script src="build-optimization/scripts/collect-metrics.js"></script>
 */

(function() {
  'use strict';

  window.collectPerformanceMetrics = function() {
    console.log('📊 开始收集性能指标...\n');

    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const measures = performance.getEntriesByType('measure');
    const paint = performance.getEntriesByType('paint');
    const marks = performance.getEntriesByType('mark');

    // 收集导航时序
    const navigationMetrics = {
      dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
      tcp: Math.round(navigation.connectEnd - navigation.connectStart),
      ttfb: Math.round(navigation.responseStart - navigation.requestStart),
      responseTime: Math.round(navigation.responseEnd - navigation.responseStart),
      domParse: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
      totalLoad: Math.round(navigation.loadEventEnd - navigation.fetchStart),
    };

    // 收集绘制指标
    const paintMetrics = {};
    paint.forEach(p => {
      paintMetrics[p.name] = Math.round(p.startTime);
    });

    // 收集资源统计
    const resourceStats = {
      total: resources.length,
      byType: {},
      totalSize: 0,
      totalDuration: 0,
    };

    resources.forEach(r => {
      const type = r.initiatorType || 'other';
      if (!resourceStats.byType[type]) {
        resourceStats.byType[type] = {
          count: 0,
          size: 0,
          duration: 0,
        };
      }
      resourceStats.byType[type].count++;
      resourceStats.byType[type].size += r.transferSize || 0;
      resourceStats.byType[type].duration += r.duration;
      resourceStats.totalSize += r.transferSize || 0;
      resourceStats.totalDuration += r.duration;
    });

    // 收集自定义测量
    const customMeasures = measures.map(m => ({
      name: m.name,
      duration: Math.round(m.duration * 100) / 100,
      startTime: Math.round(m.startTime * 100) / 100,
    }));

    // 收集自定义标记
    const customMarks = marks.map(m => ({
      name: m.name,
      time: Math.round(m.startTime * 100) / 100,
    }));

    // Web Vitals (如果可用)
    const webVitals = {};
    if (window.webVitalsData) {
      Object.assign(webVitals, window.webVitalsData);
    }

    // 汇总数据
    const metrics = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      navigation: navigationMetrics,
      paint: paintMetrics,
      resources: resourceStats,
      customMeasures,
      customMarks,
      webVitals,
    };

    // 美化输出
    console.group('📊 性能指标汇总');
    
    console.group('⏱️  导航时序');
    console.table(navigationMetrics);
    console.groupEnd();

    console.group('🎨 绘制指标');
    console.table(paintMetrics);
    console.groupEnd();

    console.group('📦 资源统计');
    console.log(`总资源数: ${resourceStats.total}`);
    console.log(`总下载量: ${formatBytes(resourceStats.totalSize)}`);
    console.log(`总耗时: ${Math.round(resourceStats.totalDuration)}ms`);
    console.table(resourceStats.byType);
    console.groupEnd();

    if (customMeasures.length > 0) {
      console.group('📏 自定义测量');
      console.table(customMeasures);
      console.groupEnd();
    }

    if (customMarks.length > 0) {
      console.group('🏷️  自定义标记');
      console.table(customMarks);
      console.groupEnd();
    }

    if (Object.keys(webVitals).length > 0) {
      console.group('📈 Web Vitals');
      console.table(webVitals);
      console.groupEnd();
    }

    console.groupEnd();

    // 输出 JSON
    const json = JSON.stringify(metrics, null, 2);
    console.log('\n📋 JSON 数据:');
    console.log(json);

    // 尝试复制到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        console.log('\n✅ 数据已复制到剪贴板');
      }).catch(() => {
        console.log('\n⚠️  无法复制到剪贴板，请手动复制上面的 JSON');
      });
    } else {
      console.log('\n⚠️  浏览器不支持剪贴板 API，请手动复制上面的 JSON');
    }

    return metrics;
  };

  // 工具函数：格式化字节
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // 自动收集（如果在页面加载时引入）
  if (document.readyState === 'complete') {
    console.log('🔄 页面已加载，可以手动执行 collectPerformanceMetrics()');
  } else {
    window.addEventListener('load', () => {
      console.log('🔄 页面已加载，可以手动执行 collectPerformanceMetrics()');
    });
  }

  // 监听 Web Vitals（如果库已加载）
  if (typeof getCLS !== 'undefined') {
    window.webVitalsData = {};
    const vitalsCallback = (metric) => {
      window.webVitalsData[metric.name] = {
        value: Math.round(metric.value * 100) / 100,
        rating: metric.rating,
        delta: Math.round(metric.delta * 100) / 100,
      };
    };
    getCLS(vitalsCallback);
    getFID(vitalsCallback);
    getFCP(vitalsCallback);
    getLCP(vitalsCallback);
    getTTFB(vitalsCallback);
  }

})();
