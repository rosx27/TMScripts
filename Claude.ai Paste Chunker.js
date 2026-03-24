// ==UserScript==
// @name Claude.ai Paste Chunker
// @namespace https://github.com/rosx27/TMScripts
// @version 1.0.0
// @description Intercepts paste on claude.ai and splits large text into 1024-byte chunks to prevent attachment behavior
// @author You
// @match https://claude.ai/*
// @grant none
// @run-at document-end
// ==/UserScript==

(function () {
  'use strict';

  const CHUNK_SIZE = 1024; // bytes

  /**
   * Split a string into chunks of at most CHUNK_SIZE bytes each.
   * Splitting is done on byte boundaries while keeping characters intact
   * (no splitting inside a multi-byte UTF-8 character).
   * Each chunk is separated by a newline when rejoined.
   */
  function chunkText(text) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const encoded = encoder.encode(text);

    if (encoded.length <= CHUNK_SIZE) {
      return text; // Nothing to do
    }

    const chunks = [];
    let offset = 0;

    while (offset < encoded.length) {
      let end = Math.min(offset + CHUNK_SIZE, encoded.length);

      // Walk back to avoid splitting a multi-byte UTF-8 sequence.
      // Continuation bytes have the form 10xxxxxx (0x80–0xBF).
      while (end > offset && (encoded[end] & 0xC0) === 0x80) {
        end--;
      }

      chunks.push(decoder.decode(encoded.slice(offset, end)));
      offset = end;
    }

    return chunks.join('\n');
  }

  /**
   * Insert text into a contenteditable element at the current caret position,
   * then dispatch an 'input' event so React/the framework picks up the change.
   */
  function insertTextAtCaret(target, text) {
    // Prefer execCommand so undo history is preserved
    if (document.execCommand) {
      // execCommand('insertText') works for contenteditable divs
      const success = document.execCommand('insertText', false, text);
      if (success) return;
    }

    // Fallback: manual DOM manipulation
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Notify React / Vue / etc.
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * The actual paste handler — attached in the capture phase so it fires
   * before the page's own listeners.
   */
  function onPaste(event) {
    const target = event.target;

    // Only act on the main chat input (contenteditable or textarea)
    const isContentEditable = target.isContentEditable;
    const isTextarea = target.tagName === 'TEXTAREA';
    if (!isContentEditable && !isTextarea) return;

    const clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const text = clipboardData.getData('text/plain');
    if (!text) return;

    const encoder = new TextEncoder();
    const byteLength = encoder.encode(text).length;

    // Only intervene when the text is large enough to become an attachment
    if (byteLength <= CHUNK_SIZE) return;

    // Prevent the browser / page from handling this paste
    event.preventDefault();
    event.stopImmediatePropagation();

    const chunked = chunkText(text);

    if (isTextarea) {
      // For plain <textarea>
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const before = target.value.slice(0, start);
      const after = target.value.slice(end);
      target.value = before + chunked + after;
      const newCaret = start + chunked.length;
      target.setSelectionRange(newCaret, newCaret);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // For contenteditable div (Claude's rich text editor)
      insertTextAtCaret(target, chunked);
    }

    // Visual feedback: briefly flash the input border green
    const originalOutline = target.style.outline;
    target.style.outline = '2px solid #22c55e';
    setTimeout(() => { target.style.outline = originalOutline; }, 600);

    console.log(
      `[Claude Paste Chunker] Intercepted ${byteLength} bytes → split into chunks of ≤${CHUNK_SIZE} bytes.`
    );
  }

  // Attach at the document level in the capture phase so we run first
  document.addEventListener('paste', onPaste, true);

  console.log('[Claude Paste Chunker] Loaded — paste chunks active (≤1024 bytes each).');
})();