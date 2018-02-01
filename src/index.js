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
    if (e.data === '$workerProof') {
      port = e.ports[0]
      port.onmessage = handler
    }
  })
}

export const workerProof = (fn, optsOrCb) => {
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
  if (!self.$workerProof) {
    const mc = new MessageChannel()
    self.postMessage('$workerProof', [mc.port2])
    self.$workerProof = fnString => {
      mc.port1.postMessage(fnString)
    }
    mc.port1.onmessage = ({ data }) => {
      self.$workerProof[data.id](data.data)
      if (data.once) {
        delete self.$workerProof[data.id]
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
    self.$workerProof[id] = opts.callback
  }

  // send it off for eval
  self.$workerProof(`(${fn.toString()})(${args.join()})`)
}
