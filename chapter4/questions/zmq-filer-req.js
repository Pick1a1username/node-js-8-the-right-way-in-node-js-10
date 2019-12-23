'use strict';

const zmq = require('zeromq/v5-compat');
const filename = process.argv[2];

// Create request endpoint.
const requestter = zmq.socket('req');

// Handle replies from the responder.
requestter.on('message', data => {
    const response = JSON.parse(data);
    console.log('Received response:', response);
});

requestter.connect('tcp://localhost:60401');

// Send a request for content.
for (let i = 1; i <= 5; i++) {
    console.log(`Sending a request ${i} for ${filename}`);
    requestter.send(JSON.stringify({ path: filename } ));
}