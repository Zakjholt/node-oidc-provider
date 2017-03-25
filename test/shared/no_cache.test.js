const mock = require('../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

describe(fn.name, () => {
  it('sets pragma and cache control and yields next', async () => {
    const ctx = mock();
    ctx.set = jest.fn();
    await fn(ctx, () => Promise.resolve());
    expect(ctx.set).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(ctx.set).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store');
  });
});
