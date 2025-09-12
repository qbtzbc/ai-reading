#!/usr/bin/env node

/**
 * AI Reading 扩展开发工具
 * 用于管理Chrome扩展的开发、构建和部署
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ExtensionDevUtils {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distPath = path.join(this.projectRoot, 'dist');
    this.manifestPath = path.join(this.projectRoot, 'manifest.json');
  }

  /**
   * 清理并重新构建扩展
   */
  build() {
    console.log('🔨 开始构建扩展...');
    
    try {
      // 清理 dist 目录
      if (fs.existsSync(this.distPath)) {
        console.log('🧹 清理旧的构建文件...');
        execSync('rm -rf dist/*', { cwd: this.projectRoot });
      }

      // 运行构建命令
      console.log('📦 运行构建命令...');
      execSync('npm run build', { cwd: this.projectRoot, stdio: 'inherit' });

      console.log('✅ 构建完成！');
      console.log('📁 扩展文件位于:', this.distPath);
      
      this.validateBuild();
    } catch (error) {
      console.error('❌ 构建失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 验证构建结果
   */
  validateBuild() {
    console.log('🔍 验证构建结果...');

    const requiredFiles = [
      'manifest.json',
      'service-worker-loader.js',
      'src/popup/popup.html',
      'src/options/options.html',
      'assets/icons/icon16.png',
      'assets/icons/icon32.png',
      'assets/icons/icon48.png',
      'assets/icons/icon128.png'
    ];

    const missingFiles = [];

    requiredFiles.forEach(file => {
      const filePath = path.join(this.distPath, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      console.error('❌ 缺少必要文件:');
      missingFiles.forEach(file => console.error(`  - ${file}`));
      return false;
    }

    // 验证 manifest.json
    try {
      const manifestPath = path.join(this.distPath, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      if (!manifest.manifest_version || !manifest.name || !manifest.version) {
        console.error('❌ manifest.json 格式不正确');
        return false;
      }

      console.log('✅ 所有必要文件都已生成');
      console.log(`📋 扩展名称: ${manifest.name}`);
      console.log(`📋 版本: ${manifest.version}`);
      return true;
    } catch (error) {
      console.error('❌ manifest.json 解析失败:', error.message);
      return false;
    }
  }

  /**
   * 生成新的扩展密钥
   */
  generateKey() {
    console.log('🔑 生成新的扩展密钥...');
    
    try {
      // 这里使用一个固定的开发密钥，实际项目中应该生成真正的RSA密钥
      const devKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxvKqj9xYXnUEXEuCGPFzQpQYgYyYnl4V7QBwN7nSPmCLGVAqBWYjV8rT6nTcXfQq0r4eGZN5B+U8X8h5vN5K6GzJ5o7K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5K5z5QIDAQAB';
      
      // 读取现有的 manifest.json
      const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
      
      // 添加或更新密钥
      manifest.key = devKey;
      
      // 写回文件
      fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
      
      console.log('✅ 密钥已添加到 manifest.json');
      console.log('💡 扩展ID将保持固定，避免重复导入问题');
    } catch (error) {
      console.error('❌ 生成密钥失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 移除扩展密钥（用于发布版本）
   */
  removeKey() {
    console.log('🗑️ 移除扩展密钥...');
    
    try {
      const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
      
      if (manifest.key) {
        delete manifest.key;
        fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
        console.log('✅ 密钥已从 manifest.json 中移除');
        console.log('💡 现在可以打包发布版本了');
      } else {
        console.log('ℹ️ manifest.json 中没有找到密钥');
      }
    } catch (error) {
      console.error('❌ 移除密钥失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🚀 AI Reading 扩展开发工具

用法: node scripts/dev-utils.js <command>

命令:
  build      - 构建扩展 (清理 + 构建 + 验证)
  key:add    - 添加开发密钥到 manifest.json
  key:remove - 从 manifest.json 移除密钥 (用于发布)
  validate   - 验证当前构建
  help       - 显示此帮助信息

示例:
  node scripts/dev-utils.js build
  node scripts/dev-utils.js key:add
  node scripts/dev-utils.js key:remove
  
💡 开发提示:
  - 使用 key:add 来避免 Chrome 扩展导入时的密钥冲突
  - 发布前使用 key:remove 来移除开发密钥
  - 使用 build 来完整构建和验证扩展
`);
  }
}

// 处理命令行参数
const command = process.argv[2];
const utils = new ExtensionDevUtils();

switch (command) {
  case 'build':
    utils.build();
    break;
  case 'key:add':
    utils.generateKey();
    break;
  case 'key:remove':
    utils.removeKey();
    break;
  case 'validate':
    utils.validateBuild();
    break;
  case 'help':
  case undefined:
    utils.showHelp();
    break;
  default:
    console.error(`❌ 未知命令: ${command}`);
    utils.showHelp();
    process.exit(1);
}