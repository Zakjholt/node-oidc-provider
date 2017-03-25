const mock = require('../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = { Client: { find: jest.fn((id) => {
  if (id === 'foo') return { id };
  return undefined;
}) } };
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  describe('Client.find', () => {
    beforeEach(provider.Client.find.mockClear);
    it('looks for a Client', async () => {
      const ctx = mock({ authorization: { clientId: 'bar' } });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(provider.Client.find).toHaveBeenCalledWith('bar');
      }
    });

    it('assigns the client to ctx', async () => {
      const ctx = mock({ authorization: { clientId: 'foo' } });
      await fn(ctx, () => Promise.resolve());
      expect(ctx.oidc.client).toBeDefined();
    });
  });

  it('asserts the found Client', async () => {
    const ctx = mock({ authorization: { clientId: 'bar' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        status: 400,
        message: 'invalid_client',
      });
    }
  });
});
