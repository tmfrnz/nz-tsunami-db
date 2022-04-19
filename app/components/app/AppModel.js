define([
	'jquery', 'underscore', 'backbone'
], function($,_, Backbone
) {

	var AppModel = Backbone.Model.extend({
		initialize : function(options){
			this.options = options || {};

      this.set("appConfigLoaded", false)
      this.set("configsLoaded",false)
      this.set("recordsLoaded",false)
      this.set("sourcesLoaded",false)
      this.set("referencesLoaded",false)
      this.set("recordsConfigured",false)
      this.set("recordsUpdated",false)
      this.set("sourcesConfigured",false)
      this.set("sourcesUpdated",false)
      this.set("pagesConfigured",false)
      this.set("referencesConfigured",false)
      this.set("columnsConfigured",false)
      this.set("columnsInitialised",false)
      this.set("sourceColumnsConfigured",false)
      this.set("sourceColumnsInitialised",false)
      this.set("mapConfigured",false)
      this.set("lastDBRoute",{
        route: "db",
        path: ""
      })
      this.set("shareToggled",false)

      var that = this


      /// read global configuration file
      $.ajax({
        dataType:"json",
        url: this.attributes.baseurl +  this.attributes.configFile,
        success: function(json) {
//          console.log("... success loading app config")
          that.setConfig(json)
//          console.log("loading terms")
          $.ajax({
            dataType:"json",
            url: that.attributes.baseurl +  that.attributes.config.labels,
            success: function(json) {
//              console.log("... success loading terms")
              that.setLabels(json)
            },
            error: function(){
              console.log("error loading terms config")
            }
          })
        },
        error: function(){
          console.log("error loading app config")
        }
      })


			// debug
			//console.log.log('%cVersion: ', systemapic.style, systemapic.version);
		},
    setConfig:function(data) {
      this.set('config',data)
    },
    getConfig:function() {
      return this.attributes.config
    },
    setLabels:function(data) {
      this.set('labels',data)
    },
    getLabels:function() {
      return this.attributes.labels
    },
    // config

    loadConfigs : function(){
      var that = this
      $.when(
        $.ajax({
          dataType: "json",
          url: this.attributes.baseurl + this.attributes.config.layersConfig
        }),
        $.ajax({
          dataType: "json",
          url: this.attributes.baseurl + this.attributes.config.mapConfig
        }),
        $.ajax({
          dataType: "json",
          url: this.attributes.baseurl + this.attributes.config.columns
        }),
        $.ajax({
          dataType: "json",
          url: this.attributes.baseurl + this.attributes.config.columnGroups
        }),
        $.ajax({
          dataType: "json",
          url: this.attributes.baseurl + this.attributes.config.sourceColumns
        }),
        $.ajax({
          dataType: "json",
          url: this.attributes.baseurl + this.attributes.config.sourceColumnGroups
        })
      ).then(function(
				layers_json,
				map_json,
				col_json,
				colGroup_json,
				sourceCol_json,
				sourceColGroup_json
			) {
          //console.log("... success loading layer config")
          that.set("layersConfig",layers_json[0])
          that.set("mapConfig",map_json[0])
          that.set("columnConfig",col_json[0])
          that.set("columnGroupConfig",colGroup_json[0])
          that.set("sourceColumnConfig",sourceCol_json[0])
          that.set("sourceColumnGroupConfig",sourceColGroup_json[0])
          that.set("configsLoaded",true)
      }, function(){
        console.log("error loading configs")
      })
    },
    configsLoaded : function(){
      return this.attributes.configsLoaded
    },

    dataReady : function(){
      return this.get('recordsLoaded')
        && this.get('sourcesLoaded')
        && this.get('referencesLoaded')
    },

    // ROUTE VALIDATION ===================================================================

    validateRouter : function(callback){
      callback(true)
    },


    getViews:function(){
      return this.attributes.views
    },


    // APP STATE ===================================================================
    getRouter:function(){
      return this.attributes.router
    },
    getBaseURL: function(){
      return this.attributes.baseurl
    },
		setRoute : function(route) {
			console.log('AppModel.setRoute')
      if (route.route === "db") {
        this.set("lastDBRoute",route)
      }
			this.set('route',{
				route : route.route,
				path : route.path,
				query : route.query
			});
			return this;
		},
		getRoute : function (){
			return this.attributes.route.route
		},
		getPath : function (){
			return this.attributes.route.path
		},
		getLastDBPath : function (){
			return this.attributes.lastDBRoute.path
		},
		getLastDBRoute : function (){
			return this.attributes.lastDBRoute
		},
		getQuery : function (){
			return _.clone(this.attributes.route.query)
		},
    getRecordQuery:function(){
      // prep column query
      var query = {}
      _.each(this.getQuery(),function(val,key){
        if (key.startsWith("q_")){
          query[key.replace("q_","")] = val
        }
      })
      return query
    },
    getSourceQuery:function(){
      // prep column query
      var query = {}
      _.each(this.getQuery(),function(val,key){
        if (key.startsWith("qs_")){
          query[key.replace("qs_","")] = val
        }
      })
      return query
    },
    getGeoQuery:function(){
      var latColumn = this.attributes.columnCollection.get("lat")
      var lngColumn = this.attributes.columnCollection.get("lng")
      var recordQuery = this.getRecordQuery()

      return {
        north:recordQuery[latColumn.getQueryColumnByType("max")],
        south:recordQuery[latColumn.getQueryColumnByType("min")],
        east:recordQuery[lngColumn.getQueryColumnByType("max")],
        west:recordQuery[lngColumn.getQueryColumnByType("min")]
      }
    },
    getOutType: function(){
      return this.attributes.route.query.out
    },
    getFilterType: function(){
      return this.attributes.route.query.filter
    },
    getOutMapType: function(){
      return this.attributes.route.query.map
    },
    getOutMapShowRecords: function(){
      return this.attributes.route.query.maprecords
    },
    getOutMapShowSources: function(){
      return this.attributes.route.query.mapsources
    },
    getOutColor: function(){
      return this.attributes.route.query.colorby
    },
    getOutSourceColor: function(){
      return this.attributes.route.query.colorsourceby
    },
    getOutPlotColumns: function(){
      return this.attributes.route.query.plot
    },
    getOutTableSortColumn: function(){
      return this.attributes.route.query.sortcol
    },
    getOutTableSortOrder: function(){
      return this.attributes.route.query.sortorder
    },
    getOutSourceTableSortColumn: function(){
      return this.attributes.route.query.sourcesortcol
    },
    getOutSourceTableSortOrder: function(){
      return this.attributes.route.query.sourcesortorder
    },


		appConfigured : function(){
      return typeof this.attributes.config !== 'undefined'
          && typeof this.attributes.labels !== 'undefined'
    },

    isComponentActive : function(componentId) {

      // active components by route
      var routeConditions = {
        page:["#page"],
        db:["#out"]
      }

      // component conditions
      var componentConditions = {
        '#record': this.getRoute() === "db" && this.getPath() !== "" && !this.getPath().startsWith('s'),
        '#source': this.getRoute() === "db" && this.getPath() !== "" && this.getPath().startsWith('s'),
        '#filters': this.getRoute() === "db" && this.getPath() === "" && this.getFilterType() !== 's',
        '#source-filters': this.getRoute() === "db" && this.getPath() === "" && this.getFilterType() === 's'
      }

      return (typeof routeConditions[this.getRoute()] !== 'undefined' && routeConditions[this.getRoute()].indexOf(componentId) >=0)
          || (typeof componentConditions[componentId] !== 'undefined' && componentConditions[componentId])

    },

    setRecordsUpdated: function(){
      return this.set('recordsUpdated', Date.now())
    },
    getRecordsUpdated: function(){
      return this.attributes.recordsUpdated
    },
    setSourcesUpdated: function(){
      return this.set('sourcesUpdated', Date.now())
    },
    getSourcesUpdated: function(){
      return this.attributes.sourcesUpdated
    },

    // ROUTECONFIG ===================================================================
    getRouteConfig:function(routeId){
      return typeof routeId !== 'undefined' ? _.findWhere(this.attributes.config.routes,{id:routeId}) : this.getActiveRouteConfig()
    },

    getActiveRouteConfig:function(){

      var route = this.getRoute()

      if (_.contains(_.pluck(this.attributes.config.routes,'id'), route)) {
        return _.findWhere(this.attributes.config.routes,{id:route})
      } else {
        return ''
      }

    },





    // LAYERS ===================================================================


    //state
    layersLoading : function(){
      return typeof this.attributes.layerCollection === 'undefined'
        ? true
        : this.attributes.layerCollection.isLoading()
    },
    layerLoaded : function(layerId){
      return this.getLayers().get(layerId).isLoaded()
    },
    layersConfigLoaded : function(){
      return typeof this.attributes.layersConfig !== 'undefined'
    },
    layersConfigured : function(val){
      if (typeof val !== 'undefined') {
        this.set('layersConfigured',val)
      } else {
        return this.attributes.layersConfigured
      }
    },



    getLayersConfig : function(){
      return this.attributes.layersConfig
    },

		getLayers : function() {
			return this.attributes.layerCollection;
		},

		setLayers : function(layers) {
			this.set('layerCollection',layers);
			return this;
		},
    getLayer : function(layerId){
      return this.getLayers().get(layerId)
    },

    setActiveLayersFromRoute : function() {
			this.attributes.layerCollection.setActive(this.getActiveLayerIds());
			return this;
		},
    setDefaultLayersFromRoute : function() {
			this.attributes.layerCollection.setDefault(this.getLayerIdsByRoute(this.getActiveRouteConfig().id));
			return this;
		},

    // active on map
		getActiveLayerIds : function() {

      // active layers from query
			var query = this.attributes.route.query
      var layers = (typeof query.layers !== 'undefined') ? query.layers : [];

      return layers
		},


    getLayerIdsByRoute:function(routeId){
      var routeConfig = typeof routeId !== 'undefined'
      ? this.getRouteConfig(routeId)
      : this.getActiveRouteConfig()

      var routeLayers = []
      if (typeof routeConfig.layers !== 'undefined' || routeConfig.layers === '') {
        routeLayers = $.isArray(routeConfig.layers)
          ? routeConfig.layers
          : typeof routeConfig.layers === 'string'
            ? _.map(routeConfig.layers.split(','),function(layerid){return layerid.trim()})
            : []
      }

      return routeLayers
    },
    getOptionalLayerIdsByRoute:function(routeId){
      var routeConfig = typeof routeId !== 'undefined'
      ? this.getRouteConfig(routeId)
      : this.getActiveRouteConfig()

      var routeLayers = []
      if (typeof routeConfig.layers_optional !== 'undefined' || routeConfig.layers_optional === '') {
        routeLayers = $.isArray(routeConfig.layers_optional)
          ? routeConfig.layers_optional
          : typeof routeConfig.layers_optional === 'string'
            ? _.map(routeConfig.layers_optional.split(','),function(layerid){return layerid.trim()})
            : []
      }

      return routeLayers
    },









    // MAP ========================================================================


    getMapConfig : function(){
      return this.attributes.mapConfig
    },

    mapReady : function(){
      return this.appConfigured()
        && this.layersConfigured()
        && this.mapConfigured()
        && !this.layersLoading();
    },
    mapConfigured : function(bool) {
      if (typeof bool !== "undefined") {
        this.set('mapConfigured', bool)
      } else {
        return this.attributes.mapConfigured
      }
//      return typeof this.attributes.views.map !== 'undefined' && this.attributes.views.map.model.mapConfigured()
    },

		getActiveMapview : function(raw){
      raw = typeof raw !== 'undefined' ? raw : false
      var view = typeof this.attributes.route.query.view !== 'undefined'
        ? this.attributes.route.query.view
        : 'default'
      return raw ? view : this.toMapviewObject(view)
    },
    toMapviewString : function(view) {
      return view.center.lat
        + '|'  + view.center.lng
        + '|'  + view.zoom
        + '||' + view.dimensions[0]
        + '|'  + view.dimensions[1]
    },
    toMapviewObject : function(view){

			if (typeof view !== 'undefined') {

        // test XYZ view
				var view_split = view.split('||');

        if (view_split.length === 2) {

          var viewXYZ = view_split[0].split('|');
          var dimensions = view_split[1].split('|');

          if (viewXYZ.length === 3 && dimensions.length === 2) {

            return {
              center : {lat:parseFloat(viewXYZ[0]),lng:parseFloat(viewXYZ[1])},
              zoom : parseFloat(viewXYZ[2]),
              dimensions : [parseFloat(dimensions[0]),parseFloat(dimensions[1])]
            }
          } else {
            return null
          }
        } else {
          // test bounds view
          view_split = view.split('|')
          if (view_split.length === 4) {
            return {
              south: view_split[0],
              west:  view_split[1],
              north: view_split[2],
              east:  view_split[3]
            }
          } else {
            // try predefined view
            return view
          }

        }

			} else {
				return null;
			}
		},

    getMapviewForRoute:function(raw){
      raw = typeof raw !== 'undefined' ? raw : false
      var route = this.getActiveRouteConfig()
      var view
      switch (route.id) {
        case 'explore' :
            view = route.view
          break
        default :
            view = this.getActiveMapview(true) // raw
          break
      }
      return raw ? view : this.toMapviewObject(view)
    },



    // Records ========================================================================
    getRecord: function(recordid){
      return this.attributes.recordCollection.get(recordid)
    },
    setRecords: function(collection){
      this.set('recordCollection',collection)
    },
    // returns collection
    getRecords : function(){
      return this.attributes.recordCollection
    },
    getSelectedRecord:function(){
      return this.getRecord(this.getSelectedRecordId())
    },
    getSelectedRecordId:function(){
      return (this.attributes.route.route === 'db' && this.attributes.route.path !== "") && this.attributes.route.path.startsWith('r')
        ? this.attributes.route.path.replace('r', '')
        : ''
    },
    recordsConfigured : function(val){
      if (typeof val !== 'undefined') {
        this.set('recordsConfigured',val)
      } else {
        return this.attributes.recordsConfigured
      }
    },
    // Sources ========================================================================
    getSource: function(id){
      return this.attributes.sourceCollection.get(id)
    },
    setSources: function(collection){
      this.set('sourceCollection',collection)
    },
    // returns collection
    getSources : function(){
      return this.attributes.sourceCollection
    },
    getSelectedSource:function(){
      return this.getSource(this.getSelectedSourceId())
    },
		// path is "s[id]", e.g. s123
    getSelectedSourceId:function(){
      return (this.attributes.route.route === 'db' && this.attributes.route.path !== "") && this.attributes.route.path.startsWith('s')
        ? this.attributes.route.path.replace('s', '')
        : ''
    },
    sourcesConfigured : function(val){
      if (typeof val !== 'undefined') {
        this.set('sourcesConfigured',val)
      } else {
        return this.attributes.sourcesConfigured
      }
    },
    // // Proxies ========================================================================
    // getProxy: function(id){
    //   return this.attributes.proxyCollection.get(id)
    // },
    // setProxies: function(collection){
    //   this.set('proxyCollection',collection)
    // },
    // // returns collection
    // getProxies : function(){
    //   return this.attributes.proxyCollection
    // },
    // proxiesConfigured : function(val){
    //   if (typeof val !== 'undefined') {
    //     this.set('proxiesConfigured',val)
    //   } else {
    //     return this.attributes.proxiesConfigured
    //   }
    // },
    // References ========================================================================
    getReference: function(id){
      return this.attributes.referenceCollection.get(id)
    },
    setReferences: function(collection){
      this.set('referenceCollection',collection)
    },
    // returns collection
    getReferences: function(){
      return this.attributes.referenceCollection
    },
    referencesConfigured : function(val){
      if (typeof val !== 'undefined') {
        this.set('referencesConfigured',val)
      } else {
        return this.attributes.referencesConfigured
      }
    },



    // Columns ========================================================================

    columnsConfigured : function(val){
      if (typeof val !== 'undefined') {
        this.set('columnsConfigured',val)
      } else {
        return this.attributes.columnsConfigured
      }
    },
    columnsInitialised : function(val){
      if (typeof val !== 'undefined') {
        this.set('columnsInitialised',val)
      } else {
        return this.attributes.columnsInitialised
      }
    },
    getOutColorColumn: function(){
			return this.attributes.columnCollection.get(this.getOutColor())
    },
    setColumns: function(collection){
      this.set('columnCollection',collection)
    },
    setColumnGroups: function(collection){
      this.set('columnGroupCollection',collection)
    },
    getColumns:function(){
      return this.attributes.columnCollection
    },
    getColumnGroups:function(){
      return this.attributes.columnGroupCollection
    },

    // Source Columns ========================================================================

    sourceColumnsConfigured : function(val){
      if (typeof val !== 'undefined') {
        this.set('sourceColumnsConfigured',val)
      } else {
        return this.attributes.sourceColumnsConfigured
      }
    },
    sourceColumnsInitialised : function(val){
      if (typeof val !== 'undefined') {
        this.set('sourceColumnsInitialised',val)
      } else {
        return this.attributes.sourceColumnsInitialised
      }
    },
    getOutColorSourceColumn: function(){
      return this.attributes.sourceColumnCollection.get(this.getOutSourceColor())
    },
    setSourceColumns: function(collection){
      this.set('sourceColumnCollection',collection)
    },
    setSourceColumnGroups: function(collection){
      this.set('sourceColumnGroupCollection',collection)
    },
    getSourceColumns:function(){
      return this.attributes.sourceColumnCollection
    },
    getSourceColumnGroups:function(){
      return this.attributes.sourceColumnGroupCollection
    },

    // PAGES ===================================================================
    pagesConfigured : function(val){
      if (typeof val !== 'undefined') {
        this.set('pagesConfigured',val)
      } else {
        return this.attributes.pagesConfigured
      }
    },
    setPages : function(collection){
      this.set('pages',collection)
    },
    getPages : function(){
      return this.attributes.pages
    },
    getActivePage:function(){
      if (this.getRoute() === 'page'){
        return this.attributes.pages.findWhere({id:this.getPath()})
      } else {
        return null
      }
    },
    getPageAnchor:function(){
      if (typeof this.getQuery().anchor !== 'undefined'){
        return this.getQuery().anchor
      } else {
        return ""
      }
    },

	});



	return AppModel;

});
