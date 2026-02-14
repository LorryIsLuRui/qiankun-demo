// .commitlintrc.js
// 这需要在git仓库中才能run
module.exports = {
  extends: ['@commitlint/config-angular'],
  // 如果你想自定义规范，可以在这里加 rules
  rules: {
    // 确保提交的信息像 feat: add user list 或 fix: bug in app1 这样规范。
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'build'
    ]],
    // 自定义提交信息的格式，例如要求必须有 task-123 这样的任务号
    'header-pattern': [2, 'always', /^task-[0-9]+$/],
    // 其他规则可以根据需要添加
  }
};