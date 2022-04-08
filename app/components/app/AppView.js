define([
  'jquery','underscore','backbone',
  'domReady!',
  'jquery.deparam',
  'jquery.csv',
  './nav/NavView', './nav/NavModel',
  './filters/FiltersView', './filters/FiltersModel',
  './record/RecordView', './record/RecordViewModel',
  './out/OutView', './out/OutModel',
  './page/PageView', './page/PageViewModel',
  'models/PageCollection',  'models/PageModel',
  'models/RecordCollection',  'models/RecordModel',
  'models/ProxyCollection',
  'models/ReferenceCollection',
  'models/ColumnCollection',
  'models/ColumnGroupCollection',
  'models/LayerCollection',
  'models/LayerModelGeoJson',
  'models/LayerModelMapboxTiles',
  'models/LayerModelEsriBaselayer',
  // 'ga',
  'text!./app.html',
  'text!./app_share.html'
], function(
  $, _, Backbone,
  domReady,
  deparam,
  $csv,
  NavView, NavModel,
  FiltersView, FiltersModel,
  RecordView, RecordViewModel,
  OutView, OutModel,
  PageView, PageViewModel,
  PageCollection, PageModel,
  RecordCollection,RecordModel,
  ProxyCollection,
  ReferenceCollection,
  ColumnCollection,
  ColumnGroupCollection,
  LayerCollection,
  LayerModelGeoJson,
  LayerModelMapboxTiles,
  LayerModelEsriBaselayer,
  // ga,
  template,
  templateShare
){

  var AppView = Backbone.View.extend({
    el: $("#application"),
    // view events upstream to pass to router if needed ///////////////////////////////////////////////////////
    events : {
      "click .close-share" : "closeShare",

      // general navigation events
      resetApp : "resetApp",
      homeLink : "homeLink",
      navLink : "navLink",

      // own events
      recordsPopup: "recordsPopup",

      // filter events
      setFilterView: "setFilterView",
      recordQuerySubmit : "recordQuerySubmit",
      sourceQuerySubmit : "sourceQuerySubmit",

      // record events
      recordClose : "recordClose",

      // out view events
      setOutView: "setOutView",
      recordSelect: "recordSelect",
      sourceSelect: "sourceSelect",
      recordMouseOver: "recordMouseOver",
      recordMouseOut: "recordMouseOut",
      colorColumnChanged: "colorColumnChanged",
      sourceColorColumnChanged: "sourceColorColumnChanged",
      plotColumnsSelected: "plotColumnsSelected",

      // map view events
      mapConfigured: "mapConfigured",
      mapViewUpdated: "mapViewUpdated",

      mapLayerMouseOver: "mapLayerMouseOver",
      mapLayerMouseOut: "mapLayerMouseOut",

      pointLayerClick: "pointLayerClick",
      pointLayerMouseOver: "pointLayerMouseOver",
      pointLayerMouseOut: "pointLayerMouseOut",

      mapLayerSelect: "mapLayerSelect",
      mapPopupClosed:"mapPopupClosed",
      mapOptionToggled:"mapOptionToggled",

      geoQuerySubmit:"geoQuerySubmit",
      geoQueryDelete:"geoQueryDelete",

      // table view events
      sortRecords:"sortRecords",
      sortSources:"sortSources",

      // page view events
      pageClose:"pageClose"


    }, // end view events


    initialize : function(){
      console.log('appview.initialize')

      //the layer model types
      this.layerModels = {
        geojson:  LayerModelGeoJson,
        mapbox:   LayerModelMapboxTiles,
        esribase: LayerModelEsriBaselayer
      }

      // shortcut
      this.views = this.model.getViews()

      // render app once config is loaded
      var that = this
      waitFor(
        //when
        function(){ return that.model.appConfigured() },
        //then
        function(){ that.render() } // render components
      )
      waitFor(
        function(){ return that.model.mapReady() },
        function(){ that.$el.removeClass('map-loading') }
      )
      waitFor(
        function(){ return that.model.dataReady() },
        function(){ that.$el.removeClass('loading') }
      )

      // model change events
      this.listenTo(this.model, "change:route", this.routeChanged);
      this.listenTo(this.model, "change:shareToggled",this.renderShare)
     },

    // render components
    render: function(){

      this.$el.html(_.template(template)({t:this.model.getLabels()}))
      this.update()

      // load additional config files
      this.model.loadConfigs()
      var that = this
      waitFor(
        //when
        function(){ return that.model.configsLoaded() },
        //then
        function(){
          that.initColumns()
          that.initSourceColumns()
        }
      )
      waitFor(
        //when
        function(){
          return that.model.configsLoaded()
            && that.model.columnsInitialised()
            && that.model.sourceColumnsInitialised()
        },
        //then
        function(){
          that.loadRecords()
          that.loadSources()
          that.loadReferences()
          that.configureLayers()
        }
      )
      waitFor(
        //when
        function(){ return that.model.columnsConfigured() },
        //then
        function(){ that.configurePages() }
      )
      waitFor(
        function(){ return that.model.layersConfigured() && that.model.recordsConfigured() && that.model.sourcesConfigured() },
        //then
        function(){
          that.configureColumns()
          that.configureSourceColumns()
        }
      )
    },
    update: function(){

      var that = this
      this.model.validateRouter(function(validated){
        if (validated) {
console.log("AppView.update", 0);
window.timeFromUpdate = Date.now()
          that.$el.addClass('updating')
          // init/update components
          that.updateNav()
          that.updateFilters()
          that.updateSourceFilters()
          that.updateRecord()
          that.updateSource()
          that.updateOut()
          that.updatePage()
          that.$el.removeClass('updating')
console.log("AppView.update 2", Date.now() - window.timeFromUpdate);
        }

      })

      return this
    },

    updateRecordCollections:function(){
      var that = this
      waitFor(
        function(){
          return that.model.recordsConfigured()
            && that.model.columnsConfigured()
            && that.model.sourcesConfigured()
            && that.model.sourceColumnsConfigured()
        },
        function(){
console.log('updateRecordCollections 1', Date.now() - window.timeFromUpdate, that.model.getSelectedRecordId())
          // check updated
          var oldQuery = that.model.getRecords().query
          var newQuery = that.model.getRecordQuery()
          var recordSelected = that.model.getSelectedRecord();
          var recordSelectedId = that.model.getSelectedRecordId()
          var sourceSelectedId = that.model.getSelectedSourceId()
          var oldSourceQuery = that.model.getSources().query
          var newSourceQuery = that.model.getSourceQuery()
          var recordsQueryChanged = !that.model.getRecordsUpdated() || !_.isEqual(oldQuery, newQuery);
          var sourcesQueryChanged = !that.model.getSourcesUpdated() || !_.isEqual(oldSourceQuery, newSourceQuery);
          // console.log('updateRecordCollections recordsQueryChanged', recordsQueryChanged)
          // console.log('updateRecordCollections sourcesQueryChanged', sourcesQueryChanged)
          // TODO figure out a better way to update both with respect to each other
          // 1. figure out active records without updating
          var activeRecords = that.model.getRecords().byQuery(newQuery)
          var activeRecordSourceIds = _.reduce(
            activeRecords.models,
            function(memo, record) {
              return _.union(memo, [parseInt(record.get('trigger_event_id'))]);
            },
            [],
          );
          // 2. figure out active sources without updating
          var activeSources = that.model.getSources().byQuery(newSourceQuery)
          var activeSourceIds = _.reduce(
            activeSources.models,
            function(memo, source) {
              return _.union(memo, [source.get('id').toString()]);
            },
            [],
          );
          // 3. then update records with active sources
          // filter sources by active/filtered records
          that.model.getRecords().updateRecords({
            query: newQuery,
            queryTemp: { trigger_event_id: activeSourceIds },
            selectedId: recordSelectedId,
            relatedSelected: {
              column: 'trigger_event_id',
              value: sourceSelectedId !== '' ? sourceSelectedId.toString() : null,
            },
            colorColumn: that.model.getOutColorColumn()
          })
          // 4. then update sources with active records
          // filter sources by active/filtered records
          that.model.getSources().updateRecords({
            query: newSourceQuery,
            queryTemp: { id: activeRecordSourceIds },
            selectedId: sourceSelectedId,
            relatedSelected: {
              column: 'id',
              value: recordSelected ? recordSelected.get('trigger_event_id') : null,
            },
            colorColumn: that.model.getOutColorSourceColumn()
          })

          // move to front
          that.model.getSources().moveRecordToFront()
          that.model.getRecords().moveRecordToFront()

          // trigger updated
          if (recordsQueryChanged || sourcesQueryChanged) {
            // if (window.__ga__ && ga.loaded) { ga('send', 'event', 'Filter', JSON.stringify(newQuery), '')}
            that.model.setRecordsUpdated()
            that.model.setSourcesUpdated()
          }
console.log('updateRecordCollections 2', Date.now() - window.timeFromUpdate)
        }
      )
    },


    updateNav : function(){

      var componentId = '#nav'
        var that = this
        waitFor(
          function(){ return that.model.configsLoaded() },
          function(){
console.log('updateNav', Date.now() - window.timeFromUpdate)
            that.views.nav = that.views.nav || new NavView({
              el:that.$(componentId),
              model:new NavModel({
                labels:that.model.getLabels(),
                navItems:that.model.getConfig().navitems,
                route:that.model.getRoute(),
                path:that.model.getPath()
              })
            });

            that.views.nav.model.set({
              route:that.model.getRoute(),
              path:that.model.getPath()
            })
          }
        )
    },

    updateFilters : function(){

      var componentId = '#filters'
      if (this.$(componentId).length > 0) {

        var that = this
        waitFor(
          function(){ return that.model.columnsConfigured() },
          function(){
console.log('updateFilters', Date.now() - window.timeFromUpdate)
            that.views.filters = that.views.filters || new FiltersView({
              el:that.$(componentId),
              model:new FiltersModel({
                labels:that.model.getLabels(),
                recQuery : that.model.getRecordQuery(),
                columnCollection: that.model.get("columnCollection"),
                columnGroupCollection: that.model.get("columnGroupCollection"),
                type: 'r',
                otherType: 's',
              })
            });
            console.log('updateFilters 2', Date.now() - window.timeFromUpdate)

            if (that.model.isComponentActive(componentId)) {
              that.views.filters.model.setActive()
              that.views.filters.model.set({
                recQuery : that.model.getRecordQuery(),
              })
            } else {
              that.views.filters.model.setActive(false)
            }

          }
        )
      }
    },
    updateSourceFilters : function(){

      var componentId = '#source-filters'
      if (this.$(componentId).length > 0) {

        var that = this
        waitFor(
          function(){ return that.model.sourceColumnsConfigured() },
          function(){
console.log('updateSourceFilters', Date.now() - window.timeFromUpdate)
            that.views.sourcefilters = that.views.sourcefilters || new FiltersView({
              el:that.$(componentId),
              model:new FiltersModel({
                labels:that.model.getLabels(),
                recQuery : that.model.getSourceQuery(),
                columnCollection: that.model.get("sourceColumnCollection"),
                columnGroupCollection: that.model.get("sourceColumnGroupCollection"),
                type: 's',
                otherType: 'r',
              })
            });
            console.log('updateSourceFilters 2', Date.now() - window.timeFromUpdate)

            if (that.model.isComponentActive(componentId)) {
              that.views.sourcefilters.model.setActive()
              that.views.sourcefilters.model.set({
                recQuery : that.model.getSourceQuery()
              })
            } else {
              that.views.sourcefilters.model.setActive(false)
            }

          }
        )
      }
    },
    updateRecord : function(){

      var componentId = '#record'
      if (this.$(componentId).length > 0) {

        var that = this
        waitFor(
          function(){
            return that.model.recordsConfigured()
              && that.model.columnsConfigured()
              && that.model.referencesConfigured()
          },
          function(){
console.log('updateRecord', Date.now() - window.timeFromUpdate)

            that.views.record = that.views.record || new RecordView({
              el:that.$(componentId),
              model:new RecordViewModel({
                labels:that.model.getLabels(),
                columnCollection: that.model.get("columnCollection"),
                columnGroupCollection: that.model.get("columnGroupCollection"),
                type: 'record'
              })
            });

            if (that.model.isComponentActive(componentId)) {
              that.views.record.model.setActive()
              that.views.record.model.set({
                record : that.model.getSelectedRecord()
              })
            } else {
              that.views.record.model.setActive(false)
            }

          }
        )
      }
    },
    updateSource : function(){

      var componentId = '#source'
      if (this.$(componentId).length > 0) {

        var that = this
        waitFor(
          function(){
            return that.model.sourcesConfigured()
              && that.model.sourceColumnsConfigured()
              && that.model.referencesConfigured()
          },
          function(){
console.log('updateSource', Date.now() - window.timeFromUpdate)

            that.views.source = that.views.source || new RecordView({
              el:that.$(componentId),
              model:new RecordViewModel({
                labels:that.model.getLabels(),
                columnCollection: that.model.get("sourceColumnCollection"),
                columnGroupCollection: that.model.get("sourceColumnGroupCollection"),
                type: 'source'
              })
            });

            if (that.model.isComponentActive(componentId)) {
              that.views.source.model.setActive()
              that.views.source.model.set({
                record : that.model.getSelectedSource()
              })
            } else {
              that.views.source.model.setActive(false)
            }

          }
        )
      }
    },
    updateOut : function(){
      var componentId = '#out'
      if (this.$(componentId).length > 0) {
        // set records
        var that = this
        waitFor(
          function(){
            return that.model.recordsConfigured()
              && that.model.sourcesConfigured()
              && that.model.columnsConfigured()
              && that.model.sourceColumnsConfigured()
              && that.model.referencesConfigured()
          },
          function(){
console.log('updateOut', Date.now() - window.timeFromUpdate)
// console.log("updateOut", that.model.getSources())

            that.views.out = that.views.out || new OutView({
              el:that.$(componentId),
              model:new OutModel({
                labels:    that.model.getLabels(),
                columnCollection: that.model.getColumns(),
                columnGroupCollection: that.model.getColumnGroups(),
                sourceColumnCollection: that.model.getSourceColumns(),
                sourceColumnGroupCollection: that.model.getSourceColumnGroups(),
                layerCollection: that.model.getLayers(),
                recordCollection: that.model.getRecords(),
                sourceCollection: that.model.getSources(),
                mapConfig: that.model.getMapConfig(),
                recordsUpdated:that.model.getRecordsUpdated(),
                sourcesUpdated:that.model.getSourcesUpdated(),
                recordsPopup:[],
                recordMouseOverId :"",
                queryLength:0,
                geoQuery:{},
                paths:{
                  records:that.model.get("config").records.path,
                  sources:that.model.get("config").sources.path,
                  references:that.model.get("config").references.path
                }
              })
            })
            if (that.model.isComponentActive(componentId)) {

              if (that.model.getOutType() === 'map' && !that.model.mapReady()) {
                that.$el.addClass('map-loading')
                waitFor(
                  function(){
                    return that.model.mapReady()
                  },
                  function(){
                    that.$el.removeClass('map-loading')
                  }
                )
              }

//              that.views.out.model.setActive()
              that.views.out.model.set({
                active:           true,
                outType:          that.model.getOutType(),
                mapView:          that.model.getActiveMapview(),
              })

              // update Records
              that.updateRecordCollections()

              that.views.out.model.set({
                outMapType:           that.model.getOutMapType(),
                queryLength:          Object.keys(that.model.getRecordQuery()).length,
                sourceQueryLength:    Object.keys(that.model.getSourceQuery()).length,
                geoQuery:             that.model.getGeoQuery(),
                recordsUpdated :      that.model.getRecordsUpdated(),
                sourcesUpdated :      that.model.getSourcesUpdated(),
                recordId :            that.model.getSelectedRecordId(),
                sourceId :            that.model.getSelectedSourceId(),
                outColorColumn:       that.model.getOutColorColumn(),
                outPlotColumns:       that.model.getOutPlotColumns(),
                tableSortColumn:      that.model.getOutTableSortColumn(),
                tableSortOrder:       that.model.getOutTableSortOrder(),
                outColorSourceColumn: that.model.getOutColorSourceColumn(),
                tableSourceSortColumn:that.model.getOutSourceTableSortColumn(),
                tableSourceSortOrder: that.model.getOutSourceTableSortOrder(),
              })

            } else {
              that.views.out.model.setActive(false)
            }

          }
        )

      }
    },
    updatePage : function(){
      var componentId = '#page'
      if (this.$(componentId).length > 0) {
        // set records
        var that = this
        waitFor(
          function(){ return that.model.pagesConfigured() },
          function(){
            that.views.page = that.views.page || new PageView({
              el:that.$(componentId),
              model:new PageViewModel({
                labels:that.model.getLabels(),
                pages: that.model.getPages()
              })
            })
            if (that.model.isComponentActive(componentId)) {

              that.views.page.model.setActive()
              that.views.page.model.set({
                pageId:that.model.getPath(),
                anchor:that.model.getPageAnchor()
              })
            } else {
              that.views.page.model.setActive(false)
              that.views.page.model.set({
                pageId:"",
                anchor:""
              })
            }

          }
        )

      }
    },







    configurePages : function(){
      var pagesCollection = new PageCollection([],{
          model:PageModel,
          labels:this.model.getLabels(),
          columnCollection: this.model.get("columnCollection"),
          columnGroupCollection: this.model.get("columnGroupCollection")
        })

      _.each(this.model.getConfig().navitems,function(item){
        if (!(item.type !== "page")) {
          pagesCollection.add(item)
        }
        if (item.type === "group") {
          _.each(item.navitems,function(childItem){
            if (!(childItem.type !== "page")) {
              pagesCollection.add(childItem)
            }
          })
        }
      })

      this.model.setPages(pagesCollection)
      this.model.pagesConfigured(true)
    },
    configureLayers : function(){

      // read layers
      var layersConfig = this.model.getLayersConfig()

      var collectionOptions = {
        baseurl : this.model.getBaseURL(),
        mapConfig: this.model.getMapConfig(),
        eventContext : this.$el
      }

      var layerCollection = new LayerCollection(
        null,
        collectionOptions
      )


      // get model types
      var models = _.chain(layersConfig).pluck('model').uniq().value()

      // build collection for all models
      _.each(models,function(model){
        layerCollection.add(
          new LayerCollection(
            _.filter(layersConfig,function(layer){
              return layer.model === model
            }),
            _.extend({},collectionOptions,{model: this.layerModels[model]})
          ).models
        )
      },this)
      this.model.setLayers(layerCollection)
      this.model.layersConfigured(true)
    },
    loadRecords : function(){
      console.log("loadRecords")
      var recordConfig = this.model.get("config").records
      var that = this
      if (typeof recordConfig !== "undefined") {
        $.ajax({
          headers: {
            Accept: 'text/csv',
            'Content-Type': 'text/csv'
          },
          dataType: "text",
          url: this.model.getBaseURL() + '/' + recordConfig.path,
          success: function(data) {
            that.model.set('recordsLoaded', true)
            var dataObjects = $.csv.toObjects(data);
            console.log("success loading records data")
            var records = {
              type: "FeatureCollection",
              features: dataObjects.map((d) => {
                return {
                  type: "Feature",
                  id: d.id,
                  geometry: isNumber(d.longitude) && isNumber(d.latitude)
                    ? {
                      type: "Point",
                      coordinates: [parseFloat(d.longitude), parseFloat(d.latitude)]
                    }
                    : null,
                  geometry_name: "geom",
                  properties: d,
                }
              }),
            }
            that.configureRecords(records)
          },
        error: function(xhr, status, error){
          console.log(status + '; ' + error);
              console.log("error loading records data")

          }
        });
      }
    },
    loadSources : function(){
      console.log("loadSources")
      var sourceConfig = this.model.get("config").sources
      var that = this
      if (typeof sourceConfig !== "undefined") {
        $.ajax({
          headers: {
            Accept: 'text/csv',
            'Content-Type': 'text/csv'
          },
          dataType: "text",
          url: this.model.getBaseURL() + '/' + sourceConfig.path,
          success: function(data) {
            that.model.set('sourcesLoaded', true)
            var dataObjects = $.csv.toObjects(data);
            console.log("success loading sources data")
            var sources = {
              type: "FeatureCollection",
              features: dataObjects.map((d) => {
                return {
                  type: "Feature",
                  id: d.id,
                  geometry: isNumber(d.longitude) && isNumber(d.latitude)
                    ? {
                      type: "Point",
                      coordinates: [parseFloat(d.longitude), parseFloat(d.latitude)]
                    }
                    : null,
                  geometry_name: "geom",
                  properties: d,
                }
              }),
            }
            that.configureSources(sources)
          },
        error: function(xhr, status, error){
          console.log(status + '; ' + error);
              console.log("error loading sources data")

          }
        });
      }
    },
    configureRecords : function(recordData) {
      var recordConfig = this.model.get("config").records
      if (typeof recordConfig !== "undefined") {
        console.log("configureRecords", recordData)

        var that = this
        waitFor(
          function(){ return that.model.layersConfigured() },
          //then
          function(){
            var recordCollection = new RecordCollection([],{
              config : recordConfig,
            })
            // store columns reference with record collection
            recordCollection.setColumns(that.model.getColumns())
            var record,layer
            _.each(recordData.features,function(feature){
              record = new RecordModel(feature.properties)
              record.set('type', 'record');
              // console.log("configureRecords - record", record)
              if (typeof feature.geometry !== "undefined" && feature.geometry !== null) {
                layer = new that.layerModels[recordConfig.model](
                  _.extend(
                    {},
                    recordConfig.layerOptions,
                    {
                      id:record.id,
                      eventContext : that.$el,
                      isRecordLayer:true
                    }
                  )
                )
                that.model.getLayers().add(layer)
                layer.setData({
                  geometry:feature.geometry,
                  type:feature.type,
                  properties:{id:record.id}
                })
                record.setLayer(layer)
              } else {
                record.setLayer(false)
              }
              recordCollection.add(record)
              // console.log("configureRecords - parseAttributes", record)
              record.parseAttributes()
            })
            // reorganise attributes (move properties up)
            that.model.setRecords(recordCollection)
            that.model.recordsConfigured(true)
console.log("done... configureRecords", recordCollection)
          }
        )
      }
    },
    configureSources : function(sourceData) {
      var sourceConfig = this.model.get("config").sources
      if (typeof sourceConfig !== "undefined") {
        console.log("configureSources", sourceConfig)

        var that = this
        waitFor(
          function(){ return that.model.layersConfigured() },
          //then
          function(){
            var sourceCollection = new RecordCollection([],{
              config : sourceConfig,
            })
            // store columns reference with record collection
            sourceCollection.setColumns(that.model.getSourceColumns())
            var source, layer;
            _.each(sourceData.features,function(feature){
              source = new RecordModel(feature.properties)
              source.set('type', 'source');
              // console.log("configureRecords - record", record)
              if (typeof feature.geometry !== "undefined" && feature.geometry !== null) {
                layer = new that.layerModels[sourceConfig.model](
                  _.extend(
                    {},
                    sourceConfig.layerOptions,
                    {
                      id: source.id,
                      eventContext : that.$el,
                      isSourceLayer:true,
                    }
                  )
                )
                that.model.getLayers().add(layer)
                layer.setData({
                  geometry:feature.geometry,
                  type:feature.type,
                  properties:{
                    id: source.id
                  }
                })
                source.setLayer(layer)
              } else {
                source.setLayer(false)
              }
              sourceCollection.add(source)
              // console.log("configureRecords - parseAttributes", record)
              source.parseAttributes()
            })
            that.model.setSources(sourceCollection)
            // reorganise attributes (move properties up)
            waitFor(
              function(){ return that.model.recordsConfigured() },
              //then
              function(){
                // console.log("configureSources - finalise", that.model.getSources(), that.model.getRecords())
                that.model.getRecords().setSources(that.model.getSources())
                that.model.getSources().setChildren(that.model.getRecords())
                that.model.sourcesConfigured(true)
                console.log("done... configureSources", sourceCollection)
              }
            )
          }
        )
      }
    },


    initColumns:function(){
console.log("initColumns")
      // store column groups
      this.model.setColumnGroups(new ColumnGroupCollection(this.model.get("columnGroupConfig")))
      // store and init columns
      this.model.setColumns(new ColumnCollection(this.model.get("columnConfig")))
      this.model.columnsInitialised(true)
console.log("done... initColumns")
    },

    configureColumns:function(){
console.log("configureColumns")
      // store column groups

      this.model.get("columnCollection").initializeModels(this.model.getRecords())
      // store columns reference with record collection
      // this.model.getRecords().setColumns(this.model.get("columnCollection"))
      this.model.columnsConfigured(true)
console.log("done... configureColumns")
    },
    initSourceColumns:function(){
console.log("initSourceColumns")
      // store column groups
      this.model.setSourceColumnGroups(new ColumnGroupCollection(this.model.get("sourceColumnGroupConfig")))
      // store and init columns
      this.model.setSourceColumns(new ColumnCollection(this.model.get("sourceColumnConfig")))
      this.model.sourceColumnsInitialised(true)
console.log("done... initSourceColumns")
    },

    configureSourceColumns:function(){
console.log("configureSourceColumns", this.model.getSources(), this.model.get("sourceColumnCollection"))
      // store column groups

      this.model.get("sourceColumnCollection").initializeModels(this.model.getSources())
      this.model.sourceColumnsConfigured(true)
console.log("done... configureSourceColumns")
    },

    loadReferences : function(){
console.log("loadReferences")
      var refConfig = this.model.get("config").references
      var that = this
      $.ajax({
        headers: {
          Accept: 'text/csv',
          'Content-Type': 'text/csv'
        },
        dataType: "text",
        url: this.model.getBaseURL() + '/' + refConfig.path,
        success: function(data) {
          var dataObjects = $.csv.toObjects(data);
console.log("success loading ref data")
          that.model.set('referencesLoaded', true)
          that.configureReferences(dataObjects)
        },
        error: function(xhr, status, error){
          console.log(status + '; ' + error);
          console.log("error loading ref data")
        }
      });
    },
    configureReferences : function(refData) {
console.log("configureReferences")
      var refConfig = this.model.get("config").references

      var that = this
      that.model.setReferences(new ReferenceCollection(
        _.map(refData,function(reference){
          return _.extend (
              {},
              reference,
              {id:parseInt(reference.id)}
            )
        }),
        { config : refConfig }
      ))
      var that = this
      waitFor(
        function(){ return that.model.recordsConfigured() },
        //then
        function(){
console.log("done... configureReferences")
          that.model.getRecords().setReferences(that.model.getReferences())
          that.model.referencesConfigured(true)
        }
      )
    },





    // VIEW MODEL EVENT: downstream
    routeChanged:function(){
      this.update()
    },

    renderShare: function(){
      var url = window.location.protocol+'//'+window.location.host;
        url += (window.location.pathname.trim() !== "" && window.location.pathname !== '/')
            ? '/'+window.location.pathname
            : "";

      var twitter = "text=" + encodeURIComponent(this.model.getLabels().share.tweet)
      twitter += "&url=" + url
      twitter += this.model.getLabels().share.twitter_hashtags.trim() !== ""
        ? "&hashtags=" + this.model.getLabels().share.twitter_hashtags.trim()
        : ""
      twitter += this.model.getLabels().share.twitter_via.trim() !== ""
        ? "&via=" + this.model.getLabels().share.twitter_via.trim()
        : ""
      twitter += this.model.getLabels().share.twitter_related.trim() !== ""
        ? "&related=" + this.model.getLabels().share.twitter_related.trim()
        : ""

      if (this.model.get('shareToggled')) {
        this.$("#share").html(_.template(templateShare)({
          t:this.model.getLabels(),
          url_current:window.location.href,
          url_enc:encodeURIComponent(url),
          twitter:twitter
        }))
        this.$('#share .select-on-click').on('click', this.selectOnClick)

      } else {
        this.$("#share").html("")
      }
    },

    selectOnClick: function(e){
      e.preventDefault()
      e.target.focus();
      e.target.select();
      setTimeout(function () {
        e.target.setSelectionRange(0, 9999);
      }, 1);
    },





    // SUBVIEW EVENTS

    // general navigation events
    resetApp : function(e,args){
      console.log('AppView.resetApp')
      this.model.getRouter().resetApp()
    },
    homeLink : function(e,args){
      console.log('AppView.resetApp')

      this.model.getRouter().update({
        link:true,
        route:'db',
        path:'',
        query:{}
      })
    },
    navLink : function(e,args){

      if (args.id === "share") {
        this.toggleShare()
      } else {
        // close share
        this.model.set('shareToggled', false)

        this.views.nav.model.set({
          path:this.model.getPath()
        })

        this.model.getRouter().update({
          link:true,
          route:args.route,
          path:args.id === "db"
            ? this.model.getLastDBPath()
            : args.id,
          query: {
            anchor:typeof args.anchor !== "undefined" ? args.anchor : ""
          },
          extendQuery:true,
        })
      }

    },


    setOutView : function(e,args){
// console.log("setOutView")
      this.views.out.model.set('recordsPopup',[]) ;
      // if (window.__ga__ && ga.loaded) { ga('send', 'event', 'View', args.out_view, '')}
      this.model.getRouter().queryUpdate({
        out : args.out_view
      })
    },
    setFilterView : function(e,args){
// console.log("setOutView")
      // if (window.__ga__ && ga.loaded) { ga('send', 'event', 'View', args.out_view, '')}
      this.model.getRouter().queryUpdate({
        filter : args.filter
      })
    },
    sourceSelect : function(e,args){
      console.log("sourceSelect", args)

      if (this.model.getSelectedSourceId() !== parseInt(args.id)){
        this.model.getRouter().update({
          route:"db",
          path: 's' + args.id
        })
      } else {
        args.closeSelected = typeof args.closeSelected !== "undefined" ? args.closeSelected : true
        if (args.closeSelected) {
          this.$el.trigger('recordClose')
        }
      }
    },
    recordSelect : function(e,args){
      console.log("recordSelect", args)

      if (this.model.getSelectedRecordId() !== parseInt(args.id)){
        this.model.getRouter().update({
          route:"db",
          path:args.id
        })
      } else {
        args.closeSelected = typeof args.closeSelected !== "undefined" ? args.closeSelected : true
        if (args.closeSelected) {
          this.$el.trigger('recordClose')
        }
      }
    },

    recordsPopup:function(e,args){
// console.log("recordsPopup ", args.records)
      this.views.out.model.set('recordsPopup',args.records || []);   // models not collection
    },

    colorColumnChanged : function(e,args){
// console.log("colorColumnChanged")
      this.views.out.model.set('recordsPopup',[]) ;

      this.model.getRouter().queryUpdate({
        colorby:args.column
      })
    },
    sourceColorColumnChanged : function(e,args){
// console.log("colorColumnChanged")
      this.views.out.model.set('recordsPopup',[]) ;

      this.model.getRouter().queryUpdate({
        sourcecolorby:args.column
      })
    },
    plotColumnsSelected : function(e,args){
console.log("plotColumnsSelected")
      this.model.getRouter().queryUpdate({
        plot:args.columns
      })
    },

    // map view events
    mapConfigured: function(e,args){
      this.model.mapConfigured(true)
    },
    mapViewUpdated : function(e,args){
      console.log('AppView.mapViewUpdated')

      var viewUpdated = this.model.toMapviewString(args.view)

      if (viewUpdated !== this.model.getActiveMapview(true)) {
        this.model.getRouter().queryUpdate({
            view : viewUpdated
          },
          true, // trigger
          true // replace
        )
      }
    },
    // select record from map marker
    pointLayerClick : function(e,args){
      // check if location a casestudy
// console.log("pointLayerClick")
      var layerId = args.id

      if (layerId !== "") {
        // for now only handle record layer clicks
        if (this.model.getLayers().get(layerId).get("isRecordLayer")) {
          //detect other records
          var recordsOverlapping = this.model.getRecords().byXY(args.x,args.y)

          this.$el.trigger('recordsPopup', {
            records: recordsOverlapping.models
          });
          this.$el.trigger('recordSelect', {
            id: layerId,
            closeSelected: true//recordsOverlapping.length === 1 // only if single record
          })

        }
        if (this.model.getLayers().get(layerId).get("isSourceLayer")) {
          //detect other records
          var recordsOverlapping = this.model.getSources().byXY(args.x,args.y)

          this.$el.trigger('recordsPopup', {
            records: recordsOverlapping.models
          });
          this.$el.trigger('sourceSelect', {
            id: layerId,
            closeSelected: true//recordsOverlapping.length === 1 // only if single record
          })

        }
      }
    },
    // select record from popup
    mapLayerSelect : function(e,args){
      // check if location a casestudy
// console.log("mapLayerSelect")
      var layerId = args.id

      if (layerId !== "") {
        // for now only handle record layer clicks

        if (this.model.getLayers().get(layerId).get("isRecordLayer")) {
          this.$el.trigger('recordSelect', {
            id: parseInt(layerId),
            closeSelected: true
          })
        }
        if (this.model.getLayers().get(layerId).get("isSourceLayer")) {
          this.$el.trigger('sourceSelect', {
            id: parseInt(layerId),
            closeSelected: true
          })
        }
      }
    },


    recordHighlightOn: function(recordId, isPopup) {
// console.log("recordHighlightOn", recordId)
      isPopup = typeof isPopup !== 'undefined' ? isPopup : false

      var record = this.model.getRecords().highlightRecord(recordId)
      if(typeof record !== 'undefined') {
        this.views.out.model.set("recordMouseOverId",record.id);
        if (isPopup) {
          this.$el.trigger('recordsPopup', {
            records: [record]
          });
        }
      }
    },
    recordHighlightOff: function() {
      this.model.getRecords().highlightReset()
      this.views.out.model.set("recordMouseOverId","");
    },

    // hover record in side panel
    //
    //
    //
    // console.log("recordMouseOver", args.id)
    recordMouseOver : function(e,args){
      if (args.id !== "") {
        // cleanup
        this.recordHighlightOn(args.id, true)
      }
    },

    // hover record on map marker
    //
    // highlight marker on map
    // open popup with all overlapping markers with current highlighted
    //
    pointLayerMouseOver : function(e,args){
      var layerId = args.id

      if (layerId !== "") {
        if (this.model.getLayers().get(layerId).get("isRecordLayer")) {

          this.recordHighlightOn(layerId)

          //stick all other records in popup
          var overlaps = this.model.getRecords().bySelected().byActive().byXY(args.x, args.y).models
          // unset popup first to make sure new set is opened
          this.$el.trigger('recordsPopup', { records: [] });
          this.$el.trigger('recordsPopup', { records: overlaps });
        }
      }
    },
    // hover record on map popup
    mapLayerMouseOver : function(e,args){
// console.log("mapLayerMouseOver ", args.id)
      var layerId = args.id
      if (layerId !== "" && this.model.getLayers().get(layerId).get("isRecordLayer")) {
        this.recordHighlightOn(layerId)
      }
    },



    recordMouseOut : function(e,args){
// console.log("recordMouseOut", args.id)
      this.recordHighlightOff()
      this.$el.trigger('recordsPopup', { records: [] });
    },

    pointLayerMouseOut : function(e,args){
//      this.pointLayerMouseOverLayerId = null
// console.log("pointLayerMouseOut", args.id)
//      this.recordHighlightOff()
    },
    mapLayerMouseOut : function(e,args){
// console.log("mapLayerMouseOut", args.id)
      var layerId = args.id
      if (layerId !== "" && this.model.getLayers().get(layerId).get("isRecordLayer")) {
      // cleanup
//        this.recordHighlightCleanup()

//        var record = this.model.getRecords().get(recordId)
//        if(typeof record !== 'undefined') {
//          record.setMouseOver(false)
//        }
        this.views.out.model.set("recordMouseOverId","");
      }
    },

    mapPopupClosed:function(){
      this.recordHighlightOff()
    },

    mapOptionToggled:function(e,args){
      // if (window.__ga__ && ga.loaded) { ga('send', 'event', 'Map option', this.model.getOutMapType() !== args.option ? args.option : 'none', '')}

      this.model.getRouter().queryUpdate(
        {
          map:this.model.getOutMapType() !== args.option ? args.option : 'none'
        },
        true, // trigger
        false, // replace
        true // extend
      )
    },

    // record events
    recordClose : function(e){
      this.model.getRouter().update({
        route:"db",
        path:""
      })

    },

    // filter events
    recordQuerySubmit : function(e,args){
console.log("recordQuerySubmit")
      this.views.out.model.set('recordsPopup',[]) ;

      // new query
      var q = {}
      _.each(args.query,function(val,key){
        q["q_"+key] = val
      })

      // old query
      var query = _.clone(this.model.getQuery())
      _.each(query,function(val,key){
        if (key.startsWith("q_")) {
          delete query[key]
        }
      })

      // add new attr query args
      _.extend(query,q)

      this.model.getRouter().queryUpdate(
        query,
        true, // trigger
        false, // replace
        false // extend
      )
    },
    sourceQuerySubmit : function(e,args){
console.log("sourceQuerySubmit")
      this.views.out.model.set('recordsPopup',[]) ;

      // new query
      var q = {}
      _.each(args.query,function(val,key){
        q["qs_"+key] = val
      })

      // old query
      var query = _.clone(this.model.getQuery())
      _.each(query,function(val,key){
        if (key.startsWith("qs_")) {
          delete query[key]
        }
      })

      // add new attr query args
      _.extend(query,q)

      this.model.getRouter().queryUpdate(
        query,
        true, // trigger
        false, // replace
        false // extend
      )
    },
    geoQueryDelete:function(e){
console.log("geoQueryDelete")

      var latColumn = this.model.getColumns().get("lat")
      var lngColumn = this.model.getColumns().get("lng")
      this.model.getRouter().queryDelete([
        "q_"+latColumn.getQueryColumnByType("max"),
        "q_"+latColumn.getQueryColumnByType("min"),
        "q_"+lngColumn.getQueryColumnByType("max"),
        "q_"+lngColumn.getQueryColumnByType("min"),
      ])
    },
    geoQuerySubmit:function(e,args){
console.log("geoQuerySubmit")
      var latColumn = this.model.getColumns().get("lat")
      var lngColumn = this.model.getColumns().get("lng")

      // new query
      var query = {}

      query["q_"+latColumn.getQueryColumnByType("max")] = args.geoQuery.north.toString()
      query["q_"+latColumn.getQueryColumnByType("min")] = args.geoQuery.south.toString()
      query["q_"+lngColumn.getQueryColumnByType("max")] = args.geoQuery.east.toString()
      query["q_"+lngColumn.getQueryColumnByType("min")] = args.geoQuery.west.toString()

      this.model.getRouter().queryUpdate(
        query,
        true, // trigger
        false, // replace
        true // extend
      )
    },

    // map events
    sortRecords : function(e,args){
      this.model.getRouter().queryUpdate({
          sortcol : args.column,
          sortorder : args.order.toString()
        },
        true, // trigger
        true // replace
      )
    },
    sortSources : function(e,args){
      this.model.getRouter().queryUpdate({
          sourcesortcol : args.column,
          sourcesortorder : args.order.toString()
        },
        true, // trigger
        true // replace
      )
    },

    // page events
    pageClose : function(e){
      this.model.getRouter().update(
        this.model.getLastDBRoute()
      )
    },
    toggleShare: function(){
      // if (!this.model.get('shareToggled')) {
      //   if (window.__ga__ && ga.loaded) { ga('send', 'event', 'Modal', 'share', '')}
      // }

      this.model.set('shareToggled', !this.model.get('shareToggled'))
      this.views.nav.model.set({
        path:this.model.get('shareToggled') ? 'share' : this.model.getPath()
      })
    },
    closeShare: function(e){
      e.preventDefault()
      this.model.set('shareToggled', false)
      this.views.nav.model.set({
        path:this.model.getPath()
      })
    },

  });
  return AppView;

});
