// ==UserScript==
// @name         Tu Tiên 2D — Tool câu cá Hồ Tây (v3: tỷ lệ + luồng + thu nhỏ)
// @namespace    https://tutienpixel.online/
// @version      3.0.0
// @description  Tự động câu cá Hồ Tây: chọn mục tiêu Linh/Yêu/Giao/Tự do/Tự động (theo tỷ lệ cắn tốt nhất), tự đổi mồi + tự tìm vùng quăng, theo dõi tỷ lệ cắn/câu được theo vùng và mồi theo thời gian thực, ghi nhận "luồng cá" từ dữ liệu cắn, quăng lại sau khi câu được cá. Bảng điều khiển thu nhỏ được. Chỉ bấm nút của game, không đổi tỉ lệ cắn câu (server giữ).
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// CÁCH DÙNG (v3)
//  1. Nạp tool (extension hoặc dán vào Console).
//  2. Vào Hồ Tây (khu 1), đứng ở cầu câu (40,15)/(39,14)/(38,14).
//  3. Chọn MỤC TIÊU trên bảng: Linh Ngư / Yêu Ngư / Giao Ngư / Tự do /
//     Tự động ★ (tự chọn vùng + mồi theo tỷ lệ cắn tốt nhất đã quan sát).
//     Tool tự đổi mồi + tự chọn vùng quăng phù hợp với mục tiêu.
//  4. Bấm "BẬT". Tool tự: đổi mồi → quăng cần đúng vùng → chờ phao chìm
//     ("Giật!") mới giật → kéo/thả theo nhịp → câu được cá thì quăng lại ngay.
//  5. TỶ LỆ (mới v3): tool đếm số lần quăng / số lần cắn (Giật!) / số con
//     kéo xong cho từng vùng (Nông/Giữa/Sâu) và từng loại mồi, tính tỷ lệ
//     cắn và hiển thị trong bảng. Dữ liệu lưu lại qua các lần tải lại trang
//     (localStorage) — bấm "Xóa dữ liệu tỷ lệ" để làm mới.
//  6. TỰ ĐỘNG ★ (mới v3): tool tự chọn vùng + mồi có tỷ lệ cắn cao nhất
//     trong dữ liệu đã ghi. Cần tối thiểu 3 lần quăng/vùng mới tin tỷ lệ;
//     chưa đủ mẫu thì tool thử các vùng theo thứ tự Giữa → Sâu → Nông.
//  7. LUỒNG CÁ (mới v3): khi một vùng vừa có cá cắn, tool ghi nhận đó là
//     "luồng" hiện tại và ưu tiên ở lại vùng đó; nếu 2 lần quăng liên tiếp
//     ở vùng đó không cắn thì chuyển sang vùng có tỷ lệ tốt thứ nhì.
//     Bảng hiện "Luồng: <vùng> (tỷ lệ cắn x%)".
//  8. THU NHỎ (mới v3): bấm "—" trên bảng để thu nhỏ thành 1 thanh
//     (tên tool + trạng thái ngắn + nút "＋"); bấm "＋" để mở lại đầy đủ.
//     Tool vẫn chạy bình thường khi bảng thu nhỏ.
//  9. Bấm "DỪNG" khi rời hồ hoặc khi anh muốn câu tay. Bấm × để ẩn bảng
//     (tool vẫn chạy nếu đang BẬT; tải lại trang để hiện lại).
//
// GIỚI HẠN CỨNG (đã xác minh, đọc kỹ trước khi dùng):
//  - Game KHÔNG hiện vị trí cá trên mặt nước; server mới quyết định cá cắn.
//    Tool KHÔNG thể nhìn thấy luồng cá thật — "luồng" ở đây chỉ là SUY RA
//    từ dữ liệu cắn đã quan sát (vùng nào vừa cắn thì ưu tiên ở lại).
//  - Tool KHÔNG thể đổi tỷ lệ cắn của server; nó chỉ CHỌN vùng/mồi dựa trên
//    tỷ lệ đã quan sát được. Tỷ lệ hiển thị là tỷ lệ quan sát, không phải
//    tỷ lệ thật của server.
//  - "Câu được" ở đây nghĩa là "kéo xong một lượt" (nút về "Quăng" sau khi
//    kéo) — đó là tín hiệu quan sát được gần nhất; tool không phân biệt được
//    cá cắn câu thành công với đứt dây/trượt cá chỉ từ nút bấm.
//  - Tool KHÔNG tự di chuyển nhân vật — nhân vật phải đứng sẵn ở cầu câu.
//  - Mồi hết thì tool tự đổi sang mồi dự phòng, hết nữa thì dùng Giun Đất.
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
//  - Tự động ★: vùng + mồi theo tỷ lệ cắn tốt nhất đã quan sát (xem mục 6).
//
// CƠ CHẾ (đọc từ client 24/11, VanCanUI — game.js; giữ nguyên từ v2):
//  - Nút chính là <button class="vc-nut">, chữ trong <span class="vc-nut-chu">:
//    "Quăng" (sẵn sàng) / "Giật" (đang chờ) / "Giật!" (phao chìm hẳn — giật ngay)
//    / "Giữ"/"Cuốn" (đang kéo cá) / "Côn"/"Nối X" (Côn Bằng).
//    LƯU Ý: khi đang chờ cá cắn, nút có thể hiện TÊN VÙNG (Nông/Giữa/Sâu)
//    thay vì "Giật" — tool vẫn tính timeout 60s và quăng lại bình thường.
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
//  - Sau khi kéo cá xong (nút về "Quăng"), tool tự quăng lại ngay (không cần bấm).
//  - Chờ cắn quá 60s thì thu cần, quăng lại (áp dụng cả khi nút hiện tên vùng).
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
    tiLeToiThieuMau: 3,       // cần tối thiểu N lần quăng/vùng (hoặc/mồi) mới tin tỷ lệ
  };

  // ---------------- Mục tiêu: mồi + vùng ----------------
  var TARGETS = {
    linh: { ten: 'Linh Ngư', moi: 'ngoc_ha', moiTen: 'Ngọc Hà', duPhong: 'van_khau', duPhongTen: 'Vân Linh Khâu', vung: 'giua', vungThu: ['giua', 'sau', 'nong'] },
    yeu:  { ten: 'Yêu Ngư',  moi: 'huyet_tinh', moiTen: 'Xích Huyết Mồi', duPhong: 'van_khau', duPhongTen: 'Vân Linh Khâu', vung: 'sau', vungThu: ['sau', 'giua', 'nong'] },
    giao: { ten: 'Giao Ngư', moi: 'long_huong', moiTen: 'Long Diên Hương', duPhong: 'linh_nhi', duPhongTen: 'Linh Nhĩ Mồi', vung: 'sau', vungThu: ['sau', 'giua', 'nong'] },
    tudo: { ten: 'Tự do',    moi: 'giun', moiTen: 'Giun Đất', duPhong: null, duPhongTen: null, vung: 'giua', vungThu: ['giua', 'sau', 'nong'] },
    // Tự động: mồi + vùng do chonTuDong() cập nhật theo tỷ lệ quan sát được.
    auto: { ten: 'Tự động (tỷ lệ tốt nhất)', moi: 'ngoc_ha', moiTen: 'Ngọc Hà', duPhong: 'van_khau', duPhongTen: 'Vân Linh Khâu', vung: 'giua', vungThu: ['giua', 'sau', 'nong'] },
  };
  var VUNG_TEN = { nong: 'Nông', giua: 'Giữa', sau: 'Sâu' };
  var MOI_TEN = { giun: 'Giun Đất', ngoc_ha: 'Ngọc Hà', linh_nhi: 'Linh Nhĩ Mồi', van_khau: 'Vân Linh Khâu', huyet_tinh: 'Xích Huyết Mồi', long_huong: 'Long Diên Hương' };
  var VUNG_THU_TU = ['giua', 'sau', 'nong']; // thứ tự thử vùng khi chưa đủ mẫu

  // ---------------- Trạng thái ----------------
  var on = false;             // tool đang bật?
  var holding = false;        // nút đang được giữ (đã pointerdown, chưa pointerup)
  var state = 'idle';         // idle | casting | waiting | jerking | pulling | con-wait | con-tapped
  var nextCastAt = 0;         // thời điểm được quăng tiếp
  var lastCastAt = 0;         // thời điểm quăng gần nhất
  var stats = { cast: 0, jerk: 0, pull: 0, con: 0 };
  var logLines = [];
  var target = 'tudo';        // mục tiêu hiện tại: linh | yeu | giao | tudo | auto
  var vungHien = 'giua';      // vùng quăng đang dùng: nong | giua | sau
  var choTimDuoc = null;      // vùng đã tìm thấy cá cắn (null = chưa tìm thấy)
  var demKhongCan = 0;        // số lần quăng liên tiếp không thấy cá cắn
  var moiDaChon = null;       // mồi tool đã bấm chọn (để khỏi bấm lại)
  var moiDangDung = 'giun';   // mồi đang dùng thực tế (sau khi xét hết/dự phòng)
  // --- v3: tỷ lệ + luồng ---
  var ratesVung = { nong: { quang: 0, can: 0, cauDuoc: 0 }, giua: { quang: 0, can: 0, cauDuoc: 0 }, sau: { quang: 0, can: 0, cauDuoc: 0 } };
  var ratesMoi = {};          // key mồi -> {quang, can, cauDuoc} (tạo khi dùng)
  var luongHienTai = null;    // vùng vừa có cá cắn gần nhất (suy ra "luồng" từ dữ liệu cắn)
  var castVung = null;        // vùng của lượt quăng đang chạy (để ghi tỷ lệ đúng)
  var castMoi = null;         // mồi của lượt quăng đang chạy

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.round(rand(a, b)); }

  // ---------------- Tỷ lệ cắn / câu được (v3) ----------------
  var LS_KEY = 'tt2d_fish_v3_rates';
  function tiLeCan(r) { return r.quang > 0 ? r.can / r.quang : 0; }
  function tiLeCau(r) { return r.quang > 0 ? r.cauDuoc / r.quang : 0; }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function round3(x) { return Math.round(x * 1000) / 1000; }
  function rateObj(r) {
    return { quang: r.quang, can: r.can, cauDuoc: r.cauDuoc, tiLeCan: round3(tiLeCan(r)), tiLeCau: round3(tiLeCau(r)) };
  }
  function luuRates() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(LS_KEY, JSON.stringify({ vung: ratesVung, moi: ratesMoi }));
    } catch (e) { /* bỏ qua (vd chế độ ẩn danh chặn storage) */ }
  }
  function taiRates() {
    try {
      if (typeof localStorage === 'undefined') return;
      var s = localStorage.getItem(LS_KEY);
      if (!s) return;
      var d = JSON.parse(s);
      if (d && d.vung) {
        ['nong', 'giua', 'sau'].forEach(function (z) {
          if (d.vung[z]) {
            ratesVung[z].quang = d.vung[z].quang | 0;
            ratesVung[z].can = d.vung[z].can | 0;
            ratesVung[z].cauDuoc = d.vung[z].cauDuoc | 0;
          }
        });
      }
      if (d && d.moi) {
        Object.keys(d.moi).forEach(function (k) {
          if (MOI_TEN[k]) {
            ratesMoi[k] = { quang: d.moi[k].quang | 0, can: d.moi[k].can | 0, cauDuoc: d.moi[k].cauDuoc | 0 };
          }
        });
      }
    } catch (e) { /* dữ liệu cũ hỏng — bỏ qua, bắt đầu lại từ 0 */ }
  }
  function xoaRates() {
    ['nong', 'giua', 'sau'].forEach(function (z) { ratesVung[z] = { quang: 0, can: 0, cauDuoc: 0 }; });
    ratesMoi = {};
    luongHienTai = null;
    luuRates();
    renderRates();
    renderLuong();
    log('Đã xóa dữ liệu tỷ lệ (bắt đầu ghi lại từ 0).');
  }
  // Ghi 1 lần quăng (gọi khi quăng xong, kèm vùng/mồi của lượt đó).
  function ghiNhanQuang(vung, moi) {
    var rv = ratesVung[vung];
    if (rv) rv.quang += 1;
    var rm = ratesMoi[moi] || (ratesMoi[moi] = { quang: 0, can: 0, cauDuoc: 0 });
    rm.quang += 1;
    castVung = vung;
    castMoi = moi;
    luuRates();
    renderRates();
  }
  // Ghi 1 lần kéo xong (nút về "Quăng" sau khi kéo) — tính là câu được 1 con.
  function ghiNhanCauDuoc() {
    var v = castVung || vungHien;
    var m = castMoi || moiDangDung;
    if (ratesVung[v]) ratesVung[v].cauDuoc += 1;
    if (ratesMoi[m]) ratesMoi[m].cauDuoc += 1;
    luuRates();
    renderRates();
  }

  // Chế độ "Tự động": chọn vùng + mồi theo tỷ lệ cắn tốt nhất đã quan sát.
  // - Cần tối thiểu CFG.tiLeToiThieuMau lần quăng/vùng (hoặc/mồi) mới tin tỷ lệ.
  // - Chưa đủ mẫu thì thử các vùng theo thứ tự Giữa → Sâu → Nông.
  // - exclude: vùng cần loại trừ (khi vừa 2 lần không cắn ở vùng đó).
  function chonTuDong(exclude, lyDo) {
    var totNhat = null, totNhatTiLe = -1, tatCaDuMau = true, coTiLeDuong = false;
    VUNG_THU_TU.forEach(function (z) {
      if (z === exclude) return;
      var r = ratesVung[z];
      if (r.quang < CFG.tiLeToiThieuMau) tatCaDuMau = false;
      if (r.quang >= CFG.tiLeToiThieuMau) {
        var t = tiLeCan(r);
        if (t > 0) coTiLeDuong = true;
        if (t > totNhatTiLe || (t === totNhatTiLe && totNhat && r.quang > ratesVung[totNhat].quang)) {
          totNhat = z;
          totNhatTiLe = t;
        }
      }
    });
    var vungChon = null;
    if (totNhat && (coTiLeDuong || tatCaDuMau)) {
      vungChon = totNhat; // có vùng cắn tốt, hoặc tất cả đã đủ mẫu → lấy tốt nhất
    } else {
      // Chưa đủ mẫu / chưa vùng nào cắn → thử vùng theo thứ tự
      for (var i = 0; i < VUNG_THU_TU.length; i++) {
        if (VUNG_THU_TU[i] === exclude) continue;
        if (ratesVung[VUNG_THU_TU[i]].quang < CFG.tiLeToiThieuMau) { vungChon = VUNG_THU_TU[i]; break; }
      }
      if (!vungChon) vungChon = totNhat || 'giua';
    }
    // Mồi: lấy mồi có tỷ lệ cắn tốt nhất (đủ mẫu, tỷ lệ > 0), chưa có thì Ngọc Hà.
    var moiTot = null, moiTotTiLe = -1;
    Object.keys(ratesMoi).forEach(function (k) {
      var r = ratesMoi[k];
      if (r.quang >= CFG.tiLeToiThieuMau) {
        var t = tiLeCan(r);
        if (t > 0 && t > moiTotTiLe) { moiTot = k; moiTotTiLe = t; }
      }
    });
    var moiChon = moiTot || 'ngoc_ha';
    TARGETS.auto.moi = moiChon;
    TARGETS.auto.moiTen = MOI_TEN[moiChon] || moiChon;
    TARGETS.auto.duPhong = (moiChon === 'van_khau') ? 'ngoc_ha' : 'van_khau';
    TARGETS.auto.duPhongTen = MOI_TEN[TARGETS.auto.duPhong];
    moiDaChon = null; // để damBaoMoi chọn lại mồi mới
    doiVung(vungChon);
    log('Tự động' + (lyDo ? ' (' + lyDo + ')' : '') + ': chọn vùng ' + VUNG_TEN[vungChon] +
      ' (cắn ' + pct(tiLeCan(ratesVung[vungChon])) + ') + mồi ' + TARGETS.auto.moiTen + '.');
  }

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
  // - Mục tiêu thường: xoay vùng theo thứ tự của mục tiêu (như v2).
  // - Tự động: chọn lại vùng theo tỷ lệ (loại vùng vừa không cắn).
  function ghiNhanKhongCan() {
    demKhongCan += 1;
    if (demKhongCan >= CFG.khongCanDoiVung) {
      var vungCu = vungHien;
      demKhongCan = 0;
      if (target === 'auto') {
        chonTuDong(vungCu, '2 lần không cắn ở ' + VUNG_TEN[vungCu]);
      } else {
        var vungMoi = vungTiepTheo();
        doiVung(vungMoi);
        log('Không thấy cắn ở vùng ' + VUNG_TEN[vungCu] + ' — đang tìm chỗ khác (vùng ' + VUNG_TEN[vungMoi] + ').');
      }
    }
  }
  // Đã cắn ở vùng hiện tại → ghi nhớ là "chỗ" đã tìm thấy, giữ vùng đó;
  // ghi tỷ lệ cắn + ghi nhận "luồng" hiện tại là vùng này.
  function ghiNhanCan() {
    if (choTimDuoc !== vungHien) {
      choTimDuoc = vungHien;
      log('Tìm thấy chỗ! Cá cắn ở vùng ' + VUNG_TEN[vungHien] + ' — giữ vùng này.');
    }
    demKhongCan = 0;
    var v = castVung || vungHien;
    var m = castMoi || moiDangDung;
    if (ratesVung[v]) ratesVung[v].can += 1;
    if (ratesMoi[m]) ratesMoi[m].can += 1;
    luongHienTai = v; // luồng hiện tại = vùng vừa cắn
    luuRates();
    renderRates();
    renderLuong();
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
    if (key === 'auto') chonTuDong(null); // chọn ngay vùng + mồi theo tỷ lệ đã có
    setTargetLine();
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, panelHead, panelBody, miniBar, miniStatusEl, statusEl, statsEl, logEl, toggleBtn, targetLineEl, luongEl, ratesEl, zoneBtns = {}, targetBtns = {};
  var collapsed = false; // bảng đang thu nhỏ?
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
      '<div id="tt2d-fish-head" style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>🎣 Tool câu Hồ Tây v3</b>' +
        '<span>' +
          '<button id="tt2d-fish-min" title="Thu nhỏ bảng" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
          '<button id="tt2d-fish-hide" title="Ẩn bảng (tool vẫn chạy nếu đang BẬT)" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 2px">×</button>' +
        '</span>' +
      '</div>' +
      '<div id="tt2d-fish-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>🎣 Hồ Tây v3</b>' +
        '<span id="tt2d-fish-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-fish-expand" title="Mở rộng bảng" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-fish-body">' +
      '<div style="margin:8px 0">Mục tiêu: ' +
        '<button data-target="linh" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Linh Ngư</button> ' +
        '<button data-target="yeu" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Yêu Ngư</button> ' +
        '<button data-target="giao" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Giao Ngư</button> ' +
        '<button data-target="tudo" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#6b4d16;color:#ffe9b0;cursor:pointer">Tự do</button> ' +
        '<button data-target="auto" title="Tự chọn vùng + mồi theo tỷ lệ cắn tốt nhất đã quan sát" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Tự động ★</button>' +
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
      '<div id="tt2d-fish-luong" style="margin:4px 0;color:#ffd27a">Luồng: chưa có (chưa thấy cá cắn)</div>' +
      '<div id="tt2d-fish-rates" style="color:#c9f2c9"></div>' +
      '<div id="tt2d-fish-log" style="margin-top:6px;max-height:96px;overflow:auto;color:#d8c9a3;font-size:11px"></div>' +
      '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">Chỉ bấm nút của game. Dừng khi rời hồ. Tool không thấy được luồng cá thật và không đổi được tỷ lệ cắn của server — chỉ chọn vùng/mồi theo tỷ lệ đã quan sát.</div>' +
      '</div>';
    document.body.appendChild(panel);

    panelHead = panel.querySelector('#tt2d-fish-head');
    panelBody = panel.querySelector('#tt2d-fish-body');
    miniBar = panel.querySelector('#tt2d-fish-mini');
    miniStatusEl = panel.querySelector('#tt2d-fish-mini-status');
    toggleBtn = panel.querySelector('#tt2d-fish-toggle');
    statusEl = panel.querySelector('#tt2d-fish-status');
    statsEl = panel.querySelector('#tt2d-fish-stats');
    logEl = panel.querySelector('#tt2d-fish-log');
    targetLineEl = panel.querySelector('#tt2d-fish-target');
    luongEl = panel.querySelector('#tt2d-fish-luong');
    ratesEl = panel.querySelector('#tt2d-fish-rates');

    toggleBtn.addEventListener('click', function () { setOn(!on); });
    panel.querySelector('#tt2d-fish-hide').addEventListener('click', function () {
      panel.style.display = 'none';
    });
    panel.querySelector('#tt2d-fish-min').addEventListener('click', function () { setCollapsed(true); });
    panel.querySelector('#tt2d-fish-expand').addEventListener('click', function () { setCollapsed(false); });
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
    renderRates();
    renderLuong();
    renderMini();
  }

  // Thu nhỏ / mở rộng bảng. Khi thu nhỏ chỉ còn 1 thanh (tên + trạng thái ngắn + nút ＋).
  function setCollapsed(v) {
    collapsed = v;
    if (panelHead) panelHead.style.display = v ? 'none' : '';
    if (panelBody) panelBody.style.display = v ? 'none' : '';
    if (miniBar) miniBar.style.display = v ? 'flex' : 'none';
    if (panel) panel.style.width = v ? '230px' : '248px';
    renderMini();
  }
  function renderMini() {
    if (!miniStatusEl) return;
    miniStatusEl.textContent = (on ? 'BẬT' : 'TẮT') + ' · ' + VUNG_TEN[vungHien] +
      ' · Quăng ' + stats.cast + ' · Cắn ' + pct(tiLeCan(ratesVung[vungHien]));
  }
  function renderLuong() {
    if (!luongEl) return;
    if (luongHienTai) {
      luongEl.textContent = 'Luồng: ' + VUNG_TEN[luongHienTai] + ' (tỷ lệ cắn ' + pct(tiLeCan(ratesVung[luongHienTai])) + ')';
    } else {
      luongEl.textContent = 'Luồng: chưa có (chưa thấy cá cắn)';
    }
  }
  function renderRates() {
    if (!ratesEl) return;
    var html = '<div style="color:#ffd27a">Tỷ lệ (quăng/cắn/được):</div>';
    ['nong', 'giua', 'sau'].forEach(function (z) {
      var r = ratesVung[z];
      html += '<div>' + VUNG_TEN[z] + ': ' + r.quang + 'q · ' + r.can + ' cắn ' + pct(tiLeCan(r)) +
        ' · ' + r.cauDuoc + ' được</div>';
    });
    var moiKeys = Object.keys(ratesMoi).filter(function (k) { return ratesMoi[k].quang > 0; });
    if (moiKeys.length) {
      html += '<div style="color:#ffd27a">Mồi:</div>';
      moiKeys.forEach(function (k) {
        var r = ratesMoi[k];
        html += '<div>' + (MOI_TEN[k] || k) + ': ' + r.quang + 'q · ' + r.can + ' cắn ' + pct(tiLeCan(r)) +
          ' · ' + r.cauDuoc + ' được</div>';
      });
    }
    html += '<div><a href="#" id="tt2d-fish-reset-rates" style="color:#9a8a6a">Xóa dữ liệu tỷ lệ</a></div>';
    ratesEl.innerHTML = html;
    var rs = ratesEl.querySelector('#tt2d-fish-reset-rates');
    if (rs) rs.addEventListener('click', function (ev) { ev.preventDefault(); xoaRates(); });
    renderLuong();
  }

  function setStatus(s) { if (statusEl) statusEl.textContent = s; renderMini(); }
  function setTargetLine() {
    if (!targetLineEl) return;
    var tg = TARGETS[target];
    var moiTen = moiDangDung === 'giun' ? 'Giun Đất' : (moiDangDung === tg.moi ? tg.moiTen : tg.duPhongTen);
    targetLineEl.textContent = 'Mục tiêu: ' + tg.ten + ' · Mồi: ' + moiTen +
      ' · Vùng: ' + VUNG_TEN[vungHien] +
      (choTimDuoc ? ' · Đã tìm thấy chỗ ✓' : ' · Đang tìm chỗ…');
    renderLuong();
  }
  function setStats() {
    if (statsEl) {
      statsEl.textContent = 'Quăng ' + stats.cast + ' · Giật ' + stats.jerk +
        ' · Kéo ' + stats.pull + ' · Côn ' + stats.con;
    }
    renderMini();
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
      if (target === 'auto') chonTuDong(null); // chọn lại vùng + mồi theo tỷ lệ mới nhất
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

    // Quăng cần: nút hiện 'Quăng' HOẶC tool đang idle và đã tới lúc quăng lại
    // (nút có thể hiện tên vùng Nông/Giữa/Sâu thay vì 'Quăng').
    if (t === 'Quăng' || (state === 'idle' && now >= nextCastAt)) {
      // Kết thúc một lượt kéo/câu → chuẩn bị quăng lại.
      if (state === 'pulling' || state === 'jerking' || state === 'waiting') {
        if (state === 'pulling') ghiNhanCauDuoc(); // kéo xong → tính là câu được 1 con
        if (holding) release(); // buông nút đang giữ (vd giữ dây lúc kéo) để quăng lại được
        state = 'idle';
        nextCastAt = now + randInt(CFG.recastDelayMin, CFG.recastDelayMax);
      }
      if (state === 'idle' && now >= nextCastAt) {
        // Nút không hiện 'Quăng' (vd hiện tên vùng) thì dây có thể vẫn còn trong nước — thu cần trước.
        if (t !== 'Quăng') {
          var thu3 = thuCanBtn();
          if (thu3) {
            thu3.click();
            log('Thu cần trước khi quăng lại.');
            nextCastAt = now + 1500;
            return;
          }
          // Không có nút thu cần — dây đã thu rồi, cứ quăng.
        }
        // Trước mỗi lần quăng: đảm bảo đúng mồi cho mục tiêu (mồi có thể đã hết)
        damBaoMoi();
        state = 'casting';
        var holdMs = CFG.castHoldMs[vungHien] + randInt(-15, 15);
        var cv = vungHien, cm = moiDangDung; // snapshot vùng/mồi của lượt quăng này
        if (press()) {
          setStatus('Đang quăng cần (' + TARGETS[target].ten + ', vùng ' + VUNG_TEN[vungHien] + ', giữ ~' + holdMs + 'ms)…');
          setTimeout(function () {
            release();
            stats.cast += 1;
            state = 'waiting';
            lastCastAt = Date.now();
            ghiNhanQuang(cv, cm);
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

    // Timeout cho lúc đang chờ cá cắn — áp dụng cả khi nút không hiện 'Giật'
    // (vd nút hiện tên vùng Nông/Giữa/Sâu): quá 60s không cắn thì thu cần, quăng lại.
    // (Không áp dụng khi nút là 'Giật!' để khỏi bỏ lỡ lúc phao chìm.)
    if (state === 'waiting' && t !== 'Giật!' && lastCastAt && now - lastCastAt > CFG.waitBiteTimeoutMs) {
      var thu2 = thuCanBtn();
      if (thu2) { thu2.click(); log('Chờ cắn quá 60s — thu cần, quăng lại.'); }
      ghiNhanKhongCan(); // không cắn ở vùng này → đếm để đổi vùng tìm chỗ
      state = 'idle';
      nextCastAt = now + 1000;
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
        ghiNhanCan(); // đã cắn ở vùng này → ghi nhớ là "chỗ" đã tìm thấy + ghi tỷ lệ + luồng
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
  taiRates(); // nạp lại dữ liệu tỷ lệ đã lưu (nếu có)
  buildPanel();
  setInterval(tick, CFG.pollMs);
  setStatus('Chưa bật — vào Hồ Tây, đứng ở cầu câu rồi bấm BẬT.');
  setTargetLine();
  log('Tool đã nạp (v3). Mặc định TẮT.');
  // Điều khiển từ Console khi cần debug: __TT2D_FISH__.start() / .stop() /
  // .setTarget('linh'|'yeu'|'giao'|'tudo'|'auto') / .status()
  // (_tick và _cfg chỉ để test/debug.)
  window.__TT2D_FISH__ = {
    start: function () { setOn(true); },
    stop: function () { setOn(false); },
    setTarget: function (k) { datMucTieu(k); },
    setCollapsed: function (v) { setCollapsed(!!v); },
    status: function () {
      var moiOut = {};
      Object.keys(ratesMoi).forEach(function (k) { moiOut[k] = rateObj(ratesMoi[k]); });
      return {
        on: on, state: state, holding: holding, target: target, vung: vungHien,
        choTimDuoc: choTimDuoc, moi: moiDangDung, stats: stats,
        tiLe: {
          vung: { nong: rateObj(ratesVung.nong), giua: rateObj(ratesVung.giua), sau: rateObj(ratesVung.sau) },
          moi: moiOut,
        },
        luongHienTai: luongHienTai,
      };
    },
    _tick: tick,
    _cfg: CFG,
  };
})();
