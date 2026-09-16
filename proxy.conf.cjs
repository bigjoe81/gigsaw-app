const target = 'http://127.0.0.1:8000';

const rewriteDevelopmentCookies = (proxyRes) => {
  const cookies = proxyRes.headers['set-cookie'];
  if (!Array.isArray(cookies)) return;

  proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
    cookie
      .replace(/;\s*Domain=[^;]*/i, '')
      .replace(/;\s*Secure/gi, '')
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
  );
};

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
    onProxyRes: rewriteDevelopmentCookies,
  },
  '/sanctum': {
    target,
    secure: false,
    changeOrigin: true,
    onProxyRes: rewriteDevelopmentCookies,
  },
  '/auth': {
    target,
    secure: false,
    changeOrigin: true,
    onProxyRes: rewriteDevelopmentCookies,
  },
};
