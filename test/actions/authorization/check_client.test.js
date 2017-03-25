const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = { Client: { find: jest.fn((id) => {
  if (id === 'foobar') return { id };
  return undefined;
}) } };
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  it('asserts client id is provided in params', async () => {
    const ctx = mock({ params: { client_id: '' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        status: 400,
        message: 'invalid_request',
        error_description: 'missing required parameter client_id',
      });
    }
  });

  describe('Client.find', () => {
    beforeEach(provider.Client.find.mockClear);
    it('looks for a Client', async () => {
      const ctx = mock({ params: { client_id: 'foo' } });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(provider.Client.find).toHaveBeenCalledWith('foo');
      }
    });

    it('stringifies the client_id', async () => {
      const ctx = mock({ params: { client_id: 123 } });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(provider.Client.find).toHaveBeenCalledWith('123');
      }
    });

    it('assigns the client to ctx', async () => {
      const ctx = mock({ params: { client_id: 'foobar' } });
      await fn(ctx, () => Promise.resolve());
      expect(ctx.oidc.client).toBeDefined();
    });
  });

  it('asserts the found Client', async () => {
    const ctx = mock({ params: { client_id: 'foo' } });
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
