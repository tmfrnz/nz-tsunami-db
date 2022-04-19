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
    pointToLayer : function(featureData,latLng){
      var layerStyle = typeof featureData.properties.style !== 'undefined'
        ? featureData.properties.style
        : this.attributes.layerStyle
      if (!layerStyle) {
        console.log('no layerStyle', this.id, this.attributes)
      }
      if (this.attributes.marker === 'triangleIcon' && layerStyle) {
        const divIcon = L.divIcon({
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
        });
        return L.marker(latLng, { icon: divIcon })
      } else {
        return new L.circleMarker(
          latLng,
          layerStyle
        )
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
