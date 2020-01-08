import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import * as templates from './templates.ts';
import { addBundleForm } from './templates';

import '../node_modules/bootstrap-social/bootstrap-social.css';
import '../node_modules/font-awesome/css/font-awesome.min.css';

// Page setup
// document.body.innerHTML = templates.main();



/**
 * Use Window location hash to show the specified view.
 */
const showView = async () => {
    const mainElement = document.body.querySelector('.b4-main');
    const [view, ...params] = window.location.hash.split('/');

    switch (view) {
        case '#welcome':
            const session = await fetchJSON('/api/session');
            mainElement.innerHTML = templates.welcome({session});
            // mainElement.innerHTML = templates.welcome();
            // if (session.error) {
            //     showAlert(session.error);
            // }
            break;
        case '#list-bundles':
            const bundles = await getBundles();
            listBundles(bundles);
            break;
        default:
            // Unrecognized view.
            throw Error(`Unrecognized view: ${view}`);
    }
};

// window.addEventListener('hashchange', showView);

// showView().catch(err => window.location.hash = '#welcome');

const getBundles = async () => {
    const esRes = await fetch('/es/b4/bundle/_search?size=1000');
    const esResBody = await esRes.json();

    return esResBody.hits.hits.map(hit => ({
        id: hit._id,
        name: hit._source.name,
    }));
};

const listBundles = bundles => {
    const mainElement = document.body.querySelector('.b4-main');
    mainElement.innerHTML = templates.addBundleForm() + templates.listBundles({bundles});

    const form = mainElement.querySelector('form');

    form.addEventListener('submit', event => {
        event.preventDefault();
        const name = form.querySelector('input').value;
        addBundle(name);
    });

    const deleteButtons = mainElement.querySelectorAll('button.btn-secondary');
    console.log(deleteButtons);

    for (let i = 0; i < deleteButtons.length; i++) {
        const deleteButton = deleteButtons[i];
        deleteButton.addEventListener('click', event => {
            deleteBundle(deleteButton.getAttribute('data-bundle-id'));
        });
    }

};

/**
 * Show an alert to the user.
 */
const showAlert = (message, type = 'danger') => {
    const alertsElement = document.body.querySelector('.b4-alerts');
    const html = templates.alert({type, message});
    alertsElement.insertAdjacentHTML('beforeend', html);
};

/**
 * Create a new bundle with the given name, then list bundles.
 */
const addBundle = async (name) => {
    try {
        // Grab the list of bundles already created.
        const bundles = await getBundles();

        // Add the new bundle.
        const url = `/api/bundle?name=${encodeURIComponent(name)}`;
        const res = await fetch(url, {method: 'POST'});
        const resBody = await res.json();

        // Merge the new bundle into the original results and show them.
        bundles.push({id: resBody._id, name});
        listBundles(bundles);

        showAlert(`Bundle "${name}" created!`, 'success');
    } catch (err) {
        showAlert(err);
    }
};




/**
 * Delete the bundle with the specified ID, then list bundles.
 */
const deleteBundle = async (bundleId) => {
    console.log('deleteBundle() triggered!');
    try {
        // Delete the bundle, then render the updated list with listBundles().

        // Use getBundles() to retrieve the current list of bundles.
        const bundles = await getBundles();

        // Find the index of the selected bundleId in the list.
        // (If there is no matching bundle, throw an exception explaining the problem.)
        const idx = bundles.findIndex(bundle => bundle.id === bundleId);

        if (idx === -1) {
            throw {
                statusCode: 409,
                error: "The bundle doesn't exist."
            }
        }

        // Remove the book from the list.
        // ???

        // Issue an HTTP DELETE request for the specified bundleId using fetch().
        const url = `/api/bundle/${bundleId}`;
        const res = await fetch(url, {method: 'DELETE'});
        const resBody = await res.json();

        // Remove the bundle from the list by calling splice(), passing in the found index.
        bundles.splice(idx, 1);

        // Render the updated list using listBundles() and show a success message using showAlert().
        listBundles(bundles);

        showAlert(`Bundle deleted!`, 'success');
    } catch (err) {
        showAlert(err);
    }
};


/**
 * Convenience method to fetch and decode JSON.
 */
const fetchJSON = async (url, method = 'GET') => {
    try {
        const response = await fetch(url, {method, credentials: 'same-origin'});
        return response.json();
    } catch (error) {
        return {error};
    }
};


// Page setup.
(async () => {
    const session = await fetchJSON('/api/session');
    // console.log(JSON.stringify(session));
    document.body.innerHTML = templates.main({session});
    window.addEventListener('hashchange', showView);
    showView().catch(err => window.location.hash = '#welcome');
})();