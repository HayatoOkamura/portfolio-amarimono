declare module 'kuroshiro' {
  export default class Kuroshiro {
    init(analyzer: any): Promise<void>;
    convert(str: string, options?: {
      to?: 'hiragana' | 'katakana' | 'romaji';
      mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
      romajiSystem?: 'nippon' | 'passport' | 'hepburn';
      delimiter_start?: string;
      delimiter_end?: string;
    }): Promise<string>;
  }
}

declare module 'kuroshiro-analyzer-kuromoji' {
  export default class KuromojiAnalyzer {
    constructor(options?: { dictPath?: string });
  }
} 