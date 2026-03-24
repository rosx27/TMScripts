// ==UserScript==
// @name 9GAG - Filter Posts by User Age and Vote Ratio
// @namespace https://github.com/rosx27/TMScripts/blob/main/9GAG%20-%20Filter%20Posts%20by%20User%20Age%20and%20Vote%20Ratio.js
// @version 1.1
// @description Hide 9GAG posts from users registered less than X days or with low like/dislike ratio (< 75%)
// @author Ross
// @match https://9gag.com/*
// @run-at document-start
// @grant none
// ==/UserScript==

(function () {
  "use strict";

  const MIN_ACCOUNT_AGE_DAYS = 1000;
  const MIN_VOTE_RATIO = 0.75; // 75% likes
  const MIN_UPVOTES = 300;

  const posts = {};
  const prof = {};

  const JP = JSON.parse;
  JSON.parse = function () {
    const r = JP(...arguments);

    // Extract posts and their metadata
    if (r && r.data && r.data.posts) {
      console.log('FILTER: JSON.parse intercepted data with posts:', r.data.posts.length);
      for (let v, k = 0; v = r.data.posts[k]; k++) {
        const creator = v.creator;
        const creationTs = creator.creationTs || creator.timestamp || (creator.userId && creator.userId.substr(2, 10));
        const ageDays = Math.floor((Date.now() / 1000 - creationTs) / 60 / 60 / 24);
        const up = v.upVoteCount || 0;
        const down = v.downVoteCount || 0;

        posts[v.id] = {
          id: v.id,
          ageDays,
          upVotes: up,
          downVotes: down,
        };
        console.log(`   FILTER: Post ID: ${v.id}, Age: ${ageDays}, Up: ${up}, Down: ${down}`);
      }
    }

    return r;
  };

  const observer = new MutationObserver(() => {
    const articles = document.querySelectorAll('article:not([data-checked])');
    console.log(`FILTER: MutationObserver: Found ${articles.length} new articles to check.`);
    for (const article of articles) {
      article.setAttribute('data-checked', 'true');

      const id = article.id?.split('-').pop();
      if (!id || !posts[id]) {
          console.log('   FILTER: Article without valid ID found:', article);
          continue;
      }

      const { ageDays, upVotes, downVotes } = posts[id];
      const totalVotes = upVotes + downVotes;
      const voteRatio = totalVotes > 0 ? upVotes / totalVotes : 1; // Default to 1 if no votes
      console.log(`   FILTER: Checking Post ID: ${id}, Age: ${ageDays} (Min: ${MIN_ACCOUNT_AGE_DAYS}), Ratio: ${voteRatio.toFixed(2)} (Min: ${MIN_VOTE_RATIO}), Total Votes: ${totalVotes} (Min: ${MIN_UPVOTES})`);

      if (ageDays < MIN_ACCOUNT_AGE_DAYS || voteRatio < MIN_VOTE_RATIO || totalVotes < MIN_UPVOTES) {
          console.log(`   FILTER: Hiding Post ID: ${id} - Matched filter criteria.`);
          // article.remove();
          article.style.cssText = 'height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; opacity: 0 !important; pointer-events: none !important;';
      } else {
          console.log(`   FILTER: Keeping Post ID: ${id} - Did NOT match filter criteria.`);}
    }
  });

  function init() {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState !== 'loading') init();
  else {
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
  }
})();
