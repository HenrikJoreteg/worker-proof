(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/* global MessageChannel self */


var workerProof = function (fn, optsOrCb) {
  var opts = { multipleCallbacks: true };
  if (typeof optsOrCb === 'function') {
    opts.callback = optsOrCb;
  } else {
    Object.assign(opts, optsOrCb);
  }

  // skip everything if we're already on main
  if (typeof window !== 'undefined') {
    var args$1 = [opts.callback];
    if (opts.args) {
      args$1.unshift(opts.args);
    }
    return fn.apply(void 0, args$1)
  }

  // set up our message channel if it doesn't exist
  if (!self.$workerProof) {
    var mc = new MessageChannel();
    self.postMessage('$workerProof', [mc.port2]);
    self.$workerProof = function (fnString) {
      mc.port1.postMessage(fnString);
    };
    mc.port1.onmessage = function (ref) {
      var data = ref.data;

      self.$workerProof[data.id](data.data);
      if (data.once) {
        delete self.$workerProof[data.id];
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
    self.$workerProof[id] = opts.callback;
  }

  // send it off for eval
  self.$workerProof(("(" + (fn.toString()) + ")(" + (args.join()) + ")"));
};

// EXAMPLE #1 Subscribe to data from windowo
workerProof(function (cb) {
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
    workerProof(
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
