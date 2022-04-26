define([
  'jquery', 'underscore', 'backbone',
  'models/ViewModel'
], function($,_, Backbone,ViewModel) {

  return ViewModel.extend({
    initialize : function(options){
      // console.log('TableModel', options)
      this.options = options || {};
      this.set('expanded',false)
      this.set("tableSortOrder","1")
      this.set("tableSortColumn","id")

    },
    setCurrentRecords : function(currentRecords){
      // console.log('TableModel setCurrentRecords', currentRecords)
      this.set('currentRecordCollection', currentRecords) // new active layers
    },
    getCurrentRecords : function(){
      return this.attributes.currentRecordCollection
    },
    getSortedRecords : function(){
      var records = this.attributes.currentRecordCollection.clone()
      var order = parseInt(this.attributes.tableSortOrder)
      var that = this
      records.comparator = function(a,b){
        var aval = a.get(that.attributes.tableSortColumn)
        var bval = b.get(that.attributes.tableSortColumn)
        if (aval === null || aval === "" || bval === null || bval === "" ) {
          if ((aval === null || aval === "") && (bval !== null && bval !== "" )) {
            return 1
          }
          if ((aval !== null && aval !== "") && (bval === null || bval === "" )) {
            return -1
          }
          return (aval > bval ? 1 : (bval > aval) ? -1 : 0) * order;
        }
        if (isNumber(aval) && !isNumber(bval)) {
          return 1 * order;
        }
        if (isNumber(bval) && !isNumber(aval)) {
          return -1 * order;
        }
        if (isNumber(bval) && isNumber(aval)) {
          return (parseFloat(aval) > parseFloat(bval) ? 1 : -1) * order
        }
        // if (isNumber(aval.toString()[0]) && isNumber(bval.toString()[0])) {
        //   return (parseInt(aval) > parseInt(bval) ? 1 : -1) * order
        // }
        return (aval > bval ? 1 : -1) * order

      }
      records.sort()
      return records.models
    },
    allExpanded : function(){
      return this.attributes.expanded
    },
    setExpanded : function(bool){
      return this.set("expanded",bool)
    },
  });


});
