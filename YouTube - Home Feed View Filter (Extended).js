// ==UserScript==
// @name YouTube Home Feed View Filter (Extended)
// @namespace https://github.com/rosx27/TMScripts
// @version 2.2
// @description Filter low-view, Members Only, and Shorts from YouTube home feed and Shorts feed
// @author Ross
// @match https://www.youtube.com/*
// @grant none
// @run-at document-idle
// ==/UserScript==

(function() {
    'use strict';

    const MIN_VIEWS = 5000;
    const DEBUG = true;
    const SHORTS_MODE = 'filter'; // 'hide_shelf' | 'hide_all' | 'filter' | 'off'

    function log(message, data) {
        if (DEBUG) console.log(`[YT Filter] ${message}`, data || '');
    }

    function parseViewCount(viewText) {
        if (!viewText) return null;

        const cleaned = viewText.toLowerCase()
            .replace(/views?/i, '')
            .replace(/watching/i, '')
            .replace(/,/g, '')
            .trim();

        if (cleaned.includes('no views') || cleaned === '') return 0;

        // Must start with a digit
        if (!/^\d/.test(cleaned)) return null;

        const match = cleaned.match(/^([\d.]+)\s*([kmb])?/i);
        if (!match) return null;

        const num = parseFloat(match[1]);
        const suffix = match[2]?.toLowerCase();
        const multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 };
        return num * (multipliers[suffix] || 1);
    }

    function checkIfMembersOnly(element) {
        const membersOnlyText = element.textContent.includes('Members only');
        const membersOnlyBadge = element.querySelector('ytd-badge-supported-renderer #tooltip[title="Members only content"]');
        return membersOnlyText || membersOnlyBadge;
    }

    function isShort(element) {
        return !!element.querySelector('a[href*="/shorts/"]');
    }

    function hideElement(element, reason, title, viewCount, viewText) {
        element.style.display = 'none';
        element.setAttribute('data-yt-filtered', 'true');
        let msg = `✗ FILTERED (${reason}): "${title}"`;
        if (viewCount !== undefined) msg += ` - ${viewCount} views (${viewText})`;
        log(msg);
    }

    // ─── EXTRACT VIEW COUNT ───────────────────────────────────────────────────────
    function extractViewText(videoEl) {
        // NEW layout: rows are [channel, viewcount, timeago] — no "views" keyword
        const rows = videoEl.querySelectorAll('.ytContentMetadataViewModelMetadataRow');
        if (rows.length >= 2) {
            // Prefer whichever row contains a bare number like "72K" or "1.2M"
            for (let i = 1; i < rows.length; i++) {
                const text = rows[i].textContent.trim();
                if (/^[\d.]+\s*[kmb]?$/i.test(text) || text.toLowerCase().includes('view')) {
                    return text;
                }
            }
            // Fallback: just grab index 1 (views row)
            const candidate = rows[1].textContent.trim();
            if (candidate) return candidate;
        }

        // Single row fallback — metadata sometimes collapsed into one row "Aculite 72K 1d ago"
        if (rows.length === 1) {
            const parts = rows[0].textContent.trim().split(/\s+/);
            // Find the token that looks like a view count
            for (const part of parts) {
                if (/^[\d.]+[kmb]?$/i.test(part)) return part;
            }
        }

        // OLD layout fallbacks
        const metadataLine = videoEl.querySelector('#metadata-line');
        if (metadataLine) {
            for (const span of metadataLine.querySelectorAll('span')) {
                const text = span.textContent.trim();
                if (text.toLowerCase().includes('view')) return text;
            }
        }

        const metaBlock = videoEl.querySelector('ytd-video-meta-block');
        if (metaBlock) {
            for (const span of metaBlock.querySelectorAll('span')) {
                const text = span.textContent.trim();
                if (text.toLowerCase().includes('view')) return text;
            }
        }

        return null;
    }

    // ─── SHORTS FEED FILTER ───────────────────────────────────────────────────────
    function processShortsPage() {
        if (SHORTS_MODE !== 'filter') return;
        if (!location.pathname.startsWith('/shorts')) return;

        const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]:not([data-yt-filtered])');
        if (!activeShort) return;

        activeShort.setAttribute('data-yt-filtered', 'checking');
        const title = activeShort.querySelector('#title, h2')?.textContent.trim().substring(0, 60) || 'Unknown';

        let viewText = null;
        const factoids = activeShort.querySelector('#factoids');
        if (factoids) {
            for (const span of factoids.querySelectorAll('span')) {
                const text = span.textContent.trim();
                if (text.toLowerCase().includes('view')) { viewText = text; break; }
            }
        }
        if (!viewText) {
            for (const span of activeShort.querySelectorAll('span')) {
                const text = span.textContent.trim();
                if (text.toLowerCase().includes('view')) { viewText = text; break; }
            }
        }

        if (!viewText) {
            activeShort.setAttribute('data-yt-filtered', 'no-metadata');
            return;
        }

        const viewCount = parseViewCount(viewText);
        if (viewCount === null) {
            activeShort.setAttribute('data-yt-filtered', 'no-metadata');
            return;
        }

        if (viewCount < MIN_VIEWS) {
            log(`✗ AUTO-SKIP Short ("${title}") - ${viewCount} views`);
            activeShort.setAttribute('data-yt-filtered', 'true');
            skipToNextShort();
        } else {
            activeShort.setAttribute('data-yt-filtered', 'kept');
            log(`✓ KEPT Short: "${title}" - ${viewCount} views`);
        }
    }

    function skipToNextShort() {
        const nextBtn = document.querySelector(
            'ytd-shorts [aria-label="Next video"], #navigation-button-down button, button[aria-label="Next video"]'
        );
        if (nextBtn) { nextBtn.click(); return; }
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    }

    // ─── HOME FEED SHORTS SHELF ───────────────────────────────────────────────────
    function processHomeFeedShorts() {
        if (SHORTS_MODE === 'off' || SHORTS_MODE === 'filter') return;

        if (SHORTS_MODE === 'hide_shelf') {
            document.querySelectorAll('ytd-rich-shelf-renderer:not([data-yt-filtered])').forEach(shelf => {
                if (shelf.querySelector('a[href*="/shorts/"]') || shelf.textContent.includes('Shorts')) {
                    shelf.style.display = 'none';
                    shelf.setAttribute('data-yt-filtered', 'true');
                }
            });
        }

        if (SHORTS_MODE === 'hide_all') {
            document.querySelectorAll('ytd-rich-item-renderer:not([data-yt-filtered]), ytd-reel-item-renderer:not([data-yt-filtered])').forEach(item => {
                if (isShort(item)) {
                    const title = item.querySelector('#video-title, .ytLockupMetadataViewModelTitle')?.textContent.trim().substring(0, 60) || 'Unknown';
                    hideElement(item, 'Short', title);
                }
            });
            document.querySelectorAll('ytd-rich-shelf-renderer:not([data-yt-filtered])').forEach(shelf => {
                if (shelf.querySelector('a[href*="/shorts/"]') || shelf.textContent.includes('Shorts')) {
                    shelf.style.display = 'none';
                    shelf.setAttribute('data-yt-filtered', 'true');
                }
            });
        }
    }

    // ─── MAIN FILTER ──────────────────────────────────────────────────────────────
    function processVideos() {
        processHomeFeedShorts();
        processShortsPage();

        // KEY FIX: only skip cards that are definitively done ('true' = hidden, 'kept' = approved)
        // Cards marked 'checked' get re-evaluated so new content is never stuck
        const videoElements = document.querySelectorAll(
            'ytd-rich-item-renderer:not([data-yt-filtered="true"]):not([data-yt-filtered="kept"])'
        );
        log(`Found ${videoElements.length} unprocessed video elements`);

        let filteredViews = 0, filteredMembers = 0, kept = 0, noMetadata = 0;

        videoElements.forEach((video, index) => {
            if (isShort(video)) {
                video.setAttribute('data-yt-filtered', 'kept');
                return;
            }

            const titleElement = video.querySelector('#video-title, .ytLockupMetadataViewModelTitle, h3 a');
            const title = titleElement ? titleElement.textContent.trim().substring(0, 60) : 'Unknown title';

            if (checkIfMembersOnly(video)) {
                hideElement(video, 'Members Only', title);
                filteredMembers++;
                return;
            }

            const viewText = extractViewText(video);

            if (!viewText) {
                // Mark as 'checking' so we retry next mutation instead of giving up
                video.setAttribute('data-yt-filtered', 'checking');
                log(`Video ${index} ("${title}"): ⚠️ No view count yet, will retry`);
                noMetadata++;
                return;
            }

            const viewCount = parseViewCount(viewText);
            if (viewCount === null) {
                log(`Video ${index} ("${title}"): Could not parse: "${viewText}"`);
                video.setAttribute('data-yt-filtered', 'kept'); // don't hide if unparseable
                noMetadata++;
                return;
            }

            if (viewCount < MIN_VIEWS) {
                hideElement(video, 'Low Views', title, viewCount, viewText);
                filteredViews++;
            } else {
                video.setAttribute('data-yt-filtered', 'kept');
                log(`✓ KEPT: "${title}" - ${viewCount} views`);
                kept++;
            }
        });

        if (filteredViews > 0 || filteredMembers > 0 || kept > 0 || noMetadata > 0) {
            log(`=== SUMMARY: ${filteredViews} Low Views | ${filteredMembers} Members Only | ${kept} kept | ${noMetadata} retrying ===`);
        }
    }

    // ─── INIT ─────────────────────────────────────────────────────────────────────
    log('🚀 YouTube View Filter v2.3 | Min views: ' + MIN_VIEWS + ' | Shorts: ' + SHORTS_MODE);

    setTimeout(() => processVideos(), 3000);

    setTimeout(() => {
        const targetNode = document.querySelector('ytd-app');
        if (targetNode) {
            new MutationObserver(() => processVideos()).observe(targetNode, { childList: true, subtree: true });
            log('👀 MutationObserver attached to ytd-app');
        } else {
            log('⚠️ ytd-app not found');
        }
    }, 1000);

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => processVideos(), 500);
    });

    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            log('🔀 Navigation detected:', location.href);
            setTimeout(processShortsPage, 1500);
        }
    }).observe(document, { subtree: true, childList: true });

})();