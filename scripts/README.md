# Chrome扩展私钥问题解决方案

## 问题描述

在开发Chrome扩展时，如果重复加载相同的扩展程序到 `chrome://extensions/`，Chrome会提示：

```
指定扩展程序的私有密钥已存在。请重复使用该密钥，或者先删除它。
```

## 解决方案

### 方案一：使用固定扩展ID（推荐）

我们已经在 `manifest.json` 中添加了一个固定的 `key` 字段。这样Chrome就会始终使用相同的扩展程序ID，避免密钥冲突。

### 方案二：手动删除旧扩展

1. 打开 `chrome://extensions/`
2. 找到之前安装的 "AI Reading" 扩展
3. 点击"删除"按钮
4. 重新加载新的扩展

### 方案三：使用开发工具脚本

我们提供了便捷的开发工具脚本：

```bash
# 添加开发密钥（避免重复导入问题）
npm run ext:key:add

# 构建扩展（包含验证）
npm run build:dev

# 移除密钥（用于发布版本）
npm run ext:key:remove

# 验证构建结果
npm run ext:validate
```

## 开发流程

### 开发模式
```bash
# 1. 添加开发密钥
npm run ext:key:add

# 2. 构建扩展
npm run build:dev

# 3. 在Chrome中加载 dist 文件夹
```

### 发布模式
```bash
# 1. 移除开发密钥
npm run ext:key:remove

# 2. 构建发布版本
npm run build

# 3. 打包 dist 文件夹用于发布
```

## 注意事项

1. **开发密钥不要提交到版本控制系统**
   - 在 `.gitignore` 中忽略包含密钥的文件
   - 或者在提交前移除密钥

2. **扩展ID固定后的好处**
   - 避免重复导入问题
   - 数据存储保持一致
   - 开发体验更流畅

3. **发布时必须移除密钥**
   - Chrome Web Store 不接受包含开发密钥的扩展
   - 发布版本会自动分配新的ID和密钥

## 常见问题

**Q: 为什么需要固定扩展ID？**
A: Chrome为每个扩展分配唯一ID，重新加载时如果ID变化，Chrome会认为是不同的扩展，导致冲突。

**Q: 开发密钥安全吗？**
A: 这只是开发用的占位符密钥，不用于生产环境，安全性不是问题。

**Q: 如何生成真正的RSA密钥？**
A: 可以使用OpenSSL生成，但对于开发环境，固定密钥就足够了。

## 相关文档

- [Chrome Extensions Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/)