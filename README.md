# run-on-main

![](https://img.shields.io/npm/dm/run-on-main.svg)![](https://img.shields.io/npm/v/run-on-main.svg)![](https://img.shields.io/npm/l/run-on-main.svg)

Enables calling out to main thread from a worker to receive events, etc. This allows you to write "worker proof" code even if the code requires access to things that are only available on `window` or in the main thread.

If your code already _is_ on the main thread, it still works and just skips all the message passing stuff.

## Why?!

If you're building an app that runs primarily in a worker, there are times when you'd like to be able to do things inside that worker code that is only possible or available in the main thread.

First, you have to add a few goodies to the worker in your main thread:

**main-thread.js**

```js
import { enable } from 'run-on-main'

const worker = new Worker('/worker.js')
enable(worker)
```

Then inside a worker you can write something like this:

**worker.js**

```js
import { runOnMain } from 'run-on-main'

export const listenForWindowResize () => {
  runOnMain((cb) => {
    window.addEventListener('resize', () => {
      cb({
        height: window.innerHeight,
        width: window.innerWidth
      })
    }, {passive: true})
  }, dimensions => {
    console.log(dimensions) // {width: 300, height: 500}
  })
}
```

It will `.toString()` your function and pass it to the main thread for evaluation... yup. It uses the `new Function()` constructor to make and execute a function on the main thread and provides it a callback that can be used to post back results to the worker.

**WARNING:** use of a `Function` constructor to turn strings into running code should raise a red flag for you. But, given that it's from a trusted source (your existing code) it seems less dangerous to me... but **please** use at your own risk! Not recommended for use on real production projects without professional security review.

## Running the example

```
npm i && npm run example
```

Then open: http://localhost:10001

You can experiment with "worker proofing" and showing that it works in main thread too by following instructions in `/example/main.js`.

If you simply import the worker _as is_ into the main file and never make a worker at all. Everything still runs and still works without changes.

## Docs

`runOnMain(fn, opts/callback)`: It takes two arguments, the function to run, and optionally a callback, or an options object.

The options object, if used can contain the following options:

```js
{
  // whether or not the callback should be able to be used more than once (true by default)
  multipleCallbacks: true,
  // If you're using the options object pass your callback like this.
  callback: fn,
  // Dynamic values from the worker that you wan to make available to the function your sending
  // to the main thread. If provided, this object will be seralized and passed as the first
  // argument to your function if both are present the callback will be passed as the second.
  args: undefined
}
```

Example of use the options object form to make a function that will give a promise-based API to reading a value from the `window` from inside a worker.

```js
function readPropertyFromWindow (propertyName) {
  new Promise((resolve) => {
    runOnMain((propName, callback) => {
      callback(window[args])
    }, {
      args: propertyName,
      multipleCallbacks: false,
      callback: resolve
    }
  })
}

// log out innerHeight from window
readPropertyFromWindow('innerHeight')
  .then(console.log)
```

## install

```
npm install run-on-main
```

## credits

Big thanks to [@developit](https://github.com/developit) for reviewing this and for the MessageChannel idea! He's also released some awesome libs for working with workers like: [greenlet](https://github.com/developit/greenlet), [workerize](https://github.com/developit/workerize), and [others](https://github.com/developit?utf8=%E2%9C%93&tab=repositories&q=worker&type=&language=).

I post all my dev-related stuff on Twitter if you want to follow me there: [@HenrikJoreteg](http://twitter.com/henrikjoreteg).

## license

[MIT](http://mit.joreteg.com/)
