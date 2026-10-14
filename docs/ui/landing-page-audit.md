# Landing page — audit và gói sửa UI-02

Ngày 14/10/2026. Owner: TL2 / coder 2. Người dùng yêu cầu giữ cấu trúc landing hiện tại, sửa lời văn, cập nhật ba bài, giảm giải thích thừa và cải thiện thiết kế/chuyển động. Đây là quyền triển khai landing; các ảnh gen chưa phải thiết kế được duyệt.

## Nền và bằng chứng

- Source quan sát: `7444e2df16e3182f6547a7dbb72083878b84e887`, URL `http://127.0.0.1:3000/`. Toàn bộ app/landing/copy/e2e liên quan giống nền Task 1 `c337bd91a92fce0721cf1dd6076286018fc888e3` (Git diff rỗng trong các đường dẫn đó).
- Browser: đọc toàn bộ AX/DOM; xem hero, ba thẻ, workbench, evidence, disclosure và footer; desktop 1279×1244 light/dark, mobile 390×844 và tablet 768×1024. Đã bấm demo thêm dung dịch, anchor và menu mobile/Escape. Đây là viewport mô phỏng, chưa phải thử trên thiết bị thật.
- Mobile: hero cao 1452,69 px; toàn trang cao 7168 px; không thấy tràn ngang ở 390 px. Bấm demo tăng 25 → 26 mL, pH vẫn 4,8. Heading desktop dùng weight 850; font local khai báo 200–800. Nội dung evidence 12 px, footer 11,76 px.
- Tự review trong một context theo yêu cầu không subagent. Impeccable detector trên `src/features/landing`: exit 0, `[]`; Taste lint: 5 findings (3 eyebrow lặp, 2 shadow trong SVG). Detector sạch không chứng minh thiết kế tốt; shadow của dụng cụ không mặc nhiên là lỗi.
- Không inject overlay vì browser evaluate chỉ đọc. Chưa kiểm 200% zoom, reduced-motion runtime, Safari, contrast toàn trang, performance hay hành trình simulation; không tuyên bố những phần này pass. Chụp full-page bằng browser không hỗ trợ trong lần thử; đã xem từng chương bằng viewport.

## Vấn đề và cách sửa

| Ưu tiên | Bằng chứng | Sửa trong UI-02 |
| --- | --- | --- |
| P1 — Sai danh sách bài | `experiment-showcase.tsx:27` và `app.vi.ts:66` vẫn là acid/Cu/nhựa; metadata trùng ở hai nơi. Nhựa ghi sắp ra mắt nhưng dẫn vào route mô phỏng. | Landing có đúng pH, Jar Test, hấp phụ xanh methylene. Dùng một nguồn metadata landing; không sửa registry/release cũ để đổi tên engine. |
| P1 — Demo diễn đạt như phép đo | `workbench-preview.tsx:52,179,333`: chỉ tăng thể tích, pH cố định; nút là “Thêm và đo”, lời dẫn “đo thật”, trạng thái “pH tăng dần”. | Đặt tên thao tác đúng việc diễn ra. Nhãn minh họa luôn nhìn thấy; pH chưa đo là “Chưa đo”, bỏ đồ thị/kết luận giả. Không gắn engine vào landing để chữa demo. |
| P1 — Cơ sở khoa học bị quảng bá quá mức | `evidence-section.tsx:70,107`, `book-stack-visual.tsx:36`: Ksp của bài Cu cũ và “19 nguồn kiểm chứng”; disclosure thực có 15 nguồn của release acid. | Bỏ Ksp và số nguồn cố định, bỏ ngụ ý IUPAC/EPA thẩm định sản phẩm. Nói rõ mô hình, điều kiện và tài liệu; link vào evidence thật. |
| P2 — Lời văn chung chung, lặp | `app.vi.ts:34–54,89–120`: nhiều câu “khám phá”, “có căn cứ”, “nền tảng vững chắc”; hidden learningValues còn nói điểm luôn hiển thị. | Dùng copy deck bên dưới. Bỏ badge lợi ích, eyebrow/intro chỉ nhắc lại tiêu đề và hidden marketing text lỗi thời. Nội dung trợ năng phải khớp nội dung nhìn thấy. |
| P2 — Trang giới thiệu bị áp chi tiết acid | Homepage dùng `ScientificDisclosure` acid; root footer lặp pH*, hệ carbon kín và điều kiện acid cho toàn dự án. | Homepage dùng một lưu ý chung ngắn + đường dẫn nguồn. Footer gọn và trung lập theo bài. Giữ nguyên component scientific-disclosure và các nơi đang dùng trong simulation/detail/report. |
| P2 — Typography và phân cấp nặng | `globals.css:1556` và các heading dùng 850; section đều 44 px; copy nhỏ trong nhiều khung bo tròn lồng nhau. | Giữ Manrope đã có; heading 600–750, body 16–18 px, section 28–36 px theo viewport. Ít lớp khung hơn, CTA chính rõ và link phụ nhẹ, nhịp khoảng cách nhất quán. Không thêm font/dependency. |
| P2 — Mobile quá dài trước khi chọn bài | Hero 1453 px và preview desktop bị xếp dọc nhiều panel. Workbench đưa timeline lên trước vùng tương tác. | Hero mobile khoảng ≤1100 px ở 390×844; CTA xuất hiện trong màn đầu. Preview compact, ưu tiên dụng cụ và thao tác; workbench ưu tiên bench/inspector, sổ đo dưới, tránh xếp lại nguyên dashboard. Không ép chiều cao/cắt chữ để đạt số. |
| P2 — Chuyển động cạnh tranh nội dung | `globals.css:1744–2196`: nhiều entrance/curve/callout nối nhau đến khoảng 1,36 s; cards có active outline kể cả card sắp ra mắt; reveal có fallback 2,5 s. | Một entrance ngắn cho khối, hover/focus 120–180 ms. Giảm shadow/glow/grid trang trí; active không được gợi bài đã sẵn sàng. Không autoplay/animation hóa học; reduced motion và nội dung tĩnh vẫn đầy đủ. |

