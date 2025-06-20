// .cz-config.js
module.exports = {
    types: [
      { value: 'feat',     name: 'feat:     ✨ 新功能' },
      { value: 'fix',      name: 'fix:      🐛 修复缺陷' },
      { value: 'docs',     name: 'docs:     📚 文档变更' },
      { value: 'style',    name: 'style:    🎨 代码格式（非逻辑变更）' },
      { value: 'refactor', name: 'refactor: ♻️ 代码重构（不影响功能）' },
      { value: 'perf',     name: 'perf:     ⚡ 性能优化' },
      { value: 'test',     name: 'test:     ✅ 添加或修改测试' },
      { value: 'build',    name: 'build:    🛠️ 构建流程、依赖管理等变更' },
      { value: 'ci',       name: 'ci:       👷 CI 配置修改' },
      { value: 'chore',    name: 'chore:    🔧 非业务代码修改' },
      { value: 'revert',   name: 'revert:   ⏪ 回退提交' },
    ],
  
    messages: {
      type: '请选择本次提交的类型：',
      scope: '请填写修改的范围（可选）：',
      customScope: '请输入自定义 scope：',
      subject: '请简要描述提交（建议不超过50字）：',
      body: '请填写详细描述（可选，换行输入）：',
      breaking: '列出任何 BREAKING CHANGE（可选）：',
      footer: '请输入关联的 issue 编号（例如：#31，多个用逗号分隔）：',
      confirmCommit: '确认提交吗？',
    },
  
    allowCustomScopes: true,
    allowBreakingChanges: ['feat', 'fix'],
    subjectLimit: 50,
  };
  