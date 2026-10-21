import { format } from 'node:util'

const report = (...values) => process.stdout.write(format(...values) + '\n')

// verify-wt-capacity.mjs
//
// Capacity table verifier cho Water Treatment spec §6.5.2.
// Tính nồng độ ion tự do tại cân bằng bão hòa Ksp cho Fe(OH)₃ / Zn(OH)₂ / Pb(OH)₂
// ở 25 °C, I = 0 (mô hình lý tưởng, gamma = 1).
//
// QUY ƯỚC:
//   log[OH-] = pH - pKw                     => pKw = 13,990 (IAPWS R11-24, claim AN-KW-25C)
//   log[M^n+]sat = logKsp + n * log[OH-]    => công thức nghịch đảo từ Ksp
//   M_Fe = 55,845 g/mol; M_Zn = 65,38 g/mol; M_Pb = 207,2 g/mol
//
// NGUỒN HẰNG SỐ (chốt D1–D5 ngày 16/10/2026 bởi chemistry owner — xem
// docs/scientific-evidence-register.md §5.1.3 "Approved baseline model assumptions"):
//   Ksp_Fe  = 10^-38,779  (pha Ferrihydrite, MINTEQ v4 PHREEQC 3.8.6-17100,
//                           SHA-256 a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac)
//   Ksp_Zn  = 10^-15,506  (pha Zn(OH)₂(am), MINTEQ v4)
//   Ksp_Pb  = 10^-19,830  (pha Pb(OH)₂, MINTEQ v4 + phreeqc.dat)
//   pKw     = 13,990      (IAPWS R11-24, claim AN-KW-25C — KHÔNG thuộc D1–D5)
//   pKa2    = +1,99       (MINTEQ v4 convention; logK_dissociation = −1,99 cho HSO4- ⇌ H+ + SO4^2-;
//                                          logK_protonation = +1,99 cho H+ + SO4^2- ⇌ HSO4-)
//
// KHÔNG ĐƯỢC:
//   - Dùng −38,6 (Fe), −16,9 (Zn), −15,3 (Pb): các giá trị này bị đặt tên sai hoặc
//     không truy được nguồn. Chỉ giữ trong docs/scientific-evidence-register.md
//     "Discrepancy log vs current spec §6.5".
//   - Lưu −1,99 vào field tên `pKa2`.
//   - Tự ý đổi pKw sang nguồn khác (IAPWS R11-24 đã pin qua claim `AN-KW-25C`).
//
// Mọi thay đổi giá trị Ksp / pKw phải sửa tại đây TRƯỚC, chạy script để verify,
// rồi mới cập nhật spec §6.5.2 và đối chiếu với evidence register.

const Ksp_Fe = Math.pow(10, -38.779);  // Fe(OH)₃ — Ferrihydrite (MINTEQ v4)
const Ksp_Zn = Math.pow(10, -15.506);  // Zn(OH)₂(am)            (MINTEQ v4)
const Ksp_Pb = Math.pow(10, -19.830);  // Pb(OH)₂                (MINTEQ v4 + phreeqc.dat)
const pKw    = 13.990;                 // IAPWS R11-24

const M_Fe = 55.845, M_Zn = 65.38, M_Pb = 207.2;

const SOLID_PHASE = {
  fe: 'Ferrihydrite',
  zn: 'Zn(OH)₂(am)',
  pb: 'Pb(OH)₂',
};

const KSP_DECISION_TAG = {
  fe: 'D2',
  zn: 'D3',
  pb: 'D1',
};

const KSP_SOURCE = {
  fe: 'minteq.v4.dat PHREEQC 3.8.6-17100 (SHA-256 a93914e63b0c616f8506cc92739188e50c5b9a15c33b111979652f308457f4ac)',
  zn: 'minteq.v4.dat PHREEQC 3.8.6-17100 (cùng SHA-256 ở trên)',
  pb: 'minteq.v4.dat + phreeqc.dat PHREEQC 3.8.6-17100 (cùng SHA-256 ở trên)',
};

const VERSION = 'v2026-10-16-D1D2D3';
report(`# verify-wt-capacity ${VERSION}`);
report(`# Constants: Ksp_Fe=${Ksp_Fe.toExponential(6)} (log10=${Math.log10(Ksp_Fe).toFixed(3)}, phase=${SOLID_PHASE.fe}, ${KSP_DECISION_TAG.fe})`);
report(`#            Ksp_Zn=${Ksp_Zn.toExponential(6)} (log10=${Math.log10(Ksp_Zn).toFixed(3)}, phase=${SOLID_PHASE.zn}, ${KSP_DECISION_TAG.zn})`);
report(`#            Ksp_Pb=${Ksp_Pb.toExponential(6)} (log10=${Math.log10(Ksp_Pb).toFixed(3)}, phase=${SOLID_PHASE.pb}, ${KSP_DECISION_TAG.pb})`);
report(`#            pKw=${pKw} (IAPWS R11-24, claim AN-KW-25C)`);
report(`# Sources: ${Object.values(KSP_SOURCE).join(' | ')}`);
report('# Status: source-checked; KHONG cross-checked (P0-D vẫn mở; chờ 7 case chuyên biệt chạy trong PHREEQC).');
report('#');
report('pH | [Fe3+] mol/L | [Fe3+] mg/L | [Zn2+] mol/L | [Zn2+] mg/L | [Pb2+] mol/L | [Pb2+] mg/L');
for (const pH of [6.0, 7.0, 8.0, 8.5, 9.0, 9.5, 10.0]) {
  const OH = Math.pow(10, pH - pKw);
  const Fe = Ksp_Fe / Math.pow(OH, 3);
  const Zn = Ksp_Zn / Math.pow(OH, 2);
  const Pb = Ksp_Pb / Math.pow(OH, 2);
  report(
    pH.toFixed(1) + ' | ' +
    Fe.toExponential(2) + ' | ' +
    (Fe*M_Fe*1000).toExponential(2) + ' | ' +
    Zn.toExponential(2) + ' | ' +
    (Zn*M_Zn*1000).toExponential(2) + ' | ' +
    Pb.toExponential(2) + ' | ' +
    (Pb*M_Pb*1000).toExponential(2)
  );
}
