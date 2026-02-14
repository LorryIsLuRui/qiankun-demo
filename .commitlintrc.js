// .commitlintrc.js
// 这需要在git仓库中才能run
module.exports = {
  extends: ['@commitlint/config-angular'],
  plugins: [
    {
      rules: {
        'task-id-required': (parsed) => {
          const header = parsed && parsed.header ? parsed.header : '';
          const pass = /\btask-\d+\b/i.test(header);
          return [pass, '提交信息必须包含任务号，例如 task-123'];
        }
      }
    }
  ],
  // 如果你想自定义规范，可以在这里加 rules
  rules: {
    // 确保提交的信息像 feat: add user list 或 fix: bug in app1 这样规范。
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'build'
    ]],
    // 自定义提交信息的格式：必须包含 task-123 这样的任务号
    'task-id-required': [2, 'always'],
    // 其他规则可以根据需要添加
  }
};