const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = { emit: jest.fn() };
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  it('emits authorization.accepted without resutls', async () => {
    const ctx = { oidc: {} };
    await fn(ctx, () => Promise.resolve());
    expect(provider.emit).toHaveBeenCalledWith('authorization.accepted', ctx);
  });

  it('emits interaction.ended with results', async () => {
    const ctx = { oidc: { result: {} } };
    await fn(ctx, () => Promise.resolve());
    expect(provider.emit).toHaveBeenCalledWith('interaction.ended', ctx);
  });
});
