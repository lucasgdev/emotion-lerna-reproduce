import React from "react";
import { render } from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";

const rootEl = document.getElementById("root");

if (!rootEl) {
	throw new Error("couldn't find element with id root");
}

const renderApp = AppComponent => {
	render(
		<Router>
			<AppComponent />
		</Router>,
		rootEl
	);
};
renderApp(App);

if (module.hot) {
	module.hot.accept("./App", () => {
		// eslint-disable-next-line global-require
		const NewRoot = require("./App").default;
		renderApp(NewRoot);
	});
}
