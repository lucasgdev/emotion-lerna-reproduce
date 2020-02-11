/* eslint-disable  */

/**
 * Define common configuration for Webpack
 * @see https://webpack.js.org/guides/production/
 * @type {webpack}
 */

const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { join, resolve } = require("path");

require("dotenv").config({ path: resolve("../.env") });

const srcFolder = resolve(__dirname, "src");

module.exports = {
	// context: srcFolder,
	entry: ["whatwg-fetch", srcFolder],
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /node_modules/,
					name: "vendor",
					chunks: "initial",
					minSize: 1,
					enforce: true
				}
			}
		}
	},
	plugins: [
		new webpack.optimize.ModuleConcatenationPlugin(),
		new webpack.DefinePlugin({
			"process.env": {
				VERSION: "staging"
			}
		}),
		new webpack.EnvironmentPlugin([
			"NODE_ENV",
			"IS_DEVSTACK"
		]),
		new HtmlWebpackPlugin({
			title: "Title",
			template: resolve(__dirname, "src", "index.tpl.html"),
			chunksSortMode: "dependency"
		})
	],
	resolve: {
		extensions: [".js", ".jsx"]
	},
	module: {
		rules: [
			{
				enforce: "pre",
				test: /\.jsx?$/,
				include: [srcFolder],
				use: { loader: "eslint-loader" }
			},
			{
				test: /\.jsx?$/,
				include: [srcFolder],
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					query: {
						cacheDirectory: true, // important for performance
						// babelrcRoots: ["../", "."]
					}
				}
			},
			{
				test: /\.(eot|woff|woff2|ttf|svg)$/,
				include: [join(srcFolder, "assets/fonts")],
				use: {
					loader: "file-loader",
					query: {
						limit: 30000,
						name: "[name].[[contenthash]].[ext]",
						outputPath: "fonts/"
					}
				}
			},
			{
				test: /\.(gif|png|jpe?g|svg)$/i,
				include: [join(srcFolder, "assets/images")],
				loaders: [
					{
						loader: "file-loader",
						query: { outputPath: "images/" }
					}
				]
			},
			{
				test: /\.css$/,
				use: [
					"style-loader",
					{ loader: "css-loader", options: { importLoaders: 1 } },
					"postcss-loader"
				]
			},
			{
				test: /\.scss$/,
				use: [
					{ loader: "style-loader" },
					{ loader: "css-loader?sourceMap" },
					{ loader: "sass-loader?sourceMap=map" }
				]
			}
		]
	},
	node: {
		fs: "empty",
		child_process: "empty"
	}
};
