<template>
    <div class="wrapper">
        <nav id="sidebar" v-bind:class="[sidebarActive ? 'active' : '']">
            <div class="h-100 px-5 py-4 montserat-font text-center text-white blue-background_color sidebar-opacity">
                <a href="/">
                    <h6><i><span v-text="title"></span></i></h6>
                </a>
                <h4><span v-text="site_name"></span></h4>
                <p class="text-left">
                    Bacteria levels can change rapidly between sampling dates. To fill in the gaps,
                    we make daily <b>Nowcast</b> of bacteria conditions. These predictions do not represent
                    swimming advisories, but provide estimates of the likelihood that bacteria conditions
                    would warrant issuing an advisory if sampling were conducted that day.
                </p>
                <button type='button'
                        class="btn btn-outline-primary p-2 mr-2" :class="nowcastActive ? 'active' : ''"
                          v-on:click="dataTypeClick('nowcast')"><b>Nowcast</b></button>
                <button type='button'
                        class="btn btn-outline-primary p-2 ml-2" :class="advisoryActive ? 'active' : ''"
                          v-on:click="dataTypeClick('advisory')"><b>Advisory</b></button>

                <div class="dropdown">
                    <button class="btn btn-outline-primary dropdown-toggle layer_dropdown mt-4" type="button"
                            data-bs-toggle="dropdown" aria-expanded="false">
                        {{current_layer_name}}
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" @click="layerSelected($event, 'openstreetmap', '')">Open Street Map</a></li>
                        <li><a class="dropdown-item" @click="layerSelected($event, 'google', 'm')">Road</a></li>
                        <li><a class="dropdown-item" @click="layerSelected($event, 'google', 's')">Satellite</a></li>
                        <li><a class="dropdown-item" @click="layerSelected($event, 'google', 'y')">Hybrid Satellite</a></li>
                        <li><a class="dropdown-item" @click="layerSelected($event, 'google', 'p')">Hybrid Terrain</a></li>
                    </ul>

                </div>
                <br>
                <p class="text-center mt-4">
                    <a href="" class="text-white card-link">Bacteria Sources</a>
                </p>
                <p class="text-center">
                    <a href="#" class="text-white card-link">Locations</a>
                </p>
                <p class="text-center">
                    <a href="/About" class="text-white card-link">About</a>
                </p>
            </div>
        </nav>
        <div id="content">
            <ol-map ref="site_map"
                    style="width: 100%; height: 100%; position:absolute"
                    :loadTilesWhileAnimating="true"
                    :loadTilesWhileInteracting="true"
                    :controls="[]">
                <ol-view ref="site_view"
                         :rotation="rotation"
                         projection="EPSG:4326">
                </ol-view>
                <ol-tile-layer ref="google_layer">
                    <ol-source-xyz :url="current_layer_url"/>
                </ol-tile-layer>
                <ol-tile-layer ref="osm_layer">
                    <ol-source-osm />
                </ol-tile-layer>

                <ol-vector-layer ref="sites_vector_layer">
                    <ol-source-vector ref="sites_vector_source">
                        <ol-feature v-for="feature in features"
                                    :key="feature.id"
                                    :properties="{  id: feature.id,
                                                    properties: feature.properties}"
                        >
                            <!--
                            We have to check the type of the geoemtry the site has. Currently we can have a Point
                            of Polygon.
                            -->
                            <ol-geom-point v-if="feature.geometry.type == 'Point'"
                                :coordinates="[
                                    feature.geometry.coordinates[0],
                                    feature.geometry.coordinates[1]
                                ]">
                            </ol-geom-point>
                            <ol-geom-polygon v-else-if="feature.geometry.type == 'Polygon'"
                                             :coordinates="feature.geometry.coordinates">
                            </ol-geom-polygon>

                            <ol-style v-if="feature.geometry.type == 'Point'"
                                      :overrideStyleFunction="override_style_function">
                            </ol-style>
                            <ol-style v-else-if="feature.geometry.type == 'Polygon'"
                                      :overrideStyleFunction="polygon_style_function">
                            </ol-style>

                        </ol-feature>
                    </ol-source-vector>
                </ol-vector-layer>
                <ol-interaction-select ref="site_interaction"
                                       @select="feature_select"
                                       :features="selectedFeatures">
                    <ol-overlay v-if="show_popup"
                                :position="popup_position">
                        <div>
                           <component :is="getPopupComponent(current_selected_feature)" v-bind:feature="current_selected_feature"></component>
                        </div>
                    </ol-overlay>
                </ol-interaction-select>

              <ol-mouseposition-control />
        </ol-map>
        <button
                v-b-toggle.info-sidebar
                id="sidebarCollapse"
                class="btn btn-outline-info btn-sm"
                v-on:click="sidebarButtonClick()"
                v-bind:class="[sidebarBtnActive ? 'active' : '']">
            <span></span>
            <span></span>
            <span></span>
        </button>

    </div>

    <div v-show="featureStylingCompleted">
        <IconsLegend :icon_info="legend_icons"></IconsLegend>
    </div>

    <!-- This gives us the ability to know when the media queries/breaks occur -->
        <span ref="mq_detector" id="mq-detector">
            <span ref="visible_xs" class="d-block d-sm-none">
            </span>
            <span ref="visible_sm" class="d-none d-sm-block d-md-none">
            </span>
            <span ref="visible_md" class="d-none d-md-block d-lg-none">
            </span>
            <span ref="visible_lg" class="d-none d-lg-block d-xl-none">
            </span>
            <span ref="visible_xlg" class="d-none d-xl-block">
            </span>
        </span>
    </div>
