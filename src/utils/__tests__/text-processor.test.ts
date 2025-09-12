import { describe, it, expect } from 'vitest'
import { TextProcessor } from '../text-processor'

describe('TextProcessor', () => {
  describe('cleanText', () => {
    it('should remove extra whitespace', () => {
      const input = '  Hello   World  '
      const expected = 'Hello World'
      expect(TextProcessor.cleanText(input)).toBe(expected)
    })

    it('should preserve Chinese characters', () => {
      const input = '这是一个测试文本'
      const expected = '这是一个测试文本'
      expect(TextProcessor.cleanText(input)).toBe(expected)
    })

    it('should handle mixed Chinese and English', () => {
      const input = 'Hello 世界 Test'
      const expected = 'Hello 世界 Test'
      expect(TextProcessor.cleanText(input)).toBe(expected)
    })

    it('should handle empty string', () => {
      const input = ''
      const expected = ''
      expect(TextProcessor.cleanText(input)).toBe(expected)
    })
  })

  describe('splitIntoSentences', () => {
    it('should split Chinese text by punctuation', () => {
      const input = '这是第一句。这是第二句！这是第三句？'
      const expected = ['这是第一句', '这是第二句', '这是第三句']
      expect(TextProcessor.splitIntoSentences(input)).toEqual(expected)
    })

    it('should handle line breaks', () => {
      const input = '第一行\n第二行\n第三行'
      const expected = ['第一行', '第二行', '第三行']
      expect(TextProcessor.splitIntoSentences(input)).toEqual(expected)
    })

    it('should filter empty sentences', () => {
      const input = '句子一。。句子二'
      const result = TextProcessor.splitIntoSentences(input)
      expect(result).not.toContain('')
    })
  })

  describe('isNovelContent', () => {
    it('should identify novel content', () => {
      const novelText = '在这个充满魔法的世界里，年轻的法师艾伦踏上了寻找真理的旅程。他背着古老的法杖，穿越了危险的森林，遇到了各种神奇的生物。'
      expect(TextProcessor.isNovelContent(novelText)).toBe(true)
    })

    it('should reject short text', () => {
      const shortText = '短文本'
      expect(TextProcessor.isNovelContent(shortText)).toBe(false)
    })

    it('should reject non-Chinese content', () => {
      const englishText = 'This is a test in English language only'
      expect(TextProcessor.isNovelContent(englishText)).toBe(false)
    })

    it('should handle mixed content', () => {
      const mixedText = '这是中文内容 English content 中文继续 more English'
      const result = TextProcessor.isNovelContent(mixedText)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('extractChapterTitle', () => {
    it('should extract chapter titles', () => {
      const patterns = [
        '第一章 初入江湖',
        '第二十三章 决战之日',
        '第一节 开端',
        '序章 故事的开始',
        '楔子',
        '终章 落幕'
      ]

      patterns.forEach(pattern => {
        const result = TextProcessor.extractChapterTitle(pattern)
        expect(result).toBe(pattern)
      })
    })

    it('should return null for non-chapter text', () => {
      const nonChapterText = '这只是普通的段落文本，不是章节标题'
      expect(TextProcessor.extractChapterTitle(nonChapterText)).toBeNull()
    })

    it('should handle empty or invalid input', () => {
      expect(TextProcessor.extractChapterTitle('')).toBeNull()
      expect(TextProcessor.extractChapterTitle('   ')).toBeNull()
    })
  })

  describe('calculateTextDensity', () => {
    it('should calculate text density correctly', () => {
      // Create a mock element
      const mockElement = {
        textContent: 'Hello World',
        innerHTML: '<p>Hello World</p>'
      } as Element;

      const density = TextProcessor.calculateTextDensity(mockElement);
      expect(density).toBeGreaterThan(0);
      expect(density).toBeLessThanOrEqual(1);
    });

    it('should handle element with no content', () => {
      const mockElement = {
        textContent: '',
        innerHTML: '<div></div>'
      } as Element;

      const density = TextProcessor.calculateTextDensity(mockElement);
      expect(density).toBe(0);
    });
  });

  describe('filterIrrelevantContent', () => {
    it('should filter out advertisement content', () => {
      const adTexts = [
        '广告：最新产品推广',
        '点击下载最新版本',
        '注册即可获得优惠',
        '热门推荐小说'
      ];

      adTexts.forEach(text => {
        expect(TextProcessor.filterIrrelevantContent(text)).toBe(false);
      });
    });

    it('should allow relevant content', () => {
      const relevantTexts = [
        '这是小说的正文内容',
        '主角走在街道上',
        '对话："你好吗？"'
      ];

      relevantTexts.forEach(text => {
        expect(TextProcessor.filterIrrelevantContent(text)).toBe(true);
      });
    });
  });

  describe('mergeParagraphs', () => {
    it('should merge paragraphs correctly', () => {
      const paragraphs = ['段落一', '段落二', '段落三'];
      const result = TextProcessor.mergeParagraphs(paragraphs);
      expect(result).toBe('段落一\n\n段落二\n\n段落三');
    });

    it('should filter empty paragraphs', () => {
      const paragraphs = ['段落一', '', '段落二', '   ', '段落三'];
      const result = TextProcessor.mergeParagraphs(paragraphs);
      expect(result).toBe('段落一\n\n段落二\n\n段落三');
    });

    it('should handle empty array', () => {
      const paragraphs: string[] = [];
      const result = TextProcessor.mergeParagraphs(paragraphs);
      expect(result).toBe('');
    });
  });
});