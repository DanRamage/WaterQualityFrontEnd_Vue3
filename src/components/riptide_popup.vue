<template>
    <div id="ripcurrent-popup">
        <b-card class="wq-card"
                header="Rip Current Model Guidance Site"
                header-tag="header">
            <b-card-title class="font-avenir">
                <img :src="getAdvisoryImage()" style="height: 25px;width: 25px">
                Site: {{stationName}}
            </b-card-title>
            <b-card-sub-title>
            </b-card-sub-title>
            <b-card-text class="mt-3">
                <p>
                    <span class="font-avenir">
                        <b>Rip Current Model Guidance: {{getAdvisory}}</b>
                    </span>
                    <br>
                    <span class="ml-2 avenir-font-light">Date: {{advisoryDate}}</span>
                    <br>
                    <b v-if="isDataFresh == false" class="ml-2 avenir-font-light text-danger">RESULTS ARE OUT OF DATE</b>
                </p>
            </b-card-text>
            <b-card-text>
                <div class="ripcurrent-disclaimer">
                    <small>
                        <a :href="getGuidanceLink" target="_blank">Rip Current Model Guidance</a> provided by the National Weather Service. For official
                        Rip Current Forecasts visit the local <a :href="getWFOLink" target="_blank">NWS Weather Forecast Office</a>.
                    </small>
                </div>
            </b-card-text>

        </b-card>
    </div>
</template>

<script>
    import Vue from 'vue';
    //import moment from 'moment/src/moment';
    import moment from 'moment';
    import FeatureUtils from "../utilities/feature_funcs";

    import { LayoutPlugin, CardPlugin } from 'bootstrap-vue';
    Vue.use(LayoutPlugin);
    Vue.use(CardPlugin);

    let none_marker = require('@/assets/images/ripcurrent_none_marker_25x25.png');
    let low_marker = require('@/assets/images/ripcurrent_low_marker_25x25.png');
    let high_marker = require('@/assets/images/ripcurrent_high_marker_25x25.png');
    export default {
        name: 'RipcurrentPopup',
        props: ['feature'],
        data() {
            return {
            }
        },
        methods: {
            getAdvisoryImage() {
                let img_src = none_marker;
                //If the data is too old, we use the none marker.
                let properties = this.feature.properties;
                let site_type = this.feature.properties.site_type;
                let dataFresh = FeatureUtils.isDataFresh(properties[site_type].advisory);
                if(dataFresh) {
                    if (site_type in this.feature.properties) {
                        let value = this.feature.properties[site_type].advisory.value;
                        if (value == 'HIGH' || value == 'MODERATE') {
                            img_src = high_marker;
                        } else {
                            img_src = low_marker;
                        }
                    }
                }
                return img_src;
            },
        },
        computed: {
            stationName: function() {
                console.debug("stationName started.");
                let site_type = this.feature.properties.site_type;
                if(site_type in this.feature.properties) {
                    return (this.feature.properties[site_type].station)
                }
                return("")
            },
            getAdvisory: function() {
                console.debug("getAdvisory started.");
                let site_type = this.feature.properties.site_type;
                if(site_type in this.feature.properties) {
                    if('advisory' in this.feature.properties[site_type]) {
                        return(this.feature.properties[site_type].advisory.value);
                    }
                }
                return("");
            },
            getWFOLink: function() {
                console.debug("getWFOLink started.");
                let site_type = this.feature.properties.site_type;
                if(site_type in this.feature.properties) {
                    if('advisory' in this.feature.properties[site_type]) {
                        if('wfo_url' in this.feature.properties[site_type].advisory) {
                            return (this.feature.properties[site_type].advisory.wfo_url);
                        }
                    }
                }
                return("");
            },
            getGuidanceLink: function() {
                console.debug("getGuidanceLink started.");
                let site_type = this.feature.properties.site_type;
                if(site_type in this.feature.properties) {
                    if('advisory' in this.feature.properties[site_type]) {
                        if('guidance_url' in this.feature.properties[site_type].advisory) {
                            return (this.feature.properties[site_type].advisory.guidance_url);
                        }
                    }
                }
                return("");
            },
            getDescription: function() {
                console.debug("description started.");
                let site_type = this.feature.properties.site_type;
                if(site_type in this.feature.properties) {
                    if('advisory' in this.feature.properties[site_type]) {
                        return(this.feature.properties[site_type].advisory.description);
                    }
                }
                return("");
            },
            advisoryDate: function() {
                console.debug("advisoryDate started.");
                let site_type = this.feature.properties.site_type;
                if(site_type in this.feature.properties) {
                    var date = moment(this.feature.properties[site_type].advisory.date).format("MMMM Do YYYY @ hh:mm a");
                    return(date);
                }
                console.debug("advisoryDate is false.");
                return("");
            },
            isDataFresh: function() {
                let properties = this.feature.properties;
                let site_type = this.feature.properties.site_type;
                return(FeatureUtils.isDataFresh(properties[site_type].advisory));
            }

        },
    }
</script>
<style scoped>
    .wq-card {
        /*font-family: 'Montserrat';*/
        color: rgba(0, 61, 126, .85);
        background-color: rgba(255, 255, 255, .85);
    }
    .font-avenir {
        font-family: 'Avenir';
    }
    .avenir-font-light {
        font-family: 'Avenir';
        font-weight: lighter;
    }
    #ripcurrent-popup div .card-title
    {
        font-size: 1.0rem;
    }
    #ripcurrent-popup div .card-subtitle
    {
        font-size: 1.0rem
    }
    .ripcurrent-disclaimer {
        width: 250px;
    }

</style>
