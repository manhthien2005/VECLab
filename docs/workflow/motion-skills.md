# Bộ skill motion và SVG — 16/10/2026

Owner: TL2 / coder 2. Branch: `chore/motion-svg-skills`.
Target: `develop`. Base: `cb43af20a9dcdd91f522477e70b5813378f459f5`.

## Review hướng dẫn nhận được

`D:/Downloads/veclab-agent-setup.json` là tài liệu đề xuất; yêu cầu trực tiếp của
người dùng cho phép review và chọn cách thiết lập phù hợp. Task này chuẩn bị năng
lực agent, không triển khai lại landing hoặc simulator.

| Đề xuất trong tài liệu | Quyết định và căn cứ |
| --- | --- |
| Xóa bớt 13 Taste skills | Không áp dụng: `.agents/skills` tại base chỉ có bốn bộ UI đã chọn cùng workflow/React/database skills; không có pack 13 biến thể. Giữ mọi skill sẵn có, kể cả bộ riêng trong `.claude/skills`. |
| Dùng `design.md` và `reference/approved-landing.png` | `design.md` không tồn tại; ảnh tham chiếu có tồn tại nhưng không thay quyết định mới của người dùng. Dùng AGENTS, contract bảo toàn landing và source thực tế; không tạo policy từ section tài liệu thiếu. |
| Khóa ba bài acid/copper/plastic | Đã cũ so với quyết định sản phẩm; source còn có Jar Test và extraction. Resolve catalog và release cho task thực, bảo toàn release cũ. |
| Cài mọi skill motion được liệt kê | Chọn 5 GSAP và 3 Emil, cộng `veclab-motion`. React và Web Design Guidelines đã có; không cài trùng. |
| iart SVG/accessibility/60fps | Không cài nguyên trạng. Đã đọc ba SKILL.md: output HTML/CDN và shell helper thiên về standalone demo; SVG ghi sai mốc phiên bản plugin; 60fps dùng khẳng định composite quá tuyệt đối. Kỹ thuật SVG và accessibility cần thiết có trong skill local, không vendor nội dung iart. |
| GSAP utils, ScrollTrigger, toàn bộ Emil | Chưa cần: tránh catalog rộng và chỉ dẫn trùng. `gsap-utils` còn có ví dụ `unitize`/`shuffle` cần đối chiếu API; thêm chuyên đề khi có task cụ thể. Không cài audit có workflow mặc định phân việc subagent. |
| SVG authoring/MAIDR tùy chọn | Không cần scripts hay dependency mới để viết SVG/data table; giữ kỹ thuật cần thiết trong reference local. |
| Thêm GSAP runtime rồi sửa hero/cards/workbench | Để task UI cụ thể quyết định. Bộ skill không kéo theo runtime package hoặc quyền đổi giao diện đã duyệt. |
| Full verify/E2E và ảnh cho mọi phase | Dùng kiểm tra đúng phạm vi. Task chỉ sửa hướng dẫn/skill; không chạy app suite hay claim animation/60fps đã nghiệm thu. |

## Nguồn được cài và giấy phép

