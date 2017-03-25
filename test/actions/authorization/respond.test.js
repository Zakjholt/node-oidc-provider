const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = {
  emit: jest.fn(),
  enabled: jest.fn(),
  get: jest.fn(),
};
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  afterEach(provider.emit.mockClear);
  afterEach(provider.get.mockClear);
  afterEach(provider.enabled.mockClear);

  it('emits authorization.success', async () => {
    const ctx = mock({ params: {} });
    try {
      await fn(ctx, () => Promise.resolve());
    } catch (err) {}
    expect(provider.emit).toHaveBeenCalledWith('authorization.success', ctx);
  });

  it('calls response type fn', async () => {
    const queryFn = jest.fn();
    provider.get.mockImplementationOnce(() => queryFn);

    const ctx = mock({
      params: { response_mode: 'query', redirect_uri: 'https://rp.example.com/cb' },
    });
    await fn(ctx, () => Promise.resolve({
      foo: 'bar',
    }));
    expect(provider.get).toHaveBeenCalledWith('response_mode query fn');
    expect(queryFn).toHaveBeenCalledWith('https://rp.example.com/cb', {
      foo: 'bar',
    });
  });

  it('out a state if present', async () => {
    const queryFn = jest.fn();
    provider.get.mockImplementationOnce(() => queryFn);

    const ctx = mock({
      params: {
        state: 'foo',
        response_mode: 'query',
      },
    });
    await fn(ctx, () => Promise.resolve({}));
    expect(queryFn).toHaveBeenCalledWith(undefined, {
      state: 'foo',
    });
  });

  describe('sessionManagement', () => {
    beforeEach(() => provider.enabled.mockImplementationOnce(() => true));

    it('sets a client specific session state cookie and outs a session_state', async () => {
      const queryFn = jest.fn();
      provider.get = jest.fn((setting) => {
        switch (setting) {
          case 'cookie name state':
            return 'state';
          case 'response_mode query fn':
            return queryFn;
          default:
            return undefined;
        }
      });
      const ctx = mock({
        params: {
          client_id: 'foo',
          response_mode: 'query',
          redirect_uri: 'https://rp.example.com/cb',
        },
        session: { authTime() { return 123; } },
      });
      await fn(ctx, () => Promise.resolve({}));
      expect(queryFn).toHaveBeenCalledWith('https://rp.example.com/cb', {
        session_state: expect.stringMatching(/^\w+\.\w+$/),
      });
    });
  });
});
