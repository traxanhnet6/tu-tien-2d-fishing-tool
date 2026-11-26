// ==UserScript==
// @name         Tu Tiên 2D — Đi Farm (Tự đi tới bãi farm rồi bật Auto)
// @namespace    https://tutienpixel.online/
// @version      1.2.0
// @description  Chọn bãi farm (preset hoặc nhập tay map/khu/x/y) — tool tự dò cách lái (phím → joystick → dpad → chạm neo camera), lái bằng cách thắng, BẬT Chạy + Phi Hành trong lúc di chuyển và giữ qua cổng, tới nơi tự bật Auto + Chạy + Phi Hành để farm. Đọc vị trí/map/HP/khu từ DOM (#hud-pos, #hud-map, #value-hp, Bảng Khu). Không dùng window.__ns_ (không tồn tại live). Không tự hồi sinh, không tiêu Linh Thạch, không ghi danh gì.
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// TOOL ĐI FARM v1.2.0 — tích hợp code Thanh gửi 07:04–07:06 26/11
// ("Mã này có thể di chuyển thử tích hợp vào tools đã có" +
//  "Thêm bật phi hành + chạy khi chạy tools" +
//  "Đến map tự bật auto+phi hành+ chạy").
// Code gửi: ~/workspace/tu-tien-2d-di-farm/code-thanh-gui-v1.5.0.user.js
// ("Tool Tu Tiên Pixel — Tự đi farm + Việc Dược Công" v1.5.0).
//
// ---- LẤY TỪ CODE GỬI (đã đối chiếu từng cái với game.js client 24/11) ----
// - Lái đa cách, tự dò 1 lần/phiên: phím (KeyW/A/S/D) -> joystick -> dpad
//   (.dpad-btn data-dx/data-dy) -> chạm neo camera (tapCanvas + anchor).
//   Phím: game Input map e.code, theo dõi phím giữ qua keydown/keyup,
//   `isTrusted` xuất hiện 0 lần trong game.js -> KeyboardEvent tổng hợp
//   lái được; dispatch lên document.body (bubbles). Giữ 2 phím khi đi
//   chéo, không nhúc nhích thì chuyển giữ từng trục (diagOk).
// - Phi Hành + Chạy BẬT TRONG LÚC DI CHUYỂN, giữ bật qua cổng (bật lại
//   sau mỗi lần đổi map); qua cổng không được khi bay thì hạ cánh, đi bộ
//   qua, rồi bay lại (mẫu tryCrossPortal của code gửi).
// - Kiểm chứng Phi Hành bằng TỐC ĐỘ: đợt lái đầu đủ dài (>=800ms, >=2 ô)
//   mà <3 ô/s thì bấm lại 1 lần duy nhất (KeyF), không bấm lần 3 mù.
// - Chạm neo camera: tapCanvas lên canvas game (game: handler `window
//   pointerup`, tap <500ms và <14px -> Input.tap = screenToBuffer(...),
//   không kiểm isTrusted, không setPointerCapture); neo = ô tại tâm canvas
//   (chạm tâm rồi đọc vị trí); chạm làm xa đích >2 ô -> bỏ neo, neo lại.
//   SỬA so với code gửi: cập nhật neo sau đợt chạm = ô nhân vật (camera
//   game bám theo nhân vật) thay vì vị trí - điểm chạm/px (công thức đó
//   giả định camera đứng yên trong đợt chạm, lệch cả quãng vừa đi).
// - Dừng khi chạm/phím THẬT (isTrusted=true ngoài panel).
// - Kích thước map w/h, spawn, điểm farm, cổng duoc_vien<->van_can — xem
//   ghi chú đối chiếu ở dưới (chỉ thêm cái đã xác minh từ MapData).
//
// ---- KHÔNG LẤY TỪ CODE GỬI (và vì sao) ----
// - Đọc map/HP qua #hud-where và #row-hp: CẢ HAI đều KHÔNG tồn tại trong
//   game.js (0 hit) -> giữ cách đọc #hud-map + #value-hp của v1.1.0.
// - Đồ thị cổng của code gửi: THIẾU phong_dia + bai_da_hang_gio + cổng
//   đông làng (39,14)/(39,15) và CÓ cổng làng (22,4)->MTC đã bị builder
//   xóa -> giữ nguyên đồ thị v1.1.0, chỉ thêm (18,22) MTC->làng (có thật
//   trong MapData dong_mach_ngam, targetSpawn (22,6)).
// - Kích thước van_can: code gửi ghi 56x40, MapData ghi o=56,b=36 -> lấy
//   56x36. Điểm farm Rừng Trúc (20,15): ô 'L' (nước sen) bị chặn -> dùng
//   (14,15) đã xác minh đi được (vùng 5x5 toàn ô mở).
// - Kiểu tới nơi của code gửi: HẠ CÁNH rồi chỉ bật Auto — trái lệnh Thanh
//   07:06 (tới map tự bật auto+phi hành+chạy) -> giữ thứ tự batBoFarm
//   của v1.1.0 (ưu tiên 'Quái' -> Auto -> Chạy -> Phi Hành CUỐI).
// - Vòng Dược Công của code gửi (tapNpc xoắn ốc + bấm bước nhiệm vụ):
//   KHÔNG làm trong lượt này (chỉ Đi Farm) — đánh giá chuyển sang Tool
//   Dược ở báo cáo bàn giao, xem NOTES.md.
// - Hiệu chuẩn px/ô (calibrate): KHÔNG lấy — chạm dùng mặc định 32px/ô
//   (= CONFIG.TILE, đã xác minh) + neo camera tự hiệu chỉnh; hiệu chuẩn
//   bằng chạm đo (4 lần chạm thử mỗi trục) tốn thời gian và dễ đo rác
//   khi chạm tìm đường không ổn định.
//
// ---- ĐÃ XÁC MINH từ game.js client 24/11 cho v1.2.0 (xem NOTES.md) ----
// - Phím: keydown listener trên window, e.code KeyW/A/S/D + Arrow*,
//   n.keys[dir] theo dõi phím giữ; handler bỏ qua e.repeat cho hành
//   động 1 lần; keyup xóa phím; blur xóa hết. KeyT/KeyR -> _autoToggle;
//   KeyF -> _flyToggle; Shift (trái/phải) cũng toggle Run.
// - #btn-run bind pointerdown -> Input.toggleRun(); onRunChange toggle
//   class "active" trên #btn-run và #joystick-run (class Chạy đáng tin).
// - #btn-fly: game có hàm đồng bộ class "active" theo player.flying,
//   NHƯNG live đã xác minh class này SAI (v1.1.0) -> chỉ dùng làm gợi ý,
//   kiểm chứng thật bằng tốc độ (xem trên).
// - .dpad-btn tồn tại (data-dx/data-dy); handler pointerdown gọi
//   setPointerCapture KHÔNG try/catch (như joystick) -> nhờ vá v1.1.0.
// - Tap-to-move: Input.queueTap(x,y,clientX,clientY) tồn tại; handler
//   `window pointerup`: tap <500ms, <14px -> Input.tap =
//   Renderer.screenToBuffer(clientX,clientY); không kiểm isTrusted.
// - Kích thước map (w x h): tan_vien 40x30, thanh_truc_lam 40x30,
//   duoc_vien 40x30, hang_dong_co 30x20, long_uyen 40x30, mieu_hoang
//   20x14, van_can 56x36, vuon_ca_nhan 18x13, dong_mach_ngam 36x24,
//   bai_da_hang_gio 40x30, phong_dia 40x30, mo_linh_thach 40x30.
// - Spawn đã xác minh (khớp hết code gửi): tan_vien (8,26),
//   thanh_truc_lam (7,2), duoc_vien (12,2), hang_dong_co (14,16),
//   long_uyen (2,14), mieu_hoang (18,6), van_can (33,31),
//   vuon_ca_nhan (8,10), dong_mach_ngam (16,19),
//   thach_phong_thung_lung (3,27).
// - Điểm farm code gửi, đối chiếu lưới đất + legend riêng từng map:
//   Rừng Trúc (20,15)='L' nước sen CHẶN -> thay bằng (14,15)='.' mở;
//   Thảo Dược Cốc (20,15)='~' sỏi ĐI ĐƯỢC; Hang Động (15,10)='.'
//   ĐI ĐƯỢC; Miếu Hoang (10,7)='s' nền đá ĐI ĐƯỢC; Hồ Tây (33,31)
//   = spawn ĐI ĐƯỢC. (Chú ý: '~' ở map khác có thể là nước chặn —
//   chỉ kết luận theo legend riêng từng map.)
// - Camera bám nhân vật: nhân vật hiện ở (W/2, 0.6*H) trên màn hình
//   (không phải đúng tâm canvas) — neo camera đo bằng chạm tâm + đọc
//   vị trí thật nên vẫn đúng; neo sau đợt chạm = ô nhân vật (camera bám).
//   Nếu live camera đứng yên trong đợt chạm thì neo này lệch, cảnh báo
//   thoái lui (>2 ô) sẽ bỏ neo và neo lại. Chưa xác minh live.
//
// ---- CHƯA XÁC MINH — cần test live (không đoán mò, ghi rõ ở preset) ----
// - Toàn bộ động cơ lái mới (phím/dpad/chạm) + dò cách lái + bay trong
//   lúc di chuyển + hạ cánh qua cổng: chỉ mới qua test smoke.
// - Phím lái KHI ĐANG BAY: handler phím là cùng code path với đi bộ
//   (n.keys) nên rất có thể dùng được, nhưng chưa có bằng chứng live.
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
  detectMs: 1200,         // mỗi cách lái dò giữ hướng 1,2s (xem detectSteerMethod)
  dpadAltMs: 400,         // luân phiên 2 trục dpad mỗi 400ms khi không có nút chéo
  flySpeedMin: 3,         // ô/s — bay dưới ngưỡng này là chưa ăn (kiểm chứng bằng tốc độ)
  flyCheckMs: 800,        // đợt lái đầu dài >=800ms mới đo tốc độ bay
  pxPerTile: 32,          // px/ô cho chạm neo camera (mặc định = CONFIG.TILE)
  tapStableMs: 800,       // đứng yên bao lâu thì coi là ổn định (chờ sau chạm)
  detourMinMs: 3000,      // đợt đi vòng tối thiểu cho phím/dpad/chạm (chậm hơn joystick)
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
    // (18,22)->tan_vien có thật trong MapData dong_mach_ngam
    // (targetSpawn (22,6), label "Ra Chân Núi") — thêm từ code gửi v1.2.0.
    { tx: 18, ty: 22, to: 'tan_vien' },
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
// w/h: kích thước map (ô) theo MapData client 24/11 — dùng để chặn biên
//   khi nhập tọa độ (v1.2.0, lấy từ code gửi sau khi đối chiếu).
var MAPS = {
  phong_dia:      { ten: 'Phong Địa',            sign: [[34, 15], [30, 19], [30, 20]], safe: [37, 14], w: 40, h: 30 },
  duoc_vien:      { ten: 'Thảo Dược Cốc',        sign: [[14, 5]], safe: [12, 2], w: 40, h: 30 },
  dong_mach_ngam: { ten: 'Miếu Ông Trường Con',  sign: [[11, 22]], safe: [15, 22], w: 36, h: 24 },
  hang_dong_co:   { ten: 'Hang Động',            sign: [[14, 16]], safe: [14, 16], w: 30, h: 20 },
  bai_da_hang_gio:{ ten: 'Bãi Đá',               sign: null, safe: [3, 28], w: 40, h: 30 },
  mo_linh_thach:  { ten: 'Mỏ Linh Thạch',        sign: null, safe: [3, 27], w: 40, h: 30 },
  thach_phong_thung_lung: { ten: 'Thung Lũng (Thạch Phong)', sign: null, safe: [3, 27], w: 40, h: 30 },
  mieu_hoang:     { ten: 'Miếu Hoang',           sign: null, safe: [18, 6], w: 20, h: 14 },
  tan_vien:       { ten: 'Chân Núi Tản Viên',    sign: null, safe: [8, 26], w: 40, h: 30 },
  thanh_truc_lam: { ten: 'Rừng Trúc',            sign: null, safe: [7, 2], w: 40, h: 30 },
  van_can:        { ten: 'Hồ Tây',               sign: null, safe: [33, 31], w: 56, h: 36 },
  long_uyen:      { ten: 'Long Uyên Cốc',        sign: null, safe: [2, 14], w: 40, h: 30 },
  vuon_ca_nhan:   { ten: 'Vườn Cá Nhân',         sign: null, safe: [8, 10], w: 18, h: 13 },
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
  // Preset mới v1.2.0 (điểm farm lấy từ code gửi, đối chiếu ô đi được
  // trong MapData client 24/11 — bãi farm thì CHƯA XÁC MINH, xem header):
  // - Rừng Trúc: code gửi (20,15) là ô 'L' nước sen BỊ CHẶN -> dùng
  //   (14,15)='.' (vùng 5x5 quanh nó toàn ô đi được, cùng hàng y=15).
  // - Thảo Dược Cốc (20,15)='~' sỏi đi được; Hang Động (15,10)='.' đi
  //   được; Miếu Hoang (10,7)='s' nền đá đi được; Hồ Tây (33,31)=spawn.
  { id: 'rtfarm', ten: 'Rừng Trúc farm (14,15) — CHƯA XÁC MINH bãi', map: 'thanh_truc_lam', khu: 0, x: 14, y: 15 },
  { id: 'dcfarm', ten: 'Thảo Dược Cốc farm (20,15) — CHƯA XÁC MINH bãi', map: 'duoc_vien', khu: 0, x: 20, y: 15 },
  { id: 'hdfarm', ten: 'Hang Động farm (15,10) — CHƯA XÁC MINH bãi', map: 'hang_dong_co', khu: 0, x: 15, y: 10 },
  { id: 'mhfarm', ten: 'Miếu Hoang farm (10,7) — CHƯA XÁC MINH bãi', map: 'mieu_hoang', khu: 0, x: 10, y: 7 },
  { id: 'htfarm', ten: 'Hồ Tây farm (33,31) — CHƯA XÁC MINH bãi', map: 'van_can', khu: 0, x: 33, y: 31 },
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
// --- Lái đa cách (v1.2.0) ---
var steerMethod = null; // 'keys'|'joystick'|'dpad'|'tap' — dò 1 lần mỗi phiên chạy
var flyingBelief = false; // tin là đang bay (class #btn-fly đã biết sai live — kiểm chứng bằng tốc độ)
var flySpeedChecked = false, flyRetryDone = false, flySpeedMeasured = null, flySpeedFirst = null; // lần đo đầu (chẩn đoán bay chậm), không ghi đè
var camAnchor = null; // {x,y} ô tại tâm canvas (chạm neo camera)
var heldKeys = {}; // code -> true (phím tool đang giữ)
var dpadHeld = null; // nút dpad đang giữ
var guardMap = null; // map lúc bắt đầu đợt lái — đổi map giữa đợt thì dừng đợt ngay
var legDeadline = 0; // hạn giờ chặng đi hiện tại (ms epoch) — đợt lái cũng phải tôn trọng

// ---------------- Helper DOM ----------------
function $(s) { return document.querySelector(s); }
function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function txt(el) { return el ? (el.innerText || el.textContent || '') : ''; }
// Kẹp ô vào trong biên map (dùng w/h MapData khi có) — tránh nhập tọa độ
// ngoài map rồi tool đi lạc.
function clampCell(mapId, x, y) {
  var m = MAPS[mapId];
  if (!m || typeof m.w !== 'number' || typeof m.h !== 'number') return { x: x, y: y };
  return {
    x: Math.max(0, Math.min(m.w - 1, x)),
    y: Math.max(0, Math.min(m.h - 1, y)),
  };
}
function dirName(dx, dy) {
  var ns = dy > 0 ? 'nam' : dy < 0 ? 'bắc' : '';
  var ew = dx > 0 ? 'đông' : dx < 0 ? 'tây' : '';
  return ew && ns ? ew + '-' + ns : (ew || ns || 'đứng yên');
}
function fmtSec(ms) { return (ms / 1000).toFixed(1).replace('.', ',') + 's'; }
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
  if (flyDangBat() !== bat) {
    var b = $('#btn-fly');
    if (!b) return false;
    tap(b);
  }
  // flyingBelief là "tin là đang bay" — class nút đã biết sai live nên
  // đây chỉ là gợi ý; kiểm chứng thật bằng tốc độ ở đợt lái đầu.
  flyingBelief = bat;
  return true; // game tiêu thụ cờ toggle ở frame sau — bấm đúng 1 lần
}
// Bấm Phi Hành bằng phím KeyF (keydown+keyup tổng hợp lên body).
// Game: keydown KeyF -> _flyToggle (bỏ qua e.repeat). Dùng cho lần bấm
// lại duy nhất khi kiểm chứng tốc độ thấy bay chưa ăn.
function pressFlyKey() {
  var tgt = document.body || document.documentElement;
  tgt.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF', key: 'f', bubbles: true, cancelable: true }));
  tgt.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyF', key: 'f', bubbles: true, cancelable: true }));
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

// ---------------- Lái đa cách, tự dò (v1.2.0 — lấy từ code gửi) ----------------
// Thứ tự dò 1 lần mỗi phiên chạy: phím -> joystick (engine v1.1.0 ở trên)
// -> dpad -> chạm neo camera. Mỗi cách giữ hướng về đích detectMs, vị trí
// đổi >=1 ô là đạt. Mọi đợt lái (burst) đều: poll vị trí mỗi tickMs,
// nhả đầu vào ở MỌI lối thoát, dừng khi đổi map giữa đợt (guardMap).
// Trả {reason, pos, ms} với reason: arrived|step|axis|moved|stuck|
// timeout|stopped|mapchanged|nojoy|nodpad.

// ---------- Phím hướng (lái bằng giữ phím — không phụ thuộc camera) ----------
// Game Input đọc e.code: KeyW/ArrowUp=up, KeyS/ArrowDown=down,
// KeyA/ArrowLeft=left, KeyD/ArrowRight=right, theo dõi phím đang giữ qua
// keydown/keyup, không kiểm isTrusted -> giữ phím tổng hợp dùng được.
// Sự kiện gửi lên body (bubbles) để tới được listener dù game gắn ở
// body/document/window.
var DIR_KEYS = [
  { code: 'KeyW', key: 'w', name: 'W' },
  { code: 'KeyS', key: 's', name: 'S' },
  { code: 'KeyA', key: 'a', name: 'A' },
  { code: 'KeyD', key: 'd', name: 'D' },
  { code: 'ArrowUp', key: 'ArrowUp', name: '↑' },
  { code: 'ArrowDown', key: 'ArrowDown', name: '↓' },
  { code: 'ArrowLeft', key: 'ArrowLeft', name: '←' },
  { code: 'ArrowRight', key: 'ArrowRight', name: '→' },
];
var DIR_BY_CODE = {};
DIR_KEYS.forEach(function (d) { DIR_BY_CODE[d.code] = d; });
function keyTarget() { return document.body || document.documentElement; }
function keyDown(code) {
  var d = DIR_BY_CODE[code];
  if (!d || heldKeys[code]) return;
  heldKeys[code] = true;
  keyTarget().dispatchEvent(new KeyboardEvent('keydown', { code: d.code, key: d.key, bubbles: true, cancelable: true }));
}
function keyUp(code) {
  var d = DIR_BY_CODE[code];
  if (!d || !heldKeys[code]) return;
  delete heldKeys[code];
  keyTarget().dispatchEvent(new KeyboardEvent('keyup', { code: d.code, key: d.key, bubbles: true, cancelable: true }));
}
function releaseAllKeys() {
  // Nhả toàn bộ 8 phím hướng (kể cả khi heldKeys lệch) — keyup thừa vô hại với game.
  DIR_KEYS.forEach(function (d) {
    keyTarget().dispatchEvent(new KeyboardEvent('keyup', { code: d.code, key: d.key, bubbles: true, cancelable: true }));
  });
  heldKeys = {};
}
function codesFor(dx, dy) {
  var codes = [];
  if (dx > 0) codes.push('KeyD'); else if (dx < 0) codes.push('KeyA');
  if (dy > 0) codes.push('KeyS'); else if (dy < 0) codes.push('KeyW');
  return codes;
}
// Giữ phím theo 1 đợt: poll vị trí mỗi tickMs, nhả khi shouldStop(p) trả
// lý do / kẹt (không đổi ô >= stuckMs) / hết giờ đợt / đổi map / dừng.
// Mọi lối thoát đều nhả toàn bộ phím.
function holdKeysBurst(runId, codes, shouldStop, burstTimeoutMs) {
  return new Promise(function (resolve) {
    var t0 = Date.now();
    var lastPos = docCell();
    var lastMoveAt = t0;
    codes.forEach(keyDown);
    (function tick() {
      var now = Date.now();
      var p = docCell();
      if (runId !== runToken) { releaseAllKeys(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
      if (guardMap && docMapId() && docMapId() !== guardMap) { releaseAllKeys(); return resolve({ reason: 'mapchanged', pos: p, ms: now - t0 }); }
      if (p) {
        if (!lastPos || p.x !== lastPos.x || p.y !== lastPos.y) { lastPos = p; lastMoveAt = now; }
        var sr = shouldStop(p);
        if (sr) { releaseAllKeys(); return resolve({ reason: sr, pos: p, ms: now - t0 }); }
      }
      if (legDeadline && now > legDeadline) { releaseAllKeys(); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
      if (p && now - lastMoveAt >= CFG.stuckMs) { releaseAllKeys(); return resolve({ reason: 'stuck', pos: p, ms: now - t0 }); }
      if (now - t0 >= burstTimeoutMs) { releaseAllKeys(); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
      setTimeout(tick, CFG.tickMs);
    })();
  });
}

// ---------- Joystick theo đợt (bọc engine v1.1.0) ----------
// Kéo joystick theo 1 đợt: giữ kéo, poll vị trí mỗi tickMs; hết đợt thì
// kéo về tâm (dừng di chuyển, chưa nhả) — đổi hướng đợt sau chỉ cần
// pointermove lại, không cần nhả. Nhả hẳn (pointerup) ở
// releaseAllInputs / finally của steerToCell / stop().
function holdJoyBurst(runId, vx, vy, shouldStop, burstTimeoutMs) {
  return new Promise(function (resolve) {
    var t0 = Date.now();
    if (!joy.active && !joyDown()) return resolve({ reason: 'nojoy', pos: docCell(), ms: 0 });
    var lastPos = docCell();
    var lastMoveAt = t0;
    var len = Math.hypot(vx, vy) || 1;
    joyMoveTo(vx / len, vy / len);
    (function tick() {
      var now = Date.now();
      var p = docCell();
      if (runId !== runToken) { joyUp(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
      if (guardMap && docMapId() && docMapId() !== guardMap) { joyUp(); return resolve({ reason: 'mapchanged', pos: p, ms: now - t0 }); }
      if (p) {
        if (!lastPos || p.x !== lastPos.x || p.y !== lastPos.y) { lastPos = p; lastMoveAt = now; }
        var sr = shouldStop(p);
        if (sr) { joyMoveTo(0, 0); return resolve({ reason: sr, pos: p, ms: now - t0 }); }
      }
      if (legDeadline && now > legDeadline) { joyMoveTo(0, 0); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
      if (p && now - lastMoveAt >= CFG.stuckMs) { joyMoveTo(0, 0); return resolve({ reason: 'stuck', pos: p, ms: now - t0 }); }
      if (now - t0 >= burstTimeoutMs) { joyMoveTo(0, 0); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
      setTimeout(tick, CFG.tickMs);
    })();
  });
}

// ---------- Nút dpad (giữ nút hướng .dpad-btn mang data-dx/data-dy) ----------
// Game: handler pointerdown gọi setPointerCapture KHÔNG try/catch (như
// joystick) rồi set trạng thái giữ -> nhờ vá v1.1.0 mới lái được bằng
// PointerEvent giả. Nút nằm trong #touch-ui nên có thể đang ẩn.
var DPAD_PID = 13;
function dpadPointer(el, type) {
  var r = el.getBoundingClientRect();
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: DPAD_PID, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerType: 'touch', isPrimary: true }));
}
function dpadPress(el) {
  if (!el || dpadHeld === el) return;
  dpadRelease();
  dpadPointer(el, 'pointerdown');
  dpadHeld = el;
}
function dpadRelease() {
  if (!dpadHeld) return;
  var el = dpadHeld;
  dpadHeld = null;
  try { dpadPointer(el, 'pointerup'); } catch (e) { /* bỏ qua */ }
}
function findDpadBtns(sx, sy) {
  var btns = document.querySelectorAll('.dpad-btn');
  if (!btns.length) {
    // Có thể #touch-ui đang ẩn (desktop) — thử hiện lại rồi tìm lần nữa.
    hienJoystick();
    btns = document.querySelectorAll('.dpad-btn');
  }
  var exact = null, xOnly = null, yOnly = null;
  for (var i = 0; i < btns.length; i++) {
    var bx = parseInt(btns[i].getAttribute('data-dx') || '0', 10);
    var by = parseInt(btns[i].getAttribute('data-dy') || '0', 10);
    if (bx === sx && by === sy) exact = btns[i];
    else if (sx !== 0 && bx === sx && by === 0) xOnly = btns[i];
    else if (sy !== 0 && by === sy && bx === 0) yOnly = btns[i];
  }
  return { exact: exact, xOnly: xOnly, yOnly: yOnly };
}
// Giữ nút dpad theo 1 đợt: có nút chéo khớp thì giữ nút đó; không có thì
// luân phiên 2 trục mỗi dpadAltMs. Mọi lối thoát đều nhả nút.
function holdDpadBurst(runId, sx, sy, shouldStop, burstTimeoutMs) {
  return new Promise(function (resolve) {
    var t0 = Date.now();
    var btns = findDpadBtns(sx, sy);
    if (!btns.exact && !btns.xOnly && !btns.yOnly) return resolve({ reason: 'nodpad', pos: docCell(), ms: 0 });
    var lastPos = docCell();
    var lastMoveAt = t0;
    var altFlipAt = 0, altX = true;
    function pressCurrent() {
      if (btns.exact) { dpadPress(btns.exact); return; }
      if (btns.xOnly && btns.yOnly) { dpadPress(altX ? btns.xOnly : btns.yOnly); return; }
      dpadPress(btns.xOnly || btns.yOnly);
    }
    pressCurrent();
    (function tick() {
      var now = Date.now();
      var p = docCell();
      if (runId !== runToken) { dpadRelease(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
      if (guardMap && docMapId() && docMapId() !== guardMap) { dpadRelease(); return resolve({ reason: 'mapchanged', pos: p, ms: now - t0 }); }
      if (!btns.exact && btns.xOnly && btns.yOnly && now - altFlipAt >= CFG.dpadAltMs) { altFlipAt = now; altX = !altX; pressCurrent(); }
      if (p) {
        if (!lastPos || p.x !== lastPos.x || p.y !== lastPos.y) { lastPos = p; lastMoveAt = now; }
        var sr = shouldStop(p);
        if (sr) { dpadRelease(); return resolve({ reason: sr, pos: p, ms: now - t0 }); }
      }
      if (legDeadline && now > legDeadline) { dpadRelease(); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
      if (p && now - lastMoveAt >= CFG.stuckMs) { dpadRelease(); return resolve({ reason: 'stuck', pos: p, ms: now - t0 }); }
      if (now - t0 >= burstTimeoutMs) { dpadRelease(); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
      setTimeout(tick, CFG.tickMs);
    })();
  });
}

// ---------- Chạm neo camera (dự phòng cuối) ----------
// Chạm đúng tâm canvas -> ô hiện tại = ô tại tâm -> chạm về đích theo vị
// trí nhân vật thật. Sau mỗi chạm, suy ô tâm mới từ điểm chạm đã dùng
// (ô tâm = ô nhân vật - điểm chạm/px/ô) để giữ hiệu chỉnh gần mép map.
// Chạm làm xa đích >2 ô -> bỏ neo, neo lại đợt sau (xem steerToCell).
// Game: handler `window pointerup`, tap <500ms và <14px -> Input.tap =
// Renderer.screenToBuffer(clientX,clientY); không kiểm isTrusted, không
// setPointerCapture. px/ô mặc định 32 (= CONFIG.TILE).
function gameCanvas() {
  var cs = Array.prototype.slice.call(document.querySelectorAll('canvas'));
  var best = null, ba = 0;
  cs.forEach(function (c) {
    var r = c.getBoundingClientRect(), a = r.width * r.height;
    if (a > ba) { ba = a; best = c; }
  });
  return best;
}
// Vùng HUD phủ trên canvas cần tránh khi chạm lái (joystick, cụm nút, bảng tool).
function hudAvoidZones() {
  var zones = [];
  var c = gameCanvas();
  if (!c) return zones;
  var r = c.getBoundingClientRect();
  zones.push({ x0: r.x, y0: r.y + r.height * 0.58, x1: r.x + r.width * 0.36, y1: r.y + r.height }); // joystick dưới trái
  zones.push({ x0: r.x + r.width * 0.62, y0: r.y + r.height * 0.52, x1: r.x + r.width, y1: r.y + r.height }); // cụm nút dưới phải
  ['#tt2d-difarm-panel', '#btn-auto-touch', '#btn-auto', '#btn-attack', '#btn-fly'].forEach(function (sel) {
    var el = $(sel);
    if (!el) return;
    var b = el.getBoundingClientRect();
    if (b.width > 0 && b.height > 0) zones.push({ x0: b.x - 6, y0: b.y - 6, x1: b.x + b.width + 6, y1: b.y + b.height + 6 });
  });
  return zones;
}
function safeTapPoint(cx, cy, r) {
  // Kẹp trong canvas, chừa lề 12% mỗi phía.
  var mx = r.width * 0.12, my = r.height * 0.12;
  cx = Math.max(r.x + mx, Math.min(r.x + r.width - mx, cx));
  cy = Math.max(r.y + my, Math.min(r.y + r.height - my, cy));
  // Rơi vào vùng HUD thì dịch điểm chạm lên trên vùng đó (giữ hướng ngang).
  var zones = hudAvoidZones();
  for (var i = 0; i < zones.length; i++) {
    var z = zones[i];
    if (cx >= z.x0 && cx <= z.x1 && cy >= z.y0 && cy <= z.y1) {
      cy = Math.max(r.y + my, Math.min(r.y + r.height - my, z.y0 - 10));
    }
  }
  return { x: cx, y: cy };
}
function tapCanvas(dx, dy) {
  var c = gameCanvas();
  if (!c) return false;
  var r = c.getBoundingClientRect();
  var ccx = r.x + r.width / 2, ccy = r.y + r.height / 2;
  var pt = safeTapPoint(ccx + dx, ccy + dy, r);
  var opts = { bubbles: true, cancelable: true, pointerId: 3, clientX: pt.x, clientY: pt.y, pointerType: 'touch', isPrimary: true };
  c.dispatchEvent(new PointerEvent('pointerdown', opts));
  setTimeout(function () { window.dispatchEvent(new PointerEvent('pointerup', opts)); }, 120);
  return { dx: Math.round(pt.x - ccx), dy: Math.round(pt.y - ccy) };
}
// Chờ vị trí đứng yên (không đổi ô trong tapStableMs liên tiếp), poll 300ms.
function waitStablePos(runId, timeoutMs) {
  return new Promise(function (resolve) {
    var t0 = Date.now(), prev = null, stillSince = null;
    (function tick() {
      if (runId !== runToken) return resolve(null);
      var p = docCell();
      if (p) {
        if (prev && p.x === prev.x && p.y === prev.y) {
          if (stillSince === null) stillSince = Date.now();
          if (Date.now() - stillSince >= CFG.tapStableMs) return resolve(p);
        } else stillSince = null;
        prev = p;
      }
      if (Date.now() - t0 >= timeoutMs) return resolve(prev);
      if (legDeadline && Date.now() > legDeadline) return resolve(prev);
      setTimeout(tick, 300);
    })();
  });
}
function anchorCamera(runId) {
  return (async function () {
    tapCanvas(0, 0);
    var p = await waitStablePos(runId, 12000);
    if (p) { camAnchor = { x: p.x, y: p.y }; log('Neo camera: ô tại tâm = (' + p.x + ',' + p.y + ')'); }
    return p;
  })();
}
function holdTapBurst(runId, tx, ty, shouldStop, burstTimeoutMs) {
  return (async function () {
    var t0 = Date.now();
    if (!camAnchor) {
      var ap = await anchorCamera(runId);
      if (!ap) return { reason: 'stuck', pos: docCell(), ms: 0 };
      if (runId !== runToken) return { reason: 'stopped', pos: ap, ms: Date.now() - t0 };
    }
    tapCanvas((tx - camAnchor.x) * CFG.pxPerTile, (ty - camAnchor.y) * CFG.pxPerTile);
    var p = await waitStablePos(runId, Math.max(3000, burstTimeoutMs));
    if (guardMap && docMapId() && docMapId() !== guardMap) return { reason: 'mapchanged', pos: p, ms: Date.now() - t0 };
    // Neo mới = ô nhân vật sau đợt chạm: camera game bám theo nhân vật nên
    // sau khi nhân vật dừng, ô tại tâm canvas = ô nhân vật. (Code gửi dùng
    // neo = vị trí - điểm chạm/px — công thức đó giả định camera ĐỨNG YÊN
    // trong đợt chạm; với camera bám thì nó lệch cả quãng vừa đi, đã sửa
    // ở v1.2.0. Cảnh báo thoái lui + neo lại vẫn là lưới an toàn.)
    if (p) camAnchor = { x: p.x, y: p.y };
    var sr = p ? shouldStop(p) : null;
    return { reason: sr || (p ? 'timeout' : 'stuck'), pos: p, ms: Date.now() - t0 };
  })();
}

// Nhả toàn bộ đầu vào lái: 8 phím hướng + joystick (pointerup) + nút dpad.
function releaseAllInputs() {
  releaseAllKeys();
  joyUp();
  dpadRelease();
}

// ---------- Tự dò cách lái (lần di chuyển đầu tiên mỗi phiên chạy) ----------
// Thứ tự: phím -> joystick -> nút dpad -> chạm neo camera. Mỗi cách giữ
// hướng về đích detectMs, vị trí đổi >=1 ô là đạt. Dò 1 lần/phiên, log rõ
// cách nào thắng (xem log panel).
function detectSteerMethod(runId, tx, ty) {
  return (async function () {
    var p0 = docCell();
    if (!p0) { log('Dò cách lái: không đọc được vị trí — mặc định phím'); log('Cách lái: phím'); return 'keys'; }
    var dx = tx - p0.x, dy = ty - p0.y;
    var movedFrom = function (q) { return (q.x !== p0.x || q.y !== p0.y) ? 'moved' : null; };
    log('Dò cách lái… (từ (' + p0.x + ',' + p0.y + ') về (' + tx + ',' + ty + '))');

    // a. Phím hướng
    log('Dò cách lái: thử phím…');
    var rk = await holdKeysBurst(runId, codesFor(dx, dy), movedFrom, CFG.detectMs);
    if (runId !== runToken) return 'keys';
    if (rk.reason === 'moved') { log('Cách lái: phím'); return 'keys'; }
    log('Phím không làm nhân vật di chuyển — thử joystick');

    // b. Joystick
    log('Dò cách lái: thử joystick…');
    var rj = await holdJoyBurst(runId, dx, dy, movedFrom, CFG.detectMs);
    joyUp(); // nhả hẳn sau đợt dò (holdJoyBurst chỉ kéo về tâm)
    if (runId !== runToken) return 'keys';
    if (rj.reason === 'moved') { log('Cách lái: joystick'); return 'joystick'; }
    log('Joystick không làm nhân vật di chuyển — thử nút dpad');

    // c. Nút dpad
    var sx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    var sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    var btns = findDpadBtns(sx, sy);
    if (btns.exact || btns.xOnly || btns.yOnly) {
      log('Dò cách lái: thử nút dpad…');
      var rd = await holdDpadBurst(runId, sx, sy, movedFrom, CFG.detectMs);
      if (runId !== runToken) return 'keys';
      if (rd.reason === 'moved') { log('Cách lái: dpad'); return 'dpad'; }
      log('Nút dpad không làm nhân vật di chuyển — dùng chạm neo camera');
    } else {
      log('Không thấy nút dpad — dùng chạm neo camera');
    }

    // d. Chạm neo camera
    log('Cách lái: chạm (neo camera)');
    return 'tap';
  })();
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

// ---------------- Lái tới 1 ô bằng cách lái đã dò ----------------
// Vòng lặp theo đợt (burst) như goToTile của code gửi, giữ hợp đồng trả
// của v1.1.0: {ok:true} khi tới nơi (cách đích <= arrivePx), hoặc
// {ok:false, reason, msg} với reason: ket|hp-thap|guc|dung|het-gio|
// doi-map|loi. Kẹt: đợt không di chuyển / không tiến gần đích -> đánh trả
// (Auto 1 lần) rồi lái vuông góc; quá repathMax lần đi vòng -> dừng.
// Đợt lái: tốc độ chỉ dùng ước lượng hạn giờ (đi bộ ~2,1 ô/s, bay ~4 ô/s).
// Kiểm chứng Phi Hành bằng tốc độ ở đợt lái đầu đủ dài (xem trong vòng lặp).
async function steerToCell(tx, ty, opts) {
  opts = opts || {};
  var arrivePx = (typeof opts.arrivePx === 'number') ? opts.arrivePx : CFG.arrivePx;
  var label = opts.label || ('ô (' + tx + ',' + ty + ')');
  var tok = runToken;
  var mapStart = docMapId();
  var t0 = Date.now();
  legDeadline = t0 + CFG.legTimeoutMs;
  // Dung sai theo ô: cổng (arrivePx 16px) cần đúng ô; bãi farm (32px) cho
  // phép lệch 1 ô (tương đương dist <= 32px của v1.1.0).
  var tol = (arrivePx >= CFG.tile) ? 1 : 0;
  var cheb = function (p) { return Math.max(Math.abs(tx - p.x), Math.abs(ty - p.y)); };
  var detours = 0, detourSign = 1, fightTried = false, diagOk = true;
  var bestCheb = Infinity, noProgress = 0;
  var burstFrom = null; // vị trí + khoảng cách trước đợt gần nhất (cảnh báo thoái lui)
  guardMap = mapStart;
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
      var p = docCell();
      if (!p) { await sleep(CFG.tickMs); continue; }
      if (cheb(p) <= tol) return { ok: true };
      // Cảnh báo thoái lui: đợt trước làm nhân vật xa đích hơn >2 ô.
      if (burstFrom && cheb(p) > burstFrom.cheb + 2) {
        log('Cảnh báo: đợt lái làm xa đích (' + burstFrom.x + ',' + burstFrom.y + ')→(' + p.x + ',' + p.y + ')');
        if (steerMethod === 'tap') { camAnchor = null; log('Bỏ neo camera — sẽ neo lại'); }
      }
      burstFrom = null;
      // Lần di chuyển đầu tiên của phiên: tự dò cách lái (phím -> joystick
      // -> dpad -> chạm neo camera).
      if (!steerMethod) {
        steerMethod = await detectSteerMethod(tok, tx, ty);
        if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        continue;
      }

      var dx = tx - p.x, dy = ty - p.y; // ô; +y là nam (KeyS)
      var startCheb = cheb(p);
      var startPos = { x: p.x, y: p.y };
      var codes = codesFor(dx, dy);
      if (!diagOk && codes.length > 1) codes = [Math.abs(dx) >= Math.abs(dy) ? codes[0] : codes[1]];

      var speed = flyingBelief ? 4 : 2.1; // ô/s, chỉ để đặt hạn giờ đợt
      var stepMode = startCheb <= 1; // gần đích: đợt ngắn 1 bước cho chính xác
      var burstCap = stepMode ? 2500 : Math.max(2500, Math.min(15000, startCheb / speed * 1000 * 1.6 + 1200));
      var shouldStop = function (q) {
        if (cheb(q) <= tol) return 'arrived';
        if (stepMode) return (q.x !== startPos.x || q.y !== startPos.y) ? 'step' : null;
        var qdx = tx - q.x, qdy = ty - q.y;
        // Nhả khi một trục đã tới 0 hoặc vượt đích (đổi dấu) — đợt sau tính lại hướng.
        if (dx !== 0 && (qdx === 0 || (qdx > 0) !== (dx > 0))) return 'axis';
        if (dy !== 0 && (qdy === 0 || (qdy > 0) !== (dy > 0))) return 'axis';
        return null;
      };

      burstFrom = { x: p.x, y: p.y, cheb: startCheb };
      var res, burstDesc;
      if (steerMethod === 'joystick') {
        res = await holdJoyBurst(tok, dx, dy, shouldStop, burstCap);
        burstDesc = 'kéo joystick hướng ' + dirName(dx, dy) + ' ~' + fmtSec(res.ms);
      } else if (steerMethod === 'dpad') {
        var sx = dx > 0 ? 1 : dx < 0 ? -1 : 0, sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
        res = await holdDpadBurst(tok, sx, sy, shouldStop, burstCap);
        burstDesc = 'giữ nút dpad (' + sx + ',' + sy + ') ~' + fmtSec(res.ms);
      } else if (steerMethod === 'tap') {
        res = await holdTapBurst(tok, tx, ty, shouldStop, burstCap);
        burstDesc = 'chạm neo camera ~' + fmtSec(res.ms);
      } else {
        res = await holdKeysBurst(tok, codes, shouldStop, burstCap);
        burstDesc = 'giữ phím [' + codes.map(function (c) { return DIR_BY_CODE[c].name; }).join('+') + '] ~' + fmtSec(res.ms);
      }
      log('→(' + tx + ',' + ty + ') từ (' + p.x + ',' + p.y + ') ' + burstDesc);
      if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
      // Đổi map trong đợt lái (bước lên ô cổng): dừng chặng này ngay.
      var mapAfter = docMapId();
      if (mapAfter && mapStart && mapAfter !== mapStart) {
        return { ok: false, reason: 'doi-map', msg: 'Đã sang map ' + tenMap(mapAfter) + '.' };
      }
      var p2 = res.pos || docCell();
      if (!p2) { await sleep(CFG.tickMs); continue; }
      if (cheb(p2) <= tol) return { ok: true };

      // Kiểm chứng Phi Hành bằng TỐC ĐỘ (đợt lái đầu đủ dài khi đang bay):
      // class nút #btn-fly đã biết sai live nên tốc độ là kiểm chứng thật.
      // <3 ô/s thì bấm lại 1 lần duy nhất (KeyF); không bấm lần 3 mù.
      // Chỉ đo đợt tiến triển tốt (arrived/axis/timeout), không đo đợt kẹt.
      if (flyingBelief && !flySpeedChecked && res.ms >= CFG.flyCheckMs &&
          (res.reason === 'arrived' || res.reason === 'axis' || res.reason === 'timeout')) {
        var distTiles = Math.hypot(p2.x - startPos.x, p2.y - startPos.y);
        if (distTiles >= 2) {
          var spd = distTiles / (res.ms / 1000);
          flySpeedMeasured = spd;
          if (flySpeedFirst === null) flySpeedFirst = spd;
          if (spd < CFG.flySpeedMin && !flyRetryDone) {
            flyRetryDone = true;
            log('Phi Hành: tốc độ chỉ ~' + spd.toFixed(1) + ' ô/s (<' + CFG.flySpeedMin + ') — bay chưa ăn, bấm lại 1 lần (KeyF).');
            pressFlyKey();
            await sleep(1200);
            if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
          } else {
            flySpeedChecked = true;
            log('Phi Hành: BẬT (tốc độ ~' + spd.toFixed(1) + ' ô/s).');
            if (spd < CFG.flySpeedMin) log('Tốc độ vẫn thấp sau khi bấm lại — giữ nguyên, không bấm nữa.');
          }
        }
      }

      var moved = (p2.x !== startPos.x || p2.y !== startPos.y);
      if (steerMethod === 'keys' && codes.length > 1 && !moved && res.reason !== 'arrived') {
        diagOk = false;
        log('Giữ 2 phím chéo không di chuyển — chuyển sang giữ từng trục.');
      }
      if (cheb(p2) < bestCheb) { bestCheb = cheb(p2); noProgress = 0; } else noProgress++;

      var isStuck = res.reason === 'stuck' || (!moved && res.reason !== 'arrived') || noProgress >= 3;
      if (isStuck) {
        if (!fightTried) {
          // Nghi quái chặn đường: bật Auto đánh trả rồi đi tiếp. Chỉ thử
          // 1 lần mỗi chặng đi (theo cơ chế "Tự Đi" của Thanh). Trong lúc
          // đánh vẫn ĐẨY về hướng đích theo cách lái đang dùng (không thì
          // nhân vật đứng yên và Auto không với tới quái chặn). Joystick
          // thì đồng bộ lại phiên kéo TRƯỚC khi đánh trả: game có thể đã
          // hủy trạng thái kéo (VD: qua cổng rồi bị đẩy về ngay) — ngắt
          // rồi kéo lại cho chắc, không thì mọi pointermove sau đó đều
          // bị game bỏ qua.
          fightTried = true;
          log('Có thể quái chặn đường — bật Auto đánh trả rồi đi tiếp.');
          if (steerMethod === 'joystick') { joyUp(); joyDown(); }
          datAuto(true);
          var fdx = tx - p2.x, fdy = ty - p2.y;
          var fStop = function (q) { return (q.x !== p2.x || q.y !== p2.y) ? 'moved' : null; };
          var fRes;
          if (steerMethod === 'joystick') fRes = await holdJoyBurst(tok, fdx, fdy, fStop, CFG.fightWaitMs);
          else if (steerMethod === 'dpad') fRes = await holdDpadBurst(tok, fdx > 0 ? 1 : fdx < 0 ? -1 : 0, fdy > 0 ? 1 : fdy < 0 ? -1 : 0, fStop, CFG.fightWaitMs);
          else if (steerMethod === 'tap') fRes = await holdTapBurst(tok, tx, ty, fStop, CFG.fightWaitMs);
          else fRes = await holdKeysBurst(tok, codesFor(fdx, fdy), fStop, CFG.fightWaitMs);
          datAuto(false);
          if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
          if (fRes && fRes.reason === 'moved') log('Đánh trả xong, đi tiếp.');
          else log('Đánh trả không nhúc nhích — thử đi vòng.');
          bestCheb = Infinity; noProgress = 0;
          continue;
        }
        detours++;
        if (detours > CFG.repathMax) {
          return { ok: false, reason: 'ket', msg: 'Kẹt đường tới ' + label + ' — đã thử đi vòng ' + CFG.repathMax + ' lần.' };
        }
        detourCount++;
        log('Kẹt — đi vòng (lần ' + detours + '/' + CFG.repathMax + ').');
        // Lái vuông góc với hướng đích rồi thử lại. Phím/dpad/chạm chậm
        // hơn joystick nên đợt đi vòng dài hơn (tối thiểu detourMinMs)
        // để đi đủ xa mà qua được vật cản.
        var pdx = -dy, pdy = dx;
        var pl = Math.hypot(pdx, pdy) || 1;
        var px = pdx / pl * detourSign, py = pdy / pl * detourSign;
        detourSign = -detourSign; // lần sau đi vòng hướng ngược lại
        var detourTimeout = (steerMethod === 'joystick') ? CFG.detourMs : Math.max(CFG.detourMs, CFG.detourMinMs);
        if (steerMethod === 'joystick') await holdJoyBurst(tok, px, py, function () { return null; }, detourTimeout);
        else if (steerMethod === 'dpad') await holdDpadBurst(tok, px > 0 ? 1 : px < 0 ? -1 : 0, py > 0 ? 1 : py < 0 ? -1 : 0, function () { return null; }, detourTimeout);
        else if (steerMethod === 'tap') await holdTapBurst(tok, p2.x + Math.round(px * 2), p2.y + Math.round(py * 2), function () { return null; }, Math.max(6000, detourTimeout));
        else await holdKeysBurst(tok, codesFor(px, py), function () { return null; }, detourTimeout);
        if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        noProgress = 0;
        continue;
      }
    }
  } finally {
    guardMap = null;
    legDeadline = 0;
    releaseAllInputs();
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
  // Phiên chạy mới: dò lại cách lái + neo camera từ đầu, kiểm chứng bay
  // lại từ đầu (bấm lại tối đa 1 lần/phiên).
  steerMethod = null; camAnchor = null;
  flySpeedChecked = false; flyRetryDone = false; flySpeedMeasured = null; flySpeedFirst = null;
  // Chuẩn bị: tắt Auto (không đánh quái lúc đi), dừng câu; BẬT Chạy +
  // Phi Hành để đi nhanh (lệnh Thanh 07:05) — giữ bật qua các cổng.
  if (autoDangBat()) datAuto(false);
  await sleep(400);
  if (tok !== runToken) return;
  datRun(true);
  await sleep(400);
  if (tok !== runToken) return;
  datFly(true);
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
        if (!ok && flyingBelief) {
          // Qua cổng không được khi đang bay: hạ cánh, đi bộ lên ô cổng,
          // thử lại (mẫu tryCrossPortal của code gửi).
          log('Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') khi bay — hạ cánh đi bộ lên ô cổng.');
          datFly(false);
          var r2 = await steerToCell(hop.tx, hop.ty, { arrivePx: CFG.portalPx, label: 'cổng (' + hop.tx + ',' + hop.ty + ')' });
          if (!r2.ok && r2.reason === 'dung') return;
          if (r2.ok) ok = await choDoiMap(cur, CFG.portalWaitMs);
          else if (r2.reason === 'doi-map') ok = true; // đã qua trong lúc đi bộ lên cổng
        }
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
      // Qua cổng/hạ cánh có thể tắt bay — bật lại Chạy + Phi Hành để đi
      // tiếp cho nhanh (giữ bật qua các cổng, lệnh Thanh 07:05). Bật lại
      // bay thì đo lại tốc độ ở đợt lái sau (không bấm lại lần 2 mù).
      if (!runDangBat()) datRun(true);
      if (!flyingBelief) {
        datFly(true);
        flySpeedChecked = false; // đo lại tốc độ sau khi bật lại
      }
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
  releaseAllInputs(); // nhả hết phím + joystick + dpad, không để nhân vật tự đi tiếp
  if (state === 'dang-di') {
    state = 'da-dung';
    msg = 'Đã dừng — đứng tại chỗ.';
    log(msg);
  }
  renderStatus();
}

// Chạm/phím THẬT (isTrusted=true) ngoài panel -> dừng ngay để người chơi
// tự lái. Sự kiện tổng hợp của tool có isTrusted=false nên không tự kích.
// - pointerdown: bỏ qua cú bấm trong panel tool (bấm nút ĐI/DỪNG...).
// - keydown: chỉ bỏ qua khi đang gõ trong ô nhập của panel (X/Y/Khu...);
//   phím WASD khi focus đang ở nút ĐI vẫn dừng tool (nút không ăn phím).
window.addEventListener('pointerdown', function (e) {
  if (state !== 'dang-di' || !e.isTrusted) return;
  var p = $('#tt2d-difarm-panel');
  if (p && e.target && p.contains(e.target)) return;
  stop();
}, true);
window.addEventListener('keydown', function (e) {
  if (state !== 'dang-di' || !e.isTrusted) return;
  if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  stop();
}, true);

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
  head.appendChild(el('span', { style: 'color:#c9a86a;font-size:11px;' }, 'v1.2.0'));
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
    'Tự dò cách lái (phím → joystick → dpad → chạm). Bay + Chạy bật trong lúc đi, tới nơi bật Auto + Chạy + Phi Hành. HP < 35% tự dừng. KHÔNG tự hồi sinh, KHÔNG tiêu Linh Thạch, KHÔNG ghi danh. Khu đầy thì dừng + báo rõ. Khu hiện tại chỉ đọc được sau khi mở Bảng Khu. Phi Hành kiểm tra bằng tốc độ (đợt lái đầu); chạm/phím thật ngoài bảng sẽ dừng tool.'));
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
  // Kẹp tọa độ vào biên map (tránh nhập ô ngoài map rồi tool đi lạc).
  var c = clampCell(target.map, target.x, target.y);
  if (c.x !== target.x || c.y !== target.y) {
    log('Tọa độ (' + target.x + ',' + target.y + ') ngoài map ' + tenMap(target.map) + ' — kẹp về (' + c.x + ',' + c.y + ').');
    target.x = c.x; target.y = c.y;
  }
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
  version: '1.2.0',
  start: start,
  stop: stop,
  setTarget: function (t) {
    if (t.map && MAPS[t.map]) target.map = t.map;
    if (typeof t.khu === 'number') target.khu = t.khu;
    if (typeof t.x === 'number') target.x = t.x;
    if (typeof t.y === 'number') target.y = t.y;
    if (typeof t.farmKhiToi === 'boolean') farmKhiToi = t.farmKhiToi;
    // Kẹp tọa độ vào biên map.
    var c = clampCell(target.map, target.x, target.y);
    target.x = c.x; target.y = c.y;
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
      steerMethod: steerMethod,
      flyingBelief: flyingBelief,
      flySpeed: flySpeedMeasured,
      flySpeedFirst: flySpeedFirst,
      flySpeedChecked: flySpeedChecked,
      flyRetried: flyRetryDone,
    };
  },
  presets: function () { return PRESETS.map(function (p) { return p.id; }); },
  setCollapsed: setCollapsed,
  setContentCollapsed: setContentCollapsed,
  _patchCapture: patchPointerCapture,
  _graph: PORTALS,
  _cfg: CFG,
  // Móc cho test smoke: ép cách lái (bỏ qua dò) / reset về dò lại.
  _setSteerMethod: function (m) { steerMethod = m; return steerMethod; },
  _resetSteer: function () { steerMethod = null; camAnchor = null; return true; },
};
})();
