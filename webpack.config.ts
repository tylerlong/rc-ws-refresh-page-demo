/* eslint-disable node/no-unpublished-import */
import {Configuration} from 'webpack';
import dotenv from 'dotenv-override-true';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {DefinePlugin} from 'webpack';

const config: Configuration = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'RingCentral WSG refresh page demo',
    }),
    new DefinePlugin({
      'process.env': JSON.stringify(dotenv.config().parsed),
    }),
  ],
};

export default config;
