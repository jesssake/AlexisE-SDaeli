// C:\Codigos\HTml\AlexisE-SDaeli-main\AlexisE-SDaeli-main\frontend\proxy.conf.js
const PROXY_CONFIG = {
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
};

module.exports = PROXY_CONFIG;