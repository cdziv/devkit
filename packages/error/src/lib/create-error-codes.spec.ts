import { describe, expect, it } from 'vitest';
import { createErrorCodes } from './create-error-codes';

describe('createErrorCodes', () => {
  it('should create error codes from an array', () => {
    const source = ['ERROR_1', 'ERROR_2'] as const;
    const errorCodes = createErrorCodes(source);
    expect(errorCodes).toEqual({
      ERROR_1: 'ERROR_1',
      ERROR_2: 'ERROR_2',
    });
  });
  it('should create error codes from an object', () => {
    const source = {
      ERROR_1: 'ERROR_1',
      ERROR_2: 'ERROR_2',
    } as const;
    const errorCodes = createErrorCodes(source);
    expect(errorCodes).toEqual({
      ERROR_1: 'ERROR_1',
      ERROR_2: 'ERROR_2',
    });
  });
  it('should create error codes with a module name', () => {
    const source = ['ERROR_1', 'ERROR_2'] as const;
    const moduleName = 'MODULE' as const;
    const errorCodes = createErrorCodes(source, {
      moduleName,
    });
    expect(errorCodes).toEqual({
      ERROR_1: 'MODULE/ERROR_1',
      ERROR_2: 'MODULE/ERROR_2',
    });
  });
  it('should create error codes with a custom delimiter', () => {
    const moduleName = 'MODULE' as const;
    const source = ['ERROR_1', 'ERROR_2'] as const;
    const delimiter = '.' as const;
    const errorCodes = createErrorCodes(source, {
      moduleName,
      delimiter,
    });

    expect(errorCodes).toEqual({
      ERROR_1: 'MODULE.ERROR_1',
      ERROR_2: 'MODULE.ERROR_2',
    });
  });
});
