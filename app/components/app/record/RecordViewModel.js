define([
  'jquery', 'underscore', 'backbone',
  'models/ViewModel'
], function($,_, Backbone,ViewModel) {

  return ViewModel.extend({
    initialize : function(options){
      this.options = options || {};
    },
    getSections: function(){
      if (this.attributes.columnGroupCollection) {
        // figure out sections from column groups
        return _.groupBy(
          _.filter(
            this.attributes.columnGroupCollection.models,
            function(group) {
              return group.get('section')
            }
          ),
          function(group) {
            return group.get('section')
          },
          this
        );
      }
      return {};
    },
  });
});
