const path = require('path');
const outputPath = path.resolve(__dirname, 'dist');
module.exports = {
  // entry: './src/index.js',  
  entry: './src/index.ts',
  output: {
    filename: 'game-rxjs.js',
    path: outputPath
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
};