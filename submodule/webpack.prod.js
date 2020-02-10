/* eslint-disable import/no-extraneous-dependencies */

/**
 * Define common configuration for Webpack
 * @see https://webpack.js.org/guides/production/
 * @type {webpack}
 */

const webpack = require("webpack");
const merge = require("webpack-merge");
const CompressionPlugin = require("compression-webpack-plugin");
const { resolve } = require("path");
const debug = require("debug");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const common = require("./webpack.common.js");

const log = debug("max:build");

log("Webpack production mode loaded!");

module.exports = function(env = {}) {
	const isInDevStack = process.env.IS_DEVSTACK === "yes";
	return merge.smart(common, {
		optimization: {
			minimize: true,
			namedModules: true,
			minimizer: [
				new TerserPlugin({
					sourceMap: true,
					terserOptions: {
						ecma: 6,
						warnings: false,
						compress: {
							drop_console: env.staging ? false : true
						},
						ie8: false,
						safari10: false
					}
				})
			]
		},
		mode: "production",
		devtool: "source-map",
		output: {
			path: resolve("dist"),
			filename: `js/search-[name].${isInDevStack ? "" : "[[chunkhash]]."}js`,
			chunkFilename: `js/search-[name].${isInDevStack ? "" : "[[chunkhash]]."}js`,
			publicPath: "./",
			sourceMapFilename: `js/search-[name].${isInDevStack ? "" : "[[chunkhash]]."}js.map`,
			pathinfo: true
		},
		plugins: [
			new webpack.ProvidePlugin({
				Promise: "imports-loader?this=>global!exports-loader?global.Promise!es6-promise",
				fetch: "imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch"
			}),
			new webpack.optimize.OccurrenceOrderPlugin(),
			new webpack.optimize.ModuleConcatenationPlugin(),
			new CompressionPlugin({
				test: /\.(js|css|html|svg)$/,
				filename: "[path].gz[query]",
				threshold: 10240,
				minRatio: 0.8
			}),
			new OptimizeCssAssetsPlugin()
		]
	});
};
