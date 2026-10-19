# Kế hoạch đồng bộ và nâng cấp workbench phân loại nhựa

> **Thực hiện sau khi người dùng duyệt:** dùng `superpowers:executing-plans`, triển khai từng phần và trình người dùng review. Không dùng subagent theo AGENTS.md. Tài liệu này là phân tích và đề xuất, chưa cho phép tự bắt đầu triển khai.

**Mục tiêu:** workbench nhựa có cùng cách tổ chức, mức hoàn thiện và khả năng sử dụng với Jar Test và chiết tách axit–bazơ; hình thiết bị và chuyển động giải thích rõ quá trình phân tách vật lý.

**Kiến trúc đề xuất:** tái sử dụng `WorkbenchFrame`, `ActionButton`, `OperationHelp` và các mẫu giao diện đã có. Giữ engine/session/projection là nguồn kết quả. Tách hình thiết bị tĩnh với lớp chuyển động; không tạo framework mô phỏng chung cho ba bài.

**Công nghệ:** Next.js 16.3.4, React 19, CSS Modules, SVG viết bằng mã, CSS/WAAPI nếu cần. Chưa có GSAP trong dependencies và chưa có lý do phải thêm thư viện.

**Đặc tả đầu vào:** yêu cầu người dùng ngày 19/10/2026: phân tích trước, chưa code; đồng bộ Jar Test/chiết tách, nâng cấp SVG và animation. Đọc kèm `AGENTS.md`, `docs/workflow/ui-skills.md`, `.agents/skills/veclab-motion/SKILL.md`, `docs/experiments/plastic-density-separation-profile.md` và `docs/ui/current-experiments.md`.

## 1. Trạng thái và bằng chứng khảo sát

- Nhánh khảo sát: `feature/plastic-experiment-library`; HEAD `06e7aad0b47e0f3cc67323465d0e24fd6a4afedf`.
- Workspace đã có thay đổi thư viện, ảnh, trang chi tiết và hướng dẫn từ các lượt trước, chưa commit. Không coi HEAD là toàn bộ nội dung hiện có; không ghi đè các thay đổi này.
- Đã đối chiếu source của cả ba workbench, khung chung, SVG, bộ điều khiển chuyển động và các bài kiểm tra motion/layout hiện có.
- Đã mở cả ba workbench trên trình duyệt; quan sát bài nhựa qua tạo lượt thử, chuẩn bị mẫu, nạp/làm ướt, tách nước, ly tâm–cân và chọn nhánh ethanol. Lượt thử nằm trong trình duyệt kiểm tra, không sửa dữ liệu người dùng.
- Ở viewport 1280 px, SVG bài nhựa rộng khoảng 650 px trong viewBox 960; chữ 10–12 đơn vị chỉ còn khoảng 6,8–8,1 px khi hiển thị. Cần đưa nhãn quan trọng ra vùng HTML dễ đọc.
- Chưa chạy trọn hai nhánh, chưa thử mọi trạng thái khôi phục/lỗi lưu, chưa kiểm tra reduced motion trực tiếp trong lượt khảo sát này, chưa đo FPS hoặc hiệu năng thiết bị thật. Các nhận định tương ứng dưới đây là từ source, không phải kết quả chạy thử đầy đủ.
- Kiểm tra mobile của workbench cần làm khi triển khai. Không dùng bằng chứng mobile của trang thư viện/hướng dẫn để kết luận workbench đã đạt.
- Lượt này chỉ thêm tài liệu kế hoạch, không đổi mã ứng dụng hoặc chạy suite nghiệm thu cho một bản sửa chưa tồn tại.

## 2. Những gì nên kế thừa từ hai bài chuẩn

