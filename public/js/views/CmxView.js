//public/js/views/CmxView.js
/*global define*/

define([
  'jquery',
  'underscore',
  'backbone',
  'jade',
  'bootstrap',
  'modules/CmxCanvasClass'
], function($, _, Backbone, jade, bootstrap, CmxCanvas) {

  var CmxView = Backbone.View.extend({
    el: $("#CmxCanvas"),

    initialize: function() {
      this.model = this.options.model;
    },

    render: function() {

      var _modeljson = this.model.toJSON();
      this.$el.html(jade.templates['cmxreader'](_modeljson));

      //create cmxcanvas class with methods to make life easier
      this.cmxcanvas = new CmxCanvas(_modeljson, 'cmxcanvas');
      //select first (0) panel in TOC
      $('#toc0').addClass('active');
    },

    events: {
      'click .moreinfoBtn': 'toggleMoreInfo',
      'click #leftbutton': 'leftArrow',
      'click #rightbutton': 'rightArrow',
      'click #toc li': 'tocPanelBtn'
    },

    leftArrow: function(e){
      var _panel = this.cmxcanvas.goToPrev();
      $("#leftbutton .ui-arrow").removeClass('clicked');
      $("#leftbutton .ui-arrow").addClass('clicked');
      $('#toc li').removeClass('active');
      $('#toc' + _panel).addClass('active');
    },
    rightArrow: function(e){
      var _panel = this.cmxcanvas.goToNext();
      $("#rightbutton .ui-arrow").removeClass('clicked');
      $("#rightbutton .ui-arrow").addClass('clicked');
      $('#toc li').removeClass('active');
      $('#toc' + _panel).addClass('active');
    },
    tocPanelBtn: function(e){
      //console.log(e.currentTarget);
      var _panel = parseInt($(e.currentTarget).attr('panelNum'), 10);
      this.cmxcanvas.goToPanel(_panel);
      $('#toc li').removeClass('active');
      $('#toc' + _panel).addClass('active');
    },
    toggleMoreInfo: function() {
      if ($('#moreinfo').hasClass('open')) {
          $('#moreinfo').removeClass('open');
          $('.moreinfoBtn > span.caret').removeClass('reverse');
      }
      else {
          $('#moreinfo').addClass('open');
          $('.moreinfoBtn > span.caret').addClass('reverse');
      }
    }


  });

  return CmxView;

});