import { error } from './error.js';

describe('error', () => {
  it('should work', () => {
    expect(error()).toEqual('error');
  });
});
