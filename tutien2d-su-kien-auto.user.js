// ==UserScript==
// @name         Tu Tiên 2D — Săn Sự Kiện (Thương Đội + Xổng Chuồng)
// @namespace    https://traxanhnet6.github.io/tu-tien-2d-su-kien-tool
// @version      1.0.1
// @description  Canh kênh Thế Giới, tự chạy tới săn Thương Đội và Yêu Thú Xổng Chuồng cho 2 acc traxanhnet + traxanhnet2, xong tự về farm.
// @author       Muse (cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
/* =====================================================================
   TOOL SĂN SỰ KIỆN — Thương Đội + Yêu Thú Xổng Chuồng (v1.0.1)
   v1.0.1 (25/11): sửa cổng tan_vien>mieu_hoang (2,15)->(2,13) hàng 13 — xác minh live 25/11, (2,15) sai do hàng 14-16 bị cây chắn ở x=1.
   ---------------------------------------------------------------------
   Canh kênh Thế Giới (poll DOM ~4s). Thấy Thiên Đạo xướng sự kiện thì
   tự di chuyển tới map + khu đó, bật Auto + Phi Hành + Chạy, ưu tiên
   'Quái', đánh theo vai trò của acc, xong tự về chỗ farm cũ.
   - Thương Đội: 1 Thương Nhân + 2 Tiêu Sư + Kiếp Tặc rình đường.
     Hạ 2 Tiêu Sư trước mới đánh được Thương Nhân. Rơi Oan Hồn
     (PHẢI mang Quỷ Phiên — id túi "hon_phien") + Kiếp Tặc rơi
     Hiệp Nghĩa Lệnh. Ma Đạo KHÔNG đánh được Kiếp Tặc (client
     ChinhDao.danhDuoc chặn) — acc Ma Đạo chỉ đánh Tiêu Sư/Thương Nhân.
   - Xổng Chuồng: 3 Xích Nhãn Ngưu + 3 Bạch Hổ Tuyết, Lv 12, HP 3.636
     (bầy sự kiện máu dày hơn con thường). Nanh Hổ 100%, Ngưu Sừng
     ~50%, CHỈ người đánh đòn cuối nhận đồ (lootLastHitOnly).
     Thiên Đạo xướng map + khu, 20 giây sau bầy mới hiện.
   - Phân công: traxanhnet → Hổ (Nanh) + Thương Nhân;
     traxanhnet2 → Ngưu (Ngưu Sừng) + Tiêu Sư (+ Kiếp Tặc nếu đánh được).
   - KHÔNG chen ngang Đại Hội / Huyết Xích / Tam Lộ / Vạn Hoang
     (đang ở map sự kiện thì chỉ báo, không tự đi).
   - KHÔNG mua đồ, KHÔNG bấm Ghi danh tranh khu, KHÔNG teleport.
   SỬA LỖI so với tool Thương Đội cũ: đọc map/khu từ
   __ns_.KhuUI.mapId / .khu (không đọc body text — tin chat chứa tên
   map làm tool tưởng đã tới nơi); chống trùng tin theo (loại,map,khu).
   ===================================================================== */
