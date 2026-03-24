// ==UserScript==
// @name YouTube - Subscription Feed Filter
// @namespace https://github.com/rosx27/TMScripts/blob/main/YouTube%20Subscription%20Feed%20Filter.js
// @version 0.3
// @description Filters out videos from specified YouTube channels on the subscriptions feed, showing only the first 3 per channel.
// @author Ross
// @match https://www.youtube.com/feed/subscriptions
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    // Define the channel names and parts of their URLs to filter.
    // Add more channels to these arrays as needed.
    const CHANNELS_TO_FILTER = ['IGN', 'Another Channel Name']; // Add other channel names here
    const CHANNEL_URL_PARTS_TO_FILTER = ['/@IGN', '/@AnotherChannelHandle']; // Add corresponding URL parts here (e.g., /@ChannelHandle)
    const MAX_VIDEOS_TO_SHOW_PER_CHANNEL = 3; // The maximum number of videos to display for each filtered channel

    // Use a Map to keep track of how many videos from each filtered channel have been displayed so far.
    // This counter will persist across calls to filterVideos within the same page load.
    const channelVideosDisplayedCount = new Map();
    CHANNELS_TO_FILTER.forEach(channel => channelVideosDisplayedCount.set(channel, 0));

    // Use a Set to store references to video elements that have already been processed
    // to avoid re-processing them and incorrectly incrementing the counter or hiding them again.
    const processedVideos = new Set();

    /**
     * Hides video elements that belong to the specified channels,
     * but only after the MAX_VIDEOS_TO_SHOW_PER_CHANNEL limit has been reached for that specific channel.
     * This function iterates through all detected video elements and checks their channel.
     */
    function filterVideos() {
        // Select all potential video item containers in the subscriptions feed.
        const videoElements = document.querySelectorAll(
            'ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-video-renderer, ytd-rich-grid-media'
        );

        videoElements.forEach(video => {
            // If this video element has already been processed, skip it.
            if (processedVideos.has(video)) {
                return;
            }

            let matchingChannel = null; // Stores the name of the channel if it matches one of the filtered ones

            // Attempt to find the channel name element within the video card.
            const channelNameElement = video.querySelector(
                'ytd-channel-name a, #channel-name yt-formatted-string, #byline-container a, #text-container #byline'
            );

            if (channelNameElement) {
                const channelText = channelNameElement.textContent.trim();
                const channelLink = channelNameElement.href;

                // Check against all channels in the filter list
                for (let i = 0; i < CHANNELS_TO_FILTER.length; i++) {
                    const filterName = CHANNELS_TO_FILTER[i];
                    const filterUrlPart = CHANNEL_URL_PARTS_TO_FILTER[i];

                    if (channelText === filterName || (channelLink && channelLink.includes(filterUrlPart))) {
                        matchingChannel = filterName;
                        break; // Found a match, no need to check further
                    }
                }
            }

            // If the video is identified as being from one of the filtered channels...
            if (matchingChannel) {
                let currentCount = channelVideosDisplayedCount.get(matchingChannel) || 0;

                // Check if we have already displayed the maximum allowed videos for this specific channel.
                if (currentCount < MAX_VIDEOS_TO_SHOW_PER_CHANNEL) {
                    // If not, increment the counter and allow this video to be displayed.
                    channelVideosDisplayedCount.set(matchingChannel, currentCount + 1);
                } else {
                    // If the limit is reached or exceeded for this channel, hide this video.
                    const videoCard = video.closest(
                        'ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-video-renderer, ytd-rich-grid-media'
                    );
                    if (videoCard) {
                        videoCard.style.display = 'none'; // Hide the element
                    }
                }
            }
            // Add the video to the set of processed videos, regardless of whether it was hidden or not.
            processedVideos.add(video);
        });
    }

    // --- Initial Load and Dynamic Content Handling ---

    // 1. Run the filter immediately when the page finishes loading.
    window.addEventListener('load', filterVideos);

    // 2. Use a MutationObserver to watch for new content being added to the DOM.
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                filterVideos();
            }
        });
    });

    // Determine the target node for the MutationObserver.
    const targetNode = document.querySelector('#contents.ytd-rich-grid-renderer, #primary #contents, #page-manager');

    if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
    } else {
        console.warn('YouTube Subscription Filter: Could not find specific target node for MutationObserver. Observing document body as fallback.');
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 3. Set a periodic interval to run the filter as a fallback.
    setInterval(filterVideos, 2000); // Run every 2 seconds
})();
