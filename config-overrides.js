module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...config.resolve.fallback,
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    https: require.resolve('https-browserify'),
    http: require.resolve('stream-http'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url/'),
    assert: require.resolve('assert/'),
    util: require.resolve('util/'),
    zlib: require.resolve('browserify-zlib'),
  };
  return config;
}; 