(function () {
  'use strict';
  if (window.__TT2D_SK__) return; // chỉ nạp 1 lần

  /* ---------------- CẤU HÌNH ---------------- */
  var CFG = {
    pollMs: 4000,          // nhịp canh kênh Thế Giới
    joyHoldMs: 350,        // nhịp joystick ngắn
    joyLongMs: 900,        // nhịp dài khi kẹt
    portalHoldMs: 700,     // giữ hướng qua cổng
    portalTries: 6,        // số lần thử qua cổng
    doiKhuChoMs: 12000,    // chờ đổi khu xong
    quetKhuToiDa: 8,        // Thương Đội không ghi khu: quét tối đa 8 khu
    diChuyenTimeoutMs: 6 * 60 * 1000, // 6 phút không tới nơi -> bỏ
    doanHetSauMs: 60000,   // 60s không thấy đoàn/bầy -> coi như hết
    doanRoiSauMs: 5 * 60 * 1000, // đoàn còn sau 5 phút -> nhắc sắp rời
    vaiTro: 'tu_chon',     // 'traxanhnet' | 'traxanhnet2' | 'tu_chon'
    canNanh: 3,            // còn cần bao nhiêu Nanh Hổ (GĐ27 cần 3)
    canNguu: 3,            // còn cần bao nhiêu Ngưu Sừng (GĐ27 cần 3)
    canHiepNghia: 0,       // còn cần bao nhiêu Hiệp Nghĩa Lệnh
    chiBao: false,         // true = chỉ báo tin, không tự đi
    veFarmSauSuKien: true, // xong sự kiện -> về chỗ farm cũ
  };
  // Đọc cấu hình đã lưu (vai trò, nhu cầu, chế độ chỉ báo)
  try {
    var _cfgLuu = JSON.parse(localStorage.getItem('tt2d_sk_cfg') || '{}');
    for (var _k in _cfgLuu) if (CFG.hasOwnProperty(_k)) CFG[_k] = _cfgLuu[_k];
  } catch (e) {}
  function luuCfg() {
    try {
      localStorage.setItem('tt2d_sk_cfg', JSON.stringify({
        vaiTro: CFG.vaiTro, canNanh: CFG.canNanh, canNguu: CFG.canNguu,
        canHiepNghia: CFG.canHiepNghia, chiBao: CFG.chiBao,
        veFarmSauSuKien: CFG.veFarmSauSuKien,
      }));
    } catch (e) {}
  }

  /* ---------------- BẢNG DỮ LIỆU (đã xác minh client 24/11) ---------------- */
  var MAP_TEN = { // tên map trong tin -> mapId
    'Rừng Trúc': 'thanh_truc_lam', 'Thảo Dược Cốc': 'duoc_vien',
    'Bãi Đá': 'bai_da_hang_gio', 'Bãi Đá Hang Gió': 'bai_da_hang_gio',
  };
  var MAP_TEN_NGUOC = { thanh_truc_lam: 'Rừng Trúc', duoc_vien: 'Thảo Dược Cốc', bai_da_hang_gio: 'Bãi Đá' };
  // Vị trí Thương Nhân + Bảng Khu từng map (cố định, client 24/11)
  var MAP_DOAN = {
    thanh_truc_lam: { thuongNhan: [14, 10], bangKhu: [[10, 3], [15, 27]] },
    duoc_vien:      { thuongNhan: [12, 15], bangKhu: [[15, 4]] },
    bai_da_hang_gio:{ thuongNhan: [21, 12], bangKhu: [[5, 26], [18, 12]] },
  };
  // Bầy Xổng Chuồng: vị trí xuất hiện KHÔNG cố định trong client (server
  // quyết định) — tool tới map/khu rồi dùng Auto tìm quái quanh đó.
  var BAY = {
    // mục tiêu theo vai trò (traxanhnet = Hổ, traxanhnet2 = Ngưu)
    traxanhnet:  { loai: 'bach_ho_tuyet', ten: 'Bạch Hổ Tuyết', doRoi: 'Nanh Hổ' },
    traxanhnet2: { loai: 'xich_nhan_nguu', ten: 'Xích Nhãn Ngưu', doRoi: 'Ngưu Sừng' },
    tu_chon:     { loai: null, ten: 'Hổ/Ngưu (theo nhu cầu)', doRoi: 'Nanh/Ngưu' },
  };
  // Cổng đã xác minh (đi bộ, hạ cánh trước cổng — đang bay không qua được)
  // Cổng giữa các map — trích từ client 24/11 (MapData.portals) + nav.js
  // của Tool Tổng (fragments/nav.js). {x,y} = ô cổng cần đứng, {dx,dy} =
  // hướng giữ joystick để qua cổng. ⚠️ Cổng làng (22,4) → Miếu Ông
  // Trường Con CÓ trong MapData nhưng builder map XÓA lúc load (xác minh
  // 00:32 25/11) nên KHÔNG có trong bảng này — đi MTC bằng đường
  // làng → Bãi Đá (39,14) → (10,0) bắc.
  var CONG = {
    'duoc_vien>thanh_truc_lam': { x: 12, y: 0, dx: 0, dy: -1 },
    'thanh_truc_lam>tan_vien': { x: 7, y: 0, dx: 0, dy: -1 },
    'tan_vien>thanh_truc_lam': { x: 7, y: 29, dx: 0, dy: 1 },
    'thanh_truc_lam>duoc_vien': { x: 12, y: 29, dx: 0, dy: 1 },
    'tan_vien>bai_da_hang_gio': { x: 39, y: 14, dx: 1, dy: 0 },
    'bai_da_hang_gio>tan_vien': { x: 0, y: 27, dx: -1, dy: 0 },
    'bai_da_hang_gio>dong_mach_ngam': { x: 10, y: 0, dx: 0, dy: -1 },
    'dong_mach_ngam>bai_da_hang_gio': { x: 15, y: 25, dx: 0, dy: 1 },
    'tan_vien>mieu_hoang': { x: 2, y: 13, dx: -1, dy: 0 },
    'mieu_hoang>tan_vien': { x: 19, y: 6, dx: 1, dy: 0 },
    'mieu_hoang>phong_dia': { x: 1, y: 6, dx: -1, dy: 0 },
    'phong_dia>mieu_hoang': { x: 39, y: 14, dx: 1, dy: 0 },
    'duoc_vien>van_can': { x: 0, y: 20, dx: -1, dy: 0 },
    'van_can>duoc_vien': { x: 55, y: 13, dx: 1, dy: 0 },
  };
  // Đồ thị map — tool TỰ TÍNH chuỗi cổng từ map hiện tại tới map đích
  // bằng BFS trên đồ thị (không đi 1 đường cố định, không đoán đường).
  var MAP_GRAPH = (function () {
    var g = {};
    Object.keys(CONG).forEach(function (k) {
      var parts = k.split('>');
      (g[parts[0]] = g[parts[0]] || []).push(parts[1]);
    });
    return g;
  })();
  function timDuongMap(tuMap, toiMap) {
    if (tuMap === toiMap) return [];
    var prev = {}, q = [tuMap];
    prev[tuMap] = null;
    while (q.length) {
      var cur = q.shift();
      var ke = MAP_GRAPH[cur] || [];
      for (var i = 0; i < ke.length; i++) {
        if (prev.hasOwnProperty(ke[i])) continue;
        prev[ke[i]] = cur;
        if (ke[i] === toiMap) {
          var chuoi = [], m = toiMap;
          while (m !== tuMap) { chuoi.unshift(m); m = prev[m]; }
          return chuoi; // danh sách map cần qua (không gồm map xuất phát)
        }
        q.push(ke[i]);
      }
    }
    return null; // không có đường trong đồ thị — không đoán
  }
  // Map CHƯA có đường trong đồ thị (tool DỪNG + báo, không đoán đường):
  // long_uyen, hang_dong_co, mo_linh_thach, thung_lung,
  // bat_quai_thach_phan, thien_dao_khuyet, vuon_ca_nhan,
  // các map Huyết Xích / Đại Hội / Tam Lộ / Vạn Hoang.
  // Vị trí Bảng Khu từng map (điểm đứng để mở lưới chọn khu 1–40)
  var BANG_KHU = {
    thanh_truc_lam: [[10, 3], [15, 27]],
    duoc_vien: [[15, 4]],
    bai_da_hang_gio: [[5, 26], [18, 12]],
    tan_vien: [[17, 19]],
    mieu_hoang: [[16, 5]],
    phong_dia: [[35, 17]],
  };
  // Map ĐANG LÀM SỰ KIỆN KHÁC -> không chen ngang (chỉ báo)
  var MAP_CHAN = {
    rung_mang_xa: 'Huyết Xích Tầng 1', mach_dat_dong: 'Huyết Xích Tầng 2',
    dam_lay_boss: 'Huyết Xích Tầng 3', tam_lo: 'Tam Lộ', tam_ma: 'Tam Ma',
    van_hoang: 'Vạn Hoang', thien_dao_khuyet: 'Giao Long',
  };
  // Lưới đi được (fallback khi SceneWorld.map.blocked không có) — 5 map
  // thường dùng, 40x30, ô biên chặn TRỪ ô cổng (cổng phải đi được).
  var CLIENT_GROUND = (function () {
    var g = {};
    var congO = [[7, 29], [7, 0], [12, 29], [12, 0], [39, 14], [0, 27], [2, 13], [19, 6], [1, 6], [39, 14], [0, 20], [10, 0]];
    ['tan_vien', 'thanh_truc_lam', 'duoc_vien', 'bai_da_hang_gio', 'mieu_hoang', 'phong_dia'].forEach(function (m) {
      var grid = [];
      for (var y = 0; y < 30; y++) {
        var row = [];
        for (var x = 0; x < 40; x++) {
          var bien = (x === 0 || y === 0 || x === 39 || y === 29);
          var laCong = congO.some(function (c) { return c[0] === x && c[1] === y; });
          row.push(bien && !laCong);
        }
        grid.push(row);
      }
      g[m] = grid;
    });
    return g;
  })();

  /* ---------------- TRẠNG THÁI ---------------- */
  var on = false;                 // tool đang BẬT (nghe tin)
  var phien = 0;                // token phiên — tăng mỗi lần bật/tắt để hủy flow cũ đang chạy dở
  var phase = 'idle';             // idle|di_chuyen|doi_khu|quet_khu|danh|ve_farm
  var suKien = null;              // sự kiện đang săn {loai,map,khu,text,who}
  var hangDoi = [];               // sự kiện đang chờ (khi 2 sự kiện cùng lúc)
  var daXuLy = {};                // chống trùng tin: key -> timestamp
  var choDoanHet = 0;             // ms cuối cùng còn thấy đoàn/bầy
  var batDauDanh = 0;             // lúc bắt đầu đánh
  var daNhacRoi = false;          // đã nhắc đoàn sắp rời chưa
  var diemXuatPhat = null;        // snapshot trước khi đi sự kiện
  var tuiTruoc = null;            // túi trước sự kiện (để tính đồ nhận được)
  var demNgay = { thuongDoi: 0, xongChuong: 0, nanh: 0, nguu: 0, hiepNghia: 0, oanHon: 0 };
  var lichSu = [];                // lịch sử sự kiện (localStorage)
  try { lichSu = JSON.parse(localStorage.getItem('tt2d_sk_lich_su') || '[]'); } catch (e) { lichSu = []; }
  try {
    var _dn = JSON.parse(localStorage.getItem('tt2d_sk_ngay') || '{}');
    var _homNay = new Date().toISOString().slice(0, 10);
    if (_dn.ngay === _homNay) demNgay = _dn.dem;
  } catch (e) {}
  function luuDemNgay() {
    try {
      localStorage.setItem('tt2d_sk_ngay', JSON.stringify({
        ngay: new Date().toISOString().slice(0, 10), dem: demNgay,
      }));
    } catch (e) {}
  }
  function luuLichSu() {
    try { localStorage.setItem('tt2d_sk_lich_su', JSON.stringify(lichSu.slice(-30))); } catch (e) {}
  }

  /* ---------------- TIỆN ÍCH ---------------- */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function txt(el) { return el ? (el.textContent || '').trim() : ''; }
  function gioHien() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
  }
  function ns() { return window.__ns_ || null; }
  // Đếm túi: Inventory.count(id) -> fallback Inventory.bag[id]
  function demTui(id) {
    try {
      var n = ns();
      if (n && n.Inventory) {
        if (typeof n.Inventory.count === 'function') return n.Inventory.count(id) || 0;
        if (n.Inventory.bag && typeof n.Inventory.bag[id] === 'number') return n.Inventory.bag[id];
      }
    } catch (e) {}
    return 0;
  }
  function docTui() {
    return {
      nanh: demTui('nanh_ho'), nguu: demTui('nguu_sung'),
      hiepNghia: demTui('hiep_nghia_lenh'), oanHon: demTui('oan_hon'),
      quyPhien: demTui('hon_phien'),
    };
  }

  /* ---------------- BẢNG ĐIỀU KHIỂN (thu nhỏ được) ---------------- */
  var panel = null, panelLog = null, panelTrangThai = null, panelSuKien = null, collapsed = false;
  function capNhatPanel() {
    if (!panel) return;
    var tt = on ? 'BẬT' : 'TẮT';
    var ph = { idle: 'Nghe tin…', di_chuyen: 'Đang tới sự kiện', doi_khu: 'Đang đổi khu', quet_khu: 'Đang quét khu', danh: 'Đang đánh', ve_farm: 'Đang về farm' }[phase] || phase;
    var s = tt + ' · ' + ph;
    if (suKien) s += ' · ' + (suKien.loai === 'thuong_doi' ? 'Thương Đội' : 'Xổng Chuồng') + ' ' + (MAP_TEN_NGUOC[suKien.map] || suKien.map) + (suKien.khu ? ' Khu ' + suKien.khu : '');
    if (CFG.chiBao) s += ' · CHỈ BÁO';
    if (panelTrangThai) panelTrangThai.textContent = s;
    if (panelSuKien) {
      var ganNhat = lichSu.length ? lichSu[lichSu.length - 1] : null;
      var duDoan = duDoanLanSau();
      var tong = demNgay.thuongDoi + demNgay.xongChuong;
      panelSuKien.innerHTML =
        'Gần nhất: ' + (ganNhat ? (ganNhat.loai === 'thuong_doi' ? 'Thương Đội' : 'Xổng Chuồng') + ' ' + ganNhat.gio + ' · ' + (MAP_TEN_NGUOC[ganNhat.map] || ganNhat.map) + (ganNhat.khu ? ' K' + ganNhat.khu : '') : '—') +
        '<br>Lần sau (Xổng Chuồng): ' + duDoan +
        '<br>Hôm nay: ' + tong + ' đợt (TĐ ' + demNgay.thuongDoi + ' · XC ' + demNgay.xongChuong +
        ') · Nanh +' + demNgay.nanh + ' · Ngưu +' + demNgay.nguu + ' · HNL +' + demNgay.hiepNghia;
    }
    if (collapsed && panel) {
      var mini = $('#tt2d-sk-mini', panel);
      if (mini) mini.textContent = 'Săn SK · ' + s;
    }
  }
  function log(msg) {
    var line = gioHien() + ' — ' + msg;
    if (panelLog) {
      var d = document.createElement('div');
      d.textContent = line;
      panelLog.appendChild(d);
      while (panelLog.children.length > 40) panelLog.removeChild(panelLog.firstChild);
      panelLog.scrollTop = panelLog.scrollHeight;
    }
    if (window.console) console.log('[TT2D-SK] ' + line);
    capNhatPanel();
  }
  function duDoanLanSau() {
    // Xổng Chuồng: cứ vài giờ 1 đợt — lấy trung bình khoảng cách các lần trước
    var xc = lichSu.filter(function (e) { return e.loai === 'xong_chuong'; });
    if (xc.length < 2) return 'chưa đủ dữ liệu (cần ≥2 lần)';
    var tong = 0;
    for (var i = 1; i < xc.length; i++) tong += (xc[i].ts - xc[i - 1].ts);
    var tb = tong / (xc.length - 1); // ms trung bình
    var sau = new Date(xc[xc.length - 1].ts + tb);
    return '≈ ' + ('0' + sau.getHours()).slice(-2) + ':' + ('0' + sau.getMinutes()).slice(-2) +
      ' (TB ' + (tb / 3600000).toFixed(1) + 'h/lần — ước lượng, sự kiện ngẫu nhiên)';
  }
  function xayPanel() {
    if ($('#tt2d-sk-panel')) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-sk-panel';
    panel.style.cssText = 'position:fixed;right:10px;bottom:10px;width:248px;z-index:99999;' +
      'background:rgba(10,18,24,.92);color:#cfe8d8;font:12px/1.5 system-ui,sans-serif;' +
      'border:1px solid #3a6b52;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.5);overflow:hidden;';
    panel.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#123626;cursor:pointer;" id="tt2d-sk-head">' +
      '<b style="flex:1;">🎯 Săn Sự Kiện</b>' +
      '<button id="tt2d-sk-bat" style="background:#2e7d52;color:#fff;border:0;border-radius:4px;padding:2px 8px;cursor:pointer;">BẬT</button>' +
      '<button id="tt2d-sk-thu" title="Thu nhỏ" style="background:transparent;color:#cfe8d8;border:1px solid #3a6b52;border-radius:4px;padding:0 6px;cursor:pointer;">—</button>' +
      '</div>' +
      '<div id="tt2d-sk-body" style="padding:6px 8px;">' +
      '<div id="tt2d-sk-trangthai" style="font-weight:700;color:#8fe3ee;">TẮT · Nghe tin…</div>' +
      '<div id="tt2d-sk-sukien" style="color:#b9d9c6;font-size:11px;margin:2px 0 4px;"></div>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:4px 0;">' +
      '<label title="Vai trò acc (quyết định nhắm quái nào)">Vai: <select id="tt2d-sk-vaitro" style="background:#0a1810;color:#cfe8d8;border:1px solid #3a6b52;border-radius:4px;">' +
      '<option value="tu_chon">Tự chọn</option><option value="traxanhnet">traxanhnet (Hổ/N.Nhân)</option><option value="traxanhnet2">traxanhnet2 (Ngưu/T.Sư)</option>' +
      '</select></label>' +
      '<label title="Chỉ báo tin, không tự đi (khi Thanh chơi tay)"><input type="checkbox" id="tt2d-sk-chibao"> Chỉ báo</label>' +
      '</div>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:2px 0;">' +
      '<label title="Còn cần Nanh Hổ">Cần Nanh <input id="tt2d-sk-nanh" type="number" min="0" max="99" value="' + CFG.canNanh + '" style="width:38px;background:#0a1810;color:#cfe8d8;border:1px solid #3a6b52;border-radius:4px;"></label>' +
      '<label title="Còn cần Ngưu Sừng">Ngưu <input id="tt2d-sk-nguu" type="number" min="0" max="99" value="' + CFG.canNguu + '" style="width:38px;background:#0a1810;color:#cfe8d8;border:1px solid #3a6b52;border-radius:4px;"></label>' +
      '<label title="Còn cần Hiệp Nghĩa Lệnh">HNL <input id="tt2d-sk-hnl" type="number" min="0" max="99" value="' + CFG.canHiepNghia + '" style="width:38px;background:#0a1810;color:#cfe8d8;border:1px solid #3a6b52;border-radius:4px;"></label>' +
      '</div>' +
      '<div style="display:flex;gap:4px;margin:4px 0;">' +
      '<button id="tt2d-sk-tongket" style="flex:1;background:#1d4a33;color:#cfe8d8;border:1px solid #3a6b52;border-radius:4px;padding:2px;cursor:pointer;">📋 Tổng kết ngày</button>' +
      '</div>' +
      '<div id="tt2d-sk-log" style="max-height:120px;overflow-y:auto;font-size:11px;color:#9dc8ae;border-top:1px solid #234a37;padding-top:4px;"></div>' +
      '<div style="font-size:10px;color:#7fa892;margin-top:4px;">Thương Đội: hạ 2 Tiêu Sư → Thương Nhân. Ma Đạo KHÔNG đánh được Kiếp Tặc. Xổng Chuồng: chỉ last hit mới nhận đồ. Không chen Đại Hội/Huyết Xích.</div>' +
      '</div>' +
      '<div id="tt2d-sk-mini" style="display:none;padding:6px 8px;cursor:pointer;">Săn SK · TẮT</div>';
    document.body.appendChild(panel);
    panelLog = $('#tt2d-sk-log', panel);
    panelTrangThai = $('#tt2d-sk-trangthai', panel);
    panelSuKien = $('#tt2d-sk-sukien', panel);
    $('#tt2d-sk-bat', panel).addEventListener('click', function (e) {
      e.stopPropagation();
      if (on) dung(); else bat();
      this.textContent = on ? 'TẮT' : 'BẬT';
    });
    $('#tt2d-sk-thu', panel).addEventListener('click', function (e) { e.stopPropagation(); setCollapsed(true); });
    $('#tt2d-sk-mini', panel).addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-sk-vaitro', panel).addEventListener('change', function () {
      CFG.vaiTro = this.value; luuCfg();
      log('Vai trò: ' + this.value + (this.value === 'traxanhnet' ? ' → Hổ + Thương Nhân' : this.value === 'traxanhnet2' ? ' → Ngưu + Tiêu Sư' : ' → tự chọn theo nhu cầu'));
    });
    $('#tt2d-sk-chibao', panel).addEventListener('change', function () {
      CFG.chiBao = this.checked; luuCfg();
      log(CFG.chiBao ? 'Chế độ CHỈ BÁO — thấy tin chỉ log, không tự đi.' : 'Đã tắt chế độ chỉ báo — thấy tin sẽ tự đi.');
    });
    $('#tt2d-sk-nanh', panel).addEventListener('change', function () { CFG.canNanh = Math.max(0, +this.value || 0); luuCfg(); });
    $('#tt2d-sk-nguu', panel).addEventListener('change', function () { CFG.canNguu = Math.max(0, +this.value || 0); luuCfg(); });
    $('#tt2d-sk-hnl', panel).addEventListener('change', function () { CFG.canHiepNghia = Math.max(0, +this.value || 0); luuCfg(); });
    $('#tt2d-sk-tongket', panel).addEventListener('click', function () { tongKetNgay(); });
    // khôi phục giá trị đã lưu lên panel
    $('#tt2d-sk-vaitro', panel).value = CFG.vaiTro;
    $('#tt2d-sk-chibao', panel).checked = CFG.chiBao;
  }
  function setCollapsed(c) {
    collapsed = c;
    if (!panel) return;
    $('#tt2d-sk-body', panel).style.display = c ? 'none' : '';
    $('#tt2d-sk-head', panel).style.display = c ? 'none' : '';
    $('#tt2d-sk-mini', panel).style.display = c ? '' : 'none';
    capNhatPanel();
  }

  /* ---------------- ĐỌC VỊ TRÍ / MAP (SỬA LỖI: dùng KhuUI, không đọc body text) ---------------- */
  // ⚠️ LỖI CŨ (tool Thương Đội): docViTri đọc tên map từ body.innerText —
  // tin chat chứa "Thảo Dược Cốc" làm tool tưởng đã ở đúng map, bỏ qua
  // di chuyển. Bản này đọc map từ __ns_.KhuUI.mapId (game tự set khi qua
  // cổng), chỉ fallback body text khi không có __ns_, và loại trừ #thu-log
  // + panel của tool khỏi văn bản đọc.
  function bodyTextSach() {
    var t = document.body ? document.body.innerText || '' : '';
    var thuLog = $('#thu-log');
    if (thuLog) t = t.split(txt(thuLog)).join(' ');
    if (panelLog) t = t.split(txt(panelLog)).join(' ');
    return t;
  }
  function docViTri() {
    var n = ns(), x = null, y = null, map = null;
    // Ưu tiên 1: __ns_ (game thật luôn có)
    try {
      if (n && n.KhuUI && n.KhuUI.mapId) map = n.KhuUI.mapId;
      if (n && n.SceneWorld && n.SceneWorld.player) {
        var p = n.SceneWorld.player;
        if (typeof p.x === 'number' && typeof p.y === 'number') {
          x = Math.floor(p.x / 32); y = Math.floor(p.y / 32);
        }
      }
      if (n && n.SceneWorld && n.SceneWorld.map && n.SceneWorld.map.id && !map) map = n.SceneWorld.map.id;
    } catch (e) {}
    // Fallback: body text (đã loại tin chat + panel)
    if (x === null || y === null || !map) {
      var t = bodyTextSach();
      if (x === null) {
        var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (m) { x = +m[1]; y = +m[2]; }
      }
      if (!map) {
        if (/Hồ Tây/.test(t)) map = 'van_can';
        else if (/Thảo Dược Cốc/.test(t)) map = 'duoc_vien';
        else if (/Rừng Trúc/.test(t)) map = 'thanh_truc_lam';
        else if (/Bãi Đá/.test(t)) map = 'bai_da_hang_gio';
        else if (/Miếu Hoang/.test(t)) map = 'mieu_hoang';
        else if (/Phong Địa/.test(t)) map = 'phong_dia';
        else if (/Chân Núi Tản Viên|Tản Viên/.test(t)) map = 'tan_vien';
      }
    }
    return { x: x, y: y, map: map };
  }
  function docKhu() {
    var n = ns();
    try { if (n && n.KhuUI && typeof n.KhuUI.khu === 'number') return n.KhuUI.khu; } catch (e) {}
    var note = $('.khu-note');
    if (note) { var m = txt(note).match(/khu\s*(\d+)/i); if (m) return +m[1]; }
    var t = bodyTextSach();
    var m2 = t.match(/Đang ở khu\s*(\d+)/i);
    return m2 ? +m2[1] : null;
  }
  function docHP() {
    var n = ns();
    try {
      if (n && n.SceneWorld && n.SceneWorld.player) {
        var p = n.SceneWorld.player;
        if (typeof p.hp === 'number' && typeof p.hpMax === 'number' && p.hpMax > 0) return p.hp / p.hpMax;
      }
    } catch (e) {}
    return null;
  }

  /* ---------------- ĐỌC KÊNH THẾ GIỚI + PHÂN TÍCH TIN ---------------- */
  function docTinTheGioi() {
    var out = [];
    var banner = $('#world-chat-line');
    var bt = txt(banner);
    if (bt) out.push({ who: '', text: bt });
    var log = $('#thu-log');
    if (log) {
      $$('.chat-line.world', log).slice(-30).forEach(function (el) {
        var who = txt($('.chat-who', el)) || '';
        var tx = txt($('.chat-text', el)) || txt(el);
        if (tx) out.push({ who: who, text: tx });
      });
    }
    return out;
  }
  // Parse 1 tin -> {loai:'thuong_doi'|'xong_chuong', map, khu} hoặc null.
  // Dạng chữ tin là SERVER gửi (client không có mẫu sẵn) nên parse linh hoạt
  // theo từ khoá + tên map + số khu; không khớp đủ map thì bỏ qua.
  function phanTichTin(text, who) {
    if (!text) return null;
    var t = text;
    var loai = null;
    if (/Thương Đội|Thương Nhân|Tiêu Sư|Kiếp Tặc|thương đội|thương nhân|tiêu sư|kiếp tặc/i.test(t)) loai = 'thuong_doi';
    else if (/Xổng Chuồng|Yêu Thú| Xích Nhãn Ngưu|Bạch Hổ Tuyết|xổng chuồng|yêu thú|xích nhãn ngưu|bạch hổ tuyết/i.test(t)) loai = 'xong_chuong';
    if (!loai) return null;
    var map = null;
    for (var ten in MAP_TEN) if (t.indexOf(ten) !== -1) { map = MAP_TEN[ten]; break; }
    if (!map) return null; // có từ khoá nhưng không ghi map -> bỏ qua
    var khu = null;
    var m = t.match(/khu\s*(\d+)/i);
    if (m) khu = +m[1];
    if (loai === 'xong_chuong' && !khu) khu = 1; // quái bầy chỉ ở Khu 1 (khu1Only)
    return { loai: loai, map: map, khu: khu, text: t, who: who || '' };
  }
  // Chống trùng: cùng (loại,map,khu) trong 10 phút thì bỏ qua
  function daXuLyRoi(ev) {
    var key = ev.loai + '|' + ev.map + '|' + (ev.khu || 0);
    var now = Date.now();
    if (daXuLy[key] && now - daXuLy[key] < 10 * 60 * 1000) return true;
    daXuLy[key] = now;
    return false;
  }

  /* ---------------- ĐỌC ĐOÀN / BẦY / MỤC TIÊU ---------------- */
  function docDoan() {
    // Thương Đội còn không: Gateway.remotes (type thuong_nhan/tieu_su/kiep_tac)
    // — remotes có thể là dict theo id (game thật) hoặc array.
    var n = ns();
    var rem = [];
    try {
      if (n && n.Gateway && n.Gateway.remotes) {
        var r = n.Gateway.remotes;
        rem = Array.isArray(r) ? r : Object.values(r);
      }
    } catch (e) {}
    var doan = { thuongNhan: 0, tieuSu: 0, kiepTac: 0, viTri: null };
    rem.forEach(function (r) {
      var ty = r.type || r.loai || '';
      var co = r.thuongDoi || /thuong_nhan|tieu_su|kiep_tac/.test(ty);
      if (!co) return;
      if (ty === 'thuong_nhan' || ty.indexOf('thuong_nhan') !== -1) { doan.thuongNhan++; if (!doan.viTri) doan.viTri = { x: r.tx != null ? r.tx : Math.floor((r.x || 0) / 32), y: r.ty != null ? r.ty : Math.floor((r.y || 0) / 32) }; }
      else if (ty === 'tieu_su' || ty.indexOf('tieu_su') !== -1) doan.tieuSu++;
      else if (ty === 'kiep_tac' || ty.indexOf('kiep_tac') !== -1) doan.kiepTac++;
    });
    return doan;
  }
  function docBay() {
    // Bầy Xổng Chuồng còn bao nhiêu con (theo Gateway.remotes — dict hoặc array)
    var n = ns();
    var rem = [];
    try {
      if (n && n.Gateway && n.Gateway.remotes) {
        var r = n.Gateway.remotes;
        rem = Array.isArray(r) ? r : Object.values(r);
      }
    } catch (e) {}
    var bay = { nguu: 0, ho: 0, viTri: null };
    rem.forEach(function (r) {
      var ty = r.type || r.loai || '';
      if (ty === 'xich_nhan_nguu' || ty.indexOf('xich_nhan_nguu') !== -1) { bay.nguu++; if (!bay.viTri) bay.viTri = { x: r.tx != null ? r.tx : Math.floor((r.x || 0) / 32), y: r.ty != null ? r.ty : Math.floor((r.y || 0) / 32) }; }
      else if (ty === 'bach_ho_tuyet' || ty.indexOf('bach_ho_tuyet') !== -1) { bay.ho++; if (!bay.viTri) bay.viTri = { x: r.tx != null ? r.tx : Math.floor((r.x || 0) / 32), y: r.ty != null ? r.ty : Math.floor((r.y || 0) / 32) }; }
    });
    return bay;
  }
  function docMucTieu() {
    // Tên mục tiêu đang khóa + % máu (để tranh last hit)
    var ten = txt($('#target-name')) || txt($('.target-name'));
    var hp = null;
    var bar = $('#target-hp .hp-fill') || $('.target-hp-fill');
    if (bar && bar.style && bar.style.width) hp = parseFloat(bar.style.width) / 100;
    return { ten: ten, hp: hp };
  }

  /* ---------------- NÚT AUTO / PHI HÀNH / CHẠY / ƯU TIÊN ---------------- */
  function bamNut(el) {
    if (!el) return false;
    try {
      if (typeof el.click === 'function') el.click();
      else el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      return true;
    } catch (e) { return false; }
  }
  function nutDangBat(el) {
    if (!el) return false;
    return el.classList.contains('active') || el.classList.contains('on') || el.getAttribute('aria-pressed') === 'true';
  }
  function batAuto() { var b = $('#btn-auto') || $('#btn-auto-touch'); if (b && !nutDangBat(b)) bamNut(b); }
  function tatAuto() { var b = $('#btn-auto') || $('#btn-auto-touch'); if (b && nutDangBat(b)) bamNut(b); }
  function batPhiHanh() { var b = $('#btn-fly'); if (b && !nutDangBat(b)) bamNut(b); }
  function batChay() { var b = $('#btn-run'); if (b && !nutDangBat(b)) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); }
  function batBoBa() { batAuto(); batPhiHanh(); batChay(); }
  function datUuTien(uu) { // 'quai' | 'boss' | 'nhan_vat'
    var b = document.querySelector('[data-uu-tien="' + uu + '"]');
    if (b) bamNut(b);
  }
  function doiMucTieu() { var b = $('#btn-target'); if (b) bamNut(b); }

  /* ---------------- MODULE ĐIỀU HƯỚNG (tự tìm đường) ----------------
     Tái dùng module nav chung của Tool Tổng (fragments/nav.js) khi đã nạp
     (window.__TT2D_NAV__); chưa có thì dùng bản nhúng cùng giao diện
     trong file này. Giao diện: diToi(x,y) · quaCong(khoa) · diToiMap(map)
     · bfsPath · readWalkable · CONG — expose ở __TT2D_SK__.nav.
     - Trong 1 map: BFS trên lưới thật (SceneWorld.map.blocked; fallback
       CLIENT_GROUND) tìm đường ngắn nhất tới đích, tránh ô chặn; không
       đọc được lưới / không có đường BFS thì step_toward + đi vòng
       vuông góc khi kẹt (như fishing_go.py / huyet_xich_run.py).
     - Giữa các map: BFS trên đồ thị MAP_GRAPH (timDuongMap) để chọn
       chuỗi cổng ngắn nhất, rồi BFS tới từng cổng. Map không có trong
       đồ thị -> diToiMap trả false + log rõ, KHÔNG đoán đường. */
  function readWalkable() {
    try {
      var sw = ns() && ns().SceneWorld;
      var mp = sw && sw.map;
      if (mp && mp.blocked) {
        var w = mp.w || mp.width, h = mp.h || mp.height;
        if (w && h) return { w: w, h: h, blocked: mp.blocked, id: mp.id || null };
      }
    } catch (e) {}
    // Fallback: lưới CLIENT_GROUND (chỉ chặn ô biên) theo map hiện tại
    var p = docViTri();
    if (p.map && CLIENT_GROUND[p.map]) {
      return { w: 40, h: 30, blocked: CLIENT_GROUND[p.map], id: p.map };
    }
    return null;
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
    // Đích bị chặn -> tìm ô trống gần nhất trong bán kính 2.
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
  function joyHold(dx, dy, ms) {
    return new Promise(function (res) {
      var joy = $('#joystick');
      if (!joy) return res(false);
      var r = joy.getBoundingClientRect();
      if (!r.width || !r.height) return res(false);
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var ev = function (type, x, y) {
        joy.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 12345, isPrimary: true }));
      };
      ev('pointerdown', cx, cy);
      var steps = 4;
      for (var i = 1; i <= steps; i++) ev('pointermove', cx + dx * i / steps, cy + dy * i / steps);
      setTimeout(function () { ev('pointerup', cx + dx, cy + dy); res(true); }, ms);
    });
  }
  function joyHuong(dx, dy, ms) {
    if (Math.abs(dx) >= Math.abs(dy)) return joyHold(dx > 0 ? 40 : -40, 0, ms);
    return joyHold(0, dy > 0 ? 40 : -40, ms);
  }
  // Đi tới ô (tx,ty): ưu tiên BFS trên lưới thật; không có lưới / không có
  // đường BFS thì step_toward + đi vòng vuông góc khi kẹt.
  async function diToi(tx, ty, maxBuoc) {
    maxBuoc = maxBuoc || 120;
    var ph = phien; // hủy ngay nếu tool bị tắt/bật lại giữa chừng
    var vong = 0, last = null, ket = 0;
    for (var i = 0; i < maxBuoc; i++) {
      if (ph !== phien) return false;
      var p = docViTri();
      if (p.x === null) { await sleep(2000); continue; }
      if (Math.abs(p.x - tx) <= 1 && Math.abs(p.y - ty) <= 1) return true;
      // Thử BFS trên lưới thật mỗi nhịp (lưới có thể đổi khi quái di chuyển).
      var grid = readWalkable();
      if (grid) {
        var path = bfsPath(grid, p.x, p.y, tx, ty);
        if (path && path.length) {
          var next = path[0];
          await joyHuong(next[0] - p.x, next[1] - p.y, CFG.joyHoldMs);
          continue;
        }
      }
      // Không có lưới / không có đường BFS -> step_toward + đi vòng khi kẹt.
      if (last && last.x === p.x && last.y === p.y) {
        ket++;
        if (ket >= 3) {
          if (vong >= 4) return false;
          vong++;
          var dx = tx - p.x, dy = ty - p.y;
          var sx = (vong % 2 === 1) ? 1 : -1;
          if (Math.abs(dx) >= Math.abs(dy)) await joyHold(0, sx * 40, CFG.joyHoldMs);
          else await joyHold(sx * 40, 0, CFG.joyHoldMs);
          ket = 0;
          continue;
        }
      } else ket = 0;
      last = { x: p.x, y: p.y };
      await joyHuong(tx - p.x, ty - p.y, CFG.joyHoldMs);
    }
    return false;
  }
  async function quaCong(khoa) {
    var c = CONG[khoa];
    if (!c) return false;
    // Hạ cánh trước cổng (đang bay không qua được cổng) + tắt Auto
    var fly = $('#btn-fly');
    if (fly && nutDangBat(fly)) bamNut(fly);
    tatAuto();
    await sleep(400);
    var ok = await diToi(c.x, c.y, 120);
    if (!ok) { log('Không tới được cổng ' + khoa + ' (' + c.x + ',' + c.y + ').'); return false; }
    var mapCu = docViTri().map;
    for (var i = 0; i < CFG.portalTries; i++) {
      await joyHold(c.dx * 40, c.dy * 40, CFG.portalHoldMs);
      var p = docViTri();
      if (p.map && p.map !== mapCu) return true;
    }
    log('Qua cổng ' + khoa + ' thất bại sau ' + CFG.portalTries + ' lần.');
    return false;
  }
  // Tự tìm đường tới map đích: BFS đồ thị map -> chuỗi cổng ngắn nhất.
  async function diToiMap(mapDich) {
    var p = docViTri();
    if (p.map === mapDich) return true;
    if (!p.map) return false;
    var chuoi = timDuongMap(p.map, mapDich);
    if (!chuoi) { log('Không có đường từ ' + p.map + ' tới ' + mapDich + ' — DỪNG, không đoán đường.'); return false; }
    var cur = p.map;
    for (var i = 0; i < chuoi.length; i++) {
      var khoa = cur + '>' + chuoi[i];
      if (!await quaCong(khoa)) return false;
      await sleep(800);
      cur = chuoi[i];
    }
    return docViTri().map === mapDich;
  }
  // Tái dùng module nav chung của Tool Tổng nếu đã nạp; chưa có thì dùng
  // bản nhúng cùng giao diện trong file này.
  var NAV_EXT = (typeof window !== 'undefined' && window.__TT2D_NAV__) ? window.__TT2D_NAV__ : null;
  var navNguon = NAV_EXT ? 'Tool Tổng (__TT2D_NAV__)' : 'bản nhúng trong tool';
  if (NAV_EXT) {
    if (NAV_EXT.diToi) diToi = NAV_EXT.diToi;
    if (NAV_EXT.quaCong) quaCong = NAV_EXT.quaCong;
    if (NAV_EXT.diToiMap) diToiMap = NAV_EXT.diToiMap;
    if (NAV_EXT.bfsPath) bfsPath = NAV_EXT.bfsPath;
  }
  // Đổi khu bằng Bảng Khu (lưới chọn khu 1–40). Trả về true nếu đã ở khu đích.
  async function doiKhu(khuDich, mapHien) {
    var bang = BANG_KHU[mapHien] || (MAP_DOAN[mapHien] ? MAP_DOAN[mapHien].bangKhu : null);
    if (!bang) return false;
    for (var b = 0; b < bang.length; b++) {
      var toi = await diToi(bang[b][0], bang[b][1], 120);
      if (!toi) continue;
      // Bấm Space khi nút hiện đúng "Tương tác với Bảng Khu"
      var ok = false;
      for (var t = 0; t < 10; t++) {
        var nut = $$('button').find(function (el) { return /Bảng Khu/.test(txt(el)); });
        if (nut) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
          await sleep(800);
          var nutKhu = document.querySelector('.khu-grid [data-khu="' + khuDich + '"]');
          if (nutKhu) {
            bamNut(nutKhu);
            var cho = Date.now();
            while (Date.now() - cho < CFG.doiKhuChoMs) {
              if (docKhu() === khuDich) { ok = true; break; }
              await sleep(500);
            }
          }
          if (ok) return true;
          // đóng bảng rồi thử điểm đứng khác
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await sleep(500);
        } else await sleep(500);
      }
    }
    return false;
  }
  // Quét khu (Thương Đội không ghi khu): khu hiện tại -> 1..N, dừng khi thấy đoàn
  async function quetKhu(mapHien, toiDa) {
    var thu = [docKhu() || 1];
    for (var k = 1; k <= (toiDa || CFG.quetKhuToiDa); k++) if (thu.indexOf(k) === -1) thu.push(k);
    for (var i = 0; i < thu.length; i++) {
      var k = thu[i];
      if (k !== docKhu()) {
        if (!await doiKhu(k, mapHien)) continue;
      }
      await sleep(1500);
      var d = docDoan();
      if (d.thuongNhan > 0 || d.tieuSu > 0 || d.kiepTac > 0) {
        log('Tìm thấy đoàn ở ' + (MAP_TEN_NGUOC[mapHien] || mapHien) + ' Khu ' + k + '.');
        return k;
      }
    }
    return null;
  }

  /* ---------------- SNAPSHOT TRƯỚC KHI ĐI + VỀ FARM ---------------- */
  function chupSnapshot() {
    var p = docViTri();
    var duocDangChay = false, cauDangChay = false;
    try { duocDangChay = !!(window.__TT2D_DUOC__ && window.__TT2D_DUOC__.status && window.__TT2D_DUOC__.status().on); } catch (e) {}
    try { cauDangChay = !!(window.__TT2D_FISH__ && window.__TT2D_FISH__.status && window.__TT2D_FISH__.status().on); } catch (e) {}
    diemXuatPhat = {
      map: p.map, khu: docKhu(), x: p.x, y: p.y,
      autoBat: !!($('#btn-auto') && nutDangBat($('#btn-auto'))),
      duocDangChay: duocDangChay, cauDangChay: cauDangChay,
    };
    tuiTruoc = docTui();
    return diemXuatPhat;
  }
  async function veFarm() {
    if (!CFG.veFarmSauSuKien || !diemXuatPhat) return;
    var d = diemXuatPhat;
    log('Về chỗ farm cũ: ' + (MAP_TEN_NGUOC[d.map] || d.map) + (d.khu ? ' Khu ' + d.khu : '') + ' (' + d.x + ',' + d.y + ').');
    phase = 've_farm'; capNhatPanel();
    var p = docViTri();
    if (p.map && p.map !== d.map) {
      if (!await diToiMap(d.map)) { log('Không về được map cũ — ở lại đây farm tiếp.'); return; }
    }
    if (d.khu && docKhu() !== d.khu && BANG_KHU[d.map]) {
      await doiKhu(d.khu, d.map);
    }
    if (d.x !== null && d.y !== null) await diToi(d.x, d.y, 120);
    // Bật lại Auto + Phi Hành + Chạy như lúc trước
    batBoBa();
    // Bật lại tool dược / câu nếu lúc trước đang chạy
    try { if (d.duocDangChay && window.__TT2D_DUOC__ && window.__TT2D_DUOC__.start) { window.__TT2D_DUOC__.start(); log('Đã bật lại tool Dược.'); } } catch (e) {}
    try { if (d.cauDangChay && window.__TT2D_FISH__ && window.__TT2D_FISH__.start) { window.__TT2D_FISH__.start(); log('Đã bật lại tool Câu cá.'); } } catch (e) {}
    log('Đã về farm — Auto + Phi Hành + Chạy đã bật lại.');
  }

  /* ---------------- TỔNG KẾT ---------------- */
  function tongKetSuKien(ev, ketQua, nhanDuoc) {
    var t = docTui();
    var tang = {
      nanh: t.nanh - (tuiTruoc ? tuiTruoc.nanh : t.nanh),
      nguu: t.nguu - (tuiTruoc ? tuiTruoc.nguu : t.nguu),
      hiepNghia: t.hiepNghia - (tuiTruoc ? tuiTruoc.hiepNghia : t.hiepNghia),
      oanHon: t.oanHon - (tuiTruoc ? tuiTruoc.oanHon : t.oanHon),
    };
    if (ev.loai === 'thuong_doi') demNgay.thuongDoi++;
    else demNgay.xongChuong++;
    demNgay.nanh += Math.max(0, tang.nanh); demNgay.nguu += Math.max(0, tang.nguu);
    demNgay.hiepNghia += Math.max(0, tang.hiepNghia); demNgay.oanHon += Math.max(0, tang.oanHon);
    luuDemNgay();
    var ls = { loai: ev.loai, map: ev.map, khu: ev.khu, gio: gioHien(), ts: Date.now(), ketQua: ketQua, nhan: tang };
    lichSu.push(ls); luuLichSu();
    log('📋 TỔNG KẾT ' + (ev.loai === 'thuong_doi' ? 'Thương Đội' : 'Xổng Chuồng') + ' ' +
      (MAP_TEN_NGUOC[ev.map] || ev.map) + (ev.khu ? ' Khu ' + ev.khu : '') + ' — ' + ketQua +
      ' · Nhận được: Nanh +' + Math.max(0, tang.nanh) + ', Ngưu +' + Math.max(0, tang.nguu) +
      ', Hiệp Nghĩa Lệnh +' + Math.max(0, tang.hiepNghia) + ', Oan Hồn +' + Math.max(0, tang.oanHon) +
      (tang.nanh <= 0 && tang.nguu <= 0 && tang.hiepNghia <= 0 && tang.oanHon <= 0 ? ' (không rõ — đồ last hit, kiểm tra túi)' : ''));
    capNhatPanel();
  }
  function tongKetNgay() {
    var tong = demNgay.thuongDoi + demNgay.xongChuong;
    log('📋 TỔNG KẾT NGÀY: ' + tong + ' đợt (Thương Đội ' + demNgay.thuongDoi + ' · Xổng Chuồng ' + demNgay.xongChuong +
      ') · Nanh Hổ +' + demNgay.nanh + ' · Ngưu Sừng +' + demNgay.nguu +
      ' · Hiệp Nghĩa Lệnh +' + demNgay.hiepNghia + ' · Oan Hồn +' + demNgay.oanHon + '.');
    if (lichSu.length) {
      var gan = lichSu.slice(-5).map(function (e) {
        return (e.loai === 'thuong_doi' ? 'TĐ' : 'XC') + ' ' + e.gio + ' ' + (MAP_TEN_NGUOC[e.map] || e.map) + (e.khu ? ' K' + e.khu : '') + ' — ' + e.ketQua;
      }).join(' | ');
      log('Lịch sử gần nhất: ' + gan);
    }
    log('Dự đoán Xổng Chuồng lần sau: ' + duDoanLanSau() + '. Thương Đội: ngẫu nhiên, không dự đoán được.');
  }

  /* ---------------- CHỌN SỰ KIỆN + VAI TRÒ ---------------- */
  function chonSuKienUuTien() {
    if (!hangDoi.length) return null;
    var diem = function (ev) {
      if (ev.loai === 'xong_chuong') return (CFG.canNanh + CFG.canNguu > 0) ? 10 : 5;
      return CFG.canHiepNghia > 0 ? 10 : 5; // thuong_doi
    };
    var best = hangDoi[0], bd = diem(best);
    for (var i = 1; i < hangDoi.length; i++) {
      var d = diem(hangDoi[i]);
      if (d > bd) { best = hangDoi[i]; bd = d; }
    }
    return best;
  }
  // Mục tiêu bầy Xổng Chuồng theo vai trò acc
  function mucTieuBay() {
    if (CFG.vaiTro === 'traxanhnet') return BAY.traxanhnet;   // Hổ -> Nanh
    if (CFG.vaiTro === 'traxanhnet2') return BAY.traxanhnet2; // Ngưu -> Ngưu Sừng
    if (CFG.canNanh > 0 && CFG.canNguu <= 0) return BAY.traxanhnet;
    if (CFG.canNguu > 0 && CFG.canNanh <= 0) return BAY.traxanhnet2;
    return BAY.tu_chon; // loai null = đánh con nào cũng được
  }
  function ghiLichSuTin(ev, ketQua) {
    lichSu.push({ loai: ev.loai, map: ev.map, khu: ev.khu, gio: gioHien(), ts: Date.now(), ketQua: ketQua || 'chỉ báo' });
    luuLichSu();
    capNhatPanel();
  }

  /* ---------------- CHẠY 1 SỰ KIỆN ---------------- */
  async function batDauSuKien(ev) {
    var ph = phien; // hủy flow nếu tool bị tắt/bật lại giữa chừng
    var huy = function () { return !on || ph !== phien; };
    // Dọn dẹp khi bị hủy: CHỈ khi tool thật sự TẮT (on==false) mới tắt Auto
    // + reset phase. Nếu đã có flow mới chạy (phien mới, on==true) thì rút
    // lui im lặng — không được đụng vào state của flow mới.
    var huyVe = function () {
      if (!huy()) return false;
      if (!on) { tatAuto(); suKien = null; phase = 'idle'; capNhatPanel(); }
      return true;
    };
    var tenSK = ev.loai === 'thuong_doi' ? 'Thương Đội' : 'Xổng Chuồng';
    var tenMap = MAP_TEN_NGUOC[ev.map] || ev.map;
    log('📢 Thiên Đạo: ' + ev.text + ' → đi ' + tenMap + (ev.khu ? ' Khu ' + ev.khu : '') + '.');
    chupSnapshot();
    // (A4) Thương Đội: kiểm tra Quỷ Phiên trước khi đi
    if (ev.loai === 'thuong_doi') {
      var t = docTui();
      if (t.quyPhien === 0) log('⚠️ Túi KHÔNG có Quỷ Phiên (hon_phien) — hạ Thương Nhân/Tiêu Sư sẽ KHÔNG nhận được Oan Hồn. Vẫn đi săn Hiệp Nghĩa Lệnh.');
      else log('Đã mang Quỷ Phiên x' + t.quyPhien + ' — hạ đoàn sẽ nhận được Oan Hồn.');
    }
    var batDau = Date.now();
    // 1) Tới map sự kiện (tự tìm đường: BFS đồ thị map + BFS lưới trong map)
    phase = 'di_chuyen'; capNhatPanel();
    if (!await diToiMap(ev.map)) {
      if (huyVe()) return;
      log('Không tới được ' + tenMap + ' — bỏ đợt này, chờ tin mới.');
      suKien = null; phase = 'idle'; capNhatPanel();
      return;
    }
    if (huyVe()) return;
    // 2) Đổi khu
    if (ev.khu && docKhu() !== ev.khu) {
      phase = 'doi_khu'; capNhatPanel();
      var doiDuoc = await doiKhu(ev.khu, ev.map);
      if (!doiDuoc) {
        if (ev.loai === 'thuong_doi') {
          log('Không đổi được sang khu ' + ev.khu + ' — thử quét khu tìm đoàn.');
          phase = 'quet_khu'; capNhatPanel();
          var thay = await quetKhu(ev.map, CFG.quetKhuToiDa);
          if (thay === null) {
            log('Quét ' + CFG.quetKhuToiDa + ' khu không thấy đoàn — bỏ đợt này.');
            suKien = null; phase = 'idle'; capNhatPanel();
            return;
          }
          ev.khu = thay;
        } else {
          log('Không đổi được sang khu ' + ev.khu + ' — bỏ đợt này.');
          suKien = null; phase = 'idle'; capNhatPanel();
          return;
        }
      } else {
        log('Đã tới ' + tenMap + ' Khu ' + ev.khu + '.');
      }
    }
    if (!ev.khu && ev.loai === 'thuong_doi') {
      // Thương Đội không ghi khu: quét khu tìm đoàn
      phase = 'quet_khu'; capNhatPanel();
      var thay2 = await quetKhu(ev.map, CFG.quetKhuToiDa);
      if (thay2 === null) {
        log('Quét ' + CFG.quetKhuToiDa + ' khu không thấy đoàn — bỏ đợt này.');
        suKien = null; phase = 'idle'; capNhatPanel();
        return;
      }
      ev.khu = thay2;
    }
    if (Date.now() - batDau > CFG.diChuyenTimeoutMs) {
      log('Di chuyển quá ' + Math.round(CFG.diChuyenTimeoutMs / 60000) + ' phút chưa tới nơi — bỏ đợt này.');
      suKien = null; phase = 'idle'; capNhatPanel();
      return;
    }
    if (huyVe()) return;
    // 3) Tới vị trí đoàn/bầy + bật Auto + Phi Hành + Chạy + ưu tiên Quái
    phase = 'danh'; capNhatPanel();
    batDauDanh = Date.now(); choDoanHet = Date.now(); daNhacRoi = false;
    if (ev.loai === 'thuong_doi') {
      var tn = MAP_DOAN[ev.map] ? MAP_DOAN[ev.map].thuongNhan : null;
      if (tn) {
        var toiTN = await diToi(tn[0], tn[1], 120);
        if (!toiTN) log('Không tới sát Thương Nhân (' + tn[0] + ',' + tn[1] + ') — đứng đây đánh, Auto sẽ tự tìm.');
      }
    } else {
      // Xổng Chuồng: bầy xuất hiện 20 giây sau tin — chờ bầy hiện rồi tới gần
      var bay0 = docBay();
      if (bay0.viTri) await diToi(bay0.viTri.x, bay0.viTri.y, 120);
      else log('Bầy chưa hiện (20 giây sau tin mới hiện) — đứng chờ, Auto sẽ tự tìm khi bầy ra.');
    }
    if (huyVe()) return;
    datUuTien('quai');
    batBoBa();
    log('Đã tới nơi — Auto + Phi Hành + Chạy BẬT, ưu tiên Quái.' +
      (ev.loai === 'xong_chuong' ? ' Mục tiêu: ' + mucTieuBay().ten + ' (' + mucTieuBay().doRoi + ').' :
        CFG.vaiTro === 'traxanhnet' ? ' Vai trò: Thương Nhân (sau khi 2 Tiêu Sư hạ).' :
        CFG.vaiTro === 'traxanhnet2' ? ' Vai trò: Tiêu Sư + Kiếp Tặc (Ma Đạo không đánh được Kiếp Tặc).' :
        ' Vai trò: tự chọn theo nhu cầu.'));
    // 4) Giám sát trận đánh
    var ketQua = await giamSatDanh(ev, ph);
    if (huyVe()) return;
    // 5) Tổng kết + về farm
    tatAuto();
    tongKetSuKien(ev, ketQua);
    if (on && CFG.veFarmSauSuKien) await veFarm();
    suKien = null; phase = 'idle'; capNhatPanel();
  }

  /* ---------------- GIÁM SÁT TRẬN ĐÁNH ---------------- */
  async function giamSatDanh(ev, ph) {
    var mucTieu = ev.loai === 'xong_chuong' ? mucTieuBay() : null;
    var doiMucTieuThu = 0, daBaoKiepTac = false;
    while (on && ph === phien) {
      await sleep(2000);
      if (!on || ph !== phien) break;
      // HP thấp -> tắt Auto chờ hồi (tránh chết giữa trận)
      var hp = docHP();
      if (hp !== null && hp < 0.3) {
        log('HP còn ' + Math.round(hp * 100) + '% — tắt Auto chờ hồi.');
        tatAuto();
        var choHoi = Date.now();
        while (on && ph === phien && Date.now() - choHoi < 30000) {
          await sleep(2000);
          var hp2 = docHP();
          if (hp2 !== null && hp2 > 0.6) break;
        }
        if (on && ph === phien) { batBoBa(); log('HP đã hồi — đánh tiếp.'); }
        continue;
      }
      // Phi Hành tự tắt khi Auto giao chiến -> bật lại
      var fly = $('#btn-fly');
      if (fly && !nutDangBat(fly)) batPhiHanh();
      var auto = $('#btn-auto') || $('#btn-auto-touch');
      if (auto && !nutDangBat(auto)) batAuto();
      // Đoàn/bầy còn không?
      var con = false, conMucTieu = false;
      if (ev.loai === 'thuong_doi') {
        var d = docDoan();
        con = (d.thuongNhan > 0 || d.tieuSu > 0 || d.kiepTac > 0);
        conMucTieu = con;
        if (CFG.vaiTro === 'traxanhnet2' && d.kiepTac > 0 && !daBaoKiepTac) {
          daBaoKiepTac = true;
          log('Thấy Kiếp Tặc — acc Ma Đạo KHÔNG đánh được Kiếp Tặc (client chặn), chỉ đánh Tiêu Sư/Thương Nhân. Hiệp Nghĩa Lệnh cần acc Chính Đạo.');
        }
        // Vai trò traxanhnet: chờ 2 Tiêu Sư hạ rồi mới tới Thương Nhân
        if (CFG.vaiTro === 'traxanhnet' && d.tieuSu === 0 && d.thuongNhan > 0) {
          var tn = MAP_DOAN[ev.map] ? MAP_DOAN[ev.map].thuongNhan : null;
          if (tn) { var p = docViTri(); if (p.x !== null && (Math.abs(p.x - tn[0]) > 2 || Math.abs(p.y - tn[1]) > 2)) await diToi(tn[0], tn[1], 60); }
        }
      } else {
        var b = docBay();
        con = (b.nguu > 0 || b.ho > 0);
        if (mucTieu && mucTieu.loai) {
          conMucTieu = mucTieu.loai === 'bach_ho_tuyet' ? b.ho > 0 : b.nguu > 0;
        } else conMucTieu = con;
        // (B3) Tranh last hit: giữ mục tiêu đúng loại vai trò, dồn damage
        if (mucTieu && mucTieu.loai && conMucTieu) {
          var mt = docMucTieu();
          var tenCan = mucTieu.loai === 'bach_ho_tuyet' ? 'Bạch Hổ Tuyết' : 'Xích Nhãn Ngưu';
          var tenKia = mucTieu.loai === 'bach_ho_tuyet' ? 'Xích Nhãn Ngưu' : 'Bạch Hổ Tuyết';
          if (mt.ten && mt.ten.indexOf(tenKia) !== -1 && doiMucTieuThu < 6) {
            doiMucTieuThu++;
            doiMucTieu(); // đổi mục tiêu sang con đúng loại
            if (doiMucTieuThu === 6) log('Đã đổi mục tiêu 6 lần vẫn chưa khóa được ' + tenCan + ' — để Auto tự đánh.');
          } else if (mt.ten && mt.ten.indexOf(tenCan) !== -1) {
            doiMucTieuThu = 0; // đã khóa đúng mục tiêu
          }
          // Tới gần bầy nếu còn xa (để dồn damage khi quái gần chết)
          if (b.viTri) {
            var p2 = docViTri();
            if (p2.x !== null && (Math.abs(p2.x - b.viTri.x) > 4 || Math.abs(p2.y - b.viTri.y) > 4)) await diToi(b.viTri.x, b.viTri.y, 60);
          }
        }
      }
      if (con) choDoanHet = Date.now();
      else if (Date.now() - choDoanHet > CFG.doanHetSauMs) {
        if (ev.loai === 'thuong_doi') return 'đoàn đã hết / rời map';
        return 'bầy đã hạ hết';
      }
      // Đoàn còn sau 5 phút -> nhắc sắp rời (Thương Đội rời sau vài phút nếu không ai đụng)
      if (!daNhacRoi && Date.now() - batDauDanh > CFG.doanRoiSauMs) {
        daNhacRoi = true;
        log('⚠️ Đoàn/bầy còn sau 5 phút — Thương Đội sẽ rời map sau vài phút nếu không ai đụng; Xổng Chuồng ở lại tới khi bầy hạ hết.');
      }
      // Hết vai trò (quái của mình đã hết) -> xong phần mình
      if (con && !conMucTieu) {
        if (ev.loai === 'xong_chuong') return 'quái vai trò (' + mucTieu.ten + ') đã hết';
        return 'đoàn đã hết';
      }
      // Quá 15 phút đánh 1 đợt -> dừng (tránh kẹt)
      if (Date.now() - batDauDanh > 15 * 60 * 1000) return 'hết 15 phút — dừng';
    }
    return 'tool tắt giữa chừng';
  }

  /* ---------------- VÒNG LẶP CHÍNH (canh kênh Thế Giới) ---------------- */
  async function vongLap(ph) {
    while (on && ph === phien) {
      try {
        if (phase === 'idle') {
          var tins = docTinTheGioi();
          for (var i = 0; i < tins.length; i++) {
            var ev = phanTichTin(tins[i].text, tins[i].who);
            if (!ev) continue;
            if (daXuLyRoi(ev)) continue;
            if (CFG.chiBao) {
              log('📢 ' + (ev.who || 'Thiên Đạo') + ': ' + ev.text + ' (chế độ CHỈ BÁO — không tự đi)');
              ghiLichSuTin(ev, 'chỉ báo');
              continue;
            }
            var p0 = docViTri();
            if (p0.map && MAP_CHAN[p0.map]) {
              log('📢 ' + ev.text + ' — đang làm ' + MAP_CHAN[p0.map] + ', KHÔNG chen ngang (chỉ báo).');
              ghiLichSuTin(ev, 'chỉ báo — đang ' + MAP_CHAN[p0.map]);
              continue;
            }
            hangDoi.push(ev);
            log('📢 Phát hiện: ' + ev.text);
          }
          if (hangDoi.length) {
            var chon = chonSuKienUuTien();
            if (chon) {
              hangDoi = hangDoi.filter(function (e) { return e !== chon; });
              suKien = chon;
              await batDauSuKien(suKien);
            }
          }
        }
      } catch (e) {
        log('Lỗi vòng lặp: ' + (e && e.message));
      }
      await sleep(CFG.pollMs);
    }
  }
  function bat() {
    if (on) return;
    phien++; // hủy mọi flow/vòng lặp của phiên cũ
    on = true;
    xayPanel();
    var nut = $('#tt2d-sk-bat');
    if (nut) nut.textContent = 'TẮT';
    log('Tool BẬT — đang nghe kênh Thế Giới chờ Thương Đội + Xổng Chuồng. (Nav: ' + navNguon + ')');
    log('Vai trò: ' + CFG.vaiTro + (CFG.chiBao ? ' · CHỈ BÁO (không tự đi)' : '') +
      ' · Cần: Nanh ' + CFG.canNanh + ' / Ngưu ' + CFG.canNguu + ' / HNL ' + CFG.canHiepNghia);
    var t = docTui();
    if (t.quyPhien === 0) log('⚠️ Túi KHÔNG có Quỷ Phiên — hạ Thương Nhân/Tiêu Sư sẽ không nhận được Oan Hồn.');
    capNhatPanel();
    vongLap(phien);
  }
  function dung() {
    phien++; // hủy flow sự kiện + vòng lặp đang chạy dở
    on = false;
    phase = 'idle'; suKien = null; hangDoi = [];
    tatAuto();
    var nut = $('#tt2d-sk-bat');
    if (nut) nut.textContent = 'BẬT';
    log('Tool TẮT.');
    capNhatPanel();
  }

  /* ---------------- DEBUG HANDLE + KHỞI TẠO ---------------- */
  window.__TT2D_SK__ = {
    status: function () {
      var p = docViTri();
      return {
        on: on, phase: phase, mucTieu: suKien, hangDoi: hangDoi.length,
        x: p.x, y: p.y, map: p.map, khu: docKhu(),
        vaiTro: CFG.vaiTro, chiBao: CFG.chiBao, nav: navNguon,
        demNgay: demNgay, lichSu: lichSu.slice(-5),
        trangThai: (on ? 'BẬT' : 'TẮT') + ' · ' + phase,
      };
    },
    start: bat, stop: dung,
    setCollapsed: setCollapsed,
    parse: phanTichTin,
    setRole: function (r) { CFG.vaiTro = r; luuCfg(); log('Vai trò: ' + r); },
    setChiBao: function (b) { CFG.chiBao = !!b; luuCfg(); log(b ? 'Chế độ CHỈ BÁO.' : 'Đã tắt chế độ chỉ báo.'); },
    setCan: function (nanh, nguu, hnl) {
      if (nanh != null) CFG.canNanh = Math.max(0, nanh | 0);
      if (nguu != null) CFG.canNguu = Math.max(0, nguu | 0);
      if (hnl != null) CFG.canHiepNghia = Math.max(0, hnl | 0);
      luuCfg();
    },
    tongKet: tongKetNgay,
    timDuongMap: timDuongMap,
    _cfg: CFG,
    nav: {
      docViTri: docViTri, readWalkable: readWalkable, bfsPath: bfsPath,
      joyHold: joyHold, joyHuong: joyHuong, diToi: diToi,
      quaCong: quaCong, diToiMap: diToiMap, timDuongMap: timDuongMap, CONG: CONG,
    },
  };
  xayPanel();
  log('Tool Săn Sự Kiện đã nạp. Bấm BẬT để nghe kênh Thế Giới.');
  log('Nav: ' + navNguon + ' · Đồ thị map: ' + Object.keys(MAP_GRAPH).sort().join(', ') +
    ' · Map chưa có đường: long_uyen, hang_dong_co, mo_linh_thach, thung_lung, bat_quai, thien_dao_khuyet, vuon_ca_nhan (tool sẽ DỪNG + báo).');
  capNhatPanel();
})();
