(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/* global MessageChannel self */


var runOnMain = function (fn, optsOrCb) {
  var opts = { multipleCallbacks: true };
  if (typeof optsOrCb === 'function') {
    opts.callback = optsOrCb;
  } else {
    Object.assign(opts, optsOrCb);
  }

  // skip everything if we're already on main
  if (typeof window !== 'undefined') {
    return fn(opts.callback, opts.args)
  }

  // set up our message channel if it doesn't exist
  if (!self.$runOnMain) {
    var mc = new MessageChannel();
    self.postMessage('$runOnMain', [mc.port2]);
    self.$runOnMain = function (fnString) {
      mc.port1.postMessage(fnString);
    };
    mc.port1.onmessage = function (ref) {
      var data = ref.data;

      self.$runOnMain[data.id](data.data);
      if (data.once) {
        delete self.$runOnMain[data.id];
      }
    };
  }

  var args = [];

  if (opts.args) {
    // this allows for passing of other arguments
    // even objects from worker to function running
    // without this, you get [object Object]
    args.push(JSON.stringify(opts.args));
  }

  // build our dynamic callback function
  if (opts.callback) {
    var once = !opts.multipleCallbacks;
    var id = Math.random()
      .toString(36)
      .substring(2);
    args.push(
      ("function(result){port.postMessage({id:'" + id + "',data:result,once:" + once + "})}")
    );
    self.$runOnMain[id] = opts.callback;
  }

  // send it off for eval
  self.$runOnMain(("(" + (fn.toString()) + ")(" + (args.join()) + ")"));
};

// EXAMPLE #1 Subscribe to data from windowo
runOnMain(function (cb) {
  var reportDimensions = function () { return cb({
    height: window.innerHeight,
    width: window.innerWidth
  }); };

  // report it immediately to get a starting value
  reportDimensions();

  window.addEventListener('resize', reportDimensions, {passive: true});
}, function (dimensions) {
  console.log('EXAMPLE #1 received in worker from main:', dimensions);
});

// EXAMPLE #2 Make a promise-based function for reading properties from window
function readPropertyFromWindow (propertyName) {
  return new Promise(function (resolve) {
    runOnMain(
      function (propName, callback) {
        callback(window[propName]);
      },
      {
        args: propertyName,
        multipleCallbacks: false,
        callback: resolve
      }
    );
  })
}

// log out innerHeight from window
readPropertyFromWindow('innerHeight')
  .then(function (val) {
    console.log('EXAMPLE #2 result:', val);
  });

})));
