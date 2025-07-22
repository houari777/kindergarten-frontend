const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = {
  webpack: override(
    // Configuration des fallbacks pour les modules Node.js
    (config) => {
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
        path: require.resolve('path-browserify'),
        fs: false, // Désactive le module fs pour le navigateur
      };

      // Désactive le warning de source-map-loader
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        /Failed to parse source map/,
      ];

      return config;
    },
    
    // Alias pour résoudre les problèmes de dépendances
    addWebpackAlias({
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
      'react-router-dom': path.resolve('./node_modules/react-router-dom'),
    })
  )
};