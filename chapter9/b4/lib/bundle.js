/**
 * Provides API endpoints for working with book bundles.
 */
'use strict';

const rp = require('request-promise');

module.exports = (app, es) => {
    const url = `http://${es.host}:${es.port}/${es.bundles_index}/bundle`;

    /**
     * Create a new bundle with the specified name.
     * curl -X POST http://<host>:<port>/api/bundle?name=<name>
     */
    app.post('/api/bundle', (req, res) => {
        const bundle = {
            name: req.query.name || '',
            books: [],
        };

        rp.post( { url, body: bundle, json: true})
        .then(esResBody => res.status(201).json(esResBody))
        .catch(({error}) => res.status(error.status || 502).json(error));
    });

    /**
     * Retrieve a given bundle.
     * curl http://<host>:<port>/api/bundle/<id>
     */
    app.get('/api/bundle/:id', async (req, res) => {
        const options = {
            url: `${url}/${req.params.id}`,
            json: true,
        };

        try {
            const esResBody = await rp(options);
            res.status(200).json(esResBody);
        } catch (esResErr) {
            res.status(esResErr.statusCode || 502).json(esResErr.error);
        }
    });

    /**
     * Set the specified bundle's name with the specified name
     * curl -X PUT http://<host>:<port>/api/bundle/<id>/name/<name>
     */
    app.put('/api/bundle/:id/name/:name', async (req, res) => {
        const bundleUrl = `${url}/${req.params.id}`;

        try {
            const bundle = (await rp({url: bundleUrl, json: true}))._source;

            bundle.name = req.params.name;

            const esResBody = await rp.put({url: bundleUrl, body: bundle, json: true});
            res.status(200).json(esResBody);
        } catch (esResErr) {
            res.status(esResErr.statusCode || 502).json(esResErr.error);
        }
    });

    /**
     * Put a book into a bundle by its id.
     * curl -X PUT http://<host>:<port>/api/bundle/<id>/book/<pgid>
     */
    app.put('/api/bundle/:id/book/:pgid', async (req, res) => {
        const bundleUrl = `${url}/${req.params.id}`;

        const bookUrl =
            `http://${es.host}:${es.port}` +
            `/${es.books_index}/book/${req.params.pgid}`;
        
        try {
            // Request the bundle and book in parallel.
            const [bundleRes, bookRes] = await Promise.all([
                rp({url: bundleUrl, json: true}),
                rp({url: bookUrl, json: true}),
            ]);

            // Extract bundle and book information from responses.
            const {_source: bundle, _version: version} = bundleRes;
            const {_source: book} = bookRes;
            
            const idx = bundle.books.findIndex(book => book.id === req.params.pgid);
            if (idx === -1) {
                bundle.books.push({
                    id: req.params.pgid,
                    title: book.title,
                });
            }

            // Put the updated bundle back in the index.
            const esResBody = await rp.put({
                url: bundleUrl,
                // qs: { version },  // This part doesn't need. If this part is used, the error occurs.
                body: bundle,
                json: true,
            });
            
            res.status(200).json(esResBody);
        } catch (esResErr) {
            res.status(esResErr.statusCode || 502).json(esResErr.error);
        }
    });

    /**
     * Delete a bundle entirely.
     * curl -X DELETE http://<host>:<port>/api/bundle/<id>
     */
    app.delete('/api/bundle/:id', async (req, res) => {
        // Determine the bundle's URL based on the es config object and the request parameters.
        const bundleUrl = `${url}/${req.params.id}`;

        // Wrap your await call in a try/catch block to handle any errors.
        try {
            // Request the bundle.
            const [bundleRes] = await Promise.all([
                rp({url: bundleUrl, json: true}),
            ]);

            // Extract bundle and book information from responses.
            const {_source: bundle} = bundleRes;
            
            // Use await with a call to rp to suspend until the deletion is completed.
            const esResBody = await rp.delete({
                url: bundleUrl,
                body: {
                    _id: req.params.id
                },
                json: true,
            });
            
            res.status(200).json(esResBody);
        } catch (esResErr) {
            res.status(esResErr.statusCode || 502).json(esResErr.error);
        }
    });

    /**
     * Remove a book from a bundle.
     * curl -X DELETE http://<host>:<port>/api/bundle/<id>/book/<pgid>
     */
    app.delete('/api/bundle/:id/book/:pgid', async (req, res) => {
        const bundleUrl = `${url}/${req.params.id}`;

        try {
            // Use await with rp to retrieve the bundle object from Elasticsearch.
            const [bundleRes] = await Promise.all([
                rp({url: bundleUrl, json: true})
            ]);

            // Find the index of the book within the bundle.books list.
            const {_source: bundle} = bundleRes;

            const idx = bundle.books.findIndex(book => book.id === req.params.pgid);

            // If the book doesn't exist, return 409.
            if (idx === -1) {
                throw {
                    statusCode: 409,
                    error: "The bundle doesn't contain the book."
                }
            }

            // Remove the book from the list.
            bundle.books.splice(idx, 1);

            // PUT the updated bundle object back into the Elasticsearch index, again with await and rp.
            const esResBody = await rp.put({
                url: bundleUrl,
                body: bundle,
                json: true,
            });
            
            res.status(200).json(esResBody);

        } catch (esResErr) {
            console.log(esResErr.statusCode);
            res.status(esResErr.statusCode || 502).json(esResErr.error);
        }
    });
};