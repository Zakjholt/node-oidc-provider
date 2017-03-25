const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

describe(fn.name, () => {
  it('sets the params redirect_uri to the only one registered', async () => {
    const ctx = {
      oidc: {
        params: {},
        client: { redirectUris: ['https://rp.example.com/cb'] },
      },
    };
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.redirect_uri).toBe(ctx.oidc.client.redirectUris[0]);
  });

  it('passes to next if redirect_uri is provided', async () => {
    const ctx = { oidc: { params: { redirect_uri: 'https://rp.example.com/cb' } } };
    await fn(ctx, () => Promise.resolve());
  });

  it('passes to next if client has more redirect_uris registered', async () => {
    const ctx = {
      oidc: {
        params: { redirect_uri: 'https://rp.example.com/cb' },
        client: { redirectUris: [undefined, undefined] },
      },
    };
    await fn(ctx, () => Promise.resolve());
  });
});
