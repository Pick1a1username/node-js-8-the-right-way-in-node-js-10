'use strict';

const assert = require('assert');
const EventEmitter = require('events').EventEmitter;
const LDJClient = require('../lib/ldj-client.js');

describe('LDJClient', () => {
    let stream = null;
    let client = null;

    beforeEach( () => {
        stream = new EventEmitter();
        client = new LDJClient(stream);
    });

    it('should emit a message event from a single data event', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });

        stream.emit('data', '{"foo":"bar"}\n');
    });

    it('should emit a message event from split data events', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });

        stream.emit('data', '{"foo":');
        process.nextTick(() => stream.emit('data', '"bar"}\n'));
    });


    // Add a unit test for a single message that is split over two (or more) data events from the stream.
    it('should emit a message event from split data events more than two', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });

        stream.emit('data', '{"foo":');
        process.nextTick(() => stream.emit('data', '"bar'));
        process.nextTick(() => stream.emit('data', '"}\n'));
    });

    // Add a unit test that passes in null to the LDJClient constructor
    // and asserts that an error is thrown.
    // Then make the test pass by modifying the constructor.
    it('should throw an error from null data', done => {
        client.on('error', error => {
            assert.throws(() => { throw error; }, Error, "null is not valid message.");
            done();
        });

        stream.emit('data', null);
    });

    // The LDJClient already handles the case in which a properly formatted JSON string
    // is split over multiple lines.
    // What happens if the incoming data is not properly formatted JSON string?
    it('(failing expected)should throw an error if the incoming data is not properly formatted JSON string', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });

        stream.emit('data', '{"foo","bar"}\n');
    });

    // Write a test case that sends a data event that is not JSON.
    // What do you think hould happen in this case?
    it('(failing expected)should throw an error if the incoming data is not not JSON', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });

        stream.emit('data', '{"foo","bar"}\n');
    });

    // What happens if the last data event completes a JSON message,
    // but without the trailing newline?
    it('(failing expected)should be hanging if there is no trailing newline', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });

        stream.emit('data', '{"foo":"bar"}');
    });

    /**
     * Write a case where the stream object sends a data event containing JSON
     * but no newline, followed by close event. A real Stream instance will
     * emit a close event when going offline - update LDJClient to listen for
     * close and process the remainder of the buffer.
     */
    it('should emit a message event from a message with no newline', done => {
        client.on('message', message => {
            assert.deepEqual(message, {foo: 'bar'});
            done();
        });

        stream.emit('data', '{"foo":"bar"}');
        stream.emit('close');
    });
});