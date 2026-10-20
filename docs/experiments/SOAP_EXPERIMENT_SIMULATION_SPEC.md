# SOAP EXPERIMENT SIMULATION SPECIFICATION (QUY TRÌNH & RÀNG BUỘC MÔ PHỎNG THÍ NGHIỆM XÀ PHÒNG HÓA)

Tài liệu này định nghĩa toàn bộ quy trình, thông số kỹ thuật, ràng buộc đầu vào, biến số vật lý/hóa học và logic cảnh báo lỗi cho chương trình mô phỏng phản ứng xà phòng hóa (Cold Process Soap Making).

---

## 1. THÔNG SỐ VÀ GIỚI HẠN DỤNG CỤ (EQUIPMENT SPECIFICATIONS & CONSTRAINTS)

Để đảm bảo tính thực tế và an toàn vật lý trong mô phỏng, tất cả các dụng cụ chứa đều có giới hạn thể tích hoạt động tối đa (Safety Limit) là **70% - 75%** dung tích danh định nhằm tránh bắn/trào hóa chất khi khuấy hoặc tỏa nhiệt.

| Dụng cụ | Dung tích danh định ($V_{\text{nominal}}$) | Thể tích chứa tối đa an toàn ($V_{\text{max}}$) | Chất liệu chịu nhiệt / Kháng hóa chất | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Cốc thủy tinh pha NaOH** | 200 mL | **140 mL (70%)** | Thủy tinh Borosilicate / Nhựa HDPE | Pha NaOH vào nước (Tỏa nhiệt mạnh) |
| **Cốc thủy tinh pha NaOH (Lớn)** | 500 mL | **350 mL (70%)** | Thủy tinh Borosilicate / Nhựa HDPE | Lô thí nghiệm lớn hơn |
| **Cốc khuấy trộn Dầu & Alkali**| 200 mL | **150 mL (75%)** | Thủy tinh / Thép không gỉ / Thủy tinh | Dành cho lô mini ($<100\text{g}$ dầu) |
| **Cốc / Trộn chính** | 1000 mL (1 Lít) | **750 mL (75%)** | Thép không gỉ / Plastic PP / HDPE | Dành cho lô tiêu chuẩn ($500\text{g}$ dầu) |
| **Khuôn Silicone** | 1000 mL | **800 mL** | Silicone chịu nhiệt ($<200^\circ\text{C}$) | Định hình bánh xà phòng |
| **Cân điện tử** | Max 3000 g | Độ chính xác $0.1\text{g}$ | - | Đo khối lượng nguyên liệu |
| **Nhiệt kế** | $-10^\circ\text{C} \rightarrow 110^\circ\text{C}$ | Accuracy $\pm 0.5^\circ\text{C}$ | Thủy ngân/Điện tử inox | Đo nhiệt độ dung dịch |

> **Ràng buộc toán học trong mô phỏng:** 
> Nếu $\sum V_{\text{chất lỏng}} > V_{\text{max}}$ của dụng cụ $\rightarrow$ Cảnh báo Tràn Cốc (Overflow Error / Hazard Violation).

---

## 2. RÀNG BUỘC ĐẦU VÀO NGUYÊN LIỆU (INPUT CONSTRAINTS & VALIDATION RULES)

Mô phỏng phải kiểm tra (validate) các biến đầu vào của người dùng trước khi chạy phản ứng:

### 2.1. Ràng buộc tham số hệ thống
* **Loại Dầu:**
  * Dầu Ô-liu (Olive Oil): $\text{SAP} = 0.136\text{ g NaOH/g dầu}$
  * Dầu Dừa (Coconut Oil): $\text{SAP} = 0.183\text{ g NaOH/g dầu}$
  * Dầu Cọ (Palm Oil): $\text{SAP} = 0.142\text{ g NaOH/g dầu}$
* **Khối lượng dầu ($m_{\text{oil}}$):** Min $50\text{ g}$ - Max $1000\text{ g}$ (Khuyến nghị mặc định: $500\text{ g}$).
* **Tỷ lệ Superfat ($S$):** Min $0\%$ - Max $20\%$ (Khuyến nghị: $5\%$).
* **Tỷ lệ Nước / Dầu ($R_{\text{water}}$):** Min $25\%$ - Max $45\%$ (Khuyến nghị: $33\% - 35\%$).
* **Nhiệt độ ban đầu dầu & kiềm ($T_{\text{init}}$):** Min $20^\circ\text{C}$ - Max $80^\circ\text{C}$ (Khuyến nghị: $40^\circ\text{C} - 50^\circ\text{C}$).

