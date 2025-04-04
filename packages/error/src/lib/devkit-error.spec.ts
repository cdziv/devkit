import { devkitError } from './devkit-error.js';

describe('devkitError', () => {
  it('should work', () => {
    expect(devkitError()).toEqual('devkit-error');
  });
});
