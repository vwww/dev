(function(d){var e=function(){var a=d.documentMode;return"onhashchange"in d&&(void 0===a||7<a)}();L.Hash=function(a){this.onHashChange=L.Util.bind(this.onHashChange,this);a&&this.init(a)};L.Hash.parseHash=function(a){0===a.indexOf("#")&&(a=a.substr(1));var b=a.split("/");if(3==b.length){a=parseInt(b[0],10);var c=parseFloat(b[1]),b=parseFloat(b[2]);return isNaN(a)||isNaN(c)||isNaN(b)?!1:{center:new L.LatLng(c,b),zoom:a}}return!1};L.Hash.formatHash=function(a){var b=a.getCenter();a=a.getZoom();var c=Math.max(0,Math.ceil(Math.log(a)/Math.LN2));return"#"+[a,b.lat.toFixed(c),b.lng.toFixed(c)].join("/")};L.Hash.prototype={map:null,lastHash:null,parseHash:L.Hash.parseHash,formatHash:L.Hash.formatHash,init:function(a){this.map=a;this.lastHash=null;this.onHashChange();this.isListening||this.startListening()},removeFrom:function(a){this.changeTimeout&&clearTimeout(this.changeTimeout);this.isListening&&this.stopListening();this.map=null},onMapMove:function(){if(this.movingMap||!this.map._loaded)return!1;var a=this.formatHash(this.map);this.lastHash!=a&&(location.replace(a),this.lastHash=a)},movingMap:!1,update:function(){var a=location.hash;if(a!==this.lastHash)if(a=this.parseHash(a))this.movingMap=!0,this.map.setView(a.center,a.zoom),this.movingMap=!1;else this.onMapMove(this.map)},changeDefer:100,changeTimeout:null,onHashChange:function(){if(!this.changeTimeout){var a=this;this.changeTimeout=setTimeout(function(){a.update();a.changeTimeout=null},this.changeDefer)}},isListening:!1,hashChangeInterval:null,startListening:function(){this.map.on("moveend",this.onMapMove,this);e?L.DomEvent.addListener(d,"hashchange",this.onHashChange):(clearInterval(this.hashChangeInterval),this.hashChangeInterval=setInterval(this.onHashChange,50));this.isListening=!0},stopListening:function(){this.map.off("moveend",this.onMapMove,this);e?L.DomEvent.removeListener(d,"hashchange",this.onHashChange):clearInterval(this.hashChangeInterval);this.isListening=!1}};L.hash=function(a){return new L.Hash(a)};L.Map.prototype.addHash=function(){this._hash=L.hash(this)};L.Map.prototype.removeHash=function(){this._hash.removeFrom()}})(window);