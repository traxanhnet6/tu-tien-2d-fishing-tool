// ==UserScript==
// @name         Tool Tu Tiên Pixel — bản nạp cho Stay/Safari
// @namespace    tutienpixel-tool-loader
// @version      2.0.4
// @description  Bản nạp nhỏ cho Stay trên Safari iPhone: hiện nút Tool ngay, tải tool chính từ server tool rồi chạy.
// @author       Muse (cho Bui)
// @match        https://tutienpixel.online/*
// @match        https://www.tutienpixel.online/*
// @match        https://tutien2d.com/*
// @match        https://www.tutien2d.com/*
// @updateURL    https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/tutienpixel-host/tutienpixel/tutienpixel-tool-loader.user.js
// @downloadURL  https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/tutienpixel-host/tutienpixel/tutienpixel-tool-loader.user.js
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// ==/UserScript==
(function ttpxLoader() {
  'use strict';
  var G = globalThis;
  var MAIN_URL = 'https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/tutienpixel-host/tutienpixel/tutienpixel-tool.user.js';
  if (G.__ttpxLoaderRan) return;
  G.__ttpxLoaderRan = true;
  try { G['unsafe' + 'Window'] = G; } catch (e) {}
  var loaded = false, loading = false, lastErr = '';
  function fab() { return document.getElementById('ttpx-fab'); }
  function setFab(txt, title) {
    var f = fab();
    if (f) { f.textContent = txt; if (title) f.title = title; }
  }
  function mkFab() {
    try {
      if (!document.body) return false;
      if (fab()) return true;
      var b = document.createElement('button');
      b.id = 'ttpx-fab';
      b.type = 'button';
      b.textContent = lastErr ? 'Tool !' : 'Tool';
      b.title = lastErr ? ('Tool nạp lỗi: ' + lastErr + ' — bấm để thử lại') : 'Bấm mở bảng tool';
      b.style.cssText = 'position:fixed;right:6px;bottom:calc(6px + env(safe-area-inset-bottom, 0px));z-index:2147483647;background:rgba(31,111,74,.92);color:#fff;border:1px solid #3a5a4a;border-radius:10px;font:700 13px system-ui,sans-serif;padding:10px 14px;box-shadow:0 4px 18px rgba(0,0,0,.5);touch-action:manipulation;-webkit-tap-highlight-color:transparent';
      b.addEventListener('click', onTap);
      document.body.appendChild(b);
      try { console.log('[TTPX] loader đã hiện nút Tool (v2.0.4)'); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }
  function onTap() {
    try {
      var b = fab();
      if (b && b.__ttpxJustDragged) return;
      var p = document.getElementById('ttpx-panel');
      if (p) { p.style.display = ''; if (b) b.style.display = 'none'; return; }
      var api = G.__ttpxTool || null;
      if (api && typeof api.buildPanel === 'function') {
        api.buildPanel();
        p = document.getElementById('ttpx-panel');
        if (p) { p.style.display = ''; if (b) b.style.display = 'none'; }
        return;
      }
      if (!loaded) { setFab('Tool …', 'Đang tải tool từ server — chờ vài giây'); loadMain(); }
    } catch (e) {}
  }
  function fetchText(url) {
    return new Promise(function (resolve, reject) {
      var done = false;
      function ok(r) {
        if (done) return; done = true;
        if (r && r.status >= 200 && r.status < 300 && r.responseText) resolve(String(r.responseText));
        else reject(new Error('HTTP ' + (r && r.status)));
      }
      function bad(e) { if (done) return; done = true; reject(e instanceof Error ? e : new Error('lỗi mạng')); }
      try {
        if (typeof GM_xmlhttpRequest === 'function') {
          GM_xmlhttpRequest({ method: 'GET', url: url, timeout: 20000, onload: ok, onerror: function () { bad(new Error('GM lỗi mạng')); }, ontimeout: function () { bad(new Error('GM quá giờ')); } });
          return;
        }
      } catch (e) {}
      try {
        if (typeof GM !== 'undefined' && GM && typeof GM.xmlHttpRequest === 'function') {
          var ret = GM.xmlHttpRequest({ method: 'GET', url: url, timeout: 20000, onload: ok, onerror: function () { bad(new Error('GM lỗi mạng')); }, ontimeout: function () { bad(new Error('GM quá giờ')); } });
          if (ret && typeof ret.then === 'function') ret.then(ok, bad);
          return;
        }
      } catch (e) {}
      fetch(url, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).then(resolve, reject);
    });
  }
  function loadMain() {
    if (loading || loaded) return;
    loading = true;
    fetchText(MAIN_URL + '?v=' + Date.now()).then(function (code) {
      loading = false;
      try {
        (0, eval)(code);
        loaded = true;
        lastErr = '';
        setFab('Tool', 'Bấm mở bảng tool');
        try { console.log('[TTPX] loader đã nạp tool chính (v2.0.4)'); } catch (e) {}
      } catch (e) {
        lastErr = String((e && e.message) || e);
        setFab('Tool !', 'Tool nạp lỗi: ' + lastErr + ' — bấm để thử lại');
      }
    }, function (e) {
      loading = false;
      lastErr = String((e && e.message) || e);
      setFab('Tool !', 'Tool nạp lỗi: ' + lastErr + ' — bấm để thử lại');
    });
  }
  var tries = 0;
  (function tick() {
    if (mkFab()) { loadMain(); return; }
    if (++tries > 150) return;
    setTimeout(tick, 200);
  })();
  setInterval(function () { try { mkFab(); } catch (e) {} }, 5000);
})();
