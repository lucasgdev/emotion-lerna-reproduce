const debug = require("debug");

const log = debug("max:build");

module.exports = function(api) {
	const environment = api.env();

	log("Babelrc from search loaded in '%s' mode", environment);

	return {
		compact: environment === "production",
		presets: [
			[
				"@babel/preset-env",
				{
					useBuiltIns: "usage",
					corejs: 3,
					shippedProposals: true,
					// modules: false,
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
			],
			[
				"@emotion/babel-preset-css-prop",
				{
					sourceMap: true
				}
			]
		],
		plugins: [
			[
				require.resolve("babel-plugin-module-resolver"),
				{
					extensions: [".js", ".jsx"],
					alias: {
						"^@actions/(.+)": "./src/actions/\\1",
						"^@reducers/(.+)": "./src/reducers/\\1",
						"^@store": "./src/reducers/index.js",
						"^@components/(.+)": "./src/components/\\1",
						"^@models/(.+)": "./src/models/\\1",
						"^@api$": "./src/api/index.js",
						"^@api/(.+)": "./src/api/\\1",
						"^@shared$": "./src/api/shared.js",
						"^@shared/(.+)": "./src/shared/\\1"
					}
				}
			],
			"@babel/plugin-transform-runtime",
			["@babel/plugin-proposal-object-rest-spread", { useBuiltIns: true }],
			["@babel/plugin-proposal-class-properties", { loose: true }],
			["@babel/plugin-proposal-decorators", { legacy: true }],
			"@babel/plugin-transform-destructuring",
			"@babel/plugin-syntax-dynamic-import",
			"es6-promise"
		],
		env: {
			development: {
				sourceMaps: "both",
				plugins: ["react-hot-loader/babel"]
			},
			production: {
				plugins: ["@babel/plugin-transform-react-inline-elements"]
				// presets: ["minify"]
			},
			test: {
				plugins: ["@babel/plugin-transform-runtime", "require-context-hook"],
				sourceMaps: false,
				presets: [
					[
						"@babel/preset-env",
						{
							modules: "commonjs",
							useBuiltIns: "usage",
							corejs: 3,
							targets: { node: "10" }
						}
					]
				]
			}
		}
	};
};
