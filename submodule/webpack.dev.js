/* eslint-disable */

/**
 * Define common configuration for Webpack
 * @see https://webpack.js.org/guides/production/
 * @type {webpack}
 */

const webpack = require("webpack");
const merge = require("webpack-merge");
const { resolve, join } = require("path");
const debug = require("debug");
const common = require("./webpack.common.js");

const log = debug("max:build");
const host = "0.0.0.0";
const port = 3005;

log("Webpack development mode loaded!");

module.exports = merge.smart(common, {
	mode: "development",
	devtool: "eval-source-map",
	output: {
		path: resolve("dist"),
		filename: "js/search-[name].js",
		chunkFilename: "js/search-[name].js",
		publicPath: `http://${host}:${3005}/`,
		sourceMapFilename: "js/search-[name].js.map",
		pathinfo: true,
		library: "[name]"
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.HashedModuleIdsPlugin(),
		new webpack.NamedModulesPlugin(),
		// new webpack.DllReferencePlugin({
		// 	context: __dirname,
		// 	// name: "[name]_[hash]",
		// 	// name: "[name]-[hash]",
		// 	manifest: join(__dirname, "vendors-dll.json")
		// }),
	],
	profile: true,
	stats: {
		maxModules: Infinity,
		optimizationBailout: true
	},
	devServer: {
		publicPath: "/",
		overlay: {
			warnings: true,
			errors: true
    	},
		inline: true,
		compress: true,
		host,
		port,
		hot: true,
		historyApiFallback: true,
		disableHostCheck: true,
		after() {
			log(`Server ready on port ${port}!`);
		},
		stats: {
			colors: true
		},
		noInfo: true
	}
});
