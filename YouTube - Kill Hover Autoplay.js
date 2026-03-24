// ==UserScript==
// @name YouTube - Kill Hover Autoplay
// @namespace https://github.com/rosx27/TMScripts
// @version 2.0.0
// @description Kills YouTube inline playback / hover video previews. No more full-blast audio.
// @author Ross
// @match https://www.youtube.com/*
// @match https://youtube.com/*
// @grant none
// @run-at document-start
// ==/UserScript==

(function () {
    'use strict';

    // ─── LAYER 1: CSS — Hide the actual preview elements ─────────────────────
    // These are the real selectors YouTube uses (confirmed working as of 2025-2026)
    const css = `
        /* The main inline video preview container */
        ytd-video-preview                                    { display: none !important; }

        /* The loading spinner shown while preview loads */
        .ytd-thumbnail-overlay-loading-preview-renderer     { display: none !important; }

        /* The inline preview UI overlay on the thumbnail */
        .ytp-inline-preview-ui                              { display: none !important; }
        .ytp-inline-preview-scrubber                        { display: none !important; }

        /* The #preview slot inside ytd-rich-grid-renderer */
        #preview                                            { display: none !important; }

        /* Hide the "is-preview-loading" spinner state on thumbnails */
        ytd-thumbnail[is-preview-loading]
            ytd-thumbnail-overlay-time-status-renderer      { display: none !important; }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    (document.head || document.documentElement).appendChild(styleEl);


    // ─── LAYER 2: Prototype Hook — Block play() on preview <video> elements ──
    // YouTube calls .play() on a <video> inside ytd-video-preview.
    // We intercept HTMLMediaElement.prototype.play and silently kill it for previews.
    const _origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
        if (isPreviewMedia(this)) {
            this.muted = true;
            this.volume = 0;
            // Return a resolved promise — rejecting causes YT's uncaught errors
            return Promise.resolve();
        }
        return _origPlay.apply(this, arguments);
    };

    // Intercept volume/muted setters so YT can't un-mute a preview video
    const mediaProto = HTMLMediaElement.prototype;
    const _volumeDescriptor = Object.getOwnPropertyDescriptor(mediaProto, 'volume');
    const _mutedDescriptor  = Object.getOwnPropertyDescriptor(mediaProto, 'muted');

    Object.defineProperty(mediaProto, 'volume', {
        get: _volumeDescriptor.get,
        set: function (val) {
            if (isPreviewMedia(this)) return; // block volume change on previews
            _volumeDescriptor.set.call(this, val);
        },
        configurable: true,
    });

    Object.defineProperty(mediaProto, 'muted', {
        get: _mutedDescriptor.get,
        set: function (val) {
            if (isPreviewMedia(this) && val === false) return; // keep previews muted
            _mutedDescriptor.set.call(this, val);
        },
        configurable: true,
    });

    /**
     * Returns true if a media element lives inside a YouTube preview container.
     */
    function isPreviewMedia(el) {
        try {
            let node = el;
            while (node) {
                const tag = node.tagName ? node.tagName.toLowerCase() : '';
                const id  = node.id || '';
                if (
                    tag === 'ytd-video-preview' ||
                    tag === 'ytd-moving-thumbnail-renderer' ||
                    id  === 'inline-preview' ||
                    id  === 'preview'
                ) {
                    return true;
                }
                node = node.parentElement;
            }
        } catch (e) { /* cross-origin shadow DOM — ignore */ }
        return false;
    }


    // ─── LAYER 3: MutationObserver — Nuke any preview <video> that slips in ──
    function killExistingPreviews() {
        document.querySelectorAll([
            'ytd-video-preview video',
            '#preview video',
            '.ytp-inline-preview-ui video',
        ].join(', ')).forEach(v => {
            try {
                v.pause();
                v.muted  = true;
                v.volume = 0;
                v.src    = '';
                v.load();
            } catch (e) {}
        });
    }

    const observer = new MutationObserver(() => {
        clearTimeout(observer._t);
        observer._t = setTimeout(killExistingPreviews, 100);
    });

    function startObserver() {
        killExistingPreviews();
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }

    // Re-apply on YouTube SPA navigations
    window.addEventListener('yt-navigate-finish',   () => setTimeout(killExistingPreviews, 400));
    window.addEventListener('yt-page-data-updated', () => setTimeout(killExistingPreviews, 400));

    // Safety net — check every 3 seconds for anything that snuck through
    setInterval(killExistingPreviews, 3000);

    console.log('[YT-KillHoverAutoplay v2] Active — hover previews are dead 🔇');
})();