## Nội dung triển khai

Dùng tiếng Việt trực tiếp, có đối tượng/hành động cụ thể. Các câu dưới là copy mục tiêu, được chỉnh ngắt dòng cho đẹp nhưng không đổi nghĩa hoặc thêm claim.

- Hero: **“Thực hành / xử lý nước.”** Lede: “Chọn điều kiện, thao tác trên dụng cụ và dùng số đo để giải thích kết quả.” CTA chính **“Chọn bài thực hành”** → `#showcase`; phụ **“Xem bàn mô phỏng”** → `#workbench-preview`. Một ghi chú ngắn: “Mô phỏng phục vụ học tập; không dùng kết quả để xử lý mẫu nước thật.” Bỏ trust strip và eyebrow sáo rỗng.
- Ba thẻ: tiêu đề chương **“Ba bài thực hành”**; một dòng trạng thái cần thiết: “Hiện có bản thực hành pH; Jar Test và hấp phụ đang phát triển.”
  - **Điều chỉnh pH** — “Khảo sát lượng NaOH cần thêm cho mẫu HCl tổng hợp.” Nhãn **“Bản hiện có”**; CTA **“Thử bài pH”** → `/simulate/acid-neutralization`. Không tuyên bố đã phát hành bản refactor pH mới.
  - **Jar Test** — “So sánh độ đục theo pH và liều alum sau khuấy, lắng.” Nhãn **“Đang phát triển”**; chưa có Start/route Jar. Hình minh họa hai cốc/hai cánh khuấy, không bịa số đo.
  - **Hấp phụ xanh methylene** — “Khảo sát khả năng loại màu bằng than hoạt tính theo mẻ.” Nhãn **“Đang phát triển”**; chưa có Start/route mới. Hình cốc tiếp xúc và than, không phải cột lọc.
  - Hai thẻ chưa mở có thể có native details **“Nội dung bài”** với mục tiêu ngắn nếu cần; không dẫn người dùng về catalog cũ như thể đó là preview mới.
