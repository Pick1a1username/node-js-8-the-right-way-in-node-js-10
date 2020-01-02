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
            if (program.id) {
                url += program.id + '/';
            }
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
.option('-t, --type <type>', 'default type for bulk operations')
.option('-f, --filter <filter>', 'source filter for query results')
.option('--id <id>', 'which ID to create or update');

program
.command('url [path]')
.description('generate the URL for the options and path (default is /)')
.action((path = '/') => {
    cmd = 'url';

    console.log(fullUrl(path));
});

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

const handleResponse = (err, res, body) => {
    if (program.json) {
        console.log(JSON.stringify(err || body));
    } else {
        if (err) throw err;
        console.log(body);
    }
};

program
.command('create-index')
.description('create an index')
.action(() => {
    cmd = 'create-index';

    if (!program.index) {
        const msg = 'No index specified! Use --index <name>';
        if (!program.json) throw Error(msg);
        console.log(JSON.stringify({error: msg}));
        return;
    }

    request.put(fullUrl(), handleResponse);
});

/**
 * 
$ ./esclu li
health status index uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   books YiAk7Os5SKy7B7DY9mf6jQ   1   1      61021           12       20mb           20mb

$ ./esclu delete-index -i books
{"acknowledged":true}
$ ./esclu li
health status index uuid pri rep docs.count docs.deleted store.size pri.store.size

$ ./esclu bulk ../../chapter5/data/bulk_pg.ldj -i books -t book > bulk_result.json
$ ./esclu li
health status index uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   books vGCs5g36QeSmLy_V16i6UQ   1   1      61021           12     22.1mb         22.1mb

$ 
 */
program
.command('delete-index')
.description('delete an index')
.action(() => {
    cmd = 'delete-index';

    if (!program.index) {
        const msg = 'No index specified! Use --index <name>';
        if (!program.json) throw Error(msg);
        console.log(JSON.stringify({error: msg}));
        return;
    }

    request.del(fullUrl(), handleResponse);
});


program
.command('list-indices')
.alias('li')
.description('get a list of indices in this cluster')
.action( () => {
    cmd = 'list-indices';

    const path = program.json ? '_all' : '_cat/indices?v';

    request( { url: fullUrl(path), json: program.json }, handleResponse);
});

program
.command('bulk <file>')
.description('read and perform bulk options from the specified file')
.action( file => {
    cmd = 'bulk';

    fs.stat(file, (err, stats) => {
        if (err) {
            if (program.json) {
                console.log(JSON.stringify(err));
                return;
            }
            throw err;
        }

        const options = {
            url: fullUrl('_bulk'),
            json: true,
            headers: {
                'content-length': stats.size,
                'content-type': 'application/json'
            }
        };

        const req = request.post(options);

        const stream = fs.createReadStream(file);
        stream.pipe(req);
        req.pipe(process.stdout);
    });
});


program
.command('put <file>')
.description('read and perform bulk options from the specified file')
.action( file => {
    cmd = 'put';

    if (!program.id) {
        const msg = 'No ID specified! Use --id <name>';
        if (!program.json) throw Error(msg);
        console.log(JSON.stringify({error: msg}));
        return;
    }

    fs.stat(file, (err, stats) => {
        if (err) {
            if (program.json) {
                console.log(JSON.stringify(err));
                return;
            }
            throw err;
        }

        const options = {
            url: fullUrl(),
            json: true,
            headers: {
                'content-length': stats.size,
                'content-type': 'application/json'
            }
        };

        const req = request.put(options);

        const stream = fs.createReadStream(file);
        stream.pipe(req);
        req.pipe(process.stdout);
    });
});


program
.command('query [queries...]')
.alias('q')
.description('perform an Elasticsearch query')
.action((queries = []) => {
    cmd = 'query';

    const options = {
        url: fullUrl('_search'),
        json: program.json,
        qs: {},
    };

    if (queries && queries.length) {
        options.qs.q = queries.join(' ');
    }

    if (program.filter) {
        options.qs._source = program.filter;
    }

    request(options, handleResponse);
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

