# Tra hướng dẫn theo thao tác — Implementation Plan

> Ghi chú lúc lập kế hoạch (trước khi người dùng duyệt triển khai): dùng superpowers:executing-plans, thực hiện trực tiếp từng phần và tự review. Không dùng subagent. Vòng hiện tại chỉ phân tích và viết kế hoạch.

**Goal:** Người học mở được cách dùng của đúng thao tác ngay trên bàn thực hành, đọc thêm đúng mục trong guide và tiếp tục với dữ liệu đang nhập.

**Architecture:** Thêm một thành phần trợ giúp thu gọn dùng chung, một file nội dung tiếng Việt cho hai bài, và liên kết đến các mục có ID ổn định trong guide hiện có. Nội dung phụ thuộc vị trí thao tác do người học mở; không xây bộ suy luận bước tiếp theo hoặc đọc thêm sự thật hóa học chưa được phép thấy.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, TypeScript, CSS Modules và Playwright hiện có. Không thêm dependency.

**Spec:** Phạm vi người dùng đồng ý trong chat ngày 16/10/2026: tra hướng dẫn đúng thao tác; vòng này chưa code. Giữ các yêu cầu học tập của [thiết kế mô phỏng v1](../specs/2026-10-13-simulation-v1-design.md), và hành vi đang có của hai bài trên develop.

**Baseline khảo sát:** develop tại cb43af20a9dcdd91f522477e70b5813378f459f5. Đây là nền đã kiểm tra; vòng code sau kiểm tra lại HEAD và chỉ điều chỉnh các điểm bị thay đổi. Không dùng nhận xét về checkout chore/pre-refactor-cleanup cũ.

## 1. Những gì đã có và khoảng trống thực tế

- Hai bài có tour giới thiệu vùng giao diện, bảng giải thích dụng cụ, guide đầy đủ và liên kết mang attempt ID. Giữ các phần này; trợ giúp mới phục vụ lúc đang thao tác.
- Jar Test có năm nhóm điều khiển; chiết tách có bốn nhóm, trong đó chuyển dịch/thu rắn và đo/khai báo là các việc khác nhau trong cùng nhóm.
- Guide Jar Test đã có tám bước và chín phần nội dung. Chưa có liên kết nhảy đến từng bước. Guide chiết đã có ID cho quy trình và nguồn, nhưng chưa có ID cho từng bước.
- Bảng dụng cụ Jar Test vẫn hướng dẫn đo mẫu đầu trong Sổ đo; guide và điều khiển thực tế đặt thao tác ở Thao tác → Đo mẫu ban đầu. Sửa đúng hai chỉ dẫn cũ này khi nối trợ giúp.
- Liên kết guide hiện mở cùng tab. Bản nháp đáp số được giữ trong state React, nên rời workbench có nguy cơ mất bản nháp dù lượt đã lưu vẫn còn. Đây là kết luận từ source; vòng này chưa chạy thử nghiệm làm mất bản nháp.
- Báo cáo, phép tính, sổ đo và so sánh đã có. Chúng không thuộc phạm vi nâng cấp này.

## 2. Phương án trải nghiệm đề xuất

1. Ở nhóm hoặc phần thao tác đang mở, có một nút chữ rõ nghĩa như “Cách cấp phèn”, “Cách chuyển dịch”. Mặc định nội dung được thu gọn.
2. Bấm nút hiện 2–3 ý ngắn ngay trong nhóm: cần chọn gì, thực hiện thế nào, kết quả được ghi ở đâu hoặc điểm dễ nhầm. Không mở thêm hộp thoại.
3. Cuối nội dung có liên kết “Đọc hướng dẫn đầy đủ — mở tab mới”, đến đúng mục của guide và mang attempt ID khi có. Tab thực hành giữ nguyên, không bị unmount để mở tài liệu.
4. Guide có mục lục nhỏ theo các bước đã có, dùng liên kết HTML tới heading. Không có tìm kiếm, sticky sidebar, bộ lọc hoặc tiến trình học riêng.
5. Giữ tour cho lần làm quen và bảng dụng cụ cho việc nhận biết dụng cụ. Trợ giúp mới không thay thế hai phần đó và không tự bật khi chọn một phương án kém.

Một nhóm có nhiều nghiệp vụ khác nhau được đặt trợ giúp tại từng phần đang có: chiết tách có “Chuyển dịch” / “Thu chất rắn” và “Đo” / “Khai báo”. Không gắn một dấu hỏi cho từng input hoặc mỗi nút.

