/* eslint-disable promise/catch-or-return,promise/always-return */
import Cookie from "js-cookie";

import { store, history } from "../react-app";
import {
	flightsSum,
	getOppositeStretch,
	getOppositeFlight,
	mergeFlights,
	extractValues
} from "../shared/utils";
import getURLParams from "../shared/getURLParams";
import { getCheckoutById } from "../shared/requests-api";
import * as constant from "../shared/constants";
import "../shared/pubsub-triggers";
import { getFlightDetails } from "../shared/requests-api";
import { axiosMM } from "../shared/axiosCreator";

export const getSearchIntention = flightSearchParams => ({
	type: constant.GET_SEARCH_INTENTION,
	flightSearchParams: { ...flightSearchParams, searchingFlights: true }
});

export const changeTab = currentStretch => ({
	type: constant.CHANGE_TAB,
	currentStretch: currentStretch
});

export const receiveSearchIntention = flightSearchData => ({
	type: constant.GET_SEARCH_INTENTION_RECEIVED,
	searchId: flightSearchData.id,
	legacyId: flightSearchData.legacyId,
	createdDate: flightSearchData.createdDate,
	fromCountry: flightSearchData.fromCountry,
	toCountry: flightSearchData.toCountry,
	isInternational: flightSearchData.isInternational,
	hasPromotion: flightSearchData.hasPromotion,
	message: flightSearchData.message,
	airlines: flightSearchData.airlines.map(airline => ({
		...airline,
		fetchStatus: constant.AIRLINE_SEARCH_FLIGHTS_PENDING
	}))
});

export const receiveSearchIntentionFromMetaSearch = flightSearchData => ({
	type: constant.GET_SEARCH_INTENTION_FROM_METASEARCH_RECEIVED,
	searchId: flightSearchData.id,
	legacyId: flightSearchData.legacyId,
	createdDate: flightSearchData.createdDate,
	fromCountry: flightSearchData.fromCountry,
	toCountry: flightSearchData.toCountry,
	tripType: flightSearchData.tripType,
	cabin: flightSearchData.cabin,
	isInternational: flightSearchData.isInternational,
	airlines: []
});

export const searchIntentionFailed = response => ({
	type: constant.GET_SEARCH_INTENTION_FAILED,
	response: response
});

export const getFlightsFromAirline = airline => ({
	type: constant.GET_AIRLINE_FLIGHTS,
	status: constant.AIRLINE_SEARCH_FLIGHTS_PENDING,
	airline: airline
});

export const updatingPrices = () => ({
	type: constant.UPDATING_PRICES
});

export const updateSearchProgress = () => {
	const airlines = store.getState().searchStatus.airlines || false;
	let progress = airlines
		? airlines.filter(
				airline =>
					airline.fetchStatus == constant.AIRLINE_SEARCH_FLIGHTS_DONE ||
					airline.fetchStatus == constant.AIRLINE_SEARCH_FLIGHTS_ERROR
		  ).length /
		  airlines.length *
		  100
		: 0;

	return {
		type: constant.UPDATE_SEARCH_PROGRESS,
		progress
	};
};

export const getFlightsFromAirlineError = airline => {
	return {
		type: constant.AIRLINE_SEARCH_FLIGHTS_ERROR,
		airline: airline.label
	};
};

export const toggleModal = modalStatus => ({
	type: constant.TOGGLE_MODAL,
	isOpen: modalStatus == constant.CLOSE_MODAL ? false : true
});

export const flightDirectionRedirect = direction => ({
	type: constant.SELECT_TYPE_FLIGHT,
	flightDirection: direction
});

export const receiveFlightsFromAirline = (airline, flights) => ({
	type: constant.AIRLINE_SEARCH_FLIGHTS_RECEIVED,
	status: constant.AIRLINE_SEARCH_FLIGHTS_DONE,
	airline: airline,
	flightsFound: flightsSum(flights),
	flights
});

export const setFilter = (filterData, stretch) => ({
	type: constant.SET_SEARCH_FILTER,
	filter: filterData,
	stretch
});

export const orderBy = (column, stretch) => dispatch => {
	dispatch({
		type: constant.SET_ORDER_BY,
		column: column,
		stretch: stretch
	});
};

