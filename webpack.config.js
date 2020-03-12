var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');

var env = process.argv.indexOf('--production') > -1 ? 'production' : 'development';
// var env = process.env.NODE_ENV;
var DEBUG = env !== 'production';
var VERBOSE = process.argv.indexOf('--verbose') > -1;

var AUTOPREFIXER_BROWSERS = [
  'Android 2.3',
  'Android >= 4',
  'Chrome >= 35',
  'Firefox >= 31',
  'Explorer >= 9',
  'iOS >= 7',
  'Opera >= 12',
  'Safari >= 7.1',
];

var GLOBALS = {
  'process.env.NODE_ENV' : '"' + env + '"',
  'process.env.BROWSER' : true
};

// Webpack plugins
var plugins = [
  new webpack.DefinePlugin(GLOBALS),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.NoErrorsPlugin()
];
if (!DEBUG) {
  plugins.push(
    new webpack.optimize.DedupePlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     screw_ie8: true,
    //     warnings: VERBOSE,
    //   },
    // }),
    new webpack.optimize.AggressiveMergingPlugin()
  )
}

module.exports = {
  entry: {
    info: './src/info.js',
    usage: './src/usage.js',
    queues: './src/queues.js',
    keys: './src/keys.js',
    admin: './src/admin.js',
    data: './src/data.js',
    predicted_data: './src/predicted_data.js',
    predicted_triage: './src/predicted_triage.js',
    user_data: './src/user_data.js',
    annoUI: './src/annoUI.js',
    synthetic: './src/synthetic.js',
  },

  resolve: {
    root: __dirname,
    extensions: ['', '.js', '.jsx', '.json']
  },

  output: {
    path: "./static/build/",
    publicPath: "/static/build/",
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, './src'),
        ],
        exclude: /node_modules/,
        query: {
          cacheDirectory: DEBUG,
          babelrc: false,
          plugins : [ 'transform-runtime', 'transform-decorators-legacy' ],
          presets: ['es2015', 'stage-0', 'react']
        }
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.css$/,
        loaders: [
          'style-loader',
          'css-loader?' + JSON.stringify({ sourceMap: DEBUG, minimize: !DEBUG }),
          'postcss-loader?pack=default',
        ]
      },
      {
        test: /\.scss$/,
        loaders: [
          'style-loader',
          'css-loader?' + JSON.stringify({ sourceMap: DEBUG, minimize: !DEBUG }),
          'postcss-loader?pack=sass',
          'sass-loader' + (DEBUG ? '?sourceMap' : ''),
        ]
      },
    ]
  },

  postcss: function (bundler) {
    return {
      default: [
        require('postcss-import')({addDependencyTo: bundler}),
        autoprefixer({browsers: AUTOPREFIXER_BROWSERS})
      ],
      sass: [
        autoprefixer({browsers: AUTOPREFIXER_BROWSERS}),
      ]
    };
  },

  devtool: DEBUG ? 'cheap-module-eval-source-map' : false,

  cache: DEBUG,
  debug: DEBUG,

  plugins: plugins,

  watchOptions: {
    poll: true
  }
};

