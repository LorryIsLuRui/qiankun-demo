/**
 * 自动化 Lighthouse 性能分析脚本
 * 
 * 使用方法:
 *   node build-optimization/scripts/perf-analysis.js
 * 
 * 依赖:
 *   npm install --save-dev lighthouse chrome-launcher
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

async function runLighthouse() {
  console.log('🚀 启动 Lighthouse 性能分析...\n');

  // 启动 Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless'],
  });

  const options = {
    logLevel: 'info',
    output: ['html', 'json'],
    onlyCategories: ['performance'],
    port: chrome.port,
  };

  const url = 'http://localhost:8080';

  console.log(`📊 分析 URL: ${url}\n`);

  // 运行 3 次取平均值
  const runs = [];
  for (let i = 1; i <= 3; i++) {
    console.log(`⏱️  运行第 ${i}/3 次...`);
    const runnerResult = await lighthouse(url, options);
    runs.push(runnerResult.lhr);
  }

  // 计算平均值
  const metrics = {
    fcp: average(runs.map(r => r.audits['first-contentful-paint'].numericValue)),
    lcp: average(runs.map(r => r.audits['largest-contentful-paint'].numericValue)),
    tti: average(runs.map(r => r.audits['interactive'].numericValue)),
    tbt: average(runs.map(r => r.audits['total-blocking-time'].numericValue)),
    cls: average(runs.map(r => r.audits['cumulative-layout-shift'].numericValue)),
    speedIndex: average(runs.map(r => r.audits['speed-index'].numericValue)),
    score: average(runs.map(r => r.categories.performance.score * 100)),
  };

  // 输出结果
  console.log('\n📈 性能指标 (3次运行平均值):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Performance Score:  ${metrics.score.toFixed(0)}/100`);
  console.log(`FCP:                ${metrics.fcp.toFixed(0)}ms`);
  console.log(`LCP:                ${metrics.lcp.toFixed(0)}ms`);
  console.log(`TTI:                ${metrics.tti.toFixed(0)}ms`);
  console.log(`TBT:                ${metrics.tbt.toFixed(0)}ms`);
  console.log(`CLS:                ${metrics.cls.toFixed(3)}`);
  console.log(`Speed Index:        ${metrics.speedIndex.toFixed(0)}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 保存报告
  const reportHtml = runs[0].report;
  const reportPath = path.join(process.cwd(), 'lighthouse-report.html');
  fs.writeFileSync(reportPath, reportHtml);
  console.log(`✅ HTML 报告已保存: ${reportPath}\n`);

  // 保存 JSON 数据
  const jsonPath = path.join(process.cwd(), 'lighthouse-metrics.json');
  const jsonData = {
    timestamp: new Date().toISOString(),
    url,
    metrics,
    runs: runs.map(r => ({
      fcp: r.audits['first-contentful-paint'].numericValue,
      lcp: r.audits['largest-contentful-paint'].numericValue,
      tti: r.audits['interactive'].numericValue,
      tbt: r.audits['total-blocking-time'].numericValue,
      cls: r.audits['cumulative-layout-shift'].numericValue,
      score: r.categories.performance.score * 100,
    })),
  };
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`✅ JSON 数据已保存: ${jsonPath}\n`);

  // 关闭 Chrome
  await chrome.kill();

  // 性能建议
  console.log('💡 关键建议:');
  const firstRun = runs[0];
  const opportunities = firstRun.audits;
  
  const suggestions = [
    {
      key: 'render-blocking-resources',
      name: '减少阻塞渲染的资源',
    },
    {
      key: 'unused-javascript',
      name: '减少未使用的 JavaScript',
    },
    {
      key: 'unminified-javascript',
      name: '压缩 JavaScript',
    },
    {
      key: 'duplicated-javascript',
      name: '移除重复的 JavaScript',
    },
  ];

  suggestions.forEach(({ key, name }) => {
    const audit = opportunities[key];
    if (audit && audit.score !== null && audit.score < 1) {
      const savings = audit.details?.overallSavingsMs || 0;
      if (savings > 100) {
        console.log(`  ⚠️  ${name}: 可节省 ~${Math.round(savings)}ms`);
      }
    }
  });

  console.log('\n✨ 分析完成！\n');
}

function average(numbers) {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

// 运行
runLighthouse().catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
