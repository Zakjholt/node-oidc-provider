const Koa = require('koa');
const { createMocks } = require('node-mocks-http');

function mock(oidc = {}, reqOptions) {
  const app = new Koa();
  const { req, res } = createMocks(reqOptions);
  req.socket = {};
  res._headerNames = {};
  return Object.assign(app.createContext(req, res), { oidc });
}

module.exports = mock;
