const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

describe(fn.name, () => {
  it('passes to next when redirect_uri is allowed', async () => {
    const uri = 'https://rp.example.com/cb';
    const ctx = mock({
      client: { redirectUriAllowed: jest.fn(() => true) },
      params: { redirect_uri: uri },
    });
    await fn(ctx, () => Promise.resolve());
  });

  it('assigns redirectUriCheckPerformed to ctx for later', async () => {
    const ctx = mock();
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {}
    expect(ctx.oidc.redirectUriCheckPerformed).toBe(true);
  });

  it('calls redirectUriAllowed on the ctx client', async () => {
    const uri = 'https://rp.example.com/cb';
    const ctx = mock({
      client: { redirectUriAllowed: jest.fn() },
      params: { redirect_uri: uri },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {}
    expect(ctx.oidc.client.redirectUriAllowed).toHaveBeenCalledWith(uri);
  });

  it('asserts the redirect_uri is allowed', async () => {
    const uri = 'https://rp.example.com/cb';
    const ctx = mock({
      client: { redirectUriAllowed: jest.fn() },
      params: { redirect_uri: uri },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        status: 400,
        message: 'redirect_uri_mismatch',
      });
    }
  });
});
