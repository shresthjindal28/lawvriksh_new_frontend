import { createTempAnnotationId, isTempAnnotationId } from './helpers';

describe('annotation id helpers', () => {
  it('creates ids that are recognized as temp ids', () => {
    const id = createTempAnnotationId();
    expect(id.startsWith('temp-')).toBe(true);
    expect(isTempAnnotationId(id)).toBe(true);
  });

  it('does not treat non-temp ids as temp ids', () => {
    expect(isTempAnnotationId('123')).toBe(false);
    expect(isTempAnnotationId('a1b2c3')).toBe(false);
    expect(isTempAnnotationId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
  });
});
