import { findClosestTextSegment } from './findClosestTextSegment';

describe('findClosestTextSegment', () => {
  it('returns null when inputs are empty', () => {
    expect(findClosestTextSegment('', 'hello')).toBeNull();
    expect(findClosestTextSegment('hello world', '')).toBeNull();
  });

  it('finds an approximate match inside a block of text', () => {
    const block =
      'This is a sample paragraph about testing string matching; it contains a target phrase somewhere inside.';
    const target = 'target phrase';
    const result = findClosestTextSegment(block, target, 1, 6, 0.3);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.matchText.toLowerCase()).toContain('target');
      expect(result.score).toBeGreaterThanOrEqual(0.3);
    }
  });
});
