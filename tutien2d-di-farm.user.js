// ==UserScript==
// @name         Tu Tiên 2D — Đi Farm (Tự đi tới bãi farm rồi bật Auto)
// @namespace    https://tutienpixel.online/
// @version      1.1.0
// @description  Chọn bãi farm (preset hoặc nhập tay map/khu/x/y) — tool lái nhân vật bằng joystick thật (dispatch PointerEvent lên #joystick sau khi vá setPointerCapture), đọc vị trí/map/HP/khu từ DOM (#hud-pos, #hud-map, #value-hp, Bảng Khu), đổi khu qua biển KHU, tới nơi bật Auto + Chạy + Phi Hành để farm. Không dùng window.__ns_ (không tồn tại live). Không tự hồi sinh, không tiêu Linh Thạch, không ghi danh gì.
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// TOOL ĐI FARM v1.1.0 — sửa lỗi gốc khiến tool không di chuyển được live
// (Thanh báo 05:51 26/11, ảnh thanhvan2 ở Rừng Trúc (12,28)).
//
// ---- NGUYÊN NHÂN GỐC (xác minh từ game.js client 24/11) ----
// 1) game.js bọc TOÀN BỘ code trong 1 IIFE `;(function(){ var __ns_ = {}; ... })();`
//    — `__ns_` là biến LOCAL trong IIFE, KHÔNG BAO GIỜ gán lên window
//    (grep `window.X =` cả file chỉ có 1 cái: `window.__PNTT_BROWSER_GUARDS__`).
//    Vậy `window.__ns_` là `undefined` trên trang thật trong MỌI ngữ cảnh
//    (userscript, console, Playwright). Mọi tool đọc `window.__ns_` đều mù
//    hoàn toàn live. Test smoke v1.0.0 chỉ PASS vì harness TỰ MOCK
//    `window.__ns_` — đó là lý do test xanh mà live không chạy.
//    => v1.1.0 KHÔNG dùng `window.__ns_` ở bất cứ chỗ nào (chỉ nhắc tới
//    trong comment này). Mọi trạng thái đều đọc từ DOM.
// 2) Handler joystick của game: pointerdown gọi `a.setPointerCapture(pointerId)`
//    KHÔNG try/catch rồi mới set trạng thái kéo `s={pointerId,cx,cy,radius,
//    deadzone}`; pointermove chỉ chạy `if(s)` rồi gọi `Input.setJoystick`.
//    Với PointerEvent giả (pointerId tự đặt), setPointerCapture throw
//    NotFoundError -> handler dừng giữa chừng -> `s` không bao giờ được set
//    -> nhân vật KHÔNG NHÚC NHÍCH. => v1.1.0 vá `Element.prototype.
//    setPointerCapture` (+ releasePointerCapture) bằng wrapper try/catch
//    nuốt lỗi ngay khi nạp (hành vi thật không đổi).
//
// ---- ĐÃ XÁC MINH từ game.js client 24/11 (xem ~/workspace/tu-tien-2d-di-farm/NOTES.md) ----
// - TILE = 32; tâm ô (cx,cy) theo pixel = (cx*32+16, cy*32+16).
// - #hud-pos text = "( x , y )" (ô hiện tại); #hud-map text = tên map.
// - #value-hp text = "hp / hpMax" (vd "319 / 319").
// - #downed (DownedUI): hiện khi nhân vật gục; #downed-badge text "Trọng Thương · Ns".
// - Joystick: #joystick (+ #joystick-thumb); hình học như code game:
//   radius = min(w,h)/2 - min(thumbW,thumbH)/2 - 4 (thumb mặc định 58);
//   deadzone = min(8, 0.18*radius). Hướng kéo = vector từ tâm tới điểm chạm.
// - Bảng Khu (#khu-panel .khu-overlay): ô khu hiện tại có class "dang",
//   khu đầy có class "day", ghi chú .khu-note = "Đang ở khu N. ...".
//   Bấm ô khu hiện tại chỉ đóng bảng (vô hại); bấm khu khác gửi yêu cầu đổi
//   khu lên server, server từ chối nếu đầy -> xác nhận bằng cách mở lại bảng.
// - Đồ thị cổng (portals, trích từ MapData + code build động, xem NOTES.md):
//   làng<->Rừng Trúc, làng<->Miếu Hoang, làng<->Bãi Đá (39,14)/(39,15),
//   Rừng Trúc<->Dược Cốc, Dược Cốc<->Hồ Tây/Vườn Cá, Miếu<->Phong Địa (0,6),
//   Bãi Đá<->Mỏ (19-24,10), Bãi Đá<->MTC (9-11,0), MTC<->Bãi Đá (14-16,25),
//   Mỏ<->Thung Lũng (38,16), Thung Lũng<->Bát Quái, Long Uyên<->Hang Động
//   (22,4, byHand — cần bấm "Vào"/Tương tác).
//   Cổng làng (22,4)->MTC ĐÃ BỊ BUILDER XÓA (filter trong code MTC) nên
//   KHÔNG có trong đồ thị; Rừng Mãng Xà->làng cũng bị xóa.
// - Nút HUD (#btn-auto-touch, #btn-fly, #btn-run, #btn-attack,
//   #btn-fishing-stop-touch) CHỈ bind "pointerdown" — .click() là no-op,
//   phải dùng tap() (pointerdown+pointerup+click). Nút [data-uu-tien]
//   trong Cài Đặt thì bấm bằng .click().
// - Phi Hành: KHÔNG đọc được trạng thái thật từ DOM (class nút #btn-fly đã
//   xác minh live là sai) — tool bấm theo class, kiểm tra lại bằng tốc độ
//   farm như quy tắc chặng (xem log/panel).
// - Cổng game mở ngay khi nhân vật BƯỚC LÊN ĐÚNG Ô cổng (checkPortal);
//   cổng byHand thì phải bấm Tương tác ("Vào") khi đứng gần.
// - Hằng game: kẹt St=6s, chờ cổng Ft=8s, repath Pt=0.6s (tool lấy mốc này).
//
// ---- CHƯA XÁC MINH — cần test live (không đoán mò, ghi rõ ở preset) ----
// - Tọa độ riêng của bãi Phong Địa Khu 3 (preset dùng điểm an toàn (30,27)).
// - Thảo Dược Cốc Khu 16: preset dùng (18,16) là BẾN CÂU đã xác minh đi được,
//   chưa xác minh là bãi farm tốt.
// - Bãi Đá tầng trên: preset dùng (10,5) là điểm hẹn Bãi Đá đã xác minh,
//   chưa xác minh là bãi farm tốt.
// - Mỏ Linh Thạch: preset dùng (3,13) là điểm vào từ Bãi Đá (xác minh 24/11),
//   chưa xác minh là bãi farm tốt. (v1.0.0 dùng (4,27) là SAI — không phải
//   điểm spawn nào trong client 24/11.)
// - Cổng byHand Long Uyên (22,4)->Hang Động: cơ chế bấm "Vào" chưa xác minh
//   live (tool bấm #btn-attack rồi chờ đổi map; không qua thì báo rõ).
// - Ngưỡng HP 35% là theo mô tả của Thanh (không có hằng số này trong
//   client — game chỉ có DOWNED.ONSPOT_HP=.35 cho hồi sinh tại chỗ).
// - Biển KHU Phong Địa (30,20): có trong ghi chú chặng live, farm.js dùng
//   [34,15],[30,19] — tool thử lần lượt [34,15],[30,19],[30,20].
// - Joystick trên trình duyệt desktop: game chỉ hiện #touch-ui khi bật chế
//   độ Chạm (Menu -> Chạm); tool tự gỡ class "hidden" của #touch-ui /
//   #joystick khi cần, nếu vẫn không thấy thì dừng và báo rõ.
(function () {
'use strict';
if (window.__TT2D_DIFARM__) return; // chống nạp trùng 2 bảng

// ---------------- Vá setPointerCapture (CHẠY ĐẦU TIÊN) ----------------
// Game gọi a.setPointerCapture(pointerId) KHÔNG try/catch trong handler
// joystick. PointerEvent giả (pointerId tự đặt) làm Chrome throw
// NotFoundError -> handler dừng giữa chừng, không bao giờ kéo được.
// Vá: giữ nguyên hàm gốc, bọc try/catch nuốt lỗi (hành vi thật không đổi).
var joyPatchApplied = false;
function patchPointerCapture() {
  try {
    var proto = Element.prototype;
    // Cờ gắn trên CHÍNH hàm đang cài (không gắn lên prototype): nếu ai đó
    // thay hàm khác vào (vd. test gỡ vá để chứng minh vá là cần thiết) thì
    // cờ biến mất cùng hàm cũ và lần gọi sau vá lại được. Gắn cờ lên
    // prototype sẽ kẹt: hàm đã bị thay mà cờ vẫn báo "đã vá".
    if (proto.setPointerCapture && proto.setPointerCapture.__TT2D_DIFARM_PATCHED__) { joyPatchApplied = true; return true; }
    var origCap = proto.setPointerCapture;
    var origRel = proto.releasePointerCapture;
    if (typeof origCap === 'function') {
      proto.setPointerCapture = function (pid) {
        try { return origCap.call(this, pid); } catch (e) { return; }
      };
      proto.setPointerCapture.__TT2D_DIFARM_PATCHED__ = true;
    }
    if (typeof origRel === 'function') {
      proto.releasePointerCapture = function (pid) {
        try { return origRel.call(this, pid); } catch (e) { return; }
      };
      proto.releasePointerCapture.__TT2D_DIFARM_PATCHED__ = true;
    }
    joyPatchApplied = true;
    return true;
  } catch (e) { return false; }
}
patchPointerCapture();

// ---------------- Cấu hình ----------------
var CFG = {
  tile: 32,               // CONFIG.TILE
  hitboxW: 16,            // CONFIG.PLAYER.HITBOX_W (chỉ để ghi chú, không dùng)
  hitboxH: 12,            // CONFIG.PLAYER.HITBOX_H (chỉ để ghi chú, không dùng)
  tickMs: 250,            // nhịp kiểm tra vòng lái
  joyMoveMs: 100,         // nhịp gửi pointermove khi đang kéo joystick
  stuckMs: 6000,          // game St = 6s không đổi ô -> kẹt
  detourMs: 2500,         // lái vuông góc mỗi lần đi vòng (2-3s)
  repathMax: 4,           // kẹt quá 4 lần đi vòng -> dừng
  portalWaitMs: 8000,     // game Ft = 8s chờ đổi map ở cổng
  nudgeWaitMs: 3000,      // chờ đổi map sau mỗi lần đẩy cổng bằng joystick
  zoneWaitMs: 3000,       // chờ khu đổi sau khi bấm [data-khu]
  boardWaitMs: 4000,      // chờ bảng khu hiện sau khi bấm Tương Tác
  boardDataMs: 2500,      // chờ dữ liệu khu từ server (class day/dang) sau khi mở bảng
  legTimeoutMs: 180000,   // tối đa 180s cho 1 chặng đi (tới cổng / biển / đích)
  fightWaitMs: 5000,      // bật Auto đánh trả tối đa 5s khi nghi quái chặn
  hpStopRatio: 0.35,      // HP < 35% -> tự dừng (theo mô tả của Thanh)
  arrivePx: 32,           // tới đích khi cách tâm đích < 1 ô (32px)
  portalPx: 16,           // tới cổng khi cách tâm ô cổng < nửa ô (16px)
  joyMag: 0.75,           // độ kéo joystick (0..1) khi lái
  joyPointerId: 987654321, // pointerId giả DUY NHẤT cho cả chuỗi down/move/up
};

// ---------------- Đồ thị cổng (trích từ MapData client 24/11) ----------------
// Mỗi cổng: {tx, ty, to} (+ byHand:true nếu cần bấm Tương tác để vào).
// Spawn ở map đích không cần ghi — tool đọc vị trí từ #hud-pos sau khi qua.
var PORTALS = {
  tan_vien: [
    { tx: 7, ty: 29, to: 'thanh_truc_lam' }, { tx: 8, ty: 29, to: 'thanh_truc_lam' },
    { tx: 0, ty: 12, to: 'mieu_hoang' }, { tx: 0, ty: 13, to: 'mieu_hoang' },
    { tx: 39, ty: 14, to: 'bai_da_hang_gio' }, { tx: 39, ty: 15, to: 'bai_da_hang_gio' },
    // (22,4)->dong_mach_ngam ĐÃ BỊ BUILDER XÓA (filter trong code MTC) — không có ở đây.
  ],
  thanh_truc_lam: [
    { tx: 7, ty: 0, to: 'tan_vien' }, { tx: 8, ty: 0, to: 'tan_vien' },
    { tx: 12, ty: 29, to: 'duoc_vien' }, { tx: 13, ty: 29, to: 'duoc_vien' },
    { tx: 39, ty: 13, to: 'long_uyen' }, { tx: 39, ty: 14, to: 'long_uyen' },
  ],
  duoc_vien: [
    { tx: 12, ty: 0, to: 'thanh_truc_lam' }, { tx: 13, ty: 0, to: 'thanh_truc_lam' },
    { tx: 11, ty: 6, to: 'vuon_ca_nhan' }, { tx: 11, ty: 7, to: 'vuon_ca_nhan' },
    { tx: 0, ty: 20, to: 'van_can' }, { tx: 0, ty: 21, to: 'van_can' },
  ],
  vuon_ca_nhan: [
    { tx: 8, ty: 12, to: 'duoc_vien' }, { tx: 9, ty: 12, to: 'duoc_vien' },
  ],
  van_can: [
    { tx: 55, ty: 13, to: 'duoc_vien' }, { tx: 55, ty: 14, to: 'duoc_vien' },
  ],
  mieu_hoang: [
    { tx: 19, ty: 6, to: 'tan_vien' }, { tx: 19, ty: 7, to: 'tan_vien' },
    { tx: 0, ty: 6, to: 'phong_dia' }, { tx: 0, ty: 7, to: 'phong_dia' },
  ],
  phong_dia: [
    { tx: 39, ty: 14, to: 'mieu_hoang' }, { tx: 39, ty: 15, to: 'mieu_hoang' },
  ],
  bai_da_hang_gio: [
    { tx: 0, ty: 27, to: 'tan_vien' }, { tx: 0, ty: 28, to: 'tan_vien' },
    { tx: 19, ty: 10, to: 'mo_linh_thach' }, { tx: 20, ty: 10, to: 'mo_linh_thach' },
    { tx: 21, ty: 10, to: 'mo_linh_thach' }, { tx: 22, ty: 10, to: 'mo_linh_thach' },
    { tx: 23, ty: 10, to: 'mo_linh_thach' }, { tx: 24, ty: 10, to: 'mo_linh_thach' },
    { tx: 9, ty: 0, to: 'dong_mach_ngam' }, { tx: 10, ty: 0, to: 'dong_mach_ngam' },
    { tx: 11, ty: 0, to: 'dong_mach_ngam' },
  ],
  mo_linh_thach: [
    { tx: 1, ty: 13, to: 'bai_da_hang_gio' }, { tx: 1, ty: 14, to: 'bai_da_hang_gio' },
    { tx: 38, ty: 16, to: 'thach_phong_thung_lung' }, { tx: 38, ty: 17, to: 'thach_phong_thung_lung' },
  ],
  thach_phong_thung_lung: [
    { tx: 1, ty: 27, to: 'mo_linh_thach' },
    { tx: 38, ty: 2, to: 'bat_quai_thach_phan' },
  ],
  bat_quai_thach_phan: [
    { tx: 0, ty: 29, to: 'thach_phong_thung_lung' },
    { tx: 0, ty: 30, to: 'thach_phong_thung_lung' },
  ],
  dong_mach_ngam: [
    { tx: 14, ty: 25, to: 'bai_da_hang_gio' }, { tx: 15, ty: 25, to: 'bai_da_hang_gio' },
    { tx: 16, ty: 25, to: 'bai_da_hang_gio' },
  ],
  long_uyen: [
    { tx: 0, ty: 14, to: 'thanh_truc_lam' }, { tx: 0, ty: 15, to: 'thanh_truc_lam' },
    { tx: 22, ty: 4, to: 'hang_dong_co', byHand: true },
  ],
  hang_dong_co: [
    { tx: 14, ty: 19, to: 'long_uyen' }, { tx: 15, ty: 19, to: 'long_uyen' },
  ],
  rung_mang_xa: [
    { tx: 18, ty: 0, to: 'mach_dat_dong' }, { tx: 19, ty: 0, to: 'mach_dat_dong' },
    // (18,29),(19,29)->tan_vien ĐÃ BỊ XÓA (filter client 24/11) — không có ở đây.
  ],
  mach_dat_dong: [
    { tx: 20, ty: 29, to: 'rung_mang_xa' }, { tx: 21, ty: 29, to: 'rung_mang_xa' },
    { tx: 39, ty: 14, to: 'dam_lay_boss' }, { tx: 39, ty: 15, to: 'dam_lay_boss' },
  ],
  dam_lay_boss: [
    { tx: 0, ty: 14, to: 'mach_dat_dong' }, { tx: 0, ty: 15, to: 'mach_dat_dong' },
  ],
};
// BFS qua đồ thị cổng — cùng ngữ nghĩa với MapData.routeNextHop của game:
// trả cổng bước đầu {tx, ty, to, byHand} hoặc null (cùng map / không có đường).
function nextHop(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return null;
  var seen = {}, q = [];
  seen[fromId] = true;
  var first = PORTALS[fromId] || [];
  for (var i = 0; i < first.length; i++) {
    var h = first[i];
    if (!h.to || seen[h.to]) continue;
    if (h.to === toId) return h;
    seen[h.to] = true;
    q.push({ mapId: h.to, first: h });
  }
  while (q.length) {
    var cur = q.shift();
    var list = PORTALS[cur.mapId] || [];
    for (var j = 0; j < list.length; j++) {
      var h2 = list[j];
      if (!h2.to || seen[h2.to]) continue;
      if (h2.to === toId) return cur.first;
      seen[h2.to] = true;
      q.push({ mapId: h2.to, first: cur.first });
    }
  }
  return null;
}

// ---------------- Map + biển KHU + preset ----------------
// sign: tọa độ biển KHU của map (đứng sát để bấm "Tương tác với Bảng Khu").
// safe: điểm an toàn mặc định của map (= spawn của map trong client 24/11;
//   dùng khi đổi Map mà chưa chọn preset — KHÔNG BAO GIỜ để Map và X/Y
//   thuộc 2 map khác nhau, xem bug v1.0.0 ở dưới).
var MAPS = {
  phong_dia:      { ten: 'Phong Địa',            sign: [[34, 15], [30, 19], [30, 20]], safe: [37, 14] },
  duoc_vien:      { ten: 'Thảo Dược Cốc',        sign: [[14, 5]], safe: [12, 2] },
  dong_mach_ngam: { ten: 'Miếu Ông Trường Con',  sign: [[11, 22]], safe: [15, 22] },
  hang_dong_co:   { ten: 'Hang Động',            sign: [[14, 16]], safe: [14, 16] },
  bai_da_hang_gio:{ ten: 'Bãi Đá',               sign: null, safe: [3, 28] },
  mo_linh_thach:  { ten: 'Mỏ Linh Thạch',        sign: null, safe: [3, 27] },
  thach_phong_thung_lung: { ten: 'Thung Lũng (Thạch Phong)', sign: null, safe: [3, 27] },
  mieu_hoang:     { ten: 'Miếu Hoang',           sign: null, safe: [18, 6] },
  tan_vien:       { ten: 'Chân Núi Tản Viên',    sign: null, safe: [8, 26] },
  thanh_truc_lam: { ten: 'Rừng Trúc',            sign: null, safe: [7, 2] },
};
// Tên HUD -> map id (đọc #hud-map).
var HUD_MAP = [
  [/Hồ Tây/, 'van_can'], [/Thảo Dược Cốc/, 'duoc_vien'],
  [/Rừng Trúc/, 'thanh_truc_lam'], [/Chân Núi Tản Viên/, 'tan_vien'],
  [/Miếu Ông Trường Con/, 'dong_mach_ngam'], [/Bãi Đá/, 'bai_da_hang_gio'],
  [/Miếu Hoang/, 'mieu_hoang'], [/Phong Địa/, 'phong_dia'],
  [/Hang Động/, 'hang_dong_co'], [/Mỏ Linh Thạch/, 'mo_linh_thach'],
  [/Thung Lũng/, 'thach_phong_thung_lung'],
  [/Bát Quái/, 'bat_quai_thach_phan'],
  [/Long Uyên/, 'long_uyen'],
  [/Rừng Mãng Xà/, 'rung_mang_xa'], [/Lòng Đất/, 'mach_dat_dong'],
  [/Đầm Lầy/, 'dam_lay_boss'], [/Vườn Cá/, 'vuon_ca_nhan'],
  [/Thiên Đạo|Chính Đảo/, 'thien_dao_khuyet'],
  [/Tam Lộ/, 'tam_lo'], [/Đại Hội/, 'dai_hoi_cho'],
  [/Vạn Hoang|Chiến Trường/, 'chien_truong'], [/Huyết Xích/, 'huyet_xich'],
];
// Map không có đường bộ đi ra (phó bản / sự kiện) — báo rõ thay vì đi lạc.
var KHONG_DUONG = { tam_lo: 1, dai_hoi_cho: 1, dai_hoi_dau: 1, chien_bang_dai: 1, dai_hoi_doi: 1, san_dau_vip: 1, chien_truong: 1, huyet_xich: 1, yen_lang: 1, lam_lang: 1 };

var PRESETS = [
  { id: 'pd11',   ten: 'Phong Địa Khu 11 (30,27)',      map: 'phong_dia',       khu: 11, x: 30, y: 27 },
  { id: 'pd20',   ten: 'Phong Địa Khu 20 (18,22)',      map: 'phong_dia',       khu: 20, x: 18, y: 22 },
  { id: 'pd3',    ten: 'Phong Địa Khu 3 — CHƯA XÁC MINH tọa độ', map: 'phong_dia', khu: 3, x: 30, y: 27 },
  { id: 'dc16',   ten: 'Thảo Dược Cốc Khu 16 — CHƯA XÁC MINH bãi', map: 'duoc_vien', khu: 16, x: 18, y: 16 },
  { id: 'bd',     ten: 'Bãi Đá tầng trên — CHƯA XÁC MINH bãi', map: 'bai_da_hang_gio', khu: 0, x: 10, y: 5 },
  { id: 'mo',     ten: 'Mỏ Linh Thạch (3,13) — CHƯA XÁC MINH bãi', map: 'mo_linh_thach', khu: 0, x: 3, y: 13 },
  { id: 'mtc',    ten: 'Miếu Ông Trường Con (15,22)',   map: 'dong_mach_ngam',  khu: 12, x: 15, y: 22 },
];

// ---------------- Trạng thái ----------------
var state = 'idle'; // idle|dang-di|toi-noi|da-dung|ket|khong-duong|chua-qua-cong|hp-thap|guc|khu-day|loi
var msg = 'Chưa đi. Chọn bãi rồi bấm ĐI.';
var target = { map: 'phong_dia', khu: 11, x: 30, y: 27 };
var farmKhiToi = true;
var runToken = 0;
var logLines = [];
var steerCalls = 0, detourCount = 0, joyStopCalls = 0, autoOnCount = 0;
var lastHop = null;
var khuHienTai = null; // khu đọc được từ Bảng Khu (null = chưa rõ)
var soKhuHienTai = 40; // số khu của map hiện tại (đọc từ bảng, mặc định 40)
var hpAvailable = false; // đã thấy #value-hp lần nào chưa

// ---------------- Helper DOM ----------------
function $(s) { return document.querySelector(s); }
function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function txt(el) { return el ? (el.innerText || el.textContent || '') : ''; }
function log(s) {
  logLines.push(s);
  if (logLines.length > 6) logLines.shift();
  renderLog();
}

// ---------------- Đọc trạng thái game (CHỈ từ DOM) ----------------
// Vị trí PIXEL hiện tại — nguồn chính: #hud-pos "( x , y )".
function docViTriPx() {
  var hp = $('#hud-pos');
  var t = hp ? (hp.innerText || hp.textContent || '') : '';
  var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (m) return { x: parseInt(m[1], 10) * CFG.tile + CFG.tile / 2, y: parseInt(m[2], 10) * CFG.tile + CFG.tile / 2 };
  return null;
}
function docCell() {
  var v = docViTriPx();
  if (!v) return null;
  return { x: Math.floor(v.x / CFG.tile), y: Math.floor(v.y / CFG.tile) };
}
function docMapId() {
  var hm = $('#hud-map');
  var s = hm ? (hm.innerText || hm.textContent || '').trim() : '';
  if (s) {
    for (var i = 0; i < HUD_MAP.length; i++) {
      if (HUD_MAP[i][0].test(s)) return HUD_MAP[i][1];
    }
  }
  // Fallback: quét text toàn trang (kém tin cậy vì panel tool cũng chứa tên map).
  var t = document.body ? (document.body.innerText || '') : '';
  for (var j = 0; j < HUD_MAP.length; j++) {
    if (HUD_MAP[j][0].test(t)) return HUD_MAP[j][1];
  }
  return null;
}
function tenMap(id) { return (MAPS[id] && MAPS[id].ten) || id || '?'; }
// Khu hiện tại: CHỈ biết sau khi đã mở Bảng Khu đọc được (xem docKhuTuBang).
// null = chưa rõ (KHÔNG đoán). Đừng hiển thị "?" như là đã biết.
function docKhu() { return khuHienTai; }
function docSoKhu() { return soKhuHienTai; }
// HP: #value-hp text = "hp / max" (vd "319 / 319"). null nếu không thấy.
function docHP() {
  var el = $('#value-hp');
  if (!el) return null;
  var t = (el.innerText || el.textContent || '').trim();
  var m = t.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  hpAvailable = true;
  return { hp: parseInt(m[1], 10), max: parseInt(m[2], 10) };
}
// Gục: bảng #downed hiện (DownedUI). #downed-badge nằm TRONG #downed —
// khi #downed ẩn (class hidden) thì badge cũng ẩn theo, nên KHÔNG được
// đọc riêng badge: badge không có class hidden của riêng nó và text luôn
// chứa "Trọng Thương" → đọc riêng sẽ báo gục NHẦM 100% thời gian.
// (Lỗi này test smoke bắt được: mọi chặng đều dừng ngay với state 'guc'.)
function docGuc() {
  var d = $('#downed');
  if (d) return !d.classList.contains('hidden');
  var b = $('#downed-badge');
  if (b && !b.classList.contains('hidden') && /Trọng Thương/.test(txt(b))) return true;
  return false;
}

// ---------------- Bấm nút game: tap() thay .click() ----------------
// (Nút HUD chỉ bind "pointerdown", .click() là no-op.)
function tap(el) {
  if (!el) return;
  var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
  var x = r ? r.left + r.width / 2 : 0, y = r ? r.top + r.height / 2 : 0;
  function ev(ty) {
    return new PointerEvent(ty, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true });
  }
  el.dispatchEvent(ev('pointerdown'));
  el.dispatchEvent(ev('pointerup'));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
}
function btnOn(sel) { var b = $(sel); return !!(b && b.classList.contains('active')); }
function autoDangBat() { return btnOn('#btn-auto') || btnOn('#btn-auto-touch'); }
// Phi Hành: chỉ còn class nút để đọc (đã xác minh live là class này SAI —
// xem log/panel; kiểm tra lại bằng tốc độ farm, bấm lại tay nếu cần).
function flyDangBat() { return btnOn('#btn-fly'); }
function runDangBat() { return btnOn('#btn-run'); }
function datAuto(bat) {
  bat = !!bat;
  if (autoDangBat() === bat) return true;
  var b = $('#btn-auto-touch') || $('#btn-auto');
  if (!b) return false;
  if (bat) autoOnCount++;
  tap(b);
  return true; // game tiêu thụ cờ toggle ở frame sau — bấm đúng 1 lần
}
function datFly(bat) {
  bat = !!bat;
  if (flyDangBat() === bat) return true;
  var b = $('#btn-fly');
  if (!b) return false;
  tap(b);
  return true;
}
function datRun(bat) {
  bat = !!bat;
  if (runDangBat() === bat) return true;
  var b = $('#btn-run');
  if (!b) return false;
  tap(b);
  return true;
}
function datUuTienQuai() {
  var b = document.querySelector('[data-uu-tien="quai"]');
  if (!b) return false;
  if (!b.classList.contains('on')) b.click();
  return true;
}
// Bật bộ 3 farm: Auto + Chạy trước, Phi Hành CUỐI.
async function batBoFarm() {
  datUuTienQuai();
  datAuto(true);
  await sleep(400);
  datRun(true);
  await sleep(400);
  datFly(true);
  await sleep(400);
  if (!flyDangBat()) datFly(true); // thử lại 1 lần nếu Phi Hành chưa bật
  return autoDangBat();
}
function stopFishing() {
  var b = $('#btn-fishing-stop-touch');
  if (b && b.offsetParent !== null) { tap(b); return true; }
  return false;
}

// ---------------- Lái bằng joystick thật (PointerEvent) ----------------
// Một phiên kéo: pointerdown 1 lần ở tâm #joystick, pointermove lặp lại
// theo hướng cần đi, pointerup khi xong. Dùng CÙNG MỘT pointerId cho cả
// chuỗi (như ngón tay thật). Nhờ đã vá setPointerCapture nên handler
// joystick của game không throw nữa.
var joy = { active: false, geom: null, lastDx: 0, lastDy: 0 };
// Hình học joystick như code game: radius = min(w,h)/2 - thumb/2 - 4;
// deadzone = min(8, 0.18*radius). Trả null nếu không đo được.
function joyGeom() {
  var el = $('#joystick');
  if (!el) return null;
  var r = el.getBoundingClientRect();
  if (!r || !r.width || !r.height) return null;
  var th = $('#joystick-thumb');
  var tr = th ? th.getBoundingClientRect() : null;
  var tsize = (tr && tr.width > 0) ? Math.min(tr.width, tr.height) : 58;
  var radius = Math.min(r.width, r.height) / 2 - tsize / 2 - 4;
  if (!(radius > 0)) return null;
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: radius };
}
// Trên desktop game ẩn #touch-ui (chỉ hiện khi bật chế độ Chạm) -> rect = 0.
// Thử gỡ class "hidden" của #touch-ui / #joystick rồi đo lại.
function hienJoystick() {
  var root = $('#touch-ui');
  if (root) root.classList.remove('hidden');
  var el = $('#joystick');
  if (el) el.classList.remove('hidden');
  var g = joyGeom();
  if (g) log('Joystick đang ẩn — đã tự hiện lại để lái.');
  return g;
}
function joyDown() {
  if (joy.active) return true;
  var g = joyGeom() || hienJoystick();
  if (!g) return false;
  var el = $('#joystick');
  if (!el) return false;
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: g.cx, clientY: g.cy, pointerId: CFG.joyPointerId, isPrimary: true }));
  joy.active = true;
  joy.geom = g;
  joy.lastDx = 0; joy.lastDy = 0;
  return true;
}
function joyMoveTo(dx, dy) {
  if (!joy.active && !joyDown()) return false;
  var g = joy.geom || joyGeom();
  if (!g) return false;
  var x = g.cx + dx * CFG.joyMag * g.radius;
  var y = g.cy + dy * CFG.joyMag * g.radius;
  var el = $('#joystick');
  if (!el) return false;
  el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: CFG.joyPointerId, isPrimary: true }));
  joy.lastDx = dx; joy.lastDy = dy;
  return true;
}
function joyUp() {
  if (!joy.active) return;
  joyStopCalls++;
  var el = $('#joystick');
  var g = joy.geom;
  if (el && g) {
    var x = g.cx + joy.lastDx * CFG.joyMag * g.radius;
    var y = g.cy + joy.lastDy * CFG.joyMag * g.radius;
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: CFG.joyPointerId, isPrimary: true }));
  }
  joy.active = false;
  joy.geom = null;
  joy.lastDx = 0; joy.lastDy = 0;
}
// Đẩy joystick về 1 hướng trong ms mili-giây (dùng nudge qua cổng).
async function joyHold(dx, dy, ms) {
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var t0 = Date.now();
  if (!joyDown()) return false;
  while (Date.now() - t0 < ms) {
    if (!joyMoveTo(dx / len, dy / len)) break;
    await sleep(CFG.joyMoveMs);
  }
  joyUp();
  await sleep(250);
  return true;
}

