(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/* global MessageChannel self */
var enable = function (worker) {
  var port;
  var handler = function (ref) {
    var data = ref.data;

    // we create a function dynamically in order to be able to
    // pass in `port` which *has* to be made available to the
    // passed function in order to work.
    var fn = new Function('port', ("return " + data)); // eslint-disable-line
    fn(port);
  };
  worker.addEventListener('message', function (e) {
    if (e.data === '$runOnMain') {
      port = e.ports[0];
      port.onmessage = handler;
    }
  });
};

var worker = new Worker('/worker.js');
enable(worker);

})));
