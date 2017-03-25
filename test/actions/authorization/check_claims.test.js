const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = { enabled: jest.fn() };
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  it('passes to next', async () => {
    const ctx = mock({ params: {}, client: {} });
    await fn(ctx, () => Promise.resolve());
  });

  describe('when features.claimsParameter is enabled', () => {
    beforeEach(() => provider.enabled.mockImplementationOnce(() => true));
    afterEach(provider.enabled.mockClear);

    it('handles JSON parse errors', async () => {
      const ctx = mock({ params: { claims: 'undefined' }, client: {} });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'could not parse the claims parameter JSON',
        });
      }
    });

    it('asserts response_type is not none', async () => {
      const ctx = mock({ params: { claims: 'foo', response_type: 'none' }, client: {} });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'claims parameter should not be combined with response_type none',
        });
      }
    });

    it('asserts claims is a JSON object', async () => {
      const ctx = mock({ params: { claims: JSON.stringify(true) }, client: {} });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'claims parameter should be a JSON object',
        });
      }
    });

    it('asserts claims has one of userinfo or id_token', async () => {
      const ctx = mock({ params: { claims: JSON.stringify({ foo: 'bar' }) }, client: {} });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'claims parameter should have userinfo or id_token properties',
        });
      }
    });

    it('asserts claims userinfo is a plain object', async () => {
      const ctx = mock({
        params: { claims: JSON.stringify({ userinfo: true }) },
        client: {},
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'claims.userinfo should be an object',
        });
      }
    });

    it('asserts claims id_token is a plain object', async () => {
      const ctx = mock({
        params: { claims: JSON.stringify({ id_token: true }) },
        client: {},
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'claims.id_token should be an object',
        });
      }
    });

    it('asserts claims userinfo is not used when no userinfo access is being requested', async () => {
      const ctx = mock({
        params: { claims: JSON.stringify({ userinfo: {} }), response_type: 'id_token' },
        client: {},
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: 'claims.userinfo should not be used if access_token is not issued',
        });
      }
    });

    it('assigns parsed JSON claims to oidc context', async () => {
      const ctx = mock({
        params: { claims: JSON.stringify({ userinfo: { foo: 'bar' } }) },
        client: {},
      });
      await fn(ctx, () => Promise.resolve());
      expect(ctx.oidc.claims).toEqual({ userinfo: { foo: 'bar' } });
    });

    it('assigns pre-parsed request object claims to oidc context', async () => {
      const ctx = mock({
        params: { claims: { userinfo: { foo: 'bar' } } },
        client: {},
      });
      await fn(ctx, () => Promise.resolve());
      expect(ctx.oidc.claims).toEqual({ userinfo: { foo: 'bar' } });
    });
  });

  it('claims must be enabled to do claims param validation', async () => {
    const ctx = mock({ params: { claims: 'foobar' }, client: {} });
    await fn(ctx, () => Promise.resolve());
  });

  it('pushes auth_time as essential when max_age is requested', async () => {
    const ctx = mock({ params: { max_age: 60 }, client: {} });
    await fn(ctx, () => Promise.resolve());
    expect(ctx).toHaveProperty('oidc.claims.id_token.auth_time.essential', true);
  });

  it('pushes auth_time as essential when clients require auth_time', async () => {
    const ctx = mock({ params: {}, client: { requireAuthTime: true } });
    await fn(ctx, () => Promise.resolve());
    expect(ctx).toHaveProperty('oidc.claims.id_token.auth_time.essential', true);
  });

  it('pushes param acr_values to claims', async () => {
    const ctx = mock({ params: { acr_values: '1 2 3' }, client: {} });
    await fn(ctx, () => Promise.resolve());
    expect(ctx).toHaveProperty('oidc.claims.id_token.acr.values', ['1', '2', '3']);
  });
});