// ---------------- Kiểm tra an toàn mỗi nhịp ----------------
function kiemTraAnToan() {
  if (docGuc()) return { ok: false, reason: 'guc', msg: 'Nhân vật đã gục — tool KHÔNG tự hồi sinh. Bấm DỪNG rồi xử lý tay.' };
  var h = docHP();
  if (h && h.max && h.max > 0 && h.hp / h.max < CFG.hpStopRatio) {
    return { ok: false, reason: 'hp-thap',
      msg: 'Khí Huyết dưới 35% (' + h.hp + '/' + h.max + ') — đã tự dừng để an toàn.' };
  }
  return { ok: true };
}

// ---------------- Lái tới 1 ô bằng joystick ----------------
// Trả {ok:true} khi tới nơi (cách tâm đích <= arrivePx), hoặc
// {ok:false, reason, msg} với reason: ket|hp-thap|guc|dung|het-gio|
// doi-map|loi. Kẹt: ô không đổi 6s -> đánh trả (Auto 1 lần) rồi lái
// vuông góc 2-3s; quá 4 lần -> dừng.
async function steerToCell(tx, ty, opts) {
  opts = opts || {};
  var arrivePx = (typeof opts.arrivePx === 'number') ? opts.arrivePx : CFG.arrivePx;
  var label = opts.label || ('ô (' + tx + ',' + ty + ')');
  var tok = runToken;
  var mapStart = docMapId();
  var t0 = Date.now();
  var lastCell = null, stillMs = 0, detours = 0, detourSign = 1, fightTried = false;
  var toXpx = tx * CFG.tile + CFG.tile / 2;
  var toYpx = ty * CFG.tile + CFG.tile / 2;
  steerCalls++;
  try {
    while (true) {
      if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
      var at = kiemTraAnToan();
      if (!at.ok) return { ok: false, reason: at.reason, msg: at.msg };
      // Đổi map giữa chừng (bước lên ô cổng / Auto lạc qua cổng): dừng chặng
      // này ngay — vòng đi chính tự đánh giá lại từ map mới.
      var mapNow = docMapId();
      if (mapNow && mapStart && mapNow !== mapStart) {
        return { ok: false, reason: 'doi-map', msg: 'Đã sang map ' + tenMap(mapNow) + '.' };
      }
      if (Date.now() - t0 > CFG.legTimeoutMs) {
        return { ok: false, reason: 'het-gio', msg: 'Quá ' + Math.round(CFG.legTimeoutMs / 1000) + 's chưa tới ' + label + ' — đã dừng.' };
      }
      var v = docViTriPx();
      if (!v) { await sleep(CFG.tickMs); continue; }
      var dist = Math.hypot(v.x - toXpx, v.y - toYpx);
      if (dist <= arrivePx) return { ok: true };
      var cell = { x: Math.floor(v.x / CFG.tile), y: Math.floor(v.y / CFG.tile) };
      // Kẹt: ô (#hud-pos) không đổi — game: |dx|+|dy| < 0.5 mỗi frame, St=6s.
      if (lastCell && lastCell.x === cell.x && lastCell.y === cell.y) stillMs += CFG.tickMs;
      else stillMs = 0;
      lastCell = cell;
      if (stillMs >= CFG.stuckMs) {
        if (!fightTried) {
          // Nghi quái chặn đường: bật Auto đánh trả rồi đi tiếp. Chỉ thử
          // 1 lần mỗi chặng đi (theo cơ chế "Tự Đi" của Thanh). Đồng bộ lại
          // phiên kéo TRƯỚC khi đánh trả: game có thể đã hủy trạng thái kéo
          // (VD: qua cổng rồi bị đẩy về ngay — tool vẫn tưởng joystick đang
          // kéo, còn game thì không) — ngắt rồi kéo lại cho chắc, không thì
          // mọi pointermove sau đó đều bị game bỏ qua. Kéo lại xong đẩy
          // NGAY về hướng đích (không thì joystick ở tâm, nhân vật đứng yên
          // và Auto không với tới quái chặn).
          joyUp();
          joyDown();
          var fdx = toXpx - v.x, fdy = toYpx - v.y;
          var fl = Math.hypot(fdx, fdy) || 1;
          joyMoveTo(fdx / fl, fdy / fl);
          fightTried = true;
          stillMs = 0;
          log('Có thể quái chặn đường — bật Auto đánh trả rồi đi tiếp.');
          datAuto(true);
          var tF = Date.now();
          var moved = false;
          while (Date.now() - tF < CFG.fightWaitMs) {
            if (tok !== runToken) { datAuto(false); return { ok: false, reason: 'dung', msg: 'Đã dừng.' }; }
            var a2 = kiemTraAnToan();
            if (!a2.ok) { datAuto(false); return { ok: false, reason: a2.reason, msg: a2.msg }; }
            var v2 = docViTriPx();
            if (v2) {
              var c2 = { x: Math.floor(v2.x / CFG.tile), y: Math.floor(v2.y / CFG.tile) };
              if (c2.x !== lastCell.x || c2.y !== lastCell.y) { moved = true; break; }
            }
            await sleep(CFG.tickMs);
          }
          datAuto(false);
          if (moved) { log('Đánh trả xong, đi tiếp.'); }
          else log('Đánh trả không nhúc nhích — thử đi vòng.');
          lastCell = null;
          continue;
        }
        detours++;
        stillMs = 0;
        if (detours > CFG.repathMax) {
          return { ok: false, reason: 'ket', msg: 'Kẹt đường tới ' + label + ' — đã thử đi vòng ' + CFG.repathMax + ' lần.' };
        }
        detourCount++;
        log('Kẹt — đi vòng (lần ' + detours + '/' + CFG.repathMax + ').');
        // Lái vuông góc với hướng đích trong detourMs, rồi thử lại.
        var ddx = toXpx - v.x, ddy = toYpx - v.y;
        var dl = Math.hypot(ddx, ddy) || 1;
        var px = -ddy / dl * detourSign, py = ddx / dl * detourSign;
        detourSign = -detourSign; // lần sau đi vòng hướng ngược lại
        var tD = Date.now();
        while (Date.now() - tD < CFG.detourMs) {
          if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
          var a3 = kiemTraAnToan();
          if (!a3.ok) return { ok: false, reason: a3.reason, msg: a3.msg };
          if (docMapId() && mapStart && docMapId() !== mapStart) {
            return { ok: false, reason: 'doi-map', msg: 'Đã sang map ' + tenMap(docMapId()) + '.' };
          }
          var vD = docViTriPx();
          if (vD) {
            var dd2 = Math.hypot(vD.x - toXpx, vD.y - toYpx);
            if (dd2 <= arrivePx) return { ok: true };
          }
          if (!joyMoveTo(px, py)) {
            return { ok: false, reason: 'loi', msg: 'Không thấy joystick để lái (bật chế độ Chạm trong Menu rồi bấm ĐI lại).' };
          }
          await sleep(CFG.joyMoveMs);
        }
        lastCell = null;
        continue;
      }
      // Lái thẳng về đích.
      var dx = toXpx - v.x, dy = toYpx - v.y;
      var len = Math.hypot(dx, dy) || 1;
      if (!joyMoveTo(dx / len, dy / len)) {
        return { ok: false, reason: 'loi', msg: 'Không thấy joystick để lái (bật chế độ Chạm trong Menu rồi bấm ĐI lại).' };
      }
      await sleep(CFG.tickMs);
    }
  } finally {
    joyUp();
  }
}

