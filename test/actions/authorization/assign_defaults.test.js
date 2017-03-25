const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

describe(fn.name, () => {
  it('sets params.acr_values if client has defaultAcrValues', async () => {
    const ctx = { oidc: { params: {}, client: { defaultAcrValues: ['1', '2', '3'] } } };
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.acr_values).toBe('1 2 3');
  });

  it('sets params.max_age if client has defaultMaxAge', async () => {
    const ctx = { oidc: { params: {}, client: { defaultMaxAge: 300 } } };
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.max_age).toBe(300);
  });

  it('does not set params.acr_values if present in the request', async () => {
    const ctx = { oidc: { params: { acr_values: '2 3' }, client: { defaultAcrValues: ['1', '2', '3'] } } };
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.acr_values).toBe('2 3');
  });

  it('does not set params.max_age if present in the request', async () => {
    const ctx = { oidc: { params: { max_age: 500 }, client: { defaultMaxAge: 300 } } };
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.max_age).toBe(500);
  });

  it('does not set params.acr_values if not present on the client', async () => {
    const ctx = { oidc: { params: {}, client: {} } };
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.acr_values).toBeUndefined();
  });

  it('does not set params.max_age if not present on the client', async () => {
    const ctx = { oidc: { params: {}, client: {} } };
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params.max_age).toBeUndefined();
  });
});
