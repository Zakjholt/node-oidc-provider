const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = { get: jest.fn(() => ['code', 'id_token', 'none']) };
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  it('asserts a response type is supported and allowed for a client', async () => {
    const ctx = mock({
      params: { response_type: 'foo' },
      client: { responseTypes: ['code'] },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'unsupported_response_type',
        error_description: 'response_type not supported. (foo)',
      });
    }

    try {
      ctx.oidc.params.response_type = 'none';
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'restricted_response_type',
        error_description: 'response_type not allowed for this client',
      });
    }

    ctx.oidc.params.response_type = 'code';
    await fn(ctx, () => Promise.resolve());
  });
});
