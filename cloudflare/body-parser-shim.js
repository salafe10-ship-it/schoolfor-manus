// Express reads these exports while it initializes. The application installs
// its own bounded JSON stream parser in server.ts, so the Cloudflare bundle
// must not load body-parser's Node-only iconv-lite dependency.
const passthrough = (_request, _response, next) => next();

module.exports = {
  json: passthrough,
  raw: passthrough,
  text: passthrough,
  urlencoded: passthrough,
};