### 2.2. Công thức tính toán lý thuyết (Theoretical Formulas)
1. **Khối lượng NaOH lý thuyết:**
   $$m_{\text{NaOH\_theoretical}} = m_{\text{oil}} \times \text{SAP}$$
2. **Khối lượng NaOH thực tế (có Superfat):**
   $$m_{\text{NaOH}} = m_{\text{NaOH\_theoretical}} \times (1 - S)$$
3. **Khối lượng Nước ($m_{\text{water}}$):**
   $$m_{\text{water}} = m_{\text{oil}} \times R_{\text{water}}$$
4. **Nồng độ dung dịch NaOH:**
   $$C_{\text{NaOH}} = \frac{m_{\text{NaOH}}}{m_{\text{NaOH}} + m_{\text{water}}} \times 100\%$$
   *(Khoảng an toàn chuẩn: $25\% - 33\%$)*.

---

## 3. LOGIC CÁC BƯỚC MÔ PHỎNG & TRẠNG THÁI VẬT LÝ (STATE MACHINE)

Mô phỏng chuyển đổi qua 9 bước, cập nhật liên tục các thông số `Temperature` ($^\circ\text{C}$), `Viscosity` (cP), `pH`, và `State`:

### Bước 1: Chuẩn bị An toàn
* **Ràng buộc:** Bắt buộc người dùng chọn thiết bị bảo hộ (Kính, găng tay, khẩu trang). Nếu thiếu $\rightarrow$ Cảnh báo chấn thương kiềm.

### Bước 2: Pha Dung dịch NaOH (Tỏa nhiệt)
* **Thao tác:** Đổ NaOH vào Nước. *(Nghiêm cấm làm ngược lại - nếu đổ Nước vào NaOH $\rightarrow$ Cảnh báo bắn hóa chất nguy hiểm)*.
* **Mô phỏng nhiệt độ dung dịch NaOH:** 
  $$T_{\text{lye}} = T_{\text{room}} + \Delta T_{\text{exothermic}}$$
  *(Hòa tan $65\text{g}$ NaOH vào $175\text{g}$ nước làm nhiệt độ tăng vọt từ $25^\circ\text{C} \rightarrow 75^\circ\text{C} - 85^\circ\text{C}$)*.
* **Hành động người dùng:** Chờ dung dịch nguội về $40^\circ\text{C} - 50^\circ\text{C}$.

### Bước 3: Chuẩn bị Dầu
* **Thao tác:** Đun nhẹ dầu đến $40^\circ\text{C} - 50^\circ\text{C}$ để cân bằng nhiệt độ với dung dịch kiềm ($\Delta T = \vert{}T_{\text{oil}} - T_{\text{lye}}\vert{} \le 5^\circ\text{C}$).

### Bước 4: Trộn & Khuấy (Phản ứng chính)
* **Thao tác khuấy:** Khuấy máy (Blender) hoặc Khuấy tay (Manual).
* **Mô phỏng Độ nhớt ($\eta$) theo thời gian khuấy ($t$):**
  * Ban đầu (Thấp): $\eta \approx 50 - 100 \text{ cP}$ (Lỏng như dầu).
  * Đạt **Trace (Vệt xà phòng)**: $\eta \approx 1000 - 3000 \text{ cP}$ (Sệt như bột bánh chảo/sữa chua).
  * Thời gian đạt Trace ($t_{\text{trace}}$):
    * Máy khuấy cầm tay: $1 - 5 \text{ phút}$.
    * Khuấy tay: $20 - 40 \text{ phút}$.
* **Quy tắc trào/đông cứng:**
  * Nếu khuấy máy quá lâu ($>10 \text{ phút}$) $\rightarrow$ Lỗi **Seizing** (Đông cứng ngay trong cốc, không thể đổ khuôn).

### Bước 5: Đổ khuôn (Molding)
* Thể tích hỗn hợp $V_{\text{total}} = \frac{m_{\text{oil}} + m_{\text{NaOH}} + m_{\text{water}}}{\rho_{\text{soap}}}$ (với khối lượng riêng $\rho \approx 1.05 \text{ g/cm}^3$).
* Kiểm tra $V_{\text{total}} \le V_{\text{mold}}$.