</template>

<script>
    import app from 'vue';
    import "bootstrap";
    import 'bootstrap-vue/dist/bootstrap-vue.css';
    import 'typeface-montserrat/index.css';

    /*
        import Map from "vue3-openlayers"
        import TileLayer from "vue3-openlayers"
        import OsmSource from "vue3-openlayers"
        import Geoloc from "vue3-openlayers"
        import VectorLayer from "vue3-openlayers"
        import VectorSource from "vue3-openlayers"
        import XyzSource from "vue3-openlayers"
        import FillStyle from "vue3-openlayers"
        import StrokeStyle from "vue3-openlayers"
        import StyleBox from "vue3-openlayers"
        import CircleStyle from "vue3-openlayers"
        import Overlay from "vue3-openlayers"
        import SelectInteraction from "vue3-openlayers"

        app.use(Map);
        app.use(TileLayer);
        app.use(OsmSource);
        app.use(Geoloc);
        app.use(VectorLayer);
        app.use(VectorSource);
        app.use(XyzSource);
        app.use(StyleBox);
        app.use(FillStyle);
        app.use(StrokeStyle);
        app.use(CircleStyle);
        app.use(Overlay);
        app.use(SelectInteraction);
    */
    import OpenLayersMap from "vue3-openlayers";
    app.use(OpenLayersMap);
    import "vue3-openlayers/dist/vue3-openlayers.css";

    import DataAPI from "../utilities/rest_api";
    import FeatureUtils from "../utilities/feature_funcs";
    import BCRSPopup from "./bcrs_popup";
    import ShellcastPopup from "./shellcast_popup";
    import CameraPopupBasic from "@/components/camera_popup_basic";
    import EventUtils from "../utilities/analytics_funcs";

    import IconsLegend from "@/components/icons_legend";

    import Icon from 'ol/style/Icon';
    import Collection from 'ol/Collection';
    import Style from 'ol/style/Style';
    import {fromExtent} from 'ol/geom/Polygon';
    import Stroke from 'ol/style/Stroke';
    import Fill from 'ol/style/Fill'

    //SInce these are not in the template, we import them here. We use them in the javascript below when
    //determining which icon to use.
    import LowMarkerIcon from '@/assets/images/low_marker_25x25.png'
    import HiMarkerIcon from '@/assets/images/high_marker_25x25.png'
    import NoneMarkerIcon from '@/assets/images/none_marker_25x25.png'
    import CameraIcon from '@/assets/images/webcam_icon.png'
    import ShellfishLowMarkerIcon from '@/assets/images/shellfish_low_marker_25x25.png'
    import ShellfishHiMarkerIcon from '@/assets/images/shellfish_high_marker_25x25.png'
    import ShellfishNoneMarkerIcon from '@/assets/images/shellfish_none_marker_25x25.png'
    import MoteMarineBeachAmbassadorIcon from '@/assets/images/mote-beach-ambassador-25x41.png'
    import ShellcastIcon from '@/assets/images/shellcast_marker_25x25.png'

    //import { inject } from "vue";
    export default {
        name: 'OLMapPage',

        components: {
          //BCRSPopup,
          IconsLegend,
          //ShellcastPopup,
          //CameraPopupBasic
        },
        data () {

            return {
                title: "HOW'S THE BEACH",
                site_name: "",
                zoom: 5,
                center: [0,0],
                rotation: 0,
                features: [],
                loading: false,
                current_google_layer: 's',
                current_layer_url: '',
                current_layer_name: "Satellite",
                xyz_layer_visible: true,
                osm_layer_visible: false,
                current_selected_feature: undefined,
                selectedFeatures: new Collection(),
                advisory_limits: undefined,
                nowcastActive: true,
                advisoryActive: false,
                sidebarActive: false,
                sidebarBtnActive: false,
                currMqNdx: undefined,
                mqSelectors: undefined,
                legend_icons: [],
                features_styled: 0,
                low_marker_icon: LowMarkerIcon,
                hi_marker_icon: HiMarkerIcon,
                none_marker_icon: NoneMarkerIcon,
                camera_marker_icon: CameraIcon,
                shellfish_low_marker_icon: ShellfishLowMarkerIcon,
                shellfish_hi_marker_icon: ShellfishHiMarkerIcon,
                shellfish_none_marker_icon: ShellfishNoneMarkerIcon,
                motemarine_marker_icon: MoteMarineBeachAmbassadorIcon,
                shellcast_marker_icon: ShellcastIcon,
            }
        },
        created() {
            window.addEventListener("resize", this.resizeHandler);
        },
        mounted () {
            let vm = this;
            this.loading = true;
            this.features_styled = 0;

            this.mqSelectors = [
                this.$refs.visible_xs,
                this.$refs.visible_sm,
                this.$refs.visible_md,
                this.$refs.visible_lg,
                this.$refs.visible_xlg
            ];


            this.current_layer_url = `https://mt0.google.com/vt/lyrs=${this.current_google_layer}&hl=en&x={x}&y={y}&z={z}`;
            this.$refs.osm_layer.tileLayer.setVisible(false);
            this.$refs.google_layer.tileLayer.setVisible(true);

            let path = window.location.pathname;
            if (path.length) {
                let location_site_name = this.$store.state.site_name;
                console.debug("Retrieving initial site: " +  location_site_name + " data.");

                DataAPI.GetSitesPromise(location_site_name, '', true, true).then(features => {
                    console.debug("Retrieved: " + features.data.sites.features.length + " features");
                    vm.features = features.data.sites.features;
                    if('limits' in features.data.advisory_info) {
                        this.$store.commit('updateAdvisoryLimits', features.data.advisory_info.limits);
                    }
                    this.site_name = features.data.project_area.name;

                    vm.loading =  false;

                    setTimeout(function() {
                        if(vm.$refs.sites_vector_layer !== null) {
                            //Get the extents for our vector features. We then create a polygon from the extent and scale
                            //it up by 20% to make sure all our features are in the map view amd not just peaking through
                            //at the edges.
                            let feature_extent = vm.$refs.sites_vector_source.source.getExtent();
                            let extent_poly = fromExtent(feature_extent);
                            extent_poly.scale(1.2);
                            vm.$refs.site_view.fit(extent_poly, vm.$refs.site_map.map.getSize());
                        }
                    }, 100);
                })
                .catch(error => {
                    let error_message = '';
                    let status_code = 404;
                    if('response' in error && error.response !== undefined) {
                        status_code = error.response.status;
                        if ('error' in error.response.data) {
                            if ('message' in error.response.data.error) {
                                error_message = error.response.data.error.message;
                            }
                        } else {
                            error_message = error.response.data;
                        }
                        console.error("Status code: " + status_code +". Error Msg: " + error_message);
                    }
                    else{
                        console.error(error);
                        error_message = error;
                    }
                    this.$router.push({
                        name: '404',
                        params: {
                            error_message: error_message,
                            status_code: status_code
                        }
                    });
                });

            }
        },
        unmounted() {
            window.removeEventListener("resize", this.resizeHandler);
        },
        methods: {
            feature_select(feature) {
                this.current_selected_feature = undefined;
                if(feature.selected.length) {
                    console.debug("getFeature called. Feature selected: " + feature.selected[0].getProperties().id);
                    this.current_selected_feature = feature.selected[0].getProperties();
                }
                else {
                    console.debug("getFeature called. No feature selected.");
                }
            },
            /*
            get_sites()
            {
                console.debug("get_sites called");
                let vm = this;
                let path = window.location.pathname;
                if (path.length) {
                    let location_site_name = this.$store.state.site_name;
                    console.debug("Retrieving initial site: " + location_site_name + " data.");
                    DataAPI.GetSitesPromise(location_site_name, '', true, true).then(features => {
                        console.debug("Retrieved: " + features.data.sites.features.length + " features");
                        //vm.features = features.data.sites.features;
                        let formatter = new GeoJSON();
                        features.data.sites.features.forEach(feature => {
                            try {
                                let ol_feature = formatter.readFeature(feature);
                                vm.$refs.sites_vector_source.source.addFeature(ol_feature);
                                vm.features.push(ol_feature);
                            }
                            catch(error)
                            {
                                console.log.error(error);
                            }
                        });
                        let feature_extent = vm.$refs.sites_vector_source.source.getExtent();
                        vm.$refs.site_view.fit(feature_extent);

                        if ('limits' in features.data.advisory_info) {
                            this.$store.commit('updateAdvisoryLimits', features.data.advisory_info.limits);
                        }
                        this.site_name = features.data.project_area.name;

                        vm.loading = false;

                    })
                    .catch(error => {
                        let error_message = '';
                        let status_code = 404;
                        if ('response' in error && error.response !== undefined) {
                            status_code = error.response.status;
                            if ('error' in error.response.data) {
                                if ('message' in error.response.data.error) {
                                    error_message = error.response.data.error.message;
                                }
                            } else {
                                error_message = error.response.data;
                            }
                            console.error("Status code: " + status_code + ". Error Msg: " + error_message);
                        } else {
                            console.error(error);
                            error_message = error;
                        }
                        this.$router.push({
                            name: '404',
                            params: {
                                error_message: error_message,
                                status_code: status_code
                            }
                        });
                    });
                }
            },
            */
            resizeHandler() {

                for (var i = 0; i < this.mqSelectors.length; i++) {
                    if(this.mqSelectors[i].offsetLeft > 0)
                    {
                        if (this.currMqIdx != i) {
                            this.currMqIdx = i;
                            break;
                        }
                    }
                }
                if(this.currMqIdx < 3)
                {
                    this.sidebarActive = false;
                }

            },
            //pointOnSurface: findPointOnSurface,
            override_style_function(feature, style) {
                var vm = this;
                if(vm.features_styled < vm.features.length) {
                    vm.features_styled += 1;
                }
                let z_index = 2;
                let icon_scale = 0.75;
                let properties = feature.getProperties().properties;
                let site_type = properties.site_type;
                let icon = new Icon({
                    src: vm.none_marker_icon,
                    scale: icon_scale
                });
                if(site_type == 'Water Quality')
                {
                    try
                    {
                        if (vm.advisoryActive) {
                            if ('advisory' in properties[site_type]) {
                                let dataFresh = FeatureUtils.isDataFresh(properties[site_type].advisory);
                                if (dataFresh) {
                                    let value = properties[site_type].advisory.value;
                                    let hi_limit = vm.$store.state.advisory_limits.hi;
                                    let lo_limit = vm.$store.state.advisory_limits.low;
                                    if (value >= hi_limit.minimum) {
                                        //console.debug("Feature: " + feature.getId() + " Hi style value: " + value);
                                        icon = new Icon({
                                            src: vm.hi_marker_icon,
                                            scale: icon_scale
                                        });
                                    } else if (value < lo_limit.maximum) {
                                        //console.debug("Feature: " + feature.getId() + " Low style value: " + value);
                                        icon = new Icon({
                                            src: vm.low_marker_icon,
                                            scale: icon_scale
                                        });
                                    }
                                }
                            } else {
                                console.debug("Feature: " + feature.getId() + " No advisory data found.");
                            }
                        } else {
                            icon = new Icon({
                                src: vm.none_marker_icon,
                                scale: icon_scale
                            });
                            if ('nowcasts' in properties[site_type]) {
                                let level = properties[site_type].nowcasts.level;
                                if (level == 'LOW') {
                                    icon = new Icon({
                                        src: vm.low_marker_icon,
                                        scale: icon_scale
                                    });
                                } else if (level == 'HIGH') {
                                    icon = new Icon({
                                        src: vm.hi_marker_icon,
                                        scale: icon_scale
                                    });
                                } else {
                                    icon = new Icon({
                                      src: vm.none_marker_icon,
                                      scale: icon_scale
                                    });

                                }
                            }
                        }
                    }
                    catch(error)
                    {
                        icon = new Icon({
                            src: vm.none_marker_icon,
                            scale: icon_scale
                        });

                        console.error(error);
                    }
                    if (!(vm.legend_icons.includes('Water Quality'))) {
                        vm.legend_icons.push("Water Quality");
                    }
                }
                else if(site_type == 'Shellfish')
                {
                    try
                    {
                        if (site_type in properties) {
                            //First check to see if our data is still fresh.
                            let dataFresh = FeatureUtils.isDataFresh(properties[site_type].advisory);
                            if (dataFresh) {
                                //Shellfish values are either true for closed or false for open.
                                let value = properties[site_type].advisory.value;
                                if (!value) {
                                    icon = new Icon({
                                        src: vm.shellfish_low_marker_icon,
                                        scale: icon_scale
                                    });
                                } else {
                                    icon = new Icon({
                                        src: vm.shellfish_hi_marker_icon,
                                        scale: icon_scale
                                    });
                                }
                            } else {
                                icon = new Icon({
                                    src: vm.shellfish_none_marker_icon,
                                    scale: icon_scale
                                });
                            }
                        }
                    }
                    catch(error)
                    {
                        icon = new Icon({
                            src: vm.shellfish_none_marker_icon,
                            scale: icon_scale
                        });
                        console.error(error);
                    }
                    if (!(vm.legend_icons.includes('Shellfish'))) {
                        vm.legend_icons.push("Shellfish");
                    }
                }
                else if(site_type == 'Camera Site') {
                    icon = new Icon({
                        src: vm.camera_marker_icon,
                        scale: icon_scale
                    });
                    if(!(vm.legend_icons.includes('Camera Site'))) {
                        vm.legend_icons.push('Camera Site');
                    }

                }

                else if(site_type == 'Beach Ambassador') {
                    icon = new Icon({
                        src: vm.motemarine_marker_icon,
                        //Scale the icon a bit to make it less overwhelming on the map.
                        scale: 0.8
                    });
                    if(!(vm.legend_icons.includes('Beach Ambassador'))) {
                        vm.legend_icons.push('Beach Ambassador');
                    }

                }

                let icon_style = [
                    new Style({
                        image: icon,
                    })
                ];
                icon_style;
                style.setImage(icon);
                style.setZIndex(z_index);

            },
            polygon_style_function(feature, style)
            {
              console.log("polygon_style_function started.");
              let style_color = '#FFFFFF';
              let width = 3;
              let z_index = 1;
              if(feature !== undefined) {
                let properties = feature.getProperties().properties;
                let site_type = properties.site_type;
                if(site_type == 'Shellcast') {
                  style_color = '#2661AB';
                  let fill = new Fill({color: 'rgba(38, 97, 171, 0.2)'});
                  style.setFill(fill);
                    if(!(this.legend_icons.includes('Shellcast')))
                    {
                      this.legend_icons.push('Shellcast');
                    }
                }
              }
              style.setZIndex(z_index);
              let stroke = new Stroke({color: style_color, width: width});
              style.setStroke(stroke);
            },

          dataTypeClick(data_type) {
                console.debug("Data Type Button clicked: " + data_type);
                if(data_type == 'nowcast')
                {
                    this.nowcastActive = true;
                    this.advisoryActive = false;
                    //this.$refs.site_vector_layer.$source.changed();
                }
                else{
                    this.nowcastActive = false;
                    this.advisoryActive = true;
                    //this.$refs.site_vector_layer.$source.changed();
                }
            },
            sidebarButtonClick() {
                this.sidebarActive = !this.sidebarActive;
                this.sidebarBtnActive = !this.sidebarBtnActive;
                console.debug("sidebarButtonClick clicked: " + this.sidebarActive);
            },
            layerSelected(event, layer_type, layer_selected) {
                //Set the name of the current layer selected in dropdown.
                this.current_layer_name = event.target.text;
                console.debug("layerSelected " + this.current_layer_name + " " + layer_type + " " + layer_selected);
                this.$refs.osm_layer.tileLayer.setVisible(false);
                this.$refs.google_layer.tileLayer.setVisible(false);
                if(layer_type === 'google') {
                    this.osm_layer_visible = false;
                    //Build the URL for the XYZ google layer.
                    this.current_google_layer = layer_selected;
                    this.current_layer_url = `https://mt0.google.com/vt/lyrs=${this.current_google_layer}&hl=en&x={x}&y={y}&z={z}`;
                    this.xyz_layer_visible = true;
                    this.$refs.google_layer.tileLayer.setVisible(true);
                }
                else if(layer_type == 'openstreetmap') {
                    this.xyz_layer_visible = false;
                    this.osm_layer_visible = true;
                    this.$refs.osm_layer.tileLayer.setVisible(true);
                }
            },
            /*
            This allows us to dynamically choose the popup to use based on the site_type field.
            */

            getPopupComponent(feature) {
                if(feature !== undefined) {
                    if (feature.properties.site_type == "Water Quality") {
                        let name = 'StationPage';
                        EventUtils.log_event(this.$gtag, 'click', 'WQ Station', feature.properties.description, 0);
                        this.$router.push({
                            name: name,
                            params: {
                                site_name: feature.properties.description,
                                site_id: feature.id,
                                graph_data: this.graph_data
                            }
                        });

                    }
                    else if (feature.properties.site_type == "Shellfish") {
                        EventUtils.log_event(this.$gtag, 'click', 'Shellfish Station', feature.properties.description, 0);
                        this.$router.push({
                            name: 'ShellfishPage',
                            params: {
                                p_site_name: feature.properties.description,
                                p_site_id: feature.id,
                                p_program_type: "Shellfish Monitoring"
                            }
                        });

                    }
                    else if (feature.properties.site_type == "Beach Ambassador") {
                        return (BCRSPopup);
                    }
                    else if (feature.properties.site_type == "Shellcast") {
                        return (ShellcastPopup);
                    }
                    else if (feature.properties.site_type == "Camera Site") {
                        return (CameraPopupBasic);
                    }
                }
            }
        },
        computed: {
            show_popup: function() {
                let show = false;
                /*
                if(this.selectedFeatures.getLength()) {
                    show = true;
                }
                */
                if(this.current_selected_feature !== undefined) {
                    return true;
                }
                console.debug("show_popup " + show + ".");
                return(show);
            },
            /*
            current_clicked_feature: function() {
                let feature = undefined;
                if(this.selectedFeatures.getLength()) {
                    feature = this.selectedFeatures.item(0).getProperties();
                }
                return(feature);
            },
            */
            popup_position: function() {
                let coords = [0,0];
                //if(this.selectedFeatures.getLength()) {
                if(this.current_selected_feature !== undefined) {
                    //let feature = this.selectedFeatures.item(0).getProperties();
                    coords = this.current_selected_feature.geometry.flatCoordinates;
                }
                console.debug("popup_position: " + coords);
                return(coords);
            },
            featureStylingCompleted: function() {
                if(this.features.length > 0 && (this.features_styled == this.features.length))
                {
                    console.debug("featureStylingCompleted styled all features.");
                    return(true);
                }
                console.debug("featureStylingCompleted styled: " + this.features_styled + " features.");
                return(false);
            },
            getSelectedFeatures: function() {
                console.debug("getSelectedFeatures called.");
                return([]);
            }
        },
        watch: {
            /*
            "current_selected_feature": function() {
                if(this.current_selected_feature !== undefined) {
                    this.getPopupComponent(this.current_selected_feature);
                }
            }
             */
            /*
            features: _.debounce(function() {
                this.$refs.site_map.$map.updateSize();
                this.sitesLayerExtents = this.$refs.site_vector_layer.$source.getExtent();
                let m_size = vm.$refs.site_map.$map.getSize();
                this.$refs.site_map.getView().fit(this.sitesLayerExtents, m_size);

                this.message = `Loaded ${this.features.length}`;

                this.$refs.mapView.$view.fit(
                    this.$refs.geojsonSource.$source.getExtent(),
                    {
                        duration: 1000,
                    },
                )
            }, 10),*/
            /*
            sitesLayerExtents: function() {
                console.debug("sitesLayerExtents new extents");
            }*/
        }
    }