| Mảng | Mẫu đã có | Áp dụng cho nhựa |
| --- | --- | --- |
| Khung | Cả hai dùng `src/features/workbench/frame.tsx`; Jar dùng `contentSized` để cột giữa theo nội dung | Header học tập, kệ trái thu gọn, cảnh giữa, Thao tác phải, Sổ đo; mobile chọn Mô phỏng / Thao tác / Sổ đo và mở Dụng cụ riêng |
| Trạng thái | Header thể hiện đang mở/đang lưu/đã lưu; lỗi có hướng xử lý | Trạng thái lưu thật từ thao tác đã xác nhận; không dùng hoạt ảnh để báo lưu thành công |
| Trợ giúp | `ActionButton` nối nút khóa với lý do; `OperationHelp` mở hướng dẫn tại thao tác | Dùng cùng cách trình bày, nội dung riêng theo bước và nhánh nhựa |
| Thiết bị | Jar có cốc, trục khuấy, vạch chia; chiết tách có bình, mặt phân cách, nhãn và chú giải | Hình có cấu tạo nhận biết được, nhãn và số liệu đọc được; không sao chép thiết bị không thuộc bài nhựa |
| Motion | Trạng thái nghỉ lấy từ projection; chiết tách có “Xem trạng thái cuối”, xử lý thay đổi reduced motion; hai bài theo dõi ẩn/hiện cảnh | Kết quả đã lưu quyết định cảnh cuối, có bỏ qua cảnh minh họa và dừng lặp khi không xem |

Đồng bộ nghĩa là cùng ngôn ngữ giao diện và hành vi. Không ép nhựa có điều khiển pH, lọc, chuẩn độ hoặc số đo mà engine của bài không cung cấp. Không tự sửa hai bài chuẩn trong task này.

## 3. Chẩn đoán và hướng xử lý

| Hiện tại (Before) | Đề xuất (After) | Vì sao / ưu tiên |
| --- | --- | --- |
| Khung riêng ở `workbench.tsx`; breakpoint 1500 px đẩy toàn bộ kệ lên trên. CSS đổi `grid-template-columns` cho phần tử vẫn là flex | Dùng khung chung và kệ gọn, bỏ quy tắc layout riêng bị chồng chéo | **P1:** người học phải cuộn xa mới tới cảnh và thao tác |
| Header gọi 95,6%/99,7% là “Mục tiêu” trong khi bài dùng dữ liệu thu hồi đặt sẵn (`workbench.tsx:443`) | Mục tiêu học: thực hiện quy trình, giải thích nhóm nổi/chìm và đọc thu hồi; tỷ lệ để trong số liệu tham khảo | **P1:** tránh biến dữ liệu nguồn thành bài tối ưu đáp số không tồn tại |
| Bảng dụng cụ vẫn ghi PP 0,900; HDPE 0,950; PS 1,050 và HDPE nổi ở ethanol 31% (`equipment-panel.tsx:40–88`) | Dùng cùng `VIRGIN_POLYMERS`, `OUTCOMES`, `PLASTIC_PROFILE` với hướng dẫn đã chỉnh | **P1:** không còn hai bộ thông số và giải thích trái nhau |
| Có handler đổi cảnh trước khi `session.apply()` trả thành công (`workbench.tsx:380–412`) | Chỉ khởi động cue khi action đã được xác nhận; lỗi lưu giữ cảnh theo projection cũ và có thông báo | **P1:** không minh họa một thao tác bị từ chối như đã thành công |
| Khóa nút theo `phaseOneVisual`, `branchSeparationVisual` và các timeout; không có bỏ qua | Tách điều kiện thực hành với trạng thái phát cảnh; “Xem trạng thái cuối” bỏ qua phần minh họa, không phát action mới | **P1:** hoạt ảnh không trở thành thời gian chờ bắt buộc |
| CSS reduced motion tắt nhiều chuyển động nhưng các timeout JS vẫn chạy | Reduced motion và thay đổi preference trực tiếp đưa cảnh về trạng thái cuối; không chờ timer cảnh | **P1:** tắt hình động phải có hiệu lực với cả trải nghiệm thao tác |
| Chọn ethanol vẫn xuất hiện “Nước đang dâng lên…”; thông báo đầu cảnh và lời hướng dẫn chưa cùng trạng thái | Nội dung theo môi trường/bước hiện tại; phân biệt “đã lưu thao tác” và “đang minh họa” | **P2:** người học biết mình đã làm gì và đang xem gì |
| Nhiều nút chỉ ghi “Chạy”, preset và nguyên nhân khóa chưa rõ tại nút | Nhãn hoặc accessible name nêu môi trường, nồng độ; có lý do khóa và trợ giúp tại nhóm thao tác | **P2:** dễ tìm, dễ dùng bằng bàn phím hoặc trình đọc màn hình |
| Chữ nhỏ trong SVG; nhiều nhãn chung thay vì nhãn gắn đúng bộ phận | SVG ưu tiên hình; tên thiết bị, môi trường, nhóm vật liệu và số cân hiển thị HTML cạnh cảnh | **P2:** đọc được khi thu nhỏ, phóng chữ và trên điện thoại |
| Ethanol tím, NaCl xanh; hạt có nhiều màu nhưng chưa giải thích rõ quy ước | Chất lỏng gần trong suốt; môi trường phân biệt bằng nhãn. Màu/hình hạt có chú giải minh họa, không coi là màu thật hay định danh hóa học | **P2:** tăng cảm giác phòng thí nghiệm mà không truyền sai ý nghĩa |
| Cảnh và nhiều vòng lặp không có logic visibility như hai bài chuẩn; nhiều `transition: all` | Dừng khi không xem; chỉ chuyển thuộc tính cần thiết, hạn chế filter trên nhiều hạt | **P2:** giảm công việc thừa; chưa kết luận hiện tại giật hoặc đạt FPS nào |
| Reset và báo cáo là lớp `div` thay vì modal có quản lý focus; bảng dụng cụ đã dùng `<dialog>` | Giữ dialog dụng cụ đang có; đưa reset/báo cáo về modal có focus, Escape và trả focus | **P2:** tiếp cận bằng bàn phím và không tương tác nhầm nền |
| Route chỉ đọc `attempt`, bỏ qua `view`; workbench đã có props báo cáo/sổ | Hỗ trợ `view=report`, `view=notebook`, xử lý attempt sai định dạng rõ ràng | **P2:** mở đúng bề mặt và giữ lượt khi tra hướng dẫn |

