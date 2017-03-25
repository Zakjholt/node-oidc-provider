const mock = require('../../../test/ctx_mock');

const file = __filename.replace('/test/', '/lib/').replace('.test.js', '.js');
const provider = {
  get: jest.fn((setting) => {
    switch (setting) {
      case 'interaction check fn':
        return () => {};
      case 'interaction fn':
        return (ctx, interaction) => {
          throw interaction;
        };
      default:
        return undefined;
    }
  }),
  IdToken: {
    validate: (token) => {
      if (token === 'reject me') {
        return Promise.reject(new Error('token validation error'));
      }

      return Promise.resolve(token);
    },
  },
};
const fn = require.requireActual(file)(provider);

describe(fn.name, () => {
  describe('passes', () => {
    it('when session subject equals the claims one', async () => {
      const ctx = mock({
        params: {},
        subject() {
          return this.session.accountId();
        },
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompted(prompt) { return prompt === 'none'; },
        claims: {
          id_token: { sub: { value: 'foo' } },
        },
        client: {},
      });

      await fn(ctx, () => Promise.resolve());
    });

    it('when single acr is met', async () => {
      const ctx = mock({
        params: {},
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompted(prompt) { return prompt === 'none'; },
        claims: {
          id_token: { acr: { value: 'silver', essential: true } },
        },
        acr: 'silver',
      });

      await fn(ctx, () => Promise.resolve());
    });

    it('when multi acr is met', async () => {
      const ctx = mock({
        params: {},
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompted(prompt) { return prompt === 'none'; },
        claims: {
          id_token: { acr: { values: ['gold', 'silver'], essential: true } },
        },
        acr: 'silver',
      });

      await fn(ctx, () => Promise.resolve());
    });

    it('when custom prompt was met', async () => {
      const ctx = mock({
        params: {},
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompts: ['custom'],
        prompted(prompt) { return prompt === 'none'; },
      });

      await fn(ctx, () => Promise.resolve());
    });

    it('when provided id_token_hint matches session accountId', async () => {
      const ctx = mock({
        params: {
          id_token_hint: {
            payload: { sub: 'foo' },
          },
        },
        subject() {
          return this.session.accountId();
        },
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompted(prompt) { return prompt === 'none'; },
        client: {},
      });

      await fn(ctx, () => Promise.resolve());
    });
  });

  describe('requests interaction', () => {
    it('when session is without an accountId', async () => {
      const ctx = mock({
        session: { accountId() {} },
        prompted() { return true; },
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'no_session',
          error: 'login_required',
        });
      }
    });

    it('when login prompt was requested', async () => {
      const ctx = mock({
        session: { accountId() { return 'foo'; } },
        prompted() { return true; },
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'login_prompt',
          error: 'login_required',
        });
      }
    });

    it('when session is stale', async () => {
      const ctx = mock({
        params: {},
        session: {
          accountId() { return 'foo'; },
          past() { return true; },
        },
        prompted(prompt) { return prompt === 'none'; },
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'max_age',
          error: 'login_required',
        });
      }
    });

    it('when session subject differs from claims one', async () => {
      const ctx = mock({
        params: {},
        subject() {
          return this.session.accountId();
        },
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompted(prompt) { return prompt === 'none'; },
        claims: {
          id_token: { sub: { value: 'bar' } },
        },
        client: {},
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'claims_id_token_sub_value',
          error: 'login_required',
        });
      }
    });

    it('when single acr is not met', async () => {
      const ctx = mock({
        params: {},
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompted(prompt) { return prompt === 'none'; },
        claims: {
          id_token: { acr: { value: 'silver', essential: true } },
        },
        acr: 'bronze',
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'essential_acr',
          error: 'login_required',
        });
      }
    });

    it('when none of multiple acrs is not met', async () => {
      const ctx = mock({
        params: {},
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompted(prompt) { return prompt === 'none'; },
        claims: {
          id_token: { acr: { values: ['gold', 'silver'], essential: true } },
        },
        acr: 'bronze',
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'essential_acrs',
          error: 'login_required',
        });
      }
    });

    it('when consent prompt was requested', async () => {
      const ctx = mock({
        params: {},
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompts: ['consent'],
        prompted(prompt) { return prompt === 'none' || prompt === 'consent'; },
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'consent_prompt',
          error: 'consent_required',
        });
      }
    });

    it('when custom prompt was requested', async () => {
      const ctx = mock({
        params: {},
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompts: ['custom'],
        prompted(prompt) { return prompt === 'none' || prompt === 'custom'; },
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'custom_prompt',
          error: 'interaction_required',
        });
      }
    });

    it('when provided id_token_hint does not match the session accountId', async () => {
      const ctx = mock({
        params: {
          id_token_hint: {
            payload: { sub: 'bar' },
          },
        },
        subject() {
          return this.session.accountId();
        },
        session: {
          accountId() { return 'foo'; },
          past() { return false; },
        },
        prompted(prompt) { return prompt === 'none'; },
        client: {},
      });

      try {
        await fn(ctx, () => Promise.reject());
      } catch (err) {
        expect(err).toMatchObject({
          reason: 'id_token_hint',
          error: 'login_required',
        });
      }
    });
  });

  it('throws InvalidRequestError when id_token_hint validations crap out', async () => {
    const ctx = mock({
      params: {
        id_token_hint: 'reject me',
      },
      subject() {
        return this.session.accountId();
      },
      session: {
        accountId() { return 'foo'; },
        past() { return false; },
      },
      prompted(prompt) { return prompt === 'none'; },
      client: {},
    });

    try {
      await fn(ctx, () => Promise.reject());
    } catch (err) {
      expect(err).toMatchObject({
        message: 'invalid_request',
        error_description: 'could not validate id_token_hint (token validation error)',
      });
    }
  });
});