Liên kết ra guide từ kệ dụng cụ và liên kết nguồn đang rời workbench cũng mở tab mới, có tên/nhãn báo trước. Không sửa các liên kết điều hướng thông thường khác. Không dùng window.close hoặc cố tìm/điều khiển tab cũ; người học quay về tab thực hành bằng trình duyệt. Nút mở lại attempt hiện có trên guide vẫn giữ nguyên.

## 3. Bản đồ nội dung nhỏ cho vòng đầu

| Bài / vị trí | Nút trợ giúp | Ý chính cần giải thích | Mục đích của link chi tiết |
| --- | --- | --- | --- |
| Jar / baseline | Cách đo mẫu ban đầu | Đo trong bảng Thao tác; một số đo dùng chung cho mẻ; kết quả ở Sổ thực hành | jar-step-baseline |
| Jar / prepare | Cách chuẩn bị cốc | Chọn cốc và pH đầu; chuẩn bị riêng từng cốc; đây không phải điều chỉnh pH cuối | jar-step-prepare |
| Jar / dose | Cách cấp phèn | Cốc đích; liều tăng được cộng dồn; kiểm tra tổng trước khi chạy | jar-step-dose |
| Jar / program | Cách chạy cả mẻ | Hoàn tất thiết kế các cốc; ba pha chạy chung; pH/liều khóa sau bắt đầu | jar-step-program |
| Jar / results | Cách đo và ghi kết quả | Đo cuối từng cốc; tính và bấm ghi; chọn cốc khác với nộp bài | jar-step-measure |
| Chiết / prepare | Cách cấp dung dịch | Kiểm tra bình, loại dung dịch và thể tích; lượng cấp được cộng vào bình | extraction-step-add |
| Chiết / program | Cách trộn và phân lớp | Chọn bình; phân biệt trộn, xả áp và phân lớp; không gộp ba việc thành một | extraction-step-mix |
| Chiết / transfer, phần chuyển dịch | Cách chuyển dịch | Bình đang chọn và bình nhận; pha hoặc toàn mẫu; thể tích khả dụng | extraction-step-transfer |
| Chiết / transfer, phần thu rắn | Cách thu chất rắn | Lọc chuyển rắn sang bình nhận; cô/làm khô tác động lên bình đang chọn | extraction-step-isolate |
| Chiết / results, phần đo | Cách đo pH và cân | Đo đúng bình; pH cần pha nước; số cân cần được lấy sau thao tác cuối | extraction-step-measure |
| Chiết / results, phần khai báo | Cách khai báo sản phẩm | Chọn A/B/N và bình sản phẩm; nhập đáp số; bấm Lưu sản phẩm | extraction-step-declare |

Gắn thêm ID cho các bước còn lại để mục lục phủ đủ tám bước của mỗi guide: Jar có jar-step-calculation / jar-step-selection / jar-step-submit; chiết có extraction-step-start / extraction-step-precipitate. Không dùng vị trí mảng hoặc số thứ tự làm ID.

Liên kết chuyển dịch dẫn tới bước thu dịch chiết của guide; trợ giúp tại chỗ phải diễn đạt trung tính, hỗ trợ cả chuyển toàn mẫu và chuyển một pha. Không biến ví dụ S → F hoặc thu pha nước trong guide thành phương án bắt buộc cho mọi lần chuyển.

### Ví dụ câu chữ để triển khai

**Cách cấp phèn**

- Kiểm tra cốc đang chọn trước khi thêm.
- Liều tăng được cộng vào tổng: thêm 50 rồi 100 mg/L tạo tổng 150 mg/L.
- Kiểm tra tổng liều của các cốc trước khi bắt đầu khuấy cả mẻ.

**Cách thu chất rắn**

- Chọn bình có rắn và bình nhận trước khi lọc. Lọc chuyển phần rắn, dịch lọc còn ở bình nguồn.
- Cô dung môi và làm khô tác động lên bình đang chọn, không phải bình nhận.
- Điều kiện vận hành còn thiếu vẫn hiển thị cạnh nút thao tác.

**Cách khai báo sản phẩm**

- Chọn chất A/B/N và đúng bình sản phẩm muốn khai báo.
- Dùng số cân của bình đó để tự tính và nhập đáp số.
- Bấm Lưu sản phẩm; đáp số đang nhập chưa được coi là đã lưu.

Đây là nội dung hướng dẫn vận hành, không phải xác nhận người học đã chọn đúng hóa chất, đúng pha hoặc đúng sản phẩm.

## Global Constraints