Các mốc thời gian hiện tại từ source: chuẩn bị khoảng 2,95 giây; nạp/làm ướt khoảng 4,4 giây; tách nước khóa khoảng 8,8 giây; chuỗi ly tâm khoảng 6,25 giây; tách nhánh khoảng 10,3 giây. Đây là thời gian cảnh, không phải thời gian hóa học. Không đặt một trần chung rồi cắt mọi cảnh; cần chia cảnh theo điều người học phải nhìn thấy và cho phép bỏ qua.

**Kết luận review motion: chưa đạt để nghiệm thu bản nâng cấp (Block).** Cần xử lý cue trước xác nhận, chờ hoạt ảnh bắt buộc và reduced motion trước khi chấp nhận phần motion. Không dùng verdict này để kết luận engine hoặc toàn dự án sai.

## 4. Định hướng SVG: giống thiết bị thí nghiệm, đúng bài

Giữ các chi tiết đang hữu ích: khay kim loại có chiều sâu, hình dạng hạt riêng, `useId` cho phần lớn gradient/clip, hình ly tâm và trạm cân. Nâng cấp có chọn lọc, không bỏ hết để thay bằng sơ đồ khối tối giản.

- **Bể phân tách:** thân trong suốt nhìn được hạt, miệng bể và mặt chất lỏng rõ, khung đỡ/trục/cánh khuấy có cấu tạo thống nhất. Chỉ dùng vạch chia có ý nghĩa trong hồ sơ; không tạo thang đo giả có thể đọc như số đo thật.
- **Hạt nhựa:** giữ mã PP/HDPE/PS/ABS/PA/PC và hình dạng theo hồ sơ. Khay có nhãn đọc được; màu không phải cách nhận biết duy nhất. Hạt không xuyên thành bể, không nổi lơ lửng sau khi đã về trạng thái nghỉ.
- **Ly tâm:** nhận ra nắp, rotor, vị trí chứa mẫu và đường chuyển mẫu. Không thể hiện nắp mở khi đang quay; không để người học tưởng các hạt rời được quay trực tiếp như vật thể bay ngoài máy.
- **Cân:** khay/đĩa cân, mẫu đang cân và màn hình tách bạch. Chưa có số ghi nhận dùng dấu thiếu; không chạy số giả 0 → đích như đang đo thực nghiệm. Ghi “Khối lượng quy đổi theo hồ sơ”.
- **Hai nhánh:** sơ đồ nhỏ Nước → nhóm nhẹ/nhóm nặng. Nhánh đang xem nổi bật; vẫn nhận ra vật liệu còn ở nhánh kia và phân đoạn đã thu, không tưởng chúng biến mất.
- **Môi trường:** nước/ethanol/NaCl không cần màu tím/xanh đậm. Có thể dùng sắc nhạt để tăng độ tương phản nhưng phải có nhãn, không tạo ba lớp chất lỏng không tồn tại trong cùng bể.
- **Ngôn ngữ hình:** kính/trong suốt, kim loại xám xanh, nét gọn và bóng nhẹ như Jar/chiết tách; hạn chế glow, đổ bóng nhiều tầng, emoji và chữ kỹ thuật li ti.
- Ảnh mới của bài nhựa là tham khảo chất liệu/bố cục thiết bị, không phải bản vẽ kỹ thuật hay căn cứ để đổi thể tích, cơ cấu máy hoặc quy trình.

