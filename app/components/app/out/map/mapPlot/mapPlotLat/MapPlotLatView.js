define([
  'jquery',  'underscore',  'backbone',
  'bootstrap',
  'text!./mapPlotLat.html',
  'text!./mapPlotLatPlot.html',
  'text!./mapPlotLatControl.html',
  'text!./mapPlotLatRecordMarker.html',
  'text!./mapPlotLatRecordBelow.html',
  'text!./mapPlotLatRecordBar.html',
  'text!./mapPlotLatRecordAbove.html',
  'text!./mapPlotLatRecord.html'
], function (
  $, _, Backbone,
  bootstrap,
  template,
  templatePlot,
  templateControl,
  templateRecordMarker,
  templateRecordBelow,
  templateRecordBar,
  templateRecordAbove,
  templateRecord
) {

  return Backbone.View.extend({
    events : {
      "click .expand": "expand",
      "click .select-record" : "selectRecord",
      "change .select-plot-attribute" : "plotColumnChanged",
      "mouseenter .select-record" : "mouseOverRecord",
      "mouseleave .select-record" : "mouseOutRecord",
      "click .nav-link" : "handleNavLink",
    },
    initialize : function () {
      this.handleActive()

      this.render()
      this.listenTo(this.model, "change:active",        this.handleActive);
      this.listenTo(this.model, "change:currentRecordCollection", this.recordsUpdated);
      this.listenTo(this.model, "change:selectedRecordId", this.selectedRecordUpdated);
      this.listenTo(this.model, "change:mouseOverRecordId", this.mouseOverRecordUpdated);
      this.listenTo(this.model, "change:outPlotColumn",this.updateOutPlotColumn);
      this.listenTo(this.model, "change:expanded", this.expandedUpdated);

      this.RECORD_NO = 30

    },
    expand:function(){
      if (this.model.getExpanded()) {
        this.model.setExpanded(false)
      } else {
        this.model.setExpanded(true)
      }
    },
    expandedUpdated: function () {
//      console.log("MapplotLatView.expandedUpdated 1");
      if (this.model.getExpanded()) {
        this.$el.addClass("expanded")
      } else {
        this.$el.removeClass("expanded")
      }
      this.renderPlot()
    },
    render: function () {
      this.$el.html(_.template(template)({
        t:this.model.getLabels()
      }))
      this.renderControl()
      return this
    },
    renderControl : function(){
      this.$("#plot-control").html(_.template(templateControl)({
        classes: 'select-plot-attribute',
        options:_.sortBy(
          _.map(
            this.model.get("columnCollection").models,
            function(column){
              return {
                value:column.id,
                label:column.get("title"),
                selected:this.model.get("outPlotColumn") === column.id,
              }
          },this), function(option) {
            return option.label
          }
        )
      }))
      this.$('.select-plot-attribute').select2({
        theme: "mapcontrol",
        minimumResultsForSearch: Infinity
      })
    },
    renderPlot : function(){
//        console.log("MapplotLatView.renderPlot 1");
      var records = this.model.getCurrentRecords()
      if (records.length > 0) {

        var column = _.find(this.model.get("columnCollection").models,function(col){
          return this.model.get("outPlotColumn") === col.id;
        },this)

//console.log("MapplotLatView.renderPlot 2", Date.now() - window.timeFromUpdate);
        var recordsSorted = _.sortBy(records,
            function(record){
              return record.get('latitude')
            }
          ).reverse()

          if (!this.model.getExpanded()) {
            recordsSorted = recordsSorted.slice(0, this.RECORD_NO)
          }

          if (recordsSorted.length < this.RECORD_NO) {
            this.$('.plot-bottom-buttons').hide()
          } else {
            this.$('.plot-bottom-buttons').show()
          }

        var dataColumns = [
          {
            cap:column.get("plotMax"),
            color:column.get("plotColor"),
            unit: column.getUnit() || '',
          }
        ]
//console.log("MapplotLatView.renderPlot 2b", Date.now() - window.timeFromUpdate);
        var dataRows = _.map(
          recordsSorted,
          function(record){
            var crgba = record.getColor().colorToRgb();
             // remember column ranges and record column values
            // remember record data
            var recordColumnValue = record.getColumnValue(column.getQueryColumn())
            var value = recordColumnValue !== null ? recordColumnValue : 0
            return _.template(templateRecord)({
              id:record.id,
              selected:record.isSelected(),
              marker: _.template(templateRecordMarker)({
                marker_color:record.getColor(),
                marker_fillColor:'rgba('+crgba[0]+','+crgba[1]+','+crgba[2]+',0.4)',
              }),
              bars: {
                below: [_.template(templateRecordBelow)({
                  value: value,
                  color: column.get("plotColor")
                })],
                bars: [_.template(templateRecordBar)({
                  value: value,
                  width: Math.max(Math.min(100,(value/column.get("plotMax"))*100),0),
                  label: recordColumnValue !== null ? value : this.model.getLabels().out.map.plot.no_data,
                  color: column.get("plotColor")
                })],
                above: [_.template(templateRecordAbove)({
                  value: value,
                  color: column.get("plotColor"),
                  cap: column.get("plotMax")
                })],
              }
            });
          }, this)
//console.log("MapplotLatView.renderPlot 2c", Date.now() - window.timeFromUpdate);

        this.$("#plot-plot").html(_.template(templatePlot)({
          records:dataRows,
          columns: dataColumns,
          anySelected:this.model.get("selectedLayerId") !== ""
        }))
//console.log("MapplotLatView.renderPlot 3", Date.now() - window.timeFromUpdate);

      } else {
        this.$('.plot-bottom-buttons').hide()
        this.$("#plot-plot").html("<div class='hint hint-no-records'>" + this.model.getLabels().out.map.plot.no_records_hint + "</p>")
      }


    },

    // event handlers for model change events
    handleActive : function(){
      if (this.model.isActive()) {
        this.$el.show()
        this.model.setExpanded(false)
        this.renderPlot()
      } else {
        this.$el.hide()
      }
    },

    mouseOverRecordUpdated:function(){
//      console.log("MapPlotLatView.mouseOverRecordUpdated")
      var id = this.model.get("mouseOverRecordId")
      this.$(".select-record").removeClass('hover')
      if (id !== "") {
        this.$(".select-record[data-recordid='"+id+"']").addClass('hover')
      }

    },
    selectedRecordUpdated:function(){
//      console.log('selectedRecordUpdated')
      this.renderPlot()
    },

    recordsUpdated:function(){
//      console.log('recordsUpdated')
//      this.model.setExpanded(false)
      this.$el.scrollTop(0)
      this.renderPlot()
    },


    updateOutPlotColumn:function(){
//      console.log('updateOutPlotColumn')
      this.renderPlot()
      this.renderControl()
    },















    plotColumnChanged:function(e){
      e.preventDefault()
      this.model.setExpanded(false)
      this.$el.trigger('plotColumnChanged',{column:$(e.target).val()})
    },

    selectRecord:function(e){
      e.preventDefault()
      this.$el.trigger('recordSelect',{id: 'r' + $(e.currentTarget).attr("data-recordid")})
    },
    mouseOverRecord:function(e){
      e.preventDefault()
      this.$el.trigger('recordMouseOver',{id:$(e.currentTarget).attr("data-recordid")})
    },
    mouseOutRecord:function(e){
      e.preventDefault()
      this.$el.trigger('recordMouseOut',{id:$(e.currentTarget).attr("data-recordid")})
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
