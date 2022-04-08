define([
  'jquery', 'underscore', 'backbone',
  './RecordModel'
], function(
  $, _, Backbone, model
){
  var RecordCollection = Backbone.Collection.extend({
    model:model,
    initialize: function(models,options) {
      this.options = options || {};
      this.selectedId = null
      this.query = {}
    },
    byActive: function(active){
      active = typeof active !== 'undefined' ? active : true
      return new RecordCollection(this.filter(function(model){
        return model.isActive() === active
      }),this.options)
    },
    bySelected: function(){
      if (this.selectedId || this.relatedSelected) {
        return new RecordCollection(this.filter(function(model){
          return model.isSelected() || model.isRelatedSelected()
        }),this.options)
      } else {
        return this;
      }
    },
    updateActive:function(query){
//      console.log("recordCollection.updateActive")
      _.each(_.clone(this.models).reverse(),function(model){
        model.setActive(model.pass(query))
      })
    },
    highlightReset: function(){
      _.each(this.byHighlight().models, function(record){
        record.setHighlight(false)
      })
      this.moveRecordToFront()
    },
    highlightRecord:function(recordId){
      this.highlightReset()
      var record = this.get(recordId)
      if(typeof record !== 'undefined') {
        record.setHighlight(true)
      }
      return record
    },
    updateRecords:function(args){
      // console.log("recordCollection.updateRecords", args)
      // remember query but ignore tempQuery
      this.query = args.query || this.query
      const query = Object.assign({}, this.query, args.queryTemp)

      var that = this;
      _.each(_.clone(this.models).reverse(),function(model){
        // set active
        model.setActive(model.pass(query), args.preliminary)
        // set selected
        if(args.selectedId !== that.selectedId) {
          if (args.selectedId === "") {
            model.setSelected(false)
          } else {
            model.setSelected(model.id === args.selectedId, true)
          }
        }
        if(args.relatedSelected && args.relatedSelected.value && model.get(args.relatedSelected.column)) {
          model.setRelatedSelected(
            model.get(args.relatedSelected.column).toString() === args.relatedSelected.value.toString(),
            true
          )
        }
        // set color
        if (model.isActive() && args.colorColumn){
          model.setColor(
            args.colorColumn.getColor(
              model.getColumnValue(args.colorColumn.get("column"))
            )
          )
        }
        // set color
        if (model.isActive() && !args.colorColumn){
          model.setColor('#333333')
        }
      })
      this.selectedId = args.selectedId !== "" ? args.selectedId : null
      this.relatedSelected = args.relatedSelected && args.relatedSelected.value ? args.relatedSelected : null


    },
    moveRecordToFront: function(recordId){
      recordId = typeof recordId !== 'undefined' ? recordId : this.selectedId
      if (recordId) {
        var record = this.get(recordId)
        if (record) {
          record.bringToFront()
        }
      }
    },
    byHighlight: function(){
      return new RecordCollection(this.filter(function(model){
        return model.isHighlight()
      }),this.options);
    },
    byXY:function(x,y){
      return new RecordCollection(this.filter(function(model){
        return model.passXY(x,y)
      }),this.options);
    },
    byQuery: function(query){
      return new RecordCollection(this.filter(function(model){
        return model.pass(query)
      }),this.options);
    },
    byBounds: function(bounds){
      var lat_column = this.options.columns.get("lat")
      var lng_column = this.options.columns.get("lng")

      var query = {}

      query[lat_column.getQueryColumnByType("min")] = bounds.south
      query[lat_column.getQueryColumnByType("max")] = bounds.north
      query[lng_column.getQueryColumnByType("min")] = bounds.west
      query[lng_column.getQueryColumnByType("max")] = bounds.east

      return new RecordCollection(this.filter(function(model){
        return model.pass(query)
      }),this.options);
    },
    hasLocation: function(){
      return new RecordCollection(this.reject(function(model){
        return model.get('latitude') === null
      }),this.options);
    },
    getValuesForColumn:function(columnModel){
      var column = columnModel.get('queryColumn');
      // TODO pass columnModel, check for separator
      var values = []
      _.each(this.models,function(model){
        if(model.get(column) !== null) {
          if (isNumber(model.get(column))) {
            values = _.union(values, [model.get(column)])
          } else if (columnModel.get('separator')){
            values = _.union(values,_.map(model.get(column).split(columnModel.get('separator')),function(val){return val.trim()}))
          } else {
            // console.log('getValuesForColumn', model.id, column, model.get(column))
            values = _.union(values, [model.get(column).trim()])
          }
        }
      })
      return values.sort(function(a,b){
        //sort alphabetically but move unknown to the end
        return a === "Unknown" ? 1 : b === "Unknown" ? -1
            : a < b ? -1 : a > b ? 1 : 0
      })
    },
    setColumns:function(columns){
      this.options.columns = columns
    },
    getColumns : function(){
      return this.options.columns
    },
    // // Proxies ========================================================================
    // setProxies: function(collection){
    //   this.options.proxies = collection
    // },
    // // returns collection
    // getProxies : function(){
    //   return this.options.proxies
    // },
    // References ========================================================================
    setReferences: function(collection){
      this.options.references = collection
    },
    // returns collection
    getReferences: function(){
      return this.options.references
    },
    // Child records ========================================================================
    setChildren: function(collection){
      this.options.children = collection
    },
    // returns collection
    getChildren: function(){
      return this.options.children
    },
    // Sources ========================================================================
    setSources: function(collection){
      this.options.sources = collection
    },
    // returns collection
    getSources: function(){
      return this.options.sources
    },
    sortBy:function(column,order){
      var records = this.clone()

      records.comparator = function(a,b){
        var aval = a.get(column)
        var bval = b.get(column)
        if (aval === null || aval === "" || bval === null || bval === "" ) {
          if ((aval === null || aval === "") && (bval !== null && bval !== "" )) {
            return 1
          }
          if ((aval !== null && aval !== "") && (bval === null || bval === "" )) {
            return -1
          }
          return (aval > bval ? 1 : (bval > aval) ? -1 : 0) * order;
        }

        return (aval > bval ? 1 : -1) * order

      }
      records.sort()
      return records.models
    },
    toCSV:function(){
      var columns = this.options.columns

      var columnDelimiter = ',';
      var lineDelimiter = '\n'
      var csv = '';

      // add header
      var keys = _.map(columns.models,function(col){
        return col.getQueryColumn()
      })
      csv += keys.join(columnDelimiter);
      csv += lineDelimiter;

      // add rows
      // for each record
      _.each(this.models,function(record){
        // for each column
        _.each(keys,function(key,i){
          if (i > 0) {
            csv += columnDelimiter
          }
          csv += '"'
          csv += record.getColumnValue(key) !== null
            ? record.getColumnValue(key).toString().replace(/"/g, '\""')
            : "";
          csv += '"'
        })
        csv += lineDelimiter
      })
      return csv
    }


  });

  return RecordCollection;
});
