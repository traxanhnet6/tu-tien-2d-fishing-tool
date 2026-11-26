// ==UserScript==
// @name         Tu Tiên 2D — Tool Tổng (Câu cá | Boss | Dược | Huyết Xích | Vận Tiêu | Tổ đội | Farm | Đại Hội | Vạn Hoang | Tam Lộ | Chính Ma | Canh | Tàng Kinh | Sổ LT | Tông Chiến | Linh Thụ | Săn Boss | Xổng Chuồng | HX Tổ Đội | Nhiệm vụ | Hồi Sinh | Báo Cáo)
// @namespace    https://tutienpixel.online/
// @version      1.5.3
// @updateURL    https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/main/tutien2d-tool-tong.user.js
// @downloadURL  https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/main/tutien2d-tool-tong.user.js
// @description  Tool Tổng Tu Tiên 2D: 1 bảng chung chia 22 tab — Câu cá Hồ Tây (v3.4), Boss theo giờ, Dược Đại Phu (15 lượt/ngày), Huyết Xích phụ, Vận Tiêu phụ, Tổ đội + farm rùa MTC Khu 12, Farm tự tìm đường, Đại Hội tự ghi danh + đổi Nhân vật ở phòng chờ, Vạn Hoang tự vào bo, Tam Lộ tự bấm "Chơi luôn!", Chính Ma tự trú ẩn 10:55, Canh Phi Hành/trôi khu/Giáp, Tàng Kinh free + Điểm Danh, Sổ Linh Thạch + bảng tổng 4 acc, Tông Môn Chiến tự vào phòng chờ 21:00, Tranh Linh Thụ 20:16 T3/T7, Săn Boss theo lịch cả ngày, Yêu Thú Xổng Chuồng tự đi đánh bầy, Huyết Xích tổ đội cho thanhvan2, Nhiệm vụ chính GĐ0–38 (chỉ hiển thị), Hồi Sinh thông minh, Báo cáo cuối ngày + nhận thưởng Thư, Sáng map Tam Lộ + Vạn Hoang. Khung gọn nhẹ, thu nhỏ được 2 cấp (tab đang dùng + toàn bộ bảng). Module Điều hướng chung (joystick + BFS) cho mọi tab + hook script Python. Chỉ bấm nút của game, không gọi mạng, không sửa bộ nhớ.
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// TOOL TỔNG v1.5.3 — 1 bảng chung, 22 tab. v1.5.3 (27/11, lệnh Thanh 03:37
// "Trỏ build sang v3.4.0"): tab Câu cá trỏ sang file standalone mới
// tutien2d-cau-ca-auto.user.js (v3.4.0) thay cho tutien2d-ho-tay-auto-v3.1.user.js
// (v3.2.0). Module câu cá giữ nguyên trong build (tab 'fish', handle
// __TT2D_FISH__, tab mặc định) — chỉ đổi file nguồn. v3.4.0 có NAV tích hợp
// (joystick + BFS waypoint, vá setPointerCapture) nên TỰ ĐI chạy được một
// mình, không cần nav chung; patch setPointerCapture idempotent nên không
// đụng nav chung. LƯU Ý: v3.4.0 ĐÃ BỎ tính năng tự tránh điểm có người đứng
// (không có cách DOM nào đọc vị trí người khác) — tính năng này trong Tool
// Tổng cũng mất theo. Các tab khác không đổi. CHƯA TEST LIVE.
// TOOL TỔNG v1.5.2 — 1 bảng chung, 22 tab. v1.5.2 (25/11, lệnh Thanh 22:45):
//  SỬA GỐC vụ tool không di chuyển được nhân vật: joyHold lái trực tiếp
//  qua Input.setJoystick thay vì dispatch PointerEvent giả lên #joystick
//  (handler joystick của game gọi setPointerCapture không try/catch,
//  pointerId giả throw NotFoundError nên nhân vật không nhúc nhích).
// v1.5.1 (25/11, lệnh Thanh 22:10):
//  ẩn tên acc ở dòng trạng thái tab Báo cáo (chỉ hiện LT/quái/Thư) + Nhiệm vụ;
//  + sửa diToi chống kẹt (đi vòng khi 3 nhịp không đổi vị trí, áp cả nhánh BFS)
//  + cổng dự phòng Thung Lũng→Mỏ (2,27) (lệnh Thanh 22:15).
// v1.5.0 (25/11, lệnh Thanh 19:36
// "Làm đi" — đợt 2): THÊM 8 TÍNH NĂNG MỚI (8 tab mới):
//  1. Tab Tông Môn Chiến: T3/T7 21:00–21:30, sổ mở 20:45; KHÔNG cần ghi
//     danh — đúng 21:00 tông nào có >=3 thành viên đủ tư cách (vào tông
//     >=3 giờ) đang online tự vào Phòng Chờ; vào phòng chờ đổi NGAY ưu
//     tiên sang 'Nhân vật', giữ Auto BẬT xuyên các trận (5 lượt x 3 trận,
//     90s/trận, cấm trận pháp); xong về farm. Đối chiếu client:
//     TongMonChienUI.state/tran + .tmc-act dataset.act='ghiDanh' (game.js
//     24/11). CHƯA XÁC MINH LIVE: panel mở ở đâu + selector nút ghi danh
//     thật.
//  2. Tab Tranh Linh Thụ: suất 20:16 tối T3/T7 (thay Đại Hội Trúc Cơ);
//     ghi danh 20:00–20:16, đấu 20:16:30–20:31:30 theo tông, tính điểm;
//     đổi ưu tiên 'Nhân vật' khi vào trận; xong về farm. Đối chiếu
//     client: LinhThu.lich() + LinhThuUI.st/tran/bang/ket (game.js 24/11).
//     CHƯA XÁC MINH LIVE: LinhThu.lich() trả dạng gì + nút ghi danh thật.
//  3. Tab Săn Boss: canh giờ theo lịch cả ngày — Xích Long 3h (mốc 07:18),
//     Linh Hổ 5h (mốc 08:32), Nhện 8h (mốc 08:47), Ma Báo ngẫu nhiên
//     11:00–21:00, Giao Long tối CN 19:30–23:00; tới trước N phút rồi GỌI
//     TAB BOSS đi săn (tab Boss tự đi map + tự hồi sinh tại chỗ tối đa 3
//     lần rồi đánh luôn); xong về farm. Ưu tiên giờ từ BẢNG BOSS của game
//     (tab Boss hook BossBoard) khi có; Ma Báo/Giao Long không có giờ cố
//     định nên chỉ đi khi bảng Boss báo giờ. CHƯA XÁC MINH LIVE: giờ bảng
//     Boss có khớp mốc neo không.
//  4. Tab Yêu Thú Xổng Chuồng: đọc toast #yt-toast (BaoYeuThu) — bầy sắp
//     ra/đã ra ở Rừng Trúc/Thảo Dược Cốc/Bãi Đá thì tự đi tới map + khu
//     đó, bật Auto + ưu tiên 'Quái' để đánh bầy (bầy hiện sau ~20s, khu
//     mở trần 80 người tới khi cả bầy bị hạ); hết bầy hoặc quá 10 phút thì
//     về farm. GIỚI HẠN ĐÃ BIẾT: Ma Đạo KHÔNG đánh được Kiếp Tặc — acc
//     chính + traxanhnet2 KHÔNG lấy được Hiệp Nghĩa Lệnh. CHƯA XÁC MINH
//     LIVE: định dạng thật của .yt-sub (có kèm số khu không).
//  5. Tab Huyết Xích Tổ Đội: thanhvan2 làm Huyết Xích PHẢI TỔ ĐỘI — lập
//     đội trước ở làng (10,26)/Bãi Đá (10,5) qua tab Tổ đội (invite,
//     trong 180px, tối đa 6 người), đủ >=2 người mới báo để vào hầm ở
//     Miếu Hoang Nữ Tu (12,6). KHÔNG tự vào hầm, KHÔNG tự trả phí nào.
//     Quy tắc cứng: KHÔNG lập đội trong Miếu Ông Trường Con (PK tự do).
//     Tab CHỈ chạy cho thanhvan2 (traxanhnet2 đi solo được).
//  6. Tab Nhiệm vụ chính: checklist GĐ0–38 (Quest "Tẩy Tuỷ Phạt Mao",
//     STAGE_COUNT=38) + đồ làm Trúc Cơ Đan trong túi — CHỈ HIỂN THỊ +
//     GỢI Ý, KHÔNG tự đột phá, KHÔNG tự dùng đồ quý, KHÔNG tự nhận/làm
//     nhiệm vụ. Mốc đã biết: GĐ6 nộp Huấn Sư Huynh, GĐ13 nộp Đại Phu,
//     GĐ23 mốc cuối Khúc Ba, GĐ27 kỹ năng Tier 1 + 3 Ngưu Sừng + 3 Nanh
//     Hổ, GĐ37 Định Cơ Đan (Đan Phương 20 Điểm Tam Lộ), GĐ38 Đạo Hạnh
//     281.700 + Tâm Kiếp. CHƯA XÁC MINH LIVE: nội dung từng GĐ 0–38.
//  7. Tab Hồi Sinh thông minh: gục khi farm -> "Về làng" (an toàn) thay
//     vì "Hồi sinh" tại chỗ khi HP thấp/nguy hiểm, xong khởi động lại tab
//     Farm; gục khi săn boss -> tab Boss tự hồi sinh tại chỗ (tối đa 3
//     lần); giờ Chính Ma 11:00–12:00 -> TUYỆT ĐỐI không hồi sinh/di
//     chuyển ở làng, chờ qua 12:00. CHƯA XÁC MINH LIVE: selector thật của
//     nút gục.
//  8. Tab Báo Cáo: tổng kết ngày (LT kiếm/tiêu, quái, DC, cá, sự kiện đã
//     tham gia) từ Sổ LT + #stone-day + Inventory cá + log sự kiện các
//     tab; nhận thưởng Thư (tab "Thư" trong bảng Tông Môn,
//     Chat.tongChuaDoc() = số thư chưa đọc) — chỉ bấm nút "Nhận", KHÔNG
//     bán/đổi đồ. CHƯA XÁC MINH LIVE: selector nút "Nhận" trong tab Thư.
//  9. Sáng map sự kiện (lệnh Thanh 21:38 25/11 — đính chính + mở rộng lệnh
//     21:37 "Sáng map Vạn Hoang"): làm sáng TOÀN BỘ map khi đang ở Tam Lộ
//     Tranh Phong hoặc Vạn Hoang Chiến Trường (không chỉ vùng tối ngoài bo
//     Vạn Hoang). Toggle "Sáng map" trong CẢ HAI tab Tam Lộ + Vạn Hoang,
//     chung cơ chế (__TT2D_SANGMAP__); tự BẬT khi vào map sự kiện (tab
//     tương ứng đang bật), tự TẮT khi rời map. Cơ chế (client game.js
//     24/11): renderer phủ tối rgba(7,5,10,0.93) rồi khoét đa giác nhìn
//     thấy NHIN.daGiac(x,y,TAM) — tool nâng TAM_NHIN lên 4096
//     (ChienTruong.TAM_NHIN=192/TAM_NHIN_RA=224; TamLo.TAM_NHIN.nguoi=240)
//     + filter brightness(1.9) lên canvas game; rời map khôi phục đúng
//     giá trị gốc + gỡ filter. CHƯA XÁC MINH LIVE: chỗ đọc
//     ChienTruong.TAM_NHIN trong render Vạn Hoang chưa tìm thấy theo tên;
//     id canvas thật của game; Tam Lộ không có map chờ riêng; bấm
//     đất/joystick trong vùng tối có bị chặn không.
//  + SỬA BUG v1.4.0: farm.stop() không hủy luồng diToiMap/diToi đang chạy
//    dở — nav.js thêm token hủy huyDiChuyen() (kiểm tra sau mỗi await
//    trong diToi/diToiMap/quaCong/quaCongTai, KHÔNG đẩy joystick thêm);
//    farm.js thêm runToken (stop() tăng token + gọi nav.huyDiChuyen(),
//    runToTarget/thienHoiGiap kiểm tra sau mỗi await, KHÔNG bật lại
//    Auto/Phi Hành sau khi dừng).
//  ĐÃ BỎ, KHÔNG LÀM: Tranh Bia Phong Địa + Hắc Thị tự động.
//  Các tab mới CHƯA TEST LIVE (chỉ test trên DOM giả + đối chiếu mã
//  client 24/11) — cần Thanh bật từng tab trong 1 kỳ/ca thật để đối
//  chiếu log. Test smoke mở rộng mục (25).
// TOOL TỔNG v1.4.0 — 1 bảng chung, 14 tab. v1.4.0 (25/11, lệnh Thanh 19:19
// "Làm đi"): THÊM 11 TÍNH NĂNG MỚI (7 tab mới):
//  1. Tab Đại Hội: tự ghi danh khi sổ mở (:00–:15; LK 09:16/13:16/17:16/
//     20:16; Trúc Cơ 13:16/17:16 chỉ T7/CN 3v3, 20:16 trừ tối T3/T7/T5);
//     vào phòng chờ đổi NGAY ưu tiên sang 'Nhân vật' (Hotbar.setUuTien);
//     giữ Auto BẬT xuyên các vòng; xong tự về farm tiếp (Phong Địa K11
//     acc chính, K3 net2, K20 net13, Thảo Dược Cốc K16 thanhvan2). Kiểm
//     tra đạo hiệu trước khi ghi danh; hết phiên thì không ghi danh.
//     Đối chiếu client: DaiHoiUI.show() + #dh-act dataset.act='ghi_danh'
//     + state.daGhiDanh (game.js 24/11).
//  2. Tab Vạn Hoang: T2/T6 ghi danh 21:00–21:15; 21:16 tự di chuyển vào
//     vòng bo (đọc ChienTruongUI.trangThai().bo.tam + nhip.ngoai); chỉ
//     đánh thường, không dùng kỹ năng; hết trận về farm. CHƯA XÁC MINH
//     LIVE: dataset.act của #ct-act + đơn vị tọa độ bo.tam (ô/pixel).
//  3. Tab Tam Lộ: CN/T4 21:00 ghi danh; quét mỗi 1s từ 21:14:30, thấy
//     toast "Chấp nhận trận đấu" thì bấm NGAY nút DOM #tl-toast-act
//     ("Chơi luôn!", cửa ~20s — CHAP_NHAN_MS=20000, client 24/11).
//     Nút "Chơi luôn!" trong trận là chữ canvas — tool không bấm canvas.
//  4. Chế độ Chính Ma: 10:55 tự đưa nhân vật rời làng tới chỗ an toàn
//     (Thảo Dược Cốc Khu 16 mặc định, hoặc Hồ Tây), chờ tới 12:00 mới
//     về farm; trong 11:00–12:00 TUYỆT ĐỐI không hồi sinh/di chuyển ở làng.
//  5. Canh Phi Hành tự động: tốc độ tụt <4/phút (từ >=8/phút) mà đang ở
//     mặt đất (SceneWorld.player.flying=false) thì bật lại 1 lần, chờ
//     120s; KHÔNG bấm mù 2 lần (bài học 17:51 25/11).
//  6. Chống trôi khu (chế độ NGHIÊM, mặc định TẮT): trôi khu nào cũng
//     quay lại khu đích ngay. Mặc định tắt vì tab Farm vốn ở lại khu
//     nhanh (>=5/phút) khi trôi — hành vi cũ vẫn giữ.
//  7. Canh Giáp nguy hiểm: Giáp <20% hoặc HP <30% khi đang đánh Đầu Đàn/
//     Biến Dị thì rút lui về điểm an toàn + thiền, bật lại Phi Hành sau.
//  8. Tàng Kinh free + Điểm Danh: tự nhận Điểm Danh qua DiemDanh.nhan()
//     (cần LK T7+ và đã dự 1 kỳ Đại Hội trong ngày); quay 2 lượt free/
//     ngày, CHỈ bấm nút ghi "Miễn phí", KHÔNG BAO GIỜ quay trả phí.
//     Đường mở bảng quay từ đầu chưa xác minh live.
//  9. Dược chạy hết 15 lượt/ngày: ĐÃ CÓ SẴN từ tab Dược v1.1.2
//     (TONG_LUOT_NGAY=15, tự nhận -> làm -> trả, chỉ 5 việc thường;
//     việc Đại Hội/Tán Tu đang giữ thì tự hủy, Vận Tiêu đang giữ thì
//     DỪNG + báo) — v1.4.0 chỉ kiểm chứng lại qua test, không viết mới.
// 10. Sổ Linh Thạch: ghi LT/quái mỗi 5 phút (localStorage, giữ 24h),
//     cảnh báo khi LT tăng vượt quái +50 (vụ LT lệch 24–25/11).
// 11. Bảng tổng 4 acc: key localStorage chung tt2d_tong_4acc, mỗi acc
//     ghi 1 dòng mỗi 5 phút; GIỚI HẠN: localStorage theo profile —
//     4 acc chạy 4 profile riêng thì bảng chỉ thấy acc của mình.
//  Các tab mới CHƯA TEST LIVE (chỉ test trên DOM giả + đối chiếu mã
//  client 24/11) — cần Thanh bật từng tab trong 1 kỳ/ca thật để đối
//  chiếu log. Test smoke mở rộng mục (21).
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
//  - Câu cá Hồ Tây v3.4.0 | Boss v1.2.1 | Dược v1.1.1 | Huyết Xích phụ v1.1.1
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
// 1 bảng chung chia 22 tab. Các module con (câu cá / boss / dược /
// huyết xích / vận tiêu / tổ đội / farm / đại hội / vạn hoang / tam lộ /
// chính ma / canh / tàng kinh / sổ / tông môn chiến / linh thụ / săn boss /
// xổng chuồng / hx tổ đội / nhiệm vụ / hồi sinh / báo cáo) là các IIFE
// riêng — chúng chèn panel của mình vào đúng container tab qua
// Tong.tabBody(id) rồi đăng ký handle debug qua Tong.register(id, api).
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
  // Mới v1.4.0 (lệnh Thanh 19:19 25/11 "Làm đi" — 11 tính năng mới).
  { id: 'daihoi', icon: '\u2694\uFE0F', ten: 'Đại Hội' },
  { id: 'vanhoang', icon: '\u26F3', ten: 'Vạn Hoang' },
  { id: 'tamlo', icon: '\uD83C\uDFAF', ten: 'Tam Lộ' },
  { id: 'chinhma', icon: '\uD83D\uDEE1\uFE0F', ten: 'Chính Ma' },
  { id: 'canh', icon: '\uD83D\uDC41\uFE0F', ten: 'Canh' },
  { id: 'tangkinh', icon: '\uD83D\uDCD6', ten: 'Tàng Kinh' },
  { id: 'sodo', icon: '\uD83D\uDCD2', ten: 'Sổ LT' },
  // Mới v1.5.0 (lệnh Thanh 19:36 25/11 — 8 tính năng đợt 2).
  { id: 'tongmonchien', icon: '\uD83C\uDFEF', ten: 'Tông Chiến' },
  { id: 'linthu', icon: '\uD83C\uDF33', ten: 'Linh Thụ' },
  { id: 'sanboss', icon: '\uD83D\uDC09', ten: 'Săn Boss' },
  { id: 'xongchuong', icon: '\u2620\uFE0F', ten: 'Xổng Chuồng' },
  { id: 'hxparty', icon: '\uD83D\uDD17', ten: 'HX Tổ Đội' },
  { id: 'nhiemvu', icon: '\uD83D\uDCDC', ten: 'Nhiệm vụ' },
  { id: 'hoisinh', icon: '\uD83D\uDC80', ten: 'Hồi Sinh' },
  { id: 'baocao', icon: '\uD83D\uDCCA', ten: 'Báo Cáo' },
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
    // Mới v1.4.0.
    if (activeTab === 'daihoi') return '⚔️ ' + (s.on ? 'BẬT · ' + s.phase + (s.phienKe ? ' · kỳ tới ' + s.phienKe : '') : 'TẮT');
    if (activeTab === 'vanhoang') return '⛳ ' + (s.on ? 'BẬT · ' + s.phase : 'TẮT');
    if (activeTab === 'tamlo') return '🎯 ' + (s.on ? 'BẬT · ' + s.phase : 'TẮT');
    if (activeTab === 'chinhma') return '🛡️ ' + (s.on ? 'BẬT · ' + s.phase : 'TẮT');
    if (activeTab === 'canh') return '👁️ ' + (s.on ? 'BẬT · ' + (s.ratePerMin ? s.ratePerMin + '/phút' : '—') : 'TẮT');
    if (activeTab === 'tangkinh') return '📖 ' + (s.on ? 'BẬT · ĐD ' + (s.diemDanhDaNhan ? 'đã nhận' : 'chưa') + ' · free ' + s.freeDaQuay + '/2' : 'TẮT');
    if (activeTab === 'sodo') return '📒 Sổ LT · ' + (s.canhBao ? '⚠️ LT lệch!' : 'khớp') + (s.lt !== null && s.lt !== undefined ? ' · ' + s.lt + ' LT' : '');
    // Mới v1.5.0.
    if (activeTab === 'tongmonchien') return '🏯 ' + (s.on ? 'BẬT · ' + s.phase + (s.tran ? ' · ' + s.tran : '') : 'TẮT');
    if (activeTab === 'linthu') return '🌳 ' + (s.on ? 'BẬT · ' + s.phase + (s.tran ? ' · ' + s.tran : '') : 'TẮT');
    if (activeTab === 'sanboss') return '🐉 ' + (s.on ? 'BẬT · ' + s.phase + (s.dangSan ? ' · ' + s.dangSan : '') + (s.sapToi ? ' · tới ' + s.sapToi.ten + ' ' + s.sapToi.gio : '') : 'TẮT');
    if (activeTab === 'xongchuong') return '☠️ ' + (s.on ? 'BẬT · ' + s.phase + (s.thongBao && s.thongBao.map ? ' · bầy ở ' + s.thongBao.map : '') : 'TẮT');
    if (activeTab === 'hxparty') return '🔗 ' + (s.on ? 'BẬT · ' + s.phase + ' · đội ' + s.members.length + ' người' : 'TẮT');
    if (activeTab === 'nhiemvu') return '📜 ' + (s.stage !== null && s.stage !== undefined ? 'GĐ' + s.stage + '/' + s.stageCount : 'GĐ ?/' + s.stageCount);
    if (activeTab === 'hoisinh') return '💀 ' + (s.on ? 'BẬT · ' + s.phase + (s.dangChinhMa ? ' · đang Chính Ma' : '') : 'TẮT');
    if (activeTab === 'baocao') return '📊 ' + (s.lt !== null && s.lt !== undefined ? s.lt + ' LT' : 'Báo Cáo') + (s.thuChuaDoc !== null && s.thuChuaDoc !== undefined ? ' · Thư ' + s.thuChuaDoc : '');
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
    '#tt2d-fish-panel,#tt2d-boss-panel,#tt2d-hx-panel,#tt2d-vantieu-panel,#tt2d-duoc-panel,#tt2d-party-panel,#tt2d-farm-panel,#tt2d-boss-mini,' +
    '#tt2d-daihoi-panel,#tt2d-vanhoang-panel,#tt2d-tamlo-panel,#tt2d-chinhma-panel,#tt2d-canh-panel,#tt2d-tangkinh-panel,#tt2d-sodo-panel,' +
    '#tt2d-tongmonchien-panel,#tt2d-linthu-panel,#tt2d-sanboss-panel,#tt2d-xongchuong-panel,#tt2d-hxparty-panel,#tt2d-nhiemvu-panel,#tt2d-hoisinh-panel,#tt2d-baocao-panel{' +
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
  version: '1.5.3',
  showTab: tongShowTab,
  setCollapsed: tongSetCollapsed,
  setTabCollapsed: tongSetTabCollapsed,
  activeTab: function () { return activeTab; },
  tab: function (id) { return apis[id] || null; },
  status: function () {
    var out = { version: '1.5.3', activeTab: activeTab, tabs: {} };
    Object.keys(apis).forEach(function (id) {
      try { out.tabs[id] = apis[id].status ? apis[id].status() : null; } catch (e) { out.tabs[id] = null; }
    });
    return out;
  },
  nav: null, // module Điều hướng chung gắn vào đây (xem fragments/nav.js)
};


  // ================= MODULE: fish (Câu cá Hồ Tây v3.4.0 standalone: tỷ lệ cắn theo vùng/mồi/thời tiết, mục tiêu auto, tự vào Côn Bằng 12:30 + 19:30; TỰ ĐI tới điểm câu đã chọn (NAV TÍCH HỢP trong module, chạy một mình không cần nav chung, 14 điểm cầu). LƯU Ý: không còn tự tránh điểm có người đứng (tool không đọc được vị trí người khác) — thấy đông thì tự chọn điểm khác.) =================

  (function () {


    // ================= NAV TÍCH HỢP (v3.4) =================
    // Port động cơ lái Đi Farm v1.2.1 + BFS lưới chặn duoc_vien/van_can.
    // Xem ghi chú ở đầu đoạn NAV bên trong.
    var NAV = (function () {
  // ============ NAV TÍCH HỢP (port từ Đi Farm v1.2.1, 26/11) ============
  // Lái bằng phím/joystick/dpad/chạm neo camera (tự dò), vá setPointerCapture,
  // đọc vị trí/map/HP/khu CHỈ từ DOM (#hud-pos, #hud-map...), qua cổng bằng
  // tọa độ hardcode từ MapData, khu đọc từ ô active trên Bảng Khu.
  // KHÔNG đọc window.__ns_ (biến local trong IIFE của game — mù live).
  // Toàn bộ đoạn này nằm trong IIFE riêng (var NAV) nên không đụng tên với
  // code câu cá bên ngoài (CFG/state/log/tap... của NAV đều là cục bộ).
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
      if (proto.setPointerCapture && proto.setPointerCapture.__TT2D_CAUCA_PATCHED__) { joyPatchApplied = true; return true; }
      var origCap = proto.setPointerCapture;
      var origRel = proto.releasePointerCapture;
      if (typeof origCap === 'function') {
        proto.setPointerCapture = function (pid) {
          try { return origCap.call(this, pid); } catch (e) { return; }
        };
        proto.setPointerCapture.__TT2D_CAUCA_PATCHED__ = true;
      }
      if (typeof origRel === 'function') {
        proto.releasePointerCapture = function (pid) {
          try { return origRel.call(this, pid); } catch (e) { return; }
        };
        proto.releasePointerCapture.__TT2D_CAUCA_PATCHED__ = true;
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
    flySpeedMin: 5,         // ô/s — bay dưới ngưỡng này là chưa ăn (kiểm chứng bằng tốc độ; chạy thường 3,51 < 5 < bay+chạy chậm nhất 5,96 — game.js CONFIG)
    flyWindowMs: 2000,     // cửa sổ TÍCH LŨY đo tốc độ bay (ms giữ phím cộng dồn qua nhiều đợt cùng hướng)
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




  var runToken = 0;

  var steerCalls = 0, detourCount = 0, joyStopCalls = 0, autoOnCount = 0;
  var lastHop = null;
  var khuHienTai = null; // khu đọc được từ Bảng Khu (null = chưa rõ)
  var soKhuHienTai = 40; // số khu của map hiện tại (đọc từ bảng, mặc định 40)
  var hpAvailable = false; // đã thấy #value-hp lần nào chưa
  // --- Lái đa cách (v1.2.0) ---
  var steerMethod = null; // 'keys'|'joystick'|'dpad'|'tap' — dò 1 lần mỗi phiên chạy
  var flyingBelief = false; // tin là đang bay (class #btn-fly đã biết sai live — kiểm chứng bằng tốc độ)
  var flySpeedChecked = false, flyRetryDone = false, flySpeedMeasured = null, flySpeedFirst = null; // lần đo đầu (chẩn đoán bay chậm), không ghi đè
  var flyMeas = null; // cửa sổ tích lũy đo tốc độ bay: {x, y, ms, sx, sy} — vị trí đầu cửa sổ, tổng ms giữ phím, dấu hướng
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
  function navLog(s) {
    // Ghi vao nhat ky cua tool cau (log() ngoai — function declaration
    // hoisted trong IIFE tool cau nen goi duoc tu day). NAV khong co panel
    // rieng. Boc try/catch: log() ngoai dung logEl, neu panel chua build
    // thi chi can bo qua chu khong duoc lam hong vong di.
    try { if (typeof log === 'function') log('[NAV] ' + s); } catch (e) { /* bo qua */ }
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
    // KHONG fallback quet text toan body (khac Di Farm): panel tool cau
    // cung chua ten map ("Ho Tay", "Thao Duoc Coc") nen quet body se nhan
    // map sai khi #hud-map dang trong. Khong doc duoc -> null (goi tu choi
    // di chu khong doan).
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
    if (g) navLog('Joystick đang ẩn — đã tự hiện lại để lái.');
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
    ['#tt2d-fish-panel', '#btn-auto-touch', '#btn-auto', '#btn-attack', '#btn-fly'].forEach(function (sel) {
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
      if (p) { camAnchor = { x: p.x, y: p.y }; navLog('Neo camera: ô tại tâm = (' + p.x + ',' + p.y + ')'); }
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
      if (!p0) { navLog('Dò cách lái: không đọc được vị trí — mặc định phím'); navLog('Cách lái: phím'); return 'keys'; }
      var dx = tx - p0.x, dy = ty - p0.y;
      var movedFrom = function (q) { return (q.x !== p0.x || q.y !== p0.y) ? 'moved' : null; };
      navLog('Dò cách lái… (từ (' + p0.x + ',' + p0.y + ') về (' + tx + ',' + ty + '))');

      // a. Phím hướng
      navLog('Dò cách lái: thử phím…');
      var rk = await holdKeysBurst(runId, codesFor(dx, dy), movedFrom, CFG.detectMs);
      if (runId !== runToken) return 'keys';
      if (rk.reason === 'moved') { navLog('Cách lái: phím'); return 'keys'; }
      navLog('Phím không làm nhân vật di chuyển — thử joystick');

      // b. Joystick
      navLog('Dò cách lái: thử joystick…');
      var rj = await holdJoyBurst(runId, dx, dy, movedFrom, CFG.detectMs);
      joyUp(); // nhả hẳn sau đợt dò (holdJoyBurst chỉ kéo về tâm)
      if (runId !== runToken) return 'keys';
      if (rj.reason === 'moved') { navLog('Cách lái: joystick'); return 'joystick'; }
      navLog('Joystick không làm nhân vật di chuyển — thử nút dpad');

      // c. Nút dpad
      var sx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      var sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
      var btns = findDpadBtns(sx, sy);
      if (btns.exact || btns.xOnly || btns.yOnly) {
        navLog('Dò cách lái: thử nút dpad…');
        var rd = await holdDpadBurst(runId, sx, sy, movedFrom, CFG.detectMs);
        if (runId !== runToken) return 'keys';
        if (rd.reason === 'moved') { navLog('Cách lái: dpad'); return 'dpad'; }
        navLog('Nút dpad không làm nhân vật di chuyển — dùng chạm neo camera');
      } else {
        navLog('Không thấy nút dpad — dùng chạm neo camera');
      }

      // d. Chạm neo camera
      navLog('Cách lái: chạm (neo camera)');
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
    flyMeas = null; // cửa sổ đo tốc độ bay mới cho mỗi chặng lái
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
          navLog('Cảnh báo: đợt lái làm xa đích (' + burstFrom.x + ',' + burstFrom.y + ')→(' + p.x + ',' + p.y + ')');
          if (steerMethod === 'tap') { camAnchor = null; navLog('Bỏ neo camera — sẽ neo lại'); }
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

        var speed = flyingBelief ? 3.51 : 2.1; // ô/s, chỉ để đặt hạn giờ đợt — lấy tốc độ CHẠY làm mốc bảo thủ (bay hỏng thì cũng chỉ còn 3,51; bay ăn thì 6,66 nhanh hơn, hạn giờ vẫn thừa)
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
        navLog('→(' + tx + ',' + ty + ') từ (' + p.x + ',' + p.y + ') ' + burstDesc);
        if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        // Đổi map trong đợt lái (bước lên ô cổng): dừng chặng này ngay.
        var mapAfter = docMapId();
        if (mapAfter && mapStart && mapAfter !== mapStart) {
          return { ok: false, reason: 'doi-map', msg: 'Đã sang map ' + tenMap(mapAfter) + '.' };
        }
        var p2 = res.pos || docCell();
        if (!p2) { await sleep(CFG.tickMs); continue; }

        // Kiểm chứng Phi Hành bằng TỐC ĐỘ — ĐO TÍCH LŨY qua nhiều đợt (v1.2.1):
        // Đo một đợt đơn lẻ KHÔNG đo được live — đã xác minh bằng probe 26/11
        // (tuyến phong_dia (20,20)->(30,27)): đợt nào tới đích/biển Khu thì
        // `cheb(p2) <= tol` return trước khối đo; các đợt còn lại chỉ 0,5–1,3s,
        // dưới cửa 800ms. Nên cộng dồn qua các đợt cùng hướng cho tới khi đủ
        // 2000ms giữ phím rồi mới phán: quãng đường RÒNG từ đầu cửa sổ tới vị
        // trí hiện tại (chỉ sai số lượng tử hoá ~1,4 ô ở 2 đầu mút, KHÔNG cộng
        // dồn theo số đợt) chia cho tổng ms giữ phím. Reset cửa sổ khi Chạy
        // TẮT, khi đổi hướng ngược dấu một trục (đi vòng/detour), khi đợt kẹt/
        // không di chuyển, đợt bước 1 ô, hoặc sau đợt đánh trả/đi vòng.
        // CHỈ đo khi Chạy đang BẬT: bay không chạy chỉ 4,04 ô/s (núi chậm nhất
        // Hắc Thổ Linh Mã 1,7: 3,61) < 5 — đo lúc Chạy tắt sẽ bấm nhầm KeyF
        // TẮT Phi Hành. Chạy BẬT được bảo đảm ở start() (datRun trước datFly)
        // và sau mỗi lần qua cổng; cổng đo là lưới an toàn khi Chạy bị tắt
        // giữa chặng (VD: game tắt, nút bấm lỗi). Ngưỡng 5 chỉ tách được
        // bay+chạy (5,96–6,66) khỏi chạy thường (3,51).
        // Ngưỡng 5,0 ô/s từ game.js client 24/11 (CONFIG: SPEED 68, RUN 1,65,
        // FLY 1,9, TILE 32; bay+chạy 6,66 — chậm nhất Hắc Thổ Linh Mã 1,7:
        // 5,96 (Phi Diệp 1,75 → 6,14); chỉ chạy 3,51; đi bộ 3,16): cửa sổ 2000ms thì chạy thường đo tối
        // đa 3,51+1,41/2≈4,2 < 5, bay+chạy chậm nhất đo tối thiểu
        // 5,96−0,71≈5,25 > 5 — tách rõ. Đo bằng EUCLID — CỐ Ý: game chuẩn
        // hoá vector chéo phím (×1/√2) nên tốc độ Euclid KHÔNG đổi theo
        // hướng; Chebyshev đo chéo thấp hơn √2 lần (bay chéo 6,66 → ~4,7 < 5
        // → bấm nhầm KeyF TẮT bay). Chẩn đoán cũ "chéo bộ Euclid ~3,5" là
        // tốc độ CHẠY (3,51), không phải lỗi đo chéo.
        // Chỉ đo đợt tiến triển (không đo đợt kẹt); bấm lại KeyF tối đa 1 lần.
        if (flyingBelief && !flySpeedChecked) {
          var movedB = (p2.x !== startPos.x || p2.y !== startPos.y);
          var sdx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
          var sdy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
          var flipped = flyMeas && ((sdx !== 0 && flyMeas.sx !== 0 && sdx !== flyMeas.sx) ||
            (sdy !== 0 && flyMeas.sy !== 0 && sdy !== flyMeas.sy));
          if (!runDangBat() || flipped || res.reason === 'stuck' || !movedB || res.reason === 'step') {
            flyMeas = null; // Chạy TẮT thì không đo (bay không chạy chỉ 4,04 < 5); đợt này không tính vào cửa sổ; đợt sau mở cửa sổ mới
          } else {
            if (!flyMeas) flyMeas = { x: startPos.x, y: startPos.y, ms: 0, sx: sdx, sy: sdy };
            flyMeas.ms += res.ms;
            if (flyMeas.ms >= CFG.flyWindowMs) {
              var distW = Math.hypot(p2.x - flyMeas.x, p2.y - flyMeas.y);
              if (distW >= 2) {
                var spdW = distW / (flyMeas.ms / 1000);
                flySpeedMeasured = spdW;
                if (flySpeedFirst === null) flySpeedFirst = spdW;
                if (spdW < CFG.flySpeedMin && !flyRetryDone) {
                  flyRetryDone = true;
                  navLog('Phi Hành: tốc độ chỉ ~' + spdW.toFixed(1) + ' ô/s (<' + CFG.flySpeedMin + ') — bay chưa ăn, bấm lại 1 lần (KeyF).');
                  pressFlyKey();
                  await sleep(1200);
                  if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
                } else {
                  flySpeedChecked = true;
                  navLog('Phi Hành: BẬT (tốc độ ~' + spdW.toFixed(1) + ' ô/s).');
                  if (spdW < CFG.flySpeedMin) navLog('Tốc độ vẫn thấp sau khi bấm lại — giữ nguyên, không bấm nữa.');
                }
              }
              flyMeas = null; // đo xong (dù đủ quãng đường hay chưa) thì đóng cửa sổ
            }
          }
        }
        if (cheb(p2) <= tol) return { ok: true };

        var moved = (p2.x !== startPos.x || p2.y !== startPos.y);
        if (steerMethod === 'keys' && codes.length > 1 && !moved && res.reason !== 'arrived') {
          diagOk = false;
          navLog('Giữ 2 phím chéo không di chuyển — chuyển sang giữ từng trục.');
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
            navLog('Có thể quái chặn đường — bật Auto đánh trả rồi đi tiếp.');
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
            if (fRes && fRes.reason === 'moved') navLog('Đánh trả xong, đi tiếp.');
            else navLog('Đánh trả không nhúc nhích — thử đi vòng.');
            bestCheb = Infinity; noProgress = 0; flyMeas = null; // đợt đánh trả không tính vào cửa sổ đo bay
            continue;
          }
          detours++;
          if (detours > CFG.repathMax) {
            return { ok: false, reason: 'ket', msg: 'Kẹt đường tới ' + label + ' — đã thử đi vòng ' + CFG.repathMax + ' lần.' };
          }
          detourCount++;
          navLog('Kẹt — đi vòng (lần ' + detours + '/' + CFG.repathMax + ').');
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
          noProgress = 0; flyMeas = null; // đợt đi vòng vuông góc không tính vào cửa sổ đo bay
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
  async function doiKhu(mapId, khu, tok, deadlineAll) {
    // tok + deadlineAll nhan tu diChuyen (doiKhu chi goi tu do).
    // Khu đã biết và đã đúng -> không cần làm gì (không mở bảng).
    if (khuHienTai !== null && khuHienTai === khu) return { ok: true };
    var info0 = null;
    var info = MAPS[mapId];
    if (!info || !info.sign) {
      navLog('Map ' + tenMap(mapId) + ' chưa biết biển KHU — farm tại khu hiện tại.');
      return { ok: true, skipped: true };
    }
    if (khu < 1) {
      return { ok: false, reason: 'ket', msg: 'Khu đích không hợp lệ (' + khu + ').' };
    }
    var toiBien = null;
    for (var s = 0; s < info.sign.length; s++) {
      var sg = info.sign[s];
      var r = await diTrongMap(mapId, sg[0], sg[1], tok, deadlineAll, 'biển KHU', CFG.arrivePx);
      if (r.ok) { toiBien = sg; break; }
      if (r.reason === 'dung' || r.reason === 'hp-thap' || r.reason === 'guc' || r.reason === 'doi-map' || r.reason === 'loi') return r;
      toiBien = null; // thử biển khác
    }
    if (!toiBien) {
      return { ok: false, reason: 'ket', msg: 'Không tới được biển KHU ở ' + tenMap(mapId) + '.' };
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


  // ---------------- Lưới chặn chính xác (trích từ client 24/11) ----------------
  // '1' = chặn, '0' = đi được. duoc_vien 30 hàng x 40 cột, van_can 36 x 56.
  // Tính từ legend + decorations + props có block (xem README v3.4).
  // Map khác: readWalkable() trả null -> lái thẳng kiểu Đi Farm (tham lam +
  // đi vòng khi kẹt). Lưới nhúng có thể lệch live nếu builder đổi map —
  // lái không qua được thì diTrongMap fallback lái thẳng rồi mới chịu thua.
  var BLOCKED = {
    duoc_vien: [
      '1111111111110011111111111111111111111111',
      '1111111111110011111111111111111111111111',
      '1110110100010011011001111010000001111111',
      '1111111111110010010000000001100001101111',
      '1111111000010000100000000000000101101111',
      '1111111000010000000100000000000001100111',
      '1111000000000000100000000010000001101111',
      '1111000000000000000010000000000001101111',
      '1111000000010011000000001000100001101111',
      '1111000000010000000100000000000001101111',
      '1111001110010000000000000000000000000111',
      '1111001111010000000000000000000001110111',
      '1111000110010000010000100000010001100111',
      '1111111111110000000000000000100011001111',
      '1111000000000000000001000000000110000111',
      '1111001000000000000000000000001100000111',
      '1110001000000000000011111100011000001111',
      '1111000100000000111111111111111001001111',
      '1110100010000000111111111111110000000111',
      '1111000000100001111111111111111001001111',
      '0000110000000001111111111111111001100111',
      '0000000000001001111111111111111000000111',
      '1110000110000001111111111111111000001111',
      '1110000000000000111111111111110000000111',
      '1110000001000010001111111111000000011111',
      '1111010000000110000011111100001000100111',
      '1111110100101000001000001100111101111111',
      '1111111111111111111111111111111111111111',
      '1111111111111111111111111111111111111111',
      '1111111111111111111111111111111111111111'
    ],
    van_can: [
      '11111111111111111111111111111111111111111111111111111111',
      '11111111111111111111111111111111111111111111111111111111',
      '11111111111100011111000011110000111100001111111100111111',
      '11111111100000000010010010000000111100000000100100001111',
      '11000011100000010000000000000000111100000001000000001111',
      '11000011101001101000000000001000111000000000000000011111',
      '11100000000000000010010000000001111110000000000000101111',
      '11000000001000000111000000000011111111101000000000010111',
      '11000000111000000010111111111111111111111110000000001111',
      '11010001111100000111111111111111111111111111000010111111',
      '11000000111000001111111111111111111111111111100000011111',
      '11000000000000011111111111111111111111111111100001001111',
      '11100000100000111111111111111111111111111111100000000011',
      '11000100000001111111111111111111111111111111001000000000',
      '11000000000000000001111111111111111111000000000010000000',
      '11000000000000000001111111111111111111000000100000011011',
      '11000000000000000111111111111111111111111100000000001111',
      '11000010011111111111111111111111111111111000100010000111',
      '11000111111111111111111111111111111111111101110001111111',
      '11000011111111111111111111111111111111111100100100100111',
      '11000001111111111111111111111111111111111100000000010111',
      '11100001111111111111111111111111111111111110000100000111',
      '11100000111111111111111111111111111111111110000000000111',
      '11100001111111111111111111111111111111111110000000000111',
      '11110000111111111111111111111111111111111000000001000111',
      '11110000011111110000011111111111111111110000000000010111',
      '11110000000000000000111111110000001111100001000000100111',
      '11110000000010000000111111100001000000000000001010000111',
      '11110000000000000000011111100011100000000000000000000111',
      '11110010000000001000011110000000000001000000000110000111',
      '11110000000100000001100000100000000110010000000000100111',
      '11111001000000000000000100100000000000001001101001000111',
      '11111000001000000000000000001000000000000000011000101111',
      '11111100001011110000101111110001111110100010111100001111',
      '11111111111111111111111111111111111111111111111111111111',
      '11111111111111111111111111111111111111111111111111111111'
    ],
  };
  function gridWalkable(grid, x, y) {
    if (!grid || y < 0 || y >= grid.length) return false;
    var row = grid[y];
    if (x < 0 || x >= row.length) return false;
    return row.charAt(x) === '0';
  }
  // Lưới đi được của map (mặc định map hiện tại) — cùng chữ ký nav Tool Tổng
  // (bamDatDiToi gọi readWalkable() không tham số). null = không có lưới.
  function readWalkable(mapId) {
    var m = mapId || docMapId();
    return (m && BLOCKED[m]) || null;
  }
  // BFS 4 hướng trên lưới '0'/'1' — cùng chữ ký nav Tool Tổng:
  // bfsPath(grid, sx, sy, tx, ty) -> [[x,y],...] (không gồm ô xuất phát,
  // gồm ô đích) hoặc null khi không có đường.
  function bfsPath(grid, sx, sy, tx, ty) {
    if (!grid || !gridWalkable(grid, sx, sy) || !gridWalkable(grid, tx, ty)) return null;
    if (sx === tx && sy === ty) return [];
    var key = function (x, y) { return x + ',' + y; };
    var prev = {}, q = [[sx, sy]];
    prev[key(sx, sy)] = null;
    while (q.length) {
      var cur = q.shift();
      if (cur[0] === tx && cur[1] === ty) {
        var path = [], n = key(tx, ty);
        while (prev[n]) { var pp = n.split(','); path.unshift([parseInt(pp[0], 10), parseInt(pp[1], 10)]); n = prev[n]; }
        return path;
      }
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4; i++) {
        var nx = cur[0] + dirs[i][0], ny = cur[1] + dirs[i][1];
        if (!gridWalkable(grid, nx, ny)) continue;
        var k = key(nx, ny);
        if (k in prev) continue;
        prev[k] = key(cur[0], cur[1]);
        q.push([nx, ny]);
      }
    }
    return null;
  }
  // Đường thẳng giữa 2 ô có đi được hết không (lấy mẫu DDA mỗi 1/4 ô).
  function lineClear(grid, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0;
    var steps = Math.ceil(Math.hypot(dx, dy) * 4) || 1;
    for (var i = 0; i <= steps; i++) {
      var x = Math.floor(x0 + dx * i / steps), y = Math.floor(y0 + dy * i / steps);
      if (!gridWalkable(grid, x, y)) return false;
    }
    return true;
  }
  // Rút gọn đường BFS: từ mỗi điểm, nhảy xa nhất tới điểm còn nhìn thẳng được.
  function stringPull(grid, pts) {
    var out = [pts[0]], i = 0;
    while (i < pts.length - 1) {
      var j = pts.length - 1;
      while (j > i + 1 && !lineClear(grid, pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j--;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }
  // Vị trí hiện tại {map, x, y} hoặc null (cùng chữ ký nav Tool Tổng:
  // docViTri() dùng trong docMapHienTai/docViTriHienTai của tool câu).
  function docViTri() {
    var c = docCell();
    if (!c) return null;
    return { map: docMapId(), x: c.x, y: c.y };
  }
  // BFS qua đồ thị cổng: danh sách map đi qua (không gồm map xuất phát,
  // gồm map đích) hoặc null khi không có đường bộ. kiemTraDiHo chỉ cần
  // khác null là biết có đường.
  function duongDi(fromId, toId) {
    if (!fromId || !toId) return null;
    if (fromId === toId) return [];
    var prev = {}, q = [fromId];
    prev[fromId] = null;
    while (q.length) {
      var cur = q.shift();
      var ports = PORTALS[cur] || [];
      for (var i = 0; i < ports.length; i++) {
        var nx = ports[i].to;
        if (nx in prev) continue;
        prev[nx] = cur;
        if (nx === toId) {
          var path = [nx], n = cur;
          while (n && n !== fromId) { path.unshift(n); n = prev[n]; }
          return path;
        }
        q.push(nx);
      }
    }
    return null;
  }
  function lyDoKhongDuong(fromId, toId) {
    if (duongDi(fromId, toId) !== null) return null;
    return {
      tieuDe: 'Không có đường bộ từ ' + tenMap(fromId) + ' tới ' + tenMap(toId),
      huongDan: 'Đi tay về map gần nhất có cổng rồi bật TỰ ĐI lại.',
    };
  }
  // Dừng chặng đi đang chạy (nhả hết phím/joystick/dpad).
  function navStop() {
    runToken++;
    releaseAllInputs();
  }
  function navStatus() {
    var c = docCell();
    return {
      map: docMapId(), cell: c, khu: khuHienTai,
      steerMethod: steerMethod, flying: flyingBelief,
      flySpeed: flySpeedMeasured, flySpeedFirst: flySpeedFirst,
      flyRetried: flyRetryDone, steerCalls: steerCalls, detours: detourCount,
    };
  }
  // Đi trong cùng 1 map tới ĐÚNG ô (x, y). Có lưới chặn nhúng thì BFS +
  // rút gọn đường thẳng rồi lái theo từng chặng; không có lưới thì lái
  // thẳng kiểu Đi Farm (tham lam + đi vòng khi kẹt). deadlineAll (ms epoch)
  // là hạn giờ chung của cả chặng diChuyen — mỗi lần gọi steerToCell đều
  // đặt lại CFG.legTimeoutMs bằng thời gian còn lại (tối thiểu 2s) để chặng
  // không chạy quá ngân sách mà tool câu đã giao (diToi(x, y, 60) = 60s).
  // ten: nhãn điểm đến (điểm câu/cổng/biển KHU) — dùng trong log.
  // arrivePxFinal: dung sai chặng cuối (mặc định 16 = đúng ô).
  async function diTrongMap(mapId, x, y, tok, deadlineAll, ten, arrivePxFinal) {
    ten = ten || 'điểm câu';
    arrivePxFinal = (typeof arrivePxFinal === 'number') ? arrivePxFinal : CFG.portalPx;
    function datHan() { CFG.legTimeoutMs = Math.max(2000, deadlineAll - Date.now()); }
    var grid = readWalkable(mapId);
    var cur = docCell();
    if (grid && cur) {
      var path = bfsPath(grid, cur.x, cur.y, x, y);
      if (path && path.length === 0) return { ok: true }; // đã đứng đúng ô
      if (path && path.length) {
        var pts = stringPull(grid, [[cur.x, cur.y]].concat(path));
        // Chặng cuối phải tới đúng dung sai yêu cầu; chặng giữa cho lệch 1 ô.
        for (var i = 1; i < pts.length; i++) {
          if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
          var last = (i === pts.length - 1);
          datHan();
          var r = await steerToCell(pts[i][0], pts[i][1], {
            arrivePx: last ? arrivePxFinal : CFG.arrivePx,
            label: (last ? ten + ' ' : 'chặng ') + '(' + pts[i][0] + ',' + pts[i][1] + ')',
          });
          if (!r.ok && r.reason === 'dung') return r;
          if (!r.ok && r.reason === 'doi-map') return r;
          if (!r.ok) {
            // BFS nói có đường mà lái không qua được (lưới lệch live / quái
            // chặn) — thử lái thẳng tới đích 1 lần rồi mới chịu thua.
            navLog('Chặng BFS kẹt (' + r.msg + ') — thử lái thẳng tới ' + ten + '.');
            datHan();
            return await steerToCell(x, y, { arrivePx: arrivePxFinal, label: ten + ' (' + x + ',' + y + ')' });
          }
        }
        return { ok: true };
      }
      navLog('BFS không có đường tới (' + x + ',' + y + ') trên lưới nhúng — lái thẳng thử.');
    }
    datHan();
    return await steerToCell(x, y, { arrivePx: arrivePxFinal, label: ten + ' (' + x + ',' + y + ')' });
  }
  // Vòng đi chính — port từ start() của Đi Farm v1.2.1 (bỏ phần bật farm khi
  // tới nơi: tới điểm câu thì DỪNG, giao diện câu tự lo phần còn lại).
  // mapId: map đích; khu: 0 = giữ nguyên; x/y: null = chỉ cần tới map.
  // budgetSec: hạn giờ chung cho cả chặng (mặc định 120s).
  // Trả {ok:true} | {ok:false, reason, msg} (reason: dung|ket|hp-thap|guc|
  // khong-duong|chua-qua-cong|het-gio|loi — cùng hợp đồng với steerToCell).
  async function diChuyen(mapId, khu, x, y, budgetSec) {
    runToken++;
    var tok = runToken;
    var savedTimeout = CFG.legTimeoutMs;
    var deadlineAll = Date.now() + (budgetSec || 120) * 1000;
    function datHan() { CFG.legTimeoutMs = Math.max(2000, deadlineAll - Date.now()); }
    try {
      // Phiên chạy mới: dò lại cách lái + kiểm chứng bay lại từ đầu.
      steerMethod = null; camAnchor = null;
      flySpeedChecked = false; flyRetryDone = false; flySpeedMeasured = null; flySpeedFirst = null; flyMeas = null;
      // Chuẩn bị: tắt Auto (joystick không chạy khi Auto BẬT), dừng câu;
      // BẬT Chạy + Phi Hành để đi nhanh — giữ bật qua các cổng (lệnh Thanh).
      if (autoDangBat()) datAuto(false);
      await sleep(400);
      if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
      datRun(true);
      await sleep(400);
      if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
      datFly(true);
      await sleep(400);
      if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
      stopFishing();
      await sleep(200);
      if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };

      var hops = 0;
      while (true) {
        if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        if (Date.now() > deadlineAll) return { ok: false, reason: 'het-gio', msg: 'Quá ' + (budgetSec || 120) + 's chưa tới — đã dừng.' };
        var cur = docMapId();
        if (!cur) return { ok: false, reason: 'loi', msg: 'Không đọc được map hiện tại — đã dừng.' };
        if (KHONG_DUONG[cur] && cur !== mapId) {
          return { ok: false, reason: 'khong-duong', msg: 'Đang ở ' + tenMap(cur) + ' (phó bản/sự kiện) — không có đường bộ tới ' + tenMap(mapId) + '. Rời map này rồi bật TỰ ĐI lại.' };
        }
        if (cur !== mapId) {
          if (++hops > 50) return { ok: false, reason: 'loi', msg: 'Đi qua quá nhiều cổng mà chưa tới — đã dừng.' };
          var hop = nextHop(cur, mapId);
          if (!hop) {
            return { ok: false, reason: 'khong-duong', msg: 'Không có đường bộ từ ' + tenMap(cur) + ' tới ' + tenMap(mapId) + ' — 2 map chưa nối cổng. Đi tay về map gần nhất rồi bật TỰ ĐI lại.' };
          }
          lastHop = { from: cur, to: mapId, tx: hop.tx, ty: hop.ty, toMap: hop.to, byHand: !!hop.byHand };
          navLog('Qua cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + '…');
          // Tới cổng bằng BFS (lưới nhúng) khi có — lái thẳng kẹt sau nhà ở
          // duoc_vien (test v3.4 bắt được: kẹt (6,12) khi tới cổng (0,20)).
          var r = await diTrongMap(cur, hop.tx, hop.ty, tok, deadlineAll, 'cổng', CFG.portalPx);
          // 'doi-map' = cổng đã mở trong lúc đi (map đổi rồi) — coi như qua xong.
          if (!r.ok && r.reason === 'dung') return r;
          if (!r.ok && r.reason !== 'doi-map') return r;
          if (r.ok && hop.byHand) {
            // Cổng byHand (Long Uyên -> Hang Động): đứng trên ô cổng rồi bấm
            // Tương tác ("Vào") mới qua. Chưa xác minh live.
            var okB = false;
            for (var b = 0; b < 2 && !okB; b++) {
              if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
              tap($('#btn-attack'));
              okB = await choDoiMap(cur, CFG.portalWaitMs);
            }
            if (!okB) return { ok: false, reason: 'chua-qua-cong', msg: 'Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + ' — cổng này cần bấm "Vào"/Tương tác tay khi đứng trên ô cổng.' };
          } else if (r.ok) {
            // Tới ô cổng: cổng game mở khi BƯỚC LÊN ô — chờ đổi map (Ft=8s).
            var ok = await choDoiMap(cur, CFG.portalWaitMs);
            if (!ok && flyingBelief) {
              // Qua cổng không được khi đang bay: hạ cánh, đi bộ lên ô cổng.
              navLog('Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') khi bay — hạ cánh đi bộ lên ô cổng.');
              datFly(false);
              var r2 = await diTrongMap(cur, hop.tx, hop.ty, tok, deadlineAll, 'cổng', CFG.portalPx);
              if (!r2.ok && r2.reason === 'dung') return r2;
              if (r2.ok) ok = await choDoiMap(cur, CFG.portalWaitMs);
              else if (r2.reason === 'doi-map') ok = true;
            }
            if (!ok) {
              // Nudge bằng joystick về phía cổng rồi chờ thêm.
              var nudged = false;
              for (var n = 0; n < 3 && !ok; n++) {
                if (tok !== runToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
                var v = docViTriPx();
                if (v) {
                  var dx = hop.tx * CFG.tile + CFG.tile / 2 - v.x;
                  var dy = hop.ty * CFG.tile + CFG.tile / 2 - v.y;
                  await joyHold(dx, dy, 700);
                  nudged = true;
                }
                ok = await choDoiMap(cur, CFG.nudgeWaitMs);
              }
              if (!ok) return { ok: false, reason: 'chua-qua-cong', msg: 'Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + ' — đã thử đẩy 3 lần. Đứng lại kiểm tra tay rồi bật TỰ ĐI lại.' };
              if (nudged) navLog('Đẩy cổng bằng joystick đã qua.');
            }
          }
          // Sang map mới thì khu chưa rõ nữa — đọc lại từ bảng khi cần đổi khu.
          khuHienTai = null;
          navLog('Đã sang ' + tenMap(docMapId()) + '.');
          // Qua cổng/hạ cánh có thể tắt bay — bật lại Chạy + Phi Hành để đi
          // tiếp cho nhanh (giữ bật qua các cổng). Bật lại bay thì đo lại
          // tốc độ ở đợt lái sau (không bấm lại lần 2 mù).
          if (!runDangBat()) datRun(true);
          if (!flyingBelief) {
            datFly(true);
            flySpeedChecked = false;
          }
          continue;
        }
        // Đã ở map đích.
        if (khu) {
          var rk = await doiKhu(mapId, khu, tok, deadlineAll);
          if (!rk.ok && rk.reason === 'dung') return rk;
          if (!rk.ok && rk.reason === 'doi-map') continue; // lạc sang map khác — đánh giá lại từ đầu
          if (!rk.ok) return rk;
          if (!rk.skipped) navLog('Đang ở Khu ' + (khuHienTai === null ? khu : khuHienTai) + ' — đi tới điểm câu.');
        }
        if (x === null || y === null) return { ok: true }; // chỉ cần tới map
        var rw = await diTrongMap(mapId, x, y, tok, deadlineAll, 'điểm câu', CFG.portalPx);
        if (!rw.ok && rw.reason === 'doi-map') continue; // lạc sang map khác — đánh giá lại từ đầu
        return rw;
      }
    } finally {
      CFG.legTimeoutMs = savedTimeout;
    }
  }
  // Tới map (chỉ cần sang map, không đi tiếp trong map). Trả Promise<boolean>.
  async function diToiMap(mapId, budgetSec) {
    var r = await diChuyen(mapId, 0, null, null, budgetSec || 120);
    if (!r.ok) navLog('diToiMap(' + mapId + ') thất bại: ' + r.msg);
    return r.ok;
  }
  // Đi tới ô (x, y) trong map HIỆN TẠI. maxSec = ngân sách giây cho cả chặng
  // (mặc định 60 — cùng chữ ký nav Tool Tổng: diToi(x, y, maxBuoc)).
  // Trả Promise<boolean>.
  async function diToi(x, y, maxSec) {
    var cur = docMapId();
    if (!cur) { navLog('diToi: không đọc được map hiện tại.'); return false; }
    var r = await diChuyen(cur, 0, x, y, maxSec || 60);
    if (!r.ok) navLog('diToi(' + x + ',' + y + ') thất bại: ' + r.msg);
    return r.ok;
  }

  return {
    version: '3.4.0-nav',
    cfg: CFG,
    diToi: diToi, diToiMap: diToiMap, duongDi: duongDi,
    lyDoKhongDuong: lyDoKhongDuong, docViTri: docViTri,
    readWalkable: readWalkable, bfsPath: bfsPath,
    datAuto: datAuto, autoDangBat: autoDangBat,
    datFly: datFly, datRun: datRun,
    flyDangBat: flyDangBat, runDangBat: runDangBat,
    docCell: docCell, docMapId: docMapId, docHP: docHP, docGuc: docGuc,
    docKhu: docKhu, stop: navStop, status: navStatus,
    _patchCapture: patchPointerCapture,
  };

    })();

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
      chiemDungYenMs: 5000,     // v3.2: người khác đứng yên N ms đúng ô điểm câu thì tính là chiếm chỗ (v3.4: không còn nguồn đo — luôn 0, giữ để khỏi đổi chữ ký)
      ketCaptionMs: 90000,      // v3.4: kẹt ngầm DC khi túi đóng — >N ms không xong lượt câu nào (đếm ngược caption) thì coi là kẹt
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
    // --- v3.2: TỰ ĐI tới điểm câu (v3.4: nav tích hợp sẵn, không cần Tool Tổng) ---
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
    var remoteSeen = {};         // id người chơi khác -> {tx, ty, since} (v3.4: luôn rỗng — không có nguồn live; giữ cấu trúc để cắm lại sau)
    var lastRemoteScanAt = 0;    // lần cuối quét vị trí người chơi khác (tối đa 1 lần/giây)
    // --- v3.3: Câu ở Dược Cốc — Hồ Bích Thủy (tính năng 13) ---
    // Cơ chế khác hẳn Hồ Tây: không quăng/giật/kéo — bật "Tự động câu" của
    // game rồi để game tự câu (xem mục 13 trong header).
    var diaDiem = 'ho_tay';      // 'ho_tay' | 'duoc_coc' (lưu localStorage)
    try {
      var _dd = localStorage.getItem('tt2d_fish_diadiem');
      if (_dd === 'duoc_coc' || _dd === 'ho_tay') diaDiem = _dd;
    } catch (e) { /* bỏ qua */ }
    var SPOTS_DC = [
      { x: 18, y: 15, ten: 'Đài câu cá (18,15)' },
      { x: 18, y: 16, ten: 'Đài câu cá (18,16)' },
    ];
    var spotDcIdx = 0;           // điểm bến Dược Cốc đã chọn (mặc định (18,15))
    var daDoiKhuDong = false;    // đã chuyển khu đông người trong phiên câu DC này
    var dcDangThien = false;     // đang thiền hồi Giáp (chờ Giáp đầy mới câu)
    var dcDangBatCau = false;    // đang trong quá trình bật "Tự động câu" (tránh bấm chồng)
    var lastGiapCheckAt = 0;     // lần cuối kiểm tra Giáp khi đang câu DC
    var lastTuDongCauCheckAt = 0;// lần cuối kiểm tra "Tự động câu" còn bật không
    var lastCaCheckAt = 0;       // lần cuối kiểm tra số cá (kẹt ngầm)
    var caSongTruoc = null;      // số Cá Sông lần kiểm tra trước (kẹt ngầm)
    var caSongTruoc2 = null;     // số Cá Sông lần kiểm tra trước nữa
    var lastKetLogAt = 0;        // chống spam log kẹt ngầm
    var capGiayTruoc = null;     // v3.4: giây đếm ngược caption lần theo dõi trước
    var capLanCuoiHoanThanh = 0; // v3.4: lần cuối 1 lượt câu hoàn thành (đếm ngược caption nhảy lên)
    var lastCaptionCheckAt = 0;  // v3.4: lần cuối theo dõi caption (tối đa 2 lần/giây)

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

    // ---------------- v3.2: TỰ ĐI tới điểm câu (nav tích hợp sẵn từ v3.4) ----------------
    // Theo đúng mẫu tab Boss v1.2.0 (nút TỰ ĐI, movePhase, kẹt 3 lần thì tắt).
    // nav.diToiMap/diToi tự tắt Auto trước khi đẩy joystick (joystick không
    // chạy khi Auto BẬT) nên tab này không cần tắt Auto tay. Tới điểm câu
    // rồi thì giao diện câu tự hiện (VanCanUI.update) và tick câu bình thường.
    function nav() {
      // v3.4: NAV tích hợp sẵn trong tool (port từ Đi Farm v1.2.1) — LUÔN có,
      // không cần Tool Tổng nữa. Giữ hàm nav() để các chỗ gọi cũ không đổi.
      return NAV;
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
    // Vị trí hiện tại (ô x, y): ưu tiên nav.docViTri(), fallback đọc #hud-pos.
    function docViTriHienTai() {
      try {
        var n = nav();
        if (n && typeof n.docViTri === 'function') {
          var p = n.docViTri();
          if (p && p.x !== null && p.y !== null) return { x: p.x, y: p.y };
        }
      } catch (e) { /* bỏ qua */ }
      // Fallback CHỈ đọc #hud-pos "(x, y)" — KHÔNG quét body text nữa:
      // panel tool cũng chứa "(38,14)" trong ô chọn điểm, quét body sẽ
      // đọc nhầm vị trí đã chọn thành vị trí thật.
      var hp = document.querySelector('#hud-pos');
      var t = hp ? (hp.innerText || hp.textContent || '') : '';
      var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (m) return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
      return null;
    }
    // Quét vị trí người chơi khác — v3.4: KHÔNG CÒN NGUỒN NÀO đọc được live.
    // Đã xác minh từ game.js client 24/11 (26/11): người chơi khác CHỈ vẽ
    // trên canvas (SceneWorld.remotes, biến local trong IIFE — không có trên
    // window, không có phần tử DOM nào); #btn-attack chỉ hiện "Tương Tác"/
    // "Công Thường", không xác định được người ở ô cụ thể. Hơn nữa người
    // khác KHÔNG chặn di chuyển (2 người đứng chung 1 ô được) nên "tới điểm
    // mà không đứng được" cũng KHÔNG phải tín hiệu. -> remoteSeen luôn rỗng:
    // diemBiChiem() luôn false, chonDiemTrong() luôn trả điểm đã chọn.
    // Người dùng tự chọn điểm khác trong ô chọn khi thấy đông. KHÔNG bịa
    // tín hiệu. Giữ nguyên hàm + cấu trúc remoteSeen để sau này có nguồn
    // live thì cắm lại đúng chỗ này.
    function quetNguoiDung(now) {
      if (now - lastRemoteScanAt < 1000) return; // quét tối đa 1 lần/giây
      lastRemoteScanAt = now;
      // v3.4: không có nguồn live — rems luôn null (xem comment trên).
      var rems = null;
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
      var n = nav(); // v3.4: NAV tích hợp sẵn, luôn có diToiMap/diToi.
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
      var spots = diaDiem === 'duoc_coc' ? SPOTS_DC : SPOTS;
      if (idx < 0 || idx >= spots.length) return;
      if (diaDiem === 'duoc_coc') spotDcIdx = idx; else spotIdx = idx;
      spotDoi = true;
      if (spotSel) spotSel.value = String(idx);
      log('Điểm câu: ' + spots[idx].ten + (tuDi ? ' — TỰ ĐI sẽ tới điểm này.' : '.'));
    }
    // Đồng bộ ô chọn theo vị trí thật (khi nav chuyển hướng sang điểm khác) —
    // không đánh dấu là người dùng đổi điểm.
    function dongBoDiemCau(idx) {
      if (idx < 0 || idx >= SPOTS.length) return;
      spotIdx = idx;
      if (spotSel) spotSel.value = String(idx);
    }
    // Bật/tắt TỰ ĐI. v3.4: nav tích hợp sẵn nên không còn từ chối khi bật.
    function setTuDi(v) {
      tuDi = !!v;
      if (!tuDi) { movePhase = 'idle'; sanSangCau = false; setMoveStatus(''); }
      else {
        moveFails = 0;
        lastMoveCheckAt = 0; // kiểm tra ngay nhịp sau
        var diemTen = diaDiem === 'duoc_coc' ? SPOTS_DC[spotDcIdx].ten : SPOTS[spotIdx].ten;
        log('Đã BẬT tự đi tới điểm câu ' + diemTen + ' — tool sẽ tự đi khi chưa ở điểm câu.');
        setMoveStatus('TỰ ĐI đang BẬT — đang tới điểm câu ' + diemTen + '…');
      }
      capNhatNutTuDi();
    }
    function capNhatNutTuDi() {
      if (!tudiBtn) return;
      tudiBtn.textContent = tuDi ? 'TỰ ĐI: BẬT' : 'TỰ ĐI: TẮT';
      tudiBtn.style.background = tuDi ? '#6b4d16' : '#2a2113';
      tudiBtn.style.opacity = '1'; // v3.4: nav tích hợp sẵn, luôn dùng được
      tudiBtn.title = 'Tự di chuyển tới điểm câu đã chọn (nav tích hợp sẵn)';
    }

    // ---------------- v3.3: Câu ở Dược Cốc — Hồ Bích Thủy ----------------
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
    // Giáp %: đọc width của <s> trong .pl-bar.hp (cùng cách tab Farm đọc).
    function docGiapPct() {
      try {
        var s = document.querySelector('.pl-bar.hp s');
        if (!s) return null;
        var w = parseFloat((s.style && s.style.width) || '');
        return isFinite(w) ? w : null;
      } catch (e) { return null; }
    }
    function docHpPct() {
      try {
        var el = document.querySelector('.pl-bar.hp .pl-n');
        if (!el) return null;
        var m = txt(el).match(/(\d+)\s*\/\s*(\d+)/);
        if (!m || +m[2] === 0) return null;
        return Math.round(100 * (+m[1]) / (+m[2]));
      } catch (e) { return null; }
    }
    // Số cá trong túi — v3.4: đọc từ TÚI ĐỒ đang mở (ô .bag-slot[data-item],
    // aria-label "<tên>, số lượng <qty>", span .bag-qty "x<qty>" khi qty>1).
    // Chỉ đọc được khi túi đang mở; túi đóng -> null (không biết, KHÔNG
    // đoán). Trước đây đọc window.__ns__.Inventory.count — mù live (biến
    // local trong IIFE của game). Client Fishing: COMMON_FISH "ca_song",
    // SPIRIT_FISH "linh_ngu". Túi mở mà không có ô cá nào = 0 con.
    function docCa() {
      try {
        var slots = document.querySelectorAll('.bag-slot');
        if (!slots.length) return null; // túi chưa mở
        var out = { caSong: 0, linhNgu: 0 };
        for (var i = 0; i < slots.length; i++) {
          var it = slots[i].getAttribute('data-item');
          if (it !== 'ca_song' && it !== 'linh_ngu') continue;
          var q = docSoLuongSlot(slots[i]);
          if (it === 'ca_song') out.caSong = q; else out.linhNgu = q;
        }
        return out;
      } catch (e) { return null; }
    }
    // Số lượng trong 1 ô túi: span .bag-qty "x<qty>" khi qty>1;
    // không có span thì thử aria-label "số lượng <qty>"; không có = 1.
    function docSoLuongSlot(slot) {
      try {
        var q = slot.querySelector('.bag-qty');
        if (q) {
          var m = (q.innerText || q.textContent || '').match(/(\d+)/);
          if (m) return parseInt(m[1], 10);
        }
        var lab = slot.getAttribute('aria-label') || '';
        var m2 = lab.match(/số lượng\s*(\d+)/);
        if (m2) return parseInt(m2[1], 10);
      } catch (e) { /* bỏ qua */ }
      return 1;
    }
    // Game có đang "Tự động câu" không? Tín hiệu tin cậy nhất là nút Dừng
    // câu (#btn-fishing-stop-touch) đang hiện — game chỉ hiện nút này khi
    // đang câu. Caption #ritual-caption "Tự động câu... còn Xs" là tín hiệu
    // phụ (v3.4: #hud-caption là code chết — 0 hit trong game.js; caption thật
    // là #ritual-caption). KHÔNG
    // quét cả body.innerText (panel tool cũng chứa chữ "Tự động câu" trong
    // phần hướng dẫn, quét cả body sẽ luôn trả true).
    function dangTuDongCau() {
      try {
        var b = document.querySelector('#btn-fishing-stop-touch') || document.querySelector('#btn-fishing-stop');
        if (b && b.offsetParent !== null && !b.classList.contains('hidden')) return true;
        var cap = document.querySelector('#ritual-caption');
        if (cap && /Tự động câu/.test(cap.textContent || '')) return true;
        // KHÔNG quét text toàn body nữa (v3.3.0 cũ): nút lựa chọn "Tự động
        // câu" trong hộp thoại Hồ Bích Thủy cũng match → báo đang câu trong
        // khi chưa câu (test 25/11 bắt được: poll (23e) pass sớm khi chưa tới
        // bến). Caption + nút Dừng câu là 2 tín hiệu riêng của game khi đang
        // tự động câu, đủ tin cậy.
      } catch (e) { /* bỏ qua */ }
      return false;
    }
    // Bấm nút HUD của game (chỉ bind pointerdown) — dùng cho nút Dừng câu,
    // nút thiền, nút Tương Tác.
    function tapHud(sel) {
      var b = document.querySelector(sel);
      if (!b) return false;
      try {
        b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true }));
        setTimeout(function () {
          try { b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })); } catch (e) {}
        }, 60);
        return true;
      } catch (e) { return false; }
    }
    // Dừng câu ở Dược Cốc: bấm nút "Dừng câu" của game.
    function dungCauDc() {
      if (tapHud('#btn-fishing-stop-touch') || tapHud('#btn-fishing-stop')) {
        log('Đã bấm Dừng câu (Dược Cốc).');
        return true;
      }
      log('Không thấy nút Dừng câu — câu có thể đã tự dừng.');
      return false;
    }
    // Bật "Tự động câu" ở Hồ Bích Thủy: tương tác với hồ rồi bấm lựa chọn
    // "Tự động câu" trong hộp thoại (.btn-choice, bind click — .click() đúng).
    // Trả true khi thấy caption "Tự động câu" hiện (tối đa 3 lần thử).
    async function batTuDongCau() {
      if (dcDangBatCau) return dangTuDongCau();
      dcDangBatCau = true;
      try {
        for (var lan = 1; lan <= 3; lan++) {
          if (dangTuDongCau()) return true;
          // Bấm nút Tương Tác với hồ (aria-label chứa Hồ/nước/câu) như moGiaoDienCau.
          var btn = null;
          var atk = document.querySelector('#btn-attack');
          var lab = atk ? ((atk.getAttribute('aria-label') || '') + ' ' + (atk.textContent || '')) : '';
          if (atk && /tương tác/i.test(lab) && /hồ|câu|nước|bích/i.test(lab)) btn = atk;
          if (btn) tapHud('#btn-attack');
          else {
            var all = document.querySelectorAll('button');
            for (var i = 0; i < all.length; i++) {
              var b2 = all[i];
              if (!b2.offsetParent) continue;
              var t2 = (b2.innerText || b2.textContent || '');
              if (/tương tác/i.test(t2) && /hồ|câu|nước|bích/i.test(t2)) { tapHud('#btn-attack'); btn = b2; break; }
            }
          }
          await sleep(800);
          // Hộp thoại lựa chọn: bấm "Tự động câu" (không bấm "Thả câu").
          var chon = null;
          var chs = document.querySelectorAll('.btn-choice, #dialog-choices button, #dialog button');
          for (var j = 0; j < chs.length; j++) {
            var t3 = (chs[j].innerText || chs[j].textContent || '').trim();
            if (/Tự động câu/.test(t3)) { chon = chs[j]; break; }
          }
          if (chon) {
            chon.click();
            log('Đã chọn "Tự động câu" ở Hồ Bích Thủy (lần ' + lan + '/3).');
          } else if (lan === 1) {
            log('Chờ hộp thoại Hồ Bích Thủy mở…');
          }
          await sleep(1200);
          if (dangTuDongCau()) return true;
        }
        log('Không bật được "Tự động câu" sau 3 lần — đứng sát mép hồ (18,15)/(18,16) rồi bấm lại.');
        return false;
      } finally {
        dcDangBatCau = false;
      }
    }
    // Bấm ô đất để đi (di chuyển khi Auto BẬT — joystick đứng yên khi Auto
    // BẬT nên không dùng joystick trên đường tới bến). Camera của game luôn
    // theo nhân vật nên nhân vật ở gần giữa canvas; bấm lệch ~160px theo
    // hướng ô đích rồi lặp lại, lái vòng kín bằng docViTriHienTai() (BFS qua
    // nav để tránh vật chắn). Trả false nếu kẹt 5s không nhúc nhích hoặc
    // không có canvas — bên gọi fallback sang joystick (Auto TẮT tạm).
    // CHƯA XÁC MINH LIVE (canvas tile→screen chưa đối chiếu client) — nếu
    // live bấm đất không đi thì fallback joystick sẽ lo phần còn lại.
    async function bamDatDiToi(tx, ty, maxMs) {
      var cv = document.querySelector('canvas');
      if (!cv) return false;
      var n = nav();
      var t0 = Date.now();
      var lastPos = docViTriHienTai();
      var lastMoveAt = Date.now();
      while (Date.now() - t0 < (maxMs || 60000)) {
        var cur = docViTriHienTai();
        if (!cur) return false;
        if (cur.x === tx && cur.y === ty) return true;
        if (lastPos && (cur.x !== lastPos.x || cur.y !== lastPos.y)) { lastPos = cur; lastMoveAt = Date.now(); }
        if (Date.now() - lastMoveAt > 5000) return false; // kẹt 5s không nhúc nhích
        // Ô kề tiếp theo trên đường BFS (tránh vật chắn); không có BFS thì
        // đi thẳng về đích. TRÁNH (11,6)/(11,7): khe cổng hàng rào phía tây
        // vào Vườn Cá Nhân (bị Dược Linh Thú đánh).
        var nx = tx, ny = ty;
        try {
          var g = n && typeof n.readWalkable === 'function' ? n.readWalkable() : null;
          var path = (g && typeof n.bfsPath === 'function') ? n.bfsPath(g, cur.x, cur.y, tx, ty) : null;
          if (path && path.length) { nx = path[0][0]; ny = path[0][1]; }
        } catch (e) { /* đi thẳng */ }
        if ((nx === 11 && (ny === 6 || ny === 7))) return false; // không đi qua khe Vườn Cá Nhân
        var r = cv.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = nx - cur.x, dy = ny - cur.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var px = cx + (dx / len) * 160, py = cy + (dy / len) * 160;
        try {
          cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, clientX: px, clientY: py }));
          cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, clientX: px, clientY: py }));
        } catch (e) { return false; }
        // Hộp thoại mở nhầm (bấm trúng NPC) thì đóng rồi đi tiếp.
        var dlg = document.querySelector('#dialog');
        if (dlg && !dlg.classList.contains('hidden')) {
          var cl = document.querySelector('#dialog-close');
          if (cl) cl.click();
        }
        await sleep(600);
      }
      return false;
    }
    // Khu hiện tại: .khu-note "Đang ở khu N" hoặc ô [data-khu].dang trên
    // Bảng Khu đang mở. v3.4: bỏ nhánh KhuUI.khu — window.__ns_ mù live.
    // (null = chưa rõ — KHÔNG cache khu qua lần đăng nhập, xem Đi Farm.)
    function docKhuHien() {
      try {
        var note = document.querySelector('.khu-note');
        var m = note ? txt(note).match(/Đang ở khu\s*(\d+)/) : null;
        if (m) return parseInt(m[1], 10);
      } catch (e) { /* bỏ qua */ }
      try {
        var act = document.querySelector('#khu-panel [data-khu].dang, .khu-grid [data-khu].dang');
        if (act) {
          var ka = parseInt(act.getAttribute('data-khu'), 10);
          if (ka >= 1) return ka;
        }
      } catch (e) { /* bỏ qua */ }
      return null;
    }
    // Mở Bảng Khu: bấm nút Tương Tác (aria-label "Tương tác với Bảng Khu"),
    // không thì bấm Space (cùng cách tab Farm mở bảng).
    async function moBangKhuDc() {
      if (document.querySelectorAll('[data-khu]').length > 0) return true;
      var atk = document.querySelector('#btn-attack');
      var lab = atk ? ((atk.getAttribute('aria-label') || '') + ' ' + (atk.textContent || '')) : '';
      if (atk && /bảng khu/i.test(lab)) tapHud('#btn-attack');
      else document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
      for (var i = 0; i < 8; i++) {
        await sleep(500);
        if (document.querySelectorAll('[data-khu]').length > 0) return true;
      }
      return false;
    }
    // CHUYỂN KHU ĐÔNG NGƯỜI NHẤT còn chỗ (chỉ câu Dược Cốc — lệnh Thanh
    // 19:43; farm quái vẫn giữ khu ÍT người). Số người exact KHÔNG có trong
    // DOM — nút [data-khu] chỉ mang class bucket (client KhuUI.r: "day" đầy
    // / "dong" đông >50% / "vang" có người / "" trống). Chọn khu "dong" đầu
    // tiên, không có thì "vang" đầu tiên, không có nữa thì ở khu hiện tại.
    // Không mở được bảng thì câu ở khu hiện tại (không chặn).
    async function chonKhuDongNhat() {
      var n = nav();
      // Tới biển KHU (14,5) bằng bấm đất (Auto BẬT) — fallback joystick.
      var okBen = await bamDatDiToi(14, 5, 30000);
      if (!okBen && n && typeof n.diToi === 'function') {
        log('Bấm đất tới biển Khu không được — dùng joystick (Auto TẮT tạm).');
        try { okBen = await n.diToi(14, 5, 60); } catch (e) { okBen = false; }
      }
      if (!okBen) { log('Không tới được biển Khu (14,5) — câu ở khu hiện tại.'); return false; }
      if (!await moBangKhuDc()) { log('Không mở được Bảng Khu — câu ở khu hiện tại.'); return false; }
      await sleep(1500); // chờ server gửi danh sách khu (KhuUI.onList)
      var cur = docKhuHien();
      var chon = null, chonHang = '';
      var btns = document.querySelectorAll('[data-khu]');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var k = parseInt(b.getAttribute('data-khu'), 10);
        if (!k || k === cur) continue;
        var cls = (b.className || '');
        var hang = /\bday\b/.test(cls) ? 'day' : /\bdong\b/.test(cls) ? 'dong' : /\bvang\b/.test(cls) ? 'vang' : 'trong';
        if (hang === 'day') continue; // đầy — không vào được
        if (hang === 'dong') { chon = k; chonHang = 'dong'; break; }
        if (hang === 'vang' && !chon) { chon = k; chonHang = 'vang'; }
        if (hang === 'trong' && !chon) { chon = k; chonHang = 'trong'; }
      }
      if (!chon) { log('Bảng Khu không có khu đông còn chỗ — câu ở khu hiện tại.'); return false; }
      var btnChon = document.querySelector('[data-khu="' + chon + '"]');
      if (!btnChon) return false;
      btnChon.click();
      var t0 = Date.now();
      while (Date.now() - t0 < 5000) {
        await sleep(500);
        if (docKhuHien() === chon) {
          log('Đã chuyển sang khu ĐÔNG người nhất còn chỗ: Khu ' + chon + ' (' + chonHang + ') — câu Dược Cốc.');
          return true;
        }
        if (document.querySelectorAll('[data-khu]').length === 0) break;
      }
      if (docKhuHien() === chon) { log('Đã chuyển sang Khu ' + chon + ' (' + chonHang + ').'); return true; }
      log('Bấm Khu ' + chon + ' không vào được (đầy) — câu ở khu hiện tại.');
      return false;
    }
    // Đi tới bến Dược Cốc (đã ở trong map): bấm đất với Auto BẬT, fallback
    // joystick. Trả true khi đứng đúng bến.
    async function diToiBenDc(dich) {
      var n = nav();
      // Đảm bảo Auto BẬT để tự vệ trên đường (joystick thì ngược lại — chỉ
      // dùng joystick khi bấm đất thất bại, lúc đó Auto TẮT tạm).
      try { if (n && typeof n.datAuto === 'function' && !n.autoDangBat()) n.datAuto(true); } catch (e) { /* bỏ qua */ }
      var ok = await bamDatDiToi(dich.x, dich.y, 60000);
      if (!ok && n && typeof n.diToi === 'function') {
        log('Bấm đất tới bến không được — dùng joystick (Auto TẮT tạm, có canh Giáp).');
        try { ok = await n.diToi(dich.x, dich.y, 60); } catch (e) { ok = false; }
      }
      if (!ok) return false;
      var cur = docViTriHienTai();
      return !!(cur && cur.x === dich.x && cur.y === dich.y);
    }
    // Kiểm tra TỰ ĐI Dược Cốc (gọi từ tick, tối đa 2 lần/giây). Trả true =
    // đã ở bến, sẵn sàng câu; false = đang đi / không đi được.
    function kiemTraDiHoDc() {
      if (!on || !tuDi) return true;
      if (movePhase === 'moving') return false;
      var now = Date.now();
      if (now - lastMoveCheckAt < 500) return sanSangCau;
      lastMoveCheckAt = now;
      if (moveFails >= MAX_MOVE_FAILS) return false;
      var n = nav(); // v3.4: NAV tích hợp sẵn, luôn có diToiMap/diToi.
      var curMap = docMapHienTai();
      if (curMap !== 'duoc_vien') {
        var duong = null;
        try { duong = (typeof n.duongDi === 'function') ? n.duongDi(curMap, 'duoc_vien') : null; } catch (e) { duong = null; }
        if (duong === null) {
          if (now - lastNoRouteLogAt > 60000) {
            lastNoRouteLogAt = now;
            var ld = null;
            try { ld = (typeof n.lyDoKhongDuong === 'function') ? n.lyDoKhongDuong(curMap, 'duoc_vien') : null; } catch (e) { ld = null; }
            log('Không có đường bộ tới Thảo Dược Cốc từ map hiện tại' + (ld ? ' — ' + ld.tieuDe + '. ' + ld.huongDan : '.'));
          }
          sanSangCau = false;
          return false;
        }
        movePhase = 'moving';
        setMoveStatus('Đang tự đi tới Thảo Dược Cốc, bến ' + SPOTS_DC[spotDcIdx].ten + '…');
        diToiBenDcAsync();
        sanSangCau = false;
        return false;
      }
      // Đã ở Thảo Dược Cốc: chuyển khu đông người trước (1 lần/phiên), rồi ra bến.
      if (!daDoiKhuDong) {
        movePhase = 'moving';
        setMoveStatus('Đang chuyển khu đông người nhất để câu…');
        chonKhuDongNhat().then(function () {
          daDoiKhuDong = true;
          movePhase = 'idle';
          lastMoveCheckAt = 0;
        });
        sanSangCau = false;
        return false;
      }
      var cur = docViTriHienTai();
      var dich = SPOTS_DC[spotDcIdx];
      if (cur && cur.x === dich.x && cur.y === dich.y) {
        // ĐÃ ĐỨNG VỮNG ở bến: kiểm tra Giáp đầy rồi mới TẮT Auto.
        var gp = docGiapPct();
        if (gp !== null && gp < 95) {
          if (!dcDangThien) {
            dcDangThien = true;
            log('Đứng vững ở bến nhưng Giáp chỉ ' + Math.round(gp) + '% — thiền hồi đầy rồi mới câu.');
            tapHud('#btn-meditate-touch');
            setTimeout(function () { dcDangThien = false; }, 30000);
          }
          setMoveStatus('Đang thiền hồi Giáp ở bến (' + Math.round(gp) + '%)…');
          sanSangCau = false;
          return false;
        }
        // Giáp đầy (hoặc không đọc được): TẮT Auto rồi câu.
        try { if (n.autoDangBat()) n.datAuto(false); } catch (e) { /* bỏ qua */ }
        if (movePhase !== 'idle') movePhase = 'idle';
        sanSangCau = true;
        return true;
      }
      // Chưa ở bến: đi tới bến bằng bấm đất (Auto BẬT tự vệ).
      movePhase = 'moving';
      setMoveStatus('Đang đi tới bến ' + dich.ten + ' (Auto BẬT tự vệ)…');
      diToiBenDcAsync();
      sanSangCau = false;
      return false;
    }
    // Async đi tới bến (từ map bất kỳ): diToiMap tới Dược Cốc rồi ra bến.
    async function diToiBenDcAsync() {
      var n = nav();
      var dich = SPOTS_DC[spotDcIdx];
      try {
        log('TỰ ĐI: đang đi tới bến Dược Cốc ' + dich.ten + '…');
        var curMap = docMapHienTai();
        if (curMap !== 'duoc_vien') {
          var okMap = await n.diToiMap('duoc_vien');
          if (!okMap) throw new Error('diToiMap false');
        }
        if (!daDoiKhuDong) {
          await chonKhuDongNhat();
          daDoiKhuDong = true;
        }
        var ok = await diToiBenDc(dich);
        if (!ok) throw new Error('không tới được bến');
        movePhase = 'arrived';
        moveFails = 0;
        log('Đã tới bến ' + dich.ten + ' — kiểm tra Giáp rồi câu.');
        setMoveStatus('Đã tới bến ' + dich.ten + '.');
      } catch (e) {
        moveFails++;
        movePhase = 'idle';
        log('TỰ ĐI tới bến Dược Cốc thất bại lần ' + moveFails + '/' + MAX_MOVE_FAILS + ' (' + (e && e.message ? e.message : e) + ').');
        setMoveStatus('Tự đi tới bến thất bại lần ' + moveFails + '/' + MAX_MOVE_FAILS + '.');
        if (moveFails >= MAX_MOVE_FAILS) {
          tuDi = false;
          capNhatNutTuDi();
          setMoveStatus('Tự đi tới bến thất bại 3 lần — đã TẮT tự đi.');
          log('Đã TẮT tự di chuyển sau 3 lần thất bại — tự đi tới bến rồi bật lại.');
        }
      } finally {
        lastMoveCheckAt = 0; // kiểm tra lại ngay nhịp sau
      }
    }
    // Theo dõi đếm ngược caption "Tự động câu... còn Xs" (#ritual-caption):
    // mỗi lần đếm ngược NHẢY LÊN (~6s) = 1 lượt câu vừa hoàn thành. Dùng để
    // phát hiện kẹt ngầm khi túi đóng (không đọc được số cá). Gọi mỗi tick
    // ở tickDuocCoc, tự throttle 500ms (đếm ngược mỗi lượt ~6s nên 500ms
    // vẫn bắt được cú nhảy lên).
    function theoDoiCaptionCau(now) {
      if (now - lastCaptionCheckAt < 500) return;
      lastCaptionCheckAt = now;
      if (!dangTuDongCau()) { capGiayTruoc = null; return; }
      var cap = document.querySelector('#ritual-caption');
      if (!cap) return;
      var m = (cap.textContent || '').match(/còn\s*(\d+)\s*s/i);
      if (!m) return;
      var giay = parseInt(m[1], 10);
      if (capGiayTruoc !== null && giay > capGiayTruoc) capLanCuoiHoanThanh = now;
      capGiayTruoc = giay;
    }
    // Giám sát Giáp trong lúc câu DC (mỗi 60s): Auto KHÔNG tự vệ khi đang
    // câu — Độc Đằng có thể giết trong ~2 phút. Giáp <50% (hoặc HP <50%)
    // thì dừng câu + bật Auto đánh trả / thiền hồi.
    function kiemTraGiapKhiCau(now) {
      if (now - lastGiapCheckAt < 60000) return;
      lastGiapCheckAt = now;
      var gp = docGiapPct();
      var hp = docHpPct();
      if ((gp !== null && gp < 50) || (hp !== null && hp < 50)) {
        log('Giáp ' + (gp === null ? '?' : Math.round(gp) + '%') + ' / HP ' + (hp === null ? '?' : hp + '%') + ' khi đang câu — dừng câu, bật Auto đánh trả.');
        dungCauDc();
        var n = nav();
        try { if (n && typeof n.datAuto === 'function') n.datAuto(true); } catch (e) { /* bỏ qua */ }
        // Thiền hồi Giáp ở bến (Auto BẬT tự vệ trong lúc chờ thiền xong thì
        // thiền xong mới tắt Auto câu tiếp — thiền tự tắt Auto khi ngồi).
        tapHud('#btn-meditate-touch');
        lastTuDongCauCheckAt = now; // khỏi bật lại câu ngay khi đang thiền
      }
    }
    // Kẹt ngầm DC: CHỈ coi là kẹt khi CÁ SÔNG cũng đứng yên qua 2 lần kiểm
    // tra (mỗi 60s). Linh Ngư đứng yên một mình là do hiếm (5%), không
    // phải kẹt. Kẹt thì dừng câu rồi bật lại "Tự động câu".
    function kiemTraKetCa(now) {
      if (now - lastCaCheckAt < 60000) return false;
      lastCaCheckAt = now;
      var ca = docCa();
      if (!ca || typeof ca.caSong !== 'number') {
        // Túi đóng (không đọc được số cá): đếm lượt câu hoàn thành qua đếm
        // ngược caption #ritual-caption (theoDoiCaptionCau cập nhật mỗi
        // 500ms ở tickDuocCoc). >ketCaptionMs không xong lượt nào = kẹt.
        if (capLanCuoiHoanThanh && now - capLanCuoiHoanThanh > CFG.ketCaptionMs) {
          if (now - lastKetLogAt > 300000) {
            lastKetLogAt = now;
            log('Kẹt ngầm? Không xong lượt câu nào qua caption ' + Math.round(CFG.ketCaptionMs / 1000) + 's — dừng câu rồi bật lại "Tự động câu".');
          }
          dungCauDc();
          capLanCuoiHoanThanh = now; // khỏi báo lại ngay sau khi bật lại
          return true;
        }
        return false;
      }
      var ket = (caSongTruoc !== null && caSongTruoc2 !== null &&
        ca.caSong === caSongTruoc && ca.caSong === caSongTruoc2);
      caSongTruoc2 = caSongTruoc;
      caSongTruoc = ca.caSong;
      if (ket) {
        if (now - lastKetLogAt > 300000) {
          lastKetLogAt = now;
          log('Kẹt ngầm? Cá Sông đứng yên ' + ca.caSong + ' qua 2 lần kiểm tra — dừng câu rồi bật lại "Tự động câu".');
        }
        dungCauDc();
        return true;
      }
      return false;
    }
    // Đổi địa điểm câu: ho_tay | duoc_coc (lưu localStorage; đổi điểm câu
    // trong bảng theo địa điểm).
    function datDiaDiem(dd) {
      if (dd !== 'ho_tay' && dd !== 'duoc_coc') return;
      diaDiem = dd;
      try { localStorage.setItem('tt2d_fish_diadiem', dd); } catch (e) { /* bỏ qua */ }
      daDoiKhuDong = false; // đổi địa điểm thì chuyển khu lại từ đầu
      movePhase = 'idle';
      sanSangCau = false;
      lastMoveCheckAt = 0;
      caSongTruoc = null; caSongTruoc2 = null;
      if (diaDiemSel) diaDiemSel.value = dd;
      capNhatOChonDiem();
      log('Địa điểm câu: ' + (dd === 'duoc_coc' ? 'Dược Cốc — Hồ Bích Thủy (Đài câu cá (18,15)/(18,16))' : 'Hồ Tây (cầu câu)') + '.');
    }
    // Đồng bộ ô chọn điểm câu theo địa điểm (Hồ Tây: 14 điểm cầu; Dược Cốc:
    // 2 điểm bến). Ẩn hàng "Vùng quăng" khi câu Dược Cốc (game tự câu).
    function capNhatOChonDiem() {
      if (!spotSel) return;
      var opts = diaDiem === 'duoc_coc' ? SPOTS_DC : SPOTS;
      spotSel.innerHTML = '';
      opts.forEach(function (sp, i) {
        var o = document.createElement('option');
        o.value = String(i);
        o.textContent = sp.ten;
        spotSel.appendChild(o);
      });
      spotSel.value = String(diaDiem === 'duoc_coc' ? spotDcIdx : spotIdx);
      if (vungRowEl) vungRowEl.style.display = diaDiem === 'duoc_coc' ? 'none' : '';
      if (diaDiemSel) diaDiemSel.value = diaDiem;
    }

    // ---------------- Bảng điều khiển ----------------
    var panel, panelHead, panelBody, miniBar, miniStatusEl, statusEl, statsEl, logEl, toggleBtn, targetLineEl, luongEl, ratesEl, conEl, ttEl, zoneBtns = {}, targetBtns = {};
    var tudiBtn, spotSel, moveEl; // v3.2: nút TỰ ĐI + ô chọn điểm câu + dòng trạng thái tự đi
    var diaDiemSel, vungRowEl; // v3.3: ô chọn địa điểm + hàng vùng quăng (ẩn khi câu Dược Cốc)
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
          '<b>🎣 Tool câu cá v3.4.0</b>' +
          '<span>' +
            '<button id="tt2d-fish-min" title="Thu nhỏ bảng" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
            '<button id="tt2d-fish-hide" title="Ẩn bảng (tool vẫn chạy nếu đang BẬT)" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 2px">×</button>' +
          '</span>' +
        '</div>' +
        '<div id="tt2d-fish-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
          '<b>🎣 Câu cá v3.4.0</b>' +
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
          '<button id="tt2d-fish-tudi" title="Tự di chuyển tới điểm câu đã chọn (nav tích hợp sẵn)" style="flex:1;padding:6px;border-radius:6px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">TỰ ĐI: TẮT</button>' +
        '</div>' +
        '<div style="margin:4px 0">Địa điểm: ' +
          '<select id="tt2d-fish-diadiem" title="Hồ Tây: câu cầu (quăng/giật/kéo). Dược Cốc: tự tới Đài câu cá Hồ Bích Thủy, chuyển khu đông người, bật Tự động câu của game" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:5px;padding:3px">' +
          '<option value="ho_tay">Hồ Tây (cầu câu)</option>' +
          '<option value="duoc_coc">Dược Cốc — Hồ Bích Thủy</option>' +
          '</select>' +
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
        '<div id="tt2d-fish-vung-row" style="margin:4px 0">Vùng quăng: ' +
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
        '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">Chỉ bấm nút của game. Dừng khi rời hồ. TỰ ĐI: tự tới điểm câu đã chọn (nav tích hợp sẵn, v3.4); tool KHÔNG thấy được người khác ở điểm câu — thấy đông thì tự chọn điểm khác trong ô chọn. Dược Cốc: tự tới Đài câu cá, chuyển khu đông người trước khi câu, bật "Tự động câu" của game; canh Giáp mỗi 60s, kẹt chỉ tính khi Cá Sông đứng yên 2 lần kiểm tra. Tool không thấy được luồng cá thật và không đổi được tỷ lệ cắn của server — chỉ chọn vùng/mồi theo tỷ lệ đã quan sát.</div>' +
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
      diaDiemSel = panel.querySelector('#tt2d-fish-diadiem');
      vungRowEl = panel.querySelector('#tt2d-fish-vung-row');
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
      if (diaDiemSel) diaDiemSel.addEventListener('change', function () { datDiaDiem(diaDiemSel.value); });
      capNhatOChonDiem();
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
    // Nhịp chính khi câu ở Dược Cốc: TỰ ĐI tới bến -> canh Giáp -> giữ
    // "Tự động câu" bật -> phát hiện kẹt ngầm. Không dùng logic quăng/
    // giật/kéo của Hồ Tây.
    function tickDuocCoc() {
      var now = Date.now();
      if (tuDi) {
        var sanSang = kiemTraDiHoDc();
        if (movePhase === 'moving') {
          setStatus(lastMoveStatus || 'Đang tự đi tới bến Dược Cốc…');
          return;
        }
        if (!sanSang) {
          setStatus(lastMoveStatus || 'Chưa ở bến — TỰ ĐI chưa đi được (xem nhật ký).');
          return;
        }
      } else {
        // Không bật TỰ ĐI: chỉ câu khi ĐÃ đứng ở bến; chưa ở bến thì báo.
        var cur0 = docViTriHienTai();
        var dich0 = SPOTS_DC[spotDcIdx];
        if (!cur0 || cur0.x !== dich0.x || cur0.y !== dich0.y) {
          setStatus('Chưa ở bến ' + dich0.ten + ' — bật TỰ ĐI để tự tới bến, hoặc đi tay tới bến rồi bật lại.');
          return;
        }
      }
      // Đang ở bến: canh Giáp (60s) rồi giữ "Tự động câu" bật (5s).
      theoDoiCaptionCau(now); // theo dõi đếm ngược caption (phát hiện kẹt khi túi đóng)
      kiemTraGiapKhiCau(now);
      if (kiemTraKetCa(now)) {
        setStatus('Kẹt ngầm? Cá Sông đứng yên — đã dừng câu, đang bật lại "Tự động câu"…');
        batTuDongCau();
        return;
      }
      if (now - lastTuDongCauCheckAt >= 5000) {
        lastTuDongCauCheckAt = now;
        if (!dangTuDongCau()) {
          setStatus('Chưa thấy "Tự động câu" — đang bật lại ở Hồ Bích Thủy…');
          batTuDongCau();
          return;
        }
      }
      var ca = docCa();
      var gp = docGiapPct();
      setStatus('Đang câu tự động ở Hồ Bích Thủy ' + SPOTS_DC[spotDcIdx].ten +
        (ca ? ' · Cá Sông ' + ca.caSong + ' · Linh Ngư ' + ca.linhNgu : '') +
        (gp !== null ? ' · Giáp ' + Math.round(gp) + '%' : ''));
    }
    function tick() {
      if (!on) return;
      // --- v3.3: Câu Dược Cốc — Hồ Bích Thủy (luồng riêng, không dùng
      // giao diện quăng/giật/kéo của Hồ Tây) ---
      if (diaDiem === 'duoc_coc') {
        tickDuocCoc();
        return;
      }
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
    log('Tool đã nạp (v3.4.0 — bản riêng, nav tích hợp). Mặc định TẮT.');
    // Điều khiển từ Console khi cần debug: __TT2D_FISH__.start() / .stop() /
    // .setTarget('linh'|'yeu'|'giao'|'tudo'|'auto') / .status() /
    // .setTuDi(true|false) / .setSpot(0..13) / .spot() / .spots() /
    // .setDiaDiem('ho_tay'|'duoc_coc') / .diaDiem() / .spotsDc()
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
        var caDc = docCa();
        return {
          on: on, state: state, holding: holding, target: target, vung: vungHien,
          choTimDuoc: choTimDuoc, moi: moiDangDung, stats: stats,
          tuDi: tuDi, spot: { idx: spotIdx, x: SPOTS[spotIdx].x, y: SPOTS[spotIdx].y, ten: SPOTS[spotIdx].ten },
          movePhase: movePhase, moveFails: moveFails, moveStatus: lastMoveStatus,
          diaDiem: diaDiem,
          dc: {
            spot: { idx: spotDcIdx, x: SPOTS_DC[spotDcIdx].x, y: SPOTS_DC[spotDcIdx].y, ten: SPOTS_DC[spotDcIdx].ten },
            daDoiKhuDong: daDoiKhuDong, dangTuDongCau: dangTuDongCau(),
            giapPct: docGiapPct(), caSong: caDc ? caDc.caSong : null, linhNgu: caDc ? caDc.linhNgu : null,
          },
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
      setDiaDiem: function (dd) { datDiaDiem(dd); },
      diaDiem: function () { return diaDiem; },
      spotsDc: function () { return SPOTS_DC.map(function (s) { return { x: s.x, y: s.y, ten: s.ten }; }); },
      moveStatus: function () { return { movePhase: movePhase, moveFails: moveFails, lastMoveStatus: lastMoveStatus }; },
      nav: function () { return NAV.status(); },
      _nav: NAV,
      _tick: tick,
      _cfg: CFG,
      _debug: {
        kiemTraDiHo: kiemTraDiHo, chonDiemTrong: chonDiemTrong,
        diemBiChiem: diemBiChiem, quetNguoiDung: quetNguoiDung,
        dangCau: dangCau, giaoDienCauMo: giaoDienCauMo,
        kiemTraDiHoDc: kiemTraDiHoDc, chonKhuDongNhat: chonKhuDongNhat,
        bamDatDiToi: bamDatDiToi, batTuDongCau: batTuDongCau,
        dangTuDongCau: dangTuDongCau, dungCauDc: dungCauDc,
        docGiapPct: docGiapPct, docCa: docCa, docKhuHien: docKhuHien,
        docViTriHienTai: docViTriHienTai, docMapHienTai: docMapHienTai,
        theoDoiCaptionCau: theoDoiCaptionCau,
        kiemTraGiapKhiCau: kiemTraGiapKhiCau, kiemTraKetCa: kiemTraKetCa,
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


  // ================= MODULE: duoc (Dược v1.1.2: Trúc Cơ "Tự Đi", Luyện Khí nhận việc tay theo DC; tự hủy việc dở đã nhận trước khi bật tool; bấm nút game bằng tap() (pointerdown+pointerup+click) + tắt Auto trước khi lái joystick.) =================

  (function () {


  if (window.__TT2D_DUOC__) return; // chống nạp trùng 2 bảng

  // ---------------- Vá setPointerCapture (CHẠY ĐẦU TIÊN) ----------------
  // Game gọi a.setPointerCapture(pointerId) KHÔNG try/catch trong handler
  // joystick + nút dpad. PointerEvent giả (pointerId tự đặt) làm Chrome throw
  // NotFoundError -> handler dừng giữa chừng, không bao giờ kéo/nhấn được.
  // Vá: giữ nguyên hàm gốc, bọc try/catch nuốt lỗi (hành vi thật không đổi).
  var joyPatchApplied = false;
  function patchPointerCapture() {
    try {
      var proto = Element.prototype;
      if (proto.setPointerCapture && proto.setPointerCapture.__TT2D_DUOC_PATCHED__) { joyPatchApplied = true; return true; }
      var origCap = proto.setPointerCapture;
      var origRel = proto.releasePointerCapture;
      if (typeof origCap === 'function') {
        proto.setPointerCapture = function (pid) {
          try { return origCap.call(this, pid); } catch (e) { return; }
        };
        proto.setPointerCapture.__TT2D_DUOC_PATCHED__ = true;
      }
      if (typeof origRel === 'function') {
        proto.releasePointerCapture = function (pid) {
          try { return origRel.call(this, pid); } catch (e) { return; }
        };
        proto.releasePointerCapture.__TT2D_DUOC_PATCHED__ = true;
      }
      joyPatchApplied = true;
      return true;
    } catch (e) { return false; }
  }
  patchPointerCapture();

  // ---------------- Cấu hình ----------------
  var CFG = {
    tile: 32,               // CONFIG.TILE
    pollMs: 250,            // kiểm tra trạng thái mỗi 250ms
    taskTimeoutMs: 10 * 60 * 1000, // việc quá 10 phút chưa xong → huỷ, đổi việc
    maxKetLienTiep: 2,      // kẹt 2 lần liên tiếp → DỪNG tool
    maxTuDiKhoiDongLai: 3,  // "Tự Đi" dừng giữa chừng thì bật lại tối đa 3 lần
    tuDiTimeoutMs: 40 * 60 * 1000, // chờ bộ máy "Tự Đi" làm hết lượt (tối đa 40 phút)
    joyHoldMs: 350,         // giữ joystick mỗi nhịp (chỉ dùng cho nudge cổng)
    joyLongMs: 900,         // nhịp dài khi kẹt (chỉ dùng cho nudge cổng)
    joyWaitMs: 250,         // nghỉ giữa các nhịp
    portalHoldMs: 700,      // giữ joystick để bước qua cổng (nudge)
    portalTries: 6,         // số nhịp giữ tối đa để qua cổng (dự phòng)
    ganDaiPhu: 6,           // trong 6 ô quanh Đại Phu thì tính là "gần"
    hpTuVe: 0.80,           // LK: HP dưới 80% thì bật Auto tự vệ
    hpAnToan: 0.95,         // LK: HP trên 95% thì tắt Auto tự vệ
    hpNguyHiem: 0.35,       // HP dưới 35% thì chờ hồi, không bật lại "Tự Đi"
    hpNhanViec: 0.50,       // HP dưới 50% thì KHÔNG nhận việc mới (code gửi)
    choDoiMs: 3000,         // chờ hộp thoại mở sau khi bấm tương tác
    nghiGiuaBuocMs: 600,    // nghỉ giữa các lần bấm nút
    // --- Lái đa cách (v1.2.0, lấy từ Đi Farm v1.2.0) ---
    tickMs: 250,            // nhịp kiểm tra vòng lái
    joyMoveMs: 100,         // nhịp gửi pointermove khi đang kéo joystick
    stuckMs: 6000,          // game St = 6s không đổi ô -> kẹt
    detourMs: 2500,         // lái vuông góc mỗi lần đi vòng (2-3s)
    detourMinMs: 3000,      // đợt đi vòng tối thiểu cho phím/dpad/chạm
    repathMax: 4,           // kẹt quá 4 lần đi vòng -> dừng
    legTimeoutMs: 180000,   // tối đa 180s cho 1 chặng đi
    portalWaitMs: 8000,     // game Ft = 8s chờ đổi map ở cổng
    nudgeWaitMs: 3000,      // chờ đổi map sau mỗi lần đẩy cổng bằng joystick
    fightWaitMs: 5000,      // bật Auto đánh trả tối đa 5s khi nghi quái chặn
    joyMag: 0.75,           // độ kéo joystick (0..1) khi lái
    joyPointerId: 987654321, // pointerId giả DUY NHẤT cho cả chuỗi down/move/up
    detectMs: 1200,         // mỗi cách lái dò giữ hướng 1,2s
    dpadAltMs: 400,         // luân phiên 2 trục dpad mỗi 400ms khi không có nút chéo
    flySpeedMin: 5,         // ô/s — bay+chạy dưới ngưỡng này là chưa ăn (xem ghi chú v1.2.1 ở khối đo tốc độ)
    flyWindowMs: 2000,     // cửa sổ TÍCH LŨY đo tốc độ bay (ms giữ phím cộng dồn qua nhiều đợt cùng hướng, chỉ đo khi Chạy đang BẬT)
    pxPerTile: 32,          // px/ô cho chạm neo camera (mặc định = CONFIG.TILE)
    tapStableMs: 800,       // đứng yên bao lâu thì coi là ổn định (chờ sau chạm)
    choTuongTacMs: 150000,  // chờ nhãn "Tương Tác" sau khi bấm bước nhiệm vụ
    khongTienDoMs: 45000,   // tiến độ không đổi 45s ở bước tương tác -> kẹt
    afterActionMs: 800,     // nghỉ sau mỗi lần bấm nút hộp thoại
    tapWaitMs: 2500,        // chờ thoại mở sau mỗi vòng chạm NPC
    npcWaitMs: 30000,       // chờ mở thoại Đại Phu tối đa 30s
    quietMs: 5000,          // chặt không tăng tiến độ 5s -> quét nhặt cành rơi
    hpHoiXong: 0.60,        // hồi tới 60% thì nhận việc lại
    choHoiMs: 300000,       // chờ hồi máu tối đa 5 phút
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
  // Đại Phu: ô NPC (14,8) theo MapData game.js; ô đứng (14,9) — xem header.
  var DAI_PHU = { map: 'duoc_vien', x: 14, y: 8 };
  var DAI_PHU_DUNG = { x: 14, y: 9 };
  var MAP_TEN = { duoc_vien: 'Thảo Dược Cốc', thanh_truc_lam: 'Rừng Trúc', tan_vien: 'Chân Núi Tản Viên', van_can: 'Hồ Tây', vuon_ca_nhan: 'Vườn Cá Nhân' };
  // ---------------- Đồ thị cổng (trích từ MapData client 24/11 — như Đi Farm v1.2.0) ----------------
  // Mỗi cổng: {tx, ty, to} (+ byHand:true nếu cần bấm Tương tác để vào).
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
      { tx: 18, ty: 22, to: 'tan_vien' },
    ],
    long_uyen: [
      { tx: 0, ty: 14, to: 'thanh_truc_lam' }, { tx: 0, ty: 15, to: 'thanh_truc_lam' },
      { tx: 22, ty: 4, to: 'hang_dong_co', byHand: true },
    ],
    hang_dong_co: [
      { tx: 14, ty: 19, to: 'long_uyen' }, { tx: 15, ty: 19, to: 'long_uyen' },
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
  // w/h map (ô) theo MapData client 24/11 + điểm an toàn (= spawn).
  var MAPS = {
    phong_dia:      { ten: 'Phong Địa',            safe: [37, 14], w: 40, h: 30 },
    duoc_vien:      { ten: 'Thảo Dược Cốc',        safe: [12, 2],  w: 40, h: 30 },
    dong_mach_ngam: { ten: 'Miếu Ông Trường Con',  safe: [15, 22], w: 36, h: 24 },
    hang_dong_co:   { ten: 'Hang Động',            safe: [14, 16], w: 30, h: 20 },
    bai_da_hang_gio:{ ten: 'Bãi Đá',               safe: [3, 28],  w: 40, h: 30 },
    mo_linh_thach:  { ten: 'Mỏ Linh Thạch',        safe: [3, 27],  w: 40, h: 30 },
    thach_phong_thung_lung: { ten: 'Thung Lũng (Thạch Phong)', safe: [3, 27], w: 40, h: 30 },
    mieu_hoang:     { ten: 'Miếu Hoang',           safe: [18, 6],  w: 20, h: 14 },
    tan_vien:       { ten: 'Chân Núi Tản Viên',    safe: [8, 26],  w: 40, h: 30 },
    thanh_truc_lam: { ten: 'Rừng Trúc',            safe: [7, 2],   w: 40, h: 30 },
    van_can:        { ten: 'Hồ Tây',               safe: [33, 31], w: 56, h: 36 },
    long_uyen:      { ten: 'Long Uyên Cốc',        safe: [2, 14],  w: 40, h: 30 },
    vuon_ca_nhan:   { ten: 'Vườn Cá Nhân',         safe: [8, 10],  w: 18, h: 13 },
  };
  function tenMap(id) { return (MAPS[id] && MAPS[id].ten) || MAP_TEN[id] || id || '?'; }
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
    [/Vườn Cá/, 'vuon_ca_nhan'],
  ];
  // Map không có đường bộ đi ra (phó bản / sự kiện) — báo rõ thay vì đi lạc.
  var KHONG_DUONG = { tam_lo: 1, dai_hoi_cho: 1, dai_hoi_dau: 1, chien_bang_dai: 1, dai_hoi_doi: 1, san_dau_vip: 1, chien_truong: 1, huyet_xich: 1, yen_lang: 1, lam_lang: 1 };

  // ---------------- Trạng thái ----------------
  var on = false;
  var phase = 'idle'; // idle | di_dai_phu | cho_dai_phu | mo_menu | tu_di | nhan_viec | xac_nhan | di_lam | lam_viec | ve_nop | nop | cho_hoi | kiem_tra_xong | ket_thuc
  var realm = null;   // 'truc_co' | 'luyen_khi' (nhận biết từ menu Đại Phu)
  var viecHienTai = null; // id việc đang làm (LK) hoặc việc bộ máy đang làm (TC, đọc từ tracker)
  var luotDaLam = 0;      // số lượt đã nộp xong (đếm theo lần nộp tool thấy)
  var luotConLai = {};    // id việc -> số lượt còn lại hôm nay (đọc từ bảng game)
  var dcHienTai = null;   // điểm Dược Công hiện tại (đọc từ hộp thoại)
  var dcLucBatDau = null;
  var dcLocalLucBatDau = null; // DC đọc từ localStorage lúc BẬT (đối chiếu)
  var taskBatDauAt = 0;   // thời điểm bắt đầu việc hiện tại
  var demKet = 0;         // số lần kẹt liên tiếp
  var demTuDiLai = 0;     // số lần bật lại "Tự Đi"
  var daNhanViec = false; // phiên này tool đã nhận được ít nhất 1 việc (để phân biệt việc dở có sẵn với việc của tool)
  var viecNhanTay = false; // đang tiếp tục việc NHẬN BẰNG TAY (không phải việc tool tự nhận): kẹt đường thì DỪNG báo rõ, KHÔNG tự huỷ
  var tuVeDangBat = false;// LK: Auto tự vệ đang bật?
  var logLines = [];
  var G = { dc: null }; // DC hiển thị trên panel (đọc từ localStorage khi nộp xong)
  var collapsed = false;  // bảng đang thu nhỏ?
  // --- Lái đa cách (v1.2.0) ---
  var steerMethod = null; // 'keys'|'joystick'|'dpad'|'tap' — dò 1 lần mỗi phiên chạy
  var flyingBelief = false; // tin là đang bay (class #btn-fly đã biết sai live — kiểm chứng bằng tốc độ)
  var flySpeedChecked = false, flyRetryDone = false, flySpeedMeasured = null, flySpeedFirst = null;
  var flyMeas = null; // cửa sổ tích lũy đo tốc độ bay: {x, y, ms, sx, sy} — vị trí đầu cửa sổ, tổng ms giữ phím, dấu hướng
  var camAnchor = null; // {x,y} ô tại tâm canvas (chạm neo camera)
  var heldKeys = {}; // code -> true (phím tool đang giữ)
  var dpadHeld = null; // nút dpad đang giữ
  var guardMap = null; // map lúc bắt đầu đợt lái — đổi map giữa đợt thì dừng đợt ngay
  var legDeadline = 0; // hạn giờ chặng đi hiện tại (ms epoch) — đợt lái cũng phải tôn trọng
  var steerToken = 0;  // tăng mỗi lần DỪNG — đợt lái đang chạy thấy token đổi thì nhả đầu vào và dừng

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    var line = hh + ':' + mm + ':' + ss + ' — ' + msg;
    logLines.push(line);
    if (logLines.length > 40) logLines.shift();
    renderLog();
  }
  // Vẽ logLines vào ô log của panel (gọi từ log()).
  function renderLog() {
    var el = document.getElementById('tt2d-duoc-log');
    if (!el) return;
    el.innerHTML = logLines.map(function (l) {
      var div = document.createElement('div');
      div.textContent = l;
      return div.outerHTML;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function dirName(dx, dy) {
    var ns = dy > 0 ? 'nam' : dy < 0 ? 'bắc' : '';
    var ew = dx > 0 ? 'đông' : dx < 0 ? 'tây' : '';
    return (ns && ew) ? ns + '-' + ew : (ns || ew || 'đứng yên');
  }
  function fmtSec(ms) { return (ms / 1000).toFixed(1).replace('.', ',') + 's'; }

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
  // Hộp thoại đang mở có phải MENU chính của Đại Phu không — phân biệt với
  // danh sách việc / hộp xác nhận / Quầy Đổi Hạt (cùng tiêu đề "Đại Phu"
  // nhưng không có các lựa chọn của menu). moHopThoaiDaiPhu chỉ tin thoại
  // là menu chính; thoại khác thì đóng rồi mở lại. (Bắt được ở test (c)
  // 26/11: moHopThoaiDaiPhu tin cả thoại câu cá đang mở, nopViec tưởng
  // đã ở menu Đại Phu nên không bao giờ đi về nộp.)
  function laMenuDaiPhu(dlg) {
    if (!dlg) return false;
    if (!/Đại Phu|Dược Công/.test((dlg.title || '') + ' ' + (dlg.text || ''))) return false;
    if (timLuaChon(dlg, /Nhận Việc Dược Công|Tự Đi Làm Việc Dược Công|Huỷ Nhiệm Vụ|Hủy Nhiệm Vụ|Mở Quầy Đổi Hạt/)) return true;
    if (dlg.action && /Giao Ba Cá|Giao Nguyên Liệu/.test(dlg.action.label)) return true;
    return false;
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
  // Điểm Dược Công từ localStorage (CONFIG.PROGRESS_KEY "pntt_progress_v1",
  // trường duocCong) — dùng để đối chiếu sau mỗi lần nộp.
  function docDCLocal() {
    try {
      var raw = localStorage.getItem('pntt_progress_v1');
      if (!raw) return null;
      var o = JSON.parse(raw);
      return (o && typeof o.duocCong === 'number') ? o.duocCong : null;
    } catch (e) { return null; }
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
  // Vị trí nhân vật (ô) + map id — đọc từ #hud-pos / #hud-map, dự phòng
  // chữ trong trang.
  function docMapId() {
    var hm = $('#hud-map');
    var s = hm ? (hm.innerText || hm.textContent || '').trim() : '';
    for (var i = 0; i < HUD_MAP.length; i++) {
      if (HUD_MAP[i][0].test(s)) return HUD_MAP[i][1];
    }
    var t = document.body ? (document.body.innerText || '') : '';
    if (/Hồ Tây/.test(t)) return 'van_can';
    if (/Thảo Dược Cốc/.test(t)) return 'duoc_vien';
    if (/Rừng Trúc/.test(t)) return 'thanh_truc_lam';
    if (/Chân Núi Tản Viên/.test(t)) return 'tan_vien';
    if (/Vườn Cá Nhân/.test(t)) return 'vuon_ca_nhan';
    return null;
  }
  function docViTri() {
    var hp = $('#hud-pos');
    var t = hp ? (hp.innerText || hp.textContent || '') : '';
    var m = t.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (!m) {
      var bt = document.body ? (document.body.innerText || '') : '';
      m = bt.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    }
    return { x: m ? parseInt(m[1], 10) : null, y: m ? parseInt(m[2], 10) : null, map: docMapId() };
  }
  function docCell() {
    var p = docViTri();
    return (p.x === null) ? null : { x: p.x, y: p.y };
  }
  // HP người chơi — #value-hp ("hp / max") chính, .pl-bar.hp .pl-n rồi
  // #hud-left dự phòng. (#row-hp mà code gửi dùng KHÔNG tồn tại trong game.js.)
  function docHP() {
    var el = $('#value-hp');
    var t = el ? (el.innerText || el.textContent || '').trim() : '';
    var m = t.match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) {
      var el2 = document.querySelector('.pl-bar.hp .pl-n');
      if (el2) m = txt(el2).match(/(\d+)\s*\/\s*(\d+)/);
    }
    if (!m) {
      var el3 = $('#hud-left');
      if (el3) m = (el3.innerText || el3.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
    }
    if (!m) return null;
    var cur = parseInt(m[1], 10), max = parseInt(m[2], 10);
    if (!max) return null;
    return { cur: cur, max: max, tiLe: cur / max };
  }
  // Nhân vật đã gục? Chỉ đọc #downed (badge #downed-badge nằm TRONG #downed
  // nên đọc riêng badge sẽ báo gục nhầm 100% — bài học Đi Farm v1.1.0).
  function docGuc() {
    var d = $('#downed');
    if (!d) return false;
    return d.offsetParent !== null && !d.classList.contains('hidden');
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
  // pressDom = tap (tên dùng trong code gửi).
  function pressDom(el) { return tap(el); }

  // ---------------- Nút Auto / Phi Hành / Chạy ----------------
  function nutAuto() { return $('#btn-auto-touch') || $('#btn-auto'); }
  function autoDangBat() {
    // Game có 2 nút Auto (#btn-auto / #btn-auto-touch) cùng 1 trạng thái —
    // kiểm tra cả hai (như Đi Farm v1.2.0) để không đọc nhầm khi 1 nút
    // chưa kịp cập nhật class.
    var b1 = $('#btn-auto'), b2 = $('#btn-auto-touch');
    return !!((b1 && b1.classList.contains('active')) || (b2 && b2.classList.contains('active')));
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
    bat = !!bat;
    var b = $('#btn-fly');
    if (!b) return false;
    if (flyDangBat() !== bat) tap(b);
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
  // Nhãn nút #btn-attack (.skill-name) — vd "Tương Tác" / "Công Thường".
  function interactLabel() {
    var b = $('#btn-attack');
    if (!b) return '';
    var sn = b.querySelector('.skill-name');
    return ((sn ? sn.textContent : b.textContent) || '').trim();
  }

  // ---------------- Lái nhân vật: joystick thật (PointerEvent) ----------------
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

  // ---------------- Lái đa cách, tự dò (v1.2.0 — lấy từ code gửi + Đi Farm v1.2.0) ----------------
  // Thứ tự dò 1 lần mỗi phiên chạy: phím -> joystick (engine ở trên)
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
        if (runId !== steerToken) { releaseAllKeys(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
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

  // ---------- Joystick theo đợt (bọc engine ở trên) ----------
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
        if (runId !== steerToken) { joyUp(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
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
  // joystick) rồi set trạng thái giữ -> nhờ vá mới lái được bằng
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
        if (runId !== steerToken) { dpadRelease(); return resolve({ reason: 'stopped', pos: p, ms: now - t0 }); }
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
  // trí nhân vật thật. Sau mỗi chạm, neo mới = ô nhân vật (camera game bám
  // theo nhân vật nên sau khi nhân vật dừng, ô tại tâm canvas = ô nhân vật).
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
    ['#tt2d-duoc-panel', '#btn-auto-touch', '#btn-auto', '#btn-attack', '#btn-fly'].forEach(function (sel) {
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
        if (runId !== steerToken) return resolve(null);
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
        if (runId !== steerToken) return { reason: 'stopped', pos: ap, ms: Date.now() - t0 };
      }
      tapCanvas((tx - camAnchor.x) * CFG.pxPerTile, (ty - camAnchor.y) * CFG.pxPerTile);
      var p = await waitStablePos(runId, Math.max(3000, burstTimeoutMs));
      if (guardMap && docMapId() && docMapId() !== guardMap) return { reason: 'mapchanged', pos: p, ms: Date.now() - t0 };
      // Neo mới = ô nhân vật sau đợt chạm (camera bám theo nhân vật).
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
      if (runId !== steerToken) return 'keys';
      if (rk.reason === 'moved') { log('Cách lái: phím'); return 'keys'; }
      log('Phím không làm nhân vật di chuyển — thử joystick');

      // b. Joystick
      log('Dò cách lái: thử joystick…');
      var rj = await holdJoyBurst(runId, dx, dy, movedFrom, CFG.detectMs);
      joyUp(); // nhả hẳn sau đợt dò (holdJoyBurst chỉ kéo về tâm)
      if (runId !== steerToken) return 'keys';
      if (rj.reason === 'moved') { log('Cách lái: joystick'); return 'joystick'; }
      log('Joystick không làm nhân vật di chuyển — thử nút dpad');

      // c. Nút dpad
      var sx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      var sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
      var btns = findDpadBtns(sx, sy);
      if (btns.exact || btns.xOnly || btns.yOnly) {
        log('Dò cách lái: thử nút dpad…');
        var rd = await holdDpadBurst(runId, sx, sy, movedFrom, CFG.detectMs);
        if (runId !== steerToken) return 'keys';
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
    if (h && h.max && h.max > 0 && h.hp / h.max < CFG.hpNguyHiem) {
      return { ok: false, reason: 'hp-thap',
        msg: 'Khí Huyết dưới 35% (' + h.hp + '/' + h.max + ') — đã tự dừng để an toàn.' };
    }
    return { ok: true };
  }

  // ---------------- Lái tới 1 ô bằng cách lái đã dò ----------------
  // Vòng lặp theo đợt (burst), trả {ok:true} khi tới nơi (cách đích <=
  // arrivePx), hoặc {ok:false, reason, msg} với reason: ket|hp-thap|guc|
  // dung|het-gio|doi-map|loi. Kẹt: đợt không di chuyển / không tiến gần đích
  // -> đánh trả (Auto 1 lần) rồi lái vuông góc; quá repathMax lần đi vòng
  // -> dừng. Kiểm chứng Phi Hành bằng TỐC ĐỘ ở đợt lái đầu đủ dài.
  async function steerToCell(tx, ty, opts) {
    opts = opts || {};
    var arrivePx = (typeof opts.arrivePx === 'number') ? opts.arrivePx : CFG.tile;
    var label = opts.label || ('ô (' + tx + ',' + ty + ')');
    var tok = steerToken;
    var mapStart = docMapId();
    var t0 = Date.now();
    legDeadline = t0 + CFG.legTimeoutMs;
    // Dung sai theo ô: cổng (arrivePx 16px) cần đúng ô; bãi (32px) cho phép
    // lệch 1 ô (tương đương dist <= 32px của v1.1.2).
    var tol = (arrivePx >= CFG.tile) ? 1 : 0;
    var cheb = function (p) { return Math.max(Math.abs(tx - p.x), Math.abs(ty - p.y)); };
    var detours = 0, detourSign = 1, fightTried = false, diagOk = true;
    var bestCheb = Infinity, noProgress = 0;
    var burstFrom = null; // vị trí + khoảng cách trước đợt gần nhất (cảnh báo thoái lui)
    guardMap = mapStart;
    flyMeas = null; // cửa sổ đo tốc độ bay mới cho mỗi chặng lái
    try {
      while (true) {
        if (tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
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
          if (tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
          continue;
        }

        var dx = tx - p.x, dy = ty - p.y; // ô; +y là nam (KeyS)
        var startCheb = cheb(p);
        var startPos = { x: p.x, y: p.y };
        var codes = codesFor(dx, dy);
        if (!diagOk && codes.length > 1) codes = [Math.abs(dx) >= Math.abs(dy) ? codes[0] : codes[1]];

        var speed = 3.51; // ô/s khi Chạy BẬT — tốc độ CHẠY thật, dùng làm tốc độ nền để đặt hạn giờ đợt (bay+chạy ~6,66 nhanh hơn nên hạn này luôn đủ rộng; đừng dùng tốc độ bay vì bay lỗi thì nhân vật chỉ chạy 3,51)
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
        if (tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        // Đổi map trong đợt lái (bước lên ô cổng): dừng chặng này ngay.
        var mapAfter = docMapId();
        if (mapAfter && mapStart && mapAfter !== mapStart) {
          return { ok: false, reason: 'doi-map', msg: 'Đã sang map ' + tenMap(mapAfter) + '.' };
        }
        var p2 = res.pos || docCell();
        if (!p2) { await sleep(CFG.tickMs); continue; }

        // Kiểm chứng Phi Hành bằng TỐC ĐỘ — ĐO TÍCH LŨY qua nhiều đợt (v1.2.1):
        // Đo một đợt đơn lẻ KHÔNG đo được live — đợt nào tới đích/biển Khu
        // thì `cheb(p2) <= tol` return trước khối đo; các đợt còn lại thường
        // ngắn hơn cửa đo. Nên cộng dồn qua các đợt cùng hướng cho tới khi
        // đủ 2000ms giữ phím rồi mới phán: quãng đường RÒNG từ đầu cửa sổ
        // tới vị trí hiện tại (chỉ sai số lượng tử hoá ~1,4 ô ở 2 đầu mút,
        // KHÔNG cộng dồn theo số đợt) chia cho tổng ms giữ phím. Reset cửa
        // sổ khi đổi hướng ngược dấu một trục (đi vòng/detour), khi đợt kẹt/
        // không di chuyển, đợt bước 1 ô, khi Chạy TẮT, hoặc sau đợt đánh trả/
        // đi vòng. Chỉ đo khi Chạy đang BẬT (bay không chạy chỉ 3,61–4,23,
        // sát tốc độ đi bộ 3,16, không phân biệt được bằng toạ độ ô).
        // Ngưỡng 5,0 ô/s từ game.js client 24/11 (CONFIG: SPEED 68, RUN 1,65,
        // FLY 1,9, TILE 32; bay+chạy 6,66 — chậm nhất Phi Diệp 1,75: 5,96;
        // chỉ chạy 3,51; đi bộ 3,16): cửa sổ 2000ms thì chạy thường đo tối
        // đa 3,51+1,41/2≈4,2 < 5, bay+chạy chậm nhất đo tối thiểu
        // 5,96−0,71≈5,25 > 5 — tách rõ. Đo bằng EUCLID — CỐ Ý: game chuẩn
        // hoá vector chéo phím (×1/√2) nên tốc độ Euclid KHÔNG đổi theo
        // hướng; Chebyshev đo chéo thấp hơn √2 lần (bay chéo 6,66 → ~4,7 < 5
        // → bấm nhầm KeyF TẮT bay). Chẩn đoán cũ "chéo bộ Euclid ~3,5" là
        // tốc độ CHẠY (3,51), không phải lỗi đo chéo (mock Dược đi chéo +1 ô
        // cả 2 trục, không chuẩn hoá — artifact của mock, xem test k13).
        // Chỉ đo đợt tiến triển (không đo đợt kẹt); bấm lại KeyF tối đa 1 lần.
        if (flyingBelief && !flySpeedChecked) {
          var movedB = (p2.x !== startPos.x || p2.y !== startPos.y);
          var sdx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
          var sdy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
          var flipped = flyMeas && ((sdx !== 0 && flyMeas.sx !== 0 && sdx !== flyMeas.sx) ||
            (sdy !== 0 && flyMeas.sy !== 0 && sdy !== flyMeas.sy));
          if (!runDangBat() || flipped || res.reason === 'stuck' || !movedB || res.reason === 'step') {
            flyMeas = null; // đợt này không tính vào cửa sổ; đợt sau mở cửa sổ mới
          } else {
            if (!flyMeas) flyMeas = { x: startPos.x, y: startPos.y, ms: 0, sx: sdx, sy: sdy };
            flyMeas.ms += res.ms;
            if (flyMeas.ms >= CFG.flyWindowMs) {
              var distW = Math.hypot(p2.x - flyMeas.x, p2.y - flyMeas.y);
              if (distW >= 2) {
                var spdW = distW / (flyMeas.ms / 1000);
                flySpeedMeasured = spdW;
                if (flySpeedFirst === null) flySpeedFirst = spdW;
                if (spdW < CFG.flySpeedMin && !flyRetryDone) {
                  flyRetryDone = true;
                  log('Phi Hành: tốc độ chỉ ~' + spdW.toFixed(1) + ' ô/s (<' + CFG.flySpeedMin + ') — bay chưa ăn, bấm lại 1 lần (KeyF).');
                  pressFlyKey();
                  await sleep(1200);
                  if (tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
                } else {
                  flySpeedChecked = true;
                  log('Phi Hành: BẬT (tốc độ ~' + spdW.toFixed(1) + ' ô/s).');
                  if (spdW < CFG.flySpeedMin) log('Tốc độ vẫn thấp sau khi bấm lại — giữ nguyên, không bấm nữa.');
                }
              }
              flyMeas = null; // đo xong (dù đủ quãng đường hay chưa) thì đóng cửa sổ
            }
          }
        }
        if (cheb(p2) <= tol) return { ok: true };

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
            // 1 lần mỗi chặng đi. Trong lúc đánh vẫn ĐẨY về hướng đích theo
            // cách lái đang dùng (không thì nhân vật đứng yên và Auto không
            // với tới quái chặn). Joystick thì đồng bộ lại phiên kéo TRƯỚC
            // khi đánh trả: game có thể đã hủy trạng thái kéo (VD: qua cổng
            // rồi bị đẩy về ngay) — ngắt rồi kéo lại cho chắc.
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
            if (tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
            if (fRes && fRes.reason === 'moved') log('Đánh trả xong, đi tiếp.');
            else log('Đánh trả không nhúc nhích — thử đi vòng.');
            bestCheb = Infinity; noProgress = 0; flyMeas = null; // đợt đánh trả không tính vào cửa sổ đo bay
            continue;
          }
          detours++;
          if (detours > CFG.repathMax) {
            return { ok: false, reason: 'ket', msg: 'Kẹt đường tới ' + label + ' — đã thử đi vòng ' + CFG.repathMax + ' lần.' };
          }
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
          if (tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
          noProgress = 0; flyMeas = null; // đợt đi vòng vuông góc không tính vào cửa sổ đo bay
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
    var tok = steerToken;
    var t0 = Date.now();
    while (Date.now() - t0 < waitMs) {
      if (tok !== steerToken) return false;
      if (docMapId() && docMapId() !== mapCu) return true;
      await sleep(CFG.tickMs);
    }
    return docMapId() && docMapId() !== mapCu;
  }

  // ---------------- Đi tới map đích (qua các cổng) ----------------
  // Phi Hành + Chạy BẬT trong lúc di chuyển (lệnh Thanh 07:05), giữ bật qua
  // các cổng; qua cổng không được khi bay thì hạ cánh đi bộ qua rồi bay lại.
  // Trả true nếu tới đúng map.
  async function travelTo(toiMap) {
    var tok = steerToken;
    var hops = 0;
    while (true) {
      if (!on || tok !== steerToken) return false;
      var cur = docMapId();
      if (!cur) { log('Không đọc được map hiện tại — đã dừng.'); return false; }
      if (cur === toiMap) return true;
      if (KHONG_DUONG[cur]) {
        log('Đang ở ' + tenMap(cur) + ' (phó bản/sự kiện) — không có đường bộ tới ' + tenMap(toiMap) + '. Rời map này rồi bấm BẬT lại.');
        return false;
      }
      if (++hops > 50) { log('Đi qua quá nhiều cổng mà chưa tới — đã dừng.'); return false; }
      var hop = nextHop(cur, toiMap);
      if (!hop) {
        log('Không có đường bộ từ ' + tenMap(cur) + ' tới ' + tenMap(toiMap) + ' — 2 map chưa nối cổng. Đi tay về map gần nhất rồi bấm BẬT lại.');
        return false;
      }
      log('Qua cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + '…');
      // Bật Chạy + Phi Hành để đi nhanh — giữ bật qua các cổng.
      datRun(true);
      if (!flyingBelief) datFly(true);
      var r = await steerToCell(hop.tx, hop.ty, { arrivePx: 16, label: 'cổng (' + hop.tx + ',' + hop.ty + ')' });
      // 'doi-map' = cổng đã mở trong lúc đi (map đổi rồi) — coi như qua cổng
      // xong. 'dung' = người dùng bấm DỪNG — trả về lặng.
      if (!r.ok && r.reason === 'dung') return false;
      if (!r.ok && r.reason !== 'doi-map') { log(r.msg || 'Không tới được cổng.'); return false; }
      if (r.ok && hop.byHand) {
        // Cổng byHand (Long Uyên -> Hang Động): đứng trên ô cổng rồi bấm
        // Tương tác ("Vào") mới qua. Chưa xác minh live — không qua thì báo rõ.
        var okB = false;
        for (var b = 0; b < 2 && !okB; b++) {
          if (tok !== steerToken) return false;
          tap($('#btn-attack'));
          okB = await choDoiMap(cur, CFG.portalWaitMs);
        }
        if (!okB) {
          log('Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + ' — cổng này cần bấm "Vào"/Tương tác tay khi đứng trên ô cổng.');
          return false;
        }
      } else if (r.ok) {
        // Tới ô cổng: cổng game mở khi BƯỚC LÊN ô — chờ đổi map (Ft=8s).
        var ok = await choDoiMap(cur, CFG.portalWaitMs);
        if (!ok && flyingBelief) {
          // Qua cổng không được khi đang bay: hạ cánh, đi bộ lên ô cổng,
          // thử lại (mẫu tryCrossPortal của code gửi).
          log('Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') khi bay — hạ cánh đi bộ lên ô cổng.');
          datFly(false);
          var r2 = await steerToCell(hop.tx, hop.ty, { arrivePx: 16, label: 'cổng (' + hop.tx + ',' + hop.ty + ')' });
          if (!r2.ok && r2.reason === 'dung') return false;
          if (r2.ok) ok = await choDoiMap(cur, CFG.portalWaitMs);
          else if (r2.reason === 'doi-map') ok = true; // đã qua trong lúc đi bộ lên cổng
        }
        if (!ok) {
          // Nudge bằng joystick về phía cổng rồi chờ thêm.
          var nudged = false;
          for (var n = 0; n < 3 && !ok; n++) {
            if (tok !== steerToken) return false;
            var v = docCell();
            if (v) {
              var dx = hop.tx * CFG.tile + CFG.tile / 2 - (v.x * CFG.tile + CFG.tile / 2);
              var dy = hop.ty * CFG.tile + CFG.tile / 2 - (v.y * CFG.tile + CFG.tile / 2);
              await joyHold(dx, dy, 700);
              nudged = true;
            }
            ok = await choDoiMap(cur, CFG.nudgeWaitMs);
          }
          if (!ok) {
            log('Chưa qua được cổng (' + hop.tx + ',' + hop.ty + ') sang ' + tenMap(hop.to) + ' — đã thử đẩy 3 lần. Đứng lại kiểm tra tay rồi bấm BẬT lại.');
            return false;
          }
          if (nudged) log('Đẩy cổng bằng joystick đã qua.');
        }
      }
      log('Đã sang ' + tenMap(docMapId()) + '.');
      // Qua cổng/hạ cánh có thể tắt bay — bật lại Chạy + Phi Hành để đi
      // tiếp cho nhanh (giữ bật qua các cổng, lệnh Thanh 07:05). Bật lại
      // bay thì đo lại tốc độ ở đợt lái sau (không bấm lại lần 2 mù).
      if (!runDangBat()) datRun(true);
      if (!flyingBelief) {
        datFly(true);
        flySpeedChecked = false; // đo lại tốc độ sau khi bật lại
      }
      await sleep(400);
    }
  }

  // ---------------- Đi tới ô / map (bọc ngoài cho luồng dược + debug) ----------------
  // Joystick/phím KHÔNG chạy khi Auto BẬT — tắt Auto ngay từ đầu, tới nơi
  // (hoặc kẹt) thì bật lại Auto nếu là Trúc Cơ. Luyện Khí giữ Auto TẮT
  // sau khi đi (chỉ bật lại khi tự vệ do kiemTraTuVe lo).
  async function diToi(tx, ty) {
    var autoCu = autoDangBat();
    if (autoCu) datAuto(false);
    var r = await steerToCell(tx, ty, { arrivePx: CFG.tile, label: 'ô (' + tx + ',' + ty + ')' });
    if (autoCu && realm !== 'luyen_khi') datAuto(true);
    return r.ok;
  }
  async function diToiMap(toiMap) {
    var autoCu = autoDangBat();
    if (autoCu) datAuto(false);
    var ok = await travelTo(toiMap);
    if (autoCu && realm !== 'luyen_khi' && ok) datAuto(true);
    return ok;
  }

  // ================= VÒNG DƯỢC CÔNG (chế độ "Tự Đi" + làm tay dự phòng) =================

  // ---------------- Chạm NPC xoắn ốc mở thoại (từ code gửi) ----------------
  // Bắn 8 điểm chạm quanh vị trí NPC theo 2 vòng: vòng trong 3×3 bỏ tâm
  // (32px) rồi vòng 4 hướng chính ở 48/32/24px — phủ zoom 0.75–1.5.
  // Game: handler `window pointerup`, tap <500ms và <14px (dựa trên
  // Renderer.screenToBuffer), không kiểm isTrusted, không setPointerCapture
  // -> tap tổng hợp dùng được. Đợi tối đa 2.5s mỗi vòng cho thoại mở.
  async function waitDialogAfterTap() {
    var t0 = Date.now();
    while (Date.now() - t0 < CFG.tapWaitMs) {
      if (dialogMo()) return true;
      await sleep(200);
    }
    return false;
  }
  async function tapNpc(tx, ty, mapId) {
    if (mapId) {
      var r1 = await steerToCell(tx, ty, { arrivePx: CFG.tile, label: 'ô chạm NPC (' + tx + ',' + ty + ')' });
      if (!r1.ok) return { ok: false, reason: r1.reason || 'ket', msg: r1.msg || ('Không tới được ô NPC (' + tx + ',' + ty + ').') };
    }
    var el = gameCanvas();
    if (!el) return { ok: false, reason: 'ket', msg: 'Không tìm thấy canvas game.' };
    var r = el.getBoundingClientRect();
    var centerX = r.left + r.width / 2;
    var centerY = r.top + r.height / 2;
    var pos = docCell();
    if (!pos) return { ok: false, reason: 'ket', msg: 'Không đọc được vị trí nhân vật.' };
    // Điểm cần chạm trên màn hình = vị trí NPC tương đối so với nhân vật
    // (camera bám theo nhân vật; nhân vật luôn ở tâm canvas).
    var npcSx = centerX + (tx - pos.x) * CFG.pxPerTile;
    var npcSy = centerY + (ty - pos.y) * CFG.pxPerTile;
    var offsets = [
      [-CFG.pxPerTile, -CFG.pxPerTile], [0, -CFG.pxPerTile], [CFG.pxPerTile, -CFG.pxPerTile],
      [-CFG.pxPerTile, 0], [CFG.pxPerTile, 0],
      [-CFG.pxPerTile, CFG.pxPerTile], [0, CFG.pxPerTile], [CFG.pxPerTile, CFG.pxPerTile],
      [0, -CFG.pxPerTile * 1.5], [0, CFG.pxPerTile * 1.5], [-CFG.pxPerTile * 1.5, 0], [CFG.pxPerTile * 1.5, 0],
      [0, -CFG.pxPerTile * 0.75], [0, CFG.pxPerTile * 0.75], [-CFG.pxPerTile * 0.75, 0], [CFG.pxPerTile * 0.75, 0],
    ];
    for (var i = 0; i < offsets.length; i++) {
      if (dialogMo()) return { ok: true, npc: { x: npcSx + offsets[i][0], y: npcSy + offsets[i][1] } };
      var dx = npcSx + offsets[i][0], dy = npcSy + offsets[i][1];
      var opts = { bubbles: true, cancelable: true, clientX: dx, clientY: dy, pointerId: 1, pointerType: 'touch', isPrimary: true };
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      setTimeout(function () { window.dispatchEvent(new PointerEvent('pointerup', opts)); }, 100);
      await sleep(200);
      // Nếu thoại đã mở trong lúc chạm, trả ngay.
      if (dialogMo()) return { ok: true, npc: { x: dx, y: dy } };
      // Hết 1 vòng thì chờ thoại lâu hơn 1 chút trước khi sang vòng sau.
      if (i === 7 || i === offsets.length - 1) {
        var opened = await waitDialogAfterTap();
        if (opened) return { ok: true, npc: { x: dx, y: dy } };
      }
    }
    return { ok: false, reason: 'ket', msg: 'Đã chạm 16 điểm quanh Đại Phu mà thoại không mở. Bấm tay vào Đại Phu rồi bấm BẬT lại.' };
  }

  // ---------------- Bấm bước nhiệm vụ để game tự đi ----------------
  // #quest-objectives li[data-di] — click vào đó, game gọi diToiNhiemVu.
  // Trả false khi không tìm thấy bước nhiệm vụ nào.
  function clickQuestStep() {
    var items = document.querySelectorAll('#quest-objectives li[data-di]');
    if (!items || items.length === 0) return false;
    var li = items[items.length - 1];
    li.click();
    return true;
  }

  // ---------------- Mở hộp thoại Đại Phu ----------------
  // Ưu tiên 1: nút Tương Tác (#btn-attack đổi nhãn "Tương Tác" khi đứng gần
  // NPC — kiểm tra bằng aria-label / .skill-name). Ưu tiên 2: tapNpc xoắn
  // ốc chạm vào vị trí Đại Phu. Trả true nếu thoại Đại Phu đã mở, false nếu
  // cả hai cách đều không mở được.
  async function moHopThoaiDaiPhu() {
    var t0 = Date.now();
    while (Date.now() - t0 < CFG.npcWaitMs) {
      if (dialogMo()) {
        if (laMenuDaiPhu(docDialog())) return true;
        // Thoại khác đang mở (câu cá / danh sách việc / hộp xác nhận /
        // Quầy Đổi Hạt...) — đóng rồi mở lại đúng menu Đại Phu.
        dongDialog();
        await sleep(400);
        continue;
      }
      var nt = nutTuongTac();
      if (nt && nt.laTuongTac) {
        tap(nt.el);
        var opened = await waitDialogAfterTap();
        if (opened && dialogMo()) {
          var dlg = docDialog();
          if (dlg && laMenuDaiPhu(dlg)) return true;
          // Thoại mở nhưng không phải Đại Phu (vật khác) — đóng rồi thử chạm.
          dongDialog();
          await sleep(400);
        }
      }
      if (!nt || !nt.laTuongTac) {
        // Nút Tương Tác chưa hiện — chạm NPC xoắn ốc.
        var r = await tapNpc(DAI_PHU.x, DAI_PHU.y, null);
        if (r.ok) return true;
        // Chạm thất bại: thử lại 1 vòng sau khi đợi ngắn (người chơi đã
        // đứng sát NPC rồi nên không cần lái lại).
        await sleep(500);
        if (dialogMo()) return true;
      }
      await sleep(600);
    }
    return false;
  }

  // ---------------- Bật chế độ "Tự Đi" (Trúc Cơ — bộ máy autopilot của game) ----------------
  // Chỉ có tác dụng với acc Trúc Cơ. Bấm lựa chọn "Tự Đi Làm Việc Dược Công"
  // rồi bấm nút hành động "Bắt Đầu Tự Làm" ở hộp thoại xác nhận — game chạy
  // bộ máy autoDC (tự nhận việc, tự đi, tự hái/câu/chặt, tự giao hộ tống,
  // tự về nộp, lặp tới hết lượt). "Chạm màn hình hoặc gạt cần để dừng" nên
  // tool KHÔNG được chạm gì thêm trong lúc bộ máy chạy — chỉ chờ thụ động.
  // Trả true nếu bộ máy đã bắt đầu chạy, false nếu nút khoá/không có.
  async function batTuDi() {
    var dlg = docDialog();
    if (!dlg) return false;
    var c = timLuaChon(dlg, /Tự Đi Làm Việc Dược Công/);
    if (!c) return false;
    if (c.disabled) { log('Nút "Tự Đi Làm Việc Dược Công" đang bị khoá (lượt 0 hoặc đang giữ việc?).'); return false; }
    tap(c.el);
    // Hộp thoại xác nhận "Bắt Đầu Tự Làm" mở sau khi bấm lựa chọn.
    var t0 = Date.now();
    while (Date.now() - t0 < CFG.choDoiMs * 3) {
      var d2 = docDialog();
      if (d2 && d2.action && /Bắt Đầu Tự Làm/.test(d2.action.label)) {
        tap(d2.action.el);
        await sleep(CFG.afterActionMs);
        return true;
      }
      await sleep(300);
    }
    // Không thấy hộp thoại xác nhận — có thể bộ máy đã chạy ngay (game cũ)
    // hoặc lựa chọn không có tác dụng. Coi là thất bại để vòng gọi thử làm tay.
    log('Bấm "Tự Đi" nhưng không thấy nút "Bắt Đầu Tự Làm" — bộ máy chưa chạy.');
    return false;
  }
  // Chờ bộ máy "Tự Đi" làm xong ("Xong việc Dược Công hôm nay" ở caption).
  // Bộ máy dừng giữa chừng (kẹt đường/quái chặn/HP thấp) thì khởi động lại
  // tối đa CFG.maxTuDiKhoiDongLai lần (mỗi lần mở lại thoại Đại Phu rồi bấm
  // "Tự Đi" lại). HP <35% thì chờ hồi ≥60% rồi mới khởi động lại.
  // Trả {ok:true, dcTruoc, dcSau} | {ok:false, reason, msg}.
  async function chayTuDiTuDong() {
    var tok = steerToken;
    var dcTruoc = docDCLocal();
    var lanKhoiDong = 0;
    while (true) {
      if (!on || tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
      var ok = await batTuDi();
      if (!ok) return { ok: false, reason: 'khong_co_tu_di', msg: 'Không bật được bộ máy "Tự Đi" (nút khoá/không có).' };
      lanKhoiDong++;
      demTuDiLai = lanKhoiDong - 1;
      log('Bộ máy "Tự Đi" đang chạy (lần ' + lanKhoiDong + ') — tool chỉ chờ, không chạm màn hình.');
      phase = 'tu_di';
      var t0 = Date.now();
      var dcLanTruoc = docDCLocal();
      var dcDungAt = Date.now();
      var choKetQua = null;
      while (Date.now() - t0 < CFG.tuDiTimeoutMs) {
        if (!on || tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        var cap = docCaption();
        if (/Xong việc Dược Công hôm nay/.test(cap)) { choKetQua = 'xong'; break; }
        if (/dừng tự làm việc|Quái chặn đường quá lâu|Không thấy Đại Phu|Không thấy bờ nước|Không thấy Cổ Thụ|Chưa đủ cảnh giới/.test(cap)) { choKetQua = 'dung_giua_chung'; break; }
        // HP <35%: bộ máy tự dừng — chờ hồi rồi khởi động lại.
        var h = docHP();
        if (h && h.tiLe < CFG.hpNguyHiem) { choKetQua = 'hp_thap'; break; }
        var dcHien = docDCLocal();
        if (dcHien !== null && dcLanTruoc !== null && dcHien !== dcLanTruoc) { dcLanTruoc = dcHien; dcDungAt = Date.now(); }
        // Không còn việc đang giữ + DC không đổi 60s + caption trống = bộ máy
        // có thể đã dừng lặng (không báo) — kiểm tra lại bằng thoại Đại Phu.
        if (Date.now() - dcDungAt > 60000 && !docViecDangGiu()) { choKetQua = 'kiem_tra'; break; }
        await sleep(2000);
      }
      if (choKetQua === 'xong') {
        var dcSau = docDCLocal();
        log('Bộ máy "Tự Đi" đã làm xong hết lượt dược hôm nay (DC ' + dcTruoc + ' → ' + dcSau + ').');
        return { ok: true, dcTruoc: dcTruoc, dcSau: dcSau };
      }
      if (choKetQua === 'kiem_tra') {
        // Mở thoại Đại Phu xem còn lượt không (bộ máy đã dừng thì mở thoại an toàn).
        var okDlg = await moHopThoaiDaiPhu();
        if (!on || tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        if (okDlg) {
          var rNhan = bamLuaChon(/Nhận Việc Dược Công/);
          if (rNhan === 'disabled') {
            // Nút nhận việc bị khoá = hết lượt hôm nay -> bộ máy đã xong.
            dongDialog();
            var dcSau3 = docDCLocal();
            log('Bộ máy "Tự Đi" đã làm xong hết lượt dược hôm nay (DC ' + dcTruoc + ' → ' + dcSau3 + ').');
            return { ok: true, dcTruoc: dcTruoc, dcSau: dcSau3 };
          }
          if (rNhan === true || rNhan === false) {
            var dlgL = docDialog();
            var luot = docLuotTuDanhSach(dlgL);
            var con = 0;
            THU_TU_UU_TIEN.forEach(function (id) { if (luot[id] > 0) con += luot[id]; });
            dongDialog();
            if (con === 0) {
              var dcSau2 = docDCLocal();
              log('Bộ máy "Tự Đi" đã làm xong hết lượt dược hôm nay (DC ' + dcTruoc + ' → ' + dcSau2 + ').');
              return { ok: true, dcTruoc: dcTruoc, dcSau: dcSau2 };
            }
            log('Bộ máy dừng lặng nhưng còn ' + con + ' lượt thường — khởi động lại.');
          } else {
            dongDialog();
          }
        }
        choKetQua = 'dung_giua_chung';
      }
      if (choKetQua === 'hp_thap') {
        log('Khí Huyết dưới 35% — bộ máy tự dừng. Chờ hồi ≥60% rồi khởi động lại.');
        var bMed = $('#btn-meditate-touch');
        if (bMed) tap(bMed);
        var tHoi = Date.now();
        var hoiDu = false;
        while (on && tok === steerToken) {
          await sleep(2000);
          var h2 = docHP();
          if (h2 && h2.tiLe >= CFG.hpHoiXong) { hoiDu = true; break; }
          if (Date.now() - tHoi > CFG.choHoiMs) break;
        }
        if (!on || tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        if (!hoiDu) return { ok: false, reason: 'hp_thap', msg: 'Chờ hồi máu quá 5 phút vẫn <60% — đã dừng.' };
        choKetQua = 'dung_giua_chung';
      }
      // Dừng giữa chừng: khởi động lại nếu còn lượt cho phép.
      if (lanKhoiDong > CFG.maxTuDiKhoiDongLai) {
        return { ok: false, reason: 'ket', msg: 'Bộ máy "Tự Đi" dừng giữa chừng quá ' + CFG.maxTuDiKhoiDongLai + ' lần khởi động lại — đã dừng.' };
      }
      log('Bộ máy "Tự Đi" dừng giữa chừng — khởi động lại (lần ' + (lanKhoiDong + 1) + ').');
      // Mở lại thoại Đại Phu rồi bấm "Tự Đi" lại (batTuDi tự mở thoại ở đầu vòng).
      if (!dialogMo()) {
        var okDlg2 = await moHopThoaiDaiPhu();
        if (!on || tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
        if (!okDlg2) return { ok: false, reason: 'ket', msg: 'Không mở lại được thoại Đại Phu để khởi động lại "Tự Đi" — đã dừng.' };
      }
    }
  }

  // ---------------- Nhận việc tốt nhất (theo DC, bỏ việc hết lượt/khóa) ----------------
  // Đọc từ hộp thoại Đại Phu: số DC hiện tại + lượt còn lại của từng việc
  // (ghi chú "còn r/c lượt"). Chọn việc có DC cao nhất còn lượt & còn mở
  // (cau_ca=4 > duoc_moc=3 > ho_tong_chau=2 > truc_gia=1 = linh_chi=1;
  // hòa DC thì việc nào ở trước thứ tự v1.1.2 trước).
  // Trả: {ok:true, id, ten, dc} | {ok:false, reason:'het_luot'|'hp_thap'}.
  async function nhanViecTotNhat(dlg) {
    var h = docHP();
    if (h && h.tiLe < CFG.hpNhanViec) {
      return { ok: false, reason: 'hp_thap', msg: 'Khí Huyết dưới 50% — không nhận việc, chờ hồi rồi thử lại.' };
    }
    // Menu chính của Đại Phu KHÔNG liệt kê từng việc — phải bấm "Nhận Việc
    // Dược Công" để mở hộp thoại danh sách việc rồi mới đọc lượt từng việc.
    var rMo = bamLuaChon(/Nhận Việc Dược Công/);
    if (rMo === 'disabled') return { ok: false, reason: 'het_luot', msg: 'Hết lượt việc dược hôm nay (nút "Nhận Việc Dược Công" bị khoá) — đã dừng.' };
    if (!rMo) return { ok: false, reason: 'het_luot', msg: 'Không thấy nút "Nhận Việc Dược Công" trong hộp thoại Đại Phu.' };
    await sleep(CFG.afterActionMs);
    var dlgList = docDialog();
    if (!dlgList) return { ok: false, reason: 'het_luot', msg: 'Bấm "Nhận Việc Dược Công" nhưng danh sách việc không mở.' };
    var luot = docLuotTuDanhSach(dlgList);
    var bestId = null;
    for (var i = 0; i < THU_TU_UU_TIEN.length; i++) {
      var id = THU_TU_UU_TIEN[i];
      if (!(id in luot)) continue; // không có trong hộp thoại = chưa mở/không có
      if (luot[id] === null) continue; // bị khóa cảnh giới
      if (luot[id] <= 0) continue; // hết lượt
      bestId = id;
      break;
    }
    if (!bestId) return { ok: false, reason: 'het_luot', msg: 'Hết lượt việc thường hôm nay (5 việc thường đều 0 lượt/khoá) — đã dừng.' };
    var t = TASKS[bestId];
    // Chọn đúng nút của việc trong DANH SÁCH VIỆC (label chứa tên việc).
    var c = null;
    for (var j = 0; j < dlgList.choices.length; j++) {
      var ch = dlgList.choices[j];
      if (ch.label.indexOf(t.ten) >= 0 || ch.label.indexOf(t.tenNgan) >= 0) { c = ch; break; }
    }
    if (!c) return { ok: false, reason: 'het_luot', msg: 'Không thấy nút nhận việc ' + t.ten + ' trong danh sách việc.' };
    if (c.disabled) return { ok: false, reason: 'het_luot', msg: 'Nút nhận việc ' + t.ten + ' đang bị khoá.' };
    tap(c.el);
    await sleep(CFG.afterActionMs);
    // Game mở hộp thoại xác nhận với nút hành động "Nhận Việc Này".
    var dlg3 = docDialog();
    if (dlg3 && dlg3.action && /Nhận Việc Này/.test(dlg3.action.label)) {
      tap(dlg3.action.el);
      await sleep(CFG.afterActionMs);
    } else if (dlg3 && /xác nhận|Nhận việc/i.test((dlg3.text || '') + ' ' + (dlg3.title || ''))) {
      bamNutHanhDong(/Đồng ý|Xác nhận|Nhận/i);
      await sleep(CFG.afterActionMs);
    }
    // Kiểm tra tracker đã có việc chưa (nhận thất bại thì tracker vẫn rỗng).
    if (!docTracker()) {
      return { ok: false, reason: 'het_luot', msg: 'Bấm nhận ' + t.ten + ' nhưng tracker không có việc — có thể đã hết lượt. Đã dừng.' };
    }
    return { ok: true, id: bestId, ten: t.ten, dc: t.dc };
  }

  // ---------------- Quét vòng nhặt cành rơi ----------------
  // Cơ chế chặt cây: chặt xong cành RƠI xuống đất (drops, state "fall"),
  // phải ĐI QUA chỗ cành rơi mới nhặt vào túi — chỉ bấm #btn-attack mà
  // không đi nhặt thì tiến độ mãi 0/5. Quét 8 điểm xung quanh vị trí
  // hiện tại (bán kính ~2 ô), mỗi điểm chờ 300ms cho game nhặt.
  async function quetNhat() {
    var p = docCell();
    if (!p) return;
    // Quét 2 vòng quanh chỗ đứng: vòng trong (±1 ô) rồi vòng ngoài (±2 ô).
    // Cành rơi theo game.js: x = cây.x - 10..30px, y = cây.y - 64..52px
    // (lệch tây ~0-1 ô, bắc ~2 ô) — quét cả 2 vòng mới chắc chắn nhặt hết.
    var pts = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
               [2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2], [0, -2], [2, -2]];
    for (var i = 0; i < pts.length; i++) {
      var r = await steerToCell(p.x + pts[i][0], p.y + pts[i][1], { arrivePx: CFG.tile, label: 'điểm nhặt (' + (p.x + pts[i][0]) + ',' + (p.y + pts[i][1]) + ')' });
      if (!r.ok && (r.reason === 'dung' || r.reason === 'guc' || r.reason === 'hp-thap')) return;
      var td = docTienDo();
      if (td && td.cur >= td.max) return; // đủ rồi — dừng quét ngay
      await sleep(300);
    }
  }

  // ---------------- Làm việc bằng chế độ "Tự Đi" của game (code gửi) ----------------
  // Bấm bước nhiệm vụ để game tự đi → chờ nhãn 'Tương Tác' → bấm
  // #btn-attack tới đủ tiến độ → (chặt: quét vòng nhặt cành rơi nếu tiến độ
  // không tăng) → về Đại Phu nộp.
  // Trả: {ok:true, id, ten, dc} | {ok:false, reason, msg} với reason:
  //   'ket' (45s không tiến độ), 'hp_thap' (<35%), 'guc', 'dung', 'het_gio'.
  // Phân biệt nhiệm vụ:
  // - cau_ca: game tự đi tới bến câu, bấm 'Tự động câu' rồi CHỜ RIÊNG
  //   (không bấm thêm), câu đủ 3 cá là xong.
  // - ho_tong_chau (Đưa Người): game tự đi tới mục tiêu, công tự ghi khi
  //   đứng trong vùng mục tiêu (không cần bấm #btn-attack) — vẫn bấm bước
  //   nhiệm vụ mỗi 5s để game không dừng, đủ tiến độ thì nộp.
  // - duoc_moc (chặt): bấm #btn-attack để chặt; nếu tiến độ không tăng >5s
  //   thì quét vòng nhặt cành rơi.
  // - linh_chi (hái): bấm #btn-attack để hái (pickLinhChi cộng thẳng vào túi).
  // - truc_gia (chặt Trúc Già): như duoc_moc.
  // ---------------- Xử lý hộp thoại mở ra trong lúc làm việc ----------------
  // Tương tác với mục tiêu có thể mở hộp thoại của game:
  // - mặt nước (câu cá): lựa chọn "Thả câu" / "Tự động câu" -> bấm "Tự động câu".
  // - Thầy Ông Nội (giao hộ tống): nút hành động "Bẩm Thầy Ông Nội" -> bấm để
  //   hoàn thành việc ngay tại chỗ (công tự ghi, KHÔNG cần về Đại Phu nộp).
  // Trả 'cau' (đã bấm Tự động câu) | 'da_nop' (đã giao hộ tống) | null.
  function xuLyDialogLamViec(viecId, st) {
    var dlg = docDialog();
    if (!dlg) return null;
    if (viecId === 'cau_ca' && !st.fishingStarted) {
      var c = timLuaChon(dlg, /Tự động câu/);
      if (c && !c.disabled) { tap(c.el); st.fishingStarted = true; return 'cau'; }
    }
    if (viecId === 'ho_tong_chau' && dlg.action && /Bẩm Thầy Ông Nội/.test(dlg.action.label)) {
      tap(dlg.action.el);
      return 'da_nop';
    }
    return null;
  }

  async function lamViecTuDi(viecId) {
    var t = TASKS[viecId];
    taskBatDauAt = Date.now();
    var tienDoCu = null, tienDoCuAt = Date.now();
    var lanBamBuocCuoi = 0;
    var daQuetNhat = false;
    var st = { fishingStarted: false };
    var lastPos = docCell();
    var daNhanViec = !!docViecDangGiu(); // tracker đã có việc lúc bắt đầu
    // Đọc tiến độ ban đầu.
    var td0 = docTienDo();
    tienDoCu = td0 ? td0.cur : 0;
    var soLanQuet = 0;
    // Việc đã đủ tiến độ từ trước (vd nhận rồi làm tay xong mới bật tool)
    // thì trả ok NGAY, KHÔNG bấm bước nhiệm vụ — bấm sẽ đặt walkTarget về
    // chỗ làm, nhân vật tự đi về đó sau khi nộp xong dù tool đã dừng
    // (bắt được ở test (j9) 26/11: nộp xong đứng (18,12) rồi tự đi về hồ).
    var td0b = docTienDo();
    if (td0b && td0b.max > 0 && td0b.cur >= td0b.max) {
      return { ok: true, id: viecId, ten: t.ten, dc: t.dc };
    }
    // Sau khi nhận việc, thoại Đại Phu còn mở và nút Tương Tác đang chỉ NPC
    // (đứng cạnh Đại Phu) — đóng thoại rồi bấm bước nhiệm vụ ngay để game
    // bắt đầu tự đi tới chỗ làm. Nếu không, nhãn "Tương Tác" của NPC làm
    // tool tưởng đã tới mục tiêu và cứ bấm #btn-attack vào NPC mãi, không
    // bao giờ đi tới chỗ làm (bắt được ở test (c) 26/11: đứng yên (14,9)
    // suốt 45s tới khi kẹt).
    dongDialog();
    await sleep(300);
    clickQuestStep();
    lanBamBuocCuoi = Date.now();
    while (true) {
      if (!on) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
      var at = kiemTraAnToan();
      if (!at.ok) return { ok: false, reason: at.reason, msg: at.msg };
      if (Date.now() - taskBatDauAt > CFG.taskTimeoutMs) {
        return { ok: false, reason: 'het_gio', msg: 'Quá ' + Math.round(CFG.taskTimeoutMs / 60000) + ' phút chưa xong việc ' + t.ten + ' — đã dừng (xem log để biết vị trí).' };
      }
      // Hộp thoại mở ra trong lúc làm (câu cá / giao hộ tống) — xử lý trước.
      var xl = xuLyDialogLamViec(viecId, st);
      if (xl === 'da_nop') {
        return { ok: true, id: viecId, ten: t.ten, dc: t.dc, daNop: true };
      }
      var td = docTienDo();
      if (td && td.max > 0 && td.cur >= td.max) {
        return { ok: true, id: viecId, ten: t.ten, dc: t.dc };
      }
      // Hộ tống: tracker KHÔNG có số a/b (game.js: 2 mục done:!1) — việc xong
      // khi giao cho Thầy Ông Nội xong thì tracker hết việc đang giữ.
      if (viecId === 'ho_tong_chau' && daNhanViec && !docViecDangGiu()) {
        return { ok: true, id: viecId, ten: t.ten, dc: t.dc, daNop: true };
      }
      // Câu cá đã bắt đầu: KHÔNG bấm bước nhiệm vụ nữa (di chuyển làm dừng câu).
      var dangCau = (viecId === 'cau_ca' && st.fishingStarted);
      // Bấm lại bước nhiệm vụ mỗi 5s nếu mất nhãn Tương Tác (game tự đi lại).
      // Menu Đại Phu còn mở = đang đứng cạnh NPC (chưa đi) — bấm bước nhiệm
      // vụ kể cả khi nhãn Tương Tác đang hiện (nhãn đó lúc này chỉ NPC).
      if (!dangCau && Date.now() - lanBamBuocCuoi > 5000) {
        lanBamBuocCuoi = Date.now();
        var lab = interactLabel();
        var dlg5 = docDialog();
        var oDaiPhu = dlg5 && laMenuDaiPhu(dlg5);
        if (!/Tương Tác/i.test(lab) || oDaiPhu) clickQuestStep();
      }
      // Nhãn 'Tương Tác' hiện — nhưng phải xem aria chỉ vật gì: đứng gần
      // Đại Phu thì nhãn cũng là "Tương Tác" (NPC); bấm vào là mở nhầm menu
      // Đại Phu rồi để nó mở suốt lúc làm (ảnh chụp tiến độ cũ, không có nút
      // nộp — bắt được ở test (f) 26/11: menu "Đã thu: 0/5" mở từ lúc nhận
      // việc còn mở tới lúc nộp nên không thấy nút "Giao Nguyên Liệu").
      // Chỉ bấm #btn-attack khi aria KHÔNG chỉ Đại Phu.
      var lab2 = interactLabel();
      if (/Tương Tác/i.test(lab2)) {
        var nt2 = nutTuongTac();
        var aria2 = nt2 ? (nt2.aria || '') : '';
        if (/Đại Phu/.test(aria2)) {
          // Đang đứng cạnh NPC, chưa tới chỗ làm — đóng thoại mở nhầm (nếu có)
          // rồi bấm bước nhiệm vụ để game đi tiếp.
          if (dialogMo()) { dongDialog(); await sleep(300); }
          clickQuestStep();
          lanBamBuocCuoi = Date.now();
        } else if (dialogMo()) {
          // Thoại lạ đang mở (vd menu Đại Phu mở nhầm từ trước) — đóng rồi
          // bấm lại ở vòng sau, không bấm #btn-attack khi thoại đang mở.
          dongDialog();
          await sleep(300);
        } else if (viecId === 'cau_ca') {
          // Câu cá: bấm #btn-attack 1 lần để mở hộp thoại mặt nước, hộp thoại
          // được xử lý ở đầu vòng sau (bấm "Tự động câu"); không bấm thêm.
          if (!st.fishingStarted) {
            var b = $('#btn-attack');
            if (b) { tap(b); }
            await sleep(CFG.afterActionMs);
          }
        } else {
          var b2 = $('#btn-attack');
          if (b2) tap(b2);
          await sleep(700);
        }
      } else {
        // Chưa tới mục tiêu: game đang tự đi (đã bấm bước nhiệm vụ).
        await sleep(600);
      }
      // Cập nhật tiến độ; vị trí đổi cũng tính là đang tiến triển (đang đi
      // tới mục tiêu — vd hộ tống đi qua 2 map, không có số tiến độ).
      var td2 = docTienDo();
      var cur = td2 ? td2.cur : 0;
      if (cur !== tienDoCu) { tienDoCu = cur; tienDoCuAt = Date.now(); daQuetNhat = false; }
      var pNow = docCell();
      if (pNow && lastPos && (pNow.x !== lastPos.x || pNow.y !== lastPos.y)) {
        tienDoCuAt = Date.now();
        lastPos = pNow;
      } else if (pNow) lastPos = pNow;
      if (viecId === 'duoc_moc' || viecId === 'truc_gia') {
        if (Date.now() - tienDoCuAt > CFG.quietMs && !daQuetNhat) {
          daQuetNhat = true;
          soLanQuet++;
          log('Chặt ' + (soLanQuet > 1 ? 'lần ' + soLanQuet + ' ' : '') + 'không thấy tiến độ tăng — quét vòng nhặt cành rơi…');
          await quetNhat();
          tienDoCuAt = Date.now(); // quét xong cho thêm 1 khoảng chờ
        }
      }
      // Kẹt: 45s không tiến độ và không di chuyển (sau khi đã quét nhặt nếu là việc chặt).
      if (Date.now() - tienDoCuAt > CFG.khongTienDoMs) {
        return { ok: false, reason: 'ket', msg: 'Việc ' + t.ten + ' kẹt: ' + Math.round(CFG.khongTienDoMs / 1000) + 's không tiến độ (đang ' + cur + '/' + (td2 ? td2.max : '?') + ').' };
      }
      await sleep(400);
    }
  }

  // ---------------- Làm việc thủ công (fallback — logic v1.1.2) ----------------
  // Dùng chung deadline taskBatDauAt + taskTimeoutMs với lamViecTuDi.
  // (Logic cũ của v1.1.2 — giữ nguyên để hồi quy; chỉ đổi tên hàm.)
  async function lamViecThuCong(viecId) {
    var t = TASKS[viecId];
    taskBatDauAt = Date.now();
    var tienDoCu = null, tienDoCuAt = Date.now();
    var st = { fishingStarted: false };
    var lastPos = docCell();
    var daNhanViec = !!docViecDangGiu();
    while (true) {
      if (!on) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
      var at = kiemTraAnToan();
      if (!at.ok) return { ok: false, reason: at.reason, msg: at.msg };
      if (Date.now() - taskBatDauAt > CFG.taskTimeoutMs) {
        return { ok: false, reason: 'het_gio', msg: 'Quá ' + Math.round(CFG.taskTimeoutMs / 60000) + ' phút chưa xong việc ' + t.ten + ' — đã dừng (xem log để biết vị trí).' };
      }
      var xl = xuLyDialogLamViec(viecId, st);
      if (xl === 'da_nop') {
        return { ok: true, id: viecId, ten: t.ten, dc: t.dc, daNop: true };
      }
      var td = docTienDo();
      if (td && td.max > 0 && td.cur >= td.max) {
        return { ok: true, id: viecId, ten: t.ten, dc: t.dc };
      }
      if (viecId === 'ho_tong_chau' && daNhanViec && !docViecDangGiu()) {
        return { ok: true, id: viecId, ten: t.ten, dc: t.dc, daNop: true };
      }
      // Bấm bước nhiệm vụ để game tự đi (nếu có). Câu cá đã bắt đầu thì không
      // bấm nữa (di chuyển làm dừng câu).
      if (!(viecId === 'cau_ca' && st.fishingStarted)) {
        if (!clickQuestStep()) {
          await sleep(800);
        }
      }
      var lab = interactLabel();
      if (/Tương Tác/i.test(lab)) {
        // Như lamViecTuDi: nhãn "Tương Tác" của NPC Đại Phu thì KHÔNG bấm
        // #btn-attack (mở nhầm menu, ảnh chụp tiến độ cũ); bấm bước nhiệm vụ
        // để game đi tiếp. Thoại lạ đang mở thì đóng rồi bấm lại vòng sau.
        var nt3 = nutTuongTac();
        var aria3 = nt3 ? (nt3.aria || '') : '';
        if (/Đại Phu/.test(aria3)) {
          if (dialogMo()) { dongDialog(); await sleep(300); }
          clickQuestStep();
        } else if (dialogMo()) {
          dongDialog();
          await sleep(300);
        } else if (viecId === 'cau_ca') {
          if (!st.fishingStarted) {
            var b = $('#btn-attack');
            if (b) tap(b);
            await sleep(CFG.afterActionMs);
          }
        } else {
          var b2 = $('#btn-attack');
          if (b2) tap(b2);
          await sleep(700);
        }
      } else {
        await sleep(600);
      }
      var td2 = docTienDo();
      var cur = td2 ? td2.cur : 0;
      if (cur !== tienDoCu) { tienDoCu = cur; tienDoCuAt = Date.now(); }
      var pNow = docCell();
      if (pNow && lastPos && (pNow.x !== lastPos.x || pNow.y !== lastPos.y)) {
        tienDoCuAt = Date.now();
        lastPos = pNow;
      } else if (pNow) lastPos = pNow;
      if (Date.now() - tienDoCuAt > CFG.khongTienDoMs) {
        return { ok: false, reason: 'ket', msg: 'Việc ' + t.ten + ' kẹt: ' + Math.round(CFG.khongTienDoMs / 1000) + 's không tiến độ (đang ' + cur + '/' + (td2 ? td2.max : '?') + ').' };
      }
      await sleep(400);
    }
  }

  // ---------------- Nộp việc / Huỷ việc ----------------
  // Nộp: mở thoại Đại Phu → bấm "Giao Nguyên Liệu" (hoặc "Giao Ba Cá"
  // với việc câu cá). Trả {ok:true, dcMoi} hoặc {ok:false, reason, msg}.
  async function nopViec(viecId) {
    var t = TASKS[viecId];
    // Dừng câu trước khi đi (đang câu ở hồ thì bấm "Dừng câu" cho chắc —
    // di chuyển cũng làm dừng câu trong game thật, nhưng bấm nút rõ ràng hơn).
    if (viecId === 'cau_ca') {
      var bStop = $('#btn-fishing-stop-touch');
      if (bStop) { tap(bStop); await sleep(300); }
    }
    // Về ô cạnh Đại Phu TRƯỚC khi mở thoại: sau khi làm xong, nhân vật đang
    // ở hồ/rừng/làng — xa Đại Phu, moHopThoaiDaiPhu không tự đi về được mà
    // chỉ bấm #btn-attack tại chỗ (mở nhầm thoại nước/cây rồi kẹt 30s —
    // bắt được ở test (c) 26/11).
    var p0 = docViTri();
    if (!p0 || p0.map !== 'duoc_vien') {
      var okMap = await diToiMap('duoc_vien');
      if (!okMap) return { ok: false, reason: 'ket', msg: 'Không về được Thảo Dược Cốc để nộp việc ' + t.ten + '.' };
    }
    if (!ganDaiPhu()) {
      var rDi = await diToi(DAI_PHU_DUNG.x, DAI_PHU_DUNG.y);
      if (!rDi) return { ok: false, reason: 'ket', msg: 'Không tới được ô cạnh Đại Phu để nộp việc ' + t.ten + '.' };
    }
    // Menu Đại Phu render 1 lần lúc mở (tiến độ/nút nộp là ảnh chụp lúc mở)
    // — nếu thoại đang mở sẵn từ trước (vd mở nhầm lúc đi ngang NPC), đóng
    // rồi mở lại để đọc đúng trạng thái hiện tại (nút nộp chỉ hiện khi đủ
    // tiến độ lúc MỞ thoại). Bắt được ở test (f) 26/11.
    if (dialogMo()) { dongDialog(); await sleep(400); }
    var ok = await moHopThoaiDaiPhu();
    if (!ok) return { ok: false, reason: 'ket', msg: 'Không mở được thoại Đại Phu để nộp việc ' + t.ten + '.' };
    var dlg = docDialog();
    var dcTruoc = docDC(dlg);
    // "Giao Ba Cá" (câu cá) / "Giao Nguyên Liệu" (việc khác) là NÚT HÀNH ĐỘNG
    // (#dialog-action, actionLabel + actionFirst trong game.js) — KHÔNG phải
    // lựa chọn .btn-choice. Chỉ hiện khi đã đủ tiến độ (seedQuestComplete).
    var re = (viecId === 'cau_ca') ? /Giao Ba Cá/ : /Giao Nguyên Liệu/;
    var r = bamNutHanhDong(re);
    if (!r) return { ok: false, reason: 'ket', msg: 'Không thấy nút nộp việc ' + t.ten + ' trong hộp thoại Đại Phu (chưa đủ tiến độ?).' };
    await sleep(CFG.afterActionMs);
    // Đọc DC sau nộp (hộp thoại hoặc localStorage).
    var dlg3 = docDialog();
    var dcSau = docDC(dlg3);
    if (dcSau === null) dcSau = docDCLocal();
    if (dcSau !== null && dcTruoc !== null && dcSau > dcTruoc) {
      log('Nộp ' + t.ten + ' xong: DC ' + dcTruoc + ' → ' + dcSau + ' (+' + (dcSau - dcTruoc) + ').');
    }
    // Nộp xong game tự mở Quầy Đổi Hạt — đóng lại ngay, KHÔNG đổi gì.
    // (Để mở sẽ làm vòng sau đọc nhầm hộp thoại thành menu Đại Phu.)
    if (dialogMo()) { dongDialog(); await sleep(300); }
    return { ok: true, dcMoi: dcSau };
  }
  // Huỷ việc đang giữ tại Đại Phu (miễn phí, hoàn lượt). Trả true/false.
  async function huyViec() {
    var ok = await moHopThoaiDaiPhu();
    if (!ok) return false;
    var r = bamLuaChon(/Huỷ Nhiệm Vụ|Hủy Nhiệm Vụ/);
    if (!r) return false;
    await sleep(CFG.afterActionMs);
    // Hộp thoại xác nhận huỷ: "Xác Nhận Huỷ" là nút LỰA CHỌN (.btn-choice),
    // không phải nút hành động (xác minh game.js 25/11).
    var r2 = bamLuaChon(/Xác Nhận Huỷ/);
    if (r2) {
      await sleep(CFG.afterActionMs);
    } else {
      // Dự phòng: hộp thoại xác nhận dạng nút hành động.
      var dlg = docDialog();
      if (dlg && /xác nhận/i.test((dlg.text || '') + ' ' + (dlg.title || ''))) {
        bamNutHanhDong(/Đồng ý|Xác nhận|Huỷ|Hủy/i);
        await sleep(CFG.afterActionMs);
      }
    }
    return !docTracker();
  }

  // ================= VÒNG LẶP CHÍNH =================
  // Luồng: đi về Đại Phu (tự lái) → mở thoại → (đang giữ việc thường: tiếp
  // tục làm; đang giữ Đại Hội/Tán Tu: tự huỷ rồi nhận việc thường; đang giữ
  // Vận Tiêu: DỪNG báo rõ; việc lạ: DỪNG báo rõ) → Trúc Cơ: bật bộ máy
  // "Tự Đi" của game (autopilot làm hết lượt, tool chỉ chờ) — nếu không bật
  // được thì làm tay như Luyện Khí → Luyện Khí: nhận việc tốt nhất theo DC
  // → làm (lamViecTuDi: bấm bước nhiệm vụ → chờ Tương Tác → bấm #btn-attack;
  // kẹt thì lamViecThuCong) → nộp (hộ tống thì công tự ghi tại chỗ, không nộp)
  // → lặp tới khi hết lượt / hết giờ / dừng tay.
  // Cổng HP: <50% không nhận việc (phase cho_hoi: thiền chờ hồi ≥60% rồi
  // tiếp tục); <35% dừng ngay.
  async function vongLapChinh() {
    var tok = steerToken;
    while (on && tok === steerToken) {
      // --- Phase: đi về Đại Phu ---
      if (!ganDaiPhu()) {
        phase = 'di_dai_phu';
        log('Đang đi về Đại Phu (Thảo Dược Cốc)…');
        var okMap = await diToiMap('duoc_vien');
        if (!on || tok !== steerToken) return;
        if (!okMap) { setOn(false); log('Không về được Thảo Dược Cốc — đã dừng. Kiểm tra tay rồi bấm BẬT lại.'); return; }
        var rDi = await diToi(DAI_PHU_DUNG.x, DAI_PHU_DUNG.y);
        if (!on || tok !== steerToken) return;
        if (!rDi) { setOn(false); log('Không tới được ô cạnh Đại Phu (' + DAI_PHU_DUNG.x + ',' + DAI_PHU_DUNG.y + ') — đã dừng. Kiểm tra tay rồi bấm BẬT lại.'); return; }
      }
      // --- Phase: mở thoại Đại Phu ---
      phase = 'cho_dai_phu';
      var okDlg = await moHopThoaiDaiPhu();
      if (!on || tok !== steerToken) return;
      if (!okDlg) { setOn(false); log('Không mở được thoại Đại Phu — đã dừng. Bấm tay vào Đại Phu rồi bấm BẬT lại.'); return; }
      var dlg = docDialog();
      if (!dlg) { setOn(false); log('Thoại Đại Phu đóng bất ngờ — đã dừng.'); return; }
      // --- Cổng HP: <50% không nhận việc ---
      var h = docHP();
      if (h && h.tiLe < CFG.hpNhanViec) {
        phase = 'cho_hoi';
        log('Khí Huyết ' + h.cur + '/' + h.max + ' (' + Math.round(h.tiLe * 100) + '%) < 50% — chờ hồi ≥60% rồi mới nhận việc.');
        // Thiền chờ hồi: bật thiền (nếu có nút), chờ tới ≥60% hoặc 5 phút.
        var bMed = $('#btn-meditate-touch');
        if (bMed) tap(bMed);
        var tHoi = Date.now();
        while (on && tok === steerToken) {
          await sleep(2000);
          var h2 = docHP();
          if (h2 && h2.tiLe >= CFG.hpHoiXong) break;
          if (Date.now() - tHoi > CFG.choHoiMs) {
            setOn(false); log('Chờ hồi máu quá 5 phút vẫn <60% — đã dừng.'); return;
          }
        }
        if (!on || tok !== steerToken) return;
        log('Đã hồi đủ máu — tiếp tục nhận việc.');
        continue;
      }
      // Nhận biết cảnh giới từ hộp thoại Đại Phu (chắc chắn hơn đoán từ chữ
      // trong trang lúc tải): nút "Tự Đi" chỉ mở ở Trúc Cơ Sơ Kỳ trở lên.
      // Đọc TRƯỚC khi xử lý việc đang giữ để Trúc Cơ dùng bộ máy "Tự Đi"
      // làm nốt việc giữ (canAutoSeed cho phép khi đang giữ việc thường —
      // game.js 25/11), không làm tay.
      var dlgRealm = docDialog();
      var cTD = dlgRealm ? timLuaChon(dlgRealm, /Tự Đi Làm Việc Dược Công/) : null;
      if (cTD) realm = cTD.disabled ? 'luyen_khi' : 'truc_co';
      // --- Việc đang giữ: tiếp tục / huỷ / dừng ---
      var dangGiu = docViecDangGiu();
      if (dangGiu) {
        if (dangGiu.kind === 'convoy') {
          setOn(false); log('Đang giữ việc Vận Tiêu (' + dangGiu.ten + ') — đã trả phí 400 LT nên KHÔNG tự huỷ. Đã dừng, xử lý tay.'); return;
        }
        if (dangGiu.kind === 'tournament' || dangGiu.kind === 'chien_bang') {
          log('Đang giữ việc ' + dangGiu.ten + ' — tự huỷ (miễn phí, hoàn lượt) rồi nhận việc thường.');
          var okHuy = await huyViec();
          if (!on || tok !== steerToken) return;
          if (!okHuy) { setOn(false); log('Huỷ việc ' + dangGiu.ten + ' không được — đã dừng.'); return; }
          log('Đã huỷ ' + dangGiu.ten + ' — nhận việc thường.');
          // Mở lại thoại sau khi huỷ (hộp thoại có thể đã đóng).
          if (!dialogMo()) {
            var okDlg2 = await moHopThoaiDaiPhu();
            if (!on || tok !== steerToken) return;
            if (!okDlg2) { setOn(false); log('Không mở lại được thoại Đại Phu sau khi huỷ việc — đã dừng.'); return; }
          }
          dlg = docDialog();
          var cTD2 = dlg ? timLuaChon(dlg, /Tự Đi Làm Việc Dược Công/) : null;
          if (cTD2) realm = cTD2.disabled ? 'luyen_khi' : 'truc_co';
        } else if (TASKS[dangGiu.id]) {
          // Việc thường đang giữ → TIẾP TỤC LÀM (không nhận việc mới).
          if (realm === 'truc_co') {
            // Trúc Cơ: để bộ máy "Tự Đi" làm nốt việc đang giữ rồi làm tiếp
            // các lượt còn lại — rơi xuống nhánh Trúc Cơ bên dưới, không làm tay.
            log('Tiếp tục làm việc đang giữ: ' + dangGiu.ten + ' — dùng bộ máy "Tự Đi".');
          } else {
          log('Tiếp tục làm việc đang giữ: ' + dangGiu.ten + '.');
          phase = 'lam_viec';
          var resTiep = await lamViecTuDi(dangGiu.id);
          if (!on || tok !== steerToken) return;
          if (!resTiep.ok) {
            // lamViecTuDi kẹt → thử làm tay 1 lần (fallback v1.1.2).
            if (resTiep.reason === 'ket') {
              log('Chế độ "Tự Đi" kẹt — thử làm tay (fallback v1.1.2)…');
              var resTay = await lamViecThuCong(dangGiu.id);
              if (!on || tok !== steerToken) return;
              if (!resTay.ok) { setOn(false); log(resTay.msg || 'Làm việc thất bại — đã dừng.'); return; }
              resTiep = resTay;
            } else {
              setOn(false); log(resTiep.msg || 'Làm việc thất bại — đã dừng.'); return;
            }
          }
          // Nộp việc (hộ tống thì công đã tự ghi khi giao cho Thầy Ông Nội —
          // không cần về Đại Phu nộp).
          if (resTiep.daNop) {
            luotDaLam++;
            var dcHT = docDCLocal();
            if (dcHT !== null) G.dc = dcHT;
            else G.dc += TASKS[dangGiu.id].dc;
            log('Xong việc ' + dangGiu.ten + ' (+' + TASKS[dangGiu.id].dc + ' DC, công tự ghi). Tổng lượt đã làm: ' + luotDaLam + '.');
            continue;
          }
          phase = 'nop_viec';
          var resNop = await nopViec(dangGiu.id);
          if (!on || tok !== steerToken) return;
          if (!resNop.ok) { setOn(false); log(resNop.msg || 'Nộp việc thất bại — đã dừng.'); return; }
          luotDaLam++;
          if (resNop.dcMoi !== null && resNop.dcMoi !== undefined) G.dc = resNop.dcMoi;
          else G.dc += TASKS[dangGiu.id].dc;
          log('Xong việc ' + dangGiu.ten + ' (+' + TASKS[dangGiu.id].dc + ' DC). Tổng lượt đã làm: ' + luotDaLam + '.');
          continue;
          } // else: Luyện Khí làm tay việc đang giữ
        } else {
          setOn(false); log('Đang giữ việc lạ: ' + dangGiu.ten + ' — không nhận diện được, đã dừng để xử lý tay.'); return;
        }
      }
      // --- Trúc Cơ: dùng bộ máy "Tự Đi" của game (autopilot làm hết lượt) ---
      // (Cảnh giới đã nhận biết ở trên, trước nhánh việc đang giữ; việc
      // Đại Hội/Tán Tu vừa huỷ xong thì nhận biết lại ngay sau khi huỷ.)
      // Bộ máy tự nhận việc, tự đi, tự hái/câu/chặt, tự giao hộ tống, tự về
      // nộp — tool chỉ chờ thụ động, KHÔNG chạm màn hình (chạm là dừng máy).
      // Chỉ khi không bật được bộ máy (nút khoá) mới rơi xuống làm tay.
      if (realm === 'truc_co') {
        phase = 'tu_di';
        var resTuDi = await chayTuDiTuDong();
        if (!on || tok !== steerToken) return;
        if (resTuDi.ok) {
          // Đếm lại lượt đã làm từ lượt còn trong danh sách việc.
          var dcTruocXong = resTuDi.dcTruoc, dcSauXong = resTuDi.dcSau;
          if (dcSauXong !== null && dcTruocXong !== null) G.dc = dcSauXong;
          luotDaLam = TONG_LUOT_NGAY; // "Xong việc Dược Công hôm nay" = hết 15 lượt thường
          log('Xong dược hôm nay — bộ máy "Tự Đi" đã làm hết lượt (DC ' + dcTruocXong + ' → ' + dcSauXong + ').');
          setOn(false);
          return;
        }
        if (resTuDi.reason === 'khong_co_tu_di') {
          log('Không bật được bộ máy "Tự Đi" — chuyển sang làm tay theo vòng code gửi.');
        } else {
          setOn(false); log(resTuDi.msg || 'Bộ máy "Tự Đi" thất bại — đã dừng.'); return;
        }
      }
      // --- Nhận việc mới tốt nhất ---
      dlg = docDialog();
      if (!dlg) {
        var okDlg3 = await moHopThoaiDaiPhu();
        if (!on || tok !== steerToken) return;
        if (!okDlg3) { setOn(false); log('Không mở được thoại Đại Phu để nhận việc — đã dừng.'); return; }
        dlg = docDialog();
      }
      phase = 'nhan_viec';
      var nhan = await nhanViecTotNhat(dlg);
      if (!on || tok !== steerToken) return;
      if (!nhan.ok) {
        if (nhan.reason === 'hp_thap') {
          phase = 'cho_hoi';
          log(nhan.msg);
          // Chờ hồi rồi lặp lại (vòng lặp sẽ tự kiểm tra HP ở đầu).
          var bMed2 = $('#btn-meditate-touch');
          if (bMed2) tap(bMed2);
          var tHoi2 = Date.now();
          while (on && tok === steerToken) {
            await sleep(2000);
            var h3 = docHP();
            if (h3 && h3.tiLe >= CFG.hpHoiXong) break;
            if (Date.now() - tHoi2 > CFG.choHoiMs) { setOn(false); log('Chờ hồi máu quá 5 phút vẫn <60% — đã dừng.'); return; }
          }
          if (!on || tok !== steerToken) return;
          continue;
        }
        setOn(false); log(nhan.msg || 'Không nhận được việc — đã dừng.'); return;
      }
      log('Đã nhận việc: ' + nhan.ten + ' (+' + nhan.dc + ' DC).');
      // --- Làm việc (vòng code gửi: bấm bước nhiệm vụ → chờ Tương Tác → bấm #btn-attack) ---
      phase = 'lam_viec';
      var resLam = await lamViecTuDi(nhan.id);
      if (!on || tok !== steerToken) return;
      if (!resLam.ok && resLam.reason === 'ket') {
        log('Vòng "Tự Đi" kẹt — thử làm tay (fallback v1.1.2)…');
        var resTay2 = await lamViecThuCong(nhan.id);
        if (!on || tok !== steerToken) return;
        if (!resTay2.ok) { setOn(false); log(resTay2.msg || 'Làm việc thất bại — đã dừng.'); return; }
        resLam = resTay2;
      }
      if (!resLam.ok) { setOn(false); log(resLam.msg || 'Làm việc thất bại — đã dừng.'); return; }
      // --- Nộp việc (hộ tống thì công đã tự ghi khi giao cho Thầy Ông Nội) ---
      if (resLam.daNop) {
        luotDaLam++;
        var dcLN = docDCLocal();
        if (dcLN !== null) G.dc = dcLN;
        else G.dc += nhan.dc;
        log('Xong việc ' + nhan.ten + ' (+' + nhan.dc + ' DC, công tự ghi). Tổng lượt đã làm: ' + luotDaLam + '.');
        continue;
      }
      phase = 'nop_viec';
      var resNop2 = await nopViec(nhan.id);
      if (!on || tok !== steerToken) return;
      if (!resNop2.ok) { setOn(false); log(resNop2.msg || 'Nộp việc thất bại — đã dừng.'); return; }
      luotDaLam++;
      if (resNop2.dcMoi !== null && resNop2.dcMoi !== undefined) G.dc = resNop2.dcMoi;
      else G.dc += nhan.dc;
      log('Xong việc ' + nhan.ten + ' (+' + nhan.dc + ' DC). Tổng lượt đã làm: ' + luotDaLam + '.');
    }
  }

  // ---------------- Kết thúc phiên ----------------
  function ketThuc() {
    var dcSau = docDCLocal();
    var gain = (dcSau !== null && dcLocalLucBatDau !== null) ? (dcSau - dcLocalLucBatDau) : null;
    if (gain !== null) log('Kết thúc: DC local ' + dcLocalLucBatDau + ' → ' + dcSau + ' (tăng ' + gain + ').');
    else log('Kết thúc: đã làm ' + luotDaLam + ' lượt việc.');
  }

  // ---------------- Tiếp tục việc đang giữ (nút phụ) ----------------
  // Bật tool rồi làm NGAY việc đang giữ (không qua Đại Phu nhận việc mới).
  // Dùng khi acc đã nhận việc trước rồi mới bật tool.
  async function tiepTucViecDangGiu() {
    var v = docViecDangGiu();
    if (!v || !TASKS[v.id]) {
      // Nút TIẾP TỤC chỉ để làm nốt việc đang giữ — không có việc giữ thì
      // chỉ báo rõ, KHÔNG tự bật vòng dược (bấm BẬT để chạy vòng tự động).
      log('Không thấy việc thường đang giữ — bấm BẬT để chạy vòng dược tự động.');
      return;
    }
    log('Tiếp tục làm việc đang giữ: ' + v.ten + '.');
    // Trúc Cơ: vòng lặp chính sẽ bật bộ máy "Tự Đi" (nó làm nốt việc đang
    // giữ trước rồi làm tiếp các lượt còn lại) — chỉ cần BẬT, không làm tay.
    // Cảnh giới chưa biết (realm=null, chưa đọc menu Đại Phu) cũng BẬT để
    // vòng chính nhận biết rồi rẽ nhánh đúng — chỉ làm tay khi ĐÃ BIẾT là
    // Luyện Khí (tránh acc Trúc Cơ làm tay vì đoán nhầm cảnh giới).
    if (realm !== 'luyen_khi') { setOn(true); return; }
    // Luyện Khí: làm tay việc đang giữ rồi giao cho vòng lặp chính.
    // (Tự bật cờ on/token như setOn nhưng KHÔNG gọi vongLapChinh — tránh
    // chạy 2 vòng lặp song song.)
    on = true;
    steerToken++;
    steerMethod = null;
    flyingBelief = false; flySpeedChecked = false; flyRetryDone = false;
    flySpeedMeasured = null; flySpeedFirst = null; flyMeas = null;
    camAnchor = null;
    dcLocalLucBatDau = docDCLocal();
    capNhatPanel();
    var res = await lamViecTuDi(v.id);
    if (!res.ok && res.reason === 'ket') {
      log('Vòng "Tự Đi" kẹt — thử làm tay (fallback v1.1.2)…');
      res = await lamViecThuCong(v.id);
    }
    if (!res.ok) { setOn(false); log(res.msg || 'Làm việc thất bại — đã dừng.'); return; }
    if (res.daNop) {
      luotDaLam++;
      var dcTT = docDCLocal();
      if (dcTT !== null) G.dc = dcTT;
      else G.dc += TASKS[v.id].dc;
      log('Xong việc ' + v.ten + ' (+' + TASKS[v.id].dc + ' DC, công tự ghi). Tiếp tục vòng dược tự động.');
      vongLapChinh();
      return;
    }
    var resNop = await nopViec(v.id);
    if (!resNop.ok) { setOn(false); log(resNop.msg || 'Nộp việc thất bại — đã dừng.'); return; }
    luotDaLam++;
    if (resNop.dcMoi !== null && resNop.dcMoi !== undefined) G.dc = resNop.dcMoi;
    else G.dc += TASKS[v.id].dc;
    log('Xong việc ' + v.ten + ' (+' + TASKS[v.id].dc + ' DC). Tiếp tục vòng dược tự động.');
    vongLapChinh();
  }

  // ---------------- Bật/tắt tool ----------------
  function setOn(bat) {
    on = !!bat;
    if (bat) {
      steerToken++; // vô hiệu hoá mọi đợt lái / vòng lặp cũ
      steerMethod = null; // dò lại cách lái cho phiên mới
      flyingBelief = false; flySpeedChecked = false; flyRetryDone = false;
      flySpeedMeasured = null; flySpeedFirst = null; flyMeas = null;
      camAnchor = null;
      dcLocalLucBatDau = docDCLocal();
      log('BẬT tool Dược v1.2.1 — tự đi tới Đại Phu từ bất cứ đâu, làm việc thường, nộp, lặp.');
      vongLapChinh();
    } else {
      steerToken++; // dừng mọi đợt lái / vòng lặp đang chạy
      releaseAllInputs();
      phase = 'dung';
      ketThuc();
      log('Đã DỪNG tool Dược.');
    }
    capNhatPanel();
  }

  // ================= PANEL =================
  // CSS cho panel: cố định góc phải, z-index cao để nằm TRÊN canvas game
  // (canvas phủ toàn màn hình — panel không có position/z-index sẽ bị canvas
  // đè và không bấm được, như test (a) đã bắt được). Gọn nhẹ, thu nhỏ được.
  function themCssPanel() {
    if (document.getElementById('tt2d-duoc-style')) return;
    var st = document.createElement('style');
    st.id = 'tt2d-duoc-style';
    st.textContent = [
      '#tt2d-duoc-panel{position:fixed;right:12px;top:12px;z-index:99999;',
      'font:12px/1.5 system-ui,sans-serif;color:#e8dfc0;background:rgba(20,28,20,.92);',
      'border:1px solid #6b5a2e;border-radius:8px;padding:6px 8px;max-width:230px;user-select:none}',
      '#tt2d-duoc-panel .tt2d-duoc-head{display:flex;justify-content:space-between;align-items:center;cursor:move;font-weight:700}',
      '#tt2d-duoc-panel .tt2d-duoc-mini{background:none;border:1px solid #6b5a2e;color:#e8dfc0;border-radius:4px;width:22px;height:22px;cursor:pointer}',
      '#tt2d-duoc-panel .tt2d-duoc-row{margin:2px 0}',
      '#tt2d-duoc-panel .tt2d-duoc-label{color:#b8ac7e}',
      '#tt2d-duoc-panel .tt2d-duoc-btns{display:flex;gap:4px;margin-top:6px}',
      '#tt2d-duoc-panel .tt2d-duoc-btn{flex:1;border:1px solid #6b5a2e;border-radius:4px;background:#2a3a24;color:#e8dfc0;padding:4px 2px;cursor:pointer;font-size:11px}',
      '#tt2d-duoc-panel .tt2d-duoc-log{max-height:120px;overflow-y:auto;margin-top:6px;font-size:11px;color:#c9bd8a;border-top:1px solid #3a3a28;padding-top:4px}',
    ].join('');
    document.head.appendChild(st);
  }
  function taoPanel() {
    if ($('#tt2d-duoc-panel')) return;
    themCssPanel();
    var p = document.createElement('div');
    p.id = 'tt2d-duoc-panel';
    p.innerHTML =
      '<div class="tt2d-duoc-head">' +
        '<span class="tt2d-duoc-title">🌿 Dược Công <span class="tt2d-duoc-ver">v1.2.1</span></span>' +
        '<button type="button" class="tt2d-duoc-mini" data-act="thu-nho" title="Thu nhỏ">–</button>' +
      '</div>' +
      '<div class="tt2d-duoc-body" id="tt2d-duoc-body">' +
        '<div class="tt2d-duoc-row"><span class="tt2d-duoc-label">Trạng thái:</span> <span id="tt2d-duoc-trangthai">Tắt</span></div>' +
        '<div class="tt2d-duoc-row"><span class="tt2d-duoc-label">Việc:</span> <span id="tt2d-duoc-viec">—</span></div>' +
        '<div class="tt2d-duoc-row"><span class="tt2d-duoc-label">DC:</span> <span id="tt2d-duoc-dc">—</span></div>' +
        '<div class="tt2d-duoc-row"><span class="tt2d-duoc-label">Lượt đã làm:</span> <span id="tt2d-duoc-luot">0</span></div>' +
        '<div class="tt2d-duoc-row"><span class="tt2d-duoc-label">Lái:</span> <span id="tt2d-duoc-lai">—</span></div>' +
        '<div class="tt2d-duoc-row tt2d-duoc-btns">' +
          '<button type="button" class="tt2d-duoc-btn tt2d-duoc-bat" data-act="bat">BẬT</button>' +
          '<button type="button" class="tt2d-duoc-btn tt2d-duoc-dung" data-act="dung">DỪNG</button>' +
          '<button type="button" class="tt2d-duoc-btn tt2d-duoc-tiep" data-act="tiep-tuc">TIẾP TỤC VIỆC ĐÃ NHẬN</button>' +
        '</div>' +
        '<div class="tt2d-duoc-log" id="tt2d-duoc-log"></div>' +
      '</div>';
    Tong.tabBody('duoc').appendChild(p);
    p.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'bat') setOn(true);
      else if (act === 'dung') setOn(false);
      else if (act === 'tiep-tuc') tiepTucViecDangGiu();
      else if (act === 'thu-nho') {
        var body = p.querySelector('.tt2d-duoc-body');
        var mini = p.querySelector('[data-act="thu-nho"]');
        var thuNho = body.style.display !== 'none';
        body.style.display = thuNho ? 'none' : '';
        mini.textContent = thuNho ? '+' : '–';
        mini.title = thuNho ? 'Mở rộng' : 'Thu nhỏ';
      }
    });
    // Kéo panel bằng tiêu đề (trừ nút thu nhỏ).
    var head = p.querySelector('.tt2d-duoc-head');
    var dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    head.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      var r = p.getBoundingClientRect();
      ox = r.left; oy = r.top;
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      p.style.left = (ox + e.clientX - sx) + 'px';
      p.style.top = (oy + e.clientY - sy) + 'px';
      p.style.right = 'auto';
    });
    head.addEventListener('pointerup', function () { dragging = false; });
  }
  function capNhatPanel() {
    var st = $('#tt2d-duoc-trangthai');
    if (st) st.textContent = on ? ('Đang chạy — ' + phase) : 'Tắt';
    var v = $('#tt2d-duoc-viec');
    if (v) {
      var dg = docViecDangGiu();
      v.textContent = dg ? dg.ten : '—';
    }
    var dc = $('#tt2d-duoc-dc');
    if (dc) {
      var dcl = docDCLocal();
      dc.textContent = (dcl !== null) ? dcl : (G.dc !== null ? G.dc : '—');
    }
    var lu = $('#tt2d-duoc-luot');
    if (lu) lu.textContent = String(luotDaLam);
    var lai = $('#tt2d-duoc-lai');
    if (lai) {
      var s = steerMethod ? steerMethod : '—';
      if (flySpeedMeasured !== null) s += ' · bay ~' + flySpeedMeasured.toFixed(1) + ' ô/s';
      lai.textContent = s;
    }
  }
  function status() {
    return {
      version: '1.2.1', on: on, phase: phase, realm: realm,
      dc: docDCLocal(), dcLocal: docDCLocal(), luotDaLam: luotDaLam,
      viecDangGiu: docViecDangGiu(),
      pos: docViTri(), hp: docHP(),
      steerMethod: steerMethod, flyingBelief: flyingBelief,
      flySpeedFirst: flySpeedFirst, flySpeedMeasured: flySpeedMeasured,
      flyRetried: flyRetryDone,
    };
  }

  // ================= KHỞI TẠO =================
  function khoiTao() {
    patchPointerCapture();
    // Nhận biết cảnh giới từ tracker / hộp thoại / body (Trúc Cơ có nút
    // "Tự Đi Làm Việc Dược Công" trong hộp thoại Đại Phu).
    var t = document.body ? (document.body.innerText || '') : '';
    if (/Trúc Cơ/.test(t)) realm = 'truc_co';
    else if (/Luyện Khí/.test(t)) realm = 'luyen_khi';
    // Dừng tool khi người dùng chạm/phím THẬT (isTrusted) ngoài panel —
    // tool chỉ dừng, không làm gì thêm (tránh tranh quyền điều khiển).
    document.addEventListener('pointerdown', function (e) {
      if (!on) return;
      if (!e.isTrusted) return;
      if (e.target && e.target.closest && e.target.closest('#tt2d-duoc-panel')) return;
      log('Phát hiện chạm/phím thật — đã dừng tool.');
      setOn(false);
    }, true);
    document.addEventListener('keydown', function (e) {
      if (!on) return;
      if (!e.isTrusted) return;
      if (e.target && e.target.closest && e.target.closest('#tt2d-duoc-panel')) return;
      log('Phát hiện phím thật — đã dừng tool.');
      setOn(false);
    }, true);
    taoPanel();
    capNhatPanel();
    // Cập nhật panel mỗi 2s (trạng thái, DC, việc đang giữ, cách lái).
    setInterval(capNhatPanel, 2000);
    log('Tool Dược v1.2.1 đã tải. Bấm BẬT để tự đi tới Đại Phu và làm việc thường.');
  }
  // Debug handle (mở cho test smoke + kiểm tra tay).
  window.__TT2D_DUOC__ = {
    version: '1.2.1',
    _cfg: CFG,
    status: status,
    setOn: setOn,
    tiepTucViecDangGiu: tiepTucViecDangGiu,
    // Lái (cho test):
    steerToCell: steerToCell, travelTo: travelTo, diToi: diToi, diToiMap: diToiMap,
    detectSteerMethod: detectSteerMethod,
    docViTri: docViTri, docMapId: docMapId, docHP: docHP, docDCLocal: docDCLocal,
    // Dược (cho test):
    tapNpc: tapNpc, moHopThoaiDaiPhu: moHopThoaiDaiPhu, clickQuestStep: clickQuestStep,
    batTuDi: batTuDi, chayTuDiTuDong: chayTuDiTuDong,
    nhanViecTotNhat: nhanViecTotNhat, lamViecTuDi: lamViecTuDi, lamViecThuCong: lamViecThuCong,
    quetNhat: quetNhat, nopViec: nopViec, huyViec: huyViec,
    docViecDangGiu: docViecDangGiu, docTienDo: docTienDo, docDC: docDC,
    laViecCam: laViecCam,
    docDialog: docDialog, docTracker: docTracker,
    // Nút (cho test):
    datAuto: datAuto, datFly: datFly, datRun: datRun, pressFlyKey: pressFlyKey,
    autoDangBat: autoDangBat, flyDangBat: flyDangBat,
    get steerMethod() { return steerMethod; },
    get on() { return on; },
    get phase() { return phase; },
    get luotDaLam() { return luotDaLam; },
    get flySpeedFirst() { return flySpeedFirst; },
    setRealm: function (r) { realm = r; },
    setFlySpeedChecked: function (v) { flySpeedChecked = v; },
  };
  khoiTao();
    Tong.register('duoc', window.__TT2D_DUOC__);
    window.__TT2D_DUOC__.start = function () { window.__TT2D_DUOC__.setOn(true); };
    window.__TT2D_DUOC__.stop = function () { window.__TT2D_DUOC__.setOn(false); };
    (function () {
      var _duocStatus = window.__TT2D_DUOC__.status;
      window.__TT2D_DUOC__.status = function () {
        var st = _duocStatus ? _duocStatus.call(this) : {};
        var dl = (st && typeof st.luotDaLam === 'number') ? st.luotDaLam : 0;
        var ids = ['cau_ca', 'duoc_moc', 'ho_tong_chau', 'truc_gia', 'linh_chi'];
        var con = {};
        for (var i = 0; i < ids.length; i++) con[ids[i]] = Math.max(0, 15 - dl);
        st.luotConLai = con;
        return st;
      };
    })();
    window.__TT2D_DUOC__.setCollapsed = function (v) {
      var panel = document.querySelector('#tt2d-duoc-panel');
      if (!panel) return;
      var head = panel.querySelector('.tt2d-duoc-head');
      var bdy = panel.querySelector('#tt2d-duoc-body');
      var mini = panel.querySelector('#tt2d-duoc-mini');
      if (!mini) {
        mini = document.createElement('div');
        mini.id = 'tt2d-duoc-mini';
        mini.style.display = 'none';
        mini.innerHTML = '🌿 Dược Công <span id="tt2d-duoc-mini-status"></span> <button type="button" id="tt2d-duoc-expand" title="Mở rộng">＋</button>';
        panel.appendChild(mini);
        mini.querySelector('#tt2d-duoc-expand').addEventListener('click', function () { window.__TT2D_DUOC__.setCollapsed(false); });
      }
      var st = panel.querySelector('#tt2d-duoc-trangthai');
      var mst = mini.querySelector('#tt2d-duoc-mini-status');
      if (mst && st) mst.textContent = st.textContent || '';
      if (head) head.style.display = v ? 'none' : '';
      if (bdy) bdy.style.display = v ? 'none' : '';
      mini.style.display = v ? 'flex' : 'none';
    };


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

  // Token hủy di chuyển (v1.5.0 — sửa bug v1.4.0: farm.stop() không hủy
  // luồng diToiMap/diToi đang chạy dở, bấm DỪNG xong joystick vẫn đẩy
  // và Auto vẫn bị tắt sau đó). huyDiChuyen() tăng token; mọi hàm di
  // chuyển chụp token lúc bắt đầu và kiểm tra sau mỗi await — token đổi
  // thì dừng ngay, trả false, KHÔNG đẩy joystick thêm.
  var huyToken = 0;
  function huyDiChuyen() { huyToken++; return huyToken; }
  function biHuy(tok) { return tok !== huyToken; }

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
      // Map sự kiện/phó bản (không có cổng đi bộ — xem lyDoKhongDuong):
      // Tam Lộ (map id động theo trận, HUD hiện "Tam Lộ"), Đại Hội
      // (phòng chờ/sân đấu), Vạn Hoang (Chiến Trường), Yên Lãng Sơn,
      // Lâm Lang. Nhận diện để báo đúng lý do thay vì "không rõ map".
      if (/Tam Lộ/.test(s)) return 'tam_lo';
      if (/Đại Hội/.test(s)) return 'dai_hoi_cho';
      if (/Vạn Hoang|Chiến Trường/.test(s)) return 'chien_truong';
      if (/Yên Lãng/.test(s)) return 'yen_lang';
      if (/Lâm Lang|Lam Lang/.test(s)) return 'lam_lang';
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
  // v1.5.2 (lệnh Thanh 22:45 25/11) — NGUYÊN NHÂN GỐC vụ "tool không tự
  // động di chuyển nhân vật": joyHold cũ dispatch PointerEvent giả lên
  // #joystick, nhưng handler joystick của game gọi setPointerCapture(
  // pointerId) KHÔNG try/catch — với pointerId giả (12345) Chrome throw
  // NotFoundError (đã xác minh bằng Playwright 22:45), state kéo (s)
  // không bao giờ được set, h(t) ở pointermove đọc s null cũng throw,
  // nên nhân vật KHÔNG NHÚC NHÍCH (diToi cứ đẩy 60 nhịp rồi báo kẹt).
  // Cách sửa: lái TRỰC TIẾP qua Input.setJoystick(x, y, active) của
  // game (client: joy.x/y chuẩn hoá, clamp |v|<=1, active=true để đi,
  // (0,0,false) để dừng) — không qua DOM event nữa. Chỉ fallback về
  // dispatch PointerEvent khi không đọc được Input.
  function joyHold(dx, dy, ms) {
    var IN = null;
    try { IN = window.__ns_ && window.__ns_.Input; } catch (e) { IN = null; }
    if (IN && typeof IN.setJoystick === 'function') {
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      try { IN.setJoystick(dx / len, dy / len, true); } catch (e) { return Promise.resolve(false); }
      return new Promise(function (resolve) {
        setTimeout(function () {
          try { IN.setJoystick(0, 0, false); } catch (e) {}
          setTimeout(function () { resolve(true); }, CFG_NAV.joyWaitMs);
        }, ms);
      });
    }
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
    var tok = huyToken; // chụp token hủy lúc bắt đầu (v1.5.0)
    // Joystick KHÔNG lái được khi đang bay (xác minh live 12:52 25/11) —
    // hạ cánh TRƯỚC khi đẩy joystick, nếu không 60 nhịp vẫn đứng yên.
    // (Trước đây chỉ quaCong hạ cánh; diToi gọi trực tiếp — tới biển KHU,
    // điểm thiền, điểm câu — thì không, nên kẹt ngay cả khi đã ở đúng map.)
    if (flyDangBat()) { datFly(false); await sleep(500); }
    if (biHuy(tok)) return false;
    var mapBatDau = docViTri().map;
    var vong = 0; // số lần đi vòng (đổi chiều mỗi lần)
    var last = null, ket = 0;
    for (var i = 0; i < maxBuoc; i++) {
      if (biHuy(tok)) return false;
      var p = docViTri();
      if (p.x === null) { await sleep(2000); if (biHuy(tok)) return false; continue; }
      // Đổi map giữa chừng (vô tình bước lên ô cổng / Auto lạc qua cổng):
      // đích nằm ở map cũ nên dừng ngay — bên gọi (quaCongTai) tự nhận
      // ra đã qua cổng qua map đổi, không phí 60 nhịp đi lạc ở map mới.
      if (p.map && mapBatDau && p.map !== mapBatDau) return false;
      if (Math.abs(p.x - tx) <= 1 && Math.abs(p.y - ty) <= 1) return true;
      // Joystick không chạy khi Auto BẬT (vd nhân vật đang farm sẵn) — tắt
      // ngay từ nhịp đầu, và tắt lại nếu Auto tự bật lại giữa đường (vào combat).
      if (autoDangBat()) datAuto(false);
      // Chống kẹt (v1.5.1 — vụ net2 22:15 25/11: Thung Lũng (15,26) đi
      // cổng Mỏ (1,27): BFS có đường nhưng nhân vật không nhúc nhích
      // (kẹt cột đá/quái chắn), diToi cứ đẩy cùng hướng hết 60 nhịp rồi
      // báo "không tới được ô cổng". Trước đây chỉ nhánh không-lưới mới
      // có đếm kẹt + đi vòng; nay áp cho CẢ nhánh BFS: 3 nhịp liền không
      // đổi vị trí thì lệch vuông góc 1 nhịp, đổi chiều mỗi lần, tối đa
      // 4 lần đi vòng rồi mới chịu thua.
      if (last && last.x === p.x && last.y === p.y) {
        ket++;
        if (ket >= 3) {
          if (vong >= 4) return false;
          vong++;
          var dx = tx - p.x, dy = ty - p.y;
          // Lệch vuông góc, đổi chiều mỗi lần (không đẩy dài vào cùng chỗ).
          var sx = (vong % 2 === 1) ? 1 : -1;
          if (Math.abs(dx) >= Math.abs(dy)) await joyHold(0, sx * 40, CFG_NAV.joyHoldMs);
          else await joyHold(sx * 40, 0, CFG_NAV.joyHoldMs);
          if (biHuy(tok)) return false;
          ket = 0;
          continue;
        }
      } else ket = 0;
      last = { x: p.x, y: p.y };
      // Thử BFS trên lưới thật mỗi nhịp (lưới có thể đổi khi quái di chuyển).
      var grid = readWalkable();
      if (grid) {
        var path = bfsPath(grid, p.x, p.y, tx, ty);
        if (path && path.length) {
          var next = path[0];
          await joyHuong(next[0] - p.x, next[1] - p.y, CFG_NAV.joyHoldMs);
          if (biHuy(tok)) return false;
          continue;
        }
      }
      // Không có lưới / không có đường BFS → step_toward.
      await joyHuong(tx - p.x, ty - p.y, CFG_NAV.joyHoldMs);
      if (biHuy(tok)) return false;
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
    // Cổng (1,27) theo đúng MapData.portals client (label "Về Mỏ Linh
    // Thạch", spawn bên Mỏ (4,27)); dự phòng (2,27): đứng lùi 1 ô rồi
    // đẩy tây — bước lên (1,27) là cổng mở. Vụ net2 22:15 25/11 kẹt ở
    // (15,26) không tới được (1,27) (xem diToi chống kẹt v1.5.1).
    'thach_phong_thung_lung>mo_linh_thach': { x: 1, y: 27, dx: -1, dy: 0,
      fallback: { x: 2, y: 27, dx: -1, dy: 0 } },
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
    // BỔ SUNG v1.4.0 (tính năng 12, đối chiếu client 24/11): làng (22,4)
    // -> MTC là cổng TĨNH trong MapData.TAN_VIEN.portals (đi xuyên được,
    // không byHand). Trước đây thiếu cạnh này nên làng -> MTC phải vòng
    // qua Bãi Đá (10,0). CHƯA xác minh live — nếu đẩy không qua thì đường
    // dự phòng là làng -> Bãi Đá (39,14) rồi (10,0) bắc vào MTC; nếu live
    // xác minh thất bại thì XÓA cạnh này. Chiều ngược MTC -> làng (18,22)
    // vẫn KHÔNG thêm (v1.3.7: chưa xác minh live, BFS hay chọn làm đường
    // chính cho các đích khác).
    'tan_vien>dong_mach_ngam': { x: 22, y: 4, dx: 0, dy: -1 },
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
  // ---------------- Vì sao không có đường bộ (tính năng 12, v1.4.0) ----
  // duongDi trả null thì KHÔNG đoán, KHÔNG đi lạc: phân loại lý do + hướng
  // xử lý tay để tab Farm (và các tab khác) hiển thị rõ rồi DỪNG.
  // Map cô lập / sự kiện: đối chiếu client 24/11 — MapData.*.portals = []
  // hoặc không có key portals (TAM_LO id động theo trận, scope "match";
  // DAI_HOI_CHO/DAI_HOI_DAU/DAI_HOI_DOI, CHIEN_TRUONG (Vạn Hoang),
  // SAN_DAU_VIP, YEN_LANG_SON (id "yl_bia_chan"), LAM_LANG).
  // Map nào không nằm trong đồ thị CONG cũng coi là cô lập (kể cả map lạ
  // chưa biết — an toàn hơn là đoán).
  var MAP_CO_LAP = ['tam_lo', 'dai_hoi_cho', 'dai_hoi_dau', 'dai_hoi_doi',
    'chien_bang_dai', 'chien_truong', 'san_dau_vip', 'yen_lang',
    'yen_lang_son', 'yl_bia_chan', 'lam_lang'];
  // Tên hiển thị cho lý do (map lạ thì dùng id).
  var TEN_MAP_LYDO = {
    tam_lo: 'Tam Lộ', dai_hoi_cho: 'Đại Hội', dai_hoi_dau: 'Đại Hội',
    dai_hoi_doi: 'Đại Hội', chien_bang_dai: 'Chiến Bảng Đài',
    chien_truong: 'Vạn Hoang', san_dau_vip: 'Sân Đấu VIP',
    yen_lang: 'Yên Lãng Sơn', yen_lang_son: 'Yên Lãng Sơn',
    yl_bia_chan: 'Yên Lãng Sơn', lam_lang: 'Lâm Lang',
    huyet_xich: 'hầm Huyết Xích', hac_thi: 'Hắc Thị',
    rung_mang_xa: 'Rừng Mãng Xà', mach_dat_dong: 'Lòng Đất',
    dam_lay_boss: 'Đầm Lầy Boss'
  };
  function tenMapLyDo(id) { return TEN_MAP_LYDO[id] || id || '?'; }
  function trongDoThi(id) {
    if (!id) return false;
    return Object.keys(CONG).some(function (k) {
      var p = k.split('>');
      return p[0] === id || p[1] === id;
    });
  }
  // Trả {loai, tieuDe, huongDan} hoặc null khi CÓ đường bộ (không cần lý do).
  // loai: co_lap | trong_ham | can_quy_dien | dich_co_lap | khong_biet_map.
  // LƯU Ý: vào Hắc Thị CÓ cổng trong đồ thị nhưng cần Quỷ Diện — vẫn trả
  // lý do can_quy_dien để bên gọi chặn TRƯỚC khi đi (không đi 8 cổng rồi
  // mới kẹt ở cửa Hắc Thị).
  function lyDoKhongDuong(tuMap, toiMap) {
    if (!tuMap) {
      return { loai: 'khong_biet_map',
        tieuDe: 'Không đọc được map hiện tại',
        huongDan: 'HUD game chưa hiện tên map (nhân vật chưa vào game / phiên đã hết hạn). Đăng nhập lại rồi bấm lại Đi tới map farm.' };
    }
    if (tuMap === 'huyet_xich') {
      return { loai: 'trong_ham',
        tieuDe: 'Đang ở trong hầm Huyết Xích',
        huongDan: 'Hầm Huyết Xích không đi bộ ra map farm được — bấm "Rời" để ra khỏi hầm (hoặc đánh xong lượt hầm), về làng rồi bấm lại Đi tới map farm.' };
    }
    if (MAP_CO_LAP.indexOf(tuMap) >= 0 || !trongDoThi(tuMap)) {
      return { loai: 'co_lap',
        tieuDe: 'Đang ở ' + tenMapLyDo(tuMap) + ' — map không có cổng đi bộ',
        huongDan: 'Map này là phó bản/sự kiện, không có đường bộ ra ngoài. Bấm nút "Rời" trong trận/sự kiện (hoặc chờ hết trận), về làng rồi bấm lại Đi tới map farm. Đừng bấm farm khi còn trong trận.' };
    }
    if (toiMap === 'hac_thi') {
      return { loai: 'can_quy_dien',
        tieuDe: 'Vào Hắc Thị cần Quỷ Diện',
        huongDan: 'Cổng Hắc Phong Lĩnh -> Hắc Thị chỉ mở khi đang đeo Quỷ Diện. Mua/đeo Quỷ Diện rồi bấm lại Đi tới map farm (hoặc đi tay tới Cửa Ngầm (61,9) ở Hắc Phong Lĩnh).' };
    }
    if (MAP_CO_LAP.indexOf(toiMap) >= 0 || !trongDoThi(toiMap)) {
      return { loai: 'dich_co_lap',
        tieuDe: 'Không đi bộ tới ' + tenMapLyDo(toiMap) + ' được',
        huongDan: 'Map đích là phó bản/sự kiện, chỉ vào bằng đăng ký (Đại Hội / Vạn Hoang / Tam Lộ...) chứ không có đường bộ. Chọn map farm khác (Phong Địa / Thảo Dược Cốc / Bãi Đá / Hang Động).' };
    }
    if (tuMap === toiMap) return null;
    if (duongDi(tuMap, toiMap)) return null;
    return { loai: 'co_lap',
      tieuDe: 'Không có đường bộ từ ' + tenMapLyDo(tuMap) + ' tới ' + tenMapLyDo(toiMap),
      huongDan: 'Bảng cổng chưa có đường nối 2 map này. Đi tay về làng (hoặc map gần nhất có cổng) rồi bấm lại Đi tới map farm.' };
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
    var tok = huyToken; // chụp token hủy lúc bắt đầu (v1.5.0)
    lastGateFail = null;
    gateSteps = [];
    // Đang bay thì KHÔNG qua được cổng — hạ cánh TRƯỚC khi đẩy joystick.
    // (Vụ 07:29 25/11: datFly cũ dùng .click() là no-op nên Phi Hành vẫn
    // BẬT, nhân vật bay thì đẩy cổng mãi không qua, Farm báo nhầm thành
    // "không có đường". datFly nay dùng tap() nên hạ cánh thật.)
    if (flyDangBat()) { datFly(false); gateLog('Hạ cánh trước cổng ' + congKey + ' (Phi Hành đang BẬT).'); }
    await sleep(400);
    if (biHuy(tok)) return false;
    // Cổng chính rồi cổng dự phòng (nếu có) — vd tan_vien>mieu_hoang:
    // (0,12) theo literal client CHƯA xác minh live, (2,13) xác minh
    // live 08:35 25/11 (chặng net13 đẩy tây từ (2,13) ~4s qua được).
    var thu = [{ x: c.x, y: c.y, dx: c.dx, dy: c.dy, ten: 'chinh' }];
    if (c.fallback) thu.push({ x: c.fallback.x, y: c.fallback.y, dx: c.fallback.dx, dy: c.fallback.dy, ten: 'du_phong' });
    for (var t = 0; t < thu.length; t++) {
      var g = thu[t];
      gateLog('Thử cổng ' + congKey + ' (' + g.ten + '): ô (' + g.x + ',' + g.y + '), đẩy (' + g.dx + ',' + g.dy + ').');
      var ok = await quaCongTai(congKey, g, c);
      if (biHuy(tok)) return false; // bị hủy giữa chừng thì KHÔNG thử cổng dự phòng
      if (ok) { gateLog('Qua cổng ' + congKey + ' thành công (' + g.ten + ' ' + g.x + ',' + g.y + ').'); return true; }
    }
    gateLog('Không qua được cổng ' + congKey + ' sau ' + thu.length + ' vị trí thử.');
    return false;
  }
  // Đẩy 1 cổng tại 1 vị trí: đi tới ô cổng rồi đẩy (hoặc bấm tương tác
  // nếu byHand). Trả true nếu sang map mới, false + ghi lastGateFail.
  async function quaCongTai(congKey, g, c) {
    var tok = huyToken; // chụp token hủy lúc bắt đầu (v1.5.0)
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
      if (biHuy(tok)) return false;
      var pn = docViTri();
      if (pn.x === g.x && pn.y === g.y) break;
      if (pn.x === null) break;
      await joyHuong(g.x - pn.x, g.y - pn.y, CFG_NAV.joyHoldMs);
      if (biHuy(tok)) return false;
      // Nudge cũng có thể bước lên ô cổng -> map đổi -> qua cổng rồi.
      if (daQuaCong()) { gateLog('Đã qua cổng ' + congKey + ' lúc nudge tới ô cổng (map đổi ' + mapBatDau + ' -> ' + docViTri().map + ').'); return true; }
    }
    var mapCu = docViTri().map;
    gateLog('Đã tới ô cổng (' + g.x + ',' + g.y + '), map hiện tại: ' + (mapCu || '?') + '.');
    // Cổng byHand (vd Long Uyên (22,4) -> Hang Động): không đi xuyên được,
    // phải BẤM TƯƠNG TÁC tại ô cổng (phím E/Enter hoặc nút Tương Tác).
    if (c.byHand) {
      for (var j = 0; j < CFG_NAV.portalTries; j++) {
        if (biHuy(tok)) return false;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
        await sleep(600);
        if (biHuy(tok)) return false;
        var p0 = docViTri();
        if (p0.map && p0.map !== mapCu) return true;
        var b = document.querySelector('#btn-attack');
        if (b) { tap(b); await sleep(600); }
        if (biHuy(tok)) return false;
        var p1 = docViTri();
        if (p1.map && p1.map !== mapCu) return true;
      }
      lastGateFail = { cong: congKey, gateX: g.x, gateY: g.y, stage: 'by-hand', thu: g.ten, fly: flyDangBat(), auto: autoDangBat() };
      gateLog('Bấm tương tác ' + CFG_NAV.portalTries + ' lần ở (' + g.x + ',' + g.y + ') vẫn không qua cổng.');
      return false;
    }
    for (var i = 0; i < CFG_NAV.portalTries; i++) {
      if (biHuy(tok)) return false;
      if (autoDangBat()) datAuto(false); // đẩy cổng cũng cần Auto TẮT
      await joyHold(g.dx * 40, g.dy * 40, CFG_NAV.portalHoldMs);
      if (biHuy(tok)) return false;
      var p = docViTri();
      if (p.map && p.map !== mapCu) return true;
    }
    lastGateFail = { cong: congKey, gateX: g.x, gateY: g.y, stage: 'day-cong', thu: g.ten, fly: flyDangBat(), auto: autoDangBat() };
    gateLog('Đẩy cổng ' + CFG_NAV.portalTries + ' lần ở (' + g.x + ',' + g.y + ') vẫn không qua (Phi Hành ' + (flyDangBat() ? 'BẬT' : 'TẮT') + ', Auto ' + (autoDangBat() ? 'BẬT' : 'TẮT') + ').');
    return false;
  }
  async function diToiMap(toiMap) {
    lastRouteFail = null;
    var tok = huyToken; // chụp token hủy lúc bắt đầu (v1.5.0)
    if (autoDangBat()) datAuto(false); // xem diToi — Auto BẬT thì joystick đứng yên
    if (flyDangBat()) { datFly(false); await sleep(500); } // đang bay thì joystick không lái được (xem diToi)
    if (biHuy(tok)) return false;
    var p = docViTri();
    if (p.map === toiMap) return true;
    var duong = duongDi(p.map, toiMap);
    if (!duong) {
      lastRouteFail = { stage: 'khong-co-duong', from: p.map, to: toiMap,
        lyDo: lyDoKhongDuong(p.map, toiMap) };
      return false;
    }
    // Có đường trong đồ thị nhưng bị chặn bởi điều kiện (vd vào Hắc Thị
    // cần Quỷ Diện) — chặn TRƯỚC khi đi, khỏi đi 8 cổng rồi mới kẹt.
    var chan = lyDoKhongDuong(p.map, toiMap);
    if (chan) {
      lastRouteFail = { stage: 'khong-co-duong', from: p.map, to: toiMap, lyDo: chan };
      return false;
    }
    for (var i = 0; i < duong.length; i++) {
      if (biHuy(tok)) return false;
      var ok = await quaCong(duong[i].cong);
      if (biHuy(tok)) return false; // bị hủy giữa chừng thì KHÔNG đi cổng tiếp
      if (!ok) {
        var gf = lastGateFail;
        lastRouteFail = { stage: 'qua-cong', cong: duong[i].cong, from: p.map, to: toiMap,
          gate: gf ? { x: gf.gateX, y: gf.gateY, stage: gf.stage, thu: gf.thu } : null,
          fly: gf ? gf.fly : flyDangBat(), auto: gf ? gf.auto : autoDangBat() };
        return false;
      }
      await sleep(800);
      if (biHuy(tok)) return false;
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
    huyDiChuyen: huyDiChuyen,
    duongDi: duongDi,
    lyDoKhongDuong: lyDoKhongDuong,
    MAP_CO_LAP: MAP_CO_LAP,
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
  // Token hủy luồng (v1.5.0 — sửa bug v1.4.0: stop() không hủy luồng
  // diToiMap/diToi/thiền đang chạy dở). stop() tăng runToken + gọi
  // nav.huyDiChuyen(); runToTarget/thienHoiGiap chụp token lúc bắt đầu
  // và kiểm tra sau mỗi await — token đổi thì dừng ngay, KHÔNG bật lại
  // Auto/Phi Hành, KHÔNG đẩy joystick thêm.
  var runToken = 0;
  function biHuy(tok) { return tok !== runToken; }
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
    var tok = runToken; // chụp token hủy lúc bắt đầu (v1.5.0)
    setPhase('meditate', 'Giáp thấp — thiền hồi Giáp.');
    tatAuto();
    var n = nav();
    var vt = docViTri();
    var info = MAPS[vt.map] || null;
    // Về điểm an toàn của map hiện tại rồi mới thiền (tránh bị quái đánh).
    if (info && info.safe && n && typeof n.diToi === 'function') {
      try { await n.diToi(info.safe[0], info.safe[1], 60); } catch (e) { /* thiền tại chỗ */ }
      if (biHuy(tok)) return false;
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
      if (biHuy(tok)) return false; // đã bấm DỪNG giữa chừng — không bật lại gì
      var pct = docGiapPct();
      if (pct !== null && pct >= CFG.giapHoiPct) break;
      if (!dangThien()) bamThien(); // thiền bị ngắt thì ngồi lại
    }
    if (biHuy(tok)) return false;
    var pct2 = docGiapPct();
    log('Thiền xong — Giáp ' + (pct2 === null ? '?' : Math.round(pct2) + '%') + '. Bật lại Phi Hành + Auto.');
    setPhase('farming');
    await batBoFarm(); // bật lại Phi Hành (thiền làm tắt Phi Hành)
    return true;
  }

  // ---------------- Chạy tới đích: map -> khu -> bật farm ----------------
  async function runToTarget() {
    busy = true;
    var tok = runToken; // chụp token hủy lúc bắt đầu (v1.5.0)
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
        if (!on || biHuy(tok)) return; // đã bấm DỪNG giữa chừng
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
            // (a) Thật sự không có đường trong bảng — hiển thị RÕ lý do +
            // hướng xử lý tay (tính năng 12) rồi DỪNG, không đi lạc.
            var ld = rf.lyDo || null;
            if (ld) {
              log('[không-đường] ' + ld.tieuDe + ' — ' + ld.huongDan);
              setPhase('stuck', ld.tieuDe + '. ' + ld.huongDan);
            } else {
              setPhase('stuck', 'Không có đường tới ' + MAPS[target.map].ten + ' trong bảng đường (từ ' + (vt.map || '?') + ' — map này chưa có cổng đi).');
            }
          } else if (rf && rf.stage === 'qua-cong' && rf.gate && rf.gate.stage === 'di-toi') {
            // (b) Không đi tới được ô cổng (nhân vật kẹt ở đâu đó).
            setPhase('stuck', 'Không tới được ô cổng ' + rf.cong + ' (' + rf.gate.x + ',' + rf.gate.y + ') trên đường tới ' + MAPS[target.map].ten + ' — nhân vật kẹt, kiểm tra vị trí rồi thử lại.');
          } else if (rf && rf.stage === 'qua-cong') {
            // (c) Tới được ô cổng nhưng đẩy cổng không qua.
            var byHandHd = (rf.gate && rf.gate.stage === 'by-hand')
              ? ' — cổng này CẦN BẤM TƯƠNG TÁC TAY (vd Long Uyên (22,4) -> Hang Động: đứng ở (22,4), bấm phím E/Enter hoặc nút Tương Tác, rồi bấm lại Đi tới map farm)'
              : '';
            setPhase('stuck', 'Tới được ô cổng ' + rf.cong + ' (' + (rf.gate ? rf.gate.x + ',' + rf.gate.y : '?') + ') nhưng đẩy cổng không qua' + byHandHd + ' (Phi Hành ' + (rf.fly ? 'BẬT' : 'TẮT') + ', Auto ' + (rf.auto ? 'BẬT' : 'TẮT') + ') — kiểm tra tọa độ cổng / hạ cánh rồi thử lại.');
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
          if (!on || biHuy(tok)) return;
          var sg = info.sign[s];
          try { await n.diToi(sg[0], sg[1], 60); } catch (e) { /* thử biển sau */ }
          if (!on || biHuy(tok)) return;
          await sleep(600);
          if (!on || biHuy(tok)) return;
          if (!nutBangKhuHien() && !bangKhuMo()) continue;
          var r = await chonKhu(target.khu);
          if (!on || biHuy(tok)) return;
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
        if (!on || biHuy(tok)) return;
        if (!toi) {
          setPhase('stuck', 'Không tới được biển KHU / không mở được Bảng Khu ở ' + info.ten + '.');
          return;
        }
        log('Đã vào Khu ' + docKhu() + ' ' + info.ten + '.');
      } else {
        log(info.ten + ' chưa biết tọa độ biển KHU — farm tại khu hiện tại (Khu ' + (docKhu() === null ? '?' : docKhu()) + ').');
      }
      if (!on || biHuy(tok)) return;
      // Bật bộ 3 farm (Phi Hành bật cuối).
      var okFarm = await batBoFarm();
      if (!on || biHuy(tok)) return;
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
        '<div style="margin-top:6px;color:#9a8a6a;font-size:11px">Tự đi tới map + khu đã chọn từ BẤT KỲ map nào rồi bật Auto + Chạy + Phi Hành. Khu đầy thì thử khu dự phòng, không bấm liên tục. KHÔNG bấm Ghi danh tranh khu. Phiên hết hạn thì dừng — đăng nhập lại rồi bật lại. Map chưa biết biển KHU thì farm tại khu hiện tại. Không có đường bộ (đang trong phó bản/sự kiện) thì tool báo rõ lý do + cách xử lý tay rồi dừng, không đi lạc.</div>' +
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
      elGo.textContent = on ? 'DỪNG FARM' : 'ĐI TỚI MAP FARM';
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
    runToken++; // vô hiệu luồng cũ (nếu có) trước khi chạy luồng mới
    lastKhuCheck = Date.now();
    lastGiapCheck = Date.now();
    log('Farm BẬT — đích: ' + mapTen(target.map) + ' Khu ' + target.khu + '.');
    render();
    runToTarget();
  }
  function stop() {
    on = false;
    runToken++; // hủy luồng runToTarget/thienHoiGiap đang chạy dở (v1.5.0)
    // Hủy luôn luồng di chuyển trong nav (diToiMap/diToi/quaCong) —
    // không thì joystick vẫn đẩy và Auto vẫn bị tắt sau khi dừng.
    try {
      var n = nav();
      if (n && typeof n.huyDiChuyen === 'function') n.huyDiChuyen();
    } catch (e) { /* bỏ qua */ }
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


  // ================= MODULE: daihoi (Đại Hội tự động, mới v1.4.0) =================

// ================= MODULE: ĐẠI HỘI TỰ ĐỘNG (mới v1.4.0) =================
// Tab Đại Hội (lệnh Thanh 19:19 25/11 "Làm đi" — tính năng 1/11):
//  - Tự ghi danh khi sổ mở (:00–:15). Lịch (xác minh bảng live 17:00
//    25/11 + client game.js 24/11 — Tournament.lich / DaiHoiUI):
//      Luyện Khí (T7–13): 09:16 / 13:16 / 17:16 / 20:16, 4 kỳ/ngày.
//      Trúc Cơ: 13:16 / 17:16 chỉ thứ Bảy + Chủ Nhật (dạng 3v3);
//      20:16 trừ tối thứ Ba + thứ Bảy (Tranh Đoạt Linh Thụ) và thứ Năm
//      (Sỷ Sách Điện). Hôm nay thứ Tư -> Trúc Cơ chỉ có 20:16.
//  - Vào phòng chờ đổi NGAY ưu tiên Tự Động Đánh sang 'Nhân vật'
//    (Hotbar.setUuTien('nguoi') — client: uuTien ∈ auto/boss/quai/nguoi/
//    mau, lưu localStorage pntt.tuDong.uuTien; fallback bấm nút
//    [data-uu-tien="nguoi"] trong Cài Đặt). Giữ Auto BẬT xuyên các vòng.
//  - Sau khi bị loại/thua xong thì TỰ VỀ FARM tiếp (đích theo acc:
//    traxanhnet Phong Địa Khu 11; traxanhnet2 Khu 3; traxanhnet13 Khu 20;
//    thanhvan2 Thảo Dược Cốc Khu 16).
//  - Kiểm tra đạo hiệu trước khi ghi danh (so với ô nhập trong tab);
//    phiên hết hạn (#auth-name hiện) thì KHÔNG ghi danh.
//  - Cách ghi danh (client DaiHoiUI, game.js 24/11): DaiHoiUI.show() mở
//    bảng #daihoi; nút #dh-act có dataset.act='ghi_danh' khi đang mở sổ
//    và chưa ghi danh (bấm = Gateway.daiHoi('ghi_danh')); đã ghi danh thì
//    DaiHoiUI.state.daGhiDanh=true và nút hiện '✓ Đã ghi danh'. Toast
//    #dh-toast-act là đường dự phòng. Nút hộp thoại bind click nên
//    .click() là đúng (khác nút HUD chỉ bind pointerdown).
//  - CHƯA TEST LIVE: luồng bấm nút + đọc state mới đối chiếu mã client,
//    chưa chạy trên game thật (cần Thanh bật tab trong 1 kỳ Đại Hội).
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_daihoi_cfg';
  // Lịch Luyện Khí: 4 kỳ/ngày.
  var LK = ['09:16', '13:16', '17:16', '20:16'];
  // Đích về farm tiếp sau khi xong Đại Hội (theo acc).
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        daoHieu: typeof c.daoHieu === 'string' ? c.daoHieu : '',
        veFarm: c.veFarm !== false,
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', daoHieu: '', veFarm: true }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle';           // idle|cho|dang_ky|phong_cho|dang_dau|xong|het_phien|sai_acc
  var lastReg = null;           // {ngay, gio, bang}
  var dangThiDau = false;
  var daDoiUuTien = false;      // đã đổi sang 'Nhân vật' trong kỳ này
  var lanThuGhiDanh = 0;
  var lastGhiDanhThu = 0;
  var logLines = [];
  var lastLogGio = {};

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  // Log 1 dòng mỗi key tối đa 1 lần/60s (tránh spam log khi tick 1s).
  function logChong(key, msg) {
    var now = Date.now();
    if (lastLogGio[key] && now - lastLogGio[key] < 60000) return;
    lastLogGio[key] = now;
    log(msg);
  }

  // ---------------- Lịch + trạng thái game ----------------
  function ngayStr(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function phienTrongNgay(d) {
    // Trả về [{gio:'HH:MM', bang:'lk'|'tc'}] của ngày d.
    var dow = d.getDay(); // 0=CN, 6=T7
    var list = [];
    LK.forEach(function (g) { list.push({ gio: g, bang: 'lk' }); });
    if (dow === 0 || dow === 6) {
      list.push({ gio: '13:16', bang: 'tc' });
      list.push({ gio: '17:16', bang: 'tc' });
    }
    // 20:16 Trúc Cơ: trừ tối thứ Ba (2) + thứ Bảy (6) + thứ Năm (4).
    if (dow !== 2 && dow !== 6 && dow !== 4) list.push({ gio: '20:16', bang: 'tc' });
    return list;
  }
  function phienDangMo(nowMs, bangChiDinh) {
    // Sổ mở :00, chốt :15, khai hội :16 -> cửa ghi danh [gio-16p, gio-1p].
    // Lúc 20:16 thứ Tư cả LK lẫn Trúc Cơ cùng mở cửa — phải lọc theo
    // bảng của acc (bangChiDinh 'lk'/'tc'), không lấy kỳ đầu tiên gặp
    // (bug: acc Trúc Cơ lấy nhầm kỳ LK thì bỏ lỡ ghi danh).
    var d = new Date(nowMs);
    var list = phienTrongNgay(d);
    for (var i = 0; i < list.length; i++) {
      if (bangChiDinh && list[i].bang !== bangChiDinh) continue;
      var hh = parseInt(list[i].gio.slice(0, 2), 10), mm = parseInt(list[i].gio.slice(3), 10);
      var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm - 16, 0).getTime();
      var dong = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm - 1, 0).getTime();
      if (nowMs >= mo && nowMs <= dong) return list[i];
    }
    return null;
  }
  function phienKeTiep(nowMs) {
    var d = new Date(nowMs);
    var list = phienTrongNgay(d).slice().sort(function (a, b) { return a.gio < b.gio ? -1 : 1; });
    for (var i = 0; i < list.length; i++) {
      var hh = parseInt(list[i].gio.slice(0, 2), 10), mm = parseInt(list[i].gio.slice(3), 10);
      var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm - 16, 0).getTime();
      if (nowMs < mo) return list[i].gio + ' (' + (list[i].bang === 'tc' ? 'Trúc Cơ' : 'Luyện Khí') + ')';
    }
    return 'ngày mai ' + list[0].gio;
  }
  function bangCuaRealm() {
    try {
      var r = ns() && ns().SceneWorld && ns().SceneWorld.player && ns().SceneWorld.player.realmId;
      if (!r) return '';
      if (/truc_co/.test(r)) return 'tc';
      if (/luyen_khi/.test(r)) return 'lk';
    } catch (e) { /* bỏ qua */ }
    return '';
  }
  function docDaoHieu() {
    try {
      var n = ns();
      if (!n) return '';
      var p = n.SceneWorld && n.SceneWorld.player;
      if (p && p.name) return String(p.name);
      var me = n.Gateway && n.Gateway.me;
      if (me && me.name) return String(me.name);
    } catch (e) { /* bỏ qua */ }
    return '';
  }
  function hetPhien() {
    var f = $('#auth-name');
    return !!(f && f.offsetParent !== null);
  }
  function dhState() {
    try { return (ns() && ns().DaiHoiUI && ns().DaiHoiUI.state) || null; } catch (e) { return null; }
  }
  function daGhiDanh() {
    var st = dhState();
    if (st && st.daGhiDanh) return true;
    var b = $('#dh-act');
    if (b && /Đã ghi danh/.test(txt(b))) return true;
    return false;
  }
  function giaiDoan() {
    var st = dhState();
    if (st && st.giaiDoan) return st.giaiDoan;
    var ph = $('#dh-phase');
    return ph ? txt(ph) : '';
  }
  function uuTienHienTai() {
    try {
      var H = ns() && ns().Hotbar;
      if (H && typeof H.uuTien === 'function') return H.uuTien();
    } catch (e) { /* bỏ qua */ }
    var b = document.querySelector('[data-uu-tien].on');
    return b ? b.getAttribute('data-uu-tien') : '';
  }
  function datUuTienNguoi() {
    try {
      var H = ns() && ns().Hotbar;
      if (H && typeof H.setUuTien === 'function') {
        H.setUuTien('nguoi');
        if (H.uuTien() === 'nguoi') return true;
      }
    } catch (e) { /* rơi xuống fallback */ }
    var b = document.querySelector('[data-uu-tien="nguoi"]');
    if (b) { b.click(); return true; }
    return false;
  }

  // ---------------- Ghi danh ----------------
  function moBang() {
    try {
      var D = ns() && ns().DaiHoiUI;
      if (D && typeof D.show === 'function') { D.show(); return true; }
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  function bamGhiDanh() {
    // Ưu tiên nút bảng #dh-act, dự phòng toast #dh-toast-act.
    // Nút hộp thoại bind click -> .click() đúng (khác nút HUD).
    var b = $('#dh-act');
    if (b && !b.disabled && b.dataset.act === 'ghi_danh') { b.click(); return 'bang'; }
    var t = $('#dh-toast-act');
    if (t && !t.disabled && /Ghi Danh/.test(txt(t))) { t.click(); return 'toast'; }
    return null;
  }
  function daDangKyKyNay(sess, nowMs) {
    return !!(lastReg && lastReg.ngay === ngayStr(new Date(nowMs)) && lastReg.gio === sess.gio && lastReg.bang === sess.bang);
  }

  async function veFarm() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — ở lại làng, cần về farm tay.'); return; }
    log('Về farm tiếp: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try {
      f.stop();
      f.setTarget(preset.map, preset.khu);
      await sleep(300);
      f.start();
    } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  // ---------------- Tick chính ----------------
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      if (hetPhien()) {
        if (phase !== 'het_phien') { phase = 'het_phien'; log('Phiên đăng nhập đã hết hạn — KHÔNG ghi danh. Đăng nhập lại rồi bật lại tab.'); }
        render(); return;
      }
      var bang = bangCuaRealm();
      var sess = phienDangMo(now, bang);
      // Đang trong cửa ghi danh của 1 kỳ thuộc bảng của acc (hoặc chưa đọc được cảnh giới thì thử kỳ đang mở).
      if (sess && (!bang || bang === sess.bang) && !daDangKyKyNay(sess, now)) {
        phase = 'dang_ky';
        // Kiểm tra đạo hiệu trước khi ghi danh.
        var dh = docDaoHieu();
        if (cfg.daoHieu && dh && dh !== cfg.daoHieu) {
          phase = 'sai_acc';
          on = false; cfg.on = false; saveCfg();
          log('DỪNG: đạo hiệu đang đăng nhập là "' + dh + '", khác "' + cfg.daoHieu + '" — KHÔNG ghi danh (tránh ghi danh nhầm acc).');
          render(); return;
        }
        if (!dh && cfg.daoHieu) logChong('khong-doc-dh', 'Không đọc được đạo hiệu từ game — kiểm tra bằng mắt trước khi ghi danh.');
        if (moBang()) {
          var cho = bamGhiDanh();
          if (cho) {
            lanThuGhiDanh += 1; lastGhiDanhThu = now;
            log('Đã bấm Ghi Danh kỳ ' + sess.gio + ' (' + (sess.bang === 'tc' ? 'Trúc Cơ' : 'Luyện Khí') + ', qua ' + cho + ', lần ' + lanThuGhiDanh + ').');
          } else {
            logChong('cho-bang', 'Đã mở bảng Đại Hội kỳ ' + sess.gio + ' nhưng chưa thấy nút Ghi Danh (có thể sổ chưa mở hoặc đã đầy) — chờ...');
          }
        } else {
          logChong('khong-mo-bang', 'Không mở được bảng Đại Hội (DaiHoiUI.show không có) — mở tay Hành Trang → Hoạt Động → Đại Hội Tu Tiên.');
        }
        // Xác nhận đã ghi danh sau khi bấm (nút đổi trạng thái ở frame sau).
        if (daGhiDanh()) {
          lastReg = { ngay: ngayStr(new Date(now)), gio: sess.gio, bang: sess.bang };
          lanThuGhiDanh = 0;
          phase = 'cho';
          log('ĐÃ GHI DANH kỳ ' + sess.gio + ' (' + (sess.bang === 'tc' ? 'Trúc Cơ' : 'Luyện Khí') + '). Chờ vào phòng chờ — sẽ đổi ưu tiên sang Nhân vật.');
        }
        render(); return;
      }
      // Đã ghi danh / đang trong phòng chờ / đang đấu.
      var gd = giaiDoan();
      if (daGhiDanh() || gd === 'PHONG_CHO' || gd === 'DANG_DAU' || /phòng chờ|thi đấu/i.test(gd)) {
        if (gd === 'DANG_DAU' || /thi đấu/i.test(gd)) phase = 'dang_dau';
        else phase = 'phong_cho';
        if (!dangThiDau) { dangThiDau = true; daDoiUuTien = false; }
        // Đổi NGAY ưu tiên sang 'Nhân vật' khi vào phòng chờ.
        if (!daDoiUuTien) {
          if (datUuTienNguoi()) {
            daDoiUuTien = true;
            log('Đã đổi ưu tiên Tự Động Đánh sang NHÂN VẬT (phòng chờ).');
          } else {
            logChong('doi-uu-tien', 'Chưa đổi được ưu tiên sang Nhân vật — mở Cài Đặt đổi tay (đổi NGAY khi vào phòng chờ).');
          }
        }
        // Giữ Auto BẬT xuyên các vòng.
        var nv = nav();
        if (nv && typeof nv.datAuto === 'function') {
          try { nv.datAuto(true); } catch (e) { /* bỏ qua */ }
        }
        render(); return;
      }
      // Hết trận: đã từng thi đấu mà giờ không còn ở phòng chờ/trận đấu nữa.
      if (dangThiDau) {
        dangThiDau = false; daDoiUuTien = false;
        phase = 'xong';
        log('Đã xong Đại Hội (bị loại hoặc hết trận).');
        if (cfg.veFarm) veFarm();
        render(); return;
      }
      phase = 'cho';
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  // ---------------- Bật / dừng / debug ----------------
  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; log('Tab Đại Hội BẬT — tự ghi danh khi sổ mở, đổi Nhân vật ở phòng chờ, xong về farm tiếp.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; log('Tab Đại Hội TẮT.'); render(); }
  function status() {
    return {
      on: on, phase: phase, acc: cfg.acc, veFarm: cfg.veFarm,
      lastReg: lastReg, dangThiDau: dangThiDau,
      phienKe: phienKeTiep(Date.now()),
    };
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elLog, elAcc, elDaoHieu, elVeFarm;
  function setCollapsed(v) {
    var b = $('#tt2d-daihoi-body'), m = $('#tt2d-daihoi-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-daihoi-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-daihoi-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        (lastReg ? ' · đã ghi danh ' + lastReg.gio : '') +
        ' · kỳ tới ' + phienKeTiep(Date.now());
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('daihoi');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-daihoi-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>⚔️ Đại Hội tự động</b>' +
        '<button id="tt2d-daihoi-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-daihoi-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>⚔️ Đại Hội</b>' +
        '<span id="tt2d-daihoi-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-daihoi-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-daihoi-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-daihoi-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select> ' +
        'Đạo hiệu: <input id="tt2d-daihoi-dh" value="' + cfg.daoHieu.replace(/"/g, '&quot;') + '" placeholder="để trống = không kiểm tra" style="width:110px;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"></div>' +
        '<div style="margin-top:4px"><label><input type="checkbox" id="tt2d-daihoi-vefarm"' + (cfg.veFarm ? ' checked' : '') + '> Xong trận tự về farm tiếp</label></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-daihoi-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT tự ghi danh</button>' +
          '<button id="tt2d-daihoi-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-daihoi-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">LK 09:16/13:16/17:16/20:16 · TC 13:16/17:16 chỉ T7/CN (3v3), 20:16 trừ tối T3/T7/T5. Sổ mở :00–:15. Vào phòng chờ đổi NGAY ưu tiên sang Nhân vật, giữ Auto BẬT. Hết phiên thì không ghi danh.</div>' +
        '<div id="tt2d-daihoi-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-daihoi-trangthai');
    elLog = $('#tt2d-daihoi-log');
    elAcc = $('#tt2d-daihoi-acc');
    elDaoHieu = $('#tt2d-daihoi-dh');
    elVeFarm = $('#tt2d-daihoi-vefarm');
    $('#tt2d-daihoi-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-daihoi-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-daihoi-start').addEventListener('click', function () { start(); });
    $('#tt2d-daihoi-stop').addEventListener('click', function () { stop(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elDaoHieu.addEventListener('change', function () { cfg.daoHieu = elDaoHieu.value.trim(); saveCfg(); });
    elVeFarm.addEventListener('change', function () { cfg.veFarm = elVeFarm.checked; saveCfg(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Đại Hội đã nạp. Bật tab để tự ghi danh kỳ tới (' + phienKeTiep(Date.now()) + ').');

  window.__TT2D_DAIHOI__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _phienTrongNgay: phienTrongNgay,
    _phienDangMo: phienDangMo,
    _phienKeTiep: phienKeTiep,
    _bangCuaRealm: bangCuaRealm,
    _datUuTienNguoi: datUuTienNguoi,
    _bamGhiDanh: bamGhiDanh,
    _daGhiDanh: daGhiDanh,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('daihoi', window.__TT2D_DAIHOI__);
})();


  // ================= MODULE: vanhoang (Vạn Hoang tự động, mới v1.4.0) =================

// ================= MODULE: VẠN HOANG TỰ ĐỘNG (mới v1.4.0) =================
// Tab Vạn Hoang (lệnh Thanh 19:19 25/11 "Làm đi" — tính năng 2/11):
//  - Thứ Hai + thứ Sáu, ghi danh 21:00–21:15; thả 21:16, ~14 phút, 3 mạng.
//  - 21:16 tự di chuyển vào vòng bo thu hẹp (Auto KHÔNG tự vào bo):
//    đọc ChienTruongUI.trangThai() — bo.tam (tâm bo), nhip.ngoai (đang
//    ngoài bo hay không); ngoài bo thì tắt Auto, nav.diToi về tâm bo,
//    tới nơi bật lại Auto (chỉ đánh thường, KHÔNG dùng kỹ năng — tool
//    không bao giờ bấm phím chiêu).
//  - Hết trận (bị loại / hết 3 mạng) thì tự về farm tiếp (đích theo acc,
//    chung với tab Đại Hội).
//  - Cách ghi danh (client ChienTruongUI, game.js 24/11):
//    ChienTruongUI.show() mở bảng #chientruong; nút #ct-act có
//    dataset.act='ghi_danh' khi sổ mở (bấm = gửi ghi danh); #ct-bo hiện
//    thông tin bo; #ct-con/#ct-mang/#ct-hasat: còn lại/mạng/hạ.
//  - CHƯA XÁC MINH LIVE: (a) dataset.act của #ct-act có đúng là
//    'ghi_danh' như Đại Hội không (tool chỉ bấm khi act='ghi_danh' HOẶC
//    chữ nút chứa 'Ghi danh', còn không thì chỉ log); (b) đơn vị tọa độ
//    bo.tam (ô lưới hay pixel — tool chia 32 nếu số > 60 và log rõ số
//    thô lần đầu thấy); (c) map đấu có đi được bằng nav.diToi không.
//    Cần Thanh bật tab trong 1 kỳ Vạn Hoang để đối chiếu log.
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_vanhoang_cfg';
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];
  var NGAY_MO = [1, 5]; // thứ Hai (1) + thứ Sáu (5)

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        veFarm: c.veFarm !== false,
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', veFarm: true }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle'; // idle|cho|dang_ky|trong_tran|ngoai_bo|xong|het_phien
  var daGhiDanh = false;
  var dangTrongTran = false;
  var daLogBoTho = false;
  var lastVaoBo = 0;
  var logLines = [];

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function hetPhien() {
    var f = $('#auth-name');
    return !!(f && f.offsetParent !== null);
  }
  function ct() { try { return (ns() && ns().ChienTruongUI) || null; } catch (e) { return null; } }
  function trangThai() {
    try {
      var C = ct();
      if (C && typeof C.trangThai === 'function') return C.trangThai();
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function dangTran() {
    try {
      var C = ct();
      if (C && typeof C.dangTrongTran === 'function') return !!C.dangTrongTran();
    } catch (e) { /* bỏ qua */ }
    var b = $('#ct-bo');
    return !!(b && txt(b));
  }
  function trongCuaGhiDanh(nowMs) {
    var d = new Date(nowMs);
    if (NGAY_MO.indexOf(d.getDay()) < 0) return false;
    var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 21, 0, 0).getTime();
    var dong = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 21, 15, 0).getTime();
    return nowMs >= mo && nowMs <= dong;
  }
  function moBang() {
    try {
      var C = ct();
      if (C && typeof C.show === 'function') { C.show(); return true; }
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  function bamGhiDanh() {
    var b = $('#ct-act');
    if (!b || b.disabled) return null;
    // Chỉ bấm khi game ghi rõ act='ghi_danh' hoặc chữ nút là Ghi danh
    // (dataset.act chưa xác minh live — không bấm mù nút khác).
    if (b.dataset.act === 'ghi_danh') { b.click(); return 'act'; }
    if (/Ghi danh/i.test(txt(b))) { b.click(); return 'chu'; }
    return null;
  }
  // Tâm bo -> tọa độ ô lưới. bo.tam chưa rõ đơn vị (ô hay pixel):
  // số > 60 thì coi là pixel, chia 32 (TILE=32). Log số thô lần đầu.
  function tamBoThanhO(tam) {
    if (!tam || typeof tam.x !== 'number' || typeof tam.y !== 'number') return null;
    if (!daLogBoTho) { daLogBoTho = true; log('Tâm bo thô từ game: (' + tam.x + ',' + tam.y + ') — chưa xác minh đơn vị (ô/pixel).'); }
    var x = tam.x, y = tam.y;
    if (x > 60 || y > 60) { x = Math.round(x / 32); y = Math.round(y / 32); }
    return { x: x, y: y };
  }

  async function veFarm() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — ở lại chỗ cũ, cần về farm tay.'); return; }
    log('Về farm tiếp: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try { f.stop(); f.setTarget(preset.map, preset.khu); await sleep(300); f.start(); } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  async function vaoBo() {
    var st = trangThai();
    if (!st || !st.bo || !st.bo.tam) { log('Chưa đọc được tâm bo (ChienTruongUI.trangThai().bo.tam trống) — đứng yên chờ.'); return; }
    var tam = tamBoThanhO(st.bo.tam);
    if (!tam) return;
    var nv = nav();
    if (!nv) { log('Không thấy module Điều hướng — không tự vào bo được.'); return; }
    phase = 'ngoai_bo';
    log('Đang ngoài bo — di chuyển vào tâm bo (' + tam.x + ',' + tam.y + ').');
    try {
      var ok = await nv.diToi(tam.x, tam.y);
      if (ok) {
        log('Đã vào trong bo — bật Auto đánh thường (không dùng kỹ năng).');
        try { nv.datAuto(true); } catch (e) { /* bỏ qua */ }
        phase = 'trong_tran';
      } else {
        log('diToi tâm bo thất bại — thử lại sau 5s (có thể kẹt địa hình).');
      }
    } catch (e) { log('Vào bo lỗi: ' + (e && e.message)); }
  }

  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      // Sáng map (v1.5.0 mục 9): tự bật khi vào map Tam Lộ/Vạn Hoang,
      // tự tắt khi rời map — chung cơ chế với tab sự kiện kia.
      try { var SM = window.__TT2D_SANGMAP__; if (SM && SM.capNhat) SM.capNhat(); } catch (e) { /* bỏ qua */ }
      if (hetPhien()) {
        if (phase !== 'het_phien') { phase = 'het_phien'; log('Phiên đăng nhập đã hết hạn — KHÔNG ghi danh Vạn Hoang.'); }
        render(); return;
      }
      // Ghi danh 21:00–21:15 thứ Hai / thứ Sáu.
      if (!daGhiDanh && trongCuaGhiDanh(now)) {
        phase = 'dang_ky';
        if (moBang()) {
          var cho = bamGhiDanh();
          if (cho) {
            daGhiDanh = true; phase = 'cho';
            log('Đã bấm Ghi Danh Vạn Hoang (qua ' + cho + '). Thả 21:16 — sẽ tự vào bo.');
          } else {
            var b = $('#ct-act');
            log('Đã mở bảng Vạn Hoang nhưng nút ghi danh chưa bấm được (act=' + (b ? (b.dataset.act || '(trống)') : 'không thấy nút') + ', chữ="' + (b ? txt(b) : '') + '") — chờ...');
          }
        } else {
          log('Không mở được bảng Vạn Hoang (ChienTruongUI.show không có) — mở tay Hành Trang → Hoạt Động → Vạn Hoang Chiến Trường.');
        }
        render(); return;
      }
      // Trong trận: theo dõi bo.
      if (dangTran()) {
        if (!dangTrongTran) { dangTrongTran = true; log('Đã vào trận Vạn Hoang — theo dõi vòng bo.'); }
        phase = 'trong_tran';
        var st = trangThai();
        if (st) {
          if (st.loai || (st.nhip && st.nhip.trangThai === 'LOAI')) {
            dangTrongTran = false; daGhiDanh = false; phase = 'xong';
            log('Đã bị loại khỏi Vạn Hoang (hết 3 mạng hoặc hết trận).');
            if (cfg.veFarm) veFarm();
            render(); return;
          }
          if (st.nhip && st.nhip.ngoai) {
            if (now - lastVaoBo > 5000) { lastVaoBo = now; vaoBo(); }
          }
        }
        render(); return;
      }
      // Hết trận mà không qua cờ loại (vd trận kết thúc).
      if (dangTrongTran) {
        dangTrongTran = false; daGhiDanh = false; phase = 'xong';
        log('Đã hết trận Vạn Hoang.');
        if (cfg.veFarm) veFarm();
        render(); return;
      }
      phase = 'cho';
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; daGhiDanh = false; dangTrongTran = false; log('Tab Vạn Hoang BẬT — ghi danh T2/T6 21:00–21:15, tự vào bo 21:16, chỉ đánh thường.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; log('Tab Vạn Hoang TẮT.'); try { var SM = window.__TT2D_SANGMAP__; if (SM && SM._go) SM._go(); } catch (e) { /* bỏ qua */ } render(); }
  function status() {
    var d = new Date();
    var thu = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    return { on: on, phase: phase, acc: cfg.acc, veFarm: cfg.veFarm, daGhiDanh: daGhiDanh, dangTrongTran: dangTrongTran, homNay: thu + (NGAY_MO.indexOf(d.getDay()) >= 0 ? ' (có kỳ 21:00)' : ' (không có kỳ)') };
  }

  var panel, elTrangThai, elLog, elAcc, elVeFarm;
  function setCollapsed(v) {
    var b = $('#tt2d-vanhoang-body'), m = $('#tt2d-vanhoang-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-vanhoang-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-vanhoang-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    var smBtn = $('#tt2d-vanhoang-sangmap');
    if (smBtn) {
      try {
        var SM = window.__TT2D_SANGMAP__;
        var st = SM ? SM.status() : null;
        smBtn.textContent = '💡 Sáng map: ' + (st && st.bat ? 'BẬT' : 'TẮT') + (st && st.dangSang ? ' · đang SÁNG' : '');
      } catch (e) { /* bỏ qua */ }
    }
    if (elTrangThai) {
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        (daGhiDanh ? ' · đã ghi danh' : '') + ' · ' + status().homNay;
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('vanhoang');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-vanhoang-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>⛳ Vạn Hoang tự động</b>' +
        '<button id="tt2d-vanhoang-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-vanhoang-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>⛳ Vạn Hoang</b>' +
        '<span id="tt2d-vanhoang-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-vanhoang-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-vanhoang-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-vanhoang-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select> ' +
        '<label><input type="checkbox" id="tt2d-vanhoang-vefarm"' + (cfg.veFarm ? ' checked' : '') + '> Hết trận tự về farm</label></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-vanhoang-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT tự ghi danh</button>' +
          '<button id="tt2d-vanhoang-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-vanhoang-sangmap" title="Sáng toàn bộ map sự kiện (chung với tab kia)" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#2a4a6a;color:#fff;cursor:pointer">💡 Sáng map: BẬT</button>' +
        '</div>' +
        '<div id="tt2d-vanhoang-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Thứ Hai + thứ Sáu, ghi danh 21:00–21:15, thả 21:16 (~14 phút, 3 mạng). Vào bo thu hẹp: tool tự di chuyển vào tâm bo, chỉ đánh thường, không dùng kỹ năng. Đơn vị tọa độ tâm bo + nút ghi danh chưa xác minh live — xem log khi chạy kỳ đầu.</div>' +
        '<div id="tt2d-vanhoang-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-vanhoang-trangthai');
    elLog = $('#tt2d-vanhoang-log');
    elAcc = $('#tt2d-vanhoang-acc');
    elVeFarm = $('#tt2d-vanhoang-vefarm');
    $('#tt2d-vanhoang-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-vanhoang-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-vanhoang-start').addEventListener('click', function () { start(); });
    $('#tt2d-vanhoang-stop').addEventListener('click', function () { stop(); });
    $('#tt2d-vanhoang-sangmap').addEventListener('click', function () {
      // Toggle Sáng map — công tắc CHUNG cho cả Tam Lộ + Vạn Hoang.
      try { var SM = window.__TT2D_SANGMAP__; if (SM) SM.setBat(!SM.status().bat); } catch (e) { /* bỏ qua */ }
      render();
    });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elVeFarm.addEventListener('change', function () { cfg.veFarm = elVeFarm.checked; saveCfg(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Vạn Hoang đã nạp. Bật tab để tự ghi danh kỳ T2/T6 21:00.');

  window.__TT2D_VANHOANG__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _trongCuaGhiDanh: trongCuaGhiDanh,
    _tamBoThanhO: tamBoThanhO,
    _bamGhiDanh: bamGhiDanh,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('vanhoang', window.__TT2D_VANHOANG__);
})();


  // ================= MODULE: tamlo (Tam Lộ tự động, mới v1.4.0) =================

// ================= MODULE: TAM LỘ TỰ ĐỘNG (mới v1.4.0) =================
// Tab Tam Lộ (lệnh Thanh 19:19 25/11 "Làm đi" — tính năng 3/11):
//  - Chủ Nhật + thứ Tư 21:00; sổ mở 21:00, chốt sau 16 phút (21:16);
//    sau khi chốt sổ hiện bảng "Chấp nhận trận đấu" 20 giây
//    (CHAP_NHAN_MS=20000, client game.js 24/11) — bấm "Chơi luôn!" thì
//    được ghép đội, không bấm kịp thì mất suất kỳ này (không trừ lượt).
//  - Tool: ghi danh 21:00–21:15 qua TamLoUI.show() + nút #tl-act
//    (dataset.act='ghi_danh'); từ 21:14:30 quét mỗi 1s — thấy toast
//    #tl-toast hiện nhãn "Chấp nhận trận đấu" (hoặc nút #tl-toast-act
//    ghi "Chơi luôn!") thì bấm NGAY (nút hộp thoại bind click).
//    Nút "Chơi luôn!" TRONG TRẬN là chữ vẽ trên canvas — tool KHÔNG
//    bấm canvas, chỉ bấm nút DOM của toast/bảng (đường game dùng để
//    chấp nhận, cùng Gateway op như bấm tay).
//  - Tối đa 3 nhân vật/địa chỉ mạng/bảng — tool chỉ lo acc đang mở;
//    Thanh tự đăng nhập traxanhnet2 lúc 21:00 (lệnh 20:46 18/11).
//  - Hết trận tự về farm tiếp (đích theo acc, chung với tab Đại Hội).
//  - CHƯA TEST LIVE: luồng bấm toast chấp nhận + đọc
//    TamLoUI.trangThai() mới đối chiếu mã client, chưa chạy trên game
//    thật (cần Thanh bật tab trong 1 kỳ Tam Lộ).
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_tamlo_cfg';
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];
  var NGAY_MO = [0, 3]; // Chủ Nhật (0) + thứ Tư (3)

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        veFarm: c.veFarm !== false,
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', veFarm: true }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle'; // idle|cho|dang_ky|cho_chap_nhan|da_chap_nhan|dang_dau|xong|het_phien
  var daGhiDanh = false;
  var daChapNhan = false;
  var dangTrongTran = false;
  var logLines = [];
  var lastLogChapNhan = 0;

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function farm() { return window.__TT2D_FARM__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function hetPhien() {
    var f = $('#auth-name');
    return !!(f && f.offsetParent !== null);
  }
  function tl() { try { return (ns() && ns().TamLoUI) || null; } catch (e) { return null; } }
  function trangThai() {
    try {
      var T = tl();
      if (T && typeof T.trangThai === 'function') return T.trangThai();
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function trongCuaGhiDanh(nowMs) {
    var d = new Date(nowMs);
    if (NGAY_MO.indexOf(d.getDay()) < 0) return false;
    var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 21, 0, 0).getTime();
    var dong = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 21, 15, 0).getTime();
    return nowMs >= mo && nowMs <= dong;
  }
  function trongCuaChapNhan(nowMs) {
    // Quét chấp nhận từ 21:14:30 tới 21:17:00 (chốt sổ 21:16 + cửa 20s).
    var d = new Date(nowMs);
    if (NGAY_MO.indexOf(d.getDay()) < 0) return false;
    var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 21, 14, 30).getTime();
    var dong = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 21, 17, 0).getTime();
    return nowMs >= mo && nowMs <= dong;
  }
  function moBang() {
    try {
      var T = tl();
      if (T && typeof T.show === 'function') { T.show(); return true; }
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  function bamGhiDanh() {
    var b = $('#tl-act');
    if (!b || b.disabled) return null;
    if (b.dataset.act === 'ghi_danh') { b.click(); return 'bang'; }
    if (/Ghi Danh/.test(txt(b))) { b.click(); return 'chu'; }
    return null;
  }
  function chapNhanDangMo() {
    // 1) State game báo CHO_CHAP_NHAN. 2) Toast hiện nhãn Chấp nhận /
    // nút ghi "Chơi luôn!". 3) Nút bảng #tl-act ghi "Chơi luôn!".
    var st = trangThai();
    if (st && st.trangThai === 'CHO_CHAP_NHAN') return 'state';
    var toast = $('#tl-toast');
    if (toast && toast.offsetParent !== null) {
      var label = txt($('#tl-toast-label'));
      var actTxt = txt($('#tl-toast-act'));
      if (/Chấp nhận/.test(label) || /Chơi luôn/.test(actTxt)) return 'toast';
    }
    var b = $('#tl-act');
    if (b && /Chơi luôn/.test(txt(b))) return 'bang';
    return null;
  }
  function bamChapNhan() {
    // Bấm nút DOM của toast trước (đường game dùng để chấp nhận),
    // dự phòng nút bảng.
    var t = $('#tl-toast-act');
    if (t && !t.disabled && t.offsetParent !== null) { t.click(); return 'toast'; }
    var b = $('#tl-act');
    if (b && !b.disabled) { b.click(); return 'bang'; }
    return null;
  }
  function dangTran() {
    try {
      var T = tl();
      if (T && typeof T.dangTrongTran === 'function') return !!T.dangTrongTran();
    } catch (e) { /* bỏ qua */ }
    return false;
  }

  async function veFarm() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — ở lại chỗ cũ, cần về farm tay.'); return; }
    log('Về farm tiếp: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try { f.stop(); f.setTarget(preset.map, preset.khu); await sleep(300); f.start(); } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      // Sáng map (v1.5.0 mục 9): tự bật khi vào map Tam Lộ/Vạn Hoang,
      // tự tắt khi rời map — chung cơ chế với tab sự kiện kia.
      try { var SM = window.__TT2D_SANGMAP__; if (SM && SM.capNhat) SM.capNhat(); } catch (e) { /* bỏ qua */ }
      if (hetPhien()) {
        if (phase !== 'het_phien') { phase = 'het_phien'; log('Phiên đăng nhập đã hết hạn — KHÔNG ghi danh Tam Lộ.'); }
        render(); return;
      }
      // Ghi danh 21:00–21:15 CN/T4.
      if (!daGhiDanh && trongCuaGhiDanh(now)) {
        phase = 'dang_ky';
        if (moBang()) {
          var cho = bamGhiDanh();
          if (cho) {
            daGhiDanh = true; phase = 'cho_chap_nhan';
            log('Đã bấm Ghi Danh Tam Lộ (qua ' + cho + '). Chốt sổ 21:16 — sẽ bấm "Chơi luôn!" ngay khi bảng chấp nhận hiện (cửa ~20s).');
          } else {
            var b = $('#tl-act');
            log('Đã mở bảng Tam Lộ nhưng nút ghi danh chưa bấm được (act=' + (b ? (b.dataset.act || '(trống)') : 'không thấy nút') + ', chữ="' + (b ? txt(b) : '') + '") — chờ...');
          }
        } else {
          log('Không mở được bảng Tam Lộ (TamLoUI.show không có) — mở tay Hành Trang → Hoạt Động → Tam Lộ Tranh Phong.');
        }
        render(); return;
      }
      // Cửa chấp nhận: quét liên tục, bấm ngay khi thấy.
      if (daGhiDanh && !daChapNhan && trongCuaChapNhan(now)) {
        phase = 'cho_chap_nhan';
        var nguon = chapNhanDangMo();
        if (nguon) {
          var bam = bamChapNhan();
          if (bam) {
            daChapNhan = true; phase = 'da_chap_nhan';
            var t = new Date(now);
            log('ĐÃ BẤM "Chơi luôn!" lúc ' + ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2) + ':' + ('0' + t.getSeconds()).slice(-2) + ' (thấy qua ' + nguon + ', bấm qua ' + bam + ').');
          } else {
            log('Thấy bảng chấp nhận (' + nguon + ') nhưng chưa bấm được nút — thử lại nhịp sau.');
          }
        } else if (now - lastLogChapNhan > 30000) {
          lastLogChapNhan = now;
          log('Đang chờ bảng "Chấp nhận trận đấu" (chốt sổ 21:16, cửa ~20s)...');
        }
        render(); return;
      }
      // Mất cửa chấp nhận mà chưa bấm được.
      if (daGhiDanh && !daChapNhan && !trongCuaChapNhan(now) && now > new Date(new Date(now).getFullYear(), new Date(now).getMonth(), new Date(now).getDate(), 21, 17, 0).getTime()) {
        var d = new Date(now);
        if (NGAY_MO.indexOf(d.getDay()) >= 0 && d.getHours() === 21) {
          daGhiDanh = false; phase = 'cho';
          log('Đã qua cửa chấp nhận mà chưa bấm được "Chơi luôn!" — mất suất kỳ này (không trừ lượt).');
        }
        render(); return;
      }
      // Trong trận / hết trận.
      if (dangTran()) {
        if (!dangTrongTran) { dangTrongTran = true; phase = 'dang_dau'; log('Đã vào trận Tam Lộ — đánh như thường (tối đa 25 phút).'); }
        render(); return;
      }
      if (dangTrongTran) {
        dangTrongTran = false; daGhiDanh = false; daChapNhan = false; phase = 'xong';
        log('Đã hết trận Tam Lộ.');
        if (cfg.veFarm) veFarm();
        render(); return;
      }
      phase = 'cho';
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; daGhiDanh = false; daChapNhan = false; dangTrongTran = false; log('Tab Tam Lộ BẬT — ghi danh CN/T4 21:00, tự bấm "Chơi luôn!" khi bảng chấp nhận hiện.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; log('Tab Tam Lộ TẮT.'); try { var SM = window.__TT2D_SANGMAP__; if (SM && SM._go) SM._go(); } catch (e) { /* bỏ qua */ } render(); }
  function status() {
    var d = new Date();
    var thu = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    return { on: on, phase: phase, acc: cfg.acc, veFarm: cfg.veFarm, daGhiDanh: daGhiDanh, daChapNhan: daChapNhan, dangTrongTran: dangTrongTran, homNay: thu + (NGAY_MO.indexOf(d.getDay()) >= 0 ? ' (có kỳ 21:00)' : ' (không có kỳ)') };
  }

  var panel, elTrangThai, elLog, elAcc, elVeFarm;
  function setCollapsed(v) {
    var b = $('#tt2d-tamlo-body'), m = $('#tt2d-tamlo-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-tamlo-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-tamlo-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    var smBtn = $('#tt2d-tamlo-sangmap');
    if (smBtn) {
      try {
        var SM = window.__TT2D_SANGMAP__;
        var st = SM ? SM.status() : null;
        smBtn.textContent = '💡 Sáng map: ' + (st && st.bat ? 'BẬT' : 'TẮT') + (st && st.dangSang ? ' · đang SÁNG' : '');
      } catch (e) { /* bỏ qua */ }
    }
    if (elTrangThai) {
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        (daGhiDanh ? ' · đã ghi danh' : '') + (daChapNhan ? ' · đã bấm Chơi luôn!' : '') + ' · ' + status().homNay;
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('tamlo');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-tamlo-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>🎯 Tam Lộ tự động</b>' +
        '<button id="tt2d-tamlo-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-tamlo-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>🎯 Tam Lộ</b>' +
        '<span id="tt2d-tamlo-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-tamlo-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-tamlo-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-tamlo-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select> ' +
        '<label><input type="checkbox" id="tt2d-tamlo-vefarm"' + (cfg.veFarm ? ' checked' : '') + '> Hết trận tự về farm</label></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-tamlo-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT tự ghi danh</button>' +
          '<button id="tt2d-tamlo-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-tamlo-sangmap" title="Sáng toàn bộ map sự kiện (chung với tab kia)" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#2a4a6a;color:#fff;cursor:pointer">💡 Sáng map: BẬT</button>' +
        '</div>' +
        '<div id="tt2d-tamlo-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Chủ Nhật + thứ Tư 21:00, chốt sổ 21:16, bảng "Chấp nhận trận đấu" chỉ mở ~20 giây — tool quét mỗi 1 giây và bấm "Chơi luôn!" ngay khi thấy. Tối đa 3 nhân vật/địa chỉ mạng/bảng. Thanh tự đăng nhập traxanhnet2 lúc 21:00.</div>' +
        '<div id="tt2d-tamlo-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-tamlo-trangthai');
    elLog = $('#tt2d-tamlo-log');
    elAcc = $('#tt2d-tamlo-acc');
    elVeFarm = $('#tt2d-tamlo-vefarm');
    $('#tt2d-tamlo-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-tamlo-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-tamlo-start').addEventListener('click', function () { start(); });
    $('#tt2d-tamlo-stop').addEventListener('click', function () { stop(); });
    $('#tt2d-tamlo-sangmap').addEventListener('click', function () {
      // Toggle Sáng map — công tắc CHUNG cho cả Tam Lộ + Vạn Hoang.
      try { var SM = window.__TT2D_SANGMAP__; if (SM) SM.setBat(!SM.status().bat); } catch (e) { /* bỏ qua */ }
      render();
    });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elVeFarm.addEventListener('change', function () { cfg.veFarm = elVeFarm.checked; saveCfg(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Tam Lộ đã nạp. Bật tab để tự ghi danh kỳ CN/T4 21:00.');

  window.__TT2D_TAMLO__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _trongCuaGhiDanh: trongCuaGhiDanh,
    _trongCuaChapNhan: trongCuaChapNhan,
    _chapNhanDangMo: chapNhanDangMo,
    _bamChapNhan: bamChapNhan,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('tamlo', window.__TT2D_TAMLO__);
})();


  // ================= MODULE: chinhma (Chế độ Chính Ma, mới v1.4.0) =================

// ================= MODULE: CHẾ ĐỘ CHÍNH MA (mới v1.4.0) =================
// Chế độ Chính Ma (lệnh Thanh 19:19 25/11 "Làm đi" — tính năng 4/11):
//  - Giờ Chính Ma HẰNG NGÀY 11:00–12:00: phe Chính săn người chơi Linh
//    Căn Ám/tông Ma Đạo; điểm hồi sinh làng là điểm PK (25/11: acc chính
//    gục 35 lần, net13 gục 17 lần — hồi sinh ngay giữa điểm đánh nhau,
//    chết trong 0–10 giây sau mỗi lần hồi sinh).
//  - Lúc 10:55 tool TỰ ĐƯA nhân vật rời làng tới chỗ an toàn rồi chờ tới
//    12:00 mới về farm:
//      mặc định: Thảo Dược Cốc Khu 16 (qua tab Farm — đi tới đó rồi farm
//      như thường, an toàn khỏi PK);
//      lựa chọn: Hồ Tây (qua nav.diToiMap('van_can') — map câu cá, đứng
//      yên đó, Auto BẬT tự vệ).
//  - Trong 11:00–12:00: TUYỆT ĐỐI không hồi sinh/di chuyển ở làng —
//    nhân vật gục thì tool KHÔNG bấm bất kỳ nút hồi sinh nào (kể cả
//    "Hồi sinh tại chỗ" lẫn "Về làng"), chỉ chờ qua 12:00; nhân vật còn
//    sống mà kẹt ở làng thì ĐỨNG YÊN, không di chuyển.
//  - 12:00: tự về farm tiếp (đích farm đã lưu trước lúc 10:55).
//  - CHƯA TEST LIVE: luồng di chuyển 10:55 + chờ giờ Chính Ma chưa chạy
//    trên game thật (cần Thanh bật tab trước 10:55 một hôm để đối chiếu).
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_chinhma_cfg';
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        noiTru: c.noiTru === 'ho_tay' ? 'ho_tay' : 'duoc_vien_16',
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', noiTru: 'duoc_vien_16' }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle'; // idle|cho|da_tru_an|trong_gio|cho_ve|xong
  var daDiTru = false;    // đã di chuyển đi trú ẩn hôm nay
  var daVeFarm = false;   // đã về farm sau 12:00 hôm nay
  var ngayLam = '';
  var logLines = [];
  var lastLogGuc = 0;
  var lastLogLang = 0;

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function ngayStr(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function trongGioChinhMa(nowMs) {
    var d = new Date(nowMs);
    var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 11, 0, 0).getTime();
    var dong = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
    return nowMs >= mo && nowMs < dong;
  }
  function sapToiGio(nowMs) {
    // Cửa di chuyển đi trú ẩn: 10:55–11:00.
    var d = new Date(nowMs);
    var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 55, 0).getTime();
    var dong = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 11, 0, 0).getTime();
    return nowMs >= mo && nowMs < dong;
  }
  function dangGuc() {
    var d = $('#downed');
    return !!(d && d.offsetParent !== null && !d.classList.contains('hidden'));
  }
  function dangOLang() {
    try {
      var nv = nav();
      if (nv) { var p = nv.docViTri(); return p && p.map === 'tan_vien'; }
    } catch (e) { /* bỏ qua */ }
    var hm = $('#hud-map');
    return hm ? /Chân Núi/.test(txt(hm)) : false;
  }
  function hetPhien() {
    var f = $('#auth-name');
    return !!(f && f.offsetParent !== null);
  }

  async function diTruAn() {
    var f = farm();
    var nv = nav();
    if (cfg.noiTru === 'ho_tay') {
      log('10:55 — đi trú ẩn ở Hồ Tây (chờ tới 12:00 mới về farm).');
      if (f) { try { f.stop(); } catch (e) { /* bỏ qua */ } }
      if (!nv) { log('Không thấy module Điều hướng — không đi Hồ Tây được, ở lại chỗ cũ.'); return; }
      try {
        var ok = await nv.diToiMap('van_can');
        if (ok) { log('Đã tới Hồ Tây — đứng yên chờ qua 12:00.'); try { nv.datAuto(true); } catch (e) { /* bỏ qua */ } }
        else log('diToiMap Hồ Tây thất bại — ở lại chỗ cũ, cẩn thận giờ Chính Ma.');
      } catch (e) { log('Đi trú ẩn lỗi: ' + (e && e.message)); }
    } else {
      log('10:55 — đi trú ẩn ở Thảo Dược Cốc Khu 16 (chờ tới 12:00 mới về farm).');
      if (!f) { log('Không thấy tab Farm — không đi trú ẩn được.'); return; }
      try {
        f.stop();
        f.setTarget('duoc_vien', 16);
        await sleep(300);
        f.start();
      } catch (e) { log('Đi trú ẩn lỗi: ' + (e && e.message)); }
    }
  }
  async function veFarm() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — ở lại chỗ cũ, cần về farm tay.'); return; }
    log('12:00 — hết giờ Chính Ma, về farm tiếp: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try { f.stop(); f.setTarget(preset.map, preset.khu); await sleep(300); f.start(); } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      var d = new Date(now);
      var ngay = ngayStr(d);
      if (ngay !== ngayLam) { ngayLam = ngay; daDiTru = false; daVeFarm = false; }
      if (hetPhien()) { render(); return; }
      // 10:55 — đi trú ẩn (1 lần/ngày).
      if (!daDiTru && sapToiGio(now)) {
        daDiTru = true; phase = 'da_tru_an';
        diTruAn();
        render(); return;
      }
      // 11:00–12:00 — TUYỆT ĐỐI không hồi sinh/di chuyển ở làng.
      if (trongGioChinhMa(now)) {
        phase = 'trong_gio';
        if (dangGuc()) {
          if (now - lastLogGuc > 60000) {
            lastLogGuc = now;
            log('ĐANG GỤC giờ Chính Ma — KHÔNG bấm hồi sinh, chờ qua 12:00 (hồi sinh ở làng là chết tiếp).');
          }
        } else if (dangOLang()) {
          if (now - lastLogLang > 60000) {
            lastLogLang = now;
            log('Đang ở làng giờ Chính Ma — ĐỨNG YÊN, không di chuyển, không hồi sinh, chờ qua 12:00.');
          }
        }
        render(); return;
      }
      // 12:00 — về farm (1 lần/ngày, chỉ khi hôm nay đã đi trú ẩn hoặc
      // đang trong ngày có bật tab).
      if (!daVeFarm && d.getHours() >= 12 && daDiTru) {
        daVeFarm = true; phase = 'cho_ve';
        veFarm();
        render(); return;
      }
      phase = 'cho';
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; log('Chế độ Chính Ma BẬT — 10:55 tự đi trú ẩn (' + (cfg.noiTru === 'ho_tay' ? 'Hồ Tây' : 'Thảo Dược Cốc Khu 16') + '), 11:00–12:00 không hồi sinh/di chuyển ở làng, 12:00 về farm.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; log('Chế độ Chính Ma TẮT.'); render(); }
  function status() {
    return { on: on, phase: phase, acc: cfg.acc, noiTru: cfg.noiTru, daDiTru: daDiTru, daVeFarm: daVeFarm };
  }

  var panel, elTrangThai, elLog, elAcc, elNoiTru;
  function setCollapsed(v) {
    var b = $('#tt2d-chinhma-body'), m = $('#tt2d-chinhma-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-chinhma-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-chinhma-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        ' · trú ẩn: ' + (cfg.noiTru === 'ho_tay' ? 'Hồ Tây' : 'Thảo Dược Cốc Khu 16');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('chinhma');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-chinhma-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>🛡️ Chế độ Chính Ma</b>' +
        '<button id="tt2d-chinhma-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-chinhma-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>🛡️ Chính Ma</b>' +
        '<span id="tt2d-chinhma-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-chinhma-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-chinhma-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-chinhma-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select> ' +
        'Trú ẩn: <select id="tt2d-chinhma-noitru" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' +
          '<option value="duoc_vien_16"' + (cfg.noiTru === 'duoc_vien_16' ? ' selected' : '') + '>Thảo Dược Cốc Khu 16</option>' +
          '<option value="ho_tay"' + (cfg.noiTru === 'ho_tay' ? ' selected' : '') + '>Hồ Tây</option>' +
        '</select></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-chinhma-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT chế độ</button>' +
          '<button id="tt2d-chinhma-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-chinhma-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Chính Ma hằng ngày 11:00–12:00. 10:55 tự đi trú ẩn, trong giờ KHÔNG hồi sinh/di chuyển ở làng (gục thì nằm chờ), 12:00 về farm tiếp.</div>' +
        '<div id="tt2d-chinhma-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-chinhma-trangthai');
    elLog = $('#tt2d-chinhma-log');
    elAcc = $('#tt2d-chinhma-acc');
    elNoiTru = $('#tt2d-chinhma-noitru');
    $('#tt2d-chinhma-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-chinhma-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-chinhma-start').addEventListener('click', function () { start(); });
    $('#tt2d-chinhma-stop').addEventListener('click', function () { stop(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elNoiTru.addEventListener('change', function () { cfg.noiTru = elNoiTru.value; saveCfg(); render(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Chế độ Chính Ma đã nạp. Bật trước 10:55 để tool kịp đưa nhân vật đi trú ẩn.');

  window.__TT2D_CHINHMA__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _trongGioChinhMa: trongGioChinhMa,
    _sapToiGio: sapToiGio,
    _dangGuc: dangGuc,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('chinhma', window.__TT2D_CHINHMA__);
})();


  // ================= MODULE: canh (Canh Phi Hành + trôi khu + Giáp, mới v1.4.0) =================

// ================= MODULE: CANH FARM (mới v1.4.0) =================
// Tab Canh (lệnh Thanh 19:19 25/11 "Làm đi" — tính năng 5+6+7/11):
//  5. Canh Phi Hành tự động: theo dõi tốc độ giết (tốc độ của tab Farm,
//     tính từ #stone-day). Nếu tụt xuống tốc độ đi bộ (<4/phút từ
//     >=8/phút trước đó) mà nhân vật đang ở mặt đất (nav.flyDangBat()
//     đọc SceneWorld.player.flying) thì bật lại Phi Hành 1 LẦN DUY NHẤT
//     (nav.datFly(true) qua tap() — nút HUD chỉ bind pointerdown;
//     KHÔNG bấm mù 2 lần liên tiếp: sau mỗi lần bật phải chờ 120s và
//     kiểm tra lại bằng trạng thái thật). Bài học 17:51 25/11: bấm thừa
//     lúc Phi Hành đang bật sẵn = TẮT, tốc độ tụt còn ~4/phút.
//  6. Chống trôi khu (chế độ NGHIÊM — mặc định TẮT): tab Farm vốn đã có
//     kiemTraKhu — trôi sang khu NHANH (>=5/phút) thì Ở LẠI, trôi sang
//     khu CHẬM thì tự về đích. Chế độ nghiêm của tab này: trôi sang BẤT
//     KỲ khu nào khác đích cũng tự quay lại khu đích (farm.stop() rồi
//     farm.start() — runToTarget đi lại qua biển KHU rìa đông (30,20)).
//     Bật chế độ nghiêm khi muốn giữ đúng 1 khu. KHÔNG BAO GIỜ bấm
//     Ghi danh tranh khu 20.000 LT.
//  7. Canh Giáp nguy hiểm: Giáp <20% hoặc HP <30% mà mục tiêu hiện tại
//     là Đầu Đàn/Biến Dị (#target-name) thì TỰ RÚT LUI: tắt Auto, bật
//     Phi Hành bay về điểm an toàn của map (farm._maps[map].safe),
//     thiền hồi Giáp (farm._thienHoiGiap), xong bật lại Phi Hành.
//     Khác thiền tại chỗ của tab Farm (Giáp <35% thiền tại chỗ — vẫn
//     bị boss đánh tiếp).
//  - Cả 3 watcher chỉ chạy khi tab Farm đang BẬT + phase farming.
//  - CHƯA TEST LIVE: luồng rút lui + thiền ở điểm an toàn chưa chạy
//    trên game thật (cần Thanh bật tab trong 1 ca farm).
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_canh_cfg';

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, fly: c.fly !== false, khuStrict: !!c.khuStrict, giap: c.giap !== false,
      };
    } catch (e) { return { on: false, fly: true, khuStrict: false, giap: true }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var logLines = [];
  // Canh Phi Hành.
  var rateSamples = []; // [{t, rate}]
  var lastFlyBat = 0;
  var daBatFlyLanNay = false;
  // Chống trôi khu.
  var lastKhuCheck = 0;
  // Canh Giáp.
  var lastGiapCheck = 0;
  var dangRutLui = false;
  var lastRutLui = 0;

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function docHP() {
    var el = $('.pl-bar.hp .pl-n');
    if (!el) return null;
    var m = txt(el).match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return null;
    return { cur: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  }
  function tenMucTieu() {
    var el = $('#target-name');
    return el ? txt(el) : '';
  }
  function farmDangFarm() {
    var f = farm();
    if (!f) return null;
    try {
      var st = f.status();
      if (st && st.on && st.phase === 'farming') return st;
    } catch (e) { /* bỏ qua */ }
    return null;
  }

  // ---------------- 5. Canh Phi Hành ----------------
  // Ghi mẫu tốc độ mỗi 30s; trả về true nếu nên bật lại Phi Hành.
  function canBatLaiFly(rateHienTai, rateTruoc, dangBay) {
    if (dangBay) return false;
    if (rateTruoc === null || rateTruoc < 8) return false;
    if (rateHienTai === null || rateHienTai >= 4) return false;
    return true;
  }
  function kiemTraFly(now) {
    var fst = farmDangFarm();
    if (!fst) { rateSamples = []; return; }
    var rate = (typeof fst.ratePerMin === 'number') ? fst.ratePerMin : 0;
    var last = rateSamples.length ? rateSamples[rateSamples.length - 1] : null;
    if (!last || now - last.t >= 30000) {
      rateSamples.push({ t: now, rate: rate });
      if (rateSamples.length > 20) rateSamples = rateSamples.slice(-20);
    }
    if (rateSamples.length < 2) return;
    var truoc = rateSamples[rateSamples.length - 2].rate;
    var nv = nav();
    var dangBay = false;
    try { dangBay = nv ? !!nv.flyDangBat() : !!fst.flyOn; } catch (e) { dangBay = !!fst.flyOn; }
    if (now - lastFlyBat < 120000) return; // cooldown 120s sau mỗi lần bật
    if (canBatLaiFly(rate, truoc, dangBay)) {
      lastFlyBat = now;
      daBatFlyLanNay = true;
      log('Tốc độ tụt ' + truoc.toFixed(1) + ' -> ' + rate.toFixed(1) + '/phút, nhân vật đang ở mặt đất — bật lại Phi Hành 1 lần.');
      try { if (nv) nv.datFly(true); } catch (e) { log('Bật lại Phi Hành lỗi: ' + (e && e.message)); }
    }
  }

  // ---------------- 6. Chống trôi khu (nghiêm) ----------------
  function kiemTraKhu(now) {
    if (!cfg.khuStrict) return;
    if (now - lastKhuCheck < 30000) return;
    lastKhuCheck = now;
    var fst = farmDangFarm();
    if (!fst) return;
    if (fst.khu === null || fst.khu === undefined) return;
    if (fst.khu !== fst.targetKhu) {
      log('CHẾ ĐỘ NGHIÊM: Auto trôi Khu ' + fst.targetKhu + ' -> Khu ' + fst.khu + ' — quay lại khu đích ngay (dù khu mới có nhanh).');
      var f = farm();
      try { f.stop(); f.start(); } catch (e) { log('Quay lại khu lỗi: ' + (e && e.message)); }
    }
  }

  // ---------------- 7. Canh Giáp nguy hiểm ----------------
  function laBossNguyHiem(ten) {
    return /Đầu Đàn|Biến Dị/i.test(ten || '');
  }
  async function rutLuiVaThien() {
    var nv = nav();
    var f = farm();
    if (!nv || !f) return;
    dangRutLui = true;
    try {
      var st = f.status();
      var maps = f._maps || {};
      var safe = (maps[st.targetMap] && maps[st.targetMap].safe) || [30, 27];
      log('RÚT LUI: đang đánh boss (' + tenMucTieu() + ') mà Giáp/HP thấp — bay về điểm an toàn (' + safe[0] + ',' + safe[1] + ') thiền hồi.');
      try { nv.datAuto(false); } catch (e) { /* bỏ qua */ }
      try { nv.datFly(true); } catch (e) { /* bỏ qua */ }
      await sleep(500);
      var ok = await nv.diToi(safe[0], safe[1]);
      if (!ok) log('Bay về điểm an toàn chưa tới đích — thiền tại chỗ vậy.');
      if (typeof f._thienHoiGiap === 'function') {
        await f._thienHoiGiap();
        log('Đã thiền hồi Giáp xong.');
      }
      try { nv.datFly(true); } catch (e) { /* bỏ qua */ }
      log('Đã bật lại Phi Hành sau thiền — farm tiếp.');
    } catch (e) {
      log('Rút lui lỗi: ' + (e && e.message));
    } finally {
      dangRutLui = false;
    }
  }
  function kiemTraGiap(now) {
    if (!cfg.giap) return;
    if (dangRutLui) return;
    if (now - lastGiapCheck < 5000) return;
    lastGiapCheck = now;
    var fst = farmDangFarm();
    if (!fst) return;
    var giapPct = (typeof fst.giapPct === 'number') ? fst.giapPct : null;
    var hp = docHP();
    var hpPct = (hp && hp.max > 0) ? (hp.cur / hp.max * 100) : null;
    var nguy = (giapPct !== null && giapPct < 20) || (hpPct !== null && hpPct < 30);
    if (!nguy) return;
    if (!laBossNguyHiem(tenMucTieu())) return; // chỉ rút lui khi đang đánh Đầu Đàn/Biến Dị
    if (now - lastRutLui < 60000) return; // cooldown 60s
    lastRutLui = now;
    log('NGUY HIỂM: Giáp ' + (giapPct === null ? '?' : giapPct.toFixed(0) + '%') + ' / HP ' + (hpPct === null ? '?' : hpPct.toFixed(0) + '%') + ' khi đánh ' + tenMucTieu() + '.');
    rutLuiVaThien();
  }

  // ---------------- Tick ----------------
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      if (cfg.fly) kiemTraFly(now);
      kiemTraKhu(now);
      kiemTraGiap(now);
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); rateSamples = []; log('Tab Canh BẬT — canh Phi Hành + chống trôi khu (nghiêm: ' + (cfg.khuStrict ? 'BẬT' : 'TẮT') + ') + canh Giáp nguy hiểm.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); log('Tab Canh TẮT.'); render(); }
  function status() {
    var fst = null;
    try { fst = farm() ? farm().status() : null; } catch (e) { /* bỏ qua */ }
    return {
      on: on, fly: cfg.fly, khuStrict: cfg.khuStrict, giap: cfg.giap,
      ratePerMin: fst ? fst.ratePerMin : null,
      flyOn: fst ? fst.flyOn : null,
      khuHienTai: fst ? fst.khu : null, khuDich: fst ? fst.targetKhu : null,
      dangRutLui: dangRutLui,
    };
  }

  var panel, elTrangThai, elLog, elFly, elKhuStrict, elGiap;
  function setCollapsed(v) {
    var b = $('#tt2d-canh-body'), m = $('#tt2d-canh-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-canh-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-canh-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT' : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      var fst = null;
      try { fst = farm() ? farm().status() : null; } catch (e) { /* bỏ qua */ }
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') +
        'Phi Hành: ' + (cfg.fly ? 'canh' : 'tắt') + ' · Trôi khu nghiêm: ' + (cfg.khuStrict ? 'BẬT' : 'TẮT') + ' · Giáp: ' + (cfg.giap ? 'canh' : 'tắt') +
        (fst ? ' · tốc độ ' + (fst.ratePerMin || 0) + '/phút · Khu ' + (fst.khu === null ? '?' : fst.khu) + '/' + fst.targetKhu : '');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('canh');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-canh-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>👁️ Canh farm tự động</b>' +
        '<button id="tt2d-canh-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-canh-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>👁️ Canh</b>' +
        '<span id="tt2d-canh-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-canh-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-canh-body">' +
        '<div style="margin-top:6px">' +
          '<label><input type="checkbox" id="tt2d-canh-fly"' + (cfg.fly ? ' checked' : '') + '> Canh Phi Hành (tụt &lt;4/phút thì bật lại 1 lần)</label><br>' +
          '<label><input type="checkbox" id="tt2d-canh-khustrict"' + (cfg.khuStrict ? ' checked' : '') + '> Chống trôi khu NGHIÊM (trôi khu nào cũng về đích ngay)</label><br>' +
          '<label><input type="checkbox" id="tt2d-canh-giap"' + (cfg.giap ? ' checked' : '') + '> Canh Giáp nguy hiểm (Giáp &lt;20% / HP &lt;30% khi đánh Đầu Đàn/Biến Dị thì rút lui + thiền)</label>' +
        '</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-canh-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT canh</button>' +
          '<button id="tt2d-canh-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-canh-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Chỉ chạy khi tab Farm đang BẬT + đang farm. Phi Hành chỉ bật lại 1 lần mỗi 120s và chỉ khi kiểm tra bằng trạng thái thật (đang ở mặt đất) — không bấm mù. Trôi khu nghiêm TẮT mặc định: tab Farm vốn ở lại khu nhanh (>=5/phút) khi trôi.</div>' +
        '<div id="tt2d-canh-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-canh-trangthai');
    elLog = $('#tt2d-canh-log');
    elFly = $('#tt2d-canh-fly');
    elKhuStrict = $('#tt2d-canh-khustrict');
    elGiap = $('#tt2d-canh-giap');
    $('#tt2d-canh-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-canh-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-canh-start').addEventListener('click', function () { start(); });
    $('#tt2d-canh-stop').addEventListener('click', function () { stop(); });
    elFly.addEventListener('change', function () { cfg.fly = elFly.checked; saveCfg(); render(); });
    elKhuStrict.addEventListener('change', function () { cfg.khuStrict = elKhuStrict.checked; saveCfg(); render(); });
    elGiap.addEventListener('change', function () { cfg.giap = elGiap.checked; saveCfg(); render(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Canh đã nạp. Bật tab để canh Phi Hành + trôi khu + Giáp khi farm.');

  window.__TT2D_CANH__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _canBatLaiFly: canBatLaiFly,
    _laBossNguyHiem: laBossNguyHiem,
    _setKhuStrict: function (v) { cfg.khuStrict = !!v; saveCfg(); if (elKhuStrict) elKhuStrict.checked = cfg.khuStrict; },
  };
  Tong.register('canh', window.__TT2D_CANH__);
})();


  // ================= MODULE: tangkinh (Tàng Kinh free + Điểm Danh, mới v1.4.0) =================

// ================= MODULE: TÀNG KINH FREE + ĐIỂM DANH (mới v1.4.0) =================
// Tab Tàng Kinh (lệnh Thanh 19:19 25/11 "Làm đi" — tính năng 8/11):
//  - Điểm Danh tự động (client DiemDanh, game.js 24/11):
//      DiemDanh.trangThai() -> {daNhan, tong, daLay, keTiep};
//      DiemDanh.coTheNhan() — cần cảnh giới >= Luyện Khí tầng 7 VÀ
//      ĐÃ DỰ 1 kỳ Đại Hội trong ngày (Quest.flags['dai_hoi_ngay']);
//      DiemDanh.nhan() -> {ok, why, qua} — nhận thưởng ngày keTiep.
//    Tool chỉ gọi nhan() khi coTheNhan() đúng; chưa đủ điều kiện thì
//    chỉ log lý do (vd "cần dự Đại Hội hôm nay trước"), không gọi bừa.
//  - Tàng Kinh free: mỗi ngày 1 lượt Chủ động + 1 lượt Bị động MIỄN PHÍ
//    (client: mỗi tủ sách có cờ free "1 lượt miễn phí/ngày"; trùng
//    quyển được hoàn một phần Linh Thạch). Tool chỉ bấm nút khi thấy
//    chữ "Miễn phí" trên bảng quay — KHÔNG BAO GIỜ bấm nút có ghi giá
//    Linh Thạch (quay trả phí: Chủ động Sơ Cấp 100 / Trung Cấp 1.000 /
//    Thượng Phẩm 5.000, Bị động 500).
//  - Mở bảng quay: Hành Trang (B) -> Hoạt Động (#ht-hoat-dong) -> thẻ
//    "Tàng Kinh Các". Tool thử bấm thẻ nếu bảng Hoạt Động đang mở; nếu
//    chưa mở thì log hướng dẫn mở tay rồi bấm "QUAY FREE NGAY" trên tab.
//    (Đường mở bảng từ đầu chưa xác minh live — nút quay chỉ bấm khi
//    thấy chữ Miễn phí nên không có rủi ro quay trả phí.)
//  - CHƯA TEST LIVE: cả 2 luồng chưa chạy trên game thật (cần Thanh bật
//    tab khi đang ở làng để đối chiếu).
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_tangkinh_cfg';
  var NGAY_KEY = 'tt2d_tangkinh_ngay'; // {ngay, diemDanh:bool, free:0}

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return { on: !!c.on };
    } catch (e) { return { on: false }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var logLines = [];
  var lastLogDD = 0;
  var lastLogFree = 0;
  var daThuMoBang = false;

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function ngayStr(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function docNgay() {
    try {
      var n = JSON.parse(localStorage.getItem(NGAY_KEY) || '{}');
      var homNay = ngayStr(new Date());
      if (n.ngay !== homNay) return { ngay: homNay, diemDanh: false, free: 0 };
      return { ngay: homNay, diemDanh: !!n.diemDanh, free: n.free || 0 };
    } catch (e) { return { ngay: ngayStr(new Date()), diemDanh: false, free: 0 }; }
  }
  function ghiNgay(n) { try { localStorage.setItem(NGAY_KEY, JSON.stringify(n)); } catch (e) { /* bỏ qua */ } }
  function hetPhien() {
    var f = $('#auth-name');
    return !!(f && f.offsetParent !== null);
  }
  function dangOLang() {
    try {
      var nv = nav();
      if (nv) { var p = nv.docViTri(); return p && p.map === 'tan_vien'; }
    } catch (e) { /* bỏ qua */ }
    var hm = $('#hud-map');
    return hm ? /Chân Núi/.test(txt(hm)) : false;
  }

  // ---------------- Điểm Danh ----------------
  function ddTrangThai() {
    try {
      var D = ns() && ns().DiemDanh;
      if (D && typeof D.trangThai === 'function') return D.trangThai();
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function nhanDiemDanh() {
    var D = ns() && ns().DiemDanh;
    if (!D) return { ok: false, why: 'Không thấy DiemDanh trong game.' };
    try {
      if (typeof D.coTheNhan === 'function' && !D.coTheNhan()) {
        var tt = (typeof D.trangThai === 'function') ? D.trangThai() : null;
        if (tt && tt.daNhan) return { ok: false, why: 'Hôm nay đã điểm danh rồi.' };
        return { ok: false, why: 'Chưa đủ điều kiện điểm danh (cần Luyện Khí tầng 7+ và đã dự 1 kỳ Đại Hội hôm nay).' };
      }
      if (typeof D.nhan !== 'function') return { ok: false, why: 'Không thấy DiemDanh.nhan().' };
      return D.nhan();
    } catch (e) { return { ok: false, why: 'Lỗi gọi DiemDanh.nhan(): ' + (e && e.message) }; }
  }
  function thuNhanDiemDanh(now) {
    var n = docNgay();
    if (n.diemDanh) return;
    var r = nhanDiemDanh();
    if (r.ok) {
      n.diemDanh = true; ghiNgay(n);
      var qua = (r.qua || []).map(function (q) { return q.id + ' x' + q.n; }).join(', ');
      log('ĐÃ NHẬN ĐIỂM DANH ngày ' + r.ngay + ' (tổng ' + r.tong + ' ngày): ' + (qua || '?') + '.');
    } else {
      if (now - lastLogDD > 3600000) {
        lastLogDD = now;
        log('Điểm Danh chưa nhận được: ' + (r.why || '?'));
      }
    }
  }

  // ---------------- Tàng Kinh free ----------------
  // Chỉ bấm nút có chữ "Miễn phí" — nút có giá Linh Thạch thì KHÔNG bấm.
  function nutFreeTrongBang() {
    return $$('button').filter(function (b) {
      if (b.disabled) return false;
      if (b.offsetParent === null) return false; // nút đang ẩn
      var t = txt(b);
      if (!/Miễn phí/i.test(t)) return false;
      if (/\d+\s*Linh Thạch|\d+\s*LT/.test(t)) return false; // có giá thì không phải free
      return true;
    });
  }
  function quayFree() {
    var n = docNgay();
    if (n.free >= 2) { log('Hôm nay đã quay đủ 2 lượt free (Chủ động + Bị động).'); return 0; }
    var nuts = nutFreeTrongBang();
    if (!nuts.length) {
      if (Date.now() - lastLogFree > 60000) {
        lastLogFree = Date.now();
        log('Chưa thấy nút "Miễn phí" trên bảng quay — mở bảng Tàng Kinh (Hành Trang → Hoạt Động → Tàng Kinh Các) rồi bấm lại, hoặc để tool tự thử khi ở làng.');
      }
      return 0;
    }
    var dem = 0;
    for (var i = 0; i < nuts.length && n.free < 2; i++) {
      try {
        nuts[i].click();
        n.free += 1; dem += 1;
        log('Đã bấm quay MIỄN PHÍ (' + n.free + '/2 hôm nay).');
      } catch (e) { log('Bấm quay free lỗi: ' + (e && e.message)); }
    }
    ghiNgay(n);
    return dem;
  }
  function moBangTangKinh() {
    // Thử bấm thẻ "Tàng Kinh Các" nếu bảng Hoạt Động đang mở.
    var ht = $('#ht-hoat-dong');
    if (ht && ht.offsetParent !== null) {
      var cards = $$('#ht-hoat-dong button, #ht-hoat-dong [role="button"], #ht-hoat-dong .ht-card');
      for (var i = 0; i < cards.length; i++) {
        if (/Tàng Kinh/.test(txt(cards[i]))) { cards[i].click(); return true; }
      }
      log('Bảng Hoạt Động đang mở nhưng không thấy thẻ Tàng Kinh Các.');
      return false;
    }
    return false;
  }

  // ---------------- Tick ----------------
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      if (hetPhien()) { render(); return; }
      // Điểm Danh: thử nhận bất cứ lúc nào trong ngày (khi đủ điều kiện).
      thuNhanDiemDanh(now);
      // Tàng Kinh free: chỉ khi đang ở làng.
      if (dangOLang()) {
        var n = docNgay();
        if (n.free < 2) {
          if (!daThuMoBang) {
            daThuMoBang = true;
            if (moBangTangKinh()) {
              setTimeout(function () { quayFree(); }, 2000);
            } else {
              log('Đang ở làng — mở bảng Tàng Kinh tay (Hành Trang → Hoạt Động → Tàng Kinh Các) rồi bấm "QUAY FREE NGAY", hoặc để tool thử lại khi bảng mở.');
            }
          } else {
            // Bảng có thể đã mở rồi (người dùng mở tay) — thử bấm free.
            quayFree();
          }
        }
      } else {
        daThuMoBang = false;
      }
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); daThuMoBang = false; log('Tab Tàng Kinh BẬT — tự nhận Điểm Danh (khi đủ điều kiện) + quay 2 lượt free/ngày khi ở làng. KHÔNG BAO GIỜ quay trả phí.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); log('Tab Tàng Kinh TẮT.'); render(); }
  function status() {
    var n = docNgay();
    var tt = ddTrangThai();
    return {
      on: on, diemDanhDaNhan: n.diemDanh || !!(tt && tt.daNhan),
      diemDanhNgayKe: tt ? tt.keTiep : null, diemDanhTong: tt ? tt.tong : null,
      freeDaQuay: n.free, dangOLang: dangOLang(),
    };
  }

  var panel, elTrangThai, elLog;
  function setCollapsed(v) {
    var b = $('#tt2d-tangkinh-body'), m = $('#tt2d-tangkinh-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-tangkinh-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-tangkinh-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT' : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      var st = status();
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') +
        'Điểm Danh: ' + (st.diemDanhDaNhan ? 'đã nhận' : 'chưa nhận') +
        (st.diemDanhNgayKe ? ' (ngày tới ' + st.diemDanhNgayKe + ')' : '') +
        ' · Quay free: ' + st.freeDaQuay + '/2' + (st.dangOLang ? ' · đang ở làng' : '');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('tangkinh');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-tangkinh-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>📖 Tàng Kinh free + Điểm Danh</b>' +
        '<button id="tt2d-tangkinh-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-tangkinh-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>📖 Tàng Kinh</b>' +
        '<span id="tt2d-tangkinh-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-tangkinh-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-tangkinh-body">' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-tangkinh-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT tự động</button>' +
          '<button id="tt2d-tangkinh-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-tangkinh-nhan" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#2a4a5a;color:#fff;cursor:pointer">NHẬN ĐIỂM DANH NGAY</button>' +
          '<button id="tt2d-tangkinh-quay" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#2a4a5a;color:#fff;cursor:pointer">QUAY FREE NGAY</button>' +
        '</div>' +
        '<div id="tt2d-tangkinh-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Điểm Danh cần Luyện Khí tầng 7+ và đã dự 1 kỳ Đại Hội hôm nay (game yêu cầu). Tàng Kinh: 1 free Chủ động + 1 free Bị động/ngày — tool CHỈ bấm nút ghi "Miễn phí", không bao giờ bấm nút có giá Linh Thạch.</div>' +
        '<div id="tt2d-tangkinh-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-tangkinh-trangthai');
    elLog = $('#tt2d-tangkinh-log');
    $('#tt2d-tangkinh-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-tangkinh-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-tangkinh-start').addEventListener('click', function () { start(); });
    $('#tt2d-tangkinh-stop').addEventListener('click', function () { stop(); });
    $('#tt2d-tangkinh-nhan').addEventListener('click', function () {
      var r = nhanDiemDanh();
      if (r.ok) { var n = docNgay(); n.diemDanh = true; ghiNgay(n); log('ĐÃ NHẬN ĐIỂM DANH ngày ' + r.ngay + ': ' + (r.qua || []).map(function (q) { return q.id + ' x' + q.n; }).join(', ') + '.'); }
      else log('Điểm Danh chưa nhận được: ' + (r.why || '?'));
      render();
    });
    $('#tt2d-tangkinh-quay').addEventListener('click', function () { quayFree(); render(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 5000);
  tick();
  log('Tab Tàng Kinh đã nạp. Bật tab để tự nhận Điểm Danh + quay free khi ở làng.');

  window.__TT2D_TANGKINH__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _nhanDiemDanh: nhanDiemDanh,
    _quayFree: quayFree,
    _nutFreeTrongBang: nutFreeTrongBang,
  };
  Tong.register('tangkinh', window.__TT2D_TANGKINH__);
})();


  // ================= MODULE: sodo (Sổ Linh Thạch + bảng tổng 4 acc, mới v1.4.0) =================

// ================= MODULE: SỔ LINH THẠCH + BẢNG TỔNG 4 ACC (mới v1.4.0) =================
// Tab Sổ LT (lệnh Thanh 19:19 25/11 "Làm đi" — tính năng 10+11/11):
//  10. Sổ Linh Thạch: ghi Linh Thạch + quái mỗi 5 phút vào localStorage
//      (key tt2d_sodo_<acc>, giữ 288 mẫu = 24h). Cảnh báo khi LT tăng
//      KHÔNG KHỚP số quái giết: ở Phong Địa mỗi quái ~1 LT nên dLT phải
//      ≈ dQuai (dung sai +50 cho quái 5 LT / Đầu Đàn 2 LT / thời điểm
//      đọc lệch). dLT > dQuai + 50 -> CẢNH BÁO đỏ trong log + cờ canhBao
//      (đây là vụ LT tăng không rõ nguồn 24–25/11: net2 +11.748, chính
//      +5.628, net13 +4.312/+4.989 — báo ngay trong ngày phát hiện).
//  11. Bảng tổng 4 acc: mỗi tab ghi 1 dòng vào key CHUNG
//      tt2d_tong_4acc {acc: {lt, quai, khu, map, hp, giap, at}} mỗi
//      5 phút; bảng này đọc key chung và hiện 4 dòng (traxanhnet /
//      traxanhnet2 / traxanhnet13 / thanhvan2) kèm độ cũ của số liệu.
//      GIỚI HẠN ĐÃ BIẾT: localStorage theo từng trình duyệt/profile —
//      4 acc farm trên 4 profile riêng thì mỗi bảng chỉ thấy dòng của
//      acc mình (+ dòng cũ nếu trước đó acc khác từng chạy cùng profile
//      này). Muốn bảng tổng đầy đủ phải chạy 4 acc chung 1 profile
//      (không khuyến nghị — dễ xung đột phiên) hoặc xem từng bảng riêng.
//  14. Linh Thạch hôm nay (mới v1.4.0, lệnh Thanh 19:50 — xây trên 11):
//      mỗi acc 1 dòng: LT hiện tại · LT từ quái hôm nay (bộ đếm "Hôm nay
//      từ quái" của game — mỗi quái ~1 LT, trần Trúc Cơ 10.000 / LK T13
//      5.000) · Kiếm được hôm nay TỔNG (mọi nguồn) · Đã tiêu hôm nay ·
//      tiến độ trần quái (quái x/10.000 hoặc x/5.000). Cách tính tổng
//      kiếm/tiêu: cộng dồn các delta LT dương/âm giữa các mẫu sổ 5 phút
//      (không cần biết nguồn từng khoản); phần tăng vượt quái +50 thì ghi
//      riêng "chưa rõ nguồn" — KHÔNG bịa nguồn. Reset theo ngày game
//      (00:00 giờ VN). LT nhảy bất thường (tăng vượt quái >500 trong ngày,
//      hoặc 1 lần tăng lệch >500, hoặc tụt >1.000 mà quái không tăng) thì
//      dòng đó TÔ ĐỎ + ghi "bất thường?".
//  - Đọc LT từ #hud-stones (HUD Linh Thạch), dự phòng #stone-count /
//    #bag-wallet; đọc quái từ #stone-day ("Hôm nay từ quái N/M") như
//    tab Farm (dự phòng Loot.stoneToday()).
//  - CHƯA TEST LIVE: số LT đọc từ HUD + cảnh báo lệch chưa đối chiếu
//    trên game thật (cần Thanh bật tab trong 1 ca farm để xem log).
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_sodo_cfg';
  var SODO_PREFIX = 'tt2d_sodo_';
  var NGAY_PREFIX = 'tt2d_sodo_ngay_'; // tổng kết ngày từng acc (tính năng 14)
  var TONG_KEY = 'tt2d_tong_4acc';
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];
  var DUNG_SAI_LT = 50; // LT tăng vượt quái + 50 thì cảnh báo
  var GHI_MOI_MS = 300000; // ghi mẫu mỗi 5 phút
  var GHI_TONG_MS = 300000;
  var VN_OFFSET_MS = 7 * 3600000; // ngày game reset 00:00 giờ VN

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return { on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet' };
    } catch (e) { return { on: false, acc: 'traxanhnet' }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var logLines = [];
  var lastGhi = 0;
  var lastGhiTong = 0;
  var canhBao = false;
  var lastMau = null;   // mẫu trước {t, lt, quai}
  var lastCanhBaoMsg = '';

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function nav() { return window.__TT2D_NAV__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function docLT() {
    // HUD Linh Thạch: #hud-stones trước, dự phòng #stone-count / #bag-wallet.
    var sels = ['#hud-stones', '#stone-count', '#bag-wallet'];
    for (var i = 0; i < sels.length; i++) {
      var el = $(sels[i]);
      if (!el) continue;
      var m = txt(el).replace(/[.,\s]/g, '').match(/(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
    return null;
  }
  function docQuai() {
    try {
      var el = $('#stone-day');
      var t = el ? txt(el) : '';
      var m = t.match(/(\d+)\s*\/\s*(\d+)/);
      if (m) return { da: parseInt(m[1], 10), tran: parseInt(m[2], 10) };
      var L = ns() && ns().Loot;
      if (L && typeof L.stoneToday === 'function') {
        var r = L.stoneToday();
        if (r && typeof r.da === 'number') return { da: r.da, tran: r.tran };
      }
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function docDaoHieu() {
    try {
      var n = ns();
      if (!n) return '';
      var p = n.SceneWorld && n.SceneWorld.player;
      if (p && p.name) return String(p.name);
      var me = n.Gateway && n.Gateway.me;
      if (me && me.name) return String(me.name);
    } catch (e) { /* bỏ qua */ }
    return '';
  }
  function docHP() {
    var el = $('.pl-bar.hp .pl-n');
    if (!el) return null;
    var m = txt(el).match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return null;
    return { cur: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  }
  function docGiapPct() {
    try {
      var s = $('.pl-bar.hp s');
      if (!s) return null;
      var w = parseFloat((s.style && s.style.width) || '');
      return isFinite(w) ? w : null;
    } catch (e) { return null; }
  }
  function docKhu() {
    try {
      var k = ns() && ns().KhuUI && ns().KhuUI.khu;
      return (typeof k === 'number') ? k : null;
    } catch (e) { return null; }
  }

  // ---------------- 10. Sổ Linh Thạch ----------------
  // LT tăng vượt quái + dung sai -> lệch. Trả {dLT, dQuai, lech, canhBao}.
  function chenhLech(ltMoi, quaiMoi, ltCu, quaiCu) {
    if (ltMoi === null || quaiMoi === null || ltCu === null || quaiCu === null) {
      return { dLT: null, dQuai: null, lech: null, canhBao: false };
    }
    var dLT = ltMoi - ltCu;
    var dQuai = quaiMoi - quaiCu;
    // Quái reset 00:00 (dQuai âm) hoặc LT giảm (mua đồ) thì không kết luận.
    if (dQuai < 0 || dLT < 0) return { dLT: dLT, dQuai: dQuai, lech: null, canhBao: false };
    var lech = dLT - dQuai;
    return { dLT: dLT, dQuai: dQuai, lech: lech, canhBao: lech > DUNG_SAI_LT };
  }
  function docMauDaLuu() {
    try {
      var arr = JSON.parse(localStorage.getItem(SODO_PREFIX + cfg.acc) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  // ---------------- 14. Linh Thạch hôm nay ----------------
  // Ngày VN (game reset 00:00 giờ VN — cộng 7h rồi lấy ngày UTC).
  function ngayVNStr(ms) {
    var d = new Date((Number(ms) || 0) + VN_OFFSET_MS);
    var y = d.getUTCFullYear();
    var mo = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    var dd = ('0' + d.getUTCDate()).slice(-2);
    return y + '-' + mo + '-' + dd;
  }
  function docNgayHomNay(acc) {
    var a = acc || cfg.acc;
    try {
      var o = JSON.parse(localStorage.getItem(NGAY_PREFIX + a) || 'null');
      if (o && o.ngay) return o;
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function luuNgayHomNay(o) {
    try { localStorage.setItem(NGAY_PREFIX + cfg.acc, JSON.stringify(o)); } catch (e) { /* bỏ qua */ }
  }
  // Cập nhật tổng kết ngày từ 1 mẫu mới {lt, quai}. Delta dương = kiếm
  // được, delta âm = đã tiêu; phần tăng vượt quái +50 = "chưa rõ nguồn"
  // (KHÔNG bịa nguồn). Qua ngày mới (hoặc quái reset) thì lập mốc mới.
  function capNhatNgay(now, lt, quai) {
    var ngay = ngayVNStr(now);
    var o = docNgayHomNay();
    if (!o || o.ngay !== ngay) {
      o = { ngay: ngay, ltDau: lt, quaiDau: quai, kiem: 0, tieu: 0,
        chuaRo: 0, giamLa: 0, batThuong: false, mauCuoiLt: lt, mauCuoiQuai: quai };
      luuNgayHomNay(o);
      return o;
    }
    if (lt === null || quai === null) return o;
    // Quái reset 00:00 mà ngày lưu chưa đổi (tool tắt lúc nửa đêm): lập mốc mới.
    if (o.mauCuoiQuai !== null && quai < o.mauCuoiQuai) {
      o = { ngay: ngay, ltDau: lt, quaiDau: quai, kiem: 0, tieu: 0,
        chuaRo: 0, giamLa: 0, batThuong: false, mauCuoiLt: lt, mauCuoiQuai: quai };
      luuNgayHomNay(o);
      return o;
    }
    var dLT = (o.mauCuoiLt === null) ? null : lt - o.mauCuoiLt;
    var dQuai = (o.mauCuoiQuai === null) ? null : quai - o.mauCuoiQuai;
    if (dLT !== null && dLT > 0) {
      o.kiem += dLT;
      if (dQuai !== null && dQuai >= 0) {
        var thua = dLT - dQuai;
        if (thua > DUNG_SAI_LT) {
          o.chuaRo += thua;
          if (thua > 500) o.batThuong = true; // 1 lần tăng lệch >500
        }
      }
    } else if (dLT !== null && dLT < 0) {
      o.tieu += (-dLT);
      if (dLT < -1000 && (dQuai === null || dQuai <= 10)) {
        o.giamLa += (-dLT);
        o.batThuong = true; // tụt >1.000 mà quái không tăng (vụ -79.601)
      }
    }
    if (o.chuaRo > 500) o.batThuong = true; // cả ngày tăng không rõ nguồn >500
    o.mauCuoiLt = lt;
    o.mauCuoiQuai = quai;
    luuNgayHomNay(o);
    return o;
  }
  function ghiMau(now) {
    var lt = docLT();
    var q = docQuai();
    if (lt === null && !q) { log('Không đọc được LT/quái để ghi sổ (HUD chưa hiện?).'); return; }
    var mau = { t: now, lt: lt, quai: q ? q.da : null };
    var arr = docMauDaLuu();
    if (arr.length) {
      var cu = arr[arr.length - 1];
      var kq = chenhLech(mau.lt, mau.quai, cu.lt, cu.quai);
      if (kq.canhBao) {
        canhBao = true;
        lastCanhBaoMsg = 'LT +' + kq.dLT + ' mà quái chỉ +' + kq.dQuai + ' (lệch +' + kq.lech + ') — KHÔNG KHỚP, kiểm tra xem ai vào acc / nhận thưởng gì.';
        log('⚠️ CẢNH BÁO LT: ' + lastCanhBaoMsg);
      } else if (kq.dLT !== null) {
        log('Sổ LT: LT ' + (cu.lt === null ? '?' : cu.lt) + ' -> ' + mau.lt + ' (+' + kq.dLT + '), quái +' + kq.dQuai + ' — khớp.');
      }
      lastMau = cu;
    }
    arr.push(mau);
    if (arr.length > 288) arr = arr.slice(-288);
    try { localStorage.setItem(SODO_PREFIX + cfg.acc, JSON.stringify(arr)); } catch (e) { /* bỏ qua */ }
    lastMau = mau;
    capNhatNgay(now, mau.lt, mau.quai); // tính năng 14: tổng kết ngày
  }

  // ---------------- 11. Bảng tổng 4 acc ----------------
  function ghiDongTong(now) {
    var dong = {
      acc: cfg.acc, lt: docLT(), quai: (function () { var q = docQuai(); return q ? q.da : null; })(),
      tran: (function () { var q = docQuai(); return q ? q.tran : null; })(),
      khu: docKhu(), map: (function () { try { var nv = nav(); return nv ? nv.docViTri().map : null; } catch (e) { return null; } })(),
      hp: (function () { var h = docHP(); return h ? (h.cur + '/' + h.max) : null; })(),
      giap: docGiapPct(), at: now,
      ngay: docNgayHomNay(), // tính năng 14: tổng kết ngày của acc này
    };
    var all = {};
    try { all = JSON.parse(localStorage.getItem(TONG_KEY) || '{}') || {}; } catch (e) { all = {}; }
    all[cfg.acc] = dong;
    try { localStorage.setItem(TONG_KEY, JSON.stringify(all)); } catch (e) { /* bỏ qua */ }
  }
  function docBangTong() {
    try {
      var all = JSON.parse(localStorage.getItem(TONG_KEY) || '{}') || {};
      return all;
    } catch (e) { return {}; }
  }

  // ---------------- Tick ----------------
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      if (now - lastGhi >= GHI_MOI_MS) { lastGhi = now; ghiMau(now); }
      if (now - lastGhiTong >= GHI_TONG_MS) { lastGhiTong = now; ghiDongTong(now); }
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); lastGhi = 0; lastGhiTong = 0; log('Sổ Linh Thạch BẬT — ghi LT/quái mỗi 5 phút, cảnh báo khi LT tăng không khớp quái.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); log('Sổ Linh Thạch TẮT.'); render(); }
  function status() {
    var lt = docLT();
    var q = docQuai();
    return {
      on: on, acc: cfg.acc, lt: lt, quai: q ? q.da : null,
      tran: q ? q.tran : null,
      canhBao: canhBao, lastCanhBao: lastCanhBaoMsg || null,
      mauDaLuu: docMauDaLuu().length,
      ngay: docNgayHomNay(),
    };
  }

  var panel, elTrangThai, elLog, elAcc, elBang, elNgay;
  function setCollapsed(v) {
    var b = $('#tt2d-sodo-body'), m = $('#tt2d-sodo-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-sodo-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-sodo-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT' : 'TẮT') : '';
  }
  function tuoiText(at) {
    if (!at) return '—';
    var phut = Math.max(0, Math.round((Date.now() - at) / 60000));
    if (phut < 1) return 'vừa xong';
    if (phut < 60) return phut + ' phút trước';
    return Math.floor(phut / 60) + 'h' + (phut % 60) + 'p trước';
  }
  function render() {
    if (elTrangThai) {
      var st = status();
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') +
        'LT ' + (st.lt === null ? '?' : st.lt.toLocaleString('vi-VN')) +
        ' · quái ' + (st.quai === null ? '?' : st.quai) +
        ' · đã lưu ' + st.mauDaLuu + ' mẫu' +
        (st.canhBao ? ' · ⚠️ LT LỆCH!' : '');
    }
    if (elBang) {
      var all = docBangTong();
      var rows = ACCS.map(function (a) {
        var d = all[a];
        if (!d) return '<tr><td>' + a + '</td><td colspan="5" style="color:#888">chưa có số liệu (acc chưa chạy tab này)</td></tr>';
        return '<tr><td><b>' + a + '</b></td>' +
          '<td>' + (d.lt === null || d.lt === undefined ? '?' : d.lt.toLocaleString('vi-VN')) + '</td>' +
          '<td>' + (d.quai === null || d.quai === undefined ? '?' : d.quai) + '</td>' +
          '<td>' + (d.map || '?') + ' K' + (d.khu === null || d.khu === undefined ? '?' : d.khu) + '</td>' +
          '<td>' + (d.hp || '?') + ' / Giáp ' + (d.giap === null || d.giap === undefined ? '?' : Math.round(d.giap) + '%') + '</td>' +
          '<td>' + tuoiText(d.at) + '</td></tr>';
      }).join('');
      elBang.innerHTML =
        '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
        '<tr style="color:#cbb37a"><td>Acc</td><td>LT</td><td>Quái</td><td>Khu</td><td>HP/Giáp</td><td>Cập nhật</td></tr>' +
        rows + '</table>' +
        '<div style="color:#888;margin-top:2px">Mỗi acc ghi 1 dòng vào key chung mỗi 5 phút. localStorage theo từng profile trình duyệt — 4 acc chạy 4 profile riêng thì bảng chỉ thấy acc của mình.</div>';
    }
    if (elNgay) {
      // Tính năng 14: bảng "Linh Thạch hôm nay" — 1 dòng/acc từ key chung.
      var allN = docBangTong();
      var homNay = ngayVNStr(Date.now());
      var rowsN = ACCS.map(function (a) {
        var d = allN[a];
        var ng = d && d.ngay;
        if (!ng || ng.ngay !== homNay) {
          return '<tr><td>' + a + '</td><td colspan="6" style="color:#888">chưa có số liệu hôm nay (acc chưa chạy tab này)</td></tr>';
        }
        var tuQuai = (ng.mauCuoiQuai === null || ng.mauCuoiQuai === undefined) ? '?'
          : ng.mauCuoiQuai.toLocaleString('vi-VN');
        var tranQ = (d.tran === null || d.tran === undefined) ? '?' : d.tran.toLocaleString('vi-VN');
        var ghiChu = ng.batThuong
          ? '<span style="color:#ff7b6b;font-weight:bold">⚠️ bất thường?</span>' +
            (ng.chuaRo > 0 ? ' chưa rõ nguồn +' + ng.chuaRo.toLocaleString('vi-VN') : '') +
            (ng.giamLa > 0 ? ' tụt lạ −' + ng.giamLa.toLocaleString('vi-VN') : '')
          : (ng.chuaRo > 0 ? 'chưa rõ nguồn +' + ng.chuaRo.toLocaleString('vi-VN') : 'khớp quái');
        var styleRow = ng.batThuong ? ' style="background:rgba(255,60,40,0.18)"' : '';
        return '<tr' + styleRow + '><td><b>' + a + '</b></td>' +
          '<td>' + (d.lt === null || d.lt === undefined ? '?' : d.lt.toLocaleString('vi-VN')) + '</td>' +
          '<td>' + tuQuai + '</td>' +
          '<td>+' + ng.kiem.toLocaleString('vi-VN') + '</td>' +
          '<td>−' + ng.tieu.toLocaleString('vi-VN') + '</td>' +
          '<td>' + tuQuai + '/' + tranQ + '</td>' +
          '<td>' + ghiChu + '</td></tr>';
      }).join('');
      elNgay.innerHTML =
        '<b style="color:#ffd27a">📅 Linh Thạch hôm nay (' + homNay + ')</b>' +
        '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:2px">' +
        '<tr style="color:#cbb37a"><td>Acc</td><td>LT hiện tại</td><td>LT từ quái</td><td>Kiếm được</td><td>Đã tiêu</td><td>Trần quái</td><td>Ghi chú</td></tr>' +
        rowsN + '</table>' +
        '<div style="color:#888;margin-top:2px">LT từ quái = bộ đếm "Hôm nay từ quái" của game (mỗi quái ~1 LT). Kiếm/tiêu = cộng dồn delta LT giữa các mẫu 5 phút; phần tăng vượt quái +50 ghi "chưa rõ nguồn", không bịa nguồn. Reset 00:00 giờ VN.</div>';
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('sodo');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-sodo-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>📒 Sổ Linh Thạch + bảng 4 acc</b>' +
        '<button id="tt2d-sodo-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-sodo-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>📒 Sổ LT</b>' +
        '<span id="tt2d-sodo-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-sodo-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-sodo-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-sodo-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select> ' +
        '<button id="tt2d-sodo-ghi" style="padding:3px 8px;border-radius:5px;border:1px solid #8a6a2f;background:#2a4a5a;color:#fff;cursor:pointer">Ghi mẫu ngay</button></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-sodo-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT ghi sổ</button>' +
          '<button id="tt2d-sodo-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-sodo-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div id="tt2d-sodo-bang" style="margin-top:6px;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
        '<div id="tt2d-sodo-ngay" style="margin-top:6px;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
        '<div style="margin-top:4px;color:#cbb37a">Ghi LT/quái mỗi 5 phút (giữ 24h). Cảnh báo khi LT tăng vượt quái +50 (mỗi quái Phong Địa ~1 LT).</div>' +
        '<div id="tt2d-sodo-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-sodo-trangthai');
    elLog = $('#tt2d-sodo-log');
    elAcc = $('#tt2d-sodo-acc');
    elBang = $('#tt2d-sodo-bang');
    elNgay = $('#tt2d-sodo-ngay');
    $('#tt2d-sodo-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-sodo-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-sodo-start').addEventListener('click', function () { start(); });
    $('#tt2d-sodo-stop').addEventListener('click', function () { stop(); });
    $('#tt2d-sodo-ghi').addEventListener('click', function () { lastGhi = 0; lastGhiTong = 0; tick(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); lastMau = null; render(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 5000);
  tick();
  log('Tab Sổ LT đã nạp. Bật tab để ghi LT/quái mỗi 5 phút + hiện bảng 4 acc.');

  window.__TT2D_SODO__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _chenhLech: chenhLech,
    _docLT: docLT,
    _docQuai: docQuai,
    _docBangTong: docBangTong,
    _ghiMau: ghiMau,
    _docNgayHomNay: docNgayHomNay,
    _capNhatNgay: capNhatNgay,
    _ngayVNStr: ngayVNStr,
    _ghiDongTong: ghiDongTong,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('sodo', window.__TT2D_SODO__);
})();


  // ================= MODULE: tongmonchien (Tông Môn Chiến tự động, mới v1.5.0) =================

// ================= MODULE: TÔNG MÔN CHIẾN TỰ ĐỘNG (mới v1.5.0) =================
// Tab Tông Môn Chiến (lệnh Thanh 19:36 25/11 — mục 1/8 đợt 2):
//  - Thứ Ba + thứ Bảy, 21:00–21:30; sổ mở 20:45 (MO_DANG_KY_TRUOC 15
//    phút, client game.js 24/11 — TongMonChien: GIO_KHAI=21, THU_KHAI=
//    [2,6], LUOT_MOI_TONG=5, TRAN_MOI_LUOT=3, TRAN_KEO_DAI=90s,
//    TOI_THIEU_ONLINE=3, TUOI_THANH_VIEN_MS=3h, TOI_DA_HON_CHIEN=10,
//    THUONG_LINH_THACH=10000/lượt thắng).
//  - KHÔNG cần ghi danh tay theo nghĩa thông thường — đúng 21:00 tông
//    nào có >=3 thành viên đủ tư cách (vào tông >=3 giờ) đang online
//    thì server tự đưa vào Phòng Chờ (xác minh live 24/11). Tool vẫn
//    mở bảng lúc 20:45 và bấm nút hành động của toast/bảng NẾU game
//    hiện nút ghi danh (dataset.act='ghiDanh' — client có sẵn) để
//    không bỏ lỡ khi server đòi xác nhận.
//  - Vào phòng chờ/trận: đổi NGAY ưu tiên Tự Động Đánh sang 'Nhân vật'
//    (Hotbar.setUuTien('nguoi')); giữ Auto BẬT xuyên các lượt; mỗi lượt
//    3 trận (Tông Chủ 1v1, Trưởng Lão 2v2, hỗn chiến tối đa 10v10),
//    1 mạng/trận, 90s/trận, cấm trận pháp.
//  - Hết kỳ (gd XONG) thì TỰ VỀ FARM tiếp (đích theo acc như Đại Hội).
//  - Đọc trạng thái từ TongMonChienUI.state (gd: BANG/CHO_NHANH/NHANH/
//    PHU/XONG) + TongMonChienUI.tran (trận đang diễn ra).
//  - CHƯA TEST LIVE: luồng bấm nút ghi danh (nếu có) + đọc state mới
//    đối chiếu mã client, chưa chạy trên game thật.
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_tmc_cfg';
  // Lịch: thứ Ba (2) + thứ Bảy (6), khai 21:00, sổ mở 20:45.
  var THU_KHAI = [2, 6];
  var GIO_KHAI = 21;
  var MO_TRUOC_PHUT = 15;
  var LUOT_MOI_TONG = 5;
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        daoHieu: typeof c.daoHieu === 'string' ? c.daoHieu : '',
        veFarm: c.veFarm !== false,
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', daoHieu: '', veFarm: true }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle';           // idle|cho|dang_ky|phong_cho|dang_dau|xong|het_phien|sai_acc
  var dangThiDau = false;
  var daDoiUuTien = false;
  var daBamGhiDanh = false;
  var lastKy = null;            // {ngay, thu}
  var logLines = [];
  var lastLogGio = {};

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function logChong(key, msg) {
    var now = Date.now();
    if (lastLogGio[key] && now - lastLogGio[key] < 60000) return;
    lastLogGio[key] = now;
    log(msg);
  }
  function ngayStr(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  // ---------------- Lịch ----------------
  function coKyTrongNgay(d) { return THU_KHAI.indexOf(d.getDay()) >= 0; }
  function trongCuaSo(nowMs) {
    // Sổ mở 20:45, khai 21:00, hết kỳ 21:30 — chỉ ngày có kỳ (T3/T7).
    var d = new Date(nowMs);
    if (!coKyTrongNgay(d)) return false;
    var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), GIO_KHAI, 0, 0).getTime() - MO_TRUOC_PHUT * 60000;
    var dong = new Date(d.getFullYear(), d.getMonth(), d.getDate(), GIO_KHAI, 30, 0).getTime();
    return nowMs >= mo && nowMs <= dong;
  }
  function trongCuaGhiDanh(nowMs) {
    // Cửa sổ mở sổ: 20:45–21:00 (trước giờ khai).
    var d = new Date(nowMs);
    if (!coKyTrongNgay(d)) return false;
    var mo = new Date(d.getFullYear(), d.getMonth(), d.getDate(), GIO_KHAI, 0, 0).getTime() - MO_TRUOC_PHUT * 60000;
    var dong = new Date(d.getFullYear(), d.getMonth(), d.getDate(), GIO_KHAI, 0, 0).getTime();
    return nowMs >= mo && nowMs < dong;
  }
  function kyToi(nowMs) {
    var d = new Date(nowMs);
    for (var i = 0; i < 8; i++) {
      var dd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      if (!coKyTrongNgay(dd)) continue;
      var khai = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate(), GIO_KHAI, 0, 0).getTime();
      if (nowMs < khai) return (i === 0 ? 'tối nay ' : (i === 1 ? 'ngày mai ' : ngayStr(dd) + ' ')) + '21:00';
    }
    return '—';
  }

  // ---------------- Trạng thái game ----------------
  function docDaoHieu() {
    try {
      var n = ns();
      if (!n) return '';
      var p = n.SceneWorld && n.SceneWorld.player;
      if (p && p.name) return String(p.name);
      var me = n.Gateway && n.Gateway.me;
      if (me && me.name) return String(me.name);
    } catch (e) { /* bỏ qua */ }
    return '';
  }
  function hetPhien() {
    var f = $('#auth-name');
    return !!(f && f.offsetParent !== null);
  }
  function tmcState() {
    try { return (ns() && ns().TongMonChienUI && ns().TongMonChienUI.state) || null; } catch (e) { return null; }
  }
  function tmcTran() {
    try { return (ns() && ns().TongMonChienUI && ns().TongMonChienUI.tran) || null; } catch (e) { return null; }
  }
  function dangTrongTran() {
    var st = tmcState();
    if (st && st.gd && st.gd !== 'XONG') return true;
    if (tmcTran()) return true;
    var t = $('#tmc-tran');
    return !!(t && !t.classList.contains('hidden'));
  }
  function daXong() {
    var st = tmcState();
    return !!(st && st.gd === 'XONG');
  }
  function uuTienHienTai() {
    try {
      var H = ns() && ns().Hotbar;
      if (H && typeof H.uuTien === 'function') return H.uuTien();
    } catch (e) { /* bỏ qua */ }
    var b = document.querySelector('[data-uu-tien].on');
    return b ? b.getAttribute('data-uu-tien') : '';
  }
  function datUuTienNguoi() {
    try {
      var H = ns() && ns().Hotbar;
      if (H && typeof H.setUuTien === 'function') {
        H.setUuTien('nguoi');
        if (H.uuTien() === 'nguoi') return true;
      }
    } catch (e) { /* rơi xuống fallback */ }
    var b = document.querySelector('[data-uu-tien="nguoi"]');
    if (b) { b.click(); return true; }
    return false;
  }

  // ---------------- Mở bảng + ghi danh (nếu game đòi) ----------------
  function moBang() {
    try {
      var T = ns() && ns().TongMonChienUI;
      if (T && typeof T.show === 'function') { T.show(); return true; }
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  function bamGhiDanhNeuCo() {
    // Nút hành động của toast/bảng Tông Môn Chiến (.tmc-act) — chỉ bấm
    // khi game hiện đúng nút ghi danh (dataset.act='ghiDanh'). Server
    // thường tự đưa tông vào phòng chờ lúc 21:00 nên nút có thể không
    // hiện — không có nút thì thôi, không ép.
    var b = document.querySelector('.tmc-act');
    if (b && !b.classList.contains('hidden') && !b.disabled && b.dataset.act === 'ghiDanh') {
      b.click();
      return true;
    }
    return false;
  }

  async function veFarm() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — ở lại, cần về farm tay.'); return; }
    log('Về farm tiếp: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try {
      f.stop();
      f.setTarget(preset.map, preset.khu);
      await sleep(300);
      f.start();
    } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  // ---------------- Tick chính ----------------
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      if (hetPhien()) {
        if (phase !== 'het_phien') { phase = 'het_phien'; log('Phiên đăng nhập đã hết hạn — KHÔNG tham gia Tông Môn Chiến. Đăng nhập lại rồi bật lại tab.'); }
        render(); return;
      }
      var d = new Date(now);
      var key = ngayStr(d);
      if (lastKy && lastKy.ngay !== key) { lastKy = null; daBamGhiDanh = false; daDoiUuTien = false; dangThiDau = false; }
      if (!trongCuaSo(now)) {
        if (dangThiDau) {
          // Ngoài cửa sổ mà vẫn cờ đang đấu (vd trận kéo dài quá 21:30):
          // chờ state XONG mới về farm; nếu state đã XONG thì về.
          if (daXong()) {
            dangThiDau = false; daDoiUuTien = false;
            phase = 'xong';
            log('Đã xong Tông Môn Chiến.');
            if (cfg.veFarm) veFarm();
          }
        } else {
          phase = 'cho';
        }
        render(); return;
      }
      // Trong cửa sổ 20:45–21:30 của kỳ T3/T7.
      if (!lastKy) lastKy = { ngay: key };
      // Kiểm tra đạo hiệu trước khi tham gia.
      var dh = docDaoHieu();
      if (cfg.daoHieu && dh && dh !== cfg.daoHieu) {
        phase = 'sai_acc';
        on = false; cfg.on = false; saveCfg();
        log('DỪNG: đạo hiệu đang đăng nhập là "' + dh + '", khác "' + cfg.daoHieu + '" — KHÔNG tham gia (tránh vào nhầm acc).');
        render(); return;
      }
      // Cửa sổ mở sổ 20:45–21:00: mở bảng, bấm ghi danh NẾU game hiện nút.
      if (trongCuaGhiDanh(now)) {
        phase = 'dang_ky';
        if (moBang()) {
          if (!daBamGhiDanh && bamGhiDanhNeuCo()) {
            daBamGhiDanh = true;
            log('Đã bấm ghi danh Tông Môn Chiến (nút .tmc-act).');
          } else if (!daBamGhiDanh) {
            logChong('cho-vao', 'Đã mở bảng Tông Môn Chiến — chờ server tự đưa tông vào phòng chờ lúc 21:00 (>=3 thành viên đủ tư cách online).');
          }
        } else {
          logChong('khong-mo-bang', 'Không mở được bảng Tông Môn Chiến (TongMonChienUI.show không có) — mở tay qua Tông Môn.');
        }
        render(); return;
      }
      // 21:00–21:30: đang trong kỳ.
      if (dangTrongTran() || daXong()) {
        if (daXong()) {
          if (dangThiDau) {
            dangThiDau = false; daDoiUuTien = false;
            phase = 'xong';
            log('Đã xong Tông Môn Chiến (gd XONG).');
            if (cfg.veFarm) veFarm();
          } else {
            phase = 'xong';
          }
          render(); return;
        }
        phase = 'dang_dau';
        if (!dangThiDau) { dangThiDau = true; daDoiUuTien = false; log('Đã vào phòng chờ/trận Tông Môn Chiến.'); }
        if (!daDoiUuTien) {
          if (datUuTienNguoi()) {
            daDoiUuTien = true;
            log('Đã đổi ưu tiên Tự Động Đánh sang NHÂN VẬT (Tông Môn Chiến).');
          } else {
            logChong('doi-uu-tien', 'Chưa đổi được ưu tiên sang Nhân vật — mở Cài Đặt đổi tay.');
          }
        }
        var nv = nav();
        if (nv && typeof nv.datAuto === 'function') {
          try { nv.datAuto(true); } catch (e) { /* bỏ qua */ }
        }
        render(); return;
      }
      // 21:00–21:30 nhưng chưa thấy trận (đang chờ server xếp): giữ chờ.
      phase = 'phong_cho';
      logChong('cho-xep', 'Đang chờ server đưa vào phòng chờ/trận (tông cần >=3 thành viên đủ tư cách online).');
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  // ---------------- Bật / dừng / debug ----------------
  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; log('Tab Tông Môn Chiến BẬT — sổ mở 20:45 (T3/T7), khai 21:00, đổi Nhân vật khi vào trận, xong về farm tiếp.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; log('Tab Tông Môn Chiến TẮT.'); render(); }
  function status() {
    return {
      on: on, phase: phase, acc: cfg.acc, veFarm: cfg.veFarm,
      dangThiDau: dangThiDau, daBamGhiDanh: daBamGhiDanh,
      kyToi: kyToi(Date.now()),
    };
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elLog, elAcc, elDaoHieu, elVeFarm;
  function setCollapsed(v) {
    var b = $('#tt2d-tongmonchien-body'), m = $('#tt2d-tongmonchien-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-tongmonchien-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-tongmonchien-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        ' · kỳ tới ' + kyToi(Date.now());
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('tongmonchien');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-tongmonchien-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>🏯 Tông Môn Chiến tự động</b>' +
        '<button id="tt2d-tongmonchien-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-tongmonchien-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>🏯 Tông Môn Chiến</b>' +
        '<span id="tt2d-tongmonchien-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-tongmonchien-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-tongmonchien-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-tongmonchien-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select> ' +
        'Đạo hiệu: <input id="tt2d-tongmonchien-dh" value="' + cfg.daoHieu.replace(/"/g, '&quot;') + '" placeholder="để trống = không kiểm tra" style="width:110px;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"></div>' +
        '<div style="margin-top:4px"><label><input type="checkbox" id="tt2d-tongmonchien-vefarm"' + (cfg.veFarm ? ' checked' : '') + '> Xong trận tự về farm tiếp</label></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-tongmonchien-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT Tông Môn Chiến</button>' +
          '<button id="tt2d-tongmonchien-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-tongmonchien-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Thứ Ba + thứ Bảy, sổ mở 20:45, khai 21:00–21:30. Server tự đưa tông vào phòng chờ khi có ≥3 thành viên đủ tư cách (vào tông ≥3 giờ) online — không cần ghi danh tay. Mỗi tông 5 lượt × 3 trận (Tông Chủ 1v1, Trưởng Lão 2v2, hỗn chiến tối đa 10v10), 1 mạng/trận, 90s/trận, cấm trận pháp. Thắng lượt quỹ tông +10.000 LT (hoà +5.000), Chiến Huân thắng +10/hoà +6/thua +3.</div>' +
        '<div id="tt2d-tongmonchien-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-tongmonchien-trangthai');
    elLog = $('#tt2d-tongmonchien-log');
    elAcc = $('#tt2d-tongmonchien-acc');
    elDaoHieu = $('#tt2d-tongmonchien-dh');
    elVeFarm = $('#tt2d-tongmonchien-vefarm');
    $('#tt2d-tongmonchien-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-tongmonchien-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-tongmonchien-start').addEventListener('click', function () { start(); });
    $('#tt2d-tongmonchien-stop').addEventListener('click', function () { stop(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elDaoHieu.addEventListener('change', function () { cfg.daoHieu = elDaoHieu.value.trim(); saveCfg(); });
    elVeFarm.addEventListener('change', function () { cfg.veFarm = elVeFarm.checked; saveCfg(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Tông Môn Chiến đã nạp. Kỳ tới: ' + kyToi(Date.now()) + '.');

  window.__TT2D_TMC__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _trongCuaSo: trongCuaSo,
    _trongCuaGhiDanh: trongCuaGhiDanh,
    _kyToi: kyToi,
    _coKyTrongNgay: coKyTrongNgay,
    _bamGhiDanhNeuCo: bamGhiDanhNeuCo,
    _dangTrongTran: dangTrongTran,
    _daXong: daXong,
    _datUuTienNguoi: datUuTienNguoi,
    _resetKy: function () { lastKy = null; daBamGhiDanh = false; daDoiUuTien = false; dangThiDau = false; },
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('tongmonchien', window.__TT2D_TMC__);
})();


  // ================= MODULE: linthu (Tranh Linh Thụ, mới v1.5.0) =================

// ================= MODULE: TRANH ĐOẠT LINH THỤ TỰ ĐỘNG (mới v1.5.0) =================
// Tab Tranh Đoạt Linh Thụ (lệnh Thanh 19:36 25/11 — mục 2/8 đợt 2):
//  - Suất 20:16 tối thứ Ba + thứ Bảy (THAY Đại Hội Trúc Cơ — client
//    game.js 24/11, LinhThu: TEN="Tranh Đoạt Linh Thụ", MAP="linh_thu",
//    LICH_MO=[{thu:2,gio:20},{thu:6,gio:20}], PHUT_KHOA=16,
//    CHUAN_BI_MS=30000, TRAN_MS=900000 (15 phút), NAN_LAI_MS=45000,
//    TOI_THIEU_MOI_TONG=3, TUOI_THANH_VIEN_MS=3h, TOI_DA_MOT_IP=3,
//    SO_TRAN_MOI_KY=60).
//  - Giai đoạn (client LinhThu.giaiDoan): CHUA_MO (trước 20:00) /
//    DANG_KY (20:00–20:16, sổ mở) / CHUAN_BI (20:16–20:16:30) /
//    DANG_DAU (20:16:30–20:31:30) / KET (sau đó).
//  - Đấu theo tông, tính điểm (24/11: Vân Thanh Tông thua An Nam Quốc
//    131–600, traxanhnet 0 điểm). Vào trận đổi NGAY ưu tiên sang
//    'Nhân vật', giữ Auto BẬT xuyên trận.
//  - Hết trận (KET) thì TỰ VỀ FARM tiếp (đích theo acc như Đại Hội).
//  - Đọc trạng thái từ LinhThu.lich(now) (ưu tiên, đúng mã client) +
//    LinhThuUI.st/tran/bang/ket. Ghi danh: bấm nút của bảng NẾU game
//    hiện nút ghi danh (dataset.act='ghi_danh' trong panel #linhthu
//    hoặc toast) — không ép khi server tự đưa vào.
//  - CHƯA TEST LIVE: luồng mở bảng + bấm ghi danh (đường mở bảng Linh
//    Thụ từ Hoạt Động chưa đối chiếu live) + đọc điểm từ LinhThuUI.bang.
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_linthu_cfg';
  // Lịch client: T3 (2) + T7 (6), 20:00; khóa sổ sau 16 phút (20:16).
  var LICH_MO = [{ thu: 2, gio: 20 }, { thu: 6, gio: 20 }];
  var PHUT_KHOA = 16;
  var CHUAN_BI_MS = 30000;
  var TRAN_MS = 900000;
  var NAN_LAI_MS = 45000;
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        daoHieu: typeof c.daoHieu === 'string' ? c.daoHieu : '',
        veFarm: c.veFarm !== false,
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', daoHieu: '', veFarm: true }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle';           // idle|cho|dang_ky|chuan_bi|dang_dau|xong|het_phien|sai_acc
  var dangThiDau = false;
  var daDoiUuTien = false;
  var daBamGhiDanh = false;
  var lastKyId = null;
  var diemLog = null;
  var logLines = [];
  var lastLogGio = {};

  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function logChong(key, msg) {
    var now = Date.now();
    if (lastLogGio[key] && now - lastLogGio[key] < 60000) return;
    lastLogGio[key] = now;
    log(msg);
  }

  // ---------------- Lịch (đúng mã client LinhThu) ----------------
  function suatTai(nowMs) {
    // Ưu tiên hàm lich() của client khi có.
    try {
      var L = ns() && ns().LinhThu;
      if (L && typeof L.lich === 'function') {
        var r = L.lich(nowMs);
        if (r) return { id: r.id, giaiDoan: r.giaiDoan, moDangKyLuc: r.moDangKyLuc, khoaLuc: r.khoaLuc, khoiLuc: r.khoiLuc, ketThucLuc: r.ketThucLuc, hetCuaSoLuc: r.hetCuaSoLuc };
      }
    } catch (e) { /* tính tay */ }
    // Tính tay theo LICH_MO + PHUT_KHOA/CHUAN_BI/TRAN/NAN_LAI.
    var d0 = new Date(nowMs);
    for (var i = 0; i < 9; i++) {
      var dd = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i);
      for (var j = 0; j < LICH_MO.length; j++) {
        if (LICH_MO[j].thu !== dd.getDay()) continue;
        var khoa = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate(), LICH_MO[j].gio, PHUT_KHOA, 0).getTime();
        var khoi = khoa + CHUAN_BI_MS;
        var ket = khoi + TRAN_MS;
        var het = ket + NAN_LAI_MS + 15000;
        if (nowMs < het) {
          return {
            id: 'linh_thu:' + Math.floor(khoa),
            giaiDoan: null,
            moDangKyLuc: khoa - PHUT_KHOA * 60000,
            khoaLuc: khoa, khoiLuc: khoi, ketThucLuc: ket, hetCuaSoLuc: het,
          };
        }
      }
    }
    return null;
  }
  function giaiDoan(nowMs) {
    var s = suatTai(nowMs);
    if (!s) return 'CHUA_MO';
    if (s.giaiDoan) return s.giaiDoan;
    if (nowMs < s.moDangKyLuc) return 'CHUA_MO';
    if (nowMs < s.khoaLuc) return 'DANG_KY';
    if (nowMs < s.khoiLuc) return 'CHUAN_BI';
    if (nowMs < s.ketThucLuc) return 'DANG_DAU';
    return 'KET';
  }
  function kyToi(nowMs) {
    var s = suatTai(nowMs);
    if (!s) return '—';
    var d = new Date(s.khoaLuc);
    var tenThu = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()];
    return tenThu + ' 20:16';
  }

  // ---------------- Trạng thái game ----------------
  function docDaoHieu() {
    try {
      var n = ns();
      if (!n) return '';
      var p = n.SceneWorld && n.SceneWorld.player;
      if (p && p.name) return String(p.name);
      var me = n.Gateway && n.Gateway.me;
      if (me && me.name) return String(me.name);
    } catch (e) { /* bỏ qua */ }
    return '';
  }
  function hetPhien() {
    var f = $('#auth-name');
    return !!(f && f.offsetParent !== null);
  }
  function ltUI() {
    try { return (ns() && ns().LinhThuUI) || null; } catch (e) { return null; }
  }
  function ltTran() {
    var U = ltUI();
    return U ? (U.tran || null) : null;
  }
  function ltBang() {
    var U = ltUI();
    return U ? (U.bang || null) : null;
  }
  function ltKet() {
    var U = ltUI();
    return U ? (U.ket || null) : null;
  }
  function uuTienHienTai() {
    try {
      var H = ns() && ns().Hotbar;
      if (H && typeof H.uuTien === 'function') return H.uuTien();
    } catch (e) { /* bỏ qua */ }
    var b = document.querySelector('[data-uu-tien].on');
    return b ? b.getAttribute('data-uu-tien') : '';
  }
  function datUuTienNguoi() {
    try {
      var H = ns() && ns().Hotbar;
      if (H && typeof H.setUuTien === 'function') {
        H.setUuTien('nguoi');
        if (H.uuTien() === 'nguoi') return true;
      }
    } catch (e) { /* rơi xuống fallback */ }
    var b = document.querySelector('[data-uu-tien="nguoi"]');
    if (b) { b.click(); return true; }
    return false;
  }

  // ---------------- Mở bảng + ghi danh ----------------
  function moBang() {
    try {
      var U = ltUI();
      if (U && typeof U.show === 'function') { U.show(); return true; }
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  function bamGhiDanhNeuCo() {
    // Nút ghi danh của bảng Linh Thụ (dataset.act='ghi_danh' hoặc chữ
    // 'Ghi Danh') — chỉ bấm khi game hiện nút. Không ép khi không có.
    var cands = $all('#linhthu button, .lt-act, [data-act="ghi_danh"]');
    for (var i = 0; i < cands.length; i++) {
      var b = cands[i];
      if (b.disabled || b.offsetParent === null) continue;
      if ((b.dataset && b.dataset.act === 'ghi_danh') || /Ghi Danh/.test(txt(b))) {
        b.click();
        return true;
      }
    }
    return false;
  }
  function docDiem() {
    // Điểm 2 tông từ LinhThuUI.bang (nếu có) — chỉ ghi log, không quyết định.
    try {
      var b = ltBang();
      if (b && typeof b === 'object') {
        var ks = Object.keys(b);
        if (ks.length) {
          var parts = ks.map(function (k) { return k + ': ' + JSON.stringify(b[k]); });
          return parts.join(' — ');
        }
      }
      var t = ltTran();
      if (t && t.ben) {
        var ben = t.ben;
        var names = Object.keys(ben).map(function (k) { return (ben[k].ten || k) + ' ' + (ben[k].diem !== undefined ? ben[k].diem : '?'); });
        if (names.length) return names.join(' — ');
      }
    } catch (e) { /* bỏ qua */ }
    return null;
  }

  async function veFarm() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — ở lại, cần về farm tay.'); return; }
    log('Về farm tiếp: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try {
      f.stop();
      f.setTarget(preset.map, preset.khu);
      await sleep(300);
      f.start();
    } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  // ---------------- Tick chính ----------------
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      if (hetPhien()) {
        if (phase !== 'het_phien') { phase = 'het_phien'; log('Phiên đăng nhập đã hết hạn — KHÔNG tham gia Tranh Linh Thụ. Đăng nhập lại rồi bật lại tab.'); }
        render(); return;
      }
      var gd = giaiDoan(now);
      var s = suatTai(now);
      if (s && lastKyId !== s.id) {
        // Kỳ mới: reset cờ kỳ cũ.
        lastKyId = s.id; daBamGhiDanh = false; daDoiUuTien = false; dangThiDau = false; diemLog = null;
      }
      if (gd === 'CHUA_MO' || gd === 'KET') {
        if (gd === 'KET' && dangThiDau) {
          dangThiDau = false; daDoiUuTien = false;
          phase = 'xong';
          var ket = ltKet();
          log('Đã xong Tranh Đoạt Linh Thụ' + (ket ? ' — kết quả: ' + JSON.stringify(ket) : '.') + (diemLog ? ' Điểm cuối: ' + diemLog + '.' : ''));
          if (cfg.veFarm) veFarm();
          render(); return;
        }
        phase = 'cho';
        render(); return;
      }
      // Kiểm tra đạo hiệu trước khi tham gia.
      var dh = docDaoHieu();
      if (cfg.daoHieu && dh && dh !== cfg.daoHieu) {
        phase = 'sai_acc';
        on = false; cfg.on = false; saveCfg();
        log('DỪNG: đạo hiệu đang đăng nhập là "' + dh + '", khác "' + cfg.daoHieu + '" — KHÔNG tham gia (tránh vào nhầm acc).');
        render(); return;
      }
      if (gd === 'DANG_KY') {
        phase = 'dang_ky';
        if (moBang()) {
          if (!daBamGhiDanh && bamGhiDanhNeuCo()) {
            daBamGhiDanh = true;
            log('Đã bấm Ghi Danh Tranh Đoạt Linh Thụ.');
          } else if (!daBamGhiDanh) {
            logChong('cho-vao', 'Đã mở bảng Tranh Đoạt Linh Thụ — sổ mở tới 20:16, chờ server đưa vào trận (tông cần >=3 thành viên đủ tư cách online).');
          }
        } else {
          logChong('khong-mo-bang', 'Không mở được bảng Linh Thụ (LinhThuUI.show không có) — mở tay Hành Trang → Hoạt Động → Tranh Đoạt Linh Thụ.');
        }
        render(); return;
      }
      if (gd === 'CHUAN_BI') {
        phase = 'chuan_bi';
        if (!dangThiDau) { dangThiDau = true; daDoiUuTien = false; log('Tranh Linh Thụ chuẩn bị vào trận (20:16:30).'); }
        if (!daDoiUuTien) {
          if (datUuTienNguoi()) { daDoiUuTien = true; log('Đã đổi ưu tiên sang NHÂN VẬT (Tranh Linh Thụ).'); }
          else logChong('doi-uu-tien', 'Chưa đổi được ưu tiên sang Nhân vật — mở Cài Đặt đổi tay.');
        }
        render(); return;
      }
      // DANG_DAU: đang đấu — giữ Auto BẬT, ưu tiên Nhân vật, ghi điểm.
      phase = 'dang_dau';
      if (!dangThiDau) { dangThiDau = true; daDoiUuTien = false; log('Tranh Đoạt Linh Thụ đang đấu — giữ Auto BẬT, ưu tiên Nhân vật.'); }
      if (!daDoiUuTien) {
        if (datUuTienNguoi()) { daDoiUuTien = true; log('Đã đổi ưu tiên sang NHÂN VẬT (Tranh Linh Thụ).'); }
        else logChong('doi-uu-tien', 'Chưa đổi được ưu tiên sang Nhân vật — mở Cài Đặt đổi tay.');
      }
      var nv = nav();
      if (nv && typeof nv.datAuto === 'function') {
        try { nv.datAuto(true); } catch (e) { /* bỏ qua */ }
      }
      var diem = docDiem();
      if (diem && diem !== diemLog) { diemLog = diem; log('Điểm Linh Thụ: ' + diem + '.'); }
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  // ---------------- Bật / dừng / debug ----------------
  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; log('Tab Tranh Linh Thụ BẬT — ghi danh 20:00–20:16 (T3/T7), đấu 20:16:30–20:31:30, xong về farm tiếp.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; log('Tab Tranh Linh Thụ TẮT.'); render(); }
  function status() {
    return {
      on: on, phase: phase, acc: cfg.acc, veFarm: cfg.veFarm,
      dangThiDau: dangThiDau, daBamGhiDanh: daBamGhiDanh,
      giaiDoan: giaiDoan(Date.now()), kyToi: kyToi(Date.now()), diem: diemLog,
    };
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elLog, elAcc, elDaoHieu, elVeFarm;
  function setCollapsed(v) {
    var b = $('#tt2d-linthu-body'), m = $('#tt2d-linthu-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-linthu-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-linthu-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        ' · kỳ tới ' + kyToi(Date.now()) +
        (diemLog ? ' · điểm: ' + diemLog : '');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('linthu');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-linthu-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>🌳 Tranh Đoạt Linh Thụ tự động</b>' +
        '<button id="tt2d-linthu-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-linthu-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>🌳 Linh Thụ</b>' +
        '<span id="tt2d-linthu-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-linthu-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-linthu-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-linthu-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select> ' +
        'Đạo hiệu: <input id="tt2d-linthu-dh" value="' + cfg.daoHieu.replace(/"/g, '&quot;') + '" placeholder="để trống = không kiểm tra" style="width:110px;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"></div>' +
        '<div style="margin-top:4px"><label><input type="checkbox" id="tt2d-linthu-vefarm"' + (cfg.veFarm ? ' checked' : '') + '> Xong trận tự về farm tiếp</label></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-linthu-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT Tranh Linh Thụ</button>' +
          '<button id="tt2d-linthu-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-linthu-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Suất 20:16 tối thứ Ba + thứ Bảy (thay Đại Hội Trúc Cơ). Sổ mở 20:00, khóa 20:16, đấu 20:16:30–20:31:30. Đấu theo tông, tính điểm (24/11: Vân Thanh Tông thua An Nam Quốc 131–600). Tối đa 3 nhân vật/mạng. Thành viên vào tông ≥3 giờ mới đủ tư cách.</div>' +
        '<div id="tt2d-linthu-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-linthu-trangthai');
    elLog = $('#tt2d-linthu-log');
    elAcc = $('#tt2d-linthu-acc');
    elDaoHieu = $('#tt2d-linthu-dh');
    elVeFarm = $('#tt2d-linthu-vefarm');
    $('#tt2d-linthu-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-linthu-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-linthu-start').addEventListener('click', function () { start(); });
    $('#tt2d-linthu-stop').addEventListener('click', function () { stop(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elDaoHieu.addEventListener('change', function () { cfg.daoHieu = elDaoHieu.value.trim(); saveCfg(); });
    elVeFarm.addEventListener('change', function () { cfg.veFarm = elVeFarm.checked; saveCfg(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Tranh Linh Thụ đã nạp. Kỳ tới: ' + kyToi(Date.now()) + '.');

  window.__TT2D_LINHTHU__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _suatTai: suatTai,
    _giaiDoan: giaiDoan,
    _kyToi: kyToi,
    _bamGhiDanhNeuCo: bamGhiDanhNeuCo,
    _docDiem: docDiem,
    _datUuTienNguoi: datUuTienNguoi,
    _resetKy: function () { lastKyId = null; daBamGhiDanh = false; daDoiUuTien = false; dangThiDau = false; diemLog = null; },
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('linthu', window.__TT2D_LINHTHU__);
})();


  // ================= MODULE: sanboss (Săn Boss theo lịch, mới v1.5.0) =================

// ================= MODULE: SĂN BOSS THEO LỊCH CẢ NGÀY (mới v1.5.0) =================
// Tab Săn Boss (lệnh Thanh 19:36 25/11 — mục 3/8 đợt 2):
//  - Canh giờ theo lịch boss rồi gọi tab Boss đi săn (tab Boss đã có
//    TỰ ĐI tới map boss + TỰ HỒI SINH tại chỗ tối đa 3 lần rồi đánh
//    luôn — tab này chỉ lo LỊCH + GỌI tab Boss đúng giờ + về farm sau
//    khi xong). KHÔNG viết lại logic đánh boss/hồi sinh.
//  - Lịch (đã xác minh live + client game.js 24/11):
//      Xích Long: chu kỳ 3h, mốc 07:18 (07:18/10:18/13:18/16:18/
//        19:18/22:18), Long Uyên (27,14), HP 100.000.
//      Linh Hổ: chu kỳ 5h, mốc 08:32 (08:32/13:32/18:32/~23:32),
//        Thạch Phong Thung Lũng (33,5), HP 200.000.
//      Nhện Bạch Ngọc: chu kỳ 8h, mốc 08:47 (08:47/~16:47/~00:47),
//        Bãi Đá Hang Gió (21,11), HP 268.000.
//      Song Dực Ma Báo: ngẫu nhiên 11:00–21:00 mỗi ngày, sống 2h,
//        Mỏ Linh Thạch (tọa độ động — tới map rồi chờ), HP 300.000.
//      Thượng Cổ Giao Long: tối Chủ Nhật 19:30–23:00, Thiên Đạo
//        Khuyết (58,11), HP 2.000.000.
//  - Ưu tiên giờ boss từ BẢNG BOSS của game khi có (tab Boss hook
//    BossBoard — lich() của tab Boss trả nextAt + src 'board'); lịch
//    mốc + chu kỳ chỉ là dự phòng khi bảng chưa có số.
//  - Hồi sinh tại chỗ khi gục: tab Boss lo (tối đa 3 lần/phiên) —
//    tab này KHÔNG bấm hồi sinh, chỉ giám sát.
//  - CHƯA TEST LIVE: giờ bảng Boss có khớp mốc neo không; Ma Báo/Giao
//    Long không có giờ cố định nên tab chỉ báo cửa sổ, không tự đi
//    khi chưa thấy bảng Boss báo.
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_sanboss_cfg';
  // Mốc neo (phút trong ngày, giờ VN) + chu kỳ (phút). 0 = không chu kỳ.
  var BOSSES = {
    xich_long: { ten: 'Xích Long', map: 'long_uyen', mapTen: 'Long Uyên', neo: 7 * 60 + 18, chuKy: 180, hp: 100000 },
    linh_ho: { ten: 'Linh Hổ', map: 'thach_phong_thung_lung', mapTen: 'Thạch Phong Thung Lũng', neo: 8 * 60 + 32, chuKy: 300, hp: 200000 },
    nhen: { ten: 'Nhện Bạch Ngọc', map: 'bai_da_hang_gio', mapTen: 'Bãi Đá Hang Gió', neo: 8 * 60 + 47, chuKy: 480, hp: 268000 },
    ma_bao: { ten: 'Song Dực Ma Báo', map: 'mo_linh_thach', mapTen: 'Mỏ Linh Thạch', neo: null, chuKy: 0, hp: 300000, cuaSo: [11 * 60, 21 * 60] },
    giao_long: { ten: 'Thượng Cổ Giao Long', map: 'thien_dao_khuyet', mapTen: 'Thiên Đạo Khuyết', neo: null, chuKy: 0, hp: 2000000, cuaSoCN: [19 * 60 + 30, 23 * 60] },
  };
  var ORDER = ['xich_long', 'linh_ho', 'nhen', 'ma_bao', 'giao_long'];
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      var en = {};
      ORDER.forEach(function (id) { en[id] = !c.enabled || c.enabled[id] !== false; });
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        truocPhut: (typeof c.truocPhut === 'number' && c.truocPhut >= 1 && c.truocPhut <= 60) ? c.truocPhut : 10,
        enabled: en, veFarm: c.veFarm !== false,
      };
    } catch (e) {
      var en0 = {};
      ORDER.forEach(function (id) { en0[id] = true; });
      return { on: false, acc: 'traxanhnet', truocPhut: 10, enabled: en0, veFarm: true };
    }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle';           // idle|cho|dang_di|dang_danh|xong
  var dangSanId = null;         // boss đang săn
  var dangSanLan = null;        // mốc spawn (ms) của lần săn hiện tại
  var lastLogGio = {};
  var logLines = [];

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function bossTab() { return window.__TT2D_BOSS__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }
  function nav() { return window.__TT2D_NAV__ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function logChong(key, msg) {
    var now = Date.now();
    if (lastLogGio[key] && now - lastLogGio[key] < 60000) return;
    lastLogGio[key] = now;
    log(msg);
  }
  function gioPhut(ms) {
    var d = new Date(ms);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  // ---------------- Lịch boss ----------------
  function phutTrongNgay(nowMs) {
    var d = new Date(nowMs);
    return d.getHours() * 60 + d.getMinutes();
  }
  function lanTiepTheo(id, nowMs) {
    // Trả về {at (ms), conMs} — lần xuất hiện kế tiếp của boss id.
    // Ma Báo / Giao Long không có giờ cố định: trả về cửa sổ (at = đầu
    // cửa sổ kế tiếp, trongCuaSo = đang trong cửa sổ hay không).
    var b = BOSSES[id];
    if (!b) return null;
    var d = new Date(nowMs);
    var ngay0 = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
    if (b.chuKy) {
      var neoMs = ngay0 + b.neo * 60000;
      var at = neoMs;
      while (at <= nowMs) at += b.chuKy * 60000;
      return { at: at, conMs: at - nowMs };
    }
    if (id === 'ma_bao') {
      var mo = ngay0 + b.cuaSo[0] * 60000, dong = ngay0 + b.cuaSo[1] * 60000;
      if (nowMs >= mo && nowMs < dong) return { at: nowMs, conMs: 0, trongCuaSo: true, hetCuaSo: dong };
      if (nowMs < mo) return { at: mo, conMs: mo - nowMs, trongCuaSo: false };
      return { at: ngay0 + 86400000 + b.cuaSo[0] * 60000, conMs: ngay0 + 86400000 + b.cuaSo[0] * 60000 - nowMs, trongCuaSo: false };
    }
    if (id === 'giao_long') {
      // Chủ Nhật kế tiếp (dow 0) 19:30; nếu đang trong cửa sổ CN thì at=now.
      for (var i = 0; i < 8; i++) {
        var dd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
        if (dd.getDay() !== 0) continue;
        var moCN = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate(), 0, 0, 0).getTime() + b.cuaSoCN[0] * 60000;
        var dongCN = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate(), 0, 0, 0).getTime() + b.cuaSoCN[1] * 60000;
        if (nowMs >= moCN && nowMs < dongCN) return { at: nowMs, conMs: 0, trongCuaSo: true, hetCuaSo: dongCN };
        if (nowMs < moCN) return { at: moCN, conMs: moCN - nowMs, trongCuaSo: false };
      }
      return null;
    }
    return null;
  }
  function gioBangBoss(id) {
    // Giờ từ BẢNG BOSS của game (tab Boss hook BossBoard): {nextAt, src}.
    try {
      var bt = bossTab();
      if (!bt || typeof bt.lich !== 'function') return null;
      var list = bt.lich() || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id && list[i].nextAt) return { at: list[i].nextAt, src: list[i].src || 'board' };
      }
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function bossSapNhat(nowMs) {
    // Boss có lần xuất hiện sớm nhất (chỉ tính boss đã tick chọn).
    var best = null;
    ORDER.forEach(function (id) {
      if (!cfg.enabled[id]) return;
      var bang = gioBangBoss(id);
      var lt = lanTiepTheo(id, nowMs);
      if (!lt) return;
      var at = (bang && bang.at) ? bang.at : lt.at;
      // Ma Báo/Giao Long trong cửa sổ nhưng chưa thấy bảng báo thì KHÔNG
      // tự đi (không có giờ cố định) — chỉ báo cửa sổ.
      if ((id === 'ma_bao' || id === 'giao_long') && lt.trongCuaSo && !bang) return;
      if (!best || at < best.at) best = { id: id, at: at, conMs: at - nowMs, tuBang: !!bang };
    });
    return best;
  }
  function sapToi(id, nowMs) {
    var lt = lanTiepTheo(id, nowMs);
    if (!lt) return false;
    var bang = gioBangBoss(id);
    var at = (bang && bang.at) ? bang.at : lt.at;
    return (at - nowMs) <= cfg.truocPhut * 60000 && (at - nowMs) >= -5 * 60000;
  }

  async function veFarm() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — ở lại, cần về farm tay.'); return; }
    log('Về farm tiếp: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try {
      f.stop();
      f.setTarget(preset.map, preset.khu);
      await sleep(300);
      f.start();
    } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  // ---------------- Tick chính ----------------
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      var bt = bossTab();
      if (!bt) { logChong('khong-co-boss', 'Không thấy tab Boss — cần tab Boss để đi săn.'); render(); return; }
      // Đang săn: giám sát tab Boss.
      if (dangSanId) {
        var st = null;
        try { st = bt.status ? bt.status() : null; } catch (e) { st = null; }
        var conDanh = st && (st.phase === 'fighting' || st.currentBoss || st.currentTarget);
        if (st && !conDanh && st.phase === 'idle') {
          // Tab Boss đã về idle, không còn mục tiêu — coi như xong lần này.
          log('Xong săn ' + BOSSES[dangSanId].ten + ' (tab Boss đã về idle, hạ ' + (st.stats ? st.stats.killed : 0) + ' boss).');
          dangSanId = null; dangSanLan = null;
          phase = 'xong';
          if (cfg.veFarm) veFarm();
          render(); return;
        }
        phase = (st && st.phase === 'fighting') ? 'dang_danh' : 'dang_di';
        // Boss đã qua giờ spawn >30 phút mà tab Boss vẫn chưa vào trận
        // (vd kẹt đường) thì bỏ lần này, chờ lần sau.
        if (dangSanLan && now - dangSanLan > 30 * 60000 && !(st && st.phase === 'fighting')) {
          log('Bỏ săn ' + BOSSES[dangSanId].ten + ' — quá 30 phút sau giờ spawn mà chưa vào trận.');
          try { bt.stop(); } catch (e) { /* bỏ qua */ }
          dangSanId = null; dangSanLan = null;
          phase = 'cho';
          if (cfg.veFarm) veFarm();
        }
        render(); return;
      }
      // Chưa săn: tìm boss sắp tới trong cửa sổ "đi trước".
      var next = bossSapNhat(now);
      if (next && next.conMs <= cfg.truocPhut * 60000) {
        var b = BOSSES[next.id];
        dangSanId = next.id;
        dangSanLan = next.at;
        phase = 'dang_di';
        log('Sắp tới giờ ' + b.ten + ' (' + gioPhut(next.at) + ', ' + b.mapTen + ') — gọi tab Boss đi săn' + (next.tuBang ? ' (giờ từ bảng Boss).' : ' (giờ theo mốc + chu kỳ).'));
        try {
          bt.select(next.id);
          bt.setTuDi(true);
          bt.start();
        } catch (e) { log('Gọi tab Boss lỗi: ' + (e && e.message)); dangSanId = null; dangSanLan = null; phase = 'cho'; }
        render(); return;
      }
      phase = 'cho';
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  // ---------------- Bật / dừng / debug ----------------
  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; log('Tab Săn Boss BẬT — canh Xích Long 3h / Linh Hổ 5h / Nhện 8h / Ma Báo 11:00–21:00 / Giao Long tối CN, tới trước ' + cfg.truocPhut + ' phút rồi gọi tab Boss.'); render(); }
  function stop() {
    on = false; cfg.on = false; saveCfg(); phase = 'idle';
    if (dangSanId) {
      try { var bt = bossTab(); if (bt) bt.stop(); } catch (e) { /* bỏ qua */ }
      dangSanId = null; dangSanLan = null;
    }
    log('Tab Săn Boss TẮT.'); render();
  }
  function status() {
    var next = bossSapNhat(Date.now());
    return {
      on: on, phase: phase, acc: cfg.acc, truocPhut: cfg.truocPhut,
      dangSan: dangSanId, dangSanLan: dangSanLan,
      sapToi: next ? { id: next.id, ten: BOSSES[next.id].ten, at: next.at, gio: gioPhut(next.at), conPhut: Math.round(next.conMs / 60000), tuBang: next.tuBang } : null,
    };
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elLog, elAcc, elTruoc, elVeFarm;
  function setCollapsed(v) {
    var b = $('#tt2d-sanboss-body'), m = $('#tt2d-sanboss-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-sanboss-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-sanboss-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      var next = bossSapNhat(Date.now());
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        (dangSanId ? ' · đang săn ' + BOSSES[dangSanId].ten : '') +
        (next ? ' · sắp tới: ' + BOSSES[next.id].ten + ' ' + gioPhut(next.at) + ' (còn ' + Math.max(0, Math.round(next.conMs / 60000)) + ' phút)' : '');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
    // Cập nhật bảng lịch.
    var tb = $('#tt2d-sanboss-lich');
    if (tb) {
      var rows = ORDER.map(function (id) {
        var b = BOSSES[id];
        var lt = lanTiepTheo(id, Date.now());
        var bang = gioBangBoss(id);
        var at = (bang && bang.at) ? bang.at : (lt ? lt.at : null);
        var chu = lt && lt.trongCuaSo ? 'ĐANG TRONG CỬA SỔ' : (at ? 'còn ' + Math.max(0, Math.round((at - Date.now()) / 60000)) + ' phút' : '—');
        return '<div><label><input type="checkbox" data-boss="' + id + '"' + (cfg.enabled[id] ? ' checked' : '') + '> ' + b.ten + ' — ' + b.mapTen + ' · tới ' + (at ? gioPhut(at) : '—') + ' · ' + chu + (bang ? ' (bảng Boss)' : '') + '</label></div>';
      }).join('');
      if (tb.innerHTML !== rows) {
        tb.innerHTML = rows;
        var cbs = tb.querySelectorAll('input[data-boss]');
        for (var i = 0; i < cbs.length; i++) {
          cbs[i].addEventListener('change', function (ev) {
            cfg.enabled[ev.target.getAttribute('data-boss')] = ev.target.checked;
            saveCfg(); render();
          });
        }
      }
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('sanboss');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-sanboss-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>🐉 Săn Boss theo lịch</b>' +
        '<button id="tt2d-sanboss-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-sanboss-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>🐉 Săn Boss</b>' +
        '<span id="tt2d-sanboss-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-sanboss-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-sanboss-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-sanboss-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select> ' +
        'Đi trước: <input id="tt2d-sanboss-truoc" type="number" min="1" max="60" value="' + cfg.truocPhut + '" style="width:48px;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"> phút</div>' +
        '<div style="margin-top:4px"><label><input type="checkbox" id="tt2d-sanboss-vefarm"' + (cfg.veFarm ? ' checked' : '') + '> Xong boss tự về farm tiếp</label></div>' +
        '<div id="tt2d-sanboss-lich" style="margin-top:6px"></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-sanboss-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT săn boss</button>' +
          '<button id="tt2d-sanboss-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-sanboss-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Xích Long 3h (07:18/10:18/13:18/16:18/19:18/22:18) · Linh Hổ 5h (08:32/13:32/18:32/~23:32) · Nhện 8h (08:47/~16:47/~00:47) · Ma Báo ngẫu nhiên 11:00–21:00 (sống 2h) · Giao Long tối Chủ Nhật 19:30–23:00. Tab chỉ canh giờ + gọi tab Boss (tab Boss tự đi map, tự hồi sinh tại chỗ tối đa 3 lần rồi đánh luôn, không chờ kỳ kiểm tra sau). Ma Báo/Giao Long không có giờ cố định nên chỉ đi khi bảng Boss báo giờ.</div>' +
        '<div id="tt2d-sanboss-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-sanboss-trangthai');
    elLog = $('#tt2d-sanboss-log');
    elAcc = $('#tt2d-sanboss-acc');
    elTruoc = $('#tt2d-sanboss-truoc');
    elVeFarm = $('#tt2d-sanboss-vefarm');
    $('#tt2d-sanboss-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-sanboss-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-sanboss-start').addEventListener('click', function () { start(); });
    $('#tt2d-sanboss-stop').addEventListener('click', function () { stop(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elTruoc.addEventListener('change', function () {
      var v = parseInt(elTruoc.value, 10);
      if (isFinite(v) && v >= 1 && v <= 60) { cfg.truocPhut = v; saveCfg(); }
      render();
    });
    elVeFarm.addEventListener('change', function () { cfg.veFarm = elVeFarm.checked; saveCfg(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Săn Boss đã nạp. Sắp tới: ' + (function () { var n = bossSapNhat(Date.now()); return n ? BOSSES[n.id].ten + ' ' + gioPhut(n.at) : '—'; })() + '.');

  window.__TT2D_SANBOSS__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _lanTiepTheo: lanTiepTheo,
    _bossSapNhat: bossSapNhat,
    _sapToi: sapToi,
    _gioBangBoss: gioBangBoss,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('sanboss', window.__TT2D_SANBOSS__);
})();


  // ================= MODULE: xongchuong (Yêu Thú Xổng Chuồng, mới v1.5.0) =================

// ================= MODULE: YÊU THÚ XỔNG CHUỒNG TỰ ĐỘNG (mới v1.5.0) =================
// Tab Yêu Thú Xổng Chuồng (lệnh Thanh 19:36 25/11 — mục 4/8 đợt 2):
//  - Sự kiện NGẪU NHIÊN (client game.js 24/11, guide "thu-xong-chuong"):
//    "Cứ vài giờ một bầy Yêu Thú Cấp 1 xổng ra một khu ngẫu nhiên.
//    Thiên Đạo xướng tên bản đồ kèm số khu, 20 giây sau bầy mới hiện;
//    khu ấy mở trần 80 người cho tới khi cả bầy bị hạ." Map có thể ra:
//    Rừng Trúc / Thảo Dược Cốc / Bãi Đá Hang Gió.
//  - Server đẩy danh sách qua BaoYeuThu.nhan(ds); game hiện toast
//    #yt-toast (.yt-label "Yêu thú sắp ra"/"Yêu thú đã ra", .yt-sub
//    tên bầy, .yt-msg "Cấp X · nơi · +N con", .yt-clock đếm ngược).
//    Tool ĐỌC TOAST này (không đọc được danh sách nội bộ BaoYeuThu).
//  - Thấy bầy sắp ra/đã ra: tự đi tới map + khu đó (nav.diToiMap +
//    chọn khu qua Bảng Khu), bật Auto + ưu tiên 'Quái' để đánh bầy;
//    bầy hết (toast ẩn) hoặc quá 10 phút thì xong, về farm tiếp.
//  - ⚠️ GIỚI HẠN ĐÃ BIẾT (ghi rõ trong tab): Ma Đạo KHÔNG đánh được
//    Kiếp Tặc — acc chính (traxanhnet) + traxanhnet2 là Ma Đạo nên
//    KHÔNG lấy được Hiệp Nghĩa Lệnh từ bầy này (Kiếp Tặc chỉ phe
//    Chính Đạo đánh được). Bầy gồm Thương Đội/Thương Nhân/Tiểu Sư/
//    Kiếp Tặc/Oan Hồn — tool chỉ đánh được quái thường + Oan Hồn.
//  - CHƯA TEST LIVE: định dạng thật của .yt-sub (có kèm số khu không),
//    nút Bảng Khu ở 3 map này, bầy hiện đúng 20s sau thông báo không.
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_xongchuong_cfg';
  // Map có thể ra bầy (theo guide client).
  var MAPS = {
    thanh_truc_lam: { ten: 'Rừng Trúc', tuKhoa: ['Rừng Trúc', 'Trúc'] },
    duoc_vien: { ten: 'Thảo Dược Cốc', tuKhoa: ['Thảo Dược Cốc', 'Dược Cốc'] },
    bai_da_hang_gio: { ten: 'Bãi Đá Hang Gió', tuKhoa: ['Bãi Đá', 'Bãi Đá Hang Gió'] },
  };
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];
  var TIMEOUT_PHUT = 10;

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        veFarm: c.veFarm !== false,
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', veFarm: true }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle';           // idle|cho|dang_di|dang_danh|xong
  var dangDiId = null;          // key bầy đang đi (sub + clock)
  var dangDiTu = 0;
  var logLines = [];
  var lastLogGio = {};

  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function farm() { return window.__TT2D_FARM__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function logChong(key, msg) {
    var now = Date.now();
    if (lastLogGio[key] && now - lastLogGio[key] < 60000) return;
    lastLogGio[key] = now;
    log(msg);
  }

  // ---------------- Đọc toast Yêu Thú ----------------
  function docToast() {
    var box = $('#yt-toast');
    if (!box || box.classList.contains('hidden')) return null;
    var label = txt(box.querySelector('.yt-label'));
    var sub = txt(box.querySelector('.yt-sub'));
    var msg = txt(box.querySelector('.yt-msg'));
    var clock = txt(box.querySelector('.yt-clock'));
    if (!label && !sub && !msg) return null;
    return { label: label, sub: sub, msg: msg, clock: clock, box: box };
  }
  function clockSangGiay(clock) {
    // "M:SS" hoặc "MM:SS" -> giây. Không đọc được thì null.
    if (!clock) return null;
    var m = String(clock).match(/(\d+):(\d+)/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }
  function giaiMaThongBao(t) {
    // Từ toast -> {map, khu, label, sub, msg, clockGiay, key}.
    if (!t) return null;
    var hay = (t.sub || '') + ' ' + (t.msg || '') + ' ' + (t.label || '');
    var map = null;
    Object.keys(MAPS).forEach(function (id) {
      if (map) return;
      MAPS[id].tuKhoa.forEach(function (k) {
        if (hay.indexOf(k) >= 0) map = id;
      });
    });
    var khu = null;
    var mk = hay.match(/Khu\s*(\d+)/i) || hay.match(/khu\s*(\d+)/);
    if (mk) khu = parseInt(mk[1], 10);
    else {
      // Số khu có thể nằm cuối tên bầy (vd "... Khu 16" đã bắt ở trên;
      // dự phòng: số đứng riêng cuối sub).
      var m2 = (t.sub || '').match(/(\d+)\s*$/);
      if (m2) khu = parseInt(m2[1], 10);
    }
    return {
      map: map, khu: khu, label: t.label, sub: t.sub, msg: t.msg,
      clockGiay: clockSangGiay(t.clock),
      key: (t.sub || '') + '@' + (t.msg || ''),
    };
  }
  function tap(el) {
    if (!el) return;
    var n = nav();
    if (n && typeof n.tap === 'function') { try { n.tap(el); return; } catch (e) { /* fallback */ } }
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  function datUuTienQuai() {
    try {
      var H = ns() && ns().Hotbar;
      if (H && typeof H.setUuTien === 'function') { H.setUuTien('quai'); return true; }
    } catch (e) { /* fallback */ }
    var b = document.querySelector('[data-uu-tien="quai"]');
    if (b) { if (!b.classList.contains('on')) b.click(); return true; }
    return false;
  }

  // ---------------- Đi tới bầy ----------------
  function bangKhuMo() { return $all('[data-khu]').length > 0; }
  async function chonKhu(khu) {
    // Chọn khu qua Bảng Khu (bản gọn của farm.chonKhu — chỉ dùng khi
    // đã tới đúng map của bầy). Trả về true/false.
    var n = nav();
    if (!n) return false;
    try {
      var k = ns() && ns().KhuUI && ns().KhuUI.khu;
      if (k === khu) return true;
    } catch (e) { /* tiếp tục */ }
    var atk = $('#btn-attack');
    var label = atk ? ((atk.getAttribute('aria-label') || '') + ' ' + txt(atk)) : '';
    if (/bảng khu/i.test(label)) {
      tap(atk);
      for (var i = 0; i < 8; i++) {
        await sleep(500);
        if (bangKhuMo()) break;
      }
    }
    if (!bangKhuMo()) return false;
    var btn = document.querySelector('[data-khu="' + khu + '"]');
    if (!btn) return false;
    btn.click();
    var t0 = Date.now();
    while (Date.now() - t0 < 3000) {
      await sleep(500);
      try {
        if (ns() && ns().KhuUI && ns().KhuUI.khu === khu) return true;
      } catch (e) { /* tiếp tục */ }
      if (!bangKhuMo()) break;
    }
    try {
      if (ns() && ns().KhuUI && ns().KhuUI.khu === khu) return true;
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  async function diToiBay(thongBao) {
    var n = nav();
    if (!n || typeof n.diToiMap !== 'function') { log('Module Điều hướng chưa sẵn sàng.'); return false; }
    log('Đi tới bầy Yêu Thú: ' + MAPS[thongBao.map].ten + (thongBao.khu ? ' Khu ' + thongBao.khu : '') + ' (' + (thongBao.msg || thongBao.sub || '') + ').');
    var ok = false;
    try { ok = await n.diToiMap(thongBao.map); } catch (e) { ok = false; }
    if (!ok) { log('Không tới được ' + MAPS[thongBao.map].ten + ' — xem lý do trong tab Farm/nav.'); return false; }
    if (thongBao.khu) {
      var okKhu = await chonKhu(thongBao.khu);
      if (!okKhu) log('Không chọn được Khu ' + thongBao.khu + ' (có thể đầy) — đánh bầy ở khu hiện tại.');
      else log('Đã vào Khu ' + thongBao.khu + '.');
    }
    // Bật Auto + ưu tiên Quái để đánh bầy (bầy là Yêu Thú Cấp 1).
    datUuTienQuai();
    if (n && typeof n.datAuto === 'function') {
      try { n.datAuto(true); } catch (e) { /* bỏ qua */ }
    }
    return true;
  }

  async function veFarm() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — ở lại, cần về farm tay.'); return; }
    log('Về farm tiếp: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try {
      f.stop();
      f.setTarget(preset.map, preset.khu);
      await sleep(300);
      f.start();
    } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  // ---------------- Tick chính ----------------
  var dangDi = false;
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      var t = docToast();
      var tb = t ? giaiMaThongBao(t) : null;
      // Đang đánh bầy: bầy hết (toast ẩn) hoặc quá 10 phút thì xong.
      if (dangDiId) {
        if (!tb || tb.key !== dangDiId) {
          log('Bầy Yêu Thú đã hết (toast đã ẩn) — xong.');
          dangDiId = null; dangDi = false;
          phase = 'xong';
          if (cfg.veFarm) veFarm();
          render(); return;
        }
        if (now - dangDiTu > TIMEOUT_PHUT * 60000) {
          log('Quá ' + TIMEOUT_PHUT + ' phút chưa hết bầy — dừng chờ, về farm tiếp.');
          dangDiId = null; dangDi = false;
          phase = 'xong';
          if (cfg.veFarm) veFarm();
          render(); return;
        }
        phase = 'dang_danh';
        render(); return;
      }
      // Chưa đi: có thông báo bầy sắp ra/đã ra thì đi.
      if (tb && tb.map) {
        // Bầy sắp ra: đồng hồ còn >25s thì chờ tới gần lúc hiện mới đi
        // (đi sớm quá thì tới nơi bầy chưa hiện, đứng chờ bị quái đánh).
        if (tb.clockGiay !== null && tb.clockGiay > 25 && /sắp ra/i.test(tb.label || '')) {
          phase = 'cho';
          logChong('cho-bay', 'Yêu Thú sắp ra ở ' + MAPS[tb.map].ten + (tb.khu ? ' Khu ' + tb.khu : '') + ' sau ' + tb.clockGiay + 's — chờ tới gần lúc hiện mới đi.');
          render(); return;
        }
        if (dangDi) { render(); return; }
        dangDi = true;
        dangDiId = tb.key;
        dangDiTu = now;
        phase = 'dang_di';
        log('Yêu Thú ' + (tb.label || '') + ': ' + (tb.sub || '') + ' — ' + (tb.msg || '') + '.');
        diToiBay(tb).then(function (ok) {
          dangDi = false;
          if (!ok) { dangDiId = null; phase = 'cho'; log('Đi tới bầy thất bại — chờ bầy sau.'); }
          else { phase = 'dang_danh'; log('Đã tới chỗ bầy — Auto BẬT, ưu tiên Quái, đang đánh bầy.'); }
          render();
        });
        render(); return;
      }
      if (tb && !tb.map) {
        logChong('khong-doc-map', 'Thấy thông báo Yêu Thú nhưng chưa đọc được map/khu từ toast (' + (tb.sub || '') + ' ' + (tb.msg || '') + ') — mở mắt xem rồi đi tay.');
      }
      phase = 'cho';
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  // ---------------- Bật / dừng / debug ----------------
  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; log('Tab Yêu Thú Xổng Chuồng BẬT — thấy toast báo bầy thì tự đi đánh, xong về farm tiếp.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; dangDiId = null; dangDi = false; log('Tab Yêu Thú Xổng Chuồng TẮT.'); render(); }
  function status() {
    var t = docToast();
    var tb = t ? giaiMaThongBao(t) : null;
    return {
      on: on, phase: phase, acc: cfg.acc, veFarm: cfg.veFarm,
      dangDi: dangDiId, thongBao: tb ? { map: tb.map, khu: tb.khu, label: tb.label, msg: tb.msg, clockGiay: tb.clockGiay } : null,
    };
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elLog, elAcc, elVeFarm;
  function setCollapsed(v) {
    var b = $('#tt2d-xongchuong-body'), m = $('#tt2d-xongchuong-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-xongchuong-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-xongchuong-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      var t = docToast();
      var tb = t ? giaiMaThongBao(t) : null;
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        (tb && tb.map ? ' · bầy ở ' + MAPS[tb.map].ten + (tb.khu ? ' K' + tb.khu : '') : '');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('xongchuong');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-xongchuong-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>☠️ Yêu Thú Xổng Chuồng tự động</b>' +
        '<button id="tt2d-xongchuong-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-xongchuong-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>☠️ Xổng Chuồng</b>' +
        '<span id="tt2d-xongchuong-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-xongchuong-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-xongchuong-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-xongchuong-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select></div>' +
        '<div style="margin-top:4px"><label><input type="checkbox" id="tt2d-xongchuong-vefarm"' + (cfg.veFarm ? ' checked' : '') + '> Hết bầy tự về farm tiếp</label></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-xongchuong-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT canh bầy</button>' +
          '<button id="tt2d-xongchuong-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-xongchuong-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Bầy Yêu Thú Cấp 1 xổng ra ngẫu nhiên vài giờ/lần ở Rừng Trúc / Thảo Dược Cốc / Bãi Đá. Thiên Đạo xướng tên bản đồ kèm số khu, 20 giây sau bầy mới hiện; khu mở trần 80 người tới khi cả bầy bị hạ.</div>' +
        '<div style="margin-top:4px;color:#ff9a8a">⚠️ Ma Đạo KHÔNG đánh được Kiếp Tặc — acc chính + traxanhnet2 là Ma Đạo nên KHÔNG lấy được Hiệp Nghĩa Lệnh từ bầy này (Kiếp Tặc chỉ phe Chính Đạo đánh được). Tool chỉ đánh quái thường + Oan Hồn trong bầy.</div>' +
        '<div id="tt2d-xongchuong-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-xongchuong-trangthai');
    elLog = $('#tt2d-xongchuong-log');
    elAcc = $('#tt2d-xongchuong-acc');
    elVeFarm = $('#tt2d-xongchuong-vefarm');
    $('#tt2d-xongchuong-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-xongchuong-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-xongchuong-start').addEventListener('click', function () { start(); });
    $('#tt2d-xongchuong-stop').addEventListener('click', function () { stop(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elVeFarm.addEventListener('change', function () { cfg.veFarm = elVeFarm.checked; saveCfg(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Yêu Thú Xổng Chuồng đã nạp. Bật tab để tự đi đánh bầy khi có thông báo.');

  window.__TT2D_XONGCHUONG__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _docToast: docToast,
    _giaiMaThongBao: giaiMaThongBao,
    _clockSangGiay: clockSangGiay,
    _chonKhu: chonKhu,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('xongchuong', window.__TT2D_XONGCHUONG__);
})();


  // ================= MODULE: hxparty (Huyết Xích tổ đội, mới v1.5.0) =================

// ================= MODULE: HUYẾT XÍCH TỔ ĐỘI (mới v1.5.0) =================
// Tab Huyết Xích Tổ Đội (lệnh Thanh 19:36 25/11 — mục 5/8 đợt 2):
//  - thanhvan2 làm Huyết Xích PHẢI TỔ ĐỘI, không đi solo được (lệnh
//    Thanh 00:07 25/11). traxanhnet2 đi solo được — tab này CHỈ lo
//    lập đội cho thanhvan2 (acc khác thì từ chối chạy).
//  - Luồng: tới điểm hẹn (làng Chân Núi (10,26) hoặc Bãi Đá (10,5))
//    -> mời từng đồng đội qua tab Tổ đội (invite, trong 180px, tối đa
//    6 người) -> chờ đủ đội (>=2 người) -> BÁO "đủ đội, vào hầm ở
//    Miếu Hoang Nữ Tu (12,6)" rồi DỪNG việc lập đội.
//  - Tab KHÔNG tự vào hầm, KHÔNG tự đăng ký Huyết Xích, KHÔNG tự trả
//    phí nào (vào hầm + phí do người dùng / script Python
//    huyet_xich_run.py lo). Phí solo 100 LT đã có phép đứng — nhưng
//    tổ đội thì phí/chia theo game, KHÔNG tự trả phí nào khác khi chưa
//    có lệnh.
//  - Quy tắc lập đội CỨNG (Thanh 01:11 25/11): Miếu Ông Trường Con là
//    PK tự do, bên trong miếu KHÔNG lập được tổ đội — chỉ mời/chấp
//    nhận ở làng hoặc Bãi Đá. Tab Tổ đội đã chặn invite trong miếu
//    (trả 'in_mtc'); tab này cũng kiểm tra trước khi mời.
//  - CHƯA TEST LIVE: mời qua Gateway.partyInvite có được server chấp
//    nhận như bấm nút không (tab Tổ đội đã có test mock, chưa live).
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_hxparty_cfg';
  // Điểm hẹn lập đội (quy tắc cứng: chỉ làng hoặc Bãi Đá, KHÔNG trong miếu).
  var DIEM_HEN = {
    lang: { ten: 'Làng Chân Núi', map: 'tan_vien', x: 10, y: 26 },
    bai_da: { ten: 'Bãi Đá Hang Gió', map: 'bai_da_hang_gio', x: 10, y: 5 },
  };
  var ACC_MAC_DINH = 'thanhvan2';
  var DOI_MAC_DINH = ['traxanhnet', 'traxanhnet2', 'traxanhnet13'];

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: typeof c.acc === 'string' ? c.acc : ACC_MAC_DINH,
        daoHieu: typeof c.daoHieu === 'string' ? c.daoHieu : '',
        doi: Array.isArray(c.doi) && c.doi.length ? c.doi : DOI_MAC_DINH.slice(),
        diemHen: DIEM_HEN[c.diemHen] ? c.diemHen : 'lang',
      };
    } catch (e) { return { on: false, acc: ACC_MAC_DINH, daoHieu: '', doi: DOI_MAC_DINH.slice(), diemHen: 'lang' }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle';           // idle|cho|dang_di|dang_moi|du_doi|sai_acc|trong_mieu|trong_ham
  var dangDi = false;
  var daBaoDuDoi = false;
  var moiLanCuoi = 0;
  var moiIndex = 0;
  var logLines = [];
  var lastLogGio = {};

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function partyTab() { return window.__TT2D_PARTY__ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function logChong(key, msg) {
    var now = Date.now();
    if (lastLogGio[key] && now - lastLogGio[key] < 60000) return;
    lastLogGio[key] = now;
    log(msg);
  }
  function docDaoHieu() {
    try {
      var n = window.__ns_ || null;
      if (!n) return '';
      var p = n.SceneWorld && n.SceneWorld.player;
      if (p && p.name) return String(p.name);
      var me = n.Gateway && n.Gateway.me;
      if (me && me.name) return String(me.name);
    } catch (e) { /* bỏ qua */ }
    return '';
  }
  function docViTri() {
    var n = nav();
    if (n && typeof n.docViTri === 'function') {
      try { return n.docViTri(); } catch (e) { /* fallback */ }
    }
    return { x: null, y: null, map: null };
  }
  function dangTrongMieu() { return docViTri().map === 'dong_mach_ngam'; }
  function dangTrongHam() {
    var m = docViTri().map;
    return m === 'huyet_xich_1' || m === 'huyet_xich_2' || m === 'huyet_xich_3' ||
      (typeof m === 'string' && m.indexOf('huyet_xich') === 0);
  }
  function trangThaiDoi() {
    var pt = partyTab();
    if (!pt || typeof pt.status !== 'function') return { inParty: false, members: [] };
    try { return pt.status(); } catch (e) { return { inParty: false, members: [] }; }
  }
  function duDoi() {
    var st = trangThaiDoi();
    return !!(st.inParty && st.members && st.members.length >= 2);
  }

  async function diToiDiemHen() {
    var n = nav();
    var dh = DIEM_HEN[cfg.diemHen] || DIEM_HEN.lang;
    if (!n || typeof n.diToiMap !== 'function' || typeof n.diToi !== 'function') {
      log('Module Điều hướng chưa sẵn sàng.');
      return false;
    }
    var vt = docViTri();
    if (vt.map !== dh.map) {
      var ok = false;
      try { ok = await n.diToiMap(dh.map); } catch (e) { ok = false; }
      if (!ok) { log('Không tới được ' + dh.ten + ' — xem lý do trong tab Farm/nav.'); return false; }
    }
    try { await n.diToi(dh.x, dh.y, 60); } catch (e) { /* thử mời tại chỗ */ }
    return true;
  }

  // ---------------- Tick chính ----------------
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      // Chỉ chạy cho thanhvan2 (acc PHẢI tổ đội). Acc khác thì dừng.
      if (cfg.acc !== ACC_MAC_DINH) {
        phase = 'sai_acc';
        on = false; cfg.on = false; saveCfg();
        log('DỪNG: tab này chỉ lập đội Huyết Xích cho thanhvan2 (acc đang chọn là "' + cfg.acc + '" — traxanhnet2 đi solo được, không cần tổ đội).');
        render(); return;
      }
      var dh = docDaoHieu();
      if (cfg.daoHieu && dh && dh !== cfg.daoHieu) {
        phase = 'sai_acc';
        on = false; cfg.on = false; saveCfg();
        log('DỪNG: đạo hiệu đang đăng nhập là "' + dh + '", khác "' + cfg.daoHieu + '" — KHÔNG lập đội (tránh mời nhầm acc).');
        render(); return;
      }
      if (dangTrongHam()) {
        phase = 'trong_ham';
        logChong('trong-ham', 'Đã ở trong hầm Huyết Xích — tab lập đội không làm gì thêm (vào hầm + phí do script Python lo).');
        render(); return;
      }
      if (dangTrongMieu()) {
        phase = 'trong_mieu';
        logChong('trong-mieu', 'Đang ở trong Miếu Ông Trường Con (PK tự do) — KHÔNG lập được đội trong miếu. Ra Bãi Đá/làng rồi bật lại tab.');
        render(); return;
      }
      // Đủ đội rồi?
      if (duDoi()) {
        if (!daBaoDuDoi) {
          daBaoDuDoi = true;
          var st = trangThaiDoi();
          phase = 'du_doi';
          log('ĐỦ ĐỘI (' + st.members.length + ' người: ' + st.members.map(function (m) { return m.name || m.id || '?'; }).join(', ') + ') — vào hầm ở Miếu Hoang, gặp Nữ Tu (12,6) để đăng ký Huyết Xích. Phí theo game, KHÔNG tự trả phí nào khác. Tab lập đội dừng ở đây.');
        }
        render(); return;
      }
      daBaoDuDoi = false;
      // Chưa đủ đội: tới điểm hẹn rồi mời từng người (mỗi 5s 1 lời mời).
      var pt = partyTab();
      if (!pt || typeof pt.invite !== 'function') {
        logChong('khong-co-party', 'Không thấy tab Tổ đội — cần tab Tổ đội để mời.'); render(); return;
      }
      if (dangDi) { render(); return; }
      var vt = docViTri();
      var hen = DIEM_HEN[cfg.diemHen] || DIEM_HEN.lang;
      var oDiemHen = vt.map === hen.map && vt.x !== null && Math.abs(vt.x - hen.x) <= 2 && Math.abs(vt.y - hen.y) <= 2;
      if (!oDiemHen) {
        phase = 'dang_di';
        dangDi = true;
        log('Chưa đủ đội — đi tới điểm hẹn ' + hen.ten + ' (' + hen.x + ',' + hen.y + ') để mời.');
        diToiDiemHen().then(function (ok) {
          dangDi = false;
          if (ok) { phase = 'dang_moi'; log('Đã tới điểm hẹn ' + hen.ten + ' — bắt đầu mời đội.'); }
          else { phase = 'cho'; log('Chưa tới được điểm hẹn — thử lại sau.'); }
          render();
        });
        render(); return;
      }
      // Đang ở điểm hẹn: mời lần lượt.
      phase = 'dang_moi';
      if (now - moiLanCuoi < 5000) { render(); return; }
      var st2 = trangThaiDoi();
      var trongDoi = {};
      (st2.members || []).forEach(function (m) { if (m.name) trongDoi[m.name] = true; });
      var conThieu = cfg.doi.filter(function (ten) { return !trongDoi[ten]; });
      if (!conThieu.length) { render(); return; } // chờ server cập nhật đội
      var ten = conThieu[moiIndex % conThieu.length];
      moiIndex += 1;
      moiLanCuoi = now;
      var kq = null;
      try { kq = pt.invite(ten); } catch (e) { kq = 'err'; }
      if (kq === 'sent') log('Đã gửi lời mời tổ đội tới ' + ten + '.');
      else if (kq === 'in_mtc') log('Không mời được ' + ten + ' — đang trong miếu (quy tắc cứng: chỉ mời ở làng/Bãi Đá).');
      else if (kq === 'too_far') logChong('xa-' + ten, ten + ' ở quá xa (>180px) — cần đứng gần nhau mới mời được.');
      else if (kq === 'not_found') logChong('khong-thay-' + ten, 'Không thấy ' + ten + ' ở gần — acc này có đang online ở cùng map không?');
      else logChong('moi-loi-' + ten, 'Mời ' + ten + ' lỗi (' + kq + ').');
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  // ---------------- Bật / dừng / debug ----------------
  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; daBaoDuDoi = false; moiIndex = 0; log('Tab Huyết Xích Tổ Đội BẬT — lập đội cho thanhvan2 ở ' + (DIEM_HEN[cfg.diemHen] || DIEM_HEN.lang).ten + ', đủ đội thì báo để vào hầm.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; dangDi = false;
    // Hủy luôn luồng di chuyển đang chạy dở (diToiDiemHen) — như bug
    // farm.stop() v1.4.0 (v1.5.0).
    try { var n = nav(); if (n && typeof n.huyDiChuyen === 'function') n.huyDiChuyen(); } catch (e) { /* bỏ qua */ }
    log('Tab Huyết Xích Tổ Đội TẮT.'); render(); }
  function status() {
    var st = trangThaiDoi();
    return {
      on: on, phase: phase, acc: cfg.acc, diemHen: cfg.diemHen,
      doi: cfg.doi.slice(), inParty: !!st.inParty,
      members: (st.members || []).map(function (m) { return m.name || m.id || '?'; }),
      duDoi: duDoi(),
    };
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elLog, elAcc, elDaoHieu, elDoi, elDiemHen;
  function setCollapsed(v) {
    var b = $('#tt2d-hxparty-body'), m = $('#tt2d-hxparty-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-hxparty-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-hxparty-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      var st = trangThaiDoi();
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        (st.inParty ? ' · đội ' + (st.members || []).length + ' người' : ' · chưa vào đội');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('hxparty');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-hxparty-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>🔗 Huyết Xích Tổ Đội</b>' +
        '<button id="tt2d-hxparty-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-hxparty-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>🔗 HX Tổ Đội</b>' +
        '<span id="tt2d-hxparty-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-hxparty-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-hxparty-body">' +
        '<div style="margin-top:6px">Acc: <input id="tt2d-hxparty-acc" value="' + cfg.acc.replace(/"/g, '&quot;') + '" style="width:120px;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"> ' +
        'Đạo hiệu: <input id="tt2d-hxparty-dh" value="' + cfg.daoHieu.replace(/"/g, '&quot;') + '" placeholder="để trống = không kiểm tra" style="width:110px;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"></div>' +
        '<div style="margin-top:4px">Đồng đội (cách nhau bằng dấu phẩy): <input id="tt2d-hxparty-doi" value="' + cfg.doi.join(', ').replace(/"/g, '&quot;') + '" style="width:100%;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"></div>' +
        '<div style="margin-top:4px">Điểm hẹn: <select id="tt2d-hxparty-diemhen" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' +
          '<option value="lang"' + (cfg.diemHen === 'lang' ? ' selected' : '') + '>Làng Chân Núi (10,26)</option>' +
          '<option value="bai_da"' + (cfg.diemHen === 'bai_da' ? ' selected' : '') + '>Bãi Đá Hang Gió (10,5)</option>' +
        '</select></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-hxparty-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT lập đội</button>' +
          '<button id="tt2d-hxparty-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-hxparty-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">thanhvan2 làm Huyết Xích PHẢI TỔ ĐỘI, không đi solo được. Tool chỉ lập đội ở làng/Bãi Đá (KHÔNG lập đội trong Miếu Ông Trường Con — PK tự do), đủ đội thì báo để vào hầm ở Miếu Hoang gặp Nữ Tu (12,6). Vào hầm + phí do người dùng/script Python lo — KHÔNG tự trả phí nào khác.</div>' +
        '<div id="tt2d-hxparty-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-hxparty-trangthai');
    elLog = $('#tt2d-hxparty-log');
    elAcc = $('#tt2d-hxparty-acc');
    elDaoHieu = $('#tt2d-hxparty-dh');
    elDoi = $('#tt2d-hxparty-doi');
    elDiemHen = $('#tt2d-hxparty-diemhen');
    $('#tt2d-hxparty-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-hxparty-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-hxparty-start').addEventListener('click', function () { start(); });
    $('#tt2d-hxparty-stop').addEventListener('click', function () { stop(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value.trim() || ACC_MAC_DINH; saveCfg(); render(); });
    elDaoHieu.addEventListener('change', function () { cfg.daoHieu = elDaoHieu.value.trim(); saveCfg(); });
    elDoi.addEventListener('change', function () {
      var list = elDoi.value.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
      if (list.length) { cfg.doi = list; saveCfg(); }
      render();
    });
    elDiemHen.addEventListener('change', function () { cfg.diemHen = elDiemHen.value; saveCfg(); render(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Huyết Xích Tổ Đội đã nạp. Chỉ lập đội cho thanhvan2 — traxanhnet2 đi solo được.');

  window.__TT2D_HXPARTY__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _dangTrongMieu: dangTrongMieu,
    _dangTrongHam: dangTrongHam,
    _duDoi: duDoi,
    _trangThaiDoi: trangThaiDoi,
    _setAcc: function (a) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; },
  };
  Tong.register('hxparty', window.__TT2D_HXPARTY__);
})();


  // ================= MODULE: nhiemvu (Nhiệm vụ chính GĐ0-38, mới v1.5.0) =================

// ================= MODULE: TAB NHIỆM VỤ CHÍNH (mới v1.5.0) =================
// Tab Nhiệm vụ (lệnh Thanh 19:36 25/11 — mục 6/8 đợt 2):
//  - CHECKLIST tiến độ GĐ0–38 (Quest "Tẩy Tuỷ Phạt Mao", STAGE_COUNT=38,
//    client game.js 24/11) + Trúc Cơ Đan / đột phá — CHỈ HIỂN THỊ +
//    GỢI Ý, KHÔNG tự đột phá, KHÔNG tự dùng đồ quý, KHÔNG tự nhận/
//    làm nhiệm vụ khi chưa có lệnh.
//  - Nguồn tiến độ: __ns_.Quest.stage (số giai đoạn hiện tại) — nếu
//    game không lộ thì hiển thị "chưa đọc được, mở nhiệm vụ trong
//    game để xem" (đừng đoán).
//  - Mốc quan trọng (đã xác minh từ client + hướng dẫn nhiệm vụ):
//      GĐ6   → nộp Huấn Sư Huynh (turnInNpc).
//      GĐ13  → nộp Đại Phu (turnInNpc); cũng là mốc cuối nhiệm vụ ở
//              Dược Viên (DUOC_VIEN_LAST_STAGE=13).
//      GĐ23  → mốc cuối Khúc Ba (KHUC_BA_LAST_STAGE=23).
//      GĐ27  → 1 kỹ năng Tier 1 tại Đài Đá (Bí Tịch → Đột Phá) + 3
//              Ngưu Sừng + 3 Nanh Hổ.
//      GĐ36  → Trúc Cơ Trung Kỳ (acc chính đang ở đây, GĐ36).
//      GĐ37  → Định Cơ Đan: recipe locked, cần Đan Phương (20 Điểm
//              Tam Lộ); Vạn Hoang Huyết Lan không có tọa độ cố định
//              (10 hoa đỏ/session, đứng trong 80px, đứng yên 2s).
//      GĐ38  → Đạo Hạnh full 281.700 Trung Kỳ + thắng Tâm Kiếp;
//              đột phá 70% (100% với 10 Bảo Mệnh Phù), thất bại
//              phá đan.
//      Đột phá Trúc Cơ (Luyện Khí → Trúc Cơ Sơ Kỳ): Trúc Cơ Đan =
//      50 Trúc Cơ Thảo + 30 Địa Linh Hóa Quả + 1 Yêu Đan Cấp 3;
//      70% (100% với 5 Bảo Mệnh Phù); thất bại giữ cảnh giới/Đạo Hạnh.
//  - CHƯA XÁC MINH LIVE: nội dung từng giai đoạn 0–38 (client chỉ lộ
//    stage + số đếm); tab chỉ ghi mốc đã biết, phần còn lại hiển thị
//    "GĐ n — chưa có mô tả (xem trong game)".
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_nhiemvu_cfg';
  var STAGE_COUNT = 38;
  // Mốc đã biết (xác minh từ client + hướng dẫn). GĐ không có trong
  // bảng này thì hiển thị "chưa có mô tả — xem trong game".
  var MOC = {
    6: 'Nộp Huấn Sư Huynh',
    13: 'Nộp Đại Phu — mốc cuối Dược Viên',
    23: 'Mốc cuối Khúc Ba',
    27: '1 kỹ năng Tier 1 tại Đài Đá (Bí Tịch → Đột Phá) + 3 Ngưu Sừng + 3 Nanh Hổ',
    36: 'Trúc Cơ Trung Kỳ',
    37: 'Định Cơ Đan — cần Đan Phương (20 Điểm Tam Lộ); Vạn Hoang Huyết Lan: 10 hoa đỏ/session, đứng trong 80px, đứng yên 2s để hái',
    38: 'Đạo Hạnh full 281.700 + thắng Tâm Kiếp — đột phá 70% (100% với 10 Bảo Mệnh Phù), thất bại phá đan',
  };
  // Giai đoạn đã qua của từng acc (ghi tay, dùng khi game chưa lộ stage).
  // Acc chính đang GĐ36, net13 GĐ34, thanhvan2 chưa Trúc Cơ (GĐ0–?).
  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on,
        acc: typeof c.acc === 'string' && c.acc ? c.acc : 'traxanhnet',
        gdTay: (typeof c.gdTay === 'number' && c.gdTay >= 0 && c.gdTay <= STAGE_COUNT) ? c.gdTay : null,
        hienDaXong: c.hienDaXong === true,
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', gdTay: null, hienDaXong: false }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();
  var on = cfg.on; // tab chỉ hiển thị (không có vòng lặp chạy) — on chỉ để
  // mục (6) test bật/tắt chung + thanh mini báo trạng thái.

  function $(s) { return document.querySelector(s); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }

  function docStage() {
    // Đọc giai đoạn hiện tại từ game (nếu game lộ). Trả {stage, src}
    // hoặc null.
    try {
      var Q = window.__ns_ && window.__ns_.Quest;
      if (!Q) return null;
      if (typeof Q.stage === 'number') return { stage: Q.stage, src: 'Quest.stage' };
      if (typeof Q.getStage === 'function') {
        var s = Q.getStage();
        if (typeof s === 'number') return { stage: s, src: 'Quest.getStage()' };
      }
      if (Q.current && typeof Q.current.stage === 'number') return { stage: Q.current.stage, src: 'Quest.current' };
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function stageHienTai() {
    var d = docStage();
    if (d) return d;
    if (cfg.gdTay !== null && cfg.gdTay !== undefined) return { stage: cfg.gdTay, src: 'ghi tay' };
    return null;
  }
  function docDoQuy() {
    // Đếm đồ làm Trúc Cơ Đan trong túi (nếu đọc được Inventory).
    var out = { trucCoThao: null, diaLinhHoaQua: null, yeuDanC3: null };
    try {
      var Inv = window.__ns_ && window.__ns_.Inventory;
      if (!Inv) return out;
      var items = [];
      if (typeof Inv.list === 'function') items = Inv.list();
      else if (Array.isArray(Inv.items)) items = Inv.items;
      if (!items || !items.length) return out;
      var dem = function (ten) {
        var n = 0;
        items.forEach(function (it) {
          var nm = String((it && (it.name || it.ten || it.id)) || '');
          if (nm.indexOf(ten) >= 0) n += (typeof it.count === 'number' ? it.count : (typeof it.soLuong === 'number' ? it.soLuong : 1));
        });
        return n;
      };
      out.trucCoThao = dem('Trúc Cơ Thảo');
      out.diaLinhHoaQua = dem('Địa Linh Hóa Quả');
      out.yeuDanC3 = dem('Yêu Đan Cấp 3');
    } catch (e) { /* bỏ qua */ }
    return out;
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elDanhSach, elAcc, elGdTay, elHienDaXong;
  function setCollapsed(v) {
    var b = $('#tt2d-nhiemvu-body'), m = $('#tt2d-nhiemvu-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-nhiemvu-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-nhiemvu-mini-status'); if (s) s.textContent = v ? (function () { var st = stageHienTai(); return st ? 'GĐ' + st.stage + '/' + STAGE_COUNT : 'GĐ ?/' + STAGE_COUNT; })() : '';
  }
  function render() {
    if (!elDanhSach) return;
    var st = stageHienTai();
    var stage = st ? st.stage : null;
    if (elTrangThai) {
      // v1.5.1 (lệnh Thanh 22:10 25/11): KHÔNG hiện tên acc ở dòng trạng thái.
      elTrangThai.textContent =
        (stage !== null ? 'Giai đoạn ' + stage + '/' + STAGE_COUNT + ' (' + (st.src || '') + ')' : 'Chưa đọc được giai đoạn từ game — nhập tay bên dưới hoặc mở nhiệm vụ trong game để xem.');
    }
    // Checklist GĐ0–38.
    var rows = [];
    for (var gd = 0; gd <= STAGE_COUNT; gd++) {
      var daXong = stage !== null && gd < stage;
      var dangLam = stage !== null && gd === stage;
      var moTa = MOC[gd] || 'chưa có mô tả (xem trong game)';
      if (!cfg.hienDaXong && daXong) continue;
      var dau = daXong ? '✅' : (dangLam ? '▶️' : '⬜');
      var style = dangLam ? ' style="color:#ffd76a;font-weight:bold"' : '';
      rows.push('<div' + style + '>' + dau + ' GĐ' + gd + ' — ' + moTa.replace(/</g, '&lt;') + '</div>');
    }
    elDanhSach.innerHTML = rows.join('');
    // Đồ làm Trúc Cơ Đan.
    var dq = docDoQuy();
    var elDq = $('#tt2d-nhiemvu-doquy');
    if (elDq) {
      var fmt = function (v, can) {
        if (v === null || v === undefined) return '—';
        return v + '/' + can + (v >= can ? ' ✅' : '');
      };
      elDq.innerHTML = 'Trúc Cơ Đan (đột phá Trúc Cơ): ' +
        'Trúc Cơ Thảo ' + fmt(dq.trucCoThao, 50) + ' · ' +
        'Địa Linh Hóa Quả ' + fmt(dq.diaLinhHoaQua, 30) + ' · ' +
        'Yêu Đan Cấp 3 ' + fmt(dq.yeuDanC3, 1) +
        (dq.trucCoThao === null ? ' (chưa đọc được túi — mở Hành Trang trong game để xem)' : '');
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('nhiemvu');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-nhiemvu-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>📜 Nhiệm vụ chính</b>' +
        '<button id="tt2d-nhiemvu-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-nhiemvu-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>📜 Nhiệm vụ</b>' +
        '<span id="tt2d-nhiemvu-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-nhiemvu-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-nhiemvu-body">' +
        '<div style="margin-top:6px">Acc: <input id="tt2d-nhiemvu-acc" value="' + cfg.acc.replace(/"/g, '&quot;') + '" style="width:110px;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"> ' +
        'GĐ hiện tại (ghi tay nếu game không lộ): <input id="tt2d-nhiemvu-gdtay" type="number" min="0" max="' + STAGE_COUNT + '" value="' + (cfg.gdTay !== null && cfg.gdTay !== undefined ? cfg.gdTay : '') + '" placeholder="?" style="width:48px;background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px"></div>' +
        '<div style="margin-top:4px"><label><input type="checkbox" id="tt2d-nhiemvu-hiendaxong"' + (cfg.hienDaXong ? ' checked' : '') + '> Hiện cả giai đoạn đã xong</label> ' +
        '<button id="tt2d-nhiemvu-lam-moi" style="padding:2px 8px;border-radius:4px;border:1px solid #8a6a2f;background:#2a2113;color:#ffe9b0;cursor:pointer">Làm mới</button></div>' +
        '<div id="tt2d-nhiemvu-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div id="tt2d-nhiemvu-doquy" style="margin-top:4px;color:#cbb37a"></div>' +
        '<div id="tt2d-nhiemvu-danhsach" style="margin-top:6px;max-height:220px;overflow:auto"></div>' +
        '<div style="margin-top:6px;color:#cbb37a">Tab chỉ hiển thị + gợi ý — KHÔNG tự đột phá, KHÔNG tự dùng đồ quý, KHÔNG tự nhận/làm nhiệm vụ khi chưa có lệnh. Đột phá Trúc Cơ: 70% (100% với 5 Bảo Mệnh Phù), thất bại giữ cảnh giới/Đạo Hạnh. GĐ38: 70% (100% với 10 Bảo Mệnh Phù), thất bại phá đan.</div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-nhiemvu-trangthai');
    elDanhSach = $('#tt2d-nhiemvu-danhsach');
    elAcc = $('#tt2d-nhiemvu-acc');
    elGdTay = $('#tt2d-nhiemvu-gdtay');
    elHienDaXong = $('#tt2d-nhiemvu-hiendaxong');
    $('#tt2d-nhiemvu-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-nhiemvu-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-nhiemvu-lam-moi').addEventListener('click', function () { render(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value.trim() || 'traxanhnet'; saveCfg(); render(); });
    elGdTay.addEventListener('change', function () {
      var v = parseInt(elGdTay.value, 10);
      cfg.gdTay = (isFinite(v) && v >= 0 && v <= STAGE_COUNT) ? v : null;
      saveCfg(); render();
    });
    elHienDaXong.addEventListener('change', function () { cfg.hienDaXong = elHienDaXong.checked; saveCfg(); render(); });
  }

  buildPanel();
  setInterval(function () { render(); }, 5000);
  render();

  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); render(); }

  window.__TT2D_NHIEMVU__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    render: render,
    status: function () {
      var st = stageHienTai();
      return { on: on, acc: cfg.acc, stage: st ? st.stage : null, src: st ? st.src : null, stageCount: STAGE_COUNT, doQuy: docDoQuy() };
    },
    _docStage: docStage,
    _stageHienTai: stageHienTai,
    _docDoQuy: docDoQuy,
    _moc: MOC,
    _stageCount: STAGE_COUNT,
    _setGdTay: function (v) { cfg.gdTay = v; saveCfg(); if (elGdTay) elGdTay.value = (v === null || v === undefined) ? '' : v; render(); },
  };
  Tong.register('nhiemvu', window.__TT2D_NHIEMVU__);
})();


  // ================= MODULE: hoisinh (Hồi Sinh thông minh, mới v1.5.0) =================

// ================= MODULE: HỒI SINH THÔNG MINH (mới v1.5.0) =================
// Tab Hồi Sinh (lệnh Thanh 19:36 25/11 — mục 7/8 đợt 2):
//  - Quyết định hồi sinh khi gục (theo quy tắc Thanh đã chốt):
//      * Giờ Chính Ma 11:00–12:00: TUYỆT ĐỐI không hồi sinh/di chuyển
//        ở làng — chờ qua 12:00 (25/11 chính gục 35 lần, net13 17 lần
//        vì hồi sinh ở làng bị PK camp). CHỈ chờ, không bấm gì.
//      * Săn boss (tab Boss đang bật, currentBoss/currentTarget):
//        hồi sinh TẠI CHỖ ngay + đánh luôn (tab Boss đã lo, tối đa
//        3 lần/phiên) — tab này chỉ giám sát, không bấm thêm.
//      * Farm thường: "Về làng" (an toàn) thay vì "Hồi sinh" tại chỗ
//        khi HP thấp/nguy hiểm; xong khởi động lại tab Farm.
//  - Cách nhận biết gục: overlay gục (nút [data-action="ve-lang"]/
//    [data-action="hoi-sinh"]/nút có chữ 'Về làng'/'Hồi sinh') HOẶC
//    HP về 0 (StatusPanel) — kiểm tra mỗi giây khi tab bật.
//  - Tab KHÔNG tự bấm "Hồi sinh" tại chỗ khi đang farm (chỉ bấm "Về
//    làng"), KHÔNG bấm gì trong giờ Chính Ma. Khi "Về làng" xong thì
//    tự khởi động lại tab Farm (đích farm theo acc).
//  - CHƯA TEST LIVE: selector thật của nút gục (game dùng chữ hay
//    data-action nào); khi "Về làng" có về đúng điểm hồi sinh làng
//    không.
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_hoisinh_cfg';
  // Giờ Chính Ma hằng ngày (quy tắc cứng: không hồi sinh/di chuyển ở làng).
  var CHINH_MA = { tu: 11 * 60, den: 12 * 60 };
  var FARM_VE = {
    traxanhnet: { map: 'phong_dia', khu: 11 },
    traxanhnet2: { map: 'phong_dia', khu: 3 },
    traxanhnet13: { map: 'phong_dia', khu: 20 },
    thanhvan2: { map: 'duoc_vien', khu: 16 },
  };
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return {
        on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet',
        veFarm: c.veFarm !== false, choChinhMa: c.choChinhMa !== false,
      };
    } catch (e) { return { on: false, acc: 'traxanhnet', veFarm: true, choChinhMa: true }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();

  var on = cfg.on;
  var phase = 'idle';           // idle|cho|guc|cho_chinh_ma|ve_lang|ve_farm
  var gucTu = 0;
  var daBaoChinhMa = false;
  var logLines = [];
  var lastLogGio = {};

  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function farm() { return window.__TT2D_FARM__ || null; }
  function bossTab() { return window.__TT2D_BOSS__ || null; }
  function nav() { return window.__TT2D_NAV__ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 40) logLines = logLines.slice(-40);
    render();
  }
  function logChong(key, msg) {
    var now = Date.now();
    if (lastLogGio[key] && now - lastLogGio[key] < 60000) return;
    lastLogGio[key] = now;
    log(msg);
  }
  function phutTrongNgay(nowMs) {
    var d = new Date(nowMs || Date.now());
    return d.getHours() * 60 + d.getMinutes();
  }
  function dangChinhMa(nowMs) {
    var p = phutTrongNgay(nowMs);
    return p >= CHINH_MA.tu && p < CHINH_MA.den;
  }
  function dangSanBoss() {
    try {
      var bt = bossTab();
      if (!bt) return false;
      if (typeof bt.status === 'function') {
        var st = bt.status();
        return !!(st && (st.currentBoss || st.currentTarget || st.phase === 'fighting'));
      }
    } catch (e) { /* bỏ qua */ }
    return false;
  }
  function docHP() {
    try {
      var n = window.__ns_ || null;
      var p = n && n.SceneWorld && n.SceneWorld.player;
      if (p && typeof p.hp === 'number') return { hp: p.hp, max: p.maxHp || p.hpMax || null };
      var sp = n && n.StatusPanel;
      if (sp && typeof sp.hp === 'number') return { hp: sp.hp, max: sp.maxHp || null };
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function timNutGuc() {
    // Overlay gục: nút "Về làng" / "Hồi sinh" (chữ hoặc data-action).
    var nutVe = null, nutHoi = null;
    $all('button, [data-action]').forEach(function (el) {
      var t = txt(el);
      var a = el.getAttribute('data-action') || '';
      if (!nutVe && (/về làng/i.test(t) || a === 've-lang')) nutVe = el;
      if (!nutHoi && (/hồi sinh/i.test(t) || a === 'hoi-sinh')) nutHoi = el;
    });
    return { ve: nutVe, hoi: nutHoi };
  }
  function dangGuc() {
    // Phát hiện gục như tab Boss (v1.3.0): __ns_.SceneWorld.player.downed
    // HOẶC bảng #downed HIỆN (không có class 'hidden'). CHỈ tìm nút gục
    // khi đã xác định gục — nút "Về làng"/"Hồi sinh" vẫn nằm trong DOM
    // cả khi bảng ẩn, đọc thẳng sẽ tưởng lúc nào cũng gục (bug bắt được
    // nhờ test smoke v1.5.0).
    var guc = false;
    try {
      var p = window.__ns_ && window.__ns_.SceneWorld && window.__ns_.SceneWorld.player;
      if (p && p.downed) guc = true;
    } catch (e) { /* bỏ qua */ }
    if (!guc) {
      var d = $('#downed');
      if (d && !d.classList.contains('hidden')) guc = true;
    }
    if (!guc) {
      var hp = docHP();
      if (hp && hp.hp <= 0) guc = true;
    }
    if (!guc) return null;
    var n = timNutGuc();
    if (n.ve || n.hoi) return n;
    var hp2 = docHP();
    if (hp2 && hp2.hp <= 0) return { ve: null, hoi: null, hp0: true };
    return { ve: null, hoi: null, choNut: true };
  }
  function tap(el) {
    if (!el) return;
    var n = nav();
    if (n && typeof n.tap === 'function') { try { n.tap(el); return; } catch (e) { /* fallback */ } }
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  async function veFarmLai() {
    var f = farm();
    var preset = FARM_VE[cfg.acc] || FARM_VE.traxanhnet;
    if (!f) { log('Không thấy tab Farm — cần về farm tay.'); return; }
    log('Khởi động lại tab Farm: ' + (preset.map === 'phong_dia' ? 'Phong Địa' : 'Thảo Dược Cốc') + ' Khu ' + preset.khu + '.');
    try {
      f.stop();
      f.setTarget(preset.map, preset.khu);
      await sleep(300);
      f.start();
    } catch (e) { log('Về farm lỗi: ' + (e && e.message)); }
  }

  // ---------------- Tick chính ----------------
  var dangXuLy = false;
  function tick(nowMs) {
    try {
      var now = (typeof nowMs === 'number') ? nowMs : Date.now();
      if (!on) { render(); return; }
      var guc = dangGuc();
      if (!guc) {
        if (phase !== 'cho' && phase !== 'idle') { phase = 'cho'; render(); }
        else render();
        gucTu = 0;
        daBaoChinhMa = false;
        return;
      }
      // Đang gục.
      if (!gucTu) {
        gucTu = now;
        phase = 'guc';
        log('Nhân vật đã gục — quyết định hồi sinh theo quy tắc...');
      }
      // 1) Giờ Chính Ma: TUYỆT ĐỐI không hồi sinh/di chuyển ở làng.
      if (dangChinhMa(now)) {
        phase = 'cho_chinh_ma';
        if (!daBaoChinhMa) {
          daBaoChinhMa = true;
          var con = CHINH_MA.den - phutTrongNgay(now);
          log('Đang giờ Chính Ma (11:00–12:00) — KHÔNG hồi sinh, KHÔNG di chuyển ở làng, chờ qua 12:00 (còn ' + con + ' phút).');
        }
        render(); return;
      }
      daBaoChinhMa = false;
      // 2) Săn boss: tab Boss tự hồi sinh tại chỗ tối đa 3 lần rồi đánh
      //    luôn — tab này chỉ giám sát, không bấm thêm.
      if (dangSanBoss()) {
        phase = 'guc';
        logChong('cho-boss', 'Đang săn boss — tab Boss tự hồi sinh tại chỗ rồi đánh luôn, tab Hồi Sinh không bấm thêm.');
        render(); return;
      }
      // 3) Farm thường: "Về làng" (an toàn) thay vì "Hồi sinh" tại chỗ.
      if (dangXuLy) { render(); return; }
      dangXuLy = true;
      phase = 've_lang';
      var nut = timNutGuc();
      if (nut.ve) {
        log('Gục khi farm — bấm "Về làng" (an toàn) thay vì "Hồi sinh" tại chỗ.');
        tap(nut.ve);
      } else if (nut.hoi) {
        log('Không thấy nút "Về làng" — chỉ thấy "Hồi sinh" tại chỗ. KHÔNG bấm (HP thấp/nguy hiểm) — chờ người bấm tay hoặc tab Boss lo.');
        dangXuLy = false;
        render(); return;
      } else {
        log('HP về 0 nhưng chưa thấy nút gục — chờ overlay hiện rồi bấm "Về làng".');
        dangXuLy = false;
        render(); return;
      }
      setTimeout(function () {
        dangXuLy = false;
        // Sau khi về làng: nếu không còn gục thì về farm tiếp.
        if (!dangGuc()) {
          phase = 've_farm';
          log('Đã về làng — khởi động lại tab Farm.');
          if (cfg.veFarm) veFarmLai();
        } else {
          phase = 'guc';
          log('Vẫn gục sau khi bấm "Về làng" — chờ kỳ sau.');
        }
        gucTu = 0;
        render();
      }, 3000);
      render();
    } catch (e) { /* không làm rơi game vì lỗi tool */ }
  }

  // ---------------- Bật / dừng / debug ----------------
  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); phase = 'cho'; log('Tab Hồi Sinh BẬT — gục khi farm thì "Về làng", săn boss thì tab Boss hồi sinh tại chỗ, giờ Chính Ma 11:00–12:00 thì chờ.'); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); phase = 'idle'; gucTu = 0; dangXuLy = false; log('Tab Hồi Sinh TẮT.'); render(); }
  function status() {
    return {
      on: on, phase: phase, acc: cfg.acc, veFarm: cfg.veFarm,
      dangChinhMa: dangChinhMa(), dangSanBoss: dangSanBoss(),
      dangGuc: !!dangGuc(), hp: docHP(),
    };
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elLog, elAcc, elVeFarm, elChoChinhMa;
  function setCollapsed(v) {
    var b = $('#tt2d-hoisinh-body'), m = $('#tt2d-hoisinh-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-hoisinh-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-hoisinh-mini-status'); if (s) s.textContent = v ? (on ? 'BẬT · ' + phase : 'TẮT') : '';
  }
  function render() {
    if (elTrangThai) {
      elTrangThai.textContent = (on ? 'BẬT · ' : 'TẮT · ') + phase +
        (dangChinhMa() ? ' · đang giờ Chính Ma (chờ tới 12:00)' : '') +
        (dangSanBoss() ? ' · đang săn boss' : '');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-12).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function buildPanel() {
    var host = Tong.tabBody('hoisinh');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-hoisinh-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>💀 Hồi Sinh thông minh</b>' +
        '<button id="tt2d-hoisinh-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-hoisinh-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>💀 Hồi Sinh</b>' +
        '<span id="tt2d-hoisinh-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-hoisinh-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-hoisinh-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-hoisinh-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select></div>' +
        '<div style="margin-top:4px"><label><input type="checkbox" id="tt2d-hoisinh-vefarm"' + (cfg.veFarm ? ' checked' : '') + '> Về làng xong tự về farm tiếp</label></div>' +
        '<div style="margin-top:4px"><label><input type="checkbox" id="tt2d-hoisinh-chochinhma"' + (cfg.choChinhMa ? ' checked' : '') + '> Giờ Chính Ma 11:00–12:00 thì chờ (không hồi sinh)</label></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-hoisinh-start" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">BẬT hồi sinh</button>' +
          '<button id="tt2d-hoisinh-stop" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#5a2a2a;color:#fff;cursor:pointer">DỪNG</button>' +
        '</div>' +
        '<div id="tt2d-hoisinh-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div style="margin-top:4px;color:#cbb37a">Gục khi farm: "Về làng" (an toàn) thay vì "Hồi sinh" tại chỗ khi HP thấp/nguy hiểm; xong khởi động lại tab Farm. Gục khi săn boss: tab Boss tự hồi sinh tại chỗ tối đa 3 lần rồi đánh luôn.</div>' +
        '<div style="margin-top:4px;color:#ff9a8a">⚠️ Giờ Chính Ma 11:00–12:00: TUYỆT ĐỐI không hồi sinh/di chuyển ở làng — chờ qua 12:00 (25/11 chính gục 35 lần, net13 gục 17 lần vì hồi sinh ở làng bị PK camp).</div>' +
        '<div id="tt2d-hoisinh-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-hoisinh-trangthai');
    elLog = $('#tt2d-hoisinh-log');
    elAcc = $('#tt2d-hoisinh-acc');
    elVeFarm = $('#tt2d-hoisinh-vefarm');
    elChoChinhMa = $('#tt2d-hoisinh-chochinhma');
    $('#tt2d-hoisinh-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-hoisinh-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-hoisinh-start').addEventListener('click', function () { start(); });
    $('#tt2d-hoisinh-stop').addEventListener('click', function () { stop(); });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
    elVeFarm.addEventListener('change', function () { cfg.veFarm = elVeFarm.checked; saveCfg(); });
    elChoChinhMa.addEventListener('change', function () { cfg.choChinhMa = elChoChinhMa.checked; saveCfg(); });
  }

  buildPanel();
  setInterval(function () { tick(); }, 1000);
  tick();
  log('Tab Hồi Sinh đã nạp. Bật tab để tự quyết định hồi sinh khi gục.');

  window.__TT2D_HOISINH__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    status: status,
    _tick: tick,
    _dangChinhMa: dangChinhMa,
    _dangGuc: dangGuc,
    _timNutGuc: timNutGuc,
    _dangSanBoss: dangSanBoss,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('hoisinh', window.__TT2D_HOISINH__);
})();


  // ================= MODULE: baocao (Báo cáo cuối ngày + nhận thưởng Thư, mới v1.5.0) =================

// ================= MODULE: BÁO CÁO CUỐI NGÀY + NHẬN THƯỞNG THƯ (mới v1.5.0) =================
// Tab Báo Cáo (lệnh Thanh 19:36 25/11 — mục 8/8 đợt 2):
//  - Tổng kết ngày: LT kiếm/tiêu, quái, DC, cá, sự kiện đã tham gia —
//    đọc từ Sổ LT (tab Sổ), #stone-day (quái hôm nay), Inventory cá
//    (tab Câu), log sự kiện các tab (Đại Hội/Vạn Hoang/Tam Lộ/Tông
//    Môn Chiến/Linh Thụ/Săn Boss/Xổng Chuồng).
//  - Nhận thưởng Thư: Thư là tab "Thư" (Hộp thư tông môn) trong bảng
//    Tông Môn (các tab: Tiệm, Chiến, Thụ, Thư); Chat.tongChuaDoc() =
//    số thư chưa đọc. Tool mở bảng Tông Môn -> tab Thư -> bấm nút
//    "Nhận" từng thư (chỉ nhận thưởng, KHÔNG bán/đổi đồ).
//  - KHÔNG tự bán/đổi đồ, KHÔNG tự nhận Điểm Danh (nút Điểm Danh đã
//    có ở tab Sổ — tab này không đụng tới).
//  - CHƯA TEST LIVE: selector thật của nút "Nhận" trong tab Thư; Sổ LT
//    có ghi "kiếm/tiêu" theo ngày không; cá trong Inventory đếm được
//    không.
(function () {
  'use strict';

  var CFG_KEY = 'tt2d_baocao_cfg';
  var LOG_KEY = 'tt2d_baocao_log';
  var ACCS = ['traxanhnet', 'traxanhnet2', 'traxanhnet13', 'thanhvan2'];

  function loadCfg() {
    try {
      var c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      return { on: !!c.on, acc: ACCS.indexOf(c.acc) >= 0 ? c.acc : 'traxanhnet' };
    } catch (e) { return { on: false, acc: 'traxanhnet' }; }
  }
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* bỏ qua */ } }
  var cfg = loadCfg();
  var on = cfg.on; // tab chỉ hiển thị + bấm nút khi người dùng yêu cầu —
  // on chỉ để mục (6) test bật/tắt chung + thanh mini báo trạng thái.

  var logLines = [];
  var lastLogGio = {};

  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function txt(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function nav() { return window.__TT2D_NAV__ || null; }
  function ns() { return window.__ns_ || null; }

  function log(msg) {
    var t = new Date();
    var hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2), ss = ('0' + t.getSeconds()).slice(-2);
    logLines.push(hh + ':' + mm + ':' + ss + ' ' + msg);
    if (logLines.length > 60) logLines = logLines.slice(-60);
    render();
  }
  function logChong(key, msg) {
    var now = Date.now();
    if (lastLogGio[key] && now - lastLogGio[key] < 60000) return;
    lastLogGio[key] = now;
    log(msg);
  }
  function soChuan(s) {
    // "12.345" / "12,345" -> 12345; không đọc được -> null.
    if (s === null || s === undefined) return null;
    var n = parseInt(String(s).replace(/[^0-9-]/g, ''), 10);
    return isFinite(n) ? n : null;
  }

  // ---------------- Đọc số liệu ngày ----------------
  function docSoDo() {
    // Từ tab Sổ (status(): {lt, quai, tran, canhBao}).
    try {
      var sd = window.__TT2D_SODO__ || null;
      if (sd && typeof sd.status === 'function') return sd.status();
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function docQuaiHomNay() {
    // #stone-day trong bảng Sổ (quái hôm nay, nếu có). Dạng "148/10000"
    // (đã giết / trần ngày) — lấy số TRƯỚC dấu "/"; dùng soChuan thẳng
    // sẽ xóa "/" thành 14810000 (bug bắt được ở test 25/11).
    var el = $('#stone-day');
    if (!el) return null;
    var t = txt(el);
    var m = /([0-9][0-9.,]*)\s*\//.exec(t);
    if (m) return soChuan(m[1]);
    return soChuan(t);
  }
  function docCa() {
    // Cá trong túi: ưu tiên status() tab Câu cá (trả caSong/linhNgu);
    // fallback Inventory.count('ca_song'|'linh_ngu') như tool câu thật.
    try {
      var cau = window.__TT2D_FISH__ || null;
      if (cau && typeof cau.status === 'function') {
        var st = cau.status();
        if (st && (typeof st.caSong === 'number' || typeof st.linhNgu === 'number')) {
          return { caSong: st.caSong, linhNgu: st.linhNgu };
        }
      }
    } catch (e) { /* fallback */ }
    try {
      var Inv = ns() && ns().Inventory;
      if (!Inv) return null;
      if (typeof Inv.count === 'function') {
        return { caSong: Inv.count('ca_song'), linhNgu: Inv.count('linh_ngu') };
      }
      var items = [];
      if (typeof Inv.list === 'function') items = Inv.list();
      else if (Array.isArray(Inv.items)) items = Inv.items;
      if (!items || !items.length) return null;
      var dem = function (ten) {
        var n = 0;
        items.forEach(function (it) {
          var nm = String((it && (it.name || it.ten || it.id)) || '');
          if (nm.indexOf(ten) >= 0) n += (typeof it.count === 'number' ? it.count : (typeof it.soLuong === 'number' ? it.soLuong : 1));
        });
        return n;
      };
      return { caSong: dem('Cá Sông'), linhNgu: dem('Linh Ngư') };
    } catch (e) { return null; }
  }
  function docSuKien() {
    // Log sự kiện các tab (chỉ đọc status/log, không bấm gì).
    var out = [];
    var tabs = [
      ['Đại Hội', window.__TT2D_DAIHOI__],
      ['Vạn Hoang', window.__TT2D_VANHOANG__],
      ['Tam Lộ', window.__TT2D_TAMLO__],
      ['Tông Môn Chiến', window.__TT2D_TONGMONCHIEN__],
      ['Linh Thụ', window.__TT2D_LINHTHU__],
      ['Săn Boss', window.__TT2D_SANBOSS__],
      ['Xổng Chuồng', window.__TT2D_XONGCHUONG__],
      ['Huyết Xích Tổ Đội', window.__TT2D_HXPARTY__],
    ];
    tabs.forEach(function (t) {
      var ten = t[0], mod = t[1];
      if (!mod || typeof mod.status !== 'function') return;
      try {
        var st = mod.status();
        if (!st) return;
        var moTa = '';
        if (typeof st.on === 'boolean') moTa += st.on ? 'BẬT' : 'TẮT';
        if (st.phase) moTa += ' · ' + st.phase;
        if (st.tran) moTa += ' · ' + st.tran;
        if (st.ket) moTa += ' · ' + st.ket;
        if (st.sapToi) moTa += ' · sắp tới ' + (st.sapToi.ten || st.sapToi.id) + ' ' + (st.sapToi.gio || '');
        if (st.dangSan) moTa += ' · đang săn ' + st.dangSan;
        out.push(ten + ': ' + (moTa || '—'));
      } catch (e) { /* bỏ qua */ }
    });
    return out;
  }
  function docThuChuaDoc() {
    try {
      var C = ns() && ns().Chat;
      if (C && typeof C.tongChuaDoc === 'function') return C.tongChuaDoc();
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function layLogNgay() {
    try {
      var l = JSON.parse(localStorage.getItem(LOG_KEY) || 'null');
      var homNay = new Date().toDateString();
      if (l && l.ngay === homNay) return l;
    } catch (e) { /* bỏ qua */ }
    return { ngay: new Date().toDateString(), ltDau: null, quaiDau: null, dcDau: null, caSongDau: null, linhNguDau: null };
  }
  function luuLogNgay(l) { try { localStorage.setItem(LOG_KEY, JSON.stringify(l)); } catch (e) { /* bỏ qua */ } }

  // ---------------- Tổng kết ngày ----------------
  function tongKet() {
    var sd = docSoDo();
    var quaiHomNay = docQuaiHomNay();
    var ca = docCa();
    var logNgay = layLogNgay();
    var lt = sd && typeof sd.lt === 'number' ? sd.lt : null;
    var quai = sd && typeof sd.quai === 'number' ? sd.quai : null;
    var dc = null;
    try {
      var Q = ns() && ns().Quest;
      if (Q && typeof Q.dc === 'number') dc = Q.dc;
    } catch (e) { /* bỏ qua */ }
    // Ghi mốc đầu ngày lần đầu trong ngày (để tính chênh lệch).
    if (logNgay.ltDau === null && lt !== null) { logNgay.ltDau = lt; luuLogNgay(logNgay); }
    if (logNgay.quaiDau === null && quai !== null) { logNgay.quaiDau = quai; luuLogNgay(logNgay); }
    if (logNgay.dcDau === null && dc !== null) { logNgay.dcDau = dc; luuLogNgay(logNgay); }
    if (logNgay.caSongDau === null && ca && typeof ca.caSong === 'number') { logNgay.caSongDau = ca.caSong; luuLogNgay(logNgay); }
    if (logNgay.linhNguDau === null && ca && typeof ca.linhNgu === 'number') { logNgay.linhNguDau = ca.linhNgu; luuLogNgay(logNgay); }
    var fmt = function (v) { return (v === null || v === undefined) ? '—' : String(v); };
    var chen = function (dau, hien) {
      if (dau === null || dau === undefined || hien === null || hien === undefined) return '';
      var d = hien - dau;
      return ' (' + (d >= 0 ? '+' : '') + d + ' hôm nay)';
    };
    var lines = [];
    lines.push('📊 BÁO CÁO NGÀY ' + new Date().toLocaleDateString('vi-VN') + ' — acc ' + cfg.acc);
    lines.push('Linh Thạch: ' + fmt(lt) + chen(logNgay.ltDau, lt));
    lines.push('Quái: ' + fmt(quaiHomNay !== null ? quaiHomNay : quai) + (quaiHomNay === null ? chen(logNgay.quaiDau, quai) : ' (hôm nay)'));
    lines.push('Điểm Dược Công: ' + fmt(dc) + chen(logNgay.dcDau, dc));
    if (ca) {
      lines.push('Cá Sông: ' + fmt(ca.caSong) + chen(logNgay.caSongDau, ca.caSong) + ' · Linh Ngư: ' + fmt(ca.linhNgu) + chen(logNgay.linhNguDau, ca.linhNgu));
    } else {
      lines.push('Cá: chưa đọc được (mở Hành Trang trong game để xem).');
    }
    var thu = docThuChuaDoc();
    lines.push('Thư chưa đọc (Hộp thư tông môn): ' + fmt(thu));
    var sk = docSuKien();
    lines.push('Sự kiện hôm nay:');
    if (sk.length) sk.forEach(function (s) { lines.push('  - ' + s); });
    else lines.push('  - chưa có tab sự kiện nào báo trạng thái.');
    return { lines: lines, lt: lt, quai: quai, dc: dc, ca: ca, thuChuaDoc: thu };
  }

  // ---------------- Nhận thưởng Thư ----------------
  function tap(el) {
    if (!el) return;
    var n = nav();
    if (n && typeof n.tap === 'function') { try { n.tap(el); return; } catch (e) { /* fallback */ } }
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }
  function nutHien(el) {
    // Nút đang hiển thị thật (loại nút trong bảng ẩn / panel tool ẩn).
    try {
      if (!el.getClientRects || !el.getClientRects().length) return false;
      var cs = window.getComputedStyle(el);
      return cs && cs.display !== 'none' && cs.visibility !== 'hidden';
    } catch (e) { return true; }
  }
  function timNutNhan() {
    // Nút "Nhận" / "Nhận thưởng" trong tab Thư (chỉ bấm nút Nhận,
    // KHÔNG bấm nút bán/đổi). Siết chặt sau bug test 25/11: bản cũ quét
    // toàn document bằng textContent nên vớ cả nút ẨN và nút KHÔNG phải
    // Nhận — "Chấp nhận" (lời mời tổ đội), "TỰ ĐI LÀM VIỆC ĐÃ NHẬN"
    // (Dược), "BẬT tự chấp nhận", và cả nút "Nhận thưởng Thư" của
    // chính tab Báo Cáo (đệ quy). Nay: chữ PHẢI bắt đầu bằng Nhận,
    // nút phải đang hiển thị, và loại mọi nút trong HUD của tool (tt2d-).
    return $all('button').filter(function (el) {
      var t = txt(el);
      if (!/^nhận/i.test(t)) return false;
      if (/điểm danh/i.test(t)) return false;
      if (el.closest && el.closest('[id^="tt2d-"]')) return false;
      return nutHien(el);
    });
  }
  async function nhanThuongThu() {
    log('Mở bảng Tông Môn → tab Thư để nhận thưởng...');
    // Mở bảng Tông Môn: nút Hành Trang (B) -> Hoạt Động -> Tông Môn,
    // hoặc nút Tông Môn trên màn hình nếu có.
    var nutTongMon = $all('button, [data-tab], [data-action]').find(function (el) {
      if (el.closest && el.closest('[id^="tt2d-"]')) return false;
      var t = txt(el);
      var a = (el.getAttribute('data-tab') || '') + ' ' + (el.getAttribute('data-action') || '');
      return /tông môn/i.test(t) || /tong-mon/i.test(a);
    });
    if (nutTongMon) {
      tap(nutTongMon);
      await sleep(1000);
    }
    // Chọn tab Thư trong bảng Tông Môn.
    var tabThu = $all('button, [data-tab], [data-action]').find(function (el) {
      if (el.closest && el.closest('[id^="tt2d-"]')) return false;
      var t = txt(el);
      var a = (el.getAttribute('data-tab') || '') + ' ' + (el.getAttribute('data-action') || '');
      return (/^thư$/i.test(t) || /thu/i.test(a)) && !/thư viện/i.test(t);
    });
    if (tabThu) {
      tap(tabThu);
      await sleep(1000);
    } else {
      log('Không thấy tab "Thư" trong bảng Tông Môn — mở bảng Tông Môn tay rồi bấm tab Thư, tab sẽ tự nhận thưởng khi thấy nút Nhận.');
    }
    var nuts = timNutNhan();
    if (!nuts.length) {
      log('Không thấy nút "Nhận" nào — có thể Thư đã nhận hết hoặc bảng chưa mở. (Thư chưa đọc: ' + (docThuChuaDoc() === null ? '—' : docThuChuaDoc()) + '.)');
      return 0;
    }
    var daNhan = 0;
    for (var i = 0; i < nuts.length; i++) {
      try {
        tap(nuts[i]);
        daNhan++;
        await sleep(800);
      } catch (e) { /* bỏ qua nút này */ }
    }
    log('Đã bấm "Nhận" ' + daNhan + ' thư. (Chỉ nhận thưởng — KHÔNG bán/đổi đồ.)');
    return daNhan;
  }

  // ---------------- Bảng điều khiển ----------------
  var panel, elTrangThai, elLog, elAcc, elBaoCao;
  function setCollapsed(v) {
    var b = $('#tt2d-baocao-body'), m = $('#tt2d-baocao-mini');
    if (!b || !m) return;
    b.style.display = v ? 'none' : '';
    m.style.display = v ? 'flex' : 'none';
    var c = $('#tt2d-baocao-collapse'); if (c) c.textContent = v ? '＋' : '—';
    var s = $('#tt2d-baocao-mini-status'); if (s) s.textContent = v ? ('LT ' + (function () { var sd = docSoDo(); return sd && typeof sd.lt === 'number' ? sd.lt : '—'; })()) : '';
  }
  function render() {
    if (elTrangThai) {
      var sd = docSoDo();
      var thu = docThuChuaDoc();
      // v1.5.1 (lệnh Thanh 22:10 25/11): KHÔNG hiện tên acc ở dòng trạng thái
      // (chỉ LT/quái/Thư) — tên acc không hiển thị trên tên nhân vật đã đăng nhập.
      elTrangThai.textContent =
        (sd && typeof sd.lt === 'number' ? 'LT ' + sd.lt : '—') +
        (sd && typeof sd.quai === 'number' ? ' · quái ' + sd.quai : '') +
        (thu !== null ? ' · Thư chưa đọc: ' + thu : '');
    }
    if (elLog) {
      elLog.innerHTML = logLines.slice(-20).map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      elLog.scrollTop = elLog.scrollHeight;
    }
  }
  function hienBaoCao() {
    var tk = tongKet();
    if (elBaoCao) {
      elBaoCao.innerHTML = tk.lines.map(function (l) { return '<div>' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
    }
    log('Đã tổng kết ngày (xem bảng trên).');
    render();
  }
  function buildPanel() {
    var host = Tong.tabBody('baocao');
    if (!host) return;
    panel = document.createElement('div');
    panel.id = 'tt2d-baocao-panel';
    panel.style.cssText = 'position:static;width:100%;font:12px/1.5 system-ui,sans-serif;color:#ffe9b0';
    var opts = ACCS.map(function (a) {
      return '<option value="' + a + '"' + (a === cfg.acc ? ' selected' : '') + '>' + a + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<b>📊 Báo cáo cuối ngày</b>' +
        '<button id="tt2d-baocao-collapse" title="Thu nhỏ khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:14px;padding:0 4px">—</button>' +
      '</div>' +
      '<div id="tt2d-baocao-mini" style="display:none;align-items:center;justify-content:space-between;gap:6px">' +
        '<b>📊 Báo cáo</b>' +
        '<span id="tt2d-baocao-mini-status" style="color:#bfe3ff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<button id="tt2d-baocao-expand" title="Mở rộng khung" style="background:none;border:none;color:#ffe9b0;cursor:pointer;font-size:16px;padding:0 2px">＋</button>' +
      '</div>' +
      '<div id="tt2d-baocao-body">' +
        '<div style="margin-top:6px">Acc: <select id="tt2d-baocao-acc" style="background:#2a2113;color:#ffe9b0;border:1px solid #8a6a2f;border-radius:4px">' + opts + '</select></div>' +
        '<div style="margin-top:6px;display:flex;gap:6px">' +
          '<button id="tt2d-baocao-tongket" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#3a5a2a;color:#fff;cursor:pointer">Tổng kết ngày</button>' +
          '<button id="tt2d-baocao-nhanthu" style="flex:1;padding:5px;border-radius:5px;border:1px solid #8a6a2f;background:#2a4a6a;color:#fff;cursor:pointer">Nhận thưởng Thư</button>' +
        '</div>' +
        '<div id="tt2d-baocao-trangthai" style="margin-top:6px;color:#bfe3ff">—</div>' +
        '<div id="tt2d-baocao-noidung" style="margin-top:6px;max-height:220px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
        '<div style="margin-top:6px;color:#cbb37a">Tổng kết đọc từ Sổ LT + #stone-day (quái hôm nay) + Inventory cá + log sự kiện các tab. Nhận thưởng Thư chỉ bấm nút "Nhận" trong tab Thư của bảng Tông Môn — KHÔNG bán/đổi đồ, KHÔNG nhận Điểm Danh ở đây.</div>' +
        '<div id="tt2d-baocao-log" style="margin-top:6px;max-height:120px;overflow:auto;background:rgba(0,0,0,0.25);border-radius:4px;padding:4px 6px"></div>' +
      '</div>';
    host.appendChild(panel);
    elTrangThai = $('#tt2d-baocao-trangthai');
    elLog = $('#tt2d-baocao-log');
    elAcc = $('#tt2d-baocao-acc');
    elBaoCao = $('#tt2d-baocao-noidung');
    $('#tt2d-baocao-collapse').addEventListener('click', function () { setCollapsed(true); });
    $('#tt2d-baocao-expand').addEventListener('click', function () { setCollapsed(false); });
    $('#tt2d-baocao-tongket').addEventListener('click', function () { hienBaoCao(); });
    $('#tt2d-baocao-nhanthu').addEventListener('click', function () {
      nhanThuongThu().then(function (n) { render(); });
    });
    elAcc.addEventListener('change', function () { cfg.acc = elAcc.value; saveCfg(); render(); });
  }

  buildPanel();
  setInterval(function () { render(); }, 5000);
  render();
  log('Tab Báo Cáo đã nạp. Bấm "Tổng kết ngày" để xem số liệu, "Nhận thưởng Thư" để nhận thưởng trong Thư.');

  function start() { if (on) return; on = true; cfg.on = true; saveCfg(); render(); }
  function stop() { on = false; cfg.on = false; saveCfg(); render(); }

  window.__TT2D_BAOCAO__ = {
    start: start,
    stop: stop,
    setCollapsed: setCollapsed,
    render: render,
    tongKet: tongKet,
    nhanThuongThu: nhanThuongThu,
    status: function () {
      var sd = docSoDo();
      return {
        on: on,
        acc: cfg.acc,
        lt: sd && typeof sd.lt === 'number' ? sd.lt : null,
        quai: sd && typeof sd.quai === 'number' ? sd.quai : null,
        quaiHomNay: docQuaiHomNay(),
        ca: docCa(),
        thuChuaDoc: docThuChuaDoc(),
      };
    },
    _docSoDo: docSoDo,
    _docQuaiHomNay: docQuaiHomNay,
    _docCa: docCa,
    _docSuKien: docSuKien,
    _docThuChuaDoc: docThuChuaDoc,
    _timNutNhan: timNutNhan,
    _setAcc: function (a) { if (ACCS.indexOf(a) >= 0) { cfg.acc = a; saveCfg(); if (elAcc) elAcc.value = a; } },
  };
  Tong.register('baocao', window.__TT2D_BAOCAO__);
})();


  // ================= MODULE: sangmap (Sáng map Tam Lộ + Vạn Hoang, mới v1.5.0) =================

// ================= MODULE: SÁNG MAP SỰ KIỆN (Tam Lộ + Vạn Hoang) =================
// Mục 9 v1.5.0 (lệnh Thanh 21:38 25/11): "Sáng map" TOÀN BỘ map khi đang ở
// trong sự kiện Tam Lộ Tranh Phong hoặc Vạn Hoang Chiến Trường — cả hai map
// đều tối/khó nhìn, cần nhìn rõ địa hình + đối thủ để di chuyển/chiến đấu.
// Toggle "Sáng map" đặt trong CẢ HAI tab Tam Lộ và Vạn Hoang, chung một cơ
// chế sáng (handle __TT2D_SANGMAP__); tự BẬT khi vào map sự kiện (khi tab
// tương ứng đang bật), tự TẮT khi rời map sự kiện.
//
// CƠ CHẾ SÁNG (trích client game.js 24/11):
//  - Renderer chính phủ tối toàn màn hình rgba(7,5,10,0.93) rồi khoét đa giác
//    nhìn thấy bằng NHIN.daGiac(x, y, TAM, ...) quanh nhân vật — ngoài đa
//    giác đó là tối. Vạn Hoang: ChienTruong.TAM_NHIN=192 (mở rộng
//    TAM_NHIN_RA=224); Tam Lộ: TamLo.TAM_NHIN={nguoi:240, linh:190, tru:340,
//    nha:340, bua:120} (mở rộng ×1.15) — render Tam Lộ dựng danh sách vòng
//    sáng B=[{x,y,r:TAM_NHIN.nguoi}, ...lính/trụ/nhà].
//  - Tool NÂNG bán kính nhìn thấy lên 4096 (chỉ TAM_NHIN của 2 hệ sự kiện,
//    chỉ khi đang ở map sự kiện; rời map thì KHÔI PHỤC đúng giá trị gốc) —
//    đa giác nhìn thấy phủ kín map/màn hình (raycast chỉ chặn ở tường/biên).
//    CHỈ nâng TAM_NHIN.nguoi của Tam Lộ (người chơi); linh/trụ/nhà giữ
//    nguyên để không chạm logic khác.
//  - Lớp dự phòng: CSS filter brightness(1.9) lên canvas game — nâng cả lớp
//    tối còn sót (vignette veToi, fill 0.93) mà không chạm logic game; rời
//    map thì gỡ filter, trả đúng filter gốc của canvas.
//  - Map sự kiện: chien_truong, chien_truong_cho (Vạn Hoang —
//    ChienTruong.MAP/MAP_CHO), tam_lo (Tam Lộ — TamLo.MAP). Đọc map hiện tại
//    qua nav.docViTri().map (đọc #hud-map: "Vạn Hoang..." -> chien_truong,
//    "Tam Lộ..." -> tam_lo), fallback __ns_.SceneWorld.map(.id).
//
// CHƯA XÁC MINH LIVE (xem README mục 9):
//  - Chỗ đọc ChienTruong.TAM_NHIN trong code render map Vạn Hoang chưa tìm
//    thấy theo tên (có thể render đọc qua MapData/def khác) — nếu nâng hằng
//    số không đủ sáng thì filter canvas vẫn làm sáng toàn map.
//  - Id canvas thật của game chưa biết — tool thử #game-canvas rồi canvas
//    hiển thị lớn nhất trên trang.
//  - Tam Lộ KHÔNG có map chờ riêng trong client (tam_lo_cho không tồn tại)
//    nên chỉ bật sáng ở map tam_lo.
//  - Việc bấm đất/joystick trong vùng tối: client không thấy chỗ nào chặn
//    input theo tầm nhìn — tối chỉ là lớp vẽ, sau khi sáng thì bấm được như
//    thường (chưa xác minh live).
//  - KHÔNG chạm Huyết Xích (VetNut.TAM_NHIN meCung/sanh/hom) — ngoài phạm vi
//    lệnh (chỉ Tam Lộ + Vạn Hoang).
(function () {
  'use strict';

  var MAPS_SANG = ['chien_truong', 'chien_truong_cho', 'tam_lo'];
  var TAM_SANG = 4096; // Bán kính nhìn thấy khi sáng (gốc: VH 192, TL người 240).
  var FILTER_SANG = 'brightness(1.9) contrast(1.05)';
  var KEY = 'tt2d.sangmap.v1';

  var bat = true; // Công tắc chính (mặc định BẬT — tự sáng khi vào map sự kiện).
  var dangSang = false; // Đang áp dụng sáng lúc này?
  var goc = null; // Giá trị gốc đã lưu {ct, ctRa, tl} để khôi phục khi tắt.
  var canvasCu = null; // Canvas đang gắn filter.
  var filterCu = null; // Filter gốc của canvas (để khôi phục).

  function loadCfg() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var c = JSON.parse(raw);
      if (c && typeof c.bat === 'boolean') bat = c.bat;
    } catch (e) { /* bỏ qua */ }
  }
  function saveCfg() {
    try { localStorage.setItem(KEY, JSON.stringify({ bat: bat })); } catch (e) { /* bỏ qua */ }
  }
  function ns() { try { return window.__ns_ || null; } catch (e) { return null; } }
  function nav() { try { return window.__TT2D_NAV__ || null; } catch (e) { return null; } }

  function mapHienTai() {
    try {
      var n = nav();
      if (n && typeof n.docViTri === 'function') {
        var p = n.docViTri();
        if (p && p.map) return p.map;
      }
    } catch (e) { /* fallback */ }
    try {
      var sw = ns() && ns().SceneWorld;
      var m = sw && sw.map;
      if (typeof m === 'string') return m;
      if (m && m.id) return m.id;
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function laMapSuKien(map) { return !!map && MAPS_SANG.indexOf(map) >= 0; }

  function timCanvas() {
    try {
      var c = document.querySelector('#game-canvas');
      if (c) return c;
      var cs = document.querySelectorAll('canvas');
      var best = null, bestArea = 0;
      for (var i = 0; i < cs.length; i++) {
        var r = cs[i].getBoundingClientRect();
        var a = r.width * r.height;
        if (a > bestArea) { bestArea = a; best = cs[i]; }
      }
      return best;
    } catch (e) { return null; }
  }

  function khoiPhucCT() {
    // Khôi phục đúng giá trị gốc của hệ Vạn Hoang (nếu đã nâng).
    try {
      var CT = ns() && ns().ChienTruong;
      if (CT && goc) {
        if (goc.ct !== null && goc.ct !== undefined) CT.TAM_NHIN = goc.ct;
        if (goc.ctRa !== null && goc.ctRa !== undefined) CT.TAM_NHIN_RA = goc.ctRa;
      }
    } catch (e) { /* bỏ qua */ }
    if (goc) { goc.ct = null; goc.ctRa = null; }
  }
  function khoiPhucTL() {
    // Khôi phục đúng giá trị gốc của hệ Tam Lộ (nếu đã nâng).
    try {
      var TL = ns() && ns().TamLo;
      if (TL && TL.TAM_NHIN && goc && goc.tl !== null && goc.tl !== undefined) TL.TAM_NHIN.nguoi = goc.tl;
    } catch (e) { /* bỏ qua */ }
    if (goc) { goc.tl = null; }
  }
  function apDung(map) {
    // Áp dụng sáng (lũy đẳng — gọi lại mỗi nhịp tick vẫn đúng, kể cả khi
    // game khởi tạo lại hằng số lúc vào trận mới). Đổi trực tiếp từ map sự
    // kiện này sang map kia thì khôi phục hệ cũ trước (vd tam_lo ->
    // chien_truong thì TamLo.TAM_NHIN.nguoi về 240).
    var N = ns();
    if (!goc) goc = { ct: null, ctRa: null, tl: null };
    var laVH = (map === 'chien_truong' || map === 'chien_truong_cho');
    if (laVH) khoiPhucTL(); else khoiPhucCT();
    try {
      var CT = N && N.ChienTruong;
      if (laVH && CT && typeof CT.TAM_NHIN === 'number') {
        if (goc.ct === null || goc.ct === undefined) goc.ct = CT.TAM_NHIN;
        CT.TAM_NHIN = TAM_SANG;
      }
      if (laVH && CT && typeof CT.TAM_NHIN_RA === 'number') {
        if (goc.ctRa === null || goc.ctRa === undefined) goc.ctRa = CT.TAM_NHIN_RA;
        CT.TAM_NHIN_RA = TAM_SANG;
      }
    } catch (e) { /* bỏ qua */ }
    try {
      var TL = N && N.TamLo;
      if (!laVH && TL && TL.TAM_NHIN && typeof TL.TAM_NHIN.nguoi === 'number') {
        if (goc.tl === null || goc.tl === undefined) goc.tl = TL.TAM_NHIN.nguoi;
        TL.TAM_NHIN.nguoi = TAM_SANG;
      }
    } catch (e) { /* bỏ qua */ }
    try {
      var cv = timCanvas();
      if (cv) {
        if (!canvasCu || canvasCu !== cv) {
          canvasCu = cv;
          filterCu = cv.style.filter || '';
        }
        cv.style.filter = FILTER_SANG;
      }
    } catch (e) { /* bỏ qua */ }
    dangSang = true;
    return true;
  }

  function go() {
    // Gỡ sáng: khôi phục đúng giá trị gốc cả 2 hệ + gỡ filter canvas.
    khoiPhucCT();
    khoiPhucTL();
    try {
      if (canvasCu) { canvasCu.style.filter = filterCu || ''; canvasCu = null; filterCu = null; }
    } catch (e) { /* bỏ qua */ }
    goc = null;
    dangSang = false;
  }

  // Nhịp chính — 2 tab sự kiện gọi mỗi giây với map hiện tại (hoặc để
  // trống, tự đọc map). BẬT khi (công tắc chính đang bật VÀ đang ở map sự
  // kiện), ngược lại TẮT (khôi phục gốc).
  function capNhat(map) {
    var m = map || mapHienTai();
    if (bat && laMapSuKien(m)) apDung(m);
    else go();
    return { bat: bat, dangSang: dangSang, map: m };
  }

  function setBat(v) {
    bat = !!v;
    saveCfg();
    capNhat();
    return bat;
  }
  function start() { return setBat(true); }
  function stop() { setBat(false); return false; }
  function status() {
    return { bat: bat, dangSang: dangSang, map: mapHienTai(), tamSang: TAM_SANG, maps: MAPS_SANG.slice() };
  }

  loadCfg();

  window.__TT2D_SANGMAP__ = {
    start: start,
    stop: stop,
    setBat: setBat,
    capNhat: capNhat,
    status: status,
    MAPS_SANG: MAPS_SANG,
    TAM_SANG: TAM_SANG,
    _mapHienTai: mapHienTai,
    _laMapSuKien: laMapSuKien,
    _apDung: apDung,
    _go: go,
  };
})();

})();
