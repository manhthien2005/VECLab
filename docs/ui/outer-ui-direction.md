# UI-01 — Định hướng outer UI/UX VECLab (đề xuất, chờ duyệt)

- **Task:** UI-01 · Coder 2 · chỉ tài liệu, chưa triển khai.
- **Repo / branch:** manhthien2005/VECLab · feature/coder-2-ui-audit.
- **Source pin:** c337bd91a92fce0721cf1dd6076286018fc888e3 (accepted Task 1, **không** nhập Jar Task 2 đang chờ).
- **Đối tượng:** sinh viên đại học không chuyên Hóa, biết kiến thức và dụng cụ căn bản nhưng cần định hướng làm thí nghiệm độc lập.
- **Bằng chứng:** đọc source ở commit đã ghim và các skill/contract; **chưa** mở browser, chưa chụp screenshot, chưa đo contrast/CLS, chưa thử người học, chưa chạy build/test.
- **Trạng thái:** *proposal for human design review*; không thay đổi app, UI runtime, API, domain, database, dependency hoặc workbench.

## 1. Bản đồ hiện trạng — facts từ source

| Vùng / URL | Đường dẫn & component thực tế | Hành vi xác nhận từ source / ranh giới |
| --- | --- | --- |
| Shell (toàn site) | src/app/layout.tsx → AppNav / AppFooterNav ở src/app/app-nav.tsx; src/app/nav-items.ts; src/app/theme-toggle.tsx; src/app/fonts.ts; src/app/globals.css | Header sticky, skip link tới main, footer với giới hạn khoa học; nav khách: Thí nghiệm, Nguồn khoa học, Phòng lab của tôi; đã đăng nhập bổ sung So sánh, Tài khoản. Nav mobile disclosure ở breakpoint 60rem, aria-expanded và Escape/outside click; theme sáng/tối, Manrope self-hosted, global focus-visible và reduced-motion đã có. Không được coi chưa hỗ trợ a11y chỉ vì chưa thử browser. |
| Trang chủ / | src/app/(public)/page.tsx → HeroPreview, ExperimentShowcase, WorkbenchPreview, EvidenceSection, FinalCtaBanner, ScientificDisclosure; nguồn copy src/content/app.vi.ts | CTA chính đi thẳng tới /simulate/{firstCatalogScenario}; CTA phụ anchor workbench preview. HeroPreview chứa khung preview với pH 5,2 và 25,0°C mô tả bằng markup; WorkbenchPreview là demo state cục bộ (cộng thể tích, **không** gọi engine/tính pH); showcase ba thẻ hardcode, không lấy danh sách từ catalog registry. |
| Danh mục /experiments | src/app/(public)/experiments/page.tsx → listCatalog → ScenarioCard và PlasticSeparationCatalogCard | listCatalog chỉ lấy bản phát hành có cả content lẫn engine; ở baseline src/application/scenarios/registry.ts trả về **chỉ acid-neutralization**. Trang còn render **riêng** thẻ prototype nhựa. Thẻ release đặt ID/version, số claim/source/limitation trước mô tả nhu cầu người học. |
| Chi tiết /experiments/[scenarioKey] | src/app/(public)/experiments/[scenarioKey]/page.tsx → findCatalogEntry, listActions, manifestFor, ScientificDisclosure, SourceList, ClaimList | Chi tiết của release trong registry (hiện tại acid): bối cảnh, mẫu, thao tác, giới hạn, nguồn và phiên bản; CTA /simulate/{key}; mục lục sticky desktop, ẩn dưới 68rem. Nội dung và tham số đặc thù HCl/NaOH: không dùng component này làm template generic cho Jar/hấp phụ mà chưa tách dữ liệu khoa học. |
| Chi tiết nhựa riêng | src/app/(public)/experiments/plastic-density-separation/page.tsx → PlasticSeparationDetail | Route tĩnh chuyên biệt dẫn tới /simulate/plastic-density-separation; không phải một release được registry chung phục vụ. Route tĩnh và route động cùng tồn tại, không quy nhựa thành acid. |
| Workbench cũ | src/app/simulate/[scenarioKey]/page.tsx → WorkbenchClient; src/app/simulate/plastic-density-separation/page.tsx → PlasticSeparationWorkbench | Route động guard đúng WORKBENCH_SCENARIO_KEY (acid), không dùng generic cho bài mới. Nhựa là mô phỏng riêng. UI-01 không thay đổi bên trong hai workbench. |
| My Lab /lab | src/app/(learner)/lab/page.tsx → currentStorageMode → src/features/learner-lab/lab-client.tsx → src/features/attempts/attempt-table.tsx | Route public cho khách IndexedDB hoặc lượt cloud theo cookie/session. Loading/error/empty/list; danh sách đang làm, 5 lượt hoàn thành gần nhất; link mở lượt/báo cáo, xóa có confirm. CTA “Bắt đầu lượt thử mới” trỏ acid cố định; bảng dữ liệu mang pH*/điểm theo projection acid. Lượt trạng thái stopped không thuộc hai nhóm đang render. |
| Đường ra | src/app/nav-items.ts; ScenarioCard; FinalCtaBanner; AttemptTable | Đến thí nghiệm qua catalog/detail/CTA, trở lại phiên qua Lab và tham số attempt, nguồn qua /evidence, báo cáo qua /reports/{attemptId}. Preserve URL/semantics khi đổi trình bày. |

