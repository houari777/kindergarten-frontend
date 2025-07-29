const webpack = require('webpack');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        os: require.resolve('os-browserify/browser'),
        url: require.resolve('url/'),
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
        path: require.resolve('path-browserify')
      };

      // Add plugins for global variables
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        })
      );

      // Fix for fs module
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'fs': false
      };

      return webpackConfig;
    }
  }
};
