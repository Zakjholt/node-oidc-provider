const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file)();

jest.mock('../../../lib/helpers/request_uri_cache', () => class MockCache {
  resolve(uri) { // eslint-disable-line
    if (uri.includes('reject')) {
      return Promise.reject(new Error('encountered error'));
    }
    return '<request>';
  }
});

describe(fn.name, () => {
  it('does not do anything when no request_uri was provided', async () => {
    const ctx = { oidc: { params: { request_uri: undefined } } };
    await fn(ctx, () => Promise.resolve());
  });

  it('asserts request_uri length', async () => {
    const ctx = mock({ params: { request_uri: `https://${'1'.repeat(512)}` } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_uri',
        error_description: 'the request_uri MUST NOT exceed 512 characters',
      });
    }
  });

  it('asserts request_uri protocol', async () => {
    const ctx = mock({ params: { request_uri: 'http://rp.example.com/request#123' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_uri',
        error_description: 'request_uri must use https scheme',
      });
    }
  });

  describe('client with pre-registered request_uris', () => {
    it('asserts request_uri being pre-registered', async () => {
      const ctx = mock({
        params: { request_uri: 'https://rp.example.com/another/request#123' },
        client: {
          requestUris: ['https://rp.example.com/request'],
          requestUriAllowed: jest.fn(() => false),
        },
      });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request_uri',
          error_description: 'not registered request_uri provided',
        });
      }
    });
  });

  it('catches all errors and rethrows them from RequestUriCache', async () => {
    const ctx = mock({
      params: { request_uri: 'https://rp.example.com/reject/request#123' },
      client: {},
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_uri',
        error_description: 'could not load or parse request_uri (encountered error)',
      });
    }
  });

  it('removes the request_uri param and assigns request with the result', async () => {
    const ctx = mock({
      params: { request_uri: 'https://rp.example.com/request#123' },
      client: {},
    });
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.request_uri).toBeUndefined();
    expect(ctx.oidc.params.request).toBe('<request>');
  });
});
