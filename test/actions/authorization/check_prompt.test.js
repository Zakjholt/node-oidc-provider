const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = { get: jest.fn(() => ['login', 'consent', 'offline_access', 'none']) };
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  it('passes to next when no prompt was requested', async () => {
    const ctx = mock({ params: {} });
    await fn(ctx, () => Promise.resolve());
  });

  it('asserts all requested scopes are supported', async () => {
    const ctx = mock({ params: { prompt: 'consent login offline_access' } });
    await fn(ctx, () => Promise.resolve());

    ctx.oidc.params.prompt = 'offline_access foo';
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request',
        error_description: 'invalid prompt value(s) provided. (foo)',
      });
    }
  });

  it('asserts prompt=none is only used alone', async () => {
    const ctx = mock({ params: { prompt: 'none' } });
    await fn(ctx, () => Promise.resolve());

    ctx.oidc.params.prompt = 'none login';
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request',
        error_description: 'prompt none must only be used alone',
      });
    }
  });
});
