define([
  'jquery',  'underscore',  'backbone',
  'bootstrap',
  'jquery.select2/select2',
  'text!./mapControl.html',
  'text!./mapControlColorSelect.html',
  'text!./mapControlColorKey.html',
  'text!templates/triangleIcon.html'
], function (
  $, _, Backbone,
  bootstrap,
  select2,
  template,
  templateColorSelect,
  templateColorKey,
  templateTriangleIcon,
) {

  return Backbone.View.extend({
    events : {
      "change .select-color-attribute-records" : "colorColumnChanged",
      "change .select-color-attribute-sources" : "sourceColorColumnChanged",
      "click .nav-link" : "handleNavLink",
      "change .layer-checkbox" : "handleLayerToggled",
    },
    initialize : function () {
      this.handleActive()

      this.render()
      this.listenTo(this.model, "change:active",        this.handleActive);
      this.listenTo(this.model, "change:outColorColumn", this.updateOutColorColumn);
      this.listenTo(this.model, "change:outSourceColorColumn", this.updateOutSourceColorColumn);
      this.listenTo(this.model, "change:outShowRecords", this.update);
      this.listenTo(this.model, "change:outShowSources", this.update);
      $(window).on("resize", _.debounce(_.bind(this.resize, this), 100));
    },
    resize: function(){
      this.update()
    },
    render: function () {
      console.log('mapcontroilview render', this.model.getShowRecords())
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
    getKeyCategorical: function(columnValues, iconTemplate) {
      if (columnValues.colors) {
        return _.map(columnValues.values,function(value,index){
          var crgba = typeof columnValues.colors !== "undefined"
            ? columnValues.colors[index].colorToRgb()
            : [0,0,0]
          var color = typeof columnValues.colors !== "undefined" ? columnValues.colors[index] : "";
          return {
            label: typeof columnValues.labels !== "undefined" ? columnValues.labels[index] : value,
            color: color,
            fillColor: 'rgba('+crgba[0]+','+crgba[1]+','+crgba[2]+',0.4)',
            icon: iconTemplate && _.template(iconTemplate)({
              fill: color,
              color: color,
            })
          }
        })
      } else if (columnValues.colorGroups) {
        return _.map(columnValues.colorGroups, function(group){
          var crgba = group.color.colorToRgb();
          return {
            label: group.label,
            color: group.color,
            fillColor: 'rgba('+crgba[0]+','+crgba[1]+','+crgba[2]+',0.4)',
            icon: iconTemplate && _.template(iconTemplate)({
              fill: group.color,
              color: group.color,
            })
          }
        })
      }
    },
    update : function(){
      var showRecords = this.model.getShowRecords() !== '0';
      var showSources = this.model.getShowSources() !== '0';
      var outColumn = this.model.getOutColorColumn()
      var outSourceColumn = this.model.getOutSourceColorColumn()
      console.log('MCV update', showRecords)

      $('.layer-checkbox-records').prop('checked', showRecords == '1');
      $('.layer-checkbox-sources').prop('checked', showSources == '1');

      if (outColumn && showRecords) {
        this.$('.color-attribute-selector-records').show().html(_.template(templateColorSelect)({
          classes: 'select-color-attribute-records',
          options:_.sortBy(
            _.map(
              this.model.get("columnCollection").byAttribute("colorable").byAttribute("multiples",0).models,
              function(column){
                return {
                  value:column.id,
                  label:column.get("title"),
                  selected:column.get("column") === outColumn.get("column"),
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
        var columnValues = outColumn.getValues()
        this.$('#type-records .color-attribute-key').show().html(_.template(templateColorKey)({
          t:this.model.getLabels(),
          title: outColumn.get("title"),
          tooltip: outColumn.get("description"),
          tooltip_more: outColumn.hasMoreDescription(),
          id:outColumn.id,
          values: this.getKeyCategorical(columnValues),
        }))
      }

      if (outSourceColumn && showSources) {
        this.$('.color-attribute-selector-sources').show().html(_.template(templateColorSelect)({
          classes: 'select-color-attribute-sources',
          options:_.sortBy(
            _.map(
              this.model.get("sourceColumnCollection").byAttribute("colorable").byAttribute("multiples",0).models,
              function(column){
                return {
                  value:column.id,
                  label:column.get("title"),
                  selected:column.get("column") ===  outSourceColumn.get("column")
                }
            },this), function(option) {
              return option.label
            }
          )
        }))
        this.$('.select-color-attribute-sources').select2({
          theme: "mapcontrol",
          minimumResultsForSearch: Infinity
        })
        var columnValues = outSourceColumn.getValues()
        console.log('MCV', columnValues, outSourceColumn)
        this.$('#type-sources .color-attribute-key').show().html(_.template(templateColorKey)({
          t:this.model.getLabels(),
          title: outSourceColumn.get("title"),
          tooltip: outSourceColumn.get("description"),
          tooltip_more: outSourceColumn.hasMoreDescription(),
          id:outSourceColumn.id,
          values: this.getKeyCategorical(columnValues, templateTriangleIcon),
        }))
      }



      if (!outColumn || !showRecords) {
        this.$('#type-records .color-attribute-key').hide()
        this.$('.color-attribute-selector-records').hide()
      }
      if (!outSourceColumn || !showSources) {
        this.$('#type-sources .color-attribute-key').hide()
        this.$('.color-attribute-selector-sources').hide()
      }

      this.initTooltips()
    },
    updateOutColorColumn:function(){
//      this.views.control.set({outColorColumn:this.model.getOutColorColumn()})
      this.update()
    },
    updateOutSourceColorColumn:function(){
//      this.views.control.set({outColorColumn:this.model.getOutColorColumn()})
      this.update()
    },
    colorColumnChanged:function(e){
      e.preventDefault()
      this.$el.trigger('colorColumnChanged',{column:$(e.target).val()})
    },
    sourceColorColumnChanged:function(e){
      e.preventDefault()
      this.$el.trigger('sourceColorColumnChanged',{column:$(e.target).val()})
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