export const init = flightSearchParams => dispatch => {
	dispatch(getSearchIntention(flightSearchParams));

	const params = getURLParams(location.href);

	flightSearchParams["allowSearchSameDay"] = params.mmop !== undefined;

	axiosMM
		.post(
			`${constant.SEARCH_FLIGHTS_API}/search?time=${Date.now()}${
				window.location.search !== "" ? "&" + window.location.search.substr(1) : ""
			}`,
			flightSearchParams,
			{
				headers: {
					Authorization: "JWT " + window.searchToken
				}
			}
		)
		.then(flightSearchData => {
			dispatch(receiveSearchIntention(flightSearchData.data));
			getFlightsFromAirlines(flightSearchData.data, false, dispatch);
		})
		.catch(e => {
			dispatch(searchIntentionFailed(e.response));
		});
};

export const selectFlight = (flight, searchIntentionID, selectedFlights) => dispatch => {
	dispatch({ type: constant.SELECT_FLIGHT, flight });
	if (store.getState().searchStatus.isInternational) {
		dispatch(setFilter({ airlines: flight.airline }, getOppositeStretch(flight.direction)));
	}
	window.scrollTo(0, 0);

	if (
		flight.airline === "starAlliance" &&
		flight.pricing.mmBestPriceAt === "miles" &&
		(flight.pricing.miles.provider === "amigo" ||
			flight.pricing.miles.provider === "star_alliance") &&
		flight.updated !== true
	) {
		getFlightDetails([flight.id], searchIntentionID, selectedFlights, flight.direction);
	}

	const tripType = store.getState().searchParams.params.tripType;

	const flightsSum = extractValues(store.getState().selectedFlights).reduce((sum, objFlight) => {
		return (sum += objFlight[0] && objFlight[0].id ? 1 : 0);
	}, 0);

	const canChangeToCheckout = () => {
		return (
			(flightsSum == 1 && tripType == constant.TRIPTYPE_ONEWAY) ||
			(flightsSum == 2 && tripType == constant.TRIPTYPE_ROUNDTRIP)
		);
	};

	if (canChangeToCheckout()) {
		history.push(window.location.pathname.replace("#checkout") + "#checkout");
		return false;
	}

	dispatch(
		removeOppositeFlightsFromAirline(getOppositeStretch(flight.direction), flight.airlineTarget)
	);

	dispatch({ type: constant.CHANGE_TAB, currentStretch: getOppositeStretch(flight.direction) });

	dispatch({ type: constant.GET_SEARCH_WITH_REFERENCE, airline: flight.airlineTarget });

	getNewPrices(
		flight.airlineTarget,
		flight,
		store.getState().searchStatus.searchId,
		flight.direction
	).then(updatedFlights => {
		dispatch(
			updateFlightPrices(
				filterFlightByType(updatedFlights.data),
				getOppositeStretch(flight.direction),
				flight.airlineTarget
			)
		);

		dispatch({ type: constant.UPDATE_SEARCH_PROGRESS, progress: 100 });
	});
};

export const setFlightFromMetaSearch = flight => ({ type: constant.SELECT_FLIGHT, flight });

export const selectRoundTripFlights = flights => ({
	type: constant.SELECT_ROUNDTRIP_FLIGHTS,
	flights
});

export const unselectFlight = flight => dispatch => {
	dispatch({ type: constant.UNSELECT_FLIGHT, flight });

	const tripType = store.getState().searchParams.params.tripType;

	if (
		tripType === "OW" &&
		store.getState().selectedFlights[getOppositeStretch(flight.direction)].length === 0
	) {
		dispatch({ type: constant.CLEAN_AIRLINES_FILTER });
	} else {
		const oppositeFlight = getOppositeFlight(flight.direction, store.getState().selectedFlights);

		dispatch(changeTab(flight.direction));

		if (store.getState().searchStatus.isInternational) {
			dispatch(setFilter({ airlines: flight.airline }, getOppositeStretch(flight.direction)));
		}

		let airline = flight.airlineTarget;

		if (oppositeFlight && oppositeFlight.length > 0) {
			airline = oppositeFlight[0].airlineTarget;
		}

		getNewPrices(
			airline,
			oppositeFlight && oppositeFlight.length > 0 ? oppositeFlight[0] : null,
			store.getState().searchStatus.searchId,
			flight.direction
		).then(updatedFlights =>
			dispatch(
				updateFlightPrices(
					filterFlightByType(updatedFlights.data),
					getOppositeStretch(flight.direction),
					flight.airlineTarget
				)
			)
		);
	}
};

const removeOppositeFlightsFromAirline = (direction, airline) => {
	const flights = store.getState().flights[direction].filter(flight => {
		return flight.airlineTarget !== airline;
	});

	return {
		type: constant.UPDATE_FLIGHT_PRICES,
		flights: { [direction]: flights }
	};
};

