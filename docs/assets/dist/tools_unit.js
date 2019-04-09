!function(e){var n={};function t(i){if(n[i])return n[i].exports;var o=n[i]={i:i,l:!1,exports:{}};return e[i].call(o.exports,o,o.exports,t),o.l=!0,o.exports}t.m=e,t.c=n,t.d=function(e,n,i){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:i})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(t.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var o in e)t.d(i,o,function(n){return e[n]}.bind(null,o));return i},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=41)}({0:function(e,n,t){"use strict";function i(e){return document.getElementById(e)}Object.defineProperty(n,"__esModule",{value:!0}),n.$id=i,n.$idA=function(e){return i(e)},n.$ready=function(e){document.addEventListener("DOMContentLoaded",e)},n.removeAllChildNodes=function(e){for(;e.firstChild;)e.removeChild(e.firstChild)},n.randomArrayItem=function(e){return e[Math.floor(Math.random()*e.length)]},n.shuffle=function(e){for(let n=e.length-1;n;--n){const t=Math.floor(Math.random()*(n+1)),i=e[n];e[n]=e[t],e[t]=i}},n.sum=function(e){return e.reduce((e,n)=>e+n,0)},n.formatHexColor=function(e){return"#"+("00000"+e.toString(16)).slice(-6)},n.clamp=function(e,n,t){return Math.max(n,Math.min(e,t))}},41:function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});const i=t(42),o=t(0),r=o.$idA("unit_type"),u=o.$idA("unit_from"),c=o.$idA("unit_to"),a=o.$idA("unit_val1"),l=o.$idA("unit_val2");function d(e){const n=r.options[r.selectedIndex].innerHTML;if(e){o.removeAllChildNodes(u);const e=i.UNITS[n];for(const n in e){const e=document.createElement("option");e.innerHTML=n,u.appendChild(e)}u.selectedIndex=0}o.removeAllChildNodes(c);const t=u.options[u.selectedIndex].innerHTML,a=i.UNITS[n];for(const e in a)if(e!==t){const n=document.createElement("option");n.innerHTML=e,c.appendChild(n)}c.selectedIndex=0;const l=i.UNITS[n][t];l[2]?(o.$idA("unit_con2").style.display="",o.$idA("unit_name1").innerHTML=l[3]||"",o.$idA("unit_name2").innerHTML=l[1]):(o.$idA("unit_con2").style.display="none",o.$idA("unit_name1").innerHTML=l[1]),h()}function s(e){let n=e.length;(function(e){return e.indexOf("e")>=0||e.indexOf("E")>=0})(e)&&(e.indexOf("e")>0?n=e.indexOf("e"):e.indexOf("E")>0&&(n=e.indexOf("E")));for(let t=0;t<e.length&&("0"===e.charAt(t)||"+"===e.charAt(t)||"-"===e.charAt(t)||"."===e.charAt(t));t++)"."!==e.charAt(t)&&--n;return function(e){return e.indexOf(".")>=0}(e)&&--n,n}function m(e){const n=e+"";return-1===n.indexOf(".")?0:n.split(".")[1].length}function f(e,n,t){switch(n){case 1:return function(e,n){if(0===e)return"0";if(n<0||(0|e)===e)return e.toString();if(s(e+"")>n&&n>=1&&n<=21)return e.toPrecision(n);const t=Math.round(-Math.log(Math.abs(e))/Math.LN10+(n||2));return e.toFixed(Math.max(t,0))}(e,t);case 2:return e.toFixed(t)}return e.toString()}function p(e,n,t,i,r){let u,c,a=-1;switch(r){case 1:a=s(t),e[2]&&(a=Math.min(a,s(i))),o.$idA("unit_sfn").innerHTML=a+"",o.$idA("unit_sfnp").innerHTML=1===a?"":"s";break;case 2:a=m(t),e[2]&&(a=Math.min(a,m(i))),o.$idA("unit_dpn").innerHTML=a+"",o.$idA("unit_dpnp").innerHTML=1===a?"":"s"}return u=e[2]?e[0][0]*e[2]*parseFloat(t)+e[0][0]*parseFloat(i):e[0][0]*parseFloat(t),e[0][1]&&(u+=e[0][1]),n[0][1]&&(u-=n[0][1]),u/=n[0][0],(c=n[2]?Math.floor(u/n[2])+" "+n[3]+" "+f(u%n[2],r,a):f(u,r,a))+" "+n[1]}function h(){const e=r.options[r.selectedIndex].innerHTML,n=u.options[u.selectedIndex].innerHTML,t=c.options[c.selectedIndex].innerHTML,d=a.value,s=l.value,m=i.UNITS[e][n],f=i.UNITS[e][t];o.$idA("unit_result0").innerHTML=p(m,f,d,s,0),o.$idA("unit_result1").innerHTML=p(m,f,d,s,1),o.$idA("unit_result2").innerHTML=p(m,f,d,s,2)}r.onchange=()=>d(!0),u.onchange=()=>d(!1),c.onchange=a.onkeyup=a.onchange=l.onkeyup=l.onchange=h,o.$ready(function(){o.removeAllChildNodes(r),o.removeAllChildNodes(u),o.removeAllChildNodes(c);for(const e in i.UNITS){const n=document.createElement("option");n.innerHTML=e,r.appendChild(n)}r.selectedIndex=0,d(!0)})},42:function(e,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.UNITS={Angles:{Degree:[[1e3/360],"&deg;"],Arcminute:[[1e3/360/60],"&prime;"],Arcsecond:[[1e3/360/60/60],"&Prime;"],Gradian:[[2.5],"gon"],Radian:[[500*Math.PI],"rad"]},Area:{"US Acre":[[40468564.224],"ac"],Hectare:[[1e8],"ha"],"sq cm":[[1],"cm&sup2;"],"sq ft":[[929.0304],"ft&sup2;"],"sq in":[[6.4516],"in&sup2;"],"sq km":[[1e10],"km&sup2;"],"sq m":[[1e4],"m&sup2;"],"sq mile":[[25899881103.36],"mi&sup2;"],"sq mm":[[.01],"mm&sup2;"],"sq yd":[[8361.2736],"yd&sup2;"]},"Distance/Length":{Centimeter:[[1],"cm"],Inch:[[2.54],'"'],"Feet-Inch":[[2.54],'"',12,"'"],Angstrom:[[1e-8],"&Aring;"],Chain:[[2011.68],"chain"],Fathom:[[182.88],"ftm"],Feet:[[30.48],"ft"],Hand:[[10.16],""],Kilometer:[[1e5],"km"],Link:[[20.1168],"lnk."],Meter:[[100],"m"],Micron:[[1e-4],"&micro;m"],Mile:[[160934.4],"mi"],Millimeter:[[.1],"mm"],Nanometer:[[1e-7],"nm"],"Nautical Mile":[[185200],"nmi"],PICA:[[.42175176],"pc"],Rod:[[502.92],"rod"],Span:[[22.86],"span"],Yard:[[91.44],"yd"]},Energy:{"British Thermal Unit":[[1055.056],"Btu"],"IST Calorie":[[4.1868],"cal"],"Electon Volt":[[160217653e-27],"eV"],"Foot Pound":[[1.3558179483314],"ft&middot;lb"],Joule:[[1],"J"],Kilocalorie:[[4186.8],"kcal"],Kilojoule:[[1e3],"KJ"],"Kilowatt hour":[[36e5],"kWh"]},Mass:{Carat:[[2e-4],"CD"],Centigram:[[1e-5],"cg"],Decigram:[[1e-4],"dg"],Dekagram:[[.01],"dag"],Gram:[[.001],"g"],Hectogram:[[.1],"hg"],Kilogram:[[1],"kg"],"Long Ton":[[1016.0469088],"lg tn"],Milligram:[[1e-6],"mg"],Ounce:[[.028349523125],"oz"],Pound:[[.45359237],"lb"],"Short Ton":[[907.18474],"sh tn"],Stone:[[6.35029318],"st"],Tonne:[[1e3],"t"]},Power:{"BTU/Minute":[[17.5842642],"BTU/min"],"Foot-Pound/Minute":[[.0225969658055233],"ft&middot;lb/min"],Horsepower:[[745.6998715822702],"hp"],Kilowatt:[[1e3],"kW"],Watt:[[1],"W"]},Pressure:{Atmosphere:[[101325],"atm"],Bar:[[1e5],"bar"],Kilopascal:[[1e3],"kPa"],"Torr/mmHg":[[133.322387415],"mmHg"],Pascal:[[1],"Pa"],PSI:[[6894.757],"psi"]},"Speed/Velocity":{"cm/s":[[.01],"cm/s"],"ft/s":[[.3048],"ft/s"],"km/h":[[.2777777777777778],"km/h"],Knot:[[.5144444444444444],"Knot"],Mach:[[340.2933],"Ma"],"m/s":[[1],"m/s"],mph:[[.44704],"mi/h"]},Temperature:{Celcius:[[9,2458.35],"&deg;C"],Farenheit:[[5,2298.35],"&deg;F"],Kelvin:[[9],"&deg;K"]},Time:{Day:[[86400],"D"],Hour:[[3600],"H"],Microsecond:[[1e-6],"&micro;s"],Millisecond:[[.001],"ms"],Minute:[[60],"m"],Second:[[1],"s"],Week:[[604800],"W"]},Times:{"Week-Day":[[86400],"D",7,"W"],"Day-Hour":[[3600],"H",24,"D"],"Hour-Minute":[[60],"m",60,"H"],"Hour-Second":[[1],"s",3600,"H"],"Minute-Second":[[1],"s",60,"m"],Second:[[1],"s"]},Volume:{"Cubic cm":[[.001],"cm<sup>3</sup>"],"Cubic feet":[[28.316846592],"ft<sup>3</sup>"],"Cubic inch":[[.016387064],"in<sup>3</sup>"],"Cubic meter":[[1e3],"m<sup>3</sup>"],"Cubic yard":[[764.554857984],"yd<sup>3</sup>"],"Fluid Ounce (UK)":[[.0284130625],"UK oz fl"],"Fluid Ounce (US)":[[.0295735295625],"US oz fl"],"Gallon (UK)":[[4.54609],"UK gal"],"Gallon (US)":[[3.785411784],"US gal"],Liter:[[1],"L"],"Pint (UK)":[[.56826125],"UK pt"],"Pint (US)":[[.473176473],"US pt"],"Quart (UK)":[[1.1365225],"UK qt"],"Quart (US)":[[.946352946],"US qt"]}}}});