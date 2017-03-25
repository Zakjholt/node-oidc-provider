const mock = require('../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file)(['foo', 'bar']);

describe(fn.name, () => {
  it('uses ctx.query to get the params', async () => {
    const ctx = mock(undefined, {
      url: '/?foo=yes&baz=bar',
    });
    await fn(ctx, () => Promise.resolve());
    expect(ctx.oidc.params).toBeDefined();
    expect(ctx.oidc.params).toHaveProperty('foo', 'yes');
    expect(ctx.oidc.params).toHaveProperty('bar', undefined);
    expect(ctx.oidc.params).not.toHaveProperty('baz');
  });

  describe('when POST', () => {
    it('uses ctx.oidc.body instead of ctx.query', async () => {
      const ctx = mock({
        body: { foo: 'yes', baz: 'bar' },
      }, {
        url: '/?foo=no&bar=no',
        method: 'POST',
      });
      await fn(ctx, () => Promise.resolve());
      expect(ctx.oidc.params).toBeDefined();
      expect(ctx.oidc.params).toHaveProperty('foo', 'yes');
      expect(ctx.oidc.params).toHaveProperty('bar', undefined);
      expect(ctx.oidc.params).not.toHaveProperty('baz');
    });
  });
});
