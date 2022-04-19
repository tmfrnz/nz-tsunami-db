define([
  'jquery',  'underscore',  'backbone',
  'bootstrap',
  'jquery.select2/select2',
  'text!./mapControl.html',
  'text!./mapControlColorSelect.html',
  'text!./mapControlColorKey.html',
], function (
  $, _, Backbone,
  bootstrap,
  select2,
  template,
  templateColorSelect,
  templateColorKey
) {

  return Backbone.View.extend({
    events : {
      "change .select-color-attribute" : "colorColumnChanged",
      "click .nav-link" : "handleNavLink",
      "change .layer-checkbox" : "handleLayerToggled",
    },
    initialize : function () {
      this.handleActive()

      this.render()
      this.listenTo(this.model, "change:active",        this.handleActive);
      this.listenTo(this.model, "change:outColorColumn", this.updateOutColorColumn);
      this.listenTo(this.model, "change:outShowRecords", this.update);
      this.listenTo(this.model, "change:outShowSources", this.update);
      $(window).on("resize", _.debounce(_.bind(this.resize, this), 100));
    },
    resize: function(){
      this.update()
    },
    render: function () {
      this.$el.html(_.template(template)({
        t:this.model.getLabels(),
        showSources: this.model.getShowSources(),
        showRecords: this.model.getShowRecords()
      }))
      return this
    },
    initTooltips:function(){
      this.$('[data-toggle="tooltip"]').tooltip()
    },
    update : function(){
      var outColumn = this.model.getOutColorColumn()

      this.$('.color-attribute-selector-records').html(_.template(templateColorSelect)({
        classes: 'select-color-attribute-records',
        options:_.sortBy(
          _.map(
            this.model.get("columnCollection").byAttribute("colorable").byAttribute("multiples",0).models,
            function(column){
              return {
                value:column.id,
                label:column.get("title"),
                selected:column.get("column") === outColumn.get("column")
              }
          },this), function(option) {
            return option.label
          }
        )
      }))

      this.$('.select-color-attribute-records').select2({
        theme: "mapcontrol",
        minimumResultsForSearch: Infinity
      })

      if (this.model.getOutColorColumn()) {
        var values = this.model.getOutColorColumn().getValues()
        this.$('#type-records .color-attribute-key').html(_.template(templateColorKey)({
          t:this.model.getLabels(),
          title: outColumn.get("title"),
          tooltip: outColumn.get("description"),
          tooltip_more: outColumn.hasMoreDescription(),
          id:outColumn.id,
          values:_.map(values.values,function(value,index){
            var crgba = typeof values.colors !== "undefined"
              ? values.colors[index].colorToRgb()
              : [0,0,0]
            return {
              label: typeof values.labels !== "undefined" ? values.labels[index] : value,
              color: typeof values.colors !== "undefined" ? values.colors[index] : "",
              fillColor: 'rgba('+crgba[0]+','+crgba[1]+','+crgba[2]+',0.4)'
            }
          })
        }))
      }
      var showSources = this.model.getShowSources();
      var showRecords = this.model.getShowRecords();
      console.log('mapcontrol update', showRecords, showRecords == '1')
      $('.layer-checkbox-records').prop('checked', showRecords == '1');
      $('.layer-checkbox-sources').prop('checked', showSources == '1');

      this.initTooltips()
    },
    updateOutColorColumn:function(){
//      this.views.control.set({outColorColumn:this.model.getOutColorColumn()})
      this.update()
    },
    colorColumnChanged:function(e){
      e.preventDefault()
      this.$el.trigger('colorColumnChanged',{column:$(e.target).val()})
    },
    handleLayerToggled:function(e){
      e.preventDefault()
      var showSources = this.model.getShowSources();
      var showRecords = this.model.getShowRecords();
      var $target = $(e.target);
      var isChecked = $target.is(':checked');
      var type = $target.attr('data-type');
      var value = isChecked ? '1' : '0';
      if (type === 'records' && showRecords !== value) {
        this.$el.trigger('mapShowRecordsToggled', {value: value})
      }
      if (type === 'sources' && showSources !== value) {
        this.$el.trigger('mapShowSourcesToggled', {value: value})
      }
    },
    // event handlers for model change events
    handleActive : function(){
      if (this.model.isActive()) {
        this.$el.show()
      } else {
        this.$el.hide()
      }
    },
    handleNavLink : function(e){
      e.preventDefault()
      e.stopPropagation()

      this.$el.trigger('navLink',{
        id:$(e.currentTarget).attr("data-id"),
        anchor:$(e.currentTarget).attr("data-page-anchor"),
        route:"page",
        type:"page"
      })
    },

  });

});
