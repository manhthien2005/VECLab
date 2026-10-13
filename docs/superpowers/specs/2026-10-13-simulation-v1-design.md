# Thiết kế sản phẩm mô phỏng VECLab v1

Ngày: 13/10/2026. Trạng thái: thiết kế để lập kế hoạch; chưa triển khai, chưa thẩm định engine mới hoặc thử với sinh viên.

Cập nhật sau yêu cầu tránh over engineering: [audit và mô hình ứng viên](../../research/simulation-refactor-audit.md), [plan lượt Jar Test đầu](../plans/2026-10-13-jar-test-first-slice.md). Phần khởi đầu dùng pH ban đầu/liều, chương trình khuấy/lắng cố định; không cần mô phỏng kinetics tự do để kiểm chứng vòng học. Các khả năng mở rộng dưới đây triển khai theo nhu cầu và dữ liệu, không phải checklist để xây hết trước bản thử đầu.

## 1. Quyết định và nguồn yêu cầu

Người dùng đã chốt: tối đa ba thí nghiệm có giá trị môi trường/thực tế; phục vụ sinh viên không chuyên Hóa có kiến thức cơ bản và biết dụng cụ; cho tự khám phá và mắc lỗi; quan sát diễn biến ngay, giải thích đúng/sai chủ yếu ở cuối; có hỗ trợ theo yêu cầu; có biểu diễn và tương tác 2D. Chủ đề được đồng ý tiếp tục ngày 13/10/2026:

1. Điều chỉnh pH mẫu nước tổng hợp có thành phần biết trước.
2. Keo tụ – tạo bông – lắng bằng Jar Test.
3. Hấp phụ xanh methylene bằng một loại than hoạt tính xác định, theo mẻ.

Những lựa chọn do Tech Lead đề xuất trong tài liệu này: SVG/HTML cho 2D; ưu tiên bàn lab trên desktop nhưng không khóa mobile; Jar Test dùng dàn sáu cốc với cùng chương trình khuấy; phát triển một luồng Jar Test hoàn chỉnh trước khi mở rộng hai bài còn lại. Đây là lựa chọn kỹ thuật/thiết kế để kiểm chứng, không phải phát biểu người dùng đã duyệt từng chi tiết.

Tài liệu này xác định mục tiêu refactor mới, thay thế danh sách ba bài và chính sách phản hồi trong scope cũ khi có xung đột. Các đặc tả khoa học/release cũ tiếp tục là căn cứ cho lượt đã tạo bằng engine cũ. Không tự đổi ý nghĩa kết quả hoặc viết lại báo cáo cũ.

## 2. Giá trị sản phẩm và giới hạn

Người học phải có thể: tự thao tác → đọc hiện tượng/số đo → quyết định tiếp → kết luận → đối chiếu → giải thích nguyên nhân → thử lại có chủ đích. Không lấy số lần bấm, thao tác kéo thả hoặc thời gian chờ làm thước đo chiều sâu.

Ba bài là các thực hành xử lý hóa–lý độc lập. Không mô tả chúng thành toàn bộ dây chuyền xử lý nước thải sinh hoạt; không suy nước an toàn để uống/xả từ pH, độ trong hoặc mất màu. Mỗi đề bài công bố mẫu tổng hợp, mục tiêu học tập và miền áp dụng.

Ngoài phạm vi đợt đầu: mô phỏng nhà máy hoàn chỉnh, engine hóa học tổng quát, 3D/VR, động lực học chất lỏng giải theo từng khung hình, tác giả bài tập tự do, sinh học SBR, AI tự tính/chấm kết quả hóa học. AI tutor là mở rộng sau khi luồng học cốt lõi hoạt động độc lập.

## 3. Trải nghiệm chung

