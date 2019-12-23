'use strict';

const cluster = require('cluster');
const fs = require('fs');
const zmq = require('zeromq/v5-compat');
const numWorkers = require('os').cpus().length;

if (cluster.isMaster) {
    // Master process creates ROUTER and DEALER sockets and binds endpoints.
    const router = zmq.socket('router').bind('tcp://127.0.0.1:60401');
    const dealer = zmq.socket('dealer').bind('ipc://filer-dealer.ipc');

    // Forward messages between the router and dealer.
    router.on('message', (...frames) => dealer.send(frames));
    dealer.on('message', (...frames) => router.send(frames));

    // Listen for workers to come online.
    cluster.on('online', worker => console.log(`Worker ${worker.process.pid} is online.`));

    // Fork a worker process for each CPU.
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    } 

    // How would you change the zmq-filer-rep-cluster.js program to fork a new worker whenever one dies?
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

} else {
    // Worker processes create a REP socket and connect to the DEALER.
    const responder = zmq.socket('rep').connect('ipc://filer-dealer.ipc');

    responder.on('message', data => {
        // Parse incoming message.
        const request = JSON.parse(data);
        console.log(`${process.pid} received request for: ${request.path}`);

        // Read the file and reply with content.
        fs.readFile(request.path, (err, content) => {
            console.log(`${process.pid} sending response`);
            responder.send(JSON.stringify({
                content: content.toString(),
                timestamp: Date.now(),
                pid: process.pid
            }));
        });

    });
}