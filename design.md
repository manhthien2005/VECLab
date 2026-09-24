# VECLab Landing Page — UI/UX Design Specification

> **Mục tiêu:** tái tạo landing page desktop đã được duyệt theo hướng hiện đại, sáng, khoa học, ít chữ, nhiều visual có ý nghĩa nhưng **không spam hình ảnh**.
>
> **Product truth:** VECLab là nền tảng mô phỏng quy trình hóa học có căn cứ khoa học. Đây **không phải** virtual 3D lab, chemistry sandbox tổng quát hay AI chemistry assistant.

---

## 1. Nguồn quyết định

Agent phải ưu tiên nội dung theo repo VECLab:

1. `docs/core-project-scope.md`
2. `docs/web-application-scope.md`
3. Ba experiment specs trong `docs/experiments/`
4. `docs/scientific-evidence-register.md`
5. `docs/mockups/simulation-workbench-desktop.html`

Repo: `https://github.com/manhthien2005/VECLab`

Các điểm không được làm sai:

- MVP có đúng 3 bài: **Trung hòa axit**, **Kết tủa Cu²⁺**, **Phân loại nhựa nổi–chìm**.
- Simulation là **deterministic**: cùng state + cùng chuỗi thao tác => cùng kết quả.
- 3D, AI quyết định kết quả, chemistry sandbox tổng quát nằm ngoài MVP.
- Guest có thể chạy đầy đủ thí nghiệm mà không cần đăng nhập.
- Nguồn khoa học, assumption và limitation là một phần của trải nghiệm chứ không phải phụ lục.

---

## 2. Design direction

### Keyword

`clean / scientific / precise / modern / educational / calm / product-first`

### Cảm giác cần đạt

- Nhìn vào 2–3 giây phải hiểu đây là **web mô phỏng hóa học tương tác**.
- Không giống website NGO môi trường.
- Không giống phòng lab 3D/game.
- Không giống dashboard enterprise khô cứng.
- Hình ảnh chỉ hỗ trợ hiểu sản phẩm, không dùng để trang trí vô nghĩa.

### Visual ratio

- 55% product UI / chart / state visualization
- 25% scientific illustration
- 20% typography + spacing

---

## 3. Asset strategy — rất quan trọng

Landing page chỉ dùng **4 visual assets chính + 1 logo mark**:

| File | Vai trò | Dùng ở đâu |
|---|---|---|
| `assets/logo-mark.svg` | logo/icon VECLab | header, footer |
| `assets/hero-neutralization.svg` | apparatus trung hòa axit | Hero + có thể reuse trong Workbench |
| `assets/copper-precipitation.svg` | trạng thái trước/sau kết tủa | card experiment 02 |
| `assets/plastic-density-separation.svg` | minh họa nổi–chìm | card experiment 03 |
| `assets/evidence-books.svg` | visual nguồn khoa học | Evidence section |

Có bản PNG export tương ứng để dùng khi pipeline không hỗ trợ SVG.

### Không tạo thêm ảnh nếu chưa thật sự cần

**Không** thêm:

- stock photo scientist;
- background chemistry collage;
- molecule 3D bay khắp trang;
- cây lá môi trường ở mọi section;
- ảnh riêng cho từng bullet;
- ảnh full-width ở mỗi section.

Chart, progress, status, phương trình, icon phải dựng bằng **HTML/CSS/SVG/component**, không raster hóa thành ảnh.

---

## 4. Canvas và grid desktop

### Target viewport

- Primary mockup: `1440 × auto`
- Content max-width: `1280px`
- Horizontal page padding: `48px` ở desktop lớn; `32px` ở 1200px
- Section vertical gap: `88–112px`

### Header

- Height: `72px`
- Sticky optional; background `rgba(255,255,255,.88)` + backdrop blur nhẹ
- Không tạo shadow mạnh

### Main column

```css
.page-shell {
  width: min(1280px, calc(100% - 96px));
  margin-inline: auto;
}
```

---

## 5. Design tokens

```css
:root {
  --bg: #F7FAFB;
  --surface: #FFFFFF;
  --surface-soft: #EEF6F7;
  --line: #D8E3E2;

  --text: #0B2240;
  --muted: #65758A;

  --primary: #0B766F;
  --primary-2: #13B8A6;
  --primary-soft: #D9F3EF;

  --blue: #2D6F9F;
  --blue-bright: #1E9BE6;
  --blue-soft: #DCECF7;

  --success: #237A4B;
  --success-soft: #E6F6ED;
  --warning: #9A5B0B;
  --warning-soft: #FFF2DA;

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-xl: 28px;

  --shadow-card: 0 12px 38px rgba(28, 62, 82, .08);
  --shadow-focus: 0 24px 70px rgba(33, 108, 133, .13);
}
```

