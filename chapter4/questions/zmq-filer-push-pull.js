'use strict';

const cluster = require('cluster');
const fs = require('fs');
const zmq = require('zeromq/v5-compat');
const numWorkers = require('os').cpus().length;

if (cluster.isMaster) {
    // Create a PUSH socket and bind it to an IPC endpoint

    // Create a PULL socket and bind to a different IPC endpoint

    // Keep a count of ready workers.

    // Listen for messages on the PULL socket.

    // If the message is a ready message, increment the ready counter.

    // If the message is aresult message, output it to the console.

    // Spin up the worker processes.

    // When the ready counter reaches 3, send 30 job messages out through the PUSH socket.


} else {
    // Create a PULL socket and connect it to the master's PUSH endpoint.

    // Create a PUSH socket and connect it to the master's PULL endpoint.

    // Listen for job messages on the PULL socket, and respond by sending a result message out on the PUSH socket.

    // Send a ready message out on the PUSH socket.
    // Make sure your result messages include at least the process ID of the worker.
    
    });
}