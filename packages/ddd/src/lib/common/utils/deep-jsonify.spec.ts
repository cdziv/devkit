import { deepJsonify } from './deep-jsonify';

describe('deepJsonify', () => {
  it('should return the same value for null', () => {
    expect(deepJsonify(null)).toBe(null);
  });

  it('should return the same value for string', () => {
    expect(deepJsonify('string')).toBe('string');
  });

  it('should return the same value for number', () => {
    expect(deepJsonify(123)).toBe(123);
  });

  it('should return the same value for boolean', () => {
    expect(deepJsonify(true)).toBe(true);
  });

  it('should return undefined for undefined', () => {
    expect(deepJsonify(undefined)).toBe(undefined);
  });

  it('should convert Date to ISO string', () => {
    const date = new Date('2023-01-01T00:00:00Z');
    expect(deepJsonify(date)).toBe(date.toISOString());
  });

  it('should convert Symbol to empty object', () => {
    const symbol = Symbol('symbol');
    expect(deepJsonify(symbol)).toEqual({});
  });

  it('should convert BigInt to empty object', () => {
    const bigInt = BigInt(123);
    expect(deepJsonify(bigInt)).toEqual({});
  });

  it('should convert Map to empty object', () => {
    const map = new Map<string, unknown>([
      ['key1', 'value1'],
      ['key2', 2],
    ]);
    expect(deepJsonify(map)).toEqual({});
  });

  it('should convert Set to empty object', () => {
    const set = new Set([1, 'string', true]);
    expect(deepJsonify(set)).toEqual({});
  });

  it('should convert array to array of JSON values', () => {
    const input = [1, 'string', new Date('2023-01-01T00:00:00Z')];
    const expected = [1, 'string', '2023-01-01T00:00:00.000Z'];
    expect(deepJsonify(input)).toEqual(expected);
  });

  it('should convert object to object of JSON values', () => {
    const input = {
      num: 123,
      str: 'string',
      date: new Date('2023-01-01T00:00:00Z'),
    };
    const expected = {
      num: 123,
      str: 'string',
      date: '2023-01-01T00:00:00.000Z',
    };
    expect(deepJsonify(input)).toEqual(expected);
  });

  it('should handle objects with toJSON methods', () => {
    const input = {
      toJSON: () => 'custom-toJSON-result',
    };
    expect(deepJsonify(input)).toBe('custom-toJSON-result');
  });

  it('should recursively convert arrays', () => {
    const input = [
      1,
      'string',
      new Date('2023-01-01T00:00:00Z'),
      [2, 'nested-string', { toJSON: () => 'nested-toJSON-result' }],
    ];
    const expected = [
      1,
      'string',
      '2023-01-01T00:00:00.000Z',
      [2, 'nested-string', 'nested-toJSON-result'],
    ];
    expect(deepJsonify(input)).toEqual(expected);
  });

  it('should recursively convert objects', () => {
    const input = {
      num: 123,
      str: 'string',
      date: new Date('2023-01-01T00:00:00Z'),
      nested: {
        bool: true,
        arr: [1, 2, 3],
        jsonifiable: {
          toJSON: () => 'nested-toJSON-result',
        },
      },
    };
    const expected = {
      num: 123,
      str: 'string',
      date: '2023-01-01T00:00:00.000Z',
      nested: {
        bool: true,
        arr: [1, 2, 3],
        jsonifiable: 'nested-toJSON-result',
      },
    };
    expect(deepJsonify(input)).toEqual(expected);
  });

  it('should throw an error for unsupported types(function)', () => {
    expect(() =>
      deepJsonify(() => {
        return;
      })
    ).toThrow();
  });
});
