'use strict';

function responseTypeAllowed(client, type) {
  return client.responseTypes.indexOf(type) !== -1;
}

/*
 * Validates requested response_type is supported by the provided and whitelisted in the client
 * configuration
 *
 * @throws: unsupported_response_type
 * @throws: restricted_response_type
 */
module.exports = provider => function checkResponseType(ctx, next) {
  const params = ctx.oidc.params;
  const supported = provider.get('responseTypes');

  const valid = supported.indexOf(params.response_type) !== -1;
  ctx.assert(valid, 400, 'unsupported_response_type', {
    error_description: `response_type not supported. (${params.response_type})`,
  });

  ctx.assert(responseTypeAllowed(ctx.oidc.client, params.response_type),
    400, 'restricted_response_type', {
      error_description: 'response_type not allowed for this client',
    });

  return next();
};
