const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const fn = require.requireActual(file);

const params = {
  response_type: 'foobar',
  client_id: 'foobar',
  scope: 'foobar',
};

describe(fn.name, () => {
  it('passes to next when response_type, client_id and scope are present', async () => {
    const ctx = mock({ params });
    await fn(ctx, () => Promise.resolve());
  });

  Object.keys(params).forEach((param) => {
    it(`throws when ${param} is missing`, async () => {
      const ctx = mock({ params: Object.assign({}, params, { [param]: undefined }) });
      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          message: 'invalid_request',
          error_description: `missing required parameter(s) ${param}`,
        });
      }
    });
  });

  it('provides throws all missing parameters in one sweep', async () => {
    const ctx = mock({ params: {} });
    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request',
        error_description: 'missing required parameter(s) response_type,client_id,scope',
      });
    }
  });
});
