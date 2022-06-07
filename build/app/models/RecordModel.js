define([
  'jquery', 'underscore', 'backbone'
], function($,_, Backbone){
  var dateTimePattern = /(\d{2}|\d{1})\/(\d{2}|\d{1})\/(\d{4}) (\d{2}|\d{1}):(\d{2})/i;
  var dateOnlyPattern = /(\d{2}|\d{1})\/(\d{2}|\d{1})\/(\d{4})/i;
  var RecordModel = Backbone.Model.extend({
    initialize : function(options) {
      // console.log('RecordModel', options)
      this.options = options || {};
      // map data attributes
      if (typeof this.attributes.attributeMap !== 'undefined'){
        this.mapAttributes(this.attributes.attributeMap)
      }
      // remember original attributes for csv export
      this.set('original', options);
      // console.log('RecordModel', this.attributes)
      this.set('formatted',{})
      this.set('selected',false)
      this.set('highlight',false)

    },
    mapAttributes:function(attributeMap){
      _.each(
        attributeMap,
        function(attr,key) {
          this.set(key, this.attributes[attr] !== null
            ? this.attributes[attr]
            : ''
          )
        },
        this
      )
    },
    // value as mm/dd/yyyy or mm/dd/yyyy hh:mm
    // return value in milliseconds
    parseDate: function(value){
      if (!value) return null;
      // check if we have a time
      // TODO use better regex
      if (dateTimePattern.test(value)) {
        var [date, time] = value.trim().split(' ');
        var [day, month, year] = date.split('/');
        var [h, m] = time.split(':')
        day = day.length === 1 ? '0' + day : day;
        month = month.length === 1 ? '0' + month : month;
        h = h.length === 1 ? '0' + h : h;
        var dateTimeProper = year + '-' + month + '-' + day + 'T' + h + ':' + m + ':00'
        return !isNaN(Date.parse(dateTimeProper))
          ? Date.parse(dateTimeProper)
          : null;
      }
      if (dateOnlyPattern.test(value)) {
        var date = value.trim();
        var [day, month, year] = date.split('/');
        day = day.length === 1 ? '0' + day : day;
        month = month.length === 1 ? '0' + month : month;
        var dateTimeProper = year + '-' + month + '-' + day + 'T00:00:00'
        return !isNaN(Date.parse(dateTimeProper))
          ? Date.parse(dateTimeProper)
          : null;      }
      return null;
    },
    parseAttributes:function(){
      // parse explicit colunms
      if (this.collection && this.collection.options && this.collection.options.columns) {
        _.each(
          this.collection.options.columns.models,
          function(column){
            // if(this.attributes.id === '243' || this.attributes.id === 243) {
            //   console.log(this.attributes.id, this.attributes[column.get('queryColumn')])
            // }
            if (column.get('id') === 'id') {
              this.set(column.get('queryColumn'), this.attributes.id)
            } else if (column.get('type') === 'date' && this.attributes[column.get('queryColumn')]) {
              this.set(column.get('queryColumn'), this.parseDate(this.attributes[column.get('queryColumn')]))
            } else if (
              (column.get('type') === 'quantitative' || column.get('type') === 'spatial' || column.get('type') === 'discrete' )
              && this.attributes[column.get('queryColumn')]
            ) {
              if (isNumber(this.attributes[column.get('queryColumn')])) {
                this.set(column.get('queryColumn'), parseFloat(this.attributes[column.get('queryColumn')]))
              } else {
                this.set(column.get('queryColumn'), null)
              }
            } else if (
              (column.get('type') === 'boolean' || column.get('type') === 'binary' || column.get('type') === 'categorical')
              && this.attributes[column.get('queryColumn')]) {
              var val = this.attributes[column.get('queryColumn')];
              if (val === '1' || val === 'true' || val === 'T' || val === 'TRUE') {
                this.set(column.get('queryColumn'), 'true')
              } else if (val === '0' || val === 'false' || val === 'F' || val === 'FALSE') {
                this.set(column.get('queryColumn'), 'false')
              }
            } else if (this.attributes[column.get('queryColumn')] === ''){
              this.set(column.get('queryColumn'), null)
            }
          },
          this
        )
      }
    },

    setLayer:function(layer){
      this.set("layer",layer)
    },
    getLayer:function(){
      return this.attributes.layer
    },
    setActive:function(active){
      active = typeof active !== 'undefined' ? active : true
      this.set('active',active)
      if (this.getLayer()){
      // also set layer
        this.getLayer().setActive(active)
      }
    },
    isSelected:function(){
      return this.attributes.selected
    },
    setSelected : function(selected,anySelected){
      selected = typeof selected !== 'undefined' ? selected : true
      anySelected = typeof anySelected !== 'undefined' ? anySelected : selected
      this.set('selected',selected)
      this.set('anySelected',anySelected)
      // only when not active already
      if (this.getLayer()){
        this.getLayer().setSelected(selected,anySelected)
        if (selected) {
          this.bringToFront()
          this.panToViewIfNeeded()
        }
      }
    },
    isRelatedSelected:function(){
      return this.attributes.relatedSelected
    },
    setRelatedSelected : function(selected,anySelected){
      selected = typeof selected !== 'undefined' ? selected : true
      anySelected = typeof anySelected !== 'undefined' ? anySelected : selected
      this.set('relatedSelected',selected)
      this.set('anyRelatedSelected',anySelected)
      // if (selected) console.log(this.get('id'), selected, anySelected)
      // only when not active already
      if (this.getLayer()){
        this.getLayer().setSelected(selected,anySelected)
        if (selected) {
          this.bringToFront()
        }
      }
    },
    isHighlight:function(){
      return this.attributes.highlight
    },
    setHighlight : function(bool){
      bool = typeof bool !== 'undefined' ? bool : true
      this.set('highlight',bool)
      // only when not active already
      if (this.getLayer()){
        this.getLayer().setMouseOver(bool)
        if (bool) {
          this.getLayer().bringToFront()
        }
      }

    },
    setColor : function(color){
      // only when not active already
      this.set('columnColor',color)

      if (this.getLayer()){
        this.getLayer().setColor(color)
      }
    },
    getColor : function(){
      return this.attributes.columnColor || '#333333'
    },

    isActive:function(){
      return this.attributes.active
    },

    panToViewIfNeeded:function(){
//      console.log("recordModel.brintofront " + this.id)
      if (this.getLayer()){
        this.getLayer().panToViewIfNeeded()
      }
    },
    bringToFront:function(){
//      console.log("recordModel.brintofront " + this.id)
      if (this.getLayer()){
        this.getLayer().bringToFront()
      }
    },
    centerMap:function(){
//      console.log("recordModel.brintofront " + this.id)
      if (this.getLayer()){
        this.getLayer().centerMap()
      }
    },
    getColumnValue:function(column, formatted, truncated){
      formatted = typeof formatted !== "undefined" ? formatted : false
      truncated = typeof truncated !== "undefined" ? truncated : false
      var columnModel = this.collection.options.columns.findWhere({column:column})
      if (formatted) {
        if(typeof this.attributes.formatted[column] === "undefined"){
          this.attributes.formatted[column] = this.formatColumn(column)
        }
        if (truncated) {
          return truncateText(this.attributes.formatted[column]);
        } else {
          return this.attributes.formatted[column];
        }
      } else {
        return this.attributes[column];
      }
    },
    getOriginalColumnValue:function(column){
      return this.attributes.original[column];
    },
    getColumnColorValue:function(column){
      var columnModel = this.collection.options.columns.findWhere({column:column})
      if (
        this.attributes[column] !== null &&
        columnModel &&
        (columnModel.get("type") === "categorical" || columnModel.get("type") === "ordinal") &&
        columnModel.get('multiple') === 1 &&
        columnModel.get('auto-multiple') === 1 &&
        columnModel.get('separator') &&
        this.attributes[column].indexOf(columnModel.get('separator')) > -1
      ) {
        // console.log('getColumnValue multipl', column, this.attributes[column])
        return "multiple";
      } else {
        return this.attributes[column];
      }
    },
    getReferences:function(){
      if (this.attributes["reference_ids"] === null || this.attributes["reference_ids"] === '') {
        return []
      } else {
        return _.map(
          this.attributes["reference_ids"].split(","),
          function(refid){
            return this.collection.options.references.get(refid);
          },
          this
        )
      }
    },
    getSource:function(){
      if (this.collection.options.sources && this.attributes.trigger_event_id) {
        return this.collection.options.sources.get(this.attributes.trigger_event_id);
      } else {
        return null
      }
    },
    getChildren:function(){
      // console.log('getChildren', this.collection.options.children)
      if (this.collection.options.children) {
        return this.collection.options.children.byQuery({ trigger_event_id: this.id.toString() }).models;
      } else {
        return null
      }
    },
    decodeValue:function(value, columnValues){
      if (columnValues
        && columnValues.values
        && columnValues.labels
        && columnValues.values.indexOf(value) > -1
        && columnValues.labels.length > columnValues.values.indexOf(value)
      ) {
        return columnValues.labels[columnValues.values.indexOf(value)];
      }
      return value;
    },
    formatColumn:function(col){
      var that = this
      if (this.attributes[col] === null || this.attributes[col] === "") {
        return '&mdash;'
      } else {
        var columnModel = this.collection.options.columns.findWhere({column:col})

        switch (columnModel.get("type")){
          case "index":
            if (columnModel.id === 'references') {
              if (this.attributes[col] === null) {
                return ""
              } else {
                return _.map(this.attributes[col].split(","),function(refid){
                  var ref = this.collection.options.references.get(refid)
                  return typeof ref !== "undefined" ? ref.getTitle() : ""
                },this).join(", ")
              }
            } else if (columnModel.id === 'trigger_event_id') {
              if (this.attributes[col] === null) {
                return ""
              } else {
                return this.attributes[col]
              }
            }
            return this.attributes[col]
            break
          case "ordinal":
          case "categorical":
            if (this.attributes[col] === null) {
              return ""
            } else if (columnModel.get('separator')){
              return _.map(
                this.attributes[col].split(columnModel.get('separator')),
                function(val) {
                  return that.decodeValue(val.trim(), columnModel.get('values')).trim();
                },
              ).join(columnModel.get('separator') + ' ')
            } else {
              return this.decodeValue(this.attributes[col], columnModel.get('values')).trim();
            }
            break
          case "discrete":
            //round to 2 decimals
            return parseInt(this.attributes[col]);
            break
          case "quantitative":
            //round to 2 decimals
            return Math.round(this.attributes[col] * 100) / 100
            break
          case "spatial":
            //round to 3 decimals
            return Math.round(this.attributes[col] * 1000) / 1000
            break
          case "date" :
            var spec = 't';
            if (columnModel.get("specificityColumn")) {
              spec = this.attributes[columnModel.get("specificityColumn")]
            }
            var date = new Date(this.attributes[col]);
            if (spec === 'y') {
              return date.getFullYear();
            }
            if (spec === 'm' || spec === 'd' ) {
              return date.toLocaleDateString('en-NZ')
            }
            return date.toLocaleString('en-NZ')
            break
          default:
            return this.attributes[col]
            break
        }
      }
    },

    pass:function(query) {
      var columnCollection = this.collection.options.columns
      var pass = true
      var keys = _.keys(query)
      var i = 0
      // console.log(keys)
      while(i < keys.length && pass) {
        var key = keys[i]
        // keyword search
        if (key === "s") {
          // pass when match with any searchable columns
          pass = false
          var columns  = columnCollection.byAttribute("searchable").models
          var queryStr = query["s"].toString()

          // match multiple words
          // see http://stackoverflow.com/questions/5421952/how-to-match-multiple-words-in-regex
          var regex = ''
          _.each(queryStr.split(' '), function(str){
            regex += '(?=.*\\b'+str+')'
          })
          var pattern = new RegExp(regex, "i")

          var j = 0
          while (j < columns.length && !pass){
            var column = columns[j].get("queryColumn")
            var value = this.get(column)
            if (value !== null && value !== ""){
              // exact match for id
              if (column === "id") {
                pass = value.toString() === queryStr
              } else {
                if (queryStr.length > 3) {
                  value = value.toString()
                    .replace(/[āĀ]/, "a")
                    .replace(/[ēĒ]/, "e")
                    .replace(/[īĪ]/, "i")
                    .replace(/[ōŌ]/, "o")
                    .replace(/[ūŪ]/, "u")

                  pass = pattern.test(value)
                }
              }
            }
            j++
          }
        } else {

          var columnModel = columnCollection.byQueryColumn(key)
          if (typeof columnModel !== "undefined") {
            var column = columnModel.get("queryColumn")
            var condition = query[key]
            // console.log('columnModel', columnModel, this.get(column), condition)
            // check min
            if (key === columnModel.getQueryColumnByType("min")) {
              if (column === "longitude") {
                if(this.get(column) === null) {
                  pass = false
                } else {
                  var value = this.get(column) < 0 ? this.get(column) + 360 : this.get(column)
                  var condition = parseFloat(condition) < 0 ? parseFloat(condition) + 360 : parseFloat(condition)
                  if (value < condition) {
                    pass = false
                  }
                }
              } else if (columnModel.get('type') === 'date' && Date.parse(condition)) {
                if(this.get(column) === null || this.get(column) < Date.parse(condition)) {
                  pass = false
                }
              } else {
                if(this.get(column) === null || this.get(column) < parseFloat(condition)) {
                  pass = false
                }
              }
            // check max
            } else if (key === columnModel.getQueryColumnByType("max")) {
              if (column === "longitude") {
                if(this.get(column) === null) {
                  pass = false
                } else {
                  var value = this.get(column) < 0 ? this.get(column) + 360 : this.get(column)
                  var condition = parseFloat(condition) < 0 ? parseFloat(condition) + 360 : parseFloat(condition)

                  if (value > condition) {
                    pass = false
                  }
                }
              } else if (columnModel.get('type') === 'date' && Date.parse(condition)) {
                if(this.get(column) === null || this.get(column) > Date.parse(condition)) {
                  pass = false
                }
              } else {
                if(this.get(column) === null || this.get(column) > parseFloat(condition)) {
                  pass = false
                }
              }
            // check equality
            // check equality
            } else {
              // try number
              if(isNumber(condition) && !columnModel.get('type') === 'categorical') {
                if(this.get(column) === null || this.get(column) !== parseFloat(condition)) {
                  pass = false
                }
              } else {
                // test null
                var values
                if( this.get(column) === null || this.get(column) === "") {
                  values = ["null"]
                } else {
                  if (isNumber(this.get(column))){
                    values = [this.get(column)]
                  } else if (columnModel.get('separator')) {
                    values = _.map(this.get(column).split(columnModel.get('separator')),function(val){return val.trim()})
                    if (columnModel.get('auto-multiple') === 1 && values.length > 1) {
                      values = _.union(values, ['multiple'])
                    }
                  } else {
                    values = [this.get(column)]
                  }
                }
                var conditions = typeof condition === 'string' ? [condition] : condition

                if(_.intersection(conditions,values).length === 0) {
                  pass = false
                }
                // now also check for combo column
                var comboColumnModel;
                var comboColumn;
                if (columnModel.get('combo') === 1) {
                  comboColumnModel = columnModel.collection.get(columnModel.get('comboColumnId'))
                  if (typeof comboColumnModel !== "undefined") {
                    comboColumn = comboColumnModel.get("queryColumn")
                    var values
                    if( this.get(comboColumn) === null || this.get(comboColumn) === "") {
                      values = ["null"]
                    } else {
                      if (isNumber(this.get(comboColumn))){
                        values = [this.get(comboColumn)]
                      } else if (comboColumnModel.get('separator')) {
                        values = _.map(this.get(comboColumnModel).split(comboColumnModel.get('separator')),function(val){return val.trim()})
                      } else {
                        values = [this.get(comboColumn)]
                      }
                    }
                    var conditions = typeof condition === 'string' ? [condition] : condition
                    if(_.intersection(conditions,values).length === 0) {
                      pass = false
                    }
                  }
                }
              }
            }
          }
        }
        i++
      }
      return pass
    },
    passXY:function(x,y){
      if(this.attributes.active && this.getLayer()){
        return this.getLayer().includesXY(x,y)
      } else {
        return false
      }
    },
    // TODO allow some buffer (in px)
    // also consider mixinfg records and sources in same mouseover popup
    passSameLocation:function(refRecord){
      if (
        refRecord
        && refRecord.getLayer()
        && refRecord.getLayer().attributes.mapLayer
        && refRecord.getLayer().attributes.mapLayer.getLayers()[0]
        && this.getLayer()
        && this.getLayer().attributes.mapLayer
        && this.getLayer().attributes.mapLayer.getLayers()[0]
      ) {
        var latLngRef = refRecord.getLayer().attributes.mapLayer.getLayers()[0].getLatLng()
        var latLng = this.getLayer().attributes.mapLayer.getLayers()[0].getLatLng()
        return latLngRef.lat === latLng.lat && latLngRef.lng === latLng.lng
      } else {
        return false
      }
    }
  });

  return RecordModel;

});
