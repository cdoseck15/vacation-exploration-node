const axios = require('axios');
const constants = require('../private-constants');
const GOOGLE_API_KEY = constants.GOOGLE_API_KEY;

//Sets up  an axios client to be used to maintain constants across all files.
const useAxios = axios.create({
	withCredentials: true,
	baseURL: constants.FRONT_END
});

//Uses an axios interceptor to handle errors returned from server.
//Currently only returns the response or the error and lets where the axios client is used deal with the error.
useAxios.interceptors.response.use(
	(response) => {
		return response;
	}, (error) => {
		if (!error.response){
			console.log('Cannot connect to the server.');
			return {data: {}};
		}
		else if (error.response.status == 401){
			console.log('User credentials not included or invalid');
		}
		return error.response;
	}
);

//This function is used to refresh place_ids to make sure they stay valid
module.exports.refreshedPlaceID = async (place_id) => {
	var response = await useAxios.get('https://maps.googleapis.com/maps/api/place/details/json?place_id=' + place_id + '&fields=place_id&key=' + GOOGLE_API_KEY);
	return response;
};

//This function is used to get the place information which is determined by the fields array for the given place_id
module.exports.getLocation = async (fields, place_id) => {
	var response = await useAxios.get('https://maps.googleapis.com/maps/api/place/details/json?place_id=' + place_id + '&fields=' + fields.join() + '&key=' + GOOGLE_API_KEY);
	return response.data.result;
};

module.exports.testAPI = async () => {
	var response = await useAxios.get('https://maps.googleapis.com/maps/api/place/details/json?place_id=' + constants.DEMO_PLACE_ID + '&fields=place_id&key=' + constants.GOOGLE_API_KEY);
	return response.data;
};