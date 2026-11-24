// ==UserScript==
// @name         Tu Tiên 2D — Tool câu cá Hồ Tây (v2: tự tìm chỗ)
// @namespace    https://tutienpixel.online/
// @version      2.0.0
// @description  Tự động câu cá Hồ Tây: chọn mục tiêu Linh/Yêu/Giao, tự đổi mồi + tự tìm vùng quăng (Nông/Giữa/Sâu), quăng cần, giật khi phao chìm hẳn, kéo/thả theo nhịp cá. Chỉ bấm nút của game, không sửa tỉ lệ cắn câu (server giữ).
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// CÁCH DÙNG (v2)
//  1. Nạp tool (extension hoặc dán vào Console).
//  2. Vào Hồ Tây (khu 1), đứng ở cầu câu (40,15)/(39,14)/(38,14).
//  3. Chọn MỤC TIÊU trên bảng: Linh Ngư / Yêu Ngư / Giao Ngư / Tự do.
//     Tool tự đổi mồi + tự chọn vùng quăng phù hợp với mục tiêu.
//  4. Bấm "BẬT". Tool tự: đổi mồi → quăng cần đúng vùng → chờ phao chìm
//     ("Giật!") mới giật → kéo/thả theo nhịp → quăng lại.
//  5. TÌM CHỖ: nếu quăng 2 lần liên tiếp không thấy cá cắn ở vùng hiện tại,
//     tool tự đổi sang vùng khác (Sâu → Giữa → Nông) để tìm chỗ cá cắn.
//     Khi đã cắn ở vùng nào, tool ghi nhớ "đã tìm thấy chỗ" và giữ vùng đó.
//  6. Bấm "DỪNG" khi rời hồ hoặc khi anh muốn câu tay.
//
// MỤC TIÊU → MỒI + VÙNG (đọc từ client 24/11 — mô tả vật phẩm mồi):
//  - Linh Ngư: Ngọc Hà ("cá Linh Ngư mê mùi này"), dự phòng Vân Linh Khâu
//    ("Linh Ngư lẫn Yêu Ngư đều chịu"). Vùng: Giữa (thử Giữa → Sâu → Nông).
//  - Yêu Ngư: Xích Huyết Mồi ("Yêu Ngư ngửi thấy từ xa là trồi lên đớp"),
//    dự phòng Vân Linh Khâu. Vùng: Sâu (cá lớn ở nước sâu).
//  - Giao Ngư: Long Diên Hương ("thả chỗ nước sâu thì Giao Ngư cũng phải
//    ngóc đầu"), dự phòng Linh Nhĩ Mồi ("thả xuống chỗ nước sâu thì cá lớn
//    mới chịu ngóc lên"). Vùng: Sâu.
//  - Tự do: Giun Đất (∞), vùng Giữa.
//  LƯU Ý: game KHÔNG hiện vị trí cá trên mặt nước — server mới quyết định
//  cá cắn. Tool "tìm chỗ" bằng cách chọn đúng mồi + thử các vùng quăng
//  (Nông/Giữa/Sâu) cho tới khi thấy cá cắn, rồi giữ vùng đó.
//  Tool KHÔNG tự di chuyển nhân vật — nhân vật phải đứng sẵn ở cầu câu.
//  Mồi hết thì tool tự đổi sang mồi dự phòng, hết nữa thì dùng Giun Đất.
//
// CƠ CHẾ (đọc từ client 24/11, VanCanUI — game.js):
//  - Nút chính là <button class="vc-nut">, chữ trong <span class="vc-nut-chu">:
//    "Quăng" (sẵn sàng) / "Giật" (đang chờ) / "Giật!" (phao chìm hẳn — giật ngay)
//    / "Giữ"/"Cuốn" (đang kéo cá) / "Côn"/"Nối X" (Côn Bằng).
//  - Prompt nhịp là <div class="vc-goi">, class vc-goi-tha / vc-goi-keo / vc-goi-nhip.
//  - Nạp lực quăng là sóng tam giác, chu kỳ 1600ms: lực = 0→1 (0–800ms) rồi 1→0
//    (800–1600ms). Vùng: Nông 0–0,34 | Giữa 0,34–0,68 | Sâu 0,68–1,01.
//    Giữ nút 408ms ≈ lực 0,51 (Giữa); 680ms ≈ 0,85 (Sâu); 136ms ≈ 0,17 (Nông).
//  - Căng dây ≥90: game gắn class "vc-cang-do" — tool buông dây ngay để khỏi đứt.
//  - Mồi: nút <button class="vc-moi-nut" data-moi="giun|ngoc_ha|linh_nhi|
//    van_khau|huyet_tinh|long_huong">, số lượng trong <small class="vc-moi-so">.
//    Bấm nút là game đổi mồi (o.moi = key); lệnh quăng gửi lên là
//    vc.quang {luc, moi}. Giun Đất là mặc định, vô hạn.
//  - Tool CHỈ dispatch pointerdown/pointerup lên chính nút của game (handler của game
//    không kiểm tra isTrusted; setPointerCapture có try/catch) và bấm nút mồi
//    bằng .click(). Không gọi lệnh mạng trực tiếp, không sửa bộ nhớ game.
//  - Mọi thao tác có trễ ngẫu nhiên (giật 80–250ms, quăng lại 1–3s) cho giống tay người.
//
(function () {
  'use strict';

  // ---------------- Cấu hình ----------------
  var CFG = {
    pollMs: 50,               // kiểm tra trạng thái mỗi 50ms
    jerkDelayMin: 80,         // trễ trước khi giật (ms)
    jerkDelayMax: 250,
    castHoldMs: { nong: 136, giua: 408, sau: 680 }, // giữ nút để quăng theo vùng
    waitBiteTimeoutMs: 60000, // chờ cắn câu tối đa 60s rồi thu cần, quăng lại
    recastDelayMin: 1000,     // nghỉ giữa các lần quăng (ms)
    recastDelayMax: 3000,
    tapHoldMin: 200,          // "Nhả nhịp": giữ bao lâu rồi buông
    tapHoldMax: 350,
    jerkTapMs: 60,            // giật: bấm giữ 60ms rồi buông
    conTapMs: 60,             // nối Côn Bằng: bấm giữ 60ms rồi buông
    khongCanDoiVung: 2,       // quăng N lần không cắn thì đổi vùng tìm chỗ
  };

  // ---------------- Mục tiêu: mồi + vùng ----------------
  var TARGETS = {
    linh: { ten: 'Linh Ngư', moi: 'ngoc_ha', moiTen: 'Ngọc Hà', duPhong: 'van_khau', duPhongTen: 'Vân Linh Khâu', vung: 'giua', vungThu: ['giua', 'sau', 'nong'] },
    yeu:  { ten: 'Yêu Ngư',  moi: 'huyet_tinh', moiTen: 'Xích Huyết Mồi', duPhong: 'van_khau', duPhongTen: 'Vân Linh Khâu', vung: 'sau', vungThu: ['sau', 'giua', 'nong'] },
    giao: { ten: 'Giao Ngư', moi: 'long_huong', moiTen: 'Long Diên Hương', duPhong: 'linh_nhi', duPhongTen: 'Linh Nhĩ Mồi', vung: 'sau', vungThu: ['sau', 'giua', 'nong'] },
    tudo: { ten: 'Tự do',    moi: 'giun', moiTen: 'Giun Đất', duPhong: null, duPhongTen: null, vung: 'giua', vungThu: ['giua', 'sau', 'nong'] },
  };
  var VUNG_TEN = { nong: 'Nông', giua: 'Giữa', sau: 'Sâu' };

  // ---------------- Trạng thái ----------------
  var on = false;             // tool đang bật?
  var holding = false;        // nút đang được giữ (đã pointerdown, chưa pointerup)
  var state = 'idle';         // idle | casting | waiting | jerking | pulling | con-wait | con-tapped
  var nextCastAt = 0;         // thời điểm được quăng tiếp
  var lastCastAt = 0;         // thời điểm quăng gần nhất
  var stats = { cast: 0, jerk: 0, pull: 0, con: 0 };
  var logLines = [];
  var target = 'tudo';        // mục tiêu hiện tại: linh | yeu | giao | tudo
  var vungHien = 'giua';      // vùng quăng đang dùng: nong | giua | sau
  var choTimDuoc = null;      // vùng đã tìm thấy cá cắn (null = chưa tìm thấy)
  var demKhongCan = 0;        // số lần quăng liên tiếp không thấy cá cắn
  var moiDaChon = null;       // mồi tool đã bấm chọn (để khỏi bấm lại)
  var moiDangDung = 'giun';   // mồi đang dùng thực tế (sau khi xét hết/dự phòng)

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.round(rand(a, b)); }

  // ---------------- Đọc DOM của game ----------------
  function nutBtn() { return document.querySelector('button.vc-nut'); }
  function nutText() {
    var el = document.querySelector('.vc-nut-chu');
    return el ? el.textContent.trim() : '';
  }
  function goiKind() {
    var el = document.querySelector('.vc-goi');
    if (!el) return '';
    var m = /vc-goi-(tha|keo|nhip)/.exec(el.className || '');
    return m ? m[1] : '';
  }
  function goiText() {
    var el = document.querySelector('.vc-goi');
    return el ? el.textContent.trim() : '';
  }
  function tensionHigh() { return !!document.querySelector('.vc-cang-do'); }
  function thuCanBtn() {
    var b = document.querySelector('button.vc-thu');
    if (!b || b.classList.contains('hidden')) return null;
    return b;
  }
  // Nút mồi: <button class="vc-moi-nut" data-moi="...">, số lượng trong <small class="vc-moi-so">
  function nutMoi(key) { return document.querySelector('button.vc-moi-nut[data-moi="' + key + '"]'); }
  function soLuongMoi(key) {
    var b = nutMoi(key);
    if (!b) return -1;
    var s = b.querySelector('small.vc-moi-so');
    if (!s) return -1;
    var t = (s.textContent || '').trim();
    if (t === '' || t === '∞' || t === '—' || t === '-') return Infinity;
    var n = parseInt(t.replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? -1 : n;
  }

  // ---------------- Bấm / buông nút của game ----------------
  function press() {
    var b = nutBtn();
    if (!b || holding) return false;
    b.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, pointerId: 1, isPrimary: true,
    }));
    holding = true;
    return true;
  }
  function release() {
    var b = nutBtn();
    if (!b || !holding) return false;
    b.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, cancelable: true, pointerId: 1, isPrimary: true,
    }));
    holding = false;
    return true;
  }
  // Bấm nhanh: giữ `ms` rồi buông.
  function tap(ms) {
    if (!press()) return;
    setTimeout(release, ms);
  }
  // Bấm nút mồi để game đổi mồi (o.moi = key).
  function chonMoi(key) {
    var b = nutMoi(key);
    if (!b) return false;
    b.click();
    moiDaChon = key;
    moiDangDung = key;
    return true;
  }

  // ---------------- Mục tiêu / mồi / vùng ----------------
  // Đảm bảo đúng mồi cho mục tiêu trước khi quăng. Hết mồi chính thì dùng
  // mồi dự phòng, hết nữa thì dùng Giun Đất (vô hạn). Trả về mồi sẽ dùng.
  function damBaoMoi() {
    var tg = TARGETS[target];
    var chon = tg.moi;
    var sl = soLuongMoi(chon);
    if (sl === 0) {
      if (tg.duPhong && soLuongMoi(tg.duPhong) > 0) {
        chon = tg.duPhong;
        log('Hết ' + tg.moiTen + ' — đổi sang ' + tg.duPhongTen + '.');
      } else {
        chon = 'giun';
        log('Hết ' + tg.moiTen + ' (dự phòng cũng hết) — dùng Giun Đất.');
      }
    } else if (sl === -1) {
      chon = tg.moi; // chưa đọc được số lượng (chưa vào giao diện câu) — cứ chọn mồi chính
    }
    if (moiDaChon !== chon) {
      var tenMoi = chon === 'giun' ? 'Giun Đất' : (chon === tg.moi ? tg.moiTen : tg.duPhongTen);
      if (chonMoi(chon)) log('Đã chọn mồi: ' + tenMoi + '.');
    }
    moiDangDung = chon;
    return chon;
  }
  function doiVung(vung) {
    vungHien = vung;
    if (zoneBtns) {
      Object.keys(zoneBtns).forEach(function (z) {
        zoneBtns[z].style.background = z === vungHien ? '#6b4d16' : '#2a2113';
      });
    }
    setTargetLine();
  }
  function vungTiepTheo() {
    var list = TARGETS[target].vungThu;
    var i = list.indexOf(vungHien);
    return list[(i + 1) % list.length];
  }
  // Quăng N lần không thấy cắn ở vùng hiện tại → đổi vùng để tìm chỗ.
  function ghiNhanKhongCan() {
    demKhongCan += 1;
    if (demKhongCan >= CFG.khongCanDoiVung) {
      var vungCu = vungHien;
      var vungMoi = vungTiepTheo();
      demKhongCan = 0;
      doiVung(vungMoi);
      log('Không thấy cắn ở vùng ' + VUNG_TEN[vungCu] + ' — đang tìm chỗ khác (vùng ' + VUNG_TEN[vungMoi] + ').');
    }
  }
  // Đã cắn ở vùng hiện tại → ghi nhớ là "chỗ" đã tìm thấy, giữ vùng đó.
  function ghiNhanCan() {
    if (choTimDuoc !== vungHien) {
      choTimDuoc = vungHien;
      log('Tìm thấy chỗ! Cá cắn ở vùng ' + VUNG_TEN[vungHien] + ' — giữ vùng này.');
    }
    demKhongCan = 0;
    setTargetLine();
  }
  function datMucTieu(key) {
    if (!TARGETS[key]) return;
    target = key;
    var tg = TARGETS[key];
    vungHien = tg.vung;
    choTimDuoc = null;
    demKhongCan = 0;
    moiDaChon = null; // để damBaoMoi chọn lại mồi mới cho mục tiêu mới
    doiVung(vungHien);
    if (targetBtns) {
      Object.keys(targetBtns).forEach(function (k) {
        targetBtns[k].style.background = k === target ? '#6b4d16' : '#2a2113';
      });
    }
    log('Mục tiêu: ' + tg.ten + ' — mồi ' + tg.moiTen + ', vùng ' + VUNG_TEN[tg.vung] + '.');
    setTargetLine();
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, statusEl, statsEl, logEl, toggleBtn, targetLineEl, zoneBtns = {}, targetBtns = {};
  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'tt2d-fish-panel';
    panel.style.cssText = [
      'position:fixed', 'top:10px', 'right:10px', 'z-index:999999',
      'width:248px', 'background:rgba(20,14,8,0.88)', 'color:#ffe9b0',
      'border:1px solid #8a6a2f', 'border-radius:10px', 'padding:10px 12px',
      'font:12px/1.5 system-ui, sans-serif', 'box-shadow:0 4px 18px rgba(0,0,0,0.5)',
    ].join(';');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>🎣 Tool câu Hồ Tây v2</b>' +
        '<button id="tt2d-fish-hide" title="Ẩn bảng (tool vẫn chạy nếu đang BẬT)" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px">×</button>' +
      '</div>' +
      '<div style="margin:8px 0">Mục tiêu: ' +
        '<button data-target="linh" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Linh Ngư</button> ' +
        '<button data-target="yeu" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Yêu Ngư</button> ' +
        '<button data-target="giao" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Giao Ngư</button> ' +
        '<button data-target="tudo" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#6b4d16;color:#ffe9b0;cursor:pointer">Tự do</button>' +
      '</div>' +
      '<div id="tt2d-fish-target" style="margin:4px 0;color:#ffd27a"></div>' +
      '<div style="margin:8px 0;display:flex;gap:6px">' +
        '<button id="tt2d-fish-toggle" style="flex:1;padding:6px;border-radius:6px;border:1px solid #8a6a2f;background:#3a2c12;color:#ffe9b0;cursor:pointer;font-weight:bold">BẬT</button>' +
      '</div>' +
      '<div style="margin:4px 0">Vùng quăng: ' +
        '<button data-zone="nong" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Nông</button> ' +
        '<button data-zone="giua" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#6b4d16;color:#ffe9b0;cursor:pointer">Giữa</button> ' +
        '<button data-zone="sau" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Sâu</button>' +
      '</div>' +
      '<div id="tt2d-fish-status" style="margin:6px 0;color:#bfe3ff">Chưa bật — vào Hồ Tây, đứng ở cầu câu rồi bấm BẬT.</div>' +
      '<div id="tt2d-fish-stats" style="color:#c9f2c9">Quăng 0 · Giật 0 · Kéo 0 · Côn 0</div>' +
      '<div id="tt2d-fish-log" style="margin-top:6px;max-height:96px;overflow:auto;color:#d8c9a3;font-size:11px"></div>' +
      '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">Chỉ bấm nút của game. Dừng khi rời hồ. Tool không đổi tỉ lệ cắn câu.</div>';
    document.body.appendChild(panel);

    toggleBtn = panel.querySelector('#tt2d-fish-toggle');
    statusEl = panel.querySelector('#tt2d-fish-status');
    statsEl = panel.querySelector('#tt2d-fish-stats');
    logEl = panel.querySelector('#tt2d-fish-log');
    targetLineEl = panel.querySelector('#tt2d-fish-target');

    toggleBtn.addEventListener('click', function () { setOn(!on); });
    panel.querySelector('#tt2d-fish-hide').addEventListener('click', function () {
      panel.style.display = 'none';
    });
    panel.querySelectorAll('[data-target]').forEach(function (btn) {
      targetBtns[btn.getAttribute('data-target')] = btn;
      btn.addEventListener('click', function () { datMucTieu(btn.getAttribute('data-target')); });
    });
    panel.querySelectorAll('[data-zone]').forEach(function (btn) {
      zoneBtns[btn.getAttribute('data-zone')] = btn;
      btn.addEventListener('click', function () {
        // Đổi vùng tay — tool sẽ thử vùng này trước (tìm chỗ vẫn tự đổi nếu không cắn)
        doiVung(btn.getAttribute('data-zone'));
        choTimDuoc = null;
        demKhongCan = 0;
        log('Đổi vùng quăng tay: ' + VUNG_TEN[vungHien] + '.');
      });
    });
    setTargetLine();
  }

  function setStatus(s) { if (statusEl) statusEl.textContent = s; }
  function setTargetLine() {
    if (!targetLineEl) return;
    var tg = TARGETS[target];
    var moiTen = moiDangDung === 'giun' ? 'Giun Đất' : (moiDangDung === tg.moi ? tg.moiTen : tg.duPhongTen);
    targetLineEl.textContent = 'Mục tiêu: ' + tg.ten + ' · Mồi: ' + moiTen +
      ' · Vùng: ' + VUNG_TEN[vungHien] +
      (choTimDuoc ? ' · Đã tìm thấy chỗ ✓' : ' · Đang tìm chỗ…');
  }
  function setStats() {
    if (statsEl) {
      statsEl.textContent = 'Quăng ' + stats.cast + ' · Giật ' + stats.jerk +
        ' · Kéo ' + stats.pull + ' · Côn ' + stats.con;
    }
  }
  function log(msg) {
    var line = new Date().toLocaleTimeString('vi-VN') + ' — ' + msg;
    logLines.unshift(line);
    if (logLines.length > 6) logLines.length = 6;
    if (logEl) logEl.innerHTML = logLines.map(function (l) {
      return '<div>' + l.replace(/</g, '&lt;') + '</div>';
    }).join('');
    try { console.log('[TT2D-Fish] ' + line); } catch (e) { /* bỏ qua */ }
  }

  function setOn(v) {
    on = v;
    if (toggleBtn) {
      toggleBtn.textContent = on ? 'DỪNG' : 'BẬT';
      toggleBtn.style.background = on ? '#7a2d12' : '#3a2c12';
    }
    if (on) {
      state = 'idle';
      nextCastAt = Date.now() + 500;
      // BẬT là tự động đi tìm chỗ: đảm bảo đúng mồi + vùng cho mục tiêu rồi quăng
      damBaoMoi();
      doiVung(vungHien);
      setStatus('Đang chạy — tìm chỗ cho ' + TARGETS[target].ten + '…');
      log('Tool BẬT (mục tiêu ' + TARGETS[target].ten + ', mồi ' +
        (moiDangDung === 'giun' ? 'Giun Đất' : moiDangDung) + ', vùng ' + VUNG_TEN[vungHien] + ').');
    } else {
      if (holding) release();
      setStatus('Đã dừng.');
      log('Tool DỪNG.');
    }
    setTargetLine();
  }

  // ---------------- Logic kéo cá theo nhịp ----------------
  function applyPull() {
    // An toàn: căng dây ≥90 thì buông ngay, khỏi đứt dây.
    if (tensionHigh()) {
      if (holding) { release(); log('Căng dây ≥90 — buông dây.'); }
      return;
    }
    var gk = goiKind();
    if (gk === 'tha') {           // Giãy → "Thả!": buông dây
      if (holding) release();
    } else if (gk === 'keo') {    // Mỏi → "Kéo!": giữ chặt
      if (!holding) press();
    } else if (gk === 'nhip') {   // Lặn → "Nhả nhịp": giữ rồi buông
      if (!holding) {
        press();
        setTimeout(function () {
          if (holding && goiKind() !== 'keo') release();
        }, randInt(CFG.tapHoldMin, CFG.tapHoldMax));
      } else {
        setTimeout(function () {
          if (holding && goiKind() !== 'keo') release();
        }, randInt(150, 300));
      }
    } else {                      // Bơi (không prompt): giữ để cuốn dây
      if (!holding) press();
    }
  }

  // ---------------- Vòng lặp chính ----------------
  function tick() {
    if (!on) return;
    var b = nutBtn();
    if (!b) {
      setStatus('Chưa thấy giao diện câu cá — vào Hồ Tây, đứng ở cầu câu.');
      return;
    }
    var t = nutText();
    var now = Date.now();

    if (t === 'Quăng') {
      // Kết thúc một lượt kéo/câu → chuẩn bị quăng lại.
      if (state === 'pulling' || state === 'jerking' || state === 'waiting') {
        state = 'idle';
        nextCastAt = now + randInt(CFG.recastDelayMin, CFG.recastDelayMax);
      }
      if (state === 'idle' && now >= nextCastAt) {
        // Trước mỗi lần quăng: đảm bảo đúng mồi cho mục tiêu (mồi có thể đã hết)
        damBaoMoi();
        state = 'casting';
        var holdMs = CFG.castHoldMs[vungHien] + randInt(-15, 15);
        if (press()) {
          setStatus('Đang quăng cần (' + TARGETS[target].ten + ', vùng ' + VUNG_TEN[vungHien] + ', giữ ~' + holdMs + 'ms)…');
          setTimeout(function () {
            release();
            stats.cast += 1;
            state = 'waiting';
            lastCastAt = Date.now();
            setStats();
            log('Đã quăng cần (' + TARGETS[target].ten + ', vùng ' + VUNG_TEN[vungHien] + ').');
          }, Math.max(60, holdMs));
        } else {
          state = 'idle';
        }
      } else if (state === 'idle') {
        setStatus('Chuẩn bị quăng lại…');
      }
      return;
    }

    if (t === 'Giật') {
      // Đang chờ cá cắn — quá lâu thì thu cần, quăng lại.
      state = 'waiting';
      setStatus('Đang chờ cá cắn (' + TARGETS[target].ten + ', vùng ' + VUNG_TEN[vungHien] + ')…');
      if (lastCastAt && now - lastCastAt > CFG.waitBiteTimeoutMs) {
        var thu = thuCanBtn();
        if (thu) { thu.click(); log('Chờ cắn quá 60s — thu cần, quăng lại.'); }
        ghiNhanKhongCan(); // không cắn ở vùng này → đếm để đổi vùng tìm chỗ
        state = 'idle';
        nextCastAt = now + 1000;
      }
      return;
    }

    if (t === 'Giật!') {
      // Phao chìm hẳn — giật ngay (trễ ngẫu nhiên cho giống tay người).
      if (state === 'waiting') {
        state = 'jerking';
        ghiNhanCan(); // đã cắn ở vùng này → ghi nhớ là "chỗ" đã tìm thấy
        var delay = randInt(CFG.jerkDelayMin, CFG.jerkDelayMax);
        setStatus('Phao chìm — giật sau ~' + delay + 'ms…');
        setTimeout(function () {
          tap(CFG.jerkTapMs);
          stats.jerk += 1;
          setStats();
          log('Đã giật!');
        }, delay);
      }
      return;
    }

    if (t === 'Giữ' || t === 'Cuốn') {
      // Đang kéo cá — theo prompt nhịp.
      if (state !== 'pulling') {
        state = 'pulling';
        stats.pull += 1;
        setStats();
        log('Đang kéo cá…');
      }
      setStatus('Đang kéo cá — nhịp: ' + (goiText() || 'Bơi') + '.');
      applyPull();
      return;
    }

    if (t === 'Côn') {
      // Côn Bằng: tới lúc nối dây.
      if (state !== 'con-tapped') {
        state = 'con-tapped';
        tap(CFG.conTapMs);
        stats.con += 1;
        setStats();
        log('Nối dây Côn Bằng!');
        setStatus('Đã nối dây Côn Bằng — kéo theo nhịp.');
      }
      return;
    }

    if (/^Nối \d+$/.test(t)) {
      state = 'con-wait';
      setStatus('Côn Bằng: chờ nối dây (' + t + ')…');
      return;
    }

    // Trạng thái khác (đang nạp lực, đang xử lý…) — chờ vòng sau.
    setStatus('Đang câu… (' + (t || '?') + ')');
  }

  // ---------------- Khởi động ----------------
  buildPanel();
  setInterval(tick, CFG.pollMs);
  setStatus('Chưa bật — vào Hồ Tây, đứng ở cầu câu rồi bấm BẬT.');
  setTargetLine();
  log('Tool đã nạp (v2). Mặc định TẮT.');
  // Điều khiển từ Console khi cần debug: __TT2D_FISH__.start() / .stop() / .setTarget('linh'|'yeu'|'giao'|'tudo') / .status()
  window.__TT2D_FISH__ = {
    start: function () { setOn(true); },
    stop: function () { setOn(false); },
    setTarget: function (k) { datMucTieu(k); },
    status: function () {
      return { on: on, state: state, holding: holding, target: target, vung: vungHien, choTimDuoc: choTimDuoc, moi: moiDangDung, stats: stats };
    },
  };
})();