</script>
<style>
    body, html {
        height: 100%;
    }
    .btn-outline-primary {

        color: #FFFFFF;
        border-color: #FFFFFF;
        opacity: 0.75;
    }
    .btn-outline-primary:hover,
    .btn-outline-primary:focus,
    .btn-outline-primary:active {
        color: rgba(0, 61, 126, .85);
        background-color: #ffffff;
        border-color: #FFFFFF;
        opacity: 0.75;
    }
    .btn-outline-primary:not(:disabled):not(.disabled).active,
    .btn-outline-primary:not(:disabled):not(.disabled):active,
    .show > .btn-outline-primary.dropdown-toggle
    {
        color: rgba(0, 61, 126, .85);
        background-color: #ffffff;
        border-color: #FFFFFF;
        opacity: 0.75;

    }
    #ol-map-site_map .ol-zoom {
        background-color: rgba(0, 61, 126, .85) !important;
    }
    #ol-map-site_map .ol-zoom-out {
        background-color: rgba(0, 61, 126, .85) !important;
    }
    /*
    #ol-map-site_map .ol-zoom-in {
        margin-top: 200px !important;
    }
    #ol-map-site_map .ol-zoom-out {
        margin-top: 240px !important;
    }
    */
    .layer_dropdown > button {
        background-color: rgba(0, 61, 126, .85);
        border-color: #FFFFFF;
        opacity: 0.75;
    }

    .layer_dropdown > .btn-secondary:hover,
    .layer_dropdown > .btn-secondary:focus,
    .layer_dropdown > .btn-secondary:active {
        color: rgba(0, 61, 126, .85);
        background-color: #FFFFFF;
        opacity: 0.75;
    }

