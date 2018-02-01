/* global MessageChannel self */
export const enable = worker => {
  let port
  const handler = ({ data }) => {
    // we create a function dynamically in order to be able to
    // pass in `port` which *has* to be made available to the
    // passed function in order to work.
    const fn = new Function('port', `return ${data}`) // eslint-disable-line
    fn(port)
  }
  worker.addEventListener('message', e => {
    if (e.data === '$runOnMain') {
      port = e.ports[0]
      port.onmessage = handler
    }
  })
}

export const runOnMain = (fn, optsOrCb) => {
  const opts = { multipleCallbacks: true }
  if (typeof optsOrCb === 'function') {
    opts.callback = optsOrCb
  } else {
    Object.assign(opts, optsOrCb)
  }

  // skip everything if we're already on main
  if (typeof window !== 'undefined') {
    const args = [opts.callback]
    if (opts.args) {
      args.unshift(opts.args)
    }
    return fn(...args)
  }

  // set up our message channel if it doesn't exist
  if (!self.$runOnMain) {
    const mc = new MessageChannel()
    self.postMessage('$runOnMain', [mc.port2])
    self.$runOnMain = fnString => {
      mc.port1.postMessage(fnString)
    }
    mc.port1.onmessage = ({ data }) => {
      self.$runOnMain[data.id](data.data)
      if (data.once) {
        delete self.$runOnMain[data.id]
      }
    }
  }

  const args = []

  if (opts.args) {
    // this allows for passing of other arguments
    // even objects from worker to function running
    // without this, you get [object Object]
    args.push(JSON.stringify(opts.args))
  }

  // build our dynamic callback function
  if (opts.callback) {
    let once = !opts.multipleCallbacks
    const id = Math.random()
      .toString(36)
      .substring(2)
    args.push(
      `function(result){port.postMessage({id:'${id}',data:result,once:${once}})}`
    )
    self.$runOnMain[id] = opts.callback
  }

  // send it off for eval
  self.$runOnMain(`(${fn.toString()})(${args.join()})`)
}
