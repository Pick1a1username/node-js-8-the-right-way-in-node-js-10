'use strict';

const fs = require('fs');
const request = require('request');
const program = require('commander');
const pkg = require('./package.json');

const fullUrl = (path = '') => {
    let url = `http://${program.host}:${program.port}/`;

    if (program.index) {
        url += program.index + '/';
        if (program.type) {
            url += program.type + '/';
        }
    }

    return url + path.replace(/^\/*/, '');
}

program
.version(pkg.version)
.description(pkg.description)
.usage('[options] <command> [...]')
.option('-o, --host <hostname>', 'hostname [localhost]', 'localhost')
.option('-p, --port <number>', 'port number [9200]', '9200')
.option('-j, --json', 'format output as JSON')
.option('-i, --index <name>', 'which index to use')
.option('-t, --type <type>', 'default type for bulk operations');

program
.command('url [path]')
.description('generate the URL for the options and path (default is /)')
.action((path = '/') => console.log(fullUrl(path)));

program
.command('get [path]')
.description('perform an HTTP GET request for path (default is /)')
.action((path = '/', env) => {
    cmd = 'get';
    
    const options = {
        url: fullUrl(path),
        json: program.json,
    };

    request(options, (err, res, body) => {
        if (program.json) {
            console.log(body);
            console.log(err);
            console.log(JSON.stringify(err || body));
        } else {
            if (err) throw err;
            console.log(body);
        }
    });
});

// https://github.com/tj/commander.js#specify-the-argument-syntax
// This variable is for checking whether a command is specified or not.
let cmd = undefined;

program.parse(process.argv);
// console.log(program.args);

// The following condition doesn't work.
// if (!program.args.filter(arg => typeof arg === 'object').length) {
// If there's no action and no parameters...
if ( !cmd && !program.args.length ) {
    program.help();
};

