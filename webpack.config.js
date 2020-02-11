const webpack = require("webpack");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const debug = require("debug");
const { join, resolve } = require("path");

const log = debug("max:build");

require("dotenv").config({ path: '.env' });

log("Environments VAR Assets", {
	NODE_ENV: process.env.NODE_ENV,
	IS_DEVSTACK: process.env.IS_DEVSTACK,
});

module.exports = function makeWebpackConfig(env = {}) {
	const S3_PATH = process.env.BUCKET_URL
	const isTest = process.env.NODE_ENV === "test";
	const isProd = process.env.NODE_ENV === "production";
	const isDev = process.env.NODE_ENV === "development"
	const isInDevStack = process.env.IS_DEVSTACK === "yes";

	log("Using bucket", S3_PATH);

	let config = {
		stats: isProd ? "minimal" : true,
		resolve: {
			extensions: [".js", ".jsx"],
		}
	};

	config.entry = {
		reactapp: "./src/js/react-app.js"
	};

	const defineOutput = function(ext, hash = "chunkhash") {
		if (isProd) {
			return isInDevStack ? `${ext}/[name].${ext}` : `${ext}/[name].[[${hash}]].${ext}`;
		}
		return isTest ? `${ext}/[name].${ext}` : `[name].${ext}`;
	};
	config.devtool = isProd ? "source-map" : "eval-source-map";
	log("Webpack config", { isProd, isTest, devtool: config.devtool });
	config.output = {
		path: join(__dirname, "dist"),
		publicPath: S3_PATH,
		sourceMapFilename: `js/[name].${isInDevStack ? "" : "[[chunkhash]]."}js.map`,
		pathinfo: true,
		filename: defineOutput("js")
	};

	config.module = {
		rules: [
			{
				test: /\.jsx?$/,
				use: [
					{
						loader: "babel-loader",
						options: { cacheDirectory: true }
					}
				],
				include: [resolve(__dirname, "src"), resolve(__dirname, "reactTests")],
				exclude: /(node_modules|dist)/
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
				test: /\.(gif|png|jpe?g|svg)$/i,
				exclude: /fonts/,
				use: [{ loader: `file-loader?name=[name].[ext]&outputPath=img/` }]
			},
			{
				test: /\.woff2?$|\.ttf$|.otf$|\.eot$|\.svg$/,
				exclude: [/img/, /images/],
				use: [{ loader: `file-loader?name=[name].[ext]&outputPath=fonts/` }]
			},
			{
				test: /\.html$/,
				use: "raw-loader"
			},
			{
				test: /\.scss$/,
				use:
					isTest || !isProd
						? [
								{ loader: "style-loader" },
								{ loader: "css-loader?sourceMap" },
								{ loader: "sass-loader?sourceMap=map" }
						  ]
						: [
								{
									loader: MiniCssExtractPlugin.loader,
									options: {
										hmr: isDev
									}
								},
								"css-loader",
								"postcss-loader",
								"sass-loader?sourceMap"
						  ]
			}
		]
	};

	config.plugins = [
		new webpack.ProvidePlugin({
			Promise: "imports-loader?this=>global!exports-loader?global.Promise!bluebird"
		}),
		new webpack.EnvironmentPlugin([
			"NODE_ENV"
		])
	];

	if (isProd) {
		config.optimization = {
			minimize: true,
			namedModules: true,
			minimizer: [
				new TerserPlugin({
					sourceMap: true,
					terserOptions: {
						ecma: 6,
						warnings: false,
						compress: {
							drop_console: isProd ? true : false
						},
						ie8: false,
						safari10: false
					}
				})
			]
		};
		config.plugins.push(
			new MiniCssExtractPlugin({
				filename: `${defineOutput("css", "contenthash")}`,
				chunkFilename: "css/[id].css"
			}),
			new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /pt-br/),
			new CompressionPlugin({
				test: /\.(js|css|html|svg)$/,
				filename: "[path].gz[query]",
				threshold: 10240,
				minRatio: 0.8
			}),
			new OptimizeCssAssetsPlugin(),
		);
	}

	config.devServer = {
		host: "0.0.0.0",
		stats: "errors-only",
		disableHostCheck: true,
		historyApiFallback: true,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
			"Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
		},
		port: 8181,
		hot: false,
		hotOnly: false,
		inline: true,
		compress: true
	};
	return config;
};
