# Jar Test — thiết kế học tập, tương tác 2D và hồ sơ mô hình

Ngày: 13/10/2026. Trạng thái: thiết kế mục tiêu; numerical release chưa được khóa. Đọc cùng [thiết kế v1](../superpowers/specs/2026-10-13-simulation-v1-design.md).

**Phạm vi khởi đầu sau audit:** theo yêu cầu giữ giải pháp vừa đủ, dùng pH ban đầu và liều làm hai biến; khuấy/lắng theo chương trình cố định. Đã tái hiện số học của một mô hình cuối pha; chưa có prototype/engine sản phẩm. Chi tiết và quyết định nội dung ở [audit](../research/simulation-refactor-audit.md) và [plan thực hiện](../superpowers/plans/2026-10-13-jar-test-first-slice.md). Các khả năng thay đổi thời gian/lấy mẫu giữa pha bên dưới là hướng mở rộng có điều kiện, không phải tính năng phải làm ngay.

## 1. Nhiệm vụ học tập

Bối cảnh: một mẫu nước đục tổng hợp cần được khảo sát bằng keo tụ – tạo bông – lắng. Người học tìm một phương án giảm độ đục đạt mục tiêu đề bài với lượng hóa chất hợp lý, rồi giải thích dựa trên phép đo. Không suy mẫu đạt tiêu chuẩn uống/xả, không suy COD hay vi sinh từ NTU.

Sau lượt, người học phải phân biệt được:

- Giảm độ đục và lượng hóa chất đã dùng là hai tiêu chí khác nhau.
- So sánh liều cần các cốc có điều kiện nền và chương trình vận hành phù hợp.
- Thời điểm/vị trí lấy mẫu ảnh hưởng việc có thể dùng phép đo để kết luận.
- Một kết quả chưa tốt có thể do chọn điều kiện, phép đo hoặc phép tính; không mặc định do một bước duy nhất.

## 2. Dàn dụng cụ và vòng trải nghiệm

Lựa chọn thiết kế của Tech Lead cho release đầu: mỗi attempt là một mẻ với tối đa sáu cốc có ID A–F, cùng nền mẫu (pH ban đầu là profile chuẩn bị sẵn) và một máy/chương trình khuấy chung. Cup ID gắn với mẫu trong attempt đó, không phải dụng cụ được tái sử dụng qua nhiều mẻ. Muốn thử thêm một mẻ thì tạo attempt mới; mở báo cáo lượt trước để so sánh khi profile/release tương thích. Không có nhiều mẻ hoặc nhiều chương trình máy trong một attempt ở release đầu. Không cho tốc độ từng cốc khác nhau trên một trục máy chung. Đối chứng liều 0 hữu ích khi dataset hỗ trợ; mô hình ứng viên bản đầu chưa bao phủ liều 0, dùng phép đo mẫu đầu làm baseline, không tự ngoại suy kết quả cốc đối chứng sau lắng.

| Chặng | Thao tác của người học | Hiện tượng/phản hồi 2D | Dữ liệu lưu |
| --- | --- | --- | --- |
| Nhận mẫu | Xem hồ sơ mẫu, lấy phép đo ban đầu bằng dụng cụ | Bình nguồn, cốc/máy đo, chỉ số sau khi đo | Profile, measurement IDs, thể tích chuẩn bị |
| Thiết kế | Chọn các cốc/điều kiện sẽ so sánh, ghi dự đoán | Nhãn cốc, bảng thiết kế đang chỉnh | Thiết kế trước vận hành, ghi chú |
| Chuẩn bị | Cấp thể tích mẫu được profile hỗ trợ, chọn/cấp liều | Thể tích, pipet và lượng dung dịch cấp | Cup IDs, liều thực, reagent ledger, revision |
| Khuấy nhanh | Vận hành giai đoạn được profile hỗ trợ | Cánh khuấy và hạt chuyển động minh họa | Chương trình chung, pha và thời gian mô phỏng |
| Khuấy chậm | Chuyển giai đoạn, quan sát | Bông minh họa; không tự gán kích thước thực | Phase, observations có mức bằng chứng |
| Lắng | Dừng khuấy, chọn mốc lắng/lấy mẫu được hỗ trợ | Hạt/bông di chuyển xuống; vùng nước phía trên | Simulated time, lịch sử lấy mẫu |
| Đo | Lấy mẫu bằng vị trí/protocol được hỗ trợ, vận hành máy đo | Mẫu đo mới có ID; máy đo hiện số sau phép đo | Provenance, validity, NTU và thời điểm |
| Kết luận | Tính giảm đục, chọn phương án, giải thích | Sổ đo và so sánh cốc | Đáp số/lựa chọn người học |
| Đối chiếu | Đọc báo cáo, quyết định thay gì ở lượt sau | Timeline và minh họa các mốc liên quan | Chẩn đoán có evidence IDs |