- Chỉ sửa trợ giúp thao tác, điểm mở guide, mục lục và chỉ dẫn cũ đã nêu. Giữ bố cục workbench, landing, điều kiện vận hành và các phần đã được duyệt.
- Không sửa domain, session, projection, API, database, schema, phép tính, tiêu chí đánh giá hoặc snapshot báo cáo. Không tự tăng phiên bản mô hình/release.
- Không đọc thành phần ẩn, predictor hoặc đáp án tham chiếu để viết trợ giúp động. Không đề xuất liều/pH tối ưu hoặc tự tính đáp số trong lượt.
- Các lý do nút bị khóa và thông tin an toàn thiết yếu phải tiếp tục xuất hiện tại chỗ; không chuyển chúng vào vùng thu gọn.
- Mở/đóng trợ giúp và đọc guide không tạo action, không tăng revision, không đổi cốc/bình, không lưu hoặc xóa đáp số thay người học.
- Giữ nguyên bản nháp khi mở/đóng trợ giúp và khi đọc guide ở tab mới. Không xây cơ chế lưu nháp mới trong vòng này; không hứa giữ bản nháp qua reload/đóng tab.
- Chỉ người học chủ động mở trợ giúp. Không thêm wizard, bước bắt buộc, điểm phạt, theo dõi mức trợ giúp, AI, search hoặc video/placeholder video trong vòng đầu.
- Dùng màu, font và CSS Modules hiện tại; không thêm icon/font library, hook, dependency hoặc installer.
- Không sửa checkout của session khác. Không commit/push trực tiếp develop, không merge hoặc deploy. Nền làm việc theo yêu cầu của người dùng là develop; vòng code tuân thủ Git workflow của AGENTS.

## Review Focus

1. Đáp số chưa ghi và bình/cốc đang chọn còn nguyên khi mở trợ giúp hoặc đọc tài liệu — pin bằng browser test cho cả hai bài.
2. Click trợ giúp không đóng nhầm accordion cha hoặc gửi thao tác hóa học — kiểm tra nhóm đang mở và revision trước/sau.
3. Mỗi link đi đúng bài, đúng anchor và đúng attempt; tab guide không tự tạo lượt — kiểm tra URL và tiêu đề đích trong tab mới.
4. Hướng dẫn thu pha/lọc/cân không biến lựa chọn người học thành đáp án có sẵn; không xuất hiệu suất/thành phần chưa đo — rà câu chữ và các giá trị đang hiển thị.
5. Điện thoại/bàn phím dùng được cùng luồng; nút help không chỉ là hover và vùng ẩn không giữ phần tử focus được — kiểm tra bằng hai project Playwright hiện có.

## 4. File map và interfaces của vòng code sau

| File | Thay đổi giới hạn |
| --- | --- |
| Tạo src/content/operation-help.vi.ts | Các loại topic và 11 đoạn nội dung ngắn; tên nút và guideAnchor ổn định; không có React hoặc dữ liệu session |
| Tạo src/features/workbench/operation-help.tsx | Một nút mở/đóng nội dung tại chỗ và link guide; useState/useId cục bộ |
| Tạo src/features/workbench/operation-help.module.css | Style nhỏ cho nút chữ, nội dung và focus theo token hiện có |
| src/features/jar-test/workbench.tsx | Đặt help vào năm nhóm; truyền URL guide của attempt; đổi link guide toàn bài sang tab mới |
| src/features/extraction/controls.tsx | Đặt sáu topic ở các phần tương ứng; nhận guideBaseHref từ workbench |
| src/features/extraction/workbench.tsx | Truyền guideBaseHref; mở link guide/nguồn ở tab mới |
| src/app/(public)/experiments/jar-test/guide/page.tsx và page.module.css | ID ổn định cho tám bước, mục lục gọn; giữ nội dung chuyên môn |
| src/features/extraction/lesson.tsx và lesson.module.css | ID cho tám bước và mục lục chỉ ở guide đầy đủ; overview giữ nguyên |
| src/features/jar-test/equipment-panel.tsx | Sửa hai chỉ dẫn đo mẫu đầu đang trỏ sai sang Sổ đo; giữ ảnh và attribution |
| Tạo e2e/operation-help.spec.ts | Các kiểm tra hành vi trợ giúp và bảo toàn dữ liệu đang nhập |
| e2e/jar-test-workbench.spec.ts | Cập nhật riêng case mở guide khi đổi hành vi thành tab mới; không sửa các luồng hóa học khác |

Interfaces đề xuất được khóa trong plan này để tránh framework mới:

