const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  entry: ["@babel/polyfill", path.join(__dirname, './src/index.tsx')],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components|lib)/,
        loader: 'ts-loader',
      },
      {
        test: /\.js?$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components|lib)/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader"
        ]
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'

  },
  externals: {
    'react': 'commonjs react'
  }
};