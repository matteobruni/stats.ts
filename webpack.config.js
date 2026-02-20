import path from "node:path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename),
  rootPkgPath = path.join(__dirname, "package.json"),
  pkg = await fs.readJson(rootPkgPath),
  version = pkg.version;

const banner = `Author : Matteo Bruni - https://www.matteobruni.it
MIT license: https://opensource.org/licenses/MIT
Demo / Generator : https://particles.matteobruni.it/
GitHub : https://www.github.com/matteobruni/stats.ts
How to use? : Check the GitHub README
v${version}`;

const minBanner = `stats.ts v${version} by Matteo Bruni`;

const getConfig = (entry) => {
  return {
    entry: entry,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      libraryTarget: "umd",
      globalObject: "this",
    },
    resolve: {
      extensions: [".js", ".json"],
    },
    module: {
      rules: [
        {
          // Include ts, tsx, js, and jsx files.
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "babel-loader",
        },
      ],
    },
    plugins: [
      new webpack.BannerPlugin({
        banner,
        exclude: /\.min\.js$/,
      }),
      new webpack.BannerPlugin({
        banner: minBanner,
        include: /\.min\.js$/,
      }),
      new BundleAnalyzerPlugin({
        openAnalyzer: false,
        analyzerMode: "static",
        exclude: /\.min\.js$/,
        reportFilename: "report.html",
      }),
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          include: /\.min\.js$/,
          terserOptions: {
            output: {
              comments: minBanner,
            },
          },
          extractComments: false,
        }),
      ],
    },
  };
};

export default getConfig({
  stats: "./dist/esm/index.js",
  "stats.min": "./dist/esm/index.js",
});
