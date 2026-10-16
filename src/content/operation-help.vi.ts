/** Operating instructions only: no model predictions, scores or session state. */
export type OperationHelpTopic = {
  label: string
  points: readonly string[]
  guideAnchor: string
}

export const JAR_OPERATION_HELP: Record<'baseline' | 'prepare' | 'dose' | 'program' | 'results', OperationHelpTopic> = {
  baseline: {
    label: 'Cách đo mẫu ban đầu',
    points: [
      'Trong Thao tác → Đo mẫu ban đầu, bấm Đo mẫu ban đầu trước khi chạy chương trình.',
      'Chỉ đo một lần cho cả mẻ. Số đo được lưu trong Sổ thực hành để đối chiếu với từng cốc.',
    ],
    guideAnchor: 'jar-step-baseline',
  },
  prepare: {
    label: 'Cách chuẩn bị cốc',
    points: [
      'Chọn cốc, chọn pH ban đầu rồi bấm Chuẩn bị cốc. Lặp lại với các cốc muốn khảo sát.',
      'pH là điều kiện của mẫu đã chuẩn bị sẵn, không phải phép đo pH cuối.',
      'Hoàn tất thiết kế các cốc trước khi bắt đầu khuấy cả mẻ.',
    ],
    guideAnchor: 'jar-step-prepare',
  },
  dose: {
    label: 'Cách cấp phèn',
    points: [
      'Kiểm tra cốc đang chọn trước khi thêm.',
      'Liều tăng được cộng vào tổng: thêm 50 rồi 100 mg/L tạo tổng 150 mg/L.',
      'Kiểm tra tổng liều của các cốc trước khi bắt đầu khuấy cả mẻ.',
    ],
    guideAnchor: 'jar-step-dose',
  },
  program: {
    label: 'Cách chạy cả mẻ',
    points: [
      'Đo mẫu đầu và hoàn tất pH, liều của các cốc trước khi xác nhận chạy.',
      'Chạy khuấy nhanh, khuấy chậm rồi lắng. Chương trình áp dụng cho cả dàn, không chỉ cốc đang chọn.',
      'pH và liều khóa khi bắt đầu khuấy. Thời gian hiển thị là thời gian mô phỏng.',
    ],
    guideAnchor: 'jar-step-program',
  },
  results: {
    label: 'Cách đo và ghi kết quả',
    points: [
      'Sau khi lắng xong, chọn từng cốc và đo độ đục cuối. Đo một cốc không đo hộ các cốc khác.',
      'Dùng NTU đầu và cuối hợp lệ để tự tính, rồi bấm Ghi đáp số của đúng cốc.',
      'Chọn một cốc làm phương án nộp. Chỉ xác nhận Nộp bài mới khóa lượt.',
    ],
    guideAnchor: 'jar-step-measure',
  },
}

export const EXTRACTION_OPERATION_HELP: Record<'add' | 'program' | 'transfer' | 'isolate' | 'measure' | 'declare', OperationHelpTopic> = {
  add: {
    label: 'Cách cấp dung dịch',
    points: [
      'Kiểm tra bình đang chọn, loại dung dịch và thể tích trước khi bấm thêm.',
      'Mỗi lần cấp được cộng vào lượng dịch trong bình. Dung tích còn lại hiển thị ngay dưới ô thể tích.',
      'Bạn tự chọn thuốc thử và lượng cấp theo mục đích khảo sát.',
    ],
    guideAnchor: 'extraction-step-add',
  },
  program: {
    label: 'Cách trộn và phân lớp',
    points: [
      'Chọn bình cần thao tác. Khi có hai pha, trộn tạo tiếp xúc giữa chúng.',
      'Trộn, xả áp rồi để phân lớp là ba thao tác riêng. Xả áp và phân lớp không thay thế trộn.',
      'Sau khi cấp hoặc chuyển thêm dịch, kiểm tra trạng thái trộn trước khi thu pha.',
    ],
    guideAnchor: 'extraction-step-mix',
  },
  transfer: {
    label: 'Cách chuyển dịch',
    points: [
      'Kiểm tra bình nguồn đang chọn và Bình nhận.',
      'Chọn pha nước, pha hữu cơ hoặc toàn mẫu theo mục đích của bạn; nhập thể tích muốn chuyển.',
      'Kiểm tra lượng dịch khả dụng và dung tích bình nhận trước khi chuyển. Thu một pha sẽ giữ phần còn lại ở bình nguồn.',
    ],
    guideAnchor: 'extraction-step-transfer',
  },
  isolate: {
    label: 'Cách thu chất rắn',
    points: [
      'Chọn bình có rắn và bình nhận trước khi lọc. Lọc chuyển phần rắn, dịch lọc còn ở bình nguồn.',
      'Cô dung môi và làm khô tác động lên bình đang chọn, không phải bình nhận.',
      'Kiểm tra điều kiện vận hành cạnh các nút trước khi thực hiện.',
    ],
    guideAnchor: 'extraction-step-isolate',
  },
  measure: {
    label: 'Cách đo pH và cân',
    points: [
      'Chọn bình rồi bấm Đo pH hoặc Cân mẫu. pH cần có pha nước; số đo chỉ xuất hiện sau khi đo.',
      'Với sản phẩm, làm khô và cân sau thao tác cuối. Có thay đổi trên bình sau cân thì cần cân lại.',
      'Phép đo được lưu trong Sổ thực hành, chưa tự trở thành khai báo sản phẩm.',
    ],
    guideAnchor: 'extraction-step-measure',
  },
  declare: {
    label: 'Cách khai báo sản phẩm',
    points: [
      'Chọn chất A/B/N và đúng bình sản phẩm muốn khai báo.',
      'Dùng số cân của bình đó để tự tính và nhập đáp số.',
      'Bấm Lưu sản phẩm; đáp số đang nhập chưa được coi là đã lưu. Kiểm tra cả ba sản phẩm trước khi nộp.',
    ],
    guideAnchor: 'extraction-step-declare',
  },
}
