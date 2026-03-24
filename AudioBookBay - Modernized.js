// ==UserScript==
// @name AudioBookBay - Modernized
// @namespace https://github.com/rosx27/TMScripts/blob/main/AudioBook%20Bay%20-%20Modernized.js
// @version 2.0.0
// @description  A complete visual overhaul of AudioBook Bay with a dark, editorial aesthetic
// @author Ross
// @match https://audiobookbay.lu/*
// @match https://audiobookbay.is/*
// @match https://audiobookbay.se/*
// @grant GM_addStyle
// @run-at document-end
// ==/UserScript==

(function () {
  'use strict';

  /* ============================================================
     INJECT GOOGLE FONTS
  ============================================================ */
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap';
  document.head.appendChild(fontLink);

  /* ============================================================
     GLOBAL STYLES
  ============================================================ */
  GM_addStyle(`
    :root {
      --bg:      #0d0f14;
      --bg2:     #13161e;
      --bg3:     #1a1e28;
      --surface: #1f2433;
      --border:  #2a2f40;
      --accent:  #7a599e;
      --accent2: #9b7ec8;
      --muted:   #666b7a;
      --text:    #e8e6e0;
      --sans:    'DM Sans', sans-serif;
      --serif:   'Playfair Display', Georgia, serif;
      --mono:    'DM Mono', monospace;
      --radius:  10px;
      --shadow:  0 4px 24px rgba(0,0,0,.5);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    body {
      background: var(--bg) !important;
      color: var(--text) !important;
      font-family: var(--sans) !important;
      font-size: 15px !important;
      line-height: 1.6 !important;
      min-height: 100vh;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--muted); }

    /* ── LAYOUT ─────────────────────────────────── */
    #wrap {
      max-width: 1400px !important;
      margin: 0 auto !important;
      padding: 0 20px !important;
      display: grid !important;
      grid-template-areas:
        "header header header"
        "lsidebar content rsidebar"
        "footer footer footer" !important;
      grid-template-columns: 220px 1fr 230px !important;
      grid-template-rows: auto 1fr auto !important;
      gap: 0 28px !important;
    }

    /* ── HEADER ─────────────────────────────────── */
    #header {
      grid-area: header !important;
      display: grid !important;
      grid-template-columns: 1fr auto auto !important;
      align-items: center !important;
      gap: 16px !important;
      padding: 22px 0 18px !important;
      border-bottom: 1px solid var(--border) !important;
      margin-bottom: 32px !important;
      background: none !important;
    }
    .topLogo { display: flex !important; align-items: baseline !important; gap: 14px !important; }
    .topLogo h3 {
      font-family: var(--serif) !important;
      font-size: 26px !important; font-weight: 700 !important;
      letter-spacing: -.5px !important; color: var(--text) !important; white-space: nowrap !important;
    }
    .topLogo h3 a { color: inherit !important; text-decoration: none !important; }
    .topLogo h3 .abb { color: var(--accent) !important; font-style: italic !important; font-size: 18px !important; }
    .blogDescription, .topButton { display: none !important; }

    /* ── NAV ─────────────────────────────────────── */
    .topMenu { display: flex !important; align-items: center !important; }
    .topMenu ul { display: flex !important; list-style: none !important; gap: 4px !important; }
    .topMenu a {
      display: block !important; padding: 7px 14px !important; border-radius: 6px !important;
      color: var(--muted) !important; text-decoration: none !important;
      font-size: 13px !important; font-weight: 500 !important;
      transition: color .2s, background .2s !important;
    }
    .topMenu a:hover { color: var(--text) !important; background: var(--surface) !important; }

    /* ── SEARCH ──────────────────────────────────── */
    .topSearch { display: flex !important; align-items: center !important; }
    #searchform {
      display: flex !important; align-items: center !important;
      background: var(--surface) !important; border: 1px solid var(--border) !important;
      border-radius: 8px !important; padding: 0 4px 0 14px !important;
      gap: 6px !important; transition: border-color .2s !important;
    }
    #searchform:focus-within { border-color: var(--accent) !important; }
    #searchform .s {
      background: none !important; border: none !important; outline: none !important;
      color: var(--text) !important; font-family: var(--sans) !important;
      font-size: 14px !important; width: 200px !important; padding: 8px 0 !important;
    }
    #searchform .s::placeholder { color: var(--muted) !important; }
    .searchSubmit {
      display: flex !important; align-items: center !important; justify-content: center !important;
      width: 32px !important; height: 32px !important;
      background: var(--accent) !important; border-radius: 6px !important; cursor: pointer !important;
    }
    .searchSubmit img { display: none !important; }
    .searchSubmit::after { content: '⌕' !important; font-size: 18px !important; color: var(--bg) !important; line-height: 1 !important; }
    #advanced-search-link {
      font-size: 12px !important; color: var(--muted) !important; text-decoration: none !important;
      white-space: nowrap !important; padding: 0 8px !important; transition: color .2s !important;
    }
    #advanced-search-link:hover { color: var(--accent) !important; }

    /* ── CONTENT ─────────────────────────────────── */
    #content { grid-area: content !important; min-width: 0 !important; }

    /* Hide original .post markup — we replace with .abb-card */
    .post { display: none !important; }

    /* ── BOOK CARDS ──────────────────────────────── */
    .abb-card {
      display: flex !important;
      gap: 18px !important;
      background: var(--bg2) !important;
      border: 1px solid var(--border) !important;
      border-radius: var(--radius) !important;
      padding: 16px !important;
      margin-bottom: 14px !important;
      position: relative !important;
      transition: border-color .25s, box-shadow .25s, transform .2s !important;
      animation: abb-in .35s ease both !important;
    }
    .abb-card::before {
      content: '' !important; position: absolute !important; inset: 0 !important;
      background: linear-gradient(135deg, rgba(122,89,158,.06) 0%, transparent 60%) !important;
      border-radius: var(--radius) !important; pointer-events: none !important;
    }
    .abb-card:hover {
      border-color: #734f9a !important;
      box-shadow: var(--shadow) !important; transform: translateY(-2px) !important;
    }

    /* Cover */
    .abb-cover { flex: 0 0 90px !important; width: 90px !important; }
    .abb-cover img {
      width: 90px !important; height: 122px !important;
      object-fit: cover !important; border-radius: 6px !important;
      display: block !important; box-shadow: 0 6px 20px rgba(0,0,0,.6) !important;
    }
    .abb-cover-placeholder {
      width: 90px !important; height: 122px !important;
      background: var(--surface) !important; border-radius: 6px !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
      font-size: 28px !important; color: var(--muted) !important;
    }

    /* Body */
    .abb-body {
      flex: 1 1 0 !important; min-width: 0 !important;
      display: flex !important; flex-direction: column !important; gap: 8px !important;
    }

    /* Title — no truncation */
    .abb-title {
      font-family: var(--serif) !important;
      font-size: 16px !important; font-weight: 700 !important; line-height: 1.4 !important;
      white-space: normal !important; overflow: visible !important; text-overflow: unset !important;
    }
    .abb-title a { color: var(--text) !important; text-decoration: none !important; transition: color .2s !important; }
    .abb-title a:hover { color: var(--accent) !important; }

    /* Tags */
    .abb-tags { display: flex !important; flex-wrap: wrap !important; gap: 5px !important; }
    .abb-tag {
      display: inline-block !important;
      font-size: 10px !important; font-weight: 600 !important;
      letter-spacing: .5px !important; text-transform: uppercase !important;
      padding: 2px 8px !important; border-radius: 4px !important;
      background: var(--surface) !important; color: var(--muted) !important;
      border: 1px solid var(--border) !important; text-decoration: none !important;
      transition: color .15s, border-color .15s !important;
    }
    .abb-tag:hover { color: var(--text) !important; border-color: var(--muted) !important; }
    .abb-tag-lang { color: var(--accent2) !important; border-color: rgba(155,126,200,.25) !important; }

    /* Meta */
    .abb-meta {
      font-family: var(--mono) !important; font-size: 11px !important;
      color: var(--muted) !important; display: flex !important;
      flex-wrap: wrap !important; gap: 8px !important; align-items: center !important;
    }
    .abb-meta-val {
      color: var(--accent) !important;
      background: rgba(122,89,158,.12) !important;
      border: 1px solid rgba(122,89,158,.25) !important;
      border-radius: 4px !important; padding: 1px 7px !important;
    }
    .abb-meta-size { color: var(--accent2) !important; }

    .abb-spacer { flex: 1 !important; }

    /* Buttons */
    .abb-actions { display: flex !important; gap: 8px !important; flex-wrap: wrap !important; }
    .abb-btn {
      display: inline-flex !important; align-items: center !important; gap: 5px !important;
      padding: 6px 14px !important; border-radius: 6px !important;
      font-size: 12px !important; font-weight: 600 !important; letter-spacing: .3px !important;
      text-decoration: none !important; transition: all .2s !important; cursor: pointer !important;
    }
    .abb-btn-outline {
      background: var(--surface) !important; color: var(--text) !important; border: 1px solid var(--border) !important;
    }
    .abb-btn-outline:hover { background: var(--bg3) !important; border-color: var(--muted) !important; }
    .abb-btn-primary {
      background: var(--accent) !important; color: var(--bg) !important; border: 1px solid transparent !important;
    }
    .abb-btn-primary:hover { background: #8f6db5 !important; transform: translateY(-1px) !important; }

    /* ── SECTION HEADER ──────────────────────────── */
    .abb-section-header {
      display: flex !important; align-items: baseline !important;
      justify-content: space-between !important; margin-bottom: 20px !important;
      padding-bottom: 14px !important; border-bottom: 1px solid var(--border) !important;
    }
    .abb-section-title { font-family: var(--serif) !important; font-size: 22px !important; font-weight: 900 !important; color: var(--text) !important; }
    .abb-section-sub { font-size: 12px !important; color: var(--muted) !important; font-family: var(--mono) !important; }

    /* ── PAGINATION ───────────────────────────────── */
    .navigation { margin: 24px 0 !important; }
    .wp-pagenavi {
      display: flex !important; justify-content: center !important;
      align-items: center !important; gap: 6px !important; flex-wrap: wrap !important;
    }
    .wp-pagenavi .pages { display: none !important; }
    .wp-pagenavi a, .wp-pagenavi .current {
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      min-width: 36px !important; height: 36px !important; padding: 0 10px !important;
      border-radius: 7px !important; font-size: 13px !important; font-weight: 600 !important;
      text-decoration: none !important; transition: all .2s !important;
    }
    .wp-pagenavi a { background: var(--surface) !important; color: var(--muted) !important; border: 1px solid var(--border) !important; }
    .wp-pagenavi a:hover { background: var(--bg3) !important; color: var(--text) !important; border-color: var(--muted) !important; }
    .wp-pagenavi .current { background: var(--accent) !important; color: var(--bg) !important; border: 1px solid var(--accent) !important; }

    /* ── LEFT SIDEBAR ────────────────────────────── */
    #lsidebar {
      grid-area: lsidebar !important;
      position: sticky !important; top: 20px !important; align-self: start !important;
      max-height: calc(100vh - 40px) !important; overflow-y: auto !important;
    }
    #lsidebar::-webkit-scrollbar { width: 3px; }
    #lsidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    #lsidebar > ul { list-style: none !important; display: flex !important; flex-direction: column !important; gap: 6px !important; }
    .leftPicCustomWrap { display: none !important; }
    .leftCat { list-style: none !important; }

    /* Collapsible wrapper */
    .abb-sidebar-section {
      background: var(--bg2) !important;
      border: 1px solid var(--border) !important;
      border-radius: var(--radius) !important;
      overflow: hidden !important;
    }
    .abb-sidebar-toggle {
      display: flex !important; align-items: center !important; justify-content: space-between !important;
      width: 100% !important; padding: 11px 14px !important;
      background: none !important; border: none !important;
      border-bottom: 1px solid var(--border) !important;
      cursor: pointer !important; font-family: var(--sans) !important;
      font-size: 11px !important; font-weight: 700 !important;
      letter-spacing: 1.2px !important; text-transform: uppercase !important;
      color: var(--muted) !important; transition: color .15s, background .15s !important;
    }
    .abb-sidebar-toggle:hover { color: var(--text) !important; background: var(--surface) !important; }
    .abb-chevron {
      font-size: 10px !important; line-height: 1 !important;
      transition: transform .25s !important; display: inline-block !important;
    }
    .abb-sidebar-toggle.is-collapsed .abb-chevron { transform: rotate(-90deg) !important; }

    .abb-sidebar-body {
      overflow: hidden !important;
      max-height: 2000px !important;
      transition: max-height .35s ease !important;
    }
    .abb-sidebar-body.is-collapsed { max-height: 0 !important; }

    /* Links inside sidebar */
    .leftCat ul { list-style: none !important; padding: 8px !important; display: flex !important; flex-wrap: wrap !important; gap: 3px !important; }
    .leftCat li { list-style: none !important; }
    .leftCat a {
      display: block !important; padding: 4px 10px !important; border-radius: 5px !important;
      color: var(--muted) !important; text-decoration: none !important; font-size: 12.5px !important;
      transition: color .15s, background .15s !important; white-space: nowrap !important;
    }
    .leftCat a:hover { color: var(--text) !important; background: var(--surface) !important; }

    /* Hot Search — pill cloud */
    .abb-hot-search ul { display: flex !important; flex-wrap: wrap !important; gap: 4px !important; padding: 10px !important; }
    .abb-hot-search a {
      display: inline-block !important;
      font-size: 10.5px !important; font-weight: 600 !important;
      padding: 3px 9px !important; border-radius: 20px !important;
      background: var(--surface) !important; color: var(--muted) !important;
      border: 1px solid var(--border) !important; text-decoration: none !important;
      white-space: nowrap !important; transition: color .15s, border-color .15s, background .15s !important;
    }
    .abb-hot-search a:hover {
      color: var(--accent) !important; border-color: rgba(122,89,158,.5) !important;
      background: rgba(122,89,158,.08) !important;
    }

    /* ── RIGHT SIDEBAR ───────────────────────────── */
    #rsidebar {
      grid-area: rsidebar !important;
      position: sticky !important; top: 20px !important; align-self: start !important;
      max-height: calc(100vh - 40px) !important; overflow-y: auto !important;
    }
    #rsidebar::-webkit-scrollbar { width: 3px; }
    #rsidebar::-webkit-scrollbar-thumb { background: var(--border); }
    #rsidebar > ul { list-style: none !important; display: flex !important; flex-direction: column !important; gap: 16px !important; }
    #rsidebar li { list-style: none !important; }
    #rsidebar h2 {
      font-size: 11px !important; font-weight: 700 !important; letter-spacing: 1.2px !important;
      text-transform: uppercase !important; color: var(--muted) !important; margin-bottom: 10px !important;
    }
    #rsidebar h2 a { color: inherit !important; text-decoration: none !important; }
    #rsidebar h2 a:hover { color: var(--accent) !important; }
    #rsidebar ul ul { list-style: none !important; display: flex !important; flex-direction: column !important; gap: 2px !important; }
    #rsidebar ul ul a {
      display: block !important; font-size: 12.5px !important; color: var(--muted) !important;
      text-decoration: none !important; padding: 3px 0 !important; transition: color .15s !important;
      white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
    }
    #rsidebar ul ul a:hover { color: var(--accent) !important; }

    /* Hide ads */
    #rsidebar li:has(h2.yellow),
    #rsidebar li:has(img[src*="FD.jpg"]),
    #rsidebar li:has(img[src*="BEN.jpg"]),
    div[style*="margin-bottom:15px"] { display: none !important; }

    #rsidebar img { filter: brightness(.7) !important; max-width: 120px !important; transition: filter .2s !important; }
    #rsidebar img:hover { filter: brightness(1) !important; }

    /* ── FOOTER ──────────────────────────────────── */
    #footer { grid-area: footer !important; margin-top: 40px !important; padding: 28px 0 !important; border-top: 1px solid var(--border) !important; }
    .footer { font-size: 12px !important; color: var(--muted) !important; line-height: 1.7 !important; }
    .footer p { margin-bottom: 10px !important; }
    .footer strong { color: var(--text) !important; }
    .footer a { color: var(--muted) !important; text-decoration: underline !important; text-underline-offset: 2px !important; }
    .footer a:hover { color: var(--accent) !important; }

    /* ── SCROLL TO TOP ────────────────────────────── */
    .cd-top {
      background: var(--accent) !important; color: var(--bg) !important;
      border-radius: 50% !important; width: 40px !important; height: 40px !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
      box-shadow: 0 4px 16px rgba(122,89,158,.4) !important; transition: transform .2s, box-shadow .2s !important;
    }
    .cd-top:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(122,89,158,.5) !important; }

    /* ── ANIMATION ───────────────────────────────── */
    @keyframes abb-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── RESPONSIVE ──────────────────────────────── */
    @media (max-width: 1024px) {
      #wrap {
        grid-template-columns: 200px 1fr !important;
        grid-template-areas: "header header" "lsidebar content" "footer footer" !important;
      }
      #rsidebar { display: none !important; }
    }
    @media (max-width: 680px) {
      #wrap {
        grid-template-columns: 1fr !important;
        grid-template-areas: "header" "content" "footer" !important;
        padding: 0 12px !important;
      }
      #lsidebar { display: none !important; }
      #header { grid-template-columns: 1fr !important; gap: 12px !important; }
      .topMenu ul { flex-wrap: wrap !important; }
      .abb-cover { flex: 0 0 70px !important; width: 70px !important; }
      .abb-cover img { width: 70px !important; height: 96px !important; }
    }

    /* Misc */
    .overlay, .overlay-wrap, .yahoo, veepn-lock-screen { display: none !important; }
    input::placeholder { color: var(--muted) !important; opacity: 1 !important; }
  `);


  /* ============================================================
     REBUILD BOOK CARDS
     Original .post DOM structure:
       .postTitle h2 a           ← title + link
       .postInfo                 ← "Category: X  Language: Y  Keywords: Z"
       .postContent
         .center
           p.center > a > img   ← cover image
         p (inline style)        ← "Posted: … Format: … Bitrate: … File Size: …"
       .postMeta
         .postLink a             ← details link
         .postComments a         ← download link
  ============================================================ */
  function rebuildCards() {
    document.querySelectorAll('#content .post').forEach((post, idx) => {
      const titleA    = post.querySelector('.postTitle h2 a');
      const infoEl    = post.querySelector('.postInfo');
      const coverImg  = post.querySelector('.postContent img');
      const metaP     = post.querySelector('.postContent p[style]');
      const detailsA  = post.querySelector('.postLink a');
      const downloadA = post.querySelector('.postComments a');

      if (!titleA) return;

      /* ── Cover ── */
      const coverDiv = document.createElement('div');
      coverDiv.className = 'abb-cover';

      if (coverImg && coverImg.src) {
        const img = document.createElement('img');
        img.src     = coverImg.src;
        img.alt     = coverImg.alt || '';
        img.loading = 'lazy';
        coverDiv.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'abb-cover-placeholder';
        ph.textContent = '🎧';
        coverDiv.appendChild(ph);
      }

      /* ── Body ── */
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'abb-body';

      // Title (full, no truncation)
      const titleDiv = document.createElement('div');
      titleDiv.className = 'abb-title';
      const titleLink = document.createElement('a');
      titleLink.href        = titleA.href;
      titleLink.textContent = titleA.textContent.trim();
      titleDiv.appendChild(titleLink);
      bodyDiv.appendChild(titleDiv);

      // Tags
      if (infoEl) {
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'abb-tags';

        // Language
        const rawText  = infoEl.textContent || '';
        const langMatch = rawText.match(/Language:\s*([A-Za-zÀ-ÿ ()]+?)(?:\s{2,}|Keywords|$)/);
        if (langMatch) {
          const t = document.createElement('span');
          t.className   = 'abb-tag abb-tag-lang';
          t.textContent = langMatch[1].trim();
          tagsDiv.appendChild(t);
        }

        // Category links
        infoEl.querySelectorAll('a').forEach(a => {
          const t = document.createElement('a');
          t.href        = a.href;
          t.className   = 'abb-tag';
          t.textContent = a.textContent.trim();
          tagsDiv.appendChild(t);
        });

        // Keywords (inside the margin-left span, separated by &nbsp;)
        const kwSpan = infoEl.querySelector('span[style*="margin-left"]');
        if (kwSpan) {
          kwSpan.textContent
            .replace(/Keywords?:/i, '')
            .split(/\u00a0|\s{2,}/)
            .map(k => k.trim())
            .filter(Boolean)
            .forEach(k => {
              const t = document.createElement('span');
              t.className   = 'abb-tag';
              t.style.opacity = '.65';
              t.textContent = k;
              tagsDiv.appendChild(t);
            });
        }

        if (tagsDiv.children.length) bodyDiv.appendChild(tagsDiv);
      }

      // Meta info (format / bitrate / size / date)
      if (metaP) {
        const metaDiv = document.createElement('div');
        metaDiv.className = 'abb-meta';

        const fullText = metaP.textContent || '';

        // Date
        const dateMatch = fullText.match(/Posted:\s*([\d]+ \w+ [\d]{4})/);
        if (dateMatch) {
          const s = document.createElement('span');
          s.textContent = '📅 ' + dateMatch[1];
          metaDiv.appendChild(s);
        }

        // Format & Bitrate — red spans (#a00)
        metaP.querySelectorAll('span[style*="#a00"]').forEach(sp => {
          const v = sp.textContent.trim();
          if (!v || v === '?') return;
          const s = document.createElement('span');
          s.className   = 'abb-meta-val';
          s.textContent = v;
          metaDiv.appendChild(s);
        });

        // Size — blue span (#00f)
        const sizeSpan = metaP.querySelector('span[style*="#00f"]');
        if (sizeSpan) {
          // Determine unit from surrounding text (MBs / GBs)
          const sizeText = fullText.match(/[\d.]+\s*(MBs?|GBs?)/i);
          const unit     = sizeText ? sizeText[1] : 'MB';
          const s = document.createElement('span');
          s.className   = 'abb-meta-size';
          s.textContent = sizeSpan.textContent.trim() + ' ' + unit;
          metaDiv.appendChild(s);
        }

        if (metaDiv.children.length) bodyDiv.appendChild(metaDiv);
      }

      // Push buttons to bottom
      const spacer = document.createElement('div');
      spacer.className = 'abb-spacer';
      bodyDiv.appendChild(spacer);

      // Buttons
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'abb-actions';

      if (detailsA) {
        const btn = document.createElement('a');
        btn.href        = detailsA.href;
        btn.className   = 'abb-btn abb-btn-outline';
        btn.textContent = '📖 Details';
        actionsDiv.appendChild(btn);
      }
      if (downloadA) {
        const btn = document.createElement('a');
        btn.href        = downloadA.href;
        btn.className   = 'abb-btn abb-btn-primary';
        btn.textContent = '⬇ Download';
        btn.rel         = 'nofollow';
        actionsDiv.appendChild(btn);
      }
      bodyDiv.appendChild(actionsDiv);

      /* ── Assemble & insert ── */
      const card = document.createElement('div');
      card.className             = 'abb-card';
      card.style.animationDelay = `${Math.min(idx, 8) * 0.05}s`;
      card.appendChild(coverDiv);
      card.appendChild(bodyDiv);

      // Insert directly after the (hidden) original .post
      post.insertAdjacentElement('afterend', card);
    });
  }


  /* ============================================================
     COLLAPSIBLE SIDEBAR SECTIONS
     Each .leftCat h2 becomes a toggle button.
     "Age" and "Popular Language" start open; everything else collapsed.
  ============================================================ */
  function buildCollapsibleSidebar() {
    const OPEN_BY_DEFAULT = new Set(['Age', 'Popular Language']);

    document.querySelectorAll('#lsidebar .leftCat').forEach(cat => {
      const h2 = cat.querySelector(':scope > h2, :scope > ul + h2, h2');
      const ul = cat.querySelector('ul');
      if (!h2 || !ul) return;

      const label     = h2.textContent.trim();
      const startOpen = OPEN_BY_DEFAULT.has(label);

      // Outer styled box
      const section = document.createElement('div');
      section.className = 'abb-sidebar-section';

      // Toggle button
      const toggle = document.createElement('button');
      toggle.className = 'abb-sidebar-toggle' + (startOpen ? '' : ' is-collapsed');
      toggle.type      = 'button';
      toggle.innerHTML = `<span>${label}</span><span class="abb-chevron">▾</span>`;

      // Body
      const body = document.createElement('div');
      body.className = 'abb-sidebar-body' + (startOpen ? '' : ' is-collapsed');

      // Hot Search styling
      if (label === 'Hot Search') cat.classList.add('abb-hot-search');

      body.appendChild(ul);
      section.appendChild(toggle);
      section.appendChild(body);

      cat.innerHTML = '';
      cat.appendChild(section);

      toggle.addEventListener('click', () => {
        const nowCollapsed = body.classList.toggle('is-collapsed');
        toggle.classList.toggle('is-collapsed', nowCollapsed);
      });
    });
  }


  /* ============================================================
     SECTION HEADER
  ============================================================ */
  function addSectionHeader() {
    const content   = document.getElementById('content');
    const firstPost = content && content.querySelector('.post');
    if (!content || !firstPost) return;

    let title = 'Latest Audiobooks';
    if (window.location.search.includes('s=')) {
      const q = new URLSearchParams(window.location.search).get('s');
      title = `Results for "${q}"`;
    } else if (window.location.href.match(/\/audio-books\//)) {
      title = document.title.split(/[|\-]/)[0].trim();
    }

    const header = document.createElement('div');
    header.className = 'abb-section-header';
    header.innerHTML = `
      <span class="abb-section-title">${title}</span>
      <span class="abb-section-sub">audiobookbay.lu</span>
    `;
    content.insertBefore(header, firstPost);
  }


  /* ============================================================
     MISC
  ============================================================ */
  function miscTweaks() {
    // Search placeholder
    const input = document.querySelector('#searchform .s');
    if (input) input.placeholder = 'Search audiobooks…';

    // Page X of Y
    const nav     = document.querySelector('.wp-pagenavi');
    const current = nav && nav.querySelector('.current');
    const lastLnk = nav && nav.querySelector('a[title="»»"]');
    if (current && lastLnk) {
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:11px;color:var(--muted);margin-left:8px;font-family:var(--mono)';
      lbl.textContent   = `page ${current.textContent} of ${lastLnk.href.match(/\/page\/(\d+)/)?.[1] || '?'}`;
      nav.appendChild(lbl);
    }
  }


  /* ============================================================
     INIT
  ============================================================ */
  function init() {
    rebuildCards();
    buildCollapsibleSidebar();
    addSectionHeader();
    miscTweaks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();