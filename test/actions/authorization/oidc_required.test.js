const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

describe(fn.name, () => {
  it('always passes to next if redirect and nonce are provided', async () => {
    const ctx = mock({ params: { redirect_uri: 'foo', nonce: 'foo' } });
    await fn(ctx, () => Promise.resolve());
  });

  it('throws when redirect_uri is missing', async () => {
    const ctx = mock({ params: { nonce: 'foo' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request',
        error_description: 'missing required parameter(s) redirect_uri',
      });
    }
  });

  [
    'code id_token token',
    'code id_token',
    'id_token token',
    'id_token',
  ].forEach((type) => {
    it(`throws when nonce is missing for response_type=${type}`, async () => {
      const ctx = mock({ params: { response_type: type, redirect_uri: 'foo' } });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'missing required parameter(s) nonce',
        });
      }
    });
  });
});