### Bước 6: Giai đoạn Gel (Saponification & Self-heating)
* Trong khuôn, phản ứng xà phòng hóa tiếp diễn tỏa nhiệt nội tại: Nhiệt độ bánh tăng lên $60^\circ\text{C} - 70^\circ\text{C}$ (Giai đoạn Gel), sau đó tự nguội dần về nhiệt độ phòng trong 12–24 giờ.

### Bước 7: Tháo khuôn & Cắt (Unmolding & Cutting)
* Sau 24–48 giờ, xà phòng đạt độ cứng đủ để cắt.

### Bước 8: Ủ (Curing Phase)
* Thời gian: 4 – 6 tuần.
* Mô phỏng sự bay hơi nước: Khối lượng nước giảm dần $\sim 60\% - 80\%$ lượng nước ban đầu.
* Khối lượng bánh thành phẩm giảm từ $740\text{g} \rightarrow \approx 550\text{g} - 570\text{g}$.

### Bước 9: Kiểm tra Sản phẩm (pH & Quality Check)
* **pH ban đầu (Mới đổ khuôn):** $\approx 12 - 14$ (Gây kích ứng/bỏng).
* **pH sau ủ (Thành phẩm):** $\approx 9 - 10$ (An toàn cho da).

---

## 4. BẢNG MÃ LỖI & CẢNH BÁO MÔ PHỎNG (SIMULATION ERROR CODES)

| Mã lỗi | Tên lỗi | Nguyên nhân logic trong mô phỏng | Kết quả / Hiện tượng hiển thị |
| :--- | :--- | :--- | :--- |
| `ERR_OVERFLOW` | Tràn cốc chứa | Tổng thể tích vượt quá $V_{\text{max}}$ của cốc | Hóa chất trào ra bàn thí nghiệm |
| `ERR_POUR_WATER_TO_LYE` | Sai quy trình pha kiềm | Đổ nước vào NaOH rắn thay vì ngược lại | Bắn dung dịch kiềm nóng nguy hiểm |
| `ERR_SEIZING` | Bị đông cứng sớm | Khuấy máy liên tục quá nhiệt hoặc quá thời gian | Hỗn hợp bị vón cục cứng không đổ khuôn được |
| `ERR_LYE_HEAVY` | Dư kiềm quá mức | $S < 0\%$ hoặc cân dư NaOH | Xà phòng có pH $> 11$, gây rát/bỏng da |
| `ERR_RANCID_OILY` | Thừa dầu / Thiếu kiềm | $S > 15\%$ hoặc cân thiếu NaOH | Xà phòng bị mềm, chảy dầu, dễ mốc/ôi |
| `ERR_PHASE_SEP` | Tách lớp | $\Delta T = \vert{}T_{\text{oil}} - T_{\text{lye}}\vert{} > 15^\circ\text{C}$ khi trộn | Dầu kiềm không hòa quyện, tách đôi |

---

## 5. ĐẦU RA MÔ PHỎNG CHO CODE (OUTPUT DATA STRUCTURE FOR CODE)

Dữ liệu mô phỏng cần xuất ra định dạng JSON để giao diện frontend vẽ biểu đồ (Chart.js / Recharts) hoặc hiển thị animation:

```json
{
  "inputs": {
    "oil_type": "olive",
    "oil_mass_g": 500,
    "superfat_ratio": 0.05,
    "water_ratio": 0.35,
    "vessel_capacity_ml": 1000
  },
  "calculated": {
    "naoh_mass_g": 64.6,
    "water_mass_g": 175.0,
    "total_initial_mass_g": 739.6,
    "final_cured_mass_g": 564.6
  },
  "timeline_simulation": [
    { "time_min": 0, "step": "Mixing", "temp_c": 45.0, "viscosity_cp": 80, "ph": 13.5, "status": "Liquid" },
    { "time_min": 5, "step": "Trace", "temp_c": 48.2, "viscosity_cp": 1500, "ph": 13.0, "status": "Trace Reached" },
    { "time_min": 1440, "step": "Unmold", "temp_c": 25.0, "viscosity_cp": 50000, "ph": 11.5, "status": "Solid Block" },
    { "time_min": 40320, "step": "Cured (4 Weeks)", "temp_c": 25.0, "viscosity_cp": 100000, "ph": 9.5, "status": "Safe Soap" }
  ]
}