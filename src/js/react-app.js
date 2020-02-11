import React from "react";
import ReactDom from "react-dom";
import thunkMiddleware from "redux-thunk";

import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";

import { createBrowserHistory as createHistory } from "history";
import { Route, Switch } from "react-router";

import { ConnectedRouter, routerMiddleware } from "react-router-redux";
import reducers from "./reducers";

import Home from "./components/pages/Home";

export const history = createHistory();
const middleware = routerMiddleware(history);
export let store;

	store = createStore(reducers, applyMiddleware(middleware, thunkMiddleware));

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