**Tách ba phạm vi để không quảng bá sai:**

1. **Có source thao tác hiện hữu:** acid-neutralization là release trong registry chung; plastic-density-separation là prototype/luồng riêng; copper-precipitation có thẻ giới thiệu nhưng không có release trong registry và CTA chuyển về catalog.
2. **Ba mô phỏng mục tiêu đã chốt trong thiết kế 2026-10-13:** điều chỉnh pH mẫu nước tổng hợp; Jar Test keo tụ–tạo bông–lắng; hấp phụ xanh methylene bằng một than hoạt tính xác định. Chúng là **roadmap**, không phải ba bài đã chạy ở baseline này. Acid HCl hiện tại có thể là nền cho bài pH, nhưng **không được** đổi nhãn thành bài nước tổng hợp mới khi domain/nội dung chưa giao nhận.
3. **Không dùng Jar Task 2 pending làm facts:** UI danh mục chỉ nâng nhãn sẵn sàng khi có route, data/engine, lưu lượt và báo cáo đã được local nghiệm thu theo phạm vi tương ứng. Không biến “có source Task 1 engine” thành “người dùng chơi được Jar Test”.

## 2. Năm vấn đề UX ưu tiên (đánh giá suy luận từ source, **chưa visual-verified**)

| Ưu tiên | Bằng chứng source (file:line / symbol) | Rủi ro với sinh viên không chuyên | Cách xử lý đề xuất / guard |
| --- | --- | --- | --- |
| **P0 — Trạng thái thí nghiệm không nhất quán** | src/features/landing/experiment-showcase.tsx: SHOWCASE_CARDS và isLive=false cho nhựa; card nhựa lại liên kết được vào /simulate/plastic-density-separation; src/features/experiment-catalog/plastic-separation-catalog-card.tsx; src/application/scenarios/registry.ts: servedReleases chỉ acid | Trên homepage đọc “Sắp ra mắt” nhưng catalog có nút Bắt đầu mô phỏng; dễ hiểu nhầm bài nào học được và nhầm ba mục tiêu mới đã xong. | Phân biệt rõ “Bài đã phát hành”, “Bản thử nghiệm nghiên cứu”, “Đang phát triển”; chỉ cho CTA thực hành khi có route đang chạy đúng chức năng. Vùng roadmap không giả là card playable; không sửa registry để đổi nhãn. |
| **P1 — Preview có thể bị hiểu là số đo thật** | src/features/landing/hero-preview.tsx: telemetry pH 5,2, progress 60%; src/features/landing/workbench-preview.tsx: previewVolumeMl và handleAddReagent chỉ cộng thể tích, pH hiển thị 4,8/chart cố định; src/content/app.vi.ts: workbenchLede/Feedback nêu rõ demo không tính cân bằng | Người học có thể cho rằng bấm “Thêm và đo” đã tạo một phép đo tính toán, hoặc ảnh minh họa là đáp án mặc định. | Đặt nhãn luôn nhìn thấy “Minh họa giao diện — không phải phép đo”; nút demo dùng “Thử thao tác mẫu”, show phản hồi khác UI thực; không làm màu/trạng thái preview thành kết quả hoặc tiết lộ đáp án của lượt học. |
| **P2 — Card ưu tiên mã và nguồn hơn quyết định học** | src/features/experiment-catalog/scenario-card.tsx: releaseId/version + claimCount/sourceCount/limitationCount; src/app/(public)/experiments/page.tsx: mô tả chung dài về phiên bản | Sinh viên muốn biết “sẽ học gì / làm gì / có làm ngay được không” trước khi hiểu release ID. | Trên thẻ đặt tên, một mục tiêu theo ngôn ngữ phổ thông, hành động học, tình trạng, CTA. Version/nguồn vào hàng phụ “Chi tiết mô hình”; **không** tự bịa độ khó, thời lượng hay hiệu quả. Giữ disclosure/truy xuất nguồn. |
| **P3 — Chi tiết khá dày trước CTA / khó định hướng mobile** | src/app/(public)/experiments/[scenarioKey]/page.tsx: nhiều sections hóa học + bảng và toc; src/app/globals.css:5369-5422 mục lục ẩn dưới 68rem | Người mới phải quét mô tả chi tiết để tìm mục tiêu, mẫu, hành động; mobile mất đường nhảy đoạn nhanh. | Tạo overview “Bạn sẽ thử gì / quan sát gì / trước khi bắt đầu” và CTA; giữ bảng, cảnh báo, chứng cứ dưới sections có anchor và mục lục mobile giản lược (không xóa nội dung bắt buộc). Dữ liệu nguồn vẫn là nguồn chân thực duy nhất. |
| **P4 — My Lab nhấn phiên acid và thiếu nhánh stopped** | src/features/learner-lab/lab-client.tsx: CTA /simulate/{WORKBENCH_SCENARIO_KEY}; phân nhóm inProgress + completed, không render stopped; src/features/attempts/attempt-table.tsx: các cột pH*/score theo acid projection | Sinh viên sau khi dừng lượt khó tìm lại; khi nhiều bài tồn tại, nút “Tạo lượt mới” ngầm chọn acid, bảng acid có thể không phù hợp Jar/hấp phụ. | Ngắn hạn đổi ưu tiên CTA sang “Chọn thí nghiệm” nếu được duyệt; hiển thị trạng thái stopped phù hợp quyền mở lại/đọc (không tự cho resume nếu terminal); dài hạn đợi session contract đa bài rồi mới thiết kế metric theo release. Không đổi storage/session trong task UI. |

