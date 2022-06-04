define([
  'jquery', 'underscore', 'backbone'
], function($,_, Backbone
){

  return Backbone.Model.extend({
    initialize : function(options) {
      this.options = options || {};


      //default settings
      this.set({
        column :          this.attributes.column || this.attributes.id,
        title :           this.attributes.title || this.attributes.id,
        placeholders :    this.attributes.placeholders || null,
        addons :          this.attributes.addons || null,
        description :     this.attributes.description || this.attributes.hint || null,
        descriptionMore:  this.attributes.descriptionMore || "",
        hint :            this.attributes.hint || "",
        // column type
        type :            this.attributes.type || "text",
        // content group
        group :           this.attributes.group || "meta",
        // how multiple values are separated
        separator :       typeof this.attributes.separator !== "undefined" ? this.attributes.separator : null,
        // offer as filter option
        filterable :      typeof this.attributes.filterable !== "undefined" ? this.attributes.filterable : 1,
        // offer as colorable map marker option
        colorable :       typeof this.attributes.colorable !== "undefined" ? this.attributes.colorable : 0,
        // show in table
        table :           typeof this.attributes.table !== "undefined" ? this.attributes.table : 1,
        // show on single record view
        single :          typeof this.attributes.single !== "undefined" ? this.attributes.single : 1,
        // also show when not expanded
        isDefault:        typeof this.attributes['default'] !== "undefined" ? this.attributes['default'] : 0,
        isDefaultFilter:  typeof this.attributes.defaultFilter !== "undefined" ? this.attributes.defaultFilter : 0,
        // allow keyword search
        searchable :      typeof this.attributes.searchable !== "undefined" ? this.attributes.searchable : 0,
        // allow sorting in table
        sortable :        typeof this.attributes.sortable !== "undefined" ? this.attributes.sortable : 1,
        blanks :          typeof this.attributes.blanks !== "undefined" ? this.attributes.blanks : 0,
        // column can have multiple values
        multiples :       typeof this.attributes.multiples !== "undefined" ? this.attributes.multiples : 0,
        // column can be plotted in marginal plot
        plot :            typeof this.attributes.plot !== "undefined" ? this.attributes.plot : 0,
        values :          this.attributes.values || "auto",
        combo:            typeof this.attributes.combo !== "undefined" ? this.attributes.combo : 0,
        comboMain:        this.attributes.comboMain || 0,
        comboColumnId:    this.attributes.comboColumnId || null,
        comboType:        this.attributes.comboType || null,
        comboTitle:       this.attributes.comboTitle || this.attributes.title || this.attributes.id,
        comboDescription: this.attributes.comboDescription || this.attributes.description || "",
        plotMax:          this.attributes.plotMax || null,
        plotColor:        this.attributes.plotColor || "#fff",
        unit:             this.attributes.unit || null,
        showOnPage:       {
          values: false,
          valueDescription: false
        }
      })
      if (this.get('isDefault') === 1) {
        this.set('isDefaultFilter', 1);
      }
      // set
      this.set('queryColumn', this.attributes.queryColumn || this.attributes.column)
      if (typeof this.attributes.query === "object") {
        this.set('queryColumnByType', {
          value: this.attributes.queryColumn,
          min: this.attributes.query.min,
          max: this.attributes.query.max
        })
      } else {
        this.set('queryColumnByType', {
          value:this.attributes.queryColumn,
          min: null,
          max: null
        })
      }


      if (
        this.attributes.type === "spatial" ||
        this.attributes.type === "quantitative" ||
        this.attributes.type === "discrete"
      ) {
        if (this.attributes.placeholders === null){
          this.set("placeholders", {min:"Min",max:"Max"})
        }
      }
      if (this.attributes.type === "spatial") {
        if (this.attributes.addons === null){
          this.set("addons", {min:"Min",max:"Max"})
        }
      }
      if (this.attributes.type === "date") {
        if (this.attributes.placeholders === null){
          this.set("placeholders", {min:"After (yyyy-mm-dd)",max:"Before (yyyy-mm-dd)"})
        }
      }


      if (this.attributes.values === "auto") {
        this.attributes.showOnPage.values = false
      } else {
        if(typeof this.attributes.values.values !== "undefined") {
          this.attributes.showOnPage.values = true
          if(typeof this.attributes.values.labels === "undefined") {
            this.attributes.showOnPage.values = false
            this.attributes.values.labels = _.clone(this.attributes.values.values)
          }
          if(typeof this.attributes.values.hints === "undefined") {
            this.attributes.values.hints = []
          }
          if(typeof this.attributes.values.descriptions === "undefined") {
            this.attributes.values.descriptions = this.attributes.values.hints
          }
          if (this.attributes.values.descriptions.length > 0){
            this.attributes.showOnPage.values = true
            this.attributes.showOnPage.valueDescription = true
          }
        }
      }



    },
    getQueryColumnByType: function(type){
      type = typeof type !== "undefined" ? type : "value"
      return this.attributes.queryColumnByType[type]
    },
    getQueryColumn: function(){
      return this.attributes.queryColumn
    },
    getValues : function(){
      return this.attributes.values
    },
    getType : function(){
      return this.attributes.type
    },
    getTitle : function(){
      return this.attributes.title
    },
    getUnit : function(){
      return this.attributes.unit
    },
    hasMoreDescription: function(){
      return this.attributes.descriptionMore !== ""
      || (typeof this.attributes.values.descriptions !== "undefined" && this.attributes.values.descriptions.length > 0)
    },
    getColor:function(value){
      if(this.get("colorable") === 1) {
        value = value === null ? "null" : value
        if(this.attributes.values.colors) {
          var index = this.attributes.values.values.indexOf(value)
          return this.attributes.values.colors[index]
        } else if(this.attributes.values.colorGroups) {
          var group = this.getColorGroup(value)
          return group.color;
        }
      }
    },
    getColorGroup:function(value){
      var group = _.find(this.attributes.values.colorGroups, function(group) {
        return group.values.indexOf(value) > -1;
      })
      return group || { label: "color group not found", color: "#000000"};
    }
  });

});
