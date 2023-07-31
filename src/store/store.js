import { createStore } from 'vuex'
import AdvisoryLimits from '../utilities/limits' // eslint-disable-line no-unused-vars
import Cache from 'timed-cache';

const store = createStore({
    state: {
        advisory_limits: new AdvisoryLimits(),
        site_name: '',  //The location of the area we are looking at, Charleston, Myrtle Beach, ....
        station_name: '', //The station we are drilling down to, WAC-005, Longboat Key Beach Access.
        sites: undefined,
        site_message: undefined,
        station_data: {},

        //Make a timed cache for the UV indexes. Many stations are in same zipcode, so no need to keep hitting REST request.
        uv_index_cache: new Cache({defaultTtl: 300 * 1000}),
        //Timed cache for data we get from observing stations. We keep it cached for 5 minutes(300 seconds * 1000 ms).
        observing_stations_cache: new Cache({defaultTtl: 300 * 1000})

    },

    mutations: {
        updateAdvisoryLimits(state, limits) {
            state.advisory_limits.update(limits);
        },
        //This is the name of the area, like Myrtle Beach, Charleston, ....
        updateSiteName(state, site_name) {
            console.debug("Updating site_name from: " + state.site_name + " to: " + site_name);
            state.site_name = site_name;
        },
        //This is the name of the station we are looking at, WAC-005, Longboat Key Beach Access, .....
        updateStationName(state, station_name) {
            console.debug("Updating station_name from: " + state.station_name + " to: " + station_name);
            state.station_name = station_name;
        },

        updateStationData(state, feature) {
            try {
                state.station_data[feature.id] = feature;
            }
            catch (e) {
                console.error(e)
            }
        },
        setUVIndex(state, data) {
            try {
                let zipcode = data['zipcode'];
                let uv_index = data['index'];
                console.debug("setUVIndex cached data for zipcode: " + zipcode);
                state.uv_index_cache.put(zipcode, uv_index);
            }
            catch(e) {
                console.error(e);
        }
        },
        setObservingStationData(state, station_data) {
            try {
                let station = station_data['station'];
                let data = station_data['data'];
                console.debug("setStationData cached data for station: " + station);
                state.observing_stations_cache.put(station, data);
            }
            catch(e) {
                console.error(e);
            }
        },

    },

    getters: {
        getUVIndex: (state) => (zipcode) => {
            console.debug("getUVIndex cached data for zipcode: " + zipcode);
            let uv_index = undefined;
            try {
                uv_index = state.uv_index_cache.get(zipcode);
                if(uv_index == undefined) {
                    console.debug("getUVIndex no UV index cached data for zipcode: " + zipcode);
                }

            }
            catch(e) {
                console.error(e);
            }
            return(uv_index);
        },
        getObservingStationData: (state) => (station_name) => {
            console.debug("getObservingStationData cached data for station: " + station_name);
            let station_data = undefined;
            try {
                station_data = state.observing_stations_cache.get(station_name);
                if(station_data == undefined) {
                    console.debug("getObservingStationData no data cached data for station: " + station_name);
                }

            }
            catch(e) {
                console.error(e);
            }
            return(station_data);
        },
    }
});

export default store;
