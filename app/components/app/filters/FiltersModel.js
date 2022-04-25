define([
  'jquery', 'underscore', 'backbone',
  'models/ViewModel'
], function($,_, Backbone,ViewModel) {

  return ViewModel.extend({
    initialize : function(options){
      this.options = options || {};
      // expanded column group
      this.set('expanded',[])
      this.set('expandedSections',[])
      this.set('focus','record')
      if (this.get("columnGroupCollection")) {
        this.set('sections', this.groupFilterGroups())
      }
    },
    groupFilterGroups: function() {
      var filterGroups = this.get("columnGroupCollection").filter(
        function(model) {
          return typeof model.get('section') !== 'undefined' &&
            (typeof model.get('filter') === 'undefined' || !!model.get('filter'));
        }
      );
      return _.groupBy(
        filterGroups,
        function(group) {
          return group.get('section')
        }
      );
    },
    getColumnGroupsBySections : function(){
      if (!this.attributes.sections){
        this.set('sections', this.groupFilterGroups())
      }
      return this.attributes.sections
    },
    getSections : function(){
      return _.map(
        Object.keys(this.getColumnGroupsBySections()),
        function(key){
          return ({
            title: key,
            id: key,
            classes: '',
          })
        });
    },
    getExpanded : function(){
      return this.attributes.expanded
    },
    allExpanded : function(){
      return this.attributes.expanded.length === this.attributes.columnGroupCollection.length
    },
    isExpanded : function(groupId){
      return this.attributes.expanded.indexOf(groupId) > -1
    },
    setExpanded : function(groups){
      this.set("expanded",groups)
    },
    getExpandedSection : function(){
      return this.attributes.expandedSection
    },
    isExpandedSection : function(sectionId){
      return this.attributes.expandedSection === sectionId
    },
    setExpandedSection : function(sectionId){
      this.set("expandedSection",sectionId)
    },
    getFocus : function(){
      return this.attributes.focus
    },
    setFocus : function(view){
      this.set("focus",view)
    },
    addExpanded : function(groups){
      if (typeof groups === "object") {
        this.set("expanded",_.uniq(this.attributes.expanded.concat(groups)))
      } else {
        this.set("expanded",_.uniq(this.attributes.expanded.concat([groups])))
      }
    },
    removeExpanded : function(groups){
      if (typeof groups === "object") {
        this.set("expanded",_.difference(this.attributes.expanded,groups))
      } else {
        this.set("expanded",_.without(this.attributes.expanded, groups))
      }
    },
  });


});