### Gradient dùng tiết chế

Primary CTA:

```css
background: linear-gradient(90deg, #10B99C 0%, #178EF4 100%);
```

Chỉ dùng gradient cho:

- primary CTA;
- 1–2 accent line;
- subtle halo sau hero apparatus.

Không gradient hóa mọi card.

---

## 6. Typography

Khuyến nghị:

- `Inter`, `Manrope`, hoặc `Plus Jakarta Sans`
- Formula: `STIX Two Math` hoặc serif math fallback

### Scale

| Element | Desktop |
|---|---:|
| Hero H1 | 64–72px / 0.98–1.05 |
| Section H2 | 36–44px |
| Card title | 20–24px |
| Body | 16–18px |
| Secondary | 14px |
| Eyebrow | 11–12px, uppercase, letter-spacing 0.14em |

Hero copy tối đa 3 dòng headline + 2 dòng description.

---

# 7. Information architecture

Landing page gồm đúng các section sau:

1. Header
2. Hero
3. Trust strip
4. Three Experiments
5. Workbench Preview
6. Scientific Evidence
7. Final CTA
8. Footer

**Không thêm section chỉ để làm trang dài hơn.**

Tính năng compare/history/report tồn tại trong product, nhưng không cần nhồi hết lên landing. Landing chỉ cần giải thích sản phẩm và dẫn vào thí nghiệm.

---

# 8. Header

### Layout

Trái:

- logo mark
- `VECLab`

Center/left nav:

- `Thí nghiệm`
- `Tính năng`
- `Nguồn khoa học`
- `Giới thiệu`

Phải:

- search icon nhỏ
- CTA `Bắt đầu ngay →`

### Style

- Header rất sạch.
- CTA compact, không quá to.
- Logo chữ navy, mark teal/blue.

---

# 9. Hero

## Layout

Desktop: grid `42% / 58%`.

```css
.hero {
  min-height: 570px;
  display: grid;
  grid-template-columns: .84fr 1.16fr;
  align-items: center;
  gap: 56px;
}
```

## Left copy

Eyebrow:

`NỀN TẢNG MÔ PHỎNG HÓA HỌC CHO GIÁO DỤC`

Headline ưu tiên:

> **Thử quy trình.**  
> **Thấy kết quả.**  
> **Hiểu vì sao.**

Accent teal/blue chỉ ở dòng cuối hoặc một keyword, không tô mỗi dòng một màu.

Description ngắn:

> Mô phỏng hóa học và môi trường theo từng thao tác. Thay đổi thông số, quan sát trạng thái và hiểu cơ sở khoa học phía sau kết quả.

CTA:

- Primary: `Bắt đầu trải nghiệm →`
- Secondary: play circle + `Xem cách hoạt động`

## Right visual — product preview card

Không chỉ thả asset hero ra một mình.

Dựng một **product UI frame** dạng browser/app window:

- top bar nhỏ;
- left 45%: `hero-neutralization.svg`;
- right 55%: chart pH;
- bottom: equation + progress / status card.

### Hero data phải hợp spec

Nếu dùng benchmark:

- HCl: `25.00 mL`
- HCl concentration: `0.01000 M`
- temperature: `25.0 °C`
- initial pH*: `2.00000`
- Golden NaOH case: `+25.00 mL NaOH → pH* ≈ 6.995`
- Target exploration center nằm trong `6.5–7.5`, tolerance `±0.2`

**Không dùng pH 5.2 như initial canonical value.** Mockup image chỉ là visual reference, số liệu UI production phải lấy từ spec/engine.

Chart phải render bằng SVG/component.

## Hero background

- nền trắng -> very pale cyan gradient;
- 1 abstract line/squiggle nhỏ ở mép phải;
- không thêm bubble/molecule decoration dày đặc.

---

# 10. Trust strip

Ngay dưới CTA, 3 item nhỏ theo hàng ngang:

- `Không cần đăng ký` — guest mode
- `Học qua thao tác` — deterministic interaction
- `Dựa trên nguồn khoa học`

Icon outline, 18–20px.

Không dùng card lớn.

---

# 11. Three Experiments section

## Heading

Eyebrow: `KHÁM PHÁ NGAY`

H2: `3 thí nghiệm mô phỏng`

Subtitle một dòng, tối đa ~80 ký tự.

## Layout

3 cards ngang, equal width.

```css
.experiment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
```

Card height desktop: `330–380px`.

### Card 01 — Trung hòa axit

Không cần asset riêng thứ 2. Dùng:

- mini pH curve bằng SVG code;
- reuse crop/variation của `hero-neutralization.svg` nếu cần.

Visual trọng tâm: **curve + pH target**.

### Card 02 — Kết tủa Cu²⁺

Dùng `copper-precipitation.svg`.

Copy ngắn:

`Từ dung dịch đến chất rắn`

Nếu hiển thị chemistry route, route NaOH có thể minh họa `Cu(OH)₂(s)`.

Không thêm slider rpm/thời gian như kinetic model vì spec không có kinetics/jar-test control cho MVP.

### Card 03 — Phân loại nhựa

Dùng `plastic-density-separation.svg`.

Visual ưu tiên float/sink hierarchy.

Water-first conceptual split:

- FLOAT: `PP + HDPE`
- SINK: `PS + PET`

Không cần nhét bảng density đầy đủ vào card.

### Hover

- translateY `-6px`
- shadow tăng nhẹ
- arrow button dịch `3px`
- visual scale tối đa `1.02`

Duration `180–240ms`.

---

# 12. Workbench Preview

Đây là section lớn nhất sau hero.

## Heading

Eyebrow: `TRẢI NGHIỆM CHI TIẾT`

H2: `Xem toàn bộ quá trình trên workbench`

One-line description.

## Frame

Dùng composition theo mockup chính thức:

```css
grid-template-columns: 220px minmax(420px, 1fr) 320px;
```

Ba vùng:

1. **Tiến trình** — left rail
2. **Trạng thái hiện tại** — center
3. **Thao tác** — right

Giữ tinh thần mockup nhưng polish hơn:

- border mảnh;
- shadow rất nhẹ;
- section center có hero beaker + metric cards;
- chart và formula ở dưới;
- panel action ở phải.

### Không screenshot UI

Agent phải dựng Workbench bằng component thật, không chèn ảnh screenshot.

### Example acid steps

1. Chuẩn bị dung dịch
2. Thêm bazơ
3. Đo/quan sát pH
4. Phân tích kết quả
5. Kết luận

Không cần đúng wording tuyệt đối nếu application copy đã có source khác, nhưng flow phải phản ánh state/action loop.

---

# 13. Scientific Evidence section

## Goal

Thể hiện tính đáng tin cậy mà không biến landing thành bibliography.

## Layout

- H2 center: `Mỗi kết quả đều có căn cứ`
- subtitle 1 dòng
- 3 compact evidence cards
- `evidence-books.svg` đặt ở mép phải như visual phụ, không chiếm quá 24% section width

### Cards

1. `Mô hình tính toán`
2. `Công thức minh họa`
3. `Nguồn tham khảo`

Mỗi card:

- 1 icon
- title
- 1 dòng description
- optional `Xem chi tiết →`

Không đưa quá nhiều DOI/reference lên landing.

### Scientific wording

Bắt buộc có hiểu ngầm hoặc explicit ở product/detail page rằng:

- mô hình dựa trên tài liệu;
- chưa thay thế đo đạc/jar test/thực nghiệm độc lập;
- chỉ đúng trong phạm vi assumption của scenario.

---

# 14. Final CTA

Dùng một thanh ngang nhẹ, không cần ảnh nền.

Left:

- icon/mark tròn xanh nhạt
- `Sẵn sàng vào lab?`
- 1 dòng hỗ trợ

Right:

- CTA `Bắt đầu ngay →`

Height ~`120–145px`.

Không thêm full-screen hero thứ hai.

---

# 15. Footer

Footer mỏng:

- Logo + tagline trái
- nav center
- social/link icons phải
- copyright

Background trắng.

Không dark footer nặng nề vì tổng thể landing cần sáng.

---

# 16. Motion / animation

Animation phải phục vụ việc hiểu simulation.

### Hero

- app frame entrance: fade + translateY 14px, 500ms
- pH chart line: SVG stroke-dash animation 700–900ms
- indicator dot chạy theo curve 450ms
- beaker: không float vô tận; chỉ micro parallax tối đa 4px theo pointer hoặc scroll

### Experiment cards

- hover lift 6px
- Cu card: precipitate opacity/height animate nhẹ khi hover
- plastic card: floating pieces dịch 4–8px vertical stagger, chỉ khi hover

### Workbench

Khi section vào viewport:

1. step 2 active
2. chart line draw
3. status card fade in

