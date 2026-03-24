// ==UserScript==
// @name 9GAG Ad Cleaner (Safe)
// @namespace https://github.com/rosx27/TMScripts/blob/main/9GAG%20Ad%20Cleaner%20(Safe).js
// @version 1.1
// @description Remove html-load.com ads without breaking layout
// @author Ross
// @match https://9gag.com/*
// @run-at document-start
// @grant none
// ==/UserScript==

(function () {
    'use strict';

    const AD_SRC_RE = /html-load\.com\/player\/9gag\.com/i;

    function removeAd(img) {
        // Find the smallest reasonable wrapper
        const wrapper = img.closest('a, div');

        if (wrapper) {
            wrapper.style.display = 'none';
            wrapper.style.height = '0';
            wrapper.style.margin = '0';
            wrapper.style.padding = '0';
        } else {
            img.remove();
        }
    }

    function scan(root = document) {
        root.querySelectorAll('img').forEach(img => {
            if (img.src && AD_SRC_RE.test(img.src)) {
                removeAd(img);
            }
        });
    }

    // Initial scan (when DOM becomes available)
    document.addEventListener('DOMContentLoaded', () => scan());

    // Mutation observer for injected ads
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;

                if (node.tagName === 'IMG' && AD_SRC_RE.test(node.src)) {
                    removeAd(node);
                } else {
                    scan(node);
                }
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