- Trước lượt: nhận bối cảnh, mục tiêu, giới hạn mẫu và hướng dẫn vận hành dụng cụ. Không tiết lộ phương án tối ưu của đề bài.
- Bàn lab: vùng dụng cụ 2D là vùng thao tác chính; bảng thông số hiện theo dụng cụ/cốc đang chọn; sổ ghi chép lưu phép đo và ghi chú. Không bắt qua màn hình wizard sau mỗi bước.
- Người học chọn dụng cụ và đích rồi xác nhận lượng/thao tác. Kéo thả là lối tắt tùy chọn, luôn có thao tác chọn bằng chạm/bàn phím tương đương.
- Hiển thị số liệu sau phép đo thực sự được mô phỏng. Không luôn hiện nồng độ/pH thật của mọi cốc ở HUD nếu điều đó thay người học đo.
- Cho kết thúc với dữ liệu thiếu hoặc kết quả kém; báo cáo phân biệt không đánh giá được với không đạt. Không ép người học làm đúng mới được xem báo cáo.
- Cuối lượt: kết quả vật lý, chất lượng phép đo, phép tính của người học, tài nguyên đã dùng, diễn biến liên quan, tham chiếu cùng điều kiện và gợi ý thử lại.
- Gợi ý do người học mở: giải thích dụng cụ → gợi ý cách quan sát/suy luận → hỗ trợ sâu hơn. Ghi rõ mức hỗ trợ đã dùng trong báo cáo; không tự bật đáp án khi chọn sai.

Thời lượng 10–15 phút là giả thuyết thiết kế cho một lượt sau khi làm quen. Đồng hồ mô phỏng và thời gian thực được phân biệt; thử với người học mới quyết định thời lượng cuối cùng.

## 4. Phản hồi và quyền mắc lỗi

| Loại hành động | Trong lượt | Cuối lượt |
| --- | --- | --- |
| Hợp lệ và có mô hình, nhưng liều/phương án kém | Chấp nhận, thể hiện hệ quả và số đo; không gắn nhãn sai ngay | Đối chiếu bằng chứng, giải thích và phân biệt chưa tối ưu với sai |
| Hợp lệ về thao tác nhưng làm phép đo mất giá trị | Lưu provenance/trạng thái số đo; thông báo tình trạng dụng cụ trung tính | Nêu lý do không dùng số đo để kết luận, dựa vào lịch sử |
| Sai kiểu dữ liệu, lượng âm, dụng cụ không có mẫu hoặc vượt dung tích | Giải thích giới hạn vận hành ngay; không tạo state giả | Không quy thành sai kiến thức hóa học |
| Ngoài miền mô hình | Báo rõ không hỗ trợ; không ngoại suy và không tự kẹp giá trị | Nếu đã kết thúc nhánh, ghi không đánh giá được và giới hạn áp dụng |
| Mẫu thật sự không thể tiếp tục trong mô hình đã kiểm chứng | Kết thúc nhánh bị ảnh hưởng; giữ lịch sử và các nhánh còn hợp lệ | Giải thích nguyên nhân, cho tạo lượt/mẫu mới |

Mục tiêu là cho sai có căn cứ. Chưa có dữ liệu không đồng nghĩa được tự thêm mức phạt. Chặn nhập vô nghĩa không phải nhắc đáp án; chặn mọi bước khác recipe chuẩn lại làm mất quyền khám phá.

## 5. Những gì 2D biểu diễn

| Bài | Dụng cụ và trạng thái nhìn thấy | Quyết định tạo khác biệt |
| --- | --- | --- |
| pH | Cốc, buret/thiết bị cấp dung dịch, mực chất lỏng, khoá cấp, khuấy, điện cực và màn hình máy đo | Chọn liều, chia liều, đo lại, dừng hoặc hiệu chỉnh trong miền hỗ trợ |
| Jar Test | Dàn cốc, pipet cấp hóa chất, cánh khuấy, hạt/bông minh họa, vùng nước phía trên, dụng cụ lấy mẫu và máy đo đục | Thiết kế cốc so sánh, chọn liều/điều kiện có dữ liệu, thời điểm lấy mẫu, chọn phương án |
| Hấp phụ | Cân/trừ bì, than, bình tiếp xúc, mẫu xanh, hệ lọc, bình định mức/cuvet, máy đo quang | Khối lượng than, thời gian tiếp xúc có dữ liệu, pha loãng, phép đo và tính toán |

Mực dung dịch phản ánh thể tích đã commit. Hoạt ảnh cấp dung dịch xác nhận một thao tác đã được nhận. Chuyển động khuấy minh họa chương trình vận hành. Số bông vẽ, độ lớn bông và độ cao bùn không được gắn đơn vị hoặc chấm điểm nếu chưa có mô hình cho chúng. Độ đục của Jar Test không đồng nghĩa chất lỏng đổi màu hóa học.

