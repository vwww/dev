!function(e){var t={};function n(o){if(t[o])return t[o].exports;var r=t[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(o,r,function(t){return e[t]}.bind(null,r));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=22)}({22:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),$(document).ready(function(){firebase.initializeApp({apiKey:"AIzaSyDzwR0qYbl6QzA4pgw-LF7M6yxG2bWC7xo",databaseURL:"https://victor-poke.firebaseio.com"}),firebase.database().ref("poke").on("value",function(e){e&&function(e){$(".poke-time").timeago("dispose");const t=[];for(const n in e)e[n]&&t.push(Object.assign({},e[n],{uid:n}));let n="";t.sort(function(e,t){return e.num!==t.num?t.num-e.num:e.time!==t.time?e.time-t.time:0}).map(function(e,t){const o=new Date(1e3*e.time);n+="<tr><td>"+(t+1)+'</td><td><img src="https://graph.facebook.com/'+e.uid+'/picture" width="50" height="50"></td><td><a href="https://www.facebook.com/'+e.uid+'">'+e.name+"</a></td><td>"+e.num.toLocaleString()+'</td><td class="poke-time" title="'+o.toISOString()+'">'+o.toString()+"</td></tr>"}),$("#leaderboard").html(n),$(".poke-time").timeago()}(e.val())})})}});