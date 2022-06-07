define([
  'jquery', 'underscore', 'backbone'
], function($,_, Backbone){

  var ReferenceModel = Backbone.Model.extend({
    initialize : function(options) {
      this.options = options || {};
      // map data attributes
      this.initAttributes()
      if (typeof this.attributes.attributeMap !== 'undefined'){
        this.mapAttributes(this.attributes.attributeMap)
      }
    },
    initAttributes:function(){
      _.each(
        this.attributes,
        function(value,key){
          if (value === '') {
            this.set(key, null)
          }
        },
        this
      )
    },
    mapAttributes:function(attributeMap){
      _.each(
        attributeMap,
        function(attr,key){
          this.set(key, this.attributes[attr] !== null
            ? this.attributes[attr]
            : null
          )

        },
        this
      )
    },
    getTitle:function(){
      return this.attributes.short
    },
    getReference:function(){
      return this.attributes.reference
    },
    getUrl:function(short){
      short = typeof short !== 'undefined' ? short : false
      var url = this.attributes.website_report && short
        ? this.attributes.website_report.substring(0, 50) + "&hellip;"
        : this.attributes.website_report
      return url && url.indexOf('://') === -1
        ? 'http://' + url
        : url
    },
    getDoi:function(){
      return this.attributes.doi
    },

  });

  return ReferenceModel;

});
