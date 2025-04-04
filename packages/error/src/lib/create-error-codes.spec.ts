import { describe, expect, it } from 'vitest';
import { createErrorCodes } from './create-error-codes';

describe('createErrorCodes', () => {
  it('should create error codes from an array', () => {
    const errorCodes = createErrorCodes(['ERROR_1', 'ERROR_2']);
    expect(errorCodes).toEqual({
      ERROR_1: 'ERROR_1',
      ERROR_2: 'ERROR_2',
    });
  });
  it('should create error codes from an object', () => {
    const errorCodes = createErrorCodes({
      ERROR_1: 'ERROR_1',
      ERROR_2: 'ERROR_2',
    });
    expect(errorCodes).toEqual({
      ERROR_1: 'ERROR_1',
      ERROR_2: 'ERROR_2',
    });
  });
  it('should create error codes with a module name', () => {
    const errorCodes = createErrorCodes(['ERROR_1', 'ERROR_2'], {
      moduleName: 'MODULE',
    });
    expect(errorCodes).toEqual({
      ERROR_1: 'MODULE/ERROR_1',
      ERROR_2: 'MODULE/ERROR_2',
    });
  });
  it('should create error codes with a custom delimiter', () => {
    const errorCodes = createErrorCodes(['ERROR_1', 'ERROR_2'], {
      moduleName: 'MODULE',
      delimiter: '.',
    });
    expect(errorCodes).toEqual({
      ERROR_1: 'MODULE.ERROR_1',
      ERROR_2: 'MODULE.ERROR_2',
    });
  });
});
