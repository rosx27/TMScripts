// ==UserScript==
// @name Google Search Enhancer
// @namespace https://github.com/rosx27/TMScripts/blob/main/Google%20Search%20Enhancer.js
// @version 1.0
// @description Enhances Google Search with multiple features: removes sponsored results, adds quick filters, highlights keywords, keyboard shortcuts for navigation, infinite scroll, and custom search site modifiers
// @author Ross
// @match https://www.google.com/*
// @match https://google.com/*
// @grant GM_addStyle
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const config = {
        // Keywords to highlight and their colors
        highlightKeywords: {
            'tutorial': '#FFFF00', // Yellow
            'guide': '#AAFFAA',    // Light green
            'example': '#AACCFF',  // Light blue
            // Add your frequently searched terms here
        },
        // Whether to enable infinite scroll
        infiniteScroll: true,
        // Quick filter options to show
        quickFilters: true,
        // Whether to remove sponsored results
        removeSponsored: true,
        // Enable keyboard shortcuts
        keyboardShortcuts: true,
        // Enable custom site search modifier
        customSiteSearch: true
    };

    // Add CSS styles
    GM_addStyle(`
        /* Custom filter buttons */
        .custom-filters {
            display: flex;
            gap: 10px;
            margin: 10px 0;
            padding: 5px;
            background: #ACB7C1;
            border-radius: 8px;
            align-items: center;
        }
        .custom-filter-btn {
            padding: 5px 10px;
            border-radius: 16px;
            background: #f1f3f4;
            border: 1px solid #dadce0;
            color: #202124;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        .custom-filter-btn:hover {
            background: #e8eaed;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .custom-filter-btn.active {
            background: #e8f0fe;
            color: #1a73e8;
            border-color: #d2e3fc;
        }

        /* Custom site search dialog */
        #custom-site-search-dialog {
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.2);
            z-index: 10000;
            width: 400px;
            max-width: 90%;
            display: none;
        }
        .dialog-title {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 16px;
        }
        .dialog-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .dialog-input:focus {
            outline: none;
            border-color: #1a73e8;
        }
        .dialog-checkbox-container {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        .dialog-checkbox {
            margin-right: 8px;
        }
        .dialog-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
        .dialog-button {
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            border: none;
        }
        .dialog-cancel {
            background: #f1f3f4;
            color: #202124;
        }
        .dialog-submit {
            background: #1a73e8;
            color: white;
        }
        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: none;
        }

        /* Keyboard shortcuts info */
        .keyboard-shortcuts-info {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 13px;
            z-index: 9000;
            max-width: 300px;
            transition: opacity 0.3s;
            opacity: 0.8;
        }
        .keyboard-shortcuts-info:hover {
            opacity: 1;
        }
        .keyboard-shortcuts-info h4 {
            margin: 0 0 5px;
            font-size: 14px;
        }
        .keyboard-shortcuts-info ul {
            margin: 0;
            padding-left: 20px;
        }
        .keyboard-shortcuts-info li {
            margin: 3px 0;
        }
        .keyboard-shortcuts-info kbd {
            background: #f1f3f4;
            border-radius: 3px;
            border: 1px solid #dadce0;
            padding: 1px 4px;
            font-size: 12px;
        }
    `);

    // Wait for DOM to be ready
    function onReady(callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }

    // Create and add custom site search dialog
    function createSiteSearchDialog() {
        const dialogHTML = `
            <div class="dialog-overlay" id="custom-site-search-overlay"></div>
            <div id="custom-site-search-dialog">
                <div class="dialog-title">Custom Site Search</div>
                <input type="text" class="dialog-input" id="site-input" placeholder="Enter domain (e.g., reddit.com)">
                <div class="dialog-checkbox-container">
                    <input type="checkbox" id="subreddit-checkbox" class="dialog-checkbox">
                    <label for="subreddit-checkbox">Add subreddit filter</label>
                </div>
                <div id="subreddit-container" style="display: none; margin-bottom: 16px;">
                    <input type="text" class="dialog-input" id="subreddit-input" placeholder="Enter subreddit name (e.g., localllama)">
                </div>
                <div class="dialog-buttons">
                    <button class="dialog-button dialog-cancel" id="site-search-cancel">Cancel</button>
                    <button class="dialog-button dialog-submit" id="site-search-submit">Apply</button>
                </div>
            </div>
        `;

        const dialogContainer = document.createElement('div');
        dialogContainer.innerHTML = dialogHTML;
        document.body.appendChild(dialogContainer);

        // Setup event listeners
        document.getElementById('custom-site-search-overlay').addEventListener('click', hideCustomSiteSearch);
        document.getElementById('site-search-cancel').addEventListener('click', hideCustomSiteSearch);
        document.getElementById('subreddit-checkbox').addEventListener('change', function() {
            document.getElementById('subreddit-container').style.display = this.checked ? 'block' : 'none';
        });

        document.getElementById('site-search-submit').addEventListener('click', function() {
            const site = document.getElementById('site-input').value.trim();
            const useSubreddit = document.getElementById('subreddit-checkbox').checked;
            const subreddit = document.getElementById('subreddit-input').value.trim();

            if (site) {
                let searchInput = document.querySelector('input[name="q"]');
                if (!searchInput) {
                    searchInput = document.querySelector('textarea[name="q"]');
                }

                if (searchInput) {
                    let currentQuery = searchInput.value;

                    // Remove any existing site: modifiers
                    currentQuery = currentQuery.replace(/\s*site:\S+/g, '');

                    // Add new site modifier
                    let newQuery = `${currentQuery} site:${site}`;

                    // Add subreddit if checked
                    if (useSubreddit && subreddit) {
                        newQuery += ` subreddit:${subreddit}`;
                    }

                    searchInput.value = newQuery.trim();

                    // If we're on a results page, submit the form
                    const searchForm = searchInput.closest('form');
                    if (searchForm && window.location.href.includes('/search')) {
                        searchForm.submit();
                    }
                }
            }

            hideCustomSiteSearch();
        });
    }

    function showCustomSiteSearch() {
        document.getElementById('custom-site-search-overlay').style.display = 'block';
        document.getElementById('custom-site-search-dialog').style.display = 'block';
        document.getElementById('site-input').focus();
    }

    function hideCustomSiteSearch() {
        document.getElementById('custom-site-search-overlay').style.display = 'none';
        document.getElementById('custom-site-search-dialog').style.display = 'none';
    }

    // Add keyboard shortcut help info
    function addKeyboardShortcutsInfo() {
        const infoHTML = `
            <div class="keyboard-shortcuts-info">
                <h4>Search Shortcuts</h4>
                <ul>
                    <li><kbd>Alt</kbd> + <kbd>i</kbd> - Images</li>
                    <li><kbd>Alt</kbd> + <kbd>v</kbd> - Videos</li>
                    <li><kbd>Alt</kbd> + <kbd>n</kbd> - News</li>
                    <li><kbd>Alt</kbd> + <kbd>a</kbd> - All</li>
                    <li><kbd>Alt</kbd> + <kbd>s</kbd> - Site search</li>
                </ul>
            </div>
        `;

        const infoEl = document.createElement('div');
        infoEl.innerHTML = infoHTML;
        document.body.appendChild(infoEl);

        // Hide after 10 seconds
        setTimeout(() => {
            const info = document.querySelector('.keyboard-shortcuts-info');
            if (info) {
                info.style.opacity = '0';
                setTimeout(() => info.remove(), 300);
            }
        }, 10000);
    }

    // Handle keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Only trigger if Alt is pressed
            if (!e.altKey) return;

            switch(e.key.toLowerCase()) {
                case 'i': // Images
                    navigateTo('/search?tbm=isch');
                    break;
                case 'v': // Videos
                    navigateTo('/search?tbm=vid');
                    break;
                case 'n': // News
                    navigateTo('/search?tbm=nws');
                    break;
                case 'a': // All results
                    navigateTo('/search');
                    break;
                case 's': // Site search
                    if (config.customSiteSearch) {
                        e.preventDefault();
                        showCustomSiteSearch();
                    }
                    break;
            }
        });
    }

    // Navigate to a specific Google search type
    function navigateTo(path) {
        const searchInput = document.querySelector('input[name="q"]') || document.querySelector('textarea[name="q"]');
        if (!searchInput) return;

        const query = encodeURIComponent(searchInput.value);
        if (!query) return;

        const url = `https://www.google.com${path}&q=${query}`;
        window.location.href = url;
    }

    // Remove sponsored results
    function removeSponsoredResults() {
        // Find sponsored results and hide them
        const sponsoredObserver = new MutationObserver(function() {
            // Look for various indicators of sponsored results
            const sponsoredElements = [
                ...document.querySelectorAll('[data-text-ad]'),
                ...document.querySelectorAll('span:contains("Sponsored")').closest('div[data-sokoban-container]'),
                ...document.querySelectorAll('div[data-qa-ad]'),
                ...document.querySelectorAll('div.commercial-unit'),
                ...document.querySelectorAll('div.ads-ad'),
                ...document.querySelectorAll('div.pla-unit')
            ];

            sponsoredElements.forEach(elem => {
                if (elem && elem.style) {
                    elem.style.display = 'none';
                }
            });
        });

        sponsoredObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Add quick search filters
    function addQuickFilters() {
        // Wait for search box to load
        const interval = setInterval(() => {
            const searchForm = document.querySelector('form');
            if (!searchForm) return;

            clearInterval(interval);

            // Check if we're on a search results page
            if (!window.location.href.includes('/search')) return;

            // Create filter container
            const filtersContainer = document.createElement('div');
            filtersContainer.className = 'custom-filters';
            filtersContainer.innerHTML = `
                <span>Quick Filters:</span>
                <button class="custom-filter-btn" data-time="24h">24 Hours</button>
                <button class="custom-filter-btn" data-time="week">Past Week</button>
                <button class="custom-filter-btn" data-time="month">Past Month</button>
                <button class="custom-filter-btn" data-time="year">Past Year</button>
                <button class="custom-filter-btn site-search">Site Search</button>
            `;

            // Insert after search box
            const searchTools = document.querySelector('#appbar') || document.querySelector('#hdtb');
            if (searchTools) {
                searchTools.parentNode.insertBefore(filtersContainer, searchTools.nextSibling);
            }

            // Add event listeners to filter buttons
            filtersContainer.querySelectorAll('.custom-filter-btn[data-time]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const timeFilter = this.getAttribute('data-time');
                    let targetUrl = new URL(window.location.href);

                    // Remove any existing time parameters
                    targetUrl.searchParams.delete('tbs');

                    // Set new time parameter
                    switch(timeFilter) {
                        case '24h':
                            targetUrl.searchParams.set('tbs', 'qdr:d');
                            break;
                        case 'week':
                            targetUrl.searchParams.set('tbs', 'qdr:w');
                            break;
                        case 'month':
                            targetUrl.searchParams.set('tbs', 'qdr:m');
                            break;
                        case 'year':
                            targetUrl.searchParams.set('tbs', 'qdr:y');
                            break;
                    }

                    window.location.href = targetUrl.toString();
                });
            });

            // Add event listener for site search button
            const siteSearchBtn = filtersContainer.querySelector('.site-search');
            if (siteSearchBtn) {
                siteSearchBtn.addEventListener('click', showCustomSiteSearch);
            }

            // Highlight active filter
            const currentUrl = new URL(window.location.href);
            const currentFilter = currentUrl.searchParams.get('tbs');

            if (currentFilter) {
                let activeBtn = null;

                if (currentFilter === 'qdr:d') activeBtn = filtersContainer.querySelector('[data-time="24h"]');
                else if (currentFilter === 'qdr:w') activeBtn = filtersContainer.querySelector('[data-time="week"]');
                else if (currentFilter === 'qdr:m') activeBtn = filtersContainer.querySelector('[data-time="month"]');
                else if (currentFilter === 'qdr:y') activeBtn = filtersContainer.querySelector('[data-time="year"]');

                if (activeBtn) activeBtn.classList.add('active');
            }
        }, 500);
    }

    // Highlight keywords in search results
    function highlightKeywords() {
        // Get the current search query
        const searchInput = document.querySelector('input[name="q"]') || document.querySelector('textarea[name="q"]');
        if (!searchInput) return;

        const searchQuery = searchInput.value.toLowerCase();
        const terms = searchQuery.split(' ');

        // Check if any configured keywords are in the search
        const keywordsToHighlight = {};

        for (const keyword in config.highlightKeywords) {
            if (terms.includes(keyword.toLowerCase())) {
                keywordsToHighlight[keyword.toLowerCase()] = config.highlightKeywords[keyword];
            }
        }

        if (Object.keys(keywordsToHighlight).length === 0) return;

        // Create a function to highlight text in an element
        function highlightText(element) {
            if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

            // Skip elements that shouldn't be modified
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'].includes(element.tagName)) {
                return;
            }

            // Process child nodes
            Array.from(element.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    let text = node.textContent;
                    let highlighted = false;

                    // Check for each keyword
                    for (const keyword in keywordsToHighlight) {
                        const color = keywordsToHighlight[keyword];
                        const regex = new RegExp(`(${keyword})`, 'gi');

                        if (regex.test(text)) {
                            highlighted = true;
                            text = text.replace(regex, `<span style="background-color: ${color}; padding: 0 2px; border-radius: 2px;">$1</span>`);
                        }
                    }

                    if (highlighted) {
                        const span = document.createElement('span');
                        span.innerHTML = text;
                        element.replaceChild(span, node);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    highlightText(node);
                }
            });
        }

        // Apply highlighting to search results
        function applyHighlighting() {
            const resultElements = document.querySelectorAll('#search .g, #rso .g, #res .g');
            resultElements.forEach(highlightText);
        }

        // Initial application
        setTimeout(applyHighlighting, 1000);

        // Setup observer for dynamic content
        const resultsObserver = new MutationObserver(function(mutations) {
            let shouldHighlight = false;

            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    shouldHighlight = true;
                }
            });

            if (shouldHighlight) {
                applyHighlighting();
            }
        });

        // Start observing once results container exists
        setTimeout(() => {
            const resultsContainer = document.querySelector('#search, #rso, #res');
            if (resultsContainer) {
                resultsObserver.observe(resultsContainer, {
                    childList: true,
                    subtree: true
                });
            }
        }, 1000);
    }

    // Implement infinite scroll
    function setupInfiniteScroll() {
        let loadingMore = false;
        let noMoreResults = false;

        // Create observer for scroll position
        const scrollObserver = new IntersectionObserver((entries) => {
            // If not on search page, do nothing
            if (!window.location.href.includes('/search')) return;

            // If already loading or no more results, do nothing
            if (loadingMore || noMoreResults) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadNextPage();
                }
            });
        }, { rootMargin: '300px' });

        // Add a sentinel element at the bottom of results
        function addScrollSentinel() {
            // Remove existing sentinel if any
            const existingSentinel = document.getElementById('infinite-scroll-sentinel');
            if (existingSentinel) existingSentinel.remove();

            // Create new sentinel
            const sentinel = document.createElement('div');
            sentinel.id = 'infinite-scroll-sentinel';
            sentinel.style.height = '10px';

            // Find the "Next" button
            const nextButton = document.querySelector('#pnnext, .pn');
            if (nextButton) {
                nextButton.parentNode.insertBefore(sentinel, nextButton);
                scrollObserver.observe(sentinel);
            } else {
                noMoreResults = true;
            }
        }

        // Load next page of results
        function loadNextPage() {
            // Find the "Next" button and get its href
            const nextButton = document.querySelector('#pnnext, .pn');
            if (!nextButton || !nextButton.href) {
                noMoreResults = true;
                return;
            }

            loadingMore = true;

            // Fetch next page
            fetch(nextButton.href)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Get search results from the fetched page
                    const newResults = doc.querySelectorAll('#search .g, #rso .g, #res .g');
                    if (newResults.length === 0) {
                        noMoreResults = true;
                        return;
                    }

                    // Get our results container
                    const resultsContainer = document.querySelector('#search, #rso, #res');
                    if (!resultsContainer) return;

                    // Append new results
                    newResults.forEach(result => {
                        resultsContainer.appendChild(document.importNode(result, true));
                    });

                    // Update the "Next" button to point to the next page
                    const newNextButton = doc.querySelector('#pnnext, .pn');
                    if (newNextButton && newNextButton.href) {
                        nextButton.href = newNextButton.href;
                    } else {
                        // No more pages
                        nextButton.remove();
                        noMoreResults = true;
                    }

                    // Highlight keywords in new results if needed
                    if (Object.keys(config.highlightKeywords).length > 0) {
                        highlightKeywords();
                    }

                    // Add new sentinel for next page
                    addScrollSentinel();

                    loadingMore = false;
                })
                .catch(error => {
                    console.error('Error loading more results:', error);
                    loadingMore = false;
                });
        }

        // Setup infinite scroll when page is loaded
        setTimeout(addScrollSentinel, 2000);

        // Re-apply when URL changes
        let lastUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                loadingMore = false;
                noMoreResults = false;

                setTimeout(addScrollSentinel, 2000);
            }
        }, 1000);
    }

    // Initialize features when page is ready
    onReady(function() {
        if (config.customSiteSearch) {
            createSiteSearchDialog();
        }

        if (config.removeSponsored) {
            removeSponsoredResults();
        }

        if (config.quickFilters) {
            addQuickFilters();
        }

        // Highlight keywords in search results
        highlightKeywords();

        if (config.infiniteScroll) {
            setupInfiniteScroll();
        }

        if (config.keyboardShortcuts) {
            setupKeyboardShortcuts();
            addKeyboardShortcutsInfo();
        }
    });
})();