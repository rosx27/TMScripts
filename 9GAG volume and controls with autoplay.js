// ==UserScript==
// @name 9gag volume and controls with autoplay
// @namespace https://github.com/rosx27/TMScripts
// @match https://9gag.com/*
// @run-at document-end
// @grant none
// @version 1.3.0
// @description Adds the controls to the videos ("gifs") and sets the default volume to a value specified on "v.volume" where, 1=100% 0=0%, default is 0.1 (10%). Additionally, autoplays videos with enabled audio when the entire video is visible. This is a fork of the userscripts: "https://greasyfork.org/en/scripts/382093" by Artain and "pl.srsbiz"
// @author Ross
// ==/UserScript==

(function() {
    'use strict';

    function changeVid(mutationsList, observer) {
        var vids = document.querySelectorAll("video:not(.alreadyChanged)");
        vids.forEach((v) => {
            v.volume = 0.1; // CHANGE ME!
            v.classList.add("alreadyChanged");
            v.setAttribute("controls", "true");
            v.removeAttribute("autoplay");
            v.removeAttribute("muted"); // Remove muted attribute if it's set

            var soundToggle = document.createElement('button');
            soundToggle.className = 'sound-toggle';
            soundToggle.textContent = 'Disable Sound';
            soundToggle.onclick = function() {
                v.muted = !v.muted;
                this.textContent = v.muted ? 'Enable Sound' : 'Disable Sound';
            };
            v.after(soundToggle);

            var soundToggleStatus = document.createElement('div');
            soundToggleStatus.className = 'sound-toggle off'; // Initial state is off
            soundToggle.after(soundToggleStatus);

            // Intersection Observer to check visibility
            let observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio === 1) {
                        v.muted = false; // Ensure sound is enabled
                        v.play();
                    } else {
                        v.pause();
                    }
                });
            }, { threshold: 1.0 });

            observer.observe(v);
        });
    }

    window.onload = function(event) {
        start(0);
    };

    function start(iteration) {
        setTimeout(function() {
            var list = document.getElementById("list-view-2"),
                observer;
            if (typeof list !== "undefined" && list != null) {
                changeVid(false, false);
                observer = new MutationObserver(changeVid);
                observer.observe(list, { subtree: true, childList: true });
            } else {
                list = document.getElementById("individual-post");
                if (typeof list !== "undefined" && list != null) {
                    changeVid(false, false);
                    observer = new MutationObserver(changeVid);
                    observer.observe(list, { subtree: true, childList: true });
                } else {
                    if (iteration < 20) {
                        start(iteration++);
                    } else {
                        console.log("Error " + list + " is null or undefined");
                    }
                }
            }
        }, 200);
    }
})();
