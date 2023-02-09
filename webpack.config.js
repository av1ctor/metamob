const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {transform} = require('@formatjs/ts-transformer');
const Dotenv = require('dotenv-webpack');

//const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
//const smp = new SpeedMeasurePlugin();

function initCanisterEnv() {
  let localCanisters, prodCanisters;
  try {
    localCanisters = require(path.resolve(
      ".dfx",
      "local",
      "canister_ids.json"
    ));
  } catch (error) {
    console.log("No local canister_ids.json found. Continuing production");
  }
  try {
    prodCanisters = require(path.resolve("canister_ids.json"));
  } catch (error) {
    console.log("No production canister_ids.json found. Continuing with local");
  }

  const network =
    process.env.DFX_NETWORK ||
    (process.env.NODE_ENV === "production" ? "ic" : "local");

  const canisterConfig = network === "local" ? localCanisters : prodCanisters;

  return Object.entries(canisterConfig).reduce((prev, current) => {
    const [canisterName, canisterDetails] = current;
    prev[canisterName.toUpperCase() + "_CANISTER_ID"] =
      canisterDetails[network];
    return prev;
  }, {});
}
const canisterEnvVariables = initCanisterEnv();

const isDevelopment = process.env.NODE_ENV !== "production";

const frontendDirectory = "site";

const asset_entry = path.join("src", frontendDirectory, "src", "index.html");

module.exports = /*smp.wrap(*/{
  target: "web",
  mode: isDevelopment ? "development" : "production",
  entry: {
    // The frontend.entrypoint points to the HTML file for this build, so we need
    // to replace the extension to `.js`.
    index: path.join(__dirname, asset_entry).replace(/\.html$/, ".jsx"),
  },
  devtool: isDevelopment ? "source-map" : false,
  optimization: {
    minimize: !isDevelopment,
    minimizer: [new TerserPlugin()],
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx"],
    fallback: {
      assert: require.resolve("assert/"),
      buffer: require.resolve("buffer/"),
      events: require.resolve("events/"),
      stream: require.resolve("stream-browserify/"),
      util: require.resolve("util/"),
    },
  },
  output: {
    filename: "index.js",
    path: path.join(__dirname, "dist", frontendDirectory),
  },
  module: {
    rules: [
      { test: /\.(js|ts)x?$/, 
        loader: "ts-loader",
        options: {
          getCustomTransformers() {
            return {
              before: [
                transform({
                  overrideIdFn: '[sha512:contenthash:base64:6]',
                }),
              ],
            }
          },
        },
        exclude: '/node_modules/', 
      },
      { test: /\.css$/, use: ['style-loader','css-loader'] },
      { test: /\.s[ac]ss$/i, use: [
        MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              // options...
            }
          }
      ] }
    ]
  },  
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new Dotenv(),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, asset_entry),
      cache: false,
    })
    ,
    new MiniCssExtractPlugin({
      filename: "src/site/assets/mystyles.css"
    }),
    process.env.NODE_ENV !== "production"? 
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, "src", frontendDirectory, "assets"),
            to: path.join(__dirname, "dist", frontendDirectory),
          },
        ],
      })
    :
      () => undefined,
    new webpack.EnvironmentPlugin({
      NODE_ENV: "development",
      ...canisterEnvVariables,
    }),
    new webpack.ProvidePlugin({
      Buffer: [require.resolve("buffer/"), "Buffer"],
      process: require.resolve("process/browser"),
    })
  ],
  // proxy /api to port 8000 during development
  devServer: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
        pathRewrite: {
          "^/api": "/api",
        },
      },
    },
    hot: true,
    watchFiles: [path.resolve(__dirname, "src", frontendDirectory)],
    liveReload: true,
  },
}/*)*/;
