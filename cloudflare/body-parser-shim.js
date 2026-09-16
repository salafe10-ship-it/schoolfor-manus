// Express reads these exports while it initializes. The application installs
// its own bounded JSON stream parser in server.ts, so the Cloudflare bundle
// must not load body-parser's Node-only iconv-lite dependency.
const passthrough = (...args) => {
  // Support both bodyParser.json(options) factory calls and middleware calls.
  // The application installs its own JSON parser, so the returned middleware
  // only needs to continue the Express chain.
  if (typeof args[2] === 'function') return args[2]();
  return (_request, _response, next) => (typeof next === 'function' ? next() : undefined);
};

module.exports = {
  json: passthrough,
  raw: passthrough,
  text: passthrough,
  urlencoded: passthrough,
};
