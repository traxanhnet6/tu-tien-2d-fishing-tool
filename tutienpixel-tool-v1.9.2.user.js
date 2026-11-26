// ==UserScript==
// @name         Tool Tu Tiên Pixel — Tự đi farm + Việc Dược Công
// @namespace    tutienpixel-tool
// @version      1.9.2
// @description  Chọn map + điểm đến (cụm quái/NPC/bảng khu/boss) → tự Chạy + Phi Hành qua cổng → Auto + Chạy + Phi Hành farm (bật/tắt có kiểm chứng trạng thái thật); đồ thị cổng + lưới ô chặn lấy theo trạng thái SAU sửa đổi lúc chạy của client (cổng vào Miếu Ông Trường Con ở Bãi Đá); tìm đường A* trong map tránh núi/vật cản, không men theo rìa map, kẹt thì đánh dấu ô chặn tạm tính lại đường; mỗi map có 1 điểm neo — qua cổng vào map là tới điểm neo trước; Đi farm: tắt Auto suốt đường đi, tới điểm farm mới bật cả 3; map không có cổng vào thì đi tới map gần nhất + gợi ý NPC; chọn khu qua bảng khu (đứng cạnh bảng + bấm Tương Tác, kiểm chứng mở lại); vòng Việc Dược Công đúng trình tự game (đứng cạnh Đại Phu → bấm Tương Tác nhận việc → đứng cạnh điểm thu thập bấm Tương Tác → về giao + kiểm chứng Dược Công tăng); tự động câu cá ở Thảo Dược Cốc; Huyết Xích Cấm Địa: tới Miếu Hoang gặp Nữ Tu Trông Miếu đăng ký (100 Linh Thạch/người, tính 1 lượt/ngày) → vào cụm 3 map tự Auto đánh quái, quét sạch khu mở cấm chế rồi thu hoạch nguyên liệu (Bích Ngọc Cổ Mộc/Trấn Thần Thạch/Địa Linh Hóa Quả/Trúc Cơ Thảo). Tự dò cách lái (phím/joystick/dpad/chạm neo camera) bằng sự kiện tổng hợp, không gọi hàm nội bộ của game.
// @author       Muse (cho Bui)
// v1.9.1 (26/11): port 2 sửa từ Đi Farm/Dược v1.2.1 — (1) kiểm chứng bay bằng tốc độ TÍCH LŨY ngưỡng 5 ô/s (cũ: đo 1 đợt ngưỡng 3, không bao giờ bấm lại vì chạy thường đã 3,51); (2) vá Element.prototype.setPointerCapture (try/catch) trước khi lái joystick giả. Không thêm phần đăng nhập — file gốc không có code đăng nhập nào.
// v1.9.2 (26/11): thêm panel chọn acc farm ở màn hình đăng nhập — bấm tên acc để điền ô Đạo hiệu (#auth-name), sửa lỗi dịch vụ đăng nhập chỉ lưu 1 acc 'Traxanhnet' nên mở acc khác vẫn điền nhầm; KHÔNG lưu/chạm mật khẩu, KHÔNG tự bấm Đăng nhập (#auth-submit) — anh vẫn tự nhập mật khẩu + bấm nút của game. Chỉ nhớ TÊN acc đã chọn (localStorage 'ttpx_login_acc') để lần sau điền sẵn.
// @match        https://tutienpixel.online/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ---- Vá setPointerCapture (CHẠY ĐẦU TIÊN, port từ Đi Farm v1.1.0/v1.2.1) ----
  // Game gọi el.setPointerCapture(pointerId) KHÔNG try/catch trong handler
  // joystick/dpad. PointerEvent giả (pointerId tự đặt) làm Chrome throw
  // NotFoundError -> handler dừng giữa chừng, joystick không kéo được.
  // Vá: giữ nguyên hàm gốc, bọc try/catch nuốt lỗi (hành vi thật không đổi).
  (function patchPointerCapture() {
    try {
      var proto = Element.prototype;
      if (proto.setPointerCapture && proto.setPointerCapture.__TT2D_V191_PATCHED__) return;
      var origCap = proto.setPointerCapture;
      var origRel = proto.releasePointerCapture;
      if (typeof origCap === 'function') {
        proto.setPointerCapture = function (pid) { try { return origCap.call(this, pid); } catch (e) { return; } };
        proto.setPointerCapture.__TT2D_V191_PATCHED__ = true;
      }
      if (typeof origRel === 'function') {
        proto.releasePointerCapture = function (pid) { try { return origRel.call(this, pid); } catch (e) { return; } };
        proto.releasePointerCapture.__TT2D_V191_PATCHED__ = true;
      }
    } catch (e) {}
  })();

  // ============ Dữ liệu map nhúng (20 map, cổng + lưới theo trạng thái SAU sửa đổi lúc chạy) ============
  // Cổng/lưới trích bằng cách chạy toàn bộ module MapData của client trong Node (extract-runtime.mjs):
  // game sửa map lúc chạy (push cổng Bãi Đá→Miếu, xóa cổng Tản Viên→Miếu, cổng Tản Viên→Bãi Đá...) nên
  // dữ liệu tĩnh trong mã nguồn KHÔNG dùng được. Mỗi map: name/w/h/spawn/anchor (điểm neo: ô trống kề
  // NPC chính, không có NPC thì điểm trống mở nhất — đã kiểm chứng không chặn ở cả lưới walk lẫn fly)/
  // anchorLabel/enemies/farm/farmCluster/monsterPoints/bossBoards/npcs/signs/portals (cổng runtime).
  var MAPS = {
  tan_vien:{name:"Chân Núi Tản Viên",w:40,h:30,spawn:[8,26],anchor:[11,21],anchorLabel:"cạnh NPC Vạn Bảo Phường",enemies:null,farm:null,farmCluster:null,monsterPoints:[],bossBoards:[],npcs:[{id:"tho_ren",name:"Thợ Rèn",tx:15,ty:18},{id:"van_bao_phuong",name:"Vạn Bảo Phường",tx:12,ty:22},{id:"dau_gia_cac",name:"Đấu Giá Các",tx:31,ty:20},{id:"ba_hang_com",name:"Hồng Tỷ",tx:8,ty:18},{id:"su_phu",name:"Thầy Ông Nội",tx:9,ty:10},{id:"chap_su_dai_hoi",name:"Chấp Sự Đại Hội",tx:20,ty:11},{id:"tang_kinh_lao_nhan",name:"Tàng Kinh Lão Nhân",tx:11,ty:12}],signs:[[17,19]],portals:[{tx:7,ty:29,to:"thanh_truc_lam"},{tx:8,ty:29,to:"thanh_truc_lam"},{tx:0,ty:12,to:"mieu_hoang"},{tx:0,ty:13,to:"mieu_hoang"},{tx:39,ty:14,to:"bai_da_hang_gio"},{tx:39,ty:15,to:"bai_da_hang_gio"}]},
  thanh_truc_lam:{name:"Rừng Trúc",w:40,h:30,spawn:[7,2],anchor:[9,13],anchorLabel:"cạnh NPC Huấn Sư Huynh",enemies:26,farm:[20,15],farmCluster:{tx:13,ty:9,count:8,name:"Bọ Ngựa"},monsterPoints:[{name:"Bọ Ngựa",tx:5,ty:6,boss:false},{name:"Sơn Chuột",tx:16,ty:3,boss:false},{name:"tieu_phu",tx:12,ty:18,boss:false},{name:"thuong_nhan",tx:14,ty:10,boss:false},{name:"Tiêu Sư",tx:13,ty:10,boss:false},{name:"son_tac",tx:31,ty:14,boss:false},{name:"Kiếp Tặc",tx:13,ty:12,boss:false}],bossBoards:[{tx:37,ty:12,bossMap:"long_uyen"}],npcs:[{id:"ly_thanh",name:"Huấn Sư Huynh",tx:10,ty:14}],signs:[[10,3],[15,27]],portals:[{tx:7,ty:0,to:"tan_vien"},{tx:8,ty:0,to:"tan_vien"},{tx:12,ty:29,to:"duoc_vien"},{tx:13,ty:29,to:"duoc_vien"},{tx:39,ty:13,to:"long_uyen"},{tx:39,ty:14,to:"long_uyen"}]},
  duoc_vien:{name:"Thảo Dược Cốc",w:40,h:30,spawn:[12,2],anchor:[13,7],anchorLabel:"cạnh NPC Đại Phu",enemies:14,farm:[20,15],farmCluster:{tx:12,ty:15,count:7,name:"thuong_nhan"},monsterPoints:[{name:"Độc Đằng Yêu",tx:20,ty:5,boss:false},{name:"nong_phu",tx:14,ty:12,boss:false},{name:"thuong_nhan",tx:12,ty:15,boss:false},{name:"Tiêu Sư",tx:11,ty:15,boss:false},{name:"son_tac",tx:23,ty:12,boss:false},{name:"Kiếp Tặc",tx:11,ty:17,boss:false}],bossBoards:[],npcs:[{id:"dai_phu",name:"Đại Phu",tx:14,ty:8}],signs:[[15,4]],portals:[{tx:12,ty:0,to:"thanh_truc_lam"},{tx:13,ty:0,to:"thanh_truc_lam"},{tx:11,ty:6,to:"vuon_ca_nhan"},{tx:11,ty:7,to:"vuon_ca_nhan"},{tx:0,ty:20,to:"van_can"},{tx:0,ty:21,to:"van_can"}],fishing:[{id:"ho_bich_thuy_cong",name:"Đài câu cá (Hồ Bích Thuỷ)",tx:18,ty:14,propTx:18,propTy:16},{id:"suoi_duoc_coc",name:"Suối Dẫn Thuỷ",tx:32,ty:12,propTx:32,propTy:12}]},
  hang_dong_co:{name:"Hang Động",w:30,h:20,spawn:[14,16],anchor:[14,16],anchorLabel:"điểm trống",enemies:16,farm:[15,10],farmCluster:{tx:10,ty:6,count:7,name:"Thạch Yêu"},monsterPoints:[{name:"Thạch Giáp Yêu · Nhất Giai Thượng Phẩm",tx:14,ty:8,boss:false},{name:"Thạch Yêu",tx:10,ty:6,boss:false}],bossBoards:[],npcs:[],signs:[[11,17]],portals:[{tx:14,ty:19,to:"long_uyen"},{tx:15,ty:19,to:"long_uyen"}]},
  dong_mach_ngam:{name:"Miếu Ông Trường Con",w:30,h:26,spawn:[15,22],anchor:[19,13],anchorLabel:"cạnh NPC Thủ Điện Sỹ Sách",enemies:0,farm:null,farmCluster:null,monsterPoints:[],bossBoards:[],npcs:[{id:"ong_tu_mieu",name:"Ông Từ Giữ Miếu",tx:9,ty:14},{id:"hu_thien_cuc_lac",name:"Thủ Điện Sỹ Sách",tx:20,ty:14}],signs:[[11,22]],portals:[{tx:14,ty:25,to:"bai_da_hang_gio"},{tx:15,ty:25,to:"bai_da_hang_gio"},{tx:16,ty:25,to:"bai_da_hang_gio"}]},
  vuon_ca_nhan:{name:"Vườn Cá Nhân",w:18,h:13,spawn:[8,10],anchor:[8,10],anchorLabel:"điểm trống",enemies:2,farm:null,farmCluster:{tx:9,ty:2,count:2,name:"Dược Linh Thú"},monsterPoints:[{name:"Dược Linh Thú",tx:9,ty:2,boss:false}],bossBoards:[],npcs:[],signs:[],portals:[{tx:8,ty:12,to:"duoc_vien"},{tx:9,ty:12,to:"duoc_vien"}]},
  mieu_hoang:{name:"Miếu Hoang",w:20,h:14,spawn:[18,6],anchor:[11,5],anchorLabel:"cạnh NPC Nữ Tu Trông Miếu",enemies:4,farm:[10,7],farmCluster:{tx:16,ty:8,count:2,name:"Yêu Quái · Nhất Giai Hạ Phẩm"},monsterPoints:[{name:"Yêu Quái · Nhất Giai Hạ Phẩm",tx:12,ty:3,boss:false}],bossBoards:[],npcs:[{id:"nu_tu_mieu_hoang",name:"Nữ Tu Trông Miếu",tx:12,ty:6}],signs:[[16,5]],portals:[{tx:19,ty:6,to:"tan_vien"},{tx:19,ty:7,to:"tan_vien"},{tx:0,ty:6,to:"phong_dia"},{tx:0,ty:7,to:"phong_dia"}]},
  rung_mang_xa:{name:"Vùng Ngoại Vi — Rừng Mãng Xà",w:40,h:30,spawn:[18,26],anchor:[18,26],anchorLabel:"điểm trống",enemies:8,farm:null,farmCluster:{tx:14,ty:5,count:1,name:"Xích Tinh Mãng"},monsterPoints:[{name:"Xích Mãng Vương · Yêu Thú Cấp 2",tx:19,ty:6,boss:true},{name:"Xích Tinh Mãng",tx:14,ty:5,boss:false}],bossBoards:[],npcs:[],signs:[],portals:[{tx:18,ty:0,to:"mach_dat_dong"},{tx:19,ty:0,to:"mach_dat_dong"}]},
  mach_dat_dong:{name:"Tầng Hang Động — Lòng Đất",w:40,h:30,spawn:[20,27],anchor:[20,27],anchorLabel:"điểm trống",enemies:6,farm:null,farmCluster:{tx:10,ty:8,count:1,name:"Thạch Yêu"},monsterPoints:[{name:"Thạch Mạch Vương · Yêu Thú Cấp 2",tx:30,ty:14,boss:true},{name:"Thạch Yêu",tx:10,ty:8,boss:false},{name:"Thạch Giáp Yêu · Nhất Giai Thượng Phẩm",tx:20,ty:12,boss:false}],bossBoards:[],npcs:[],signs:[],portals:[{tx:20,ty:29,to:"rung_mang_xa"},{tx:21,ty:29,to:"rung_mang_xa"},{tx:39,ty:14,to:"dam_lay_boss"},{tx:39,ty:15,to:"dam_lay_boss"}]},
  dam_lay_boss:{name:"Vùng Trung Tâm — Đầm Lầy",w:40,h:30,spawn:[2,14],anchor:[3,14],anchorLabel:"điểm trống",enemies:3,farm:null,farmCluster:{tx:10,ty:22,count:1,name:"Xích Tinh Mãng"},monsterPoints:[{name:"U Minh Cự Mãng · Yêu Thú Cấp 2",tx:20,ty:23,boss:true},{name:"Xích Tinh Mãng",tx:10,ty:22,boss:false}],bossBoards:[],npcs:[],signs:[],portals:[{tx:0,ty:14,to:"mach_dat_dong"},{tx:0,ty:15,to:"mach_dat_dong"}]},
  bai_da_hang_gio:{name:"Bãi Đá",w:40,h:30,spawn:[3,28],anchor:[3,27],anchorLabel:"điểm trống",enemies:17,farm:null,farmCluster:{tx:22,ty:13,count:10,name:"Nhện Ngọc Con · Yêu Thú Cấp 1"},monsterPoints:[{name:"Xuyên Sơn Giáp",tx:5,ty:22,boss:false},{name:"Nhện Bạch Ngọc · Yêu Thú Cấp 5",tx:21,ty:11,boss:true},{name:"Nhện Ngọc Con · Yêu Thú Cấp 1",tx:19,ty:10,boss:false},{name:"duoc_nong",tx:22,ty:17,boss:false},{name:"thuong_nhan",tx:21,ty:12,boss:false},{name:"Tiêu Sư",tx:20,ty:12,boss:false},{name:"son_tac",tx:10,ty:25,boss:false},{name:"Kiếp Tặc",tx:20,ty:14,boss:false}],bossBoards:[],npcs:[],signs:[[5,26],[18,12]],portals:[{tx:0,ty:27,to:"tan_vien"},{tx:0,ty:28,to:"tan_vien"},{tx:19,ty:10,to:"mo_linh_thach"},{tx:20,ty:10,to:"mo_linh_thach"},{tx:21,ty:10,to:"mo_linh_thach"},{tx:22,ty:10,to:"mo_linh_thach"},{tx:23,ty:10,to:"mo_linh_thach"},{tx:24,ty:10,to:"mo_linh_thach"},{tx:9,ty:0,to:"dong_mach_ngam"},{tx:10,ty:0,to:"dong_mach_ngam"},{tx:11,ty:0,to:"dong_mach_ngam"}]},
  mo_linh_thach:{name:"Mỏ Linh Thạch",w:40,h:30,spawn:[3,13],anchor:[3,13],anchorLabel:"điểm trống",enemies:null,farm:null,farmCluster:null,monsterPoints:[],bossBoards:[],npcs:[],signs:[[4,11],[33,14]],portals:[{tx:1,ty:13,to:"bai_da_hang_gio"},{tx:1,ty:14,to:"bai_da_hang_gio"},{tx:38,ty:16,to:"thach_phong_thung_lung"},{tx:38,ty:17,to:"thach_phong_thung_lung"}]},
  thach_phong_thung_lung:{name:"Thung Lũng",w:40,h:30,spawn:[3,27],anchor:[4,27],anchorLabel:"điểm trống",enemies:4,farm:null,farmCluster:{tx:33,ty:2,count:3,name:"Bạch Hổ Tuyết · Yêu Thú Cấp 1"},monsterPoints:[{name:"Linh Hổ Trấn Sơn · Yêu Thú Cấp 4",tx:33,ty:5,boss:true},{name:"Bạch Hổ Tuyết · Yêu Thú Cấp 1",tx:29,ty:4,boss:false}],bossBoards:[{tx:5,ty:27,bossMap:"thach_phong_thung_lung"}],npcs:[],signs:[],portals:[{tx:1,ty:27,to:"mo_linh_thach"}]},
  long_uyen:{name:"Long Uyên Cốc",w:40,h:30,spawn:[2,14],anchor:[24,5],anchorLabel:"cạnh NPC Lão Đạo Hành Cước",enemies:null,farm:null,farmCluster:{tx:15,ty:7,count:1,name:"Xích Lân Long Tích"},monsterPoints:[{name:"Xích Lân Long Tích",tx:15,ty:7,boss:false}],bossBoards:[{tx:7,ty:17,bossMap:"long_uyen"}],npcs:[{id:"lao_dao_hang_cave",name:"Lão Đạo Hành Cước",tx:25,ty:5}],signs:[],portals:[{tx:0,ty:14,to:"thanh_truc_lam"},{tx:0,ty:15,to:"thanh_truc_lam"},{tx:22,ty:4,to:"hang_dong_co"}]},
  hu_thien_1:{name:"Sỹ Sách Điện · Dược Viên",w:60,h:40,spawn:[7,20],anchor:[7,20],anchorLabel:"điểm trống",enemies:null,farm:null,farmCluster:null,monsterPoints:[],bossBoards:[],npcs:[],signs:[],portals:[{tx:59,ty:19,to:"hu_thien_2"},{tx:59,ty:20,to:"hu_thien_2"},{tx:59,ty:21,to:"hu_thien_2"}]},
  hu_thien_2:{name:"Sỹ Sách Điện · Băng Hỏa Trận",w:52,h:36,spawn:[4,18],anchor:[4,18],anchorLabel:"điểm trống",enemies:null,farm:null,farmCluster:null,monsterPoints:[],bossBoards:[],npcs:[],signs:[],portals:[{tx:0,ty:17,to:"hu_thien_1"},{tx:0,ty:18,to:"hu_thien_1"},{tx:0,ty:19,to:"hu_thien_1"},{tx:51,ty:17,to:"hu_thien_3"},{tx:51,ty:18,to:"hu_thien_3"},{tx:51,ty:19,to:"hu_thien_3"}]},
  hu_thien_3:{name:"Sỹ Sách Điện · Nội Điện",w:56,h:44,spawn:[28,40],anchor:[28,40],anchorLabel:"điểm trống",enemies:null,farm:null,farmCluster:null,monsterPoints:[],bossBoards:[],npcs:[],signs:[],portals:[{tx:26,ty:43,to:"hu_thien_2"},{tx:27,ty:43,to:"hu_thien_2"},{tx:28,ty:43,to:"hu_thien_2"},{tx:29,ty:43,to:"hu_thien_2"},{tx:30,ty:43,to:"hu_thien_2"}]},
  hu_thien_4:{name:"Sỹ Sách Điện · Mật Thất",w:32,h:24,spawn:[16,19],anchor:[16,19],anchorLabel:"điểm trống",enemies:null,farm:null,farmCluster:null,monsterPoints:[],bossBoards:[],npcs:[],signs:[],portals:[{tx:15,ty:23,to:"hu_thien_3"},{tx:16,ty:23,to:"hu_thien_3"},{tx:17,ty:23,to:"hu_thien_3"}]},
  phong_dia:{name:"Phong Địa",w:40,h:30,spawn:[37,14],anchor:[34,11],anchorLabel:"cạnh NPC Phong Địa Sứ",enemies:8,farm:null,farmCluster:{tx:12,ty:21,count:3,name:"Lợn Rừng Phong Địa"},monsterPoints:[{name:"Lợn Rừng Phong Địa",tx:5,ty:5,boss:false},{name:"Hắc Mao Lợn Rừng",tx:17,ty:3,boss:false},{name:"Lợn Rừng Đầu Đàn",tx:22,ty:4,boss:false}],bossBoards:[],npcs:[{id:"pd_su_gia",name:"Phong Địa Sứ",tx:35,ty:12}],signs:[[35,17]],portals:[{tx:39,ty:14,to:"mieu_hoang"},{tx:39,ty:15,to:"mieu_hoang"}]},
  van_can:{name:"Hồ Tây",w:56,h:36,spawn:[33,31],anchor:[34,29],anchorLabel:"cạnh NPC Lão Ngư Ông",enemies:21,farm:[33,31],farmCluster:{tx:7,ty:7,count:3,name:"Thiết Giáp Hà Giải"},monsterPoints:[{name:"Hồ Tây Thủy Yêu",tx:3,ty:5,boss:true},{name:"Thiết Giáp Hà Giải",tx:3,ty:10,boss:false},{name:"Thanh Lân Thủy Xà",tx:11,ty:3,boss:false}],bossBoards:[],npcs:[{id:"van_can_lao_ngu",name:"Lão Ngư Ông",tx:35,ty:30}],signs:[[49,15],[41,29]],portals:[{tx:55,ty:13,to:"duoc_vien"},{tx:55,ty:14,to:"duoc_vien"}]}
  };
  // Lưới ô chặn theo trạng thái runtime (ground + legend + decorations/props sau mọi module vá lúc chạy,
  // đúng cơ chế MapData.load): walk = ô chặn khi đi bộ, fly = ô chặn khi bay.
  // Mỗi lưới nén bit (1 = chặn, thứ tự hàng ngang y*w+x) rồi base64. Trích bằng extract-runtime.mjs.
  var WALK_GRIDS = {
    tan_vien:{w:40,h:30,walk:"///////////////////+///nf/4f/xcu/If8Awz4B5gABvgPAAAG+D+OOw78P447B/6/AgAn/zcAEQP/YAgEA/7ADwAD8AMAAAAAAwAAAADvAAAD4ucAAAPAB4GAA8AHAMAByH8A4IGAXyTuIYAfEP8Amw+AfxD/B8B/8P5fxD9Y/H/MPwD+f94/wP9//v/B/3/+////",fly:"///////////z//////P+///nc/4f/wcg/Ab8AwD4A5gAAPgPAAAA+B+OOwD8P447APy/AAAA/gcAAAD+AAAAAP7AAAAA8AEAAAAAAQAAAADvAAAAwucAAACAAwAAAMAHAAAAgB8AAAAADwAEAAAPAA4AgweADwD+B8APcP4PwA8A/H/EBQD8f9wHAP9//iPA/2f+w8P7"},
    thanh_truc_lam:{w:40,h:30,walk:"e57///d3+n/O/W/4a/w3f/Bg4Ht/8GHwf39QZOC9HxBg4P1cAAAA/fsAAICUHgBiAJAfAPIMAA8A8IDAAwD5yyAHEPwBAAcE/gMAAwD+A+ABAPwfeJEA8B84wQDwD+jBAPAA+EEE8IDZAQDgAviBAOAEsBsAYAPgDgAAAOZVAACAz3sH9B77ZwX8Ce/fh+4///9H/fv/",fly:"O57N/7c3+BnO/W+ICPQ1f2AA4Hl/4ADwf38AAOC9HwAAIP1cAAAA+foAAAAQHgAAAIAfAAAAAAcAAACAAwAAwAAHAAAAAAcAAAAAAwAAAOAAAAAQeAEAAAA4wQAAAOgAAAAA+AAAAIDZAAAAAvgBAAAAIAMAAAIgDgAAAOYVAACAz3sFgA76ZwXECe/fB4wffr8HnXv/"},
    duoc_vien:{w:40,h:30,walk:"/8//////z////7fI5gX+/08CGPZ/CAGA9n8ICADmDwABBPYPABAA9g/IABH2DwgIAPbPCQAA4M8LAADujwlCIOb/DwAQ8w8AIIDhTwAAwOBHAPBj8I8A/3/yFwH/P+APhP9/8jCA/3/mAJD/f+CHgf9/8AcA/z/gB0L8D/gvYPBD5L8UBPP+////////////////////",fly:"/8////n/z///+bfI5gX4BwACGPB3AACA8HcAAADgBwABAPAHAAAA8AcAAAHwBwAAAPAHAAAA4AcAAADgBwAAAOAHAAAQ8A8AAADgDwAAAOBHAAAA8A8AAEDwFwAAAOAPAAAA8hAAAADgABAAAOAHAQAA8AcAAADgB0AAAPAvYABA5L8UBPP+////////////////////"},
    hang_dong_co:{w:30,h:20,walk:"///////w//8P8P//AfH/PwDg/wcAwf8EAOA/BADwBwAQ+AEAAP4AAMA/BAD4HxAA/gcEyv8DAPj/AQD//wDg/38A/P//4f//f/j/",fly:"///////w//8P8P//AfD/PwDg/wcAwP8AAOA/AADwBwAA+AEAAP4AAMA/AAD4HwAA/gcEwv8DAPj/AQD//wDg/38A/P//4f//f/j/"},
    dong_mach_ngam:{w:30,h:26,walk:"/////////9/A/8Fm8H+YWfyfZgb/h9nB/2Fm8H+4kfyfYoQAiBgBQSDGCICMMYAAYz4A8Jk/AP/mAwCf+QCAYzCIYFgYAJwG/PiBAT9+YAKAARoAAAAWAACgASgK4P+P/w8=",fly:"/////////x/A/wEG8H+AQfyfYAD/B1jA/wEG8H+ggfyfYAAAABgAAAAGCICAAYAAYAAAABgAAAAGAACAAQAAYAAAAFgAAIAGAACAAQFAYAIAABoAAAAWAACgASAC4P+P/w8="},
    vuon_ca_nhan:{w:18,h:13,walk:"//8PAHwA8D/8B2AfwH0A8ADAAwAvEDwA8ADA//wD",fly:"//8PAHwA8ADgAwAPADwA8ADAAwAvADwA8ADA//wD"},
    mieu_hoang:{w:20,h:14,walk:"//8/AMABAJh/iAsE2ACCgBAAAAAJJJh/gANAOBDRA8D8//8=",fly:"//8/AMABABgAiAEAGACAAAAAAAABABgAgAEAOADQAwD8//8="},
    rung_mang_xa:{w:40,h:30,walk:"///D/////8P//x/9wR/8DwAAAPwHAAAA/CcAAID8D/jBB/w/+MEH/j/wwQP/J0CAAOIDAAAAwAMAAADAB4BBAOAPwMEA8AAAAAAAAAAAAAAP0MEC+AfAwQDwAwAAAOADAAAA4AcIAAjgBwAAAPAPAAAA+A/4wQf4D8jBBPgfwMEA/B/iwRH+P+DBAf8/8MGD////w///",fly:"///D/////8P//x/8wR/8DwAAAPwHAAAA/AcAAAD8D/jBB/w/+MEH/j/wwQP/BwAAAOADAAAAwAMAAADAB4BBAOAPwMEA8AAAAAAAAAAAAAAPwMEA+AfAwQDwAwAAAOADAAAA4AcAAADgBwAAAPAPAAAA+A/4wQf4D8DBAPgfwMEA/B/gwQH+P+DBAf8/8MGD////w///"},
    mach_dat_dong:{w:40,h:30,walk:"///D/////8P//wPwADzQEwAAAMAzAAAAwBMAAADAkzADCMITAMAPwhMAgAjC8z8ByMMDMcGJwBMAAADIAwAAAMA/AAAA+AAAAAAAAAAAAABDMIEYwfM/w5//EzAAGOATMAAY4BPwwx/gkzAAGOETMAEZ4PM/w///A/EAeMgT8AB5xAPwAHjAD/wA+PH//wD4////APj/",fly:"///D/////8P//wPwADzAAwAAAMADAAAAwAMAAADAAzADCMADAMAPwAMAAAjAAzABCMADMMEJwAMAAADAAwAAAMA/AAAA+AAAAAAAAAAAAAADMAEYwAMwwx/AAzAAGMADMAAYwAPwwx/AAzAAGMADMAAYwAMAAADAA/AAeMAD8AB4wAPwAHjAD/wA+PH//wD4////APj/"},
    dam_lay_boss:{w:40,h:30,walk:"///D/////8P//x8AAAD4ryRBkvovAAAA+S8AAAD5DwAAAPgvAAAA+S8AAAD5DwAAAPivAABA/R8AAAD4///A//8DAMP//wAAAAAAAAAAAAAD4MMHzD/gwwfM///A////f4D//w8AAADwL0IAIfovAAAA+Q8AAAD4LxIAEvkvAAAA/Q8AAAD8///D/////8P/////w///",fly:"///D//8DAAAAwAMAAADAAwAAAMADAAAAwAMAAADAAwAAAMADAAAAwAMAAADAAwAAAMADAAAAwAMAAADAAwAAAMADAAAAwAAAAAAAAAAAAAADAAAAwAMAAADAAwAAAMADAAAAwAMAAADAAwAAAMADAAAAwAMAAADAAwAAAMADAAAAwAMAAADAAwAAAMADAAAAwP//w///"},
    bai_da_hang_gio:{w:40,h:30,walk:"//H///9RACHugBsRAICIASAAAIBBIAiYgEEA+IOCiUT8B8AD8f8v4AH8/8fgEw/+/8D/IwA+gP8AAASAIQgAAIAhGAAAgGEIAQDIQYAAAIoJCAAggIUCAKjAgwAAYMCDDwBgkOF/gMjA7zEAiIAPASjAwQMDfPCDBwL4P4YDAOAvhAEARQCMAAAAgIgAQIABiP//////",fly:"//H///8BAABkgAsAAACIAQAAAIABAACAgEEA+IOACUT8B8AB8f8PgAG8/8eAAQ/++4D/AwA+gP8AAASAAQAAAIABCAAAgAEAAACAAYAAAIoBAAAggAUCACDAAQAAYIADDgBAgOF/AMjA7zEAiIAPACjAwQMBfPCDAQDwP4YDAIAPhAEAQQCMAAAAgIgAQIAAiP/9////"},
    mo_linh_thach:{w:40,h:30,walk:"////////////////////H/7///8P/v///x8H///4/wP+f/D/AfgD8P8AAAD0PwAAAPgHcAAA/wP48gP+Af7/P/4Bf/8//AF+/z/8ARj8f4AfAPh/gD+A+D+AfwD4P4D/AeAP4P8AmAf8/0EwQf7/42AA////AYT///8J4P///wD9////If////+D////////////////",fly:"//////8BAAAAgAEAAACAAQAAAIABAAAAgAEAAACAAQAAAIABAAAAgAEAAACAAQAAAIABAAAAgAEAAACAAQAAAIABAAAAgAEAAACAAQAAAIABAAAAgAEAAACAAQAAAIABAAAAgAEAAACAAQAAAIABAAAAgAEAAACAAQAAAIABAAAAgAEAAACAAQAAAIABAAAAgP//////"},
    thach_phong_thung_lung:{w:40,h:30,walk:"//////////////////+7/////4H/////wf///z/4////H/z///8H+P///wP4////A/j///8D+P///x/+////H/7///8P/v///wH+//9/AP///x8E////B4D///8HgP//fwCC//8PAID//wMAwP//AQjg/38AAOD/H0AA4P8PABD4/wcgAPz/gQAA//8DAOD/////////",fly:"//////////////////+7/////4H/////wf///z/4////H/z///8H+P///wP4////A/j///8D+P///x/+////H/7///8P/v///wH+//9/AP///x8E////B4D///8HgP//fwCC//8PAID//wMAwP//AQjA/38AAOD/H0AA4P8PAADw/wcgAPz/AQAA//8DAOD/////////"},
    long_uyen:{w:40,h:30,walk:"////////////////////////////////////H/7f/z8I/Mf/MwQAwP865P/j/xjy/+c/GjIA5n+eMQDmPzgxAPYBAAAA8AAAAADwAAAAAOAHtDEA5hd0MQDmB3QyAObPMfL/538y5P/j/3MEHMD/fwQAwP9/GB3E//8J/sD/////w///////////////////////////",fly:"////////////////////////////////////H/zf/z8I4Mf/AwQAwP8CBADg/wACAOA/AAIA4H8CAQDgBwABAPABAAAA8AAAAADwAAAAAOAHAAEA4AdEAQDgBwACAOCHAAIA4H8CBADg/xMEAMD/HwQAwP9/CADA//8J/sD/////w///////////////////////////"},
    hu_thien_1:{w:60,h:40,walk:"////////////////////zyoAkAgOonwCAAAAABDgAwAAAAABAHwAEAAAAADABwAAAAABADwAAAAAAADAAwAAAAABgD4AAAAAAADAAwAAAAAAADwAAAAAAADAAyQAAAAAADwIEAAAAADABwAAAAAKAD4AAAAAAADADwgAASAAADwAAQAAgADwAwAAAAAAAHAAAAAAAAAABwAAAAAAAHAAAAAAAAAAAwAAAAAAEDAAEAAAAADQCwgAAOAPfz8AAABgBEHEAwOAHwAAAH4EAPwDAADgBwDgfwAAAH0CAP4HIAjCAwDAPwAAAH4AAPgBAADAAwAEAAAAAD0AAAEACILAAwAAAAQAADwAAgAABADEA4AAAAAAAD4CqmEAZATI////////////////////",fly:"////////////////////zyoAkAgOonwCAAAAABDgAwAAAAABAHwAEAAAAADABwAAAAABADwAAAAAAADAAwAAAAABgD4AAAAAAADAAwAAAAAAADwAAAAAAADAAwAAAAAAADwIAAAAAADABwAAAAAKAD4AAAAAAADABwAAASAAADwAAAAAgADgAwAAAAAAAHAAAAAAAAAABwAAAAAAAHAAAAAAAAAAAwAAAAAAEDAAAAAAAADAAwAAAAAAAD8AAABgAADAAwMAAAAAAH4AAAAAAADgBwAAAAAAAHwCAAAAAADAAwAAAAAAAH4AAAAAAADAAwAEAAAAAD0AAAEAAADAAwAAAAQAADwAAgAAAADAA4AAAAAAAD4CqmEAZATI////////////////////"},
    hu_thien_2:{w:52,h:36,walk:"/////////////////88qANP/P34AAvz8/8MjIADD/z98AAAA/P/DBwAAwP8/PAACAPz/wwMoAMj/PzwAAgD8/8P/PwDA/z88gAEQ/P/jA34AwP8/PuAnAPz/4wcYAMD/PzwQAAD8/8MHAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAHwAEAD8/8MDAADA/z884AEA/P/DAz9AwP8/PPADAPz/wwMeAMj/P34AAAD8/8MHAADA/z98AAAA/P/jgwAAwP8/fAAAAPz/4wNAgN//Pz4g1v79/9P/////////////////",fly:"/////////////////88qAND/P34AAgD8/8MDIADA/z98AAAA/P/DBwAAwP8/PAACAPz/wwMgAMD/PzwAAgD8/8P/PwDA/z88AAAQ/P/jAwAAwP8/PgAgAPz/4wcAAMD/PzwQAAD8/8MHAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAHwAEAD8/8MDAADA/z88AAAA/P/DAwBAwP8/PAAAAPz/wwMAAMj/P34AAAD8/8MHAADA/z98AAAA/P/jgwAAwP8/fAAAAPz/4wNAAMD/Pz4g1gb8/9P/////////////////"},
    hu_thien_3:{w:56,h:44,walk:"////////////////////////////DwABAIAA8AcAgQACAOAHAAEAAADgBwAAAIAA4AcAAACAAOAHAAEAgADgBwABAIAA4AcAj8fjAOD/+QEAgJ//BwAJAKAA4AcAAQAAAOA/zwEAAADgBwAAAIDn+QcAAACAAODP8wEAgADgBwABAIB5/gcABQBAAOD/nAEAAADgBwAAAICf8wcAAACAAOCf5wEAgADgBwABAIDz/AcAAQAAAOB/ngkAIADgBwAAAIDP5wcAAACAAODP+UEAhADgBwABAIA5/wcAHQAAAOD/M0EABADgBwAAAIB/5gcAAACAAOA/z0EAvADgBwABAIDn+QcAAQAAAODP+UEABADgBwAEAMA5/wcAAACAAOD///+D////////g////////4P///8=",fly:"////////////////////////////BwABAIAA4AcAAQAAAOAHAAEAAADgBwAAAIAA4AcAAACAAOAHAAEAgADgBwABAIAA4AcAAQCAAOD/+QEAgJ//BwABAIAA4AcAAQAAAOA/zwEAAADgBwAAAIDn+QcAAACAAODP8wEAgADgBwABAIB5/gcAAQAAAOD/nAEAAADgBwAAAICf8wcAAACAAOCf5wEAgADgBwABAIDz/AcAAQAAAOB/ngEAAADgBwAAAIDP5wcAAACAAODP+QEAgADgBwABAIA5/wcAAQAAAOD/MwEAAADgBwAAAIB/5gcAAACAAOA/zwEAgADgBwABAIDn+QcAAQAAAODP+QEAAADgBwAAAIA5/wcAAACAAOD///+D////////g////////4P///8="},
    hu_thien_4:{w:32,h:24,walk:"///////////PKgDQBwRAwAMAAMAnAADEBwAAwAMAAMADAADAAwAA4AMAAMADAADAAwAAwAMAAMAHAADoAwAAwBcAAOADAADAAwAAwAcAAOAHAADAJxcA3/8/+P//P/j/",fly:"///////////PKgDQBwAAwAMAAMAHAADABwAAwAMAAMADAADAAwAA4AMAAMADAADAAwAAwAMAAMAHAADgAwAAwAcAAOADAADAAwAAwAcAAOAHAADAJxcA3/8/+P//P/j/"},
    phong_dia:{w:40,h:30,walk:"//////////////8fQP7//wcAAIAXgAAHuAcAAAC4BwAAALgfAAAEsB+AZwCwG+DnA4IDwOcDgAPgAAeAU2IAHqh/fgBegH9+AAAAf34AAAAPeABegA/wAB+AB+DnB4AH4OcDgB8AJwCIHwKAALAfAAAAsAcAAAC4BwAAALgHAAAHuAcQAAiA/3/8B+D/////////////",fly:"//////////////8fAP7//wcAAIAHAAAHuAcAAAC4BwAAALgfAAAAsB8AAACwGyAAAoADAAAAgAMAAACAAwAAEIABAABAgAEAAAAAAQAAAAABAABAgAcAABCABwAAAIAHIAACgB8AAACAHwAAALAfAAAAsAcAAAC4BwAAALgHAAAHuAcAAACA/3/8B+D/////////////"},
    van_can:{w:56,h:36,walk:"////////////////////jw8PD//8/wEkAQ+Q8MOBAAAPCPDDZQEQBwD4BwAkgB8A9AMEDsB/AegDB/T//wfwiw/+//8P/QMH////H/gDgP///x/yB8H///8fwCPg////TwADAPj/PwABAwD4/z8Q2AMA/v//A/BD/v///xHh4/////87/sP/////k+SD/////wPoh/////+H4Af/////B+CH/////wfgD/////8B4g/+4P//AOgPAPAPfAjkDxDwhwBA4Q8A4McBAOBPAOEBIIDhDwgYBJgA5J8AgAQAWeIfBAAQAGD0P/TQj1/08P//////////////////",fly:"///3/ejm////3/vY9///Cw8PAD/8/wEEAAAA8AMAAAAAAOACYAAQAADIBwAgAAAA9AMAAAAAAOACAAAAAACwCwAAAAAA9AIAAAAAAPgDAAAAAACwAwEAAAAAQAMAAAAAAAADAAAAAAAAAwAAAAAAkAMAAAAAAOADAAAAAABgAwAAAAAA5AMAAAAAAGACAAAAAADgAwAAAACA4AcAAAAAAOAHAAAAAADgDQAAAAAA4A8AAAAAAEgMAAAAAAhgDxAAAAAA4A8AAAAAAOAPAAAAAABgDwAAAAAA4I8AAAAAUeAfBAAAAEDkP9CQBxfk8N/1+q+//7f9/5/t1+/3"}
  };
  var FARM_MAPS = Object.keys(MAPS); // 20 map có cổng — danh sách chọn map trên bảng tool
  var NAME2ID = {};
  Object.keys(MAPS).forEach(function (id) { NAME2ID[MAPS[id].name] = id; });
  // Tên hiển thị lúc chạy của 3 map Huyết Xích bị game đổi thành "Huyết Xích Cấm Địa · ..." —
  // thêm alias để readMapId() nhận diện được khi ở trong cụm (nếu không sẽ trả null).
  NAME2ID['Huyết Xích Cấm Địa · Rừng Mãng Xà'] = 'rung_mang_xa';
  NAME2ID['Huyết Xích Cấm Địa · Lòng Đất'] = 'mach_dat_dong';
  NAME2ID['Huyết Xích Cấm Địa · Đầm Lầy'] = 'dam_lay_boss';
  NAME2ID['Rừng Mãng Xà'] = 'rung_mang_xa';
  NAME2ID['Lòng Đất'] = 'mach_dat_dong';
  NAME2ID['Đầm Lầy'] = 'dam_lay_boss';

  // Việc Dược Công theo thứ tự ưu tiên (tên hiển thị trong thoại)
  var JOB_PRIORITY = [
    { id: 'duoc_moc',     names: ['Thu Gom Dược Mộc'] },
    { id: 'linh_chi',     names: ['Linh Chi Dưới Chân Núi', 'Linh Chi'] },
    { id: 'truc_gia',     names: ['Trúc Tâm Dẫn Dược', 'Trúc Tâm'] },
    { id: 'cau_ca',       names: ['Câu Cá Làm Dược Liệu', 'Câu Cá'] },
    { id: 'ho_tong_chau', names: ['Đưa Người Về Làng', 'Hộ Tống'] }
  ];
  // Tọa độ NPC Đại Phu trích từ mã client (props type:"npc" trong định nghĩa duoc_vien): (14,8).
  // v1.5 ghi (16,7) — đó là ô người chơi đứng cạnh NPC, không phải ô NPC (sửa ở v1.6).
  var DAI_PHU = { map: 'duoc_vien', tx: 14, ty: 8 };

  // ============ Huyết Xích Cấm Địa (v1.9) — dữ liệu trích từ mã client + runtime-maps.json ============
  // Đăng ký tại Nữ Tu Trông Miếu (mieu_hoang 12,6): thoại "Đăng ký Huyết Xích Cấm Địa" → hộp xác nhận
  // "Mở Huyết Xích Cấm Địa" → Gateway.partyEnterDungeon("rung_mang_xa"). Theo thoại xác nhận trong mã:
  // đi một mình vẫn vào được; thu 100 Linh Thạch/người + tính 1 lượt hôm nay (Luyện Khí 5 lượt/ngày,
  // Trúc Cơ 4 — HuyetSac.LUOT_NGAY); mỗi lượt 900 giây (partyDungeon.durationSec), HUD đếm ngược sụp.
  // Trong cụm, nguyên liệu bị cấm chế phong tới khi quét sạch yêu thú trong khu; thu hoạch = đứng cạnh
  // prop bấm Tương Tác rồi ĐỨNG YÊN tới khi đầy thanh (server báo ms, mặc định 3s; di chuyển >12px hủy).
  // Đồ quái rơi tự nhặt khi đi qua gần (Loot.PICK_R=40px, tự hút sau ~5s) — không cần thao tác riêng.
  var HUYET = {
    npcMap: 'mieu_hoang',
    npc: { id: 'nu_tu_mieu_hoang', name: 'Nữ Tu Trông Miếu', tx: 12, ty: 6 },
    fee: 100,
    maps: ['rung_mang_xa', 'mach_dat_dong', 'dam_lay_boss'],
    harvest: {
      rung_mang_xa: [
        { id: 'bich_chop_1', name: 'Bích Ngọc Cổ Mộc', tx: 7, ty: 2 },
        { id: 'bich_chop_2', name: 'Bích Ngọc Cổ Mộc', tx: 31, ty: 2 },
        { id: 'bich_chop_3', name: 'Bích Ngọc Cổ Mộc', tx: 17, ty: 9 },
        { id: 'bich_chop_4', name: 'Bích Ngọc Cổ Mộc', tx: 25, ty: 9 },
        { id: 'bich_chop_5', name: 'Bích Ngọc Cổ Mộc', tx: 8, ty: 20 },
        { id: 'bich_chop_6', name: 'Bích Ngọc Cổ Mộc', tx: 30, ty: 20 }
      ],
      mach_dat_dong: [
        { id: 'ore_1', name: 'Trấn Thần Thạch Lam Ngọc', tx: 6, ty: 3 },
        { id: 'ore_2', name: 'Trấn Thần Thạch Lam Ngọc', tx: 33, ty: 3 },
        { id: 'ore_3', name: 'Trấn Thần Thạch Lam Ngọc', tx: 10, ty: 6 },
        { id: 'ore_4', name: 'Trấn Thần Thạch Lam Ngọc', tx: 21, ty: 6 },
        { id: 'ore_5', name: 'Trấn Thần Thạch Lam Ngọc', tx: 6, ty: 11 },
        { id: 'ore_6', name: 'Trấn Thần Thạch Lam Ngọc', tx: 33, ty: 11 },
        { id: 'fruit_1', name: 'Địa Linh Hóa Quả', tx: 6, ty: 2 },
        { id: 'fruit_2', name: 'Địa Linh Hóa Quả', tx: 18, ty: 2 },
        { id: 'fruit_3', name: 'Địa Linh Hóa Quả', tx: 33, ty: 2 },
        { id: 'fruit_4', name: 'Địa Linh Hóa Quả', tx: 10, ty: 10 },
        { id: 'fruit_5', name: 'Địa Linh Hóa Quả', tx: 29, ty: 10 }
      ],
      dam_lay_boss: [
        { id: 'tct_1', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 7, ty: 5 },
        { id: 'tct_2', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 11, ty: 5 },
        { id: 'tct_3', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 15, ty: 5 },
        { id: 'tct_4', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 19, ty: 5 },
        { id: 'tct_5', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 23, ty: 5 },
        { id: 'tct_6', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 27, ty: 5 },
        { id: 'tct_7', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 7, ty: 7 },
        { id: 'tct_8', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 11, ty: 7 },
        { id: 'tct_9', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 15, ty: 7 },
        { id: 'tct_10', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 19, ty: 7 },
        { id: 'tct_11', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 23, ty: 7 },
        { id: 'tct_12', name: 'Trúc Cơ Thảo Ngũ Sắc', tx: 27, ty: 7 }
      ]
    }
  };

  // ============ Điểm đến theo map (dựng lúc chạy từ MAPS) ============
  // Thứ tự: cụm farm → điểm farm cũ → boss → bảng boss → quái → điểm câu cá → NPC → bảng khu → spawn → cổng đầu tiên.
  function destinationsFor(mapId) {
    var m = MAPS[mapId];
    if (!m) return [];
    var out = [];
    if (m.farmCluster) out.push({ label: 'Điểm farm (cụm ' + m.farmCluster.name + ' ×' + m.farmCluster.count + ')', tx: m.farmCluster.tx, ty: m.farmCluster.ty, kind: 'farm' });
    if (m.farm && (!m.farmCluster || m.farm[0] !== m.farmCluster.tx || m.farm[1] !== m.farmCluster.ty)) {
      out.push({ label: 'Điểm farm cũ', tx: m.farm[0], ty: m.farm[1], kind: 'farm' });
    }
    (m.monsterPoints || []).forEach(function (p) { if (p.boss) out.push({ label: 'Boss: ' + p.name, tx: p.tx, ty: p.ty, kind: 'boss' }); });
    (m.bossBoards || []).forEach(function (b) { out.push({ label: 'Bảng Boss', tx: b.tx, ty: b.ty, kind: 'bossboard' }); });
    (m.monsterPoints || []).forEach(function (p) { if (!p.boss) out.push({ label: 'Quái: ' + p.name, tx: p.tx, ty: p.ty, kind: 'monster' }); });
    (m.fishing || []).forEach(function (f) { out.push({ label: f.name, tx: f.tx, ty: f.ty, kind: 'fishing' }); });
    (m.npcs || []).forEach(function (n) { out.push({ label: 'NPC ' + n.name, tx: n.tx, ty: n.ty, kind: 'npc' }); });
    (m.signs || []).forEach(function (s, i) { out.push({ label: 'Bảng Khu' + (m.signs.length > 1 ? ' ' + (i + 1) : ''), tx: s[0], ty: s[1], kind: 'sign' }); });
    if (m.spawn) out.push({ label: 'Điểm vào map (spawn)', tx: m.spawn[0], ty: m.spawn[1], kind: 'spawn' });
    if (!out.length && m.portals && m.portals.length) out.push({ label: 'Ô cổng đầu tiên', tx: m.portals[0].tx, ty: m.portals[0].ty, kind: 'portal' });
    return out;
  }
  // px/ô ước lượng chỉ dùng cho chạm NPC (vòng xoắn ốc bù sai số — không hiệu chuẩn nữa)
  var PX_PER_TILE_EST = 48;

  // ============ Trạng thái tool ============
  var S = {
    running: false, mode: null, runId: 0,
    pxX: 32, pxY: 32, calibOk: false, calibDone: false,
    steerMethod: null, // 'keys' | 'joystick' | 'dpad' | 'tap' — dò ở lần di chuyển đầu tiên mỗi phiên chạy
    autoBelief: false, autoByTool: false,
    flyingBelief: false,
    runBelief: false, // trạng thái Chạy tin (belief) — ưu tiên đọc thật từ #btn-run.active khi có nút
    flySpeedChecked: false, flyRetryDone: false, // kiểm chứng bay bằng tốc độ (v1.9.1: TÍCH LŨY, ngưỡng 5)
    flyMeas: null, flySpeedFirst: null, // cửa sổ đo tích lũy {x,y,ms,sx,sy} + lần đo đầu (chẩn đoán)
    status: 'Chưa chạy'
  };
  var logLines = [];

  function $(sel) { return document.querySelector(sel); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function log(msg) {
    var line = new Date().toLocaleTimeString('vi-VN') + ' ' + msg;
    logLines.push(line);
    if (logLines.length > 40) logLines.shift();
    try { console.log('[TTPX] ' + msg); } catch (e) {}
    var el = $('#ttpx-log');
    if (el) el.textContent = logLines.slice(-8).join('\n');
  }
  function setStatus(s) {
    S.status = s;
    var el = $('#ttpx-status');
    if (el) {
      var rs = readRunState();
      var runOn = rs == null ? S.runBelief : rs;
      el.textContent = s + ' · Bay: ' + (S.flyingBelief ? 'BẬT' : 'TẮT') + ' · Chạy: ' + (runOn ? 'BẬT' : 'TẮT');
    }
  }

  // ============ Đọc trạng thái từ giao diện ============
  function readPos() {
    var t = '';
    var hp = $('#hud-pos');
    if (hp) t = hp.textContent || '';
    var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (!m) {
      var bt = document.body ? document.body.innerText : '';
      m = bt.match(/\d{2}:\d{2}:\d{2}\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/) || bt.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    }
    return m ? { x: +m[1], y: +m[2] } : null;
  }
  function readMapId() {
    var w = $('#hud-where');
    if (w) {
      var t = (w.textContent || '').trim();
      if (NAME2ID[t]) return NAME2ID[t];
      for (var n in NAME2ID) if (t.indexOf(n) >= 0) return NAME2ID[n];
    }
    var els = document.querySelectorAll('#hud-where, #hud-map, #map-load-name, div, span');
    for (var i = 0; i < els.length && i < 400; i++) {
      var tx = (els[i].textContent || '').trim();
      if (NAME2ID[tx]) return NAME2ID[tx];
    }
    return null;
  }
  function readHpPct() {
    // Ưu tiên chữ "a/b" trong khu HUD trái
    var zones = [$('#row-hp'), $('#hud-left')];
    for (var i = 0; i < zones.length; i++) {
      if (!zones[i]) continue;
      var m = (zones[i].textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
      if (m && +m[2] > 0) return +m[1] / +m[2];
    }
    // Dự phòng: bề rộng thanh #bar-hp
    var bar = $('#bar-hp');
    if (bar) {
      var fill = bar.querySelector('div') || bar;
      var pr = bar.getBoundingClientRect(), fr = fill.getBoundingClientRect();
      if (pr.width > 0 && fr.width >= 0 && fill !== bar) return clamp(fr.width / pr.width, 0, 1);
      var sw = parseFloat((fill.style && fill.style.width) || '');
      if (!isNaN(sw)) return clamp(sw / 100, 0, 1);
    }
    return null;
  }
  function autoSig() {
    var el = $('#btn-auto-touch') || $('#btn-auto');
    if (!el) return '';
    return (el.className || '') + '|' + (el.getAttribute('aria-pressed') || '') + '|' + (el.getAttribute('aria-label') || '');
  }
  // Trạng thái Auto THẬT: khi lật Auto, game toggle class "active" trên #btn-auto + #btn-auto-touch
  // và set aria-pressed true/false trên #btn-auto-touch (hàm lật Auto trong SceneWorld).
  // Trả true/false khi thấy nút; null khi không thấy nút nào (không đọc được).
  function readAutoState() {
    var el = $('#btn-auto-touch') || $('#btn-auto');
    if (!el) return null;
    var ap = el.getAttribute('aria-pressed');
    if (ap === 'true') return true;
    if (ap === 'false') return false;
    return el.classList.contains('active');
  }
  function readProgress() {
    var o = $('#quest-objectives');
    if (!o) return null;
    var m = (o.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { cur: +m[1], need: +m[2] } : null;
  }
  function readLocal() {
    try {
      var raw = localStorage.getItem('pntt_progress_v1');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function dialogOpen() {
    var d = $('#dialog');
    if (!d) return false;
    var r = d.getBoundingClientRect(), s = getComputedStyle(d);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  }
  function interactLabel() {
    var b = $('#btn-attack');
    if (!b) return '';
    var sn = b.querySelector('.skill-name');
    return ((sn ? sn.textContent : b.textContent) || '').trim();
  }
  // Chữ thông báo ngắn của game (#ritual-caption) — nơi game báo lý do từ chối/cấm chế/đang thu hoạch.
  function readCaption() {
    var c = $('#ritual-caption');
    if (!c || c.classList.contains('hidden')) return '';
    return (c.textContent || '').trim();
  }
  // Số Linh Thạch hiện có (#stone-count) — null nếu không đọc được.
  function readStones() {
    var el = $('#stone-count');
    if (!el) return null;
    var m = (el.textContent || '').replace(/[.,\s]/g, '').match(/(\d+)/);
    return m ? +m[1] : null;
  }
  // Đếm ngược "Cấm Địa sụp sau" trong Huyết Xích (#huyet-collapse) — null nếu không có.
  function readCollapse() {
    var b = document.querySelector('#huyet-collapse b');
    var t = b ? (b.textContent || '').trim() : '';
    return t || null;
  }
  // Nút hành động của hộp thoại xác nhận (#dialog-action, vd "Mở Huyết Xích Cấm Địa").
  function dialogActionBtn() {
    var b = $('#dialog-action');
    if (!b || b.classList.contains('hidden')) return null;
    var r = b.getBoundingClientRect();
    return (r.width > 0 && r.height > 0) ? b : null;
  }
  function readDialogText() {
    var d = $('#dialog');
    if (!d) return '';
    return (d.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  }
  function closeDialogIfOpen() {
    if (!dialogOpen()) return false;
    var x = $('#dialog-close');
    if (x) { pressDom(x); return true; }
    return false;
  }

  // ============ Sự kiện tổng hợp ============
  function gameCanvas() {
    var cs = Array.from(document.querySelectorAll('canvas')), best = null, ba = 0;
    cs.forEach(function (c) { var r = c.getBoundingClientRect(), a = r.width * r.height; if (a > ba) { ba = a; best = c; } });
    return best;
  }
  // Vùng HUD phủ trên canvas cần tránh khi chạm lái (joystick, cụm nút, bảng tool)
  function hudAvoidZones() {
    var zones = [];
    var c = gameCanvas(); if (!c) return zones;
    var r = c.getBoundingClientRect();
    zones.push({ x0: r.x, y0: r.y + r.height * 0.58, x1: r.x + r.width * 0.36, y1: r.y + r.height }); // joystick dưới trái
    zones.push({ x0: r.x + r.width * 0.62, y0: r.y + r.height * 0.52, x1: r.x + r.width, y1: r.y + r.height }); // cụm nút dưới phải
    ['#ttpx-panel', '#btn-auto-touch', '#btn-auto', '#btn-attack', '#btn-fly'].forEach(function (sel) {
      var el = $(sel); if (!el) return;
      var b = el.getBoundingClientRect();
      if (b.width > 0 && b.height > 0) zones.push({ x0: b.x - 6, y0: b.y - 6, x1: b.x + b.width + 6, y1: b.y + b.height + 6 });
    });
    return zones;
  }
  function safeTapPoint(cx, cy, r) {
    // Kẹp trong canvas, chừa lề 12% mỗi phía
    var mx = r.width * 0.12, my = r.height * 0.12;
    cx = clamp(cx, r.x + mx, r.x + r.width - mx);
    cy = clamp(cy, r.y + my, r.y + r.height - my);
    // Rơi vào vùng HUD thì dịch điểm chạm lên trên vùng đó (giữ hướng ngang)
    var zones = hudAvoidZones();
    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (cx >= z.x0 && cx <= z.x1 && cy >= z.y0 && cy <= z.y1) {
        cy = clamp(z.y0 - 10, r.y + my, r.y + r.height - my);
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
  // ============ Phím hướng (lái bằng giữ phím — không phụ thuộc camera căn giữa) ============
  // Game Input đọc e.code: KeyW/ArrowUp=up, KeyS/ArrowDown=down, KeyA/ArrowLeft=left, KeyD/ArrowRight=right,
  // theo dõi phím đang giữ qua keydown/keyup, không kiểm isTrusted → giữ phím tổng hợp dùng được.
  // Sự kiện gửi lên body (bubbles) để tới được listener dù game gắn ở body/document/window.
  var DIR_KEYS = [
    { code: 'KeyW', key: 'w', name: 'W' },
    { code: 'KeyS', key: 's', name: 'S' },
    { code: 'KeyA', key: 'a', name: 'A' },
    { code: 'KeyD', key: 'd', name: 'D' },
    { code: 'ArrowUp', key: 'ArrowUp', name: '↑' },
    { code: 'ArrowDown', key: 'ArrowDown', name: '↓' },
    { code: 'ArrowLeft', key: 'ArrowLeft', name: '←' },
    { code: 'ArrowRight', key: 'ArrowRight', name: '→' }
  ];
  var DIR_BY_CODE = {};
  DIR_KEYS.forEach(function (d) { DIR_BY_CODE[d.code] = d; });
  var heldKeys = {}; // code -> true (phím tool đang giữ)
  function keyTarget() { return document.body || document.documentElement || window; }
  function keyDown(code) {
    var d = DIR_BY_CODE[code]; if (!d || heldKeys[code]) return;
    heldKeys[code] = true;
    keyTarget().dispatchEvent(new KeyboardEvent('keydown', { code: d.code, key: d.key, bubbles: true, cancelable: true }));
  }
  function keyUp(code) {
    var d = DIR_BY_CODE[code]; if (!d || !heldKeys[code]) return;
    delete heldKeys[code];
    keyTarget().dispatchEvent(new KeyboardEvent('keyup', { code: d.code, key: d.key, bubbles: true, cancelable: true }));
  }
  function releaseAllKeys() {
    // Nhả toàn bộ 8 phím hướng (kể cả khi heldKeys lệch) — keyup thừa vô hại với game
    DIR_KEYS.forEach(function (d) {
      keyTarget().dispatchEvent(new KeyboardEvent('keyup', { code: d.code, key: d.key, bubbles: true, cancelable: true }));
    });
    heldKeys = {};
  }
  // Giữ phím theo 1 đợt: poll vị trí mỗi 300ms, nhả khi shouldStop(p) trả lý do / kẹt 2s không đổi vị trí / hết giờ đợt.
  // Mọi lối thoát đều nhả toàn bộ phím. Trả { reason, pos, ms }.
  function holdKeysBurst(runId, codes, shouldStop, burstTimeoutMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      var lastPos = readPos();
      var lastMoveAt = t0;
      codes.forEach(keyDown);
      (function tick() {
        var now = Date.now();
        var p = readPos();
        if (!alive(runId)) { releaseAllKeys(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
        if (p) {
          if (!lastPos || p.x !== lastPos.x || p.y !== lastPos.y) { lastPos = p; lastMoveAt = now; }
          var sr = shouldStop(p);
          if (sr) { releaseAllKeys(); return resolve({ reason: sr, pos: p, ms: now - t0 }); }
        }
        if (p && now - lastMoveAt >= 2000) { releaseAllKeys(); return resolve({ reason: 'stuck', pos: p, ms: now - t0 }); }
        if (now - t0 >= burstTimeoutMs) { releaseAllKeys(); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
        setTimeout(tick, 300);
      })();
    });
  }
  // ============ Joystick ảo (lái bằng kéo — dự phòng khi phím tổng hợp không tới được listener) ============
  // Game: #joystick (vòng .joystick-ring), handler tính vector từ độ lệch kéo so với tâm (có deadzone)
  // rồi gọi Input.setJoystick(x,y,true); nhả thì setJoystick(0,0,false). Vector di chuyển ưu tiên joystick khi joy.active.
  var JOY_PID = 11;
  var joyState = { active: false, el: null, cx: 0, cy: 0, radius: 0 };
  function findJoystick() {
    var el = $('#joystick .joystick-ring') || $('#joystick');
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return { el: el, cx: r.x + r.width / 2, cy: r.y + r.height / 2, radius: Math.min(r.width, r.height) / 2 };
  }
  function joyPointer(type, x, y) {
    var target = joyState.el || document.body;
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: JOY_PID, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true }));
  }
  function joyEngage() {
    var j = findJoystick();
    if (!j) return false;
    joyState.el = j.el; joyState.cx = j.cx; joyState.cy = j.cy; joyState.radius = j.radius;
    joyPointer('pointerdown', j.cx, j.cy);
    joyState.active = true;
    return true;
  }
  function joySetDir(vx, vy) {
    if (!joyState.active) return;
    var len = Math.hypot(vx, vy), nx = 0, ny = 0;
    if (len > 0.001) { nx = vx / len; ny = vy / len; }
    var d = joyState.radius * 0.9;
    joyPointer('pointermove', joyState.cx + nx * d, joyState.cy + ny * d);
  }
  function joyRelease() {
    if (!joyState.active) return;
    try { joyPointer('pointerup', joyState.cx, joyState.cy); } catch (e) {}
    joyState.active = false; joyState.el = null;
  }
  // Kéo joystick theo 1 đợt: giữ kéo, poll vị trí 300ms; hết đợt thì kéo về tâm (dừng di chuyển, chưa nhả) —
  // đổi hướng đợt sau chỉ cần pointermove lại, không cần nhả. Nhả hẳn (pointerup) ở releaseAllInputs/goToTile finally/stopTool.
  function holdJoyBurst(runId, vx, vy, shouldStop, burstTimeoutMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      if (!joyState.active && !joyEngage()) return resolve({ reason: 'nojoy', pos: readPos(), ms: 0 });
      var lastPos = readPos();
      var lastMoveAt = t0;
      joySetDir(vx, vy);
      (function tick() {
        var now = Date.now();
        var p = readPos();
        if (!alive(runId)) { joyRelease(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
        if (p) {
          if (!lastPos || p.x !== lastPos.x || p.y !== lastPos.y) { lastPos = p; lastMoveAt = now; }
          var sr = shouldStop(p);
          if (sr) { joySetDir(0, 0); return resolve({ reason: sr, pos: p, ms: now - t0 }); }
        }
        if (p && now - lastMoveAt >= 2000) { joySetDir(0, 0); return resolve({ reason: 'stuck', pos: p, ms: now - t0 }); }
        if (now - t0 >= burstTimeoutMs) { joySetDir(0, 0); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
        setTimeout(tick, 300);
      })();
    });
  }

  // ============ Nút dpad (lái bằng giữ nút hướng .dpad-btn mang data-dx/data-dy) ============
  var DPAD_PID = 13;
  var dpadHeld = null;
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
    var el = dpadHeld; dpadHeld = null;
    try { dpadPointer(el, 'pointerup'); } catch (e) {}
  }
  function findDpadBtns(sx, sy) {
    var btns = document.querySelectorAll('.dpad-btn');
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
  // Giữ nút dpad theo 1 đợt: có nút chéo khớp thì giữ nút đó; không có thì luân phiên 2 trục mỗi 400ms.
  // Mọi lối thoát đều nhả nút.
  function holdDpadBurst(runId, sx, sy, shouldStop, burstTimeoutMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      var btns = findDpadBtns(sx, sy);
      if (!btns.exact && !btns.xOnly && !btns.yOnly) return resolve({ reason: 'nodpad', pos: readPos(), ms: 0 });
      var lastPos = readPos();
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
        var p = readPos();
        if (!alive(runId)) { dpadRelease(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
        if (!btns.exact && btns.xOnly && btns.yOnly && now - altFlipAt >= 400) { altFlipAt = now; altX = !altX; pressCurrent(); }
        if (p) {
          if (!lastPos || p.x !== lastPos.x || p.y !== lastPos.y) { lastPos = p; lastMoveAt = now; }
          var sr = shouldStop(p);
          if (sr) { dpadRelease(); return resolve({ reason: sr, pos: p, ms: now - t0 }); }
        }
        if (p && now - lastMoveAt >= 2000) { dpadRelease(); return resolve({ reason: 'stuck', pos: p, ms: now - t0 }); }
        if (now - t0 >= burstTimeoutMs) { dpadRelease(); return resolve({ reason: 'timeout', pos: p, ms: now - t0 }); }
        setTimeout(tick, 300);
      })();
    });
  }

  // ============ Chạm neo camera (dự phòng cuối khi phím/joystick/dpad đều không lái được) ============
  // Chạm đúng tâm canvas → ô hiện tại = ô tại tâm → chạm về đích theo vị trí nhân vật thật
  // (vị trí màn hình nhân vật = tâm + (ô nhân vật − ô tâm)×px/ô). Sau mỗi chạm, suy ô tâm mới từ điểm chạm đã dùng
  // (ô tâm = ô nhân vật − điểm chạm/px/ô) để giữ hiệu chỉnh gần mép map. Chạm làm xa đích >2 ô → bỏ neo, neo lại đợt sau.
  var camAnchor = null; // {x,y} ô tại tâm canvas (số thực)
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
        if (!ap) return { reason: 'stuck', pos: readPos(), ms: Date.now() - t0 };
        if (!alive(runId)) return { reason: 'stopped', pos: ap, ms: Date.now() - t0 };
      }
      var used = tapCanvas((tx - camAnchor.x) * S.pxX, (ty - camAnchor.y) * S.pxY);
      var p = await waitStablePos(runId, Math.max(3000, burstTimeoutMs));
      if (p && used) camAnchor = { x: p.x - used.dx / S.pxX, y: p.y - used.dy / S.pxY };
      var sr = p ? shouldStop(p) : null;
      return { reason: sr || (p ? 'timeout' : 'stuck'), pos: p, ms: Date.now() - t0 };
    })();
  }

  // Nhả toàn bộ đầu vào lái: 8 phím hướng + joystick (pointerup) + nút dpad
  function releaseAllInputs() {
    releaseAllKeys();
    joyRelease();
    dpadRelease();
  }
  function dirName(dx, dy) {
    var ns = dy > 0 ? 'nam' : dy < 0 ? 'bắc' : '';
    var ew = dx > 0 ? 'đông' : dx < 0 ? 'tây' : '';
    return ew && ns ? ew + '-' + ns : (ew || ns || 'đứng yên');
  }
  function codesFor(dx, dy) {
    var codes = [];
    if (dx > 0) codes.push('KeyD'); else if (dx < 0) codes.push('KeyA');
    if (dy > 0) codes.push('KeyS'); else if (dy < 0) codes.push('KeyW');
    return codes;
  }

  // ============ Tự dò cách lái (lần di chuyển đầu tiên mỗi phiên chạy) ============
  // Thứ tự: phím → joystick → nút dpad → chạm neo camera. Mỗi cách giữ hướng về đích 1,2s, vị trí đổi ≥1 ô là đạt.
  function detectSteerMethod(runId, tx, ty) {
    return (async function () {
      var p0 = readPos();
      if (!p0) { log('Dò cách lái: không đọc được vị trí — mặc định phím'); log('Cách lái: phím'); return 'keys'; }
      var dx = tx - p0.x, dy = ty - p0.y;
      var movedFrom = function (q) { return (q.x !== p0.x || q.y !== p0.y) ? 'moved' : null; };
      log('Dò cách lái… (từ (' + p0.x + ',' + p0.y + ') về (' + tx + ',' + ty + '))');

      // a. Phím hướng
      log('Dò cách lái: thử phím…');
      var rk = await holdKeysBurst(runId, codesFor(dx, dy), movedFrom, 1200);
      if (!alive(runId)) return 'keys';
      if (rk.reason === 'moved') { log('Cách lái: phím'); return 'keys'; }
      log('Phím không làm nhân vật di chuyển — thử joystick');

      // b. Joystick ảo
      if (findJoystick()) {
        log('Dò cách lái: thử joystick…');
        var rj = await holdJoyBurst(runId, dx, dy, movedFrom, 1200);
        joyRelease();
        if (!alive(runId)) return 'keys';
        if (rj.reason === 'moved') { log('Cách lái: joystick'); return 'joystick'; }
        log('Joystick không làm nhân vật di chuyển — thử nút dpad');
      } else {
        log('Không thấy joystick (#joystick) — thử nút dpad');
      }

      // c. Nút dpad
      var sx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      var sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
      var btns = findDpadBtns(sx, sy);
      if (btns.exact || btns.xOnly || btns.yOnly) {
        log('Dò cách lái: thử nút dpad…');
        var rd = await holdDpadBurst(runId, sx, sy, movedFrom, 1200);
        if (!alive(runId)) return 'keys';
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

  function pressKey(code, key) {
    var opts = { code: code, key: key || code.replace('Key', '').toLowerCase(), bubbles: true, cancelable: true };
    keyTarget().dispatchEvent(new KeyboardEvent('keydown', opts));
    keyTarget().dispatchEvent(new KeyboardEvent('keyup', opts));
  }
  function pressDom(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var opts = { bubbles: true, cancelable: true, pointerId: 7, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerType: 'touch', isPrimary: true };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    try { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: opts.clientX, clientY: opts.clientY })); } catch (e) {}
    return true;
  }
  function findByText(rootSel, needles) {
    var root = rootSel ? $(rootSel) : document.body;
    if (!root) return null;
    var els = root.querySelectorAll('button, li, div, span, a');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || '').trim();
      if (!t || t.length > 220) continue;
      for (var j = 0; j < needles.length; j++) {
        if (t.indexOf(needles[j]) >= 0) {
          var r = els[i].getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return els[i];
        }
      }
    }
    return null;
  }

  // ============ Chờ có hạn giờ (poll 500ms) ============
  function waitFor(fn, timeoutMs, label) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function tick() {
        var v;
        try { v = fn(); } catch (e) { v = null; }
        if (v) return resolve(v);
        if (Date.now() - t0 >= timeoutMs) { log('Quá giờ chờ: ' + (label || '')); return resolve(null); }
        setTimeout(tick, 500);
      })();
    });
  }
  function alive(runId) { return S.running && S.runId === runId; }
  function waitStablePos(runId, timeoutMs) {
    // Đứng yên = vị trí không đổi trong 800ms liên tiếp (poll 300ms)
    return new Promise(function (resolve) {
      var t0 = Date.now(), prev = null, stillSince = null;
      (function tick() {
        if (!alive(runId)) return resolve(null);
        var p = readPos();
        if (p) {
          if (prev && p.x === prev.x && p.y === prev.y) {
            if (stillSince == null) stillSince = Date.now();
            if (Date.now() - stillSince >= 800) return resolve(p);
          } else stillSince = null;
          prev = p;
        }
        if (Date.now() - t0 >= timeoutMs) return resolve(prev);
        setTimeout(tick, 300);
      })();
    });
  }

  // ============ Hiệu chuẩn px/ô ============
  function calibrate(runId) {
    S.calibDone = true; // chỉ hiệu chuẩn 1 lần/phiên (lười, ngay trước tapNpc đầu tiên)
    log('Hiệu chuẩn px/ô…');
    return (async function () {
      var p0 = await waitStablePos(runId, 8000);
      if (!p0 || !alive(runId)) { S.pxX = 32; S.pxY = 32; S.calibOk = false; log('Hiệu chuẩn thất bại (không đọc được vị trí) — dùng mặc định 32px/ô'); return; }
      var measureAxis = async function (axis) {
        var tries = [96, -96, 160, -160];
        for (var i = 0; i < tries.length; i++) {
          if (!alive(runId)) return 0;
          var before = readPos(); if (!before) return 0;
          var used = axis === 'x' ? tapCanvas(tries[i], 0) : tapCanvas(0, tries[i]);
          var after = await waitStablePos(runId, 12000);
          if (!after) return 0;
          var dTiles = axis === 'x' ? (after.x - before.x) : (after.y - before.y);
          if (dTiles !== 0) {
            var pxUsed = used ? Math.abs(axis === 'x' ? used.dx : used.dy) : Math.abs(tries[i]);
            return pxUsed / Math.abs(dTiles);
          }
        }
        return 0;
      };
      var mx = await measureAxis('x');
      var my = await measureAxis('y');
      // Kẹp sanity: hai trục lệch nhau quá 1,6 lần → số đo rác (chạm tìm đường không đo tin cậy) → mặc định 32 cả hai
      if (mx > 0 && my > 0 && Math.max(mx, my) / Math.min(mx, my) > 1.6) {
        S.pxX = 32; S.pxY = 32; S.calibOk = false;
        log('Hiệu chuẩn hỏng (pxX=' + mx.toFixed(1) + ', pxY=' + my.toFixed(1) + ' lệch quá 1,6 lần) — dùng mặc định 32px/ô');
        return;
      }
      S.pxX = mx > 0 ? mx : 32;
      S.pxY = my > 0 ? my : 32;
      S.calibOk = mx > 0 && my > 0;
      log('Hiệu chuẩn: pxX=' + S.pxX.toFixed(1) + (mx > 0 ? ' (đạt)' : ' (không đo được — mặc định 32)') + ', pxY=' + S.pxY.toFixed(1) + (my > 0 ? ' (đạt)' : ' (không đo được — mặc định 32)'));
    })();
  }

  // ============ Di chuyển trong 1 map: lái theo đợt bằng cách lái đã dò, quyết định theo vị trí đọc được ============
  // (v1.4: tự dò cách lái ở lần di chuyển đầu tiên mỗi phiên — phím → joystick → nút dpad → chạm neo camera.
  //  Tốc độ chỉ dùng ước lượng hạn giờ đợt: đi bộ ~2,1 ô/s, bay ~4 ô/s.)
  function goToTile(runId, tx, ty, tol, timeoutMs) {
    tol = (tol == null ? 1 : tol); timeoutMs = timeoutMs || 180000;
    return (async function () {
      var t0 = Date.now();
      var stucks = 0;         // tổng lần kẹt (đợt không di chuyển / không tiến triển)
      var perpSide = 1;       // phía giữ phím vuông góc, đổi mỗi lần kẹt
      var noProgress = 0;     // số đợt liên tiếp không tiến gần đích hơn (khoảng cách Chebyshev)
      var bestCheb = Infinity;
      var diagOk = true;      // false nếu giữ 2 phím chéo không làm nhân vật di chuyển → giữ từng trục
      var burstFrom = null;   // vị trí + khoảng cách trước đợt gần nhất (cảnh báo thoái lui)
      function cheb(p) { return Math.max(Math.abs(tx - p.x), Math.abs(ty - p.y)); }
      function fmtSec(ms) { return (ms / 1000).toFixed(1).replace('.', ',') + 's'; }
      try {
        while (true) {
          if (!alive(runId)) throw new Error('đã dừng');
          if (Date.now() - t0 > timeoutMs) throw new Error('đi quá giờ tới (' + tx + ',' + ty + ')');
          var p = readPos();
          if (!p) { await sleep(500); continue; }
          if (cheb(p) <= tol) { log('Đã tới (' + tx + ',' + ty + ')'); return p; }
          // Cảnh báo thoái lui: đợt trước làm nhân vật xa đích hơn >2 ô
          if (burstFrom && cheb(p) > burstFrom.cheb + 2) {
            log('Cảnh báo: chạm làm xa đích (' + burstFrom.x + ',' + burstFrom.y + ')→(' + p.x + ',' + p.y + ')');
            if (S.steerMethod === 'tap') { camAnchor = null; log('Bỏ neo camera — sẽ neo lại'); }
          }
          burstFrom = null;

          // Lần di chuyển đầu tiên của phiên: tự dò cách lái (phím → joystick → dpad → chạm neo camera)
          if (!S.steerMethod) {
            S.steerMethod = await detectSteerMethod(runId, tx, ty);
            if (!alive(runId)) throw new Error('đã dừng');
            continue;
          }

          var dx = tx - p.x, dy = ty - p.y; // ô; +y là nam (KeyS)
          var startCheb = cheb(p);
          var startPos = { x: p.x, y: p.y };
          var codes = [];
          if (dx > 0) codes.push('KeyD'); else if (dx < 0) codes.push('KeyA');
          if (dy > 0) codes.push('KeyS'); else if (dy < 0) codes.push('KeyW');
          if (!diagOk && codes.length > 1) codes = [Math.abs(dx) >= Math.abs(dy) ? codes[0] : codes[1]];

          var speed = S.flyingBelief ? 5 : 3.5; // ô/s ước lượng (bay đo thật ~5 ô/s, chạy ~3,5) — chỉ để đặt hạn giờ đợt
          var stepMode = startCheb <= 2;        // gần đích: đợt ngắn 1 bước cho chính xác
          var burstCap = stepMode ? 1200 : clamp(startCheb / speed * 1000 * 1.4 + 700, 800, 12000);
          if (!stepMode && startCheb <= 3) burstCap = Math.min(burstCap, S.flyingBelief ? 900 : 1200); // gần điểm đường: đợt ngắn, tránh vượt
          var burstBest = startCheb;            // khoảng cách gần nhất trong đợt — xa ra là đã vượt đích
          var shouldStop = function (q) {
            var cq = cheb(q);
            if (cq <= tol) return 'arrived';
            if (cq < burstBest) burstBest = cq;
            else if (cq > burstBest) return 'overshoot'; // đã vượt qua điểm gần nhất — nhả ngay, đợt sau tính lại hướng
            if (stepMode) return (q.x !== startPos.x || q.y !== startPos.y) ? 'step' : null;
            var qdx = tx - q.x, qdy = ty - q.y;
            // Nhả khi một trục đã tới 0 hoặc vượt đích (đổi dấu) — đợt sau tính lại hướng (kể cả phím ngược)
            if (dx !== 0 && (qdx === 0 || (qdx > 0) !== (dx > 0))) return 'axis';
            if (dy !== 0 && (qdy === 0 || (qdy > 0) !== (dy > 0))) return 'axis';
            return null;
          };

          burstFrom = { x: p.x, y: p.y, cheb: startCheb };
          var res, burstDesc;
          if (S.steerMethod === 'joystick') {
            res = await holdJoyBurst(runId, dx, dy, shouldStop, burstCap);
            burstDesc = 'kéo joystick hướng ' + dirName(dx, dy) + ' ~' + fmtSec(res.ms);
          } else if (S.steerMethod === 'dpad') {
            var sx = dx > 0 ? 1 : dx < 0 ? -1 : 0, sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
            res = await holdDpadBurst(runId, sx, sy, shouldStop, burstCap);
            burstDesc = 'giữ nút dpad (' + sx + ',' + sy + ') ~' + fmtSec(res.ms);
          } else if (S.steerMethod === 'tap') {
            res = await holdTapBurst(runId, tx, ty, shouldStop, burstCap);
            burstDesc = 'chạm neo camera ~' + fmtSec(res.ms);
          } else {
            res = await holdKeysBurst(runId, codes, shouldStop, burstCap);
            burstDesc = 'giữ phím [' + codes.map(function (c) { return DIR_BY_CODE[c].name; }).join('+') + '] ~' + fmtSec(res.ms);
          }
          log('→(' + tx + ',' + ty + ') từ (' + p.x + ',' + p.y + ') ' + burstDesc);
          if (!alive(runId)) throw new Error('đã dừng');
          var p2 = res.pos || readPos();
          if (!p2) { await sleep(500); continue; }

          // Kiểm chứng bay bằng tốc độ — TÍCH LŨY (port từ Đi Farm v1.2.1, 26/11):
          // đo 1 đợt đơn lẻ KHÔNG BAO GIỜ đo được live (đợt lái chỉ 0,5–1,3s;
          // đợt tới đích return trước khối đo; đợt còn lại <800ms) nên cộng dồn
          // qua các đợt cùng hướng cho tới đủ 2000ms giữ phím rồi mới phán.
          // Quãng đường RÒNG từ đầu cửa sổ tới vị trí hiện tại (sai số lượng
          // tử hoá ~1,4 ô chỉ ở 2 đầu mút) / tổng ms giữ phím, đo bằng EUCLID
          // (game chuẩn hoá vector chéo ×1/√2 nên tốc độ Euclid không đổi
          // theo hướng; Chebyshev đo chéo thấp hơn √2 lần). Ngưỡng 5,0 ô/s
          // từ game.js CONFIG (đi bộ 3,16 / chạy 3,51 / bay+chạy 6,66, chậm
          // nhất 5,96): chạy thường đo tối đa ~4,2 < 5 < ~5,25 bay chậm nhất.
          // CHỈ đo khi Chạy đang BẬT (bay không chạy chỉ 4,04 < 5 → bấm nhầm
          // tắt bay). Reset cửa sổ khi Chạy TẮT, đổi hướng ngược dấu, đợt
          // kẹt/không di chuyển, hoặc đợt bước 1 ô (stepMode). Đo TRƯỚC khi
          // return tới nơi để đợt tới đích vẫn tính vào cửa sổ. Bấm lại tối
          // đa 1 lần/phiên.
          if (S.flyingBelief && !S.flySpeedChecked) {
            var movedB = (p2.x !== startPos.x || p2.y !== startPos.y);
            var sdx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
            var sdy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
            var rsNow = readRunState();
            var runOn = rsNow == null ? S.runBelief : rsNow;
            var flipped = S.flyMeas && ((sdx !== 0 && S.flyMeas.sx !== 0 && sdx !== S.flyMeas.sx) ||
              (sdy !== 0 && S.flyMeas.sy !== 0 && sdy !== S.flyMeas.sy));
            if (!runOn || flipped || !movedB || stepMode) {
              S.flyMeas = null; // Chạy TẮT / đổi hướng / kẹt / bước 1 ô: đợt này không tính, đợt sau mở cửa sổ mới
            } else {
              if (!S.flyMeas) S.flyMeas = { x: startPos.x, y: startPos.y, ms: 0, sx: sdx, sy: sdy };
              S.flyMeas.ms += res.ms;
              if (S.flyMeas.ms >= 2000) {
                var distW = Math.hypot(p2.x - S.flyMeas.x, p2.y - S.flyMeas.y);
                if (distW >= 2) {
                  var spdW = distW / (S.flyMeas.ms / 1000);
                  if (S.flySpeedFirst === null) S.flySpeedFirst = spdW;
                  if (spdW < 5 && !S.flyRetryDone) {
                    S.flyRetryDone = true;
                    log('Phi Hành: tốc độ chỉ ~' + spdW.toFixed(1).replace('.', ',') + ' ô/s (<5) — bay chưa ăn, bấm lại 1 lần');
                    if (pressFly()) await sleep(1200);
                    if (!alive(runId)) throw new Error('đã dừng');
                  } else {
                    S.flySpeedChecked = true;
                    log('Phi Hành: BẬT (tốc độ ~' + spdW.toFixed(1).replace('.', ',') + ' ô/s)');
                    if (spdW < 5) log('Tốc độ vẫn thấp sau khi bấm lại — giữ nguyên, không bấm nữa');
                  }
                }
                S.flyMeas = null; // đo xong (dù đủ quãng đường hay chưa) thì đóng cửa sổ
              }
            }
          }

          if (cheb(p2) <= tol) { log('Đã tới (' + tx + ',' + ty + ')'); return p2; }

          var moved = (p2.x !== startPos.x || p2.y !== startPos.y);
          if (S.steerMethod === 'keys' && codes.length > 1 && !moved && res.reason !== 'arrived') {
            diagOk = false;
            log('Giữ 2 phím chéo không di chuyển — chuyển sang giữ từng trục');
          }
          if (cheb(p2) < bestCheb) { bestCheb = cheb(p2); noProgress = 0; } else noProgress++;

          var isStuck = res.reason === 'stuck' || (!moved && res.reason !== 'arrived') || noProgress >= 3;
          if (isStuck) {
            stucks++;
            if (stucks >= 3) throw new Error('kẹt đường 3 lần tại (' + p2.x + ',' + p2.y + ') map ' + (readMapId() || '?') + ' đích (' + tx + ',' + ty + ') cách lái ' + (S.steerMethod || '?'));
            // Lái vuông góc ~0,6s để thoát vật cản, đổi phía mỗi lần kẹt (theo cách lái đang dùng)
            var perpVec = Math.abs(dx) >= Math.abs(dy) ? { x: 0, y: perpSide } : { x: perpSide, y: 0 };
            perpSide = -perpSide;
            noProgress = 0;
            log('Kẹt/dao động tại (' + p2.x + ',' + p2.y + ') lần ' + stucks + ' — né vật cản hướng ' + dirName(perpVec.x, perpVec.y) + ' ~0,6s');
            if (S.steerMethod === 'joystick') await holdJoyBurst(runId, perpVec.x, perpVec.y, function () { return null; }, 600);
            else if (S.steerMethod === 'dpad') await holdDpadBurst(runId, perpVec.x, perpVec.y, function () { return null; }, 600);
            else if (S.steerMethod === 'tap') await holdTapBurst(runId, p2.x + perpVec.x * 2, p2.y + perpVec.y * 2, function () { return null; }, 6000);
            else await holdKeysBurst(runId, codesFor(perpVec.x, perpVec.y), function () { return null; }, 600);
            if (!alive(runId)) throw new Error('đã dừng');
          }
        }
      } finally {
        releaseAllInputs(); // mọi lối thoát (tới đích/kẹt/hết giờ/dừng/lỗi) đều nhả phím + joystick + dpad
      }
    })();
  }

  // ============ Định tuyến qua điểm trống (đi vào cung đường không vật cản rồi mới tới đích) ============
  // Điểm trống đã biết của map: ô spawn + ô NPC + ô bảng khu + ô cổng (NPC/bảng đứng trên đất trống).
  // Khoảng cách >8 ô hoặc lái thẳng bị kẹt → đi qua điểm trung gian gần tuyến nhất (ưu tiên NPC);
  // kẹt một chặng → thử điểm trống kế tiếp gần đích hơn, tối đa 3 lần kẹt tổng.
  function openPointsFor(mapId) {
    var m = MAPS[mapId];
    if (!m) return [];
    var pts = [];
    (m.npcs || []).forEach(function (n) { pts.push({ tx: n.tx, ty: n.ty, label: 'NPC ' + n.name, kind: 'npc' }); });
    (m.signs || []).forEach(function (s, i) { pts.push({ tx: s[0], ty: s[1], label: 'Bảng Khu' + (m.signs.length > 1 ? ' ' + (i + 1) : ''), kind: 'sign' }); });
    if (m.spawn) pts.push({ tx: m.spawn[0], ty: m.spawn[1], label: 'điểm trống spawn', kind: 'spawn' });
    (m.portals || []).forEach(function (p) { pts.push({ tx: p.tx, ty: p.ty, label: 'ô cổng', kind: 'portal' }); });
    return pts;
  }
  // ============ Tìm đường A* trong map trên lưới ô chặn (runtime) ============
  // Cùng luật với Pathfinder của game: 8 hướng, chéo tốn 1,414 và không cắt góc qua ô chặn.
  // Bay dùng lưới fly (ít chặn hơn — bay qua nước/cây), đi bộ dùng lưới walk.
  // Đích bị chặn (ô cổng là prop, ô NPC...) → lấy ô trống gần nhất trong bán kính 6 như game.
  // v1.8: vòng ô sát biên map (x=0, y=0, x=w-1, y=h-1) coi như chặn khi ĐI QUA — đường chạy phía trong,
  // chỉ bước lên ô biên ở bước cuối khi đích là ô cổng ở biên (opts.allowBorder=true là dự phòng khi
  // không có đường phía trong). opts.extraBlocked = Set chỉ số ô chặn tạm (kẹt thì đánh dấu ô phía trước).
  var _gridCache = {};
  function gridFor(mapId, flying) {
    var g = WALK_GRIDS[mapId];
    if (!g) return null;
    var key = mapId + (flying ? ':fly' : ':walk');
    if (_gridCache[key]) return _gridCache[key];
    var bin;
    try { bin = atob(flying ? g.fly : g.walk); } catch (e) { return null; }
    var n = g.w * g.h, arr = new Uint8Array(n);
    for (var i = 0; i < n; i++) arr[i] = (bin.charCodeAt(i >> 3) >> (i & 7)) & 1;
    var out = { w: g.w, h: g.h, blocked: arr };
    _gridCache[key] = out;
    return out;
  }
  function gridBlocked(grid, x, y) {
    if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return true;
    return grid.blocked[y * grid.w + x] === 1;
  }
  function gridBlockedX(grid, x, y, extra) {
    if (gridBlocked(grid, x, y)) return true;
    return !!(extra && extra.has(y * grid.w + x));
  }
  function isBorderTile(grid, x, y) {
    return x === 0 || y === 0 || x === grid.w - 1 || y === grid.h - 1;
  }
  function nearestGridFree(grid, tx, ty, radius, extra) {
    if (!gridBlockedX(grid, tx, ty, extra)) return { x: tx, y: ty };
    radius = radius || 6;
    for (var r = 1; r <= radius; r++) {
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!gridBlockedX(grid, tx + dx, ty + dy, extra)) return { x: tx + dx, y: ty + dy };
      }
    }
    return null;
  }
  function astarPath(mapId, sx, sy, tx, ty, flying, opts) {
    var grid = gridFor(mapId, flying);
    if (!grid) return null;
    var extra = opts && opts.extraBlocked ? opts.extraBlocked : null;
    var allowBorder = !!(opts && opts.allowBorder);
    var start = nearestGridFree(grid, sx, sy, 6, extra);
    var goal = nearestGridFree(grid, tx, ty, 6, extra);
    if (!start || !goal) return null;
    if (start.x === goal.x && start.y === goal.y) return [];
    var w = grid.w, h = grid.h, n = w * h;
    var gScore = new Float32Array(n).fill(Infinity);
    var came = new Int32Array(n).fill(-1);
    var closed = new Uint8Array(n);
    var sIdx = start.y * w + start.x, gIdx = goal.y * w + goal.x;
    function heur(x, y) {
      var dx = Math.abs(x - goal.x), dy = Math.abs(y - goal.y);
      return dx + dy + (1.414 - 2) * Math.min(dx, dy);
    }
    // Hàng đợi ưu tiên đơn giản bằng mảng + chèn tuyến tính (lưới tối đa 60×44, đủ nhanh)
    var open = [{ i: sIdx, f: heur(start.x, start.y) }];
    gScore[sIdx] = 0;
    var DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    var expansions = 0, MAX_EXP = 20000;
    while (open.length) {
      var bi = 0;
      for (var k = 1; k < open.length; k++) if (open[k].f < open[bi].f) bi = k;
      var cur = open.splice(bi, 1)[0];
      if (closed[cur.i]) continue;
      closed[cur.i] = 1;
      if (++expansions > MAX_EXP) return null;
      if (cur.i === gIdx) {
        var path = [], node = gIdx;
        while (node !== -1) { path.push({ x: node % w, y: Math.floor(node / w) }); node = came[node]; }
        path.reverse(); path.shift();
        return path;
      }
      var cx = cur.i % w, cy = Math.floor(cur.i / w);
      for (var d = 0; d < DIRS.length; d++) {
        var nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
        if (gridBlockedX(grid, nx, ny, extra)) continue;
        // Không men theo rìa map: ô biên chỉ được bước lên khi nó là ô đích (ô cổng ở biên)
        if (!allowBorder && isBorderTile(grid, nx, ny) && !(nx === goal.x && ny === goal.y)) continue;
        if (DIRS[d][0] !== 0 && DIRS[d][1] !== 0) {
          if (gridBlockedX(grid, cx + DIRS[d][0], cy, extra) || gridBlockedX(grid, cx, cy + DIRS[d][1], extra)) continue;
        }
        var nIdx = ny * w + nx;
        if (closed[nIdx]) continue;
        var ng = gScore[cur.i] + DIRS[d][2];
        if (ng < gScore[nIdx]) {
          gScore[nIdx] = ng; came[nIdx] = cur.i;
          open.push({ i: nIdx, f: ng + heur(nx, ny) });
        }
      }
    }
    return null;
  }
  // Đường thẳng giữa 2 ô có trống không (lấy mẫu mỗi 0,25 ô) — để rút gọn điểm đường.
  // Không cho đoạn thẳng chạy dọc biên: mẫu nào rơi vào ô biên (trừ 2 đầu mút) thì không trống.
  function gridLineClear(grid, ax, ay, bx, by, extra, allowBorder) {
    var dist = Math.hypot(bx - ax, by - ay);
    var steps = Math.max(2, Math.ceil(dist / 0.25));
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var x = Math.round(ax + (bx - ax) * t), y = Math.round(ay + (by - ay) * t);
      if (gridBlockedX(grid, x, y, extra)) return false;
      if (!allowBorder && isBorderTile(grid, x, y) && !(x === ax && y === ay) && !(x === bx && y === by)) return false;
    }
    return true;
  }
  function simplifyPath(grid, sx, sy, path, extra, allowBorder) {
    if (!path || path.length <= 1) return path || [];
    var out = [], ax = sx, ay = sy, i = 0;
    while (i < path.length) {
      var j = path.length - 1;
      while (j > i && !gridLineClear(grid, ax, ay, path[j].x, path[j].y, extra, allowBorder)) j--;
      out.push(path[j]);
      ax = path[j].x; ay = path[j].y; i = j + 1;
    }
    return out;
  }
  // Đi tới (tx,ty) theo đường A* từng điểm đường; không có lưới/không có đường → dự phòng goToVia.
  // Đích bị chặn → A* tới ô trống gần nhất (goalTile) rồi DỪNG ở đó, không lái thẳng tiếp vào vách.
  // Kẹt một chặng → đánh dấu ô phía trước là chặn tạm + tính lại đường, tối đa 3 lần tính lại.
  function goToPath(runId, tx, ty, tol, timeoutMs, destLabel) {
    tol = (tol == null ? 1 : tol); timeoutMs = timeoutMs || 180000;
    destLabel = destLabel || 'đích';
    return (async function () {
      var t0 = Date.now();
      function remaining() { return Math.max(15000, timeoutMs - (Date.now() - t0)); }
      var mapId = readMapId();
      var p0 = readPos();
      if (!mapId || !p0 || !WALK_GRIDS[mapId]) return await goToVia(runId, tx, ty, tol, timeoutMs, destLabel);
      var replans = 0;
      var tempBlocked = new Set(); // ô chặn tạm tích lũy trong lần đi này (kẹt thì thêm ô phía trước)
      var curWp = null;
      function chebTo(q, gx, gy) { return Math.max(Math.abs(gx - q.x), Math.abs(gy - q.y)); }
      function markAhead(pf) {
        var gridNow = gridFor(mapId, !!S.flyingBelief) || gridFor(mapId, false);
        if (!gridNow || !pf) return;
        var aim = curWp || { x: tx, y: ty };
        var adx = Math.sign(aim.x - pf.x), ady = Math.sign(aim.y - pf.y);
        if (!adx && !ady) return;
        var ax = pf.x + adx, ay = pf.y + ady;
        if (ax < 0 || ay < 0 || ax >= gridNow.w || ay >= gridNow.h) return;
        if (ax === tx && ay === ty) return; // không chặn chính ô đích
        tempBlocked.add(ay * gridNow.w + ax);
        log('Đánh dấu ô (' + ax + ',' + ay + ') chặn tạm — tính lại đường vòng qua');
      }
      while (true) {
        if (!alive(runId)) throw new Error('đã dừng');
        if (Date.now() - t0 > timeoutMs) throw new Error('đi quá giờ tới (' + tx + ',' + ty + ')');
        var p = readPos();
        if (!p) { await sleep(500); continue; }
        if (chebTo(p, tx, ty) <= tol) return p;
        var flying = !!S.flyingBelief;
        // Thứ tự thử: lưới đúng trạng thái bay (không men biên) → lưới kia → cho phép sát biên (dự phòng)
        var attempts = [
          { fly: flying, allowBorder: false },
          { fly: !flying, allowBorder: false },
          { fly: flying, allowBorder: true },
          { fly: !flying, allowBorder: true },
        ];
        var raw = null, usedFly = flying, usedBorder = false;
        for (var ai = 0; ai < attempts.length && !raw; ai++) {
          raw = astarPath(mapId, p.x, p.y, tx, ty, attempts[ai].fly, { extraBlocked: tempBlocked, allowBorder: attempts[ai].allowBorder });
          if (raw) { usedFly = attempts[ai].fly; usedBorder = attempts[ai].allowBorder; }
        }
        if (!raw) {
          log('A*: không có đường ' + (flying ? 'bay' : 'đi bộ') + ' từ (' + p.x + ',' + p.y + ') tới (' + tx + ',' + ty + ') ở ' + (MAPS[mapId] ? MAPS[mapId].name : mapId) + ' — dự phòng qua điểm trống');
          return await goToVia(runId, tx, ty, tol, remaining(), destLabel);
        }
        if (usedBorder) log('A*: không có đường phía trong tới (' + tx + ',' + ty + ') — dự phòng đường sát biên');
        var grid = gridFor(mapId, usedFly);
        var goalTile = raw.length ? raw[raw.length - 1] : p;
        if (goalTile.x !== tx || goalTile.y !== ty) {
          log('Đích (' + tx + ',' + ty + ') là ô chặn — tới ô trống gần nhất (' + goalTile.x + ',' + goalTile.y + ') rồi dừng');
        }
        var wps = simplifyPath(grid, p.x, p.y, raw, tempBlocked, usedBorder);
        if (!wps.length) return p;
        log('A*: ' + wps.length + ' điểm đường tới ' + destLabel + ' (' + tx + ',' + ty + ')' + (flying ? ' (bay)' : ' (đi bộ)') +
          ' — ' + wps.slice(0, 4).map(function (q) { return '(' + q.x + ',' + q.y + ')'; }).join('→') + (wps.length > 4 ? '→…' : ''));
        try {
          for (var wi = 0; wi < wps.length; wi++) {
            if (!alive(runId)) throw new Error('đã dừng');
            var wp = wps[wi];
            curWp = wp;
            var last = wi === wps.length - 1;
            await goToTile(runId, wp.x, wp.y, last ? tol : 1, remaining());
          }
          var pf = readPos();
          if (pf && chebTo(pf, tx, ty) <= Math.max(tol, 1)) return pf;
          // Đích bị chặn: đã tới ô trống gần nhất (goalTile) là đạt — dừng ở đó, không lái tiếp vào vách
          if (pf && chebTo(pf, goalTile.x, goalTile.y) <= Math.max(tol, 1)) return pf;
          if (++replans > 3) throw new Error('kẹt đường sau 3 lần tính lại A* tại (' + (pf ? pf.x : '?') + ',' + (pf ? pf.y : '?') + ')');
          log('Chưa sát đích sau A* — tính lại đường (lần ' + replans + ')');
          markAhead(pf);
        } catch (e) {
          if (!alive(runId) || !/kẹt đường/.test(e.message)) throw e;
          if (++replans > 3) {
            log('Kẹt 3 lần tính lại A* (' + e.message + ') — dự phòng qua điểm trống');
            return await goToVia(runId, tx, ty, tol, remaining(), destLabel);
          }
          log('Kẹt một chặng A* (' + e.message + ') — tính lại đường từ vị trí hiện tại (lần ' + replans + ')');
          markAhead(readPos());
          await sleep(600);
        }
      }
    })();
  }
  function goToVia(runId, tx, ty, tol, timeoutMs, destLabel) {
    tol = (tol == null ? 1 : tol); timeoutMs = timeoutMs || 180000;
    destLabel = destLabel || 'đích';
    return (async function () {
      var t0 = Date.now();
      function remaining() { return Math.max(15000, timeoutMs - (Date.now() - t0)); }
      function cheb2(ax, ay, bx, by) { return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); }
      var p0 = readPos();
      var mapId = readMapId();
      // Gần đích (≤8 ô) hoặc không đọc được vị trí/map: lái thẳng như cũ
      if (!p0 || !mapId || cheb2(p0.x, p0.y, tx, ty) <= 8) {
        return await goToTile(runId, tx, ty, tol, remaining());
      }
      var open = openPointsFor(mapId);
      // Xếp điểm trung gian theo tổng quãng (hiện tại→điểm + điểm→đích); ưu tiên NPC khi hòa
      var scored = open.map(function (pt) {
        return { pt: pt, score: cheb2(p0.x, p0.y, pt.tx, pt.ty) + cheb2(pt.tx, pt.ty, tx, ty), toDest: cheb2(pt.tx, pt.ty, tx, ty) };
      }).sort(function (a, b) {
        if (a.score !== b.score) return a.score - b.score;
        return (a.pt.kind === 'npc' ? 0 : 1) - (b.pt.kind === 'npc' ? 0 : 1);
      });
      var stuckBudget = 3;
      var tried = {};
      var viaIdx = 0;
      while (true) {
        if (!alive(runId)) throw new Error('đã dừng');
        if (Date.now() - t0 > timeoutMs) throw new Error('đi quá giờ tới (' + tx + ',' + ty + ')');
        var p = readPos();
        if (!p) { await sleep(500); continue; }
        if (cheb2(p.x, p.y, tx, ty) <= tol) return p;
        // Chọn điểm trung gian chưa thử, gần tuyến nhất; hết điểm thì lái thẳng
        var via = null;
        while (viaIdx < scored.length) {
          var cand = scored[viaIdx++];
          var key = cand.pt.tx + ',' + cand.pt.ty;
          if (tried[key]) continue;
          if (cheb2(p.x, p.y, cand.pt.tx, cand.pt.ty) <= 1) continue; // đang đứng ngay điểm này
          if (cheb2(cand.pt.tx, cand.pt.ty, tx, ty) <= tol) continue; // điểm trùng đích
          via = cand.pt; tried[key] = true; break;
        }
        try {
          if (via) {
            if (via.kind === 'npc' && destLabel === 'cổng') {
              log('Tuyến: (' + p.x + ',' + p.y + ') → ' + via.label + ' (' + via.tx + ',' + via.ty + ') → cổng (' + tx + ',' + ty + ')');
            } else {
              log('qua điểm trống (' + via.tx + ',' + via.ty + ') rồi tới ' + destLabel + ' (' + tx + ',' + ty + ')');
            }
            await goToTile(runId, via.tx, via.ty, 1, remaining());
            if (!alive(runId)) throw new Error('đã dừng');
            return await goToTile(runId, tx, ty, tol, remaining());
          }
          return await goToTile(runId, tx, ty, tol, remaining());
        } catch (e) {
          if (!alive(runId) || !/kẹt đường/.test(e.message)) throw e;
          stuckBudget--;
          if (stuckBudget <= 0) {
            var untried = scored.filter(function (c2) { return !tried[c2.pt.tx + ',' + c2.pt.ty]; })[0];
            log('Hết lượt thử điểm trống. Gợi ý điểm trống gần nhất chưa thử: ' + (untried ? untried.pt.label + ' (' + untried.pt.tx + ',' + untried.pt.ty + ')' : 'không còn điểm trống nào trong dữ liệu') + ' — đích ' + destLabel + ' (' + tx + ',' + ty + '), cách lái ' + (S.steerMethod || '?'));
            throw e;
          }
          log('Kẹt một chặng (' + e.message + ') — thử điểm trống kế tiếp (còn ' + stuckBudget + ' lần kẹt)');
        }
      }
    })();
  }

  // ============ BFS đường cổng + qua map ============
  function bfsPath(from, to) {
    if (!MAPS[from] || !MAPS[to]) return null;
    if (from === to) return [];
    var prev = {}, q = [from]; prev[from] = null;
    while (q.length) {
      var cur = q.shift();
      var ps = MAPS[cur].portals;
      for (var i = 0; i < ps.length; i++) {
        if (!(ps[i].to in prev)) { prev[ps[i].to] = { from: cur, portal: ps[i] }; if (ps[i].to === to) q = []; else q.push(ps[i].to); }
      }
    }
    if (!(to in prev)) return null;
    var path = [], node = to;
    while (prev[node]) { path.unshift(prev[node].portal); node = prev[node].from; }
    return path;
  }
  function pairPortal(cur, hop) {
    // Ô cổng cặp: cùng map đích, khác ô (dữ liệu cổng nhúng thường có cặp ty kề nhau)
    var ps = (MAPS[cur] && MAPS[cur].portals) || [];
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].to === hop.to && (ps[i].tx !== hop.tx || ps[i].ty !== hop.ty)) return ps[i];
    }
    return null;
  }
  // ============ Cụm liên thông + map gần nhất khi đích không có cổng vào ============
  // Đồ thị cổng RUNTIME (sau sửa đổi lúc chạy của client): từ tan_vien tới được 13 map — gồm
  // Bãi Đá qua cổng Tản Viên (39,14/15), Miếu Ông Trường Con qua Bãi Đá (9–11,0), Mỏ Linh Thạch, Thung Lũng.
  // Còn ngoài: {rung_mang_xa, mach_dat_dong, dam_lay_boss} khép kín (Huyết Xích Cấm Địa — map tổ đội,
  // cổng về tan_vien bị game xóa lúc chạy) + {hu_thien_1..4} (vào qua NPC Thủ Điện Sỹ Sách ở
  // dong_mach_ngam, hoạt động mở Thứ Năm 20:16 — trích từ mã client HuThien.NPC/NPC_MAP).
  function reachableFrom(from) {
    var seen = {};
    if (!MAPS[from]) return seen;
    var q = [from]; seen[from] = true;
    while (q.length) {
      var cur = q.shift();
      (MAPS[cur].portals || []).forEach(function (p) { if (!seen[p.to]) { seen[p.to] = true; q.push(p.to); } });
    }
    return seen;
  }
  function clusterOf(mapId) {
    // Cụm liên thông vô hướng (cổng 2 chiều) chứa mapId trong dữ liệu nhúng
    var seen = {};
    if (!MAPS[mapId]) return seen;
    var q = [mapId]; seen[mapId] = true;
    while (q.length) {
      var cur = q.shift();
      (MAPS[cur].portals || []).forEach(function (p) { if (!seen[p.to]) { seen[p.to] = true; q.push(p.to); } });
      Object.keys(MAPS).forEach(function (id) {
        if (seen[id]) return;
        (MAPS[id].portals || []).forEach(function (p) { if (p.to === cur) { seen[id] = true; q.push(id); } });
      });
    }
    return seen;
  }
  // Map gần nhất đi được khi target không tới được từ cur.
  // Ưu tiên: (1) map mà cổng RA của cụm đích trỏ về (nếu đi được từ cur);
  // (2) hu_thien_* → dong_mach_ngam (NPC Thủ Điện Sỹ Sách mở Sỹ Sách Điện);
  // (3) map đi được gần đích nhất theo khoảng cách vô hướng; (4) tan_vien; (5) chính cur.
  // Tập map đi tới được target theo cổng có hướng (gồm chính target) — "phía đích" của đồ thị
  function canReachTarget(target) {
    var seen = {};
    if (!MAPS[target]) return seen;
    var q = [target]; seen[target] = true;
    while (q.length) {
      var cur = q.shift();
      Object.keys(MAPS).forEach(function (id) {
        if (seen[id]) return;
        (MAPS[id].portals || []).forEach(function (p) { if (p.to === cur) { seen[id] = true; q.push(id); } });
      });
    }
    return seen;
  }
  function nearestStagingMap(cur, target) {
    var reach = reachableFrom(cur);
    if (reach[target]) return { map: target, reason: 'reachable' };
    // Cổng RA của phía đích: cổng từ một map thuộc phía đích sang map đi được từ cur (ngoài phía đích)
    var side = canReachTarget(target);
    var exits = [];
    Object.keys(side).forEach(function (id) {
      (MAPS[id].portals || []).forEach(function (p) { if (!side[p.to] && reach[p.to]) exits.push({ from: id, to: p.to }); });
    });
    if (exits.length) return { map: exits[0].to, reason: 'exit', exitFrom: exits[0].from };
    if (/^hu_thien_/.test(target) && reach['dong_mach_ngam']) return { map: 'dong_mach_ngam', reason: 'huthien-npc' };
    // Khoảng cách vô hướng từ mọi map đi được tới đích (BFS đa nguồn trên đồ thị vô hướng)
    var dist = {}, q = [];
    Object.keys(reach).forEach(function (id) { dist[id] = 0; q.push(id); });
    while (q.length) {
      var c = q.shift();
      var nb = {};
      (MAPS[c].portals || []).forEach(function (p) { nb[p.to] = true; });
      Object.keys(MAPS).forEach(function (id) {
        (MAPS[id].portals || []).forEach(function (p) { if (p.to === c) nb[id] = true; });
      });
      Object.keys(nb).forEach(function (id) { if (!(id in dist)) { dist[id] = dist[c] + 1; q.push(id); } });
    }
    if (target in dist) {
      var best = null, bestD = Infinity;
      Object.keys(reach).forEach(function (id) {
        // khoảng cách vô hướng từ id tới target: chạy BFS ngược từ target
        var dd = undirectedDist(id, target);
        if (dd < bestD) { bestD = dd; best = id; }
      });
      if (best) return { map: best, reason: 'nearest' };
    }
    if (reach['tan_vien']) return { map: 'tan_vien', reason: 'hub' };
    return { map: cur, reason: 'stay' };
  }
  function undirectedDist(a, b) {
    if (a === b) return 0;
    var seen = {}; seen[a] = true;
    var q = [{ id: a, d: 0 }];
    while (q.length) {
      var n = q.shift();
      var nb = {};
      (MAPS[n.id].portals || []).forEach(function (p) { nb[p.to] = true; });
      Object.keys(MAPS).forEach(function (id) {
        (MAPS[id].portals || []).forEach(function (p) { if (p.to === n.id) nb[id] = true; });
      });
      var ids = Object.keys(nb);
      for (var i = 0; i < ids.length; i++) {
        if (ids[i] === b) return n.d + 1;
        if (!seen[ids[i]]) { seen[ids[i]] = true; q.push({ id: ids[i], d: n.d + 1 }); }
      }
    }
    return Infinity;
  }
  function stagingReasonText(near, target) {
    var tName = MAPS[target] ? MAPS[target].name : target;
    var nName = MAPS[near.map] ? MAPS[near.map].name : near.map;
    if (near.reason === 'exit') return 'cổng ra của ' + (MAPS[near.exitFrom] ? MAPS[near.exitFrom].name : near.exitFrom) + ' về ' + nName;
    if (near.reason === 'huthien-npc') return 'NPC Thủ Điện Sỹ Sách ở ' + nName + ' mở Sỹ Sách Điện (Thứ Năm 20:16, 30 phút)';
    if (near.reason === 'nearest') return 'map đi được gần ' + tName + ' nhất theo đồ thị cổng';
    if (near.reason === 'hub') return 'map trung tâm đi được';
    return 'đang ở map đi được gần nhất';
  }
  function tryCrossPortal(runId, cur, portal) {
    // Tới ô cổng (bay nếu đang bay) → chờ đổi map 12s; chưa đổi mà đang bay → hạ cánh, đi bộ lên ô cổng, chờ 12s
    return (async function () {
      log('Tới ô cổng (' + portal.tx + ',' + portal.ty + ') → ' + (MAPS[portal.to] ? MAPS[portal.to].name : portal.to) + (S.flyingBelief ? ' (đang bay)' : ' (đi bộ)'));
      try {
        await goToPath(runId, portal.tx, portal.ty, 0, 240000, 'cổng');
      } catch (e) {
        if (!alive(runId)) throw e;
        log('Chưa tới được ô cổng (' + portal.tx + ',' + portal.ty + '): ' + e.message + (S.flyingBelief ? ' — hạ cánh thử đi bộ' : ''));
        if (!S.flyingBelief) return null;
        await ensureFly(runId, false);
        try { await goToTile(runId, portal.tx, portal.ty, 0, 120000); }
        catch (e2) { if (!alive(runId)) throw e2; log('Đi bộ cũng chưa tới được ô cổng: ' + e2.message); return null; }
      }
      var changed = await waitFor(function () { var m = readMapId(); return m && m !== cur ? m : null; }, 12000, 'đổi map');
      if (changed) return changed;
      if (S.flyingBelief) {
        log('Chưa qua được cổng (' + portal.tx + ',' + portal.ty + ') khi bay — hạ cánh đi bộ lên ô cổng');
        await ensureFly(runId, false);
        try { await goToTile(runId, portal.tx, portal.ty, 0, 120000); }
        catch (e3) { if (!alive(runId)) throw e3; log('Đi bộ lên ô cổng lỗi: ' + e3.message); return null; }
        changed = await waitFor(function () { var m = readMapId(); return m && m !== cur ? m : null; }, 12000, 'đổi map (đi bộ)');
        if (changed) return changed;
      }
      return null;
    })();
  }
  // Điểm neo của map: ô trống cố định (kề NPC chính / điểm trống) — qua cổng vào map là tới đó trước,
  // rồi các chặng sau trong map xuất phát từ điểm neo thay vì từ ô spawn sát vách/cổng.
  function goToAnchor(runId, mapId) {
    return (async function () {
      var m = MAPS[mapId];
      if (!m || !m.anchor) return;
      var p = readPos();
      if (p && Math.max(Math.abs(m.anchor[0] - p.x), Math.abs(m.anchor[1] - p.y)) <= 1) {
        log('Đã ở điểm neo của ' + m.name + ' (' + m.anchor[0] + ',' + m.anchor[1] + ')');
        return;
      }
      setStatus('Tới điểm neo ' + (m.anchorLabel || '') + ' (' + m.anchor[0] + ',' + m.anchor[1] + ')…');
      log('Tới điểm neo của ' + m.name + ': ' + (m.anchorLabel || 'điểm trống') + ' (' + m.anchor[0] + ',' + m.anchor[1] + ')');
      try {
        await goToPath(runId, m.anchor[0], m.anchor[1], 1, 180000, 'điểm neo');
      } catch (e) {
        if (!alive(runId)) throw e;
        log('Chưa tới được điểm neo (' + e.message + ') — đi tiếp từ vị trí hiện tại');
      }
    })();
  }
  function travelTo(runId, targetMap) {
    return (async function () {
      var cur = readMapId();
      if (!cur) throw new Error('không đọc được map hiện tại');
      if (cur === targetMap) return;
      var path = bfsPath(cur, targetMap);
      if (!path) throw new Error('không có đường cổng từ ' + cur + ' tới ' + targetMap);
      var flyMode = S.flyingBelief; // vào travelTo đang bay thì giữ bay qua các chặng (hạ cánh khi cần rồi bay lại)
      log('Đường đi: ' + cur + ' → ' + targetMap + ' (' + path.length + ' cổng)' + (flyMode ? ' — bay' : ''));
      for (var i = 0; i < path.length; i++) {
        if (!alive(runId)) throw new Error('đã dừng');
        var hop = path[i];
        setStatus('Qua cổng tới ' + (MAPS[hop.to] ? MAPS[hop.to].name : hop.to) + '…');
        if (flyMode && !S.flyingBelief) await ensureFly(runId, true);
        var changed = await tryCrossPortal(runId, cur, hop);
        if (!changed) {
          var pair = pairPortal(cur, hop);
          if (pair) {
            log('Thử ô cổng cặp (' + pair.tx + ',' + pair.ty + ') → ' + (MAPS[pair.to] ? MAPS[pair.to].name : pair.to));
            if (flyMode && !S.flyingBelief) await ensureFly(runId, true);
            changed = await tryCrossPortal(runId, cur, pair);
          }
        }
        if (!changed) {
          // Dự phòng cuối (giữ từ v1.1): chạm thêm 1 ô theo hướng ra mép
          log('Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') — chạm thêm ra mép (dự phòng)');
          var p = readPos();
          if (p) tapCanvas(clamp((hop.tx - p.x) * S.pxX, -2 * S.pxX, 2 * S.pxX) || (hop.tx === 0 ? -2 * S.pxX : 2 * S.pxX), clamp((hop.ty - p.y) * S.pxY, -2 * S.pxY, 2 * S.pxY) || (hop.ty === 0 ? -2 * S.pxY : 2 * S.pxY));
          changed = await waitFor(function () { var m = readMapId(); return m && m !== cur ? m : null; }, 12000, 'đổi map (lần cuối)');
        }
        if (!changed) throw new Error('không qua được cổng tại (' + hop.tx + ',' + hop.ty + ')');
        cur = changed;
        log('Đã tới map: ' + (MAPS[cur] ? MAPS[cur].name : cur));
        await sleep(800);
        await goToAnchor(runId, cur); // vào map nào cũng tới điểm neo của map đó trước
      }
      if (flyMode && !S.flyingBelief) await ensureFly(runId, true);
    })();
  }

  // ============ Chọn khu qua bảng khu (KhuUI) ============
  // Chạm prop bảng khu (type:"khu_board") → KhuUI.open() hiện panel #khu-panel (bỏ class hidden).
  // Nút khu: button.khu-o[data-khu="N"], khu hiện tại có class "dang"; .khu-note ghi "Đang ở khu N…".
  // Bấm khu khác → game gửi Gateway {op:"khu",act:"chon"} rồi đóng panel + tải lại map theo khu.
  // Panel tạo lười lần mở đầu; đóng rồi DOM vẫn còn nhưng chữ cũ (stale) → kiểm chứng phải mở lại bảng.
  function khuPanelOpen() {
    var p = $('#khu-panel');
    if (!p || p.classList.contains('hidden')) return false;
    var r = p.getBoundingClientRect(), s = getComputedStyle(p);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  }
  function readCurrentZone() {
    var cur = document.querySelector('#khu-panel .khu-o.dang');
    if (cur) {
      var n = parseInt(cur.getAttribute('data-khu') || '', 10);
      if (!isNaN(n)) return n;
    }
    var note = document.querySelector('#khu-panel .khu-note');
    if (note) {
      var m = (note.textContent || '').match(/Đang ở khu\s*(\d+)/);
      if (m) return +m[1];
    }
    return null;
  }
  function closeKhuPanel() {
    var x = document.querySelector('#khu-panel .khu-x');
    if (x) pressDom(x);
  }
  // Mở bảng khu: đứng cạnh bảng → bấm nút Tương Tác; không thấy nút → dự phòng chạm xoắn ốc
  function openKhuPanel(runId, budgetMs) {
    return (async function () {
      if (khuPanelOpen()) return true;
      if (await pressInteractBtn(runId, Math.min(8000, budgetMs || 8000), 'bảng khu')) {
        var ok = await waitFor(function () { return khuPanelOpen() ? true : null; }, 5000, 'bảng khu hiện');
        if (ok) { log('Bước chọn khu: đã mở bảng khu bằng nút Tương Tác'); return true; }
        log('Bấm Tương Tác mà bảng khu chưa hiện — dự phòng chạm xoắn ốc');
      } else {
        log('Dự phòng chạm xoắn ốc mở bảng khu');
      }
      return await tapSpiral(runId, khuPanelOpen, 'bảng khu', budgetMs);
    })();
  }
  function ensureZone(runId, mapId, want) {
    return (async function () {
      var m = MAPS[mapId];
      var signs = (m && m.signs) || [];
      if (!signs.length) { log('Map ' + (m ? m.name : mapId) + ' không có bảng khu trong dữ liệu — không chọn được khu — farm ở khu hiện tại'); return false; }
      var cur0 = readCurrentZone();
      if (cur0 === want) { log('Đã ở Khu ' + want + ' — không cần đổi'); return true; }
      if (cur0 == null) log('Không đọc được khu hiện tại — vẫn tới bảng chọn Khu ' + want + ' (chọn trùng vô hại)');
      var board = signs[0];
      setStatus('Tới bảng khu (' + board[0] + ',' + board[1] + ') chọn Khu ' + want + '…');
      await standNextTo(runId, board[0], board[1], 'bảng khu');
      await ensureFly(runId, false); // hạ cánh, đứng cạnh bảng mới tương tác được
      // Khâu tại bảng tối đa 15s: mở bảng → đọc khu → bấm chọn → mở lại kiểm chứng
      var boardT0 = Date.now(), BOARD_BUDGET = 15000;
      function boardLeft() { return Math.max(1000, BOARD_BUDGET - (Date.now() - boardT0)); }
      log('Bước chọn khu: đứng cạnh bảng, bấm Tương Tác mở bảng…');
      if (!(await openKhuPanel(runId, boardLeft()))) { log('không chọn được khu — farm ở khu hiện tại (không mở được bảng khu)'); return false; }
      await sleep(500);
      var cur = readCurrentZone();
      log('Bước chọn khu: bảng đã hiện, khu hiện tại đọc được: ' + (cur == null ? 'không rõ' : cur));
      if (cur === want) { log('Đã ở Khu ' + want + ' — đóng bảng'); closeKhuPanel(); await sleep(500); return true; }
      var btn = document.querySelector('#khu-panel .khu-o[data-khu="' + want + '"]');
      if (!btn) { log('Bảng khu không có Khu ' + want + ' (map này ít khu hơn) — không chọn được khu — farm ở khu hiện tại'); closeKhuPanel(); await sleep(500); return false; }
      log('Bước chọn khu: đang ở Khu ' + (cur == null ? '?' : cur) + ' — bấm chọn Khu ' + want);
      pressDom(btn);
      // Chờ panel đóng + nhân vật đứng yên (đổi khu tải lại map)
      await waitFor(function () { return !khuPanelOpen() ? true : null; }, 8000, 'bảng khu đóng sau khi chọn');
      await waitStablePos(runId, 15000);
      if (!alive(runId)) return false;
      // Mở lại bảng kiểm chứng (chữ cũ stale cho tới lần render sau)
      log('Bước chọn khu: mở lại bảng kiểm chứng…');
      if (await openKhuPanel(runId, boardLeft())) {
        await sleep(500);
        var cur2 = readCurrentZone();
        if (cur2 === want) log('Đã đổi sang Khu ' + want + ' (kiểm chứng qua bảng khu)');
        else log('Khu hiện tại đọc được: ' + (cur2 == null ? 'không rõ' : cur2) + ' (muốn Khu ' + want + ') — không chọn được khu — farm ở khu hiện tại');
        closeKhuPanel();
        await sleep(500);
        return cur2 === want;
      }
      log('Không mở lại được bảng khu để kiểm chứng trong hạn 15s — coi như đã chọn Khu ' + want);
      return true;
    })();
  }

  // ============ Auto ============
  // Trạng thái Auto thật đọc từ class "active"/aria-pressed của #btn-auto-touch (readAutoState).
  // Bật/tắt có kiểm chứng: bấm nút → đọc lại; chưa ăn → phím KeyT → đọc lại; không đọc được
  // trạng thái thì quay về phát hiện lật qua autoSig như v1.6 và ghi rõ "không đọc được trạng thái".
  function toggleAutoOnce() {
    var before = autoSig();
    pressKey('KeyT', 't');
    return sleep(1100).then(function () {
      if (autoSig() !== before) return true;
      var el = $('#btn-auto-touch') || $('#btn-auto');
      if (el) pressDom(el);
      return sleep(1100).then(function () { return autoSig() !== before; });
    });
  }
  function pressAutoBtn() {
    var el = $('#btn-auto-touch') || $('#btn-auto');
    if (!el) return false;
    return pressDom(el);
  }
  function ensureAuto(runId, on) {
    return (async function () {
      var cur = readAutoState();
      var state = cur == null ? S.autoBelief : cur;
      if (state === on) {
        S.autoBelief = on;
        log('Auto: ' + (on ? 'BẬT' : 'TẮT') + (cur != null ? ' (đã kiểm chứng)' : ' (tin — không đọc được trạng thái)'));
        return true;
      }
      // Cách 1: bấm nút #btn-auto-touch
      if (pressAutoBtn()) {
        await sleep(900);
        if (!alive(runId)) return false;
        cur = readAutoState();
        if (cur === on) {
          S.autoBelief = on; if (on) S.autoByTool = true;
          log('Auto: ' + (on ? 'BẬT' : 'TẮT') + ' (đã kiểm chứng)');
          return true;
        }
      }
      // Cách 2: phím KeyT (KeyR cũng lật Auto trong game)
      pressKey('KeyT', 't');
      await sleep(900);
      if (!alive(runId)) return false;
      cur = readAutoState();
      if (cur === on) {
        S.autoBelief = on; if (on) S.autoByTool = true;
        log('Auto: ' + (on ? 'BẬT' : 'TẮT') + ' (đã kiểm chứng)');
        return true;
      }
      if (cur != null) {
        S.autoBelief = cur;
        log('Auto: ' + (cur ? 'BẬT' : 'TẮT') + ' (chưa đúng ý — trạng thái thật đọc từ nút Auto)');
        return false;
      }
      // Không đọc được trạng thái thật: quay về phát hiện lật qua autoSig
      var ok = await toggleAutoOnce();
      if (!alive(runId)) return false;
      if (ok) { S.autoBelief = on; if (on) S.autoByTool = true; log('Auto: đã bấm ' + (on ? 'BẬT' : 'TẮT') + ' (không đọc được trạng thái)'); }
      else log('Không lật được trạng thái Auto (nút + KeyT đều không đổi) — kiểm tra tay');
      return ok;
    })();
  }

  // ============ Phi Hành (ngự kiếm) ============
  // Nút #btn-fly bind pointerdown (Input.pressFlyToggle). Không đọc được cờ bay thật từ ngoài
  // nên S.flyingBelief chỉ là trạng thái tin (belief) như autoBelief — nhật ký ghi rõ.
  function findFlyButton() {
    var el = $('#btn-fly');
    if (el) return el;
    var els = document.querySelectorAll('button, [role="button"], div, span');
    for (var i = 0; i < els.length; i++) {
      var al = els[i].getAttribute('aria-label') || '';
      if (/Phi Hành|Phi Hanh|Bay/i.test(al)) {
        var r = els[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return els[i];
      }
    }
    return findByText(null, ['Phi Hành']);
  }
  function pressFly() {
    var el = findFlyButton();
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var opts = { bubbles: true, cancelable: true, pointerId: 5, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerType: 'touch', isPrimary: true };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    setTimeout(function () { el.dispatchEvent(new PointerEvent('pointerup', opts)); }, 120);
    return true;
  }
  function ensureFly(runId, on) {
    return (async function () {
      if (S.flyingBelief === on) return true;
      if (!pressFly()) { log('Không thấy nút Phi Hành (#btn-fly) — không ' + (on ? 'bật bay' : 'hạ cánh') + ' được'); return false; }
      if (on) {
        // Thăng 0,25s; lần bay đầu có hoạt cảnh vài giây → chờ đứng yên (tối đa 8s) + 1s, tổng tối thiểu 3,5s
        var t0 = Date.now();
        await waitStablePos(runId, 8000);
        var elapsed = Date.now() - t0;
        if (elapsed < 3500) await sleep(3500 - elapsed);
        await sleep(1000);
        if (!alive(runId)) return false;
        S.flyingBelief = true;
        log('Phi Hành: BẬT (tin là đang bay)');
      } else {
        await sleep(1500);
        if (!alive(runId)) return false;
        S.flyingBelief = false;
        log('Phi Hành: TẮT');
      }
      setStatus(S.status);
      return true;
    })();
  }
  function manualFlyToggle() {
    if (!pressFly()) { log('Không thấy nút Phi Hành (#btn-fly)'); return; }
    S.flyingBelief = !S.flyingBelief;
    log('Phi Hành (tay): ' + (S.flyingBelief ? 'BẬT (tin là đang bay)' : 'TẮT'));
    setStatus(S.status);
  }

  // ============ Chạy (Run) ============
  // Nút #btn-run bind pointerdown (Input.toggleRun); Input.onRunChange gắn/bỏ class "active"
  // trên #btn-run theo trạng thái chạy THẬT → đọc được trạng thái thật từ classList.
  // Phím Shift (ShiftLeft/ShiftRight keydown, không repeat) cũng toggleRun — dự phòng khi không thấy nút.
  function readRunState() {
    var el = $('#btn-run');
    if (!el) return null;
    return el.classList.contains('active');
  }
  function pressRunPointer() {
    var el = $('#btn-run');
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var opts = { bubbles: true, cancelable: true, pointerId: 9, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerType: 'touch', isPrimary: true };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    setTimeout(function () { el.dispatchEvent(new PointerEvent('pointerup', opts)); }, 120);
    return true;
  }
  function pressRunShift() {
    // Phím ShiftLeft (game đọc e.code, không kiểm isTrusted) cũng toggleRun
    keyTarget().dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', key: 'Shift', bubbles: true, cancelable: true }));
    keyTarget().dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', key: 'Shift', bubbles: true, cancelable: true }));
    return true;
  }
  function pressRunClick() {
    var el = $('#btn-run');
    if (!el) return false;
    var r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }));
    return true;
  }
  function pressRun() {
    return pressRunPointer() || pressRunShift();
  }
  // Bật/tắt Chạy có kiểm chứng: đọc #btn-run.active trước/sau từng cách, tối đa 3 cách
  // (pointerdown+up → ShiftLeft → click). Không thấy nút → tin theo lệnh bấm như cũ.
  function ensureRun(runId, on) {
    return (async function () {
      var cur = readRunState();
      var state = cur == null ? S.runBelief : cur;
      if (state === on) {
        S.runBelief = on;
        if (cur != null) log('Chạy: ' + (on ? 'BẬT' : 'TẮT') + ' (đã kiểm chứng)');
        return true;
      }
      if (cur == null) {
        pressRun();
        await sleep(700);
        if (!alive(runId)) return false;
        S.runBelief = on;
        log('Chạy: ' + (on ? 'BẬT' : 'TẮT') + ' (không đọc được trạng thái thật — tin theo lệnh bấm)');
        setStatus(S.status);
        return true;
      }
      var ways = [
        { name: 'bấm nút (pointer)', fn: pressRunPointer },
        { name: 'phím Shift', fn: pressRunShift },
        { name: 'sự kiện click', fn: pressRunClick }
      ];
      for (var wi = 0; wi < ways.length; wi++) {
        if (!ways[wi].fn()) continue;
        await sleep(700);
        if (!alive(runId)) return false;
        var after = readRunState();
        if (after === on) {
          S.runBelief = on;
          log('Chạy: ' + (on ? 'BẬT' : 'TẮT') + ' (đã kiểm chứng, cách ' + (wi + 1) + ': ' + ways[wi].name + ')');
          setStatus(S.status);
          return true;
        }
        log('Chạy: cách ' + (wi + 1) + ' (' + ways[wi].name + ') chưa ăn — trạng thái thật vẫn ' + (after ? 'BẬT' : 'TẮT'));
      }
      var fin = readRunState();
      S.runBelief = fin == null ? S.runBelief : fin;
      log('Chạy: ' + (S.runBelief ? 'BẬT' : 'TẮT') + ' (chưa đúng ý sau 3 cách — trạng thái thật đọc từ #btn-run)');
      setStatus(S.status);
      return false;
    })();
  }
  function manualRunToggle() {
    pressRun();
    setTimeout(function () {
      var after = readRunState();
      S.runBelief = after == null ? !S.runBelief : after;
      log('Chạy (tay): ' + (S.runBelief ? 'BẬT' : 'TẮT') + (after == null ? ' (tin — không đọc được trạng thái)' : ' (đã kiểm chứng)'));
      setStatus(S.status);
    }, 400);
  }

  // ============ Farm ============
  function runFarm(runId, targetMap, dest, zone) {
    return (async function () {
      log('Bắt đầu di chuyển…');
      await ensureAuto(runId, false); // Đi farm: tắt Auto suốt đường đi, chỉ Phi Hành + Chạy; tới điểm farm mới bật cả 3
      // Map đích không có cổng vào từ vị trí hiện tại → đi tới map gần nhất + gợi ý, không farm mù
      var curMap = readMapId();
      if (curMap && MAPS[targetMap] && !bfsPath(curMap, targetMap)) {
        var near = nearestStagingMap(curMap, targetMap);
        var tName = MAPS[targetMap].name, nName = MAPS[near.map] ? MAPS[near.map].name : near.map;
        log('Map ' + tName + ' không có cổng vào từ đây. Điểm vào gần nhất: ' + nName + ' (' + stagingReasonText(near, targetMap) + ') — ' + (near.map === curMap ? 'đã ở đó' : 'đang tới đó') + '.');
        if (near.map !== curMap) {
          await ensureRun(runId, true);
          await ensureFly(runId, true);
          await travelTo(runId, near.map);
        }
        log('Đã tới ' + nName + ' — anh tìm NPC/cổng vào ' + tName + ' quanh đây.');
        setStatus('Đã tới điểm gần nhất: ' + nName);
        stopTool('map đích không có cổng vào — đã tới điểm gần nhất');
        return;
      }
      await ensureRun(runId, true);
      await ensureFly(runId, true);
      await travelTo(runId, targetMap);
      if (zone) await ensureZone(runId, targetMap, zone);
      var dests = destinationsFor(targetMap);
      var d = dest || dests[0] || { label: 'điểm farm', tx: 20, ty: 15 };
      setStatus('Tới ' + d.label + ' (' + d.tx + ',' + d.ty + ')…');
      await goToPath(runId, d.tx, d.ty, 1, 180000, d.label);
      // Tới map đích: giữ Phi Hành + Chạy (không hạ cánh như v1.5), bật Auto
      await ensureFly(runId, true);
      if (S.flyingBelief && !S.flySpeedChecked) log('Phi Hành tại điểm farm: BẬT (tin — chưa đo được tốc độ, sẽ đo ở đợt lái kế tiếp nếu di chuyển)');
      await ensureRun(runId, true);
      var noAuto = false;
      if (targetMap === 'phong_dia') { log('Phong Địa là đất tranh phong — chỉ di chuyển, không bật Auto'); noAuto = true; }
      else if (MAPS[targetMap] && MAPS[targetMap].enemies === 0) { log('Map ' + MAPS[targetMap].name + ' không có quái tĩnh — chỉ di chuyển, không bật Auto'); noAuto = true; }
      if (!noAuto) await ensureAuto(runId, true);
      // Tổng kết trạng thái tại điểm farm (đọc trạng thái thật khi đọc được)
      var aSt = readAutoState(), rSt = readRunState();
      var autoTxt = noAuto ? 'không bật (map không farm)'
        : (aSt == null ? (S.autoBelief ? 'BẬT (tin — không đọc được trạng thái)' : 'TẮT (tin — không đọc được trạng thái)')
                       : (aSt ? 'BẬT' : 'TẮT') + ' (đã kiểm chứng)');
      var runTxt = rSt == null ? (S.runBelief ? 'BẬT (tin)' : 'TẮT (tin)') : (rSt ? 'BẬT' : 'TẮT') + ' (đã kiểm chứng)';
      var flyTxt = S.flyingBelief ? 'BẬT (tin là đang bay' + (S.flySpeedChecked ? ', đã đo tốc độ' : ', chưa đo tốc độ') + ')' : 'TẮT';
      log('Tại điểm farm — Auto: ' + autoTxt + ', Chạy: ' + runTxt + ', Bay: ' + flyTxt);
      setStatus((noAuto ? 'Đã tới ' : 'Đang farm tại ') + MAPS[targetMap].name + ' — ' + d.label);
      log((noAuto ? 'Đã tới ' : 'Bắt đầu farm tại ') + MAPS[targetMap].name + ' (' + d.label + ')');
      while (alive(runId)) {
        await sleep(1500);
        var hp = readHpPct();
        if (hp != null && hp < 0.35) { log('Khí Huyết dưới 35% (' + Math.round(hp * 100) + '%) — tắt Auto, dừng'); await ensureAuto(runId, false); if (S.flyingBelief) await ensureFly(runId, false); stopTool('Khí Huyết thấp'); return; }
        var m = readMapId();
        if (m && m !== targetMap) { log('Bị văng sang map khác (' + m + ') — dừng'); stopTool('lệch map'); return; }
      }
    })();
  }

  // ============ Việc Dược Công ============
  // Chạm xoắn ốc quanh nhân vật tới khi isOpenFn() đúng (thoại mở / bảng khu mở).
  // Ô đối tượng thật + px/ô chỉ là ước lượng nên chạm lần lượt quanh chỗ đứng —
  // chạm trúng sprite thì game mở thoại/panel (hoặc cho đi tới cạnh rồi mở).
  function tapSpiral(runId, isOpenFn, whatLabel, maxMs) {
    return (async function () {
      var spiralT0 = Date.now();
      function overBudget() { return maxMs != null && Date.now() - spiralT0 > maxMs; }
      if (isOpenFn()) return true;
      var step = PX_PER_TILE_EST;
      var ring1 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]; // lưới 3×3, bỏ tâm ở vòng đầu
      var cardinals = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      var scales = [1.25, 0.75];
      var tapCount = 0;
      var tryTap = async function (dx, dy, px) {
        tapCount++;
        log('chạm ' + whatLabel + ' hướng ' + dirName(dx, dy) + ' bước ' + Math.round(px));
        tapCanvas(dx * px, dy * px);
        var t0 = Date.now();
        var posBefore = readPos();
        var moved = false;
        while (Date.now() - t0 < 2500) {
          if (!alive(runId)) return false;
          if (isOpenFn()) return true;
          var p = readPos();
          if (p && posBefore && (p.x !== posBefore.x || p.y !== posBefore.y)) moved = true;
          await sleep(300);
        }
        if (isOpenFn()) return true;
        if (moved) {
          await waitStablePos(runId, 10000);
          var t1 = Date.now();
          while (Date.now() - t1 < 2000) {
            if (!alive(runId)) return false;
            if (isOpenFn()) return true;
            await sleep(300);
          }
        }
        return isOpenFn();
      };
      for (var i = 0; i < ring1.length; i++) {
        if (!alive(runId)) return false;
        if (overBudget()) { log('Hết hạn chạm ' + whatLabel + ' (' + Math.round(maxMs / 1000) + 's, đã chạm ' + tapCount + ' điểm)'); return false; }
        if (await tryTap(ring1[i][0], ring1[i][1], step)) return true;
        log('Chạm ' + whatLabel + ' chưa mở (lần ' + tapCount + ')');
      }
      for (var s = 0; s < scales.length; s++) {
        for (var j = 0; j < cardinals.length; j++) {
          if (!alive(runId)) return false;
          if (overBudget()) { log('Hết hạn chạm ' + whatLabel + ' (' + Math.round(maxMs / 1000) + 's, đã chạm ' + tapCount + ' điểm)'); return false; }
          if (await tryTap(cardinals[j][0], cardinals[j][1], step * scales[s])) return true;
          log('Chạm ' + whatLabel + ' chưa mở (lần ' + tapCount + ')');
        }
      }
      log('không mở được ' + whatLabel + ' (đã chạm ' + tapCount + ' điểm quanh nhân vật)');
      return false;
    })();
  }
  function tapNpc(runId, tx, ty) {
    return tapSpiral(runId, dialogOpen, 'NPC');
  }
  // Ô trống kề bên (tx,ty): ô không chặn (cả lưới đi bộ lẫn bay) gần nhất, ưu tiên vòng kề 1, tránh ô biên.
  function adjacentFreeTile(mapId, tx, ty) {
    var gw = gridFor(mapId, false), gf = gridFor(mapId, true);
    if (!gw) return null;
    var best = null;
    for (var r = 1; r <= 3; r++) {
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        var x = tx + dx, y = ty + dy;
        if (gridBlocked(gw, x, y) || (gf && gridBlocked(gf, x, y))) continue;
        var border = isBorderTile(gw, x, y);
        if (!border) return { x: x, y: y };
        if (!best) best = { x: x, y: y };
      }
      if (best) return best;
    }
    return null;
  }
  // Di chuyển tới đứng KỀ BÊN (tx,ty) — không đứng lên ô đích, không chỉ tới gần.
  function standNextTo(runId, tx, ty, label) {
    return (async function () {
      var p = readPos();
      if (p && Math.max(Math.abs(tx - p.x), Math.abs(ty - p.y)) <= 1) {
        log('Đã đứng cạnh ' + label + ' tại (' + p.x + ',' + p.y + ')');
        return p;
      }
      var mapId = readMapId();
      var adj = mapId ? adjacentFreeTile(mapId, tx, ty) : null;
      var gx = adj ? adj.x : tx, gy = adj ? adj.y : ty;
      log('Tới ô kề bên ' + label + ' (' + gx + ',' + gy + ') cạnh (' + tx + ',' + ty + ')');
      return await goToPath(runId, gx, gy, adj ? 0 : 1, 180000, 'cạnh ' + label);
    })();
  }
  // Chờ nút "Tương Tác" của game hiện (#btn-attack đổi nhãn khi đứng cạnh NPC/vật tương tác) rồi bấm.
  function pressInteractBtn(runId, timeoutMs, whatLabel) {
    return (async function () {
      var t0 = Date.now();
      while (alive(runId) && Date.now() - t0 < (timeoutMs || 8000)) {
        if (interactLabel() === 'Tương Tác') {
          log('Nút Tương Tác đã hiện (' + whatLabel + ') — bấm');
          pressDom($('#btn-attack'));
          return true;
        }
        await sleep(400);
      }
      log('Không thấy nút Tương Tác (' + whatLabel + ') sau ' + Math.round((timeoutMs || 8000) / 1000) + 's');
      return false;
    })();
  }
  // Mở thoại NPC đúng trình tự game: đứng cạnh → hạ cánh → bấm Tương Tác → chờ thoại.
  // Không thấy nút / bấm không mở được thoại → dự phòng chạm xoắn ốc như v1.7.
  function openNpcDialog(runId, tx, ty, label) {
    return (async function () {
      if (dialogOpen()) { log('Thoại ' + label + ' đang mở sẵn'); return true; }
      await standNextTo(runId, tx, ty, label);
      await ensureFly(runId, false); // hạ cánh, đứng cạnh NPC mới tương tác được
      if (await pressInteractBtn(runId, 8000, label)) {
        var ok = await waitDialogChoices(runId, 5000);
        if (ok) { log('Đã mở thoại ' + label + ' bằng nút Tương Tác'); return true; }
        log('Bấm Tương Tác mà thoại ' + label + ' chưa hiện — dự phòng chạm xoắn ốc');
      } else {
        log('Dự phòng chạm xoắn ốc mở thoại ' + label);
      }
      return await tapNpc(runId, tx, ty);
    })();
  }
  function clickDialogChoice(needles, label) {
    var el = findByText('#dialog-choices', needles) || findByText('#dialog', needles);
    if (!el) { log('Không thấy mục thoại: ' + label); return false; }
    pressDom(el);
    log('Đã bấm thoại: ' + label);
    return true;
  }
  function clickQuestStep() {
    var li = document.querySelector('#quest-objectives li[data-di]') || document.querySelector('#quest-objectives li');
    if (!li) { log('Không thấy bước nhiệm vụ trong bảng nhiệm vụ'); return false; }
    pressDom(li);
    log('Đã bấm bước nhiệm vụ (Tự đi làm nhiệm vụ)');
    return true;
  }
  // Tên hiển thị việc Dược Công (để kiểm chứng qua bảng nhiệm vụ)
  var JOB_NAMES = {
    duoc_moc: 'Thu Gom Dược Mộc', linh_chi: 'Linh Chi Dưới Chân Núi', truc_gia: 'Trúc Tâm Dẫn Dược',
    cau_ca: 'Câu Cá Làm Dược Liệu', ho_tong_chau: 'Đưa Người Về Làng',
    dai_hoi: 'Thắng Trận Đại Hội', van_tieu: 'Vận Tiêu Một Chuyến', chien_bang: 'Thắng Trận Tán Tu Chiến Bảng'
  };
  var JOB_VERBS = ['Thu Gom', 'Hái', 'Chặt', 'Câu', 'Hộ Tống'];
  function readSeedState() {
    var p = readLocal();
    var sq = p && p.seedQuest;
    if (!sq) return null;
    return { active: !!sq.active, task: sq.task || null, collected: sq.collected };
  }
  // Kiểm chứng đã nhận việc: (i) localStorage seedQuest.active + task, (ii) chữ #quest-objectives.
  function verifyAccepted(runId, jobId) {
    return (async function () {
      await sleep(1500);
      if (!alive(runId)) return false;
      var sq = readSeedState();
      var qo = $('#quest-objectives');
      var qtxt = qo ? (qo.textContent || '') : '';
      var name = JOB_NAMES[jobId] || jobId;
      var signals = [];
      if (sq && sq.active) signals.push('localStorage seedQuest.active' + (sq.task ? ' task=' + sq.task : ''));
      if (qtxt.indexOf(name) >= 0) signals.push('bảng nhiệm vụ có tên việc');
      if (qtxt.indexOf('Tự đi làm nhiệm vụ') >= 0) signals.push('bảng nhiệm vụ có bước "Tự đi làm nhiệm vụ"');
      var verbHit = JOB_VERBS.some(function (v) { return qtxt.indexOf(v) >= 0; });
      var seedOk = sq && sq.active && (!jobId || !sq.task || sq.task === jobId);
      var questOk = qtxt.indexOf(name) >= 0 || qtxt.indexOf('Tự đi làm nhiệm vụ') >= 0 || verbHit;
      if (seedOk || questOk) {
        log('Đã nhận việc: ' + name + ' (kiểm chứng: ' + (signals.join('; ') || 'bảng nhiệm vụ có động từ thu gom') + ')');
        return true;
      }
      log('Chưa nhận được việc ' + name + ' (seedQuest: ' + JSON.stringify(sq) + ')');
      return false;
    })();
  }
  // Chọn việc trong thoại: ưu tiên JOB_PRIORITY; không khớp tên → mục đầu tiên không khóa
  // mà chữ chứa động từ thu gom, hoặc mục enabled đầu tiên không phải Đóng/Hủy.
  function pickJobChoice() {
    for (var j = 0; j < JOB_PRIORITY.length; j++) {
      var el = findByText('#dialog-choices', JOB_PRIORITY[j].names) || findByText('#dialog', JOB_PRIORITY[j].names);
      if (!el) continue;
      var t = (el.textContent || '');
      if (/hết lượt|0\s*lượt|đã đủ lượt|khóa|Cần đạt/i.test(t) || el.classList.contains('disabled') || el.getAttribute('aria-disabled') === 'true') {
        log('Bỏ việc ' + JOB_PRIORITY[j].id + ' (hết lượt/khóa)'); continue;
      }
      pressDom(el);
      log('Đã bấm chọn việc: ' + JOB_PRIORITY[j].id);
      return JOB_PRIORITY[j].id;
    }
    var root = $('#dialog-choices') || $('#dialog');
    if (!root) return null;
    var els = root.querySelectorAll('button, li, div, span, a');
    var firstEnabled = null;
    for (var i = 0; i < els.length; i++) {
      var e2 = els[i];
      var tx = (e2.textContent || '').trim();
      if (!tx || tx.length > 220) continue;
      var r = e2.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (/Đóng|Hủy|Huỷ/i.test(tx) && tx.length < 20) continue;
      if (e2.classList.contains('disabled') || e2.getAttribute('aria-disabled') === 'true' || /hết lượt|khóa|Cần đạt/i.test(tx)) continue;
      if (!firstEnabled) firstEnabled = e2;
      if (JOB_VERBS.some(function (v) { return tx.indexOf(v) >= 0; })) {
        pressDom(e2);
        log('Đã bấm chọn việc (dự phòng theo động từ): ' + tx.slice(0, 60));
        return 'unknown';
      }
    }
    if (firstEnabled) {
      pressDom(firstEnabled);
      log('Đã bấm chọn việc (dự phòng mục đầu tiên): ' + (firstEnabled.textContent || '').trim().slice(0, 60));
      return 'unknown';
    }
    return null;
  }
  // ============ Câu cá (cơ chế game: chạm mặt nước → thoại "Thả câu"/"Tự động câu") ============
  // pa(prop, true) = tự động câu: game tự thả lại sau mỗi lượt; dừng bằng #btn-fishing-stop-touch hoặc di chuyển.
  // Đọc trạng thái đang tự câu: nút dừng hiện (không class hidden).
  var FISH_SPOT = { map: 'duoc_vien', tx: 18, ty: 15, label: 'Đài câu cá (Hồ Bích Thuỷ)' };
  function fishingActive() {
    var b = $('#btn-fishing-stop-touch') || $('#btn-fishing-stop');
    if (!b || b.classList.contains('hidden')) return false;
    var r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function stopFishingGame() {
    var b = $('#btn-fishing-stop-touch') || $('#btn-fishing-stop');
    if (b && fishingActive()) { pressDom(b); log('Đã bấm nút dừng câu của game'); return true; }
    return false;
  }
  function startAutoFishing(runId) {
    return (async function () {
      if (fishingActive()) { log('Đang tự động câu rồi'); return true; }
      if (!(await tapSpiral(runId, dialogOpen, 'mặt nước'))) { log('Không mở được thoại câu cá (chạm mặt nước)'); return false; }
      await sleep(600);
      if (!clickDialogChoice(['Tự động câu'], 'Tự động câu')) return false;
      var ok = await waitFor(function () { return fishingActive() ? true : null; }, 6000, 'nút dừng câu hiện (đang tự câu)');
      if (ok) log('Đã bật tự động câu');
      return !!ok;
    })();
  }
  // Kế hoạch tự lái làm việc Dược Công (tọa độ prop trích từ mã client, không dùng nút "Tự đi làm nhiệm vụ"):
  // linh_chi: 10 prop linh_chi_1..10 ở tan_vien (herb, không chặn); truc_gia: 4 prop truc_gia_1..4 ở
  // thanh_truc_lam (block — đứng cạnh chặt); duoc_moc: 1 prop co_thu_linh_moc (34,25) ở duoc_vien, chặt lặp.
  var JOB_PLAN = {
    linh_chi: { map: 'tan_vien', need: 3, points: [
      { id: 'linh_chi_1', tx: 19, ty: 2 }, { id: 'linh_chi_2', tx: 21, ty: 3 }, { id: 'linh_chi_3', tx: 31, ty: 2 },
      { id: 'linh_chi_4', tx: 6, ty: 3 }, { id: 'linh_chi_5', tx: 25, ty: 3 }, { id: 'linh_chi_6', tx: 3, ty: 4 },
      { id: 'linh_chi_7', tx: 9, ty: 4 }, { id: 'linh_chi_8', tx: 14, ty: 5 }, { id: 'linh_chi_9', tx: 29, ty: 4 },
      { id: 'linh_chi_10', tx: 35, ty: 6 }
    ] },
    truc_gia: { map: 'thanh_truc_lam', need: 4, points: [
      { id: 'truc_gia_1', tx: 18, ty: 5 }, { id: 'truc_gia_2', tx: 27, ty: 12 },
      { id: 'truc_gia_3', tx: 10, ty: 20 }, { id: 'truc_gia_4', tx: 31, ty: 8 }
    ] },
    duoc_moc: { map: 'duoc_vien', need: 5, repeat: true, points: [
      { id: 'co_thu_linh_moc', tx: 34, ty: 25 }
    ] }
  };
  var SU_PHU = { map: 'tan_vien', tx: 9, ty: 10 }; // Thầy Ông Nội — đích hộ tống (prop npc trích từ mã client)
  function dialogChoicesOpen() {
    var c = $('#dialog-choices');
    if (!c) return false;
    var r = c.getBoundingClientRect(), s = getComputedStyle(c);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && c.children.length > 0;
  }
  function waitDialogChoices(runId, timeoutMs) {
    return waitFor(function () { return dialogChoicesOpen() ? true : null; }, timeoutMs || 5000, 'mục thoại hiện');
  }
  function dumpDialogChoices() {
    var dcEl = $('#dialog-choices');
    var dcTxt = dcEl ? (dcEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300) : '(không thấy #dialog-choices)';
    log('Các mục thoại hiện có: ' + dcTxt);
  }
  // Tiến độ việc: ưu tiên chữ "n/m" ở #quest-objectives, dự phòng đếm seedQuest.collected
  function jobProgress(jobId) {
    var plan = JOB_PLAN[jobId];
    var pr = readProgress();
    if (pr && pr.need > 0) return { cur: pr.cur, need: pr.need, src: 'bảng nhiệm vụ' };
    var sq = readSeedState();
    if (sq && sq.collected && plan) {
      var n = 0;
      Object.keys(sq.collected).forEach(function (k) { if (sq.collected[k]) n++; });
      return { cur: n, need: plan.need, src: 'seedQuest.collected' };
    }
    return { cur: 0, need: plan ? plan.need : 0, src: 'chưa đọc được tiến độ' };
  }
  // Tự lái tới từng điểm thu thập, bấm "Tương Tác" lặp tới khi đủ số (giới hạn lần + ghi từng lần)
  function doCollectJob(runId, jobId) {
    return (async function () {
      var plan = JOB_PLAN[jobId];
      if (!plan) { log('Việc ' + jobId + ' không có kế hoạch tự lái — dừng'); return false; }
      log('Bước đi làm việc: ' + (JOB_NAMES[jobId] || jobId) + ' — tới ' + (MAPS[plan.map] ? MAPS[plan.map].name : plan.map) + ', thu thập ' + plan.need + ' tại ' + plan.points.length + ' điểm (tool tự lái)');
      setStatus('Đi làm việc ' + (JOB_NAMES[jobId] || jobId) + '…');
      await ensureRun(runId, true);
      await ensureFly(runId, true);
      await travelTo(runId, plan.map);
      await ensureFly(runId, false); // hạ cánh để đứng cạnh prop tương tác
      var tried = {}, totalPresses = 0, MAX_PRESSES = 60;
      var jobT0 = Date.now(), goFails = 0;
      while (alive(runId)) {
        if (Date.now() - jobT0 > 20 * 60 * 1000) { log('Bước đi làm việc: quá 20 phút chưa đủ tiến độ — dừng'); return false; }
        if (goFails >= 6) { log('Bước đi làm việc: 6 lần không tới được điểm thu thập — dừng'); return false; }
        var prog = jobProgress(jobId);
        if (prog.need > 0 && prog.cur >= prog.need) { log('Bước đi làm việc: đủ tiến độ ' + prog.cur + '/' + prog.need + ' (' + prog.src + ')'); return true; }
        var hp = readHpPct();
        if (hp != null && hp < 0.35) { log('Khí Huyết dưới 35% khi làm việc — dừng'); return false; }
        // Chọn điểm chưa thu thập, chưa thử, gần nhất
        var sq = readSeedState();
        var p = readPos();
        var cand = plan.points.filter(function (pt) {
          if (sq && sq.collected && sq.collected[pt.id]) return false;
          return !tried[pt.id];
        });
        if (!cand.length) {
          if (plan.repeat) { tried = {}; cand = plan.points.slice(); }
          else { log('Bước đi làm việc: đã thử hết ' + plan.points.length + ' điểm mà tiến độ mới ' + prog.cur + '/' + prog.need + ' — dừng'); return false; }
        }
        cand.sort(function (a, b) {
          var da = p ? Math.max(Math.abs(a.tx - p.x), Math.abs(a.ty - p.y)) : 0;
          var db = p ? Math.max(Math.abs(b.tx - p.x), Math.abs(b.ty - p.y)) : 0;
          return da - db;
        });
        var pt = cand[0];
        tried[pt.id] = true;
        log('Bước đi làm việc: tới đứng cạnh điểm ' + pt.id + ' (' + pt.tx + ',' + pt.ty + ')');
        try {
          await standNextTo(runId, pt.tx, pt.ty, 'điểm ' + pt.id);
          goFails = 0;
        } catch (e) {
          if (!alive(runId)) throw e;
          goFails++;
          log('Chưa tới được điểm ' + pt.id + ': ' + e.message + ' — thử điểm kế (lần hỏng ' + goFails + '/6)');
          continue;
        }
        // Bấm Tương Tác lặp tại điểm này
        var pressesAt = 0, noGain = 0, waits = 0, lastCur = jobProgress(jobId).cur;
        var maxAt = plan.repeat ? 24 : 6, maxNoGain = plan.repeat ? 8 : 4;
        while (alive(runId) && pressesAt < maxAt && totalPresses < MAX_PRESSES) {
          var pr2 = jobProgress(jobId);
          if (pr2.need > 0 && pr2.cur >= pr2.need) break;
          if (interactLabel() === 'Tương Tác') {
            if (pressesAt === 0) log('Nút Tương Tác đã hiện tại ' + pt.id + ' — bấm thu hoạch');
            pressDom($('#btn-attack'));
            pressesAt++; totalPresses++; waits = 0;
            await sleep(1600);
            var pr3 = jobProgress(jobId);
            log('Tương Tác lần ' + totalPresses + ' tại ' + pt.id + ' (' + pt.tx + ',' + pt.ty + ') — tiến độ ' + pr3.cur + '/' + pr3.need + ' (' + pr3.src + ')');
            if (pr3.cur > lastCur) {
              lastCur = pr3.cur; noGain = 0;
              if (!plan.repeat) break; // mỗi điểm thu 1 lần (linh chi/trúc già) → sang điểm kế
            } else if (++noGain >= maxNoGain) {
              log('Bấm ' + noGain + ' lần tại ' + pt.id + ' mà tiến độ không tăng — sang điểm kế');
              break;
            }
          } else {
            if (++waits > 8) { log('Nút Tương Tác chưa hiện tại ' + pt.id + ' sau ~7s — sang điểm kế'); break; }
            await sleep(800);
          }
          var hp2 = readHpPct();
          if (hp2 != null && hp2 < 0.35) { log('Khí Huyết dưới 35% khi làm việc — dừng'); return false; }
        }
        if (totalPresses >= MAX_PRESSES) { log('Bước đi làm việc: đã bấm Tương Tác ' + MAX_PRESSES + ' lần mà chưa đủ — dừng'); return false; }
      }
      return false;
    })();
  }
  // Hộ tống: đi bộ (không bay, cháu đi theo sau) về Thầy Ông Nội, bấm "Bẩm Thầy Ông Nội", kiểm chứng seedQuest tắt
  function doEscortJob(runId) {
    return (async function () {
      log('Bước hộ tống: đi bộ dẫn cháu từ Thảo Dược Cốc qua Rừng Trúc về Thầy Ông Nội (9,10) ở Chân Núi Tản Viên');
      setStatus('Hộ tống cháu về làng…');
      await ensureFly(runId, false);
      await ensureRun(runId, true);
      await travelTo(runId, SU_PHU.map);
      if (!(await openNpcDialog(runId, SU_PHU.tx, SU_PHU.ty, 'Thầy Ông Nội'))) { log('Kẹt: không mở được thoại Thầy Ông Nội'); return false; }
      await sleep(700);
      await waitDialogChoices(runId, 5000);
      if (!clickDialogChoice(['Bẩm Thầy Ông Nội'], 'Bẩm Thầy Ông Nội')) dumpDialogChoices();
      await sleep(1500);
      if (!alive(runId)) return false;
      var sq = readSeedState();
      if (sq && !sq.active) { log('Bước hộ tống: xong — seedQuest đã tắt (kiểm chứng)'); return true; }
      log('Bước hộ tống: chưa thấy hoàn thành (seedQuest: ' + JSON.stringify(sq) + ') — dừng');
      return false;
    })();
  }
  function runDuocCong(runId) {
    return (async function () {
      var hp0 = readHpPct();
      if (hp0 != null && hp0 < 0.5) { log('Khí Huyết dưới 50% — không nhận việc'); stopTool('Khí Huyết thấp'); return; }
      log('Bắt đầu di chuyển…');
      await ensureRun(runId, true);
      await ensureFly(runId, true);
      var jobsDone = 0;
      while (alive(runId)) {
        var hp = readHpPct();
        if (hp != null && hp < 0.5) { log('Khí Huyết dưới 50% — dừng nhận việc'); break; }
        var before = readLocal();
        var dcBefore = before && typeof before.duocCong === 'number' ? before.duocCong : null;

        // Đang giữ việc Dược Công thì đi làm luôn, không nhận mới
        var picked = null;
        var sq0 = readSeedState();
        if (sq0 && sq0.active && sq0.task) {
          if (JOB_PRIORITY.some(function (j) { return j.id === sq0.task; })) {
            picked = sq0.task;
            log('Đang giữ việc: ' + (JOB_NAMES[picked] || picked) + ' — đi làm luôn, không nhận mới');
          } else {
            log('Đang giữ việc ngoài kế hoạch (' + (JOB_NAMES[sq0.task] || sq0.task) + ') — dừng, không tự hủy việc');
            break;
          }
        }

        if (!picked) {
          log('Bước nhận việc: về Thảo Dược Cốc gặp Đại Phu (14,8)');
          setStatus('Về Thảo Dược Cốc gặp Đại Phu…');
          await travelTo(runId, DAI_PHU.map);
          // Nhận việc: thử tối đa 2 lần — đứng cạnh Đại Phu → bấm Tương Tác mở thoại → kiểm chứng seedQuest
          for (var attempt = 1; attempt <= 2 && !picked; attempt++) {
            if (!(await openNpcDialog(runId, DAI_PHU.tx, DAI_PHU.ty, 'Đại Phu'))) { log('Kẹt ở bước nhận việc: không mở được thoại Đại Phu'); break; }
            await sleep(700);
            await waitDialogChoices(runId, 5000);
            if (!clickDialogChoice(['Nhận Việc Dược Công', 'Nhận việc Dược Công', 'Nhận Việc', 'Dược Công'], 'Nhận Việc Dược Công')) { dumpDialogChoices(); break; }
            await sleep(900);
            await waitDialogChoices(runId, 5000);
            var cand = pickJobChoice();
            if (!cand) {
              dumpDialogChoices();
              log('Không còn việc nào nhận được (hết lượt hôm nay?) — kết thúc');
              break;
            }
            if (await verifyAccepted(runId, cand === 'unknown' ? null : cand)) {
              var sqNow = readSeedState();
              picked = (sqNow && sqNow.task) || cand;
            } else {
              dumpDialogChoices();
              if (attempt < 2) {
                log('Chưa nhận được việc — mở lại thoại thử lần 2');
                if (dialogOpen()) { var dcx = $('#dialog-close'); if (dcx) pressDom(dcx); await sleep(700); }
              } else {
                log('2 lần vẫn không nhận được việc — dừng');
              }
            }
          }
          if (!picked) break;
          if (picked === 'unknown' || (!JOB_PLAN[picked] && picked !== 'cau_ca' && picked !== 'ho_tong_chau')) {
            log('Việc nhận được (' + picked + ') không nằm trong 5 việc Luyện Khí có kế hoạch tự lái — dừng, không tự hủy việc');
            break;
          }
          log('Bước nhận việc: xong — việc ' + (JOB_NAMES[picked] || picked));
          await sleep(900);
          if (dialogOpen()) { var dc = $('#dialog-close'); if (dc) pressDom(dc); await sleep(600); }
        }

        var full = false, escortDone = false;
        if (picked === 'ho_tong_chau') {
          escortDone = await doEscortJob(runId);
          full = escortDone;
          if (!full) break;
        } else if (picked === 'cau_ca') {
          // Việc câu cá: tới đài câu, bật "Tự động câu" của game, chờ đủ tiến độ rồi dừng câu
          setStatus('Tới đài câu cá làm việc Câu Cá…');
          await travelTo(runId, FISH_SPOT.map);
          await ensureFly(runId, true);
          await goToPath(runId, FISH_SPOT.tx, FISH_SPOT.ty, 1, 180000, 'đài câu cá');
          await ensureFly(runId, false);
          if (!(await startAutoFishing(runId))) { log('Kẹt: không bật được tự động câu'); break; }
          setStatus('Đang tự động câu (việc Câu Cá)…');
          var fishT0 = Date.now();
          while (alive(runId)) {
            var prf = readProgress();
            if (prf && prf.need > 0 && prf.cur >= prf.need) { full = true; break; }
            if (Date.now() - fishT0 > 600000) { log('Kẹt: câu 10 phút chưa đủ tiến độ (' + (prf ? prf.cur + '/' + prf.need : '?') + ')'); break; }
            if (!fishingActive()) {
              log('Câu bị ngắt — bật lại tự động câu');
              if (!(await startAutoFishing(runId))) break;
            }
            var hpf = readHpPct();
            if (hpf != null && hpf < 0.35) { log('Khí Huyết dưới 35% khi câu — dừng'); break; }
            await sleep(3000);
          }
          stopFishingGame();
          if (!full) break;
        } else {
          // Tool tự lái tới điểm thu thập + bấm Tương Tác lặp (không dùng nút "Tự đi làm nhiệm vụ" của game)
          full = await doCollectJob(runId, picked);
          if (!full) break;
        }

        if (!escortDone) {
          // Bước trả việc: tool tự lái quay về Đại Phu, giao nguyên liệu, kiểm chứng Dược Công tăng
          log('Bước trả việc: quay về Thảo Dược Cốc gặp Đại Phu giao nguyên liệu');
          setStatus('Quay về giao nguyên liệu…');
          await ensureRun(runId, true);
          await ensureFly(runId, true);
          await travelTo(runId, DAI_PHU.map);
          if (!(await openNpcDialog(runId, DAI_PHU.tx, DAI_PHU.ty, 'Đại Phu'))) { log('Kẹt ở bước trả việc: không mở được thoại để giao nguyên liệu'); break; }
          await sleep(700);
          await waitDialogChoices(runId, 5000);
          if (!clickDialogChoice(['Giao Nguyên Liệu', 'Giao Ba Cá'], 'Giao Nguyên Liệu')) { dumpDialogChoices(); break; }
          await sleep(1500);
          if (dialogOpen()) { var dc2 = $('#dialog-close'); if (dc2) pressDom(dc2); await sleep(600); }
        }
        var after = readLocal();
        var dcAfter = after && typeof after.duocCong === 'number' ? after.duocCong : null;
        var sqAfter = readSeedState();
        jobsDone++;
        log('Xong 1 lượt việc ' + picked + (dcBefore != null && dcAfter != null ? ' — Dược Công ' + dcBefore + ' → ' + dcAfter + ' (+' + (dcAfter - dcBefore) + ')' : ' (không đọc được số Dược Công trước/sau)') +
          (sqAfter ? (sqAfter.active ? ' — lưu ý: seedQuest vẫn active' : ' — seedQuest đã tắt (kiểm chứng)') : '') + ' (tổng ' + jobsDone + ' lượt)');
        if (dcBefore != null && dcAfter != null && dcAfter <= dcBefore) log('Cảnh báo: chưa thấy Dược Công tăng sau khi giao — kiểm tra tay');
      }
      log('Kết thúc vòng Dược Công: ' + jobsDone + ' lượt');
      stopTool('xong Dược Công');
    })();
  }

  // ============ Câu cá tự động (chế độ riêng) ============
  // ============ Huyết Xích Cấm Địa (v1.9) ============
  function hxInDungeon(mapId) { return HUYET.maps.indexOf(mapId) >= 0; }

  // Đăng ký tại Nữ Tu Trông Miếu: mở thoại → chọn "Đăng ký Huyết Xích Cấm Địa" → hộp xác nhận
  // "Mở Huyết Xích Cấm Địa" (#dialog-action) → chờ đổi map vào cụm. Game từ chối thì ghi nguyên văn
  // caption/thoại rồi dừng (không bấm lại vô hạn). Trả true nếu đã vào được cụm.
  function hxRegister(runId) {
    return (async function () {
      var stones = readStones();
      log('Huyết Xích: đăng ký thu ' + HUYET.fee + ' Linh Thạch/người + tính 1 lượt hôm nay (theo thoại game)' + (stones != null ? ' — Linh Thạch hiện có: ' + stones : ' — không đọc được số Linh Thạch'));
      if (stones != null && stones < HUYET.fee) { log('Không đủ Linh Thạch (' + stones + ' < ' + HUYET.fee + ') — không đăng ký'); return false; }
      setStatus('Tới Nữ Tu Trông Miếu đăng ký Huyết Xích…');
      if (!(await openNpcDialog(runId, HUYET.npc.tx, HUYET.npc.ty, HUYET.npc.name))) {
        log('Không mở được thoại ' + HUYET.npc.name + ' — dừng đăng ký');
        return false;
      }
      await waitDialogChoices(runId, 5000);
      dumpDialogChoices();
      if (!clickDialogChoice(['Đăng ký Huyết Xích Cấm Địa'], 'Đăng ký Huyết Xích Cấm Địa')) {
        log('Không thấy mục "Đăng ký Huyết Xích Cấm Địa" trong thoại — dừng');
        return false;
      }
      // Hộp xác nhận: nút #dialog-action "Mở Huyết Xích Cấm Địa"
      var btn = await waitFor(function () { return dialogActionBtn(); }, 8000, 'nút xác nhận Mở Huyết Xích');
      if (!btn) {
        // Có thể game vào thẳng không qua hộp xác nhận → chờ đổi map
        var m0 = await waitFor(function () { var m = readMapId(); return hxInDungeon(m) ? m : null; }, 8000, 'đổi map vào Huyết Xích');
        if (m0) { log('Đã vào Huyết Xích (map ' + MAPS[m0].name + ') — không qua hộp xác nhận'); return true; }
        log('Không thấy nút xác nhận — thoại hiện tại: "' + readDialogText() + '" | caption: "' + readCaption() + '"');
        closeDialogIfOpen();
        return false;
      }
      log('Thoại xác nhận: "' + readDialogText() + '"');
      log('Bấm "' + ((btn.textContent || '').trim() || 'Mở Huyết Xích Cấm Địa') + '" — thu ' + HUYET.fee + ' Linh Thạch, tính 1 lượt hôm nay');
      pressDom(btn);
      var entered = await waitFor(function () { var m = readMapId(); return hxInDungeon(m) ? m : null; }, 20000, 'đổi map vào Huyết Xích');
      if (entered) {
        var st2 = readStones();
        log('Đăng ký thành công — đã vào ' + MAPS[entered].name + (st2 != null ? ' (Linh Thạch còn ' + st2 + ')' : '') + (readCollapse() ? ' — Cấm Địa sụp sau ' + readCollapse() : ''));
        return true;
      }
      log('Đăng ký chưa vào được — caption: "' + readCaption() + '" | thoại: "' + readDialogText() + '"');
      closeDialogIfOpen();
      return false;
    })();
  }

  // Một vòng quét quái trong khu: bật Auto + Chạy (+Bay tùy flyOn), đi qua từng điểm quái, chờ Auto đánh.
  // Trả 'done' | 'hp' | 'mapchange'.
  function hxFightRound(runId, mapId, flyOn, roundNo) {
    return (async function () {
      var m = MAPS[mapId];
      var pts = (m.monsterPoints || []).slice();
      pts.sort(function (a, b) { return (a.boss ? 1 : 0) - (b.boss ? 1 : 0); }); // quái thường trước, boss sau
      log('Huyết Xích: vòng quét quái ' + roundNo + ' ở ' + m.name + ' — ' + pts.length + ' điểm quái' + (flyOn ? ' (bay)' : ' (đi bộ)'));
      setStatus('Quét quái ' + m.name + ' (vòng ' + roundNo + ')…');
      await ensureFly(runId, flyOn);
      await ensureRun(runId, true);
      await ensureAuto(runId, true);
      for (var i = 0; i < pts.length; i++) {
        if (!alive(runId)) throw new Error('đã dừng');
        var hp = readHpPct();
        if (hp != null && hp < 0.35) { log('Khí Huyết dưới 35% (' + Math.round(hp * 100) + '%) khi quét quái — dừng'); return 'hp'; }
        var mm = readMapId();
        if (mm && mm !== mapId) return 'mapchange';
        var pt = pts[i];
        log('Quét: tới điểm ' + pt.name + ' (' + pt.tx + ',' + pt.ty + ')');
        try { await goToPath(runId, pt.tx, pt.ty, 1, 120000, pt.name); }
        catch (e) { if (!alive(runId)) throw e; log('Chưa tới được điểm ' + pt.name + ': ' + e.message + ' — sang điểm kế'); continue; }
        await sleep(7000); // chờ Auto đánh tại điểm này
      }
      return 'done';
    })();
  }

  // Thu hoạch 1 điểm: đứng cạnh → bấm Tương Tác → đọc caption quyết định.
  // Trả 'done' | 'sealed:N' | 'tried'.
  function hxHarvestPoint(runId, pt) {
    return (async function () {
      await standNextTo(runId, pt.tx, pt.ty, pt.name);
      var pressed = await pressInteractBtn(runId, 8000, pt.name);
      if (!pressed) { log('Thu hoạch ' + pt.id + ': không thấy nút Tương Tác — bỏ điểm này'); return 'tried'; }
      await sleep(1200);
      var cap = readCaption();
      var sealedM = cap.match(/quét sạch\s*(\d+)\s*yêu thú/);
      if (sealedM || cap.indexOf('Cấm chế còn phong') >= 0) {
        log('Thu hoạch ' + pt.id + ': "' + cap + '"');
        return 'sealed:' + (sealedM ? sealedM[1] : '?');
      }
      if (dialogOpen()) {
        var dt = readDialogText();
        log('Thu hoạch ' + pt.id + ': thoại "' + dt + '"');
        closeDialogIfOpen();
        await sleep(600);
        return dt.indexOf('đã được đội thu hoạch') >= 0 ? 'done' : 'tried';
      }
      var standM = cap.match(/đứng yên\s*(\d+)\s*giây/);
      if (cap.indexOf('Đang thu hoạch') >= 0 || standM) {
        var secs = standM ? +standM[1] : 3;
        log('Thu hoạch ' + pt.id + ' (' + pt.name + '): "' + cap + '" — đứng yên ' + secs + 's');
        await sleep(secs * 1000 + 2500);
        var cap2 = readCaption();
        log('Thu hoạch ' + pt.id + ' xong' + (cap2 ? ' — caption: "' + cap2 + '"' : ''));
        return 'done';
      }
      log('Thu hoạch ' + pt.id + ': caption "' + cap + '" — coi như chưa thu được');
      return 'tried';
    })();
  }

  // Một khu: thử thu hoạch → còn cấm chế thì quét quái → thử lại (tối đa 4 vòng quét).
  // Trả 'done' | 'hp' | 'mapchange'.
  function hxClearAndHarvest(runId, mapId, totals) {
    return (async function () {
      var points = (HUYET.harvest[mapId] || []).slice();
      var done = {}, tried = {};
      var flyOn = true, lastSealed = null, rounds = 0, MAX_ROUNDS = 4;
      log('Huyết Xích: khu ' + MAPS[mapId].name + ' — ' + points.length + ' điểm thu hoạch' + (readCollapse() ? ', Cấm Địa sụp sau ' + readCollapse() : ''));
      setStatus('Huyết Xích: ' + MAPS[mapId].name + '…');
      while (alive(runId)) {
        var mm = readMapId();
        if (mm && mm !== mapId) { log('Đã rời khu ' + MAPS[mapId].name + ' (sang ' + (MAPS[mm] ? MAPS[mm].name : mm) + ')'); return 'mapchange'; }
        var hp = readHpPct();
        if (hp != null && hp < 0.35) { log('Khí Huyết dưới 35% — dừng'); return 'hp'; }
        var remaining = points.filter(function (p) { return !done[p.id] && !tried[p.id]; });
        if (!remaining.length) break;
        // Thu hoạch phải tắt Auto (Auto kéo nhân vật đi sẽ hủy thu hoạch) + hạ cánh đứng cạnh điểm
        await ensureAuto(runId, false);
        await ensureFly(runId, false);
        var sealedCount = null;
        for (var i = 0; i < remaining.length; i++) {
          if (!alive(runId)) throw new Error('đã dừng');
          var pt = remaining[i];
          var res;
          try { res = await hxHarvestPoint(runId, pt); }
          catch (e) { if (!alive(runId)) throw e; log('Thu hoạch ' + pt.id + ' lỗi: ' + e.message); res = 'tried'; }
          if (res === 'done') { done[pt.id] = true; totals.harvested++; }
          else if (res.indexOf('sealed:') === 0) { sealedCount = res.slice(7); break; }
          else { tried[pt.id] = true; }
          var hp2 = readHpPct();
          if (hp2 != null && hp2 < 0.35) { log('Khí Huyết dưới 35% — dừng'); return 'hp'; }
          var mm2 = readMapId();
          if (mm2 && mm2 !== mapId) { log('Đã rời khu ' + MAPS[mapId].name); return 'mapchange'; }
        }
        if (sealedCount == null) break; // đã thử hết điểm còn lại (done/tried)
        rounds++;
        var stuckFly = lastSealed != null && sealedCount === lastSealed && flyOn;
        log('Cấm chế còn phong — còn ' + sealedCount + ' yêu thú trong khu' + (stuckFly ? ' (không giảm sau vòng bay — chuyển sang đi bộ đánh)' : ''));
        if (stuckFly) flyOn = false;
        lastSealed = sealedCount;
        if (rounds > MAX_ROUNDS) { log('Đã quét ' + MAX_ROUNDS + ' vòng mà cấm chế chưa mở — sang khu kế'); break; }
        var fr = await hxFightRound(runId, mapId, flyOn, rounds);
        if (fr === 'hp') return 'hp';
        if (fr === 'mapchange') return 'mapchange';
      }
      log('Huyết Xích: khu ' + MAPS[mapId].name + ' xong — thu hoạch ' + Object.keys(done).length + '/' + points.length + ' điểm');
      return 'done';
    })();
  }

  function runHuyetXich(runId) {
    return (async function () {
      var hp0 = readHpPct();
      if (hp0 != null && hp0 < 0.5) { log('Khí Huyết dưới 50% — không vào Huyết Xích'); stopTool('Khí Huyết thấp'); return; }
      log('Bắt đầu Huyết Xích…');
      await ensureAuto(runId, false); // di chuyển: tắt Auto, chỉ Phi Hành + Chạy
      var cur = readMapId();
      if (!hxInDungeon(cur)) {
        if (cur && !bfsPath(cur, HUYET.npcMap)) {
          var near = nearestStagingMap(cur, HUYET.npcMap);
          var nName = MAPS[near.map] ? MAPS[near.map].name : near.map;
          log('Không có đường cổng từ đây tới Miếu Hoang. Điểm vào gần nhất: ' + nName + ' (' + stagingReasonText(near, HUYET.npcMap) + ').');
          if (near.map !== cur) { await ensureRun(runId, true); await ensureFly(runId, true); await travelTo(runId, near.map); }
          log('Đã tới ' + nName + ' — anh tự vào Miếu Hoang rồi bấm lại Huyết Xích.');
          stopTool('không có đường cổng tới Miếu Hoang');
          return;
        }
        await ensureRun(runId, true);
        await ensureFly(runId, true);
        await travelTo(runId, HUYET.npcMap);
        if (!(await hxRegister(runId))) { stopTool('đăng ký Huyết Xích chưa thành công'); return; }
      } else {
        log('Đang ở trong Huyết Xích (' + MAPS[cur].name + ') — bỏ qua đăng ký, vào quét + thu hoạch');
      }
      var totals = { harvested: 0 };
      var order = HUYET.maps.slice();
      var startIdx = Math.max(0, order.indexOf(readMapId()));
      var mapChangeRetries = 0;
      for (var k = startIdx; k < order.length; k++) {
        if (!alive(runId)) throw new Error('đã dừng');
        var target = order[k];
        var cm = readMapId();
        if (!hxInDungeon(cm)) { log('Đã ra khỏi Huyết Xích (map ' + (cm || '?') + ') — dừng'); stopTool('ra khỏi Cấm Địa'); return; }
        if (cm !== target) {
          await ensureAuto(runId, false);
          await ensureRun(runId, true);
          await ensureFly(runId, true);
          await travelTo(runId, target);
        }
        var r = await hxClearAndHarvest(runId, target, totals);
        if (r === 'hp') { await ensureAuto(runId, false); stopTool('Khí Huyết thấp'); return; }
        if (r === 'mapchange') {
          if (++mapChangeRetries > 6) { log('Đổi map liên tục bất thường — dừng'); stopTool('lệch map'); return; }
          k--; continue; // kiểm tra lại map ở đầu vòng
        }
      }
      log('Huyết Xích: xong cả 3 khu — thu hoạch tổng ' + totals.harvested + ' điểm' + (readCollapse() ? ', Cấm Địa sụp sau ' + readCollapse() : '') + '. Đồ quái rơi tự nhặt khi đi qua gần (game tự hút sau ~5s).');
      setStatus('Huyết Xích xong — đang chờ trong Cấm Địa');
      while (alive(runId)) {
        await sleep(1500);
        var hp = readHpPct();
        if (hp != null && hp < 0.35) { log('Khí Huyết dưới 35% — dừng'); await ensureAuto(runId, false); stopTool('Khí Huyết thấp'); return; }
        var m = readMapId();
        if (m && !hxInDungeon(m)) { log('Đã ra khỏi Huyết Xích (map ' + (MAPS[m] ? MAPS[m].name : m) + ') — dừng'); stopTool('ra khỏi Cấm Địa'); return; }
      }
    })();
  }

  function runFishing(runId) {
    return (async function () {
      log('Bắt đầu di chuyển tới đài câu cá…');
      await ensureRun(runId, true);
      await ensureFly(runId, true);
      await travelTo(runId, FISH_SPOT.map);
      setStatus('Tới ' + FISH_SPOT.label + '…');
      await goToPath(runId, FISH_SPOT.tx, FISH_SPOT.ty, 1, 180000, 'đài câu cá');
      await ensureFly(runId, false);
      if (!(await startAutoFishing(runId))) { stopTool('không bật được tự động câu'); return; }
      setStatus('Đang tự động câu tại ' + FISH_SPOT.label);
      var t0 = Date.now(), restarts = 0, lastBeat = Date.now();
      while (alive(runId)) {
        await sleep(5000);
        if (!fishingActive()) {
          restarts++;
          if (restarts > 3) { log('Câu bị ngắt quá 3 lần — dừng'); stopTool('câu bị ngắt'); return; }
          log('Câu bị ngắt (lần ' + restarts + ') — bật lại tự động câu');
          if (!(await startAutoFishing(runId))) { stopTool('không bật lại được tự động câu'); return; }
        }
        if (Date.now() - lastBeat >= 60000) {
          lastBeat = Date.now();
          log('Đang tự động câu… (đã câu ' + Math.round((Date.now() - t0) / 60000) + ' phút)');
        }
      }
    })();
  }

  // ============ Điều khiển chạy/dừng ============
  function stopTool(reason, noLand) {
    if (!S.running) { setStatus('Đã dừng'); return; }
    S.running = false; S.runId++;
    releaseAllInputs(); // nhả toàn bộ phím/joystick/dpad ngay, không để nhân vật tự đi tiếp
    if (S.mode === 'fishing') stopFishingGame(); // dừng luôn tự động câu của game
    log('Dừng tool: ' + (reason || ''));
    setStatus('Đã dừng (' + (reason || '') + ')');
    if (S.autoByTool && S.autoBelief) {
      toggleAutoOnce().then(function () { S.autoBelief = false; S.autoByTool = false; log('Đã tắt Auto'); });
    }
    // Dừng do tool (HP thấp/kẹt/lỗi/nút Dừng): hạ cánh nếu đang bay.
    // Dừng do chạm tay thật (noLand): KHÔNG tự hạ cánh — người chơi tự lái.
    if (!noLand && S.flyingBelief) {
      if (pressFly()) log('Đã hạ cánh (dừng tool)');
      S.flyingBelief = false;
      setStatus(S.status);
    }
  }
  function startTool(mode) {
    if (S.running) { log('Tool đang chạy — bấm Dừng trước'); return; }
    S.running = true; S.mode = mode; var runId = ++S.runId;
    S.steerMethod = null; camAnchor = null; // mỗi phiên chạy dò lại cách lái + neo camera từ đầu
    S.flySpeedChecked = false; S.flyRetryDone = false; // kiểm chứng bay lại từ đầu mỗi phiên
    var p = readPos(), m = readMapId();
    var modeName = mode === 'farm' ? 'farm' : mode === 'fishing' ? 'câu cá' : mode === 'huyet' ? 'Huyết Xích' : 'Dược Công';
    log('Bắt đầu ' + modeName + ' — map: ' + (m || '?') + ', vị trí: ' + (p ? '(' + p.x + ',' + p.y + ')' : '?'));
    var job;
    if (mode === 'farm') {
      var targetMap = ($('#ttpx-map') || {}).value || 'thanh_truc_lam';
      var dests = destinationsFor(targetMap);
      var destIdx = parseInt((($('#ttpx-dest') || {}).value || '0'), 10);
      var dest = dests[isNaN(destIdx) ? 0 : destIdx] || dests[0] || null;
      var zoneVal = ($('#ttpx-zone') || {}).value || '';
      var zone = zoneVal ? parseInt(zoneVal, 10) : null;
      if (zone != null && isNaN(zone)) zone = null;
      job = runFarm(runId, targetMap, dest, zone);
    } else if (mode === 'fishing') {
      job = runFishing(runId);
    } else if (mode === 'huyet') {
      job = runHuyetXich(runId);
    } else {
      job = runDuocCong(runId);
    }
    job.then(function () { if (alive(runId)) { /* farm chạy vô hạn tới khi dừng */ } })
       .catch(function (e) {
         if (alive(runId)) {
           log('Lỗi/dừng: ' + e.message);
           if (/kẹt/.test(e.message)) {
             var pp = readPos(), mm = readMapId();
             log('Chi tiết kẹt — vị trí: ' + (pp ? '(' + pp.x + ',' + pp.y + ')' : '?') + ', map: ' + (mm ? (MAPS[mm] ? MAPS[mm].name : mm) : '?') + ', chế độ: ' + modeName + ', cách lái: ' + (S.steerMethod || '?') + ', bay: ' + (S.flyingBelief ? 'BẬT' : 'TẮT'));
           }
           stopTool(e.message);
         }
       });
  }

  // Chạm tay thật → dừng ngay (sự kiện tổng hợp của tool có isTrusted=false nên không tự kích)
  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function (e) {
      if (!S.running || !e.isTrusted) return;
      var panel = $('#ttpx-panel');
      if (panel && e.target && panel.contains(e.target)) return;
      stopTool('người chơi chạm tay', true);
    }, true);
  });

  // ============ Bảng điều khiển ============
  function refreshDestOptions() {
    var mapSel = $('#ttpx-map'), destSel = $('#ttpx-dest');
    if (!mapSel || !destSel) return;
    var dests = destinationsFor(mapSel.value);
    destSel.innerHTML = dests.map(function (d, i) {
      return '<option value="' + i + '">' + d.label + ' (' + d.tx + ',' + d.ty + ')</option>';
    }).join('');
  }
  function buildPanel() {
    if ($('#ttpx-panel')) return;
    var reachTanVien = reachableFrom('tan_vien');
    var opts = FARM_MAPS.map(function (id) { return '<option value="' + id + '"' + (id === 'thanh_truc_lam' ? ' selected' : '') + '>' + MAPS[id].name + (reachTanVien[id] ? '' : ' (vào qua NPC)') + '</option>'; }).join('');
    var zoneOpts = '<option value="">Giữ nguyên khu</option>' + Array.from({ length: 20 }, function (_, i) { return '<option value="' + (i + 1) + '">Khu ' + (i + 1) + '</option>'; }).join('');
    var d = document.createElement('div');
    d.id = 'ttpx-panel';
    d.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:99999;width:250px;background:rgba(12,18,24,.92);color:#e8f3ee;border:1px solid #3a5a4a;border-radius:10px;font:12px/1.45 system-ui,sans-serif;padding:8px;box-shadow:0 4px 18px rgba(0,0,0,.5)';
    var selStyle = 'width:100%;margin:2px 0 6px;background:#12211a;color:#e8f3ee;border:1px solid #3a5a4a;border-radius:6px;padding:4px';
    d.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>Tool Tu Tiên Pixel v1.9</b><button id="ttpx-collapse" style="background:#1d2f27;color:#cfe8da;border:1px solid #3a5a4a;border-radius:6px;padding:2px 8px">Thu gọn</button></div>' +
      '<div id="ttpx-body">' +
        '<div id="ttpx-status" style="margin:6px 0;color:#ffe9a8">Chưa chạy</div>' +
        '<select id="ttpx-map" style="' + selStyle + '">' + opts + '</select>' +
        '<select id="ttpx-dest" style="' + selStyle + '"></select>' +
        '<select id="ttpx-zone" style="' + selStyle + '">' + zoneOpts + '</select>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
          '<button id="ttpx-farm" style="flex:1;background:#1f6f4a;color:#fff;border:0;border-radius:6px;padding:6px">Đi farm</button>' +
          '<button id="ttpx-dc" style="flex:1;background:#7a5a1f;color:#fff;border:0;border-radius:6px;padding:6px">Làm việc Dược Công</button>' +
          '<button id="ttpx-fish" style="flex:1;background:#1f5a7a;color:#fff;border:0;border-radius:6px;padding:6px">Câu cá</button>' +
          '<button id="ttpx-hx" style="flex:1;background:#6f2a3a;color:#fff;border:0;border-radius:6px;padding:6px">Huyết Xích</button></div>' +
        '<div style="display:flex;gap:6px;margin-top:6px">' +
          '<button id="ttpx-run" style="background:#4a5a2a;color:#fff;border:0;border-radius:6px;padding:6px 10px">Chạy</button>' +
          '<button id="ttpx-fly" style="background:#2a4a6f;color:#fff;border:0;border-radius:6px;padding:6px 10px">Bay</button>' +
          '<button id="ttpx-stop" style="background:#6f2a2a;color:#fff;border:0;border-radius:6px;padding:6px 10px">Dừng</button></div>' +
        '<pre id="ttpx-log" style="margin:6px 0 0;white-space:pre-wrap;word-break:break-word;color:#b9d6c7;font-size:11px;max-height:120px;overflow:hidden"></pre>' +
      '</div>';
    document.body.appendChild(d);
    refreshDestOptions();
    $('#ttpx-collapse').addEventListener('click', function () {
      var b = $('#ttpx-body'), btn = $('#ttpx-collapse');
      var hidden = b.style.display === 'none';
      b.style.display = hidden ? '' : 'none';
      btn.textContent = hidden ? 'Thu gọn' : 'Mở ra';
    });
    $('#ttpx-map').addEventListener('change', refreshDestOptions);
    $('#ttpx-farm').addEventListener('click', function () { startTool('farm'); });
    $('#ttpx-dc').addEventListener('click', function () { startTool('dc'); });
    $('#ttpx-fish').addEventListener('click', function () { startTool('fishing'); });
    $('#ttpx-hx').addEventListener('click', function () { startTool('huyet'); });
    $('#ttpx-run').addEventListener('click', function () { manualRunToggle(); });
    $('#ttpx-fly').addEventListener('click', function () { manualFlyToggle(); });
    $('#ttpx-stop').addEventListener('click', function () { stopTool('người chơi bấm Dừng'); });
    log('Tool sẵn sàng. Chọn map + điểm đến (+ khu) rồi bấm "Đi farm", hoặc "Làm việc Dược Công", hoặc "Câu cá", hoặc "Huyết Xích".');
  }

  // Chờ game tải xong (canvas + HUD vị trí) rồi mới hiện bảng
  (function waitGame() {
    var tries = 0;
    (function tick() {
      tries++;
      if (gameCanvas() && $('#hud-pos')) { buildPanel(); return; }
      if (tries > 240) { try { buildPanel(); log('Chưa thấy HUD game — bảng hiện dự phòng'); } catch (e) {} return; }
      setTimeout(tick, 1000);
    })();
  })();

  // ============ Chọn acc farm ở màn hình đăng nhập (v1.9.2, 26/11) ============
  // Vấn đề: dịch vụ đăng nhập của trình duyệt chỉ lưu 1 acc 'Traxanhnet' nên
  // mở acc khác nó vẫn điền nhầm đạo hiệu đó; sửa tay ô Đạo hiệu là cách đúng
  // nhưng phải gõ lại mỗi lần. Panel này chỉ ĐIỀN Ô ĐẠO HIỆU (#auth-name)
  // theo acc anh chọn — KHÔNG chạm mật khẩu (#auth-pass), KHÔNG tick điều
  // khoản, KHÔNG bấm Đăng nhập (#auth-submit): anh vẫn tự nhập/bấm như cũ.
  // Không lưu mật khẩu ở đâu cả; chỉ nhớ TÊN acc đã chọn trong localStorage
  // ('ttpx_login_acc') để lần sau mở màn hình đăng nhập thì điền sẵn tên đó.
  // Panel chỉ hiện khi màn hình đăng nhập (#auth-gate) đang mở, tự ẩn khi
  // đã vào game. Khung gọn nhẹ, thu nhỏ được như bảng tool chính.
  var LOGIN_ACCOUNTS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];
  var LOGIN_STORE_KEY = 'ttpx_login_acc';
  function loginGateVisible() {
    var g = $('#auth-gate');
    if (!g) return false;
    try {
      var r = g.getBoundingClientRect(), s = getComputedStyle(g);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    } catch (e) { return true; }
  }
  function loginRemembered() {
    try { return localStorage.getItem(LOGIN_STORE_KEY) || ''; } catch (e) { return ''; }
  }
  function loginPick(name) {
    if (LOGIN_ACCOUNTS.indexOf(name) < 0) return null;
    var input = $('#auth-name');
    if (!input) return null;
    try {
      // Dùng setter gốc của input để game nhận thay đổi (gán .value thường
      // không kích hoạt handler của game); kèm sự kiện input/change.
      var setter = null;
      try { setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); } catch (e) {}
      if (setter && setter.set) setter.set.call(input, name);
      else input.value = name;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) { try { input.value = name; } catch (e2) {} }
    try { localStorage.setItem(LOGIN_STORE_KEY, name); } catch (e) {}
    var st = $('#ttpx-login-status');
    if (st) st.textContent = 'Đã chọn: ' + name + ' — nhập mật khẩu rồi bấm Đăng nhập của game.';
    var pass = $('#auth-pass');
    if (pass) { try { pass.focus(); } catch (e) {} }
    return name;
  }
  function buildLoginPanel() {
    if ($('#ttpx-login-panel')) return;
    var d = document.createElement('div');
    d.id = 'ttpx-login-panel';
    d.style.cssText = 'position:fixed;right:8px;top:8px;z-index:99999;width:230px;background:rgba(12,18,24,.92);color:#e8f3ee;border:1px solid #3a5a4a;border-radius:10px;font:12px/1.45 system-ui,sans-serif;padding:8px;box-shadow:0 4px 18px rgba(0,0,0,.5)';
    var btns = LOGIN_ACCOUNTS.map(function (a) {
      return '<button data-acc="' + a + '" style="flex:1;background:#1d2f27;color:#cfe8da;border:1px solid #3a5a4a;border-radius:6px;padding:6px 2px">' + a + '</button>';
    }).join('');
    d.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>Đăng nhập acc farm</b><button id="ttpx-login-collapse" style="background:#1d2f27;color:#cfe8da;border:1px solid #3a5a4a;border-radius:6px;padding:2px 8px">Thu gọn</button></div>' +
      '<div id="ttpx-login-body">' +
        '<div style="display:flex;gap:6px;margin:6px 0">' + btns + '</div>' +
        '<div id="ttpx-login-status" style="color:#ffe9a8">Bấm tên acc để điền ô Đạo hiệu. Tool không lưu mật khẩu, không tự bấm Đăng nhập.</div>' +
      '</div>';
    document.body.appendChild(d);
    var col = $('#ttpx-login-collapse');
    if (col) col.addEventListener('click', function () {
      var b = $('#ttpx-login-body'), btn = $('#ttpx-login-collapse');
      if (!b || !btn) return;
      var hidden = b.style.display === 'none';
      b.style.display = hidden ? '' : 'none';
      btn.textContent = hidden ? 'Thu gọn' : 'Mở ra';
    });
    var btnEls = d.querySelectorAll('[data-acc]');
    for (var i = 0; i < btnEls.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () { loginPick(btn.getAttribute('data-acc')); });
      })(btnEls[i]);
    }
    var rem = loginRemembered();
    if (rem && LOGIN_ACCOUNTS.indexOf(rem) >= 0) {
      var st2 = $('#ttpx-login-status');
      if (st2) st2.textContent = 'Lần trước: ' + rem + ' — bấm tên acc để điền ô Đạo hiệu.';
    }
  }
  // Canh màn hình đăng nhập: chỉ hiện panel khi #auth-gate mở; nếu acc đã nhớ
  // mà ô Đạo hiệu đang trống hoặc đang bị điền nhầm 'Traxanhnet' thì điền sẵn
  // tên acc đó (chỉ điền tên, không động vào mật khẩu, không tự đăng nhập).
  (function watchLogin() {
    var applied = '';
    function tick() {
      try {
        if (loginGateVisible()) {
          buildLoginPanel();
          var rem = loginRemembered();
          if (rem && applied !== rem) {
            var cur = $('#auth-name');
            var curVal = cur ? (cur.value || '') : '';
            if (!curVal || curVal === 'Traxanhnet') { loginPick(rem); applied = rem; }
            else applied = curVal;
          }
        } else {
          var p = $('#ttpx-login-panel');
          if (p && p.remove) p.remove();
          applied = '';
        }
      } catch (e) {}
      setTimeout(tick, 1000);
    }
    setTimeout(tick, 500);
  })();

  // Móc cho kiểm thử qua CDP (không dùng trong chơi thường)
  window.__ttpxTool = {
    startFarm: function () { startTool('farm'); },
    startDC: function () { startTool('dc'); },
    startFish: function () { startTool('fishing'); },
    startHuyet: function () { startTool('huyet'); },
    huyet: HUYET,
    adjacentFreeTile: adjacentFreeTile,
    caption: readCaption,
    stones: readStones,
    collapse: readCollapse,
    stop: function () { stopTool('CDP'); },
    run: function () { manualRunToggle(); return readRunState(); },
    runState: readRunState,
    autoState: readAutoState,
    nearestStaging: nearestStagingMap,
    reachable: reachableFrom,
    findPath: function (mapId, sx, sy, tx, ty, fly, opts) {
      var raw = astarPath(mapId, sx, sy, tx, ty, !!fly, opts);
      if (!raw) return null;
      var grid = gridFor(mapId, !!fly);
      return { raw: raw, simplified: simplifyPath(grid, sx, sy, raw, opts && opts.extraBlocked, !!(opts && opts.allowBorder)) };
    },
    maps: MAPS,
    zone: readCurrentZone,
    fishing: fishingActive,
    seed: readSeedState,
    destinations: destinationsFor,
    calibrate: function () { S.running = true; var id = ++S.runId; return calibrate(id).then(function () { return { pxX: S.pxX, pxY: S.pxY, ok: S.calibOk, pos: readPos() }; }); },
    state: function () { return { running: S.running, mode: S.mode, status: S.status, pos: readPos(), map: readMapId(), hp: readHpPct(), autoSig: autoSig(), calibOk: S.calibOk, calibDone: S.calibDone, steerMethod: S.steerMethod, flyingBelief: S.flyingBelief, runState: readRunState(), zone: readCurrentZone(), fishing: fishingActive() }; },
    fly: function () { manualFlyToggle(); return S.flyingBelief; },
    tap: function (dx, dy) { return tapCanvas(dx, dy); },
    keyDown: keyDown, keyUp: keyUp, releaseKeys: releaseAllKeys,
    releaseAll: releaseAllInputs, joyRelease: joyRelease, dpadRelease: dpadRelease,
    detectSteer: function (tx, ty) { S.running = true; var id = ++S.runId; return detectSteerMethod(id, tx, ty).then(function (m) { S.steerMethod = m; return m; }); },
    held: function () { return Object.keys(heldKeys); },
    keyT: function () { pressKey('KeyT', 't'); return autoSig(); },
    log: log,
    loginAccounts: LOGIN_ACCOUNTS,
    loginPick: loginPick,
    loginGateVisible: loginGateVisible,
    loginRemembered: loginRemembered
  };
})();
