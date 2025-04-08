import { deepConvertToJson } from './deep-convert-to-json';

describe('deepConvertToJson', () => {
  it('should return the same value for primitive types', () => {
    expect(deepConvertToJson(null)).toBe(null);
    expect(deepConvertToJson('string')).toBe('string');
    expect(deepConvertToJson(123)).toBe(123);
    expect(deepConvertToJson(true)).toBe(true);
  });

  it('should convert Date to ISO string', () => {
    const date = new Date('2023-01-01T00:00:00Z');
    expect(deepConvertToJson(date)).toBe(date.toISOString());
  });

  it('should handle objects with toJSON methods', () => {
    const input = {
      toJSON: () => 'custom-toJSON-result',
    };
    expect(deepConvertToJson(input)).toBe('custom-toJSON-result');
  });

  it('should recursively convert arrays', () => {
    const input = [1, 'string', new Date('2023-01-01T00:00:00Z')];
    const expected = [1, 'string', '2023-01-01T00:00:00.000Z'];
    expect(deepConvertToJson(input)).toEqual(expected);
  });

  it('should recursively convert objects', () => {
    const input = {
      num: 123,
      str: 'string',
      date: new Date('2023-01-01T00:00:00Z'),
      nested: {
        bool: true,
        arr: [1, 2, 3],
      },
    };
    const expected = {
      num: 123,
      str: 'string',
      date: '2023-01-01T00:00:00.000Z',
      nested: {
        bool: true,
        arr: [1, 2, 3],
      },
    };
    expect(deepConvertToJson(input)).toEqual(expected);
  });

  it('should handle nested objects with toJSON methods', () => {
    const input = {
      nested: {
        toJSON: () => 'nested-toJSON-result',
      },
      other: 'value',
    };
    const expected = {
      nested: 'nested-toJSON-result',
      other: 'value',
    };
    expect(deepConvertToJson(input)).toEqual(expected);
  });

  it('should return empty object for Map', () => {
    const input = new Map<string, unknown>([
      ['key1', 'value1'],
      ['key2', 2],
    ]);
    const expected = {};
    expect(deepConvertToJson(input)).toEqual(expected);
  });

  it('should return empty object for Set', () => {
    const input = new Set([1, 2, 3]);
    const expected = {};
    expect(deepConvertToJson(input)).toEqual(expected);
  });

  it('should throw an error when value is undefined', () => {
    expect(() => deepConvertToJson(undefined)).toThrow(
      'Cannot convert undefined to JSON'
    );
  });

  it('should throw an error for symbol', () => {
    expect(() => deepConvertToJson(Symbol())).toThrow(
      'Cannot convert a Symbol value to JSON'
    );
  });

  it('should throw an error for bigint', () => {
    expect(() => deepConvertToJson(BigInt(123))).toThrow(
      'Cannot convert a BigInt value to JSON'
    );
  });
});
