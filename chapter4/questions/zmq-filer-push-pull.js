'use strict';

const cluster = require('cluster');
const fs = require('fs');
const zmq = require('zeromq/v5-compat');
const numWorkers = require('os').cpus().length;

if (cluster.isMaster) {
    // Create a PUSH socket and bind it to an IPC endpoint
    const masterPusher = zmq.socket('push');
    masterPusher.bind("ipc://master-push.ipc");

    // Create a PULL socket and bind to a different IPC endpoint
    const masterPuller = zmq.socket('pull');
    masterPuller.bind('ipc://worker-push.ipc');

    // Keep a count of ready workers.
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    } 

    cluster.on('exit', (code, signal) => {
        console.log(signal);
        if (signal) {
            // Todo: Print the signal properly.
            console.error(`One of the workers was killed by signal: ${signal}`);
        } else if (code !== 0) {
            console.error(`worker exited with error code: ${code}`);
        } else {
            console.log('One of the workers exited successfully.');
        };

        cluster.fork();
    });

    // Listen for messages on the PULL socket.
    masterPuller.on('message', msg => {
        console.log(message);
    });

    // If the message is a ready message, increment the ready counter.

    // If the message is a result message, output it to the console.

    // Spin up the worker processes.

    // When the ready counter reaches 3, send 30 job messages out through the PUSH socket.
    for ( let i = 0; i < 30; i++ ) {
        masterPusher.send('some work');
    }


} else {
    // Create a PULL socket and connect it to the master's PUSH endpoint.
    const workerPusher = zmq.socket('push');
    workerPusher.bind("ipc://worker-push.ipc");

    // Create a PUSH socket and connect it to the master's PULL endpoint.
    const workerPuller = zmq.socket('pull');
    workerPuller.bind('ipc://master-push.ipc');

    // Listen for job messages on the PULL socket, and respond by sending a result message out on the PUSH socket.
    workerPuller.on('message', message => {
        console.log(message);
    });

    // Send a ready message out on the PUSH socket.
    // Make sure your result messages include at least the process ID of the worker.
    

}