import thunkMiddleware from "redux-thunk";
import { createStore, combineReducers, applyMiddleware, compose } from "redux";

if (window.parent !== window) {
	window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.parent.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const initial = {
	test: false
};

const store = createStore(
	combineReducers({
		initial
	}),
	composeEnhancers(applyMiddleware(thunkMiddleware))
);

export default store;
