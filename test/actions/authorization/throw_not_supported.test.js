const mock = require('../../../test/ctx_mock');

const provider = {
  disabled: jest.fn(),
};

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  beforeEach(() => {
    provider.disabled = jest.fn();
  });

  it('always passes to next if no unsupported params were found', async () => {
    const ctx = mock({ params: {} });
    await fn(ctx, () => Promise.resolve());
  });

  it('throws when request is provided but not supported', async () => {
    provider.disabled.mockImplementation((feature) => {
      if (feature === 'request') return true;
      return false;
    });

    const ctx = mock({ params: { request: 'foo' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'request_not_supported',
        error_description: 'request parameter provided but not supported',
      });
    }
  });

  it('throws when request_uri is provided but not supported', async () => {
    provider.disabled.mockImplementation((feature) => {
      if (feature === 'requestUri') return true;
      return false;
    });

    const ctx = mock({ params: { request_uri: 'foo' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'request_uri_not_supported',
        error_description: 'request_uri parameter provided but not supported',
      });
    }
  });

  it('always throws when registration is provided', async () => {
    const ctx = mock({ params: { registration: 'foo' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'registration_not_supported',
        error_description: 'registration parameter provided but not supported',
      });
    }
  });

  it('lets request through', async () => {
    const ctx = mock({ params: { request: 'foo' } });
    await fn(ctx, () => Promise.resolve());
  });

  it('lets request_uri through', async () => {
    const ctx = mock({ params: { request_uri: 'foo' } });
    await fn(ctx, () => Promise.resolve());
  });

  it('throws when both request and request_uri is provided', async () => {
    const ctx = mock({ params: { request_uri: 'foo', request: 'foo' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request',
        error_description: 'request and request_uri parameters MUST NOT be used together',
      });
    }
  });
});
