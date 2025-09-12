// 文本清理和预处理工具
export class TextProcessor {
  // 清理文本内容
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/[^\u4e00-\u9fa5\u3400-\u4dbf\ua700-\ua71f\u0020-\u007f\s]/g, '') // 保留中文、英文和空格
      .trim();
  }

  // 分割文本为句子
  static splitIntoSentences(text: string): string[] {
    // 中文句号、问号、感叹号作为分句标准
    const sentences = text.split(/[。！？；\n]/);
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // 检测文本是否为小说内容
  static isNovelContent(text: string): boolean {
    const cleanedText = this.cleanText(text);
    
    // 基本长度检查
    if (cleanedText.length < 50) return false;
    
    // 检查中文字符比例
    const chineseChars = cleanedText.match(/[\u4e00-\u9fa5]/g);
    const chineseRatio = chineseChars ? chineseChars.length / cleanedText.length : 0;
    
    // 中文比例大于60%且总长度足够
    return chineseRatio > 0.6 && cleanedText.length > 100;
  }

  // 提取章节标题
  static extractChapterTitle(text: string): string | null {
    // 常见章节标题模式
    const patterns = [
      /第[一二三四五六七八九十百千万\d]+章[\s]*([^\n\r。！？]*)/,
      /第[一二三四五六七八九十百千万\d]+节[\s]*([^\n\r。！？]*)/,
      /序章[\s]*([^\n\r。！？]*)/,
      /楔子[\s]*([^\n\r。！？]*)/,
      /终章[\s]*([^\n\r。！？]*)/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return null;
  }

  // 计算文本密度（用于判断是否为正文内容）
  static calculateTextDensity(element: Element): number {
    const text = element.textContent || '';
    const html = element.innerHTML;
    
    if (html.length === 0) return 0;
    
    // 文本密度 = 纯文本长度 / HTML长度
    return text.length / html.length;
  }

  // 过滤广告和无关内容
  static filterIrrelevantContent(text: string): boolean {
    const irrelevantPatterns = [
      /广告|推广|赞助|版权|转载|来源/,
      /点击|下载|注册|登录|充值/,
      /热门推荐|相关阅读|猜你喜欢/,
      /订阅|收藏|分享|评论/,
    ];

    return !irrelevantPatterns.some(pattern => pattern.test(text));
  }

  // 合并段落
  static mergeParagraphs(paragraphs: string[]): string {
    return paragraphs
      .filter(p => p.trim().length > 0)
      .map(p => this.cleanText(p))
      .join('\n\n');
  }
}