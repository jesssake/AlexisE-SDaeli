module.exports = {
  "/api": {
    target: "http://localhost/gestion_e",
    secure: false,
    changeOrigin: true,
    logLevel: "debug",
    pathRewrite: { "^/api": "" }
  }
};
