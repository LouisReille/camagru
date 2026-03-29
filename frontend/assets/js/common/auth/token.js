function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        credentials: "include"
    });
}

window.storeAuthToken = () => {};

window.getAuthToken = () => null;

window.removeAuthToken = () => {};

window.getAuthHeader = () => null;

window.isHttps = () => false;

window.authFetch = authFetch;