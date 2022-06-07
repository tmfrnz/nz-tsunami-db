define([
  'jquery', 'underscore', 'backbone'
], function($,_, Backbone){

  var ProxyModel = Backbone.Model.extend({
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
            : ''
          )

        },
        this
      )
    },
    getDescription:function(){
      return this.attributes.description
    }
  });

  return ProxyModel;

});
