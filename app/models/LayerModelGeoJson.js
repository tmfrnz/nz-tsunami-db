define([
  'jquery', 'underscore', 'backbone',
  'leaflet',
  './LayerModel',
  'text!templates/triangleIcon.html',
], function(
  $,_, Backbone,
  leaflet,
  LayerModel,
  templateTriangleIcon,
){

  var LayerModelGeoJson = LayerModel.extend({
    initializeModel:function(){

      if (typeof this.attributes.wrap === 'undefined') {
        this.set('wrap',true)
      }

    },

    setData : function (data){
      data = this.geoJson(data)
      this.set('mapLayer', data)
      // console.log('layer created ' + this.id)
      this.handleResult()
    },
    loadData : function (callback){
//      console.log('try loading geojson layer: ' + this.id)
      this.setLoading(true)

      var that = this

      $.ajax({
        dataType: "json",
        url: this.attributes.baseurl + '/' + this.attributes.path,
        success: function(data) {
          that.setLoading(false)
          console.log("success loading geojson layer: " + that.id)
          callback(that.geoJson(data))
        },
        error: function(){
            console.log("error loading geojson layer")

            that.setLoading(false)
        }
      });
    },

    geoJson:function(geojson){
      var that = this
      return L.geoJson(
        geojson,
        {
          coordsToLatLng: _.bind(this.coordsToLatLng,this),
          pointToLayer: _.bind(this.pointToLayer,this),
          className : this.getClassName(),
          style:this.getLayerStyle()
        }
      )
    },



    // geoJson option functions
    getClassName : function(){
      return 'map-layer map-layer-'+this.id+' '+'map-layer-type-'+this.attributes.type
    },
    getTriangleIcon: function(layerStyle) {
      return L.divIcon({
        html: _.template(templateTriangleIcon)({
          fill: layerStyle.fillColor || layerStyle.fill || layerStyle.color,
          fillOpacity: layerStyle.fillOpacity || layerStyle.opacity,
          color: layerStyle.strokeColor || layerStyle.stroke || layerStyle.color,
          height: layerStyle.height,
          width: layerStyle.width,
        }),
        className: this.attributes.class ? "icon-triangle " + this.attributes.class : "icon-triangle",
        iconSize: [layerStyle.width, layerStyle.height],
        iconAnchor: [layerStyle.width / 2, layerStyle.height],
      })
    },
    pointToLayer : function(featureData,latLng){
      var layerStyle = typeof featureData.properties.style !== 'undefined'
        ? featureData.properties.style
        : this.attributes.layerStyle
      if (!layerStyle) {
        console.log('no layerStyle', this.id, this.attributes)
      }
      if (this.attributes.marker === 'triangleIcon' && layerStyle) {
        const divIcon = this.getTriangleIcon(layerStyle);
        return L.marker(latLng, { icon: divIcon })
      } else {
        return new L.circleMarker(
          latLng,
          layerStyle
        )
      }

    },
    updateStyle:function(){
      if (typeof this.attributes.layerGroup !== "undefined") {
        // first update based on selected column/attribute
        if (typeof this.attributes.columnColor !== "undefined") {
          _.extend(this.attributes.layerStyle,{
            fillColor:this.attributes.columnColor,
            color:this.attributes.columnColor
          })
        }
        var that = this
        this.getMapLayer(function(mapLayer){
          if (that.attributes.marker === 'triangleIcon' ) {
            if (mapLayer.getLayers() && mapLayer.getLayers().length > 0) {
              mapLayer.getLayers()[0].setIcon(that.getTriangleIcon(that.attributes.layerStyle))
            }
          } else {
            if (that.isSelected()) {
              //set Selected Style
               mapLayer.setStyle(_.extend(
                 {},
                 that.attributes.layerStyle,
                 {fillOpacity:0.9, weight:3}
               ))
            } else if (that.isMouseOver()){
              //set Mouseover Style
               mapLayer.setStyle(_.extend(
                 {},
                 that.attributes.layerStyle,
                 {fillOpacity:0.6, weight:1.5}
               ))
            } else if(that.isAnySelected()){
              //set Passive Style
              mapLayer.setStyle(_.extend(
                {},
                that.attributes.layerStyle,
                {opacity:1,fillOpacity:0.4,color:"#bbb",fillColor:"#eee",weight:1.2}
              ));
            } else {
              //setDefaultStyle
              mapLayer.setStyle(that.attributes.layerStyle);
            }
          }
        });
      }
    },
    coordsToLatLng: function (coords) {
      var longitude = coords[0];
      var latitude = coords[1];

      // TODO make configurable
      if (this.attributes.wrap && longitude < 0) {
        return L.latLng(latitude, longitude + 360)
      }
      else {
        return L.latLng(latitude, longitude)
      }
    },


    updateMapLayerStyle :function(){
      if (typeof this.attributes.mapLayer.setStyle === 'function') {
        this.attributes.mapLayer.setStyle(this.attributes.mapLayer.options.style)
      }
    },



  });

  return LayerModelGeoJson

});
