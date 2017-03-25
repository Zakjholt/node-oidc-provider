'use strict';

const _ = require('lodash');
const errors = require('../../helpers/errors');

/*
 * Checks that all requested prompts are supported and validates prompt none is not combined with
 * other prompts
 *
 * @throws: invalid_request
 */
module.exports = provider => function checkPrompt(ctx, next) {
  if (ctx.oidc.params.prompt !== undefined) {
    const prompts = String(ctx.oidc.params.prompt).split(' ');
    const unsupported = _.difference(prompts, provider.get('prompts'));

    ctx.assert(_.isEmpty(unsupported), new errors.InvalidRequestError(
      `invalid prompt value(s) provided. (${unsupported.join(',')})`));

    ctx.assert(prompts.indexOf('none') === -1 || prompts.length === 1,
      new errors.InvalidRequestError('prompt none must only be used alone'));
  }

  return next();
};
