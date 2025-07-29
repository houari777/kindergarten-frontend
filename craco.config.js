const { when, whenDev, whenProd, whenTest, ESLINT_MODES, POSTCSS_MODES } = require('@craco/craco');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const path = require('path');
const { getLoader, loaderByName } = require('@craco/craco');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Add fallbacks for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify'),
        url: require.resolve('url'),
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
      };

      // Fix module resolution
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, 'node_modules'),
        'node_modules'
      ];

      // Ensure proper resolution of core modules
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Core React aliases
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
        // Fix for react-i18next ESM resolution
        'react-i18next': path.resolve(__dirname, 'node_modules/react-i18next/dist/umd/react-i18next.js'),
        // Add aliases for common utilities that might be imported from src
        'lodash': path.resolve(__dirname, 'node_modules/lodash'),
        // Add alias for src directory to handle relative imports
        'src': path.resolve(__dirname, 'src/')
      };

      // Add support for resolving modules from node_modules and src
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'src'),
        'node_modules'
      ];

      // Add support for resolving .jsx and .tsx files
      webpackConfig.resolve.extensions = [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.json'
      ];

      // Add .js extension to resolve ESM modules
      webpackConfig.resolve.extensions = [
        ...webpackConfig.resolve.extensions,
        '.js',
        '.jsx',
        '.ts',
        '.tsx'
      ];

      // Fix for ESM resolution
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      });

      // Remove ModuleScopePlugin which enforces src/ directory restriction
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        plugin => !(plugin instanceof ModuleScopePlugin)
      );

      // Get the babel loader
      const { isFound, match: babelLoader } = getLoader(
        webpackConfig,
        loaderByName('babel-loader')
      );

      if (isFound) {
        // Add node_modules to the include paths for babel-loader
        const include = Array.isArray(babelLoader.include)
          ? babelLoader.include
          : [babelLoader.include];
          
        babelLoader.include = include.concat([
          path.resolve(__dirname, 'node_modules')
        ]);
      }

      // Add a module rule to handle the 'use' import issue
      webpackConfig.module.rules.push({
        test: /\.[jt]sx?$/,
        exclude: /node_modules\/(?!@ant-design)/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              presets: [
                '@babel/preset-react',
                '@babel/preset-env',
                '@babel/preset-typescript',
              ],
              plugins: [
                // Remove any 'use' imports from React
                function removeUseImport() {
                  return {
                    visitor: {
                      ImportDeclaration(path) {
                        if (path.node.source.value === 'react') {
                          path.node.specifiers = path.node.specifiers.filter(
                            specifier => 
                              !(specifier.type === 'ImportSpecifier' && 
                                specifier.imported.name === 'use')
                          );
                          
                          if (path.node.specifiers.length === 0) {
                            path.remove();
                          }
                        }
                      }
                    }
                  };
                }
              ]
            }
          }
        ]
      });

      return webpackConfig;
    },
    plugins: [
      // Add ESLint plugin
      new ESLintPlugin({
        extensions: ['js', 'jsx', 'ts', 'tsx'],
        eslintPath: require.resolve('eslint'),
        failOnError: false,
        failOnWarning: false,
        emitWarning: true,
        emitError: true,
        fix: true,
        cache: true,
      }),
      
      // Add React Refresh plugin in development
      ...whenDev(
        () => [
          new ReactRefreshWebpackPlugin({
            overlay: { sockIntegration: 'whitelist', module: ['react-error-overlay'] },
          }),
        ],
        []
      ),
      
      // Remove the default ESLint plugin that comes with react-scripts
      ...whenProd(
        () => {
          return [{
            apply: (compiler) => {
              compiler.hooks.afterEnvironment.tap('RemoveESLintPlugin', () => {
                const eslintPluginIndex = compiler.options.plugins.findIndex(
                  plugin => plugin.constructor.name === 'ESLintWebpackPlugin'
                );
                if (eslintPluginIndex > -1) {
                  compiler.options.plugins.splice(eslintPluginIndex, 1);
                }
              });
            }
          }];
        },
        []
      ),
    ],
  },
  babel: {
    presets: [
      ['@babel/preset-react', { 
        runtime: 'automatic',
        importSource: 'react'
      }]
    ]
  }
};
