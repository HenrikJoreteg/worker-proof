import { enable } from '../src'

const worker = new Worker('/worker.js')
enable(worker)

// Uncomment this and comment out all the code above
// to see it still works even if it's already on main
// import './worker'