Không autoplay loop dài.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
```

---

# 17. Image density rule

Đây là yêu cầu bắt buộc.

### Mỗi viewport desktop chỉ nên có tối đa:

- 1 visual lớn;
- hoặc 3 visual nhỏ có cùng mục đích trong experiment row.

### Không để:

- hero image + decorative image + background photo cùng lúc;
- 5–6 ảnh cạnh nhau;
- ảnh đặt chỉ để lấp khoảng trống.

Whitespace là một phần của visual hierarchy.

---

# 18. Responsive

Mặc dù ưu tiên PC, repo yêu cầu responsive web.

## ≥ 1280px

Full design như spec.

## 1024–1279px

- page padding 28–32px
- hero `44% / 56%`
- workbench rail giảm 190px / action 280px

## 768–1023px

- hero stack 1 column
- experiments 3 cards có thể 2+1 hoặc horizontal carousel
- workbench preview simplified, center first

## < 768px

- stack toàn bộ
- workbench order: progress → current state → action → feedback
- typography hero 42–48px
- CTA full-width

Không cần biến mobile thành app khác.

---

# 19. Accessibility

- Body text contrast ≥ 4.5:1
- Focus ring luôn visible
- Không encode success/warning chỉ bằng màu
- SVG illustration có `aria-hidden="true"` nếu decorative
- Chart quan trọng phải có textual summary hoặc accessible data table trên product page
- Button hit area tối thiểu 44×44

---

# 20. Component map cho implementation agent

```text
LandingPage
├── Header
│   ├── Brand
│   ├── Nav
│   └── PrimaryCTA
├── Hero
│   ├── HeroCopy
│   ├── CTAGroup
│   ├── TrustStrip
│   └── SimulationPreview
│       ├── ApparatusIllustration
│       ├── PHChart
│       ├── EquationCard
│       └── StatusCard
├── ExperimentsSection
│   └── ExperimentCard × 3
├── WorkbenchSection
│   └── WorkbenchPreview
│       ├── ProgressRail
│       ├── CurrentStatePanel
│       └── ActionPanel
├── EvidenceSection
│   ├── EvidenceCard × 3
│   └── EvidenceIllustration
├── FinalCTA
└── Footer
```

---

# 21. Asset loading

Ưu tiên SVG:

```html
<img src="/assets/hero-neutralization.svg" alt="" aria-hidden="true" />
```

PNG chỉ fallback / OG / môi trường không hỗ trợ SVG.

`evidence-books.svg` có text tiếng Anh ngay trong asset. Nếu muốn localization tuyệt đối, agent có thể redraw books bằng CSS/SVG component và bỏ text khỏi rasterized asset.

---

# 22. Những điều agent không được tự ý thêm

- AI assistant/chatbot
- 3D virtual lab mode
- AR/VR
- teacher dashboard
- chemistry sandbox nhập chất tự do
- số liệu “hiệu suất” marketing không có trong spec
- CO₂ capture / air-quality / green chemistry feature không tồn tại
- stock statistics giả như “100+ publications”
- fake customer logos/testimonials

---

# 23. Checklist trước khi coi landing hoàn thành

- [ ] Landing nhìn vào là hiểu đây là chemistry process simulation.
- [ ] Chỉ 3 experiments thật của VECLab.
- [ ] Không có claim 3D/AI/sandbox.
- [ ] Hero không quá 2 CTA.
- [ ] Không quá 4 visual assets chính trên toàn landing.
- [ ] Charts được code, không chèn ảnh.
- [ ] Workbench phản ánh 3-column desktop layout chính thức.
- [ ] Text ngắn; mỗi section 1 headline + tối đa 1–2 dòng hỗ trợ.
- [ ] Scientific source/evidence hiện diện nhưng không làm trang nặng chữ.
- [ ] Animation ngắn, có mục đích, không spam particle.
- [ ] `prefers-reduced-motion` được hỗ trợ.
- [ ] Mockup numerics được thay bằng dữ liệu từ scenario/spec thực tế.
- [ ] Guest CTA không ép login trước khi thử thí nghiệm.

---

# 24. Reference files trong package

`reference/approved-landing.png`

- Bản landing đã được duyệt về hướng visual.
- Dùng để đối chiếu hierarchy, spacing, section ordering và density.
- **Không copy các con số minh họa nếu trái experiment spec.**

`reference/design-board.png`

- Board bổ sung để hiểu style/product-UI composition.
- Chỉ dùng tham khảo; approved landing vẫn là visual target chính.

`reference/assets-contact-sheet.jpg`

- Preview nhanh toàn bộ asset chính.

---

## Kết luận cho implementation agent

Hãy dựng landing như một **modern scientific product interface**, không phải brochure môi trường và không phải game phòng lab.

Ưu tiên theo thứ tự:

1. hierarchy;
2. product UI;
3. khoa học đúng scope;
4. whitespace;
5. motion;
6. decorative visuals.

Khi phân vân giữa “thêm một hình cho đẹp” và “giữ bố cục sạch”, **giữ bố cục sạch**.