- OperationHelpTopic: label: string; points: readonly string[]; guideAnchor: string.
- JAR_OPERATION_HELP: Record<'baseline' | 'prepare' | 'dose' | 'program' | 'results', OperationHelpTopic>.
- EXTRACTION_OPERATION_HELP: Record<'add' | 'program' | 'transfer' | 'isolate' | 'measure' | 'declare', OperationHelpTopic>.
- OperationHelp({ topic, guideBaseHref }: { topic: OperationHelpTopic; guideBaseHref: string }). guideBaseHref là đường dẫn guide nội bộ, có query attempt khi có, chưa có fragment. Link chi tiết thêm #guideAnchor.
- ExtractionControls nhận thêm guideBaseHref: string. Parent dựng URL từ attempt đang có; component trợ giúp không import session, router hoặc domain.

Hai guide thêm ID trực tiếp vào các bước hiện có. Không di chuyển toàn bộ nội dung sang hệ quản lý tài liệu và không thay đổi cấu trúc state bài học. Một file cho phần trợ giúp ngắn là đủ; prose chi tiết trong guide tiếp tục được giữ riêng vì phục vụ việc đọc đầy đủ.

## 5. Thứ tự thực hiện ở vòng sau

### Task 1 — Guide có điểm đến rõ ràng và nội dung thống nhất

- [x] Kiểm tra lại ref develop và đọc guide Next được cài trong node_modules trước khi sửa TSX.
- [x] Tạo file topic thuần dữ liệu theo interfaces trên; viết nội dung của 11 điểm trợ giúp, tối đa ba ý/topic.
- [x] Gắn ID cho tám bước của từng guide, thêm mục lục theo tên bước đang có. Bổ sung scroll-margin phù hợp header hiện tại và focus cho liên kết; không dùng smooth scrolling bắt buộc.
- [x] Sửa hai câu đo mẫu đầu cũ trong bảng dụng cụ Jar. Giữ mọi số liệu, công thức, nguồn, giới hạn và các đường mở lại attempt.
- [x] Kiểm tra bằng trình duyệt: các mục lục/anchor có đích duy nhất, tên và nội dung đúng thao tác, đọc được trên điện thoại. Đây là sửa nội dung/điều hướng tĩnh; không thêm unit tests chỉ để lặp lại chuỗi chữ trong cấu hình.

### Task 2 — Trợ giúp tại thao tác, bảo toàn lượt đang làm

- [x] Viết các browser regression trước khi nối component: Jar giữ draft 12.34 ở cốc đang chọn; chiết giữ draft A/B và bình sản phẩm đã chọn; mở help không đổi revision; link mở đúng anchor/attempt trong tab mới và draft ở tab gốc còn nguyên.
- [x] Chạy test tập trung và xác nhận thiếu control/link trợ giúp là nguyên nhân RED. Không đổi test để đòi một đáp án hóa học trước nộp.
- [x] Triển khai OperationHelp theo interface. Dùng button với aria-expanded/aria-controls, nội dung hidden khi đóng; đặt trong thân nhóm, ngoài summary của accordion cha. Không bắt toàn bộ nhóm điều khiển unmount khi bật help. Nút chữ có vùng bấm phù hợp điện thoại.
- [x] Nối năm điểm Jar và sáu điểm chiết. GuideBaseHref lấy từ attempt đang mở; giữ các lý do thao tác chưa khả dụng bên ngoài help.
- [x] Đổi các link rời workbench để đọc guide/nguồn sang tab mới, rel=noopener noreferrer, tên link báo rõ mở tab mới. Đóng tab guide không đóng workbench. Chưa có attempt thì không tự tạo ID/lượt để mở guide.
- [x] Cập nhật case guide của Jar đang giả định điều hướng cùng tab. Rà assertion trong chính case đó theo guide hiện tại; không dùng bảng chương trình đã không còn có trong source làm kỳ vọng mới.
- [x] Chạy các case mới trên chromium và mobile. Kiểm tra mở/đóng bằng Enter/Space và focus; khi help đóng không tab vào link bị ẩn. Kiểm tra tên bài/anchor và chuyển hai topic trong một nhóm chiết không tác động input.
- [x] Chạy typecheck, lint đúng các file đã sửa và git diff --check. Chỉ mở rộng kiểm tra khi xuất hiện lỗi liên quan; không chạy lại toàn bộ hóa học/cloud/database cho thay đổi này.

