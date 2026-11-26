// ==UserScript==
// @name         Tu Tiên 2D — Câu cá Hồ Tây (bản riêng)
// @namespace    https://tutienpixel.online/
// @version      3.4.0
// @description  Tự động câu cá Hồ Tây: chọn mục tiêu Linh/Yêu/Giao/Tự do/Tự động (theo tỷ lệ cắn tốt nhất), tự đổi mồi + tự tìm vùng quăng, theo dõi tỷ lệ cắn/câu được theo vùng, mồi và thời tiết theo thời gian thực, ghi nhận "luồng cá" từ dữ liệu cắn, quăng lại sau khi câu được cá. Tự vào Côn Bằng 12:30/19:30 (gắn dây + kéo tập thể). TỰ ĐI tới điểm câu đã chọn (nav tích hợp sẵn — chạy một mình, không cần Tool Tổng; tool KHÔNG thấy được người khác ở điểm câu nên không tự tránh điểm đông — thấy đông thì tự chọn điểm khác trong ô chọn). Thêm chế độ Câu ở Dược Cốc (Hồ Bích Thủy): tự đi tới Đài câu cá (18,15)/(18,16), chuyển khu đông người trước khi câu, bật "Tự động câu" của game, canh Giáp + kẹt ngầm. Bảng điều khiển thu nhỏ được. Chỉ bấm nút của game, không đổi tỉ lệ cắn câu (server giữ).
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// CÁCH DÙNG (v3)
//  1. Nạp tool (extension hoặc dán vào Console).
//  2. Vào Hồ Tây (khu 1), đứng ở cầu câu (40,15)/(39,14)/(38,14) —
//     hoặc BẬT "TỰ ĐI" để tool tự đi tới điểm câu đã chọn (mục 12).
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
// 10. CÔN BẰNG (mới v3.1): Côn Bằng trồi 12:30 và 19:30 (giờ VN), kéo dài
//     6 phút. Khi nút hiện "Côn", tool TỰ BẤM để gắn dây và kéo theo nhịp
//     (Thả!/Nhả nhịp/Kéo!) như kéo cá thường; dây đứt thì nút hiện "Nối X"
//     — tool chờ đếm ngược rồi bấm "Côn" nối lại. Trong lúc sự kiện diễn ra
//     tool tạm dừng quăng cần thường để chờ gắn dây; hết 6 phút (hoặc không
//     thấy nút Côn nữa) thì quay lại câu thường. Bảng hiện giờ Côn Bằng tới.
// 11. THỜI TIẾT (mới v3.1): tool đọc thời tiết hôm nay từ game (tên trong
//     giao diện câu) — không đọc được thì tự tính bằng hash ngày y hệt
//     client — rồi ghi tỷ lệ cắn/câu được theo (thời tiết + vùng + mồi).
//     Bảng hiện "Thời tiết: X — tốt nhất lúc này: <vùng/mồi> (x%)".
//     Chế độ Tự động ★ ưu tiên tỷ lệ theo thời tiết hiện tại trước, rồi mới
//     tới tỷ lệ chung; chưa có dữ liệu thì gợi ý theo mô tả thời tiết của
//     game (vd Linh Triều → Giao Ngư vùng Sâu, Nắng Gắt → vùng Sâu,
//     Mưa Bụi → vùng Giữa).
//
// 12. TỰ ĐI TỚI ĐIỂM CÂU (mới v3.2; v3.4: nav tích hợp sẵn trong tool,
//     không cần Tool Tổng): chọn ĐIỂM CÂU trong bảng (mặc định Cầu (38,14); 14 điểm trên
//     cầu đã xác minh từ client: đi được + kề nước theo ganNuoc, TILE=32,
//     SAT_NUOC_PX=52) rồi bật "TỰ ĐI". Tool tự đi từ map hiện tại tới cầu
//     bằng nav.diToiMap('van_can') + nav.diToi(x, y) (tắt Auto trước khi
//     di chuyển — joystick không chạy khi Auto BẬT; tới nơi tool câu tự
//     bắt đầu khi giao diện câu xuất hiện). Đang câu (đã quăng cần) thì
//     không di chuyển. Kẹt quá 3 lần thì TỰ ĐI tự tắt + báo rõ. ĐIỂM CÓ
//     NGƯỜI (v3.4 — ĐÃ BỎ tránh điểm): khi điểm đã chọn có người chơi khác
//     đứng yên (≥5s) đúng ô đó thì tool tự lui sang điểm trống gần nhất;
//     nếu cả 14 điểm đều có người thì DỪNG + báo rõ. Tính năng này DỰA
//     VÀO window.__ns__.Gateway.remotes — đã xác minh là MÙ live (__ns_
//     là biến local trong IIFE của game, không có trên window) và không
//     có cách DOM nào thay thế (người khác chỉ vẽ trên canvas, không
//     chặn di chuyển). Từ v3.4 tool tới đúng điểm đã chọn; thấy đông
//     thì tự chọn điểm khác trong ô chọn điểm câu.
//
// 13. CÂU Ở DƯỢC CỐC — HỒ BÍCH THỦY (mới v3.3, tính năng 13 Tool Tổng
//     v1.4.0): chọn Địa điểm "Dược Cốc — Hồ Bích Thủy" trong bảng. Cơ chế
//     câu ở đây KHÁC Hồ Tây (xác minh client 24/11): không có giao diện
//     VanCanUI quăng/giật/kéo — đứng ở Đài câu cá (18,15)/(18,16), tương
//     tác với Hồ Bích Thủy (18,16) rồi chọn "Tự động câu" trong hộp thoại
//     (nút "Dừng câu" #btn-fishing-stop-touch để dừng; di chuyển cũng dừng
//     câu). Mỗi lượt chờ 3–6 giây, tỷ lệ cắn 80%, 5% số cá cắn là Linh Ngư
//     còn lại là Cá Sông (client Fishing: MIN_WAIT 3, MAX_WAIT 6,
//     CATCH_RATE .8, SPIRIT_FISH_RATE .05).
//     v3.3.1 (25/11): SỬA dangTuDongCau() báo nhầm đang câu — bỏ quét text
//     toàn body (nút lựa chọn "Tự động câu" trong hộp thoại Hồ Bích Thủy
//     cũng match → tool tưởng đã câu trong khi chưa câu, poll (23e) pass
//     sớm khi chưa tới bến). Chỉ tin 2 tín hiệu riêng của game: nút Dừng
//     câu hiện + caption "Tự động câu".
//     v3.4.0 (26/11): TÁCH KHỎI TOOL TỔNG — nav tích hợp sẵn trong tool
//     (port động cơ lái Đi Farm v1.2.1: phím/joystick/dpad/chạm + vá
//     setPointerCapture + BFS trên lưới chặn nhúng của duoc_vien/van_can);
//     TỰ ĐI chạy được một mình, không cần Tool Tổng. Bỏ 3 chỗ đọc
//     window.__ns_ (mù live): (a) vị trí người khác — không có nguồn DOM
//     thay thế, bỏ tránh điểm; (b) số cá — đọc túi đồ khi túi đang mở
//     (.bag-slot[data-item]); (c) khu — đọc .khu-note / ô [data-khu].dang.
//     #hud-caption là code chết (0 hit trong game.js) — caption thật là
//     #ritual-caption. Kẹt ngầm DC: túi đóng thì đếm lượt câu hoàn thành
//     qua đếm ngược caption (>90s không xong lượt nào = kẹt).
//     Luồng v3.3: (a) tự tìm đường từ map hiện tại bất kỳ tới Thảo Dược
//     Cốc bằng nav.duongDi()/diToiMap() (tính năng 12); (b) tới Bảng Khu
//     (14,5), CHUYỂN KHU ĐÔNG NGƯỜI NHẤT còn chỗ trước khi câu (lệnh Thanh
//     19:43 — chỉ áp cho câu Dược Cốc, farm quái vẫn giữ khu ÍT người);
//     số người mỗi khu game KHÔNG hiện số exact trong DOM — chỉ có class
//     bucket của nút [data-khu] (KhuUI.r: "day" đầy / "dong" đông >50% /
//     "vang" có người / "" trống), nên tool chọn khu "dong" đầu tiên, rồi
//     tới "vang", không có thì ở khu hiện tại; (c) đi tới bến BẰNG BẤM ĐẤT
//     (click-to-move trên canvas, Auto BẬT tự vệ — joystick đứng yên khi
//     Auto BẬT nên không dùng joystick trên đường tới bến; bấm đất không
//     đi được sau 5s thì fallback joystick + ghi rõ); TRÁNH khe cổng hàng
//     rào phía tây (11,6)/(11,7) vào Vườn Cá Nhân — bến ở phía đông nên
//     đường đi không qua đó, nhưng BFS đi tắt qua (11,6) là dừng lại;
//     (d) CHỈ tắt Auto khi ĐÃ ĐỨNG VỮNG ở bến (18,15)/(18,16) với Giáp đầy
//     (≥95% — chưa đầy thì thiền hồi trước); (e) tương tác với Hồ Bích
//     Thủy rồi bấm "Tự động câu"; (f) giám sát trong lúc câu: Auto KHÔNG
//     tự vệ khi đang câu — Độc Đằng có thể giết trong ~2 phút, nên kiểm
//     tra Giáp mỗi 60 giây, Giáp <50% thì dừng câu + bật Auto đánh trả /
//     rút về chỗ an toàn rồi thiền hồi; (g) sau mỗi lần đăng nhập lại,
//     "Tự động câu" của game bị DỪNG — tool tự kiểm tra (caption "Tự động
//     câu... còn" + nút Dừng câu) và bật lại; (h) kẹt ngầm: CHỈ coi là kẹt
//     khi CÁ SÔNG cũng đứng yên qua 2 lần kiểm tra (Linh Ngư đứng yên một
//     mình là do hiếm 5%, không phải kẹt) — kẹt thì dừng câu rồi bật lại.
//     v3.4: túi đóng (không đọc được số cá) thì đếm lượt câu hoàn thành
//     qua đếm ngược caption #ritual-caption (>90s không xong lượt nào
//     = kẹt ngầm).
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
//  - Tool KHÔNG thấy được người chơi khác ở điểm câu (xác minh 26/11:
//    không có tín hiệu DOM nào; người khác cũng không chặn di chuyển) —
//    TỰ ĐI tới đúng điểm đã chọn, thấy đông thì tự chọn điểm khác.
//  - Mồi hết thì tool tự đổi sang mồi dự phòng, hết nữa thì dùng Giun Đất.
//  - CÔN BẰNG (v3.1): tool nhận biết sự kiện qua NÚT game ("Côn"/"Nối X"
//    — nguồn tin từ server, tin cậy nhất) và đồng hồ (12:30/19:30 giờ VN,
//    6 phút — để hiển thị giờ tới + chờ gắn dây). Đồng hồ máy có thể lệch
//    với giờ server vài giây/phút nên tool chỉ DỰA VÀO NÚT để gắn dây;
//    nếu trong khung giờ mà 90s không thấy nút Côn thì tự quay lại câu
//    thường (khỏi chờ chết). Kéo Côn là kéo tập thể — đồ rơi bốc thăm theo
//    góp sức (server giữ), tool chỉ lo gắn dây + kéo đúng nhịp.
//  - THỜI TIẾT (v3.1): thời tiết do server gửi (đọc từ giao diện câu);
//    khi chưa vào giao diện câu thì tool tự tính bằng hash ngày y hệt
//    client — 2 cách này cùng 1 công thức nên khớp nhau. Tỷ lệ theo thời
//    tiết chỉ có ý nghĩa khi đã câu đủ mẫu ở thời tiết đó (tối thiểu 3 lần
//    quăng/vùng); chưa đủ mẫu thì tool dùng tỷ lệ chung.
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
//    / "Giữ"/"Cuốn" (đang kéo cá — hoặc đang kéo Côn Bằng) / "Côn"/"Nối X"
//    (Côn Bằng: "Côn" = gắn dây, "Nối X" = đếm ngược nối lại sau khi đứt dây).
//    Côn Bằng (VanCan): CON_GIO=[[12,30],[19,30]] giờ VN, CON_DAI_MS=360000
//    (6 phút), CON_BAO_TRUOC_MS=30000 (báo trước 30s), CON_NOI_LAI_MS=5000.
//    Phase conRanh → nút "Côn"/"Nối X"; phase conKeo → "Giữ"/"Cuốn" với
//    nhịp NHIP_CON (Thở/Quẫy→"Thả!"/Lặn→"Nhả nhịp"/Kiệt→"Kéo!" — cùng chữ
//    prompt với kéo cá thường nên dùng chung logic kéo). Sau mỗi lần câu
//    xong, game tự reset phase: nếu Côn còn trồi thì nút lại thành "Côn".
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
    document.body.appendChild(panel);

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
})();
