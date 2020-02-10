import React from "react";
import ReactDom from "react-dom";
import thunkMiddleware from "redux-thunk";

import { createStore, applyMiddleware, compose } from "redux";
import { Provider } from "react-redux";

import { createBrowserHistory as createHistory } from "history";
import { Route, Switch } from "react-router";

import { ConnectedRouter, routerMiddleware } from "react-router-redux";
import reducers from "./reducers";
import { IS_HMG, IS_PROD, IS_DEV } from "./shared/constants";

import Home from "./components/home/home";

export const history = createHistory();
const middleware = routerMiddleware(history);
export let store;

	if (IS_DEV || IS_HMG) {
		const composeEnhancers =
			typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
				? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
				: compose;

		const enhancer = composeEnhancers(applyMiddleware(middleware, thunkMiddleware));

		store = createStore(reducers, enhancer);
	} else if (IS_PROD) {
		store = createStore(reducers, applyMiddleware(middleware, thunkMiddleware));
	}

	history.push(window.location.pathname + window.location.search);

	history.listen(ev => {
		window.scrollTo(0, 0);
	});

	ReactDom.render(
		<Provider store={store}>
			<ConnectedRouter history={history}>
				<div>
					<Switch>
						<Route path="/" component={Home} />
					</Switch>
				</div>
			</ConnectedRouter>
		</Provider>,
		document.getElementById("root")
	);
