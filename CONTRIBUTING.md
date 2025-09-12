# 贡献指南

感谢您对 AI Reading 项目的关注！我们欢迎各种形式的贡献，包括但不限于代码贡献、问题反馈、功能建议和文档改进。

## 🚀 快速开始

### 环境准备
1. **Node.js**: 确保安装了 Node.js 16+ 版本
2. **Git**: 用于版本控制
3. **Chrome浏览器**: 用于测试扩展功能

### 本地开发设置
```bash
# 1. Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/ai-reading.git
cd ai-reading

# 2. 安装依赖
npm install

# 3. 启动开发模式
npm run dev

# 4. 在 Chrome 中加载扩展
# 打开 chrome://extensions/
# 开启开发者模式
# 点击"加载已解压的扩展程序"
# 选择项目的 dist 文件夹
```

## 📝 贡献类型

### 🐛 报告 Bug
在报告 Bug 之前，请先检查是否已有相关的 Issue。如果没有，请创建新的 Issue 并包含以下信息：

- **Bug 描述**: 清晰简洁的描述
- **重现步骤**: 详细的重现步骤
- **预期行为**: 描述您期望的正确行为
- **实际行为**: 描述实际发生的情况
- **环境信息**: 
  - 操作系统版本
  - Chrome 浏览器版本
  - 插件版本
- **截图**: 如果适用，请提供截图

### 💡 功能建议
我们欢迎新功能的建议！请在 Discussions 中提出您的想法，包含：

- **功能描述**: 详细描述提议的功能
- **使用场景**: 说明该功能解决的问题
- **实现思路**: 如果有的话，简单描述实现方式
- **替代方案**: 考虑过的其他解决方案

### 🔧 代码贡献

#### 开发规范
1. **代码风格**: 遵循项目的 ESLint 和 Prettier 配置
2. **TypeScript**: 使用 TypeScript 编写代码，保持类型安全
3. **注释**: 为复杂逻辑添加清晰的注释
4. **测试**: 为新功能编写相应的测试用例

#### 提交规范
我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型说明**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**:
```
feat(content): add smart chapter detection algorithm

Implement advanced chapter detection using text density analysis
and common novel website patterns.

Closes #123
```

#### Pull Request 流程
1. **创建分支**: 从 `main` 分支创建功能分支
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发**: 在功能分支上进行开发

3. **测试**: 确保所有测试通过
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **提交**: 使用规范的提交信息
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **推送**: 推送到您的 Fork
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 PR**: 在 GitHub 上创建 Pull Request

#### Pull Request 要求
- **标题**: 清晰描述更改内容
- **描述**: 详细说明更改的原因和方式
- **测试**: 说明如何测试更改
- **截图**: 如果涉及 UI 更改，请提供截图
- **关联 Issue**: 如果解决了某个 Issue，请在 PR 中引用

## 🧪 测试指南

### 运行测试
```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成覆盖率报告
npm test -- --coverage
```

### 编写测试
- **单元测试**: 测试独立的函数和类
- **集成测试**: 测试组件间的交互
- **E2E 测试**: 测试完整的用户流程

### 测试示例
```typescript
// 单元测试示例
describe('TextProcessor', () => {
  it('should clean text correctly', () => {
    const input = '  Hello   World  ';
    const expected = 'Hello World';
    expect(TextProcessor.cleanText(input)).toBe(expected);
  });
});
```

## 📖 文档贡献

### 文档类型
- **README**: 项目介绍和快速开始
- **API 文档**: 代码接口文档
- **用户指南**: 使用说明
- **开发者指南**: 开发相关文档

### 文档规范
- 使用清晰的标题层次
- 提供代码示例
- 包含必要的截图
- 保持内容更新

## 🎯 项目路线图

### 短期目标
- [ ] 支持更多小说网站
- [ ] 添加阅读统计功能
- [ ] 优化语音识别准确性
- [ ] 支持自定义快捷键

### 长期目标
- [ ] 支持离线朗读
- [ ] 添加多语言支持
- [ ] 开发移动端版本
- [ ] 集成AI摘要功能

## 🔍 代码审查

### 审查标准
- **功能正确性**: 代码是否实现了预期功能
- **代码质量**: 是否遵循项目规范
- **性能影响**: 是否影响插件性能
- **安全性**: 是否存在安全风险
- **可维护性**: 代码是否易于理解和维护

### 审查流程
1. 自动化检查（CI/CD）
2. 维护者代码审查
3. 测试验证
4. 合并到主分支

## 🏷️ 版本发布

### 发布流程
1. 更新版本号
2. 更新 CHANGELOG
3. 创建 Release Tag
4. 自动构建和发布

### 版本规范
我们使用 [Semantic Versioning](https://semver.org/)：
- **MAJOR**: 不兼容的 API 更改
- **MINOR**: 向后兼容的功能添加
- **PATCH**: 向后兼容的 Bug 修复

## 📞 获取帮助

如果您在贡献过程中遇到任何问题，可以通过以下方式获取帮助：

- **GitHub Discussions**: 一般性讨论和问答
- **GitHub Issues**: 具体的问题和 Bug 报告
- **代码审查**: 在 Pull Request 中讨论

## 🙏 致谢

感谢每一位贡献者的付出！您的贡献让这个项目变得更好。

---

再次感谢您对 AI Reading 项目的贡献！🎉