// ---------------- Chờ đổi map ----------------
async function choDoiMap(mapCu, waitMs) {
  var tok = runToken;
  var t0 = Date.now();
  while (Date.now() - t0 < waitMs) {
    if (tok !== runToken) return false;
    if (docMapId() && docMapId() !== mapCu) return true;
    await sleep(CFG.tickMs);
  }
  return docMapId() && docMapId() !== mapCu;
}

// ---------------- Đổi khu qua biển KHU (đọc từ Bảng Khu) ----------------
function bangKhuMo() {
  var p = $('#khu-panel');
  return !!(p && !p.classList.contains('hidden') && p.querySelector('[data-khu]'));
}
// Đọc khu hiện tại từ bảng đang mở: ô có class "dang"; khu đầy: class "day".
// Trả {khu, soKhu, day:{}} hoặc null nếu bảng chưa mở / chưa đọc được.
function docKhuTuBang() {
  var btns = $all('#khu-panel .khu-grid [data-khu]');
  if (!btns.length) btns = $all('.khu-grid [data-khu]');
  if (!btns.length) return null;
  var khu = null, day = {};
  btns.forEach(function (b) {
    var k = parseInt(b.getAttribute('data-khu'), 10);
    if (isNaN(k)) return;
    if (b.classList.contains('dang')) khu = k;
    if (b.classList.contains('day')) day[k] = true;
  });
  if (khu === null) {
    var note = $('#khu-panel .khu-note') || $('.khu-note');
    var m = note && txt(note).match(/Đang ở khu\s*(\d+)/);
    if (m) khu = parseInt(m[1], 10);
  }
  return { khu: khu, soKhu: btns.length, day: day };
}
function nutBangKhuHien() {
  var b = $('#btn-attack');
  if (!b) return false;
  var label = (b.getAttribute('aria-label') || '') + ' ' + txt(b);
  return /bảng khu/i.test(label);
}
function dongBangKhu() {
  var x = $('#khu-panel .khu-x');
  if (x) { x.click(); return; }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
}
async function moBangKhu() {
  if (bangKhuMo()) return true;
  var t0 = Date.now();
  while (Date.now() - t0 < CFG.boardWaitMs) {
    if (bangKhuMo()) return true;
    if (nutBangKhuHien()) tap($('#btn-attack'));
    await sleep(250);
    if (bangKhuMo()) return true;
  }
  // Dự phòng: phím Space (game mở bảng khi đứng sát biển).
  document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
  for (var j = 0; j < CFG.boardWaitMs / 500; j++) {
    await sleep(500);
    if (bangKhuMo()) return true;
  }
  return false;
}
// Chờ dữ liệu khu từ server (class day/dang trên các ô) sau khi mở bảng.
async function choDuLieuBang() {
  var t0 = Date.now();
  while (Date.now() - t0 < CFG.boardDataMs) {
    var info = docKhuTuBang();
    if (info && info.khu !== null) {
      var hasCls = $all('#khu-panel .khu-grid [data-khu].day, #khu-panel .khu-grid [data-khu].dong, #khu-panel .khu-grid [data-khu].vang').length > 0;
      if (hasCls) return info;
    }
    await sleep(250);
  }
  return docKhuTuBang();
}
// Trả {ok:true} | {ok:false, reason, msg} | {ok:true, skipped:true}
async function doiKhu(khu) {
  var tok = runToken;
  // Khu đã biết và đã đúng -> không cần làm gì (không mở bảng).
  if (khuHienTai !== null && khuHienTai === khu) return { ok: true };
  var info0 = null;
  var info = MAPS[target.map];
  if (!info || !info.sign) {
    log('Map ' + tenMap(target.map) + ' chưa biết biển KHU — farm tại khu hiện tại.');
    return { ok: true, skipped: true };
  }
  if (khu < 1) {
    return { ok: false, reason: 'ket', msg: 'Khu đích không hợp lệ (' + khu + ').' };
  }
  var toiBien = null;
  for (var s = 0; s < info.sign.length; s++) {
    var sg = info.sign[s];
    var r = await steerToCell(sg[0], sg[1], { label: 'biển KHU (' + sg[0] + ',' + sg[1] + ')' });
    if (r.ok) { toiBien = sg; break; }
    if (r.reason === 'dung' || r.reason === 'hp-thap' || r.reason === 'guc' || r.reason === 'doi-map' || r.reason === 'loi') return r;
    toiBien = null; // thử biển khác
  }
  if (!toiBien) {
    return { ok: false, reason: 'ket', msg: 'Không tới được biển KHU ở ' + tenMap(target.map) + '.' };
  }
  if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
  var mo = await moBangKhu();
  if (!mo) {
    return { ok: false, reason: 'ket', msg: 'Không mở được Bảng Khu (nút không hiện "Tương tác với Bảng Khu" — đứng chưa sát biển?).' };
  }
  info0 = await choDuLieuBang();
  if (!info0) {
    dongBangKhu();
    return { ok: false, reason: 'ket', msg: 'Mở được Bảng Khu nhưng không đọc được khu hiện tại.' };
  }
  if (info0.khu !== null) { khuHienTai = info0.khu; soKhuHienTai = info0.soKhu; }
  if (khuHienTai === khu) { dongBangKhu(); return { ok: true }; }
  if (khu > info0.soKhu) {
    dongBangKhu();
    return { ok: false, reason: 'ket', msg: 'Khu ' + khu + ' không có (map này chỉ có ' + info0.soKhu + ' khu).' };
  }
  // CHỈ bấm nút [data-khu] — KHÔNG BAO GIỜ bấm Ghi danh tranh khu (20.000 LT).
  // Khu đầy thì nút có class "day" -> báo đầy NGAY, không bấm.
  if (info0.day[khu]) {
    dongBangKhu();
    return { ok: false, reason: 'khu-day', msg: 'Khu ' + khu + ' đầy — đã dừng, chưa đổi khu.' };
  }
  var btn = document.querySelector('#khu-panel [data-khu="' + khu + '"]') ||
            document.querySelector('[data-khu="' + khu + '"]');
  if (!btn) {
    dongBangKhu();
    return { ok: false, reason: 'ket', msg: 'Bảng khu không có ô Khu ' + khu + '.' };
  }
  btn.click();
  // Bấm xong bảng tự đóng. Chờ server xử lý rồi MỞ LẠI bảng để xác nhận
  // (server từ chối nếu khu đầy vào phút chót).
  await sleep(CFG.zoneWaitMs);
  if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
  var mo2 = await moBangKhu();
  if (!mo2) {
    return { ok: false, reason: 'ket', msg: 'Đã bấm Khu ' + khu + ' nhưng không mở lại được Bảng Khu để xác nhận — kiểm tra tay khu hiện tại.' };
  }
  var info2 = await choDuLieuBang();
  dongBangKhu();
  if (info2 && info2.khu !== null) {
    khuHienTai = info2.khu; soKhuHienTai = info2.soKhu;
    if (khuHienTai === khu) return { ok: true };
    return { ok: false, reason: 'khu-day', msg: 'Khu ' + khu + ' đầy (bấm không vào được) — đã dừng, chưa đổi khu.' };
  }
  return { ok: false, reason: 'ket', msg: 'Đã bấm Khu ' + khu + ' nhưng không đọc được khu sau khi đổi — kiểm tra tay.' };
}

