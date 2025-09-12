import { TextProcessor } from '@/utils/text-processor';
import { SiteRule } from '@/utils/storage';

// 小说内容检测结果
export interface NovelDetectionResult {
  isNovel: boolean;
  content: string;
  title: string | null;
  confidence: number;
}

// 预定义的网站规则
const PREDEFINED_SITE_RULES: SiteRule[] = [
  {
    domain: 'qidian.com',
    titleSelector: '.j_chapterName',
    contentSelector: '.read-content .j_readContent',
    enabled: true,
  },
  {
    domain: 'zongheng.com',
    titleSelector: '.title_txtbox',
    contentSelector: '.content',
    enabled: true,
  },
  {
    domain: 'readnovel.com',
    titleSelector: '.reader-title',
    contentSelector: '.reader-content',
    enabled: true,
  },
  {
    domain: 'xxsy.net',
    titleSelector: '.bookname h1',
    contentSelector: '#content',
    enabled: true,
  },
  {
    domain: 'jjwxc.net',
    titleSelector: '.noveltitle',
    contentSelector: '.novelcontent',
    enabled: true,
  },
];

export class NovelDetector {
  private siteRules: SiteRule[] = PREDEFINED_SITE_RULES;

  // 检测页面是否包含小说内容
  async detectNovelContent(): Promise<NovelDetectionResult> {
    const currentDomain = window.location.hostname;
    
    // 首先尝试使用网站特定规则
    const siteRule = this.siteRules.find(rule => 
      currentDomain.includes(rule.domain) && rule.enabled
    );

    if (siteRule) {
      const result = this.detectWithSiteRule(siteRule);
      if (result.isNovel) {
        return result;
      }
    }

    // 如果网站规则失败，使用通用检测
    return this.detectWithGenericRules();
  }

  // 使用网站特定规则检测
  private detectWithSiteRule(rule: SiteRule): NovelDetectionResult {
    try {
      const titleElement = document.querySelector(rule.titleSelector);
      const contentElement = document.querySelector(rule.contentSelector);

      if (!contentElement) {
        return { isNovel: false, content: '', title: null, confidence: 0 };
      }

      const content = this.extractTextContent(contentElement);
      const title = titleElement ? titleElement.textContent?.trim() || null : null;

      if (TextProcessor.isNovelContent(content)) {
        return {
          isNovel: true,
          content: TextProcessor.cleanText(content),
          title,
          confidence: 0.9,
        };
      }

      return { isNovel: false, content: '', title: null, confidence: 0 };
    } catch (error) {
      console.error('Error detecting with site rule:', error);
      return { isNovel: false, content: '', title: null, confidence: 0 };
    }
  }

  // 使用通用规则检测
  private detectWithGenericRules(): NovelDetectionResult {
    const candidates = this.findContentCandidates();
    let bestCandidate: NovelDetectionResult = {
      isNovel: false,
      content: '',
      title: null,
      confidence: 0,
    };

    for (const candidate of candidates) {
      const content = this.extractTextContent(candidate.element);
      
      if (TextProcessor.isNovelContent(content)) {
        const confidence = this.calculateConfidence(candidate.element, content);
        
        if (confidence > bestCandidate.confidence) {
          bestCandidate = {
            isNovel: true,
            content: TextProcessor.cleanText(content),
            title: this.findChapterTitle(),
            confidence,
          };
        }
      }
    }

    return bestCandidate;
  }

  // 查找内容候选元素
  private findContentCandidates(): Array<{ element: Element; score: number }> {
    const candidates: Array<{ element: Element; score: number }> = [];

    // 常见的内容容器选择器
    const selectors = [
      'article',
      '.content',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.novel-content',
      '.read-content',
      '.chapter-content',
      '#content',
      '[class*="content"]',
      '[id*="content"]',
      'main',
      '.main',
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const score = this.scoreElement(element);
        if (score > 0) {
          candidates.push({ element, score });
        }
      });
    });

    // 按分数排序
    return candidates.sort((a, b) => b.score - a.score);
  }

  // 为元素评分
  private scoreElement(element: Element): number {
    let score = 0;

    // 文本长度分数
    const textLength = (element.textContent || '').length;
    score += Math.min(textLength / 1000, 50); // 最高50分

    // 文本密度分数
    const density = TextProcessor.calculateTextDensity(element);
    score += density * 30; // 最高30分

    // 段落数量分数
    const paragraphs = element.querySelectorAll('p');
    score += Math.min(paragraphs.length, 20); // 最高20分

    // 减分项
    const images = element.querySelectorAll('img');
    const links = element.querySelectorAll('a');
    score -= images.length * 2; // 图片过多减分
    score -= links.length * 0.5; // 链接过多减分

    // 位置分数（更靠近页面中心的元素得分更高）
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const distanceFromCenter = Math.abs(elementCenter - viewportHeight / 2);
    score += Math.max(0, 10 - distanceFromCenter / viewportHeight * 10);

    return Math.max(0, score);
  }

  // 提取文本内容
  private extractTextContent(element: Element): string {
    // 克隆元素以避免修改原始DOM
    const clone = element.cloneNode(true) as Element;

    // 移除不需要的元素
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.ad',
      '.advertisement',
      '.comment',
      '.social',
      '.share',
      '[class*="ad"]',
      '[class*="comment"]',
    ];

    unwantedSelectors.forEach(selector => {
      const unwantedElements = clone.querySelectorAll(selector);
      unwantedElements.forEach(el => el.remove());
    });

    return clone.textContent || '';
  }

  // 查找章节标题
  private findChapterTitle(): string | null {
    const titleSelectors = [
      'h1',
      'h2',
      'h3',
      '.title',
      '.chapter-title',
      '.novel-title',
      '[class*="title"]',
    ];

    for (const selector of titleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of Array.from(elements)) {
        const text = element.textContent?.trim();
        if (text && TextProcessor.extractChapterTitle(text)) {
          return text;
        }
      }
    }

    return null;
  }

  // 计算检测置信度
  private calculateConfidence(element: Element, content: string): number {
    let confidence = 0.5; // 基础置信度

    // 基于文本长度
    if (content.length > 500) confidence += 0.1;
    if (content.length > 1000) confidence += 0.1;
    if (content.length > 2000) confidence += 0.1;

    // 基于中文比例
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
    const chineseRatio = chineseChars ? chineseChars.length / content.length : 0;
    confidence += chineseRatio * 0.2;

    // 基于段落结构
    const paragraphs = element.querySelectorAll('p');
    if (paragraphs.length > 3) confidence += 0.1;

    // 基于元素类名
    const className = element.className.toLowerCase();
    if (className.includes('content') || className.includes('article')) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  // 更新网站规则
  updateSiteRules(rules: SiteRule[]): void {
    this.siteRules = [...PREDEFINED_SITE_RULES, ...rules];
  }
}