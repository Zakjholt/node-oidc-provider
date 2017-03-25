const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

describe(fn.name, () => {
  it('passes when openid scope is present', async () => {
    const ctx = mock({ params: { scope: 'openid profile offline_access' } });
    await fn(ctx, () => Promise.resolve());
  });

  it('throws when openid scope is not present', async () => {
    const ctx = mock({ params: { scope: 'profile offline_access' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        status: 400,
        message: 'invalid_request',
        error_description: 'openid is required scope',
      });
    }
  });
});