- Chương trải nghiệm: **“Làm việc trên bàn mô phỏng”**. “Chọn dụng cụ, thực hiện thao tác và ghi lại số đo.” Demo pH hiện có ghi **“Minh họa thao tác”**; nút **“Xem thao tác thêm 1 mL”**; reset **“Đặt lại minh họa”**. Thể tích có thể thay đổi cục bộ nhưng không tạo pH/độ đục/hiệu suất hay lượt học. Phản hồi ngắn: “Đã minh họa thêm 1 mL. Mở bài pH để thực hành.” Link **“Mở bài pH”** dẫn route hiện hữu. Không lưu attempt, gọi API hoặc hứa đây là Jar workbench đã hoàn thành.
- Evidence: **“Mô hình, điều kiện và tài liệu”**. Ba mục **“Phạm vi áp dụng”**, **“Cách tính”**, **“Tài liệu tham khảo”**, mỗi mục tối đa một câu có thông tin; một link rõ **“Xem cơ sở mô phỏng”** → `/evidence`. Bỏ Ksp/Cu, assurance pill và ảnh sách nếu chỉ làm cảnh.
- Closing: **“Chọn bài để bắt đầu.”**, CTA **“Chọn bài thực hành”** → `#showcase`; không cần thêm đoạn kêu gọi chung chung.
- Homepage không lặp lại toàn bộ giới hạn acid. Một ghi chú chung gần CTA và link nguồn là đủ; khoa học chi tiết vẫn nằm ở evidence/chi tiết bài/bàn mô phỏng/báo cáo.
- Footer: bỏ “Khoa học hôm nay. Tương lai ngày mai.”; một đoạn “VECLab phục vụ học tập. Kết quả phụ thuộc mô hình và điều kiện của từng bài; không thay thế phép đo hoặc quy trình xử lý nước thực tế.” Kèm link **“Nguồn và giới hạn”** → `/evidence`. Giữ nav và bản quyền. Không sửa policy, release, nội dung nguồn khoa học hoặc hạn chế hiển thị trong bài.

## Thiết kế, ownership và dừng scope

- Giữ thứ tự navbar → hero hai vùng → ba thẻ → workbench preview → evidence → CTA → footer. Giữ nhận diện teal/navy, light/dark và asset/tooling hiện có; không áp nguyên ảnh gen, đổi brand hoặc dựng landing mới.
- Coder 2 độc quyền các file được task JSON liệt kê. `app.vi.ts`: chỉ `home`; `layout.tsx`: chỉ metadata mô tả và footer; `globals.css`: chỉ landing/footer selectors hoặc overrides dưới wrapper landing. Không đổi root tokens/body/nav/theme hoặc CSS của màn khác; không append hàng loạt rule trùng để vá cascade.
- Nội dung ba thẻ có nguồn chung trong `APP_STRINGS.home`; ID landing không tự là ScenarioKey được engine hỗ trợ. Hai bài mới chỉ giới thiệu. Catalog `/experiments` chưa thuộc gói này, không âm thầm thay registry/route để khớp landing.
- Có thể thay presentation trong `landing-visuals.tsx`; không cần sửa các SVG bài Cu/nhựa cũ nếu chúng không còn được import. Không thêm framework đồ họa, icon/font package, PRODUCT/DESIGN song song, hooks hoặc pipeline mới.
- Không hứa AI tutor, mô hình nhà máy đầy đủ, nước đạt chuẩn, validation thực nghiệm hoặc tự suy liều cho mẫu thật. Feedback cuối lượt là yêu cầu refactor, không tự nhận toàn bộ đã có ở bản pH legacy.
- Dừng sau implementation + JSON handback. Local TL2 fetch/review/test ở nhánh riêng rồi chạy local cho người dùng; không merge/deploy hoặc tự mở gói catalog/workbench Jar.

## Nghiệm thu

- Tests quan sát đúng ba tiêu đề, trạng thái thật, đích CTA/anchor, không link Start bài chưa có; nội dung nhìn thấy và accessible name khớp. Metadata không còn hai bản dễ lệch.
- Demo label đúng trước/sau thao tác/reset, không giả số đo/kết luận, không API/attempt write. Cập nhật những test cũ cố định literal/animation đã bị thay thế; giữ kiểm tra navigation, bàn phím, layout và reset có giá trị.
- Typecheck, lint, focused unit và landing E2E hiện có trên chromium/mobile; build trước local acceptance. Không cần DB/engine suites không bị chạm.
- Local browser review 390/768/1440 px, light/dark, 200% zoom, reduced motion, keyboard/skip-link/menu; không tràn ngang, không che/cắt nội dung, focus rõ và tap targets đủ rộng. Chụp hero + ba thẻ + preview + footer để người dùng xem; điều chỉnh một batch sau review, không polish vô hạn.
- Web không có terminal/browser thì ghi checks `not_run` một lần trong limits; không suy pass từ commit hoặc ảnh. Source/permissions còn phải xác nhận ở phiên web.
