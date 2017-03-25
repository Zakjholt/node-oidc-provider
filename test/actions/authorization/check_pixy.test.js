const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = { get: jest.fn() };
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  beforeEach(provider.get.mockClear);

  it('passes to next when disabled', async () => {
    const ctx = mock({ params: {} });
    await fn(ctx, () => Promise.resolve());
  });

  describe('when enabled', () => {
    beforeEach(() =>
      provider.get.mockImplementation(() => true));

    it('passes to next', async () => {
      const ctx = mock({ params: {} });
      await fn(ctx, () => Promise.resolve());
    });

    it('asserts a provided code_challenge_method is supported', async () => {
      const ctx = mock({ params: { code_challenge_method: 'foobar' } });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'not supported value of code_challenge_method',
        });
      }
    });

    it('asserts a code_challenge is provided when code_challenge_method is', async () => {
      const ctx = mock({ params: { code_challenge_method: 'S256' } });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'code_challenge must be provided with code_challenge_method',
        });
      }
    });

    it('defaults code_challenge_method to plain', async () => {
      const ctx = mock({ params: { code_challenge: 'foo', code_challenge_method: 'S256' } });
      await fn(ctx, () => Promise.resolve());
      expect(ctx).toHaveProperty('oidc.params.code_challenge_method', 'S256');

      delete ctx.oidc.params.code_challenge_method;
      await fn(ctx, () => Promise.resolve());
      expect(ctx).toHaveProperty('oidc.params.code_challenge_method', 'plain');
    });
  });


  describe('forced pkce', () => {
    beforeEach(() =>
      provider.get.mockImplementation(() => Object.create({ forcedForNative: true })));

    it('forces native clients using code/hybrid to use pkce', async () => {
      const ctx = mock({
        params: { response_type: 'code id_token' },
        client: { applicationType: 'native' },
      });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'PKCE must be provided for native clients',
        });
      }

      ctx.oidc.params.code_challenge = 'foo';
      await fn(ctx, () => Promise.resolve());
    });

    it('does not kick in unless response_type includes code', async () => {
      const ctx = mock({
        params: { response_type: 'id_token' },
        client: { applicationType: 'native' },
      });
      await fn(ctx, () => Promise.resolve());
    });

    it('does not kick in unless client\'s application_type is native', async () => {
      const ctx = mock({
        params: { response_type: 'code' },
        client: { applicationType: 'web' },
      });
      await fn(ctx, () => Promise.resolve());
    });
  });
});
