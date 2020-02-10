/* eslint-disable prettier/prettier */
import React, { PureComponent } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import "url-search-params-polyfill";
import { hot } from "react-hot-loader";
import { Provider } from "react-redux";
import store from "./reducers";
import { ThemeProvider } from "emotion-theming";
import Home from "./components/pages/Home/Home";

const theme = {
	color: "red",
	padding: "50px",
	border: "2px dashed green"
};

class App extends PureComponent {
	render() {
		return (
			<ThemeProvider theme={theme}>
				<Provider store={store}>
					<Router>
							<Route path="/" component={Home} />
					</Router>
				</Provider>
			</ThemeProvider>
		);
	}
}

export default hot(module)(App);