const updateFlightPrices = (updatedFlights, direction, airline) => {
	let flights = {};
	flights[direction] = mergeFlights(
		store.getState().flights[direction],
		updatedFlights[direction],
		airline
	);
	return {
		type: constant.UPDATE_FLIGHT_PRICES,
		flights
	};
};

export const getNewPrices = (airline, flight, intentionId) => {
	const referenceFlight = flight === null ? "" : flight.id;
	const params = airline ? { airline, referenceFlight } : {};

	return axiosMM
		.get(`${constant.SEARCH_FLIGHTS_API}/search/${intentionId}/flights`, { params: params, headers: { Authorization: "JWT " + window.searchToken } })
		.then(updatedFlights => updatedFlights);
};

export const getFlightsFromAirlines = (flightSearchData, airlinesWithError, dispatcher) => {
	let { airlines, id: searchId } = flightSearchData;

	const airlinesToSearchFilter = airline =>
		airlinesWithError
			? airline.fetchStatus === constant.AIRLINE_SEARCH_FLIGHTS_ERROR
			: airline.status.enable === true;

	airlines.filter(airline => airlinesToSearchFilter(airline)).map(airline => {
		const timeoutInfo = airline.timeout * 1000;

		dispatcher(getFlightsFromAirline(airline.label));
		axiosMM
			.get(
				`${constant.SEARCH_FLIGHTS_API}/search/${searchId}/flights?airline=${airline.label}`,
				{ timeout: timeoutInfo, headers: { Authorization: "JWT " + window.searchToken } },
			)
			.then(flights => {
				const data = filterFlightByType(flights.data);
				dispatcher(receiveFlightsFromAirline(airline.label, data));
			})
			.catch(error => {
				dispatcher(getFlightsFromAirlineError(airline));
			})
			.then(() => {
				dispatcher(updateSearchProgress());

				const computedProgress = store.getState().searchStatus.progress;
				const airlines = store.getState().searchStatus.airlines;
				const failingAirlines = airlines.filter(
					airline => airline.fetchStatus == constant.AIRLINE_SEARCH_FLIGHTS_ERROR, 0)
						.length == store.getState().searchStatus.airlines.length;

				if (failingAirlines && computedProgress == 100) console.log("deu ruim.");
			});
	});
};

const filterFlightByType = flights => {
	let data = flights;

	let type = sessionStorage.getItem("p");

	if (type) {
		type = type.replace("_", "");
		
		const outbound = data.outbound.filter(flight => {
			return (
				(type === "tr" && flight.otaAvailableIn === "both" && flight.pricing.mmBestPriceAt === "ota") ||
				(type === "ml" && flight.otaAvailableIn === "both" && flight.pricing.mmBestPriceAt === "miles")
			);
		});
		
		const inbound = data.inbound.filter(flight => {
			return (
				(type === "tr" && flight.otaAvailableIn === "both" && flight.pricing.mmBestPriceAt === "ota") ||
				(type === "ml" && flight.otaAvailableIn === "both" && flight.pricing.mmBestPriceAt === "miles")
			);
		});
		
		data = { inbound, outbound };
	}

	return data;
};

export const defineOfferTimeout = () => {
	const date = new Date();
	date.setMinutes(date.getMinutes() + constant.SET_OFFER_MINUTES_INCREASE);

	return {
		type: constant.DEFINE_OFFER_TIMEOUT,
		searchCreatedDate: Date.now(),
		expireDate: date
	};
};

export const refreshOfferTimeout = () => {
	var obj = {};

	try {
		obj = {
			type: constant.SET_OFFER_TIMEOUT,
			searchCreatedDate:
				store.getState().searchStatus.createdDate === ""
					? store.getState().createCheckout.fullCheckout.search.createdDate
					: store.getState().searchStatus.createdDate,
			expireDate: store.getState().createCheckout.fullCheckout.metadata.expirationTimestamp
		};
	} catch (e) {
		obj = {
			type: constant.SET_OFFER_TIMEOUT,
			searchCreatedDate:
				store.getState().searchStatus.createdDate === ""
					? store.getState().createCheckout.fullCheckout.search.createdDate
					: store.getState().searchStatus.createdDate,
			expireDate: null
		};
	}

	return obj;
};

export const resetOfferTimeout = () => ({
	type: constant.RESET_OFFER_TIMEOUT
});

//chama a ação que dispara o timeout (dependendo da página, mostra um label ou abre modal)
export const callTimeoutAction = () => ({
	type: constant.CALL_TIMEOUT_ACTION
});