**Những điểm đã tốt, cần giữ:** link semantic và accessible names của ScenarioCard, skip link, focus-visible, motion reduction, theme, container responsive, số liệu null khác 0, warning của phiên bản khoa học, xác nhận xóa; bảng Lab có CSS horizontal scroll dưới 46rem (src/app/globals.css:5260-5268). Không xếp các phần này thành “bug” nếu chưa có bằng chứng thử thật.

## 3. Một hướng thị giác duy nhất — **“Bàn lab thân thiện / Guided Lab Path”**

**Nguyên tắc:** năng lực khoa học đáng tin của VECLab hiện hữu + điểm vào dễ học. Không “gamify” thành điểm thưởng; không giả chất lượng dữ liệu; không sao chép UI của thiết bị đo thật khi chưa có measurement.

- **Phân cấp thông tin:** (1) *Học điều gì* + CTA rõ, (2) *Bài nào làm ngay* và trạng thái, (3) *Thao tác/hiện tượng học tập* trong một preview có nhãn, (4) *Cơ sở khoa học* mở sâu khi cần. Release/version là metadata thứ cấp nhưng luôn truy cập được.
- **Điều hướng:** giữ một shell và URL đang dùng: logo → trang chủ; “Thí nghiệm” → /experiments; “Phòng lab của tôi” → /lab; “Nguồn khoa học” → /evidence. Không đưa link Jar vào nav đến khi có route. Sticky nav nhỏ gọn, active state cả chữ + nền; mobile disclosure có tên/đóng Escape/nhấn ngoài, không ẩn thao tác thiết yếu.
- **Typography:** tiếp tục Manrope self-hosted hiện tại (src/app/fonts.ts), fallback hệ thống; body 15–16px desktop/mobile, line-height ~1.55–1.65; heading 28–44px hero tùy viewport, section 24–32px, card 18–20px; code, số đo và version dùng numeric tabular/monospace có chọn lọc. Tránh headline hoàn toàn jargon (pH*, Kw, specVersion) trước phần giải thích.
- **Màu:** dùng token đã có thay vì reset thương hiệu: nền sáng #f8fafc, surface #fff, chữ #0b1f3d, teal hành động #008388, cyan/blue nhấn thông tin; dark dùng token dark sẵn có. Status có text/icon: “Sẵn sàng”, “Prototype nghiên cứu”, “Đang phát triển”; màu chỉ bổ sung, không mang nghĩa một mình. Accent áp dụng CTA chính và focus, không tô tất cả card; contrast phải được đo ở runtime cả light/dark.
- **Spacing & hình khối:** theo 4px token nền đang có, gap 16–24px cho card, 32–48px giữa khối nội dung, max-width container hiện tại (82/88rem), radius vừa (10–22px), đường viền mảnh, shadow tiết chế. Với mã/long text: min-width:0, wrap/truncate có title truy cập được.
- **Hình minh họa:** tái dùng SVG/asset/visual có sẵn; sơ đồ “bối cảnh → chọn → quan sát → giải thích” đơn giản. Preview nhìn như mô phỏng nhưng được đánh dấu **minh họa**; không dùng animation, màu nước/độ đục, đo pH chưa thực hiện để truyền tải kết quả hóa học.
- **Responsive:** desktop ≥ 1024px hero text + preview chia 2 vùng, catalog 2–3 cột tùy độ rộng; tablet 2 cột có thể gãy sớm; mobile khoảng 360–430px tất cả nội dung thành 1 cột, CTA full-width hợp lý, chip không tràn, card không buộc ngang. Chi tiết giữ anchor điều hướng, bảng khoa học cuộn ngang có affordance; Lab bảng sẵn cuộn ngang, đừng biến mất cột trạng thái/kết quả.
- **Motion:** dùng transform/opacity ngắn cho affordance, trạng thái focus/hover/touch tách biệt; toàn bộ nội dung hiển thị không cần animation, honor prefers-reduced-motion. Không làm animation quyết định thời gian hay số đo mô hình.

