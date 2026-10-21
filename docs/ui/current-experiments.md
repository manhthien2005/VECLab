# Danh sách bài đang phục vụ

Cập nhật ngày 21/10/2026: chỉ phục vụ năm bài trong bảng dưới đây; landing và thư viện dùng cùng danh sách.

| Bài | Route thực hành | Release |
| --- | --- | --- |
| Jar Test | `/simulate/jar-test` | `jar-test@0.1.0` |
| Chiết tách axit–bazơ | `/simulate/acid-base-extraction` | `acid-base-extraction@0.2.0` |
| Phân loại nhựa nguyên sinh | `/simulate/plastic-density-separation` | `plastic-separation@0.2.0` (đang hoàn thiện trên nhánh Hoang) |
| Xà phòng hóa (cold process) | `/simulate/cold-process-soap` | `cold-process-soap@0.2.0` |
| Xử lý nước Fe/Zn/Pb | `/simulate/water-treatment` | `wt-v0-alpha` — trạng thái chỉ giữ trong bộ nhớ; chuẩn bị mẫu dùng PHREEQC đã đóng gói cho Windows x64 và Linux x64 |

Jar Test, chiết tách, nhựa và xà phòng cùng lưu IndexedDB, kể cả khi đăng nhập. Lab/account chỉ liệt kê lượt đúng bài; báo cáo và sổ đo mở từ workbench bằng `view=report` và `view=notebook`. `/attempts/[id]` và `/reports/[id]` đọc metadata local rồi chuyển đến đúng bài. Lượt đã nghỉ có thông báo; dữ liệu không bị xóa hoặc đổi nhãn.

Extraction v1 vẫn được đọc bằng engine/profile khóa đúng phiên bản. `legacy-engine.ts` thuộc **bài chiết tách hiện hành**, không phải bộ trung hòa axit đã bỏ; v2 còn dùng phần cân bằng của nó. Không xóa chỉ theo tên “legacy”.

So sánh hiện dành cho báo cáo Jar hoàn tất, cùng release/profile/schema/model/scoring/content/evidence/projection. Giá trị thiếu là N/A. Auth/profile là chức năng tài khoản riêng, không hứa đồng bộ lượt.

Migration và SQL fixture là lịch sử hợp đồng dữ liệu; giữ nguyên, không chỉnh sửa remote Supabase trong task dọn source. Nguồn khoa học: `src/content/evidence/jar-test.ts`, `acid-base-extraction.ts`, `soap.ts` và `plastic-density-separation.ts`. Kiểm tra số học không phải kiểm chứng thực nghiệm.
