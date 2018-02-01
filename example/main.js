import { enable } from '../src'

const worker = new Worker('/worker.js')
enable(worker)
