// ==UserScript==
// @name         Tu Tiên 2D — Đi Farm (Tự đi tới bãi farm rồi bật Auto)
// @namespace    https://tutienpixel.online/
// @version      1.0.0
// @description  Chọn bãi farm (preset hoặc nhập tay map/khu/x/y) — tool lái CHÍNH client game tự đi tới nơi bằng Pathfinder.route + setPath và MapData.routeNextHop qua các cổng, đổi khu qua biển KHU, tới nơi bật Auto + Chạy + Phi Hành để farm. Không tự hồi sinh, không tiêu Linh Thạch, không ghi danh gì.
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// TOOL ĐI FARM v1.0.0 — lệnh Thanh 23:19 25/11 "Làm tools di chuyển farm đy".
// Dùng cơ chế Tự Đi của game (như "Tự Đi Làm Việc Dược Công"): KHÔNG viết
// lại tìm đường, chỉ ra lệnh cho client thật.
//
// ---- ĐÃ XÁC MINH từ game.js client 24/11 (xem ~/workspace/tu-tien-2d-di-farm/NOTES.md) ----
// - TILE = 32 (CONFIG.TILE:32); tâm ô (cx,cy) theo pixel = (cx*32+16, cy*32+16).
// - game.js là IIFE nhận __ns_ làm tham số (n/t/r/e) nên các hệ thống CÓ trên
//   window.__ns_: SceneWorld, Input, Pathfinder, MapData, KhuUI, Gateway,
//   Hotbar, Quest, Inventory, CONFIG (CONFIG.PLAYER: HITBOX_W:16, HITBOX_H:12).
// - Pathfinder.route(mapObj, fromXpx, fromYpx, toXpx, toYpx, halfW, hitH):
//   trả mảng waypoint PIXEL [{x,y}] (tâm ô, đã làm mịn theo tầm nhìn), [] nếu
//   không có đường; đích được snap về ô đi được gần nhất (bán kính 6 ô).
//   Đối số mapObj PHẢI là đối tượng map (SceneWorld.map), không phải map id.
// - player.setPath(p): gán đường đi (mảng waypoint pixel); player.stop():
//   xóa đường (path.length = 0). player.x/y là PIXEL; map id =
//   SceneWorld.map.data.id; HP = player.hp / player.hpMax.
// - MapData.routeNextHop(fromId, toId): BFS qua portals, trả portal bước đầu
//   {tx, ty, toMap, ...} hoặc null (cùng map / không có đường).
// - Input.setJoystick(x, y, active): x/y chuẩn hoá (clamp |v|<=1, x đông+,
//   y nam+), active=true để đi, (0,0,false) để dừng — dùng để nudge qua cổng.
// - Vòng lặp Tự Đi của game (Et): repath mỗi 0.6s (Pt), kẹt 6s (St) thì dừng,
//   chờ cổng 8s (Ft) thì dừng; tool này lấy đúng 3 mốc đó.
// - KhuUI = {khu, soKhu, mapId}; mở Bảng Khu bằng nút #btn-attack khi
//   aria-label chứa "Bảng Khu" ("Tương tác với Bảng Khu"); bảng mở khi có
//   [data-khu]; bấm [data-khu="N"] (.click()) để đổi khu.
// - Nút HUD (#btn-auto-touch, #btn-fly, #btn-run, #btn-attack,
//   #btn-fishing-stop-touch) CHỈ bind "pointerdown" — .click() là no-op,
//   phải dùng tap() (pointerdown+pointerup+click). #btn-auto KHÔNG có
//   listener (chỉ #btn-auto-touch có). Phi Hành đọc trạng thái thật qua
//   SceneWorld.player.flying (class nút #btn-fly đã xác minh live là sai).
// - Ưu tiên 'Quái': nút [data-uu-tien="quai"], bấm khi chưa có class "on".
// - Bật bộ 3 farm: Auto + Chạy trước, Phi Hành CUỐI.
// - Cổng game mở ngay khi nhân vật BƯỚC LÊN ĐÚNG Ô cổng (checkPortal).
//
// ---- CHƯA XÁC MINH — cần test live (không đoán mò, ghi rõ ở preset) ----
// - Tọa độ riêng của bãi Phong Địa Khu 3 (preset dùng điểm an toàn (30,27)).
// - Thảo Dược Cốc Khu 16: preset dùng (18,16) là BẾN CÂU đã xác minh đi được,
//   chưa xác minh là bãi farm tốt.
// - Bãi Đá tầng trên: preset dùng (10,5) là điểm hẹn Bãi Đá đã xác minh,
//   chưa xác minh là bãi farm tốt.
// - Mỏ Linh Thạch: preset dùng (4,27) là điểm spawn cổng Thung Lũng→Mỏ đã
//   xác minh trong MapData, chưa xác minh là bãi farm tốt.
// - Ngưỡng HP 35% là theo mô tả của Thanh (không tìm thấy hằng số này trong
//   client — game chỉ có DOWNED.ONSPOT_HP=.35 cho hồi sinh tại chỗ).
// - Biển KHU Phong Địa (30,20): có trong ghi chú chặng live, farm.js dùng
//   [34,15],[30,19] — tool thử lần lượt [34,15],[30,19],[30,20].
// - SceneWorld.map có đủ phương thức nearestWalkable/lineClear/isBlockedTile
//   mà Pathfinder.route cần hay không: Et() của game truyền chính đối tượng
//   này nên coi là có; nếu route trả [] thì tool báo "Không tìm được đường".
(function () {
'use strict';
if (window.__TT2D_DIFARM__) return; // chống nạp trùng 2 bảng

// ---------------- Cấu hình ----------------
var CFG = {
  tile: 32,               // CONFIG.TILE (fallback 32)
  hitboxW: 16,            // CONFIG.PLAYER.HITBOX_W
  hitboxH: 12,            // CONFIG.PLAYER.HITBOX_H
  tickMs: 250,            // nhịp kiểm tra vòng đi
  repathMs: 600,          // game Pt = 0.6s (chỉ dùng làm nhịp repath tối thiểu)
  stuckMs: 6000,          // game St = 6s không đổi vị trí -> kẹt
  repathMax: 4,           // kẹt quá 4 lần repath -> dừng
  routeFailMax: 5,        // game fail > 5 -> "Không tìm được đường"
  portalWaitMs: 8000,     // game Ft = 8s chờ đổi map ở cổng
  nudgeWaitMs: 3000,      // chờ đổi map sau mỗi lần đẩy cổng bằng joystick
  zoneWaitMs: 3000,       // chờ khu đổi sau khi bấm [data-khu]
  boardWaitMs: 4000,      // chờ bảng khu hiện sau khi bấm Tương Tác
  legTimeoutMs: 180000,   // tối đa 180s cho 1 chặng đi (tới cổng / biển / đích)
  fightWaitMs: 5000,      // bật Auto đánh trả tối đa 5s khi nghi quái chặn
  hpStopRatio: 0.35,      // HP < 35% -> tự dừng (theo mô tả của Thanh)
  arrivePx: 32,           // tới đích khi cách tâm đích < 1 ô (32px)
  portalPx: 16,           // tới cổng khi cách tâm ô cổng < nửa ô (16px)
};
// Đọc TILE / hitbox thật từ client khi có.
try {
  var _c = window.__ns_ && window.__ns_.CONFIG;
  if (_c) {
    if (typeof _c.TILE === 'number' && _c.TILE > 0) CFG.tile = _c.TILE;
    if (_c.PLAYER) {
      if (typeof _c.PLAYER.HITBOX_W === 'number') CFG.hitboxW = _c.PLAYER.HITBOX_W;
      if (typeof _c.PLAYER.HITBOX_H === 'number') CFG.hitboxH = _c.PLAYER.HITBOX_H;
    }
  }
} catch (e) { /* giữ fallback */ }

// ---------------- Map + biển KHU + preset ----------------
// sign: tọa độ biển KHU của map (đứng sát để bấm "Tương tác với Bảng Khu").
// Nguồn: farm.js tab Farm Tool Tổng (đã xác minh live) + ghi chú chặng.
var MAPS = {
  phong_dia:      { ten: 'Phong Địa',            sign: [[34, 15], [30, 19], [30, 20]] },
  duoc_vien:      { ten: 'Thảo Dược Cốc',        sign: [[14, 5]] },
  dong_mach_ngam: { ten: 'Miếu Ông Trường Con',  sign: [[11, 22]] },
  hang_dong:      { ten: 'Hang Động',            sign: [[14, 16]] },
  bai_da_hang_gio:{ ten: 'Bãi Đá',               sign: null },
  mo_linh_thach:  { ten: 'Mỏ Linh Thạch',        sign: null },
  thach_phong_thung_lung: { ten: 'Thung Lũng (Thạch Phong)', sign: null },
  mieu_hoang:     { ten: 'Miếu Hoang',           sign: null },
  tan_vien:       { ten: 'Chân Núi Tản Viên',    sign: null },
  thanh_truc_lam: { ten: 'Rừng Trúc',            sign: null },
};
// Tên HUD -> map id (fallback khi không đọc được SceneWorld.map.data.id).
var HUD_MAP = [
  [/Hồ Tây/, 'van_can'], [/Thảo Dược Cốc/, 'duoc_vien'],
  [/Rừng Trúc/, 'thanh_truc_lam'], [/Chân Núi Tản Viên/, 'tan_vien'],
  [/Miếu Ông Trường Con/, 'dong_mach_ngam'], [/Bãi Đá/, 'bai_da_hang_gio'],
  [/Miếu Hoang/, 'mieu_hoang'], [/Phong Địa/, 'phong_dia'],
  [/Hang Động/, 'hang_dong'], [/Mỏ Linh Thạch/, 'mo_linh_thach'],
  [/Thạch Phong|Thung Lũng/, 'thach_phong_thung_lung'],
  [/Bát Quái|Thành Thăng Long/, 'bat_quai_thach_phan'],
  [/Thiên Đạo|Chính Đảo/, 'thien_dao_khuyet'],
  [/Tam Lộ/, 'tam_lo'], [/Đại Hội/, 'dai_hoi_cho'],
  [/Vạn Hoang|Chiến Trường/, 'chien_truong'], [/Huyết Xích/, 'huyet_xich'],
];
// Map không có đường bộ đi ra (phó bản / sự kiện) — báo rõ thay vì đi lạc.
var KHONG_DUONG = { tam_lo: 1, dai_hoi_cho: 1, chien_truong: 1, huyet_xich: 1, yen_lang: 1, lam_lang: 1 };

var PRESETS = [
  { id: 'pd11',   ten: 'Phong Địa Khu 11 (30,27)',      map: 'phong_dia',       khu: 11, x: 30, y: 27 },
  { id: 'pd20',   ten: 'Phong Địa Khu 20 (18,22)',      map: 'phong_dia',       khu: 20, x: 18, y: 22 },
  { id: 'pd3',    ten: 'Phong Địa Khu 3 — CHƯA XÁC MINH tọa độ', map: 'phong_dia', khu: 3, x: 30, y: 27 },
  { id: 'dc16',   ten: 'Thảo Dược Cốc Khu 16 — CHƯA XÁC MINH bãi', map: 'duoc_vien', khu: 16, x: 18, y: 16 },
  { id: 'bd',     ten: 'Bãi Đá tầng trên — CHƯA XÁC MINH bãi', map: 'bai_da_hang_gio', khu: 0, x: 10, y: 5 },
  { id: 'mo',     ten: 'Mỏ Linh Thạch — CHƯA XÁC MINH bãi', map: 'mo_linh_thach', khu: 0, x: 4, y: 27 },
  { id: 'mtc',    ten: 'Miếu Ông Trường Con (15,22)',   map: 'dong_mach_ngam',  khu: 12, x: 15, y: 22 },
];

// ---------------- Trạng thái ----------------
var state = 'idle'; // idle|dang-di|toi-noi|da-dung|ket|khong-duong|chua-qua-cong|hp-thap|guc|khu-day|loi
var msg = 'Chưa đi. Chọn bãi rồi bấm ĐI.';
var target = { map: 'phong_dia', khu: 11, x: 30, y: 27 };
var farmKhiToi = true;
var runToken = 0;
var logLines = [];
var routeCalls = 0, setPathCalls = 0, joyStopCalls = 0, autoOnCount = 0;
var lastRoute = null, lastHop = null;

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

// ---------------- Đọc trạng thái game ----------------
function ns() { try { return window.__ns_ || null; } catch (e) { return null; } }
function player() {
  var n = ns();
  return (n && n.SceneWorld && n.SceneWorld.player) || null;
}
function mapObj() {
  var n = ns();
  return (n && n.SceneWorld && n.SceneWorld.map) || null;
}
// Vị trí PIXEL hiện tại (ưu tiên __ns_, fallback #hud-pos như nav.js Tool Tổng).
function docViTriPx() {
  var p = player();
  if (p && typeof p.x === 'number' && typeof p.y === 'number') return { x: p.x, y: p.y };
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
  var mo = mapObj();
  if (mo && mo.data && mo.data.id) return mo.data.id;
  if (mo && mo.id) return mo.id;
  var hm = $('#hud-map');
  var s = hm ? (hm.innerText || hm.textContent || '').trim() : '';
  if (!s) {
    var t = document.body ? (document.body.innerText || '') : '';
    s = t;
  }
  for (var i = 0; i < HUD_MAP.length; i++) {
    if (HUD_MAP[i][0].test(s)) return HUD_MAP[i][1];
  }
  return null;
}
function tenMap(id) { return (MAPS[id] && MAPS[id].ten) || id || '?'; }
function docKhu() {
  var n = ns();
  if (n && n.KhuUI && typeof n.KhuUI.khu === 'number') return n.KhuUI.khu;
  return null;
}
function docSoKhu() {
  var n = ns();
  if (n && n.KhuUI && typeof n.KhuUI.soKhu === 'number') return n.KhuUI.soKhu;
  return 40;
}
function docHP() {
  var p = player();
  if (p && typeof p.hp === 'number') {
    var mx = p.hpMax || p.maxHp || null;
    return { hp: p.hp, max: mx };
  }
  return null;
}

// ---------------- Bấm nút game: tap() thay .click() ----------------
// (Sao y nav.js Tool Tổng: nút HUD chỉ bind "pointerdown", .click() là no-op.)
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
function flyDangBat() {
  var p = player();
  if (p && typeof p.flying === 'boolean') return p.flying;
  return btnOn('#btn-fly');
}
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

// ---------------- Lái bằng Input.setJoystick (chỉ nudge qua cổng) ----------------
// Sao y joyHold() nav.js Tool Tổng v1.5.2 (lái trực tiếp, không qua DOM event).
function joyHold(dx, dy, ms) {
  var IN = null;
  try { IN = ns() && ns().Input; } catch (e) { IN = null; }
  if (IN && typeof IN.setJoystick === 'function') {
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    try { IN.setJoystick(dx / len, dy / len, true); } catch (e) { return Promise.resolve(false); }
    return new Promise(function (resolve) {
      setTimeout(function () {
        try { IN.setJoystick(0, 0, false); } catch (e) {}
        setTimeout(function () { resolve(true); }, 250);
      }, ms);
    });
  }
  var joy = $('#joystick');
  if (!joy) return Promise.resolve(false);
  var r = joy.getBoundingClientRect();
  if (!r.width || !r.height) return Promise.resolve(false);
  var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  function ev(ty, x, y) {
    return new PointerEvent(ty, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 12345, isPrimary: true });
  }
  joy.dispatchEvent(ev('pointerdown', cx, cy));
  var steps = 4;
  for (var i = 1; i <= steps; i++) joy.dispatchEvent(ev('pointermove', cx + dx * i / steps, cy + dy * i / steps));
  return new Promise(function (resolve) {
    setTimeout(function () {
      joy.dispatchEvent(ev('pointerup', cx + dx, cy + dy));
      setTimeout(function () { resolve(true); }, 250);
    }, ms);
  });
}
function joyStop() {
  joyStopCalls++;
  try {
    var IN = ns() && ns().Input;
    if (IN && typeof IN.setJoystick === 'function') IN.setJoystick(0, 0, false);
  } catch (e) { /* bỏ qua */ }
}

// ---------------- Tìm đường bằng client thật ----------------
function routeToCell(tx, ty) {
  var n = ns();
  var mo = mapObj();
  var p = player();
  if (!n || !n.Pathfinder || typeof n.Pathfinder.route !== 'function') return null;
  if (!mo || !p) return null;
  var toXpx = tx * CFG.tile + CFG.tile / 2;
  var toYpx = ty * CFG.tile + CFG.tile / 2;
  lastRoute = { map: docMapId(), fromX: p.x, fromY: p.y, toX: toXpx, toY: toYpx,
    halfW: CFG.hitboxW / 2, hitH: CFG.hitboxH };
  routeCalls++;
  var wps;
  try { wps = n.Pathfinder.route(mo, p.x, p.y, toXpx, toYpx, CFG.hitboxW / 2, CFG.hitboxH); }
  catch (e) { return null; }
  if (!wps || !wps.length) return [];
  try { p.setPath(wps); setPathCalls++; } catch (e) { return null; }
  return wps;
}
function routeNextHop(fromId, toId) {
  var n = ns();
  if (!n || !n.MapData || typeof n.MapData.routeNextHop !== 'function') return null;
  try {
    var hop = n.MapData.routeNextHop(fromId, toId);
    if (hop) lastHop = { from: fromId, to: toId, tx: hop.tx, ty: hop.ty, toMap: hop.toMap };
    return hop;
  } catch (e) { return null; }
}
function playerStopPath() {
  var p = player();
  if (!p) return;
  try { if (typeof p.stop === 'function') p.stop(); else if (p.path) p.path.length = 0; } catch (e) {}
}

// ---------------- Kiểm tra an toàn mỗi nhịp ----------------
function kiemTraAnToan() {
  var p = player();
  if (p && p.downed) return { ok: false, reason: 'guc', msg: 'Nhân vật đã gục — tool KHÔNG tự hồi sinh. Bấm DỪNG rồi xử lý tay.' };
  var h = docHP();
  if (h && h.max && h.max > 0 && h.hp / h.max < CFG.hpStopRatio) {
    return { ok: false, reason: 'hp-thap',
      msg: 'Khí Huyết dưới 35% (' + h.hp + '/' + h.max + ') — đã tự dừng để an toàn.' };
  }
  return { ok: true };
}

// ---------------- Đi tới 1 ô (dùng chung cho cổng / biển / đích) ----------------
// Trả {ok:true} khi tới nơi (cách tâm đích <= arrivePx), hoặc
// {ok:false, reason, msg} với reason: ket|khong-duong|hp-thap|guc|dung|het-gio.
async function walkToCell(tx, ty, opts) {
  opts = opts || {};
  var arrivePx = (typeof opts.arrivePx === 'number') ? opts.arrivePx : CFG.arrivePx;
  var label = opts.label || ('ô (' + tx + ',' + ty + ')');
  var tok = runToken;
  var mapStart = docMapId();
  var t0 = Date.now();
  var last = null, stillMs = 0, repaths = 0, fails = 0, fightTried = false;
  var toXpx = tx * CFG.tile + CFG.tile / 2;
  var toYpx = ty * CFG.tile + CFG.tile / 2;
  while (true) {
    if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
    var at = kiemTraAnToan();
    if (!at.ok) return { ok: false, reason: at.reason, msg: at.msg };
    // Đổi map giữa chừng (bước lên ô cổng / Auto lạc qua cổng): dừng chặng
    // này ngay — vòng đi chính tự đánh giá lại từ map mới (như game reset
    // diNV khi h.map !== r). Không đi tiếp tới ô cũ ở map mới.
    var mapNow = docMapId();
    if (mapNow && mapStart && mapNow !== mapStart) {
      playerStopPath();
      return { ok: false, reason: 'doi-map', msg: 'Đã sang map ' + tenMap(mapNow) + '.' };
    }
    if (Date.now() - t0 > CFG.legTimeoutMs) {
      playerStopPath();
      return { ok: false, reason: 'het-gio', msg: 'Quá ' + Math.round(CFG.legTimeoutMs / 1000) + 's chưa tới ' + label + ' — đã dừng.' };
    }
    var v = docViTriPx();
    if (!v) { await sleep(CFG.tickMs); continue; }
    var dist = Math.hypot(v.x - toXpx, v.y - toYpx);
    if (dist <= arrivePx) { playerStopPath(); return { ok: true }; }
    // Kẹt: vị trí pixel không đổi (game: |dx|+|dy| < 0.5 mỗi frame, St=6s).
    if (last && Math.abs(v.x - last.x) + Math.abs(v.y - last.y) < 0.5) stillMs += CFG.tickMs;
    else stillMs = 0;
    last = v;
    var p = player();
    var pathLen = (p && p.path) ? p.path.length : 0;
    if (stillMs >= CFG.stuckMs) {
      if (!fightTried) {
        // Nghi quái chặn đường: bật Auto đánh trả rồi đi tiếp (theo mô tả
        // cơ chế "Tự Đi" của Thanh). Chỉ thử 1 lần mỗi chặng đi.
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
          if (v2 && last && Math.abs(v2.x - last.x) + Math.abs(v2.y - last.y) >= 1) { moved = true; break; }
          await sleep(CFG.tickMs);
        }
        datAuto(false);
        if (moved) { last = docViTriPx(); log('Đánh trả xong, đi tiếp.'); }
        else log('Đánh trả không nhúc nhích — thử tìm đường khác.');
        repaths++;
        if (repaths > CFG.repathMax) {
          playerStopPath();
          return { ok: false, reason: 'ket', msg: 'Kẹt đường tới ' + label + ' — đã thử đi vòng ' + CFG.repathMax + ' lần.' };
        }
        routeToCell(tx, ty);
        await sleep(CFG.tickMs);
        continue;
      }
      repaths++;
      stillMs = 0;
      if (repaths > CFG.repathMax) {
        playerStopPath();
        return { ok: false, reason: 'ket', msg: 'Kẹt đường tới ' + label + ' — đã thử đi vòng ' + CFG.repathMax + ' lần.' };
      }
      log('Kẹt — tìm đường khác (lần ' + repaths + '/' + CFG.repathMax + ').');
      routeToCell(tx, ty);
      await sleep(CFG.tickMs);
      continue;
    }
    if (pathLen === 0) {
      var wps = routeToCell(tx, ty);
      if (!wps || !wps.length) {
        fails++;
        if (fails > CFG.routeFailMax) {
          return { ok: false, reason: 'khong-duong',
            msg: 'Không tìm được đường tới ' + label + ' — có thể ô đích bị chặn hoặc chưa có đường.' };
        }
        await sleep(CFG.tickMs);
        continue;
      }
      fails = 0;
    }
    await sleep(CFG.tickMs);
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

// ---------------- Đổi khu qua biển KHU ----------------
function bangKhuMo() { return $all('[data-khu]').length > 0; }
function nutBangKhuHien() {
  var b = $('#btn-attack');
  if (!b) return false;
  var label = (b.getAttribute('aria-label') || '') + ' ' + txt(b);
  return /bảng khu/i.test(label);
}
async function moBangKhu() {
  if (bangKhuMo()) return true;
  if (nutBangKhuHien()) {
    tap($('#btn-attack'));
    for (var i = 0; i < CFG.boardWaitMs / 500; i++) {
      await sleep(500);
      if (bangKhuMo()) return true;
    }
  }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
  for (var j = 0; j < CFG.boardWaitMs / 500; j++) {
    await sleep(500);
    if (bangKhuMo()) return true;
  }
  return false;
}
// Trả {ok:true} | {ok:false, reason, msg} | {ok:true, skipped:true}
async function doiKhu(khu) {
  var tok = runToken;
  if (docKhu() === khu) return { ok: true };
  var info = MAPS[target.map];
  if (!info || !info.sign) {
    log('Map ' + tenMap(target.map) + ' chưa biết biển KHU — farm tại khu hiện tại.');
    return { ok: true, skipped: true };
  }
  if (khu < 1 || khu > docSoKhu()) {
    return { ok: false, reason: 'ket', msg: 'Khu ' + khu + ' không có (map này chỉ có ' + docSoKhu() + ' khu).' };
  }
  var toiBien = null;
  for (var s = 0; s < info.sign.length; s++) {
    var sg = info.sign[s];
    var r = await walkToCell(sg[0], sg[1], { label: 'biển KHU (' + sg[0] + ',' + sg[1] + ')' });
    if (r.ok) { toiBien = sg; break; }
    if (r.reason === 'dung' || r.reason === 'hp-thap' || r.reason === 'guc' || r.reason === 'doi-map') return r;
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
  // CHỈ bấm nút [data-khu] — KHÔNG BAO GIỜ bấm Ghi danh tranh khu (20.000 LT).
  var btn = document.querySelector('[data-khu="' + khu + '"]');
  if (!btn) {
    return { ok: false, reason: 'ket', msg: 'Bảng khu không có ô Khu ' + khu + '.' };
  }
  btn.click();
  var t0 = Date.now();
  while (Date.now() - t0 < CFG.zoneWaitMs) {
    await sleep(500);
    if (docKhu() === khu) return { ok: true };
    if (!bangKhuMo()) break; // bảng đã đóng mà khu chưa đổi -> bị từ chối
  }
  if (docKhu() === khu) return { ok: true };
  return { ok: false, reason: 'khu-day', msg: 'Khu ' + khu + ' đầy (bấm không vào được) — đã dừng, chưa đổi khu.' };
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
  msg = 'Đang đi tới ' + tenMap(target.map) + ' Khu ' + (target.khu || '?') + ' (' + target.x + ',' + target.y + ')…';
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
      var hop = routeNextHop(cur, target.map);
      if (!hop) {
        finish('khong-duong', 'Không có đường bộ từ ' + tenMap(cur) + ' tới ' + tenMap(target.map) + ' — 2 map chưa nối cổng. Đi tay về map gần nhất rồi bấm ĐI lại.');
        return;
      }
      log('Qua cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.toMap) + '…');
      var r = await walkToCell(hop.tx, hop.ty, { arrivePx: CFG.portalPx, label: 'cổng (' + hop.tx + ',' + hop.ty + ')' });
      // 'doi-map' = cổng đã mở trong lúc đi (map đổi rồi) — coi như qua cổng
      // xong, xuống dưới chờ xác nhận đổi map. 'dung' = người dùng bấm DỪNG
      // (stop() đã đặt state 'da-dung') — trả về lặng, KHÔNG finish() ghi đè.
      if (!r.ok && r.reason === 'dung') return;
      if (!r.ok && r.reason !== 'doi-map') { finish(r.reason, r.msg); return; }
      // Tới ô cổng: cổng game mở khi BƯỚC LÊN ô — chờ đổi map (Ft=8s).
      var ok = await choDoiMap(cur, CFG.portalWaitMs);
      if (!ok) {
        // Nudge bằng joystick trực tiếp (Input.setJoystick) rồi chờ thêm.
        var nudged = false;
        for (var n = 0; n < 2 && !ok; n++) {
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
          finish('chua-qua-cong', 'Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.toMap) + ' — đã thử đẩy 2 lần. Đứng lại kiểm tra tay rồi bấm ĐI lại.');
          return;
        }
        if (nudged) log('Đẩy cổng bằng joystick đã qua.');
      }
      log('Đã sang ' + tenMap(docMapId()) + '.');
      continue;
    }
    // Đã ở map đích.
    if (target.khu && docKhu() !== null && docKhu() !== target.khu) {
      var rk = await doiKhu(target.khu);
      if (!rk.ok && rk.reason === 'dung') return;
      if (!rk.ok && rk.reason === 'doi-map') continue; // lạc sang map khác — đánh giá lại từ đầu
      if (!rk.ok) { finish(rk.reason, rk.msg); return; }
      if (rk.skipped) { /* farm tại khu hiện tại */ }
      else log('Đã đổi sang Khu ' + target.khu + '.');
      continue;
    }
    var r3 = await walkToCell(target.x, target.y, { label: 'bãi farm (' + target.x + ',' + target.y + ')' });
    if (!r3.ok && r3.reason === 'dung') return;
    if (!r3.ok && r3.reason === 'doi-map') continue; // lạc sang map khác — đánh giá lại từ đầu
    if (!r3.ok) { finish(r3.reason, r3.msg); return; }
    if (farmKhiToi) {
      await batBoFarm();
      finish('toi-noi', 'Đã tới ' + tenMap(target.map) + ' Khu ' + (docKhu() === null ? '?' : docKhu()) + ' (' + target.x + ',' + target.y + ') — đang farm (Auto + Chạy + Phi Hành).');
    } else {
      finish('toi-noi', 'Đã tới ' + tenMap(target.map) + ' Khu ' + (docKhu() === null ? '?' : docKhu()) + ' (' + target.x + ',' + target.y + ') — đã dừng tại chỗ (không bật farm theo yêu cầu).');
    }
    return;
  }
}
function stop() {
  runToken++;
  playerStopPath();
  joyStop();
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
function buildPanel() {
  if ($('#tt2d-difarm-panel') || $('#tt2d-difarm-bar')) return;
  panel = el('div', { id: 'tt2d-difarm-panel', style: 'position:fixed;top:8px;right:8px;width:300px;z-index:99999;background:rgba(20,16,10,.95);border:1px solid #8a6d3b;border-radius:8px;color:#f0e6d2;font:12px/1.5 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.5);' });
  var head = el('div', { style: 'display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid #8a6d3b;cursor:default;' });
  head.appendChild(el('b', { style: 'flex:1;font-size:13px;' }, 'Đi Farm — Tu Tiên 2D'));
  head.appendChild(el('span', { style: 'color:#c9a86a;font-size:11px;' }, 'v1.0.0'));
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
    'Tự đi bằng client thật (Pathfinder + setPath). HP < 35% tự dừng. KHÔNG tự hồi sinh, KHÔNG tiêu Linh Thạch, KHÔNG ghi danh. Khu đầy thì dừng + báo rõ.'));
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
  var s = 'Hiện tại: ' + tenMap(cur) + ' Khu ' + (docKhu() === null ? '?' : docKhu()) +
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
  version: '1.0.0',
  start: start,
  stop: stop,
  setTarget: function (t) {
    if (t.map && MAPS[t.map]) target.map = t.map;
    if (typeof t.khu === 'number') target.khu = t.khu;
    if (typeof t.x === 'number') target.x = t.x;
    if (typeof t.y === 'number') target.y = t.y;
    if (typeof t.farmKhiToi === 'boolean') farmKhiToi = t.farmKhiToi;
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
      state: state, msg: msg, map: docMapId(), khu: docKhu(),
      x: c ? c.x : null, y: c ? c.y : null,
      target: { map: target.map, khu: target.khu, x: target.x, y: target.y },
      farmKhiToi: farmKhiToi,
      routeCalls: routeCalls, setPathCalls: setPathCalls,
      joyStopCalls: joyStopCalls, autoOnCount: autoOnCount,
      lastRoute: lastRoute, lastHop: lastHop,
    };
  },
  presets: function () { return PRESETS.map(function (p) { return p.id; }); },
  setCollapsed: setCollapsed,
  setContentCollapsed: setContentCollapsed,
  _cfg: CFG,
};
})();
