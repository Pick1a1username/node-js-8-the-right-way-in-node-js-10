'use strict';

const fs = require('fs');
const zmq = require('zeromq/v5-compat');

// Socket to reply to client requests.
const responder = zmq.socket('rep');

// Handle incoming requests.
responder.on('message', data => {
    // Parse the incoming message.
    const request = JSON.parse(data);
    console.log(`Received request to get: ${request.path}`);

    // Read the file and reply with content.
    fs.readFile(request.path, (err, content) => {

        // How would you change the JSON object structure of messages to support sending an error to the requester?
        if (err) {
            console.log(`Error ocurred: ${err}`);
            responder.send(JSON.stringify({
                content: err,
                timestamp: Date.now(),
                pid: process.pid
            }));

            return;
        }

        console.log('Sending response content.');
        responder.send(JSON.stringify({
            content: content.toString(),
            timestamp: Date.now(),
            pid: process.pid
        }));
    });
});

// Listen on TCP port 60401.
responder.bind('tcp://127.0.0.1:60401', err => {
    console.log('Listening for zmq requesters...');
});

// Close the responder when the Node process ends.
process.on('SIGINT', () => {
    console.log('Shutting down...');
    responder.close();
});

// What happens if there's an unhandled Node.js exception, and how should we deal with it?
process.on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrownaaa');
    process.exit(1);
});

throw 'asdf';