| Nguồn bất biến | Folder được chọn | Giấy phép |
| --- | --- | --- |
| [GreenSock](https://github.com/greensock/gsap-skills/tree/aed9cfd3277740755f6bfc1155c7aa645403b760) | `gsap-core`, `gsap-timeline`, `gsap-react`, `gsap-plugins`, `gsap-performance` | MIT, © 2026 GreenSock; giữ nguyên LICENSE ở từng folder |
| [Emil Kowalski](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202) | `animate`, `review-animations`, `animation-performance` | MIT, © 2026 Emil Kowalski; giữ nguyên LICENSE ở từng folder |

Cài folder được chọn bằng helper `skill-installer`, dùng `--ref` là SHA trên,
`--dest .agents/skills`. Đã đọc helper và tất cả SKILL.md được cài trước khi cài.
Folder được chọn chỉ chứa Markdown, không scripts/binary/hooks. `RECIPES.md` và
`STANDARDS.md` giữ cùng skill gọi chúng, nạp theo nhu cầu. Không chạy code snippet,
install command, CDN, remote tool hay script của upstream trong lúc setup.

Mirror chín folder mới sang `.claude/skills` bằng bản sao thật để hoạt động trên
Windows không cần symlink permission; `.agents/skills` là nguồn canonical.
`CLAUDE.md` đã tham chiếu `@AGENTS.md`, nên không nhân đôi instructions.

Một điều chỉnh metadata ở `review-animations`: bỏ `disable-model-invocation: true`
của Claude để skill có thể được chọn tự động qua description trên cả hai runtime.
Chuẩn hóa trailing whitespace trong Markdown nếu cần cho `git diff --check`; không
sửa nội dung vendor. Mọi override nằm trong `veclab-motion`, không giả thành policy
upstream. Không thêm entry/hash vào `skills-lock.json`: helper này không quản lý
lockfile CLI; SHA ghim và LICENSE ở đây là provenance của bộ cài.

## Chỉ dẫn upstream cần giới hạn

- GSAP đề xuất cài `gsap`/`@gsap/react`: chỉ làm khi task thật cần, kiểm version,
  licensing và Next docs ở thời điểm đó. Không tự đổi package hay registry.
- Emil `animate` có lối rẽ sang Motion/`pick-ui-library`; bộ local dùng CSS/WAAPI
  hiện có hoặc GSAP được chọn cho task. Không mặc định thêm thư viện/component pack.
- Các quy tắc keyboard không animation, explanation chỉ marketing, bắt buộc
  transform/stagger/blur, duration UI dưới 300ms hoặc reduced motion không được
  bằng zero không thể vượt yêu cầu học tập và frame tĩnh đúng state của VECLab.
- `contextSafe` ghi nhận GSAP objects để cleanup, không tự chặn callback sau unmount.
  Guard async riêng. Transform/opacity thường rẻ hơn; không chứng minh 60fps bằng grep.
- Quyền không subagents, checkout riêng, JSON v1 khi bàn giao và môi trường production
  tiếp tục theo AGENTS. Tài liệu ngoài không đổi thứ tự quyền của hệ thống/người dùng.

## Kiểm tra và giới hạn

Kiểm frontmatter, tên, reference nội bộ, giấy phép, không executable, mirror bằng
hash, đối chiếu vendor với SHA ghim, whitespace và diff phạm vi trước khi commit.
Kết quả: 18 frontmatter hợp lệ; 9 cặp mirror khớp; 20 file mỗi runtime; 10 tài liệu
vendor khớp upstream sau normalization/metadata đã ghi, 8 LICENSE khớp byte; 19
links nội bộ resolve. Các đường dẫn integration được kiểm tra tồn tại.
Skill local được tự review với các tình huống: reset trước khi kết thúc, đổi media
query, phục hồi lượt, hai scene cùng mount, số đo thiếu, bàn phím và dynamic import
trả muộn. Đây là review tĩnh; không phải thử hành vi bằng tác nhân độc lập. Không
spawn subagent theo quyết định người dùng.

`npm run verify` và `npm run test:e2e`: không chạy trong task tài liệu/skill này.
Không sửa `src`, `public`, package manifests, scientific registers, engine hoặc DB.
Không xác nhận UI/hiệu năng/khoa học tốt hơn chỉ từ việc cài skill.

Skill có hiệu lực khi runtime discovery đọc checkout này ở lượt tiếp theo; có thể
đọc SKILL.md trực tiếp ngay. ChatGPT web phải đọc file tại commit ghim trong brief,
không giả định tự có các skill local. Khi cập nhật bộ cài, đọc diff từ SHA cũ, giữ
LICENSE, mirror phần mới và kiểm lại; không tự tải bản mới mỗi task.