Không thêm phản ứng đổi màu, kết tủa, đun nóng, khói hoặc bọt khí liên tục để “trông hóa học hơn”. Bài này là phân tách vật lý; hoạt ảnh không mô phỏng động học chất lưu.

## 5. Kịch bản chuyển động đề xuất

| Cảnh | Người học cần thấy | Cảnh cuối và cách điều khiển |
| --- | --- | --- |
| Chuẩn bị | Sáu mẫu từ kệ → khay có mã và khối lượng cấp liệu | Khay sẵn sàng; không rải hạt xuất hiện ngẫu nhiên qua mỗi render |
| Nạp và làm ướt | Nạp môi trường, nạp mẫu, cánh khuấy làm việc; nhãn đúng nước/ethanol/NaCl | Bể có mẫu đúng projection; 1 giờ chỉ là điều kiện hồ sơ |
| Tách trong nước | Dừng khuấy; PP/HDPE đi lên mặt, bốn loại còn lại đi xuống | Hai nhóm có nhãn, hướng đi rõ; không coi thời gian đi của hạt là vận tốc thật |
| Ly tâm và cân | Đưa phân đoạn vào máy → đóng nắp/quay → chuyển ra khay cân | Số đã ghi nhận hiện cùng mẫu, dừng rotor khi xong |
| Ethanol 23% | PP lên, HDPE xuống trong nhánh nhẹ | Kết quả đúng OUTCOMES; hạt không tự thay kết quả do random |
| Ethanol 31% | Thể hiện rõ thao tác nạp lại PP cùng phần HDPE theo workbench hiện hành | PP nổi, HDPE chìm; giải thích đây là so sánh các điều kiện của hồ sơ, không tự đổi thành một quy trình công nghiệp liên tục |
| NaCl | Lần lượt phân đoạn PS, ABS, PA, PC theo mức đã làm | Chỉ có kết quả đã ghi nhận; cân PA và PC riêng ở bước cuối nếu projection có số tương ứng |
| Tổng kết | Các phân đoạn về vị trí cố định có nhãn, đối chiếu với sơ đồ hai nhánh | Dữ liệu xuất hiện đầy đủ; hiệu ứng vào khay ngắn và tùy chọn, không che số liệu |

Quy tắc chung cho mọi cảnh:

1. Action được xác nhận → projection mới → cue có định danh ổn định → minh họa → trở về cảnh tĩnh của projection.
2. Cảnh giải thích có “Xem trạng thái cuối”. Bỏ qua chỉ kết thúc hình động, không cân, chạy preset hoặc hoàn tất lượt hộ người học.
3. Đổi nhánh, đổi lượt, reset hoặc nhận revision mới phải hủy cue cũ. Khi khôi phục lượt, hiện cảnh tĩnh đúng trạng thái, không tự phát lại lịch sử.
4. Khi giảm chuyển động được bật, hiện trực tiếp cảnh cuối và thông báo ngắn. Không sửa preference trình duyệt/OS.
5. Khi tab/cảnh bị ẩn, dừng vòng lặp; ưu tiên kết thúc cue tạm về trạng thái mới nhất khi đổi pane để không phát lại một đoạn cũ lúc quay về.
6. Giao diện dùng token đang có: `--motion-fast` 120 ms, `--motion` 200 ms, `--motion-state` 240 ms, `--motion-slow` 420 ms, `--ease-out`. Cảnh giải thích có thời lượng riêng theo mục đích; chốt sau khi review đầu/giữa/cuối, không áp 200 ms cho quá trình nổi–chìm.
7. CSS cho chuyển động đơn giản, WAAPI nếu cần hủy/đổi đích rõ ràng. Chỉ cân nhắc GSAP nếu một cảnh cụ thể chứng minh cần timeline; không tự thêm dependency.

## 6. Phân rã triển khai để review từng phần

### Phần 1 — Khung và điều hướng đồng bộ

**Files:** sửa `src/features/plastic-separation/workbench.tsx`, `workbench.module.css`; dùng `src/features/workbench/frame.tsx` và style chung. Không sửa khung chung nếu chỉ cần truyền slot.

**Interface:** nhận nguyên `PlasticSessionView` và props mở lượt hiện có; truyền `header`, `notices`, `shelf`, `simulation`, `controls`, `notebook`, `pane`, tour vào `WorkbenchFrame`. Khởi đầu theo biến thể `contentSized` như Jar, xác nhận bằng bố cục thực tế.

- [ ] Ghi bài kiểm tra luồng/layout hiện có cần giữ; tạo `e2e/plastic-workbench.spec.ts` cho khung, kệ và pane.
- [ ] Chuyển slot, giữ action/session và hình hiện có; loại layout riêng không còn dùng.
- [ ] Đồng bộ header học tập, trạng thái lưu, lối về bài, mục tiêu/phạm vi; trên desktop giữ số liệu gần cảnh, trên mobile pane rõ ràng.
- [ ] Kiểm tra desktop 1280/1440, tablet khoảng 1024, điện thoại khoảng 390, phóng chữ 150%; không cuộn qua toàn kệ để tới cảnh.
- [ ] Review riêng phần khung với người dùng trước phần SVG/motion.

### Phần 2 — Mẫu/dụng cụ, hướng dẫn thao tác và thông báo

**Files:** `workbench.tsx`, `equipment-panel.tsx`, `equipment-shelf.tsx`, `lesson-content.ts`; bổ sung topic nhựa trong `src/content/operation-help.vi.ts`; dùng `ActionButton`/`OperationHelp`.

**Interface:** số mẫu, khối lượng, hình dạng, kết quả theo `PLASTIC_PROFILE`, `VIRGIN_POLYMERS`, `OUTCOMES`; không tạo bản constants thứ hai. Trợ giúp dẫn tới anchor đang có trong guide và giữ `attempt`.

- [ ] Có kiểm tra hồi quy PP 0,910; HDPE 0,953; PS 1,040 g/cm³ và HDPE chìm ở ethanol 31% trong bảng dụng cụ.
- [ ] Mỗi action có tên rõ, điều kiện hợp lệ, lý do khóa và trạng thái pending; chỉ một hành động chính ở bước hiện tại.
- [ ] Mức chưa làm/đã làm/đang xem phân biệt bằng chữ và trạng thái, không chỉ màu. Không tạo thao tác cân/pha hóa chất mà engine không có.
- [ ] Sửa “cơ sở dữ liệu”, “báo cáo khoa học”, “Table 1”, “Mục tiêu 95,6%…” thành lời học tập đúng ý nghĩa; giữ tên nút và guide thống nhất.
- [ ] Giữ native dialog dụng cụ; kiểm tra focus/Tab/Escape/đóng và mở lại.

