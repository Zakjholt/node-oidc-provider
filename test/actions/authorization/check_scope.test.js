const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = { get: jest.fn(() => ['openid', 'offline_access', 'profile']) };
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  it('asserts openid scope was requested', async () => {
    const ctx = mock({ params: { scope: 'profile' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request',
        error_description: 'openid is required scope',
      });
    }
  });

  it('ignores unrecognized scopes', async () => {
    const ctx = mock({ params: { scope: 'openid profile foobar' } });
    await fn(ctx, () => Promise.resolve());
  });

  it('ignores unrecognized scopes and filters them out for the rest of the middlewares', async () => {
    const ctx = mock({ params: { scope: 'openid profile foobar' } });
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.scope).toBe('openid profile');
  });

  it('ignores and pulls offline_access scope if consent prompt is missing', async () => {
    const ctx = mock({ params: { scope: 'openid offline_access', response_type: 'code' } });
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.scope).toBe('openid');
  });

  it('ignores and pulls offline_access scope if no code was requested', async () => {
    const ctx = mock({ params: { scope: 'openid offline_access', prompt: 'consent', response_type: 'id_token token' } });
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.scope).toBe('openid');
  });

  it('leaves all scopes in (even offline_access when its valid)', async () => {
    const ctx = mock({ params: { scope: 'openid offline_access', prompt: 'consent', response_type: 'id_token code' } });
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.scope).toBe('openid offline_access');
  });
});