Các chặng mô tả quá trình thật; không biến thành wizard chỉ cho một đáp án. Người học có thể đo, ghi chú, quan sát lại, nộp thiếu hoặc tạo lượt mới để thử mẻ khác. Các bước chỉ minh họa không được giả vờ có tác động định lượng.

## 3. Miền mô hình phải khóa

Một release cần manifest bất biến gồm:

- Mẫu: nền nước, cách chuẩn bị, NTU ban đầu/miền cho phép, điều kiện pH, nhiệt độ và thể tích.
- Hóa chất: danh tính, dạng/hàm lượng quy đổi, nồng độ dung dịch cấp, đơn vị liều và thể tích dùng làm cơ sở tính liều.
- Máy: hình học/cánh khuấy, các chế độ rpm/thời gian được dữ liệu hỗ trợ, chương trình chung các cốc.
- Measurement: vị trí rút mẫu, thời điểm, thể tích aliquot, cách đo/range và điều kiện calibration/validity được kiểm chứng.
- Dataset/model: nguồn, dữ liệu gốc hoặc điểm số hóa, miền nội suy, các hằng số, sai số, thuật toán, reference cases và version.
- Visual: đại lượng nào có mô hình định lượng, đại lượng nào chỉ là biểu diễn định tính; không dùng số hạt SVG làm đơn vị đo.

Không ghép response surface của mẫu/alum A với tốc độ lắng của mẫu/polymer B thành một engine rồi gọi là được kiểm chứng. Không dùng engine HCl/NaOH nền hiện có để tính pH của mẫu Jar Test có khả năng đệm/hóa chất khác mà chưa xây cân bằng tương ứng.

Nếu dataset chỉ cung cấp initial pH: dùng profile mẫu đã chuẩn bị tại pH đó. Không cho lượng acid/base tùy ý và tự suy pH. Nếu dataset chỉ hỗ trợ các liều rời rạc: cấp các liều đó qua dụng cụ với lượng được tính từ stock đã khóa; chưa mở slider liều liên tục cho tới khi xác minh nội suy. Đây là giới hạn model, phải công bố trước lượt.

## 4. Kiểm tra nguồn và hướng định lượng

### Nguồn giáo dục

