// ==UserScript==
// @name YouTube Home Feed View Filter (Extended)
// @namespace https://github.com/rosx27/TMScripts
// @version 2.1
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

    // --- Shorts Options (for the HOME FEED shelf only) ---
    // 'hide_shelf' : hides the entire "Shorts" shelf row on home page
    // 'hide_all'   : hides every individual Short card in the home feed
    // 'filter'     : apply MIN_VIEWS filter to Shorts feed (youtube.com/shorts/...)
    // 'off'        : don't filter Shorts at all
    const SHORTS_MODE = 'filter';

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
        const membersOnlyBadge = element.querySelector('ytd-badge-supported-renderer #tooltip.ytd-badge-supported-renderer[title="Members only content"]');
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

    // SHORTS FEED FILTER (youtube.com/shorts/...)
    // On the Shorts player page, the currently visible short is inside
    // ytd-reel-video-renderer[is-active] and view count is in #factoids span
    function processShortsPage() {
        if (SHORTS_MODE !== 'filter') return;
        if (!location.pathname.startsWith('/shorts')) return;

        // The active short being watched
        const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]:not([data-yt-filtered])');
        if (!activeShort) return;

        activeShort.setAttribute('data-yt-filtered', 'checking');

        const title = activeShort.querySelector('#title, h2')?.textContent.trim().substring(0, 60) || 'Unknown';

        // View count lives in #factoids — look for a span containing "view"
        let viewText = null;
        const factoids = activeShort.querySelector('#factoids');
        if (factoids) {
            for (const span of factoids.querySelectorAll('span')) {
                const text = span.textContent.trim();
                if (text.toLowerCase().includes('view')) {
                    viewText = text;
                    break;
                }
            }
        }

        // Fallback: search all spans in the renderer
        if (!viewText) {
            for (const span of activeShort.querySelectorAll('span')) {
                const text = span.textContent.trim();
                if (text.toLowerCase().includes('view')) {
                    viewText = text;
                    break;
                }
            }
        }

        if (!viewText) {
            log(`Short ("${title}"): ⚠️ Could not find view count, skipping`);
            activeShort.setAttribute('data-yt-filtered', 'no-metadata');
            return;
        }

        const viewCount = parseViewCount(viewText);
        if (viewCount === null) {
            log(`Short ("${title}"): Could not parse view count from: "${viewText}"`);
            activeShort.setAttribute('data-yt-filtered', 'no-metadata');
            return;
        }

        if (viewCount < MIN_VIEWS) {
            // Can't hide the short itself (it would break the player),
            // so navigate to the next one automatically
            log(`✗ AUTO-SKIP Short ("${title}") - ${viewCount} views — navigating to next`);
            activeShort.setAttribute('data-yt-filtered', 'true');
            skipToNextShort();
        } else {
            activeShort.setAttribute('data-yt-filtered', 'kept');
            log(`✓ KEPT Short: "${title}" - ${viewCount} views`);
        }
    }

    function skipToNextShort() {
        // Try the navigation button first
        const nextBtn = document.querySelector(
            'ytd-shorts [aria-label="Next video"], ' +
            '#navigation-button-down button, ' +
            'button[aria-label="Next video"]'
        );
        if (nextBtn) {
            nextBtn.click();
            return;
        }
        // Fallback: simulate down arrow key
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    }

    // HOME FEED SHORTS SHELF
    function processHomeFeedShorts() {
        if (SHORTS_MODE === 'off' || SHORTS_MODE === 'filter') return;

        if (SHORTS_MODE === 'hide_shelf') {
            document.querySelectorAll('ytd-rich-shelf-renderer:not([data-yt-filtered])').forEach(shelf => {
                if (shelf.querySelector('a[href*="/shorts/"]') || shelf.textContent.includes('Shorts')) {
                    shelf.style.display = 'none';
                    shelf.setAttribute('data-yt-filtered', 'true');
                    log('✗ FILTERED (Shorts shelf hidden)');
                }
            });
        }

        if (SHORTS_MODE === 'hide_all') {
            document.querySelectorAll('ytd-rich-item-renderer:not([data-yt-filtered]), ytd-reel-item-renderer:not([data-yt-filtered])').forEach(item => {
                if (isShort(item)) {
                    const title = item.querySelector('#video-title, #title')?.textContent.trim().substring(0, 60) || 'Unknown';
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

    // REGULAR VIDEO FILTER
    function processVideos() {
        processHomeFeedShorts();
        processShortsPage();

        const videoElements = document.querySelectorAll('ytd-rich-item-renderer:not([data-yt-filtered])');
        log(`Found ${videoElements.length} unprocessed video elements`);

        let filteredViews = 0, filteredMembers = 0, kept = 0, noMetadata = 0;

        videoElements.forEach((video, index) => {
            video.setAttribute('data-yt-filtered', 'checked');

            const titleElement = video.querySelector('#video-title');
            const title = titleElement ? titleElement.textContent.trim().substring(0, 60) : 'Unknown title';

            // Skip Shorts in home feed — handled separately
            if (isShort(video)) return;

            // 1. Members Only
            if (checkIfMembersOnly(video)) {
                hideElement(video, 'Members Only', title);
                filteredMembers++;
                return;
            }

            // 2. View count
            let viewText = null;

            const metadataLine = video.querySelector('#metadata-line');
            if (metadataLine) {
                metadataLine.querySelectorAll('span').forEach(span => {
                    const text = span.textContent.trim();
                    if (text.toLowerCase().includes('view')) viewText = text;
                });
            }

            if (!viewText) {
                const metaBlock = video.querySelector('ytd-video-meta-block');
                if (metaBlock) {
                    metaBlock.querySelectorAll('span').forEach(span => {
                        const text = span.textContent.trim();
                        if (text.toLowerCase().includes('view')) viewText = text;
                    });
                }
            }

            if (!viewText) {
                for (const span of video.querySelectorAll('span')) {
                    const text = span.textContent.trim();
                    if (text.toLowerCase().includes('view')) { viewText = text; break; }
                }
            }

            if (!viewText) {
                log(`Video ${index} ("${title}"): ⚠️ Could not find view count`);
                noMetadata++;
                return;
            }

            const viewCount = parseViewCount(viewText);
            if (viewCount === null) {
                log(`Video ${index} ("${title}"): Could not parse view count from: "${viewText}"`);
                noMetadata++;
                return;
            }

            if (viewCount < MIN_VIEWS) {
                hideElement(video, 'Low Views', title, viewCount, viewText);
                filteredViews++;
            } else {
                log(`✓ KEPT: "${title}" - ${viewCount} views`);
                kept++;
            }
        });

        if (filteredViews > 0 || filteredMembers > 0 || kept > 0 || noMetadata > 0) {
            log(`=== SUMMARY: ${filteredViews} Low Views | ${filteredMembers} Members Only | ${kept} kept | ${noMetadata} no metadata ===`);
        }
    }

    // INIT
    log('🚀 YouTube View Filter initialized - Minimum views: ' + MIN_VIEWS + ' | Shorts mode: ' + SHORTS_MODE);

    setTimeout(() => {
        log('⏱️ Starting initial scan...');
        processVideos();
    }, 3000);

    const observer = new MutationObserver(() => processVideos());

    setTimeout(() => {
        const targetNode = document.querySelector('ytd-app');
        if (targetNode) {
            observer.observe(targetNode, { childList: true, subtree: true });
            log('👀 MutationObserver attached to ytd-app');
        } else {
            log('⚠️ Warning: ytd-app element not found');
        }
    }, 1000);

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            log('📜 Scroll detected, checking for new videos...');
            processVideos();
        }, 500);
    });

    // Re-check when navigating between Shorts (YouTube SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            log('🔀 Navigation detected:', location.href);
            // Reset processed flags on the new short so it gets evaluated
            setTimeout(processShortsPage, 1500);
        }
    }).observe(document, { subtree: true, childList: true });

    log('✅ YouTube View Filter fully active');
})();