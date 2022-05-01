define([
  'jquery',  'underscore',  'backbone',
  'bootstrap',
  'text!./recordMain.html',
  'text!./recordMenu.html',
  'text!./recordColumnText.html',
  'text!./recordColumnSource.html',
  'text!./recordColumnRecords.html',
  // 'text!./recordColumnProxies.html',
  'text!./recordColumnReferences.html',
], function (
  $, _, Backbone,
  bootstrap,
  templateMain,
  templateRecordMenu,
  templateColumnText,
  templateColumnSource,
  templateColumnRecords,
  templateColumnReferences
) {

  var RecordView = Backbone.View.extend({
    events : {
      "click .close-record" : "closeRecord",
      "click .nav-link" : "handleNavLink",
      "click .select-record" : "selectRecord",
      "click .record-top-menu-link": "handleInViewLink"
    },
    initialize : function () {
      this.render()
      this.listenTo(this.model, "change:active", this.handleActive);
      this.listenTo(this.model, "change:record", this.update);

      this.scroll_offset_group = 40
      this.waypoints_offset_group = 200
      this._scrolling = false
      // $(window).on('resize', _.debounce(_.bind(this.resize, this), 200))

    },
    render: function () {
      return this
    },
    renderTopMenu: function() {
      return _.template(templateRecordMenu)({
        groups:_.filter(this.model.get("columnGroupCollection").models, function(group) {return group.id !== "id"})
      })
    },

    update: function () {

      var columnCollection = this.model.get("columnCollection").byAttribute("single")
      this.$el.html(_.template(templateMain)({
        t:this.model.getLabels(),
        recordid: this.model.get("record").id,
        recordType: this.model.get("type"),
        recordMenu: this.renderTopMenu(),
        columnGroups:_.filter(
          _.map(this.model.get("columnGroupCollection").models,function(group){
            // group classes
            var classes = "group-" + group.id
//            console.log(group)
            var columnsByGroup = columnCollection.byGroup(group.id).models
            if (columnsByGroup.length === 0 || group.id === "id") {
              return false
            } else {
              return {
                title:group.get("title"),
                hint:group.get("hint"),
                id:group.id,
                classes: classes,
                groupColumns: _.filter(
                  _.map(columnsByGroup,function(column){
                    return this.getColumnHtml(column, group.id)
                  },this),
                  function(html){
                    return html !== false
                  }
                )
              }
            }
          },this),
          function(group){
            return group !== false
          }
        )
      }))

      this.initTooltips()
    },
    groupActive: function (groupIndex) {
      this.$('.record-top-menu-link').removeClass('active')
      this.$('.record-top-menu-link[data-index="' + groupIndex + '"]').addClass('active')
    },
    initTooltips:function(){
      this.$('[data-toggle="tooltip"]').tooltip()
    },
    getColumnHtml:function(column){
      var record = this.model.get("record")
      // console.log('getColumnHtml', column.get('type'))
      switch (column.get("type")){
        // lookup related records
        case "reverse":
          if (column.id === 'related-records') {
            // console.log('getColumnHtml', record.getChildren(), record)
            return _.template(templateColumnRecords)({
              t:this.model.getLabels(),
              title:column.get("title"),
              records:record.getChildren(),
              id:column.id,
              tooltip:column.get("description"),
              tooltip_more:column.hasMoreDescription(),
              hint:column.get("hint")
            })
          }
        case "index":
          if (column.id === 'references') {
            return _.template(templateColumnReferences)({
              t:this.model.getLabels(),
              title:column.get("title"),
              references:record.getReferences(),
              id:column.id,
              tooltip:column.get("description"),
              tooltip_more:column.hasMoreDescription(),
              hint:column.get("hint"),
              recordType: this.model.get("type")
            })
          }
          if (column.id === 'trigger_event_id' && record.getSource()) {
            return _.template(templateColumnSource)({
              t:this.model.getLabels(),
              title:column.get("title"),
              source:record.getSource(),
              id:column.id,
              tooltip:column.get("description"),
              tooltip_more:column.hasMoreDescription(),
              hint:column.get("hint")
            })
          }
          // TODO source
          break
        case "date" :
          if(column.get('combo') === 1) {
            // only use main combo column
            if (column.get('comboMain') === 1) {
              var combo_column = this.model.get("columnCollection").get(column.get('comboColumnId'))
              var valueMin = ""
              var valueMax = ""
              if(column.get('comboType') === "max") {
                valueMin = record.getColumnValue(combo_column.get("column"),true)
                valueMax = record.getColumnValue(column.get("column"),true)

              } else {
                valueMin = record.getColumnValue(column.get("column"),true)
                valueMax = record.getColumnValue(combo_column.get("column"),true)
              }

              return _.template(templateColumnText)({
                t:this.model.getLabels(),
                title:valueMin === valueMax && column.get("comboTitleEqual")
                  ? column.get("comboTitleEqual")
                  : column.get("comboTitle"),
                value:valueMin === valueMax ? valueMin : valueMin + ' - ' + valueMax,
                id:column.id,
                tooltip:column.get("comboDescription"),
                tooltip_more:column.hasMoreDescription(),
                hint:column.get("hint")
              })
            }
          }
          break
        case "binary":
        case "quantitative":
        case "spatial":
        case "categorical":
        case "ordinal":
        case "text":
          if(column.get('combo') === 1) {
            // only use main combo column
            if (column.get('comboMain') === 1) {
              var combo_column = this.model.get("columnCollection").get(column.get('comboColumnId'))
              var valueMin = ""
              var valueMax = ""
              if(column.get('comboType') === "max") {
                valueMin = record.getColumnValue(combo_column.get("column"))
                valueMax = record.getColumnValue(column.get("column"))
              } else {
                valueMin = record.getColumnValue(column.get("column"))
                valueMax = record.getColumnValue(combo_column.get("column"))
              }
              var hasMin = valueMin !== null && valueMin !== '';
              var hasMax = valueMax !== null && valueMax !== '';
              // check if we have lower bound only
              if (hasMin && !hasMax) {
                return _.template(templateColumnText)({
                  t:this.model.getLabels(),
                  title:column.get("comboTitleEqual")
                    ? column.get("comboTitleEqual")
                    : column.get("comboTitle"),
                  value: '> ' + valueMin,
                  id:column.id,
                  tooltip:column.get("comboDescription"),
                  tooltip_more:column.hasMoreDescription(),
                  hint:column.get("hint")
                })
              }

              // check if we have upper bound only
              if (!hasMin && hasMax) {
                return _.template(templateColumnText)({
                  t:this.model.getLabels(),
                  title:column.get("comboTitleEqual")
                    ? column.get("comboTitleEqual")
                    : column.get("comboTitle"),
                  value: '< ' + valueMax,
                  id:column.id,
                  tooltip:column.get("comboDescription"),
                  tooltip_more:column.hasMoreDescription(),
                  hint:column.get("hint")
                })
              }
              if (!hasMin && !hasMax) {
                return _.template(templateColumnText)({
                  t:this.model.getLabels(),
                  title:column.get("comboTitleEqual")
                    ? column.get("comboTitleEqual")
                    : column.get("comboTitle"),
                  value: record.getColumnValue(combo_column.get("column"), true),
                  id:column.id,
                  tooltip:column.get("comboDescription"),
                  tooltip_more:column.hasMoreDescription(),
                  hint:column.get("hint")
                })
              }
              return _.template(templateColumnText)({
                t:this.model.getLabels(),
                title:valueMin === valueMax && column.get("comboTitleEqual")
                  ? column.get("comboTitleEqual")
                  : column.get("comboTitle"),
                value:valueMin === valueMax ? valueMin : valueMin + ' - ' + valueMax,
                id:column.id,
                tooltip:column.get("comboDescription"),
                tooltip_more:column.hasMoreDescription(),
                hint:column.get("hint")
              })
            }
            return false;
          }
          return _.template(templateColumnText)({
            t:this.model.getLabels(),
            title:column.get("title"),
            value:record.getColumnValue(column.get("column"),true),
            id:column.id,
            tooltip:column.get("description"),
            tooltip_more:column.hasMoreDescription(),
            hint:column.get("hint")
          })

          break
        default:
          return false
      }
    },


    handleActive : function(){
      if (this.model.isActive()) {
        this.$el.show()
      } else {
        this.$el.hide()
      }
    },


    selectRecord:function(e){
      e.preventDefault()
      var id = $(e.currentTarget).attr("data-recordid");
      var type = $(e.currentTarget).attr("data-recordtype");
      console.log(type, id)
      if (type === 'source') {
        this.$el.trigger('sourceSelect',{id: 's' + id})
      } else {
        this.$el.trigger('recordSelect',{id: 'r' + id})
      }
    },

    closeRecord : function(e){
      e.preventDefault()

      this.$el.trigger('recordClose')
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

    handleInViewLink: function(e){
      e.preventDefault()
      var scrolltop =
        this.$('.record-main').scrollTop()
        + this.$('.group-'+$(e.target).attr('data-group')).offset().top
        - this.$('.record-main').offset().top
        - this.scroll_offset_group

      this._scrolling = true
      var that = this;
      this.$('.record-main').animate({ scrollTop: scrolltop }, 300, function(){
        that._scrolling = false;
        that.groupActive($(e.target).attr('data-index'))
      });
    },


  });

  return RecordView;
});
