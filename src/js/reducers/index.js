import { combineReducers } from "redux";

const initial = {
	test: false
}

const reducers = combineReducers({
	initial,
});

export default reducers;
