const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: "./bootstrap.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "bootstrap.js",
  },
  devServer: {
    open: true,
    host: "localhost",
    static: {
      directory: path.join(__dirname, 'dist'),
    },
  },
  mode: "development",
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        'index.html', 
        { from: 'css/style.css'}
      ],
    })
  ],
  experiments: {
    asyncWebAssembly: true, // 非同期Wasmサポートを有効化
  },
};