### Wireframe thô — Homepage (desktop)

    +--------------------------------------------------------------------------------------+
    | VECLab        Thí nghiệm    Phòng lab của tôi    Nguồn khoa học         [Theme/Menu] |
    +--------------------------------------------------------------------------------------+
    | LAB CHO NGƯỜI MỚI                              | [Preview minh họa — KHÔNG đo thật] |
    | Tự thử. Quan sát. Hiểu nguyên nhân.             | [Dụng cụ SVG + chú giải]          |
    | Một câu về học theo thao tác và giới hạn.      | [bước 1 → 2 → 3]                  |
    | [Khám phá thí nghiệm] [Xem cách hoạt động]      | [Mở bài đang dùng được]           |
    | Có thể dùng chế độ khách · Có nguồn khoa học    |                                     |
    +--------------------------------------------------------------------------------------+
    | CHỌN BÀI ĐỂ HỌC                                                                    |
    | [Acid hiện hữu: Sẵn sàng]  [Nhựa: Prototype]  [3 bài mục tiêu: Đang phát triển]    |
    | Tên rõ, việc sẽ thử, kết quả quan sát; không cho CTA vào route chưa có.           |
    +--------------------------------------------------------------------------------------+
    | CÁCH HỌC: Bối cảnh → Tự thao tác → Đo/quan sát → Giải thích & thử lại               |
    | [Minh họa thao tác]                         [Mục tiêu/bài học bằng ngôn ngữ dễ hiểu]|
    +--------------------------------------------------------------------------------------+
    | Vì sao tin số liệu? [Nguồn / phiên bản / giới hạn] [Cảnh báo mô hình]              |
    +--------------------------------------------------------------------------------------+

