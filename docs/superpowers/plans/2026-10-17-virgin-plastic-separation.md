# Kế hoạch code: Quy trình phân loại nhựa nguyên sinh từ khâu chuẩn bị

**Ngày:** 17/10/2026  
**Trạng thái:** Đang triển khai theo kế hoạch; route riêng hoạt động trên feature branch nhưng chưa nối catalog chung hoặc nghiệm thu giao diện trực quan  
**Cơ sở UI:** `main` tại `48a9a167ef738b7ec03fd3618f2313c2437882e5`  
**Nguồn quy trình:** Meneses Quelal, Velázquez-Martí & Ferrer Gisbert (2022), DOI [10.1007/s11356-021-15611-w](https://doi.org/10.1007/s11356-021-15611-w)

> **Ràng buộc người dùng:** UI và animation phải đạt độ hoàn thiện, độ mượt của workbench Jar Test. Mọi công đoạn, điều kiện và kết quả khoa học phải truy nguyên được về bài báo; không tự suy diễn thêm.

### Tiến độ cập nhật

- Domain, session, projection, trang chi tiết/hướng dẫn và workbench riêng đã được tạo trong namespace nhựa.
- Luồng đã có bước chuẩn bị mẫu, tách nước, ly tâm/cân ghi nhận, hai nhánh và yêu cầu hoàn tất cả hai nhánh. Mỗi preset nhánh được theo sau bởi thao tác ly tâm/cân theo điều kiện bài báo.
- Các file registry/catalog dùng chung vẫn nguyên trạng theo quy tắc không sửa code của thành viên khác; vì vậy thẻ nhựa chưa xuất hiện trong `/experiments`.
- `npm run typecheck` và `npm run lint` đạt. Production build đã compile nhưng dừng khi prerender do Windows trả `EPERM` lúc tạo thư mục bên trong `.next`. Chưa nghiệm thu trực quan trong trình duyệt.

## 1. Mục tiêu

Khôi phục bài **Phân loại nhựa nguyên sinh** thành một bài thực hành đầy đủ, mở đầu bằng phần chuẩn bị sáu loại nhựa đúng theo mô tả vật liệu và phương pháp trong bài báo, tiếp tục qua tách sơ bộ bằng nước và hai nhánh ethanol/NaCl, rồi kết thúc ở thu hồi và tổng kết từng phân đoạn. Không biến các tương tác UI tự thiết kế thành công đoạn nghiên cứu mới.

Mô phỏng cần cho người học thấy rõ hạt nào nổi, hạt nào chìm ở từng bước và số liệu thu hồi được bài báo báo cáo. Không diễn giải các tỷ lệ đó thành độ tinh khiết hoặc thành kết quả do VECLab tự đo.

## 2. Căn cứ đã đọc

### 2.1. Quy trình nhựa nguyên sinh trong bài báo

| Nội dung | Bài báo ghi nhận | Cách đưa vào kế hoạch |
| --- | --- | --- |
| Nguyên liệu | Sáu polymer nguyên sinh: PP, HDPE, PS, ABS, PA, PC | Dùng đủ sáu polymer; không dùng nhánh nhựa sau tiêu dùng/PET/PVC trong bài này |
| Đặc điểm hạt | PP và HDPE dạng hạt, cỡ 2–3,36 mm; ABS hình cầu vàng nhạt; PS hình cầu trắng trong; PC trụ trắng; PA hạt chữ nhật trắng | Màn chuẩn bị trình bày đúng mô tả được báo cáo; không thêm bước kiểm tra/nhận dạng thành một thí nghiệm riêng |
| Khối lượng cấp liệu | 2,0 kg cho mỗi polymer | Ghi đây là điều kiện mẫu của nghiên cứu, không cho người học hiểu là lựa chọn tùy ý trong bài báo |
| Tách sơ bộ | Trộn mẫu với nước máy; bể pilot thể tích hữu ích 800 L; khuấy 160 rpm trong 1 giờ để làm ướt, tránh bọt khí | Hiển thị như một bước thực hành có điều kiện nghiên cứu; không bắt người học chờ đủ một giờ |
| Nước | PP + HDPE nổi; PS + ABS + PA + PC chìm; thu hồi nhóm PP + HDPE là 97,5% | Tách thành hai phân đoạn có thể chọn độc lập để xử lý tiếp |
| Thu hồi vật liệu | Ly tâm 2.950 rpm để loại ẩm/bẩn, sau đó cân để tính thu hồi theo cân bằng khối lượng | Thể hiện thao tác thu hồi và cân trong luồng; không bịa thời gian ly tâm hoặc khối lượng từng polymer sau tách |
| Nhánh ethanol | Xử lý nhóm PP + HDPE. Ở 23% v/v, PP bắt đầu tách và thu hồi PP 95,60%; ở 31% v/v, bài báo mô tả tách hoàn toàn và thu hồi HDPE 99,70% | Theo kết quả và Hình 6 như yêu cầu trước của người dùng; giữ chú thích về mâu thuẫn của bài báo |
| Nhánh NaCl | Xử lý nhóm PS + ABS + PA + PC. 11–12% w/v: PS nổi, thu hồi 80,3%; 20% w/v: ABS nổi, thu hồi 84,8%; 40% w/v: PA nổi 70%, PC chìm 95,4% | Mỗi nồng độ là một preset rời rạc; không nội suy kết quả ở nồng độ khác |

**Mâu thuẫn nguồn cần công khai:** Abstract/Conclusion không hoàn toàn khớp với phần Results về mốc và polymer được thu hồi trong nhánh ethanol. Kế hoạch giữ cách gán ở phần Results/Hình 6 theo yêu cầu trước của người dùng: 23% → PP 95,60%; 31% → HDPE 99,70%. Trang nguồn phải nói rõ đây là lựa chọn theo phần Results/Hình 6, không xóa mâu thuẫn của bài báo.

**Điều kiện môi trường:** phần phương pháp nêu mật độ dung dịch NaCl 1,055; 1,100; 1,175 g/cm³ và một dung dịch ethanol 0,935 g/cm³; phần Results nêu thêm miền mật độ môi trường 0,935–0,955 g/cm³ cùng kết quả ethanol. Không tự ghép mật độ với từng nồng độ nếu bài báo không chỉ rõ, không suy ra đường cong concentration–density và không nội suy. Engine phát lại đúng outcome theo các bước/nồng độ được báo cáo; không tự tính outcome bằng một quy tắc density mới.

### 2.2. UI, route và SVG hiện có trên `main`

- Catalog ở `/experiments` lấy trạng thái khả dụng từ catalog runtime. Thẻ khả dụng có ảnh, loại quy trình, trạng thái lưu, câu hỏi học tập, thông số và kết quả; phần dụng cụ/kiến thức mở rộng; nút đưa người dùng đến chi tiết và thực hành. Không tạo thẻ riêng lệch hệ thống nếu có thể mở rộng `EXPERIMENT_OVERVIEWS` và `listCatalog()`.
- Luồng đề xuất: `/experiments` → `/experiments/plastic-density-separation` → `/simulate/plastic-density-separation`. Trang chi tiết có breadcrumb, mục tiêu, mẫu, quy trình, điều kiện, kết quả, giới hạn và nguồn; hướng dẫn thao tác có thể là trang con theo mẫu `/experiments/jar-test/guide`.
- Jar Test đặt SVG dụng cụ làm sân khấu chính, với trạng thái và số đo dễ đọc cạnh nó. SVG dùng `viewBox`, `<defs>`, clip path, ID qua `useId`; vị trí mặt nước/hạt được suy ra từ projection. Dàn cốc có thể cuộn ngang và chọn bằng nút có tên accessible.
- Chiết tách axit–bazơ dùng SVG riêng cho phễu chiết, bình nhận, lớp pha và thiết bị. Action được engine chấp nhận mới phát cue; phần tử có vị trí trạng thái riêng với nhóm chuyển động tạm thời.
- Cả hai bài dùng CSS motion phù hợp với thiết bị, trạng thái reduced-motion và visibility; kết quả tĩnh phải đúng kể cả khi animation bị tắt, bỏ qua, gián đoạn hoặc chưa hỗ trợ.
- Trong `main`, các bài đang chạy đi qua `domain` → `application session/projection` → `features/workbench`; lượt được giữ trên IndexedDB. Hãy theo đúng release, action/event, projection và repository contract của `main`, không biến animation hoặc component state thành nguồn sự thật khoa học.

## 3. Phạm vi và ranh giới

### Bao gồm

- Quy trình **nhựa nguyên sinh** của bài báo, đủ sáu polymer và bắt đầu từ chuẩn bị mẫu.
- Bước cấp liệu, làm ướt/khuấy trong nước, phân lớp nổi/chìm, chọn nhánh, xử lý ethanol hoặc NaCl, thu phân đoạn và tổng kết.
- Số liệu kết quả được công bố, được gắn nguồn và điều kiện.
- Trang danh mục, trang chi tiết, hướng dẫn quy trình, simulator responsive và lưu lượt theo kiến trúc hiện hành sau khi scope được chấp thuận.

### Không bao gồm

- Nhựa sau tiêu dùng, PET/PVC, nghiền nhựa hoặc các máy nghiền ở Hình 2–4; đó là nhánh nghiên cứu khác.
- Mô phỏng động học lắng, hình thành bọt khí, hiệu suất ly tâm, cân bằng khối lượng cho từng polymer hay thu hồi cho nồng độ ngoài các preset đã công bố.
- Khẳng định độ tinh khiết từ tỷ lệ thu hồi; bài báo không đưa ra độ tinh khiết riêng cho từng polymer ở các bước này.
- Hướng dẫn vận hành thực tế, an toàn hóa chất hoặc thay thế đánh giá của giảng viên.
- Migration hay thay đổi Supabase production. Scope lưu lượt chỉ dùng IndexedDB theo quyết định hiện hành, trừ khi có yêu cầu riêng đã được duyệt.

## 4. Luồng trải nghiệm dự kiến

### 4.1. Danh mục và điều hướng

1. Thêm overview có ảnh/illustration của sáu loại hạt và câu hỏi: “Có thể tách sáu polymer bằng cách chọn môi trường nổi–chìm như thế nào?”
2. Thêm entry runtime cho `plastic-density-separation` với release ID riêng. Thẻ chỉ hiện “Có thể thực hành” khi route detail và simulator đã được kết nối.
3. Thẻ liên kết đến trang chi tiết; trang chi tiết có CTA đến simulator. Giữ breadcrumb `Trang chủ / Thí nghiệm / Phân loại nhựa nguyên sinh` và đường về danh mục.
4. Simulator có đường quay lại hướng dẫn và danh mục; khi mở lại một attempt, nạp đúng trạng thái đã lưu.

### 4.2. Các bước trong simulator

| Bước | Mục đích UI | Hành động được đề xuất | Trạng thái/kết quả được hiển thị |
| --- | --- | --- | --- |
| 0. Chuẩn bị mẫu | Trình bày sáu polymer, grade/density và hình dạng/màu được báo cáo | Bắt đầu lượt | 2,0 kg mỗi polymer theo setup nghiên cứu; không thêm thao tác kiểm định không có trong nguồn |
| 1. Nạp bể và làm ướt | Minh họa sáu mẫu được trộn trong bể pilot với nước máy | Bắt đầu khuấy theo điều kiện bài báo | Bể hữu ích 800 L, khuấy 160 rpm trong 1 giờ; không tạo timer hoặc động học riêng |
| 2. Tách sơ bộ bằng nước | Cho thấy kết quả phân lớp đầu tiên | Ghi nhận bước tách nước | PP+HDPE nổi; PS+ABS+PA+PC chìm; thu hồi nhóm PP+HDPE 97,5% |
| 3. Ly tâm và cân | Minh họa loại ẩm/bẩn và cân các phần đã tách như bài báo mô tả | Xác nhận chuyển phần đã thu sang nhánh tiếp | 2.950 rpm; không tự đặt thời gian ly tâm hoặc khối lượng kết quả |
| 4. Chọn phân đoạn | Chọn một phần đã tách để xem bước tiếp theo | Chọn phần nổi PP+HDPE hoặc phần chìm PS+ABS+PA+PC | Điều hướng UI, không hàm ý bài báo quy định thứ tự làm hai nhánh |
| 5A. Ethanol | Hiển thị kết quả ethanol đã báo cáo cho nhóm PP+HDPE | Chạy preset 23% v/v rồi 31% v/v | Nổi/chìm và recovery theo Results/Hình 6, có ghi chú mâu thuẫn nguồn |
| 5B. NaCl | Hiển thị kết quả NaCl đã báo cáo cho nhóm PS+ABS+PA+PC | Chạy preset 11–12, 20, 40% w/v | Nổi/chìm và recovery đã báo cáo ở mỗi bước |
| 6. Thu hồi và tổng kết | Minh họa ly tâm/cân sau các môi trường theo phương pháp và tóm tắt cây tách | Hoàn tất lượt | Điều kiện 2.950 rpm; không đặt thời lượng, khối lượng, purity hoặc kết quả không có nguồn |

Người học có thể chọn xem từng phân đoạn sau khi tách nước; đó là điều hướng UI, không phải công đoạn hóa học mới. Không thêm bước rửa, sấy, để lắng, nghiền hoặc lựa chọn kích thước hạt nếu phần quy trình nhựa nguyên sinh của bài báo không mô tả. Thao tác reset phải hỏi xác nhận nếu có dữ liệu attempt đã lưu.

## 5. Hướng thiết kế màn hình

### Mức hoàn thiện UI và animation bắt buộc

- Lấy workbench Jar Test trên `main` làm chuẩn về độ hoàn thiện: apparatus SVG rõ chi tiết, staging có trạng thái, controls/results đồng bộ, typography/khoảng cách hoàn chỉnh, responsive và accessibility được tính từ đầu. Không chấp nhận bình SVG sơ lược và vài hạt chữ nhật như UI cuối.
- Sân khấu thiết bị/quy trình là tâm điểm; panel thao tác, tiến trình, kết quả và lịch sử cần dễ quét. Trên mobile xếp thành cột theo thứ tự thao tác → quan sát → kết quả, không thu nhỏ dashboard desktop.
- Vẽ apparatus riêng cho nổi–chìm: bể, mặt dung dịch, sáu dạng hạt, lớp nổi/chìm, luồng chuyển phân đoạn và bình thu. Màu polymer là mã giao diện; nhãn chữ/mã polymer luôn đi kèm.
- Animation phải liền mạch như Jar Test: action đã commit mới phát cue; hướng di chuyển, easing, trạng thái cuối, nhãn và panel kết quả luôn nhất quán. Cần review trực quan ở desktop/mobile và reduced-motion trước khi chấp nhận; không gọi là mượt chỉ vì có keyframes.
- Chỉ minh họa thao tác và hiện tượng có trong bài báo. Không tự tạo bọt, tốc độ lắng, va chạm, phân bố ngẫu nhiên hay hiệu suất một phần. Khi tắt, bỏ qua hoặc gián đoạn motion, cảnh cuối vẫn thể hiện đúng state.
- Bố cục card/detail theo cách phân cấp của các bài mẫu: trạng thái, câu hỏi, mục tiêu, mẫu, điều kiện, kết quả; dụng cụ/kiến thức và nguồn dùng disclosure hợp lý. Không bịa độ khó, thời lượng hoặc thông số.

### Trang chi tiết

- Dùng layout detail hiện tại: phần mở đầu giải thích phương pháp và mục tiêu; kế tiếp là ảnh/mẫu; các panel riêng cho quy trình, thông số, kết quả, phạm vi và nguồn.
- Thể hiện rõ hai nhánh sau bước nước bằng sơ đồ nhỏ. Nêu điều kiện nghiên cứu pilot trong một khối có nhãn “Điều kiện bài báo”, phân biệt với thao tác mô phỏng.
- Bảng polymer có density theo đúng Table 1: PP 0,910; HDPE 0,953; PS 1,040; ABS 1,070; PA 1,140; PC 1,200 g/cm³.
- Gắn link DOI; mọi tỷ lệ recovery có đơn vị/ngữ cảnh “theo nghiên cứu”, không gọi là purity.

### Workbench

- Desktop: sân khấu quy trình/SVG là vùng trực quan chính, điều khiển bước và kết quả ở cạnh; tablet/mobile xếp thành cột, giữ nút thao tác và kết quả gần nhau.
- Thanh tiến trình thể hiện `Chuẩn bị → Nước → hai nhánh → Thu hồi → Tổng kết`; phân biệt bước hoàn tất, bước hiện tại và nhánh chưa làm.
- Trong panel kết quả, trình bày theo ba cột có nhãn **Môi trường / Nổi / Chìm**, bên dưới là **Thu hồi theo bài báo** và ghi chú nguồn.
- Không dồn toàn bộ số liệu vào SVG; giữ bảng/HTML text song song cho screen reader, copy, zoom và mobile.
- Dùng màu hạt nhất quán với legend, nhưng polymer luôn có mã chữ/nhãn. Màu là lựa chọn UI, không được mô tả như màu thật của nhựa. Có thể bổ sung hình dạng hạt khác nhau theo mô tả bài báo để người học không phụ thuộc riêng vào màu.

## 6. Thiết kế SVG và motion

### SVG tĩnh có ý nghĩa

- Dùng một `viewBox` responsive cho cảnh bể, bình thu và đường nối; chia nhóm có tên/data attribute: `feed`, `medium`, `floating-fraction`, `sinking-fraction`, `labels`, `equipment`.
- Cảnh chuẩn bị: sáu khay/bình mẫu nhỏ có mã polymer, hình hạt đơn giản theo dạng được mô tả trong bài báo; sau thao tác nạp, hạt chuyển vào bể.
- Cảnh tách nước: bể trong suốt, mặt chất lỏng, lớp nổi phía trên và lớp chìm phía dưới; nhãn chữ luôn trùng khớp với kết quả engine.
- Cảnh nhánh ethanol/NaCl: chỉ render polymer thuộc nhánh được chọn; giữ phần mẫu khác trong khay “chưa xử lý tiếp”. Các preset đổi nhãn môi trường và vị trí nhóm hạt theo kết quả đã commit.
- Cảnh thu hồi: đường dẫn từ bể đến bình nổi/bình chìm; ly tâm/cân là biểu tượng minh họa và nhãn điều kiện, không tạo số đo mới.
- Mọi gradient/clipPath/title/description có ID từ `useId`; SVG mang thông tin có `role="img"`/accessible name hoặc `aria-hidden` nếu đã có mô tả tương đương bằng HTML.

### Hợp đồng motion

- Resting geometry và nội dung lấy từ `projection`; cue chỉ khởi động sau event đã commit, định danh bằng action ID/sequence.
- Chuyển động gợi ý thao tác: nạp mẫu, khuấy minh họa, hạt tách lên/xuống, chuyển phân đoạn sang khay thu. Không mô phỏng tốc độ lắng hoặc tạo dữ liệu định lượng.
- Các lớp chuyển động tách khỏi transform/vị trí trạng thái để React và CSS không ghi đè nhau. Ưu tiên transform/opacity; tránh cập nhật path liên tục theo frame.
- Hỗ trợ `prefers-reduced-motion`, tạm dừng khi tab/scene ẩn, bỏ qua/gián đoạn animation; cuối cùng luôn về đúng vị trí theo state. Không để `animationend`, timer hoặc FPS phát sinh action khoa học.

## 7. Kế hoạch kiến trúc và file dự kiến

Thực hiện trên feature branch mới từ `develop` mới nhất theo workflow repo; code cũ trên `Hoang` chỉ dùng để tham khảo, không xem nó là baseline production.

1. **Scope và nguồn khoa học trước code:** cập nhật tài liệu scope hiện hành để chính thức đưa plastic separation trở lại; lập evidence mapping và đặc tả release riêng cho sáu polymer, preparation, action, outcome, giới hạn và golden cases. So sánh/ghi rõ phần nào kế thừa, phần nào loại khỏi đặc tả prototype cũ.
2. **Domain:** thêm model/profile và engine dưới `src/domain/experiments/plastic-separation/`. Mô hình state/action phải biểu diễn chuẩn bị, mẫu đã cấp, bước nước, lựa chọn nhánh, từng preset, recovery/collection, hoàn tất và reset. Engine từ chối sai thứ tự, sai nhánh hoặc chạy lại preset không hợp lệ; outcome khoa học là bảng preset bất biến theo source.
3. **Application:** thêm projection, action labels, session và report snapshot dưới `src/application/`. Dùng Process Core, immutable release, event replay/hash/idempotency và `GuestAttemptRepository` theo đúng contract hiện hành; không lưu UI animation state vào event log.
4. **Content/evidence:** thêm nội dung tiếng Việt, register cho DOI/claim/source section, giới hạn và chú thích mâu thuẫn ethanol; không tự động gán bằng chứng làm coefficient ngoài những kết quả bài báo thực sự báo cáo.
5. **Routes/catalog:** thêm detail, guide và simulator routes; bổ sung overview/runtime catalog/metadata. Đăng ký scene/attempt đúng trong experiment library, My Lab và reports nếu contract current experiments yêu cầu; không để attempt cũ của bài đã retire bị đọc nhầm thành plastic release mới.
6. **UI:** thêm feature folder `src/features/plastic-separation/` cho workbench, apparatus SVG, process controls, history, result panels và CSS module; tạo thành phần riêng nhưng dùng chung primitives/icons/breadcrumbs hiện có.
7. **Nguồn tham khảo:** thêm asset/illustration phù hợp nếu cần. SVG hand-authored ưu tiên cho bể/hạt/luồng phân đoạn; ảnh bài báo chỉ dùng nếu có quyền và attribution phù hợp, không dùng screenshot làm apparatus tương tác.

### Ranh giới compatibility

- Prototype hiện tại trên `Hoang` có reducer và một bể SVG nhưng chưa có các bước chuẩn bị, session persistence hoặc domain Process Core.
- Đặc tả plastic cũ trong `docs/experiments/plastic-density-separation-spec.md` mô tả benchmark bốn resin PP/HDPE/PS/PET, mật độ và recovery khác bài báo hiện tại. Không bê nguyên profile, con số, scoring hay golden cases đó vào bản sáu resin.
- `main` hiện ghi quyết định retire source nhựa. Đưa lại bài cần cập nhật quyết định scope/tài liệu trước khi kết nối runtime catalog; không âm thầm bỏ qua quyết định đó.
- Không thay đổi historical Supabase migrations hoặc remote schema. Việc lưu attempt mới là local IndexedDB theo chính sách hiện tại.

## 8. Dữ liệu và thuật ngữ UI

- Dùng tên `PP`, `HDPE`, `PS`, `ABS`, `PA`, `PC`, kèm tên đầy đủ ở legend/chi tiết.
- Dùng đúng đơn vị: `% v/v` cho ethanol; `% w/v` cho NaCl; `kg`, `L`, `rpm`, phút/giờ và `g/cm³` như nguồn.
- Phân biệt **nổi/chìm**, **thu hồi**, **độ tinh khiết**. Chỉ hiển thị recovery được báo cáo; purity là “không có số liệu trong nghiên cứu được trích”.
- Các điều kiện 800 L, 160 rpm, 1 giờ, 2 kg mỗi polymer và 2.950 rpm là điều kiện thí nghiệm/pilot, không tuyên bố app tái tạo thiết bị pilot.
- Không có thời gian ly tâm trong phần phương pháp đã đọc; không tự thêm. Không có thời gian lắng riêng cho quy trình nhựa nguyên sinh; không mượn thời lượng Jar Test hay prototype cũ.
- Tách rõ nhãn “mô phỏng theo preset nghiên cứu” khỏi “số liệu thu hồi trong bài báo”. Không hiển thị precision giả, recovery cho từng polymer ở bước nước nếu nguồn chỉ báo cáo nhóm PP+HDPE 97,5%.

## 9. Kiểm chứng dự kiến khi có yêu cầu triển khai

### Domain và khoa học

- Golden tests cho sáu density và mọi preset/outcome; kiểm tra đầy đủ thành phần nổi/chìm, đúng nhánh và recovery.
- Kiểm tra thứ tự: không thể chạy nước trước khâu chuẩn bị, không thể dùng ethanol trên nhánh polymer nặng, không thể dùng NaCl trên nhánh PP/HDPE.
- Kiểm tra 23%/31% ethanol theo cách gán Results/Hình 6 và đảm bảo cảnh báo về Abstract/Conclusion có trong content/evidence.
- Kiểm tra nồng độ ngoài preset bị từ chối, không nội suy.
- Không kiểm tra cân bằng khối lượng từng polymer bằng recovery phần trăm tổng hợp; nguồn không có đủ số liệu cho phép tính đó.

### Session, UI, SVG

- Session: start, reload/resume, append event, replay, complete, idempotent retry, revision conflict và release mismatch theo test patterns hiện có.
- UI: đường đi catalog → detail → guide/simulate; breadcrumb; nhánh độc lập; result/history; loading/error/empty/resume nếu dùng IndexedDB.
- SVG: nhiều instance không trùng ID; SVG không làm mất thông tin khi tắt motion; labels nổi/chìm khớp projection; keyboard/focus/accessible text tương đương.
- Responsive desktop/tablet/mobile và reduced motion; animation không dispatch hành động, không ảnh hưởng số liệu.
- Chạy kiểm tra đúng các script hiện hành của `main`, kết thúc bằng `npm run verify` và các E2E liên quan nếu acceptance yêu cầu. Chưa chạy test/build trong giai đoạn lập kế hoạch này.

## 10. Trình tự thực hiện và tiêu chí hoàn thành

1. Người dùng duyệt phạm vi, chiều sâu bước chuẩn bị và cách trình bày điều kiện pilot.
2. Chốt scope documents và scientific evidence/spec sáu polymer; xác minh từng con số với bài báo.
3. Xây domain model/engine và tests trước UI.
4. Xây session/projection/report và kiểm tra persistence/replay.
5. Xây route detail/guide/catalog, sau đó dựng workbench và SVG dựa trên projection.
6. Hoàn thiện accessibility, responsive, reduced motion, source disclosure và history.
7. Chạy acceptance/checks theo `main`, review diff và trình bày kết quả để người dùng duyệt.

Được xem là hoàn thành khi người học đi được toàn luồng từ chuẩn bị sáu polymer đến hai nhánh cuối; mỗi action tuân theo thứ tự; mọi outcome/text/SVG nhất quán; số liệu gắn đúng nguồn và giới hạn; attempt có thể khôi phục; route/catalog không hiển thị trạng thái sai; các quality gate liên quan đều xanh.

## 11. Câu hỏi cần chốt trước khi code

1. **Tương tác ở khâu chuẩn bị:** Mình đề xuất màn đầu trình bày sáu mẫu và điều kiện 2,0 kg/mẫu; action tiếp theo là “Nạp mẫu vào bể”, rồi minh họa đúng thao tác trộn nước máy/khuấy được bài báo mô tả. Không thêm action kiểm tra, phân loại hay xác nhận mẫu vì bài báo không mô tả các thao tác đó. Cách này có đúng ý bạn không?
2. **Điều kiện pilot và thời lượng:** Mình đề xuất hiển thị bể 800 L, 160 rpm trong 1 giờ và ly tâm 2.950 rpm dưới nhãn “Điều kiện nghiên cứu”; animation chỉ diễn tả ngắn thao tác chứ không giả lập thời gian hay động học. Bạn có muốn đổi cách thể hiện này không?

Các mốc ethanol 23%/31%, cách gán recovery PP/HDPE theo Results/Hình 6 và danh sách sáu polymer được giữ theo yêu cầu trước của bạn; ghi chú mâu thuẫn trong bài báo vẫn phải xuất hiện cho người học.
