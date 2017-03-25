const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

describe(fn.name, () => {
  ['code', 'none'].forEach((type) => {
    it(`resolves query response_mode for response_type=${type}`, async () => {
      const ctx = { oidc: { params: { response_type: type } } };
      await fn(ctx, () => Promise.resolve());
      expect(ctx.oidc.params.response_mode).toBe('query');
    });
  });

  [
    'code id_token token',
    'code id_token',
    'code token',
    'id_token token',
    'id_token',
  ].forEach((type) => {
    it(`resolves fragment response_mode for response_type=${type}`, async () => {
      const ctx = { oidc: { params: { response_type: type } } };
      await fn(ctx, () => Promise.resolve());
      expect(ctx.oidc.params.response_mode).toBe('fragment');
    });

    it(`forbids query for response_type=${type}`, async () => {
      const ctx = mock({
        params: {
          response_mode: 'query',
          response_type: type,
        },
      });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          status: 400,
          message: 'invalid_request',
          error_description: 'response_mode not allowed for this response_type',
        });
      }
    });
  });
});
