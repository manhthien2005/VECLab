/**
 * Acid neutralization — Vietnamese content bundle for release 1.0.0.
 *
 * Content decisions (docs/web-application-scope.md §9):
 *   - `vi` is the only locale in MVP; keys are stable and versioned with the release.
 *   - Domain returns messageKey/code only; text lives here, never in engine code.
 *
 * Wording gates enforced by tests/unit/content-wording.test.ts, from
 * docs/experiments/acid-neutralization-spec.md §21 and
 * docs/verification-and-acceptance.md §20:
 *   - no "probability"/"xác suất thành công thực tế" for scores
 *   - no "đạt pháp luật" / compliance claim
 *   - no "liều nước thải" / dosing prescription
 *   - pH is always labelled modelled concentration pH (pH*), per IUPAC-PH
 *   - achievement percent is a goal-attainment level, not a success probability
 *   - cost/safety indices are labelled pedagogical conventions, not prices
 */

export const ACID_NEUTRALIZATION_LOCALE = 'vi' as const
export const ACID_NEUTRALIZATION_CONTENT_VERSION = '1.0.0' as const

export const ACID_STRINGS = {
  'scenarios.acid-neutralization.title': 'Trung hòa axit',
  'scenarios.acid-neutralization.summary':
    'Trung hòa 25,00 mL dung dịch HCl 0,01000 mol/L bằng NaOH, Ca(OH)₂ hoặc Na₂CO₃ ở 25 °C, đo pH mô phỏng sau mỗi lần thêm và đánh giá mức đạt mục tiêu.',
  // Bối cảnh cho trang chi tiết thí nghiệm (§4.2 "Bối cảnh và mục tiêu"). Khác
  // `summary` ở chỗ nó nói vì sao thao tác này đáng học, chứ không liệt kê điều kiện.
  'scenarios.acid-neutralization.context':
    'Nước thải công nghiệp thường chứa axit dư và phải được trung hòa trước khi chuyển sang công đoạn xử lý tiếp theo. Trong thực tế, người vận hành không đổ một lần cho đủ: họ thêm từng liều nhỏ, khuấy, chờ số đọc ổn định rồi mới quyết định liều kế tiếp, vì thêm quá tay vừa tốn hóa chất vừa có thể đưa pH vượt dải cho phép. Thí nghiệm này mô phỏng đúng nhịp đó — mỗi thao tác đều được ghi lại và mỗi con số đều đi kèm công thức đã dùng.',
  'scenarios.acid-neutralization.learning-goal':
    'Mục tiêu học tập: hiểu vì sao điểm tương đương của ba chất trung hòa không giống nhau, vì sao Na₂CO₃ cần nhiều đương lượng hơn trên cùng một thể tích mẫu, và vì sao đo trước khi khuấy hoặc trước khi số đọc ổn định sẽ cho kết quả không mô tả mẫu hiện tại.',

  'scenarios.acid-neutralization.ph-label': 'pH mô phỏng (pH*)',
  'scenarios.acid-neutralization.ph-explanation':
    'pH* là pH mô hình tính từ nồng độ H⁺ với hệ số hoạt độ bằng 1. IUPAC định nghĩa pH theo hoạt độ H⁺, nên giá trị này là kết quả mô phỏng, không phải phép đo bench.',
  'scenarios.acid-neutralization.target-label': 'Mục tiêu pH*',
  'scenarios.acid-neutralization.target-band':
    'Dải đạt nội bộ 6,795–7,195 quanh tâm 6,995. Đây là rubric sư phạm, không phải ngưỡng quy định và không phải tuyên bố nước an toàn.',

  'routes.naoh.label': 'NaOH',
  'routes.naoh.description':
    'Dung dịch NaOH 0,01000 mol/L (1 đương lượng). Base mạnh, pH* biến thiên liên tục qua điểm tương đương.',
  'routes.calcium-hydroxide.label': 'Ca(OH)₂',
  'routes.calcium-hydroxide.description':
    'Dung dịch Ca(OH)₂ trong, đã lọc và chuẩn hóa, 0,005000 mol/L (2 đương lượng). Phức CaOH⁺ làm pH* tại điểm tương đương lệch nhẹ so với NaOH.',
  'routes.calcium-hydroxide.clarification':
    'Mô hình chỉ áp dụng cho dung dịch trong đã chuẩn hóa, không áp dụng cho vôi sữa hoặc huyền phù.',
  'routes.sodium-carbonate.label': 'Na₂CO₃',
  'routes.sodium-carbonate.description':
    'Dung dịch Na₂CO₃ 0,005000 mol/L (2 đương lượng danh nghĩa). Hệ carbon kín: đủ đương lượng danh nghĩa không có nghĩa là đạt pH* mục tiêu.',

  'actions.select_route': 'Chọn chất trung hòa',
  'actions.calibrate_meter': 'Hiệu chuẩn máy đo pH',
  'actions.add_base': 'Thêm dung dịch base',
  'actions.mix': 'Khuấy trộn mẫu',
  'actions.wait_for_stable_reading': 'Chờ số đọc ổn định',
  'actions.measure_ph': 'Đo pH',
  'actions.add_correction_acid': 'Thêm HCl hiệu chỉnh',
  'actions.complete': 'Hoàn thành lượt',

  // Nhãn bước tiến trình (§4.6 nhóm 2). `phase` là giá trị enum của engine; nhãn ở đây
  // để người học biết bước đó nghĩa là gì, không phải để engine quyết định bước.
  'phases.setup': 'Chưa bắt đầu',
  'phases.ready': 'Đã thêm thuốc thử, chờ khuấy',
  'phases.mixed': 'Đã khuấy, chờ số đọc ổn định',
  'phases.stable': 'Số đọc ổn định, có thể đo',
  'phases.completed': 'Lượt đã hoàn thành',

  // Công thức và dữ liệu trung gian (§4.6 nhóm 9). Ba phương trình cân bằng điện tích
  // dưới đây đúng theo từng route trong equilibrium.ts — chúng khác nhau, và nói
  // chung một công thức cho cả ba sẽ sai với Ca(OH)₂ (có phức CaOH⁺) và Na₂CO₃ (có
  // hai nấc carbonate).
  'formulas.ph-definition':
    'pH* = −log₁₀[H⁺], với [H⁺] tính bằng mol/L và hệ số hoạt độ lấy bằng 1.',
  'formulas.kw':
    '[OH⁻] = K_w / [H⁺], với K_w = 1,023 × 10⁻¹⁴ ở 25 °C (pK_w = 13,990).',
  'formulas.charge-balance.naoh':
    'Cân bằng điện tích cho NaOH: [H⁺] + [Na⁺] − [OH⁻] − [Cl⁻] = 0. Nghiệm [H⁺] tìm bằng phương pháp chia đôi trên thang pH từ −2 đến 16.',
  'formulas.charge-balance.calcium-hydroxide':
    'Cân bằng điện tích cho Ca(OH)₂: [H⁺] + 2[Ca²⁺] + [CaOH⁺] − [OH⁻] − [Cl⁻] = 0. Phức CaOH⁺ tiêu thụ hydroxide nên pH* tại điểm tương đương thấp hơn trường hợp base mạnh lý tưởng.',
  'formulas.charge-balance.sodium-carbonate':
    'Cân bằng điện tích cho Na₂CO₃: [H⁺] + [Na⁺] − [OH⁻] − [Cl⁻] − C_T(α₁ + 2α₂) = 0, với C_T là tổng carbon vô cơ và α₁, α₂ là phần mol của HCO₃⁻ và CO₃²⁻.',
  'formulas.carbon-fractions':
    'α₁ = K₁[H⁺] / D và α₂ = K₁K₂ / D, với D = [H⁺]² + K₁[H⁺] + K₁K₂. Hằng số có nguồn là pK: pK₁ = 6,352 và pK₂ = 10,329 (dữ liệu chính thức PHREEQC), suy ra K₁ = 10⁻⁶·³⁵² và K₂ = 10⁻¹⁰·³²⁹.',
  'formulas.equivalent-dose':
    'Đương lượng đã thêm = nồng độ đương lượng × thể tích. Liều tương đương mục tiêu E* không tra bảng mà suy ngược từ mô hình, nên đổi mục tiêu pH* sẽ đổi E*.',
  'formulas.charge-residual':
    'Phần dư cân bằng điện tích phải ≤ 1 × 10⁻¹⁰ mol/L. Giá trị này là bằng chứng nghiệm đã hội tụ, không phải một đại lượng hóa học.',

  'observations.route.locked':
    'Đã khóa chất trung hòa {route}. Trong scenario 1.0.0 không đổi route sau khi đã thêm base.',
  'observations.equivalence.approaching':
    'Số đọc đang tiến gần điểm tương đương. Giảm cỡ aliquot để kiểm soát tốt hơn.',
  'observations.carbonate.equilibrium':
    'Đây là cân bằng carbonate trong hệ kín, không phải lỗi tính toán. 25,00 mL Na₂CO₃ có đúng 2 đương lượng danh nghĩa nhưng pH* chỉ khoảng 4,48; cần khoảng 42,20 mL để đạt pH* gần 6,995.',
  'observations.calcium.complex':
    'Phức CaOH⁺ tiêu thụ một phần hydroxide, nên pH* tại điểm tương đương thấp hơn một chút so với route NaOH.',
  'observations.correction.applied':
    'Đã thêm HCl hiệu chỉnh. Chloride và thể tích tăng, số đọc và cân bằng cũ bị hủy; cần khuấy, chờ ổn định và đo lại.',

  'warnings.model.closed-carbon':
    'Mô hình carbon kín: không mô phỏng CO₂ thoát ra hoặc hấp thụ từ không khí. Trao đổi CO₂ có thể làm pH thay đổi đáng kể ngoài thực tế.',
  'warnings.model.ideal-activity':
    'Mô hình xấp xỉ hoạt độ bằng nồng độ và bỏ qua buffer, kim loại, phosphate, sulfate, chất hữu cơ, pha rắn và yếu tố sinh học.',
  'warnings.model.no-kinetics':
    'Mô hình không mô phỏng nhiệt phản ứng, truyền khối, tốc độ khuấy hay thời gian động học. Chờ số đọc ổn định là quy tắc thao tác, không phải tuyên bố về tốc độ máy đo.',
  'warnings.model.matrix-limit':
    'Không suy ra liều xử lý cho mẫu thật chưa biết thành phần. Tính phù hợp của endpoint phụ thuộc matrix, khả năng đệm và mục tiêu.',
  'warnings.safety.supervised-lab':
    'Thí nghiệm thật chỉ thực hiện dưới sự giám sát của người phụ trách phòng thí nghiệm, với kính chống bắn hóa chất, áo choàng, găng phù hợp và giày kín. Không hút pipet bằng miệng. Thêm acid/base từ từ khi khuấy và làm theo SDS/quy trình của cơ sở khi tràn đổ. Không tự ý đổ chất thải xuống cống. Acid tác dụng với carbonate có thể tạo CO₂; không đậy kín trong bình không được thiết kế chịu áp.',

  'errors.METER_NOT_CALIBRATED': 'Máy đo chưa hiệu chuẩn. Hiệu chuẩn trước khi đo pH.',
  'errors.SAMPLE_NOT_MIXED': 'Mẫu chưa được khuấy sau lần thêm gần nhất. Khuấy trước khi chờ số đọc ổn định.',
  // Distinct refusals for `mix` itself. `errors.SAMPLE_NOT_MIXED` above explains why
  // WAITING is blocked; these two explain why STIRRING is, and the three conditions
  // need three different sentences or a disabled control contradicts itself.
  'errors.ALREADY_MIXED': 'Mẫu đã được khuấy sau lần thêm gần nhất. Chờ số đọc ổn định rồi đo pH, hoặc thêm một lượng nữa trước khi khuấy lại.',
  'errors.NOTHING_TO_MIX': 'Chưa thêm chất nào để khuấy. Chọn chất trung hòa và thêm một aliquot trước.',
  'errors.READING_NOT_STABLE': 'Số đọc chưa ổn định. Chờ ổn định rồi đo lại trước khi quyết định hoàn thành.',
  'errors.TARGET_LOW': 'pH* còn dưới dải mục tiêu. Thêm một aliquot nhỏ.',
  'errors.TARGET_HIGH': 'pH* vượt dải mục tiêu. Thêm HCl hiệu chỉnh hoặc bắt đầu lượt mới.',
  'errors.ROUTE_LOCKED': 'Chất trung hòa đã khóa sau khi thêm base. Tạo lượt mới hoặc nhánh mới để đổi route.',
  'errors.CALCIUM_SOLUTION_INVALID':
    'Dung dịch Ca(OH)₂ đục hoặc có rắn nằm ngoài mô hình. Bắt đầu lại với dung dịch trong đã chuẩn hóa.',
  'errors.CO2_EXCHANGE_UNMODELED':
    'Hệ carbonate để hở không được mô hình hóa, nên không so sánh pH tuyệt đối. Bắt đầu lại hoặc ghi nhận giới hạn này.',
  'errors.TEMPERATURE_OUT_OF_SCOPE': 'Nhiệt độ ngoài phạm vi nên bộ hằng số không hợp lệ. Đưa về 25 °C.',
  'errors.EQUILIBRIUM_NO_CONVERGENCE':
    'Solver cân bằng không hội tụ, không có kết quả. Thao tác không được ghi nhận; thử lại với aliquot hợp lệ.',
  'errors.ALIQUOT_NOT_PERMITTED': 'Cỡ aliquot không nằm trong tập cho phép của scenario 1.0.0.',
  'errors.VOLUME_OUT_OF_RANGE': 'Thể tích vượt giới hạn cho phép của route.',
  'errors.EVENT_LIMIT_REACHED':
    'Đã đạt giới hạn sự kiện của lượt. Bắt đầu lượt mới với aliquot lớn hơn; dữ liệu cũ không bị cắt bớt.',
  'errors.STALE_MEASUREMENT': 'Số đo thuộc thành phần cũ. Khuấy, chờ ổn định và đo lại trước khi hoàn thành.',
  'errors.unsupportedRelease': 'Phiên bản kịch bản không còn được hỗ trợ trong runtime registry.',
  'errors.revisionConflict':
    'Lượt đã thay đổi trên thiết bị khác. Làm mới trạng thái trước khi gửi lại; thao tác của bạn chưa được ghi.',
  'errors.ATTEMPT_COMPLETED':
    'Lượt đã hoàn thành nên không nhận thêm thao tác. Tạo nhánh mới để tiếp tục từ trạng thái này.',
  'errors.ROUTE_NOT_SELECTED': 'Chưa chọn chất trung hòa. Chọn NaOH, Ca(OH)₂ hoặc Na₂CO₃ trước khi thêm.',
  'errors.TARGET_NOT_HIGH':
    'Chưa có số đo ổn định vượt dải mục tiêu nên HCl hiệu chỉnh không phải nhánh phục hồi hợp lệ.',

  'preconditions.select_route': 'Chỉ chọn được khi chưa thêm base.',
  'preconditions.calibrate_meter': 'Chỉ hiệu chuẩn được khi lượt chưa hoàn thành.',
  'preconditions.add_base': 'Cần đã chọn chất trung hòa, cỡ aliquot hợp lệ và lượt chưa hoàn thành.',
  'preconditions.mix': 'Cần có lần thêm chưa được khuấy trộn.',
  'preconditions.wait_for_stable_reading': 'Cần đã khuấy trộn mẫu.',
  'preconditions.measure_ph': 'Cần máy đã hiệu chuẩn, mẫu đã khuấy và số đọc đã ổn định.',
  'preconditions.add_correction_acid': 'Cần số đo ổn định cho thấy pH* vượt dải mục tiêu.',
  'preconditions.complete': 'Cần số đo ổn định, còn đúng thành phần hiện tại và mô hình hợp lệ.',

  'scoring.overall-label': 'Điểm tổng',
  'scoring.ph-component': 'Điểm pH (tối đa 60)',
  'scoring.resource-component': 'Điểm tài nguyên (tối đa 20)',
  'scoring.process-component': 'Điểm quy trình (tối đa 20)',
  'scoring.rubric-disclosure':
    'Chấm điểm là quy ước sư phạm có phiên bản, không phải hằng số khoa học và không phải xác suất thành công. Điểm thành phần luôn được hiển thị.',
  'scoring.achievement-label': 'Mức đạt mục tiêu',
  'scoring.achievement-explanation':
    'Phần trăm này mô tả mức đạt mục tiêu của mô phỏng, không phải xác suất thành công ngoài thực tế.',
  'scoring.success-label': 'Đạt mục tiêu',
  'scoring.success-explanation':
    'Trạng thái đạt mục tiêu xét riêng theo điều kiện cứng của mô hình; điểm cao không biến một lượt ngoài dải mục tiêu thành đạt.',

  'resources.cost-index-label': 'Chỉ số chi phí tương đối',
  'resources.cost-index-explanation':
    'Quy ước sư phạm có phiên bản theo mmol thuốc thử, dùng để so sánh tương đối giữa các route trong cùng scenario và release. Không phải tiền tệ và không phải báo giá.',
  'resources.safety-index-label': 'Chỉ số an toàn sư phạm',
  'resources.safety-index-explanation':
    'Quy ước sư phạm có phiên bản, tính bằng 100 trừ tổng điểm phạt đã ghi nhận. Không phải đánh giá rủi ro thực tế.',
  'resources.not-evaluable': 'Không đánh giá được',
  'resources.not-evaluable-explanation':
    'Mô hình không tính được cho lượt này nên chỉ số để trống. Không dùng 0 thay cho giá trị không xác định.',
  'resources.reagent-mass-label': 'Khối lượng chất tan',
  'resources.operation-count-label': 'Số thao tác',
  'resources.aliquot-count-label': 'Số lần thêm',

  'penalties.EXCESS_BASE_OVER_110_PERCENT_TARGET': 'Dùng base vượt 110% đương lượng mục tiêu của route',
  'penalties.CORRECTION_ACID_USED': 'Phải dùng HCl hiệu chỉnh sau khi vượt mục tiêu',
  'penalties.FINAL_PH_OUTSIDE_6_TO_8': 'Hoàn thành với pH* ngoài khoảng 6–8',

  'hazards.hcl': 'HCl: ăn mòn, kích ứng hô hấp. Xem hồ sơ NIOSH.',
  'hazards.naoh': 'NaOH: ăn mòn mạnh, nguy cơ tổn thương mắt. Xem hồ sơ NIOSH.',
  'hazards.calcium-hydroxide': 'Ca(OH)₂: kiềm, kích ứng. Xem hồ sơ NIOSH.',
  'hazards.sodium-carbonate': 'Na₂CO₃: kích ứng. Xem hồ sơ PubChem.',
  'hazards.disclaimer':
    'Cảnh báo nguy hiểm luôn hiển thị riêng và không bị thay thế bởi chỉ số an toàn sư phạm.',

  'limitations.acid.ph-is-modelled-concentration':
    'pH* là pH mô hình theo nồng độ với hệ số hoạt độ bằng 1, không phải pH hoạt độ theo định nghĩa IUPAC.',
  'limitations.acid.closed-carbon-system':
    'Carbonate được mô hình hóa như hệ kín trong pha nước; không mô phỏng trao đổi CO₂ với không khí.',
  'limitations.acid.no-dose-inference-for-unknown-sample':
    'Không suy liều xử lý cho mẫu thật chưa biết thành phần từ kết quả mô phỏng.',
  'limitations.acid.supervised-laboratory-only':
    'Mọi hướng dẫn thao tác chỉ áp dụng trong phòng thí nghiệm có giám sát và theo SDS/quy trình của cơ sở.',
  'limitations.acid.constant-temperature-25c':
    'Bộ hằng số khóa ở 25 °C và 0,1 MPa; ngoài điều kiện này mô hình không hợp lệ.',
} as const

export type AcidStringKey = keyof typeof ACID_STRINGS

export const ACID_STRING_KEYS = Object.keys(ACID_STRINGS) as AcidStringKey[]

/**
 * Phrases that would turn a pedagogical simulation into an unqualified safety,
 * compliance or dosing claim. Banned across every locale string in the release.
 */
export const FORBIDDEN_PHRASES = [
  'xác suất thành công thực tế',
  'probability',
  'đạt pháp luật',
  'tuân thủ pháp luật',
  'đạt chuẩn pháp lý',
  'liều nước thải',
  'liều xử lý khuyến nghị',
  'an toàn để xả',
  'được phép xả',
  'chứng nhận an toàn',
] as const
