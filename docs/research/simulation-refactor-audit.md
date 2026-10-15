# Audit luồng mô phỏng và lựa chọn triển khai gọn

Ngày: 13/10/2026. Baseline: `bd2a9ee`, nhánh `chore/pre-refactor-cleanup` từ Hoang theo yêu cầu người dùng. Đây là audit đường mô phỏng, không phải chứng nhận an toàn/độ đúng của toàn ứng dụng.

## 1. Kết luận để triển khai

Giữ nền Process Core, repository, xác thực và database. Thêm Jar Test thành một bài cụ thể, với bàn lab 2D và báo cáo riêng. Chỉ mở các điểm đang khóa vào acid để hai bài chạy cạnh nhau. Không viết lại toàn bộ backend, không xây engine hóa học hay editor workflow tổng quát.

Lựa chọn của Tech Lead sau yêu cầu tránh over engineering: bản Jar Test đầu dùng pH ban đầu và liều làm hai biến học tập; chương trình khuấy/lắng cố định. Thời gian vẫn được biểu diễn trên 2D và có thể tua nhanh, nhưng chưa có số đo giữa pha. Đây là thu hẹp giả thuyết “liều + thời gian” trong thiết kế trước, giữ yêu cầu có hai quyết định thật và phản hồi cuối lượt.

## 2. Bản đồ giữ và thay

| Khu vực đã đọc | Phát hiện | Xử lý tối thiểu |
| --- | --- | --- |
| `src/domain/process/lifecycle.ts`, `contracts.ts`, `ledger.ts` | Pipeline nhận `DomainModule<State>`; đã có normalize/validate/run, hashes, replay, ledger | Giữ. Thêm scenario key khi engine/content đủ điều kiện; dùng parameters phẳng có cup ID, không đổi action thành graph |
| `src/application/attempts/repository.ts`, guest/supabase repositories | Storage generic theo State; event, snapshot, projection và report đã có | Giữ cả hai adapter. Cốc nằm trong JSON state của attempt, không cần bảng cups mới |
| `supabase/migrations/20260909000200_attempts.sql` | Scenario key/release là text; state/projection/report là JSONB; status là enum vòng đời chung | Chưa thấy nhu cầu đổi schema để thêm Jar Test. Xác nhận bằng test local; chỉ tạo migration nếu có thay đổi DB thật |
| `src/application/scenarios/registry.ts`, content manifests | Chỉ có acid được đăng ký; `servedReleases()` trả danh sách acid cố định | Thêm nhánh Jar sau khi đủ engine/content; giữ release acid nguyên vẹn |
| `src/application/simulation/acid-session.ts` | Start/config/replay/report và probe action mang kiểu acid | Giữ API acid; thêm `jar-session.ts` cụ thể, dùng `commitAction`, lifecycle và repository hiện có. Chưa trừu tượng hóa toàn session thành framework |
| `src/features/simulation-session.ts`, `remote-session.ts`, `wire.ts` | Factory/transport/DTO hiện chỉ có AcidSession | Bổ sung session/DTO Jar và dispatch tường minh hai trường hợp. Không ép Jar vào AcidProjection hoặc cast để bỏ kiểm tra |
| `src/app/api/simulation/server-session.ts`, `schemas.ts`, attempts routes | Server tạo session acid; POST chỉ nhận setup acid hoặc body rỗng | POST mới có discriminator Jar được allowlist, giữ body acid cũ. Load/mutate chọn engine từ attempt đã kiểm tra ownership; không chọn từ body client |
| `src/app/simulate/[scenarioKey]/page.tsx` | Chỉ chấp nhận WORKBENCH_SCENARIO_KEY của acid | Thêm nhánh Jar và metadata tương ứng; giữ public guest flow và Promise params của Next hiện cài |
| `src/features/simulation-workbench/*` | Controller, hướng dẫn, HUD và đồ thị là acid; guidance đề xuất bước tiếp theo, projection có goal/score trong lượt | Giữ cho release acid cũ; không mang cơ chế nhắc bước/chấm tức thời sang Jar. Bàn Jar có controller nhỏ, không “generalize” các control acid |
| `src/features/reports/attempt-shell.tsx`, lab/compare clients, workbench path helper | Đọc/render/link bằng AcidSession và route acid | Danh sách và mở báo cáo phải dispatch theo scenario/release thực. Báo cáo Jar cụ thể; chỉ so các lượt cùng profile/release, không so NTU với pH |
| `src/features/experiment-catalog/catalog.ts`, content | Catalog lọc engine+content nhưng danh sách action còn hardcode acid | Thêm copy/action/evidence Jar khi flow chạy hoàn chỉnh. Không thêm hấp phụ “có thể chạy” trước khi có engine |
| `src/features/plastic-separation/*` | Luồng riêng trong UI; không chung event/repository/report với acid | Giữ ở baseline trong đợt Jar, không dùng reducer này làm nền chuẩn. Hạ khỏi danh mục mục tiêu khi chuyển sản phẩm, không xóa dữ liệu/release cũ tùy tiện |

