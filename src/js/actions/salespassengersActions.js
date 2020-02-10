import { getSalesReport, getAllProgramFidelity } from "../shared/requests-api";
import {
	GET_SALES_PASSENGERS,
	GET_SALES_PASSENGERS_SUCCESS,
	GET_SALES_PASSENGERS_ERROR,
	GET_PROGRAMS,
	GET_PROGRAMS_SUCCESS,
	GET_PROGRAMS_ERROR
} from "../shared/constants";
import { checkoutCredentials } from "../shared/utils";

export const filterUserSalesReport = (programId, dateInit, dateFinish) => {
	return dispatch => {
		dispatch({ type: GET_SALES_PASSENGERS });
		const token = checkoutCredentials().au;

		getSalesReport(token, programId, dateInit, dateFinish)
			.then(reponse => {
				dispatch({ type: GET_SALES_PASSENGERS_SUCCESS, payload: reponse.data });
			})
			.catch(e => {
				dispatch({ type: GET_SALES_PASSENGERS_ERROR, payload: e });
			});
	};
};

export const requestUserProgramFidelity = () => {
	return dispatch => {
		dispatch({ type: GET_PROGRAMS });

		const token = checkoutCredentials().au;
		getAllProgramFidelity(token)
			.then(response => {
				dispatch({ type: GET_PROGRAMS_SUCCESS, payload: reponse.data });
			})
			.catch(e => {
				dispatch({ type: GET_PROGRAMS_ERROR, payload: e });
			});
	};
};
