System.config({
  baseUrl: './',
  defaultJSExtensions: false,
  transpiler: 'plugin-babel',
  externals: [],
  map: {
    'opendatalayer': './node_modules/opendatalayer/index.es6.js',
    'plugin-babel': './node_modules/systemjs-plugin-babel/plugin-babel.js',
    'systemjs-babel-build': './node_modules/systemjs-plugin-babel/systemjs-babel-browser.js',
  },
  packages: {
    src: {
      defaultExtension: 'js',
    },
    node_modules: {
      defaultExtension: 'js',
    },
  },
  warnings: true,
});
