// .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-angular'],
  // 如果你想自定义规范，可以在这里加 rules
  rules: {
    // 确保提交的信息像 feat: add user list 或 fix: bug in app1 这样规范。
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'build'
    ]],
  }
};