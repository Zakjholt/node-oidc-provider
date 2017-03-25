const mock = require('../../../test/ctx_mock');

jest.mock('../../../lib/helpers/jwt', () => class MockJWT {
  static decode(jwt) {
    switch (jwt) {
      case 'parse error':
        throw new Error('parse error');
      case 'nested uri':
        return { payload: { request_uri: 'foo' } };
      case 'nested':
        return { payload: { request: 'foo' } };
      case 'rt code':
        return { payload: { response_type: 'code' } };
      case 'cid bar':
        return { payload: { client_id: 'bar' } };
      case 'unsupp op alg':
        return { header: { alg: 'unsupported' }, payload: {} };
      case 'std signed':
        return { header: { alg: 'RS256' }, payload: {} };
      default: {
        return { header: { alg: 'none' }, payload: { prompt: 'none' } };
      }
    }
  }

  static header(jwt) {
    switch (jwt) {
      case 'enc.alg.unsupported..':
        return { alg: 'unsupported' };
      case 'enc.enc.unsupported..':
        return { alg: 'RSA1_5', enc: 'unsupported' };
      default: {
        return { alg: 'RSA1_5', enc: 'A128CBC-HS256' };
      }
    }
  }

  static decrypt(jwt) {
    if (jwt.startsWith('err')) {
      throw new Error('decrypt error');
    } else {
      return { payload: new Buffer('foobar') };
    }
  }

  static verify() {
    throw new Error('sig error');
  }
});

const provider = {
  enabled: jest.fn(() => true),
  get: jest.fn((setting) => {
    switch (setting) {
      case 'requestObjectSigningAlgValues':
        return ['none', 'RS256'];
      case 'requestObjectEncryptionAlgValues':
        return ['RSA1_5'];
      case 'requestObjectEncryptionEncValues':
        return ['A128CBC-HS256'];
      default:
        return undefined;
    }
  }),
};

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  it('just yields when no request param is present', async () => {
    const ctx = mock({ params: {} });
    await fn(ctx, () => Promise.resolve());
  });

  it('assigns the payload to params and unassigns request', async () => {
    const ctx = mock({
      client: {},
      params: { request: 'std', prompt: 'login' },
    });
    await fn(ctx, () => Promise.resolve());
    expect(ctx).toHaveProperty('oidc.params.request', undefined);
    expect(ctx).toHaveProperty('oidc.params.prompt', 'none');
  });

  it('verifies signature', async () => {
    const ctx = mock({
      client: {},
      params: { request: 'std signed' },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'could not validate request object signature (sig error)',
      });
    }
  });

  it('handles encrypted requests', async () => {
    const ctx = mock({
      client: {},
      params: { request: 'enc.ry.pt.e.d', prompt: 'login' },
    });
    await fn(ctx, () => Promise.resolve());
    expect(ctx).toHaveProperty('oidc.params.request', undefined);
    expect(ctx).toHaveProperty('oidc.params.prompt', 'none');
  });

  it('handles decrypt errors', async () => {
    const ctx = mock({
      params: { request: 'err.ry.pt.e.d' },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'could not decrypt request object (decrypt error)',
      });
    }
  });

  it('verifies enc alg is supported', async () => {
    const ctx = mock({
      params: { request: 'enc.alg.unsupported..' },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'could not decrypt request object (unsupported encrypted request alg)',
      });
    }
  });

  it('verifies enc enc is supported', async () => {
    const ctx = mock({
      params: { request: 'enc.enc.unsupported..' },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'could not decrypt request object (unsupported encrypted request enc)',
      });
    }
  });

  it('does not allow response_type to differ', async () => {
    const ctx = mock({
      params: { response_type: 'id_token', request: 'rt code' },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'request response_type must equal the one in request parameters',
      });
    }
  });

  it('does not allow client_id to differ', async () => {
    const ctx = mock({
      params: { client_id: 'foo', request: 'cid bar' },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'request client_id must equal the one in request parameters',
      });
    }
  });

  it('handles JWT decode errors', async () => {
    const ctx = mock({ params: { request: 'parse error' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'could not parse request object as valid JWT (parse error)',
      });
    }
  });

  it('verifies alg is supported by theprovider', async () => {
    const ctx = mock({ client: {}, params: { request: 'unsupp op alg' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'unsupported signed request alg',
      });
    }
  });

  it('verifies client preregistered algs are used', async () => {
    const ctx = mock({
      client: { requestObjectSigningAlg: 'RS256' },
      params: { request: 'std' },
    });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'the preregistered alg must be used in request or request_uri',
      });
    }
  });

  it('does not allow request inception', async () => {
    const ctx = mock({ params: { request: 'nested' } });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'request object must not contain request or request_uri properties',
      });
    }

    ctx.oidc.params.request = 'nested uri';
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request_object',
        error_description: 'request object must not contain request or request_uri properties',
      });
    }
  });
});