[Qatar University — Environmental Engineering Lab Manual, thí nghiệm 6](https://www.qu.edu.qa/static_file/qu/colleges/engineering/civil/documents/Lab%20Manuals/Environmental_Engineering_Lab._Manual.pdf): hỗ trợ lựa chọn bài thực hành và thao tác máy khuấy/đo đục; không cung cấp bộ hệ số phổ quát cho VECLab.

### Ứng viên dữ liệu theo thời gian

[Farasat, Panahi & Mokhtarani (2017), Timecourse Study of Coagulation-Flocculation Process Using Aluminium Sulfate](https://watconman.org/archives-pdf/2wcm2017/2wcm2017-07-09.pdf) khảo sát mẫu kaolin với alum, có đồ thị độ đục theo thời gian ở các điều kiện pH/liều. Các tốc độ/thời gian khuấy là điều kiện cố định của thử nghiệm, không phải biến đã được khảo sát độc lập.

Ngày 13/10/2026 đã đọc được phần text của PDF từ công cụ tra cứu; chưa trích xuất/đối chiếu các điểm đồ thị và bảng tốc độ khuấy bằng ảnh (lượt lấy ảnh PDF trả 403). Chưa chấp nhận hệ số, đường nội suy hoặc con số đầu ra của nguồn này làm golden fixture. Cần kiểm tra độ phân giải hình, đơn vị liều, mốc thời gian, lặp/sai số và khả năng tái lập trước khi chọn.

Cập nhật cùng ngày: tải được PDF gốc qua host `www`, đã render và đọc hình trang 2. Các đường cuối quá gần trục để lấy số chính xác, mốc tổng thời gian cần kiểm tra trước số hóa; không chọn nguồn này cho bản khởi đầu. Lưu hash và kết luận ở audit; không cần tiếp tục số hóa để triển khai mô hình cuối pha đã chọn.

Nguồn này mở hướng cho quyết định lấy mẫu sớm/muộn có dữ liệu. Không mặc định mọi tổ hợp pH × liều × thời gian đều được nội suy, không suy số liệu ở vùng lấy mẫu khác.

### Ứng viên response surface

[Nghiên cứu RSM năm 2024](https://www.gigvvy.com/journals/ijase/articles/ijase-202403-21-1-010) được lưu trong [rà soát trước](../research/scenario-selection-review.md). Truy cập lại trang ngày 13/10/2026 trả 403; không lấy đoạn tóm tắt làm mô hình đã thẩm định. Nếu chọn nguồn này phải lấy và kiểm tra đầy đủ phương trình, điều kiện thử và dữ liệu xác minh.

Cập nhật cùng ngày: đọc được toàn văn do tác giả đăng, đối chiếu công thức với bảng số và chạy [kiểm tra số học tái lập](../../tools/research/check-jar-candidate.mjs). Chọn làm ứng viên mô hình dạy học cuối pha có giới hạn; việc tính lại trên dữ liệu xây mô hình không phải validation ngoài mẫu. Chưa đăng ký release sản phẩm.

Đánh giá hiện tại: đủ cơ sở phát triển hướng mô phỏng có giới hạn, chưa đủ để cam kết bộ số liệu định lượng cuối cùng. Việc chọn/hiệu chỉnh dataset là phần việc bắt buộc trước engine; không đẩy quyết định khoa học này cho người viết UI tự đoán.

## 5. Hệ quả của thao tác và mức hỗ trợ

| Quyết định/thao tác | Hệ quả cần thể hiện | Điều kiện cho phép chấm định lượng |
| --- | --- | --- |
| Liều khác nhau | Cốc có đáp ứng khác nhau; tài nguyên tăng theo lượng thực | Dữ liệu cùng mẫu, pH và chương trình; bảo toàn lượng hóa chất cấp |
| Chọn profile pH khác | Đáp ứng có thể khác | So sánh trong dataset tương thích; không giả định pH cuối bằng pH đầu |
| Lấy mẫu tại mốc lắng khác | Độ đục đo khác khi dữ liệu chứng minh | Mô hình/điểm theo thời gian cho điều kiện đó |
| Dùng nhiều hóa chất nhưng không cải thiện đủ | Báo trade-off qua số đo và lượng dùng | Không mặc định càng nhiều luôn càng tốt hoặc luôn kém |
| Lấy sai vùng/rối bùn | Phép đo không đại diện quy trình chuẩn, hoặc kết quả thay đổi | Chỉ xuất NTU mới nếu có mô hình; nếu không, lưu không đánh giá được, không thêm penalty NTU giả |
| Bỏ/đảo khuấy, đổi rpm/thời gian không có dữ liệu | Nhánh ngoài miền hoặc không đánh giá được | Chưa có mô hình nên không tính ra một hiệu suất giả |
| Bỏ hệ số/nhập sai phép tính | Đáp số người học khác từ cùng phép đo | Không thay NTU thật để phạt; báo lỗi tính ở cuối |
| Dùng số đo của cốc/mốc khác | Kết luận không được phép đo đó hỗ trợ | Lưu measurement IDs; báo provenance sai ở cuối |

Kết quả ngoài miền không được gắn 0% xử lý. Nếu chỉ một cốc không đánh giá được, các cốc hợp lệ còn lại vẫn có kết quả. Không có tooltip tự báo liều tối ưu trong lượt.

## 6. Trạng thái và vòng đời

Một attempt gồm hồ sơ mẫu bất biến, thiết kế cốc, một máy/chương trình chung, tập cup states, tập sample đo, submissions và ledger tổng. Các cup độc lập về lượng hóa chất/measurement; cùng tiến pha khi được đặt trên máy đang chạy. Không cho di chuyển cốc giữa các vị trí máy trong giai đoạn đang vận hành ở release đầu.

Cup lifecycle mục tiêu: `empty → prepared → dosed → rapid_mixing → slow_mixing → settling → sampled`. `stopped` và `not_evaluable` là trạng thái kết thúc nhánh; cup có thể sampled nhiều lần chỉ khi profile cho phép. Một cup đối chứng vẫn đi qua chương trình mà liều bằng 0. Attempt chỉ `completed` khi người học nộp; nộp được dù thiếu measurement, với trường kết quả không đánh giá được rõ ràng.

Rút mẫu tạo sample ID mới và cập nhật cup khi thể tích rút có ý nghĩa. Không copy mẫu vô hạn. Dataset có phép đo rút lặp phải khóa procedure/aliquot; nếu không biết volume rút, ưu tiên mẫu lặp ở từng mốc hoặc measurement abstraction được ghi rõ trong release. Không giả định rút lượng lớn là không ảnh hưởng.

Sổ đo giữ cả các mốc cũ với cup revision/time, không xóa khi mẫu thay đổi. Việc một measurement cũ được dùng để kết luận hiện tại là lỗi suy luận, không phải measurement tự thay giá trị theo state mới. Khi khôi phục lượt, không tự chạy tiếp đồng hồ hóa học.

## 7. Công thức báo cáo và tham chiếu

- Giảm đục: `(T0 - Tt) / T0 × 100%`, khi `T0 > 0` và hai phép đo có phạm vi/provenance phù hợp. Nếu `Tt > T0`, cho giá trị âm có giải thích; không kẹp về 0 chỉ để bảng đẹp.
- Liều từ stock: `D = Cstock × Vstock / Vbasis`, các đơn vị phải được quy đổi nhất quán. `Vbasis` là thể tích cơ sở ghi trong profile, không mặc định là thể tích cuối.
- So sánh: NTU còn lại, phần trăm giảm đục, thời gian, hóa chất và validity. Chênh hai hiệu suất dùng điểm phần trăm. Mẫu pH khác chỉ so sánh như một yếu tố có chủ đích, không âm thầm coi điều kiện hoàn toàn giống nhau.
- Mốc tham chiếu: các phương án có dữ liệu cùng profile. Chỉ gọi tốt nhất trong tập điều kiện đã kiểm tra; đề bài có thể có nhiều phương án đạt. Không dùng một cốc chứa đáp án đúng bí mật để tự sinh dữ liệu cả dàn.

Phân tích cuối lượt chia rõ: kết quả xử lý → chất lượng thiết kế/measurement → đáp số người học → trade-off. Không báo mọi phần trăm sai lệch đều đến từ kỹ thuật làm thí nghiệm. Nếu bằng chứng chỉ cho thấy tương quan, dùng cách diễn đạt tương ứng.

## 8. Kiểm chứng trước khi giao engine/UI

| Gate | Bằng chứng phải có | Tình trạng 13/10/2026 |
| --- | --- | --- |
| J1 — Khoa học | Profile khóa, dữ liệu truy được tới nguồn, đơn vị/basis xác minh, miền input/output, sai số/tolerance | Số học ứng viên đã đối chiếu; Task 1 khóa profile dạy học/giới hạn, chưa validation ngoài mẫu |
| J2 — Chiều sâu | Bản đầu: liều và pH ban đầu có đáp ứng; một lượt đạt, một lượt hợp lệ kém, một lỗi đo/tính có lịch sử giải thích. Thời gian chỉ thành biến khi có dữ liệu | Đã kiểm tra đáp ứng số học; chưa có lượt sản phẩm hoặc pilot |
| J3 — Tính toán | Fixtures độc lập với implementation, bounds, không ngoại suy; kiểm tra các mốc và bất biến hóa chất/thể tích | Chưa có engine/fixtures |
| J4 — Tương tác | Chuỗi thao tác 2D thực hiện được bằng chuột/chạm/bàn phím, hiện tượng khớp state, không lộ đáp án, reduced motion | Chưa có prototype Jar Test |
| J5 — Đầu cuối | Lưu/khôi phục, replay, báo cáo/submission, lỗi concurrency/idempotency, đọc lượt cũ | Cần audit và kế hoạch tích hợp |
| J6 — Người học | Pilot đúng đối tượng; quan sát hiểu phép đo và cải thiện lượt sau, ghi lại các điểm vướng | Chưa thực hiện |

Nếu dữ liệu cuối cùng không đủ cho J2, phải tìm thêm dữ liệu cùng hệ/thu hẹp miền có chủ đích và đánh giá lại độ sâu. Không thay bằng slider trang trí hoặc ngầm giảm yêu cầu tương tác đã chốt. Chưa có cơ sở để thay Jar Test bằng bài khác chỉ do một nguồn bị lỗi truy cập.
