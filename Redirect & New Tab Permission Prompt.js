// ==UserScript==
// @name Redirect & New Tab Permission Prompt
// @namespace https://github.com/rosx27/TMScripts
// @version 1.0
// @description Ask before allowing redirects or new tabs
// @author Ross
// @match *://*/*
// @grant none
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';

    // Intercept window.open
    const originalOpen = window.open;
    window.open = function(url, name, specs) {
        const allow = confirm(`This site wants to open a new tab/window to:\n\n${url}\n\nAllow it?`);
        if (allow) {
            return originalOpen.call(window, url, name, specs);
        } else {
            console.warn('Blocked a tab opening:', url);
            return null;
        }
    };

    // Intercept location redirects
    function interceptLocation(obj) {
        ['assign', 'replace'].forEach(method => {
            const originalMethod = obj[method];
            obj[method] = function(url) {
                const allow = confirm(`This site wants to redirect you to:\n\n${url}\n\nAllow it?`);
                if (allow) {
                    return originalMethod.call(location, url);
                } else {
                    console.warn(`Blocked redirect via location.${method} to`, url);
                }
            };
        });

        // Intercept direct location.href set
        Object.defineProperty(obj, 'href', {
            set: function(url) {
                const allow = confirm(`This site wants to redirect you to:\n\n${url}\n\nAllow it?`);
                if (allow) {
                    window.location.assign(url);
                } else {
                    console.warn('Blocked redirect via location.href =', url);
                }
            },
            get: function() {
                return window.location.toString();
            }
        });
    }

    interceptLocation(window.location);

})();
