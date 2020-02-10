/* eslint-disable */

const webpack = require("webpack");
const CompressionPlugin = require("compression-webpack-plugin");
const { join, resolve } = require("path");
const debug = require("debug");

const log = debug("max:build");

log("Building vendors with __dirname=", __dirname);

module.exports = {
	mode: "production",
	entry: {
		vendors: [
			"react",
			"react-dom",
			"react-router",
			"react-router-dom",
			"redux",
			"redux-thunk",
			"axios",
			"credit-card-type",
			"event-pubsub",
			"formik",
			"js-cookie",
			"jwt-decode",
			"numeral",
			"pubsub-js",
			"ramda",
			"whatwg-fetch"
		]
	},

	output: {
		filename: "js/search-[name].[[hash]].js",
		path: resolve(__dirname, "dist"),
		pathinfo: true,
		library: "[name]_[hash]"
	},
	plugins: [
		new webpack.DllPlugin({
			// context: resolve(__dirname, "src"),
			context: __dirname,
			name: "[name]-[hash]",
			path: join(__dirname, "[name]-dll.json")
		}),
		new CompressionPlugin({
			cache: true,
			filename: "[path].gz[query]",
			test: /\.(js|css|html|svg)$/,
			threshold: 10240,
			minRatio: 0.8
		})
	]
};
