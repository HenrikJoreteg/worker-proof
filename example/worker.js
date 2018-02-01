import { workerProof } from '../src'

// EXAMPLE #1 Subscribe to data from windowo
workerProof(cb => {
  const reportDimensions = () => cb({
    height: window.innerHeight,
    width: window.innerWidth
  })

  // report it immediately to get a starting value
  reportDimensions()

  window.addEventListener('resize', reportDimensions, {passive: true})
}, dimensions => {
  console.log('EXAMPLE #1 received in worker from main:', dimensions)
})

// EXAMPLE #2 Make a promise-based function for reading properties from window
function readPropertyFromWindow (propertyName) {
  return new Promise((resolve) => {
    workerProof(
      (propName, callback) => {
        callback(window[propName])
      },
      {
        args: propertyName,
        multipleCallbacks: false,
        callback: resolve
      }
    )
  })
}

// log out innerHeight from window
readPropertyFromWindow('innerHeight')
  .then(val => {
    console.log('EXAMPLE #2 result:', val)
  })