### Phần 3 — SVG tĩnh và khả năng đọc

**Files:** `apparatus.tsx`, `equipment-shelf.tsx`, `workbench.module.css`; có thể tách `apparatus-art.tsx`/`apparatus.module.css` nếu việc sửa cần chia trách nhiệm. Không tách chỉ để tăng số file.

**Interface:** `PlasticProjection` quyết định vị trí/mẫu/số hiển thị; tên thiết bị, trạng thái và số liệu quan trọng có phần HTML tương đương. Giữ định danh semantic cho bể, hạt, rotor, cân và khay.

- [ ] Kiểm tra cảnh tĩnh: chưa chuẩn bị, khay, bể sau làm ướt, nước, ethanol, NaCl, ly tâm, cân, tổng kết.
- [ ] Vẽ lại có chọn lọc theo mục 4; chất liệu nhất quán, hạt không xuyên thành, nhãn không bị cắt, không đọc chữ 6–8 px.
- [ ] `useId` cho tất cả id SVG, kể cả `tray-PP` đang dùng id không theo instance; tránh trùng khi có nhiều cảnh/mẫu.
- [ ] Có lựa chọn bằng nút/bàn phím ngoài SVG và chú giải mã/hình; focus không bị xóa. Không thêm kéo thả trong gói này.
- [ ] Trình người dùng xem bản SVG tĩnh trước khi gắn animation.

### Phần 4 — Chuyển động theo thao tác đã lưu

**Files:** `workbench.tsx`, `apparatus.tsx`, style liên quan; dự kiến `motion-scene.tsx` hoặc một controller nhựa nhỏ theo mẫu chiết tách, không xây hệ timeline dùng chung cho mọi bài.

**Interface:** cue nhận action id/sequence đã được xác nhận, projection trước/sau cần để minh họa và môi trường đang dùng. Callback kết thúc chỉ dọn trạng thái UI, không gọi action khoa học.

- [ ] Trước khi sửa, bổ sung `e2e/plastic-motion.spec.ts`: kết quả normal/skip/reduced/restore phải như nhau; cue không chạy khi action bị từ chối hoặc chưa xác nhận.
- [ ] Thay chuỗi timer rải rác bằng một nơi sở hữu cue; cleanup đầy đủ khi reset, đổi nhánh/attempt, unmount. Random chỉ phục vụ bố trí minh họa ổn định, không quyết định nhóm hay số liệu.
- [ ] Làm kịch bản mục 5; nút “Xem trạng thái cuối” có thể dùng cả bàn phím, không phải điều khiển seek công khai.
- [ ] Live reduced motion kết thúc cue ngay; tab/cảnh ẩn không tiếp tục lặp vô ích. Không lấy kết thúc CSS animation làm điều kiện có số đo.
- [ ] Review đầu/giữa/cuối, chỉ rõ thời lượng và mục đích từng cảnh; kiểm tra highlight mẫu/nhánh và giữ nền đứng yên khi đọc số liệu.
- [ ] Profile cảnh nhiều hạt/ly tâm trên thiết bị phù hợp trước khi tuyên bố mượt; không thêm `will-change` toàn SVG hoặc nhiều filter nếu chưa có bằng chứng cần.

### Phần 5 — Sổ thực hành, báo cáo và khôi phục lượt

**Files:** `notebook.tsx`, `completion.tsx`, `workbench.tsx`, `src/app/simulate/plastic-density-separation/page.tsx`, `e2e/plastic-workbench.spec.ts`.

**Interface:** giữ report snapshot, release và dữ liệu cũ. Route nhận `attempt` và `view`; kết quả thiếu giữ null/N/A. Modal quản lý focus theo mẫu dự án.

