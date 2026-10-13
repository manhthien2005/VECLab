# Nguồn và cách duy trì bộ skill VECLab

Rà soát ngày 13/10/2026. Đã đọc những file ghi dưới đây và giấy phép tại commit được ghim; đây là chọn lọc cho workflow VECLab, không phải audit toàn bộ sáu dự án hay xác nhận các claim benchmark của họ.

Các skill VECLab được viết riêng cho kiến trúc, yêu cầu và cách phân công của dự án. Chúng tham khảo phương pháp; không vendor mã nguồn, installer, hook hoặc nguyên văn bộ skill upstream. Giấy phép trong bảng là giấy phép của nguồn tham khảo, không thay đổi giấy phép toàn repo VECLab.

## Phần chọn dùng

| Nguồn được ghim | File đã đọc | Cách dùng trong VECLab | Phần chưa đưa vào |
| --- | --- | --- | --- |
| [Matt Pocock skills](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336) | `skills/productivity/grilling/SKILL.md`, `skills/productivity/handoff/SKILL.md`, `skills/engineering/implement/SKILL.md`, `skills/engineering/tdd/SKILL.md` | Hỏi quyết định còn mở sau khi đọc facts; bàn giao bằng tham chiếu tài liệu; test hành vi và expected độc lập. Dùng ở handoff, implement và contract. | Không hỏi lại quyết định đã chốt, không ép xin duyệt mọi test hay đổi toàn bộ workflow. |
| [Ponytail](https://github.com/DietrichGebert/ponytail/tree/2961b52fc1fe6a5a87c7a959a79512e5c2f3ffe5) | `skills/ponytail/SKILL.md`, `skills/ponytail-review/SKILL.md`, `README.md` | Thay đổi nhỏ nhưng giải quyết đủ; đọc caller; ưu tiên helper/stdlib/dependency hiện có; finding phải có tình huống lỗi cụ thể. Dùng ở implement và verify. | Không thêm session modes hoặc coi số dòng ít là lý do bỏ validation, accessibility hay bảo mật. |
| [Tester Army e2e](https://github.com/tester-army/e2e/tree/4b4b29727dde17eb135b030c031c10607a2d6299) | `skills/e2e/SKILL.md`, `skills/create-verification-skill/SKILL.md` | Kiểm tra hành trình người dùng trên giao diện thực; giữ bước tái hiện, assertion và evidence khi lỗi. Dùng ở verify/ma trận kiểm chứng. | Tiếp tục dùng Playwright hiện có; chưa cài runner, MCP hay nhà cung cấp AI của upstream. |
| [ECC](https://github.com/affaan-m/ECC/tree/b92f181b3b748d1abbc2afd94af6aa7d8c8fca29) | `.agents/skills/verification-loop/SKILL.md` | Kiểm chứng có lệnh/kết quả thật, kết hợp diff review với type/lint/test/build. Dùng ở verify và handback. | Không thêm bộ hook/agent tự vận hành, coverage quota hoặc chạy lại toàn suite theo đồng hồ. |
| [Addy Osmani agent-skills](https://github.com/addyosmani/agent-skills/tree/1be8e34187e34647bb83adc3a1323b26ae6f6abe) | `skills/incremental-implementation/SKILL.md`, `skills/api-and-interface-design/SKILL.md`, `skills/source-driven-development/SKILL.md` | Chia task kiểm chứng được; khóa interface tại ranh giới cần thiết; kiểm tra version/docs thật. Dùng ở implement, contract và plan Jar. | Không áp đặt framework, versioning convention hoặc feature flags nếu task không cần. |
| [Graphify](https://github.com/Graphify-Labs/graphify/tree/e8eb76e797bed4f324bf0e1c262984a525aaab3e) | `README.md`, `graphify/skill-codex.md` | Phân biệt quan hệ có bằng chứng source với quan hệ suy luận khi audit. Dùng ở implement và contract. | Chưa cài CLI, graph store hay pipeline đọc tài liệu bằng LLM; tra import/caller bằng công cụ tìm source hiện có trước. |

## Giấy phép đã đối chiếu

- Matt Pocock: [MIT, © 2026 Matt Pocock](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/LICENSE).
- Ponytail: [MIT, © 2026 DietrichGebert](https://github.com/DietrichGebert/ponytail/blob/2961b52fc1fe6a5a87c7a959a79512e5c2f3ffe5/LICENSE).
- Tester Army: [Apache-2.0](https://github.com/tester-army/e2e/blob/4b4b29727dde17eb135b030c031c10607a2d6299/LICENSE), [NOTICE, © 2026 Tester Army, Inc.](https://github.com/tester-army/e2e/blob/4b4b29727dde17eb135b030c031c10607a2d6299/NOTICE).
- ECC: [MIT, © 2026 Affaan Mustafa](https://github.com/affaan-m/ECC/blob/b92f181b3b748d1abbc2afd94af6aa7d8c8fca29/LICENSE).
- Addy Osmani: [MIT, © 2025 Addy Osmani](https://github.com/addyosmani/agent-skills/blob/1be8e34187e34647bb83adc3a1323b26ae6f6abe/LICENSE).
- Graphify: [Apache-2.0](https://github.com/Graphify-Labs/graphify/blob/e8eb76e797bed4f324bf0e1c262984a525aaab3e/LICENSE), [NOTICE, © 2026 Safi Shamsi and Graphify contributors](https://github.com/Graphify-Labs/graphify/blob/e8eb76e797bed4f324bf0e1c262984a525aaab3e/NOTICE); một số phần lịch sử giữ [MIT](https://github.com/Graphify-Labs/graphify/blob/e8eb76e797bed4f324bf0e1c262984a525aaab3e/LICENSE-MIT).

Nếu về sau copy/adapt nội dung đáng kể hoặc vendor code, giữ copyright/license và NOTICE áp dụng của đúng file/commit đó; không suy rằng chỉ đặt link nguồn là đủ cho mọi trường hợp.

## Dùng lâu dài

Ba entry point là `veclab-handoff`, `veclab-implement`, `veclab-verify` trong `.agents/skills`; contract chung giữ chi tiết để các skill ngắn và không mâu thuẫn. Local dùng cơ chế skill của runtime; ChatGPT web đọc file theo brief. Không cần tải lại sáu repo khi thực hiện task.

Chỉ cập nhật khi workflow gặp lỗi thực, stack/contract đổi hoặc upstream có cải tiến liên quan. Người sửa đọc diff từ SHA đã ghim, ghi lý do/phần chọn dùng/SHA mới, kiểm tra links và frontmatter rồi thử tình huống bị ảnh hưởng. Không chạy installer/hook upstream hoặc tự đồng bộ cả bộ. Thay đổi skill đi cùng PR như thay đổi tài liệu dự án.

Giữ chính sách sản phẩm và contract kỹ thuật ở spec/code; skill chỉ hướng dẫn cách làm. Khi pH hoặc hấp phụ được triển khai, brief trỏ tới spec của bài đó; không sao chép toàn bộ quy trình Jar vào skill chung.

## Kiểm tra khi tạo bộ — 13/10/2026

Đã thử bằng tác nhân chỉ đọc, không triển khai ứng dụng:

- Handoff: baseline đã coi Task 1 gần sẵn sàng và nói không cần thêm skill/workflow; thiếu bước chuẩn bị riêng mà người dùng yêu cầu. Khi đọc skill/contract, tác nhân xác định đúng còn thiếu source chia sẻ, commit của bộ skill/contract và xác nhận năng lực web.
- Implementation: baseline đã giữ đúng scope Task 1 và từ chối framework chung; sau khi đọc skill vẫn giữ quyết định đó, bổ sung rõ evidence truy cập source và handback patch-only. Đây là kiểm tra khả năng dùng tài liệu chung, không phải bằng chứng baseline code kém.
- Verification: cả baseline và lần dùng skill đều từ chối handback thiếu diff/log và claim khoa học/UI/cloud vượt evidence. Lần dùng skill phát hiện hai câu có thể gây hiểu nhầm: patch chưa có head SHA và full suite không phải gate mọi task nhỏ; đã sửa đúng hai điểm trong contract/skill.

Frontmatter ba skill được kiểm tra bằng `skill-creator/scripts/quick_validate.py`; links nội bộ và whitespace được kiểm tra riêng. Những bước này kiểm chứng bộ hướng dẫn; không phải test UI, cloud hoặc validation thực nghiệm của Jar.
