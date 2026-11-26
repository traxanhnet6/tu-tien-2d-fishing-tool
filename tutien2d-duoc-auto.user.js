// ==UserScript==
// @name         Tu Tiên 2D — Tool tự làm nhiệm vụ Dược (Đại Phu Dược Công)
// @namespace    https://tutienpixel.online/
// @version      1.2.0
// @description  Tự động làm nhiệm vụ Dược Công ở Đại Phu (Thảo Dược Cốc): tự đi từ BẤT CỨ map nào về Đại Phu (lái tự dò phím/joystick/dpad/chạm, Phi Hành + Chạy BẬT trong lúc di chuyển), Trúc Cơ thì bấm "Tự Đi Làm Việc Dược Công" để game tự làm hết lượt; Luyện Khí thì tự nhận việc theo DC cao nhất, bấm bước nhiệm vụ để game tự đi tới chỗ làm, bấm Tương Tác tới đủ tiến độ rồi về nộp. Nút "TỰ ĐI LÀM VIỆC ĐÃ NHẬN" tiếp tục việc đã nhận bằng tay. Chỉ làm 5 việc thường, đủ 15 lượt/ngày thì dừng. Bảng điều khiển thu nhỏ được. Chỉ bấm nút của game.
// @author       Muse (làm cho Thanh)
// @match        https://tutienpixel.online/*
// @match        https://tutien2d.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
//
// CÁCH DÙNG
//  1. Nạp tool (extension Tampermonkey hoặc dán vào Console).
//  2. Bấm "BẬT" trên bảng tool — tool TỰ ĐI từ bất cứ đâu về Đại Phu ở
//     Thảo Dược Cốc rồi làm dược (v1.2.0 mới: không cần đưa nhân vật tới
//     gần Đại Phu trước nữa).
//  2b. ĐÃ NHẬN VIỆC BẰNG TAY RỒI: bấm "TỰ ĐI LÀM VIỆC ĐÃ NHẬN" trên bảng
//     tool — tool đọc việc đang giữ từ bảng nhiệm vụ, bấm bước nhiệm vụ để
//     game tự đi tới chỗ làm, đủ điều kiện thì tự về Đại Phu nộp. Việc
//     Đại Hội / Tán Tu đang giữ thì tool TỰ HUỶ rồi nhận việc thường tiếp
//     theo; việc Vận Tiêu đang giữ thì tool KHÔNG huỷ (đã trả phí 400 LT)
//     mà dừng lại báo rõ để anh giao xong hoặc huỷ tay.
//  3. Tool tự nhận biết cảnh giới từ bảng Đại Phu:
//     - TRÚC CƠ: bấm "Tự Đi Làm Việc Dược Công" → "Bắt Đầu Tự Làm", game
//       tự nhận việc, tự đi, tự làm, tự nộp tới hết lượt. Tool chỉ theo
//       dõi, đếm lượt, bật lại Phi Hành sau khi xong.
//     - LUYỆN KHÍ: tool tự mở "Nhận Việc Dược Công", chọn việc DC cao nhất
//       còn lượt, bấm "Nhận Việc Này", rồi bấm bước nhiệm vụ
//       (#quest-objectives li[data-di]) để game tự đi tới chỗ làm, chờ
//       nhãn "Tương Tác" rồi bấm #btn-attack tới đủ tiến độ (chặt/hái thì
//       quét vòng nhặt cành/trúc rơi — cành rơi xuống đất, không tự vào
//       túi), xong về Đại Phu nộp.
//  4. Đủ 15 lượt việc thường trong ngày (5 việc × 3 lượt) thì tool tự DỪNG
//     và log "Xong dược hôm nay". Bấm "DỪNG" bất cứ lúc nào để dừng tay.
//  5. THU NHỎ: bấm "—" trên bảng để thu thành 1 thanh nhỏ (tên tool +
//     trạng thái ngắn + nút "＋"); bấm "＋" mở lại đầy đủ. Tool vẫn chạy
//     bình thường khi bảng thu nhỏ. Bấm × để ẩn bảng (tải lại trang hiện lại).
//  6. AN TOÀN: chạm màn hình / bấm phím THẬT ngoài bảng tool thì tool tự
//     DỪNG ngay và nhả hết đầu vào (người chơi tự lái).
// v1.2.0 (26/11): TÍCH HỢP CODE THANH GỬI (07:04 26/11 "tích hợp vào tools
//  đã có") + ĐỘNG CƠ LÁI ĐI FARM v1.2.0 + LỆNH 07:05/07:06 ("thêm bật Phi
//  Hành + Chạy khi chạy tools" / "đến map tự bật Auto + Phi Hành + Chạy"):
//  - TỰ ĐI VỀ ĐẠI PHU từ bất cứ map nào (v1.1.2 bắt buộc đứng gần Đại Phu
//    mới bật được): lái tự dò phím → joystick → dpad → chạm neo camera
//    (lấy từ Đi Farm v1.2.0, đã đối chiếu game.js 24/11); Phi Hành + Chạy
//    BẬT trong lúc di chuyển, giữ qua cổng; qua cổng không được khi bay
//    thì hạ cánh đi bộ qua rồi bay lại; kiểm chứng Phi Hành bằng TỐC ĐỘ
//    (bấm lại đúng 1 lần bằng KeyF nếu bay chậm).
//  - Vòng Dược Công Luyện Khí theo cơ chế code gửi: chạm NPC xoắn ốc mở
//    thoại (dự phòng khi nút Tương Tác không hiện) → bấm "Nhận Việc Dược
//    Công" → chọn việc → bấm bước nhiệm vụ để game tự đi → chờ nhãn
//    "Tương Tác" (150s) → bấm #btn-attack tới đủ tiến độ → về Đại Phu
//    "Giao Nguyên Liệu" → lặp. Cổng HP: <50% không nhận việc, <35% dừng.
//  - GIỮ NGUYÊN quy tắc chọn việc v1.1.2 (Thanh chốt 07:23+07:26 25/11):
//    việc thường đang giữ → TIẾP TỤC LÀM; Đại Hội/Tán Tu → TỰ HUỶ rồi
//    nhận việc thường; KHÔNG BAO GIỜ nhận Đại Hội/Tán Tu/Vận Tiêu;
//    Vận Tiêu đang giữ → DỪNG báo rõ; việc lạ → DỪNG báo rõ tên.
//  - SỬA so với code gửi: vòng bấm #btn-attack KHÔNG đủ cho việc chặt
//    (Thu Gom/Trúc Tâm) — game.js: chặt cây chỉ làm CÀNH RƠI xuống đất
//    (drops, state "fall"), phải ĐI QUA chỗ cành rơi mới nhặt vào túi
//    (claimSeedMaterial khi chạm drop; tiến độ = Inventory.count).
//    Tool quét vòng nhặt quanh chỗ đứng khi tiến độ không tăng >5s.
//  - Đọc DC từ localStorage pntt_progress_v1 (trường duocCong) để đối
//    chiếu sau mỗi lần nộp (code gửi); HP đọc từ #value-hp (code gửi
//    dùng #row-hp — KHÔNG tồn tại trong game.js, 0 hit).
// v1.1.2 (25/11): TIẾP TỤC VIỆC ĐÃ NHẬN BẰNG TAY (Thanh 07:23 — "nhận xong
//  nhiệm vụ nhân vật đứng yên không làm gì hết") — thêm nút "TỰ ĐI LÀM VIỆC
//  ĐÃ NHẬN": tool đọc việc đang giữ từ bảng nhiệm vụ, tự tìm đường tới chỗ
//  làm, đủ điều kiện thì tự về Đại Phu nộp. BẬT thường cũng tiếp tục việc
//  thường đang giữ thay vì huỷ (thay thế lệnh tự huỷ 00:30 25/11). Việc
//  Đại Hội / Tán Tu đang giữ thì TỰ HUỶ rồi nhận việc thường (Thanh 07:26
//  — ngoại lệ DUY NHẤT còn lại của quy tắc tự huỷ); việc Vận Tiêu / việc
//  lạ đang giữ thì DỪNG lại báo rõ, không huỷ. Bộ chọn việc có chặn cuối:
//  không bao giờ nhận việc tên chứa "Đại Hội" / "Tán Tu" / "Vận Tiêu".
// v1.1.1 (25/11): SỬA LỖI "tự động làm dược và di chuyển không hoạt động"
//  (Thanh báo khi test tay) — nút HUD của game (#btn-attack, #btn-fly,
//  #btn-auto-touch, #btn-fishing-stop-touch) CHỈ bind "pointerdown"
//  (helper k() trong game.js), .click() lên chúng là no-op nên tool
//  không mở được hộp thoại Đại Phu và không bật/tắt được Auto/Phi Hành.
//  Nay bấm nút game bằng tap() (pointerdown+pointerup+click); diToi/
//  quaCong tắt Auto trước khi lái joystick (joystick không chạy khi
//  Auto BẬT) rồi bật lại Auto nếu là Trúc Cơ.
//
// QUY TẮC ĐỨNG (của Thanh — tool tuân thủ, không tự ý đổi):
//  - Trúc Cơ làm dược: BẬT Auto + Phi Hành + Chạy, dùng nút "Tự Đi Làm Việc
//    Dược Công". Chế độ "Tự Đi" tự hạ cánh khi làm việc mặt đất nên Phi Hành
//    không giữ BẬT suốt được — tool bật Phi Hành trước khi bắt đầu và bật
//    lại ngay sau khi xong dược.
//  - Luyện Khí làm dược: chỉ Phi Hành + Chạy, KHÔNG bật Auto (ngoại lệ tự
//    vệ: bị quái đánh tụt HP thì tool bật Auto đánh trả, HP hồi thì tắt lại).
//  - Chỉ làm 5 việc THƯỜNG: Câu Cá (4 DC), Thu Gom Dược Mộc (3 DC),
//    Đưa Người Về Làng (2 DC), Linh Chi (1 DC), Trúc Tâm (1 DC).
//    KHÔNG tự nhận "Thắng Trận Đại Hội" (chỉ đăng kí trước 9h cho kỳ 9:16
//    theo lệnh riêng), KHÔNG Vận Tiêu, KHÔNG Tán Tu Chiến Bảng.
//  - Ưu tiên việc theo DC cao nhất còn lượt (đọc DC + lượt còn lại từ bảng
//    game, không hardcode). Chỉ giữ 1 việc cùng lúc; huỷ việc là miễn phí
//    và được hoàn lại lượt. Đang giữ việc THƯỜNG đã nhận trước khi bật
//    tool (kể cả nhận bằng tay) thì tool TIẾP TỤC làm việc đó, không huỷ
//    nữa (lệnh Thanh 07:23 25/11 — thay thế lệnh tự huỷ 00:30 25/11).
//    Việc Đại Hội / Tán Tu đang giữ thì tool TỰ HUỶ rồi nhận việc thường
//    tiếp theo (lệnh Thanh 07:26 25/11 — ngoại lệ DUY NHẤT còn lại của quy
//    tắc tự huỷ). Việc Vận Tiêu đang giữ thì tool KHÔNG huỷ (đã trả phí
//    400 LT) mà dừng lại báo rõ. Việc không nhận diện được thì tool dừng
//    lại báo rõ tên việc, không huỷ lặng lẽ. Huỷ khi việc kẹt quá 10 phút
//    (quy tắc kẹt hiện có). Tool KHÔNG được đứng yên khi đang giữ việc:
//    không tiếp tục được thì ghi rõ lý do vào log + panel.
//  - Tân thủ dưới Luyện Khí Tầng 10 được DC ×2 (game tự tính, tool chỉ đọc
//    số DC game hiển thị).
//
// BẢNG VIỆC (đọc từ client 24/11 — game.js; DC là mốc Luyện Khí Tầng 10+):
//  - cau_ca "Câu Cá Làm Dược Liệu": 4 DC, +30 LT, cần câu đủ 3 cá.
//    Chỗ làm: Hồ Bích Thuỷ (18,16) hoặc Suối Dẫn Thuỷ (32,12), cùng map
//    Thảo Dược Cốc với Đại Phu. Tool dùng "Tự động câu" có sẵn của game.
//  - duoc_moc "Thu Gom Dược Mộc": 3 DC, +20 LT, cần 5 Cành Khô.
//    Chỗ làm: Cổ Thụ Linh Mộc (34,25), Thảo Dược Cốc. Chặt cây, cành rụng
//    thì đi nhặt (đi qua chỗ cành rơi là nhặt được).
//  - ho_tong_chau "Đưa Người Về Làng": 2 DC, +25 LT.
//    Dẫn cháu Đại Phu từ Thảo Dược Cốc qua Rừng Trúc về làng, giao cho
//    Thầy Ông Nội (9,10) ở làng Chân Núi Tản Viên.
//  - linh_chi "Linh Chi Dưới Chân Núi": 1 DC, +10 LT, cần hái 3 tai.
//    Linh Chi mọc ở phía bắc làng Chân Núi Tản Viên (y=1..3), mỗi phiên
//    7–10 tai mọc ở các điểm cố định — tool đi qua từng điểm để tìm.
//  - truc_gia "Trúc Tâm Dẫn Dược": 1 DC, +15 LT, cần chặt 4 thân.
//    Trúc Già đánh dấu ở Rừng Trúc: (18,5), (27,12), (10,20), (31,8).
//  - Mỗi việc tối đa 3 lượt/ngày. 5 việc thường = 15 lượt/ngày, tổng
//    33 DC/ngày (tân thủ < LK T10 được ×2, tối đa +50 điểm thưởng).
//  - KHÔNG làm: dai_hoi "Thắng Trận Đại Hội" (10 DC, 1 lượt/ngày),
//    van_tieu "Vận Tiêu Một Chuyến" (3 DC, cần Trúc Cơ),
//    chien_bang "Thắng Trận Tán Tu Chiến Bảng" (2 DC).
//
// CƠ CHẾ (đọc từ client 24/11 — game.js):
//  - Đại Phu ở Thảo Dược Cốc, ô (14,8) — props trong MapData duoc_vien:
//    {id:"dai_phu",type:"npc",tx:14,ty:8,block:!0,r:48,name:"Đại Phu"}.
//    Ô đứng của tool là (14,9) — ô '.' đi được ngay phía nam NPC, cách
//    tâm NPC 32px (trong tầm tương tác: nút #btn-attack hiện trong
//    TARGET.RANGE=150px; autoDC đi tới trong (r+10)=58px; propReach
//    r+24=72px). Code gửi dùng NPC (16,7), đứng (16,8) là SAI ô NPC
//    (cách 2 ô về đông, 64px — vẫn trong tầm nút 150px/72px nên bấm
//    Tương Tác từ đó vẫn mở được, nhưng tool KHÔNG dùng vì (14,9) gần
//    và chắc chắn hơn); ô (15,8) kề đông NPC là 't' (cây, có thể bị chặn)
//    nên không đứng đó.
//  - Hộp thoại game là DOM: #dialog, #dialog-title, #dialog-text,
//    #dialog-choices (nút .btn-choice, có <span> tên + <span class="c-note">
//    ghi chú + disabled khi hết lượt), #dialog-action (nút hành động, vd
//    "Nhận Việc Này", "Bắt Đầu Tự Làm", "Giao Ba Cá", "Giao Nguyên Liệu"),
//    #dialog-close.
//  - Nút tương tác là #btn-attack: khi đứng gần NPC/vật, nhãn đổi thành
//    "Tương Tác" (aria-label "Tương tác với <tên>") — bấm là mở hộp thoại.
//  - Menu Đại Phu: "Mở Quầy Đổi Hạt" | "Nhận Việc Dược Công" (ghi "Còn N
//    lượt hôm nay") | "Tự Đi Làm Việc Dược Công" (chỉ mở từ Trúc Cơ Sơ Kỳ;
//    ghi "Tự đi làm N lượt còn lại · trừ việc Đại Hội, Vận Tiêu").
//  - Bấm "Nhận Việc Dược Công" mở danh sách việc: mỗi việc ghi "thưởng R
//    Dược Công + S Linh Thạch · còn r/c lượt" (hết lượt thì "Hết c/c lượt
//    hôm nay"), bấm việc → hộp thoại xác nhận → bấm "Nhận Việc Này".
//  - Việc xong thì về Đại Phu mở hộp thoại, bấm "Giao Ba Cá" (câu cá) hoặc
//    "Giao Nguyên Liệu" (việc khác) để nộp. Nộp xong game tự mở Quầy Đổi
//    Hạt — tool đóng lại ngay, KHÔNG đổi gì.
//  - Đang giữ việc: menu Đại Phu CHỈ có "Mở Quầy Đổi Hạt" + "Huỷ Nhiệm Vụ"
//    (không có "Nhận Việc"/"Tự Đi" — Trúc Cơ thì có thêm "Tự Đi" để tiếp tục
//    việc đang giữ). Huỷ: "Huỷ Nhiệm Vụ" → hộp thoại xác nhận, bấm "Xác Nhận
//    Huỷ" — LÀ NÚT LỰA CHỌN (.btn-choice), KHÔNG phải nút hành động
//    (#dialog-action). Huỷ miễn phí, hoàn lại 1 lượt.
//  - Khi tool vừa BẬT mà acc đang giữ việc THƯỜNG dở (nhận trước khi bật
//    tool, kể cả nhận bằng tay) thì tool TIẾP TỤC làm việc đó — Trúc Cơ
//    dùng "Tự Đi" của game, Luyện Khí bấm bước nhiệm vụ để game tự đi rồi
//    tự làm (lệnh Thanh 07:23 25/11, thay thế lệnh tự huỷ 00:30 25/11). Việc
//    Đại Hội / Tán Tu đang giữ thì TỰ HUỶ rồi nhận việc thường (07:26
//    25/11). Việc Vận Tiêu / việc lạ đang giữ thì dừng lại báo rõ,
//    không huỷ.
//  - "Tự Đi" (Trúc Cơ): game có sẵn bộ máy tự làm việc (autoDC): tự nhận
//    việc theo thứ tự trong sổ, tự tìm đường (Pathfinder), tự hái/chặt/
//    câu/đưa người, tự về nộp, tới hết lượt. Nó tự dừng khi: hết lượt
//    ("Xong việc Dược Công hôm nay"), kẹt đường, không tìm được đường,
//    máy chủ chưa nhận, chờ nguyên liệu quá 40 giây, quái chặn đường quá
//    90 giây, HP dưới 35%, hoặc chạm màn hình/di chuyển. Nó TỰ bật Auto
//    đánh trả khi có quái tới gần rồi tắt lại sau. Tool KHÔNG chạm màn hình
//    hay joystick trong lúc bộ máy đang chạy.
//  - Bước nhiệm vụ (#quest-objectives li[data-di]): game bind click trên
//    container — bấm li thì gọi diToiNhiemVu("nv") để game tự đi tới nơi
//    làm việc (dùng Pathfinder của game, qua cổng nếu khác map).
//  - Chặt cây (Cổ Thụ / Trúc Già): chopAvailable → reserveSeedMaterial
//    rồi RƠI CÀNH xuống đất (drops, state "fall", quanh gốc cây); đi qua
//    chỗ cành rơi mới nhặt vào túi (claimSeedMaterial). Tiến độ việc
//    = Inventory.count(item) — chỉ bấm #btn-attack mà không đi nhặt thì
//    tiến độ mãi 0/5. Hái Linh Chi thì pickLinhChi cộng thẳng vào túi.
//  - Phi Hành: nút #btn-fly, có class "active" khi đang bay; Auto: nút
//    #btn-auto / #btn-auto-touch, class "active" khi bật; Chạy: #btn-run,
//    class "active" khi bật. Đang bay KHÔNG qua được cổng — tool hạ cánh
//    trước mỗi cổng rồi bay lại sau. Phím: KeyF → _flyToggle, KeyT/KeyR
//    → _autoToggle, Shift (không repeat) → toggle Chạy; phím hướng
//    KeyW/A/S/D + mũi tên → Input.keys (keydown/keyup trên window, không
//    kiểm isTrusted — 0 lần xuất hiện trong game.js).
//  - Cổng (portals, đọc từ MapData): Thảo Dược Cốc (12,0)/(13,0) → Rừng
//    Trúc (spawn 12,28); Rừng Trúc (7,0)/(8,0) → làng (spawn 7,28);
//    làng (7,29)/(8,29) → Rừng Trúc (spawn 7,1); Rừng Trúc (12,29)/
//    (13,29) → Thảo Dược Cốc (spawn 12,2).
//  - Tọa độ nhân vật đọc từ #hud-pos (dạng "(x,y)"); tên map đọc từ
//    #hud-map; HP đọc từ #value-hp ("hp / max"); gục đọc từ #downed.
//  - Lái nhân vật: tự dò phím → joystick → dpad → chạm neo camera (lấy
//    từ Đi Farm v1.2.0). Client KHÔNG kiểm tra isTrusted (0 lần xuất hiện
//    trong game.js) nên sự kiện tổng hợp chạy được. Handler joystick +
//    dpad của game gọi setPointerCapture KHÔNG try/catch nên tool vá
//    Element.prototype.setPointerCapture bằng try/catch trước khi lái.
//  - Chữ thông báo của game (vd "Xong việc Dược Công hôm nay") hiện ở
//    #ritual-caption; tiến độ việc hiện ở #quest-objectives.
//  - Điểm Dược Công còn đọc được từ localStorage "pntt_progress_v1"
//    (CONFIG.PROGRESS_KEY), trường duocCong — dùng để đối chiếu sau nộp.
//
// KHÁC BIỆT VỚI CODE THANH GỬI (ghi rõ để khỏi nhập nhằng):
//  - Thứ tự ưu tiên việc: code gửi JOB_PRIORITY = duoc_moc > linh_chi >
//    truc_gia > cau_ca > ho_tong_chau (theo khoảng cách, KHÔNG theo DC).
//    Tool này GIỮ thứ tự v1.1.2 theo DC: cau_ca (4) > duoc_moc (3) >
//    ho_tong_chau (2) > truc_gia (1) = linh_chi (1) — theo quy tắc đứng
//    "ưu tiên việc theo DC cao nhất còn lượt".
//  - Code gửi không xử lý việc ĐANG GIỮ (Đại Hội/Tán Tu/Vận Tiêu/việc lạ)
//    và không có chế độ Trúc Cơ "Tự Đi" — tool này giữ nguyên toàn bộ
//    quy tắc đó từ v1.1.2.
//  - Code gửi đọc HP qua #row-hp/#hud-left — #row-hp KHÔNG tồn tại trong
//    game.js; tool dùng #value-hp chính, .pl-bar.hp .pl-n dự phòng.
//  - Code gửi đọc map qua #hud-where — KHÔNG tồn tại trong game.js;
//    tool dùng #hud-map.
//
// GIỚI HẠN CỨNG (đọc kỹ trước khi dùng):
//  - Tool chỉ bấm nút của game (tap(): pointerdown+pointerup+click /
//    sự kiện pointer lên joystick / phím tổng hợp), không gọi lệnh mạng
//    trực tiếp, không sửa bộ nhớ game.
//  - Tool KHÔNG tự nhận "Thắng Trận Đại Hội" / Vận Tiêu / Tán Tu, KHÔNG mở
//    Quầy Đổi Hạt, KHÔNG đổi hạt / nhận thưởng khác.
//  - DC/lượt đọc từ bảng game; nếu game không hiện số lượt còn lại thì tool
//    ghi "chưa đọc được" và đếm theo số lần nộp đã thấy.
//  - Lái bằng sự kiện tổng hợp: đường đi thẳng theo đợt, gặp vật cản có
//    thể kẹt — tool có phát hiện kẹt (đi vòng vuông góc, tối đa 4 lần) rồi
//    dừng báo rõ. Lái tay qua cổng/vật cản vẫn chắc hơn; cần test live.
//  - Chế độ Luyện Khí đi làm việc ở map khác (làng/Rừng Trúc) là phần rủi ro
//    nhất của tool — nếu kẹt lặp lại, tool tự dừng và ghi log rõ.
//  - "Câu được" với việc câu cá nghĩa là tracker hiện đủ 3/3 — tool không
//    phân biệt được cá thường với Linh Ngư (game tính cả hai).
//  - Chạm NPC xoắn ốc (tapNpc) chạm lên canvas — chạm trượt NPC thì game
//    có thể cho nhân vật đi tới điểm chạm (đi lệch ~1 ô); tool lái về lại
//    ô đứng sau mỗi lần thử không thành.
//
(function () {
'use strict';
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
  flySpeedMin: 3,         // ô/s — bay dưới ngưỡng này là chưa ăn (kiểm chứng bằng tốc độ)
  flyCheckMs: 800,        // đợt lái đầu dài >=800ms mới đo tốc độ bay
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
      if (tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
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
      // Đo bằng khoảng cách CHEBYSHEV (trục lớn nhất), KHÔNG phải Euclid:
      // đi chéo 2 phím làm Euclid tăng √2 lần (đi bộ chéo đo được ~3,5 ô/s
      // > ngưỡng 3 nên tưởng đang bay — bắt được ở test (k13) 26/11:
      // flyKeyCount=0, bay chậm mà không bấm lại KeyF).
      if (flyingBelief && !flySpeedChecked && res.ms >= CFG.flyCheckMs &&
          (res.reason === 'arrived' || res.reason === 'axis' || res.reason === 'timeout')) {
        var distTiles = Math.max(Math.abs(p2.x - startPos.x), Math.abs(p2.y - startPos.y));
        if (distTiles >= 2) {
          var spd = distTiles / (res.ms / 1000);
          flySpeedMeasured = spd;
          if (flySpeedFirst === null) flySpeedFirst = spd;
          if (spd < CFG.flySpeedMin && !flyRetryDone) {
            flyRetryDone = true;
            log('Phi Hành: tốc độ chỉ ~' + spd.toFixed(1) + ' ô/s (<' + CFG.flySpeedMin + ') — bay chưa ăn, bấm lại 1 lần (KeyF).');
            pressFlyKey();
            await sleep(1200);
            if (tok !== steerToken) return { ok: false, reason: 'dung', msg: 'Đã dừng.' };
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
          bestCheb = Infinity; noProgress = 0;
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
  flySpeedMeasured = null; flySpeedFirst = null;
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
    flySpeedMeasured = null; flySpeedFirst = null;
    camAnchor = null;
    dcLocalLucBatDau = docDCLocal();
    log('BẬT tool Dược v1.2.0 — tự đi tới Đại Phu từ bất cứ đâu, làm việc thường, nộp, lặp.');
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
      '<span class="tt2d-duoc-title">🌿 Dược Công <span class="tt2d-duoc-ver">v1.2.0</span></span>' +
      '<button type="button" class="tt2d-duoc-mini" data-act="thu-nho" title="Thu nhỏ">–</button>' +
    '</div>' +
    '<div class="tt2d-duoc-body">' +
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
  document.body.appendChild(p);
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
    version: '1.2.0', on: on, phase: phase, realm: realm,
    dc: docDCLocal(), dcLocal: docDCLocal(), luotDaLam: luotDaLam,
    viecDangGiu: docViecDangGiu(),
    pos: docViTri(), hp: docHP(),
    steerMethod: steerMethod, flyingBelief: flyingBelief,
    flySpeedFirst: flySpeedFirst, flySpeedMeasured: flySpeedMeasured,
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
  log('Tool Dược v1.2.0 đã tải. Bấm BẬT để tự đi tới Đại Phu và làm việc thường.');
}
// Debug handle (mở cho test smoke + kiểm tra tay).
window.__TT2D_DUOC__ = {
  version: '1.2.0',
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
})();
