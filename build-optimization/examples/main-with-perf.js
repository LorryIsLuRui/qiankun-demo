/**
 * 主应用性能监控示例
 * 
 * 文件: packages/main/lib/main.js
 * 
 * 在现有的 main.js 中添加以下性能监控代码
 */

// ==================== 性能监控代码 START ====================
const perfMarks = {
  mainScriptStart: performance.now(),
};

console.log('📊 主应用性能监控已启用');

// 在 bootstrap() 调用前添加
performance.mark('qiankun-register-start');

// ==================== 原有代码 ====================
import bootstrap from './bootstrap';

bootstrap();
// ==================== 原有代码 END ====================

// 在 bootstrap() 调用后添加
performance.mark('qiankun-register-end');
performance.measure('qiankun-register', 'qiankun-register-start', 'qiankun-register-end');

// 收集所有性能数据
window.addEventListener('load', () => {
  setTimeout(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const measures = performance.getEntriesByType('measure');
    const paint = performance.getEntriesByType('paint');
    
    console.group('📊 主应用性能数据');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n⏱️  导航时序:');
    console.log(`DNS 查询: ${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`);
    console.log(`TCP 连接: ${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`);
    console.log(`首字节时间 (TTFB): ${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`);
    console.log(`响应时间: ${(navigation.responseEnd - navigation.responseStart).toFixed(2)}ms`);
    console.log(`DOM 解析: ${(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)}ms`);
    console.log(`DOMContentLoaded: ${(navigation.domContentLoadedEventEnd - navigation.fetchStart).toFixed(2)}ms`);
    console.log(`页面完全加载: ${(navigation.loadEventEnd - navigation.fetchStart).toFixed(2)}ms`);
    
    console.log('\n🎨 绘制指标:');
    paint.forEach(entry => {
      console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
    });
    
    console.log('\n📦 资源加载统计:');
    const resourcesByType = resources.reduce((acc, r) => {
      const type = r.initiatorType || 'other';
      if (!acc[type]) {
        acc[type] = { count: 0, size: 0, duration: 0 };
      }
      acc[type].count++;
      acc[type].size += r.transferSize || 0;
      acc[type].duration += r.duration;
      return acc;
    }, {});
    
    Object.entries(resourcesByType).forEach(([type, stats]) => {
      const avgDuration = stats.duration / stats.count;
      console.log(`${type}: ${stats.count} 个, ${formatBytes(stats.size)}, 平均 ${avgDuration.toFixed(2)}ms`);
    });
    
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    console.log(`总计: ${resources.length} 个资源, ${formatBytes(totalSize)}`);
    
    console.log('\n⏱️  自定义测量:');
    measures.forEach(m => {
      console.log(`${m.name}: ${m.duration.toFixed(2)}ms`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.groupEnd();
    
    // 检查关键指标
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    const lcp = paint.find(p => p.name === 'largest-contentful-paint');
    
    if (fcp && fcp.startTime > 1800) {
      console.warn('⚠️  FCP 超过 1.8s，需要优化');
    }
    if (lcp && lcp.startTime > 2500) {
      console.warn('⚠️  LCP 超过 2.5s，需要优化');
    }
    
    // 检查长任务
    if (typeof PerformanceObserver !== 'undefined') {
      const longTasks = performance.getEntriesByType('longtask');
      if (longTasks.length > 0) {
        console.warn(`⚠️  检测到 ${longTasks.length} 个长任务 (>50ms)`);
        longTasks.forEach(task => {
          console.log(`  - ${task.duration.toFixed(2)}ms`);
        });
      }
    }
    
  }, 3000);  // 延迟 3 秒，确保所有资源加载完成
});

// 工具函数
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 监听长任务（如果浏览器支持）
if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes.includes('longtask')) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.warn(`⚠️  长任务检测: ${entry.duration.toFixed(2)}ms`, entry);
    }
  });
  observer.observe({ entryTypes: ['longtask'] });
}

// ==================== 性能监控代码 END ====================
