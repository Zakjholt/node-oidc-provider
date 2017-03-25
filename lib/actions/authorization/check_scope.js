'use strict';

const _ = require('lodash');
const errors = require('../../helpers/errors');

/*
 * Validates that all requested scopes are supported by the provider, that openid is amongst them
 * and that offline_access prompt is requested together with consent scope
 *
 * @throws: invalid_request
 */
module.exports = provider => function checkScope(ctx, next) {
  ctx.oidc.params.scope = String(ctx.oidc.params.scope);

  const scopes = _.intersection(ctx.oidc.params.scope.split(' '), provider.get('scopes'));
  const responseType = ctx.oidc.params.response_type;

  ctx.assert(scopes.indexOf('openid') !== -1,
    new errors.InvalidRequestError('openid is required scope'));

  /*
   * Upon receipt of a scope parameter containing the offline_access value, the Authorization Server
   *
   * MUST ensure that the prompt parameter contains consent
   * MUST ignore the offline_access request unless the Client is using a response_type value that
   *  would result in an Authorization Code being returned,
   */

  if (scopes.indexOf('offline_access') !== -1) {
    if (!responseType.includes('code') || !String(ctx.oidc.params.prompt).includes('consent')) {
      _.pull(scopes, 'offline_access');
    }
  }

  ctx.oidc.params.scope = scopes.join(' ');

  return next();
};
