'use strict';

const EventEmitter = require('events').EventEmitter;

class LDJClient extends EventEmitter {
    constructor(stream) {
        super();

        let buffer = '';
        
        stream.on('data', data => {

            // Add a unit test that passes in null to the LDJClient constructor
            // and asserts that an error is thrown.
            // Then make the test pass by modifying the constructor
            if (data === null) {
                // throw new Error("null is not valid message.");
                this.emit('error', new Error("null is not valid message."));
            }
            

            buffer += data;
            let boundary = buffer.indexOf('\n');

            while (boundary !== -1) {
                // Get strings by the end of boundary.
                const input = buffer.substring(0, boundary);

                // Remove strings by the end of boundary.
                buffer = buffer.substring(boundary + 1);

                this.emit('message', JSON.parse(input));
                boundary = buffer.indexOf('\n');
            }
        });

        /**
         * Write a case where the stream object sends a data event containing JSON
         * but no newline, followed by close event. A real Stream instance will
         * emit a close event when going offline - update LDJClient to listen for
         * close and process the remainder of the buffer.
         */
        stream.on('close', () => {
            let boundary = buffer.indexOf('\n');

            while (boundary !== -1) {
                // Get strings by the end of boundary.
                const input = buffer.substring(0, boundary);

                // Remove strings by the end of boundary.
                buffer = buffer.substring(boundary + 1);

                this.emit('message', JSON.parse(input));
                boundary = buffer.indexOf('\n');
            }

            // Process the remainder of the buffer,
            // which may be without the trailing newline.
            try {
                this.emit('message', JSON.parse(buffer));
            } catch {
                this.emit('error', `The following message is lost: ${buffer}`);
                buffer = '';
            }
        });
    }

    static connect(stream) {
        return new LDJClient(stream);
    }
}

module.exports = LDJClient;