### Wireframe thô — Catalog (desktop)

    +--------------------------------------------------------------------------------------+
    | Thí nghiệm                                   Chọn một tình huống để thực hành       |
    | [Đã phát hành] [Bản thử nghiệm] [Đang phát triển]  (nhãn, chưa cần filter JS)      |
    +--------------------------------------------------------------------------------------+
    | [Hình/biểu tượng] Điều chỉnh pH [đúng status]   | [Hình] Jar Test [đúng status]     |
    | Mục tiêu học & hành động quan sát              | Mục tiêu học & hành động quan sát |
    | [Bắt đầu / Tìm hiểu]                           | [Xem mô tả / Chưa khả dụng]       |
    | Bằng chứng và release mở dưới “Chi tiết”        | Không bịa link vào workbench      |
    +-----------------------------------------------+-----------------------------------+
    | [Hình] Hấp phụ xanh methylene [đúng status]    | [Legacy/Prototype nếu còn]        |
    +--------------------------------------------------------------------------------------+

Ở **baseline trước Jar Task 2**, ba ô bài mới ở wireframe chỉ là **nội dung giới thiệu/roadmap có điều kiện** nếu sản phẩm chọn công khai roadmap; không hiển thị như thẻ release đang hoạt động. Mục tiêu tránh trộn thể loại “prototype” với “bài đã nghiệm thu”. Mobile: header có menu disclosure; hero preview xuống dưới CTA; catalog 1 cột, status đứng cạnh tiêu đề, các đường dẫn đầy đủ, không dùng hover để mở điều khiển.

## 4. Slices triển khai nhỏ — **chưa được phép thực hiện trong UI-01**

**Prerequisite:** Tech Lead khóa ownership cho mỗi slice, tạo task JSON mới pin SHA đã nghiệm thu, người duyệt xác nhận thông điệp/status, **không** dựa trên Jar Task 2 pending.

| Slice / thứ tự | Scope file đề xuất cho task tương lai | Tiêu chí tiếp nhận và test thủ công local (human) |
| --- | --- | --- |
| **S0 — Quyết định sản phẩm** (không code) | docs/ui/outer-ui-direction.md; người dùng + Tech Lead duyệt nhãn trạng thái và thứ tự nhóm | Chọn liệu roadmap ba bài hiện khi chưa có playable route; chốt nhãn cho plastic (prototype) và acid legacy; duyệt preview được ghi nhãn minh họa; không ghi nhận “đã release” chỉ theo plan. |
| **S1 — Home clarity** | Coder 2 độc quyền: src/app/(public)/page.tsx; src/features/landing/experiment-showcase.tsx, hero-preview.tsx, workbench-preview.tsx, final-cta-banner.tsx (chỉ phần presentation/copy đúng chốt). src/content/app.vi.ts **được local giao độc quyền trước khi đổi**; không sửa domain/engine. | 390/768/1440px: primary CTA dẫn route có thật, preview ghi “minh họa” nhìn thấy cả trước/sau bấm, no misleading pH updates; Tab từ skip link tới CTA rồi menu; reduced motion; không thay đổi giá trị khoa học hay demo engine. |
| **S2 — Catalog decision cards** | Coder 2: src/app/(public)/experiments/page.tsx; src/features/experiment-catalog/scenario-card.tsx; src/features/experiment-catalog/plastic-separation-catalog-card.tsx; có thể thêm UI helper cùng folder *khi task mới liệt kê rõ*. **Catalog registry không được tự sửa**. | Guest từ homepage → catalog → acid detail → acid start; plastic dẫn đúng route riêng; bài chưa release không có nút Start; không mất version/evidence; kiểm tra keyboard, mobile 360/390 và link accessible names. Nếu filter có state, persist trạng thái vào URL thay vì chỉ state cục bộ. |
| **S3 — Detail progressive disclosure** | Coder 2: src/app/(public)/experiments/[scenarioKey]/page.tsx; src/features/experiment-catalog/plastic-separation-detail.tsx (chỉ được giao khi cần). Copy khoa học / limits do domain/content owner duyệt. | URL trực tiếp từng bài vẫn chạy; anchor + header offset, mục lục mobile có đường nhảy; full điều kiện, nguồn, cảnh báo không bị ẩn hoàn toàn; CTA đúng scenario; bàn phím và screen reader đọc hierarchy; không render acid facts dưới bài khác. |
| **S4 — My Lab readability** (**sau** session/report contract Jar được nghiệm thu) | Coder 2: src/features/learner-lab/lab-client.tsx; src/features/attempts/attempt-table.tsx. File session, repository, domain **thuộc Coder 1**, không kéo vào UI task. | Guest empty/in_progress/completed/stopped/error; mode local/cloud; không gọi stopped là resumable; report/compare/delete vẫn đúng, native confirm không bị mất; null không thành 0; dòng dài/lượt nhiều xem được mobile và 200% zoom; file data/API untouched. |
| **S5 — Shared system polish** (**local Tech Lead cấp quyền độc quyền**) | src/app/globals.css, src/app/layout.tsx, src/app/app-nav.tsx, src/app/nav-items.ts, src/app/fonts.ts, src/app/theme-toggle.tsx; nếu muốn Coder 2 sửa thì phải giao riêng và không có coder khác sửa cùng lúc. | Smoke test menu 360/768/1024/1440, Escape/outside, theme light/dark, skip link, heading anchor không bị sticky header che, focus visible và accessible tap target ≥44px, 200% zoom không che CTA/scroll lỗi. No new dependency. |

