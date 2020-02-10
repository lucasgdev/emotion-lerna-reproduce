const debug = require("debug");

const log = debug("max:build");

module.exports = function(api) {
	const environment = api.env();

	log("Babelrc from assets loaded in '%s' mode", environment);

	return {
		compact: environment !== "development",
		presets: [
			[
				"@babel/preset-env",
				{
					useBuiltIns: "usage",
					corejs: 3,
					shippedProposals: true,
					targets: {
						chrome: "58",
						ie: "11",
						node: "current"
					}
				}
			],
			[
				"@babel/preset-react",
				{
					useBuiltIns: "usage",
					development: process.env.NODE_ENV === "development"
				}
			]
		],
		plugins: [
			"@babel/plugin-transform-runtime",
			["@babel/plugin-proposal-object-rest-spread", { useBuiltIns: true }],
			["@babel/plugin-proposal-class-properties", { loose: true }],
			["@babel/plugin-proposal-decorators", { legacy: true }],
			"@babel/plugin-transform-destructuring",
			"@babel/plugin-syntax-dynamic-import",
			"es6-promise"
		],
		env: {
			test: {
				plugins: ["@babel/plugin-transform-runtime", "require-context-hook"],
				sourceMaps: "both",
				presets: [
					[
						"@babel/preset-env",
						{
							modules: "commonjs",
							useBuiltIns: "usage",
							corejs: 3,
							targets: { node: "current" }
						}
					]
				]
			},
			development: {
				sourceMaps: true,
				plugins: ["react-hot-loader/babel"]
			},
			production: {
				plugins: ["@babel/plugin-transform-react-inline-elements"]
				// presets: ["minify"]
			}
		}
	};
};
