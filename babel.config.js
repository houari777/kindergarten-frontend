// Custom plugin to fix the 'use' import issue
const fixReactUse = require('./babel-plugin-fix-react-use');

module.exports = function(api) {
  api.cache(true);
  
  const presets = [
    ['@babel/preset-env', {
      targets: '> 0.25%, not dead',
      useBuiltIns: 'entry',
      corejs: 3
    }],
    ['@babel/preset-react', { 
      runtime: 'automatic',
      development: process.env.NODE_ENV === 'development'
    }],
    '@babel/preset-typescript'
  ];

  const plugins = [
    ['@babel/plugin-transform-runtime', {
      corejs: 3,
      version: '^7.22.15',
      helpers: true,
      regenerator: true,
      useESModules: false,
      absoluteRuntime: false
    }],
    fixReactUse,
    ['module-resolver', {
      root: ['./src'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '^@/(.+)': './src/\\1',
        'react': './node_modules/react',
        'react-dom': './node_modules/react-dom'
      }
    }]
  ];
  
  return {
    presets,
    plugins
  };
};

module.exports = {
  presets: ['@babel/preset-react'],
  plugins: [
    ['module-resolver', {
      root: ['./src'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '^@/(.+)': './src/\\1',
        'react': './node_modules/react',
        'react-dom': './node_modules/react-dom'
      }
    }]
  ]
};
