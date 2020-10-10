const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackExcludeAssetsPlugin = require("html-webpack-exclude-assets-plugin");
const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ebnf = require("ebnf2railroad");

module.exports = {
  entry: "./src/index.js",
  mode: "production",
  entry: {
    "ebnf2railroad-online": "./src/index.js",
    index: "./src/index.css"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css"
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
      templateParameters: {
        version: ebnf.version
      },
      inject: "head",
      excludeChunks: ["ebnf2railroad-online"],
      excludeAssets: [/index.js/]
    }),
    new HtmlWebpackPlugin({
      template: "./src/try-yourself.html",
      filename: "try-yourself.html",
      templateParameters: {
        version: ebnf.version
      },
      inject: "body",
      chunks: ["ebnf2railroad-online"]
    }),
    new HtmlWebpackExcludeAssetsPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"]
      },
      {
        test: /\.txt/,
        use: [{ loader: "raw-loader" }]
      }
    ]
  },
  node: {
    fs: "empty"
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 9000
  }
};
