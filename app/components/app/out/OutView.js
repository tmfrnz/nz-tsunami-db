define([
  'jquery',  'underscore',  'backbone',
  'bootstrap',
  './map/MapView', './map/MapModel',
  './table/TableView', './table/TableModel',
  'text!./out.html',
  'text!./out_nav.html',
  'text!./out_data.html',
  'text!./out_navInfo.html',
  'text!./out_navReset.html'
  // 'ga'
], function (
  $, _, Backbone,
  bootstrap,
  MapView, MapModel,
  TableView, TableModel,
  template,
  templateNav,
  templateData,
  templateNavInfo,
  templateNavReset
  // ga
) {

  var OutView = Backbone.View.extend({
    events : {
      "click .toggle-view" : "toggleView",
      "click .toggle-data" : "toggleData",
      "click .close-data" : "closeData",
      "click .out-nav-reset-records .query-reset": "queryReset",
      "click .out-nav-reset-sources .query-reset": "queryResetSources",
      "click .download-data": "downloadData",
    },
    initialize : function () {

      // shortcut
      this.views = this.model.getViews()

      this.render()

      this.listenTo(this.model, "change:active", this.handleActive);
      this.listenTo(this.model, "change:mapView", this.updateMapViewMain);
      this.listenTo(this.model, "change:outType", this.updateOutType);
      this.listenTo(this.model, "change:outMapType", this.updateOutMapType);
      this.listenTo(this.model, "change:outMapShowRecords", this.updateOutShowRecords);
      this.listenTo(this.model, "change:outMapShowSources", this.updateOutShowSources);
      this.listenTo(this.model, "change:outColorColumn", this.updateOutColorColumn);
      this.listenTo(this.model, "change:outSourceColorColumn", this.updateOutSourceColorColumn);
      this.listenTo(this.model, "change:outPlotColumns", this.updateOutPlotColumns);
      this.listenTo(this.model, "change:tableSortColumn", this.updateTableSortColumn);
      this.listenTo(this.model, "change:tableSortOrder", this.updateTableSortOrder);
      this.listenTo(this.model, "change:tableSourceSortColumn", this.updateTableSourceSortColumn);
      this.listenTo(this.model, "change:tableSourceSortOrder", this.updateTableSourceSortOrder);
      this.listenTo(this.model, "change:recordsUpdated", this.updateRecords);
      this.listenTo(this.model, "change:sourcesUpdated", this.updateRecords);
      this.listenTo(this.model, "change:recordId", this.updateSelectedRecord);
      this.listenTo(this.model, "change:sourceId", this.updateSelectedSource);
      this.listenTo(this.model, "change:recordMouseOverId", this.updateMouseOverRecord);
      this.listenTo(this.model, "change:recordsPopup",this.recordsPopup)
      this.listenTo(this.model, "change:queryLength",this.updateQueryLength)
      this.listenTo(this.model, "change:querySourcesLength",this.updateQueryLength)
      this.listenTo(this.model, "change:geoQuery",this.updateGeoQuery)
      this.listenTo(this.model, "change:geoQuerySources",this.updateGeoQuerySources)
      this.listenTo(this.model, "change:query",this.updateQuery)
      this.listenTo(this.model, "change:dataToggled",this.renderData)
    },
    render: function () {
      console.log("OutView.render")
      this.$el.html(_.template(template)({
        t:this.model.getLabels()
      }))
      this.renderHeader()
      this.renderHeaderInfo()
      this.renderHeaderReset()
      this.updateHeaderActive()
      this.updateViews()
      return this
    },
    updateViews:function(){
      console.log("OutView.updateViews")

      //          console.log('OutView.updateViews 1', Date.now() - window.timeFromUpdate)
      // always init map view so we can already add layers
      this.initMapView()
      switch(this.model.getOutType()){
        case "map":
          //          console.log('OutView.updateViews Xa', Date.now() - window.timeFromUpdate)

            //          console.log('OutView.updateViews Xb', Date.now() - window.timeFromUpdate)
          if (this.views.table) {
            this.views.table.model.setActive(false)
          }
          if (this.views.tableSources) {
            this.views.tableSources.model.setActive(false)
          }
          this.views.map.model.setActive()
            //          console.log('OutView.updateViews Xc', Date.now() - window.timeFromUpdate)
          this.updateMapView()
            //          console.log('OutView.updateViews Xd', Date.now() - window.timeFromUpdate)
          break
        case "table":
          //          console.log('OutView.updateViews 1a', Date.now() - window.timeFromUpdate)

          this.initTableView()
            //          console.log('OutView.updateViews 1b', Date.now() - window.timeFromUpdate)
          if (this.views.map) {
            this.views.map.model.setActive(false)
          }
          if (this.views.tableSources) {
            this.views.tableSources.model.setActive(false)
          }
          this.views.table.model.setActive()
          this.updateTableView()
          break
        case "source-table":
          //          console.log('OutView.updateViews 1a', Date.now() - window.timeFromUpdate)

          this.initSourceTableView()
            //          console.log('OutView.updateViews 1b', Date.now() - window.timeFromUpdate)
          if (this.views.map) {
            this.views.map.model.setActive(false)
          }
          if (this.views.table) {
            this.views.table.model.setActive(false)
          }
          this.views.tableSources.model.setActive()
          this.updateSourceTableView()
          break
        default:
          break
      }

    },

    renderHeader: function(){
//      console.log("OutView.renderHeader")
      this.$("nav").html(_.template(templateNav)({
        t:this.model.getLabels()
      }))
    },

    renderHeaderInfo: function(){
//      console.log("OutView.renderHeaderInfo")
      var activeRecords = this.model.getRecords().byActive()
      var activeSources = this.model.getSources().byActive()
      this.$("nav .out-nav-info").html(_.template(templateNavInfo)({
        t:this.model.getLabels(),
        record_no:typeof activeRecords !== "undefined" ? activeRecords.length : 0,
        source_no:typeof activeSources !== "undefined" ? activeSources.length : 0
      }))
    },

    renderHeaderReset: function(){
//      console.log("OutView.renderHeaderReset")
      if (this.model.get('queryLength') > 0) {
        this.$("nav .out-nav-reset-records").html(_.template(templateNavReset)({
          t: this.model.getLabels(),
          type: 'r',
          count: this.model.get('queryLength')
        }))
      } else {
        this.$("nav .out-nav-reset-records").html("")
      }
      if (this.model.get('querySourcesLength') > 0) {
        this.$("nav .out-nav-reset-sources").html(_.template(templateNavReset)({
          t: this.model.getLabels(),
          type: 's',
          count: this.model.get('querySourcesLength')
        }))
      } else {
        this.$("nav .out-nav-reset-sources").html("")
      }
    },
    updateHeaderActive: function(active){
//      console.log("OutView.renderHeaderActive")
      active = typeof active !== "undefined" ? active : this.model.getOutType()
      this.$("nav .toggle-btn").removeClass('active');
      this.$("nav .toggle-"+active).addClass('active');
    },

    updateRecords: function(){
      console.log("OutView.updateRecords")
      this.renderHeaderInfo()
      this.updateViews()
      this.renderData()
    },
    updateOutType: function(){
      console.log("OutView.updateOutType")
      this.updateHeaderActive()
      this.updateViews()
    },
    updateQueryLength: function(){
//      console.log("OutView.updateQueryLength")
      this.renderHeaderReset()
    },

    canDownload: function() {
      // check for Safari as it passes the test but still appears not to work correctly in versions 9 and 10, see issue #157
      return (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)
        ? false
        : Modernizr.blobconstructor
    },
    renderData: function(){
//      console.log("OutView.renderData")

      if (this.model.get('dataToggled')) {
        this.$("#data-view").html(_.template(templateData)({
          t:this.model.getLabels(),
          filtered : this.model.get('queryLength') > 0,
          filteredSources : this.model.get('querySourcesLength') > 0,
          canDownload: this.canDownload(),
          download : {
            formats: [
              {
                id: "download-csv",
                title: this.model.getLabels().out.data.formats.csv,
                format: "csv"
              }
            ],
            tables : [
              {
                id:"records",
                title: this.model.getLabels().out.data.tables.records,
              },
              {
                id:"sources",
                title: this.model.getLabels().out.data.tables.sources,
              },
            ]
          }
        }))
        this.$('#data-view .nav-tabs a').click(function (e) {
          e.preventDefault()
          $(this).tab('show')
        })
        this.$('#data-view .select-on-click').on('click', this.selectOnClick)

      } else {
        this.$("#data-view").html("")
      }
    },

    // child views

    initTableView : function(){
//      console.log('OutView.initTableView 1', Date.now() - window.timeFromUpdate)
      var componentId = '#table'

      if (this.$(componentId).length > 0) {
        this.views.table = this.views.table || new TableView({
          el:this.$(componentId),
          model: new TableModel({
            labels: this.model.getLabels(),
            columnCollection: this.model.get("columnCollection").byAttribute("table"),
            columnGroupCollection: this.model.get("columnGroupCollection"),
            tableSortColumn: typeof this.model.get('tableSortColumn') !== "undefined" ? this.model.get('tableSortColumn') : 'id',
            tableSortOrder: typeof this.model.get('tableSortOrder') !== "undefined" ? this.model.get('tableSortOrder') : '1',
            active: true,
            recordId:"",
            type: "records",
          })
        });
//      console.log('OutView.initTableView 2', Date.now() - window.timeFromUpdate)

      }
    },
    initSourceTableView : function(){
//      console.log('OutView.initTableView 1', Date.now() - window.timeFromUpdate)
      var componentId = '#tableSources'

      if (this.$(componentId).length > 0) {
        this.views.tableSources = this.views.tableSources || new TableView({
          el:this.$(componentId),
          model: new TableModel({
            labels: this.model.getLabels(),
            columnCollection: this.model.get("sourceColumnCollection").byAttribute("table"),
            columnGroupCollection: this.model.get("sourceColumnGroupCollection"),
            tableSortColumn: typeof this.model.get('tableSourceSortColumn') !== "undefined" ? this.model.get('tableSourceSortColumn') : 'id',
            tableSortOrder: typeof this.model.get('tableSourceSortOrder') !== "undefined" ? this.model.get('tableSourceSortOrder') : '1',
            active: true,
            recordId:"",
            type: "sources",
          })
        });
//      console.log('OutView.initTableView 2', Date.now() - window.timeFromUpdate)

      }
    },

    updateTableView : function(){
//      console.log('OutView.updateTableView 1', Date.now() - window.timeFromUpdate)

      if (this.model.getOutType() === 'table' && typeof this.views.table !== 'undefined'){
//        console.log('OutView.updateTableView 1a', Date.now() - window.timeFromUpdate)
        this.views.table.model.setCurrentRecords(this.model.getRecords().byActive())
//        console.log('OutView.updateTableView 1b', Date.now() - window.timeFromUpdate)
        this.updateTableSortColumn()
//        console.log('OutView.updateTableView 1c', Date.now() - window.timeFromUpdate)
        this.updateTableSortOrder()
//        console.log('OutView.updateTableView 1d', Date.now() - window.timeFromUpdate)
      }
//      console.log('OutView.updateTableView 2', Date.now() - window.timeFromUpdate)

    },
    updateSourceTableView : function(){
      // console.log('OutView.updateTableView 1', Date.now() - window.timeFromUpdate, this.model.getSources().byActive())

      if (this.model.getOutType() === 'source-table' && typeof this.views.tableSources !== 'undefined'){
//        console.log('OutView.updateTableView 1a', Date.now() - window.timeFromUpdate)
        this.views.tableSources.model.setCurrentRecords(this.model.getSources().byActive())
//        console.log('OutView.updateTableView 1b', Date.now() - window.timeFromUpdate)
        this.updateTableSourceSortColumn()
//        console.log('OutView.updateTableView 1c', Date.now() - window.timeFromUpdate)
        this.updateTableSourceSortOrder()
//        console.log('OutView.updateTableView 1d', Date.now() - window.timeFromUpdate)
      }
//      console.log('OutView.updateTableView 2', Date.now() - window.timeFromUpdate)

    },
    updateTableSortColumn:function(){
      if (this.model.getOutType() === 'table' && typeof this.views.table !== 'undefined'){
        this.views.table.model.set(
          "tableSortColumn",
          typeof this.model.get('tableSortColumn') !== "undefined" ? this.model.get('tableSortColumn') : 'id'
        )
      }
    },
    updateTableSortOrder:function(){
      if (this.model.getOutType() === 'table' && typeof this.views.table !== 'undefined'){
        this.views.table.model.set(
          "tableSortOrder",
          typeof this.model.get('tableSortOrder') !== "undefined" ? this.model.get('tableSortOrder') : '1'
        )
      }
    },
    updateTableSourceSortColumn:function(){
      if (this.model.getOutType() === 'source-table' && typeof this.views.tableSources !== 'undefined'){
        this.views.tableSources.model.set(
          "tableSortColumn",
          typeof this.model.get('tableSourceSortColumn') !== "undefined" ? this.model.get('tableSourceSortColumn') : 'id'
        )
      }
    },
    updateTableSourceSortOrder:function(){
      if (this.model.getOutType() === 'source-table' && typeof this.views.tableSources !== 'undefined'){
        this.views.tableSources.model.set(
          "tableSortOrder",
          typeof this.model.get('tableSourceSortOrder') !== "undefined" ? this.model.get('tableSourceSortOrder') : '1'
        )
      }
    },
    initMapView : function(){
      console.log("OutView.initMapView", this.model.getOutMapShowRecords())

      var componentId = '#map'

      if (this.$(componentId).length > 0) {
        this.views.map = this.views.map || new MapView({
          el:this.$(componentId),
          model: new MapModel({
            labels: this.model.getLabels(),
            config:this.model.getMapConfig(),
            layerCollection:this.model.getLayers(),
            columnCollection: this.model.get("columnCollection"),
            sourceColumnCollection: this.model.get("sourceColumnCollection"),
            outShowRecords: this.model.getOutMapShowRecords(),
            outShowSources: this.model.getOutMapShowSources(),
            active: false,
            popupLayers:[],
            selectedLayerId: "",
            recordsUpdated:0,
          })
        });
      }
    },
    updateMapView : function(){
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){

        this.updateMapViewMain()

        this.updateOutMapType()

        this.updateGeoQuery()
        this.updateGeoQuerySources()

        this.updateOutColorColumn()
        // this.updateOutShowRecords()
        // this.updateOutShowSources()

        this.updateOutSourceColorColumn()

        this.updateOutPlotColumns()

        this.views.map.model.setCurrentRecords(this.model.getRecords().byActive().hasLocation())
        this.views.map.model.setCurrentSources(this.model.getSources().byActive().hasLocation())

        this.views.map.model.setRecordsUpdated(this.model.getRecordsUpdated())
        this.views.map.model.setSourcesUpdated(this.model.getSourcesUpdated())

        this.views.map.model.set("outShowRecords",this.model.getOutMapShowRecords())
        this.views.map.model.set("outShowSources",this.model.getOutMapShowSources())
      }
    },
    updateMapViewMain : function(){
//      console.log("OutView.updateMapView" )
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        this.views.map.model.setView(this.model.getActiveMapview())
        this.views.map.model.invalidateSize()
      }
    },
    updateOutMapType:function(){
//      console.log("OutView.updateOutMapType")
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        this.views.map.model.set("outType",this.model.getOutMapType())
      }
    },
    updateGeoQuery:function(){
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        this.views.map.model.set("geoQuery",this.model.get('geoQuery'))
      }
    },
    updateGeoQuerySources:function(){
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        this.views.map.model.set("geoQuerySources",this.model.get('geoQuerySources'))
      }
    },
    updateOutShowRecords:function(){
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        console.log('updateOutShowRecords', this.model.getOutMapShowRecords())
        this.views.map.model.set("outShowRecords",this.model.getOutMapShowRecords())
      }
    },
    updateOutShowSources:function(){
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        this.views.map.model.set("outShowSources",this.model.getOutMapShowSources())
      }
    },
    updateOutColorColumn:function(){
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        this.views.map.model.set("outColorColumn",this.model.getOutColorColumn())
      }
    },
    updateOutSourceColorColumn:function(){
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        this.views.map.model.set("outSourceColorColumn",this.model.getOutSourceColorColumn())
      }
    },
    updateOutPlotColumns:function(){
      if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
        this.views.map.model.set("outPlotColumns",this.model.getOutPlotColumns())
      }
    },

    recordsPopup:function(){
      // console.log("OutView.recordsPopup ", this.model.get("recordsPopup"))
      this.views.map.model.set({
        popupLayers:this.model.get("recordsPopup").length > 0
        ? _.map (this.model.get("recordsPopup"),function(record){
            return {
              id: record.getLayer().id,
              layer: record.getLayer().getMapLayerDirect(),
              color: record.getColor(),
              label: this.model.getLabels().record.title[record.get('type')] + " " + record.id,
              selected:record.isSelected(),
              mouseOver:record.id === this.model.get("recordMouseOverId"),
              recordType: record.attributes.type,
            }
          },this)
        : []
      })
    },
    updateMouseOverRecord:function(){
//      console.log("OutView.updateMouseOverRecord")

      var recordId = this.model.get("recordMouseOverId")

      if (recordId !== "") {
        // update map  view
        var record = this.model.getRecords().get(recordId)
        if (record.isActive()){
          this.views.map.model.set("mouseOverLayerId",record.getLayer().id)
        }
      } else {
        this.views.map.model.set("mouseOverLayerId","")
      }
    },

    updateSelectedRecord:function(){
    //      console.log("OutView.updateSelectedRecord")

      var recordId = this.model.get("recordId")

      if (recordId !== "") {
        // update map and table views
        var record = this.model.getRecords().get(recordId)
        if (record.isActive()){
          if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
            this.views.map.model.set("selectedLayerId",record.getLayer().id)
          }
          if (this.model.getOutType() === 'table' && typeof this.views.table !== 'undefined'){
            this.views.table.model.set("recordId",recordId)
          }
          // also unset other table
          if (typeof this.views.tableSources !== 'undefined'){
            this.views.tableSources.model.set("recordId","")
          }
        }
      } else {
        if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
          this.views.map.model.set("selectedLayerId","")
        }
        if (this.model.getOutType() === 'table' && typeof this.views.table !== 'undefined'){
          this.views.table.model.set("recordId","")
        }
      }
    },
    updateSelectedSource:function(){
    //      console.log("OutView.updateSelectedSource")

      var recordId = this.model.get("sourceId")

      if (recordId !== "") {
        // update map and table views
        var record = this.model.getSources().get(recordId)
        if (record.isActive()){
          if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
            this.views.map.model.set("selectedLayerId",record.getLayer().id)
          }
          if (this.model.getOutType() === 'source-table' && typeof this.views.tableSources !== 'undefined'){
            this.views.tableSources.model.set("recordId",recordId)
          }
          // also unset other table
          if (typeof this.views.table !== 'undefined'){
            this.views.table.model.set("recordId","")
          }
        }
      } else {
        if (this.model.getOutType() === 'map' && typeof this.views.map !== 'undefined'){
          this.views.map.model.set("selectedLayerId","")
        }
        if (this.model.getOutType() === 'source-table' && typeof this.views.tableSources !== 'undefined'){
          this.views.tableSources.model.set("recordId","")
        }
      }
    },

    toggleView:function(e){
      e.preventDefault()
      this.model.set('dataToggled', false)
      this.$el.trigger('setOutView',{out_view:$(e.currentTarget).attr("data-view")})
    },

    handleActive : function(){
      if (this.model.isActive()) {
        this.$el.show()
      } else {
        this.$el.hide()
      }
    },
    queryReset:function(e){
      e.preventDefault()
      this.$el.trigger('recordQuerySubmit',{query:{}})
    },
    queryResetSources:function(e){
      e.preventDefault()
      this.$el.trigger('sourceQuerySubmit',{query:{}})
    },
    toggleData: function(e){
      e.preventDefault()
      this.model.set('dataToggled', !this.model.get('dataToggled'))

      if (this.model.get('dataToggled')){
        this.updateHeaderActive('data')
      } else {
        this.updateHeaderActive()
      }
    },
    closeData: function(e){
      e.preventDefault()
      this.model.set('dataToggled', false)

      this.updateHeaderActive()
    },
    selectOnClick: function(e){
      e.preventDefault()
      e.target.focus();
      e.target.select();
      setTimeout(function () {
        e.target.setSelectionRange(0, 9999);
      }, 1);
    },

    downloadData:function(e) {
      e.preventDefault();
      if(this.canDownload()) {
        var format = $(e.currentTarget).attr('data-format')
        var table = $(e.currentTarget).attr('data-table')
        var active = $(e.currentTarget).attr('data-active')

        if (format === "csv") {
          var csv = ""
          var filename = ""
          var link
          switch (table) {
            case "records":
              csv = active === "true"
                ? this.model.get("recordCollection").byActive().toCSV()
                : this.model.get("recordCollection").toCSV()
              filename = active === "true"
                ? "records_filtered.csv"
                : "records.csv"
              break;
            case "sources":
              csv = active === "true"
                ? this.model.get("sourceCollection").byActive().toCSV()
                : this.model.get("sourceCollection").toCSV()
              filename = active === "true"
                ? "sources_filtered.csv"
                : "sources.csv"
              break;
            // case "proxies":
            //   csv = this.model.get("recordCollection").getProxies().toCSV()
            //   filename = "proxies.csv"
            //   break;
            case "references":
              csv = this.model.get("recordCollection").getReferences().toCSV()
              filename = "references.csv"
              break;
          }
          // if (window.__ga__ && ga.loaded) { ga('send', 'event', 'Download', table, '')}

          var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          if (navigator && navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
          } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", filename);
              link.setAttribute('target', "_blank");
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
        }
      }
    }
  });

  return OutView;
});