Nếu chỉ có dữ liệu cuối pha, cho xem diễn biến định tính được ghi rõ là minh họa; không nội suy đường NTU theo thời gian từ hoạt ảnh. Muốn cho sinh viên đo giữa pha phải có mô hình/điểm dữ liệu áp dụng ở thời điểm đó. Màu xanh giảm trong bài hấp phụ phải đi cùng lượng chất trong pha rắn theo mô hình, không mô tả chất ô nhiễm biến mất.

## 6. Khả thi với nền source

Rà soát source ngày 13/10/2026 cho thấy đã có:

- `src/features/simulation-workbench/apparatus/titration-apparatus-stage.tsx`: sân khấu SVG, bố cục desktop/mobile, nhận trạng thái qua props.
- `reaction-beaker.tsx` cùng thư mục: mực chất lỏng theo thể tích; không đổi màu dung dịch axit vô cớ.
- `droplet-stream.tsx`: hiệu ứng theo thao tác đã commit; kết thúc animation không làm thay đổi hóa học.
- `src/domain/process/contracts.ts`: action, trace, measurement, ledger và release manifest.
- Acid engine có trạng thái trộn, hiệu chuẩn và đo; không có mô hình khuấy/động học thật.

Đây là bằng chứng kỹ thuật cho hướng 2D, không phải bằng chứng đã có Jar Test hoặc điều khiển trực tiếp tất cả dụng cụ. Asset/hình học có thể tái sử dụng sau audit. Controller acid, hướng dẫn bắt buộc và reducer nhựa chưa phải engine chung cho bộ ba mới.

Lựa chọn đề xuất: giữ Next.js/React/TypeScript; dùng SVG cho dụng cụ, lớp HTML cho điều khiển/nhãn/sổ đo, CSS cho chuyển động. Chưa thêm thư viện đồ họa. Chỉ cân nhắc Canvas nếu đo thực tế thấy số hạt/đối tượng SVG gây chậm; công thức và kết quả không phụ thuộc lựa chọn renderer.

## 7. Hợp đồng giữa mô hình, phép đo và hình ảnh

Luồng đích: ý định thao tác → kiểm tra → engine tính → commit event/snapshot → tạo dữ liệu được phép hiển thị → vẽ 2D/bảng số. Renderer không tự quyết định kết quả, trừ điểm, tạo phép đo hoặc phát sinh hóa chất.

| Thành phần | Dữ liệu bắt buộc | Quyền sở hữu |
| --- | --- | --- |
| Sample/Cup | ID, nguồn mẫu, thể tích, thành phần/đại lượng mô hình, revision, phase, validity | Domain của bài |
| Instrument | ID, mode, mẫu đang chứa/đang đo, cấu hình/hiệu chuẩn được mô hình hỗ trợ | Domain; không chỉ state hình ảnh |
| Action/Event | Action ID, loại, sample/cup/instrument ID khi cần, input và đơn vị, sequence, model release, simulated time | Application xác nhận, domain chuyển trạng thái |
| Measurement | ID, sample revision, vị trí/thời điểm lấy mẫu khi có ý nghĩa, instrument, value/unit, validity/stability, căn cứ | Domain tạo; người học quyết định sử dụng |
| Learner submission | Measurement IDs, công thức/giá trị người học nhập, đơn vị, lựa chọn cuối và giải thích | Application lưu tách khỏi sự thật mô hình |
| Visual projection | Thể tích, pha vận hành, trạng thái dụng cụ, hiện tượng quan sát được, phép đo đã lấy, thông báo vận hành | Application xuất bản; UI chỉ trình bày |
| Diagnostic | Event/measurement IDs liên quan, rule/claim ID, dữ kiện, giới hạn kết luận | Domain/report; AI chỉ diễn giải dữ liệu được cho phép |

Sự thật chưa đo và phương án tham chiếu không được gửi trong learner projection mặc định. Guest chạy engine local nên không chống được người cố xem đáp án qua devtools; đây là lab học tập, không cam kết chống gian lận cho thi cử. Cloud xác nhận lại kết quả bằng cùng release; không tin giá trị client gửi lên.

Jar Test: một attempt là một mẻ gồm tối đa sáu cup và một chương trình máy khuấy chung; cup có ledger/phép đo riêng, tổng attempt được cộng có kiểm soát. ID cup là định danh mẫu ổn định trong attempt, không phải vị trí trên màn hình. Muốn thử mẻ mới thì tạo attempt mới, giữ báo cáo lượt trước mở được để đối chiếu khi profile/release tương thích; không cần quan hệ branch/parent mới ở bản khởi đầu. Không tái sử dụng A–F cho mẫu mới bên trong cùng attempt. Không giả thiết mỗi cup là một attempt rời.