- [ ] Sổ đo ưu tiên thao tác đã ghi, môi trường, phân đoạn và số cân; thông số nguồn chung đặt trong phần mở rộng.
- [ ] Đọc được ý nghĩa “khối lượng quy đổi” và “thu hồi tham khảo”; không biến chưa cân thành 0, không trình bày phần chưa làm như kết quả đã đo.
- [ ] `view=notebook`/`view=report` mở đúng nơi; `attempt` lỗi/không tồn tại/không hỗ trợ không tự tạo hoặc đổi nhãn lượt khác.
- [ ] Reset tạo lượt mới và giữ lượt cũ; modal có focus trap/đóng bằng Escape/trả focus. Không tự bấm hoàn tất do hết cảnh.
- [ ] Chạy luồng đầy đủ cả hai nhánh, tổng kết, hoàn tất, tải lại, mở lại báo cáo bằng liên kết cùng trình duyệt.

## 7. Ràng buộc và phần chưa thuộc gói này

- Giữ nguyên engine, model, tỷ lệ, release, phép quy đổi khối lượng, dữ liệu IndexedDB và lịch sử migration. Nếu phát hiện lỗi khoa học/session, ghi thành task riêng; không sửa lẫn vào polish.
- Workbench hiện yêu cầu cả hai nhánh để mở nút tổng kết, còn contract domain có thể hỗ trợ hoàn tất một nhánh. Giữ hành vi UI hiện tại trong gói này; không tự thay tiêu chí đánh giá hoặc hợp đồng cũ.
- Không thay landing, header/footer ngoài workbench, hai bài chuẩn, auth, database, production hay cài thư viện mới.
- Lab và liên kết `/attempts`/`/reports` chung chưa nhận bài nhựa. Đây là gói tích hợp riêng: phải phân biệt route `plastic-density-separation` với scenario key `plastic-separation`, kiểm tra release, không làm sống lại prototype đã nghỉ. Hỗ trợ `view` ngay trên route bài trong phần 5 không tự giải quyết được gói tích hợp này.
- Không thêm ảnh/video để thay thế SVG tương tác. Video thao tác riêng vẫn là hạng mục nội dung khác.

## 8. Kiểm chứng theo từng phần

Không chạy mọi suite cho mỗi chỉnh sửa nhỏ. Khi có triển khai, dùng kiểm tra phù hợp và đọc kết quả thật:

- `npm run typecheck`; ESLint trên các file đã đổi; `git diff --check`.
- Domain/session/projection hiện có khi thay dây nối UI: `npx vitest run tests/unit/plastic-density-engine.test.ts tests/unit/plastic-density-session.test.ts tests/unit/plastic-projection.test.ts`; đây là kiểm tra phần mềm, không phải kiểm chứng thực nghiệm.
- `E2E_BASE_URL=http://localhost:3010` và Playwright cho `plastic-workbench.spec.ts`/`plastic-motion.spec.ts` khi các file đã được tạo; chạy desktop/mobile theo config dự án.
- Hồi quy hẹp Jar/chiết tách chỉ bắt buộc nếu thật sự sửa component dùng chung; không chạy toàn suite chỉ vì dùng lại một component.
- Trước merge/promote cần required CI xanh theo AGENTS; tài liệu này không cho phép merge/push/deploy.

Các tình huống bắt buộc gắn vào phần sở hữu tương ứng: action lỗi/chưa xác nhận (phần 4), đổi nhánh/reset giữa cảnh (4), live reduced motion và tab ẩn (4), reload/release không hỗ trợ (5), dữ liệu thiếu và báo cáo (5), bàn phím/touch/phóng chữ (1–3).

## 9. Thứ tự đề nghị người dùng review

**Khung chung → thao tác và nội dung → SVG tĩnh → animation → sổ/báo cáo và mở lại lượt.**

Ưu tiên đầu tiên là phần 1. Mỗi phần là một thay đổi có thể xem và chấp nhận riêng; không triển khai trọn cả kế hoạch khi người dùng chỉ chọn một phần.


## 10. Đợt triển khai UI theo yêu cầu tiếp theo — 19/10/2026

Người dùng đã cho phép triển khai khung, thao tác, mẫu và dụng cụ, mục tiêu/phạm vi, sổ thực hành, nộp bài, báo cáo và mở lại lượt. SVG và animation thực thi được để lại cho đợt sau, thay cho thứ tự review đề nghị ở mục 9.