</style>
<style scoped>
    .wrapper {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: stretch;
        perspective: 1500px;
    }

    #sidebar {
        min-width: 300px;
        max-width: 300px;
        background: #7386D5;
        color: #fff;
        transition: all 0.6s cubic-bezier(0.945, 0.020, 0.270, 0.665);
        transform-origin: bottom left;
    }

    #sidebar.active {
        margin-left: -300px;
        transform: rotateY(100deg);
    }

    #sidebar .sidebar-header {
        padding: 20px;
        background: #6d7fcc;
    }

    #sidebar ul.components {
        padding: 20px 0;
        border-bottom: 1px solid #47748b;
    }

    #sidebar ul p {
        color: #fff;
        padding: 10px;
    }

    #sidebar ul li a {
        padding: 10px;
        font-size: 1.1em;
        display: block;
    }
    #sidebar ul li a:hover {
        color: #7386D5;
        background: #fff;
    }

    #sidebar ul li.active > a, a[aria-expanded="true"] {
        color: #fff;
        background: #6d7fcc;
    }

    #sidebarCollapse {
        width: 40px;
        height: 40px;
        background: #f5f5f5;
    }

    #sidebarCollapse span {
        width: 80%;
        height: 2px;
        margin: 0 auto;
        display: block;
        background: #555;
        transition: all 0.8s cubic-bezier(0.810, -0.330, 0.345, 1.375);
    }
    #sidebarCollapse span:first-of-type {
        /* rotate first one */
        transform: rotate(45deg) translate(2px, 2px);
    }
    #sidebarCollapse span:nth-of-type(2) {
        /* second one is not visible */
        opacity: 0;
    }
    #sidebarCollapse span:last-of-type {
        /* rotate third one */
        transform: rotate(-45deg) translate(1px, -1px);
    }
    #sidebarCollapse.active span {
        /* no rotation */
        transform: none;
        /* all bars are visible */
        opacity: 1;
        margin: 5px auto;
    }
    #sidebarCollapse {
        position: relative;
        z-index: 1000;
        top: 7em;
        left: .75em;
    }
    #content {
        width: 100%;
        min-height: 100vh;
        transition: all 0.3s;
    }

    .sidebar-opacity {
        opacity: 0.9;
    }
    @media (max-width: 768px) {
        #sidebar {
            margin-left: -300px;
        }
        #sidebar.active {
            margin-left: 0;
        }
        #sidebar.active {
            margin-left: 0;
            transform: none;
        }
        #sidebarCollapse span:first-of-type,
        #sidebarCollapse span:nth-of-type(2),
        #sidebarCollapse span:last-of-type {
            transform: none;
            opacity: 1;
            margin: 5px auto;
        }
        #sidebarCollapse.active span {
            margin: 0 auto;
        }
        #sidebarCollapse.active span:first-of-type {
            transform: rotate(45deg) translate(2px, 2px);
        }
        #sidebarCollapse.active span:nth-of-type(2) {
            opacity: 0;
        }
        #sidebarCollapse.active span:last-of-type {
            transform: rotate(-45deg) translate(1px, -1px);
        }
        /*#sidebarCollapse span {
            display: none;
        }*/
    }
    #mq-detector {
        visibility: hidden;
    }
</style>