**Ownership hard stop:** src/app/globals.css (rộng, nhiều module đang dùng), root layout, shared navigation, shared copy src/content/app.vi.ts, catalog registry, session contract và package/lockfile phải có **một owner được local giao rõ**. Coder 2 không sửa chúng dựa vào bảng đề xuất này. Coder 1 giữ domain/session/API/Jar workbench; chưa được động đến những phần đó. Nếu slice cần chỉnh CSS chung, tách patch đề nghị giao Tech Lead; không tự đổi file ngoài allowlist.

**Bộ kiểm tra local gọn theo slice:** lint/typecheck UI liên quan khi có source đổi + focused route smoke; không spam test tất cả engine. Browser human test cả light/dark, 360/390/768/1024/1440, touch/keyboard, zoom 200%, reduced motion, có/không có đăng nhập, trạng thái rỗng/dữ liệu, mở trực tiếp URL và back/forward. Về accessibility: tên nút icon/label, semantic links/buttons, focus không bị sticky header che, trạng thái async dùng status/aria-live khi phù hợp, không chỉ dựa màu. Về thực học: nhờ 3–5 sinh viên không chuyên Hóa tìm một bài đang chạy được, giải thích nó sẽ cho quan sát gì, mở và quay lại Lab **sau khi luồng đó thực sự có sẵn**; ghi lời và thao tác chứ không suy luận từ source.

## 5. Quyết định cần người duyệt

1. **Đồng ý một direction “Bàn lab thân thiện / Guided Lab Path”** với ưu tiên clarity thay vì thay toàn bộ identity/brand đã được chốt trong approved landing reference? Mặc định: giữ teal/navy/Manrope và nâng thứ bậc UX.
2. **Thông tin công khai trên homepage/catalog:** hiển thị ba bài mục tiêu như roadmap không thể bấm Start, hay chỉ liệt kê bài thực sự dùng được và đặt roadmap tại một mục riêng? Khuyến nghị: tách khu “Đang phát triển”, không trộn catalog live.
3. **Nhãn hiện hữu:** acid legacy = “Sẵn sàng”; plastic độc lập = “Mô phỏng nghiên cứu / Bản thử nghiệm” (không tự hứa lưu Lab/cùng engine); Cu precipitation = “Chưa mở”. Cần local/human chốt chính xác.
4. **CTA My Lab:** trước khi có đa bài, có cho “Tạo lượt mới” đi catalog thay vì acid cố định? Khuyến nghị: có, trong slice UI riêng sau review luồng thực tế.
5. **Kiểm định:** hình ảnh/contrast/performance hiện tại chưa xác minh. Hãy chốt hướng bằng screenshot/demo tại local trước khi đổi CSS/layout toàn cục, không đánh giá visual từ code.

## 6. Trạng thái và giới hạn

- **Facts:** các đường dẫn, import, JSX, token CSS, registry, URL và trạng thái render được kiểm ở SHA pin; citations nội bộ nêu đường dẫn/component cụ thể.
- **Proposals:** P0–P4 là mức **ưu tiên UX giả định** để con người kiểm lại, không phải số đo task-completion, heatmap, bug runtime hay quan sát đồ họa từ browser.
- **Unverified:** bố cục hiển thị thật, kích cỡ click thật, độ tương phản theo browser/theme, mobile Safari, actual navigation/storage success, chất lượng khoa học của mô phỏng.
- **Không chỉnh code.** Chờ duyệt hướng và task triển khai riêng; local Tech Lead review doc/diff và kiểm tra được source. Không tự merge/deploy.
