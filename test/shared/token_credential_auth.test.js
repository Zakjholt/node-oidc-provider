const mock = require('../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

const ctx = mock();

describe(fn.name, () => {
  it('throws invalid client if secrets do not match', () => {
    expect(() => {
      fn.call(ctx, 'foo', 'foo');
    }).not.toThrow();
  });

  it('throws invalid client if secrets do not match', () => {
    expect(() => {
      fn.call(ctx, 'foo', 'bar');
    }).toThrow('invalid_client');
  });
});
