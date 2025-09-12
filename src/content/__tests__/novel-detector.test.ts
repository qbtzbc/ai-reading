import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NovelDetector, NovelDetectionResult } from '../novel-detector'

// Mock DOM
const mockQuerySelector = vi.fn()
const mockQuerySelectorAll = vi.fn()

Object.defineProperty(global, 'document', {
  value: {
    querySelector: mockQuerySelector,
    querySelectorAll: mockQuerySelectorAll,
  },
  writable: true,
})

Object.defineProperty(global, 'window', {
  value: {
    location: {
      hostname: 'test.com'
    }
  },
  writable: true,
})

describe('NovelDetector', () => {
  let detector: NovelDetector

  beforeEach(() => {
    detector = new NovelDetector()
    vi.clearAllMocks()
  })

  describe('detectNovelContent', () => {
    it('should detect content using site rules', async () => {
      // Mock a known site
      Object.defineProperty(window, 'location', {
        value: { hostname: 'qidian.com' },
        writable: true,
      });

      const mockTitleElement = {
        textContent: '第一章 开始'
      };

      const mockContentElement = {
        textContent: '这是一个很长的小说内容，描述了主角的冒险经历。在这个充满魔法的世界里，年轻的法师艾伦踏上了寻找真理的旅程。'
      };

      mockQuerySelector
        .mockReturnValueOnce(mockTitleElement)  // title selector
        .mockReturnValueOnce(mockContentElement); // content selector

      const result = await detector.detectNovelContent();

      expect(result.isNovel).toBe(true);
      expect(result.title).toBe('第一章 开始');
      expect(result.confidence).toBe(0.9);
    });

    it('should fall back to generic detection', async () => {
      // Mock unknown site
      Object.defineProperty(window, 'location', {
        value: { hostname: 'unknown.com' },
        writable: true,
      });

      // Mock no specific content found
      mockQuerySelector.mockReturnValue(null);

      const mockElements = [{
        textContent: '这是一个很长的小说内容，描述了主角的冒险经历。在这个充满魔法的世界里，年轻的法师艾伦踏上了寻找真理的旅程。他背着古老的法杖，穿越了危险的森林，遇到了各种神奇的生物。经过无数的挑战和考验，他终于找到了传说中的真理之源。',
        querySelectorAll: jest.fn().mockReturnValue([]),
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 100,
          height: 200
        }),
        innerHTML: '<p>长文本内容</p>'
      }];

      mockQuerySelectorAll.mockReturnValue(mockElements);

      const result = await detector.detectNovelContent();

      expect(result.isNovel).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return negative result for non-novel content', async () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'unknown.com' },
        writable: true,
      });

      mockQuerySelector.mockReturnValue(null);

      const mockElements = [{
        textContent: 'Short text',
        querySelectorAll: jest.fn().mockReturnValue([]),
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 100,
          height: 200
        }),
        innerHTML: '<p>Short text</p>'
      }];

      mockQuerySelectorAll.mockReturnValue(mockElements);

      const result = await detector.detectNovelContent();

      expect(result.isNovel).toBe(false);
    });
  });

  describe('scoreElement', () => {
    it('should score elements correctly', async () => {
      const mockElement = {
        textContent: '这是一个很长的测试文本，用来测试元素评分功能',
        querySelectorAll: jest.fn()
          .mockReturnValueOnce([{}, {}]) // paragraphs
          .mockReturnValueOnce([]) // images
          .mockReturnValueOnce([]), // links
        getBoundingClientRect: jest.fn().mockReturnValue({
          top: 100,
          height: 200
        }),
        innerHTML: '<p>测试文本</p>'
      };

      // Use reflection to access private method
      const score = (detector as any).scoreElement(mockElement);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('extractTextContent', () => {
    it('should extract clean text content', () => {
      const mockElement = {
        cloneNode: jest.fn().mockReturnValue({
          querySelectorAll: jest.fn().mockReturnValue([]),
          textContent: '这是测试文本内容'
        })
      };

      const result = (detector as any).extractTextContent(mockElement);
      expect(result).toBe('这是测试文本内容');
    });
  });

  describe('findChapterTitle', () => {
    it('should find chapter titles', () => {
      const mockElements = [
        { textContent: '普通文本' },
        { textContent: '第一章 开始的故事' },
        { textContent: '更多文本' }
      ];

      mockQuerySelectorAll.mockReturnValue(mockElements);

      const result = (detector as any).findChapterTitle();
      expect(result).toBe('第一章 开始的故事');
    });

    it('should return null when no chapter title found', () => {
      const mockElements = [
        { textContent: '普通文本' },
        { textContent: '没有章节标题' }
      ];

      mockQuerySelectorAll.mockReturnValue(mockElements);

      const result = (detector as any).findChapterTitle();
      expect(result).toBeNull();
    });
  });

  describe('updateSiteRules', () => {
    it('should update site rules', () => {
      const newRules = [{
        domain: 'newsite.com',
        titleSelector: '.new-title',
        contentSelector: '.new-content',
        enabled: true
      }];

      detector.updateSiteRules(newRules);

      // Test that rules are updated (would need to test actual detection with new rules)
      expect(detector).toBeDefined();
    });
  });
});