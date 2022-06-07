define(["jquery","underscore","backbone","bootstrap","text!./mapPlotLat.html","text!./mapPlotLatPlot.html","text!./mapPlotLatControl.html","text!./mapPlotLatRecordMarker.html","text!./mapPlotLatRecordBelow.html","text!./mapPlotLatRecordBar.html","text!./mapPlotLatRecordAbove.html","text!./mapPlotLatRecord.html"],function(t,e,o,l,r,i,d,n,s,a,c,h){return o.View.extend({events:{"click .expand":"expand","click .select-record":"selectRecord","click .select-column":"selectColumn","mouseenter .select-record":"mouseOverRecord","mouseleave .select-record":"mouseOutRecord","click .nav-link":"handleNavLink"},initialize:function(){this.handleActive(),this.render(),this.listenTo(this.model,"change:active",this.handleActive),this.listenTo(this.model,"change:currentRecordCollection",this.recordsUpdated),this.listenTo(this.model,"change:selectedRecordId",this.selectedRecordUpdated),this.listenTo(this.model,"change:mouseOverRecordId",this.mouseOverRecordUpdated),this.listenTo(this.model,"change:outPlotColumns",this.updateOutPlotColumns),this.listenTo(this.model,"change:expanded",this.expandedUpdated),this.RECORD_NO=30},expand:function(){this.model.getExpanded()?this.model.setExpanded(!1):this.model.setExpanded(!0)},expandedUpdated:function(){this.model.getExpanded()?this.$el.addClass("expanded"):this.$el.removeClass("expanded"),this.renderPlot()},render:function(){return this.$el.html(e.template(r)({t:this.model.getLabels()})),this.renderControl(),this},renderControl:function(){this.$("#plot-control").html(e.template(d)({t:this.model.getLabels(),columns:e.map(this.model.get("columnCollection").models,function(t){return{id:t.id,title:t.getTitle(),active:this.model.get("outPlotColumns").indexOf(t.id)>-1,color:t.get("plotColor"),tooltip:t.get("description"),tooltip_more:t.hasMoreDescription()}},this)})),this.$('[data-toggle="tooltip"]').tooltip()},renderPlot:function(){var t=this.model.getCurrentRecords();if(t.length>0){var o=e.reject(this.model.get("columnCollection").models,function(t){return-1===this.model.get("outPlotColumns").indexOf(t.id)},this),l=e.sortBy(t,function(t){return t.get("latitude")}).reverse();this.model.getExpanded()||(l=l.slice(0,this.RECORD_NO)),l.length<this.RECORD_NO?this.$(".plot-bottom-buttons").hide():this.$(".plot-bottom-buttons").show();var r=e.map(o,function(t){return{cap:t.get("plotMax"),color:t.get("plotColor"),unit:t.getUnit()||""}}),d=e.map(l,function(t){var l=t.getColor().colorToRgb();return e.template(h)({id:t.id,selected:t.isSelected(),marker:e.template(n)({marker_color:t.getColor(),marker_fillColor:"rgba("+l[0]+","+l[1]+","+l[2]+",0.4)"}),bars:e.reduce(o,function(o,l){var r=t.getColumnValue(l.getQueryColumn()),i=null!==r?r:0;return o.bars.push(e.template(a)({value:i,width:Math.max(Math.min(100,i/l.get("plotMax")*100),0),label:null!==r?i:this.model.getLabels().out.map.plot.no_data,color:l.get("plotColor")})),o.below.push(e.template(s)({value:i,color:l.get("plotColor")})),o.above.push(e.template(c)({value:i,color:l.get("plotColor"),cap:l.get("plotMax")})),o},{below:[],bars:[],above:[]},this)})},this);this.$("#plot-plot").html(e.template(i)({records:d,columns:r,anySelected:""!==this.model.get("selectedLayerId")}))}else this.$(".plot-bottom-buttons").hide(),this.$("#plot-plot").html("<div class='hint hint-no-records'>"+this.model.getLabels().out.map.plot.no_records_hint+"</p>")},handleActive:function(){this.model.isActive()?(this.$el.show(),this.model.setExpanded(!1),this.renderPlot()):this.$el.hide()},mouseOverRecordUpdated:function(){var t=this.model.get("mouseOverRecordId");this.$(".select-record").removeClass("hover"),""!==t&&this.$(".select-record[data-recordid='"+t+"']").addClass("hover")},selectedRecordUpdated:function(){this.renderPlot()},recordsUpdated:function(){this.$el.scrollTop(0),this.renderPlot()},updateOutPlotColumns:function(){this.renderPlot(),this.renderControl()},selectColumn:function(o){o.preventDefault();var l,r=t(o.currentTarget).attr("data-columnid");l=this.model.get("outPlotColumns").indexOf(r)>-1?e.without(this.model.get("outPlotColumns"),r):e.union(this.model.get("outPlotColumns"),[r]),this.$el.trigger("plotColumnsSelected",{columns:l})},selectRecord:function(e){e.preventDefault(),this.$el.trigger("recordSelect",{id:"r"+t(e.currentTarget).attr("data-recordid")})},mouseOverRecord:function(e){e.preventDefault(),this.$el.trigger("recordMouseOver",{id:t(e.currentTarget).attr("data-recordid")})},mouseOutRecord:function(e){e.preventDefault(),this.$el.trigger("recordMouseOut",{id:t(e.currentTarget).attr("data-recordid")})},handleNavLink:function(e){e.preventDefault(),e.stopPropagation(),this.$el.trigger("navLink",{id:t(e.currentTarget).attr("data-id"),anchor:t(e.currentTarget).attr("data-page-anchor"),route:"page",type:"page"})}})});