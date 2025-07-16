const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // En développement uniquement, proxy les requêtes API vers le backend local
  if (process.env.NODE_ENV === 'development') {
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'https://throwback-backend.onrender.com ',
        changeOrigin: true,
      })
    );
  }
};