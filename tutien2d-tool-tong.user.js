// ==UserScript==
// @name         Tu Tiên 2D — Tool Tổng (Câu cá | Boss | Dược | Huyết Xích | Vận Tiêu | Tổ đội | Farm)
// @namespace    https://tutienpixel.online/
// @version      1.3.7
// @updateURL    https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/main/tutien2d-tool-tong.user.js
// @downloadURL  https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/main/tutien2d-tool-tong.user.js
// @description  Tool Tổng Tu Tiên 2D: 1 bảng chung chia 7 tab — Câu cá Hồ Tây (v3.2: tỷ lệ cắn + Côn Bằng + thời tiết + TỰ ĐI tới điểm câu), Boss theo giờ, Dược Đại Phu (tự hủy việc dở), Huyết Xích phụ, Vận Tiêu phụ, Tổ đội + farm rùa MTC Khu 12, Farm tự tìm đường tới map + khu đã chọn. Khung gọn nhẹ, thu nhỏ được 2 cấp (tab đang dùng + toàn bộ bảng). Module Điều hướng chung (joystick + BFS) cho mọi tab + hook script Python. Chỉ bấm nút của game, không gọi mạng, không sửa bộ nhớ.
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// TOOL TỔNG v1.3.7 — 1 bảng chung, 7 tab. v1.3.7 (25/11): SỬA LỖI FARM
// "không tự đi qua map được" (Thanh báo 13:29 25/11 — tab Farm chọn mục
// tiêu mà nhân vật không qua map). Nguyên nhân gốc: cổng game mở ngay khi
// nhân vật BƯỚC LÊN ĐÚNG Ô cổng (checkPortal, game.js) nên map có thể đã
// đổi NGAY TRONG lúc diToi/nudge, nhưng quaCongTai ghi mapCu SAU nudge —
// so sánh "map đổi" với map MỚI nên không bao giờ thấy đổi, báo nhầm
// "đẩy cổng không qua" dù nhân vật đã sang map bên kia (rồi fallback có
// thể qua thêm 1 map nữa, Farm kết thúc ở map sai). Sửa: ghi map TRƯỚC khi
// di chuyển, kiểm tra đổi map sau diToi + sau MỖI nhịp nudge, trả true ngay
// khi map đổi; diToi dừng ngay khi đổi map giữa chừng. Cổng đối chiếu lại
// client 24/11 + live 25/11: Miếu Hoang->Phong Địa (1,6) SAI (phỏng đoán cũ)
// -> (0,7) chính + (0,6) dự phòng (runtime portals.push + live đẩy tây từ
// (2,7)); Bãi Đá->làng (0,27) là ô portal nhưng không phải điểm đứng ->
// (2,28) chính + (0,27) dự phòng (live đẩy tây từ (2,28) về (37,15));
// Phong Địa->Miếu Hoang thêm dự phòng (39,15); XÓA MTC->làng (18,22) chưa
// xác minh live (BFS cứ chọn làm đường chính) — đường MTC->làng đi 2 chặng
// qua Bãi Đá (15,22) rồi (2,28). Hạ cánh: flyDangBat đọc trạng thái thật
// SceneWorld.player.flying TRƯỚC (live 12:54 25/11: class nút Phi Hành luôn
// báo false trong khi đang bay — quaCong tưởng đã hạ cánh nên đẩy joystick
// khi đang bay, nhân vật không đi); diToi + diToiMap tự hạ cánh đầu hàm
// (trước đây chỉ quaCong hạ cánh, diToi gọi trực tiếp thì không); farm.js
// flyIsOn() dùng nav.flyDangBat(), sửa comment sai "bay + joystick vẫn chạy
// được". docViTri ưu tiên #hud-pos, fallback body regex (log tool có thể
// nhiễm tọa độ). Test mới mục (20): qua cổng mở khi bước lên ô + hạ cánh
// theo trạng thái thật + docViTri #hud-pos + Farm Miếu Hoang->Phong Địa;
// mục (8) dd_mtc thành 2 chặng qua Bãi Đá. Vận Tiêu phụ vẫn v1.0.3.
// TOOL TỔNG v1.3.6 — 1 bảng chung, 7 tab. v1.3.6 (25/11): Vận Tiêu phụ lên
// v1.0.3 — BỎ CHẶN PHÍ 1.000 (Thanh chốt 13:18 25/11 "Cứ để nhận tuyến 1k"):
// chuỗi tự chạy NHẬN CẢ chuyến 4–6 với phí 1.000 LT/chuyến (thưởng ~1.800
// LT/chuyến nên vẫn lãi); helper không còn dừng chuỗi sau chuyến 3 — chỉ
// dừng khi hết 6 chuyến/ngày (game tự dừng "Hết lượt hôm nay"), 2 chuyến
// timeout liên tiếp, game dừng giữa chuyến, hoặc người dùng tắt nút "Tự
// chạy" trên bảng. Trường dungViPhi trong status() giữ lại để tương thích
// (luôn false). Các tab khác không đổi.
// TOOL TỔNG v1.3.5 — 1 bảng chung, 7 tab. v1.3.5 (25/11): Vận Tiêu phụ lên
// v1.0.2 — TỰ CHẠY TIÊU từ chuyến 2 (Thanh chốt 12:49 25/11 "Dùng tự chạy
// tiêu từ chuyến 2"). Học theo đúng mã client game.js 24/11 (VanTieu.moTuChay
// + SceneWorld.tuChayBat/tuChayDung/tick tự chạy + VanTieuUI), không tự chế
// đường/logic: helper chỉ bấm nút #van-tieu-hud .vt-tu khi game cho hiện nút
// (moTuChay: đủ 2 chuyến đã xong — chuyến 1 nút ẩn nên vẫn chạy tay), 1 lần/
// chuyến; game tự kéo theo TUYEN + tự nhận/giao tới hết lượt; helper vẫn giữ
// Auto TẮT + Chạy BẬT + Phi Hành TẮT cả khi đang tự chạy (game không tự tắt
// Auto); KHÔNG tự bấm lại khi game dừng giữa chuyến (ghi lý do từ caption);
// DỪNG chuỗi sau chuyến 3 vì checkNhan của game chỉ kiểm tra "đủ LT đóng phí"
// nên chuỗi tự chạy sẽ tự nhận cả chuyến 4–6 phí 1.000 (quy tắc cứng phí ≠400
// -> DỪNG) — đọc phí chuyến sau từ VanTieu.phiNhan (ưu tiên số server);
// 2 chuyến timeout liên tiếp -> DỪNG chuỗi (timeout suy từ đồng hồ HUD chạm
// 0:00 hai nhịp rồi mất tiêu, vì tick game không kiểm tra đồng hồ — server
// kết thúc chuyến khi hết 6:00). CHƯA đồng bộ van_tieu_run.py (script Python
// lái tay bằng joystick sẽ hủy tự chạy ngay — cập nhật sau khi lượt cron
// Vận Tiêu 12:00 25/11 kết thúc). Các tab khác không đổi.
// TOOL TỔNG v1.3.4 — 1 bảng chung, 7 tab. v1.3.4 (25/11): ĐÍNH CHÍNH cổng làng→Miếu Hoang — cổng dự phòng (2,15) SAI (các hàng 14–16 bị cây chắn ở x=1), đổi thành (2,13) đã xác minh live 08:35 25/11 (chặng net13 đẩy tây từ (2,13) ~4s qua được). v1.3.3 (25/11): SỬA LỖI "bật
// auto farm ở tool không di chuyển được" (Thanh báo 07:15) — cùng lỗi
// .click() như tab Dược ở v1.3.2, nhưng ở tab Farm + tab Boss + helper
// Huyết Xích/Vận Tiêu + Tổ đội + nav chung: mọi chỗ bấm nút HUD
// (#btn-attack, #btn-fly, #btn-auto-touch, #btn-target, #btn-run,
// #btn-meditate-touch) chuyển sang tap() (pointerdown+pointerup+click);
// datAuto/datFly/datRun/setBtn chỉ bấm đúng 1 lần khi trạng thái cần đổi,
// KHÔNG kiểm tra lại ngay sau khi bấm (game tiêu thụ toggle ở frame sau),
// ưu tiên #btn-auto-touch (#btn-auto không có listener); Vận Tiêu chỉ
// bấm #btn-auto-touch (bấm cả 2 sẽ toggle ngược). BỎ Hắc Thị khỏi danh
// sách map đích tab Farm (chợ đen, không có quái để farm — Thanh hỏi
// 07:17 "cho nhân vật qua hắc thị làm gì vậy"); cổng Hắc Thị vẫn giữ
// trong nav.js. Boss lên v1.2.1, Huyết Xích phụ v1.1.1, Vận Tiêu phụ
// v1.0.1. BỔ SUNG (vụ Thanh báo 07:29): Farm tới Miếu Hoang báo nhầm
// "không có đường" — nguyên nhân thật là Phi Hành BẬT (datFly cũ .click()
// là no-op) nên đẩy cổng không qua; quaCong nay hạ cánh bằng tap() trước
// khi đẩy cổng + cổng tan_vien>mieu_hoang có dự phòng (0,12) không qua
// được thì thử lại (2,15) (tọa độ live); Farm báo lỗi phân biệt 3 trường
// hợp (không có đường / không tới được ô cổng / đẩy cổng không qua, kèm
// tọa độ cổng + trạng thái Phi Hành/Auto) + log từng bước quaCong.
// v1.3.2 (25/11): tab Dược lên
// v1.1.1 — SỬA LỖI "tự động làm dược và di chuyển không hoạt động": bấm
// nút game bằng tap() (pointerdown+pointerup+click — nút HUD của game chỉ
// bind pointerdown, .click() là no-op) + diToi/quaCong tắt Auto trước khi
// lái joystick rồi bật lại nếu là Trúc Cơ; CHỐNG TRÙNG BẢNG: script dừng
// ngay nếu trang đã có bảng Tool Tổng (nhập script mới không hiện 2 bảng),
// thêm @updateURL/@downloadURL để Tampermonkey cập nhật đúng bản cũ.
// v1.3.1 (25/11): tab Câu cá lên
// v3.2.0 — TỰ ĐI tới điểm câu đã chọn (dùng nav chung: diToiMap('van_can')
// + diToi(x, y); tắt Auto trước khi di chuyển, tới nơi tự bắt đầu câu khi
// giao diện câu xuất hiện; đang câu thì không di chuyển; kẹt 3 lần thì tắt
// tự đi) + Ô CHỌN ĐIỂM CÂU (14 điểm trên cầu đã xác minh từ client: đi được
// + kề nước theo ganNuoc, TILE=32, SAT_NUOC_PX=52; (49,14) KHÔNG phải điểm
// câu hợp lệ) + TRÁNH NGƯỜI KHÁC: điểm đã chọn có người đứng yên ≥5s thì
// tự lui sang điểm trống gần nhất; cả 14 điểm đều có người thì dừng + báo.
// v1.3.0 (25/11): tab Boss lên
// v1.2.0 — TỰ ĐI tới map boss trước giờ hồi sinh (dùng nav chung, tắt Auto
// trước khi di chuyển, bật lại Auto + ưu tiên Boss khi tới nơi; đi trước
// 5 phút + 2 phút/cổng; thất bại 3 lần thì tắt tự đi) + TỰ HỒI SINH TẠI
// CHỖ tối đa 3 lần/phiên khi chết lúc đánh boss (bấm #downed-spot, KHÔNG
// bấm Về làng; hồi sinh xong đánh luôn, không chờ hồi HP; không hồi sinh
// ở làng trong giờ Chính Ma) + giờ boss thật từ hook BossBoard (server)
// và giờ cố định do người dùng ghi (mốc neo HH:MM + chu kỳ). v1.2.1
// (25/11): SỬA LỖI Farm không tự di chuyển — runToTarget tắt Auto TRƯỚC
// khi diToiMap (joystick không chạy khi Auto BẬT), nav diToi/quaCong/
// diToiMap tắt Auto đầu mỗi nhịp/cổng + tắt lại khi Auto tự bật giữa
// đường; datAuto bấm xong kiểm tra lại (toggle) — CÁCH NÀY ĐÃ SAI (nút
// HUD chỉ bind pointerdown nên .click() là no-op; kiểm tra lại ngay sau
// khi bấm đọc trạng thái cũ), đã sửa lại ở v1.3.3 (tap() + bấm 1 lần).
// v1.2.0 (25/11): mở rộng
// điều hướng chung thêm Mỏ Linh Thạch, Thạch Phong, Bát Quái, Thiên Đạo,
// Ma Động, Hắc Phong Lĩnh, Hắc Thị + đường ra hầm Huyết Xích; duongDi
// thành BFS trên đồ thị cổng; tab Farm thêm 7 map đích; sửa cổng
// làng->Miếu Hoang (0,12). Gộp từ 5 tool lẻ (giữ nguyên logic):
//  - Câu cá Hồ Tây v3.2.0 | Boss v1.2.1 | Dược v1.1.1 | Huyết Xích phụ v1.1.1
//    | Vận Tiêu phụ v1.0.3 — xem README.md trong thư mục tu-tien-2d-tool-tong.
//  - Tổ đội + farm rùa: mời/chấp nhận trong 180px, tối đa 6 người, farm Thạch
//    Quy Miếu Ông Trường Con Khu 12 (mới, viết cho Tool Tổng).
//  - Farm tự tìm đường (mới v1.1.0): chọn map + khu -> tool tự đi tới (BFS +
//    qua cổng) -> chọn khu qua Bảng Khu -> bật Auto + Chạy + Phi Hành, giám
//    sát khu/Giáp/tốc độ, Giáp thấp thì thiền hồi. Không bấm Ghi danh tranh khu.
//  - Điều hướng chung: joystick + BFS trên lưới thật, dùng chung cho mọi tab;
//    script Python gọi qua window.__TT2D_TONG__.nav.
//  - Debug chung: window.__TT2D_TONG__ (.status() / .showTab(id) /
//    .setCollapsed(v) / .setTabCollapsed(v) / .tab(id) / .nav). Handle riêng
//    từng tool vẫn giữ: __TT2D_FISH__ / __TT2D_BOSS__ / __TT2D_DUOC__ /
//    __TT2D_HX__ / __TT2D_VANTIEU__ / __TT2D_PARTY__ / __TT2D_FARM__ / __TT2D_NAV__.
//  - THU NHỎ 2 CẤP: nút "—" trên thanh tab thu gọn nội dung tab đang dùng
//    (chỉ hiện thanh tab); nút "—" trên tiêu đề thu nhỏ toàn bộ bảng thành
//    1 thanh nhỏ (tên + trạng thái ngắn + "＋"). Mỗi tab vẫn giữ nút "—"
//    riêng (thu gọn khung tab đó). Tool vẫn chạy khi thu nhỏ.
//  - CHƯA TEST LIVE trên game thật (chỉ test trên DOM giả) — xem README.

(function () {
  'use strict';

// ================= VỎ TOOL TỔNG (shell) =================
// 1 bảng chung chia 6 tab. Các module con (câu cá / boss / dược /
// huyết xích / vận tiêu / tổ đội) là các IIFE riêng — chúng chèn panel
// của mình vào đúng container tab qua Tong.tabBody(id) rồi đăng ký
// handle debug qua Tong.register(id, api).
// Thu nhỏ 2 cấp (lệnh Thanh 00:05 25/11):
//  - Nút "—" trên thanh tab: thu gọn NỘI DUNG tab đang dùng, chỉ còn
//    hiện thanh tiêu đề + thanh tab. Bấm "＋" mở lại.
//  - Nút "—" trên tiêu đề: thu nhỏ TOÀN BỘ bảng thành 1 thanh nhỏ
//    (tên + trạng thái ngắn của tab đang dùng + nút "＋"). Tool vẫn chạy.
//  - Mỗi module vẫn giữ nút "—" riêng của nó (thu gọn khung của module
//    đó thành tên + trạng thái ngắn + "＋", tool vẫn chạy).

// Chống chạy trùng: nếu trang đã có bảng Tool Tổng (do nhập script mới
// mà bản cũ vẫn bật, hoặc script chạy 2 lần) thì dừng ngay để chỉ còn
// 1 bảng — không dựng bảng thứ hai. (Lỗi 25/11: nhập script mới thì
// hiện hẳn 2 bảng tool. LƯU Ý: guard này chỉ chặn trùng Tool Tổng với
// nhau; script LẺ (Câu cá/Boss/Dược/Huyết Xích/Vận Tiêu) vẫn tạo bảng
// riêng của nó — phải TẮT script lẻ trong Tampermonkey khi dùng Tool
// Tổng, xem README mục "Cài đặt".)
if (document.getElementById('tt2d-tong-panel')) return;

var TABS = [
  { id: 'fish', icon: '\uD83C\uDFA3', ten: 'Câu cá' },
  { id: 'boss', icon: '\uD83D\uDC09', ten: 'Boss' },
  { id: 'duoc', icon: '\uD83C\uDF3F', ten: 'Dược' },
  { id: 'hx', icon: '\uD83E\uDE78', ten: 'Huyết Xích' },
  { id: 'vantieu', icon: '\uD83D\uDE9A', ten: 'Vận Tiêu' },
  { id: 'party', icon: '\uD83D\uDC65', ten: 'Tổ đội' },
  { id: 'farm', icon: '\uD83C\uDF3E', ten: 'Farm' },
];
var activeTab = 'fish';
var tabCollapsed = false;
var shellCollapsed = false;
var apis = {};
var containers = {};
var tabBtns = {};
var shellPanel, shellMini, shellMiniStatus, tabContent, tabCollapseBtn;

function tongTabTen(id) {
  for (var i = 0; i < TABS.length; i++) if (TABS[i].id === id) return TABS[i].ten;
  return id;
}

function tongMiniStatus() {
  var api = apis[activeTab];
  var ten = tongTabTen(activeTab);
  if (!api || typeof api.status !== 'function') return ten + ' · —';
  try {
    var s = api.status();
    if (activeTab === 'fish') return '\uD83C\uDFA3 ' + (s.on ? 'BẬT · ' + s.target + ' · ' + s.vung + ' · Quăng ' + (s.stats ? s.stats.cast : 0) : 'TẮT');
    if (activeTab === 'boss') return '\uD83D\uDC09 ' + (s.on ? 'BẬT · ' + s.phase + (s.currentTarget ? ' · ' + s.currentTarget : '') : 'TẮT');
    if (activeTab === 'duoc') return '\uD83C\uDF3F ' + (s.on ? 'BẬT · ' + s.luotDaLam + '/15' + (s.viecHienTai ? ' · ' + s.viecHienTai : '') : 'TẮT');
    if (activeTab === 'hx') return '\uD83E\uDE78 ' + (s.on ? 'BẬT · ' + (s.inDungeon ? s.floor : 'ngoài hầm') : 'TẮT');
    if (activeTab === 'vantieu') return '\uD83D\uDE9A ' + (s.carrying ? 'Đang kéo · ' + (s.han || '') : 'Chưa nhận tiêu');
    if (activeTab === 'party') return '\uD83D\uDC65 ' + (s.inParty ? 'Trong đội · ' + s.members.length + ' người' : 'Chưa vào đội');
    if (activeTab === 'farm') return '\uD83C\uDF3E ' + (s.on ? 'BẬT · ' + s.phase + (s.khu ? ' · K' + s.khu : '') + (s.ratePerMin ? ' · ' + s.ratePerMin + '/phút' : '') : 'TẮT');
  } catch (e) { /* bỏ qua */ }
  return ten;
}

function tongRenderMini() {
  if (shellMiniStatus) shellMiniStatus.textContent = tongMiniStatus();
}

function tongShowTab(id) {
  if (!containers[id]) return;
  activeTab = id;
  Object.keys(containers).forEach(function (k) {
    containers[k].style.display = (k === id) ? '' : 'none';
  });
  Object.keys(tabBtns).forEach(function (k) {
    tabBtns[k].style.background = (k === id) ? '#6b4d16' : '#2a2113';
    tabBtns[k].style.fontWeight = (k === id) ? 'bold' : 'normal';
  });
  tongRenderMini();
}

function tongSetTabCollapsed(v) {
  tabCollapsed = !!v;
  if (tabContent) tabContent.style.display = tabCollapsed ? 'none' : '';
  if (tabCollapseBtn) tabCollapseBtn.textContent = tabCollapsed ? '＋' : '—';
  if (tabCollapseBtn) tabCollapseBtn.title = tabCollapsed ? 'Mở rộng nội dung tab' : 'Thu nhỏ nội dung tab (chỉ hiện thanh tab)';
}

function tongSetCollapsed(v) {
  shellCollapsed = !!v;
  if (shellPanel) shellPanel.style.display = shellCollapsed ? 'none' : 'block';
  if (shellMini) shellMini.style.display = shellCollapsed ? 'flex' : 'none';
  tongRenderMini();
}

function tongBuildShell() {
  // CSS ghi đè: panel của từng module vốn là fixed (top/right riêng) —
  // trong Tool Tổng chúng phải chảy trong tab (static, full-width, không
  // viền/bóng riêng; khung chung của shell lo phần đó). !important để
  // thắng inline style mà module tự đặt (vd setCollapsed đổi width).
  var st = document.createElement('style');
  st.id = 'tt2d-tong-style';
  st.textContent =
    '#tt2d-fish-panel,#tt2d-boss-panel,#tt2d-hx-panel,#tt2d-vantieu-panel,#tt2d-duoc-panel,#tt2d-party-panel,#tt2d-farm-panel,#tt2d-boss-mini{' +
    'position:static!important;top:auto!important;left:auto!important;right:auto!important;' +
    'width:100%!important;max-width:none!important;margin:0!important;padding:0!important;' +
    'border:none!important;border-radius:0!important;box-shadow:none!important;' +
    'background:transparent!important;z-index:auto!important;}';
  document.head.appendChild(st);

  shellPanel = document.createElement('div');
  shellPanel.id = 'tt2d-tong-panel';
  shellPanel.style.cssText = [
    'position:fixed', 'top:10px', 'right:10px', 'z-index:999999',
    'width:320px', 'background:rgba(20,14,8,0.92)', 'color:#ffe9b0',
    'border:1px solid #8a6a2f', 'border-radius:10px', 'padding:10px 12px',
    'font:12px/1.5 system-ui, sans-serif', 'box-shadow:0 4px 18px rgba(0,0,0,0.5)',
  ].join(';');
  shellPanel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<b>\uD83E\uDDF0 Tool Tổng Tu Tiên 2D</b>' +
      '<span>' +
        '<button id="tt2d-tong-collapse" title="Thu nhỏ toàn bộ bảng (tool vẫn chạy)" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</span>' +
    '</div>' +
    '<div id="tt2d-tong-tabbar" style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 0;align-items:center"></div>' +
    '<div id="tt2d-tong-content" style="margin-top:8px"></div>';
  document.body.appendChild(shellPanel);

  var tabbar = shellPanel.querySelector('#tt2d-tong-tabbar');
  TABS.forEach(function (t) {
    var b = document.createElement('button');
    b.textContent = t.icon + ' ' + t.ten;
    b.title = 'Tab ' + t.ten;
    b.style.cssText = 'padding:3px 7px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer;font-size:12px';
    b.addEventListener('click', function () { tongShowTab(t.id); });
    tabbar.appendChild(b);
    tabBtns[t.id] = b;
  });
  tabCollapseBtn = document.createElement('button');
  tabCollapseBtn.id = 'tt2d-tong-tab-collapse';
  tabCollapseBtn.textContent = '—';
  tabCollapseBtn.title = 'Thu nhỏ nội dung tab (chỉ hiện thanh tab)';
  tabCollapseBtn.style.cssText = 'padding:3px 7px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer;font-size:12px;margin-left:auto';
  tabCollapseBtn.addEventListener('click', function () { tongSetTabCollapsed(!tabCollapsed); });
  tabbar.appendChild(tabCollapseBtn);

  tabContent = shellPanel.querySelector('#tt2d-tong-content');
  TABS.forEach(function (t) {
    var c = document.createElement('div');
    c.id = 'tt2d-tong-tab-' + t.id;
    c.style.display = 'none';
    tabContent.appendChild(c);
    containers[t.id] = c;
  });

  shellPanel.querySelector('#tt2d-tong-collapse').addEventListener('click', function () { tongSetCollapsed(true); });

  // Thanh thu nhỏ toàn bộ bảng: tên + trạng thái ngắn tab đang dùng + nút ＋.
  shellMini = document.createElement('div');
  shellMini.id = 'tt2d-tong-mini';
  shellMini.style.cssText = [
    'position:fixed', 'top:10px', 'right:10px', 'z-index:999999',
    'display:none', 'align-items:center', 'gap:6px',
    'background:rgba(20,14,8,0.92)', 'color:#ffe9b0',
    'border:1px solid #8a6a2f', 'border-radius:8px', 'padding:4px 8px',
    'font:12px/1.4 system-ui, sans-serif', 'box-shadow:0 4px 18px rgba(0,0,0,0.5)',
    'max-width:320px',
  ].join(';');
  shellMini.innerHTML =
    '<b>\uD83E\uDDF0 Tool Tổng</b>' +
    '<span id="tt2d-tong-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
    '<button id="tt2d-tong-expand" title="Mở lại bảng đầy đủ" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px">＋</button>';
  document.body.appendChild(shellMini);
  shellMiniStatus = shellMini.querySelector('#tt2d-tong-mini-status');
  shellMini.querySelector('#tt2d-tong-expand').addEventListener('click', function () { tongSetCollapsed(false); });

  tongShowTab(activeTab);
  setInterval(tongRenderMini, 1000);
}

// Registry mà các module con dùng: lấy container tab + đăng ký handle.
var Tong = {
  tabBody: function (id) { return containers[id] || null; },
  register: function (id, api) { apis[id] = api; tongRenderMini(); },
  showTab: tongShowTab,
  setCollapsed: tongSetCollapsed,
  setTabCollapsed: tongSetTabCollapsed,
  activeTab: function () { return activeTab; },
  apis: apis,
};

tongBuildShell();

// Debug handle chung: __TT2D_TONG__.status() / .showTab(id) /
// .setCollapsed(v) / .setTabCollapsed(v) / .tab(id) / .nav (module Điều hướng).
window.__TT2D_TONG__ = {
  version: '1.0.0',
  showTab: tongShowTab,
  setCollapsed: tongSetCollapsed,
  setTabCollapsed: tongSetTabCollapsed,
  activeTab: function () { return activeTab; },
  tab: function (id) { return apis[id] || null; },
  status: function () {
    var out = { version: '1.0.0', activeTab: activeTab, tabs: {} };
    Object.keys(apis).forEach(function (id) {
      try { out.tabs[id] = apis[id].status ? apis[id].status() : null; } catch (e) { out.tabs[id] = null; }
    });
    return out;
  },
  nav: null, // module Điều hướng chung gắn vào đây (xem fragments/nav.js)
};


  // ================= MODULE: fish (Câu cá Hồ Tây v3.2.0: tỷ lệ cắn theo vùng/mồi/thời tiết, mục tiêu auto, tự vào Côn Bằng 12:30 + 19:30; TỰ ĐI tới điểm câu đã chọn (nav chung, 14 điểm cầu, điểm có người đứng yên thì tự lui sang điểm trống khác).) =================

  (function () {


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
      conTruocMs: 60000,        // v3.1: trước giờ Côn Bằng N ms thì không quăng mới, chờ gắn dây
      conChoToiDaMs: 90000,     // v3.1: chờ nút Côn tối đa N ms sau khi vào khung giờ rồi quay lại câu thường
      tiLeToiThieuMauTT: 3,     // v3.1: cần tối thiểu N lần quăng/(thời tiết+vùng) mới tin tỷ lệ theo thời tiết
      chiemDungYenMs: 5000,     // v3.2: người khác đứng yên N ms đúng ô điểm câu thì tính là chiếm chỗ
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
    // --- v3.1: Côn Bằng ---
    var conDangHoatDong = false; // đã thấy nút Côn/Nối trong khung giờ này
    var conDaNoi = false;        // đã gắn dây vào Côn (đang kéo hoặc vừa đứt chờ nối lại)
    var conDangKeo = false;      // đang kéo Côn (phân biệt với kéo cá thường)
    var conKhung = null;         // khung giờ Côn hiện tại (batMs) — để biết khi nào hết
    var conChoDen = 0;           // hạn chót chờ nút Côn xuất hiện (sau khi vào khung giờ)
    var conBoQuaKhung = null;    // khung giờ đã bỏ qua (không thấy nút Côn) — khỏi chờ lại
    var conThayNutLuc = 0;       // lần cuối thấy nút Côn/Nối (để biết Côn đã xong chưa)
    var conSoXong = 0;           // số lượt Côn đã kéo xong
    // --- v3.1: thời tiết ---
    var ratesTT = {};            // key id thời tiết -> { vung: {nong,giua,sau}, moi: {key: {...}} }
    var castTT = null;           // thời tiết của lượt quăng đang chạy (để ghi tỷ lệ đúng)
    // --- v3.2: TỰ ĐI tới điểm câu (chỉ trong Tool Tổng — cần module nav) ---
    // 14 điểm cầu đã xác minh từ client 24/11 (map van_can, TILE=32,
    // SAT_NUOC_PX=52): ô '=' đi được + kề nước theo đúng hàm ganNuoc của
    // game (tâm nhân vật cách mép ô nước ≤52px). (49,14) KHÔNG phải điểm
    // câu hợp lệ — quăng được nhưng phao không tới nước (89 lần, 0 cắn).
    var SPOTS = [
      { x: 38, y: 14, ten: 'Cầu (38,14)' }, { x: 39, y: 14, ten: 'Cầu (39,14)' },
      { x: 40, y: 14, ten: 'Cầu (40,14)' }, { x: 41, y: 14, ten: 'Cầu (41,14)' },
      { x: 42, y: 14, ten: 'Cầu (42,14)' }, { x: 43, y: 14, ten: 'Cầu (43,14)' },
      { x: 44, y: 14, ten: 'Cầu (44,14)' }, { x: 45, y: 14, ten: 'Cầu (45,14)' },
      { x: 38, y: 15, ten: 'Cầu (38,15)' }, { x: 39, y: 15, ten: 'Cầu (39,15)' },
      { x: 40, y: 15, ten: 'Cầu (40,15)' }, { x: 41, y: 15, ten: 'Cầu (41,15)' },
      { x: 42, y: 15, ten: 'Cầu (42,15)' }, { x: 43, y: 15, ten: 'Cầu (43,15)' },
    ];
    var spotIdx = 0;             // điểm câu đã chọn (mặc định 0 = Cầu (38,14))
    var spotDoi = false;         // người dùng vừa đổi điểm câu (cần đi tới điểm mới)
    var tuDi = false;            // tự di chuyển tới điểm câu đã chọn?
    var movePhase = 'idle';      // idle | moving | arrived (đang tự đi tới điểm câu)
    var moveFails = 0;           // số lần tự đi thất bại liên tiếp (tối đa 3)
    var MAX_MOVE_FAILS = 3;
    var lastMoveCheckAt = 0;     // lần cuối kiểm tra vị trí/điểm câu (tối đa 2 lần/giây)
    var sanSangCau = false;      // kết quả kiểm tra lần cuối (đã ở điểm câu?)
    var lastMoveStatus = '';     // dòng trạng thái tự đi hiện tại
    var lastNoRouteLogAt = 0;    // chống spam log "không có đường bộ"
    var lastUiLogAt = 0;         // chống spam log "chưa thấy giao diện câu"
    var moUiLan = 0;             // số lần đã thử mở giao diện câu sau khi tới nơi
    var remoteSeen = {};         // id người chơi khác -> {tx, ty, since} (theo dõi đứng yên)
    var lastRemoteScanAt = 0;    // lần cuối quét vị trí người chơi khác (tối đa 1 lần/giây)

    function rand(a, b) { return a + Math.random() * (b - a); }
    function randInt(a, b) { return Math.round(rand(a, b)); }
    function pad2(n) { return (n < 10 ? '0' : '') + n; }

    // ---------------- Côn Bằng (v3.1) ----------------
    // Client 24/11 (VanCan): CON_GIO=[[12,30],[19,30]] giờ VN, CON_DAI_MS=360000.
    var CON_GIO = [[12, 30], [19, 30]];
    var CON_DAI_MS = 360000; // 6 phút
    var VN_OFFSET_MS = 7 * 3600000;
    function msTrongNgayVN(dateMs) {
      var t = dateMs + VN_OFFSET_MS;
      return ((t % 86400000) + 86400000) % 86400000;
    }
    function ngayVNStr(dateMs) {
      var d = new Date(dateMs + VN_OFFSET_MS);
      return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
    }
    function gioPhut(ms) {
      var p = Math.floor(ms / 60000) % 1440;
      return pad2(Math.floor(p / 60)) + ':' + pad2(p % 60);
    }
    function msSangChu(ms) {
      var s = Math.max(0, Math.ceil(ms / 1000));
      if (s < 60) return s + 's';
      var m = Math.floor(s / 60);
      return m + 'p' + (s % 60 ? ' ' + (s % 60) + 's' : '');
    }
    // Trạng thái Côn Bằng theo đồng hồ (chỉ để hiển thị + chờ gắn dây; gắn dây
    // thì DỰA VÀO NÚT game, vì đồng hồ máy có thể lệch với giờ server).
    function conTrangThai(dateMs) {
      var ms = msTrongNgayVN(dateMs);
      for (var i = 0; i < CON_GIO.length; i++) {
        var bat = (CON_GIO[i][0] * 60 + CON_GIO[i][1]) * 60000;
        var het = bat + CON_DAI_MS;
        if (ms >= bat && ms < het) {
          return { dangDienRa: true, batMs: bat, hetMs: het, conLaiMs: het - ms, sapMs: bat };
        }
      }
      var sap = null;
      for (var j = 0; j < CON_GIO.length; j++) {
        var b2 = (CON_GIO[j][0] * 60 + CON_GIO[j][1]) * 60000;
        if (ms < b2) { sap = b2; break; }
      }
      if (sap === null) sap = (CON_GIO[0][0] * 60 + CON_GIO[0][1]) * 60000 + 86400000;
      return { dangDienRa: false, batMs: null, hetMs: null, conLaiMs: sap - ms, sapMs: sap };
    }
    // Có nên chờ Côn Bằng (không quăng cần thường) không? Trả về chuỗi trạng thái
    // để hiện, hoặc null nếu cứ câu thường.
    function lyDoChoCon(now, ct) {
      if (conDaNoi) return null; // đã gắn dây rồi — đang kéo, không chờ nữa
      if (ct.dangDienRa) {
        if (conDangHoatDong) {
          // Đã thấy nút Côn trong khung giờ này nhưng giờ nút không còn (vd vừa
          // câu xong 1 con cá) — chờ nó hiện lại; quá 90s không thấy thì Côn
          // có lẽ đã xong, quay lại câu thường.
          if (conThayNutLuc && now - conThayNutLuc > 90000) {
            conDangHoatDong = false; conDaNoi = false; conDangKeo = false; conChoDen = 0;
            log('Không thấy nút Côn nữa — có lẽ Côn đã xong, câu thường tiếp.');
            return null;
          }
          return 'Côn Bằng đang trồi — chờ nút Côn để gắn dây…';
        }
        // Chưa thấy nút Côn trong khung giờ này: chờ tối đa conChoToiDaMs.
        if (!conChoDen) conChoDen = now + CFG.conChoToiDaMs;
        if (now < conChoDen) return 'Côn Bằng đang trồi — chờ nút Côn…';
        if (conBoQuaKhung !== ct.batMs) {
          conBoQuaKhung = ct.batMs;
          log('Không thấy nút Côn trong khung giờ này — câu thường tiếp.');
        }
        return null;
      }
      // Sắp tới giờ Côn (trong conTruocMs): đừng quăng mới, chờ gắn dây.
      if (ct.conLaiMs <= CFG.conTruocMs) {
        return 'Côn Bằng sắp trồi lúc ' + gioPhut(ct.sapMs) + ' — chờ gắn dây…';
      }
      return null;
    }

    // ---------------- Thời tiết (v3.1) ----------------
    // Client 24/11 (VanCan.LUAT): 6 loại, đổi mỗi ngày theo hash ngày (luatKy).
    // Server gửi id thời tiết qua tin tt (a.luat) → game hiện trong <span class="vc-luat">
    // (<i class="vc-luat-ic"> icon + <span class="vc-luat-ten"> tên). Tool đọc DOM trước,
    // không có DOM thì tự tính bằng hash ngày y hệt client làm dự phòng.
    var LUAT = [
      { id: 'nang_gat', ten: 'Nắng Gắt', icon: '☀️', cau: 'Cá sâu ăn mồi, chỗ nông vắng.' },
      { id: 'mua_bui', ten: 'Mưa Bụi', icon: '🌦️', cau: 'Giữa hồ đông cá, rỉa mồi nhiều.' },
      { id: 'gio_nom', ten: 'Gió Nồm', icon: '🌬️', cau: 'Gió dạt, quăng khó trúng chỗ.' },
      { id: 'nuoc_duc', ten: 'Nước Đục', icon: '🌫️', cau: 'Dấu nước mờ, cá to hơn.' },
      { id: 'linh_trieu', ten: 'Linh Triều', icon: '🌊', cau: 'Giao Ngư dễ cắn mà giãy dữ.' },
      { id: 'lang_song', ten: 'Lặng Sóng', icon: '🍃', cau: 'Hồ yên, nhiều vật lạ.' },
    ];
    var LUAT_THEO_ID = {}, LUAT_THEO_TEN = {};
    LUAT.forEach(function (w) { LUAT_THEO_ID[w.id] = w; LUAT_THEO_TEN[w.ten] = w; });
    // Gợi ý theo mô tả thời tiết của game — chỉ dùng khi chưa có dữ liệu quan sát.
    var GOI_Y_THEO_TT = {
      linh_trieu: { vung: 'sau', moi: 'long_huong' }, // Giao Ngư dễ cắn
      nang_gat: { vung: 'sau', moi: null },           // Cá sâu ăn mồi
      mua_bui: { vung: 'giua', moi: null },           // Giữa hồ đông cá
    };
    function luatKy(ngayStr) { // hash ngày y hệt client: i=7; i=(31*i+code)>>>0; LUAT[i%6]
      var s = String(ngayStr || ''), i = 7;
      for (var k = 0; k < s.length; k++) i = (31 * i + s.charCodeAt(k)) >>> 0;
      return LUAT[i % LUAT.length];
    }
    function thoiTietTuDOM() {
      var el = document.querySelector('.vc-luat-ten');
      if (el) {
        var t = (el.textContent || '').trim();
        if (LUAT_THEO_TEN[t]) return { w: LUAT_THEO_TEN[t], nguon: 'dom' };
      }
      return null;
    }
    function thoiTietTuNgay(dateMs) {
      return { w: luatKy(ngayVNStr(dateMs)), nguon: 'tinh' };
    }
    // Thời tiết hiện tại (cache ~5s để khỏi đọc DOM mỗi tick).
    var ttCache = null, ttCacheAt = 0;
    function thoiTietHienTai() {
      var now = Date.now();
      if (ttCache && now - ttCacheAt < 5000) return ttCache;
      var r = thoiTietTuDOM() || thoiTietTuNgay(now);
      ttCache = r; ttCacheAt = now;
      return r;
    }
    function ttBucket(id) {
      if (!ratesTT[id]) {
        ratesTT[id] = {
          vung: { nong: { quang: 0, can: 0, cauDuoc: 0 }, giua: { quang: 0, can: 0, cauDuoc: 0 }, sau: { quang: 0, can: 0, cauDuoc: 0 } },
          moi: {},
        };
      }
      return ratesTT[id];
    }

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
        localStorage.setItem(LS_KEY, JSON.stringify({ vung: ratesVung, moi: ratesMoi, tt: ratesTT }));
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
        if (d && d.tt) { // v3.1: tỷ lệ theo thời tiết
          Object.keys(d.tt).forEach(function (id) {
            if (!LUAT_THEO_ID[id]) return;
            var b = ttBucket(id);
            ['nong', 'giua', 'sau'].forEach(function (z) {
              if (d.tt[id].vung && d.tt[id].vung[z]) {
                b.vung[z].quang = d.tt[id].vung[z].quang | 0;
                b.vung[z].can = d.tt[id].vung[z].can | 0;
                b.vung[z].cauDuoc = d.tt[id].vung[z].cauDuoc | 0;
              }
            });
            if (d.tt[id].moi) {
              Object.keys(d.tt[id].moi).forEach(function (k) {
                if (MOI_TEN[k]) {
                  b.moi[k] = { quang: d.tt[id].moi[k].quang | 0, can: d.tt[id].moi[k].can | 0, cauDuoc: d.tt[id].moi[k].cauDuoc | 0 };
                }
              });
            }
          });
        }
      } catch (e) { /* dữ liệu cũ hỏng — bỏ qua, bắt đầu lại từ 0 */ }
    }
    function xoaRates() {
      ['nong', 'giua', 'sau'].forEach(function (z) { ratesVung[z] = { quang: 0, can: 0, cauDuoc: 0 }; });
      ratesMoi = {};
      ratesTT = {};
      luongHienTai = null;
      luuRates();
      renderRates();
      renderLuong();
      renderThoiTiet();
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
      castTT = thoiTietHienTai().w.id; // thời tiết lúc quăng (để ghi cắn/câu được đúng)
      var b = ttBucket(castTT); // v3.1: ghi theo thời tiết
      if (b.vung[vung]) b.vung[vung].quang += 1;
      var bm = b.moi[moi] || (b.moi[moi] = { quang: 0, can: 0, cauDuoc: 0 });
      bm.quang += 1;
      luuRates();
      renderRates();
      renderThoiTiet();
    }
    // Ghi 1 lần kéo xong (nút về "Quăng" sau khi kéo) — tính là câu được 1 con.
    function ghiNhanCauDuoc() {
      var v = castVung || vungHien;
      var m = castMoi || moiDangDung;
      if (ratesVung[v]) ratesVung[v].cauDuoc += 1;
      if (ratesMoi[m]) ratesMoi[m].cauDuoc += 1;
      var b = ttBucket(castTT || thoiTietHienTai().w.id); // v3.1: ghi theo thời tiết lúc quăng
      if (b.vung[v]) b.vung[v].cauDuoc += 1;
      if (b.moi[m]) b.moi[m].cauDuoc += 1;
      luuRates();
      renderRates();
      renderThoiTiet();
    }

    // Vùng có tỷ lệ cắn tốt nhất trong 1 bảng tỷ lệ (đủ mẫu, tỷ lệ > 0 — hoặc
    // tất cả vùng đã đủ mẫu thì lấy tốt nhất kể cả 0). null = chưa đủ dữ liệu.
    function vungTotNhat(bang, exclude, minMau) {
      var tot = null, totTiLe = -1, coTiLeDuong = false, tatCaDuMau = true;
      VUNG_THU_TU.forEach(function (z) {
        if (z === exclude) return;
        var r = bang[z];
        if (!r || r.quang < minMau) { tatCaDuMau = false; return; }
        var t = tiLeCan(r);
        if (t > 0) coTiLeDuong = true;
        if (t > totTiLe || (t === totTiLe && tot && r.quang > bang[tot].quang)) { tot = z; totTiLe = t; }
      });
      if (tot && (coTiLeDuong || tatCaDuMau)) return tot;
      return null;
    }
    // Vùng chưa đủ mẫu đầu tiên theo thứ tự thử (để thử dần khi chưa có dữ liệu).
    function vungChuaDuMau(bang, exclude, minMau) {
      for (var i = 0; i < VUNG_THU_TU.length; i++) {
        var z = VUNG_THU_TU[i];
        if (z === exclude) continue;
        var r = bang[z];
        if (!r || r.quang < minMau) return z;
      }
      return null;
    }
    // Mồi có tỷ lệ cắn tốt nhất trong 1 bảng mồi (đủ mẫu, tỷ lệ > 0). null = chưa có.
    function moiTotNhat(bangMoi, minMau) {
      if (!bangMoi) return null;
      var tot = null, totTiLe = -1;
      Object.keys(bangMoi).forEach(function (k) {
        var r = bangMoi[k];
        if (r.quang >= minMau) {
          var t = tiLeCan(r);
          if (t > 0 && t > totTiLe) { tot = k; totTiLe = t; }
        }
      });
      return tot;
    }
    // Gợi ý vùng + mồi tốt nhất lúc này (để hiện trong bảng + dùng cho chế độ auto):
    // 1) tỷ lệ theo thời tiết hiện tại → 2) tỷ lệ chung → null (chưa đủ dữ liệu).
    function goiYThoiTiet(w) {
      var tt = ratesTT[w.id];
      var v = tt ? vungTotNhat(tt.vung, null, CFG.tiLeToiThieuMauTT) : null;
      var m = tt ? moiTotNhat(tt.moi, CFG.tiLeToiThieuMauTT) : null;
      if (v) return { vung: v, moi: m, tiLe: tiLeCan(tt.vung[v]), nguon: w.ten };
      v = vungTotNhat(ratesVung, null, CFG.tiLeToiThieuMau);
      m = moiTotNhat(ratesMoi, CFG.tiLeToiThieuMau);
      if (v) return { vung: v, moi: m, tiLe: tiLeCan(ratesVung[v]), nguon: 'chung' };
      return null;
    }

    // Chế độ "Tự động": chọn vùng + mồi theo tỷ lệ cắn tốt nhất đã quan sát.
    // v3.1 — thứ tự ưu tiên: (1) tỷ lệ theo THỜI TIẾT hiện tại (đủ mẫu);
    // (2) tỷ lệ chung (mọi thời tiết); (3) gợi ý theo mô tả thời tiết của game;
    // (4) thử các vùng chưa đủ mẫu theo thứ tự Giữa → Sâu → Nông.
    // - Cần tối thiểu CFG.tiLeToiThieuMau lần quăng/vùng (hoặc/mồi) mới tin tỷ lệ.
    // - exclude: vùng cần loại trừ (khi vừa 2 lần không cắn ở vùng đó).
    function chonTuDong(exclude, lyDo) {
      var w = thoiTietHienTai().w;
      var tt = ratesTT[w.id];
      var vungChon = null, nguon = '';
      if (tt) {
        vungChon = vungTotNhat(tt.vung, exclude, CFG.tiLeToiThieuMauTT);
        if (vungChon) nguon = 'theo ' + w.ten;
      }
      if (!vungChon) {
        vungChon = vungTotNhat(ratesVung, exclude, CFG.tiLeToiThieuMau);
        if (vungChon) nguon = 'chung';
      }
      if (!vungChon) {
        var goiY = GOI_Y_THEO_TT[w.id];
        if (goiY && goiY.vung && goiY.vung !== exclude) {
          vungChon = goiY.vung;
          nguon = 'gợi ý ' + w.ten;
        }
      }
      if (!vungChon) {
        vungChon = vungChuaDuMau(ratesVung, exclude, CFG.tiLeToiThieuMau) || 'giua';
        nguon = 'thử vùng';
      }
      // Mồi: tỷ lệ theo thời tiết → tỷ lệ chung → gợi ý thời tiết → Ngọc Hà.
      var moiChon = (tt ? moiTotNhat(tt.moi, CFG.tiLeToiThieuMauTT) : null) ||
        moiTotNhat(ratesMoi, CFG.tiLeToiThieuMau);
      if (!moiChon) {
        var gy = GOI_Y_THEO_TT[w.id];
        moiChon = (gy && gy.moi) || 'ngoc_ha';
      }
      TARGETS.auto.moi = moiChon;
      TARGETS.auto.moiTen = MOI_TEN[moiChon] || moiChon;
      TARGETS.auto.duPhong = (moiChon === 'van_khau') ? 'ngoc_ha' : 'van_khau';
      TARGETS.auto.duPhongTen = MOI_TEN[TARGETS.auto.duPhong];
      moiDaChon = null; // để damBaoMoi chọn lại mồi mới
      doiVung(vungChon);
      log('Tự động' + (lyDo ? ' (' + lyDo + ')' : '') + ': chọn vùng ' + VUNG_TEN[vungChon] +
        ' (' + nguon + ', cắn ' + pct(tiLeCan((tt && tt.vung[vungChon]) || ratesVung[vungChon])) + ') + mồi ' + TARGETS.auto.moiTen + '.');
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
      var b = ttBucket(castTT || thoiTietHienTai().w.id); // v3.1: ghi theo thời tiết lúc quăng
      if (b.vung[v]) b.vung[v].can += 1;
      if (b.moi[m]) b.moi[m].can += 1;
      luongHienTai = v; // luồng hiện tại = vùng vừa cắn
      luuRates();
      renderRates();
      renderLuong();
      renderThoiTiet();
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

    // ---------------- v3.2: TỰ ĐI tới điểm câu (chỉ trong Tool Tổng) ----------------
    // Theo đúng mẫu tab Boss v1.2.0 (nút TỰ ĐI, movePhase, kẹt 3 lần thì tắt).
    // nav.diToiMap/diToi tự tắt Auto trước khi đẩy joystick (joystick không
    // chạy khi Auto BẬT) nên tab này không cần tắt Auto tay. Tới điểm câu
    // rồi thì giao diện câu tự hiện (VanCanUI.update) và tick câu bình thường.
    function nav() {
      return window.__TT2D_NAV__ || (window.__TT2D_TONG__ && window.__TT2D_TONG__.nav) || null;
    }
    // Map hiện tại (id client): ưu tiên nav.docViTri(), fallback đọc #hud-map.
    function docMapHienTai() {
      try {
        var n = nav();
        if (n && typeof n.docViTri === 'function') {
          var p = n.docViTri();
          if (p && p.map) return p.map;
        }
      } catch (e) { /* bỏ qua */ }
      var hm = document.querySelector('#hud-map');
      var s = hm ? (hm.innerText || hm.textContent || '') : '';
      if (/Hồ Tây/.test(s)) return 'van_can';
      if (/Thảo Dược Cốc/.test(s)) return 'duoc_vien';
      if (/Rừng Trúc/.test(s)) return 'thanh_truc_lam';
      if (/Chân Núi Tản Viên/.test(s)) return 'tan_vien';
      if (/Miếu Hoang/.test(s)) return 'mieu_hoang';
      if (/Phong Địa/.test(s)) return 'phong_dia';
      return null;
    }
    // Vị trí hiện tại (ô x, y): ưu tiên nav.docViTri(), fallback đọc (x,y)
    // trong body text (cùng cách nav đọc).
    function docViTriHienTai() {
      try {
        var n = nav();
        if (n && typeof n.docViTri === 'function') {
          var p = n.docViTri();
          if (p && p.x !== null && p.y !== null) return { x: p.x, y: p.y };
        }
      } catch (e) { /* bỏ qua */ }
      var t = document.body ? (document.body.innerText || '') : '';
      var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (m) return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
      return null;
    }
    // Quét vị trí người chơi khác: Gateway.remotes {id: {x, y}} — x/y là
    // PIXEL (TILE=32), khác với mock test của tab Tổ đội (x/y là ô). Chỉ ghi
    // nhận lần đầu thấy ở 1 ô (since) — đứng yên thì since giữ nguyên.
    function quetNguoiDung(now) {
      if (now - lastRemoteScanAt < 1000) return; // quét tối đa 1 lần/giây
      lastRemoteScanAt = now;
      var rems = null;
      try {
        var gw = window.__ns_ && window.__ns_.Gateway;
        rems = gw && gw.remotes;
      } catch (e) { rems = null; }
      var thay = {};
      if (rems) {
        Object.keys(rems).forEach(function (id) {
          var r = rems[id];
          if (!r || typeof r.x !== 'number' || typeof r.y !== 'number') return;
          var tx = Math.floor(r.x / 32), ty = Math.floor(r.y / 32);
          var cu = remoteSeen[id];
          if (cu && cu.tx === tx && cu.ty === ty) thay[id] = cu;
          else thay[id] = { tx: tx, ty: ty, since: now };
        });
      }
      remoteSeen = thay;
    }
    // Có người khác đứng yên >= chiemDungYenMs ĐÚNG ô điểm câu này không?
    // Chỉ tính đúng ô (không tính ô kề) — người đi ngang qua (đứng <5s) thì
    // không tính, khỏi nhảy điểm liên tục.
    function diemBiChiem(spot, now) {
      var ids = Object.keys(remoteSeen);
      for (var i = 0; i < ids.length; i++) {
        var s = remoteSeen[ids[i]];
        if (s.tx === spot.x && s.ty === spot.y && now - s.since >= CFG.chiemDungYenMs) return true;
      }
      return false;
    }
    // Điểm câu sẽ tới: điểm đã chọn nếu còn trống, không thì điểm trống gần
    // vị trí hiện tại nhất (Manhattan). Hết điểm trống -> null. tru (nếu có)
    // là điểm cần loại ra (vd đang đứng ở đó mà bị chiếm).
    function chonDiemTrong(now, tru) {
      quetNguoiDung(now);
      var cur = docViTriHienTai();
      var chon = SPOTS[spotIdx];
      if ((!tru || chon !== tru) && !diemBiChiem(chon, now)) return chon;
      var tot = null, totD = Infinity;
      SPOTS.forEach(function (sp) {
        if (tru && sp === tru) return;
        if (diemBiChiem(sp, now)) return;
        var d = cur ? (Math.abs(sp.x - cur.x) + Math.abs(sp.y - cur.y)) : 0;
        if (d < totD) { tot = sp; totD = d; }
      });
      return tot;
    }
    // Đang quăng/chờ/giật/kéo (kể cả Côn Bằng) -> không di chuyển.
    function dangCau() {
      return state === 'casting' || state === 'waiting' || state === 'jerking' ||
        state === 'pulling' || state === 'con-wait' || state === 'con-tapped';
    }
    // Giao diện câu có đang mở không (button.vc-nut hiện trên màn hình)?
    function giaoDienCauMo() {
      var b = nutBtn();
      return !!(b && b.offsetParent !== null);
    }
    // Giao diện câu (button.vc-nut) TỰ HIỆN khi vào Hồ Tây trong giờ mở
    // (VanCanUI.update) — không cần bấm nút tương tác để mở. Nếu chưa thấy
    // (vừa qua cổng, game chưa kịp mở) thì thử bấm nút tương tác với hồ tối
    // đa 3 lần; quá 3 lần thì thôi, báo rõ để người dùng bấm tay.
    function moGiaoDienCau() {
      if (giaoDienCauMo()) { moUiLan = 0; return true; }
      if (moUiLan >= 3) {
        if (Date.now() - lastUiLogAt > 60000) {
          lastUiLogAt = Date.now();
          log('Chưa thấy giao diện câu sau khi tới điểm câu — bấm nút tương tác với hồ rồi bấm BẬT lại (hoặc chờ game mở giao diện).');
        }
        return false;
      }
      var btn = null;
      var atk = document.querySelector('#btn-attack');
      var lab = atk ? ((atk.getAttribute('aria-label') || '') + ' ' + (atk.textContent || '')) : '';
      if (atk && /tương tác/i.test(lab) && /hồ|câu|nước/i.test(lab)) btn = atk;
      if (!btn) {
        var all = document.querySelectorAll('button');
        for (var i = 0; i < all.length; i++) {
          var b2 = all[i];
          if (!b2.offsetParent) continue;
          var t2 = (b2.innerText || b2.textContent || '');
          if (/tương tác/i.test(t2) && /hồ|câu|nước/i.test(t2)) { btn = b2; break; }
        }
      }
      moUiLan++;
      if (btn) {
        // Nút game chỉ bind pointerdown (đã xác minh 06:01 25/11) — dispatch
        // pointerdown/pointerup như bấm tay thật, KHÔNG dùng .click().
        try {
          btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true }));
          setTimeout(function () {
            try { btn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })); } catch (e) {}
          }, 60);
          log('Đã bấm nút tương tác với hồ để mở giao diện câu (lần ' + moUiLan + '/3).');
        } catch (e) { /* bỏ qua */ }
      } else if (moUiLan === 1) {
        log('Chờ game mở giao diện câu (vừa tới điểm câu)…');
      }
      return false;
    }
    // TẮT tự đi vì hết điểm trống — báo rõ, bấm TỰ ĐI lại sau để thử lại.
    function tatTuDiHetCho() {
      tuDi = false;
      capNhatNutTuDi();
      setMoveStatus('Các điểm câu đều có người — đã TẮT tự đi (bấm TỰ ĐI lại sau để thử lại).');
      log('Các điểm câu đều có người đứng — đã TẮT tự đi. Bấm TỰ ĐI lại sau để thử lại.');
    }
    // Kiểm tra có cần tự đi tới điểm câu không. Trả về true = đã ở điểm câu
    // (sẵn sàng câu), false = chưa ở điểm câu (đang đi / không đi được).
    // Gọi từ tick() — kiểm tra vị trí tối đa 2 lần/giây (khỏi đọc body liên tục).
    function kiemTraDiHo() {
      if (!on || !tuDi) return true;
      if (dangCau()) return true; // đang câu thì không di chuyển (đã ở điểm câu)
      if (movePhase === 'moving') return false;
      var now = Date.now();
      if (now - lastMoveCheckAt < 500) return sanSangCau;
      lastMoveCheckAt = now;
      if (moveFails >= MAX_MOVE_FAILS) return false; // đã tắt tự đi sau 3 lần lỗi
      var n = nav();
      if (!n || typeof n.diToiMap !== 'function' || typeof n.diToi !== 'function') {
        if (now - lastNoRouteLogAt > 60000) {
          lastNoRouteLogAt = now;
          log('TỰ ĐI cần module nav (chỉ có trong Tool Tổng) — tool lẻ không tự đi được.');
        }
        sanSangCau = false;
        return false;
      }
      var curMap = docMapHienTai();
      if (curMap === 'van_can') {
        var cur = docViTriHienTai();
        var dich = chonDiemTrong(now, null);
        if (!dich) { tatTuDiHetCho(); sanSangCau = false; return false; }
        if (cur && cur.x === dich.x && cur.y === dich.y) {
          // Đang đứng đúng điểm sẽ câu — nhưng nếu có người khác đứng yên
          // ĐÚNG ô này thì lui sang điểm trống khác (không chen chúc).
          if (diemBiChiem(dich, now)) {
            var khac = chonDiemTrong(now, dich);
            if (!khac) { tatTuDiHetCho(); sanSangCau = false; return false; }
            movePhase = 'moving';
            setMoveStatus('Điểm ' + dich.ten + ' có người đứng — đang lui sang ' + khac.ten + '…');
            log('Điểm câu ' + dich.ten + ' có người đứng yên — tự lui sang ' + khac.ten + '.');
            diToiDiem(khac);
            sanSangCau = false;
            return false;
          }
          if (movePhase !== 'idle') movePhase = 'idle';
          sanSangCau = true;
          if (!giaoDienCauMo()) moGiaoDienCau();
          return true;
        }
        if (cur && !spotDoi) {
          // Đang đứng ở 1 điểm cầu hợp lệ khác (vd nav chuyển hướng do điểm
          // đã chọn có người) — câu luôn ở đây, đồng bộ ô chọn theo vị trí thật.
          var oHien = null;
          for (var i = 0; i < SPOTS.length; i++) {
            if (SPOTS[i].x === cur.x && SPOTS[i].y === cur.y) { oHien = SPOTS[i]; break; }
          }
          if (oHien) {
            if (SPOTS[spotIdx].x !== cur.x || SPOTS[spotIdx].y !== cur.y) {
              dongBoDiemCau(SPOTS.indexOf(oHien));
              log('Đang đứng ở điểm câu ' + oHien.ten + ' — câu luôn ở đây.');
            }
            sanSangCau = true;
            if (!giaoDienCauMo()) moGiaoDienCau();
            return true;
          }
        }
        movePhase = 'moving';
        diToiDiem(dich);
        sanSangCau = false;
        return false;
      }
      // Chưa ở Hồ Tây: cần đường bộ tới van_can (qua Thảo Dược Cốc).
      var duong = null;
      try { duong = (typeof n.duongDi === 'function') ? n.duongDi(curMap, 'van_can') : null; } catch (e) { duong = null; }
      if (duong === null) {
        if (now - lastNoRouteLogAt > 60000) {
          lastNoRouteLogAt = now;
          log('Không có đường bộ tới Hồ Tây từ map hiện tại — không tự đi được.');
        }
        sanSangCau = false;
        return false;
      }
      var dich2 = chonDiemTrong(now, null);
      if (!dich2) { tatTuDiHetCho(); sanSangCau = false; return false; }
      movePhase = 'moving';
      setMoveStatus('Đang tự đi tới Hồ Tây, điểm câu ' + dich2.ten + '…');
      diToiDiem(dich2);
      sanSangCau = false;
      return false;
    }
    async function diToiDiem(dich) {
      var n = nav();
      try {
        log('TỰ ĐI: đang đi tới điểm câu ' + dich.ten + '…');
        setMoveStatus('Đang tự đi tới điểm câu ' + dich.ten + '…');
        var curMap = docMapHienTai();
        if (curMap !== 'van_can') {
          var okMap = await n.diToiMap('van_can');
          if (!okMap) throw new Error('diToiMap false');
        }
        var okToi = await n.diToi(dich.x, dich.y, 60);
        if (!okToi) throw new Error('diToi false');
        // Tới nơi: xác nhận vị trí thật.
        var cur = docViTriHienTai();
        if (cur && cur.x === dich.x && cur.y === dich.y) {
          movePhase = 'arrived';
          moveFails = 0;
          spotDoi = false;
          var idxDich = SPOTS.indexOf(dich);
          if (idxDich >= 0 && idxDich !== spotIdx) {
            log('Điểm câu ' + SPOTS[spotIdx].ten + ' có người đứng — chuyển sang ' + dich.ten + ' để câu.');
            dongBoDiemCau(idxDich);
          }
          log('Đã tới điểm câu ' + dich.ten + ' — chờ giao diện câu mở rồi tự câu.');
          setMoveStatus('Đã tới điểm câu ' + dich.ten + ' — bắt đầu câu.');
        } else if (cur) {
          // Tới được Hồ Tây nhưng chưa đúng ô điểm câu (vd bị chuyển hướng
          // sang ô cầu khác) — nếu ô hiện tại cũng là điểm câu hợp lệ thì
          // câu luôn ở đó, không thì tính là kẹt.
          var oHien2 = null;
          for (var j = 0; j < SPOTS.length; j++) {
            if (SPOTS[j].x === cur.x && SPOTS[j].y === cur.y) { oHien2 = SPOTS[j]; break; }
          }
          if (oHien2) {
            movePhase = 'arrived';
            moveFails = 0;
            spotDoi = false;
            var idx2 = SPOTS.indexOf(oHien2);
            if (idx2 !== spotIdx) {
              log('Điểm câu ' + SPOTS[spotIdx].ten + ' có người đứng — chuyển sang ' + oHien2.ten + ' để câu.');
              dongBoDiemCau(idx2);
            }
            log('Đã tới điểm câu ' + oHien2.ten + ' — chờ giao diện câu mở rồi tự câu.');
            setMoveStatus('Đã tới điểm câu ' + oHien2.ten + ' — bắt đầu câu.');
          } else {
            throw new Error('chưa tới đúng điểm câu (đang ở ' + cur.x + ',' + cur.y + ')');
          }
        } else {
          throw new Error('không đọc được vị trí sau khi di chuyển');
        }
      } catch (e) {
        moveFails++;
        movePhase = 'idle';
        log('TỰ ĐI tới điểm câu thất bại lần ' + moveFails + '/' + MAX_MOVE_FAILS + ' (' + (e && e.message ? e.message : e) + ').');
        setMoveStatus('Tự đi tới điểm câu thất bại lần ' + moveFails + '/' + MAX_MOVE_FAILS + '.');
        if (moveFails >= MAX_MOVE_FAILS) {
          tuDi = false;
          capNhatNutTuDi();
          setMoveStatus('Tự đi tới điểm câu thất bại 3 lần — đã TẮT tự đi.');
          log('Đã TẮT tự di chuyển sau 3 lần thất bại — tự đi tới điểm câu rồi bật lại.');
        }
      }
    }
    function setMoveStatus(s) {
      lastMoveStatus = s;
      if (moveEl) moveEl.textContent = s;
    }
    // Chọn điểm câu (người dùng đổi ô chọn / gọi setSpot): đánh dấu cần đi
    // tới điểm mới nếu TỰ ĐI đang BẬT.
    function datDiemCau(idx) {
      if (idx < 0 || idx >= SPOTS.length) return;
      spotIdx = idx;
      spotDoi = true;
      if (spotSel) spotSel.value = String(idx);
      log('Điểm câu: ' + SPOTS[idx].ten + (tuDi ? ' — TỰ ĐI sẽ tới điểm này.' : '.'));
    }
    // Đồng bộ ô chọn theo vị trí thật (khi nav chuyển hướng sang điểm khác) —
    // không đánh dấu là người dùng đổi điểm.
    function dongBoDiemCau(idx) {
      if (idx < 0 || idx >= SPOTS.length) return;
      spotIdx = idx;
      if (spotSel) spotSel.value = String(idx);
    }
    // Bật/tắt TỰ ĐI. Tool lẻ (không có nav) thì từ chối.
    function setTuDi(v) {
      if (v && !nav()) {
        log('TỰ ĐI cần module nav — chỉ có trong Tool Tổng (tool lẻ chạy một mình không tự đi được).');
        return;
      }
      tuDi = !!v;
      if (!tuDi) { movePhase = 'idle'; sanSangCau = false; setMoveStatus(''); }
      else {
        moveFails = 0;
        lastMoveCheckAt = 0; // kiểm tra ngay nhịp sau
        log('Đã BẬT tự đi tới điểm câu ' + SPOTS[spotIdx].ten + ' — tool sẽ tự đi khi chưa ở điểm câu.');
        setMoveStatus('TỰ ĐI đang BẬT — đang tới điểm câu ' + SPOTS[spotIdx].ten + '…');
      }
      capNhatNutTuDi();
    }
    function capNhatNutTuDi() {
      if (!tudiBtn) return;
      var coNav = !!nav();
      tudiBtn.textContent = tuDi ? 'TỰ ĐI: BẬT' : 'TỰ ĐI: TẮT';
      tudiBtn.style.background = tuDi ? '#6b4d16' : '#2a2113';
      tudiBtn.style.opacity = coNav ? '1' : '0.55';
      tudiBtn.title = coNav ? 'Tự di chuyển tới điểm câu đã chọn (chỉ trong Tool Tổng)' : 'TỰ ĐI cần module nav — chỉ có trong Tool Tổng';
    }

    // ---------------- Bảng điều khiển ----------------
    var panel, panelHead, panelBody, miniBar, miniStatusEl, statusEl, statsEl, logEl, toggleBtn, targetLineEl, luongEl, ratesEl, conEl, ttEl, zoneBtns = {}, targetBtns = {};
    var tudiBtn, spotSel, moveEl; // v3.2: nút TỰ ĐI + ô chọn điểm câu + dòng trạng thái tự đi
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
          '<b>🎣 Tool câu Hồ Tây v3.2</b>' +
          '<span>' +
            '<button id="tt2d-fish-min" title="Thu nhỏ bảng" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
            '<button id="tt2d-fish-hide" title="Ẩn bảng (tool vẫn chạy nếu đang BẬT)" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 2px">×</button>' +
          '</span>' +
        '</div>' +
        '<div id="tt2d-fish-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
          '<b>🎣 Hồ Tây v3.2</b>' +
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
        '<div style="margin:4px 0;display:flex;gap:6px;align-items:center">' +
          '<button id="tt2d-fish-tudi" title="Tự di chuyển tới điểm câu đã chọn (chỉ trong Tool Tổng)" style="flex:1;padding:6px;border-radius:6px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">TỰ ĐI: TẮT</button>' +
        '</div>' +
        '<div style="margin:4px 0">Điểm câu: ' +
          '<select id="tt2d-fish-spot" title="Điểm câu trên cầu Hồ Tây (đã xác minh: đi được + kề nước)" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:5px;padding:3px">' +
          '<option value="0" selected>Cầu (38,14)</option>' +
          '<option value="1">Cầu (39,14)</option>' +
          '<option value="2">Cầu (40,14)</option>' +
          '<option value="3">Cầu (41,14)</option>' +
          '<option value="4">Cầu (42,14)</option>' +
          '<option value="5">Cầu (43,14)</option>' +
          '<option value="6">Cầu (44,14)</option>' +
          '<option value="7">Cầu (45,14)</option>' +
          '<option value="8">Cầu (38,15)</option>' +
          '<option value="9">Cầu (39,15)</option>' +
          '<option value="10">Cầu (40,15)</option>' +
          '<option value="11">Cầu (41,15)</option>' +
          '<option value="12">Cầu (42,15)</option>' +
          '<option value="13">Cầu (43,15)</option>' +
          '</select>' +
        '</div>' +
        '<div id="tt2d-fish-move" style="margin:4px 0;color:#8fd8ff"></div>' +
        '<div style="margin:4px 0">Vùng quăng: ' +
          '<button data-zone="nong" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Nông</button> ' +
          '<button data-zone="giua" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#6b4d16;color:#ffe9b0;cursor:pointer">Giữa</button> ' +
          '<button data-zone="sau" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Sâu</button>' +
        '</div>' +
        '<div id="tt2d-fish-status" style="margin:6px 0;color:#bfe3ff">Chưa bật — bấm BẬT rồi bật TỰ ĐI để tự tới điểm câu, hoặc đứng ở cầu câu rồi bấm BẬT.</div>' +
        '<div id="tt2d-fish-con" style="margin:4px 0;color:#ffd36a">Côn Bằng: …</div>' +
        '<div id="tt2d-fish-thoitiet" style="margin:4px 0;color:#8fd8ff">Thời tiết: …</div>' +
        '<div id="tt2d-fish-stats" style="color:#c9f2c9">Quăng 0 · Giật 0 · Kéo 0 · Côn 0</div>' +
        '<div id="tt2d-fish-luong" style="margin:4px 0;color:#ffd27a">Luồng: chưa có (chưa thấy cá cắn)</div>' +
        '<div id="tt2d-fish-rates" style="color:#c9f2c9"></div>' +
        '<div id="tt2d-fish-log" style="margin-top:6px;max-height:96px;overflow:auto;color:#d8c9a3;font-size:11px"></div>' +
        '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">Chỉ bấm nút của game. Dừng khi rời hồ. TỰ ĐI: tự tới điểm câu đã chọn (chỉ trong Tool Tổng); điểm có người đứng yên thì tự lui sang điểm trống khác. Tool không thấy được luồng cá thật và không đổi được tỷ lệ cắn của server — chỉ chọn vùng/mồi theo tỷ lệ đã quan sát.</div>' +
        '</div>';
      Tong.tabBody('fish').appendChild(panel);

      panelHead = panel.querySelector('#tt2d-fish-head');
      panelBody = panel.querySelector('#tt2d-fish-body');
      miniBar = panel.querySelector('#tt2d-fish-mini');
      miniStatusEl = panel.querySelector('#tt2d-fish-mini-status');
      toggleBtn = panel.querySelector('#tt2d-fish-toggle');
      statusEl = panel.querySelector('#tt2d-fish-status');
      tudiBtn = panel.querySelector('#tt2d-fish-tudi');
      spotSel = panel.querySelector('#tt2d-fish-spot');
      moveEl = panel.querySelector('#tt2d-fish-move');
      statsEl = panel.querySelector('#tt2d-fish-stats');
      logEl = panel.querySelector('#tt2d-fish-log');
      targetLineEl = panel.querySelector('#tt2d-fish-target');
      luongEl = panel.querySelector('#tt2d-fish-luong');
      ratesEl = panel.querySelector('#tt2d-fish-rates');
      conEl = panel.querySelector('#tt2d-fish-con');
      ttEl = panel.querySelector('#tt2d-fish-thoitiet');

      toggleBtn.addEventListener('click', function () { setOn(!on); });
      if (tudiBtn) tudiBtn.addEventListener('click', function () { setTuDi(!tuDi); });
      if (spotSel) spotSel.addEventListener('change', function () { datDiemCau(parseInt(spotSel.value, 10)); });
      capNhatNutTuDi();
      panel.querySelector('#tt2d-fish-hide').addEventListener('click', function () {
        setCollapsed(true);
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
      renderCon();
      renderThoiTiet();
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
      var ct = conTrangThai(Date.now());
      var conTxt = (conDaNoi || conDangHoatDong || ct.dangDienRa) ? ' · 🐋 Côn' : '';
      miniStatusEl.textContent = (on ? 'BẬT' : 'TẮT') + ' · ' + VUNG_TEN[vungHien] +
        ' · Quăng ' + stats.cast + ' · Cắn ' + pct(tiLeCan(ratesVung[vungHien])) + conTxt;
    }
    function renderLuong() {
      if (!luongEl) return;
      if (luongHienTai) {
        luongEl.textContent = 'Luồng: ' + VUNG_TEN[luongHienTai] + ' (tỷ lệ cắn ' + pct(tiLeCan(ratesVung[luongHienTai])) + ')';
      } else {
        luongEl.textContent = 'Luồng: chưa có (chưa thấy cá cắn)';
      }
    }
    // Chỉ ghi text khi đổi (để gọi mỗi tick mà không ghi DOM liên tục).
    function setText(el, s) { if (el && el.textContent !== s) el.textContent = s; }
    // v3.1: dòng trạng thái Côn Bằng (12:30/19:30 giờ VN, 6 phút).
    // Chỉ hiện "ĐANG TRỒI — bấm Côn" khi ĐANG trong khung giờ (kẻo cờ
    // conDangHoatDong còn sót từ khung trước làm bảng hiện sai ngoài giờ).
    function renderCon() {
      if (!conEl) return;
      var ct = conTrangThai(Date.now());
      var s;
      if (conDaNoi) {
        s = 'Côn Bằng: ĐANG TRỒI — đang kéo Côn!' + (ct.dangDienRa ? ' · còn ' + msSangChu(ct.conLaiMs) : '');
      } else if (conDangHoatDong && ct.dangDienRa) {
        s = 'Côn Bằng: ĐANG TRỒI — bấm Côn để gắn dây · còn ' + msSangChu(ct.conLaiMs);
      } else if (ct.dangDienRa) {
        s = 'Côn Bằng: ĐANG TRỒI (còn ' + msSangChu(ct.conLaiMs) + ') — chờ nút Côn…';
      } else {
        s = 'Côn Bằng: sắp tới ' + gioPhut(ct.sapMs) + ' (còn ' + msSangChu(ct.conLaiMs) + ')';
      }
      setText(conEl, s);
    }
    // v3.1: dòng thời tiết + gợi ý vùng/mồi tốt nhất lúc này.
    function renderThoiTiet() {
      if (!ttEl) return;
      var r = thoiTietHienTai();
      var w = r.w;
      var s = 'Thời tiết: ' + w.icon + ' ' + w.ten + ' — ' + w.cau;
      var tot = goiYThoiTiet(w);
      if (tot) {
        s += ' | Tốt nhất lúc này: ' + VUNG_TEN[tot.vung] +
          (tot.moi ? ' + ' + (MOI_TEN[tot.moi] || tot.moi) : '') +
          ' (cắn ' + pct(tot.tiLe) + (tot.nguon === w.ten ? ', theo ' + w.ten : ', chung') + ')';
      } else {
        s += ' | Chưa đủ dữ liệu theo thời tiết này.';
      }
      if (r.nguon === 'tinh') s += ' (tính từ ngày — chưa đọc được từ game)';
      setText(ttEl, s);
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
      var w = thoiTietHienTai().w; // v3.1: tỷ lệ theo thời tiết hiện tại
      var tt = ratesTT[w.id];
      if (tt) {
        var coDuLieu = ['nong', 'giua', 'sau'].some(function (z) { return tt.vung[z].quang > 0; });
        if (coDuLieu) {
          html += '<div style="color:#8fd8ff">Theo ' + w.ten + ':</div>';
          ['nong', 'giua', 'sau'].forEach(function (z) {
            var r = tt.vung[z];
            if (r.quang > 0) {
              html += '<div>' + VUNG_TEN[z] + ': ' + r.quang + 'q · ' + r.can + ' cắn ' + pct(tiLeCan(r)) +
                ' · ' + r.cauDuoc + ' được</div>';
            }
          });
        }
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
        moveFails = 0; // v3.2: bật lại là thử tự đi lại từ đầu
        lastMoveCheckAt = 0;
        // BẬT là tự động đi tìm chỗ: đảm bảo đúng mồi + vùng cho mục tiêu rồi quăng
        if (target === 'auto') chonTuDong(null); // chọn lại vùng + mồi theo tỷ lệ mới nhất
        damBaoMoi();
        doiVung(vungHien);
        setStatus('Đang chạy — tìm chỗ cho ' + TARGETS[target].ten + '…');
        log('Tool BẬT (mục tiêu ' + TARGETS[target].ten + ', mồi ' +
          (moiDangDung === 'giun' ? 'Giun Đất' : moiDangDung) + ', vùng ' + VUNG_TEN[vungHien] + ').');
        var r0 = thoiTietHienTai(); // v3.1: báo thời tiết + giờ Côn Bằng tới
        var ct0 = conTrangThai(Date.now());
        log('Thời tiết: ' + r0.w.icon + ' ' + r0.w.ten + ' (' + (r0.nguon === 'dom' ? 'đọc từ game' : 'tính từ ngày') +
          '). Côn Bằng tới: ' + gioPhut(ct0.sapMs) + (ct0.dangDienRa ? ' (ĐANG TRỒI!)' : '') + '.');
        renderCon();
        renderThoiTiet();
      } else {
        if (holding) release();
        movePhase = 'idle'; // v3.2: dừng tool thì thôi chờ tự đi (chuyến đang đi sẽ tự hết)
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
      // --- v3.2: TỰ ĐI tới điểm câu (trước mọi logic câu) ---
      if (tuDi) {
        var sanSang = kiemTraDiHo();
        if (movePhase === 'moving') {
          setStatus(lastMoveStatus || 'Đang tự đi tới điểm câu…');
          return;
        }
        if (!sanSang) {
          setStatus(lastMoveStatus || 'Chưa ở điểm câu — TỰ ĐI chưa đi được (xem nhật ký).');
          return;
        }
      }
      var b = nutBtn();
      if (!b) {
        setStatus('Chưa thấy giao diện câu cá — vào Hồ Tây, đứng ở cầu câu.');
        return;
      }
      var t = nutText();
      var now = Date.now();

      // --- v3.1: Côn Bằng — theo dõi khung giờ (đồng hồ chỉ để hiển thị + chờ) ---
      var ct = conTrangThai(now);
      if (ct.dangDienRa) {
        if (conKhung !== ct.batMs) {
          // Vừa vào khung giờ Côn MỚI — reset trạng thái theo khung giờ cũ
          // (kẻo cờ "đã thấy nút Côn" từ khung trước làm tool tưởng Côn đã xong
          // rồi quăng cần thường ngay đầu khung mới).
          conKhung = ct.batMs;
          conDangHoatDong = false; conDaNoi = false; conDangKeo = false;
          conChoDen = 0; conBoQuaKhung = null; conThayNutLuc = 0;
        }
      } else if (conKhung !== null) {
        // Vừa hết khung giờ Côn Bằng.
        if (conDangHoatDong || conDaNoi) log('Côn Bằng đã hết — quay lại câu thường.');
        conDangHoatDong = false; conDaNoi = false; conDangKeo = false;
        conKhung = null; conChoDen = 0; conBoQuaKhung = null; conThayNutLuc = 0;
      }
      // Nút Côn/Nối hiện = sự kiện đang diễn ra (nguồn tin từ game, tin hơn đồng hồ).
      if (t === 'Côn' || /^Nối \d+$/.test(t)) {
        conDangHoatDong = true;
        conThayNutLuc = now;
        conChoDen = 0;
      }

      // --- v3.1: Côn Bằng — gắn dây (ưu tiên cao nhất) ---
      if (t === 'Côn') {
        if (state !== 'con-tapped') {
          state = 'con-tapped';
          conDaNoi = true;
          conDangKeo = true;
          tap(CFG.conTapMs);
          stats.con += 1;
          setStats();
          log('Nối dây Côn Bằng!');
          setStatus('Đã nối dây Côn Bằng — kéo theo nhịp.');
          renderCon();
        }
        return;
      }
      if (/^Nối \d+$/.test(t)) {
        state = 'con-wait';
        setStatus('Côn Bằng: chờ nối lại dây (' + t + ')…');
        renderCon();
        return;
      }

      // Quăng cần: nút hiện 'Quăng' HOẶC tool đang idle và đã tới lúc quăng lại
      // (nút có thể hiện tên vùng Nông/Giữa/Sâu thay vì 'Quăng').
      if (t === 'Quăng' || (state === 'idle' && now >= nextCastAt)) {
        // Kết thúc một lượt kéo/câu → chuẩn bị quăng lại.
        if (state === 'pulling' || state === 'jerking' || state === 'waiting' ||
            state === 'con-wait' || state === 'con-tapped') {
          if (state === 'pulling') {
            if (conDangKeo) {
              // Kéo Côn xong (Côn lặn/kết thúc) — KHÔNG tính là câu được cá.
              conDangKeo = false; conDaNoi = false; conSoXong += 1;
              log('Côn Bằng xong (' + conSoXong + ' lượt). Quay lại câu thường.');
              renderCon();
            } else {
              ghiNhanCauDuoc(); // kéo xong → tính là câu được 1 con
            }
          } else if (state === 'con-wait' || state === 'con-tapped') {
            // Côn kết thúc trong lúc chờ nối lại / vừa gắn dây.
            if (conDangKeo || conDaNoi) {
              conDangKeo = false; conDaNoi = false; conSoXong += 1;
              log('Côn Bằng xong (' + conSoXong + ' lượt). Quay lại câu thường.');
              renderCon();
            }
          }
          if (holding) release(); // buông nút đang giữ (vd giữ dây lúc kéo) để quăng lại được
          state = 'idle';
          nextCastAt = now + randInt(CFG.recastDelayMin, CFG.recastDelayMax);
        }
        if (state === 'idle' && now >= nextCastAt) {
          // --- v3.1: nếu Côn Bằng sắp tới/đang diễn ra thì ĐỪNG quăng mới — chờ gắn dây ---
          var choCon = lyDoChoCon(now, ct);
          if (choCon) {
            setStatus(choCon);
            renderCon();
            return;
          }
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
        renderCon();
        renderThoiTiet();
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
        renderCon();
        renderThoiTiet();
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
        renderCon();
        renderThoiTiet();
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
        renderCon();
        renderThoiTiet();
        return;
      }

      if (t === 'Giữ' || t === 'Cuốn') {
        // Đang kéo — theo prompt nhịp. Phân biệt kéo Côn Bằng với kéo cá thường
        // (cùng chữ prompt Thả!/Nhả nhịp/Kéo! nên dùng chung applyPull()).
        if (conDangKeo) {
          if (state !== 'pulling') {
            state = 'pulling';
            log('Đang kéo Côn Bằng…');
          }
          setStatus('Đang kéo Côn Bằng — nhịp: ' + (goiText() || 'Bơi') + '.');
          applyPull();
        } else {
          if (state !== 'pulling') {
            state = 'pulling';
            stats.pull += 1;
            setStats();
            log('Đang kéo cá…');
          }
          setStatus('Đang kéo cá — nhịp: ' + (goiText() || 'Bơi') + '.');
          applyPull();
        }
        renderCon();
        renderThoiTiet();
        return;
      }

      // Trạng thái khác (đang nạp lực, đang xử lý…) — chờ vòng sau.
      setStatus('Đang câu… (' + (t || '?') + ')');
      renderCon();
      renderThoiTiet();
    }

    // ---------------- Khởi động ----------------
    taiRates(); // nạp lại dữ liệu tỷ lệ đã lưu (nếu có)
    buildPanel();
    setInterval(tick, CFG.pollMs);
    setStatus('Chưa bật — bấm BẬT rồi bật TỰ ĐI để tự tới điểm câu, hoặc đứng ở cầu câu rồi bấm BẬT.');
    setTargetLine();
    log('Tool đã nạp (v3.2). Mặc định TẮT.');
    // Điều khiển từ Console khi cần debug: __TT2D_FISH__.start() / .stop() /
    // .setTarget('linh'|'yeu'|'giao'|'tudo'|'auto') / .status() /
    // .setTuDi(true|false) / .setSpot(0..13) / .spot() / .spots()
    // (_tick, _cfg và _debug chỉ để test/debug.)
    window.__TT2D_FISH__ = {
      start: function () { setOn(true); },
      stop: function () { setOn(false); },
      setTarget: function (k) { datMucTieu(k); },
      setCollapsed: function (v) { setCollapsed(!!v); },
      status: function () {
        var moiOut = {};
        Object.keys(ratesMoi).forEach(function (k) { moiOut[k] = rateObj(ratesMoi[k]); });
        var ttOut = {};
        Object.keys(ratesTT).forEach(function (id) {
          var b = ratesTT[id];
          var vOut = {};
          ['nong', 'giua', 'sau'].forEach(function (z) { vOut[z] = rateObj(b.vung[z]); });
          var mOut = {};
          Object.keys(b.moi).forEach(function (k) { mOut[k] = rateObj(b.moi[k]); });
          ttOut[id] = { vung: vOut, moi: mOut };
        });
        var rTT = thoiTietHienTai();
        var ct = conTrangThai(Date.now());
        return {
          on: on, state: state, holding: holding, target: target, vung: vungHien,
          choTimDuoc: choTimDuoc, moi: moiDangDung, stats: stats,
          tuDi: tuDi, spot: { idx: spotIdx, x: SPOTS[spotIdx].x, y: SPOTS[spotIdx].y, ten: SPOTS[spotIdx].ten },
          movePhase: movePhase, moveFails: moveFails, moveStatus: lastMoveStatus,
          tiLe: {
            vung: { nong: rateObj(ratesVung.nong), giua: rateObj(ratesVung.giua), sau: rateObj(ratesVung.sau) },
            moi: moiOut,
          },
          luongHienTai: luongHienTai,
          thoiTiet: { id: rTT.w.id, ten: rTT.w.ten, icon: rTT.w.icon, nguon: rTT.nguon },
          tiLeThoiTiet: ttOut,
          conBang: {
            dangDienRa: ct.dangDienRa, sapToi: ct.dangDienRa ? null : gioPhut(ct.sapMs),
            conLaiMs: ct.conLaiMs, daNoi: conDaNoi, dangKeo: conDangKeo, soXong: conSoXong,
          },
        };
      },
      setTuDi: function (v) { setTuDi(v); },
      tuDi: function () { return tuDi; },
      setSpot: function (i) { datDiemCau(i); },
      spot: function () { return { idx: spotIdx, x: SPOTS[spotIdx].x, y: SPOTS[spotIdx].y, ten: SPOTS[spotIdx].ten }; },
      spots: function () { return SPOTS.map(function (s) { return { x: s.x, y: s.y, ten: s.ten }; }); },
      moveStatus: function () { return { movePhase: movePhase, moveFails: moveFails, lastMoveStatus: lastMoveStatus }; },
      _tick: tick,
      _cfg: CFG,
      _debug: {
        kiemTraDiHo: kiemTraDiHo, chonDiemTrong: chonDiemTrong,
        diemBiChiem: diemBiChiem, quetNguoiDung: quetNguoiDung,
        dangCau: dangCau, giaoDienCauMo: giaoDienCauMo,
      },
    };
    Tong.register('fish', window.__TT2D_FISH__);


  })();


  // ================= MODULE: boss (Boss v1.2.1: ưu tiên Boss, khóa mục tiêu qua HUD, ở lại bãi ~60s cho nam châm nhặt đồ; TỰ ĐI tới map boss trước giờ hồi sinh (nav chung) + TỰ HỒI SINH tại chỗ tối đa 3 lần rồi đánh tiếp ngay; bấm Auto bằng tap() (nút HUD chỉ bind pointerdown).) =================

  (function () {


    // ---------------- Cấu hình ----------------
    var CFG = {
      pollMs: 250,              // kiểm tra mục tiêu/Auto mỗi 250ms
      lootWaitMs: 60000,        // sau khi boss gục: ở lại bãi 60s cho nam châm nhặt đồ
      autoClickCooldownMs: 1000,// không bấm nút Auto dồn dập (cách nhau ≥1s)
      uuTienClickCooldownMs: 1500,
      hpLogStep: 0.25,          // ghi log khi HP boss xuống dưới mỗi mốc 25%
      hpLogMinMs: 10000,        // ...nhưng không ghi dày hơn 10s/lần
    };

    // ---------------- Boss đã xác minh (client 24/11) ----------------
    // respawnSec: 0 = không hồi sinh định kỳ (theo lịch ngày/tuần, server điều khiển)
    var BOSSES = {
      xich_long: {
        id: 'xich_long', type: 'than_thu_xich_long', ten: 'Thần Thú · Xích Long',
        tenNgan: 'Xích Long', cap: 3, map: 'long_uyen', mapTen: 'Long Uyên',
        spawn: 'ttxl_1', toa: '(27,14) — ĐÃ ĐÍNH CHÍNH từ client (biến t=27)', toaXY: [27, 14], hp: 100000, respawnSec: 10800,
        respawnTen: '3 giờ', hoVe: 'Xích Nhãn Ngưu ×3',
        ghi: 'Hộ vệ: 3 Xích Nhãn Ngưu — hạ hết trước. Tọa độ (27,14) đã xác minh từ code dựng map Long Uyên (t=27); số 13 cũ là biến cục bộ hàm khác.',
        drops: 'LT 10–40, Phá Cảnh Đan 5%, Tẩy Tâm Đan 5%, Thú Hồn 3. Tính TopBoss tuần.',
      },
      linh_ho: {
        id: 'linh_ho', type: 'linh_ho_tran_son', ten: 'Linh Hổ Trấn Sơn',
        tenNgan: 'Linh Hổ', cap: 4, map: 'thach_phong_thung_lung', mapTen: 'Thạch Phong Thung Lũng',
        spawn: 'boss_linh_ho_tran_son', toa: '(33,5) hoặc (30,8) tùy biến thể map',
        toaXY: [33, 5],
        hp: 200000, respawnSec: 18000, respawnTen: '5 giờ', hoVe: 'Bạch Hổ Tuyết',
        ghi: 'Bạch Hổ Tuyết hộ vệ quanh ổ.',
        drops: 'Yêu Huyết Cấp 4 (20%), pháp bảo (1%), Ngựa Hắc Thố. Tính TopBoss tuần.',
      },
      nhen: {
        id: 'nhen', type: 'nhen_bach_ngoc', ten: 'Nhện Bạch Ngọc',
        tenNgan: 'Nhện Bạch Ngọc', cap: 5, map: 'bai_da_hang_gio', mapTen: 'Bãi Đá Hang Gió',
        spawn: 'boss_nhen_bach_ngoc', toa: '(21,11)', toaXY: [21, 11], hp: 268000, respawnSec: 28800,
        respawnTen: '8 giờ', hoVe: 'Nhện Ngọc Con ×3',
        ghi: 'Ổ ở cuối lối cát đông-bắc Bãi Đá.',
        drops: 'Vũ khí/bí tịch (Hoa Kim Thương, Băng Linh Kiếm, Phá Sơn Chùy, Huyết Kiếm…), Cổ Bích Mộc ×10, Trấn Thần Thạch ×10.',
      },
      ma_bao: {
        id: 'ma_bao', type: 'song_duc_ma_bao', ten: 'Song Dực Ma Báo',
        tenNgan: 'Ma Báo', cap: 6, map: 'mo_linh_thach', mapTen: 'Mỏ Linh Thạch',
        spawn: 'boss_song_duc_ma_bao', toa: 'Động — sân mỏ sâu nhất (server chọn)',
        toaXY: null, // Ma Báo: tọa độ động, chỉ tới map rồi chờ
        hp: 300000, respawnSec: 0, respawnTen: 'Mỗi ngày 1 lần', hoVe: 'Ngân Mao Hống ×3',
        ghi: 'Ngẫu nhiên 11:00–21:00 mỗi ngày, sống 2 giờ. Ở sân mỏ sâu nhất.',
        drops: 'Yêu Huyết Cấp 6 (20%), bí tịch (Ma Hồn Phệ 10%, Cửu U Ma Trảo 2%…), Y Phục/Quần (5%). Tính TopBoss tuần.',
      },
      giao_long: {
        id: 'giao_long', type: 'giao_long', ten: 'Thượng Cổ Giao Long',
        tenNgan: 'Giao Long', cap: 8, map: 'thien_dao_khuyet', mapTen: 'Thiên Đạo Khuyết',
        spawn: 'giao_long_1', toa: '(58,11)', toaXY: [58, 11], hp: 2000000, respawnSec: 0,
        respawnTen: 'Tối Chủ Nhật', hoVe: '—',
        ghi: 'Mỗi tuần 1 lần, tối Chủ Nhật, ~10 phút sau Hòm Vết Nứt (Hòm nổ ngẫu nhiên 18:00–23:00; mặc định 22:00 → Giao Long ~22:10). Sống 2 giờ.',
        drops: 'Giao Long Vảy 12–20 (bốc thăm, tối đa 1/người/tuần), Tẩy Niệm Phù ×10, Linh Căn Tinh Hoa ×3, vũ khí/bí tịch Hậu Kỳ.',
      },
    };
    var BOSS_ORDER = ['xich_long', 'linh_ho', 'nhen', 'ma_bao', 'giao_long'];

    // ---------------- Trạng thái ----------------
    var on = false;                 // tool đang bật?
    var selectedBoss = 'all';       // boss đang săn: 'all' hoặc id boss
    var phase = 'idle';             // idle | waiting | fighting | looting
    var currentBoss = null;         // boss đang đánh (đối tượng BOSSES)
    var currentBossName = '';       // tên mục tiêu đang đánh (kể cả quái/hộ vệ)
    var lastBossHpFrac = null;      // tỉ lệ HP boss thấy lần cuối (0..1)
    var lastBossHpLogAt = 0;        // thời điểm ghi log HP gần nhất
    var lastHpMilestone = 1;        // mốc HP đã ghi log gần nhất (1 / 0.75 / 0.5 / 0.25)
    var lootUntil = 0;              // thời điểm hết chờ nhặt đồ
    var lastAutoClickAt = 0;
    var lastUuTienClickAt = 0;
    var stats = { killed: 0, looted: 0 };
    var logLines = [];
    // ---------------- v1.2.0: Tự đi tới boss + Tự hồi sinh tại chỗ ----------------
    var tuDi = false;               // tự di chuyển tới map boss trước giờ hồi sinh?
    var movePhase = 'idle';         // idle | moving | arrived (đang tự đi tới boss)
    var moveFails = 0;              // số lần tự đi thất bại liên tiếp (tối đa 3)
    var moveTargetId = null;        // boss đang tự đi tới
    var lastNoRouteLogAt = 0;       // chống spam log "không có đường bộ"
    var lastMoveStatus = '';
    var boardData = {};             // bossId -> {at: ms|null, dead: bool, capAt: ms} (từ hook BossBoard)
    var boardHooked = false;        // đã gắn hook __ns_.BossBoard.set chưa?
    var reviveCount = 0;            // số lần tự hồi sinh tại chỗ trong phiên bật tool này (tối đa 3)
    var lastReviveClickAt = 0;      // lần bấm Hồi sinh gần nhất (tránh bấm dồn dập)
    var lastReviveLogAt = 0;        // chống spam log khi không hồi sinh được
    var reviveStopped = false;      // đã dừng tool vì chết quá 3 lần?
    var MOVE_BEFORE_MS = 5 * 60 * 1000;   // đi trước giờ hồi sinh 5 phút
    var MOVE_PER_GATE_MS = 2 * 60 * 1000; // +2 phút mỗi cổng trên đường
    var MAX_MOVE_FAILS = 3;
    var MAX_REVIVES = 3;            // tối đa 3 lần tự hồi sinh/phiên (khớp MAX_REVIVES của game)

    function rand(a, b) { return a + Math.random() * (b - a); }

    // ---------------- Giờ Việt Nam + đếm ngược ----------------
    function vnNow() {
      var d = new Date();
      return new Date(d.getTime() + (d.getTimezoneOffset() + 420) * 60000); // UTC+7
    }
    function fmtCountdown(ms) {
      if (ms <= 0) return 'đã tới giờ';
      var s = Math.floor(ms / 1000);
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      if (h > 0) return h + ' giờ ' + m + ' phút';
      if (m > 0) return m + ' phút';
      return s + ' giây';
    }
    function fmtGio(ts) {
      try { return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); }
      catch (e) { return ''; }
    }

    // ---------------- Mốc hạ boss (localStorage RIÊNG của tool) ----------------
    function lsGet(k) {
      try {
        var v = window.localStorage.getItem(k);
        return v ? parseInt(v, 10) : 0;
      } catch (e) { return 0; }
    }
    function lsSet(k, v) {
      try { window.localStorage.setItem(k, String(v)); } catch (e) { /* bỏ qua */ }
    }
    function lsDel(k) {
      try { window.localStorage.removeItem(k); } catch (e) { /* bỏ qua */ }
    }
    // Mốc hạ CHẮC CHẮN (HP boss đã thấy <25% rồi biến mất) và mốc BIẾN MẤT
    // (chưa chắc đã hạ — có thể nhân vật chết hoặc boss hết giờ).
    function mocHa(id) { return lsGet('tt2d_boss_kill_' + id); }
    function mocBienMat(id) { return lsGet('tt2d_boss_gone_' + id); }
    function ghiHa(id, chac) {
      var now = Date.now();
      if (chac) {
        lsSet('tt2d_boss_kill_' + id, now);
        lsDel('tt2d_boss_gone_' + id);
      } else {
        lsSet('tt2d_boss_gone_' + id, now);
      }
      capNhatLich();
    }
    function xoaMoc(id) {
      lsDel('tt2d_boss_kill_' + id);
      lsDel('tt2d_boss_gone_' + id);
      capNhatLich();
    }

    // ---------------- Trạng thái lịch của từng boss ----------------
    // Trả về {txt, hot, nextAt, src}: txt = dòng trạng thái, hot = đang trong
    // khung giờ săn được, nextAt = thời điểm hồi sinh kế (ms epoch, null nếu
    // chưa rõ), src = nguồn giờ ('bang' | 'co-dinh' | 'uoc-tinh' | 'khung-gio'
    // | 'chua-ro'). Thứ tự ưu tiên: bảng GIỜ BOSS server gửi (hook BossBoard)
    // -> giờ cố định do người dùng ghi (mốc neo HH:MM + chu kỳ respawnSec)
    // -> mốc hạ + respawnSec (ước tính) -> khung giờ ngày/tuần (Ma Báo /
    // Giao Long) -> chưa rõ. KHÔNG tự đoán giờ cố định khi chưa có dữ kiện.
    function trangThaiBoss(b) {
      var now = vnNow();
      var day = now.getDay(); // 0 = Chủ Nhật
      var mins = now.getHours() * 60 + now.getMinutes();
      var nowMs = Date.now();
      if (b.id === 'ma_bao') {
        if (mins >= 11 * 60 && mins < 21 * 60) {
          return { txt: 'ĐANG TRONG GIỜ (11:00–21:00) — có thể xuất hiện bất cứ lúc nào', hot: true, nextAt: nowMs, src: 'khung-gio' };
        }
        if (mins < 11 * 60) {
          var t11 = new Date(nowMs); t11.setHours(11, 0, 0, 0);
          return { txt: 'Chờ 11:00 hôm nay (còn ' + fmtCountdown((11 * 60 - mins) * 60000) + ')', hot: false, nextAt: t11.getTime(), src: 'khung-gio' };
        }
        var t11m = new Date(nowMs); t11m.setDate(t11m.getDate() + 1); t11m.setHours(11, 0, 0, 0);
        return { txt: 'Đã qua giờ hôm nay — chờ 11:00 ngày mai', hot: false, nextAt: t11m.getTime(), src: 'khung-gio' };
      }
      if (b.id === 'giao_long') {
        if (day === 0) {
          if (mins >= 18 * 60 && mins < 23 * 60 + 30) {
            return { txt: 'TỐI NAY — Hòm Vết Nứt nổ ngẫu nhiên 18:00–23:00, Giao Long giáng ~10 phút sau (mặc định ~22:10)', hot: true, nextAt: nowMs, src: 'khung-gio' };
          }
          if (mins < 18 * 60) {
            var t18 = new Date(nowMs); t18.setHours(18, 0, 0, 0);
            return { txt: 'Chờ tối nay (Hòm nổ 18:00–23:00)', hot: false, nextAt: t18.getTime(), src: 'khung-gio' };
          }
          return { txt: 'Đã qua giờ tối nay', hot: false, nextAt: null, src: 'khung-gio' };
        }
        var daysToSun = (7 - day) % 7;
        var tSun = new Date(nowMs); tSun.setDate(tSun.getDate() + daysToSun); tSun.setHours(18, 0, 0, 0);
        return { txt: 'Chờ Chủ Nhật (còn ' + daysToSun + ' ngày)', hot: false, nextAt: tSun.getTime(), src: 'khung-gio' };
      }
      // 1) Bảng GIỜ BOSS server gửi (hook BossBoard) — giờ thật, chuẩn nhất.
      var bd = boardData[b.id];
      if (bd) {
        if (bd.at === null) {
          // Bảng báo "Đã hạ" (dead, chưa có giờ hồi sinh mới) -> rơi xuống
          // các nguồn dưới (giờ cố định / mốc hạ).
        } else if (bd.at > nowMs) {
          return { txt: 'Hồi sinh sau ' + fmtCountdown(bd.at - nowMs) + ' (bảng game, lúc ' + fmtGio(bd.at) + ')', hot: false, nextAt: bd.at, src: 'bang' };
        } else if (nowMs - bd.at < 15 * 60 * 1000) {
          return { txt: 'SẮP XUẤT HIỆN (bảng game — đã tới giờ ' + fmtGio(bd.at) + ')', hot: true, nextAt: nowMs, src: 'bang' };
        }
        // Bảng quá cũ (>15 phút sau giờ) -> không dùng nữa, rơi xuống dưới.
      }
      // 2) Giờ cố định do người dùng ghi (mốc neo HH:MM + chu kỳ respawnSec).
      var anchor = docAnchor(b.id);
      if (anchor !== null && b.respawnSec > 0) {
        var nextFx = mocCoDinhTiepTheo(anchor, b.respawnSec, nowMs);
        if (nextFx !== null) {
          var remainFx = nextFx - nowMs;
          if (remainFx > 0) {
            return { txt: 'Hồi sinh sau ~' + fmtCountdown(remainFx) + ' (giờ cố định, lúc ' + fmtGio(nextFx) + ')', hot: false, nextAt: nextFx, src: 'co-dinh' };
          }
          return { txt: 'ĐÃ TỚI GIỜ hồi sinh (giờ cố định)', hot: true, nextAt: nowMs, src: 'co-dinh' };
        }
      }
      // 3) Mốc hạ + respawnSec (ước tính).
      var lk = mocHa(b.id);
      var lg = mocBienMat(b.id);
      var moc = lk || lg;
      if (moc) {
        var next = moc + b.respawnSec * 1000;
        var remain = next - Date.now();
        var nhan = lk ? ('từ mốc hạ ' + fmtGio(lk)) : ('ước tính từ lúc boss biến mất ' + fmtGio(lg));
        if (remain > 0) {
          return { txt: 'Hồi sinh sau ~' + fmtCountdown(remain) + ' (' + nhan + ')', hot: false, nextAt: next, src: 'uoc-tinh' };
        }
        return { txt: 'ĐÃ TỚI GIỜ hồi sinh (ước tính, ' + nhan + ')', hot: true, nextAt: nowMs, src: 'uoc-tinh' };
      }
      return { txt: 'Chưa rõ giờ hồi sinh — xem bảng Boss trong game (chưa có mốc hạ)', hot: false, nextAt: null, src: 'chua-ro' };
    }

    // Mốc neo giờ cố định (phút từ 00:00, localStorage riêng của tool).
    function docAnchor(id) {
      try {
        var v = window.localStorage.getItem('tt2d_boss_anchor_' + id);
        if (v === null || v === '') return null;
        var n = parseInt(v, 10);
        if (isNaN(n) || n < 0 || n >= 1440) return null;
        return n;
      } catch (e) { return null; }
    }
    function ghiAnchor(id, mins) {
      try { window.localStorage.setItem('tt2d_boss_anchor_' + id, String(mins)); } catch (e) {}
      capNhatLich();
    }
    function xoaAnchor(id) {
      try { window.localStorage.removeItem('tt2d_boss_anchor_' + id); } catch (e) {}
      capNhatLich();
    }
    // Mốc cố định kế tiếp: neo (phút từ 00:00 hôm nay) + k * chu kỳ > now.
    function mocCoDinhTiepTheo(anchorMins, respawnSec, nowMs) {
      var d = new Date(nowMs);
      var base = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime()
        + anchorMins * 60000;
      var step = respawnSec * 1000;
      if (step <= 0) return null;
      var t = base;
      var guard = 0;
      while (t <= nowMs && guard < 100) { t += step; guard++; }
      if (guard >= 100) return null;
      return t;
    }

    // ---------------- Đọc DOM của game ----------------
    // Bấm nút game bằng tap() (pointerdown+pointerup+click): nút HUD của
    // game (#btn-auto-touch, #btn-fly...) CHỈ bind "pointerdown" (helper k()
    // trong TouchUI, game.js client 24/11) — .click() là no-op (lỗi Farm
    // "bật auto không di chuyển được" 07:15 25/11). #btn-auto KHÔNG có
    // listener — ưu tiên #btn-auto-touch. Game tiêu thụ cờ toggle ở frame
    // sau nên KHÔNG kiểm tra lại trạng thái ngay sau khi bấm.
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
    function autoBtn() {
      return document.querySelector('#btn-auto-touch') || document.querySelector('#btn-auto');
    }
    function autoIsOn() {
      var b1 = document.querySelector('#btn-auto'), b2 = document.querySelector('#btn-auto-touch');
      return !!((b1 && b1.classList.contains('active')) || (b2 && b2.classList.contains('active')));
    }
    function uuTienBossBtn() {
      return document.querySelector('[data-uu-tien="boss"]');
    }
    function uuTienHienTai() {
      var b = document.querySelector('[data-uu-tien].on');
      return b ? (b.getAttribute('data-uu-tien') || '') : '';
    }
    function hudTargetEl() { return document.querySelector('#hud-target'); }
    function targetVisible() {
      var h = hudTargetEl();
      return !!(h && !h.classList.contains('hidden'));
    }
    function targetName() {
      var el = document.querySelector('#target-name');
      return el ? el.textContent.trim() : '';
    }
    function targetHpText() {
      var el = document.querySelector('#target-hp');
      return el ? el.textContent.trim() : '';
    }
    // Đọc tỉ lệ HP từ chữ máu (dạng "x / y" hoặc "x/y"). Không đọc được thì null.
    function parseHpFrac(txt) {
      var nums = (txt || '').match(/[\d,\.]+/g);
      if (!nums || nums.length < 2) return null;
      var cur = parseFloat(nums[0].replace(/,/g, ''));
      var max = parseFloat(nums[1].replace(/,/g, ''));
      if (!max || isNaN(cur) || isNaN(max)) return null;
      return Math.max(0, Math.min(1, cur / max));
    }
    // Tên mục tiêu có phải boss không? Trả về đối tượng boss hoặc null.
    function bossFromTargetName(name) {
      if (!name) return null;
      for (var i = 0; i < BOSS_ORDER.length; i++) {
        var b = BOSSES[BOSS_ORDER[i]];
        if (name.indexOf(b.tenNgan) !== -1) return b;
      }
      return null;
    }

    // ---------------- Bấm nút của game ----------------
    // Bật Auto (bấm đúng 1 lần qua tap(), có chống bấm dồn dập; tick sau tự
    // kiểm tra lại trạng thái — KHÔNG kiểm tra ngay sau khi bấm vì game tiêu
    // thụ toggle ở frame sau).
    function damBaoAuto() {
      var b = autoBtn();
      if (!b) return false;
      if (autoIsOn()) return true;
      var now = Date.now();
      if (now - lastAutoClickAt < CFG.autoClickCooldownMs) return false;
      lastAutoClickAt = now;
      tap(b);
      return true;
    }
    // Đặt ưu tiên Tự Động Đánh = Boss (chỉ bấm được khi bảng Cài Đặt đang mở).
    function damBaoUuTienBoss() {
      var b = uuTienBossBtn();
      if (!b) return false; // bảng Cài Đặt chưa mở — nhắc người dùng đặt tay
      if (b.classList.contains('on')) return true;
      var now = Date.now();
      if (now - lastUuTienClickAt < CFG.uuTienClickCooldownMs) return false;
      lastUuTienClickAt = now;
      b.click();
      log('Đã bấm ưu tiên Tự Động Đánh: Boss.');
      return true;
    }

    // ---------------- v1.2.0: Hook bảng GIỜ BOSS (giờ hồi sinh thật) ----------------
    // Server gửi message `bosses` -> __ns_.BossBoard.set(t.boards); mỗi boss
    // trong list có {name, dead, con} (con = số giây tới lúc hồi sinh; con<0
    // nghĩa là đã hạ, chưa có giờ mới). Hook để lấy mốc `at` thật thay vì
    // ước tính từ mốc hạ. Dữ liệu chỉ có khi server gửi bảng (thường khi đổi
    // map / định kỳ); chưa có thì rơi xuống giờ cố định / ước tính.
    function hookBossBoard() {
      if (boardHooked) return;
      try {
        var ns = window.__ns_;
        var bb = ns && ns.BossBoard;
        if (!bb || typeof bb.set !== 'function') return;
        var origSet = bb.set;
        bb.set = function (t) {
          try { ghiBoard(t); } catch (e) { /* bỏ qua */ }
          return origSet.call(this, t);
        };
        boardHooked = true;
        log('Đã gắn hook bảng GIỜ BOSS — giờ hồi sinh lấy từ server khi có bảng.');
      } catch (e) { /* bỏ qua */ }
    }
    function bossFromBoardName(name) {
      if (!name) return null;
      for (var i = 0; i < BOSS_ORDER.length; i++) {
        var b = BOSSES[BOSS_ORDER[i]];
        if (name.indexOf(b.tenNgan) !== -1) return b;
      }
      return null;
    }
    function ghiBoard(t) {
      if (!Array.isArray(t)) return;
      var now = Date.now();
      var doi = false;
      t.forEach(function (board) {
        (board.list || []).forEach(function (e) {
          var b = bossFromBoardName(e.name);
          if (!b) return;
          var con = Number(e.con);
          boardData[b.id] = {
            at: (isNaN(con) || con < 0) ? null : now + con * 1000,
            dead: !!e.dead,
            capAt: now,
          };
          doi = true;
        });
      });
      if (doi) capNhatLich();
    }

    // ---------------- v1.2.0: Điều hướng (nav chung của Tool Tổng) ----------------
    function nav() {
      return window.__TT2D_NAV__ || (window.__TT2D_TONG__ && window.__TT2D_TONG__.nav) || null;
    }
    // Map hiện tại (id client): ưu tiên nav.docViTri(), fallback đọc #hud-map.
    function docMapHienTai() {
      try {
        var n = nav();
        if (n && typeof n.docViTri === 'function') {
          var p = n.docViTri();
          if (p && p.map) return p.map;
        }
      } catch (e) { /* bỏ qua */ }
      var hm = document.querySelector('#hud-map');
      var s = hm ? (hm.innerText || hm.textContent || '') : '';
      if (/Long Uyên/.test(s)) return 'long_uyen';
      if (/Thạch Phong|Thung Lũng/.test(s)) return 'thach_phong_thung_lung';
      if (/Bãi Đá/.test(s)) return 'bai_da_hang_gio';
      if (/Mỏ Linh Thạch/.test(s)) return 'mo_linh_thach';
      if (/Thiên Đạo|Chính Đảo/.test(s)) return 'thien_dao_khuyet';
      if (/Chân Núi Tản Viên/.test(s)) return 'tan_vien';
      if (/Phong Địa/.test(s)) return 'phong_dia';
      if (/Thảo Dược Cốc/.test(s)) return 'duoc_vien';
      if (/Rừng Trúc/.test(s)) return 'thanh_truc_lam';
      if (/Miếu Hoang/.test(s)) return 'mieu_hoang';
      return null;
    }
    function laMapBoss(mapId) {
      if (!mapId) return false;
      for (var i = 0; i < BOSS_ORDER.length; i++) {
        if (BOSSES[BOSS_ORDER[i]].map === mapId) return true;
      }
      return false;
    }
    function laGioChinhMa(date) {
      var d = date || new Date();
      var mins = d.getHours() * 60 + d.getMinutes();
      return mins >= 11 * 60 && mins < 12 * 60;
    }
    // HP hiện tại của nhân vật (đọc thanh máu .pl-bar.hp .pl-n "x / y").
    function docHp() {
      try {
        var el = document.querySelector('.pl-bar.hp .pl-n');
        var t = el ? (el.textContent || '') : '';
        var nums = t.match(/[\d,\.]+/g);
        if (!nums || nums.length < 2) return null;
        return {
          cur: parseFloat(nums[0].replace(/,/g, '')),
          max: parseFloat(nums[1].replace(/,/g, '')),
        };
      } catch (e) { return null; }
    }

    // ---------------- v1.2.0: Tự di chuyển tới boss ----------------
    // Khi TỰ ĐI đang BẬT + đã chọn 1 boss cụ thể: tới trước giờ hồi sinh
    // (5 phút + 2 phút/cổng) thì tự dùng nav.diToiMap tới map boss, rồi
    // diToi tới điểm spawn (trừ Ma Báo: tọa độ động, chỉ tới map), bật lại
    // Auto + ưu tiên Boss rồi chờ. Thất bại 3 lần -> TẮT tự đi + báo rõ.
    // KHÔNG dùng Truyền Tống Trận (đi bộ qua cổng; Giao Long đi qua Cột Khí
    // Bổng Bát Quái -> Thiên Đạo, nav đã có đường).
    function kiemTraDiBoss() {
      if (!on || !tuDi || selectedBoss === 'all') return;
      if (movePhase === 'moving') return;
      if (phase === 'fighting' && currentBoss) return; // đang đánh boss rồi
      if (phase === 'looting') return; // vừa hạ boss, đang chờ nhặt đồ
      if (moveFails >= MAX_MOVE_FAILS) return; // đã tắt tự đi sau 3 lần lỗi
      var b = BOSSES[selectedBoss];
      if (!b) return;
      var n = nav();
      if (!n || typeof n.diToiMap !== 'function') {
        if (Date.now() - lastNoRouteLogAt > 60000) {
          lastNoRouteLogAt = Date.now();
          log('TỰ ĐI cần module nav (chỉ có trong Tool Tổng) — tool lẻ không tự đi được.');
        }
        return;
      }
      var st = trangThaiBoss(b);
      if (!st.nextAt) {
        setMoveStatus('Chưa rõ giờ ' + b.tenNgan + ' — không tự đi được (xem bảng Boss trong game hoặc ghi giờ cố định).');
        return;
      }
      var curMap = docMapHienTai();
      if (curMap === b.map) {
        if (movePhase !== 'idle') movePhase = 'idle';
        setMoveStatus('Đã ở ' + b.mapTen + ' — chờ ' + b.tenNgan + ' (' + st.txt + ').');
        return;
      }
      var duong = null;
      try { duong = (typeof n.duongDi === 'function') ? n.duongDi(curMap, b.map) : null; } catch (e) { duong = null; }
      if (duong === null) {
        if (Date.now() - lastNoRouteLogAt > 60000) {
          lastNoRouteLogAt = Date.now();
          log('Không có đường bộ tới ' + b.mapTen + ' từ map hiện tại — không tự đi được.');
        }
        setMoveStatus('Không có đường bộ tới ' + b.mapTen + ' — tự đi tới đó rồi bật tool.');
        return;
      }
      var gates = duong.length;
      var leadMs = MOVE_BEFORE_MS + gates * MOVE_PER_GATE_MS;
      var remain = st.nextAt - Date.now();
      if (remain > leadMs) {
        setMoveStatus('Sẽ tự đi tới ' + b.mapTen + ' lúc ' + fmtGio(st.nextAt - leadMs) +
          ' (' + b.tenNgan + ' hồi sinh ' + fmtGio(st.nextAt) + ', đường ' + gates + ' cổng).');
        return;
      }
      // Tới giờ đi.
      movePhase = 'moving';
      moveTargetId = b.id;
      setMoveStatus('Đang tự đi tới ' + b.mapTen + ' (' + b.tenNgan + ' hồi sinh sau ' +
        fmtCountdown(Math.max(0, remain)) + ')…');
      diToiBoss(b);
    }
    async function diToiBoss(b) {
      var n = nav();
      try {
        log('TỰ ĐI: ' + b.tenNgan + ' sắp xuất hiện — đang đi tới ' + b.mapTen + '…');
        var okMap = await n.diToiMap(b.map);
        if (!okMap) throw new Error('diToiMap false');
        if (b.toaXY) {
          var okToi = await n.diToi(b.toaXY[0], b.toaXY[1], 60);
          if (!okToi) log('Đã tới ' + b.mapTen + ' nhưng chưa tới đúng điểm spawn ' + b.toa + ' — chờ boss ở đây.');
        }
        movePhase = 'arrived';
        moveFails = 0;
        log('Đã tới ' + b.mapTen + ' — bật Auto + ưu tiên Boss, chờ ' + b.tenNgan + ' xuất hiện.');
        damBaoUuTienBoss();
        damBaoAuto();
        setMoveStatus('Đã tới ' + b.mapTen + ' — chờ ' + b.tenNgan + ' xuất hiện.');
      } catch (e) {
        moveFails++;
        movePhase = 'idle';
        log('TỰ ĐI tới ' + b.mapTen + ' thất bại lần ' + moveFails + '/' + MAX_MOVE_FAILS + '.');
        if (moveFails >= MAX_MOVE_FAILS) {
          tuDi = false;
          capNhatNutTuDi();
          setMoveStatus('Tự đi tới boss thất bại 3 lần — đã TẮT tự đi.');
          log('Đã TẮT tự di chuyển sau 3 lần thất bại — tự đi tới map boss rồi bật lại.');
        }
      }
    }
    function setMoveStatus(s) {
      lastMoveStatus = s;
      var el = document.querySelector('#tt2d-boss-move');
      if (el) el.textContent = s;
    }

    // ---------------- v1.2.0: Tự hồi sinh tại chỗ khi chết lúc đánh boss ----------------
    // Phát hiện gục: __ns_.SceneWorld.player.downed HOẶC bảng #downed hiện.
    // Chỉ hồi sinh khi tool đang BẬT + đang đánh/chờ boss ở map boss; bấm
    // #downed-spot (Hồi sinh tại chỗ, ~35% HP + khiên 3s), KHÔNG BAO GIỜ
    // bấm #downed-home (Về làng = mất boss). Hồi sinh xong ĐÁNH LUÔN, không
    // chờ hồi HP (lệnh Thanh 05:54 25/11). Tối đa 3 lần/phiên bật tool.
    function dangChet() {
      try {
        var p = window.__ns_ && window.__ns_.SceneWorld && window.__ns_.SceneWorld.player;
        if (p && p.downed) return true;
      } catch (e) { /* bỏ qua */ }
      var d = document.querySelector('#downed');
      return !!(d && !d.classList.contains('hidden'));
    }
    // Trả {ok, lyDo}: lyDo = 'ok' | 'het-luot' | 'chinh-ma' | 'khong-o-map-boss'
    // | 'khong-phai-luc-danh' | 'tool-tat'. nowMs để test truyền giờ giả.
    function coNenHoiSinh(nowMs) {
      if (!on) return { ok: false, lyDo: 'tool-tat' };
      if (phase !== 'fighting' && phase !== 'waiting' && phase !== 'looting') {
        return { ok: false, lyDo: 'khong-phai-luc-danh' };
      }
      if (reviveCount >= MAX_REVIVES) return { ok: false, lyDo: 'het-luot' };
      var mapId = docMapHienTai();
      if (mapId === 'tan_vien' && laGioChinhMa(new Date(nowMs || Date.now()))) {
        return { ok: false, lyDo: 'chinh-ma' };
      }
      if (selectedBoss !== 'all') {
        if (mapId !== BOSSES[selectedBoss].map) return { ok: false, lyDo: 'khong-o-map-boss' };
      } else if (!laMapBoss(mapId)) {
        return { ok: false, lyDo: 'khong-o-map-boss' };
      }
      return { ok: true, lyDo: 'ok' };
    }
    function xuLyChet() {
      if (reviveStopped) return;
      if (reviveCount >= MAX_REVIVES) {
        reviveStopped = true;
        setOn(false);
        setStatus('Chết quá 3 lần trong phiên săn này — đã DỪNG tool. Boss quá mạnh hoặc cần hồi HP/đồ tốt hơn.');
        log('Chết quá 3 lần — đã DỪNG tool (boss quá mạnh hoặc cần hồi HP/đồ tốt hơn).');
        return;
      }
      var q = coNenHoiSinh();
      if (!q.ok) {
        if (q.lyDo === 'chinh-ma') {
          if (Date.now() - lastReviveLogAt > 60000) {
            lastReviveLogAt = Date.now();
            log('Chết ở làng trong giờ Chính Ma — KHÔNG tự hồi sinh (chờ qua 12:00).');
          }
        } else if (q.lyDo === 'khong-o-map-boss') {
          if (Date.now() - lastReviveLogAt > 60000) {
            lastReviveLogAt = Date.now();
            log('Gục nhưng không ở map boss — KHÔNG tự hồi sinh (chỉ hồi sinh khi đang săn boss ở map boss).');
          }
        }
        return;
      }
      var spot = document.querySelector('#downed-spot');
      if (!spot) return; // bảng chưa hiện hẳn (PANEL_DELAY 1.2s) — tick sau thử lại
      if (spot.disabled) {
        // Hết lượt hồi sinh tại chỗ (game khóa nút khi reviveLeft = 0).
        reviveStopped = true;
        setOn(false);
        setStatus('Hết lượt hồi sinh tại chỗ (game khóa nút) — đã DỪNG tool.');
        log('Hết lượt hồi sinh tại chỗ — nút Hồi sinh bị khóa, đã DỪNG tool.');
        return;
      }
      if (Date.now() - lastReviveClickAt < 3000) return; // tránh bấm dồn dập
      lastReviveClickAt = Date.now();
      spot.click();
      reviveCount++;
      var hp = docHp();
      var hpTxt = hp ? (' (HP sau hồi sinh ~' + hp.cur + '/' + hp.max + ')') : '';
      log('Đã bấm HỒI SINH TẠI CHỖ lần ' + reviveCount + '/' + MAX_REVIVES + hpTxt + ' — đánh tiếp ngay, không chờ hồi HP.');
      setStatus('Đã hồi sinh tại chỗ lần ' + reviveCount + '/' + MAX_REVIVES + ' — đánh tiếp ngay.');
      // ĐÁNH LUÔN: bật Auto + ưu tiên Boss ngay (tick sau cũng làm vậy).
      damBaoUuTienBoss();
      damBaoAuto();
    }

    // ---------------- Bảng điều khiển ----------------
    var panel, miniBar, miniStatusEl, statusEl, detailEl, schedEl, statsEl, logEl, toggleBtn, tudiBtn, bossBtns = {};
    var collapsed = false; // bảng đang thu nhỏ?
    function buildPanel() {
      panel = document.createElement('div');
      panel.id = 'tt2d-boss-panel';
      panel.style.cssText = [
        'position:fixed', 'top:10px', 'right:10px', 'z-index:999999',
        'width:300px', 'background:rgba(20,14,8,0.88)', 'color:#ffe9b0',
        'border:1px solid #8a6a2f', 'border-radius:10px', 'padding:10px 12px',
        'font:12px/1.5 system-ui, sans-serif', 'box-shadow:0 4px 18px rgba(0,0,0,0.5)',
      ].join(';');
      var bossBtnHtml = BOSS_ORDER.map(function (id) {
        var b = BOSSES[id];
        return '<button data-boss="' + id + '" style="padding:3px 7px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">' + b.tenNgan + '</button>';
      }).join(' ');
      panel.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<b>🐉 Tool đánh boss Tu Tiên 2D</b>' +
          '<span><button id="tt2d-boss-collapse" title="Thu nhỏ bảng (tool vẫn chạy)" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px">—</button>' +
          '<button id="tt2d-boss-hide" title="Ẩn bảng (tool vẫn chạy nếu đang BẬT)" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px">×</button></span>' +
        '</div>' +
        '<div style="margin:8px 0">Đang săn: ' +
          '<button data-boss="all" style="padding:3px 7px;border-radius:5px;border:1px solid #8a6a2f;background:#6b4d16;color:#ffe9b0;cursor:pointer">Tất cả</button> ' +
          bossBtnHtml +
        '</div>' +
        '<div id="tt2d-boss-detail" style="margin:4px 0;color:#ffd27a"></div>' +
        '<div style="margin:8px 0;display:flex;gap:6px">' +
          '<button id="tt2d-boss-toggle" style="flex:1;padding:6px;border-radius:6px;border:1px solid #8a6a2f;background:#3a2c12;color:#ffe9b0;cursor:pointer;font-weight:bold">BẬT</button>' +
          '<button id="tt2d-boss-tudi" title="Tự di chuyển tới map boss trước giờ hồi sinh (cần chọn 1 boss cụ thể; chỉ có trong Tool Tổng)" style="flex:1;padding:6px;border-radius:6px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">TỰ ĐI: TẮT</button>' +
        '</div>' +
        '<div id="tt2d-boss-status" style="margin:6px 0;color:#bfe3ff">Chưa bật — đưa nhân vật tới đúng map boss rồi bấm BẬT.</div>' +
        '<div id="tt2d-boss-move" style="margin:6px 0;color:#ffd27a;font-size:11px"></div>' +
        '<div id="tt2d-boss-sched" style="margin:6px 0;color:#d8c9a3;font-size:11px"></div>' +
        '<div id="tt2d-boss-anchor-row" style="margin:6px 0;color:#d8c9a3;font-size:11px;display:none">' +
          'Giờ hồi sinh đã biết (giờ cố định): <input id="tt2d-boss-anchor" placeholder="HH:MM" maxlength="5" style="width:52px;padding:2px 4px;border-radius:4px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0">' +
          ' <button id="tt2d-boss-anchor-set" style="padding:2px 6px;border-radius:4px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Ghi giờ</button>' +
          ' <button id="tt2d-boss-anchor-clear" title="Xóa giờ cố định đã ghi" style="padding:2px 6px;border-radius:4px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">✕</button>' +
          ' <span id="tt2d-boss-anchor-cur"></span>' +
        '</div>' +
        '<div id="tt2d-boss-stats" style="color:#c9f2c9">Đã hạ 0 boss · Đã chờ nhặt 0 lần</div>' +
        '<div id="tt2d-boss-log" style="margin-top:6px;max-height:96px;overflow:auto;color:#d8c9a3;font-size:11px"></div>' +
        '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">TỰ ĐI: tự tới map boss trước giờ hồi sinh (chỉ trong Tool Tổng). Chết lúc đánh boss: tool tự bấm Hồi sinh tại chỗ (tối đa 3 lần/phiên) rồi đánh tiếp ngay — không bấm Về làng. Đồ rơi game tự hút sau 5s — boss gục thì ở lại bãi ~60s.</div>';
      Tong.tabBody('boss').appendChild(panel);

      // Thanh thu nhỏ: chỉ hiện tên tool + trạng thái ngắn + nút mở lại.
      miniBar = document.createElement('div');
      miniBar.id = 'tt2d-boss-mini';
      miniBar.style.cssText = [
        'position:fixed', 'top:10px', 'right:10px', 'z-index:999999',
        'display:none', 'align-items:center', 'gap:6px',
        'background:rgba(20,14,8,0.88)', 'color:#ffe9b0',
        'border:1px solid #8a6a2f', 'border-radius:8px', 'padding:4px 8px',
        'font:12px/1.4 system-ui, sans-serif', 'box-shadow:0 4px 18px rgba(0,0,0,0.5)',
        'max-width:260px',
      ].join(';');
      miniBar.innerHTML =
        '<b>🐉 Boss</b>' +
        '<span id="tt2d-boss-mini-status" style="color:#bfe3ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-boss-expand" title="Mở lại bảng đầy đủ" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px">＋</button>';
      Tong.tabBody('boss').appendChild(miniBar);
      miniStatusEl = miniBar.querySelector('#tt2d-boss-mini-status');
      miniBar.querySelector('#tt2d-boss-expand').addEventListener('click', function () { setCollapsed(false); });

      toggleBtn = panel.querySelector('#tt2d-boss-toggle');
      statusEl = panel.querySelector('#tt2d-boss-status');
      detailEl = panel.querySelector('#tt2d-boss-detail');
      schedEl = panel.querySelector('#tt2d-boss-sched');
      statsEl = panel.querySelector('#tt2d-boss-stats');
      logEl = panel.querySelector('#tt2d-boss-log');

      toggleBtn.addEventListener('click', function () { setOn(!on); });
      tudiBtn = panel.querySelector('#tt2d-boss-tudi');
      if (tudiBtn) tudiBtn.addEventListener('click', function () { setTuDi(!tuDi); });
      var anchorSetBtn = panel.querySelector('#tt2d-boss-anchor-set');
      if (anchorSetBtn) anchorSetBtn.addEventListener('click', function () {
        var inp = panel.querySelector('#tt2d-boss-anchor');
        var v = inp ? (inp.value || '').trim() : '';
        var m = /^(\d{1,2}):(\d{2})$/.exec(v);
        if (!m) { log('Giờ cố định phải dạng HH:MM (vd 21:00).'); return; }
        var hh = parseInt(m[1], 10), mm = parseInt(m[2], 10);
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) { log('Giờ cố định không hợp lệ (HH 0–23, MM 0–59).'); return; }
        if (selectedBoss === 'all') { log('Chọn 1 boss cụ thể rồi mới ghi giờ cố định.'); return; }
        ghiAnchor(selectedBoss, hh * 60 + mm);
        log('Đã ghi giờ cố định cho ' + BOSSES[selectedBoss].tenNgan + ': ' +
          (hh < 10 ? '0' + hh : hh) + ':' + (mm < 10 ? '0' + mm : mm) +
          ' (mốc neo, các mốc tiếp theo cách nhau ' + BOSSES[selectedBoss].respawnTen + ').');
        capNhatAnchorRow();
      });
      var anchorClearBtn = panel.querySelector('#tt2d-boss-anchor-clear');
      if (anchorClearBtn) anchorClearBtn.addEventListener('click', function () {
        if (selectedBoss === 'all') return;
        xoaAnchor(selectedBoss);
        log('Đã xóa giờ cố định của ' + BOSSES[selectedBoss].tenNgan + '.');
        capNhatAnchorRow();
      });
      panel.querySelector('#tt2d-boss-collapse').addEventListener('click', function () { setCollapsed(true); });
      panel.querySelector('#tt2d-boss-hide').addEventListener('click', function () {
        setCollapsed(true);
      });
      panel.querySelectorAll('[data-boss]').forEach(function (btn) {
        bossBtns[btn.getAttribute('data-boss')] = btn;
        btn.addEventListener('click', function () { chonBoss(btn.getAttribute('data-boss')); });
      });
      setDetail();
      capNhatLich();
      capNhatNutTuDi();
      capNhatAnchorRow();
    }

    // Nút TỰ ĐI: bật/tắt + cập nhật nhãn/trạng thái khóa.
    function setTuDi(v) {
      if (v && selectedBoss === 'all') {
        log('TỰ ĐI cần chọn 1 boss cụ thể (không đi được 5 map cùng lúc).');
        return;
      }
      if (v && !nav()) {
        log('TỰ ĐI cần module nav — chỉ có trong Tool Tổng (tool lẻ chạy một mình không tự đi được).');
        return;
      }
      tuDi = !!v;
      if (!tuDi) { movePhase = 'idle'; setMoveStatus(''); }
      else log('Đã BẬT tự di chuyển tới boss ' + BOSSES[selectedBoss].tenNgan + ' — tool sẽ tự đi trước giờ hồi sinh.');
      capNhatNutTuDi();
    }
    function capNhatNutTuDi() {
      if (!tudiBtn) return;
      var coNav = !!nav();
      var khoa = (selectedBoss === 'all') || !coNav;
      tudiBtn.textContent = tuDi ? 'TỰ ĐI: BẬT' : 'TỰ ĐI: TẮT';
      tudiBtn.style.background = tuDi ? '#6b4d16' : '#2a2113';
      tudiBtn.style.opacity = khoa ? '0.55' : '1';
      tudiBtn.title = khoa
        ? (selectedBoss === 'all'
          ? 'Chọn 1 boss cụ thể để bật TỰ ĐI'
          : 'TỰ ĐI cần module nav — chỉ có trong Tool Tổng')
        : 'Tự di chuyển tới map boss trước giờ hồi sinh';
    }
    // Hàng ghi giờ cố định: chỉ hiện khi chọn 1 boss cụ thể có chu kỳ hồi sinh.
    function capNhatAnchorRow() {
      var row = document.querySelector('#tt2d-boss-anchor-row');
      if (!row) return;
      var b = selectedBoss === 'all' ? null : BOSSES[selectedBoss];
      if (!b || !b.respawnSec) { row.style.display = 'none'; return; }
      row.style.display = 'block';
      var cur = document.querySelector('#tt2d-boss-anchor-cur');
      var a = docAnchor(b.id);
      if (cur) {
        cur.textContent = a !== null
          ? ('đã ghi: ' + (Math.floor(a / 60) < 10 ? '0' : '') + Math.floor(a / 60) + ':' + (a % 60 < 10 ? '0' : '') + (a % 60) + ' (cách nhau ' + b.respawnTen + ')')
          : '(chưa ghi)';
      }
    }

    // Thu nhỏ / mở lại bảng. Tool vẫn chạy khi bảng thu nhỏ.
    function shortStatus() {
      if (!on) return 'Tắt';
      if (phase === 'fighting') return 'Đang đánh ' + (currentBossName || 'boss');
      if (phase === 'looting') return 'Chờ nhặt đồ…';
      return 'Chờ ' + (selectedBoss === 'all' ? 'boss' : BOSSES[selectedBoss].tenNgan);
    }
    function setCollapsed(v) {
      collapsed = !!v;
      if (panel) panel.style.display = collapsed ? 'none' : 'block';
      if (miniBar) miniBar.style.display = collapsed ? 'flex' : 'none';
      if (collapsed && miniStatusEl) miniStatusEl.textContent = shortStatus();
    }

    function setStatus(s) {
      if (statusEl) statusEl.textContent = s;
      if (miniStatusEl) miniStatusEl.textContent = s.length > 42 ? s.slice(0, 42) + '…' : s;
    }
    function setStats() {
      if (statsEl) {
        statsEl.textContent = 'Đã hạ ' + stats.killed + ' boss · Đã chờ nhặt ' + stats.looted + ' lần';
      }
    }
    function log(msg) {
      var line = new Date().toLocaleTimeString('vi-VN') + ' — ' + msg;
      logLines.unshift(line);
      if (logLines.length > 6) logLines.length = 6;
      if (logEl) logEl.innerHTML = logLines.map(function (l) {
        return '<div>' + l.replace(/</g, '&lt;') + '</div>';
      }).join('');
      try { console.log('[TT2D-Boss] ' + line); } catch (e) { /* bỏ qua */ }
    }

    function chonBoss(id) {
      if (id !== 'all' && !BOSSES[id]) return;
      selectedBoss = id;
      // Đổi boss -> reset trạng thái tự đi (đi tới boss cũ không còn đúng).
      movePhase = 'idle';
      moveFails = 0;
      moveTargetId = null;
      setMoveStatus('');
      Object.keys(bossBtns).forEach(function (k) {
        bossBtns[k].style.background = k === selectedBoss ? '#6b4d16' : '#2a2113';
      });
      setDetail();
      capNhatNutTuDi();
      capNhatAnchorRow();
      if (id === 'all') {
        if (tuDi) { tuDi = false; capNhatNutTuDi(); log('Đã TẮT tự di chuyển (TỰ ĐI chỉ đi được khi chọn 1 boss cụ thể).'); }
        log('Đang săn: Tất cả boss (boss nào xuất hiện cũng đánh).');
      } else {
        log('Đang săn: ' + BOSSES[id].ten + ' — ' + BOSSES[id].mapTen + ' ' + BOSSES[id].toa + '.');
      }
    }
    function setDetail() {
      if (!detailEl) return;
      if (selectedBoss === 'all') {
        detailEl.textContent = 'Tất cả boss: Xích Long (Long Uyên, 3h) · Linh Hổ (Thạch Phong, 5h) · Nhện (Bãi Đá, 8h) · Ma Báo (Mỏ Linh Thạch, 11:00–21:00) · Giao Long (Chủ Nhật tối).';
        return;
      }
      var b = BOSSES[selectedBoss];
      detailEl.textContent = b.ten + ' (Cấp ' + b.cap + ') — ' + b.mapTen + ' ' + b.toa +
        ' · HP ' + b.hp.toLocaleString('vi-VN') + ' · ' + b.respawnTen +
        ' · Hộ vệ: ' + b.hoVe + '. Đồ: ' + b.drops +
        (nav() ? ' · TỰ ĐI có sẵn.' : ' · TỰ ĐI chỉ có trong Tool Tổng.');
    }
    // Vẽ lại lịch boss (gọi mỗi giây + khi có mốc hạ mới).
    function capNhatLich() {
      if (!schedEl) return;
      var srcTag = { 'bang': 'bảng game', 'co-dinh': 'giờ cố định', 'uoc-tinh': 'ước tính', 'khung-gio': 'khung giờ', 'chua-ro': '' };
      var html = BOSS_ORDER.map(function (id) {
        var b = BOSSES[id];
        var st = trangThaiBoss(b);
        var sel = (selectedBoss === id) ? ' style="color:#ffd27a"' : '';
        var tag = srcTag[st.src] ? (' <span style="color:#9a8a6a">[' + srcTag[st.src] + ']</span>') : '';
        return '<div' + sel + '>' + (st.hot ? '🔥 ' : '• ') + '<b>' + b.tenNgan + '</b> — ' + st.txt + tag +
          ' <button data-ghi="' + id + '" title="Ghi: vừa hạ boss này (để tính giờ hồi sinh)" style="padding:0 5px;border-radius:4px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">✓ hạ</button>' +
          ' <button data-xoa="' + id + '" title="Xóa mốc hạ đã ghi" style="padding:0 5px;border-radius:4px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">✕</button></div>';
      }).join('');
      schedEl.innerHTML = html;
      schedEl.querySelectorAll('[data-ghi]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-ghi');
          ghiHa(id, true);
          log('Đã ghi mốc: vừa hạ ' + BOSSES[id].ten + ' lúc ' + fmtGio(Date.now()) + ' — hồi sinh sau ~' + BOSSES[id].respawnTen + '.');
        });
      });
      schedEl.querySelectorAll('[data-xoa]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-xoa');
          xoaMoc(id);
          log('Đã xóa mốc hạ của ' + BOSSES[id].ten + '.');
        });
      });
    }

    function setOn(v) {
      on = v;
      if (toggleBtn) {
        toggleBtn.textContent = on ? 'DỪNG' : 'BẬT';
        toggleBtn.style.background = on ? '#7a2d12' : '#3a2c12';
      }
      if (on) {
        phase = 'waiting';
        currentBoss = null;
        currentBossName = '';
        lastBossHpFrac = null;
        lastHpMilestone = 1;
        // Phiên săn mới: reset bộ đếm tự hồi sinh + trạng thái tự đi.
        reviveCount = 0;
        reviveStopped = false;
        movePhase = 'idle';
        moveFails = 0;
        moveTargetId = null;
        lastReviveClickAt = 0;
        hookBossBoard();
        if (tuDi && selectedBoss !== 'all') {
          log('TỰ ĐI đang BẬT — sẽ tự đi tới ' + BOSSES[selectedBoss].mapTen + ' trước giờ ' + BOSSES[selectedBoss].tenNgan + ' hồi sinh.');
        }
        // Nhắc đặt ưu tiên Boss nếu chưa đặt (tool chỉ tự bấm được khi bảng Cài Đặt mở).
        var ut = uuTienHienTai();
        if (ut && ut !== 'boss') {
          log('Ưu tiên Tự Động Đánh đang là "' + ut + '" — mở Cài Đặt chọn "Boss" để Auto ưu tiên đánh boss.');
        } else if (!ut) {
          log('Nhớ đặt ưu tiên Tự Động Đánh = "Boss" (Cài Đặt) trước khi săn boss.');
        }
        damBaoUuTienBoss();
        damBaoAuto();
        var ten = selectedBoss === 'all' ? 'Tất cả boss' : BOSSES[selectedBoss].ten;
        setStatus('Đang chạy — săn ' + ten + '. Đang chờ boss xuất hiện…');
        log('Tool BẬT (săn ' + ten + '). Auto sẽ tự đánh boss khi xuất hiện.');
      } else {
        setStatus('Đã dừng. Auto giữ nguyên trạng thái (tự tắt tay nếu cần).');
        log('Tool DỪNG.');
      }
    }

    // ---------------- Boss gục / biến mất ----------------
    function bossBienMat(boss) {
      var hpFrac = lastBossHpFrac;
      if (hpFrac !== null && hpFrac < CFG.hpLogStep) {
        // HP đã thấy xuống dưới 25% rồi biến mất → chắc chắn đã hạ.
        ghiHa(boss.id, true);
        stats.killed += 1;
        setStats();
        log('Đã hạ ' + boss.ten + '! (HP cuối thấy ~' + Math.round(hpFrac * 100) + '%) — đồ đang tự nhặt (nam châm game), ở lại bãi ~60s.');
      } else {
        // Biến mất mà HP còn cao/không rõ — có thể nhân vật chết hoặc boss hết giờ.
        ghiHa(boss.id, false);
        log(boss.ten + ' đã biến mất (HP cuối thấy ' + (hpFrac === null ? 'không rõ' : '~' + Math.round(hpFrac * 100) + '%') + ') — có thể đã bị hạ hoặc nhân vật chết/boss hết giờ. Mốc này chỉ để ƯỚC TÍNH giờ hồi sinh.');
      }
      phase = 'looting';
      lootUntil = Date.now() + CFG.lootWaitMs;
      currentBoss = null;
      currentBossName = '';
      lastBossHpFrac = null;
      lastHpMilestone = 1;
    }

    // ---------------- Vòng lặp chính ----------------
    function tick() {
      if (!on) return;
      // Gắn hook bảng GIỜ BOSS (game có thể nạp sau tool).
      hookBossBoard();
      // ƯU TIÊN 1 — CHẾT: tự hồi sinh tại chỗ rồi đánh tiếp ngay (không chờ HP).
      if (dangChet()) { xuLyChet(); return; }
      // ƯU TIÊN 2 — TỰ ĐI: tới giờ thì tự di chuyển tới map boss. Khi đang đi
      // thì không chạy luồng đánh (Auto phải TẮT để joystick chạy được).
      if (tuDi) kiemTraDiBoss();
      if (movePhase === 'moving') {
        setStatus(lastMoveStatus || 'Đang tự đi tới map boss…');
        return;
      }
      // Luôn giữ Auto BẬT khi tool đang chạy (người dùng phải ở đúng map boss).
      damBaoAuto();
      // Cố đặt ưu tiên Boss nếu bảng Cài Đặt đang mở.
      damBaoUuTienBoss();

      var now = Date.now();
      var coMucTieu = targetVisible();
      var ten = coMucTieu ? targetName() : '';
      var boss = coMucTieu ? bossFromTargetName(ten) : null;

      if (boss) {
        // Đang đánh boss.
        if (phase !== 'fighting' || currentBoss !== boss) {
          phase = 'fighting';
          currentBoss = boss;
          currentBossName = ten;
          lastHpMilestone = 1;
          var hp0 = parseHpFrac(targetHpText());
          lastBossHpFrac = hp0;
          if (selectedBoss !== 'all' && selectedBoss !== boss.id) {
            log('Đang đánh ' + boss.ten + ' — KHÔNG phải boss đã chọn (' + BOSSES[selectedBoss].ten + '). Kiểm tra lại map?');
          } else {
            log('Đang đánh ' + boss.ten + ' (HP ' + (hp0 === null ? '?' : Math.round(hp0 * 100) + '%') + ').');
          }
          setStatus('Đang đánh ' + boss.ten + ' — HP ' + (hp0 === null ? '?' : Math.round(hp0 * 100) + '%') + '.');
        } else {
          // Đang đánh tiếp — theo dõi HP, ghi log theo mốc 25%.
          var frac = parseHpFrac(targetHpText());
          if (frac !== null) {
            lastBossHpFrac = frac;
            var milestone = frac >= 0.75 ? 1 : (frac >= 0.5 ? 0.75 : (frac >= 0.25 ? 0.5 : 0.25));
            if (milestone < lastHpMilestone && now - lastBossHpLogAt >= CFG.hpLogMinMs) {
              lastHpMilestone = milestone;
              lastBossHpLogAt = now;
              log(boss.ten + ' còn ~' + Math.round(frac * 100) + '% HP.');
            }
            setStatus('Đang đánh ' + boss.ten + ' — HP ~' + Math.round(frac * 100) + '%.');
          } else {
            setStatus('Đang đánh ' + boss.ten + ' — HP ' + (targetHpText() || '?') + '.');
          }
        }
        return;
      }

      if (coMucTieu && ten) {
        // Đang đánh quái/hộ vệ (không phải boss) — có thể đang dọn hộ vệ trước boss.
        if (currentBossName !== ten) {
          currentBossName = ten;
          log('Đang đánh ' + ten + ' (quái/hộ vệ — dọn trước khi đánh boss).');
        }
        phase = 'fighting';
        setStatus('Đang đánh ' + ten + ' (quái/hộ vệ)…');
        return;
      }

      // Không có mục tiêu.
      if (phase === 'fighting' && currentBoss) {
        // Vừa đánh boss xong thì mục tiêu biến mất → boss gục/biến mất.
        bossBienMat(currentBoss);
        setStatus('Boss vừa biến mất — đang chờ nam châm nhặt đồ (~60s)…');
        return;
      }
      if (phase === 'looting') {
        if (now >= lootUntil) {
          phase = 'waiting';
          stats.looted += 1;
          setStats();
          log('Đã qua thời gian chờ nhặt đồ (~60s) — quay lại chờ boss hồi sinh.');
          setStatus('Đang chờ boss hồi sinh…');
        } else {
          setStatus('Đang chờ nam châm nhặt đồ — còn ~' + Math.ceil((lootUntil - now) / 1000) + 's. Ở lại bãi, đừng rời map.');
        }
        return;
      }
      // Đang chờ boss xuất hiện.
      if (phase !== 'waiting') phase = 'waiting';
      var tenSan = selectedBoss === 'all' ? 'boss' : BOSSES[selectedBoss].ten;
      var st = selectedBoss === 'all' ? null : trangThaiBoss(BOSSES[selectedBoss]);
      setStatus('Đang chờ ' + tenSan + ' xuất hiện…' + (st ? ' (' + st.txt + ')' : ''));
    }

    // ---------------- Khởi động ----------------
    buildPanel();
    setInterval(tick, CFG.pollMs);
    setInterval(capNhatLich, 1000);
    setStatus('Chưa bật — đưa nhân vật tới đúng map boss rồi bấm BẬT.');
    setStats();
    log('Tool đã nạp (v1.2.1). Mặc định TẮT. 5 boss theo giờ: Xích Long 3h, Linh Hổ 5h, Nhện 8h, Ma Báo 11:00–21:00, Giao Long tối Chủ Nhật. MỚI: TỰ ĐI tới map boss trước giờ hồi sinh + TỰ HỒI SINH tại chỗ tối đa 3 lần rồi đánh tiếp ngay. Bấm "—" để thu nhỏ bảng.');
    // Điều khiển từ Console khi cần debug: __TT2D_BOSS__.start() / .stop() / .select('xich_long'|'linh_ho'|'nhen'|'ma_bao'|'giao_long'|'all') / .status() / .ghiHa('xich_long') / .lich() / .setCollapsed(true|false) / .setTuDi(true|false) / .ghiAnchor('xich_long', 21*60) / ._debug
    window.__TT2D_BOSS__ = {
      start: function () { setOn(true); },
      stop: function () { setOn(false); },
      select: function (id) { chonBoss(id); },
      setCollapsed: function (v) { setCollapsed(v); },
      collapsed: function () { return collapsed; },
      ghiHa: function (id) { ghiHa(id, true); },
      setTuDi: function (v) { setTuDi(!!v); },
      tuDi: function () { return tuDi; },
      moveStatus: function () { return { movePhase: movePhase, moveFails: moveFails, moveTargetId: moveTargetId, lastMoveStatus: lastMoveStatus }; },
      ghiAnchor: function (id, mins) { ghiAnchor(id, mins); },
      xoaAnchor: function (id) { xoaAnchor(id); },
      lich: function () {
        return BOSS_ORDER.map(function (id) {
          var st = trangThaiBoss(BOSSES[id]);
          return { id: id, ten: BOSSES[id].ten, txt: st.txt, hot: st.hot, nextAt: st.nextAt, src: st.src };
        });
      },
      status: function () {
        return {
          on: on, phase: phase, selectedBoss: selectedBoss,
          currentBoss: currentBoss ? currentBoss.id : null,
          currentTarget: currentBossName, lastBossHpFrac: lastBossHpFrac,
          autoOn: autoIsOn(), uuTien: uuTienHienTai(), stats: stats,
          tuDi: tuDi, movePhase: movePhase, moveFails: moveFails,
          reviveCount: reviveCount, boardHooked: boardHooked,
        };
      },
      // Hook cho test tự động (không dùng khi chơi thật).
      _debug: {
        dangChet: dangChet,
        coNenHoiSinh: coNenHoiSinh,
        laGioChinhMa: laGioChinhMa,
        docMapHienTai: docMapHienTai,
        trangThaiBoss: function (id) { return trangThaiBoss(BOSSES[id]); },
        ghiBoard: ghiBoard,
        boardData: function () { return boardData; },
        reviveCount: function () { return reviveCount; },
        setReviveCount: function (n) { reviveCount = n; },
        docAnchor: docAnchor,
        mocCoDinhTiepTheo: mocCoDinhTiepTheo,
        damBaoAuto: damBaoAuto,
        autoIsOn: autoIsOn,
        tap: tap,
      },
    };
    Tong.register('boss', window.__TT2D_BOSS__);


  })();


  // ================= MODULE: duoc (Dược v1.1.1: Trúc Cơ "Tự Đi", Luyện Khí nhận việc tay theo DC; tự hủy việc dở đã nhận trước khi bật tool; bấm nút game bằng tap() (pointerdown+pointerup+click) + tắt Auto trước khi lái joystick.) =================

  (function () {


    // ---------------- Cấu hình ----------------
    var CFG = {
      pollMs: 250,              // kiểm tra trạng thái mỗi 250ms
      taskTimeoutMs: 10 * 60 * 1000, // việc quá 10 phút chưa xong → huỷ, đổi việc
      maxKetLienTiep: 2,        // kẹt 2 lần liên tiếp → DỪNG tool
      maxTuDiKhoiDongLai: 3,    // "Tự Đi" dừng giữa chừng thì bật lại tối đa 3 lần
      joyHoldMs: 350,           // giữ joystick mỗi nhịp
      joyLongMs: 900,           // nhịp dài khi kẹt
      joyWaitMs: 250,           // nghỉ giữa các nhịp
      portalHoldMs: 700,        // giữ joystick để bước qua cổng
      portalTries: 6,           // số nhịp giữ tối đa để qua cổng
      ganDaiPhu: 6,             // trong 6 ô quanh Đại Phu thì tính là "gần"
      hpTuVe: 0.80,             // LK: HP dưới 80% thì bật Auto tự vệ
      hpAnToan: 0.95,           // LK: HP trên 95% thì tắt Auto tự vệ
      hpNguyHiem: 0.35,         // HP dưới 35% thì chờ hồi, không bật lại "Tự Đi"
      choDoiMs: 3000,           // chờ hộp thoại mở sau khi bấm tương tác
      nghiGiuaBuocMs: 600,      // nghỉ giữa các lần bấm nút
    };

    // ---------------- Bảng việc ----------------
    // Thứ tự ưu tiên: DC cao nhất trước; hoà DC thì việc gần hơn trước.
    var TASKS = {
      cau_ca:        { id: 'cau_ca', ten: 'Câu Cá Làm Dược Liệu', tenNgan: 'Câu Cá', dc: 4, need: 3, kind: 'fishing',
                       map: 'duoc_vien', x: 18, y: 16, choLam: 'Hồ Bích Thuỷ' },
      duoc_moc:      { id: 'duoc_moc', ten: 'Thu Gom Dược Mộc', tenNgan: 'Thu Gom', dc: 3, need: 5, kind: 'chop',
                       map: 'duoc_vien', x: 34, y: 25, choLam: 'Cổ Thụ Linh Mộc' },
      ho_tong_chau:  { id: 'ho_tong_chau', ten: 'Đưa Người Về Làng', tenNgan: 'Đưa Người', dc: 2, need: 0, kind: 'escort',
                       map: 'tan_vien', x: 9, y: 10, choLam: 'Thầy Ông Nội (làng)' },
      truc_gia:      { id: 'truc_gia', ten: 'Trúc Tâm Dẫn Dược', tenNgan: 'Trúc Tâm', dc: 1, need: 4, kind: 'chop',
                       map: 'thanh_truc_lam', spots: [[18, 5], [27, 12], [10, 20], [31, 8]], choLam: 'Rừng Trúc' },
      linh_chi:      { id: 'linh_chi', ten: 'Linh Chi Dưới Chân Núi', tenNgan: 'Linh Chi', dc: 1, need: 3, kind: 'harvest',
                       map: 'tan_vien',
                       spots: [[19, 2], [20, 2], [18, 3], [21, 3], [23, 3], [25, 3], [28, 3], [32, 1], [31, 2], [33, 2], [30, 3], [33, 3], [6, 3], [7, 3]],
                       choLam: 'Bắc làng Tản Viên' },
    };
    var THU_TU_UU_TIEN = ['cau_ca', 'duoc_moc', 'ho_tong_chau', 'truc_gia', 'linh_chi'];
    var VIEC_CAM = { dai_hoi: 'Thắng Trận Đại Hội', van_tieu: 'Vận Tiêu Một Chuyến', chien_bang: 'Thắng Trận Tán Tu Chiến Bảng' };
    var TONG_LUOT_NGAY = 15; // 5 việc thường × 3 lượt
    var DAI_PHU = { map: 'duoc_vien', x: 14, y: 8 };
    var MAP_TEN = { duoc_vien: 'Thảo Dược Cốc', thanh_truc_lam: 'Rừng Trúc', tan_vien: 'Chân Núi Tản Viên' };
    // Cổng: từ map A tới map B — đi tới ô cổng rồi giữ joystick hướng ra ngoài.
    var CONG = {
      'duoc_vien>thanh_truc_lam': { x: 12, y: 0, dx: 0, dy: -1 },
      'thanh_truc_lam>tan_vien': { x: 7, y: 0, dx: 0, dy: -1 },
      'tan_vien>thanh_truc_lam': { x: 7, y: 29, dx: 0, dy: 1 },
      'thanh_truc_lam>duoc_vien': { x: 12, y: 29, dx: 0, dy: 1 },
    };
    function duongDi(tuMap, toiMap) {
      if (tuMap === toiMap) return [];
      if (tuMap === 'duoc_vien' && toiMap === 'tan_vien')
        return [{ map: 'thanh_truc_lam', cong: 'duoc_vien>thanh_truc_lam' }, { map: 'tan_vien', cong: 'thanh_truc_lam>tan_vien' }];
      if (tuMap === 'tan_vien' && toiMap === 'duoc_vien')
        return [{ map: 'thanh_truc_lam', cong: 'tan_vien>thanh_truc_lam' }, { map: 'duoc_vien', cong: 'thanh_truc_lam>duoc_vien' }];
      if (tuMap === 'duoc_vien' && toiMap === 'thanh_truc_lam')
        return [{ map: 'thanh_truc_lam', cong: 'duoc_vien>thanh_truc_lam' }];
      if (tuMap === 'thanh_truc_lam' && toiMap === 'duoc_vien')
        return [{ map: 'duoc_vien', cong: 'thanh_truc_lam>duoc_vien' }];
      if (tuMap === 'thanh_truc_lam' && toiMap === 'tan_vien')
        return [{ map: 'tan_vien', cong: 'thanh_truc_lam>tan_vien' }];
      if (tuMap === 'tan_vien' && toiMap === 'thanh_truc_lam')
        return [{ map: 'thanh_truc_lam', cong: 'tan_vien>thanh_truc_lam' }];
      return null; // không biết đường
    }

    // ---------------- Trạng thái ----------------
    var on = false;
    var phase = 'idle'; // idle | cho_dai_phu | mo_menu | tu_di | nhan_viec | xac_nhan | di_lam | lam_viec | ve_nop | nop | ket_thuc
    var realm = null;   // 'truc_co' | 'luyen_khi' (nhận biết từ menu Đại Phu)
    var viecHienTai = null; // id việc đang làm (LK) hoặc việc bộ máy đang làm (TC, đọc từ tracker)
    var luotDaLam = 0;      // số lượt đã nộp xong (đếm theo lần nộp tool thấy)
    var luotConLai = {};    // id việc -> số lượt còn lại hôm nay (đọc từ bảng game)
    var dcHienTai = null;   // điểm Dược Công hiện tại (đọc từ hộp thoại)
    var dcLucBatDau = null;
    var taskBatDauAt = 0;   // thời điểm bắt đầu việc hiện tại
    var demKet = 0;         // số lần kẹt liên tiếp
    var demTuDiLai = 0;     // số lần bật lại "Tự Đi"
    var daNhanViec = false; // phiên này tool đã nhận được ít nhất 1 việc (để phân biệt việc dở có sẵn với việc của tool)
    var viecNhanTay = false; // đang tiếp tục việc NHẬN BẰNG TAY (không phải việc tool tự nhận): kẹt đường thì DỪNG báo rõ, KHÔNG tự huỷ
    var tuVeDangBat = false;// LK: Auto tự vệ đang bật?
    var choDoiTu = 0;       // mốc thời gian chờ (mở hộp thoại...)
    var logLines = [];
    var collapsed = false;  // bảng đang thu nhỏ?

    function log(msg) {
      var t = new Date();
      var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
      var line = hh + ':' + mm + ':' + ss + ' — ' + msg;
      logLines.push(line);
      if (logLines.length > 40) logLines.shift();
      renderLog();
    }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function $(s) { return document.querySelector(s); }
    function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
    function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }

    // ---------------- Đọc trạng thái game (chỉ đọc DOM) ----------------
    function dialogMo() {
      var d = $('#dialog');
      return !!(d && d.offsetParent !== null && !d.classList.contains('hidden'));
    }
    // Đọc hộp thoại đang mở: tiêu đề, nội dung, các lựa chọn, nút hành động.
    function docDialog() {
      if (!dialogMo()) return null;
      var choices = $$('#dialog-choices .btn-choice').map(function (b) {
        var spans = b.querySelectorAll('span');
        var label = spans.length ? txt(spans[0]) : txt(b);
        var note = '';
        b.querySelectorAll('.c-note').forEach(function (s) { note += (note ? ' ' : '') + txt(s); });
        return { label: label, note: note, disabled: !!b.disabled, el: b };
      });
      var act = $('#dialog-action');
      return {
        title: txt($('#dialog-title')),
        text: txt($('#dialog-text')),
        choices: choices,
        action: (act && act.offsetParent !== null) ? { label: txt(act), el: act } : null,
      };
    }
    function timLuaChon(dlg, re) {
      if (!dlg) return null;
      for (var i = 0; i < dlg.choices.length; i++) {
        if (re.test(dlg.choices[i].label)) return dlg.choices[i];
      }
      return null;
    }
    function bamLuaChon(re) {
      var dlg = docDialog();
      var c = timLuaChon(dlg, re);
      if (!c) return false;
      if (c.disabled) return 'disabled';
      tap(c.el);
      return true;
    }
    function bamNutHanhDong(re) {
      var dlg = docDialog();
      if (!dlg || !dlg.action) return false;
      if (re && !re.test(dlg.action.label)) return false;
      tap(dlg.action.el);
      return true;
    }
    function dongDialog() {
      var c = $('#dialog-close');
      if (c && dialogMo()) tap(c);
    }
    // Điểm Dược Công hiện tại ("Dược Công: X điểm" trong hộp thoại).
    function docDC(dlg) {
      var t = dlg ? dlg.text : '';
      var m = t.match(/Dược Công:\s*(\d+)\s*điểm/);
      return m ? parseInt(m[1], 10) : null;
    }
    // Lượt còn lại từng việc — đọc từ ghi chú "còn r/c lượt" / "Hết c/c lượt".
    function docLuotTuDanhSach(dlg) {
      var out = {};
      if (!dlg) return out;
      dlg.choices.forEach(function (c) {
        var id = null;
        Object.keys(TASKS).forEach(function (k) {
          if (c.label.indexOf(TASKS[k].tenNgan) >= 0 || c.label === TASKS[k].ten || c.label.indexOf(TASKS[k].ten) >= 0) id = k;
        });
        if (!id) return;
        var m = c.note.match(/còn\s*(\d+)\s*\/\s*(\d+)\s*lượt/);
        if (m) { out[id] = parseInt(m[1], 10); return; }
        var m2 = c.note.match(/Hết\s*(\d+)\s*\/\s*(\d+)\s*lượt/);
        if (m2) { out[id] = 0; return; }
        if (/Cần đạt/.test(c.note)) out[id] = null; // bị khoá cảnh giới
      });
      return out;
    }
    // Vị trí nhân vật + tên map — đọc từ chữ trong trang.
    function docViTri() {
      var t = document.body ? (document.body.innerText || '') : '';
      var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      var map = null;
      var hm = document.querySelector('#hud-map');
      var hmt = hm ? (hm.innerText || hm.textContent || '').trim() : '';
      function nhanMap(s) {
        if (/Hồ Tây/.test(s)) return 'van_can';
        if (/Thảo Dược Cốc/.test(s)) return 'duoc_vien';
        if (/Rừng Trúc/.test(s)) return 'thanh_truc_lam';
        if (/Chân Núi Tản Viên/.test(s)) return 'tan_vien';
        if (/Vườn Cá Nhân/.test(s)) return 'vuon_ca_nhan';
        return null;
      }
      if (hmt) map = nhanMap(hmt);
      if (!map) map = nhanMap(t);
      return { x: m ? parseInt(m[1], 10) : null, y: m ? parseInt(m[2], 10) : null, map: map };
    }
    // HP người chơi — đọc từ thanh HP (.pl-bar.hp .pl-n "cur / max").
    function docHP() {
      var el = document.querySelector('.pl-bar.hp .pl-n');
      if (!el) return null;
      var m = txt(el).match(/(\d+)\s*\/\s*(\d+)/);
      if (!m) return null;
      var cur = parseInt(m[1], 10), max = parseInt(m[2], 10);
      if (!max) return null;
      return { cur: cur, max: max, tiLe: cur / max };
    }
    // Chữ thông báo của game (#ritual-caption).
    function docCaption() { return txt($('#ritual-caption')); }
    // Tiến độ việc đang làm — đọc từ #quest-objectives.
    function docTracker() {
      var el = $('#quest-objectives');
      if (!el) return '';
      return txt(el);
    }
    // Việc đang làm (đoán từ tracker + hộp thoại): trả về id việc hoặc null.
    function doanViecDangLam() {
      var t = docTracker() + ' ' + (docDialog() ? docDialog().text : '');
      if (/Câu\s/.test(t) && /cá/i.test(t)) return 'cau_ca';
      if (/Thu Gom|Cành Khô|cành khô/i.test(t)) return 'duoc_moc';
      if (/Dẫn Cháu|Đưa Người|Thầy Ông Nội/i.test(t)) return 'ho_tong_chau';
      if (/Linh Chi/i.test(t)) return 'linh_chi';
      if (/Trúc Tâm|Trúc Già/i.test(t)) return 'truc_gia';
      return null;
    }
    // Tên việc đang giữ (đoán từ tracker) — dùng để log khi dừng vì việc lạ.
    function tenViecDangGiu() {
      var id = doanViecDangLam();
      if (id && TASKS[id]) return TASKS[id].ten;
      var tr = docTracker();
      if (tr) return tr;
      return 'việc chưa rõ tên';
    }
    // Việc dược ĐANG GIỮ — nhận diện từ tracker (#quest-objectives) + hộp
    // thoại đang mở. Trả về {id, kind, ten} hoặc null nếu không giữ việc
    // dược nào nhận diện được. Khớp Đại Hội / Tán Tu / Vận Tiêu TRƯỚC
    // (tên riêng), rồi mới tới 5 việc thường. Dùng cho: nút "TỰ ĐI LÀM
    // VIỆC ĐÃ NHẬN" + quyết định tiếp tục / huỷ / dừng khi bật tool.
    // (Tên việc lấy từ client 24/11 — game.js: dai_hoi "Thắng Trận Đại Hội"
    // kind "tournament"; chien_bang "Thắng Trận Tán Tu Chiến Bảng" kind
    // "chien_bang"; van_tieu "Vận Tiêu Một Chuyến" kind "convoy".)
    var VIEC_DAC_BIET = {
      dai_hoi: { id: 'dai_hoi', kind: 'tournament', ten: 'Thắng Trận Đại Hội', re: /Thắng Trận Đại Hội|Đại Hội Tu Tiên/ },
      chien_bang: { id: 'chien_bang', kind: 'chien_bang', ten: 'Thắng Trận Tán Tu Chiến Bảng', re: /Tán Tu/ },
      van_tieu: { id: 'van_tieu', kind: 'convoy', ten: 'Vận Tiêu Một Chuyến', re: /Vận Tiêu/ },
    };
    // Tên việc cấm nhận — chặn cuối ở bộ chọn việc (phòng nhận nhầm từ
    // danh sách hộp thoại). Chỉ 5 việc thường được nhận.
    function laViecCam(tenViec) {
      return /Đại Hội|Tán Tu|Vận Tiêu/.test(tenViec || '');
    }
    function docViecDangGiu() {
      var dlg = docDialog();
      var t = docTracker() + ' ' + (dlg ? ((dlg.text || '') + ' ' + (dlg.title || '')) : '');
      var k;
      for (k in VIEC_DAC_BIET) {
        if (VIEC_DAC_BIET[k].re.test(t)) return VIEC_DAC_BIET[k];
      }
      var id = doanViecDangLam();
      if (id && TASKS[id]) return { id: id, kind: TASKS[id].kind, ten: TASKS[id].ten };
      return null;
    }
    // Việc đang giữ đã đủ điều kiện nộp chưa (tiến độ a/b đầy; cần max > 0
    // vì việc Đưa Người không có số a/b trong tracker).
    function viecDaXong() {
      var td = docTienDo();
      return !!(td && td.max > 0 && td.cur >= td.max);
    }
    // Tiến độ "a/b" trong tracker (vd "2/3").
    function docTienDo() {
      var t = docTracker();
      var m = t.match(/(\d+)\s*\/\s*(\d+)/);
      return m ? { cur: parseInt(m[1], 10), max: parseInt(m[2], 10) } : null;
    }
    function ganDaiPhu() {
      var p = docViTri();
      if (p.map !== 'duoc_vien' || p.x === null) return false;
      return Math.abs(p.x - DAI_PHU.x) + Math.abs(p.y - DAI_PHU.y) <= CFG.ganDaiPhu;
    }

    // ---------------- Bấm nút game bằng sự kiện pointer ----------------
    // game.js (client 24/11): nút HUD (#btn-attack, #btn-fly,
    // #btn-auto-touch, #btn-target, #btn-fishing-stop-touch,
    // #btn-meditate-touch, #btn-run) CHỈ bind "pointerdown" (helper k()
    // trong TouchUI: addEventListener "pointerdown" duy nhất, KHÔNG có
    // listener "click") — .click() lên các nút này là no-op, đã làm tool
    // Dược liệt hoàn toàn (không mở được hộp thoại Đại Phu, không bật/tắt
    // được Auto/Phi Hành — Thanh báo lỗi 25/11). Nút hộp thoại
    // (.btn-choice, #dialog-action, #dialog-close) thì bind "click".
    // tap() phát pointerdown + pointerup + click nên bấm được cả hai
    // loại; mỗi nút chỉ bind 1 loại nên không bấm đúp.
    // LƯU Ý: pressAutoToggle/pressFlyToggle chỉ đặt cờ _autoToggle/
    // _flyToggle, game tiêu thụ cờ ở frame sau nên class "active" đổi
    // CHẬM hơn lệnh bấm ~1 frame — KHÔNG kiểm tra lại trạng thái ngay
    // sau khi bấm (đọc class cũ sẽ tưởng chưa đổi rồi bấm lần nữa =
    // toggle 2 lần về trạng thái cũ). Bấm đúng 1 lần rồi thôi.
    function tap(el) {
      if (!el) return false;
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      function ev(ty) {
        return new PointerEvent(ty, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 12345, isPrimary: true });
      }
      el.dispatchEvent(ev('pointerdown'));
      el.dispatchEvent(ev('pointerup'));
      el.click();
      return true;
    }

    // ---------------- Nút Auto / Phi Hành / Chạy ----------------
    function nutAuto() { return $('#btn-auto-touch') || $('#btn-auto'); }
    function autoDangBat() {
      var b = nutAuto();
      return !!(b && b.classList.contains('active'));
    }
    function datAuto(bat) {
      var b = nutAuto();
      if (!b) return false;
      if (autoDangBat() === bat) return true;
      // Chỉ bấm 1 lần bằng tap() (nút nghe pointerdown, không nghe click);
      // trạng thái đổi ở frame sau nên không kiểm tra lại ngay tại đây.
      return tap(b);
    }
    function flyDangBat() {
      var b = $('#btn-fly');
      return !!(b && b.classList.contains('active'));
    }
    function datFly(bat) {
      var b = $('#btn-fly');
      if (!b) return false;
      if (flyDangBat() === bat) return true;
      return tap(b);
    }
    function runDangBat() {
      var b = $('#btn-run');
      return !!(b && b.classList.contains('active'));
    }
    function datRun(bat) {
      var b = $('#btn-run');
      if (!b) return false;
      if (runDangBat() === bat) return true;
      // Nút Chạy nghe pointerdown — dispatch đúng loại sự kiện của nó.
      var r = b.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      ['pointerdown', 'pointerup'].forEach(function (ty) {
        b.dispatchEvent(new PointerEvent(ty, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1 }));
      });
      return true;
    }
    // Nút Tương Tác (#btn-attack đổi nhãn khi đứng gần NPC/vật).
    function nutTuongTac() {
      var b = $('#btn-attack');
      if (!b || b.offsetParent === null) return null;
      var aria = b.getAttribute('aria-label') || '';
      var label = txt(b.querySelector('.skill-name')) || txt(b);
      return { el: b, aria: aria, label: label, laTuongTac: /Tương tác/i.test(aria) || /Tương Tác/i.test(label) };
    }

    // ---------------- Lái nhân vật bằng joystick ----------------
    // Dispatch pointerdown/move/up lên #joystick (client không kiểm tra
    // isTrusted — đã xác minh 0 lần xuất hiện trong game.js).
    function joyHold(dx, dy, ms) {
      var joy = $('#joystick');
      if (!joy) return false;
      var r = joy.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var pid = 12345;
      function ev(ty, x, y) {
        return new PointerEvent(ty, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: pid, isPrimary: true });
      }
      joy.dispatchEvent(ev('pointerdown', cx, cy));
      var steps = 4;
      for (var i = 1; i <= steps; i++) {
        joy.dispatchEvent(ev('pointermove', cx + dx * i / steps, cy + dy * i / steps));
      }
      return new Promise(function (resolve) {
        setTimeout(function () {
          joy.dispatchEvent(ev('pointerup', cx + dx, cy + dy));
          setTimeout(resolve, CFG.joyWaitMs);
        }, ms);
      });
    }
    function joyHuong(dx, dy, ms) {
      // Chỉ lái 1 trục mỗi nhịp (ưu tiên trục lệch nhiều hơn) để khỏi lạc.
      if (Math.abs(dx) >= Math.abs(dy)) return joyHold(dx > 0 ? 40 : -40, 0, ms);
      return joyHold(0, dy > 0 ? 40 : -40, ms);
    }
    // Đi tới ô (tx,ty) trong map hiện tại. Trả về true nếu tới nơi (sai số <=1).
    // Joystick KHÔNG chạy khi Auto BẬT — tắt Auto ngay từ nhịp đầu, tắt lại
    // nếu Auto tự bật giữa đường (vào combat); tới nơi (hoặc kẹt) thì bật
    // lại Auto nếu là Trúc Cơ. Luyện Khí giữ Auto TẮT sau khi đi (chỉ bật
    // lại khi tự vệ do kiemTraTuVe lo).
    async function diToi(tx, ty, maxBuoc) {
      maxBuoc = maxBuoc || 60;
      var autoCu = autoDangBat();
      if (autoCu) datAuto(false);
      var last = null, ket = 0, kq = false;
      for (var i = 0; i < maxBuoc; i++) {
        var p = docViTri();
        if (p.x === null) { await sleep(2000); continue; }
        if (Math.abs(p.x - tx) <= 1 && Math.abs(p.y - ty) <= 1) { kq = true; break; }
        if (autoDangBat()) datAuto(false);
        if (last && last.x === p.x && last.y === p.y) {
          ket++;
          if (ket >= 3) {
            log('Kẹt ở (' + p.x + ',' + p.y + ') — thử nhịp dài.');
            var dx = tx - p.x, dy = ty - p.y;
            await joyHuong(dx, dy, CFG.joyLongMs);
            ket = 0;
            continue;
          }
        } else ket = 0;
        last = { x: p.x, y: p.y };
        await joyHuong(tx - p.x, ty - p.y, CFG.joyHoldMs);
        if (i % 10 === 9) {
          var q = docViTri();
          if (q.map && q.map !== docViTri().map) break;
        }
      }
      if (autoCu && realm !== 'luyen_khi') datAuto(true);
      return kq;
    }
    // Bước qua cổng: tới ô cổng rồi giữ joystick hướng ra ngoài tới khi đổi map.
    async function quaCong(congKey) {
      var c = CONG[congKey];
      if (!c) return false;
      // Hạ cánh trước cổng (đang bay không qua được cổng).
      if (flyDangBat()) datFly(false);
      await sleep(400);
      var ok = await diToi(c.x, c.y, 60);
      if (!ok) { log('Không tới được cổng (' + c.x + ',' + c.y + ').'); return false; }
      var mapCu = docViTri().map;
      for (var i = 0; i < CFG.portalTries; i++) {
        if (autoDangBat()) datAuto(false); // đẩy cổng cũng cần Auto TẮT
        await joyHold(c.dx * 40, c.dy * 40, CFG.portalHoldMs);
        var p = docViTri();
        if (p.map && p.map !== mapCu) return true;
      }
      log('Không qua được cổng — có thể bị chặn.');
      return false;
    }
    // Đi theo đường tới map đích (qua các cổng). Trả về true nếu tới đúng map.
    async function diToiMap(toiMap) {
      var p = docViTri();
      if (p.map === toiMap) return true;
      var duong = duongDi(p.map, toiMap);
      if (!duong) { log('Không biết đường từ ' + (p.map || '?') + ' tới ' + toiMap + '.'); return false; }
      for (var i = 0; i < duong.length; i++) {
        var ok = await quaCong(duong[i].cong);
        if (!ok) return false;
        await sleep(800);
      }
      return docViTri().map === toiMap;
    }

    // ---------------- Chọn việc tốt nhất (LK) ----------------
    function chonViecTotNhat() {
      var best = null;
      THU_TU_UU_TIEN.forEach(function (id) {
        var r = luotConLai[id];
        if (r === undefined || r === null || r <= 0) return;
        if (!best || TASKS[id].dc > TASKS[best].dc) best = id;
      });
      return best;
    }
    function tongLuotConLai() {
      var s = 0, biet = false;
      THU_TU_UU_TIEN.forEach(function (id) {
        if (typeof luotConLai[id] === 'number') { s += luotConLai[id]; biet = true; }
      });
      return biet ? s : null;
    }
    function capNhatLuotDaLam() {
      var con = tongLuotConLai();
      if (con !== null) luotDaLam = Math.max(luotDaLam, TONG_LUOT_NGAY - con);
    }

    // ---------------- Tự vệ (LK) ----------------
    function kiemTraTuVe() {
      if (realm !== 'luyen_khi') return;
      var hp = docHP();
      if (!hp) return;
      if (!tuVeDangBat && hp.tiLe < CFG.hpTuVe) {
        if (datAuto(true)) { tuVeDangBat = true; log('Bị quái đánh (HP ' + Math.round(hp.tiLe * 100) + '%) — bật Auto tự vệ.'); }
      } else if (tuVeDangBat && hp.tiLe >= CFG.hpAnToan) {
        if (datAuto(false)) { tuVeDangBat = false; log('HP đã hồi (' + Math.round(hp.tiLe * 100) + '%) — tắt Auto, làm việc tiếp.'); }
      } else if (tuVeDangBat && hp.tiLe < CFG.hpTuVe && !autoDangBat()) {
        // Auto tự vệ bị diToi tắt lúc di chuyển — bật lại (không log để khỏi spam).
        datAuto(true);
      }
    }

    // Hộp thoại này có phải của Đại Phu không? (tránh mở nhầm hộp thoại
    // của hồ/cây/NPC khác khi bấm nút Tương Tác ở xa Đại Phu.)
    function laHopThoaiDaiPhu(dlg) {
      if (!dlg) return false;
      if (/Đại Phu/.test(dlg.title || '')) return true;
      return dlg.choices.some(function (c) {
        return /Mở Quầy Đổi Hạt|Nhận Việc Dược Công|Tự Đi Làm Việc Dược Công|Huỷ Nhiệm Vụ/.test(c.label);
      });
    }
    // ---------------- Mở hộp thoại Đại Phu ----------------
    // Bấm nút Tương Tác khi đứng gần Đại Phu, chờ hộp thoại mở.
    // Nếu đang ở xa (vd vừa huỷ việc ở hồ) thì bước dần về Đại Phu.
    async function moHopThoaiDaiPhu() {
      var p0 = docViTri();
      if (p0.map && p0.map !== 'duoc_vien') return null; // ở map khác — không đi bộ tới được
      // Luôn đóng hộp thoại đang mở (nếu có) rồi mở lại từ đầu — menu Đại Phu
      // được game dựng lại theo trạng thái hiện tại. Nếu tin hộp thoại cũ thì
      // có thể đọc menu cũ (vd vừa BẬT lại tool mà hộp thoại còn mở từ phiên
      // trước, trong khi acc đã nhận việc dở) và bỏ qua việc cần huỷ.
      if (dialogMo()) { dongDialog(); await sleep(600); }
      // Bước lại gần Đại Phu bằng joystick — cần Auto TẮT (joystick không
      // chạy khi Auto BẬT); xong thì bật lại Auto nếu là Trúc Cơ.
      var autoCu = autoDangBat();
      if (autoCu) datAuto(false);
      function khoiPhucAuto() { if (autoCu && realm !== 'luyen_khi') datAuto(true); }
      for (var lan = 0; lan < 30; lan++) {
        var nt = nutTuongTac();
        // Chỉ bấm khi nút Tương Tác đang chỉ vào Đại Phu (aria-label ghi rõ).
        // Nếu aria trống thì bấm thử rồi kiểm tra hộp thoại mở ra.
        if (nt && nt.laTuongTac && (!nt.aria || /Đại Phu/.test(nt.aria))) {
          tap(nt.el);
          await sleep(CFG.choDoiMs);
          if (dialogMo()) {
            var d1 = docDialog();
            if (laHopThoaiDaiPhu(d1)) { khoiPhucAuto(); return d1; }
            dongDialog();
            await sleep(600);
          }
        }
        // Chưa mở được — bước lại gần Đại Phu 1 nhịp.
        var p = docViTri();
        if (p.x !== null && p.map === 'duoc_vien') {
          await joyHuong(DAI_PHU.x - p.x, DAI_PHU.y - p.y, CFG.joyHoldMs);
        }
        await sleep(800);
      }
      if (dialogMo()) {
        var d2 = docDialog();
        if (laHopThoaiDaiPhu(d2)) { khoiPhucAuto(); return d2; }
        dongDialog();
      }
      khoiPhucAuto();
      return null;
    }

    // ---------------- Chế độ Trúc Cơ: dùng "Tự Đi" của game ----------------
    async function batTuDi() {
      // Bật Phi Hành + Chạy + Auto trước khi bắt đầu (quy tắc đứng).
      datFly(true); datRun(true); datAuto(true);
      await sleep(500);
      var dlg = await moHopThoaiDaiPhu();
      if (!dlg) { log('Không mở được hộp thoại Đại Phu.'); return false; }
      var tuDi = timLuaChon(dlg, /Tự Đi Làm Việc Dược Công/);
      if (!tuDi) { log('Không thấy mục "Tự Đi Làm Việc Dược Công" trong menu.'); return false; }
      if (tuDi.disabled) { log('"Tự Đi" đang bị khoá — ' + (tuDi.note || '') + '.'); return false; }
      tap(tuDi.el);
      await sleep(CFG.choDoiMs);
      var dlg2 = docDialog();
      if (!dlg2) { log('Không mở được hộp thoại xác nhận "Tự Đi".'); return false; }
      var ok = bamNutHanhDong(/Bắt Đầu Tự Làm/);
      if (!ok) { log('Không thấy nút "Bắt Đầu Tự Làm".'); return false; }
      log('Đã bấm "Bắt Đầu Tự Làm" — game tự làm dược.');
      daNhanViec = true;
      phase = 'tu_di';
      return true;
    }
    // Kiểm tra bộ máy "Tự Đi" còn chạy không (theo dõi thụ động, KHÔNG chạm màn hình).
    function tuDiDaDung() {
      var cap = docCaption();
      if (/Xong việc Dược Công hôm nay/.test(cap)) return 'xong';
      if (/Kẹt đường|Không tìm được đường|Máy chủ chưa nhận|Chờ nguyên liệu quá lâu|Quái chặn đường quá lâu|Hạ phi hành/.test(cap)) return 'loi:' + cap;
      return null;
    }

    // ---------------- Chế độ Luyện Khí: nhận việc tay ----------------
    async function nhanViecTotNhat() {
      var dlg = await moHopThoaiDaiPhu();
      if (!dlg) { log('Không mở được hộp thoại Đại Phu.'); return false; }
      // Nếu đang giữ việc: quyết định theo LOẠI việc (lệnh Thanh 07:23 +
      // 07:26 25/11) — việc thường thì TIẾP TỤC làm; Đại Hội / Tán Tu thì
      // TỰ HUỶ rồi nhận việc thường; Vận Tiêu / việc lạ thì DỪNG báo rõ.
      var dangGiu = timLuaChon(dlg, /Huỷ Nhiệm Vụ/);
      if (dangGiu) {
        var giuNv = docViecDangGiu();
        if (giuNv && TASKS[giuNv.id]) {
          if (!daNhanViec) { viecNhanTay = true; log('Đang giữ việc ' + giuNv.ten + ' — tiếp tục làm (không huỷ).'); }
          viecHienTai = giuNv.id; daNhanViec = true; taskBatDauAt = Date.now();
          dongDialog();
          return 'tiep_tuc';
        }
        if (giuNv && (giuNv.id === 'dai_hoi' || giuNv.id === 'chien_bang')) {
          log('Đang giữ việc ' + giuNv.ten + ' — tự huỷ (không làm Đại Hội/Tán Tu), nhận việc thường tiếp theo.');
          var okHuy = await huyViec();
          if (!okHuy) { log('Huỷ việc không được — dừng để anh xem.'); return 'giu_viec'; }
          return 'da_huy'; // huỷ xong — vòng lặp quay lại mo_menu để nhận việc mới
        }
        if (giuNv && giuNv.id === 'van_tieu') {
          log('Đang giữ việc Vận Tiêu — tool không tự huỷ (đã trả phí 400 LT). Giao xong hoặc huỷ tay rồi bật lại tool.');
          return 'giu_viec';
        }
        log('Đang giữ việc không nhận diện được (' + tenViecDangGiu() + ') — dừng để anh xem.');
        return 'giu_viec';
      }
      var dc = docDC(dlg);
      if (dc !== null) { dcHienTai = dc; if (dcLucBatDau === null) dcLucBatDau = dc; }
      var ok = bamLuaChon(/Nhận Việc Dược Công/);
      if (ok === 'disabled') { log('Hôm nay hết lượt nhận việc.'); return 'het_luot'; }
      if (!ok) { log('Không thấy mục "Nhận Việc Dược Công".'); return false; }
      await sleep(CFG.choDoiMs);
      var ds = docDialog();
      if (!ds) { log('Không mở được danh sách việc.'); return false; }
      var luot = docLuotTuDanhSach(ds);
      Object.keys(luot).forEach(function (k) { if (luot[k] !== null) luotConLai[k] = luot[k]; });
      capNhatLuotDaLam();
      var id = chonViecTotNhat();
      if (!id) { log('Hết lượt các việc thường hôm nay.'); return 'het_luot'; }
      var chon = null;
      ds.choices.forEach(function (c) {
        if (c.label === TASKS[id].ten || c.label.indexOf(TASKS[id].tenNgan) >= 0) chon = c;
      });
      if (!chon || chon.disabled) { log('Không chọn được việc ' + TASKS[id].ten + '.'); return false; }
      // Chặn cuối: không bao giờ nhận việc Đại Hội / Tán Tu / Vận Tiêu dù
      // danh sách có ghi gì (phòng trường hợp chọn nhầm từ hộp thoại).
      if (laViecCam(chon.label)) { log('Từ chối nhận việc cấm: ' + chon.label + ' — chỉ làm 5 việc thường.'); return false; }
      tap(chon.el);
      await sleep(CFG.choDoiMs);
      var xn = docDialog();
      if (!xn) { log('Không mở được hộp thoại xác nhận nhận việc.'); return false; }
      var ok2 = bamNutHanhDong(/Nhận Việc Này/);
      if (!ok2) { log('Không thấy nút "Nhận Việc Này".'); return false; }
      viecHienTai = id;
      daNhanViec = true;
      taskBatDauAt = Date.now();
      log('Đã nhận việc: ' + TASKS[id].ten + ' (' + TASKS[id].dc + ' DC, còn ' + (luotConLai[id] - 1) + '/' + 3 + ' lượt).');
      return true;
    }

    // ---------------- Làm việc (LK) ----------------
    async function lamViecHienTai() {
      var t = TASKS[viecHienTai];
      if (!t) return false;
      // Việc đã đủ điều kiện (vd nhận bằng tay rồi câu đủ 3 cá trước khi
      // bật tool) thì khỏi đi đâu nữa — về Đại Phu nộp luôn.
      if (viecDaXong()) { var td0 = docTienDo(); log('Việc đã đủ ' + td0.cur + '/' + td0.max + ' — về Đại Phu nộp.'); return true; }
      // Đi tới chỗ làm.
      var toi = await diToiMap(t.map);
      if (!toi) return 'ket';
      var p = docViTri();
      if (t.kind === 'fishing') {
        var ok = await diToi(t.x, t.y, 60);
        if (!ok) return 'ket';
        // Tương tác với mặt nước → chọn "Tự động câu".
        var nt = nutTuongTac();
        if (!nt || !nt.laTuongTac) {
          // Thử bước thêm 1-2 nhịp về phía hồ.
          await joyHuong(t.x - docViTri().x, t.y - docViTri().y, CFG.joyHoldMs);
          nt = nutTuongTac();
        }
        if (!nt || !nt.laTuongTac) { log('Không thấy nút tương tác với hồ.'); return 'ket'; }
        tap(nt.el);
        await sleep(CFG.choDoiMs);
        var chon = bamLuaChon(/Tự động câu/);
        if (!chon) { log('Không thấy lựa chọn "Tự động câu".'); return 'ket'; }
        log('Đã bật tự động câu — chờ đủ 3 cá.');
        var t0 = Date.now();
        while (on && Date.now() - t0 < CFG.taskTimeoutMs) {
          kiemTraTuVe();
          var td = docTienDo();
          if (td && td.cur >= td.max) break;
          var tr = docTracker();
          if (/3\s*\/\s*3/.test(tr)) break;
          await sleep(2000);
        }
        var stop = $('#btn-fishing-stop-touch');
        if (stop) tap(stop);
        var td2 = docTienDo();
        if (td2 && td2.cur >= td2.max) { log('Đã câu đủ ' + td2.cur + '/' + td2.max + ' cá.'); return true; }
        log('Hết giờ chờ câu cá (chưa đủ 3 cá).');
        return 'ket';
      }
      if (t.kind === 'chop' && t.id === 'duoc_moc') {
        var ok2 = await diToi(t.x, t.y, 60);
        if (!ok2) return 'ket';
        // Chặt cây rồi đi nhặt cành rơi quanh gốc.
        var t0b = Date.now();
        while (on && Date.now() - t0b < CFG.taskTimeoutMs) {
          kiemTraTuVe();
          var td3 = docTienDo();
          if (td3 && td3.cur >= td3.max) { log('Đã gom đủ ' + td3.cur + '/' + td3.max + ' Cành Khô.'); return true; }
          var nt2 = nutTuongTac();
          if (nt2 && nt2.laTuongTac) { tap(nt2.el); await sleep(2500); }
          // Đi vòng quanh gốc cây để nhặt cành rơi.
          var pp = docViTri();
          var vong = [[2, 0], [0, 2], [-2, 0], [0, -2], [2, 2], [-2, -2]];
          for (var i = 0; i < vong.length; i++) {
            if (!on) return false;
            await diToi(t.x + vong[i][0], t.y + vong[i][1], 12);
            var td4 = docTienDo();
            if (td4 && td4.cur >= td4.max) { log('Đã gom đủ ' + td4.cur + '/' + td4.max + ' Cành Khô.'); return true; }
          }
          await diToi(t.x, t.y, 20);
        }
        return 'ket';
      }
      if (t.kind === 'chop' && t.id === 'truc_gia') {
        // Chặt 4 thân Trúc Già ở các điểm cố định.
        for (var s = 0; s < t.spots.length; s++) {
          if (!on) return false;
          var td5 = docTienDo();
          if (td5 && td5.cur >= td5.max) { log('Đã chặt đủ ' + td5.cur + '/' + td5.max + ' Trúc Tâm.'); return true; }
          var ok3 = await diToi(t.spots[s][0], t.spots[s][1], 60);
          if (!ok3) continue;
          var nt3 = nutTuongTac();
          if (nt3 && nt3.laTuongTac) { tap(nt3.el); await sleep(2500); }
        }
        var td6 = docTienDo();
        if (td6 && td6.cur >= td6.max) { log('Đã chặt đủ ' + td6.cur + '/' + td6.max + ' Trúc Tâm.'); return true; }
        return 'ket';
      }
      if (t.kind === 'harvest') {
        // Hái Linh Chi: đi qua từng điểm, chỗ nào có nút Tương Tác thì hái.
        for (var s2 = 0; s2 < t.spots.length; s2++) {
          if (!on) return false;
          var td7 = docTienDo();
          if (td7 && td7.cur >= td7.max) { log('Đã hái đủ ' + td7.cur + '/' + td7.max + ' Linh Chi.'); return true; }
          var ok4 = await diToi(t.spots[s2][0], t.spots[s2][1], 40);
          if (!ok4) continue;
          var nt4 = nutTuongTac();
          if (nt4 && nt4.laTuongTac) { tap(nt4.el); await sleep(2000); }
        }
        var td8 = docTienDo();
        if (td8 && td8.cur >= td8.max) { log('Đã hái đủ ' + td8.cur + '/' + td8.max + ' Linh Chi.'); return true; }
        return 'ket';
      }
      if (t.kind === 'escort') {
        var ok5 = await diToi(t.x, t.y, 60);
        if (!ok5) return 'ket';
        var nt5 = nutTuongTac();
        if (!nt5 || !nt5.laTuongTac) { log('Không thấy Thầy Ông Nội để giao người.'); return 'ket'; }
        tap(nt5.el);
        await sleep(CFG.choDoiMs);
        // Giao xong công tự ghi — kiểm tra tracker không còn việc nữa.
        await sleep(1500);
        var tr2 = docTracker();
        if (!/Dẫn Cháu|Đưa Người/.test(tr2)) { log('Đã giao cháu cho Thầy Ông Nội.'); return 'xong_khong_can_nop'; }
        return 'ket';
      }
      return 'ket';
    }

    // ---------------- Nộp việc (LK) ----------------
    async function nopViec() {
      var dlg = await moHopThoaiDaiPhu();
      if (!dlg) { log('Không mở được hộp thoại Đại Phu để nộp.'); return false; }
      var act = dlg.action;
      if (act && /Giao Ba Cá|Giao Nguyên Liệu/.test(act.label)) {
        tap(act.el);
        await sleep(CFG.choDoiMs);
        luotDaLam++;
        if (typeof luotConLai[viecHienTai] === 'number' && luotConLai[viecHienTai] > 0) luotConLai[viecHienTai]--;
        log('Đã nộp việc ' + (TASKS[viecHienTai] ? TASKS[viecHienTai].ten : '') + ' — xong ' + luotDaLam + '/' + TONG_LUOT_NGAY + ' lượt.');
        viecNhanTay = false;
        viecHienTai = null;
        // Nộp xong game tự mở Quầy Đổi Hạt — đóng lại ngay, KHÔNG đổi gì.
        await sleep(800);
        if (dialogMo()) {
          var d2 = docDialog();
          if (d2 && /Đổi /.test(d2.text || '') || (d2 && timLuaChon(d2, /Đổi /))) dongDialog();
          else if (dialogMo()) dongDialog();
        }
        return true;
      }
      // Chưa xong việc? Kiểm tra lại tracker.
      var td = docTienDo();
      if (td && td.cur < td.max) { log('Việc chưa đủ (' + td.cur + '/' + td.max + ') — quay lại làm tiếp.'); return 'chua_xong'; }
      log('Không thấy nút nộp việc.');
      return false;
    }

    // ---------------- Huỷ việc (LK) ----------------
    async function huyViec() {
      var dlg = await moHopThoaiDaiPhu();
      if (!dlg) { log('Không mở được hộp thoại Đại Phu để huỷ việc.'); return false; }
      var ok = bamLuaChon(/Huỷ Nhiệm Vụ/);
      if (!ok) { log('Không thấy mục "Huỷ Nhiệm Vụ".'); return false; }
      await sleep(CFG.choDoiMs);
      // "Xác Nhận Huỷ" là nút LỰA CHỌN trong game thật (không phải nút hành động).
      var ok2 = bamLuaChon(/Xác Nhận Huỷ/);
      if (!ok2) ok2 = bamNutHanhDong(/Xác Nhận Huỷ/);
      if (!ok2) { log('Không thấy nút "Xác Nhận Huỷ".'); return false; }
      log('Đã huỷ việc (được hoàn lại lượt).');
      viecNhanTay = false;
      viecHienTai = null;
      return true;
    }

    // ---------------- Vòng lặp chính ----------------
    var dangChay = false;
    async function vongLap() {
      if (dangChay) return;
      dangChay = true;
      try {
        while (on) {
          if (phase === 'idle' || phase === 'cho_dai_phu') {
            // Tiếp tục việc đã nhận bằng tay (nút "TỰ ĐI LÀM VIỆC ĐÃ NHẬN"):
            // không cần qua Đại Phu trước — Luyện Khí đi thẳng tới chỗ làm,
            // Trúc Cơ thì về Đại Phu rồi bấm "Tự Đi" của game.
            if (viecNhanTay && viecHienTai && TASKS[viecHienTai]) {
              if (realm === 'truc_co') { phase = 've_nop_nop_khong'; continue; }
              phase = viecDaXong() ? 've_nop' : 'di_lam';
              continue;
            }
            if (!ganDaiPhu()) {
              if (phase !== 'cho_dai_phu') { phase = 'cho_dai_phu'; log('Chưa ở gần Đại Phu (14,8) — đưa nhân vật tới Đại Phu rồi tool sẽ tự chạy.'); }
              await sleep(2000);
              continue;
            }
            phase = 'mo_menu';
          }
          if (phase === 'mo_menu') {
            var dlg = await moHopThoaiDaiPhu();
            if (!dlg) { await sleep(2000); continue; }
            // ƯU TIÊN: xử lý việc ĐANG GIỮ (nhận bằng tay trước khi bật tool,
            // hoặc việc của tool đang làm dở) TRƯỚC khi nhận biết cảnh giới —
            // menu khi đang giữ việc có thể hiện "Tự Đi" bị khoá, không được
            // lầm là acc Luyện Khí. Quyết định theo LOẠI việc (07:23 + 07:26):
            // việc thường → TIẾP TỤC; Đại Hội / Tán Tu → TỰ HUỶ rồi nhận
            // việc thường; Vận Tiêu / việc lạ → DỪNG báo rõ (không huỷ).
            var dangGiuMenu = timLuaChon(dlg, /Huỷ Nhiệm Vụ/);
            if (dangGiuMenu) {
              var giuMm = docViecDangGiu();
              if (giuMm && TASKS[giuMm.id]) {
                if (!daNhanViec) { viecNhanTay = true; log('Đang giữ việc ' + giuMm.ten + ' — tiếp tục làm (không huỷ).'); }
                viecHienTai = giuMm.id; daNhanViec = true; taskBatDauAt = Date.now();
                var tuDiTiep = timLuaChon(dlg, /Tự Đi Làm Việc Dược Công/);
                if (tuDiTiep && !tuDiTiep.disabled) {
                  // Trúc Cơ: dùng "Tự Đi" của game để tiếp tục việc đang giữ
                  // (client: canAutoSeed() cho phép khi đang giữ việc thường).
                  if (realm !== 'truc_co') { realm = 'truc_co'; log('Nhận biết: acc Trúc Cơ — dùng "Tự Đi Làm Việc Dược Công" của game.'); }
                  var dcTiep = docDC(dlg);
                  if (dcTiep !== null) { dcHienTai = dcTiep; if (dcLucBatDau === null) dcLucBatDau = dcTiep; }
                  var okTiep = await batTuDi();
                  if (!okTiep) { await sleep(3000); phase = 'mo_menu'; continue; }
                  demTuDiLai = 0;
                  continue;
                }
                // Luyện Khí (không có "Tự Đi" mở): tool tự làm việc đang giữ.
                if (realm !== 'luyen_khi') { realm = 'luyen_khi'; log('Nhận biết: acc Luyện Khí — tự làm việc đang giữ.'); }
                datFly(true); datRun(true); datAuto(false); tuVeDangBat = false;
                dongDialog();
                phase = viecDaXong() ? 've_nop' : 'di_lam';
                continue;
              }
              if (giuMm && (giuMm.id === 'dai_hoi' || giuMm.id === 'chien_bang')) {
                log('Đang giữ việc ' + giuMm.ten + ' — tự huỷ (không làm Đại Hội/Tán Tu), nhận việc thường tiếp theo.');
                var okHuyMm = await huyViec();
                if (!okHuyMm) { log('Huỷ việc không được — dừng để anh xem.'); await ketThuc('Không huỷ được việc đang giữ.'); continue; }
                phase = 'mo_menu';
                await sleep(1500);
                continue;
              }
              if (giuMm && giuMm.id === 'van_tieu') {
                await ketThuc('Đang giữ việc Vận Tiêu — tool không tự huỷ (đã trả phí 400 LT). Giao xong hoặc huỷ tay rồi bật lại tool.');
                continue;
              }
              await ketThuc('Đang giữ việc không nhận diện được (' + tenViecDangGiu() + ') — dừng để anh xem.');
              continue;
            }
            // Không giữ việc — nhận biết cảnh giới từ menu: "Tự Đi" mở được = Trúc Cơ.
            var tuDi = timLuaChon(dlg, /Tự Đi Làm Việc Dược Công/);
            var nhanViec = timLuaChon(dlg, /Nhận Việc Dược Công/);
            if (tuDi && !tuDi.disabled) {
              if (realm !== 'truc_co') { realm = 'truc_co'; log('Nhận biết: acc Trúc Cơ — dùng "Tự Đi Làm Việc Dược Công" của game.'); }
              var dc = docDC(dlg);
              if (dc !== null) { dcHienTai = dc; if (dcLucBatDau === null) dcLucBatDau = dc; }
              var ok = await batTuDi();
              if (!ok) { await sleep(3000); phase = 'mo_menu'; continue; }
              demTuDiLai = 0;
              continue;
            }
            if (tuDi && tuDi.disabled) {
              if (realm !== 'luyen_khi') { realm = 'luyen_khi'; log('Nhận biết: acc Luyện Khí — tự nhận việc tay theo DC cao nhất.'); }
              // Luyện Khí: bật Phi Hành + Chạy, TẮT Auto.
              datFly(true); datRun(true); datAuto(false); tuVeDangBat = false;
              phase = 'nhan_viec';
              continue;
            }
            if (!tuDi && !nhanViec) {
              // Hộp thoại khác (nhiệm vụ chính...) — bấm nút hành động để qua, rồi thử lại.
              var act = dlg.action;
              if (act) { tap(act.el); await sleep(CFG.choDoiMs); }
              else { dongDialog(); await sleep(1500); }
              continue;
            }
            if (!tuDi && nhanViec) {
              // Menu có "Nhận Việc" nhưng không có "Tự Đi" — coi như Luyện Khí.
              if (realm !== 'luyen_khi') { realm = 'luyen_khi'; log('Nhận biết: acc Luyện Khí — tự nhận việc tay theo DC cao nhất.'); }
              datFly(true); datRun(true); datAuto(false); tuVeDangBat = false;
              phase = 'nhan_viec';
              continue;
            }
          }
          if (phase === 'tu_di') {
            // Theo dõi thụ động — KHÔNG chạm màn hình/joystick.
            var kq = tuDiDaDung();
            var tr = docTracker();
            var conViec = /Câu |Thu Gom|Đưa Người|Linh Chi|Trúc Tâm|Dẫn Cháu/i.test(tr);
            if (kq === 'xong') {
              log('Bộ máy báo: "Xong việc Dược Công hôm nay".');
              phase = 'kiem_tra_xong';
              continue;
            }
            if (kq && kq.indexOf('loi:') === 0) {
              log('Bộ máy dừng: ' + kq.slice(4));
              var hp = docHP();
              if (hp && hp.tiLe < CFG.hpNguyHiem) {
                log('HP thấp (' + Math.round(hp.tiLe * 100) + '%) — chờ hồi trên 60% rồi thử lại.');
                phase = 'cho_hoi';
                continue;
              }
              if (demTuDiLai < CFG.maxTuDiKhoiDongLai) {
                demTuDiLai++;
                log('Bật lại "Tự Đi" (lần ' + demTuDiLai + '/' + CFG.maxTuDiKhoiDongLai + ').');
                phase = 'mo_menu';
                await sleep(2000);
                continue;
              }
              log('Bật lại "Tự Đi" đã quá ' + CFG.maxTuDiKhoiDongLai + ' lần — dừng tool.');
              await ketThuc('Bộ máy "Tự Đi" dừng nhiều lần.');
              continue;
            }
            if (!conViec) {
              // Không còn việc đang làm mà cũng không thấy báo xong — có thể
              // bộ máy đã dừng mà caption đã ẩn. Kiểm tra lại bằng menu.
              await sleep(8000);
              if (!on) break;
              var tr2 = docTracker();
              if (!/Câu |Thu Gom|Đưa Người|Linh Chi|Trúc Tâm|Dẫn Cháu/i.test(tr2)) {
                log('Không thấy việc đang làm — kiểm tra lại lượt còn.');
                phase = 'kiem_tra_xong';
                continue;
              }
            }
            await sleep(2000);
            continue;
          }
          if (phase === 'cho_hoi') {
            var hp2 = docHP();
            if (!hp2 || hp2.tiLe >= 0.6) { phase = 'mo_menu'; continue; }
            await sleep(3000);
            continue;
          }
          if (phase === 'kiem_tra_xong') {
            var dlg2 = await moHopThoaiDaiPhu();
            if (!dlg2) { await sleep(2000); continue; }
            var ok3 = bamLuaChon(/Nhận Việc Dược Công/);
            if (ok3 && ok3 !== 'disabled') {
              await sleep(CFG.choDoiMs);
              var ds2 = docDialog();
              if (ds2) {
                var luot2 = docLuotTuDanhSach(ds2);
                Object.keys(luot2).forEach(function (k) { if (luot2[k] !== null) luotConLai[k] = luot2[k]; });
                capNhatLuotDaLam();
              }
              dongDialog();
            } else if (ok3 === 'disabled') {
              luotDaLam = TONG_LUOT_NGAY;
            }
            var con2 = tongLuotConLai();
            if (con2 === 0 || luotDaLam >= TONG_LUOT_NGAY) {
              await ketThuc('Xong dược hôm nay.');
              continue;
            }
            if (demTuDiLai < CFG.maxTuDiKhoiDongLai) {
              demTuDiLai++;
              log('Còn ' + con2 + ' lượt — bật lại "Tự Đi" (lần ' + demTuDiLai + ').');
              phase = 'mo_menu';
              await sleep(2000);
              continue;
            }
            await ketThuc('Còn lượt nhưng "Tự Đi" không chạy tiếp được.');
            continue;
          }
          if (phase === 'nhan_viec') {
            var r = await nhanViecTotNhat();
            if (r === true) { phase = 'di_lam'; continue; }
            if (r === 'tiep_tuc') { phase = viecDaXong() ? 've_nop' : 'di_lam'; continue; }
            if (r === 'het_luot') { await ketThuc('Xong dược hôm nay.'); continue; }
            if (r === 'giu_viec') { await ketThuc('Đang giữ việc khác — dừng để anh xem.'); continue; }
            await sleep(3000);
            phase = 'mo_menu';
            continue;
          }
          if (phase === 'di_lam' || phase === 'lam_viec') {
            if (Date.now() - taskBatDauAt > CFG.taskTimeoutMs) {
              log('Việc ' + (TASKS[viecHienTai] ? TASKS[viecHienTai].ten : '') + ' quá 10 phút chưa xong — huỷ, đổi việc khác.');
              demKet++;
              if (demKet >= CFG.maxKetLienTiep) { await ketThuc('Kẹt 2 lần liên tiếp — dừng tool.'); continue; }
              await huyViec();
              phase = 'mo_menu';
              await sleep(1500);
              continue;
            }
            phase = 'lam_viec';
            var kq2 = await lamViecHienTai();
            if (kq2 === true) { demKet = 0; phase = 've_nop'; continue; }
            if (kq2 === 'xong_khong_can_nop') {
              demKet = 0;
              viecNhanTay = false;
              luotDaLam++;
              if (typeof luotConLai[viecHienTai] === 'number' && luotConLai[viecHienTai] > 0) luotConLai[viecHienTai]--;
              log('Xong việc ' + (TASKS[viecHienTai] ? TASKS[viecHienTai].ten : '') + ' (công tự ghi) — xong ' + luotDaLam + '/' + TONG_LUOT_NGAY + ' lượt.');
              viecHienTai = null;
              if (luotDaLam >= TONG_LUOT_NGAY) { await ketThuc('Xong dược hôm nay.'); continue; }
              phase = 've_nop_nop_khong';
              continue;
            }
            if (kq2 === 'ket' || kq2 === false) {
              demKet++;
              // Việc nhận bằng tay đang tiếp tục: kẹt đường / không tới được
              // chỗ làm thì DỪNG báo rõ (việc vẫn còn giữ, thử lại sau) —
              // KHÔNG tự huỷ việc của anh.
              if (viecNhanTay) {
                await ketThuc('Không tới/làm được việc đang giữ (' + (TASKS[viecHienTai] ? TASKS[viecHienTai].ten : '') + ') — việc vẫn còn, anh thử lại sau khi tới gần chỗ làm.');
                continue;
              }
              log('Làm việc kẹt (lần ' + demKet + '/' + CFG.maxKetLienTiep + ') — huỷ việc, đổi việc khác.');
              if (demKet >= CFG.maxKetLienTiep) { await ketThuc('Kẹt 2 lần liên tiếp — dừng tool.'); continue; }
              await huyViec();
              phase = 'mo_menu';
              await sleep(1500);
              continue;
            }
            await sleep(1000);
            continue;
          }
          if (phase === 've_nop' || phase === 've_nop_nop_khong') {
            var ve = await diToiMap('duoc_vien');
            if (!ve) { demKet++; if (demKet >= CFG.maxKetLienTiep) { await ketThuc('Kẹt đường về Đại Phu — dừng tool.'); continue; } await sleep(2000); continue; }
            var toiDaiPhu = await diToi(DAI_PHU.x, DAI_PHU.y, 60);
            if (!toiDaiPhu) { demKet++; if (demKet >= CFG.maxKetLienTiep) { await ketThuc('Kẹt đường về Đại Phu — dừng tool.'); continue; } await sleep(2000); continue; }
            demKet = 0;
            if (phase === 've_nop_nop_khong') { phase = 'mo_menu'; continue; }
            phase = 'nop';
            continue;
          }
          if (phase === 'nop') {
            var rn = await nopViec();
            if (rn === true) {
              if (luotDaLam >= TONG_LUOT_NGAY) { await ketThuc('Xong dược hôm nay.'); continue; }
              phase = 'mo_menu';
              await sleep(1000);
              continue;
            }
            if (rn === 'chua_xong') { phase = 'lam_viec'; taskBatDauAt = Date.now(); continue; }
            await sleep(2000);
            phase = 'mo_menu';
            continue;
          }
          await sleep(500);
        }
      } catch (e) {
        log('Lỗi vòng lặp: ' + (e && e.message ? e.message : e));
        on = false;
        if (tuVeDangBat) { datAuto(false); tuVeDangBat = false; }
        renderTrangThai();
      } finally {
        dangChay = false;
        // Nếu tool được BẬT lại trong lúc vòng lặp cũ đang dừng dần thì chạy lại.
        if (on) vongLap();
      }
    }
    async function ketThuc(lyDo) {
      // Bật lại Phi Hành ngay sau khi xong dược (quy tắc đứng).
      datFly(true); datRun(true);
      if (tuVeDangBat) { datAuto(false); tuVeDangBat = false; }
      var dcSau = dcHienTai;
      var tang = (dcLucBatDau !== null && dcSau !== null) ? (dcSau - dcLucBatDau) : null;
      log('KẾT THÚC: ' + lyDo + ' Đã làm ' + luotDaLam + '/' + TONG_LUOT_NGAY + ' lượt' +
        (tang !== null ? ', DC +' + tang + ' (từ ' + dcLucBatDau + ' lên ' + dcSau + ')' : '') + '.');
      phase = 'ket_thuc';
      setOn(false);
    }

    // ---------------- Nút "TỰ ĐI LÀM VIỆC ĐÃ NHẬN" ----------------
    // Thanh nhận việc bằng tay ở Đại Phu rồi bấm nút này: tool đọc việc
    // đang giữ từ bảng nhiệm vụ (#quest-objectives), tự tìm đường tới chỗ
    // làm, làm xong thì tự về Đại Phu nộp — như luồng tự động làm dược.
    // - Việc thường: tiếp tục làm (Trúc Cơ: về Đại Phu rồi bấm "Tự Đi" của
    //   game; Luyện Khí / chưa rõ cảnh giới: lái thẳng tới chỗ làm).
    // - Đại Hội / Tán Tu: BẬT tool thường — vòng lặp sẽ tự huỷ việc đó rồi
    //   nhận việc thường tiếp theo (cần đứng gần Đại Phu để huỷ).
    // - Vận Tiêu: KHÔNG huỷ (đã trả phí 400 LT) — chỉ log báo rõ.
    // - Không giữ việc gì / việc lạ: chỉ log báo rõ, không bật tool.
    function tiepTucViecDangGiu() {
      if (on) { log('Tool đang chạy rồi — không cần bấm "TỰ ĐI LÀM VIỆC ĐÃ NHẬN".'); return; }
      var giu = docViecDangGiu();
      if (!giu) {
        log('Không thấy việc dược đang giữ (bảng nhiệm vụ trống). Nhận việc ở Đại Phu rồi bấm lại — hoặc bấm BẬT để tool tự nhận việc mới.');
        renderTrangThai();
        return;
      }
      if (giu.id === 'dai_hoi' || giu.id === 'chien_bang') {
        log('Đang giữ việc ' + giu.ten + ' — tool sẽ tự huỷ rồi nhận việc thường tiếp theo. Đưa nhân vật tới gần Đại Phu (14,8) nếu chưa tới.');
        setOn(true);
        return;
      }
      if (giu.id === 'van_tieu') {
        log('Đang giữ việc Vận Tiêu — tool không tự huỷ (đã trả phí 400 LT). Giao xong hoặc huỷ tay rồi bật lại tool.');
        renderTrangThai();
        return;
      }
      if (TASKS[giu.id]) {
        viecHienTai = giu.id; daNhanViec = true; viecNhanTay = true; taskBatDauAt = Date.now();
        if (realm === 'truc_co') {
          log('Tiếp tục việc ' + giu.ten + ' — về Đại Phu rồi bấm "Tự Đi" của game.');
        } else if (realm === 'luyen_khi') {
          log('Tiếp tục việc ' + giu.ten + ' — tự đi tới chỗ làm.');
        } else {
          log('Tiếp tục việc ' + giu.ten + ' — chưa rõ cảnh giới nên làm bằng tay (lái tới chỗ làm).');
        }
        setOn(true);
        return;
      }
      log('Việc đang giữ không nhận diện được (' + tenViecDangGiu() + ') — không tiếp tục được.');
      renderTrangThai();
    }

    // ---------------- Bật / dừng ----------------
    function setOn(v) {
      if (v === on) return;
      on = v;
      if (on) {
        phase = 'idle';
        demKet = 0; demTuDiLai = 0;
        // Reset bộ đếm ngày — lượt còn lại sẽ được đọc lại từ bảng game
        // ở lần mở menu đầu tiên (capNhatLuotDaLam khôi phục đúng số).
        luotDaLam = 0; luotConLai = {}; dcLucBatDau = null; dcHienTai = null;
        tuVeDangBat = false;
        // Tiếp tục việc nhận bằng tay (nút "TỰ ĐI LÀM VIỆC ĐÃ NHẬN" đặt
        // viecNhanTay + viecHienTai TRƯỚC khi gọi setOn) thì giữ nguyên
        // việc đó, không reset như lần BẬT thường.
        if (!viecNhanTay) { viecHienTai = null; daNhanViec = false; }
        if (viecNhanTay && viecHienTai) log('Tool BẬT — tiếp tục việc đã nhận: ' + TASKS[viecHienTai].ten + '.');
        else log('Tool BẬT — đưa nhân vật tới gần Đại Phu (14,8) nếu chưa tới.');
        vongLap();
      } else {
        viecNhanTay = false;
        if (tuVeDangBat) { datAuto(false); tuVeDangBat = false; }
        log('Tool DỪNG.');
        if (phase !== 'ket_thuc') phase = 'idle';
      }
      renderTrangThai();
    }

    // ---------------- Bảng điều khiển (gọn nhẹ, thu nhỏ được) ----------------
    var panel, panelHead, panelBody, miniBar, miniStatusEl, statusEl, turnsEl, taskEl, luotEl, logEl, toggleBtn;
    function buildPanel() {
      panel = document.createElement('div');
      panel.id = 'tt2d-duoc-panel';
      panel.style.cssText = [
        'position:fixed', 'top:10px', 'right:10px', 'z-index:999999',
        'width:248px', 'background:rgba(20,14,8,0.88)', 'color:#ffe9b0',
        'border:1px solid #8a6a2f', 'border-radius:10px', 'padding:10px 12px',
        'font:12px/1.5 system-ui, sans-serif', 'box-shadow:0 4px 18px rgba(0,0,0,0.5)',
      ].join(';');
      panel.innerHTML =
        '<div id="tt2d-duoc-head" style="display:flex;justify-content:space-between;align-items:center">' +
          '<b>🌿 Tool dược Đại Phu</b>' +
          '<span>' +
            '<button id="tt2d-duoc-min" title="Thu nhỏ bảng" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
            '<button id="tt2d-duoc-hide" title="Ẩn bảng (tool vẫn chạy nếu đang BẬT)" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 2px">×</button>' +
          '</span>' +
        '</div>' +
        '<div id="tt2d-duoc-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
          '<b>🌿 Dược</b>' +
          '<span id="tt2d-duoc-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
          '<button id="tt2d-duoc-expand" title="Mở rộng bảng" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
        '</div>' +
        '<div id="tt2d-duoc-body">' +
        '<div style="margin:8px 0;display:flex;gap:6px">' +
          '<button id="tt2d-duoc-toggle" style="flex:1;padding:6px;border-radius:6px;border:1px solid #8a6a2f;background:#3a2c12;color:#ffe9b0;cursor:pointer;font-weight:bold">BẬT</button>' +
        '</div>' +
        '<div style="margin:0 0 8px;display:flex;gap:6px">' +
          '<button id="tt2d-duoc-tiep-tuc" title="Tiếp tục việc dược đã nhận bằng tay: tự tìm đường tới chỗ làm, đủ điều kiện thì tự về Đại Phu nộp" style="flex:1;padding:6px;border-radius:6px;border:1px solid #8a6a2f;background:#2c3a12;color:#ffe9b0;cursor:pointer;font-weight:bold">TỰ ĐI LÀM VIỆC ĐÃ NHẬN</button>' +
        '</div>' +
        '<div id="tt2d-duoc-turns" style="color:#c9f2c9">Chưa bật — đưa nhân vật tới gần Đại Phu (14,8) rồi bấm BẬT.</div>' +
        '<div id="tt2d-duoc-task" style="margin:4px 0;color:#ffd27a"></div>' +
        '<div id="tt2d-duoc-luot" style="color:#c9f2c9;font-size:11px"></div>' +
        '<div id="tt2d-duoc-status" style="margin:6px 0;color:#bfe3ff"></div>' +
        '<div id="tt2d-duoc-log" style="margin-top:6px;max-height:96px;overflow:auto;color:#d8c9a3;font-size:11px"></div>' +
        '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">Chỉ bấm nút của game. Chỉ làm 5 việc thường (không Đại Hội/Vận Tiêu/Tán Tu), không mở Quầy Đổi Hạt. Đủ 15 lượt/ngày thì tự dừng.</div>' +
        '</div>';
      Tong.tabBody('duoc').appendChild(panel);

      panelHead = panel.querySelector('#tt2d-duoc-head');
      panelBody = panel.querySelector('#tt2d-duoc-body');
      miniBar = panel.querySelector('#tt2d-duoc-mini');
      miniStatusEl = panel.querySelector('#tt2d-duoc-mini-status');
      toggleBtn = panel.querySelector('#tt2d-duoc-toggle');
      statusEl = panel.querySelector('#tt2d-duoc-status');
      turnsEl = panel.querySelector('#tt2d-duoc-turns');
      taskEl = panel.querySelector('#tt2d-duoc-task');
      luotEl = panel.querySelector('#tt2d-duoc-luot');
      logEl = panel.querySelector('#tt2d-duoc-log');

      toggleBtn.addEventListener('click', function () { setOn(!on); });
      panel.querySelector('#tt2d-duoc-tiep-tuc').addEventListener('click', function () { tiepTucViecDangGiu(); });
      panel.querySelector('#tt2d-duoc-hide').addEventListener('click', function () {
        setCollapsed(true);
      });
      panel.querySelector('#tt2d-duoc-min').addEventListener('click', function () { setCollapsed(true); });
      panel.querySelector('#tt2d-duoc-expand').addEventListener('click', function () { setCollapsed(false); });
      renderTrangThai();
    }

    // Thu nhỏ / mở rộng bảng. Khi thu nhỏ chỉ còn 1 thanh (tên + trạng thái ngắn + nút ＋).
    // Mặc định mở. Tool vẫn chạy bình thường khi bảng thu nhỏ.
    function setCollapsed(v) {
      collapsed = v;
      if (panelHead) panelHead.style.display = v ? 'none' : '';
      if (panelBody) panelBody.style.display = v ? 'none' : '';
      if (miniBar) miniBar.style.display = v ? 'flex' : 'none';
      if (panel) panel.style.width = v ? '230px' : '248px';
      renderMini();
    }
    function trangThaiNgan() {
      var con = tongLuotConLai();
      return (on ? 'BẬT' : 'TẮT') + ' · ' + luotDaLam + '/15' +
        (viecHienTai ? ' · ' + TASKS[viecHienTai].tenNgan : (phase === 'tu_di' ? ' · Tự Đi' : ''));
    }
    function renderMini() {
      if (!miniStatusEl) return;
      miniStatusEl.textContent = trangThaiNgan();
    }
    function renderTrangThai() {
      if (!panel) return;
      if (toggleBtn) toggleBtn.textContent = on ? 'DỪNG' : 'BẬT';
      var realmTxt = realm === 'truc_co' ? 'Trúc Cơ (Tự Đi)' : realm === 'luyen_khi' ? 'Luyện Khí (tay)' : 'chưa rõ (mở menu Đại Phu để nhận biết)';
      if (turnsEl) {
        turnsEl.textContent = on
          ? 'Đã làm ' + luotDaLam + '/' + TONG_LUOT_NGAY + ' lượt · ' + realmTxt +
            (dcHienTai !== null ? ' · DC: ' + dcHienTai : '')
          : 'Chưa bật — đưa nhân vật tới gần Đại Phu (14,8) rồi bấm BẬT.';
      }
      if (taskEl) {
        taskEl.textContent = viecHienTai
          ? (viecNhanTay ? 'Đang tiếp tục việc đã nhận: ' : 'Đang làm: ') + TASKS[viecHienTai].ten + ' (' + TASKS[viecHienTai].dc + ' DC)'
          : (phase === 'tu_di' ? 'Đang làm: Tự Đi (game tự làm)' : '');
      }
      if (luotEl) {
        var rows = THU_TU_UU_TIEN.map(function (id) {
          var r = luotConLai[id];
          var s = (typeof r === 'number') ? (r + '/3') : '?/3';
          return TASKS[id].tenNgan + ' ' + TASKS[id].dc + 'DC: ' + s;
        });
        luotEl.textContent = 'Lượt còn: ' + rows.join(' · ');
      }
      if (statusEl) {
        var ph = {
          idle: 'Đang chờ.', cho_dai_phu: 'Chờ nhân vật tới gần Đại Phu…',
          mo_menu: 'Đang mở menu Đại Phu…', tu_di: 'Game đang tự làm dược…',
          cho_hoi: 'HP thấp — chờ hồi…', kiem_tra_xong: 'Đang kiểm tra lượt còn…',
          nhan_viec: 'Đang chọn việc tốt nhất…', di_lam: 'Đang đi tới chỗ làm…',
          lam_viec: 'Đang làm việc…', ve_nop: 'Đang về Đại Phu nộp…',
          ve_nop_nop_khong: 'Đang về Đại Phu…', nop: 'Đang nộp việc…',
          ket_thuc: 'Đã xong.',
        };
        statusEl.textContent = ph[phase] || phase;
      }
      renderMini();
    }
    function renderLog() {
      if (!logEl) return;
      logEl.innerHTML = logLines.slice(-12).map(function (l) {
        return '<div>' + l.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>';
      }).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }

    // ---------------- Debug handle ----------------
    window.__TT2D_DUOC__ = {
      _cfg: CFG,
      _debug: {
        tap: tap, datAuto: datAuto, datFly: datFly, datRun: datRun,
        autoDangBat: autoDangBat, flyDangBat: flyDangBat, runDangBat: runDangBat,
        diToi: diToi, diToiMap: diToiMap, quaCong: quaCong,
        moHopThoaiDaiPhu: moHopThoaiDaiPhu, nutTuongTac: nutTuongTac,
        docViTri: docViTri, kiemTraTuVe: kiemTraTuVe,
        docViecDangGiu: docViecDangGiu, doanViecDangLam: doanViecDangLam,
        docTienDo: docTienDo, laViecCam: laViecCam,
        tiepTucViecDangGiu: tiepTucViecDangGiu,
      },
      start: function () { setOn(true); },
      stop: function () { setOn(false); },
      setCollapsed: function (v) { setCollapsed(!!v); },
      status: function () {
        return {
          on: on, phase: phase, realm: realm,
          viecHienTai: viecHienTai, viecNhanTay: viecNhanTay,
          luotDaLam: luotDaLam, luotConLai: JSON.parse(JSON.stringify(luotConLai)),
          dcHienTai: dcHienTai, dcLucBatDau: dcLucBatDau,
          demKet: demKet, demTuDiLai: demTuDiLai, dangChay: dangChay,
          trangThai: trangThaiNgan(),
        };
      },
    };

    // ---------------- Khởi động ----------------
    buildPanel();
    setInterval(renderTrangThai, 1000);
    log('Tool dược đã nạp. Đưa nhân vật tới gần Đại Phu (14,8) rồi bấm BẬT.');
    Tong.register('duoc', window.__TT2D_DUOC__);


  })();


  // ================= MODULE: hx (Huyết Xích phụ v1.1.1: giữ Auto BẬT trong hầm, tự bấm Tương Tác khi đứng cạnh điểm thu hoạch; bấm Auto/Tương Tác bằng tap() (nút HUD chỉ bind pointerdown).) =================

  (function () {


    var CFG = {
      pollMs: 250,          // kiểm tra mỗi 250ms
      interactCooldownMs: 6000, // sau mỗi lần bấm Tương Tác, chờ 6s (kênh hái ~3s)
    };

    var FLOOR_TEN = {
      'Rừng Mãng Xà': 'Tầng 1 · Rừng Mãng Xà',
      'Lòng Đất': 'Tầng 2 · Lòng Đất',
      'Đầm Lầy': 'Tầng 3 · Đầm Lầy',
    };

    var on = false;
    var collapsed = false;
    var lastInteractAt = 0;
    var harvesting = false;      // đang trong kênh hái?
    var stats = { interact: 0, hai: 0, sealed: 0 };
    var logLines = [];

    function $(s) { return document.querySelector(s); }
    function txt(s) { var e = $(s); return e ? (e.innerText || '').trim() : ''; }
    function now() { return Date.now(); }

    function log(msg) {
      var t = new Date();
      var hh = String(t.getHours()).padStart(2, '0');
      var mm = String(t.getMinutes()).padStart(2, '0');
      var ss = String(t.getSeconds()).padStart(2, '0');
      logLines.push(hh + ':' + mm + ':' + ss + ' — ' + msg);
      if (logLines.length > 8) logLines.shift();
      render();
    }

    // ---------------- Đọc trạng thái game ----------------
    function inDungeon() {
      var hud = $('#huyet-sac-hud');
      if (hud && !hud.hidden) return true;
      var m = txt('#hud-map');
      return /Huyết Xích/.test(m);
    }
    function floorName() {
      var m = txt('#hud-map');
      if (/Mãng Xà/.test(m)) return FLOOR_TEN['Rừng Mãng Xà'];
      if (/Lòng Đất/.test(m)) return FLOOR_TEN['Lòng Đất'];
      if (/Đầm Lầy/.test(m)) return FLOOR_TEN['Đầm Lầy'];
      return m || '(chưa rõ)';
    }
    function timeLeft() {
      var hud = $('#huyet-sac-hud');
      if (hud && !hud.hidden) {
        var s = hud.querySelector('span');
        return s ? s.innerText.trim() : '';
      }
      return '';
    }
    function atkText() {
      var el = document.querySelector('#btn-attack .skill-name');
      return el ? el.textContent.trim() : '';
    }
    function atkLabel() {
      var el = $('#btn-attack');
      return el ? (el.getAttribute('aria-label') || '') : '';
    }
    // Bấm nút game bằng tap() (pointerdown+pointerup+click): nút HUD của
    // game (#btn-attack, #btn-auto-touch...) CHỈ bind "pointerdown" (helper
    // k() trong TouchUI, game.js client 24/11) — .click() là no-op (lỗi
    // Farm 07:15 25/11). #btn-auto KHÔNG có listener — ưu tiên
    // #btn-auto-touch. Game tiêu thụ cờ toggle ở frame sau nên KHÔNG kiểm
    // tra lại trạng thái ngay sau khi bấm.
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
    function autoIsOn() {
      var b1 = $('#btn-auto'), b2 = $('#btn-auto-touch');
      return !!((b1 && b1.classList.contains('active')) || (b2 && b2.classList.contains('active')));
    }
    function clickAuto() {
      var b = $('#btn-auto-touch') || $('#btn-auto');
      if (b) tap(b);
    }
    function bodyHas(s) {
      return (document.body.innerText || '').indexOf(s) >= 0;
    }

    // ---------------- Bảng tool ----------------
    var panel, elFloor, elBoss, elHai, elTime, elState, elLog, elToggle, elBody, elMini;
    function miniStatus() {
      // Trang thai ngan hien tren thanh thu nho: vd "Đang chạy · T1 · 14:32" / "TẮT" / "ngoài hầm"
      if (!on) return 'TẮT';
      if (!inDungeon()) return 'Đang chạy · ngoài hầm';
      var t = floorName();
      var tShort = /Tầng 1/.test(t) ? 'T1' : /Tầng 2/.test(t) ? 'T2' : /Tầng 3/.test(t) ? 'T3' : '—';
      var tl = timeLeft();
      return (harvesting ? 'Đang hái…' : 'Đang chạy') + ' · ' + tShort + (tl ? ' · ' + tl : '');
    }
    function applyCollapsed() {
      elBody.style.display = collapsed ? 'none' : '';
      elMini.style.display = collapsed ? '' : 'none';
      var btn = $('#tt2d-hx-collapse');
      if (btn) btn.textContent = collapsed ? '＋' : '—';
      panel.style.width = collapsed ? 'auto' : '230px';
    }
    function buildPanel() {
      panel = document.createElement('div');
      panel.id = 'tt2d-hx-panel';
      panel.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;' +
        'background:rgba(20,16,12,.92);color:#f2e3c0;border:1px solid #8a6d3b;' +
        'border-radius:8px;padding:8px 10px;font:12px/1.5 system-ui,sans-serif;' +
        'width:230px;box-shadow:0 2px 10px rgba(0,0,0,.5)';
      panel.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px">' +
          '<b style="font-size:13px;white-space:nowrap">🩸 Huyết Xích (phụ)</b>' +
          '<span id="tt2d-hx-mini" style="display:none;font-size:11px;color:#cbb87a;white-space:nowrap"></span>' +
          '<button id="tt2d-hx-collapse" style="background:none;border:1px solid #8a6d3b;color:#f2e3c0;border-radius:4px;cursor:pointer;padding:0 6px;flex-shrink:0">—</button>' +
        '</div>' +
        '<div id="tt2d-hx-body">' +
          '<div>Tầng: <span id="tt2d-hx-floor">—</span></div>' +
          '<div>Boss: <span id="tt2d-hx-boss">—</span></div>' +
          '<div>Đã hái: <span id="tt2d-hx-hai">0</span> lần</div>' +
          '<div>Còn lại: <span id="tt2d-hx-time">—</span></div>' +
          '<div>Trạng thái: <span id="tt2d-hx-state">TẮT</span></div>' +
          '<div style="margin-top:6px;display:flex;gap:6px">' +
            '<button id="tt2d-hx-toggle" style="flex:1;background:#2e7d32;color:#fff;border:0;border-radius:5px;padding:5px 0;cursor:pointer">BẬT</button>' +
            '<button id="tt2d-hx-reset" style="background:#555;color:#fff;border:0;border-radius:5px;padding:5px 8px;cursor:pointer">Đặt lại</button>' +
          '</div>' +
          '<div id="tt2d-hx-log" style="margin-top:6px;max-height:110px;overflow:auto;font-size:11px;color:#cbb87a;white-space:pre-line"></div>' +
          '<div style="margin-top:4px;font-size:10px;color:#9a8a68">Chỉ bấm nút Tương Tác + giữ Auto.<br>KHÔNG tự trả phí 100 LT, KHÔNG tự di chuyển.</div>' +
        '</div>';
      Tong.tabBody('hx').appendChild(panel);
      elFloor = $('#tt2d-hx-floor'); elBoss = $('#tt2d-hx-boss');
      elHai = $('#tt2d-hx-hai'); elTime = $('#tt2d-hx-time');
      elState = $('#tt2d-hx-state'); elLog = $('#tt2d-hx-log');
      elToggle = $('#tt2d-hx-toggle'); elBody = $('#tt2d-hx-body');
      elMini = $('#tt2d-hx-mini');
      $('#tt2d-hx-collapse').addEventListener('click', function () {
        collapsed = !collapsed;
        applyCollapsed();
        render();
      });
      elToggle.addEventListener('click', function () { on ? stop() : start(); });
      $('#tt2d-hx-reset').addEventListener('click', function () {
        stats = { interact: 0, hai: 0, sealed: 0 };
        logLines = [];
        log('Đã đặt lại số đếm.');
      });
    }

    function render() {
      if (!panel) return;
      elFloor.textContent = inDungeon() ? floorName() : 'ngoài hầm';
      var tgt = txt('#target-name');
      elBoss.textContent = tgt || '—';
      elHai.textContent = stats.hai;
      elTime.textContent = timeLeft() || '—';
      elState.textContent = on ? (harvesting ? 'Đang hái…' : 'Đang chạy') : 'TẮT';
      elToggle.textContent = on ? 'DỪNG' : 'BẬT';
      elToggle.style.background = on ? '#b3261e' : '#2e7d32';
      elLog.textContent = logLines.join('\n');
      // Trang thai ngan tren thanh thu nho — cap nhat lien tuc ke ca khi thu nho
      // (tool van chay binh thuong khi bang thu nho).
      if (elMini) elMini.textContent = miniStatus();
    }

    // ---------------- Vòng lặp chính ----------------
    function tick() {
      if (!on) { render(); return; }
      if (!inDungeon()) { render(); return; }
      // 1. Giữ Auto BẬT trong hầm
      if (autoIsOn() === false) {
        clickAuto();
        log('Đã bật lại Auto.');
      }
      // 2. Đang hái thì đứng yên — không bấm gì thêm
      if (bodyHas('Đang thu hoạch')) {
        if (!harvesting) { harvesting = true; stats.hai++; log('Đang hái (kênh ~3s)…'); }
        render();
        return;
      }
      if (harvesting) { harvesting = false; }
      if (bodyHas('Cấm chế còn phong')) {
        stats.sealed++;
        // không spam log: chỉ ghi khi vừa chuyển sang trạng thái này
        if (stats.sealed % 20 === 1) log('Cấm chế còn phong — còn quái sống, chờ Auto dọn.');
        render();
        return;
      }
      // 3. Nút Tương Tác hiện + hết cooldown -> bấm
      if (atkText() === 'Tương Tác' && now() - lastInteractAt >= CFG.interactCooldownMs) {
        var ten = atkLabel().replace('Tương tác với ', '');
        var b = $('#btn-attack');
        if (b) {
          tap(b);
          lastInteractAt = now();
          stats.interact++;
          log('Đã bấm Tương Tác: ' + (ten || '?'));
        }
      }
      render();
    }

    function start() {
      on = true;
      log('Tool phụ BẬT (chỉ trong Huyết Xích mới hoạt động).');
      render();
    }
    function stop() {
      on = false;
      log('Tool phụ DỪNG.');
      render();
    }

    function status() {
      return {
        on: on, inDungeon: inDungeon(), floor: floorName(),
        boss: txt('#target-name'), targetHp: txt('#target-hp'),
        timeLeft: timeLeft(), autoOn: autoIsOn(),
        atkText: atkText(), atkLabel: atkLabel(),
        stats: stats, harvesting: harvesting,
      };
    }

    buildPanel();
    render();
    setInterval(tick, CFG.pollMs);
    log('Tool phụ Huyết Xích đã nạp (v1.1.1). Mặc định TẮT — bấm BẬT để chạy. Bảng thu nhỏ được bằng nút —.');

    window.__TT2D_HX__ = {
      start: start, stop: stop, status: status,
      _tick: tick,  // cho smoke test bom tick bang tay
      setCollapsed: function (v) { collapsed = !!v; applyCollapsed(); render(); },
      _debug: { tap: tap, clickAuto: clickAuto, autoIsOn: autoIsOn },
    };
    Tong.register('hx', window.__TT2D_HX__);


  })();


  // ================= MODULE: vantieu (Vận Tiêu phụ v1.0.3: giữ Auto TẮT + Chạy BẬT + Phi Hành TẮT khi mang tiêu, đồng hồ 6:00; TỰ BẤM nút "Tự chạy tiêu" của game từ chuyến 2 (game tự kéo + tự nhận/giao tới hết lượt — học theo mã client: moTuChay/TUYEN/tick tự chạy); NHẬN CẢ TUYẾN 1k (Thanh chốt 13:18 25/11 "Cứ để nhận tuyến 1k": chuỗi 4–6 phí 1.000 LT/chuyến vẫn chạy tiếp vì thưởng ~1.800 LT/chuyến, chỉ dừng khi hết 6 chuyến hoặc 2 timeout liên tiếp); không tự bấm lại khi game dừng giữa chuyến. Bấm nút HUD bằng tap() (chỉ bấm #btn-auto-touch, #btn-auto không có listener).) =================

  (function () {


    var CFG = {
      pollMs: 500,
      warnSec: 60,          // con <60s thi dong ho do
      phiChuan: 400,        // phi chuan 3 chuyen dau (VanTieu.PHI); chuyen 4-6 phi 1000
      timeoutToiDa: 2,      // 2 chuyen timeout lien tiep -> DUNG chuoi (quy tac cung)
    };

    var state = {
      on: true,             // tool dang bat (giữ trạng thái + cập nhật bảng)
      collapsed: false,     // bang dang thu nho?
      carrying: false,      // dang mang tieu?
      hang: '',             // Tiêu Kỳ Trắng/Lục/Đỏ/Vàng
      han: '',              // dong ho dem nguoc (MM:SS)
      hanSec: null,
      mauXe: null,          // % mau xe
      dong: '',             // dong trang thai xe ("Xe tụt lại..." / "Cờ đỏ...")
      lastLog: [],
      // --- tu chay tieu (v1.0.2) ---
      tuChayOn: true,       // tinh nang tu chay BẬT (Thanh chot 12:49 25/11)
      tuChay: false,        // game DANG tu chay (doc tu game, khong tu doan)
      daBamTuChay: false,   // da bam nut cho chuyen dang mang nay (1 lan/chuyen)
      tuChayDungGiuaChuyen: false,  // game tu dung giua chuyen (bi danh/HP thap/...)
      lyDoDung: '',         // ly do game dung (doc tu #ritual-caption)
      dungViTimeout: false, // da dung chuoi vi 2 chuyen timeout lien tiep
      timeoutLienTiep: 0,   // so chuyen timeout lien tiep (persist theo ngay)
      hetGioChuyenNay: false, // dong ho chuyen dang mang da cham 0:00
      hetGioDem: 0,         // so nhip lien tiep thay hanSec<=0 (chong bao ao)
      chuyenDem: 0,         // so chuyen helper QUAN SAT thay xong hom nay (fallback khi khong doc duoc __ns_)
      ngay: '',             // ngay VN hien tai (de reset co theo ngay)
    };

    // --- bo dem persist theo ngay (chi la FALLBACK khi khong doc duoc __ns_; so lieu that nam o server) ---
    var LS_NGAY = 'tt2d_vantieu_ngay', LS_CHUYEN = 'tt2d_vantieu_chuyen', LS_TIMEOUT = 'tt2d_vantieu_timeout';
    function ngayVN() {
      try { return new Date(Date.now() + 252e5).toISOString().slice(0, 10); }
      catch (e) { return ''; }
    }
    function taiBoDem() {
      try {
        var ngay = ngayVN();
        if (localStorage.getItem(LS_NGAY) !== ngay) {
          localStorage.setItem(LS_NGAY, ngay);
          localStorage.setItem(LS_CHUYEN, '0');
          localStorage.setItem(LS_TIMEOUT, '0');
        }
        state.ngay = ngay;
        state.chuyenDem = parseInt(localStorage.getItem(LS_CHUYEN) || '0', 10) || 0;
        state.timeoutLienTiep = parseInt(localStorage.getItem(LS_TIMEOUT) || '0', 10) || 0;
      } catch (e) { /* localStorage khong co -> dem trong phien */ }
    }
    function luuBoDem() {
      try {
        localStorage.setItem(LS_NGAY, ngayVN());
        localStorage.setItem(LS_CHUYEN, String(state.chuyenDem));
        localStorage.setItem(LS_TIMEOUT, String(state.timeoutLienTiep));
      } catch (e) {}
    }
    function resetTheoNgay() {
      // Sang ngay moi: reset co dung chuoi + bo dem (chuyen moi tinh lai tu dau).
      if (state.ngay && state.ngay !== ngayVN()) {
        state.ngay = ngayVN();
        state.chuyenDem = 0;
        state.timeoutLienTiep = 0;
        state.dungViTimeout = false;
        luuBoDem();
        log('Sang ngày mới — reset bộ đếm chuyến/timeout, mở lại tự chạy tiêu.');
      }
    }

    function $(s) { return document.querySelector(s); }

    function log(msg) {
      var t = new Date();
      var hh = String(t.getHours()).padStart(2, '0');
      var mm = String(t.getMinutes()).padStart(2, '0');
      var ss = String(t.getSeconds()).padStart(2, '0');
      state.lastLog.unshift(hh + ':' + mm + ':' + ss + ' — ' + msg);
      if (state.lastLog.length > 4) state.lastLog.length = 4;
    }

    // Bấm nút game bằng tap() (pointerdown+pointerup+click): nút HUD của
    // game (#btn-auto-touch, #btn-run, #btn-fly) CHỈ bind "pointerdown"
    // (helper k() trong TouchUI, game.js client 24/11) — .click() là no-op
    // (lỗi Farm 07:15 25/11). #btn-auto KHÔNG có listener — mọi chỗ bấm
    // Auto chỉ dùng #btn-auto-touch (cả 2 nút cùng phản ánh 1 trạng thái
    // autoOn của game). Game tiêu thụ cờ toggle ở frame sau nên KHÔNG đọc
    // lại trạng thái ngay sau khi bấm — bấm đúng 1 lần rồi thôi.
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
    function btnState(sel) {
      var b = $(sel);
      return b ? b.classList.contains('active') : null;
    }
    function setBtn(sel, wantOn) {
      var b = $(sel);
      if (!b) return null;
      var cur = b.classList.contains('active');
      if (cur === wantOn) return cur;
      tap(b);
      return wantOn; // đã bấm 1 lần; trạng thái game đổi ở frame sau
    }

    function parseMMSS(s) {
      var m = /(\d+):(\d+)/.exec(s || '');
      return m ? (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) : null;
    }

    /* ---------------- tu chay tieu: doc dung trang thai game (client) ---------------- */
    function ns() {
      try { return window.__ns_ || null; }
      catch (e) { return null; }
    }
    function nutTuChay() {
      var hud = $('#van-tieu-hud');
      return hud ? hud.querySelector('.vt-tu') : null;
    }
    function docSoChuyen() {
      // So chuyen DA XONG hom nay — uu tien bo dem SERVER cua game:
      // Quest.flags[vanTieuVan] (client khong tu tang, chi server tang khi
      // nhan/giao). Fallback: bo dem helper quan sat duoc.
      try {
        var n = ns();
        if (n && n.VanTieu && n.Quest && n.Quest.flags) {
          var f = n.Quest.flags, day = n.VanTieu.day(Date.now());
          if (f[n.VanTieu.CO_NGAY] !== day) return 0;
          return Math.max(0, Number(f[n.VanTieu.CO_VAN]) || 0);
        }
      } catch (e) {}
      return state.chuyenDem;
    }
    function docPhiTiep() {
      // Phi chuyen SAU (VanTieu.phiNhan: <3 chuyen thi 400, tu chuyen 4 thi
      // 1000). Fallback: suy tu bo dem helper.
      try {
        var n = ns();
        if (n && n.VanTieu && n.Quest && n.Quest.flags) {
          return n.VanTieu.phiNhan(n.Quest.flags, Date.now());
        }
      } catch (e) {}
      return (docSoChuyen() < 3) ? CFG.phiChuan : 1000;
    }
    function dangTuChayGame() {
      // Trang thai that cua game: SceneWorld.dangTuChay(); fallback: nut
      // .vt-tu dang ghi "Dừng tự chạy".
      try {
        var n = ns();
        if (n && n.SceneWorld && typeof n.SceneWorld.dangTuChay === 'function') {
          return !!n.SceneWorld.dangTuChay();
        }
      } catch (e) {}
      var b = nutTuChay();
      return !!(b && !b.hidden && (b.textContent || '').indexOf('Dừng tự chạy') >= 0);
    }
    function docLyDoDung() {
      // Ly do game dung tu chay (vd "Bị đánh — dừng tự chạy tiêu") hien qua
      // caption #ritual-caption ~2,8s; poll 500ms nen doc kip.
      var c = $('#ritual-caption');
      var t = c ? (c.textContent || '').trim() : '';
      return (t.indexOf('dừng tự chạy tiêu') >= 0) ? t : '';
    }
    function dungTuChay(lyDo) {
      // Dung dung nhu nut "Dừng tự chạy" cua game: uu tien goi dung ham game
      // tuChayDung() ma nut do goi (dung khi HUD da an, khong con nut de bam
      // — vd giua 2 chuyen); neu con nut thi bam nut.
      var ok = false;
      try {
        var n = ns();
        if (n && n.SceneWorld && typeof n.SceneWorld.tuChayDung === 'function') {
          n.SceneWorld.tuChayDung(lyDo);
          ok = true;
        }
      } catch (e) {}
      if (!ok) {
        var nut = nutTuChay();
        if (nut && !nut.hidden && (nut.textContent || '').indexOf('Dừng tự chạy') >= 0) {
          tap(nut);
          ok = true;
        }
      }
      if (ok) log('Đã dừng tự chạy tiêu — ' + lyDo);
      else log('KHÔNG dừng được tự chạy tiêu (' + lyDo + ') — không thấy hàm game/nút.');
      state.tuChay = false;
      return ok;
    }
    function bamTuChay() {
      // Bam nut "Tự chạy tiêu" NGAY neu game dang cho hien nut (danh cho
      // script van_tieu_run.py goi lai sau khi xu ly xong vu dung giua
      // chuyen, hoac nguoi choi bam tay qua debug). Tra false neu khong
      // bam duoc (chuyen 1 / dang chay roi / tinh nang tat).
      if (!state.on || !state.tuChayOn || state.dungViTimeout) return false;
      var nut = nutTuChay();
      if (!nut || nut.hidden) return false;
      if ((nut.textContent || '').indexOf('Tự chạy tiêu') < 0) return false;
      tap(nut);
      state.daBamTuChay = true;
      state.tuChayDungGiuaChuyen = false;
      state.lyDoDung = '';
      log('Đã bấm "Tự chạy tiêu" (lệnh ngoài) — game tự kéo + tự giao.');
      return true;
    }
    function setTuChay(v) {
      state.tuChayOn = !!v;
      if (state.tuChayOn && state.dungViTimeout) {
        // Bật lại bằng tay = quyết định tiếp tục chuỗi: xóa cờ dừng (chuỗi
        // sẽ dừng lại ngay nếu lại 2 timeout liên tiếp — đúng quy tắc).
        state.dungViTimeout = false;
        log('Bật lại tự chạy tiêu — đã xóa cờ dừng chuỗi (timeout).');
      }
      log('Tự chạy tiêu: ' + (state.tuChayOn ? 'BẬT (từ chuyến 2 trở đi)' : 'TẮT (chỉ chạy tay)') + '.');
      render();
    }

    /* ---------------- bang dieu khien (thu nho duoc) ---------------- */
    var panel, panelBody, panelBar, collapseBtn, expandBtn, statusLine;
    var elHang, elHan, elMau, elNut, elTuChay, elLog;

    function buildPanel() {
      panel = document.createElement('div');
      panel.id = 'tt2d-vantieu-panel';
      panel.style.cssText = [
        'position:fixed', 'top:8px', 'right:8px', 'z-index:99999',
        'width:216px', 'font:12px/1.5 system-ui,sans-serif', 'color:#e8e0c8',
        'background:rgba(20,16,10,.92)', 'border:1px solid #8a6d2f',
        'border-radius:8px', 'box-shadow:0 2px 10px rgba(0,0,0,.5)',
        'user-select:none',
      ].join(';');

      // --- thanh tieu de (luon hien, ke ca khi thu nho) ---
      var head = document.createElement('div');
      head.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 8px;cursor:default;';
      var title = document.createElement('b');
      title.textContent = '🚚 Vận Tiêu';
      title.style.cssText = 'flex:1;font-size:12px;color:#ffd36a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      collapseBtn = document.createElement('button');
      collapseBtn.textContent = '—';
      collapseBtn.title = 'Thu nhỏ bảng';
      collapseBtn.style.cssText = 'width:20px;height:20px;padding:0;border:1px solid #8a6d2f;border-radius:4px;background:#2a2113;color:#ffd36a;cursor:pointer;font-size:12px;line-height:1;';
      collapseBtn.addEventListener('click', function () { setCollapsed(true); });
      head.appendChild(title);
      head.appendChild(collapseBtn);
      panel.appendChild(head);

      // --- thanh thu nho (chi hien khi collapsed): ten + trang thai ngan + nut ＋ ---
      panelBar = document.createElement('div');
      panelBar.style.cssText = 'display:none;align-items:center;gap:6px;padding:0 8px 5px;';
      statusLine = document.createElement('span');
      statusLine.style.cssText = 'flex:1;font-size:11px;color:#cfc4a0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      expandBtn = document.createElement('button');
      expandBtn.textContent = '＋';
      expandBtn.title = 'Mở lại bảng';
      expandBtn.style.cssText = 'width:20px;height:20px;padding:0;border:1px solid #8a6d2f;border-radius:4px;background:#2a2113;color:#ffd36a;cursor:pointer;font-size:12px;line-height:1;';
      expandBtn.addEventListener('click', function () { setCollapsed(false); });
      panelBar.appendChild(statusLine);
      panelBar.appendChild(expandBtn);
      panel.appendChild(panelBar);

      // --- than bang (an khi collapsed) ---
      panelBody = document.createElement('div');
      panelBody.style.cssText = 'padding:0 8px 8px;';
      function row(label) {
        var r = document.createElement('div');
        r.style.cssText = 'display:flex;justify-content:space-between;gap:6px;';
        var a = document.createElement('span');
        a.textContent = label;
        a.style.color = '#9d9172';
        var b = document.createElement('b');
        b.style.cssText = 'text-align:right;font-weight:600;';
        r.appendChild(a);
        r.appendChild(b);
        panelBody.appendChild(r);
        return b;
      }
      elHang = row('Tiêu kỳ');
      elHan = row('Còn lại');
      elMau = row('Máu xe');
      elNut = row('Auto/Chạy/Phi');
      elTuChay = row('Tự chạy tiêu');
      var logBox = document.createElement('div');
      logBox.style.cssText = 'margin-top:5px;border-top:1px solid #4a3a1c;padding-top:4px;font-size:11px;color:#b8ab84;white-space:pre-wrap;word-break:break-word;';
      elLog = logBox;
      panelBody.appendChild(logBox);

      var foot = document.createElement('div');
      foot.style.cssText = 'margin-top:5px;display:flex;gap:6px;';
      var onBtn = document.createElement('button');
      onBtn.textContent = 'BẬT';
      onBtn.style.cssText = 'flex:1;padding:3px 0;border:1px solid #8a6d2f;border-radius:4px;background:#3a2c12;color:#ffd36a;cursor:pointer;font-size:12px;';
      onBtn.addEventListener('click', function () { state.on = true; log('Tool BẬT (giữ trạng thái mang tiêu).'); render(); });
      var offBtn = document.createElement('button');
      offBtn.textContent = 'DỪNG';
      offBtn.style.cssText = 'flex:1;padding:3px 0;border:1px solid #5a4a2a;border-radius:4px;background:#241d10;color:#9d9172;cursor:pointer;font-size:12px;';
      offBtn.addEventListener('click', function () { state.on = false; log('Tool DỪNG (không giữ nút nữa).'); render(); });
      foot.appendChild(onBtn);
      foot.appendChild(offBtn);
      panelBody.appendChild(foot);
      var foot2 = document.createElement('div');
      foot2.style.cssText = 'margin-top:5px;display:flex;gap:6px;';
      var tuBtn = document.createElement('button');
      tuBtn.id = 'tt2d-vantieu-tuchay-btn';
      tuBtn.textContent = 'Tự chạy: BẬT';
      tuBtn.title = 'Bật/tắt tự bấm nút "Tự chạy tiêu" từ chuyến 2 (Thanh chốt 12:49 25/11)';
      tuBtn.style.cssText = 'flex:1;padding:3px 0;border:1px solid #8a6d2f;border-radius:4px;background:#3a2c12;color:#ffd36a;cursor:pointer;font-size:12px;';
      tuBtn.addEventListener('click', function () { setTuChay(!state.tuChayOn); });
      foot2.appendChild(tuBtn);
      panelBody.appendChild(foot2);
      panel.appendChild(panelBody);

      Tong.tabBody('vantieu').appendChild(panel);
    }

    function setCollapsed(v) {
      state.collapsed = !!v;
      if (!panel) return;
      panelBody.style.display = state.collapsed ? 'none' : 'block';
      panelBar.style.display = state.collapsed ? 'flex' : 'none';
      collapseBtn.style.display = state.collapsed ? 'none' : 'block';
      panel.style.width = state.collapsed ? '216px' : '216px';
      render();
    }

    function shortStatus() {
      if (!state.carrying) {
        if (state.dungViTimeout) return 'Dừng chuỗi (2 timeout)';
        return 'Chưa nhận tiêu';
      }
      var s = state.hang ? state.hang.replace('Tiêu Kỳ ', '') : 'Đang kéo';
      if (state.han) s += ' · ' + state.han;
      if (state.dong && state.dong.indexOf('tụt lại') >= 0) s += ' · xe tụt lại';
      if (state.tuChay) s += ' · tự chạy';
      return s;
    }

    function tuChayText() {
      if (!state.tuChayOn) return 'TẮT';
      if (state.dungViTimeout) return 'DỪNG (2 timeout)';
      if (state.tuChay) return 'ĐANG CHẠY';
      if (state.tuChayDungGiuaChuyen) return 'ĐÃ DỪNG' + (state.lyDoDung ? ' — ' + state.lyDoDung : '');
      if (state.carrying) return 'chờ chuyến 2 (chuyến ' + (docSoChuyen() + 1) + '/6)';
      return 'BẬT · chờ chuyến 2';
    }

    function render() {
      if (!panel) return;
      statusLine.textContent = shortStatus();
      if (state.collapsed) return;
      elHang.textContent = state.carrying ? (state.hang || '—') : 'Chưa nhận tiêu';
      elHan.textContent = state.carrying ? (state.han || '—') : '—';
      elHan.style.color = (state.hanSec !== null && state.hanSec < CFG.warnSec) ? '#ff6b5e' : '#e8e0c8';
      elMau.textContent = (state.mauXe === null) ? '—' : state.mauXe + '%';
      elMau.style.color = (state.mauXe !== null && state.mauXe < 30) ? '#ff6b5e' : '#e8e0c8';
      var a = btnState('#btn-auto');
      if (a === null) a = btnState('#btn-auto-touch');
      elNut.textContent = (a === null ? '?' : (a ? 'BẬT' : 'TẮT')) + ' / ' +
        (btnState('#btn-run') ? 'BẬT' : 'TẮT') + ' / ' +
        (btnState('#btn-fly') ? 'BẬT' : 'TẮT');
      elTuChay.textContent = tuChayText();
      elTuChay.style.color = state.tuChay ? '#7ddc8a' :
        (state.dungViTimeout || state.tuChayDungGiuaChuyen) ? '#ff6b5e' : '#e8e0c8';
      var tb = panel.querySelector('#tt2d-vantieu-tuchay-btn');
      if (tb) tb.textContent = 'Tự chạy: ' + (state.tuChayOn ? 'BẬT' : 'TẮT');
      elLog.textContent = state.lastLog.join('\n') || '—';
    }

    /* ---------------- vong poll ---------------- */
    function tick() {
      try {
        resetTheoNgay();
        var hud = $('#van-tieu-hud');
        var carrying = !!(hud && !hud.hidden);
        var dangChayTruoc = state.tuChay;
        state.tuChay = dangTuChayGame();
        if (carrying !== state.carrying) {
          var vuaNhan = carrying && !state.carrying;
          var vuaHet = !carrying && state.carrying;
          state.carrying = carrying;
          if (vuaNhan) {
            state.daBamTuChay = false;
            state.hetGioChuyenNay = false;
            state.hetGioDem = 0;
            state.tuChayDungGiuaChuyen = false;
            state.lyDoDung = '';
            log('Đã nhận tiêu (chuyến ' + (docSoChuyen() + 1) + '/6) — giữ Auto TẮT / Chạy BẬT / Phi Hành TẮT.');
          }
          if (vuaHet) {
            // --- 1 chuyen vua ket thuc (giao xong / het gio / bi cuop / xe vo) ---
            state.chuyenDem++;
            var cap = (function () {
              var c = $('#ritual-caption');
              return c ? (c.textContent || '').trim() : '';
            })();
            if (state.hetGioChuyenNay) {
              state.timeoutLienTiep++;
              luuBoDem();
              log('Hết giờ 6:00 — chuyến timeout (timeout liên tiếp: ' + state.timeoutLienTiep + '/' + CFG.timeoutToiDa + ').');
            } else {
              state.timeoutLienTiep = 0;
              luuBoDem();
              if (cap.indexOf('Giao hàng xong') >= 0) {
                log('Giao hàng xong (chuyến ' + docSoChuyen() + '/6 đã xong).');
              } else {
                log('Đã hết 1 chuyến (giao xong hoặc mất tiêu — xem thông báo game).');
              }
            }
            // --- DUNG CHUOI theo quy tac cung (chi khi game van dang tu chay) ---
            // Chi dung vi 2 timeout lien tiep. v1.0.3 (Thanh chot 13:18
            // 25/11 "Cu de nhan tuyen 1k"): phi chuyen sau 1.000 LT KHONG
            // dung chuoi nua — game tu nhan chuyen 4–6, thuong ~1.800 LT/
            // chuyen van lai. Het 6 chuyen thi game tu dung ("Het luot hom nay").
            if (state.tuChay) {
              if (state.timeoutLienTiep >= CFG.timeoutToiDa) {
                state.dungViTimeout = true;
                dungTuChay('2 chuyến timeout liên tiếp — dừng tự chạy tiêu.');
              }
            }
            state.daBamTuChay = false;
            state.hetGioChuyenNay = false;
            state.hetGioDem = 0;
            state.tuChayDungGiuaChuyen = false;
            state.lyDoDung = '';
          }
        }
        if (carrying) {
          var hangEl = hud.querySelector('.vt-hang');
          var hanEl = hud.querySelector('.vt-han');
          var mauEl = hud.querySelector('.vt-mau i');
          var dongEl = hud.querySelector('.vt-dong');
          state.hang = hangEl ? (hangEl.textContent || '').trim() : '';
          state.han = hanEl ? (hanEl.textContent || '').trim() : '';
          state.hanSec = parseMMSS(state.han);
          var w = mauEl ? parseFloat((mauEl.style.width || '').replace('%', '')) : NaN;
          state.mauXe = isNaN(w) ? null : Math.round(w);
          state.dong = dongEl ? (dongEl.textContent || '').trim() : '';
          if (state.dong && state.dong.indexOf('tụt lại') >= 0) {
            log('Xe tụt lại — script sẽ chờ xe kip (không kéo thêm).');
          }
          if (state.hanSec !== null && state.hanSec < CFG.warnSec && state.hanSec > 0) {
            log('Sắp hết giờ 6:00! Còn ' + state.hanSec + 's.');
          }
          // Het gio: dong ho cham 0:00 hai nhip lien tiep moi danh dau (chong
          // bao ao khi giao dung luc 0:00). Server tu ket thuc chuyen khi
          // het 6:00 — tick cua game khong kiem tra dong ho.
          if (state.hanSec !== null && state.hanSec <= 0) {
            state.hetGioDem++;
            if (state.hetGioDem >= 2) state.hetGioChuyenNay = true;
          } else {
            state.hetGioDem = 0;
          }
          // --- BAM NUT "Tu chay tieu": chi khi game cho hien nut (moTuChay
          // dung = tu chuyen 2), nut ghi "Tự chạy tiêu" (chua chay), 1
          // lan/chuyen. Chuyen 1 nut AN nen khong bao gio bam nham.
          if (state.on && state.tuChayOn && !state.dungViTimeout && !state.tuChay) {
            var nut = nutTuChay();
            if (nut && !nut.hidden && (nut.textContent || '').indexOf('Tự chạy tiêu') >= 0 && !state.daBamTuChay) {
              tap(nut);
              state.daBamTuChay = true;
              log('Đã bấm "Tự chạy tiêu" — game tự kéo xe + tự giao (chuyến ' + (docSoChuyen() + 1) + '/6).');
            }
          }
          // --- GAME TU DUNG giua chuyen (bi danh / HP <35% / xe lac / ket
          // duong...): ghi ly do, KHONG tu bam lai — cho script/nguoi choi
          // xu ly (di chuyen khoi ke danh roi goi bamTuChay()).
          if (dangChayTruoc && !state.tuChay) {
            state.tuChayDungGiuaChuyen = true;
            state.lyDoDung = docLyDoDung();
            log('Tự chạy tiêu đã DỪNG giữa chuyến' + (state.lyDoDung ? ' — ' + state.lyDoDung : '') + '. Không tự bấm lại.');
          }
          // Giữ đúng trạng thái mang tiêu — chỉ bấm khi sai trạng thái.
          // Chi bam #btn-auto-touch (cung trang thai voi #btn-auto, ma
          // #btn-auto khong co listener — bam ca 2 se toggle nguoc).
          // VAN GIU ca khi game dang tu chay: tuChayBat() KHONG tat Auto
          // chien dau (autoOn) — chi ha canh neu dang bay; helper phai
          // giu Auto TAT (neu khong Auto danh quai se giat duong cua
          // tu chay). Bam nut HUD khong tao Input.tap (listener
          // pointerdown cua game chi gan tren canvas) nen khong huy
          // tu chay.
          if (state.on) {
            setBtn('#btn-auto-touch', false);
            setBtn('#btn-run', true);
            setBtn('#btn-fly', false);
          }
        } else {
          state.hang = ''; state.han = ''; state.hanSec = null;
          state.mauXe = null; state.dong = '';
          // v1.0.3: KHONG con kiem tra phi chuyen sau o day (phi 1.000
          // khong dung chuoi nua — Thanh chot 13:18 25/11). Game tu nhan
          // chuyen sau khi con luot; het 6 chuyen thi game tu dung.
        }
      } catch (e) { /* khong lam roi game vi loi tool */ }
      render();
    }

    /* ---------------- khoi dong ---------------- */
    function boot() {
      if (document.getElementById('tt2d-vantieu-panel')) return;
      taiBoDem();
      buildPanel();
      log('Tool phụ Vận Tiêu đã nạp (v1.0.3). Mặc định BẬT, bảng MỞ.');
      log('Nhận tiêu ở Huấn Sư Huynh (Rừng Trúc) 11:00–22:00, phí 400 LT.');
      log('Tự chạy tiêu BẬT: chuyến 1 chạy tay, từ chuyến 2 game tự kéo + tự giao; nhận cả tuyến 1k (chuyến 4–6 phí 1.000 LT); chỉ dừng chuỗi khi 2 timeout liên tiếp.');
      setInterval(tick, CFG.pollMs);
      tick();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }

    window.__TT2D_VANTIEU__ = {
      start: function () { state.on = true; log('Tool BẬT (lệnh script).'); render(); },
      stop: function () { state.on = false; log('Tool DỪNG (lệnh script).'); render(); },
      setCollapsed: setCollapsed,
      setTuChay: setTuChay,
      bamTuChay: bamTuChay,
      dungTuChay: dungTuChay,
      status: function () {
        return {
          on: state.on, collapsed: state.collapsed, carrying: state.carrying,
          hang: state.hang, han: state.han, hanSec: state.hanSec,
          mauXe: state.mauXe, dong: state.dong,
          tuChayOn: state.tuChayOn, tuChay: state.tuChay,
          chuyenHomNay: docSoChuyen(), phiTiep: docPhiTiep(),
          timeoutLienTiep: state.timeoutLienTiep,
          dungViPhi: false, // giữ để tương thích (script van_tieu_run.py) — luôn false từ v1.0.3, phí 1.000 không còn dừng chuỗi
          dungViTimeout: state.dungViTimeout,
          tuChayDungGiuaChuyen: state.tuChayDungGiuaChuyen, lyDoDung: state.lyDoDung,
        };
      },
      _tick: tick,
      _debug: { tap: tap, setBtn: setBtn, btnState: btnState, bamTuChay: bamTuChay, dungTuChay: dungTuChay, docPhiTiep: docPhiTiep, docSoChuyen: docSoChuyen, nutTuChay: nutTuChay, dangTuChayGame: dangTuChayGame },
    };
    Tong.register('vantieu', window.__TT2D_VANTIEU__);


  })();


  // ================= MODULE: party (tổ đội + farm rùa, mới) =================

// ================= MODULE: TỔ ĐỘI + FARM RÙA =================
// Cơ chế đã xác minh từ client 24/11 (game.js) — xem party_farm_rua.py:
//  - Mời: Gateway.partyInvite(targetId) gửi {op:"party",act:"invite",targetId}.
//    Điều kiện: chưa cùng đội, đội < 6 người, phải đứng trong 180px (~5 ô).
//    Tìm id trong Gateway.remotes theo tên đạo hiệu; khoảng cách tính bằng
//    G.distTo(m, me) nếu có, không thì tự tính từ tọa độ (1 ô ≈ 32px).
//  - Chấp nhận: bảng #invite-hud → nút #invite-accept (hoặc #invite-decline);
//    không có nút thì gọi Gateway.partyAnswer(true).
//  - Trạng thái đội: Gateway.party = {partyId, leaderId, members:{id:{name,x,y}}};
//    Gateway.me.id là id của mình. Đội đồng bộ server (partyId + revision).
//  - Map rùa: Miếu Ông Trường Con (dong_mach_ngam, 30×26, PK tự do), 13 Thạch Quy
//    (Lv 7, HP 612), cụm Tây (6,3)(9,5)(6,7)(2,9)(2,12)(2,20)(5,22) + cụm Đông
//    (22,3)(23,6)(27,9)(27,12)(27,16)(27,19). Bảng Khu (11,22), 20 khu — Khu 12
//    chọn được. Vào: làng cổng đông (39,14) → Bãi Đá → (10,0) → MTC.
//  - QUY TẮC LẬP ĐỘI — CỨNG (Thanh 01:11 25/11): MTC là PK tự do, bên trong
//    miếu KHÔNG lập được tổ đội. Chỉ mời/chấp nhận ở làng hoặc Bãi Đá.
//    invite()/acceptInvite()/tự chấp nhận đều từ chối ('in_mtc') khi đang ở
//    trong miếu. Rớt mạng trong miếu → ra Bãi Đá thẳng cổng (15,22) nam
//    (đã xác minh live 02:26 25/11) lập lại đội rồi vô lại
//    (script party_farm_rua.py: reform_party_at_bai_da()).
//  - Tool này CHỈ quản lý tổ đội + giữ Auto farm rùa (không tự di chuyển nhân
//    vật tới MTC — dùng script party_farm_rua.py để tự đưa cả đội tới đó).
//  - Chia exp/LT khi farm chung do SERVER giữ, client không có — tool chỉ ghi
//    LT từng acc để quan sát, không khẳng định.
//  - MTC là đất PK tự do — farm có thể bị PK; tool chỉ theo dõi HP, không tự vệ
//    ngoài Auto đánh trả.
(function () {
  'use strict';

  var CFG = {
    pollMs: 500,
    inviteRangePx: 180,   // phải đứng trong 180px (~5 ô) mới mời được
    tilePx: 32,           // 1 ô ≈ 32px (dùng khi không có G.distTo)
    hpCanhBao: 0.3,       // HP dưới 30% thì cảnh báo (farm rùa)
  };

  var on = false;         // tool đang bật? (tự chấp nhận + giữ farm rùa)
  var autoAccept = true;  // tự bấm Chấp nhận khi có lời mời vào đội
  var farmRua = false;    // giữ Auto BẬT + ưu tiên Quái để farm rùa
  var collapsed = false;
  var logLines = [];
  var lastParty = { ok: false, inParty: false, members: [] };

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function gw() { return (window.__ns_ && window.__ns_.Gateway) || null; }

  function log(msg) {
    var line = new Date().toLocaleTimeString('vi-VN') + ' — ' + msg;
    logLines.unshift(line);
    if (logLines.length > 6) logLines.length = 6;
    render();
  }

  // ---------------- Đọc trạng thái đội ----------------
  function partyStatus() {
    var G = gw();
    if (!G || !G.party) return { ok: false, inParty: false, partyId: null, leaderId: null, members: [], me: null };
    var p = G.party || {};
    var me = (G.me && G.me.id) || null;
    var mems = [];
    try {
      var ms = p.members || {};
      Object.keys(ms).forEach(function (id) {
        var m = ms[id] || {};
        mems.push({ id: id, name: m.name || '', x: m.x, y: m.y });
      });
    } catch (e) { /* bỏ qua */ }
    return { ok: true, inParty: !!p.partyId, partyId: p.partyId || null, leaderId: p.leaderId || null, members: mems, me: me };
  }
  function findRemote(name) {
    var G = gw();
    if (!G) return { ok: false, why: 'no_ns' };
    var rem = G.remotes || {};
    var me = G.me || {};
    var keys = Object.keys(rem);
    for (var i = 0; i < keys.length; i++) {
      var m = rem[keys[i]];
      if (m && m.name === name) {
        var d = null;
        if (typeof G.distTo === 'function') {
          try { d = G.distTo(m, me); } catch (e) { d = null; }
        }
        if (d === null && typeof m.x === 'number' && typeof me.x === 'number') {
          var dx = (m.x - me.x) * CFG.tilePx, dy = (m.y - me.y) * CFG.tilePx;
          d = Math.round(Math.sqrt(dx * dx + dy * dy));
        }
        return { ok: true, id: keys[i], x: m.x, y: m.y, dist: d };
      }
    }
    return { ok: false, why: 'not_found' };
  }
  function invite(name) {
    name = (name || '').trim();
    if (!name) { log('Nhập tên đạo hiệu cần mời.'); return 'err'; }
    // QUY TẮC CỨNG (Thanh 01:11 25/11): Miếu Ông Trường Con là PK tự do —
    // KHÔNG lập đội được bên trong miếu. Chỉ mời ở làng hoặc Bãi Đá.
    var vt0 = docViTri();
    if (vt0.map === 'Miếu Ông Trường Con') {
      log('KHÔNG mời được: đang ở trong Miếu Ông Trường Con (PK tự do, không lập đội được) — ra Bãi Đá hoặc làng rồi hãy mời.');
      return 'in_mtc';
    }
    var rem = findRemote(name);
    if (!rem.ok) { log('Không thấy ' + name + ' ở gần (' + (rem.why || '?') + ').'); return 'err'; }
    if (rem.dist !== null && rem.dist > CFG.inviteRangePx) {
      log(name + ' ở (' + rem.x + ',' + rem.y + '), cách ' + rem.dist + 'px > 180px — đứng gần lại rồi hãy mời.');
      return 'too_far';
    }
    var G = gw();
    if (!G || typeof G.partyInvite !== 'function') { log('Gateway.partyInvite không gọi được.'); return 'err'; }
    try { G.partyInvite(rem.id); } catch (e) { log('Mời ' + name + ' lỗi: ' + (e && e.message ? e.message : e)); return 'err'; }
    log('Đã gửi lời mời cho ' + name + ' (cách ' + (rem.dist === null ? '?' : rem.dist) + 'px).');
    return 'sent';
  }
  function acceptInvite() {
    // QUY TẮC CỨNG (Thanh 01:11 25/11): KHÔNG chấp nhận lời mời khi đang ở
    // trong Miếu Ông Trường Con (PK tự do, không lập đội được) — ra Bãi Đá
    // hoặc làng rồi hãy chấp nhận. Rớt mạng trong miếu → ra Bãi Đá lập lại
    // đội rồi vô lại (script party_farm_rua.py lo việc này).
    var vt0 = docViTri();
    if (vt0.map === 'Miếu Ông Trường Con') {
      log('KHÔNG chấp nhận được: đang ở trong Miếu Ông Trường Con (PK tự do, không lập đội được) — ra Bãi Đá hoặc làng rồi hãy chấp nhận.');
      return 'in_mtc';
    }
    var hud = $('#invite-hud');
    var vis = hud && hud.offsetParent !== null;
    if (!vis) return 'none';
    var b = $('#invite-accept');
    if (b) { b.click(); log('Đã bấm Chấp nhận lời mời vào đội.'); return 'clicked'; }
    var G = gw();
    if (G && typeof G.partyAnswer === 'function') {
      try { G.partyAnswer(true); log('Đã chấp nhận lời mời (qua partyAnswer).'); return 'clicked'; } catch (e) { /* bỏ qua */ }
    }
    log('Có bảng mời nhưng không thấy nút Chấp nhận.');
    return 'no_btn';
  }
  function inviteVisible() {
    var hud = $('#invite-hud');
    return !!(hud && hud.offsetParent !== null);
  }

  // ---------------- Đọc vị trí / khu / HP (cho farm rùa) ----------------
  // ƯU TIÊN #hud-map (tên map do game hiển thị) — body.innerText bị nhiễm
  // chữ từ chính panel tool (panel Tổ đội có "Miếu Ông Trường Con"); nếu
  // #hud-map trống mới soi body.
  function docViTri() {
    var t = document.body ? (document.body.innerText || '') : '';
    var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    var map = null;
    var hm = document.querySelector('#hud-map');
    var hmt = hm ? (hm.innerText || hm.textContent || '').trim() : '';
    function nhanMap(s) {
      if (/Miếu Ông Trường Con/.test(s)) return 'Miếu Ông Trường Con';
      if (/Thảo Dược Cốc/.test(s)) return 'Thảo Dược Cốc';
      if (/Rừng Trúc/.test(s)) return 'Rừng Trúc';
      if (/Chân Núi Tản Viên/.test(s)) return 'Chân Núi Tản Viên';
      if (/Bãi Đá/.test(s)) return 'Bãi Đá Hang Gió';
      if (/Phong Địa/.test(s)) return 'Phong Địa';
      return null;
    }
    if (hmt) map = nhanMap(hmt);
    if (!map) map = nhanMap(t);
    return { x: m ? parseInt(m[1], 10) : null, y: m ? parseInt(m[2], 10) : null, map: map };
  }
  function docKhu() {
    try {
      var k = window.__ns_ && window.__ns_.KhuUI && window.__ns_.KhuUI.khu;
      return (typeof k === 'number') ? k : null;
    } catch (e) { return null; }
  }
  function docHP() {
    var el = document.querySelector('.pl-bar.hp .pl-n');
    if (!el) return null;
    var m = txt(el).match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return null;
    var cur = parseInt(m[1], 10), max = parseInt(m[2], 10);
    if (!max) return null;
    return { cur: cur, max: max, tiLe: cur / max };
  }
  // Bấm nút game bằng tap() (pointerdown+pointerup+click): nút HUD của
  // game (#btn-auto-touch, #btn-fly...) CHỈ bind "pointerdown" (helper k()
  // trong TouchUI, game.js client 24/11) — .click() là no-op (lỗi Farm
  // 07:15 25/11). #btn-auto KHÔNG có listener — ưu tiên #btn-auto-touch.
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
  function autoIsOn() {
    var b1 = $('#btn-auto'), b2 = $('#btn-auto-touch');
    return !!((b1 && b1.classList.contains('active')) || (b2 && b2.classList.contains('active')));
  }
  function damBaoAuto() {
    if (autoIsOn()) return true;
    var b = $('#btn-auto-touch') || $('#btn-auto');
    if (!b) return false;
    tap(b); // bấm đúng 1 lần; game tiêu thụ toggle ở frame sau
    return true;
  }
  function datUuTienQuai() {
    var b = document.querySelector('[data-uu-tien="quai"]');
    if (!b) return false;
    if (!b.classList.contains('on')) b.click();
    return true;
  }

  // ---------------- Bảng điều khiển (trong tab Tổ đội) ----------------
  var panel, panelBody, miniRow, miniStatusEl, elDoi, elList, elViTri, elLog, elToggle, elFarm, elAccept, elInviteName;
  function shortStatus() {
    var p = lastParty;
    if (!p.ok) return 'Chưa đọc được đội';
    if (!p.inParty) return 'Chưa vào đội';
    return 'Trong đội · ' + p.members.length + ' người' + (farmRua ? ' · farm rùa' : '');
  }
  function buildPanel() {
    var host = Tong.tabBody('party');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-party-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>\uD83D\uDC65 Tổ đội + farm rùa</b>' +
        '<button id="tt2d-party-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-party-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>\uD83D\uDC65 Tổ đội</b>' +
        '<span id="tt2d-party-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-party-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-party-body">' +
        '<div id="tt2d-party-doi" style="margin:6px 0;color:#ffd27a">Chưa đọc được đội.</div>' +
        '<div id="tt2d-party-list" style="margin:4px 0;color:#c9f2c9"></div>' +
        '<div style="margin:8px 0;display:flex;gap:6px">' +
          '<input id="tt2d-party-invite-name" placeholder="Tên đạo hiệu cần mời" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0">' +
          '<button id="tt2d-party-invite" style="padding:5px 10px;border-radius:5px;border:1px solid #8a6a2f;background:#3a2c12;color:#ffe9b0;cursor:pointer">Mời vào đội</button>' +
        '</div>' +
        '<div style="margin:4px 0;display:flex;gap:6px">' +
          '<button id="tt2d-party-accept" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Chấp nhận lời mời</button>' +
          '<button id="tt2d-party-toggle" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a2c12;color:#ffe9b0;cursor:pointer;font-weight:bold">BẬT tự chấp nhận</button>' +
        '</div>' +
        '<div style="margin:4px 0;display:flex;gap:6px">' +
          '<button id="tt2d-party-farm" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Farm rùa MTC Khu 12: TẮT</button>' +
        '</div>' +
        '<div id="tt2d-party-vitri" style="margin:4px 0;color:#bfe3ff"></div>' +
        '<div id="tt2d-party-log" style="margin-top:6px;max-height:96px;overflow:auto;color:#d8c9a3;font-size:11px"></div>' +
        '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">Mời chỉ được khi đứng trong ~5 ô (180px), đội tối đa 6 người. Farm rùa: giữ Auto BẬT + ưu tiên Quái ở Miếu Ông Trường Con Khu 12 — KHÔNG tự di chuyển tới MTC (dùng script party_farm_rua.py). MTC là đất PK tự do. <b style="color:#ffd27a">QUY TẮC: chỉ lập đội ở làng hoặc Bãi Đá — trong miếu KHÔNG lập đội được. Rớt mạng trong miếu → ra Bãi Đá lập lại đội rồi vô lại.</b></div>' +
      '</div>';
    host.appendChild(panel);
    panelBody = panel.querySelector('#tt2d-party-body');
    miniRow = panel.querySelector('#tt2d-party-mini');
    miniStatusEl = panel.querySelector('#tt2d-party-mini-status');
    elDoi = panel.querySelector('#tt2d-party-doi');
    elList = panel.querySelector('#tt2d-party-list');
    elViTri = panel.querySelector('#tt2d-party-vitri');
    elLog = panel.querySelector('#tt2d-party-log');
    elToggle = panel.querySelector('#tt2d-party-toggle');
    elFarm = panel.querySelector('#tt2d-party-farm');
    elAccept = panel.querySelector('#tt2d-party-accept');
    elInviteName = panel.querySelector('#tt2d-party-invite-name');
    panel.querySelector('#tt2d-party-collapse').addEventListener('click', function () { setCollapsed(true); });
    panel.querySelector('#tt2d-party-expand').addEventListener('click', function () { setCollapsed(false); });
    panel.querySelector('#tt2d-party-invite').addEventListener('click', function () { invite(elInviteName.value); });
    elAccept.addEventListener('click', function () { acceptInvite(); });
    elToggle.addEventListener('click', function () { setOn(!on); });
    elFarm.addEventListener('click', function () {
      farmRua = !farmRua;
      elFarm.textContent = 'Farm rùa MTC Khu 12: ' + (farmRua ? 'BẬT' : 'TẮT');
      elFarm.style.background = farmRua ? '#6b4d16' : '#2a2113';
      log(farmRua ? 'Farm rùa BẬT — giữ Auto + ưu tiên Quái ở MTC Khu 12.' : 'Farm rùa TẮT.');
      render();
    });
    render();
  }

  function setCollapsed(v) {
    collapsed = !!v;
    if (panelBody) panelBody.style.display = collapsed ? 'none' : '';
    if (miniRow) miniRow.style.display = collapsed ? 'flex' : 'none';
    render();
  }
  function render() {
    if (!panel) return;
    if (miniStatusEl) miniStatusEl.textContent = shortStatus();
    if (elToggle) {
      elToggle.textContent = on ? 'DỪNG tự chấp nhận' : 'BẬT tự chấp nhận';
      elToggle.style.background = on ? '#7a2d12' : '#3a2c12';
    }
    if (elAccept) elAccept.style.background = inviteVisible() ? '#6b4d16' : '#2a2113';
    if (elLog) {
      elLog.innerHTML = logLines.map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
    }
  }
  function renderDoi() {
    if (!elDoi || !elList) return;
    var p = lastParty;
    if (!p.ok) { elDoi.textContent = 'Chưa đọc được đội (Gateway chưa sẵn sàng).'; elList.textContent = ''; return; }
    if (!p.inParty) { elDoi.textContent = 'Chưa vào đội.'; elList.textContent = ''; return; }
    var isLeader = p.me && p.leaderId === p.me;
    elDoi.textContent = 'Trong đội · ' + p.members.length + ' người · ' + (isLeader ? 'Bạn là đội trưởng' : 'Đội trưởng: ' + (p.leaderId || '?'));
    elList.textContent = p.members.map(function (m) {
      return (m.id === p.me ? '• ' + (m.name || m.id) + ' (bạn)' : '• ' + (m.name || m.id)) +
        ((typeof m.x === 'number') ? ' (' + m.x + ',' + m.y + ')' : '');
    }).join('  ');
  }

  // ---------------- Vòng lặp chính ----------------
  function tick() {
    try {
      var p = partyStatus();
      var changed = JSON.stringify(p.members) !== JSON.stringify(lastParty.members) || p.inParty !== lastParty.inParty;
      lastParty = p;
      if (changed) renderDoi();
      // Tự chấp nhận CHỈ khi không ở trong miếu (quy tắc 01:11 25/11).
      var vtTick = docViTri();
      if (on && autoAccept && vtTick.map !== 'Miếu Ông Trường Con' && inviteVisible()) acceptInvite();
      if (farmRua) {
        damBaoAuto();
        datUuTienQuai();
        var hp = docHP();
        if (hp && hp.tiLe < CFG.hpCanhBao) log('HP thấp (' + Math.round(hp.tiLe * 100) + '%) — cẩn thận, MTC là đất PK tự do.');
      }
      var vt = docViTri();
      var khu = docKhu();
      if (elViTri) {
        elViTri.textContent = 'Vị trí: ' + (vt.map || '?') + ' ' +
          ((vt.x !== null) ? '(' + vt.x + ',' + vt.y + ')' : '') +
          (khu !== null ? ' · Khu ' + khu : '') +
          (farmRua ? ' · Auto ' + (autoIsOn() ? 'BẬT' : 'TẮT') : '');
      }
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
    render();
  }

  function setOn(v) {
    on = !!v;
    log(on ? 'Tool tổ đội BẬT (tự chấp nhận lời mời).' : 'Tool tổ đội DỪNG.');
    render();
  }
  function status() {
    var p = partyStatus();
    var vt = docViTri();
    return {
      on: on, autoAccept: autoAccept, farmRua: farmRua,
      inParty: p.inParty, partyId: p.partyId, leaderId: p.leaderId,
      members: p.members, me: p.me, inviteVisible: inviteVisible(),
      map: vt.map, x: vt.x, y: vt.y, khu: docKhu(), autoOn: autoIsOn(),
    };
  }

  buildPanel();
  setInterval(tick, CFG.pollMs);
  tick();
  log('Tool tổ đội đã nạp. Mời trong ~5 ô, đội tối đa 6 người.');

  window.__TT2D_PARTY__ = {
    start: function () { setOn(true); },
    stop: function () { setOn(false); },
    setAutoAccept: function (v) { autoAccept = !!v; },
    setFarmRua: function (v) { farmRua = !!v; },
    invite: invite,
    accept: acceptInvite,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _debug: { tap: tap, damBaoAuto: damBaoAuto, autoIsOn: autoIsOn },
  };
  Tong.register('party', window.__TT2D_PARTY__);
})();


  // ================= MODULE: nav (điều hướng chung, mới) =================

// ================= MODULE: ĐIỀU HƯỚNG CHUNG (joystick + BFS) =================
// Dùng chung cho mọi tab + hook cho script Python (boss_go.py,
// huyet_xich_run.py, fishing_go.py, van_tieu_run.py, party_farm_rua.py).
//  - readWalkable(): đọc lưới thật lúc chạy từ __ns_.SceneWorld.map
//    (w, h, blocked, id) — cùng cách fishing_go.py / van_tieu_run.py.
//  - bfsPath(grid, sx, sy, tx, ty): BFS 4 hướng; đích bị chặn thì tìm ô
//    trống gần nhất trong bán kính 2. Trả về mảng [x,y] hoặc null.
//  - joyHold/joyHuong/diToi/quaCong/diToiMap: lái joystick (client không
//    kiểm tra isTrusted — đã xác minh 0 lần xuất hiện trong game.js).
//    diToi ƯU TIÊN BFS trên lưới thật; không đọc được lưới thì dùng
//    step_toward + đi vòng khi kẹt (không đẩy dài vào cùng chỗ).
//  - Bảng cổng CONG + đường duongDi: trích từ client 24/11 (MapData.portals
//    + runtime rewire g() + portals.push) + fishing_go.py.
//  - GIỚI HẠN: ground tĩnh nhúng sẵn chỉ có 8 map (Phong Địa, Miếu Hoang,
//    Huyết Xích 3 tầng, Thảo Dược Cốc, Rừng Trúc, làng); map mới (Mỏ, Thạch
//    Phong, Long Uyên, Hang Động, Bát Quái, Thiên Đạo, Ma Động, Hắc Phong
//    Lĩnh, Hắc Thị, Bãi Đá, MTC) có ground PROCEDURAL (xây bằng art function
//    lúc load) nên KHÔNG nhúng được — BFS dùng lưới thật (readWalkable),
//    fallback là lưới mở. Map chưa có trong bảng đường thì diToiMap trả
//    về false và ghi log rõ — không đoán đường.
//
// BẢN ĐỒ ĐIỀU HƯỚNG ĐƯỢC (v1.2.0, 25/11 — mở rộng theo lệnh Thanh):
//   Làng Chân Núi Tản Viên (tan_vien) — Rừng Trúc (thanh_truc_lam) —
//   Thảo Dược Cốc (duoc_vien) — Hồ Tây (van_can) — Vườn Cá Nhân
//   (vuon_ca_nhan) — Miếu Hoang (mieu_hoang) — Phong Địa (phong_dia) —
//   Bãi Đá Hang Gió (bai_da_hang_gio) — Mỏ Linh Thạch (mo_linh_thach) —
//   Thạch Phong Thung Lũng (thach_phong_thung_lung, tên hiển thị "Thung Lũng")
//   — Bát Quái Thạch Phàn (bat_quai_thach_phan) — Thiên Đạo Khuyết
//   (thien_dao_khuyet, tên hiển thị "Chính Đảo") — Ma Động (u_uynh_vuc) —
//   Hắc Phong Lĩnh (hac_phong_linh) — Hắc Thị (hac_thi) — Long Uyên Cốc
//   (long_uyen) — Hang Động (hang_dong; id client hang_dong_co) —
//   Miếu Ông Trường Con (dong_mach_ngam) — Huyết Xích hầm (chỉ RA:
//   rung_mang_xa, mach_dat_dong, dam_lay_boss).
//   KHÔNG điều hướng được: Tam Lộ (tam_lo), Tam Ma (tam_ma) — map sự kiện
//   đóng, không có cổng bộ hành trong client; Yên Lãng Sơn (yen_lang_son)
//   — Bí Cảnh tổ đội, portals [].
//   Truyền Tống Trận (10 LT/lượt): làng (31,12) <-> Bát Quái (33,23) —
//   KHÔNG tự dùng trong nav (tool phải tự quyết, trừ khi user cho phép).
//
// NGUỒN CỔNG (client 24/11): cổng làng (39,14) -> Bãi Đá (bị g() nối lại,
//   gốc là -> Bát Quái); cổng làng (22,4) -> Động Mạch Ngầm BỊ XÓA lúc load
//   (builder filter) — KHÔNG DÙNG, chỉ vào MTC qua Bãi Đá (9/10/11,0) bắc;
//   cổng MTC (15,22) nam -> Bãi Đá (10,5) ĐÃ XÁC MINH LIVE 02:26 25/11
//   (chặng chính: đẩy joystick nam từ (15,24) là qua cổng "Ra Bãi Đá");
//   tọa độ cũ (15,25) là SAI (lệch 3 ô). Cổng MTC (18,22) nam -> làng
//   vẫn trong client portals nhưng CHƯA xác minh live — giữ làm đường
//   ra dự phòng (chỉ dùng khi cần về làng thật).
//   Tọa độ Tam Giới Thành là TƯƠNG ĐỐI theo tầng (HUD game cũng hiện tương
//   đối): bat_quai y0=21, u_uynh y0=81; chiều rộng ~100 ô.
//   Cổng Cột Khí Bổng (Bát Quái <-> Thiên Đạo) có cooldown nhóm 5 giây;
//   quaCong thử tối đa 6 lần nên tự vượt cooldown.
//   Vào Hắc Thị cần Quỷ Diện (cổng (63,10) Hắc Phong Lĩnh) — nav KHÔNG tự
//   kiểm tra vật phẩm, tool gọi phải kiểm tra trước.
(function () {
  'use strict';

  var CFG_NAV = {
    joyHoldMs: 350,
    joyLongMs: 900,
    joyWaitMs: 250,
    portalHoldMs: 700,
    portalTries: 6,
  };

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }

  // ---------------- Đọc vị trí / map ----------------
  // ƯU TIÊN #hud-map (tên map do game hiển thị) — body.innerText bị nhiễm
  // chữ từ chính panel tool (vd panel Câu cá có "Hồ Tây", panel Tổ đội có
  // "Miếu Ông Trường Con"); nếu #hud-map trống mới soi body.
  function docViTri() {
    // Tọa độ: ƯU TIÊN #hud-pos (phần tử HUD của game, luôn là vị trí thật
    // của nhân vật) — regex trên body.innerText có thể vớ phải tọa độ
    // trong chính panel tool (log cổng ghi "(2,13)"...) hoặc khung
    // chat/nhiệm vụ, làm diToi đi sai hướng rồi báo kẹt.
    var t = document.body ? (document.body.innerText || '') : '';
    var m = null;
    var hp = document.querySelector('#hud-pos');
    if (hp) {
      var hpt = hp.innerText || hp.textContent || '';
      m = hpt.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    }
    if (!m) m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    var map = null;
    var hm = document.querySelector('#hud-map');
    var hmt = hm ? (hm.innerText || hm.textContent || '').trim() : '';
    function nhanMap(s) {
      if (/Hồ Tây/.test(s)) return 'van_can';
      if (/Thảo Dược Cốc/.test(s)) return 'duoc_vien';
      if (/Rừng Trúc/.test(s)) return 'thanh_truc_lam';
      if (/Chân Núi Tản Viên/.test(s)) return 'tan_vien';
      if (/Miếu Ông Trường Con/.test(s)) return 'dong_mach_ngam';
      if (/Bãi Đá/.test(s)) return 'bai_da_hang_gio';
      if (/Miếu Hoang/.test(s)) return 'mieu_hoang';
      if (/Phong Địa/.test(s)) return 'phong_dia';
      if (/Vườn Cá Nhân/.test(s)) return 'vuon_ca_nhan';
      if (/Huyết Xích/.test(s)) return 'huyet_xich';
      if (/Long Uyên/.test(s)) return 'long_uyen';
      if (/Hang Động/.test(s)) return 'hang_dong';
      if (/Mỏ Linh Thạch/.test(s)) return 'mo_linh_thach';
      if (/Thạch Phong|Thung Lũng/.test(s)) return 'thach_phong_thung_lung';
      if (/Bát Quái|Thành Thăng Long/.test(s)) return 'bat_quai_thach_phan';
      if (/Thiên Đạo|Chính Đảo/.test(s)) return 'thien_dao_khuyet';
      if (/Ma Động/.test(s)) return 'u_uynh_vuc';
      if (/Hắc Phong Lĩnh/.test(s)) return 'hac_phong_linh';
      if (/Hắc Thị/.test(s)) return 'hac_thi';
      if (/Rừng Mãng Xà/.test(s)) return 'rung_mang_xa';
      if (/Lòng Đất/.test(s)) return 'mach_dat_dong';
      if (/Đầm Lầy/.test(s)) return 'dam_lay_boss';
      return null;
    }
    if (hmt) map = nhanMap(hmt);
    if (!map) map = nhanMap(t);
    return { x: m ? parseInt(m[1], 10) : null, y: m ? parseInt(m[2], 10) : null, map: map };
  }

  // ---------------- Lưới thật + BFS ----------------
  // blocked: mảng 2D [y][x] (true = chặn) hoặc mảng phẳng; id: map id.
  function readWalkable() {
    try {
      var sw = window.__ns_ && window.__ns_.SceneWorld;
      var mp = sw && sw.map;
      if (!mp || !mp.blocked) return null;
      var w = mp.w || mp.width, h = mp.h || mp.height;
      if (!w || !h) return null;
      return { w: w, h: h, blocked: mp.blocked, id: mp.id || null };
    } catch (e) { return null; }
  }
  function isBlocked(grid, x, y) {
    if (!grid) return true;
    if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return true;
    var b = grid.blocked;
    if (Array.isArray(b)) {
      if (Array.isArray(b[y])) return !!b[y][x];
      return !!b[y * grid.w + x];
    }
    return true;
  }
  function bfsPath(grid, sx, sy, tx, ty) {
    if (!grid) return null;
    if (sx === tx && sy === ty) return [];
    // Đích bị chặn → tìm ô trống gần nhất trong bán kính 2.
    if (isBlocked(grid, tx, ty)) {
      var found = null;
      outer:
      for (var r = 1; r <= 2; r++) {
        for (var dy = -r; dy <= r; dy++) {
          for (var dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) + Math.abs(dy) !== r) continue;
            if (!isBlocked(grid, tx + dx, ty + dy)) { found = [tx + dx, ty + dy]; break outer; }
          }
        }
      }
      if (!found) return null;
      tx = found[0]; ty = found[1];
    }
    var key = function (x, y) { return x + ',' + y; };
    var prev = {};
    var q = [[sx, sy]];
    prev[key(sx, sy)] = null;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      var cur = q.shift();
      var cx = cur[0], cy = cur[1];
      if (cx === tx && cy === ty) {
        var path = [];
        var k = key(tx, ty);
        while (k !== null) {
          var parts = k.split(',');
          path.unshift([parseInt(parts[0], 10), parseInt(parts[1], 10)]);
          k = prev[k];
        }
        path.shift(); // bỏ điểm xuất phát
        return path;
      }
      for (var i = 0; i < dirs.length; i++) {
        var nx = cx + dirs[i][0], ny = cy + dirs[i][1];
        var nk = key(nx, ny);
        if (prev.hasOwnProperty(nk)) continue;
        if (isBlocked(grid, nx, ny)) continue;
        prev[nk] = key(cx, cy);
        q.push([nx, ny]);
      }
    }
    return null; // không có đường
  }

  // ---------------- Joystick ----------------
  function joyHold(dx, dy, ms) {
    var joy = $('#joystick');
    if (!joy) return Promise.resolve(false);
    var r = joy.getBoundingClientRect();
    if (!r.width || !r.height) return Promise.resolve(false);
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var pid = 12345;
    function ev(ty, x, y) {
      return new PointerEvent(ty, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: pid, isPrimary: true });
    }
    joy.dispatchEvent(ev('pointerdown', cx, cy));
    var steps = 4;
    for (var i = 1; i <= steps; i++) {
      joy.dispatchEvent(ev('pointermove', cx + dx * i / steps, cy + dy * i / steps));
    }
    return new Promise(function (resolve) {
      setTimeout(function () {
        joy.dispatchEvent(ev('pointerup', cx + dx, cy + dy));
        setTimeout(function () { resolve(true); }, CFG_NAV.joyWaitMs);
      }, ms);
    });
  }
  function joyHuong(dx, dy, ms) {
    if (Math.abs(dx) >= Math.abs(dy)) return joyHold(dx > 0 ? 40 : -40, 0, ms);
    return joyHold(0, dy > 0 ? 40 : -40, ms);
  }

  // ---------------- Đi tới ô ----------------
  // Ưu tiên BFS trên lưới thật; không có lưới thì step_toward + đi vòng.
  async function diToi(tx, ty, maxBuoc) {
    maxBuoc = maxBuoc || 60;
    // Joystick KHÔNG lái được khi đang bay (xác minh live 12:52 25/11) —
    // hạ cánh TRƯỚC khi đẩy joystick, nếu không 60 nhịp vẫn đứng yên.
    // (Trước đây chỉ quaCong hạ cánh; diToi gọi trực tiếp — tới biển KHU,
    // điểm thiền, điểm câu — thì không, nên kẹt ngay cả khi đã ở đúng map.)
    if (flyDangBat()) { datFly(false); await sleep(500); }
    var mapBatDau = docViTri().map;
    var vong = 0; // số lần đi vòng (đổi chiều mỗi lần)
    var last = null, ket = 0;
    for (var i = 0; i < maxBuoc; i++) {
      var p = docViTri();
      if (p.x === null) { await sleep(2000); continue; }
      // Đổi map giữa chừng (vô tình bước lên ô cổng / Auto lạc qua cổng):
      // đích nằm ở map cũ nên dừng ngay — bên gọi (quaCongTai) tự nhận
      // ra đã qua cổng qua map đổi, không phí 60 nhịp đi lạc ở map mới.
      if (p.map && mapBatDau && p.map !== mapBatDau) return false;
      if (Math.abs(p.x - tx) <= 1 && Math.abs(p.y - ty) <= 1) return true;
      // Joystick không chạy khi Auto BẬT (vd nhân vật đang farm sẵn) — tắt
      // ngay từ nhịp đầu, và tắt lại nếu Auto tự bật lại giữa đường (vào combat).
      if (autoDangBat()) datAuto(false);
      // Thử BFS trên lưới thật mỗi vài nhịp (lưới có thể đổi khi quái di chuyển).
      var grid = readWalkable();
      if (grid) {
        var path = bfsPath(grid, p.x, p.y, tx, ty);
        if (path && path.length) {
          var next = path[0];
          await joyHuong(next[0] - p.x, next[1] - p.y, CFG_NAV.joyHoldMs);
          continue;
        }
      }
      // Không có lưới / không có đường BFS → step_toward + đi vòng khi kẹt.
      if (last && last.x === p.x && last.y === p.y) {
        ket++;
        if (ket >= 3) {
          if (vong >= 4) return false;
          vong++;
          var dx = tx - p.x, dy = ty - p.y;
          // Lệch vuông góc 3 ô, đổi chiều mỗi lần (không đẩy dài vào cùng chỗ).
          var sx = (vong % 2 === 1) ? 1 : -1;
          if (Math.abs(dx) >= Math.abs(dy)) await joyHold(0, sx * 40, CFG_NAV.joyHoldMs);
          else await joyHold(sx * 40, 0, CFG_NAV.joyHoldMs);
          ket = 0;
          continue;
        }
      } else ket = 0;
      last = { x: p.x, y: p.y };
      await joyHuong(tx - p.x, ty - p.y, CFG_NAV.joyHoldMs);
    }
    return false;
  }

  // ---------------- Cổng + đường giữa các map ----------------
  // CONG: từ map A tới map B — đi tới ô cổng rồi giữ joystick hướng ra ngoài.
  // byHand: cổng phải BẤM TƯƠNG TÁC (không đi xuyên được) — vd Long Uyên (22,4)
  // -> Hang Động (xác minh từ MapData.portals client 24/11: byHand:!0, slack:3).
  // CONG: từ map A tới map B — đi tới ô cổng rồi giữ joystick hướng ra ngoài.
  // byHand: cổng phải BẤM TƯƠNG TÁC (không đi xuyên được) — vd Long Uyên (22,4)
  // -> Hang Động (xác minh từ MapData.portals client 24/11: byHand:!0, slack:3).
  // Tọa độ cổng = ô portal trong client (MapData.*.portals[].tx/ty, gồm cổng
  // runtime g() nối lại + portals.push). Tọa độ Tam Giới Thành là TƯƠNG ĐỐI
  // theo tầng (bat_quai y0=21, u_uynh y0=81) — HUD game cũng hiện tương đối.
  // CỔNG ĐÃ ĐỐI CHIẾU CLIENT 24/11 + LIVE 25/11 (v1.3.7): cổng nào CHƯA
  // xác minh live thì ghi rõ trong comment, KHÔNG làm đường chính (xem
  // 'dong_mach_ngam>tan_vien' đã xóa — đường MTC->làng đi qua Bãi Đá).
  // Cổng game mở ngay khi nhân vật BƯỚC LÊN ĐÚNG Ô cổng (checkPortal trên
  // vị trí người chơi) — KHÔNG phải khi đẩy vào; 'diToi' dừng cách đích
  // ≤1 ô nên quaCong nudge thêm tới đúng ô rồi đẩy; 'fallback' là ô cổng
  // thứ hai cùng hướng (cổng đôi) khi đẩy ô chính không qua.
  var CONG = {
    // --- Trục chính: Thảo Dược Cốc — Rừng Trúc — làng — Miếu Hoang — Phong Địa ---
    'duoc_vien>thanh_truc_lam': { x: 12, y: 0, dx: 0, dy: -1 },
    'thanh_truc_lam>duoc_vien': { x: 12, y: 29, dx: 0, dy: 1 },
    'thanh_truc_lam>tan_vien': { x: 7, y: 0, dx: 0, dy: -1 },
    'tan_vien>thanh_truc_lam': { x: 7, y: 29, dx: 0, dy: 1 },
    'tan_vien>mieu_hoang': { x: 0, y: 12, dx: -1, dy: 0,
      // Cổng dự phòng (2,13) — ĐÍNH CHÍNH 08:35 25/11 (chặng net13 live):
      // (2,15) SAI — các hàng 14–16 bị cây chắn ở x=1 nên đẩy tây từ
      // (2,15) không qua được; cổng thật ở HÀNG 13, đẩy tây từ (2,13)
      // ~4s là sang Miếu Hoang (18,7). Cổng chính (0,12) theo literal
      // client (MapData.portals) CHƯA xác minh live. Nếu đẩy ở (0,12)
      // không qua được thì thử lại ở (2,13) rồi mới báo lỗi.
      fallback: { x: 2, y: 13, dx: -1, dy: 0 } },
    'mieu_hoang>tan_vien': { x: 19, y: 6, dx: 1, dy: 0 },
    // ĐÍNH CHÍNH v1.3.7 (client 24/11 + live 25/11): (1,6) là phỏng đoán
    // cũ CHƯA xác minh — cổng thật là cặp runtime portals.push (0,6) và
    // (0,7) ở mép tây Miếu Hoang, spawn Phong Địa (38,14)/(38,15); live
    // đẩy tây từ (2,7) ~4s là sang Phong Địa (38,15). Đi tới (0,7) theo
    // hàng 7 (hàng 6 bị Án Thờ (7,6) chắn đường BFS); dự phòng (0,6).
    'mieu_hoang>phong_dia': { x: 0, y: 7, dx: -1, dy: 0,
      fallback: { x: 0, y: 6, dx: -1, dy: 0 } },
    // Cổng chính (39,14) đã qua thật 00:29 25/11 sang Miếu Hoang (1,7);
    // dự phòng (39,15) — cổng đôi cùng hướng, bắt buộc qua điểm trung
    // gian (34,14) vì hàng 11–13 cột 39 là vách đá.
    'phong_dia>mieu_hoang': { x: 39, y: 14, dx: 1, dy: 0,
      fallback: { x: 39, y: 15, dx: 1, dy: 0 } },
    'duoc_vien>van_can': { x: 0, y: 20, dx: -1, dy: 0 },
    'van_can>duoc_vien': { x: 55, y: 13, dx: 1, dy: 0 },
    // --- Làng — Bãi Đá — Mỏ Linh Thạch — Thạch Phong — Bát Quái — Thiên Đạo / Ma Động ---
    'tan_vien>bai_da_hang_gio': { x: 39, y: 14, dx: 1, dy: 0 },
    // ĐÍNH CHÍNH v1.3.7 (live 25/11): (0,27) là ô portal tĩnh nhưng KHÔNG
    // phải điểm đứng — live đứng (2,28) đẩy tây ~4s là về Chân Núi
    // (37,15), qua cầu thang chéo (1,20)->(4,20)->(4,22)->(5,23)->(7,25);
    // (1,27) có thể bị cầu thang chắn nên diToi(0,27) hay kẹt. Đi tới
    // (2,28) rồi đẩy tây; dự phòng (0,27) khi đã đứng sẵn mép tây.
    'bai_da_hang_gio>tan_vien': { x: 2, y: 28, dx: -1, dy: 0,
      fallback: { x: 0, y: 27, dx: -1, dy: 0 } },
    'bai_da_hang_gio>mo_linh_thach': { x: 21, y: 10, dx: 0, dy: -1 },
    'mo_linh_thach>bai_da_hang_gio': { x: 1, y: 13, dx: -1, dy: 0 },
    'mo_linh_thach>thach_phong_thung_lung': { x: 38, y: 16, dx: 1, dy: 0 },
    'thach_phong_thung_lung>mo_linh_thach': { x: 1, y: 27, dx: -1, dy: 0 },
    'thach_phong_thung_lung>bat_quai_thach_phan': { x: 38, y: 2, dx: 1, dy: 0 },
    'bat_quai_thach_phan>thach_phong_thung_lung': { x: 0, y: 8, dx: -1, dy: 0 },
    // Cột Khí Bổng (Bát Quái <-> Thiên Đạo): cổng (45,7) là cột Trung Trục;
    // 2 cột còn lại (24,9),(74,9) là dự phòng. Cooldown nhóm 5 giây — quaCong
    // thử tối đa 6 lần nên tự vượt cooldown. Hướng đẩy theo boss_go.py (0,-1).
    'bat_quai_thach_phan>thien_dao_khuyet': { x: 45, y: 7, dx: 0, dy: -1 },
    'thien_dao_khuyet>bat_quai_thach_phan': { x: 50, y: 13, dx: 0, dy: -1 },
    // Bát Quái — Ma Động (u_uynh_vuc) — Hắc Phong Lĩnh — Hắc Thị.
    'bat_quai_thach_phan>u_uynh_vuc': { x: 40, y: 59, dx: 0, dy: 1 },
    'u_uynh_vuc>bat_quai_thach_phan': { x: 40, y: 0, dx: 0, dy: -1 },
    'u_uynh_vuc>hac_phong_linh': { x: 99, y: 6, dx: 1, dy: 0 },
    'hac_phong_linh>u_uynh_vuc': { x: 0, y: 10, dx: -1, dy: 0 },
    // Vào Hắc Thị CẦN Quỷ Diện (interactable Cửa Ngầm (61,9) ghi rõ) — nav
    // KHÔNG tự kiểm tra vật phẩm, tool gọi phải kiểm tra trước khi đi.
    'hac_phong_linh>hac_thi': { x: 63, y: 10, dx: 1, dy: 0 },
    'hac_thi>hac_phong_linh': { x: 0, y: 9, dx: -1, dy: 0 },
    // --- Rừng Trúc — Long Uyên — Hang Động ---
    'thanh_truc_lam>long_uyen': { x: 39, y: 13, dx: 1, dy: 0 },
    'long_uyen>thanh_truc_lam': { x: 0, y: 14, dx: -1, dy: 0 },
    'long_uyen>hang_dong': { x: 22, y: 4, dx: 0, dy: -1, byHand: true },
    'hang_dong>long_uyen': { x: 14, y: 19, dx: 0, dy: 1 },
    // --- Làng — Bãi Đá — Miếu Ông Trường Con (dong_mach_ngam) ---
    'bai_da_hang_gio>dong_mach_ngam': { x: 10, y: 0, dx: 0, dy: -1 },
    // Đường ra MTC ĐÃ XÁC MINH LIVE 02:26 25/11 (chặng chính): (15,22) nam
    // -> Bãi Đá (10,5) — đẩy joystick nam từ (15,24) là qua cổng "Ra Bãi Đá".
    // Tọa độ cũ (15,25) là SAI (lệch 3 ô); duongDi MTC -> Bãi Đá nay 1 cổng
    // trực tiếp, không cần vòng qua làng.
    'dong_mach_ngam>bai_da_hang_gio': { x: 15, y: 22, dx: 0, dy: 1 },
    // Đường MTC -> làng ĐÃ XÓA v1.3.7: cổng (18,22) nam -> làng (22,6)
    // có trong client portals nhưng CHƯA xác minh live — BFS đường ngắn
    // nhất cứ chọn nó làm đường CHÍNH nên nó không còn là "dự phòng" nữa.
    // Đường ra làng đã xác minh: (15,22) nam -> Bãi Đá (10,5), rồi
    // (2,28) tây -> làng (37,15) — duongDi tự tìm 2 chặng này.
    // --- Huyết Xích hầm: chỉ RA được (vào bằng đăng ký NPC), không đi VÀO
    // bằng đường bộ — duongDi chặn cạnh vào hầm từ ngoài (xem DUNGEON).
    'rung_mang_xa>tan_vien': { x: 18, y: 29, dx: 0, dy: 1 },
    'rung_mang_xa>mach_dat_dong': { x: 18, y: 0, dx: 0, dy: -1 },
    'mach_dat_dong>rung_mang_xa': { x: 20, y: 29, dx: 0, dy: 1 },
    'mach_dat_dong>dam_lay_boss': { x: 39, y: 14, dx: 1, dy: 0 },
    'dam_lay_boss>mach_dat_dong': { x: 0, y: 14, dx: -1, dy: 0 },
  };
  // Map hầm Huyết Xích: chỉ RA được (vào bằng đăng ký NPC), không tự đi VÀO
  // từ ngoài. duongDi chặn mọi cạnh dẫn VÀO hầm khi đang ở ngoài hầm.
  var DUNGEON = ['rung_mang_xa', 'mach_dat_dong', 'dam_lay_boss'];
  // Tìm đường qua nhiều map bằng BFS trên đồ thị cổng (CONG). Trả về mảng
  // [{map, cong}] (ít cổng nhất) hoặc [] (cùng map) hoặc null (không có đường
  // — không đoán). Thay cho chuỗi if viết tay trước đây (v1.1.0): cùng kết quả
  // cho các đường cũ, cộng thêm mọi map mới trong CONG.
  function duongDi(tuMap, toiMap) {
    if (tuMap === toiMap) return [];
    var ke = {};
    Object.keys(CONG).forEach(function (k) {
      var parts = k.split('>');
      var a = parts[0], b = parts[1];
      if (DUNGEON.indexOf(b) >= 0 && DUNGEON.indexOf(a) < 0) return; // không vào hầm từ ngoài
      (ke[a] = ke[a] || []).push({ to: b, cong: k });
    });
    var prev = {};
    prev[tuMap] = null;
    var q = [tuMap];
    while (q.length) {
      var cur = q.shift();
      if (cur === toiMap) break;
      (ke[cur] || []).forEach(function (e) {
        if (!prev.hasOwnProperty(e.to)) { prev[e.to] = { from: cur, cong: e.cong }; q.push(e.to); }
      });
    }
    if (!prev.hasOwnProperty(toiMap)) return null;
    var buoc = [];
    var cur2 = toiMap;
    while (cur2 !== tuMap) {
      var p = prev[cur2];
      buoc.unshift({ map: cur2, cong: p.cong });
      cur2 = p.from;
    }
    return buoc;
  }
  // ---------------- Bấm nút game: tap() thay .click() ----------------
  // Nút HUD của game (#btn-attack, #btn-fly, #btn-auto-touch, #btn-target,
  // #btn-run, #btn-meditate-touch, #btn-fishing-stop-touch) CHỈ bind
  // "pointerdown" (helper k() trong TouchUI, game.js client 24/11) — JS
  // .click() lên chúng là no-op (lỗi Farm "bật auto không di chuyển được"
  // 07:15 25/11: datAuto .click() không tắt được Auto nên joystick đứng
  // yên). tap() phát cả 3 sự kiện pointerdown+pointerup+click nên bấm
  // được cả nút HUD lẫn nút hộp thoại (.btn-choice, #dialog-action...
  // bind click). Mỗi nút game chỉ bind 1 loại sự kiện nên không bấm đúp.
  // #btn-auto KHÔNG có listener nào (chỉ #btn-auto-touch có) — mọi chỗ
  // bấm Auto phải ưu tiên #btn-auto-touch. Game tiêu thụ cờ toggle ở
  // frame sau (Input.consumeAutoToggle/consumeFlyToggle) nên KHÔNG kiểm
  // tra lại trạng thái ngay sau khi bấm (đọc trạng thái cũ rồi bấm lần 2
  // = toggle ngược) — bấm đúng 1 lần rồi thôi.
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
  function nutAuto() { return $('#btn-auto-touch') || $('#btn-auto'); }
  // Đang bay hay không: đọc TRẠNG THÁI THẬT của game
  // (SceneWorld.player.flying) TRƯỚC, nút #btn-fly chỉ là dự phòng.
  // Phát hiện live 12:54 25/11: class "active" của nút Phi Hành KHÔNG
  // phản ánh đúng (luôn báo false) trong khi nhân vật đang bay trên kiếm
  // — đọc nút thì quaCong tưởng đã hạ cánh nên không hạ cánh thật, đẩy
  // joystick khi đang bay thì nhân vật không đi (joystick không lái được
  // khi bay, xác minh live 12:52 25/11) nên cổng không qua được. Client
  // cũng chỉ dùng player.flying để toggle class nút (hàm O() trong HUD),
  // nên đọc thẳng player.flying là đúng nhất.
  function flyDangBat() {
    try {
      var p = window.__ns_ && window.__ns_.SceneWorld && window.__ns_.SceneWorld.player;
      if (p && typeof p.flying === 'boolean') return p.flying;
    } catch (e) { /* fallback nút */ }
    var b = $('#btn-fly');
    return !!(b && b.classList.contains('active'));
  }
  function datFly(bat) {
    bat = !!bat;
    if (flyDangBat() === bat) return true;
    var b = $('#btn-fly');
    if (!b) return false;
    tap(b);
    return true; // đã bấm 1 lần; trạng thái game đổi ở frame sau
  }
  function autoDangBat() {
    var b1 = $('#btn-auto'), b2 = $('#btn-auto-touch');
    return !!((b1 && b1.classList.contains('active')) || (b2 && b2.classList.contains('active')));
  }
  // Tắt/bật Auto: bấm đúng 1 lần qua tap() vào #btn-auto-touch, KHÔNG
  // kiểm tra lại ngay sau khi bấm (xem chú thích tap() ở trên). Joystick
  // KHÔNG di chuyển được khi Auto BẬT nên mọi hàm di chuyển
  // (diToi/quaCong/diToiMap) đều tắt Auto trước khi đẩy joystick.
  function datAuto(bat) {
    bat = !!bat;
    if (autoDangBat() === bat) return true;
    var b = nutAuto();
    if (!b) return false;
    tap(b);
    return true; // đã bấm 1 lần; trạng thái game đổi ở frame sau
  }
  // ---------------- Chẩn đoán qua cổng ----------------
  // lastGateFail: lần quaCong gần nhất thất bại ở đâu —
  // { cong, gateX, gateY, stage: 'di-toi'|'day-cong'|'by-hand',
  //   thu: 'chinh'|'du-phong', fly, auto } (fly/auto = trạng thái lúc lỗi).
  // gateSteps: từng bước quaCong gần nhất (Farm ghi vào log để chẩn đoán).
  // lastRouteFail: lần diToiMap gần nhất thất bại ở đâu —
  // { stage: 'khong-co-duong'|'qua-cong'|'map-khong-doi', from, to,
  //   cong, gate: { x, y, stage, thu }, fly, auto }.
  var lastGateFail = null;
  var gateSteps = [];
  var lastRouteFail = null;
  function gateLog(s) { gateSteps.push(s); }

  async function quaCong(congKey) {
    var c = CONG[congKey];
    if (!c) return false;
    lastGateFail = null;
    gateSteps = [];
    // Đang bay thì KHÔNG qua được cổng — hạ cánh TRƯỚC khi đẩy joystick.
    // (Vụ 07:29 25/11: datFly cũ dùng .click() là no-op nên Phi Hành vẫn
    // BẬT, nhân vật bay thì đẩy cổng mãi không qua, Farm báo nhầm thành
    // "không có đường". datFly nay dùng tap() nên hạ cánh thật.)
    if (flyDangBat()) { datFly(false); gateLog('Hạ cánh trước cổng ' + congKey + ' (Phi Hành đang BẬT).'); }
    await sleep(400);
    // Cổng chính rồi cổng dự phòng (nếu có) — vd tan_vien>mieu_hoang:
    // (0,12) theo literal client CHƯA xác minh live, (2,13) xác minh
    // live 08:35 25/11 (chặng net13 đẩy tây từ (2,13) ~4s qua được).
    var thu = [{ x: c.x, y: c.y, dx: c.dx, dy: c.dy, ten: 'chinh' }];
    if (c.fallback) thu.push({ x: c.fallback.x, y: c.fallback.y, dx: c.fallback.dx, dy: c.fallback.dy, ten: 'du_phong' });
    for (var t = 0; t < thu.length; t++) {
      var g = thu[t];
      gateLog('Thử cổng ' + congKey + ' (' + g.ten + '): ô (' + g.x + ',' + g.y + '), đẩy (' + g.dx + ',' + g.dy + ').');
      var ok = await quaCongTai(congKey, g, c);
      if (ok) { gateLog('Qua cổng ' + congKey + ' thành công (' + g.ten + ' ' + g.x + ',' + g.y + ').'); return true; }
    }
    gateLog('Không qua được cổng ' + congKey + ' sau ' + thu.length + ' vị trí thử.');
    return false;
  }
  // Đẩy 1 cổng tại 1 vị trí: đi tới ô cổng rồi đẩy (hoặc bấm tương tác
  // nếu byHand). Trả true nếu sang map mới, false + ghi lastGateFail.
  async function quaCongTai(congKey, g, c) {
    // Ghi map TRƯỚC khi di chuyển — cổng của game mở ngay khi nhân vật
    // BƯỚC LÊN ô cổng (checkPortal trên vị trí người chơi, game.js), nên
    // map có thể đã đổi NGAY TRONG lúc diToi/nudge (đẩy joystick vượt
    // 1 ô sang ô cổng). Bản cũ ghi mapCu SAU nudge nên so sánh "map đổi"
    // với map MỚI — không bao giờ thấy đổi, báo nhầm "đẩy cổng không qua"
    // trong khi nhân vật đã sang map bên kia (vụ Thanh báo 13:29 25/11:
    // chọn farm mà không tự đi qua map được).
    var mapBatDau = docViTri().map;
    function daQuaCong() {
      var pm = docViTri().map;
      return !!(pm && mapBatDau && pm !== mapBatDau);
    }
    var ok = await diToi(g.x, g.y, 60);
    if (daQuaCong()) { gateLog('Đã qua cổng ' + congKey + ' ngay lúc đi tới ô cổng (map đổi ' + mapBatDau + ' -> ' + docViTri().map + ').'); return true; }
    if (!ok) {
      lastGateFail = { cong: congKey, gateX: g.x, gateY: g.y, stage: 'di-toi', thu: g.ten, fly: flyDangBat(), auto: autoDangBat() };
      gateLog('Không tới được ô cổng (' + g.x + ',' + g.y + ') — nhân vật kẹt ở đâu đó.');
      return false;
    }
    // diToi dừng khi còn cách đích ≤1 ô — với cổng, lệch 1 ô là đẩy sai
    // hàng (vd dừng ở (1,12) rồi đẩy tây dọc hàng 12 trong khi cổng thật
    // ở hàng 13, như vụ fallback (2,13) sau khi đính chính 25/11). Nudge
    // thêm tối đa 4 nhịp tới đúng ô cổng rồi mới đẩy; ô không đứng được
    // thì nudge không tới nơi nhưng vẫn đẩy như cũ, không kẹt.
    for (var n = 0; n < 4; n++) {
      var pn = docViTri();
      if (pn.x === g.x && pn.y === g.y) break;
      if (pn.x === null) break;
      await joyHuong(g.x - pn.x, g.y - pn.y, CFG_NAV.joyHoldMs);
      // Nudge cũng có thể bước lên ô cổng -> map đổi -> qua cổng rồi.
      if (daQuaCong()) { gateLog('Đã qua cổng ' + congKey + ' lúc nudge tới ô cổng (map đổi ' + mapBatDau + ' -> ' + docViTri().map + ').'); return true; }
    }
    var mapCu = docViTri().map;
    gateLog('Đã tới ô cổng (' + g.x + ',' + g.y + '), map hiện tại: ' + (mapCu || '?') + '.');
    // Cổng byHand (vd Long Uyên (22,4) -> Hang Động): không đi xuyên được,
    // phải BẤM TƯƠNG TÁC tại ô cổng (phím E/Enter hoặc nút Tương Tác).
    if (c.byHand) {
      for (var j = 0; j < CFG_NAV.portalTries; j++) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
        await sleep(600);
        var p0 = docViTri();
        if (p0.map && p0.map !== mapCu) return true;
        var b = document.querySelector('#btn-attack');
        if (b) { tap(b); await sleep(600); }
        var p1 = docViTri();
        if (p1.map && p1.map !== mapCu) return true;
      }
      lastGateFail = { cong: congKey, gateX: g.x, gateY: g.y, stage: 'by-hand', thu: g.ten, fly: flyDangBat(), auto: autoDangBat() };
      gateLog('Bấm tương tác ' + CFG_NAV.portalTries + ' lần ở (' + g.x + ',' + g.y + ') vẫn không qua cổng.');
      return false;
    }
    for (var i = 0; i < CFG_NAV.portalTries; i++) {
      if (autoDangBat()) datAuto(false); // đẩy cổng cũng cần Auto TẮT
      await joyHold(g.dx * 40, g.dy * 40, CFG_NAV.portalHoldMs);
      var p = docViTri();
      if (p.map && p.map !== mapCu) return true;
    }
    lastGateFail = { cong: congKey, gateX: g.x, gateY: g.y, stage: 'day-cong', thu: g.ten, fly: flyDangBat(), auto: autoDangBat() };
    gateLog('Đẩy cổng ' + CFG_NAV.portalTries + ' lần ở (' + g.x + ',' + g.y + ') vẫn không qua (Phi Hành ' + (flyDangBat() ? 'BẬT' : 'TẮT') + ', Auto ' + (autoDangBat() ? 'BẬT' : 'TẮT') + ').');
    return false;
  }
  async function diToiMap(toiMap) {
    lastRouteFail = null;
    if (autoDangBat()) datAuto(false); // xem diToi — Auto BẬT thì joystick đứng yên
    if (flyDangBat()) { datFly(false); await sleep(500); } // đang bay thì joystick không lái được (xem diToi)
    var p = docViTri();
    if (p.map === toiMap) return true;
    var duong = duongDi(p.map, toiMap);
    if (!duong) {
      lastRouteFail = { stage: 'khong-co-duong', from: p.map, to: toiMap };
      return false;
    }
    for (var i = 0; i < duong.length; i++) {
      var ok = await quaCong(duong[i].cong);
      if (!ok) {
        var gf = lastGateFail;
        lastRouteFail = { stage: 'qua-cong', cong: duong[i].cong, from: p.map, to: toiMap,
          gate: gf ? { x: gf.gateX, y: gf.gateY, stage: gf.stage, thu: gf.thu } : null,
          fly: gf ? gf.fly : flyDangBat(), auto: gf ? gf.auto : autoDangBat() };
        return false;
      }
      await sleep(800);
    }
    if (docViTri().map === toiMap) return true;
    lastRouteFail = { stage: 'map-khong-doi', from: p.map, to: toiMap };
    return false;
  }

  var navApi = {
    docViTri: docViTri,
    readWalkable: readWalkable,
    bfsPath: bfsPath,
    joyHold: joyHold,
    joyHuong: joyHuong,
    diToi: diToi,
    quaCong: quaCong,
    diToiMap: diToiMap,
    duongDi: duongDi,
    autoDangBat: autoDangBat,
    datAuto: datAuto,
    flyDangBat: flyDangBat,
    datFly: datFly,
    tap: tap,
    lastGateFail: function () { return lastGateFail; },
    lastGateSteps: function () { return gateSteps.slice(); },
    lastRouteFail: function () { return lastRouteFail; },
    CONG: CONG,
    status: function () {
      var p = docViTri();
      var g = readWalkable();
      return { x: p.x, y: p.y, map: p.map, grid: g ? (g.w + 'x' + g.h + (g.id ? ' · ' + g.id : '')) : null };
    },
  };
  if (window.__TT2D_TONG__) window.__TT2D_TONG__.nav = navApi;
  window.__TT2D_NAV__ = navApi;
})();


  // ================= MODULE: farm (farm tự tìm đường, mới v1.1.0) =================

// ================= MODULE: FARM TỰ TÌM ĐƯỜNG =================
// Tab Farm (mới, viết cho Tool Tổng v1.1.0 — lệnh Thanh 01:15 25/11):
// bật auto farm -> tool TỰ ĐI đến map + khu đã chọn rồi mới bật Auto farm.
//  - Đọc vị trí/map hiện tại bằng nav.docViTri() (ƯU TIÊN #hud-map — body
//    bị nhiễm chữ từ chính panel tool, xem bug hợp nhất ở README).
//  - Chưa ở map đích -> nav.diToiMap() (BFS + qua cổng, tái dùng module
//    Điều hướng chung fragments/nav.js — KHÔNG viết nav mới).
//  - Tới map đích -> đi tới biển KHU / Bảng Khu của map đó -> chọn khu
//    đã chọn qua lưới 1-40 ([data-khu]); khu đầy thì thử khu dự phòng,
//    không có khu dự phòng thì dừng + báo (KHÔNG bấm liên tục).
//  - Bật Auto + Chạy + Phi Hành (Phi Hành bật CUỐI vì tự tắt sau khi bấm
//    Auto/Chạy); ưu tiên Tự Động Đánh 'Quái'.
//  - Giám sát khi farm: kiểm tra khu mỗi ~5 phút (Auto có thể tự lạc khu
//    qua cổng); Giáp (shield) < 35% thì thiền ở điểm an toàn rồi bật lại
//    Phi Hành; đếm tốc độ quái/phút từ "Hôm nay từ quái" (#stone-day).
//  - Phiên hết hạn -> DỪNG + báo (tab Farm KHÔNG tự đăng nhập lại — việc
//    của chặng browser).
//  - QUY TẮC CỨNG: KHÔNG bấm Ghi danh tranh khu (20.000 LT) — chỉ bấm nút
//    [data-khu]; KHÔNG tự đổi khu khi khu đang farm nhanh (>=5/phút) trừ
//    khi người dùng đổi đích.
//  - Biển KHU mỗi map (đã xác minh từ thực tế farm + client 24/11):
//    Phong Địa (34,15) / (30,19); Thảo Dược Cốc (14,5); Hang Động (14,16);
//    Miếu Ông Trường Con (11,22). Các map còn lại chưa biết tọa độ biển
//    -> chỉ đi tới map rồi farm tại khu hiện tại, không đổi khu.
//  - Cổng tới Long Uyên / Hang Động đã thêm vào nav.js (xác minh từ
//    MapData.portals client 24/11): Rừng Trúc (39,13) đông -> Long Uyên;
//    Long Uyên (22,4) là cổng byHand (bấm Tương Tác) -> Hang Động;
//    Hang Động (14,19) nam -> Long Uyên.
(function () {
  'use strict';

  var CFG = {
    pollMs: 1000,            // tick mỗi 1s (cập nhật UI + kiểm tra nhẹ)
    khuCheckMs: 300000,      // kiểm tra khu mỗi 5 phút
    giapCheckMs: 5000,       // kiểm tra Giáp mỗi 5s
    giapThapPct: 35,         // shield < 35% (~Giáp <100) thì thiền
    giapHoiPct: 90,          // thiền tới shield >= 90% thì farm tiếp
    meditateTimeoutMs: 90000,// thiền tối đa 90s
    zoneWaitMs: 3000,        // chờ sau khi bấm chọn khu
    boardWaitMs: 8000,       // chờ bảng khu hiện sau khi bấm Tương Tác
    navTimeoutMs: 180000,    // tối đa 180s cho 1 lần di chuyển tới đích
    tocNhanh: 5,             // >=5 quái/phút = khu đang nhanh, không tự đổi
  };

  // Map đích: tên hiển thị + biển KHU (tọa độ đứng để bấm Bảng Khu) +
  // điểm an toàn để thiền hồi Giáp. sign: null = chưa biết tọa độ biển.
  // Map mới v1.2.0 (25/11, nav mở rộng): Mỏ Linh Thạch, Thạch Phong Thung
  // Lũng ("Thung Lũng"), Bát Quái Thạch Phàn, Thiên Đạo Khuyết ("Chính Đảo"),
  // Ma Động, Hắc Phong Lĩnh, Hắc Thị — sign: null (chưa biết tọa độ biển KHU;
  // tool đi tới map rồi farm tại khu hiện tại, xem runToTarget). Hắc Thị cần
  // Quỷ Diện mới vào được (cổng Hắc Phong Lĩnh (63,10)) — chỉ chọn khi có.
  var MAPS = {
    phong_dia:      { ten: 'Phong Địa',            sign: [[34, 15], [30, 19]], safe: [30, 27] },
    duoc_vien:      { ten: 'Thảo Dược Cốc',        sign: [[14, 5]],             safe: [14, 5] },
    dong_mach_ngam: { ten: 'Miếu Ông Trường Con',  sign: [[11, 22]],            safe: [11, 22] },
    hang_dong:      { ten: 'Hang Động',            sign: [[14, 16]],            safe: [14, 16] },
    long_uyen:      { ten: 'Long Uyên Cốc',        sign: null,                   safe: null },
    bai_da_hang_gio:{ ten: 'Bãi Đá Hang Gió',      sign: null,                   safe: null },
    thanh_truc_lam: { ten: 'Rừng Trúc',            sign: null,                   safe: null },
    mieu_hoang:     { ten: 'Miếu Hoang',           sign: null,                   safe: null },
    van_can:        { ten: 'Hồ Tây',               sign: null,                   safe: null },
    mo_linh_thach:  { ten: 'Mỏ Linh Thạch',        sign: null,                   safe: null },
    thach_phong_thung_lung: { ten: 'Thung Lũng (Thạch Phong)', sign: null,      safe: null },
    bat_quai_thach_phan: { ten: 'Bát Quái Thạch Phàn', sign: null,               safe: null },
    thien_dao_khuyet: { ten: 'Thiên Đạo Khuyết',   sign: null,                   safe: null },
    u_uynh_vuc:     { ten: 'Ma Động',              sign: null,                   safe: null },
    hac_phong_linh: { ten: 'Hắc Phong Lĩnh',       sign: null,                   safe: null },
    // Hắc Thị ĐÃ BỎ khỏi danh sách đích farm (v1.3.3, Thanh hỏi 07:17
    // 25/11 "cho nhân vật qua hắc thị làm gì vậy"): chợ đen, không có
    // quái để farm, vào cần Quỷ Diện. Cổng Hắc Thị vẫn giữ trong nav.js.
  };
  var MAP_ORDER = ['phong_dia', 'duoc_vien', 'dong_mach_ngam', 'hang_dong',
    'long_uyen', 'bai_da_hang_gio', 'thanh_truc_lam', 'mieu_hoang', 'van_can',
    'mo_linh_thach', 'thach_phong_thung_lung', 'bat_quai_thach_phan',
    'thien_dao_khuyet', 'u_uynh_vuc', 'hac_phong_linh'];

  var on = false;
  var phase = 'idle';        // idle | going | zone | farming | meditate | stuck | zone_full | het_phien
  var busy = false;          // đang chạy 1 bước async (đi/chọn khu/thiền) — tick không chen ngang
  var collapsed = false;
  var logLines = [];

  // Đích (nhớ lần trước qua localStorage).
  var target = { map: 'phong_dia', khu: 3, backupKhu: 5 };
  try {
    var saved = JSON.parse(localStorage.getItem('tt2d_farm_target') || 'null');
    if (saved && MAPS[saved.map]) target.map = saved.map;
    if (saved && typeof saved.khu === 'number' && saved.khu >= 1 && saved.khu <= 40) target.khu = saved.khu;
    if (saved && typeof saved.backupKhu === 'number' && saved.backupKhu >= 1 && saved.backupKhu <= 40) target.backupKhu = saved.backupKhu;
  } catch (e) { /* bỏ qua */ }
  function saveTarget() {
    try { localStorage.setItem('tt2d_farm_target', JSON.stringify(target)); } catch (e) { /* bỏ qua */ }
  }

  // Theo dõi tốc độ farm + kiểm tra định kỳ.
  var farmStart = { count: null, t: 0 };   // mốc đếm quái lúc bắt đầu farm
  var lastCount = null, lastRateT = 0, ratePerMin = 0;
  var lastKhuCheck = 0, lastGiapCheck = 0;
  var curKhu = null, curMap = null, curPos = { x: null, y: null };

  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || (window.__TT2D_TONG__ && window.__TT2D_TONG__.nav) || null; }

  function log(msg) {
    var line = new Date().toLocaleTimeString('vi-VN') + ' — ' + msg;
    logLines.unshift(line);
    if (logLines.length > 6) logLines.length = 6;
    render();
  }
  function setPhase(p, msg) {
    phase = p;
    if (msg) log(msg);
    render();
  }

  // ---------------- Đọc trạng thái game ----------------
  function docViTri() {
    var n = nav();
    if (n && typeof n.docViTri === 'function') {
      try { return n.docViTri(); } catch (e) { /* fallback */ }
    }
    // Fallback: ƯU TIÊN #hud-map (body bị nhiễm chữ từ panel tool).
    var t = document.body ? (document.body.innerText || '') : '';
    var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    var map = null;
    var hm = document.querySelector('#hud-map');
    var hmt = hm ? (hm.innerText || hm.textContent || '').trim() : '';
    function nhanMap(s) {
      if (/Hồ Tây/.test(s)) return 'van_can';
      if (/Thảo Dược Cốc/.test(s)) return 'duoc_vien';
      if (/Rừng Trúc/.test(s)) return 'thanh_truc_lam';
      if (/Chân Núi Tản Viên/.test(s)) return 'tan_vien';
      if (/Miếu Ông Trường Con/.test(s)) return 'dong_mach_ngam';
      if (/Bãi Đá/.test(s)) return 'bai_da_hang_gio';
      if (/Miếu Hoang/.test(s)) return 'mieu_hoang';
      if (/Phong Địa/.test(s)) return 'phong_dia';
      if (/Vườn Cá Nhân/.test(s)) return 'vuon_ca_nhan';
      if (/Long Uyên/.test(s)) return 'long_uyen';
      if (/Hang Động/.test(s)) return 'hang_dong';
      if (/Mỏ Linh Thạch/.test(s)) return 'mo_linh_thach';
      if (/Thạch Phong|Thung Lũng/.test(s)) return 'thach_phong_thung_lung';
      if (/Bát Quái|Thành Thăng Long/.test(s)) return 'bat_quai_thach_phan';
      if (/Thiên Đạo|Chính Đảo/.test(s)) return 'thien_dao_khuyet';
      if (/Ma Động/.test(s)) return 'u_uynh_vuc';
      if (/Hắc Phong Lĩnh/.test(s)) return 'hac_phong_linh';
      if (/Hắc Thị/.test(s)) return 'hac_thi';
      return null;
    }
    if (hmt) map = nhanMap(hmt);
    if (!map) map = nhanMap(t);
    return { x: m ? parseInt(m[1], 10) : null, y: m ? parseInt(m[2], 10) : null, map: map };
  }
  function docKhu() {
    try {
      var k = window.__ns_ && window.__ns_.KhuUI && window.__ns_.KhuUI.khu;
      return (typeof k === 'number') ? k : null;
    } catch (e) { return null; }
  }
  function docSoKhu() {
    try {
      var k = window.__ns_ && window.__ns_.KhuUI && window.__ns_.KhuUI.soKhu;
      return (typeof k === 'number' && k > 0) ? k : 40;
    } catch (e) { return 40; }
  }
  function docQuai() {
    // "Hôm nay từ quái: N/M" — đọc #stone-day trước, fallback Loot.stoneToday().
    try {
      var el = document.querySelector('#stone-day');
      var t = el ? txt(el) : '';
      var m = t.match(/(\d+)\s*\/\s*(\d+)/);
      if (m) return { da: parseInt(m[1], 10), tran: parseInt(m[2], 10) };
      var L = window.__ns_ && window.__ns_.Loot;
      if (L && typeof L.stoneToday === 'function') {
        var r = L.stoneToday();
        if (r && typeof r.da === 'number') return { da: r.da, tran: r.tran };
      }
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function docGiapPct() {
    // Giáp = shield fill <s> trong .pl-bar.hp (width % = Giáp / Giáp tối đa).
    try {
      var s = document.querySelector('.pl-bar.hp s');
      if (!s) return null;
      var w = parseFloat((s.style && s.style.width) || '');
      return isFinite(w) ? w : null;
    } catch (e) { return null; }
  }
  function docHP() {
    var el = document.querySelector('.pl-bar.hp .pl-n');
    if (!el) return null;
    var m = txt(el).match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return null;
    return { cur: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  }
  function hetPhien() {
    // Form đăng nhập hiện = phiên đã hết hạn (tab Farm không tự đăng nhập lại).
    var f = document.querySelector('#auth-name');
    return !!(f && f.offsetParent !== null);
  }

  // ---------------- Nút game: Auto / Chạy / Phi Hành / ưu tiên ----------------
  // Bấm nút game bằng tap() (pointerdown+pointerup+click): nút HUD của
  // game (#btn-attack, #btn-fly, #btn-auto-touch, #btn-target, #btn-run,
  // #btn-meditate-touch) CHỈ bind "pointerdown" (helper k() trong TouchUI,
  // game.js client 24/11) — .click() lên chúng là no-op. Đây chính là lỗi
  // "bật auto farm ở tool không di chuyển được" Thanh báo 07:15 25/11:
  // datAuto cũ .click() không tắt được Auto nên joystick đứng yên.
  // #btn-auto KHÔNG có listener (chỉ #btn-auto-touch có) — ưu tiên
  // #btn-auto-touch. Game tiêu thụ cờ toggle ở frame sau nên KHÔNG kiểm
  // tra lại trạng thái ngay sau khi bấm — bấm đúng 1 lần rồi thôi.
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
  function btnOn(sel) {
    var b = document.querySelector(sel);
    return !!(b && b.classList.contains('active'));
  }
  function autoIsOn() { return btnOn('#btn-auto') || btnOn('#btn-auto-touch'); }
  // Phi Hành đang bật hay không: đọc trạng thái thật của game qua nav
  // (SceneWorld.player.flying) trước — class nút #btn-fly đã được xác
  // minh live 12:54 25/11 là không đáng tin (luôn báo false trong khi
  // nhân vật đang bay), đọc nút thì batBoFarm bấm Phi Hành 2 lần thành tắt.
  function flyIsOn() {
    var n = nav();
    if (n && typeof n.flyDangBat === 'function') {
      try { return n.flyDangBat(); } catch (e) { /* fallback nút */ }
    }
    return btnOn('#btn-fly');
  }
  function runIsOn() { return btnOn('#btn-run'); }
  function bamNut(sel) {
    var b = document.querySelector(sel);
    if (!b) return false;
    tap(b);
    return true;
  }
  function datAuto(v) {
    v = !!v;
    if (autoIsOn() === v) return true;
    var b = document.querySelector('#btn-auto-touch') || document.querySelector('#btn-auto');
    if (!b) return false;
    tap(b);
    return true; // đã bấm 1 lần; trạng thái game đổi ở frame sau
  }
  function datFly(v) {
    v = !!v;
    if (flyIsOn() === v) return true;
    var b = document.querySelector('#btn-fly');
    if (!b) return false;
    tap(b);
    return true;
  }
  function datRun(v) {
    v = !!v;
    if (runIsOn() === v) return true;
    var b = document.querySelector('#btn-run');
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
  // Bật bộ 3 farm: Auto + Chạy trước, Phi Hành CUỐI (Phi Hành tự tắt sau
  // khi bấm Auto/Chạy — kiểm tra lại bằng mắt sau khi bật).
  async function batBoFarm() {
    datUuTienQuai();
    datAuto(true);
    await sleep(400);
    datRun(true);
    await sleep(400);
    datFly(true);
    await sleep(400);
    if (!flyIsOn()) datFly(true); // thử lại 1 lần nếu Phi Hành chưa bật
    return autoIsOn();
  }
  function tatAuto() { datAuto(false); }

  // ---------------- Mở Bảng Khu + chọn khu ----------------
  function bangKhuMo() {
    return $all('[data-khu]').length > 0;
  }
  function nutBangKhuHien() {
    var b = document.querySelector('#btn-attack');
    if (!b) return false;
    var label = (b.getAttribute('aria-label') || '') + ' ' + txt(b);
    return /bảng khu/i.test(label);
  }
  async function moBangKhu() {
    // Đã mở sẵn thì thôi.
    if (bangKhuMo()) return true;
    // Bấm nút Tương Tác (aria-label "Tương tác với Bảng Khu") — Space cũng
    // gọi pressAttack nên bấm nút là đủ; thử Space nếu bấm nút không mở.
    if (nutBangKhuHien()) {
      bamNut('#btn-attack');
      for (var i = 0; i < 8; i++) {
        await sleep(500);
        if (bangKhuMo()) return true;
      }
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
    for (var j = 0; j < 8; j++) {
      await sleep(500);
      if (bangKhuMo()) return true;
    }
    return false;
  }
  function dongBangKhu() {
    var b = document.querySelector('[data-khu]');
    if (!b) return;
    // Bấm lại ô khu hiện tại để đóng bảng (không đổi khu).
    var cur = docKhu();
    var self = cur !== null ? document.querySelector('[data-khu="' + cur + '"]') : null;
    if (self) self.click();
  }
  // Chọn khu: chỉ bấm nút [data-khu] — KHÔNG BAO GIỜ bấm Ghi danh tranh khu.
  async function chonKhu(khu) {
    var soKhu = docSoKhu();
    if (khu < 1 || khu > soKhu) {
      log('Khu ' + khu + ' không có (map này chỉ có ' + soKhu + ' khu).');
      return 'sai_khu';
    }
    if (docKhu() === khu) return 'ok';
    var ok = await moBangKhu();
    if (!ok) {
      log('Không mở được Bảng Khu (nút không hiện "Tương tác với Bảng Khu" — đứng chưa sát biển?).');
      return 'khong_mo_bang';
    }
    var btn = document.querySelector('[data-khu="' + khu + '"]');
    if (!btn) {
      log('Bảng khu không có ô Khu ' + khu + '.');
      return 'khong_co_o';
    }
    // Khu đầy hiển thị class "day" nhưng nhãn "đất trống" vẫn báo đầy khi
    // bấm — chỉ tin kết quả thật: khu có đổi không.
    btn.click();
    var t0 = Date.now();
    while (Date.now() - t0 < CFG.zoneWaitMs) {
      await sleep(500);
      if (docKhu() === khu) return 'ok';
      if (!bangKhuMo()) break; // bảng đã đóng mà khu chưa đổi -> bị từ chối
    }
    if (docKhu() === khu) return 'ok';
    log('Khu ' + khu + ' báo đầy (bấm không vào được).');
    return 'day';
  }

  // ---------------- Thiền hồi Giáp ----------------
  function bamThien() {
    var b = document.querySelector('#btn-meditate-touch');
    if (b) { tap(b); return true; }
    try {
      var I = window.__ns_ && window.__ns_.Input;
      if (I && typeof I.pressMeditate === 'function') { I.pressMeditate(); return true; }
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  function dangThien() {
    // Đang thiền = nút Đả Tọa đang active hoặc nhân vật ở trạng thái sit.
    var b = document.querySelector('#btn-meditate-touch');
    return !!(b && b.classList.contains('active'));
  }
  async function thienHoiGiap() {
    setPhase('meditate', 'Giáp thấp — thiền hồi Giáp.');
    tatAuto();
    var n = nav();
    var vt = docViTri();
    var info = MAPS[vt.map] || null;
    // Về điểm an toàn của map hiện tại rồi mới thiền (tránh bị quái đánh).
    if (info && info.safe && n && typeof n.diToi === 'function') {
      try { await n.diToi(info.safe[0], info.safe[1], 60); } catch (e) { /* thiền tại chỗ */ }
    }
    if (!bamThien()) {
      log('Không bấm được nút thiền — farm tiếp (Giáp sẽ hồi khi không bị đánh).');
      setPhase('farming');
      return false;
    }
    var t0 = Date.now();
    while (Date.now() - t0 < CFG.meditateTimeoutMs) {
      await sleep(2000);
      if (!on) return false;
      var pct = docGiapPct();
      if (pct !== null && pct >= CFG.giapHoiPct) break;
      if (!dangThien()) bamThien(); // thiền bị ngắt thì ngồi lại
    }
    var pct2 = docGiapPct();
    log('Thiền xong — Giáp ' + (pct2 === null ? '?' : Math.round(pct2) + '%') + '. Bật lại Phi Hành + Auto.');
    setPhase('farming');
    await batBoFarm(); // bật lại Phi Hành (thiền làm tắt Phi Hành)
    return true;
  }

  // ---------------- Chạy tới đích: map -> khu -> bật farm ----------------
  async function runToTarget() {
    busy = true;
    try {
      var n = nav();
      if (!n || typeof n.diToiMap !== 'function' || typeof n.diToi !== 'function') {
        setPhase('stuck', 'Module Điều hướng chưa sẵn sàng (nav).');
        return;
      }
      // TẮT Auto TRƯỚC khi di chuyển (lỗi 05:41 25/11: bật Farm mà nhân
      // vật không đi): joystick KHÔNG di chuyển được khi Auto BẬT (cơ chế
      // game đã xác minh — cũng là nguyên nhân kẹt Huyết Xích lần 5).
      // Trước đây runToTarget gọi diToiMap mà không tắt Auto, nên nhân vật
      // đang farm sẵn (Auto BẬT) thì đẩy joystick 60 nhịp vẫn đứng yên rồi
      // tool báo "kẹt". Auto chỉ bật lại SAU khi tới đích (batBoFarm cuối
      // runToTarget); Phi Hành cũng phải TẮT trước khi lái joystick (live
      // 12:52 25/11: joystick không lái được khi đang bay) — nav.diToi và
      // nav.diToiMap tự hạ cánh đầu hàm, runToTarget không cần bấm thêm.
      tatAuto();
      setPhase('going', 'Đang đi tới ' + MAPS[target.map].ten + ' Khu ' + target.khu + '...');
      var vt = docViTri();
      if (vt.map !== target.map) {
        var okMap = false;
        try { okMap = await n.diToiMap(target.map); } catch (e) { okMap = false; }
        if (!on) return; // đã bấm DỪNG giữa chừng
        if (!okMap || docViTri().map !== target.map) {
          // Ghi từng bước quaCong vào log để lần sau chẩn đoán được ngay
          // (vụ 07:29 25/11: Farm báo nhầm "không có đường" trong khi thật
          // ra Phi Hành BẬT nên đẩy cổng không qua).
          var steps = [];
          try { steps = (n.lastGateSteps ? n.lastGateSteps() : []) || []; } catch (e) { steps = []; }
          for (var gi = 0; gi < steps.length; gi++) log('[cổng] ' + steps[gi]);
          var rf = null;
          try { rf = (n.lastRouteFail ? n.lastRouteFail() : null) || null; } catch (e) { rf = null; }
          if (rf && rf.stage === 'khong-co-duong') {
            // (a) Thật sự không có đường trong bảng.
            setPhase('stuck', 'Không có đường tới ' + MAPS[target.map].ten + ' trong bảng đường (từ ' + (vt.map || '?') + ' — map này chưa có cổng đi).');
          } else if (rf && rf.stage === 'qua-cong' && rf.gate && rf.gate.stage === 'di-toi') {
            // (b) Không đi tới được ô cổng (nhân vật kẹt ở đâu đó).
            setPhase('stuck', 'Không tới được ô cổng ' + rf.cong + ' (' + rf.gate.x + ',' + rf.gate.y + ') trên đường tới ' + MAPS[target.map].ten + ' — nhân vật kẹt, kiểm tra vị trí rồi thử lại.');
          } else if (rf && rf.stage === 'qua-cong') {
            // (c) Tới được ô cổng nhưng đẩy cổng không qua.
            setPhase('stuck', 'Tới được ô cổng ' + rf.cong + ' (' + (rf.gate ? rf.gate.x + ',' + rf.gate.y : '?') + ') nhưng đẩy cổng không qua' + (rf.gate && rf.gate.stage === 'by-hand' ? ' (bấm tương tác không mở cổng)' : '') + ' (Phi Hành ' + (rf.fly ? 'BẬT' : 'TẮT') + ', Auto ' + (rf.auto ? 'BẬT' : 'TẮT') + ') — kiểm tra tọa độ cổng / hạ cánh rồi thử lại.');
          } else if (rf && rf.stage === 'map-khong-doi') {
            setPhase('stuck', 'Đi hết các cổng nhưng vẫn chưa sang ' + MAPS[target.map].ten + ' — kiểm tra lại bảng cổng.');
          } else {
            setPhase('stuck', 'Không tới được ' + MAPS[target.map].ten + ' (diToiMap thất bại, chưa rõ nguyên nhân — xem log cổng ở trên).');
          }
          return;
        }
        log('Đã tới ' + MAPS[target.map].ten + '.');
      }
      // Đổi khu qua biển KHU (nếu map có biển đã biết).
      var info = MAPS[target.map];
      if (info.sign) {
        setPhase('zone', 'Đang chọn Khu ' + target.khu + ' ở ' + info.ten + '...');
        tatAuto(); // TẮT Auto + Chạy trước khi bấm biển (theo quy tắc farm)
        datRun(false);
        var toi = false;
        for (var s = 0; s < info.sign.length && !toi; s++) {
          if (!on) return;
          var sg = info.sign[s];
          try { await n.diToi(sg[0], sg[1], 60); } catch (e) { /* thử biển sau */ }
          if (!on) return;
          await sleep(600);
          if (!nutBangKhuHien() && !bangKhuMo()) continue;
          var r = await chonKhu(target.khu);
          if (!on) return;
          if (r === 'ok') { toi = true; break; }
          if (r === 'day' && target.backupKhu && target.backupKhu !== target.khu) {
            log('Thử khu dự phòng ' + target.backupKhu + '...');
            var r2 = await chonKhu(target.backupKhu);
            if (r2 === 'ok') { toi = true; target.khu = target.backupKhu; saveTarget(); break; }
          }
          if (r === 'day') { setPhase('zone_full', 'Khu ' + target.khu + ' đầy (đã thử khu dự phòng). Dừng — đổi khu khác rồi bật lại.'); return; }
          if (r === 'khong_mo_bang') continue; // thử biển sau
          if (r === 'sai_khu' || r === 'khong_co_o') { setPhase('stuck', 'Không chọn được Khu ' + target.khu + ' (' + r + ').'); return; }
        }
        if (!on) return;
        if (!toi) {
          setPhase('stuck', 'Không tới được biển KHU / không mở được Bảng Khu ở ' + info.ten + '.');
          return;
        }
        log('Đã vào Khu ' + docKhu() + ' ' + info.ten + '.');
      } else {
        log(info.ten + ' chưa biết tọa độ biển KHU — farm tại khu hiện tại (Khu ' + (docKhu() === null ? '?' : docKhu()) + ').');
      }
      if (!on) return;
      // Bật bộ 3 farm (Phi Hành bật cuối).
      var okFarm = await batBoFarm();
      if (!on) return;
      if (!okFarm) log('Cảnh báo: Auto chưa bật được — kiểm tra bằng mắt.');
      var q = docQuai();
      farmStart = { count: q ? q.da : null, t: Date.now() };
      lastCount = q ? q.da : null;
      lastRateT = Date.now();
      ratePerMin = 0;
      lastKhuCheck = Date.now();
      lastGiapCheck = Date.now();
      curKhu = docKhu();
      setPhase('farming', 'Đang farm ' + info.ten + ' Khu ' + (curKhu === null ? '?' : curKhu) + ' — Auto + Chạy + Phi Hành đã bật.');
    } finally {
      busy = false;
    }
  }

  // ---------------- Giám sát khi farm (tick 1s) ----------------
  function tinhTocDo() {
    var q = docQuai();
    if (!q || lastCount === null) {
      if (q) { lastCount = q.da; lastRateT = Date.now(); }
      return;
    }
    var now = Date.now();
    var dt = (now - lastRateT) / 60000;
    if (dt >= 0.5) { // tính lại mỗi 30s
      ratePerMin = (q.da - lastCount) / dt;
      lastCount = q.da;
      lastRateT = now;
    }
  }
  async function kiemTraKhu() {
    var k = docKhu();
    if (k === null) return;
    if (curKhu !== null && k !== curKhu) {
      log('Khu đổi ' + curKhu + ' -> ' + k + ' (Auto tự lạc qua cổng).');
      curKhu = k;
      // Khu mới đang nhanh (>=5/phút) thì Ở LẠI, không tự đổi về đích.
      if (ratePerMin >= CFG.tocNhanh) {
        log('Khu ' + k + ' đang nhanh (' + ratePerMin.toFixed(1) + '/phút) — ở lại, không đổi về Khu ' + target.khu + '.');
        target.khu = k;
        saveTarget();
        return;
      }
      // Khu mới chậm -> đi lại về khu đích.
      log('Khu mới chậm (' + ratePerMin.toFixed(1) + '/phút) — đi lại về Khu ' + target.khu + '.');
      setPhase('going', 'Đi lại về Khu ' + target.khu + '...');
      await runToTarget();
    } else {
      curKhu = k;
    }
  }
  function tick() {
    try {
      var vt = docViTri();
      curMap = vt.map;
      curPos = { x: vt.x, y: vt.y };
      if (hetPhien()) {
        if (on) {
          on = false;
          setPhase('het_phien', 'Phiên đăng nhập đã hết hạn — DỪNG. Cần đăng nhập lại (chặng browser), rồi bật lại tab Farm.');
        }
        render();
        return;
      }
      if (!on) { render(); return; }
      if (phase === 'farming') {
        tinhTocDo();
        var now = Date.now();
        // Kiểm tra Giáp mỗi 5s.
        if (now - lastGiapCheck >= CFG.giapCheckMs) {
          lastGiapCheck = now;
          var pct = docGiapPct();
          if (pct !== null && pct < CFG.giapThapPct && !busy) {
            busy = true;
            thienHoiGiap().finally(function () { busy = false; });
          }
        }
        // Kiểm tra khu mỗi 5 phút.
        if (now - lastKhuCheck >= CFG.khuCheckMs) {
          lastKhuCheck = now;
          if (!busy) {
            busy = true;
            kiemTraKhu().finally(function () { busy = false; });
          }
        }
        // Auto bị tắt bất ngờ (vd sau khi thiền / đổi khu) thì bật lại.
        if (!autoIsOn() && !busy) datAuto(true);
      }
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  // ---------------- Bảng điều khiển (trong tab Farm) ----------------
  var panel, panelBody, miniRow, miniStatusEl;
  var elMap, elKhu, elBackup, elGo, elTrangThai, elViTri, elTocDo, elLog;
  function mapTen(id) { return (MAPS[id] && MAPS[id].ten) || id; }
  function phaseTen() {
    return { idle: 'Chưa bật', going: 'Đang đi tới đích', zone: 'Đang chọn khu',
      farming: 'Đang farm', meditate: 'Đang thiền hồi Giáp', stuck: 'Kẹt — cần xem',
      zone_full: 'Khu đầy', het_phien: 'Hết phiên — cần đăng nhập lại' }[phase] || phase;
  }
  function shortStatus() {
    if (!on) return 'TẮT';
    return phaseTen() + ' · ' + mapTen(target.map) + ' K' + target.khu +
      (phase === 'farming' && ratePerMin > 0 ? ' · ' + ratePerMin.toFixed(1) + '/phút' : '');
  }
  function buildPanel() {
    var host = Tong.tabBody('farm');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-farm-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = MAP_ORDER.map(function (id) {
      return '<option value="' + id + '"' + (id === target.map ? ' selected' : '') + '>' + MAPS[id].ten + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>\uD83C\uDF3E Farm tự tìm đường</b>' +
        '<button id="tt2d-farm-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-farm-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>\uD83C\uDF3E Farm</b>' +
        '<span id="tt2d-farm-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-farm-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-farm-body">' +
        '<div style="margin:6px 0;display:flex;gap:6px;align-items:center">' +
          '<label style="white-space:nowrap">Map:</label>' +
          '<select id="tt2d-farm-map" style="flex:1;padding:4px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0">' + opts + '</select>' +
        '</div>' +
        '<div style="margin:4px 0;display:flex;gap:6px;align-items:center">' +
          '<label style="white-space:nowrap">Khu:</label>' +
          '<input id="tt2d-farm-khu" type="number" min="1" max="40" value="' + target.khu + '" style="width:56px;padding:4px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0">' +
          '<label style="white-space:nowrap">Dự phòng:</label>' +
          '<input id="tt2d-farm-backup" type="number" min="1" max="40" value="' + target.backupKhu + '" style="width:56px;padding:4px;border-radius:5px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0">' +
        '</div>' +
        '<div style="margin:6px 0;display:flex;gap:6px">' +
          '<button id="tt2d-farm-go" style="flex:1;padding:6px;border-radius:5px;border:1px solid #8a6a2f;background:#3a2c12;color:#ffe9b0;cursor:pointer;font-weight:bold">ĐI FARM</button>' +
        '</div>' +
        '<div id="tt2d-farm-trangthai" style="margin:4px 0;color:#ffd27a">Chưa bật.</div>' +
        '<div id="tt2d-farm-vitri" style="margin:4px 0;color:#bfe3ff"></div>' +
        '<div id="tt2d-farm-tocdo" style="margin:4px 0;color:#c9f2c9"></div>' +
        '<div id="tt2d-farm-log" style="margin-top:6px;max-height:96px;overflow:auto;color:#d8c9a3;font-size:11px"></div>' +
        '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">Tự đi tới map + khu đã chọn rồi bật Auto + Chạy + Phi Hành. Khu đầy thì thử khu dự phòng, không bấm liên tục. KHÔNG bấm Ghi danh tranh khu. Phiên hết hạn thì dừng — đăng nhập lại rồi bật lại. Map chưa biết biển KHU thì farm tại khu hiện tại.</div>' +
      '</div>';
    host.appendChild(panel);
    panelBody = panel.querySelector('#tt2d-farm-body');
    miniRow = panel.querySelector('#tt2d-farm-mini');
    miniStatusEl = panel.querySelector('#tt2d-farm-mini-status');
    elMap = panel.querySelector('#tt2d-farm-map');
    elKhu = panel.querySelector('#tt2d-farm-khu');
    elBackup = panel.querySelector('#tt2d-farm-backup');
    elGo = panel.querySelector('#tt2d-farm-go');
    elTrangThai = panel.querySelector('#tt2d-farm-trangthai');
    elViTri = panel.querySelector('#tt2d-farm-vitri');
    elTocDo = panel.querySelector('#tt2d-farm-tocdo');
    elLog = panel.querySelector('#tt2d-farm-log');
    panel.querySelector('#tt2d-farm-collapse').addEventListener('click', function () { setCollapsed(true); });
    panel.querySelector('#tt2d-farm-expand').addEventListener('click', function () { setCollapsed(false); });
    elMap.addEventListener('change', function () { docTargetTuForm(); });
    elKhu.addEventListener('change', function () { docTargetTuForm(); });
    elBackup.addEventListener('change', function () { docTargetTuForm(); });
    elGo.addEventListener('click', function () { if (on) stop(); else start(); });
    render();
  }
  function docTargetTuForm() {
    if (!elMap || !elKhu || !elBackup) return;
    var m = elMap.value;
    var k = parseInt(elKhu.value, 10);
    var b = parseInt(elBackup.value, 10);
    if (MAPS[m]) target.map = m;
    if (isFinite(k) && k >= 1 && k <= 40) target.khu = k;
    if (isFinite(b) && b >= 1 && b <= 40) target.backupKhu = b;
    saveTarget();
    render();
  }
  function setCollapsed(v) {
    collapsed = !!v;
    if (panelBody) panelBody.style.display = collapsed ? 'none' : '';
    if (miniRow) miniRow.style.display = collapsed ? 'flex' : 'none';
    render();
  }
  function render() {
    if (!panel) return;
    if (miniStatusEl) miniStatusEl.textContent = shortStatus();
    if (elGo) {
      elGo.textContent = on ? 'DỪNG FARM' : 'ĐI FARM';
      elGo.style.background = on ? '#7a2d12' : '#3a2c12';
    }
    if (elTrangThai) {
      elTrangThai.textContent = (on ? '● ' : '○ ') + phaseTen() + ' — đích: ' +
        mapTen(target.map) + ' Khu ' + target.khu +
        (target.backupKhu ? ' (dự phòng ' + target.backupKhu + ')' : '');
    }
    if (elViTri) {
      elViTri.textContent = 'Đang ở: ' + (curMap ? mapTen(curMap) : '?') +
        ((curPos.x !== null) ? ' (' + curPos.x + ',' + curPos.y + ')' : '') +
        (curKhu !== null ? ' · Khu ' + curKhu : '') +
        ' · Auto ' + (autoIsOn() ? 'BẬT' : 'TẮT') +
        ' · Phi Hành ' + (flyIsOn() ? 'BẬT' : 'TẮT') +
        ' · Chạy ' + (runIsOn() ? 'BẬT' : 'TẮT');
    }
    if (elTocDo) {
      var q = docQuai();
      elTocDo.textContent = (q ? 'Quái hôm nay: ' + q.da + '/' + q.tran : 'Quái hôm nay: ?') +
        (ratePerMin > 0 ? ' · tốc độ ~' + ratePerMin.toFixed(1) + '/phút' : '');
    }
    if (elLog) {
      elLog.innerHTML = logLines.map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
    }
  }

  // ---------------- Bật / dừng / debug handle ----------------
  function start() {
    docTargetTuForm();
    if (on) return;
    on = true;
    lastKhuCheck = Date.now();
    lastGiapCheck = Date.now();
    log('Farm BẬT — đích: ' + mapTen(target.map) + ' Khu ' + target.khu + '.');
    render();
    runToTarget();
  }
  function stop() {
    on = false;
    setPhase('idle', 'Farm DỪNG (nhân vật giữ nguyên trạng thái farm tại chỗ).');
  }
  function setTarget(map, khu, backupKhu) {
    if (map && MAPS[map]) target.map = map;
    if (typeof khu === 'number' && khu >= 1 && khu <= 40) target.khu = khu;
    if (typeof backupKhu === 'number' && backupKhu >= 1 && backupKhu <= 40) target.backupKhu = backupKhu;
    saveTarget();
    if (elMap) elMap.value = target.map;
    if (elKhu) elKhu.value = target.khu;
    if (elBackup) elBackup.value = target.backupKhu;
    render();
  }
  function status() {
    return {
      on: on, phase: phase, targetMap: target.map, targetKhu: target.khu,
      backupKhu: target.backupKhu, map: curMap, x: curPos.x, y: curPos.y,
      khu: curKhu, ratePerMin: Math.round(ratePerMin * 10) / 10,
      giapPct: docGiapPct(), autoOn: autoIsOn(), flyOn: flyIsOn(), runOn: runIsOn(),
    };
  }

  buildPanel();
  setInterval(tick, CFG.pollMs);
  tick();
  log('Tab Farm đã nạp. Chọn map + khu rồi bấm ĐI FARM.');

  window.__TT2D_FARM__ = {
    start: start,
    stop: stop,
    setTarget: setTarget,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _chonKhu: chonKhu,
    _moBangKhu: moBangKhu,
    _runToTarget: runToTarget,
    _thienHoiGiap: thienHoiGiap,
    _maps: MAPS,
    _debug: {
      tap: tap, datAuto: datAuto, datRun: datRun, datFly: datFly,
      autoIsOn: autoIsOn, runIsOn: runIsOn, flyIsOn: flyIsOn,
      bamNut: bamNut, bamThien: bamThien,
    },
  };
  Tong.register('farm', window.__TT2D_FARM__);
})();

})();
