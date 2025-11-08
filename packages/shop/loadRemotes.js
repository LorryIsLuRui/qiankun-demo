const loadRemotes = async (remotes) => {
    const promises = Object.entries(remotes).map(([scope, url]) => loadRemoteEntry(scope, url));
    await Promise.all(promises);
    return remotes;
};

async function loadRemoteEntry(scope, url) {
    if (window[scope]) return;
    await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
    await __webpack_init_sharing__('default');
    const container = window[scope];
    await container.init(__webpack_share_scopes__.default);
}
export default loadRemotes;