Hợp đồng trên là mục tiêu logic, chưa phải đổi schema/API. Các kiểu hiện tại giới hạn `ScenarioKey` vào ba bài cũ; payload action chưa biểu diễn sẵn mọi cấu trúc mới. Audit phải xác định thay đổi wire/schema, fixtures và khả năng đọc release cũ trước khi triển khai. Không đổi tên một release cũ thành bài mới.

## 8. Thời gian và lưu tiến trình

- Domain dùng simulated time hữu hạn, không dùng FPS, thời gian tải mạng hoặc đồng hồ máy người học để tính hiệu suất.
- Lựa chọn mặc định: người học bắt đầu một giai đoạn/chọn mốc thời gian; tiến thời gian được commit rõ ràng. Jar Test đầu dùng `run_phase` với duration preset, chưa cần action `advance_time` tổng quát. Hoạt ảnh biểu diễn khoảng thời gian đó, có thể tua nhanh/bỏ qua; không tự thêm thời gian hóa học khi chuyển tab hoặc reload.
- Bộ điều khiển có thể tuần tự gửi bước thời gian khi người học bật chạy; mỗi bước phải là action có ID, được xác nhận trước bước tiếp theo. Dừng ở mốc đã commit, không dựa vào thời điểm một khung hình vẽ xong.
- Trong animation, thao tác lấy mẫu dùng mốc đã commit; nếu chưa tới mốc mong muốn thì đưa yêu cầu tiến tới mốc đó trước. Không gửi phép đo từ trạng thái hình ảnh đang nội suy.
- Replay cùng release/event chain trả cùng kết quả; chuyển tốc độ animation, reduced motion, đóng/mở tab không thay đổi mẫu.
- Guest phải lưu/tiếp tục được cùng release; cloud giữ kiểm tra ownership/concurrency hiện có. Bỏ replay animation khi khôi phục không được làm rơi event.
- Không có undo hóa học âm thầm. Sửa thiết kế trước khi thực hiện, hoặc dùng hành động hiệu chỉnh hợp lệ/tạo mẫu mới sau khi đã thực hiện.

## 9. Khóa phạm vi khoa học từng bài

| Bài | Điểm xuất phát | Điều kiện trước triển khai mới |
| --- | --- | --- |
| pH | [Acid spec hiện có](../../experiments/acid-neutralization-spec.md), golden cases cho mẫu HCl tổng hợp | Giữ cân bằng đã kiểm chứng. Chọn bài nhập môn HCl/NaOH trước; route khác chỉ giữ khi đúng miền cũ. Không suy thành nước thải bất kỳ, không thêm kinetics/màu chỉ thị/sai số điện cực chưa có căn cứ. Đổi cách phản hồi/thao tác phải có release mới. |
| Jar Test | [Thiết kế chi tiết](../../experiments/jar-test-design.md) | Khóa mẫu, hóa chất, dataset và miền dose/pH/thời gian; xác minh dữ liệu, đơn vị, kết quả tham chiếu và sai số. Đây là rủi ro khoa học lớn nhất. |
| Hấp phụ | Bài thực hành đại học xác nhận chủ đề; chưa khóa bộ tham số | Một loại than/matrix/nhiệt độ; dữ liệu cân bằng và động học cùng điều kiện tương thích; calibration đo quang có căn cứ. Không dùng hệ số của than khác hoặc dye khác cho xanh methylene. |

Hấp phụ tối thiểu cần khóa: `C0`/`Ct` (mg/L), `V` (L), `m` than (g), thời điểm tiếp xúc, phạm vi đường chuẩn và hệ số pha loãng. `q_t = (C0 - Ct) V / m` chỉ dùng dạng này cho mẻ đủ điều kiện, chưa bị rút mẫu/thêm chất làm đổi cân bằng. Nếu rút mẫu, engine phải cập nhật tồn lượng và thể tích; phiên bản đầu ưu tiên bình lặp riêng theo thời điểm nếu dataset không hỗ trợ rút mẫu liên tục. Dung dịch để đo phải được tách than theo procedure được kiểm chứng.

Ở cả ba bài, người học nhập công thức/đáp số riêng. Dùng số đo cũ hoặc bỏ hệ số pha loãng làm sai kết luận, không làm đổi trạng thái vật lý của mẫu. Không dùng chung một mức giảm hiệu suất cho mọi lỗi.

