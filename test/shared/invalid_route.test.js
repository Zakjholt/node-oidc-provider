const mock = require('../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

describe(fn.name, () => {
  it('does not touch handled requests', async () => {
    const ctx = mock();
    ctx.status = 200;
    await fn(ctx, () => Promise.resolve());
  });

  it('only handles non handled requests', async () => {
    const ctx = mock();
    ctx.status = 404;
    ctx.statusMessage = 'Not Found';
    try {
      await fn(ctx, () => Promise.resolve());
      throw new Error();
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request',
        error_description: 'unrecognized route',
      });
    }
  });
});