Đây là các điểm nối phải sửa để thêm bài thứ hai; chưa có bằng chứng cần microservice, queue, WebSocket, Canvas, bảng trạng thái từng hạt hoặc thư viện physics.

## 3. Kiểm tra mô hình ứng viên

### Nguồn và phạm vi đọc

- [Farasat et al. (2017)](https://www.watconman.org/archives-pdf/2wcm2017/2wcm2017-07-09.pdf): đã tải được PDF gốc qua host `www`, đọc text và xem hình trang 2. SHA-256: `aad93a6fe385c1a9d6729e032e3817d210ed7e6d77c78e96639243f259e95499`. Đường cuối đồ thị chồng sát trục; chưa lấy số gần zero làm đáp án chính xác. Mốc thời gian cần phân biệt tổng thời gian với thời gian riêng pha lắng. Chưa chọn nguồn này cho release đầu.
- [Alateef et al. (2024), bản toàn văn do tác giả đăng](https://www.researchgate.net/publication/379000836_Initial_turbidity_pH_dosage_of_alum_and_paddles_type_optimization_of_efficiency_removal_by_using_response_surface_methods_RSM), DOI `10.6703/IJASE.202403_21(1).010`, CC BY 4.0: đọc methods, Tables 1–3/9 và Equation 3. Trang publisher trả 403; dùng toàn văn của tác giả, không dùng riêng abstract. Nghiên cứu là mẫu kaolin tổng hợp/alum, đầu ra cuối quy trình; không có kinetics theo từng thời điểm.

### Kiểm tra tính toán đã chạy

[Công cụ kiểm tra số học](../../tools/research/check-jar-candidate.mjs) dùng Node chuẩn, không thêm dependency. Chạy:

```text
node tools/research/check-jar-candidate.mjs
```

- Equation 3 chuẩn hóa coded factors tái hiện 12 giá trị dự đoán đã đối chiếu ở Table 9, chênh không quá 0.03 điểm phần trăm do hệ số in làm tròn.
- Tính lại residual trên 20 dòng dữ liệu đã dùng xây mô hình: RMSE 3.4635 điểm phần trăm; lớn nhất 9.03. Đây là kiểm tra số học/in-sample, không phải kiểm chứng độc lập ngoài phòng thí nghiệm.
- Quét 9,261 điểm trong miền ứng viên: giá trị hữu hạn, nằm trong 0–100%; không chứng minh toàn miền liên tục hoặc ngoại suy hợp lệ.
- Ở điều kiện nền cố định, thay pH hoặc liều tạo đáp ứng khác; liều lớn hơn không mặc định cho kết quả tốt hơn. Có cơ sở xây bài học so sánh và sử dụng hóa chất có chủ đích.

Chấp nhận công thức làm ứng viên cho mô hình dạy học có giới hạn. Không gọi số tính được là “kết quả đúng của nước thải thực”. Reference của phần mềm là kết quả trong cùng mô hình/release. Sai khác nhỏ hơn độ phân tán dữ liệu không được diễn giải như kết luận chắc chắn về phương án thực tế.

## 4. Profile đề xuất để lập kế hoạch

Chỉ một loại mẫu, một loại alum và cánh hai paddle. Giữ độ đục đầu ở tâm miền; pH ban đầu là các mẫu chuẩn bị sẵn, không dùng acid engine để suy lượng acid/base cho mẫu Jar. Liều chọn trong một tập nhỏ nằm trong miền công thức. Dụng cụ cấp hóa chất thể hiện liều mg/L; chưa yêu cầu người học pha stock hoặc suy mL khi tài liệu chưa khóa đủ các quy ước.

Chương trình rapid/slow/settling theo nguồn, có số thời gian mô phỏng và thao tác vận hành; animation chỉ diễn giải pha. Phép đo định lượng chỉ ở mẫu đầu và cuối chương trình. Lấy mẫu giữa pha/đổi rpm là giới hạn đã công bố, không có NTU giả. Mẫu đầu là baseline; chưa có đáp ứng định lượng cho đối chứng liều 0 trong miền nguồn này.

Một attempt, tối đa sáu cốc, mỗi cốc có lựa chọn pH ban đầu/liều, pha, phép đo và submission. Hướng dẫn sinh viên giữ pH khi khảo sát liều và giữ liều khi khảo sát pH; không tự ngăn thiết kế kém. Tính hiệu suất, chọn cốc, giải thích ở cuối. Có thể nộp thiếu; báo rõ trường nào không đánh giá được.

Plan đã đề xuất quy ước thể tích mẫu/tài nguyên, mục tiêu và tolerance đáp số; stock preparation được để sau. Đây là các lựa chọn dạy học được ghi rõ, không phải thông số mới rút từ nghiên cứu. Task engine/profile phải triển khai đúng các lựa chọn và giới hạn này trước đăng ký release; không cần phát triển một bộ mô hình mới cho từng lỗi dụng cụ.

## 5. Bằng chứng nền và giới hạn audit

Đã chạy ngày 13/10/2026:

```text
npm run test -- tests/unit/process-core-lifecycle.test.ts tests/integration/guest-runtime.test.ts tests/unit/acid-golden-fixtures.test.ts
```

Kết quả: 3 file, 71 test qua. Kiểm tra pipeline, vòng đời/lưu guest và acid fixtures trong phạm vi các test đó. Không suy từ đây rằng cloud hoặc UI Jar đã chạy.

Đã đọc guides Next được cài về Server/Client Components và Route Handlers. Đã đọc quy tắc Supabase/Postgres cho phần audit storage; không truy cập hoặc đổi production. Chưa chạy database/auth/cloud integration, audit accessibility toàn site hoặc benchmark hiệu năng 2D.

## 6. Cách giữ công việc vừa đủ

- Một engine hàm thuần, một session Jar cụ thể, một bộ projection/report Jar, một bàn lab SVG/HTML.
- Dùng schema hiện có cho state/event/report; không tạo bảng riêng cho cốc, dụng cụ hay hạt vẽ.
- Không AI tutor, editor bài, hệ plugin, component lab tổng quát hoặc mô phỏng thời gian liên tục trong đợt này.
- Không refactor landing/auth/database chỉ để “đồng bộ kiến trúc”; sửa điểm nối ảnh hưởng trực tiếp đến lượt học.
- Làm một lượt hoàn chỉnh rồi thử UI với người dùng. Mở rộng hai bài tiếp theo sau khi có bằng chứng vòng thao tác → đo → báo cáo có giá trị.

Kế hoạch thực hiện: [Jar Test đầu cuối](../superpowers/plans/2026-10-13-jar-test-first-slice.md).
