/* AtlasLab Code — draft-store.js
   Hər (istifadəçi × sual × dil) üçün kodu brauzerdə (localStorage) saxlayır.
   Limitlər: simvol, sətr sayı və saxlanan qeyd sayı. Cihazlararası sinxron YOXDUR (məqsədli). */
(function (root) {
  'use strict';

  const DEFAULTS = { maxChars: 20000, maxLines: 500, maxEntries: 60, debounceMs: 800 };

  function defaultStorage() {
    try { return root.localStorage || null; } catch (_) { return null; }
  }

  function create(opts) {
    const cfg = Object.assign({}, DEFAULTS, opts);
    const userId = cfg.userId, problemId = cfg.problemId;
    const storage = cfg.storage || defaultStorage();
    const getSignature = cfg.getSignature || (() => '');
    let timer = null;
    let pending = null;
    let limitWarned = false;

    const keyFor = (lang) => `atlas_draft:v1:${userId}:${problemId}:${lang}`;
    const indexKey = `atlas_draft_index:v1:${userId}`;
    const trimEnd = (s) => String(s || '').replace(/\s+$/, '');

    function readIndex() {
      try { const a = JSON.parse(storage.getItem(indexKey) || '[]'); return Array.isArray(a) ? a : []; }
      catch (_) { return []; }
    }
    function writeIndex(a) { try { storage.setItem(indexKey, JSON.stringify(a)); } catch (_) {} }

    function pruneTo(max) {
      const idx = readIndex().sort((a, b) => a.ts - b.ts);
      while (idx.length > max) {
        const old = idx.shift();
        try { storage.removeItem(old.k); } catch (_) {}
      }
      writeIndex(idx);
    }
    function touchIndex(key) {
      const idx = readIndex().filter(e => e.k !== key);
      idx.push({ k: key, ts: Date.now() });
      writeIndex(idx);
      pruneTo(cfg.maxEntries);
    }
    function removeKey(key) {
      try { storage.removeItem(key); } catch (_) {}
      writeIndex(readIndex().filter(e => e.k !== key));
    }

    function load(lang) {
      if (!storage || !userId) return null;
      const key = keyFor(lang);
      try {
        const raw = storage.getItem(key);
        if (!raw) return null;
        const rec = JSON.parse(raw);
        if (!rec || rec.v !== 1 || typeof rec.code !== 'string') { removeKey(key); return null; }
        if (rec.sig !== getSignature()) { removeKey(key); return null; }   // sualın imzası dəyişib
        if (rec.code.length > cfg.maxChars) { removeKey(key); return null; }
        return rec.code;
      } catch (_) { return null; }
    }

    // Qaytarır: 'saved' | 'cleared' | 'too-long' | 'error'
    function save(lang, code, template) {
      if (!storage || !userId || typeof code !== 'string') return 'error';
      const key = keyFor(lang);
      if (trimEnd(code) === trimEnd(template)) { removeKey(key); return 'cleared'; }
      if (code.length > cfg.maxChars || code.split('\n').length > cfg.maxLines) return 'too-long';
      const payload = JSON.stringify({ v: 1, sig: getSignature(), code, ts: Date.now() });
      try {
        storage.setItem(key, payload);
      } catch (_) {
        pruneTo(Math.floor(cfg.maxEntries / 2));          // yer qurtarıb bir dəfə təkrar cəhd
        try { storage.setItem(key, payload); } catch (_e) { return 'error'; }
      }
      touchIndex(key);
      return 'saved';
    }

    function runSave(job) {
      const r = save(job.lang, job.code, job.template);
      if (r === 'too-long' && !limitWarned) { limitWarned = true; if (cfg.onLimit) cfg.onLimit(); }
      if (r === 'saved' || r === 'cleared') limitWarned = false;
      return r;
    }
    function schedule(lang, code, template) {
      pending = { lang, code, template };
      clearTimeout(timer);
      timer = setTimeout(flush, cfg.debounceMs);
    }
    function flush() {
      clearTimeout(timer);
      if (!pending) return null;
      const job = pending; pending = null;
      return runSave(job);
    }
    function clear(lang) {
      if (pending && pending.lang === lang) pending = null;
      if (storage) removeKey(keyFor(lang));
    }

    return { load, save, schedule, flush, clear };
  }

  root.AtlasDrafts = { create, DEFAULTS };
})(typeof globalThis !== 'undefined' ? globalThis : self);