## 10. Tham chiếu, giải thích và nghiệm thu

Tham chiếu là phương án/miền đạt mục tiêu cùng mẫu và điều kiện, không phải một đáp án đúng cho mọi mẫu. Với thử nghiệm rời rạc, gọi rõ tốt nhất trong các điều kiện đã kiểm tra; chưa được gọi tối ưu toàn cục. Hiển thị kết quả, lượng hóa chất và độ tin cậy/giới hạn song song, không ép thành một điểm tổng nếu rubric chưa thẩm định.

Chẩn đoán phải chỉ tới chuỗi sự kiện: lựa chọn → thay đổi mẫu/giá trị phép đo → kết luận. Chỉ nhận định nhân quả được rule/model/dữ liệu hỗ trợ. Không chia tổng sai lệch thành phần trăm do từng lỗi nếu chưa có phân tích phản thực hợp lệ. Độ chênh hiệu suất dùng điểm phần trăm; nồng độ/NTU có đơn vị; pH báo độ chênh pH, không lấy phần trăm pH để chấm.

Tiêu chí trước nghiệm thu:

1. Mỗi bài có lượt đạt mục tiêu, hợp lệ nhưng chưa tối ưu, và lỗi có giải thích dựa trên lịch sử; không chỉ danh sách thao tác đúng.
2. Ít nhất hai quyết định độc lập có ảnh hưởng kiểm chứng được trong mỗi bài; không tính lựa chọn chỉ đổi màu/trang trí.
3. Numerical fixtures có nguồn, đơn vị, tolerance; domain kiểm tra bảo toàn phù hợp, bounds và replay. Độ đục không bị coi là tồn lượng bảo toàn.
4. Cùng event chain cho cùng phép đo/kết quả khi đổi layout, bỏ animation, reload hoặc tua nhanh. Lỗi truyền/lặp action không nhân đôi liều hay thời gian.
5. Dùng chạm/bàn phím thay kéo thả thực hiện được cùng thao tác. Reduced motion vẫn đọc được pha và hiện tượng; không chỉ dùng màu để phân biệt trạng thái.
6. Kiểm tra dàn sáu cốc và hoạt ảnh trên desktop/mobile có tài nguyên trung bình trước khi chốt ngân sách hiệu năng. Không hứa FPS từ đọc source.
7. Thử ban đầu với 3–5 sinh viên đúng đối tượng (đề xuất của Tech Lead): họ tự hoàn thành, đọc báo cáo xác định ít nhất một nguyên nhân có căn cứ và cải thiện lượt tiếp theo. Đây là pilot phát hiện vấn đề thiết kế, không phải nghiên cứu chứng minh hiệu quả giáo dục.

## 11. Thứ tự công việc tiếp theo

1. Khóa hồ sơ khoa học Jar Test và các quyết định có hậu quả; kiểm tra sớm miền dữ liệu có đủ chiều sâu.
2. Audit source theo luồng chuẩn: action → engine → phép đo → projection → save/report; lập bản đồ giữ/thay/di chuyển và kế hoạch tương thích release cũ.
3. Dựa trên hai bước trên, viết kế hoạch refactor thành các phần có đầu vào/đầu ra và nghiệm thu rõ để giao ChatGPT web; local kiểm tra source, khoa học và integration; người dùng thử UI đầu cuối.
4. Triển khai một lượt Jar Test hoàn chỉnh có 2D, lưu tiến trình và báo cáo. Chưa mở rộng đồ họa cả ba bài khi chưa kiểm chứng được vòng học này.
5. Áp dụng nền đã kiểm chứng sang pH và hấp phụ; chỉ sau đó mở rộng tutor.

Tài liệu này hoàn thành bước định hình sản phẩm và ranh giới 2D. Chưa phải kế hoạch triển khai theo file, hợp đồng API cuối cùng, model đã hiệu chỉnh hoặc tính năng đã chạy.

## 12. Căn cứ

- [Rà soát lựa chọn ba bài](../../research/scenario-selection-review.md): nguồn khoa học/giáo dục và giới hạn.
- [Baseline sau dọn](../../refactor-baseline.md): trạng thái code và kiểm thử trước refactor.
- [Architecture hiện có](../../system-architecture.md) và [data model hiện có](../../data-and-state-model.md): ranh giới/versioning cần đối chiếu khi audit.
