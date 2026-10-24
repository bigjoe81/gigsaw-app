const target = process.env.API_PROXY_TARGET || 'https://gigsaw.test';

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

const proxyOptions = {
  target,
  secure: false,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyRes', rewriteDevelopmentCookies);
  },
};

module.exports = {
  '/api': { ...proxyOptions },
  '/sanctum': { ...proxyOptions },
  '/auth': { ...proxyOptions },
};
