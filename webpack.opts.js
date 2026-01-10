const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  output: {
    hashFunction: 'sha256',
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
        uglifyOptions: {
          extractComments: true,
          annotations: false,
          toplevel: true,
          v8: true,
          compress: {
            keep_infinity: true,
            passes: 2,
          },
          mangle: {
            toplevel: true,
          },
        },
      }),
    ],
  },
};