- Đã dùng `WorkbenchFrame`, `ActionButton`, `OperationHelp` cùng quy ước trình bày của Jar Test/chiết tách; không sửa hai bài chuẩn hoặc component khung dùng chung.
- Sổ hiển thị phân đoạn đã ghi nhận, lịch sử thao tác, thông số mẫu; khối lượng mới chỉ xuất hiện sau bước ly tâm–cân được lưu. Giá trị thiếu không thay bằng 0.
- Nộp bài có checklist hai nhánh, xác nhận khóa thao tác và thông báo chỉ lưu trên trình duyệt. Báo cáo đọc snapshot đã chốt và thông số cấp liệu của snapshot.
- Lab và các liên kết `/attempts`/`reports` mở đúng release nhựa 0.2.0. Liên kết lỗi, lượt không tìm thấy hoặc release cũ không tự biến thành lượt mới. Tạo lượt mới giữ nguyên lượt cũ.
- Nội dung mẫu lấy từ profile/outcomes; sửa khối lượng riêng và phân đoạn HDPE chìm ở ethanol 31%. Bỏ chỉ dẫn trừ bì riêng và các tuyên bố ảnh là mẫu thật của nghiên cứu.
- Bổ sung khóa ghi đồng thời và expected revision tại lời gọi session; lỗi chưa xác nhận yêu cầu tải lại để đọc trạng thái đã lưu. Không đổi engine, session, profile, tỷ lệ thu hồi hoặc schema dữ liệu.
- Đã chạy Playwright desktop/mobile: 5 bài kiểm tra qua, 1 bài trọn quy trình mobile bỏ qua chủ đích vì desktop đã chạy đầy đủ. Có kiểm tra khôi phục từ Lab, liên kết lỗi, sổ không tràn ngang, Escape/focus modal, mẫu HDPE, nộp bài, số liệu PP/PC, mở lại báo cáo và giữ lượt cũ khi tạo lượt mới.
- Đối chiếu source: các khối SVG và timer minh họa hiện hữu không đổi; `apparatus.tsx` và stylesheet motion không có diff. Những vấn đề reduced motion, bỏ qua cảnh và thời gian chờ theo animation trong mục 3 vẫn thuộc đợt motion sau.
- Bản sửa chưa commit, chưa merge/deploy; base HEAD vẫn `06e7aad0b47e0f3cc67323465d0e24fd6a4afedf`, nhánh `feature/plastic-experiment-library`. Kiểm tra phần mềm không phải kiểm chứng thực nghiệm của mô hình.


### Tiếp nối: polish kệ và bảng thao tác theo Jar Test

- Kệ đã gọn còn ba mục; trợ giúp dùng kiểu hàng của Jar Test. Chi tiết sáu mẫu và cân vẫn truy cập trong bảng thông tin.
- Thao tác dùng nhóm đóng/mở có biểu tượng và trạng thái giống Jar Test; mỗi lần mở một nhóm. Thanh quy trình dùng cùng tên bước và mở đúng nhóm, có chuyển pane/focus trên mobile.
- `plasticWorkbenchContext` dùng chung cho cảnh và thao tác; phân biệt môi trường hiện tại, bước gần nhất đã ghi nhận và phần minh họa. Số cân thiếu vẫn là “Chưa ghi nhận”; PA/PC hiển thị riêng.
- Bàn chưa chuẩn bị mẫu có hướng dẫn đi tới bước đầu. Điều kiện tham khảo được thu gọn; không nâng cấp SVG hoặc timer thực thi trong đợt này.
- Kiểm tra: typecheck/lint qua; 18 unit test liên quan qua; luồng đầy đủ hai nhánh → nộp → mở báo cáo → tạo lượt mới/giữ lượt cũ qua. Kiểm tra điều hướng, khôi phục và trợ giúp trên desktop/mobile qua. Chưa merge/deploy; người dùng review trực tiếp trên localhost.
