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
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser.js')
      };

      // Initialize plugins array if it doesn't exist
      webpackConfig.plugins = webpackConfig.plugins || [];
      
      // Add DefinePlugin to define process.env.NODE_ENV
      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        })
      );

      // Add ProvidePlugin for process and Buffer
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer']
        })
      );

      // Fix for fs module and Firebase
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'fs': false,
        'process': 'process/browser.js',
        '@firebase/app': require.resolve('@firebase/app'),
        '@firebase/firestore': require.resolve('@firebase/firestore'),
        '@firebase/storage': require.resolve('@firebase/storage'),
        '@firebase/auth': require.resolve('@firebase/auth')
      };

      return webpackConfig;
    }
  }
};