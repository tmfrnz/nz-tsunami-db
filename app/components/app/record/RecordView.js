define([
  'jquery',  'underscore',  'backbone',
  'bootstrap',
  'text!./recordMain.html',
  'text!./recordMenu.html',
  'text!./recordColumnText.html',
  'text!./recordColumnTextSecondary.html',
  'text!./recordColumnSource.html',
  'text!./recordColumnRecords.html',
  // 'text!./recordColumnProxies.html',
  'text!./recordColumnReferences.html',
  'text!./recordColumnLink.html',
], function (
  $, _, Backbone,
  bootstrap,
  templateMain,
  templateRecordMenu,
  templateColumnText,
  templateColumnTextSecondary,
  templateColumnSource,
  templateColumnRecords,
  templateColumnReferences,
  templateColumnLink
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
      // var that = this
      var columnSections = this.model.getSections();
      var record = this.model.get("record");
      var labels = this.model.getLabels();
      var that = this;
      var columnSectionGroups = _.map(
        columnSections,
        function (sectionGroups, sectionId) {
          return {
            id: sectionId,
            groups: _.filter(
              _.map(
                sectionGroups,
                function(group) {
                  // group classes
                  var classes = "group-" + group.id
                  var columnsByGroup = columnCollection.byGroup(group.id).models
                  if (columnsByGroup.length === 0 || group.id === "id") {
                    return false;
                  } else {
                    return {
                      title:group.get("title"),
                      hint:group.get("hint"),
                      id:group.id,
                      classes: classes,
                      groupColumns: _.filter(
                        _.reduce(
                          columnsByGroup,
                          function(memo, column){
                            var result = memo.concat(that.getColumnHtml(column));
                            if (
                              column.get('certaintyColumn') ||
                              column.get('commentColumn')
                            ) {
                              var recValue = record.getColumnValue(column.get('column'));
                              if (recValue && recValue !== '') {
                                if (column.get('certaintyColumn')) {
                                  result = result.concat(that.getCertaintyColumnHtml(column.get('certaintyColumn')))
                                }
                                if (column.get('commentColumn')) {
                                  var commentValue = record.getColumnValue(column.get('commentColumn'))
                                  if (commentValue && commentValue !== '') {
                                    result = result.concat(that.getCommentColumnHtml(column.get('commentColumn'), column.get('commentColumnTitle')))
                                  }
                                }
                                if (column.get('commentColumns') && column.get('commentColumns').length > 0) {
                                  result = _.reduce(
                                    column.get('commentColumns'),
                                    function (memo, commentCol) {
                                      var commentValue = record.getColumnValue(commentCol.column);
                                      if (commentValue && commentValue !== '') {
                                        return memo.concat(
                                          that.getCommentColumnHtml(
                                            commentCol.column,
                                            commentCol.title
                                          )
                                        )
                                      }
                                      return memo;
                                    },
                                    result,
                                  )
                                }
                                if (column.get('dateColumns') && column.get('dateColumns').length > 0) {
                                  result = _.reduce(
                                    column.get('dateColumns'),
                                    function (memo, dateCol) {
                                      var minValue, maxValue;
                                      var specValue = dateCol.specificityColumn
                                        ? record.getColumnValue(dateCol.specificityColumn)
                                        : 't';
                                      if (dateCol.minColumn && dateCol.maxColumn) {
                                        minValue = new Date(
                                          record.parseDate(
                                            record.getColumnValue(dateCol.minColumn)
                                          )
                                        );
                                        maxValue = new Date(
                                          record.parseDate(
                                            record.getColumnValue(dateCol.maxColumn)
                                          )
                                        );
                                        if (specValue === 'y') {
                                          minValue = minValue.getFullYear();
                                          maxValue = maxValue.getFullYear();
                                        } else if (specValue === 'm' || specValue === 'd' ) {
                                          minValue = minValue.toLocaleDateString('en-NZ')
                                          maxValue = maxValue.toLocaleDateString('en-NZ')
                                        } else { // 't'
                                          minValue = minValue.toLocaleString('en-NZ')
                                          maxValue = maxValue.toLocaleString('en-NZ')
                                        }
                                        var res = memo.concat(
                                          that.getAuxRangeColumnHTML(
                                            dateCol.minColumn,
                                            minValue,
                                            maxValue,
                                            dateCol.title,
                                          )
                                        );
                                        if (dateCol.certaintyColumn) {
                                          res = res.concat(
                                            that.getCertaintyColumnHtml(
                                              dateCol.certaintyColumn,
                                              '&mdash; ' + labels.record.certainty_title
                                            )
                                          );
                                        }
                                        if (
                                          dateCol.commentColumn &&
                                          record.get(dateCol.commentColumn) &&
                                          record.get(dateCol.commentColumn).trim() !== ''
                                        ) {
                                          return res.concat(
                                            that.getCommentColumnHtml(
                                              dateCol.commentColumn,
                                              labels.record.time_comment
                                            )
                                          );
                                        }
                                        return res;
                                      }
                                      return memo;
                                    },
                                    result,
                                  )
                                  var commentValue = record.getColumnValue(column.get('commentColumn'))
                                  if (commentValue && commentValue !== '') {
                                    result = result.concat(that.getCommentColumnHtml(column.get('commentColumn')))
                                  }
                                }
                                if (column.get('elapsedColumn')) {
                                  var col = column.get('elapsedColumn');
                                  var minValue, maxValue;
                                  if (col.minColumn && col.maxColumn) {
                                    minValue = record.getColumnValue(col.minColumn);
                                    maxValue = record.getColumnValue(col.maxColumn);
                                    if (minValue || maxValue) {
                                      result = result.concat(
                                        that.getAuxRangeColumnHTML(
                                          col.minColumn,
                                          minValue,
                                          maxValue,
                                          col.title,
                                        )
                                      );
                                      if (col.certaintyColumn) {
                                        result = result.concat(
                                          that.getCertaintyColumnHtml(
                                            col.certaintyColumn,
                                            '&mdash; ' + labels.record.certainty_title
                                          )
                                        );
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            return result;
                          },
                          [],
                        ),
                        function(html){
                          return html !== false
                        }
                      )
                    };
                  }
                }
              ),
              function(group) {
                return !!group;
              }
            ),
          };
        }
      );

      this.$el.html(_.template(templateMain)({
        t:this.model.getLabels(),
        recordid: this.model.get("record").id,
        recordType: this.model.get("type"),
        typeSimple: this.model.get("type") === 'record' ? 'r' : 's',
        recordMenu: this.renderTopMenu(),
        columnSections: columnSectionGroups,
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
    getCommentColumnHtml:function(commentCol, title){
      var record = this.model.get("record");
      var labels = this.model.getLabels();
      return _.template(templateColumnTextSecondary)({
        t:labels,
        title: title || labels.record.comment,
        value: record.get(commentCol),
        id:commentCol
      })
    },
    getAuxRangeColumnHTML:function(id, minValue, maxValue, title){
      var labels = this.model.getLabels();
      return _.template(templateColumnTextSecondary)({
        t:labels,
        title: title || labels.record.comment,
        value:minValue === maxValue ? minValue : minValue + ' - ' + maxValue,
        id:id,
      })
    },
    getCertaintyColumnHtml:function(certCol, title){
      var record = this.model.get("record")
      var labels = this.model.getLabels();
      var value = labels.record.certainty_values[record.get(certCol)]
      return _.template(templateColumnTextSecondary)({
        t:labels,
        title: title || labels.record.certainty_title,
        value: value,
        id:certCol
      })
    },
    getColumnHtml:function(column){
      var record = this.model.get("record")
      // console.log('getColumnHtml', column.get('type'))
      switch (column.get("type")){
        // lookup related records
        case "related":
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
          if (column.id === 'primary_id') {
            if (record.getColumnValue(column.get("column")) && record.getColumnValue(column.get("column")) !== '') {
              return _.template(templateColumnSource)({
                t:this.model.getLabels(),
                title:column.get("title"),
                source:null,
                source_id:record.getColumnValue(column.get("column")),
                id:column.id,
                tooltip:column.get("description"),
                tooltip_more:column.hasMoreDescription(),
                hint:column.get("hint")
              });
            } else {
              return false
            }
          }
          // TODO source
          break
        case "date" :
          if(column.get('combo') === 1) {
            // only use main combo column
            if (column.get('comboMain') === 1) {
              var comboColumn = this.model.get("columnCollection").get(column.get('comboColumnId'))
              var valueMin = ""
              var valueMax = ""
              if(column.get('comboType') === "max") {
                valueMin = record.getColumnValue(comboColumn.get("column"),true)
                valueMax = record.getColumnValue(column.get("column"),true)

              } else {
                valueMin = record.getColumnValue(column.get("column"),true)
                valueMax = record.getColumnValue(comboColumn.get("column"),true)
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
        case "discrete":
        case "spatial":
        case "categorical":
        case "ordinal":
        case "text":
          if(column.get('combo') === 1) {
            // only use main combo column
            if (column.get('comboMain') === 1) {
              var comboColumn = this.model.get("columnCollection").get(column.get('comboColumnId'))
              var valueMin = ""
              var valueMax = ""
              if(column.get('comboType') === "max") {
                valueMin = record.getColumnValue(comboColumn.get("column"))
                valueMax = record.getColumnValue(column.get("column"))
              } else {
                valueMin = record.getColumnValue(column.get("column"))
                valueMax = record.getColumnValue(comboColumn.get("column"))
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
                  value: record.getColumnValue(comboColumn.get("column"), true),
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
        case "link":
          const url = column.get("url");
          return _.template(templateColumnLink)({
            t: this.model.getLabels(),
            title: column.get("title"),
            url: url.replace('[value]', record.getColumnValue(column.get("column"))),
            value: record.getColumnValue(column.get("column")),
            id: column.id,
            tooltip: column.get("description"),
            tooltip_more: column.hasMoreDescription(),
            hint: column.get("hint")
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
      // console.log(type, id)
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
