# Tool Tu Tiên Pixel — server cập nhật cho APK Android

Thư mục này host bản tool mới nhất để APK Android (Tool Tu Tiên Pixel) tải về
qua nút **Cập nhật tool** trong bảng điều khiển — khỏi cài lại APK mỗi lần
tool có bản mới.

## Tệp

- `tutienpixel-tool.user.js` — mã tool Tampermonkey mới nhất (bản đầy đủ).
- `version.txt` — số phiên bản hiện tại (khớp `@version` trong tệp tool).

URL raw ổn định:

- https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/tutienpixel-host/tutienpixel/version.txt
- https://raw.githubusercontent.com/traxanhnet6/tu-tien-2d-fishing-tool/tutienpixel-host/tutienpixel/tutienpixel-tool.user.js

## Đẩy bản tool mới lên server

Tool có bản mới (vd v1.48) thì cập nhật 2 tệp trên rồi đẩy lên kho này:

1. Chép bản mới vào `tutienpixel/tutienpixel-tool.user.js`.
2. Ghi số phiên bản mới vào `tutienpixel/version.txt` (một dòng, vd `1.48.0`).
3. Đẩy lên GitHub (snapshot push qua connector GitHub, hoặc git commit + push
   bằng SSH `ssh -F /home/hatch/.ssh/config_github`).

Xong là APK bấm **Cập nhật tool** sẽ tải bản mới về và nhúng từ lần mở game
tiếp theo. APK luôn giữ bản tool đóng gói sẵn làm dự phòng khi tải lỗi.
