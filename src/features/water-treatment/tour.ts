'use client'

import { type WorkbenchTourStep } from '@/features/workbench/tour.js'

/**
 * Tour từng bước cho workbench Xử lý nước Fe/Zn/Pb. Cùng pattern với
 * `WORKBENCH_TOUR` của Jar Test: mỗi step spotlight một vùng của workbench
 * (header, shelf, simulation, controls, notebook) và gợi ý thao tác tiếp.
 */
export const WT_WORKBENCH_TOUR: ReadonlyArray<WorkbenchTourStep> = [
  {
    area: 'header',
    title: 'Mục tiêu & trạng thái lượt',
    description:
      'Mở Mục tiêu & phạm vi để xem chuẩn Cột A QCVN 40:2025/BTNMT. Nút Báo cáo ở header mở tóm tắt solver end-to-end sau khi có dữ liệu.',
  },
  {
    area: 'shelf',
    title: 'Mẫu & dụng cụ',
    description:
      'Kệ bên trái giới thiệu mẫu Fe/Zn/Pb, NaOH 1 M, HCl 1 M và máy đo pH. Bạn thao tác với chúng qua Thao tác bên phải. Có thể mở lại hướng dẫn này bất cứ lúc nào.',
  },
  {
    area: 'simulation',
    title: 'Khu vực thực hành',
    description:
      'Cốc thí nghiệm ảo phản ánh pH và lượng kết tủa. Bước trên đầu (Chọn mẫu, Kiềm hóa & lọc, Trung hòa) mở nhóm thao tác tương ứng. pH và kết tủa là kết quả solver, không phải giá trị user tự nhập.',
  },
  {
    area: 'controls',
    title: 'Thao tác theo bước',
    description:
      'Bảng bên phải gom 3 nhóm: Chọn mẫu & đo pH, Kiềm hóa & lọc (Khuấy → Lắng → Lọc), Trung hòa & xác nhận. Mỗi nút có dòng giải thích nếu bị khóa — đọc kỹ trước khi bấm.',
  },
  {
    area: 'notebook',
    title: 'Sổ đo & lịch sử',
    description:
      'Sổ thực hành lưu composition, pH ban đầu và lịch sử thao tác. Bước 3 có thêm bảng lịch sử pH riêng nằm trong nhóm Trung hòa để bạn thấy từng lần đo sau khuấy.',
  },
] as const