//Checkout Criação / Checagem

export const createNewCheckout = checkoutData => {
	sessionStorage.removeItem("activeCheckoutId");

	const { searchId, legacyId, outboundId, inboundId } = checkoutData;

	//Pega dados da url do metasearch
	const metasearchQuery = window.location.search
		.substring(1)
		.replace(/(out|in)boundId=[\w\d]+&?/g, "");

	//Pega valores de utm persistidos no cookie
	const lastClick = Cookie.get("last_click");
	const lastClickJSON = lastClick ? JSON.parse(lastClick) : undefined;

	//Pega valor de cookie de afiliado, transforma em JSON, e transforma JSON em queryStringAffliates
	const cacAffiliateCookie = Cookie.get("cac");
	const affiliateCookieJSON = cacAffiliateCookie ? JSON.parse(cacAffiliateCookie) : undefined;

	let queryString = affiliateCookieJSON
		? Object.keys(affiliateCookieJSON)
				.map(key => key + "=" + affiliateCookieJSON[key])
				.join("&")
		: metasearchQuery !== "" ? metasearchQuery : undefined;

	if (queryString === undefined && lastClickJSON && lastClickJSON.utm_source === "transacional") {
		queryString = Object.keys(lastClickJSON)
			.map(key => key + "=" + lastClickJSON[key])
			.join("&");
	}

	let cid = "";
	try {
		cid = ga ? ga.getAll()[0].get("clientId") : cid;
		cid = cid ? `&cid=${cid}` : "";
		// eslint-disable-next-line no-empty
	} catch (e) {
	}

	let APIABQuery = sessionStorage.getItem("s2") ? "&s2=true" : "";

	const checkoutURLToPost = queryString
		? `${
				constant.CHECKOUT_API
		  }/checkouts/?${queryString}&ota=true&simplified=true${APIABQuery}${cid}`
		: `${constant.CHECKOUT_API}/checkouts/?ota=true&simplified=true${APIABQuery}${cid}`;

	const headers = localStorage.getItem("au") ? { Authorization: localStorage.getItem("au") } : null;

	let promise = new Promise((resolve, reject) => {
		axiosMM
			.post(
				`${checkoutURLToPost}`,
				{
					searchId,
					legacyId,
					outboundId,
					inboundId
				},
				{ headers }
			)
			.then(response => {
				store.dispatch({ type: constant.CHECKOUT_CREATED, checkoutId: response.data.id });
				resolve(response.data);
				return response;
			})
			.then(response => {
				sessionStorage.removeItem("cardTry");

				if (lastClickJSON && lastClickJSON.utm_campaign === "alertadepreco") {
					Cookie.remove("last_click");
				}

				try {
					sessionStorage.setItem("activeCheckoutId", response.data.id);
				} catch (err) {
					reject(err);
				} finally {
					if (window.self !== window.top) {
						window.top.location.href =
							"/busca-passagens-aereas/pagamento" + `?id=${response.data.id}`;
					} else {
						window.location.href = "/busca-passagens-aereas/pagamento" + `?id=${response.data.id}`;
					}
				}
			})
			.catch(error => {
				store.dispatch({ type: constant.CHECKOUT_CREATE_FAILED, error });
				reject(error);
			});
	});

	return promise;
};

export const createNewViajanetRedirect = checkoutData => {
	sessionStorage.removeItem("activeCheckoutId");

	const { searchId, outboundId, inboundId } = checkoutData;

	let params = {
		urlCheckout: window.location.href,
		flightOutbound: outboundId
	};

	if (inboundId !== null) {
		params["flightInbound"] = inboundId;
	}

	let promise = new Promise((resolve, reject) => {
		axiosMM
			.post(`${constant.SEARCH_FLIGHTS_API}/search/${searchId}/viajanet/redirect`, params, {
				headers: {
					Authorization: "JWT " + window.searchToken
				}
			})
			.then(response => {
				try {
					resolve(response.data.doCheckoutHtml);
					return response;
				} catch (err) {
					reject(err);
				}
			})
			.catch(error => {
				reject(error);
			});
	});

	return promise;
};

// Minhas Viagens - My Trips
export const setOrders = orders => ({
	type: constant.SET_USER_ORDERS,
	orders
});

// Cancelamento - Cancellation
export const setOrderToCancel = orderToCancel => ({
	type: constant.SET_ORDER_CANCELLATION,
	orderToCancel
});

// Detalhes - Details 
export const setOrderToDetail = orderToDetail => ({
	type: constant.SET_ORDER_DETAIL,
	orderToDetail
});