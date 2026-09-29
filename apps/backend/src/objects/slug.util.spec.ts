import { slugify } from './slug.util';

describe('slugify', () => {
  it('transliterates Cyrillic and lowercases', () => {
    expect(slugify('Ремонт квартиры №5')).toBe('remont-kvartiry-5');
  });

  it('collapses repeated separators', () => {
    expect(slugify('Дом  --  у моря!!!')).toBe('dom-u-morya');
  });
});