Lệnh kiểm tra dự kiến, dùng app local đang chạy, không tự mở môi trường production:

    $env:E2E_BASE_URL = 'http://127.0.0.1:3000'
    npm run test:e2e -- e2e/operation-help.spec.ts --project=chromium --project=mobile
    npm run test:e2e -- e2e/jar-test-workbench.spec.ts -g 'theory guide' --project=chromium --project=mobile
    npm run typecheck
    npx --no-install eslint src/content/operation-help.vi.ts src/features/workbench/operation-help.tsx src/features/jar-test/workbench.tsx src/features/extraction/controls.tsx src/features/extraction/workbench.tsx 'src/app/(public)/experiments/jar-test/guide/page.tsx' src/features/extraction/lesson.tsx src/features/jar-test/equipment-panel.tsx e2e/operation-help.spec.ts e2e/jar-test-workbench.spec.ts
    git diff --check

Các case mới tối thiểu: help_preserves_jar_draft_and_revision; help_preserves_extraction_product_drafts; guide_opens_matching_anchor_in_new_tab; help_is_keyboard_operable_and_scoped_to_current_group. Dùng các project và helpers hiện có, không thêm hệ test mới. Test link/anchor thực tế; không đọc storage nội bộ chỉ để chứng minh câu chữ được render.

## 6. Điều kiện coi vòng nâng cấp này là đủ

- Người học bấm một lần để xem cách làm của thao tác đang mở, không phải rời bàn lab hoặc đọc lại toàn bộ guide.
- Nội dung đủ ngắn để đọc ngay trong nhóm; guide đầy đủ vẫn là nơi đọc nguyên lý và giới hạn.
- Cốc/bình, dữ liệu đã lưu và mọi input đang nhập giữ nguyên khi tra cứu; trợ giúp không chạy hộ thao tác hoặc làm lộ đáp án.
- Cùng hành vi trên desktop, điện thoại và bàn phím. Hướng dẫn đo mẫu đầu nhất quán giữa dụng cụ, guide và điều khiển.
- Người dùng xem trực tiếp bản local trước khi mở rộng. Video chỉ xét sau nếu ảnh và lời giải thích tại chỗ vẫn chưa đủ; không chuẩn bị pipeline video trong đợt này.

## 7. Bằng chứng và tự rà kế hoạch của vòng hiện tại

- Đã đọc source guide/control/equipment/draft của hai bài trên baseline nêu trên. Trang thư viện và guide Jar đã được quan sát trên trình duyệt ở cùng commit trong cuộc trao đổi này.
- Chưa code component/links/anchors, chưa chạy tests cho tính năng chưa triển khai, chưa kiểm nghiệm với sinh viên. Không dùng kết quả tests từ các task lịch sử làm bằng chứng pass cho plan này.
- Phạm vi phủ: nội dung và anchor (Task 1), component/link/preservation và accessibility (Task 2). Các signatures dùng nhất quán; 11 điểm mở trợ giúp chỉ cần một component, một file dữ liệu và một stylesheet nhỏ.
- Các quyết định giao diện ở đây là đề xuất của vòng phân tích để người dùng xem trước vòng code, không phải một bản UI đã được chấp nhận qua thử nghiệm.


## 8. Kết quả triển khai sau khi người dùng duyệt — 16/10/2026

- Đã triển khai trên checkout develop cb43af20a9dcdd91f522477e70b5813378f459f5 theo yêu cầu người dùng; chưa commit/push, merge hoặc deploy.
- Đã thêm 11 trợ giúp thu gọn, một component dùng chung và một file nội dung. Hai guide có mục lục tám bước với ID ổn định; link guide/nguồn từ workbench mở tab mới và báo trước bằng nhãn.
- Đã sửa đúng hai chỉ dẫn đo mẫu ban đầu trong bảng dụng cụ Jar. Nội dung chuyên môn của guide, mô hình, session, API, database và báo cáo giữ nguyên.
- RED trước khi nối UI: 4 case chromium thất bại do thiếu mục lục/nút trợ giúp.
- GREEN: 8/8 case operation-help (chromium + mobile), gồm 11 topic, anchor, attempt, mở tab, bảo toàn draft/cốc/bình/revision và thao tác bàn phím. Case guide Jar hiện có: 2/2 qua trên hai project.
- Typecheck: pass. ESLint đúng 10 file TypeScript/TSX liên quan: pass. git diff --check: pass. Impeccable scan các file trợ giúp/guide: không có findings.
- Tự review phạm vi, các interface, mounting/state và nội dung; không dùng subagent theo quyết định người dùng. Không thêm dependency.
- Không chạy toàn bộ suite hóa học/cloud/database hoặc production build cho chỉnh sửa UI này, theo yêu cầu kiểm tra tương xứng. Chưa kiểm nghiệm hiệu quả học tập với sinh viên; chờ người dùng xem bản local để đánh giá trải nghiệm.
