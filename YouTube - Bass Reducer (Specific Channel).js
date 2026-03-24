// ==UserScript==
// @name YouTube - Bass Reducer (Specific Channel)
// @namespace https://github.com/rosx27/TMScripts/blob/main/YouTube%20Bass%20Reducer%20(Specific%20Channel).js
// @version 2.0
// @description Reduce bass for a specific YouTube channel with full audio chain
// @author Ross
// @match https://www.youtube.com/*
// @grant none
// ==/UserScript==

(function() {
    'use strict';

    // --- Channel configurations ---
    // Each channel can have its own tuned settings, or omit fields to use defaults
    const CHANNEL_CONFIGS = {
        "WarFronts": {
            bassFreq:      150,
            bassGainDb:    -18,
            subFreq:       60,
            subGainDb:     -12,
            compThreshold: -18,
            compRatio:     3,
            compKnee:      6,
            compAttack:    0.003,
            compRelease:   0.25,
            makeupGain:    1.8,
        },
        "Megaprojects": {
            bassFreq:      150,
            bassGainDb:    -18,
            subFreq:       60,
            subGainDb:     -12,
            compThreshold: -18,
            compRatio:     3,
            compKnee:      6,
            compAttack:    0.003,
            compRelease:   0.25,
            makeupGain:    1.8,
        },
        // Add more channels here...
    };

    // --- Default fallback values (used for any missing per-channel fields) ---
    const DEFAULTS = {
        bassFreq:      150,
        bassGainDb:    -18,
        subFreq:       60,
        subGainDb:     -12,
        compThreshold: -18,
        compRatio:     3,
        compKnee:      6,
        compAttack:    0.003,
        compRelease:   0.25,
        makeupGain:    1.8,
    };

    function getConfig(channelName) {
        const overrides = CHANNEL_CONFIGS[channelName] || {};
        return { ...DEFAULTS, ...overrides };
    }

    function applyBassReduction() {
        const channelElement = document.querySelector("#channel-name a");
        if (!channelElement) return;

        const currentChannel = channelElement.textContent.trim();
        if (!(currentChannel in CHANNEL_CONFIGS)) return;

        const video = document.querySelector("video");
        if (!video || video._bassModified) return;

        video._bassModified = true;

        const cfg = getConfig(currentChannel);
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);

        // 1. High-pass — strip truly subsonic content
        const highPass = audioContext.createBiquadFilter();
        highPass.type = "highpass";
        highPass.frequency.value = 30;
        highPass.Q.value = 0.7;

        // 2. Sub-bass peaking notch
        const subNotch = audioContext.createBiquadFilter();
        subNotch.type = "peaking";
        subNotch.frequency.value = cfg.subFreq;
        subNotch.Q.value = 1.2;
        subNotch.gain.value = cfg.subGainDb;

        // 3. Low shelf — broad bass reduction
        const lowShelf = audioContext.createBiquadFilter();
        lowShelf.type = "lowshelf";
        lowShelf.frequency.value = cfg.bassFreq;
        lowShelf.gain.value = cfg.bassGainDb;

        // 4. Compressor — rebalances mids/highs after bass removal
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = cfg.compThreshold;
        compressor.ratio.value     = cfg.compRatio;
        compressor.knee.value      = cfg.compKnee;
        compressor.attack.value    = cfg.compAttack;
        compressor.release.value   = cfg.compRelease;

        // 5. Makeup gain — restore perceived loudness
        const gainNode = audioContext.createGain();
        gainNode.gain.value = cfg.makeupGain;

        // Chain: source → highpass → subNotch → lowShelf → compressor → gain → out
        source
            .connect(highPass)
            .connect(subNotch)
            .connect(lowShelf)
            .connect(compressor)
            .connect(gainNode)
            .connect(audioContext.destination);

        console.log(`[BassReducer] Applied for: ${currentChannel}`, cfg);
    }

    const observer = new MutationObserver(applyBassReduction);
    observer.observe(document.body, { childList: true, subtree: true });

})();