// ---------------- Vòng đi chính ----------------
function finish(reason, message) {
  state = reason;
  msg = message;
  log(message);
  renderStatus();
}
async function start() {
  if (state === 'dang-di') return;
  runToken++;
  var tok = runToken;
  state = 'dang-di';
  msg = 'Đang đi tới ' + tenMap(target.map) + ' Khu ' + (target.khu || 'giữ nguyên') + ' (' + target.x + ',' + target.y + ')…';
  log(msg);
  renderStatus();
  // Chuẩn bị như game làm khi bật Tự Đi: tắt Auto, hạ Phi Hành, dừng câu.
  if (autoDangBat()) datAuto(false);
  await sleep(400);
  if (tok !== runToken) return;
  if (flyDangBat()) datFly(false);
  await sleep(400);
  if (tok !== runToken) return;
  stopFishing();
  await sleep(200);
  if (tok !== runToken) return;

  var hops = 0;
  while (true) {
    if (tok !== runToken) return;
    var cur = docMapId();
    if (!cur) { finish('loi', 'Không đọc được map hiện tại — đã dừng.'); return; }
    if (KHONG_DUONG[cur] && cur !== target.map) {
      finish('khong-duong', 'Đang ở ' + tenMap(cur) + ' (phó bản/sự kiện) — không có đường bộ tới ' + tenMap(target.map) + '. Rời map này rồi bấm ĐI lại.');
      return;
    }
    if (cur !== target.map) {
      if (++hops > 50) { finish('loi', 'Đi qua quá nhiều cổng mà chưa tới — đã dừng.'); return; }
      var hop = nextHop(cur, target.map);
      if (!hop) {
        finish('khong-duong', 'Không có đường bộ từ ' + tenMap(cur) + ' tới ' + tenMap(target.map) + ' — 2 map chưa nối cổng. Đi tay về map gần nhất rồi bấm ĐI lại.');
        return;
      }
      lastHop = { from: cur, to: target.map, tx: hop.tx, ty: hop.ty, toMap: hop.to, byHand: !!hop.byHand };
      log('Qua cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + '…');
      var r = await steerToCell(hop.tx, hop.ty, { arrivePx: CFG.portalPx, label: 'cổng (' + hop.tx + ',' + hop.ty + ')' });
      // 'doi-map' = cổng đã mở trong lúc đi (map đổi rồi) — coi như qua cổng
      // xong. 'dung' = người dùng bấm DỪNG (stop() đã đặt state 'da-dung')
      // — trả về lặng, KHÔNG finish() ghi đè.
      if (!r.ok && r.reason === 'dung') return;
      if (!r.ok && r.reason !== 'doi-map') { finish(r.reason, r.msg); return; }
      if (r.ok && hop.byHand) {
        // Cổng byHand (Long Uyên -> Hang Động): đứng trên ô cổng rồi bấm
        // Tương tác ("Vào") mới qua. Chưa xác minh live — không qua thì báo rõ.
        var okB = false;
        for (var b = 0; b < 2 && !okB; b++) {
          if (tok !== runToken) return;
          tap($('#btn-attack'));
          okB = await choDoiMap(cur, CFG.portalWaitMs);
        }
        if (!okB) {
          finish('chua-qua-cong', 'Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + ' — cổng này cần bấm "Vào"/Tương tác tay khi đứng trên ô cổng.');
          return;
        }
      } else if (r.ok) {
        // Tới ô cổng: cổng game mở khi BƯỚC LÊN ô — chờ đổi map (Ft=8s).
        var ok = await choDoiMap(cur, CFG.portalWaitMs);
        if (!ok) {
          // Nudge bằng joystick về phía cổng rồi chờ thêm.
          var nudged = false;
          for (var n = 0; n < 3 && !ok; n++) {
            if (tok !== runToken) return;
            var v = docViTriPx();
            if (v) {
              var dx = hop.tx * CFG.tile + CFG.tile / 2 - v.x;
              var dy = hop.ty * CFG.tile + CFG.tile / 2 - v.y;
              await joyHold(dx, dy, 700);
              nudged = true;
            }
            ok = await choDoiMap(cur, CFG.nudgeWaitMs);
          }
          if (!ok) {
            finish('chua-qua-cong', 'Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + ' — đã thử đẩy 3 lần. Đứng lại kiểm tra tay rồi bấm ĐI lại.');
            return;
          }
          if (nudged) log('Đẩy cổng bằng joystick đã qua.');
        }
      }
      // Sang map mới thì khu chưa rõ nữa — đọc lại từ bảng khi cần đổi khu.
      khuHienTai = null;
      log('Đã sang ' + tenMap(docMapId()) + '.');
      continue;
    }
    // Đã ở map đích.
    if (target.khu) {
      var rk = await doiKhu(target.khu);
      if (!rk.ok && rk.reason === 'dung') return;
      if (!rk.ok && rk.reason === 'doi-map') continue; // lạc sang map khác — đánh giá lại từ đầu
      if (!rk.ok) { finish(rk.reason, rk.msg); return; }
      // Đổi khu xong (hoặc đã đúng khu / map không có biển): đi tiếp tới bãi
      // farm trong CÙNG vòng lặp — KHÔNG continue (continue sẽ gọi lại
      // doiKhu rồi lặp vô hạn vì khu đã đúng).
      if (!rk.skipped) log('Đang ở Khu ' + (khuHienTai === null ? target.khu : khuHienTai) + ' — đi tới bãi farm.');
    }
    var r3 = await steerToCell(target.x, target.y, { label: 'bãi farm (' + target.x + ',' + target.y + ')' });
    if (!r3.ok && r3.reason === 'dung') return;
    if (!r3.ok && r3.reason === 'doi-map') continue; // lạc sang map khác — đánh giá lại từ đầu
    if (!r3.ok) { finish(r3.reason, r3.msg); return; }
    if (farmKhiToi) {
      await batBoFarm();
      finish('toi-noi', 'Đã tới ' + tenMap(target.map) + ' Khu ' + (khuHienTai === null ? '(chưa rõ)' : khuHienTai) + ' (' + target.x + ',' + target.y + ') — đang farm (Auto + Chạy + Phi Hành). Kiểm tra Phi Hành bằng tốc độ farm.');
    } else {
      finish('toi-noi', 'Đã tới ' + tenMap(target.map) + ' Khu ' + (khuHienTai === null ? '(chưa rõ)' : khuHienTai) + ' (' + target.x + ',' + target.y + ') — đã dừng tại chỗ (không bật farm theo yêu cầu).');
    }
    return;
  }
}
function stop() {
  runToken++;
  joyUp();
  if (state === 'dang-di') {
    state = 'da-dung';
    msg = 'Đã dừng — đứng tại chỗ.';
    log(msg);
  }
  renderStatus();
}

// ---------------- Panel (khung gọn, thu nhỏ được) ----------------
var panel = null, bar = null, statusEl = null, logEl = null, contentEl = null;
var collapsed = false, contentCollapsed = false;

function el(tag, attrs, text) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (k === 'style') e.style.cssText = attrs[k];
    else if (k === 'className') e.className = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}
// BUG v1.0.0 (Thanh gặp 05:51 26/11): đổi ô Map tay mà X/Y vẫn giữ giá trị
// của preset cũ -> target.map và (x,y) thuộc 2 map khác nhau ("Đang đi tới
// Rừng Trúc Khu 11 (30,27)" — (30,27) là tọa độ Phong Địa). Sửa: khi đổi
// Map thì reset X/Y về điểm an toàn (spawn) của map đó và chuyển preset
// sang "Tùy chỉnh".
function onMapSelectChange() {
  var m = $('#tt2d-difarm-map');
  if (!m || !MAPS[m.value]) return;
  var safe = MAPS[m.value].safe || [0, 0];
  var x = $('#tt2d-difarm-x'), y = $('#tt2d-difarm-y'), k = $('#tt2d-difarm-khu');
  if (x) x.value = safe[0];
  if (y) y.value = safe[1];
  if (k) k.value = 0;
  var sel = $('#tt2d-difarm-preset');
  if (sel) sel.value = 'tuy-chinh';
  target = { map: m.value, khu: 0, x: safe[0], y: safe[1] };
  saveCfg();
  renderStatus();
}
function buildPanel() {
  if ($('#tt2d-difarm-panel') || $('#tt2d-difarm-bar')) return;
  panel = el('div', { id: 'tt2d-difarm-panel', style: 'position:fixed;top:8px;right:8px;width:300px;z-index:99999;background:rgba(20,16,10,.95);border:1px solid #8a6d3b;border-radius:8px;color:#f0e6d2;font:12px/1.5 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.5);' });
  var head = el('div', { style: 'display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid #8a6d3b;cursor:default;' });
  head.appendChild(el('b', { style: 'flex:1;font-size:13px;' }, 'Đi Farm — Tu Tiên 2D'));
  head.appendChild(el('span', { style: 'color:#c9a86a;font-size:11px;' }, 'v1.1.0'));
  var btnMin = el('button', { style: 'background:#3a2f1d;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;width:22px;height:22px;cursor:pointer;' }, '—');
  btnMin.title = 'Thu nhỏ thành thanh';
  btnMin.addEventListener('click', function () { setCollapsed(true); });
  head.appendChild(btnMin);
  panel.appendChild(head);

  contentEl = el('div', { id: 'tt2d-difarm-content', style: 'padding:8px;' });
  // Hàng chọn preset + thu nhỏ nội dung.
  var rowP = el('div', { style: 'display:flex;gap:4px;align-items:center;margin-bottom:6px;' });
  rowP.appendChild(el('label', { style: 'white-space:nowrap;' }, 'Bãi farm:'));
  var sel = el('select', { id: 'tt2d-difarm-preset', style: 'flex:1;min-width:0;background:#2a2113;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;padding:3px;' });
  PRESETS.forEach(function (p) {
    var o = el('option', { value: p.id }, p.ten);
    sel.appendChild(o);
  });
  var oTu = el('option', { value: 'tuy-chinh' }, '— Tùy chỉnh (nhập tay) —');
  sel.appendChild(oTu);
  sel.addEventListener('change', function () {
    var pr = null;
    PRESETS.forEach(function (p) { if (p.id === sel.value) pr = p; });
    if (pr) {
      $('#tt2d-difarm-map').value = pr.map;
      $('#tt2d-difarm-khu').value = pr.khu;
      $('#tt2d-difarm-x').value = pr.x;
      $('#tt2d-difarm-y').value = pr.y;
      target = { map: pr.map, khu: pr.khu, x: pr.x, y: pr.y };
      saveCfg();
    }
  });
  rowP.appendChild(sel);
  var btnMinC = el('button', { style: 'background:#3a2f1d;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;width:22px;height:22px;cursor:pointer;flex:none;' }, '—');
  btnMinC.title = 'Thu nhỏ nội dung (chỉ hiện trạng thái)';
  btnMinC.addEventListener('click', function () { setContentCollapsed(true); });
  rowP.appendChild(btnMinC);
  contentEl.appendChild(rowP);

  // Nhập tay map/khu/x/y.
  var rowM = el('div', { style: 'display:flex;gap:4px;margin-bottom:6px;align-items:center;' });
  rowM.appendChild(el('label', {}, 'Map:'));
  var selMap = el('select', { id: 'tt2d-difarm-map', style: 'flex:1;min-width:0;background:#2a2113;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;padding:3px;' });
  Object.keys(MAPS).forEach(function (id) {
    selMap.appendChild(el('option', { value: id }, MAPS[id].ten));
  });
  selMap.addEventListener('change', onMapSelectChange);
  rowM.appendChild(selMap);
  contentEl.appendChild(rowM);
  var rowK = el('div', { style: 'display:flex;gap:4px;margin-bottom:6px;align-items:center;' });
  rowK.appendChild(el('label', {}, 'Khu (0=giữ nguyên):'));
  var inKhu = el('input', { id: 'tt2d-difarm-khu', type: 'number', min: '0', max: '40', value: '11', style: 'width:52px;background:#2a2113;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;padding:3px;' });
  rowK.appendChild(inKhu);
  rowK.appendChild(el('label', {}, 'X:'));
  var inX = el('input', { id: 'tt2d-difarm-x', type: 'number', min: '0', value: '30', style: 'width:48px;background:#2a2113;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;padding:3px;' });
  rowK.appendChild(inX);
  rowK.appendChild(el('label', {}, 'Y:'));
  var inY = el('input', { id: 'tt2d-difarm-y', type: 'number', min: '0', value: '27', style: 'width:48px;background:#2a2113;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;padding:3px;' });
  rowK.appendChild(inY);
  contentEl.appendChild(rowK);

  var rowF = el('div', { style: 'margin-bottom:6px;' });
  var cb = el('input', { id: 'tt2d-difarm-farm', type: 'checkbox' });
  cb.checked = farmKhiToi;
  cb.addEventListener('change', function () { farmKhiToi = cb.checked; saveCfg(); });
  rowF.appendChild(cb);
  rowF.appendChild(el('label', { style: 'margin-left:4px;' }, 'Bật Auto + Phi Hành + Chạy để farm khi tới nơi'));
  contentEl.appendChild(rowF);

  var rowB = el('div', { style: 'display:flex;gap:6px;margin-bottom:6px;' });
  var btnGo = el('button', { id: 'tt2d-difarm-go', style: 'flex:1;background:#6b4f1d;color:#fff;border:1px solid #c9a86a;border-radius:4px;padding:5px;cursor:pointer;font-weight:bold;' }, 'ĐI');
  btnGo.addEventListener('click', function () {
    readForm();
    saveCfg();
    start();
  });
  rowB.appendChild(btnGo);
  var btnStop = el('button', { id: 'tt2d-difarm-stop', style: 'flex:1;background:#5a1f1f;color:#fff;border:1px solid #a33;border-radius:4px;padding:5px;cursor:pointer;font-weight:bold;' }, 'DỪNG');
  btnStop.addEventListener('click', function () { stop(); });
  rowB.appendChild(btnStop);
  contentEl.appendChild(rowB);

  statusEl = el('div', { id: 'tt2d-difarm-status', style: 'background:#241c0e;border:1px solid #8a6d3b;border-radius:4px;padding:5px 6px;font-size:11px;min-height:16px;' }, msg);
  contentEl.appendChild(statusEl);
  logEl = el('div', { id: 'tt2d-difarm-log', style: 'margin-top:5px;font-size:11px;color:#c9b896;white-space:pre-wrap;' }, '');
  contentEl.appendChild(logEl);
  contentEl.appendChild(el('div', { style: 'margin-top:6px;color:#9a8a6a;font-size:11px;' },
    'Lái bằng joystick thật (đã vá setPointerCapture). HP < 35% tự dừng. KHÔNG tự hồi sinh, KHÔNG tiêu Linh Thạch, KHÔNG ghi danh. Khu đầy thì dừng + báo rõ. Khu hiện tại chỉ đọc được sau khi mở Bảng Khu. Phi Hành kiểm tra bằng tốc độ farm.'));
  panel.appendChild(contentEl);
  document.body.appendChild(panel);

  bar = el('div', { id: 'tt2d-difarm-bar', style: 'position:fixed;top:8px;right:8px;z-index:99999;background:rgba(20,16,10,.95);border:1px solid #8a6d3b;border-radius:6px;color:#f0e6d2;font:12px/1.4 system-ui,sans-serif;padding:4px 8px;display:none;cursor:pointer;' });
  bar.appendChild(el('b', {}, 'Đi Farm '));
  bar.appendChild(el('span', { id: 'tt2d-difarm-bar-status' }, ''));
  var btnOpen = el('button', { style: 'margin-left:6px;background:#3a2f1d;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;width:22px;height:20px;cursor:pointer;' }, '＋');
  btnOpen.title = 'Mở lại bảng';
  btnOpen.addEventListener('click', function (ev) { ev.stopPropagation(); setCollapsed(false); });
  bar.appendChild(btnOpen);
  document.body.appendChild(bar);
  renderStatus();
}
function readForm() {
  var m = $('#tt2d-difarm-map'), k = $('#tt2d-difarm-khu'),
      x = $('#tt2d-difarm-x'), y = $('#tt2d-difarm-y');
  if (m && MAPS[m.value]) target.map = m.value;
  if (k) target.khu = Math.max(0, parseInt(k.value, 10) || 0);
  if (x) target.x = Math.max(0, parseInt(x.value, 10) || 0);
  if (y) target.y = Math.max(0, parseInt(y.value, 10) || 0);
  var cb = $('#tt2d-difarm-farm');
  if (cb) farmKhiToi = cb.checked;
  // Bấm ĐI = chặng mới: khu đọc được trước đó có thể đã cũ — đọc lại từ bảng.
  khuHienTai = null;
}
function saveCfg() {
  try {
    localStorage.setItem('tt2d_difarm_cfg', JSON.stringify({ target: target, farmKhiToi: farmKhiToi }));
  } catch (e) { /* bỏ qua */ }
}
function loadCfg() {
  try {
    var s = JSON.parse(localStorage.getItem('tt2d_difarm_cfg') || 'null');
    if (!s) return;
    if (s.target && MAPS[s.target.map]) target = s.target;
    if (typeof s.farmKhiToi === 'boolean') farmKhiToi = s.farmKhiToi;
  } catch (e) { /* bỏ qua */ }
}
function setCollapsed(v) {
  collapsed = !!v;
  if (panel) panel.style.display = collapsed ? 'none' : 'block';
  if (bar) bar.style.display = collapsed ? 'block' : 'none';
  renderStatus();
}
function setContentCollapsed(v) {
  contentCollapsed = !!v;
  if (!contentEl || !statusEl) return;
  // Thu nhỏ nội dung: chỉ hiện trạng thái (+ nút mở lại).
  var kids = contentEl.children;
  for (var i = 0; i < kids.length; i++) {
    if (kids[i] !== statusEl) kids[i].style.display = contentCollapsed ? 'none' : '';
  }
  if (contentCollapsed) {
    var b = document.getElementById('tt2d-difarm-expand');
    if (!b) {
      b = el('button', { id: 'tt2d-difarm-expand', style: 'margin-top:4px;background:#3a2f1d;color:#f0e6d2;border:1px solid #8a6d3b;border-radius:4px;padding:2px 8px;cursor:pointer;' }, '＋ Mở lại');
      b.addEventListener('click', function () { setContentCollapsed(false); });
      contentEl.appendChild(b);
    }
    b.style.display = '';
  } else {
    var b2 = document.getElementById('tt2d-difarm-expand');
    if (b2) b2.style.display = 'none';
  }
}
function renderStatus() {
  var c = docCell();
  var cur = docMapId();
  var khuTxt = (khuHienTai === null ? '(chưa rõ)' : khuHienTai);
  var s = 'Hiện tại: ' + tenMap(cur) + ' Khu ' + khuTxt +
    (c ? ' (' + c.x + ',' + c.y + ')' : '') +
    ' → Đích: ' + tenMap(target.map) + ' Khu ' + (target.khu || 'giữ nguyên') +
    ' (' + target.x + ',' + target.y + ')' +
    ' — ' + msg;
  if (statusEl) statusEl.textContent = s;
  var bs = document.getElementById('tt2d-difarm-bar-status');
  if (bs) bs.textContent = '· ' + state + ' · ' + msg;
}
function renderLog() {
  if (logEl) logEl.textContent = logLines.join('\n');
}

// ---------------- Khởi động ----------------
loadCfg();
if (document.body) buildPanel();
else document.addEventListener('DOMContentLoaded', buildPanel);
// Cập nhật dòng trạng thái mỗi 2s (vị trí hiện tại).
setInterval(function () { if (state !== 'dang-di') renderStatus(); }, 2000);

window.__TT2D_DIFARM__ = {
  version: '1.1.0',
  start: start,
  stop: stop,
  setTarget: function (t) {
    if (t.map && MAPS[t.map]) target.map = t.map;
    if (typeof t.khu === 'number') target.khu = t.khu;
    if (typeof t.x === 'number') target.x = t.x;
    if (typeof t.y === 'number') target.y = t.y;
    if (typeof t.farmKhiToi === 'boolean') farmKhiToi = t.farmKhiToi;
    // Đổi đích = chặng mới: khu đọc được trước đó có thể đã cũ (đăng nhập
    // lại có thể rơi vào khu khác cùng map) — bắt buộc đọc lại từ bảng.
    khuHienTai = null;
    saveCfg();
  },
  setPreset: function (id) {
    var pr = null;
    PRESETS.forEach(function (p) { if (p.id === id) pr = p; });
    if (!pr) return false;
    target = { map: pr.map, khu: pr.khu, x: pr.x, y: pr.y };
    var sel = $('#tt2d-difarm-preset');
    if (sel) sel.value = id;
    var m = $('#tt2d-difarm-map'); if (m) m.value = pr.map;
    var k = $('#tt2d-difarm-khu'); if (k) k.value = pr.khu;
    var x = $('#tt2d-difarm-x'); if (x) x.value = pr.x;
    var y = $('#tt2d-difarm-y'); if (y) y.value = pr.y;
    saveCfg();
    renderStatus();
    return true;
  },
  state: function () { return state; },
  status: function () {
    var c = docCell();
    return {
      state: state, msg: msg, map: docMapId(), khu: khuHienTai,
      x: c ? c.x : null, y: c ? c.y : null,
      target: { map: target.map, khu: target.khu, x: target.x, y: target.y },
      farmKhiToi: farmKhiToi,
      steerCalls: steerCalls, detourCount: detourCount,
      joyStopCalls: joyStopCalls, autoOnCount: autoOnCount,
      joyPatchApplied: joyPatchApplied,
      hpAvailable: hpAvailable,
      lastHop: lastHop,
    };
  },
  presets: function () { return PRESETS.map(function (p) { return p.id; }); },
  setCollapsed: setCollapsed,
  setContentCollapsed: setContentCollapsed,
  _patchCapture: patchPointerCapture,
  _graph: PORTALS,
  _cfg: CFG,
};
})();
