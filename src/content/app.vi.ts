/**
 * App-level Vietnamese copy.
 *
 * Scenario copy lives in the scenario bundles and is keyed by `messageKey` returned
 * from the domain. This module holds only what is NOT scenario-specific: navigation,
 * page headings, storage-mode labels and the shared disclaimers every surface repeats.
 *
 * Kept in the content layer rather than inline in components so wording has one home and
 * the wording gate can reach it (docs/web-application-scope.md §9: content structure may
 * be separated from the interface). Vietnamese is the only locale in MVP; there is no
 * switcher and no second bundle, so these are plain constants rather than a keyed table.
 */

export const APP_STRINGS = {
  brand: 'VECLab',
  brandTag: 'Mô phỏng quy trình',

  footer: {
    description: 'Mô phỏng thí nghiệm hóa học và xử lý nước.',
    note: 'Mô phỏng phục vụ học tập, không thay thế phép đo hoặc quy trình xử lý thực tế.',
  },

  nav: {
    home: 'Trang chủ',
    experiments: 'Thí nghiệm',
    evidence: 'Nguồn khoa học',
    lab: 'Phòng lab của tôi',
    labGuest: 'Lab dùng thử',
    compare: 'So sánh',
    account: 'Tài khoản',
    signIn: 'Đăng nhập',
  },

  home: {
    /**
     * Hero, per the approved landing design package
     * (design.md §9 — the wording that shipped in `reference/approved-landing.png`).
     * Three short lines rather than one sentence, so the headline reads in one glance.
     */
    heroEyebrow: 'Nền tảng mô phỏng hóa học cho giáo dục',
    heroHeadline: ['Thử quy trình.', 'Thấy kết quả.', 'Hiểu vì sao.'],
    lede: 'Mô phỏng hóa học và môi trường theo từng thao tác. Thay đổi thông số, quan sát trạng thái và hiểu cơ sở khoa học phía sau kết quả.',
    heroPrimaryCta: 'Bắt đầu trải nghiệm',
    heroSecondaryCta: 'Xem cách hoạt động',
    trustItems: [
      { label: 'An toàn, không rủi ro', hint: 'Không cần đăng ký, dùng thử an toàn ở chế độ khách' },
      { label: 'Học qua thực hành', hint: 'Thao tác từng bước, cân bằng hóa học xác thực' },
      { label: 'Dựa trên nguồn khoa học', hint: 'Minh bạch, có căn cứ kiểm chứng' },
    ],

    learningValueHeading: 'Giá trị học tập',
    learningValues: [
      'Thao tác từng bước như quy trình thật: chọn chất, hiệu chuẩn, thêm liều, khuấy, chờ ổn định rồi mới đo.',
      'pH* được giải từ cân bằng hóa học, không phải tra bảng — đổi mục tiêu sẽ đổi liều tương đương.',
      'Điểm tách thành pH, tài nguyên và quy trình, luôn hiển thị từng thành phần.',
      'Nguồn và giới hạn mô hình xuất hiện ngay trong lúc làm, không phải phụ lục.',
    ],

    showcaseEyebrow: 'Khám phá ngay',
    showcaseHeading: '3 thí nghiệm mô phỏng',
    showcaseLede: 'Chọn một quy trình xử lý nước để thực hành.',
    showcaseCtaLabel: 'Thử ngay',
    comingSoonBadge: 'Sắp ra mắt',
    comingSoonCta: 'Xem trước',
    showcaseCards: [
      {
        scenarioKey: 'acid-neutralization',
        title: 'Điều chỉnh pH',
        summary: 'Chọn lượng hóa chất và theo dõi pH của mẫu nước.',
        available: true,
      },
      {
        scenarioKey: 'jar-test',
        title: 'Jar Test',
        summary: 'So sánh liều keo tụ, khuấy và lắng để giảm độ đục.',
        available: false,
      },
      {
        scenarioKey: 'methylene-blue-adsorption',
        title: 'Hấp phụ xanh methylene',
        summary: 'Khảo sát khả năng loại màu bằng than hoạt tính.',
        available: false,
      },
    ],

    workbenchEyebrow: 'Không gian thực hành',
    workbenchHeading: 'Thực hành trên workbench',
    workbenchLede:
      'Chọn điều kiện, quan sát quá trình và đo kết quả. Cuối mỗi lượt, xem lại các bước để hiểu vì sao kết quả khác nhau.',
    workbenchSteps: ['Chuẩn bị mẫu', 'Chọn điều kiện', 'Khuấy và lắng', 'Đo và ghi kết quả'],

    evidenceEyebrow: 'Cơ sở khoa học',
    evidenceSectionHeading: 'Mỗi kết quả đều có căn cứ',
    evidenceSectionLede:
      'Xem cách mô hình tính kết quả, điều kiện áp dụng và tài liệu được sử dụng.',
    evidenceCards: [
      {
        title: 'Mô hình và giới hạn',
        body: 'Xem điều kiện áp dụng và các giả định của mô hình.',
      },
      {
        title: 'Cách tính kết quả',
        body: 'Theo dõi công thức, đơn vị và các đại lượng trong phép tính.',
      },
      {
        title: 'Tài liệu tham khảo',
        body: 'Tra cứu tài liệu gốc, phân biệt dữ liệu có nguồn với giả định.',
      },
    ],

    finalCtaHeading: 'Sẵn sàng vào lab?',
    finalCtaLede: 'Bắt đầu với bài điều chỉnh pH. Tự chọn lượng hóa chất, đo và xem lại kết quả.',
    finalCtaButton: 'Vào lab thực hành',

    catalogHeading: 'Thí nghiệm',
    catalogEmpty: 'Hiện chưa có thí nghiệm nào được khóa trong phiên bản triển khai này.',
    startGuest: 'Bắt đầu không cần tài khoản',
    guestNote:
      'Chế độ khách thực hiện đầy đủ thí nghiệm và lưu trên trình duyệt này. Tạo tài khoản để tiếp tục trên thiết bị khác và mở lại báo cáo.',
  },

  experimentDetail: {
    notFoundTitle: 'Không tìm thấy thí nghiệm',
    notFoundBody: 'Kịch bản này chưa được khóa trong phiên bản triển khai hiện tại.',
    backToCatalog: 'Về danh mục thí nghiệm',
    startNewAttempt: 'Bắt đầu lượt mới',
    contextHeading: 'Bối cảnh và mục tiêu',
    initialStateHeading: 'Mẫu ban đầu',
    processHeading: 'Quy trình trên workbench',
    processLiveLead:
      'Phiên bản này chuẩn độ HCl bằng NaOH trên workbench. Ca(OH)₂ và Na₂CO₃ nằm trong đặc tả mô hình, chưa mở để chọn.',
    processLiveBadge: 'Trên workbench',
    processSpecBadge: 'Trong mô hình, chưa mở',
    naohLimitLabel: 'Giới hạn NaOH trên workbench',
    specLimitLabel: 'Giới hạn trong đặc tả (chưa mở)',
    permittedHeading: 'Thao tác được phép',
    parametersHeading: 'Tham số chính',
    evaluatedHeading: 'Hệ thống đánh giá gì',
    safetyHeading: 'Cảnh báo an toàn',
    assumptionsHeading: 'Giả định và giới hạn',
    sourcesHeading: 'Nguồn khoa học',
    releaseHeading: 'Phiên bản đã khóa',
    undoableBadge: 'có thể hoàn tác',
    irreversibleBadge: 'không hoàn tác',
    preconditionLabel: 'Điều kiện trước',
    viewEvidence: 'Xem sổ đăng ký bằng chứng',
  },

  release: {
    releaseId: 'Mã phiên bản',
    scenarioKey: 'Kịch bản',
    modelSpecVersion: 'Phiên bản đặc tả mô hình',
    scoringVersion: 'Phiên bản quy tắc chấm',
    contentVersion: 'Phiên bản nội dung',
    evidenceRegisterVersion: 'Phiên bản sổ bằng chứng',
    projectionVersion: 'Phiên bản projection',
    locale: 'Ngôn ngữ',
    claims: 'Tuyên bố có bằng chứng',
    sources: 'Nguồn',
    limitations: 'Giới hạn công bố',
  },

  evidence: {
    title: 'Nguồn khoa học',
    lede: 'Sổ đăng ký bằng chứng cho các kịch bản đã khóa: mỗi hằng số, mỗi quy trình thao tác và mỗi giới hạn đều trỏ về một nguồn có thể kiểm tra.',
    registerVersion: 'Phiên bản sổ đăng ký',
    sourcesHeading: 'Nguồn',
    claimsHeading: 'Tuyên bố và bằng chứng',
    derivedHeading: 'Giá trị dẫn xuất',
    provenanceHeading: 'Nguồn gốc các trường hợp chuẩn',
    transformation: 'Phép biến đổi',
    implementationValue: 'Giá trị trong mô hình',
    backToCatalog: 'Về danh mục thí nghiệm',
  },

  workbench: {
    title: 'Không gian mô phỏng',
    notFoundTitle: 'Không mở được lượt thử',
    notFoundBody: 'Lượt thử này không có trong bộ nhớ của thiết bị hoặc tài khoản hiện tại.',
    goalHeading: 'Mục tiêu và phiên bản kịch bản',
    progressHeading: 'Tiến trình',
    stateHeading: 'Trạng thái hiện tại',
    phenomenaHeading: 'Hiện tượng dự kiến',
    metricsHeading: 'Chỉ số khoa học',
    actionsHeading: 'Thao tác tiếp theo',
    modeGuided: 'Từng bước',
    modeGuidedHint: 'Làm đúng quy trình lab',
    modeExplore: 'Thêm và đo',
    modeExploreHint: 'Một lần bấm: thêm, khuấy, chờ, đo',
    setupGoalHeading: 'Mục tiêu lần này',
    setupGoalHint: 'Đưa pH* vào dải mục tiêu sau khi thêm NaOH, khuấy, chờ ổn định rồi đo.',
    setupSampleHeading: 'Mẫu',
    setupSampleStandard: 'Mẫu chuẩn',
    setupCustomizeSample: 'Tùy chỉnh thể tích và nồng độ',
    setupUseStandard: 'Dùng mẫu chuẩn',
    setupModeLegend: 'Cách làm',
    aliquotLegend: 'Thể tích mỗi lần thêm',
    otherActions: 'Thao tác khác',
    protocolHeading: 'Quy trình chuẩn độ',
    exploreStatusHeading: 'Đang thêm và đo',
    protocolRepeatHint: 'Có thể thêm NaOH nhiều lần. Bấm Thêm xong rồi khuấy, chờ, đo.',
    finishDosing: 'Thêm xong',
    feedbackHeading: 'Phản hồi sau thao tác',
    formulasHeading: 'Công thức và dữ liệu trung gian',
    historyHeading: 'Lịch sử thao tác',
    undo: 'Hoàn tác thao tác cuối',
    reset: 'Đặt lại — tạo lượt mới',
    complete: 'Hoàn thành lượt',
    emptyTimeline: 'Chưa có thao tác nào. Bắt đầu bằng cách chọn chất trung hòa.',
    /**
     * Shown while an attempt is being opened. Shared by the workbench and the
     * attempt/report shells: resuming replays the whole event chain, so for a long run this
     * is real, visible time and the learner needs to know the app is working rather than
     * blank.
     */
    loading: 'Đang mở lượt thử…',
    target: 'Mục tiêu pH*',
    tolerance: 'Dung sai',
    route: 'Chất trung hòa',
    noRoute: 'chưa chọn',
    phase: 'Bước hiện tại',
    totalVolume: 'Tổng thể tích',
    baseVolume: 'Thể tích base đã thêm',
    correctionVolume: 'HCl hiệu chỉnh',
    operationCount: 'Số thao tác',
    aliquotCount: 'Số lần thêm',
    costIndex: 'Chỉ số chi phí tương đối',
    safetyIndex: 'Chỉ số an toàn sư phạm',
    overallScore: 'Điểm tổng',
    notEvaluable: 'Không đánh giá được',
    measurementStale: 'Số đo không còn mô tả mẫu hiện tại',
    goalMet: 'Đạt mục tiêu',
    goalNotMet: 'Chưa đạt mục tiêu',
    invalidModel: 'Mô hình không hợp lệ',
    confirmReset: 'Đặt lại sẽ kết thúc lượt hiện tại ở trạng thái bị dừng và tạo lượt mới từ đầu. Lịch sử đã lưu không bị ghi đè. Tiếp tục?',
  },

  storage: {
    localLabel: 'Lưu trên thiết bị này',
    localHint: 'Dữ liệu chỉ nằm trong trình duyệt này. Đăng nhập để đồng bộ và tiếp tục trên thiết bị khác.',
    cloudLabel: 'Đã đồng bộ với tài khoản',
    saving: 'Đang lưu…',
    saved: 'Đã lưu',
    error: 'Không lưu được',
    errorHint: 'Thao tác của bạn chưa được ghi. Kiểm tra kết nối rồi thử lại.',
    conflictTitle: 'Lượt đã thay đổi trên thiết bị khác',
    conflictHint: 'Trạng thái mới nhất đã được tải lại. Thao tác vừa rồi chưa được ghi; hãy thực hiện lại nếu vẫn cần.',
    idempotentHint: 'Thao tác này đã được ghi trước đó nên không lưu lần nữa.',
  },

  lab: {
    title: 'Phòng lab của tôi',
    lede: 'Tiếp tục lượt đang làm hoặc xem lại kết quả thực hành.',
    emptyTitle: 'Chưa có lượt thử nào',
    emptyBody: 'Chọn một thí nghiệm từ danh mục để bắt đầu.',
    browseCatalog: 'Xem danh mục thí nghiệm',
    open: 'Mở lượt',
    report: 'Báo cáo',
    delete: 'Xóa',
    confirmDelete: 'Xóa lượt thử này và toàn bộ lịch sử thao tác của nó? Không thể khôi phục.',
    startNew: 'Bắt đầu lượt thử mới',
    /**
     * Headings for the two groups §4.5 requires the lab to separate: work in progress and
     * work recently finished. They are not the same thing to a learner — one is "keep
     * going", the other is "look back at a result" — so they cannot share a heading.
     */
    groupInProgress: 'Đang thực hiện',
    groupCompleted: 'Hoàn thành gần đây',
    status: {
      in_progress: 'đang thực hiện',
      completed: 'đã hoàn thành',
      stopped: 'đã dừng',
    },
    column: {
      experiment: 'Thí nghiệm',
      status: 'Trạng thái',
      phStar: 'pH*',
      score: 'Điểm',
      updated: 'Cập nhật',
      actions: '',
    },
  },

  account: {
    title: 'Tài khoản và dữ liệu',
    lede: 'Dữ liệu của bạn được lưu theo từng thao tác. Xóa bất cứ lúc nào.',
    signInPrompt: 'Đăng nhập để tiếp tục lượt thử trên thiết bị khác và mở lại báo cáo.',
    signIn: 'Đăng nhập',
    signOut: 'Đăng xuất',
    signingOut: 'Đang đăng xuất…',
    /** §4.9: view email, change display name, change password, list attempts, delete one. */
    headings: {
      profile: 'Hồ sơ',
      password: 'Mật khẩu',
      attempts: 'Lượt thử của bạn',
    },
    email: 'Email đăng nhập',
    emailLocked:
      'Email dùng để đăng nhập và để xác minh quyền sở hữu dữ liệu. Không đổi được ở đây.',
    displayName: 'Tên hiển thị',
    displayNameHint: 'Chỉ dùng trong giao diện của bạn; không hiển thị với người khác.',
    saveProfile: 'Lưu tên hiển thị',
    changePassword: 'Đổi mật khẩu',
    /**
     * Why the account screen does not ask for the current password.
     *
     * Supabase only checks `current_password` when
     * `GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD` is enabled on the server,
     * which a browser cannot detect. Collecting it anyway would promise a verification that
     * may silently never happen — worse than not asking, because the learner would believe
     * their session had been challenged. So the screen changes the password the way the
     * server actually enforces it: an active, confirmed session.
     */
    changePasswordHint:
      'Đổi mật khẩu khi đang đăng nhập. Mật khẩu mới áp dụng cho các phiên sau; phiên hiện tại vẫn giữ nguyên.',
    messages: {
      profileSaved: 'Đã lưu tên hiển thị.',
      passwordChanged: 'Đã đổi mật khẩu.',
      attemptDeleted: 'Đã xóa lượt thử.',
      signedOut: 'Đã đăng xuất.',
    },
    errors: {
      emptyDisplayName: 'Tên hiển thị không được để trống.',
      tooLongDisplayName: 'Tên hiển thị tối đa 80 ký tự.',
      profileSaveFailed: 'Không lưu được tên hiển thị. Vui lòng thử lại.',
      passwordChangeFailed: 'Không đổi được mật khẩu. Vui lòng thử lại.',
      signOutFailed: 'Không đăng xuất được. Vui lòng thử lại.',
    },
  },

  compare: {
    title: 'So sánh phương án',
    lede: 'So sánh hai lượt đã hoàn thành của cùng một phiên bản kịch bản.',
    needTwo: 'Cần ít nhất hai lượt đã hoàn thành của cùng một phiên bản kịch bản để so sánh.',
    /** §4.8: the eight things a comparison must show. */
    headings: {
      initialConditions: 'Điều kiện ban đầu',
      timeline: 'Chuỗi thao tác',
      reagents: 'Vật chất và liều lượng',
      finalResult: 'Kết quả cuối',
      efficiency: 'Hiệu suất và thu hồi',
      scores: 'Điểm thành phần',
      steps: 'Số bước',
      warnings: 'Cảnh báo và sai sót',
    },
    pickA: 'Lượt thứ nhất',
    pickB: 'Lượt thứ hai',
    choose: '— chọn lượt —',
    sameChoice: 'Hai ô đang chọn cùng một lượt. Hãy chọn hai lượt khác nhau.',
    /** §4.8: the web must explain when two runs cannot be compared directly. */
    notComparableTitle: 'Hai lượt không so sánh trực tiếp được',
    notComparableRelease:
      'Hai lượt thuộc hai phiên bản kịch bản khác nhau. Mỗi phiên bản có hằng số, cách tính điểm và nội dung riêng, nên chênh lệch giữa chúng có thể đến từ phiên bản chứ không đến từ cách làm.',
    notComparableScenario: 'Hai lượt thuộc hai thí nghiệm khác nhau.',
    notComparableIncomplete: 'Chỉ lượt đã hoàn thành mới so sánh được, vì báo cáo là bản chốt.',
    columns: {
      field: 'Chỉ tiêu',
      a: 'Lượt A',
      b: 'Lượt B',
      difference: 'Chênh lệch',
    },
    noWarnings: 'Không có cảnh báo nào.',
    notEvaluable: 'N/A — không đánh giá được',
    compareButton: 'So sánh',
  },

  report: {
    title: 'Báo cáo lượt thử',
    lede:
      'Bản tổng kết của một lượt đã hoàn thành: điều kiện, thao tác, kết quả trung gian, kết quả cuối, điểm thành phần, nguồn và giới hạn.',
    // Headings for the §4.7 required items. Each one names a block the report renders.
    headings: {
      identity: 'Thí nghiệm và phiên bản',
      initialConditions: 'Điều kiện ban đầu',
      timeline: 'Timeline thao tác',
      reagents: 'Hóa chất, vật liệu và tham số',
      intermediates: 'Kết quả trung gian',
      final: 'Kết quả cuối',
      goal: 'Mục tiêu',
      scores: 'Mức độ hoàn thành và điểm thành phần',
      chart: 'Diễn biến pH*',
      explanation: 'Giải thích khoa học',
      timing: 'Thời điểm',
      disclosure: 'Nguồn và giới hạn',
    },
    fields: {
      scenario: 'Thí nghiệm',
      releaseId: 'Phiên bản kịch bản',
      attemptId: 'Mã lượt thử',
      startedAt: 'Bắt đầu',
      completedAt: 'Hoàn thành',
      generatedAt: 'Báo cáo tạo lúc',
      status: 'Trạng thái',
      route: 'Chất trung hòa',
      goalMet: 'Đạt mục tiêu',
      goalNotMet: 'Chưa đạt mục tiêu',
    },
    chart: {
      phAxis: 'pH*',
      sequenceAxis: 'Thao tác',
      targetBand: 'Dải mục tiêu',
      empty: 'Lượt này chưa có số đọc pH* nào để vẽ.',
    },
    notCompletedTitle: 'Lượt chưa hoàn thành',
    notCompletedBody:
      'Báo cáo chỉ có sau khi kết thúc lượt thử. Quay lại không gian mô phỏng để tiếp tục.',
    openWorkbench: 'Mở lại lượt',
    print: 'In hoặc lưu PDF',
    printHint:
      'Trình duyệt tự in trang này; không có dịch vụ tạo PDF phía máy chủ. Bố cục in ẩn điều hướng và nút.',
    backToLab: 'Về phòng lab',
  },

  /**
   * Account authentication (docs/web-application-scope.md §4.4).
   *
   * Email and password only — §4.4 explicitly excludes Google, Microsoft, Apple and social
   * sign-in, so there is no third-party button copy here and none should be added.
   *
   * Error copy is deliberately vague about WHICH credential was wrong. Supabase does not
   * tell a caller whether an email is unregistered or a password is incorrect, and a screen
   * that distinguished them would turn the form into an account-existence oracle. The one
   * place that must stay specific is email verification, where the learner needs to know the
   * request worked and what to do next.
   */
  auth: {
    signInTitle: 'Đăng nhập',
    signUpTitle: 'Tạo tài khoản',
    forgotTitle: 'Quên mật khẩu',
    resetTitle: 'Đặt lại mật khẩu',
    verifyTitle: 'Xác minh email',
    lede:
      'Tài khoản cho phép tiếp tục lượt thử trên thiết bị khác và mở lại báo cáo đã hoàn thành. Không cần tài khoản để dùng thử nghiệm ở chế độ khách.',
    email: 'Email',
    password: 'Mật khẩu',
    confirmPassword: 'Nhập lại mật khẩu',
    passwordHint: 'Tối thiểu 8 ký tự.',
    /**
     * New-password labels, shared by the reset screen (§4.4) and the change-password block
     * on the account screen (§4.9). They live in `auth` because both screens need them and
     * one home means the two cannot drift into different wording for the same field.
     */
    newPassword: 'Mật khẩu mới',
    confirmNewPassword: 'Nhập lại mật khẩu mới',
    signIn: 'Đăng nhập',
    signUp: 'Tạo tài khoản',
    sendReset: 'Gửi liên kết đặt lại',
    savePassword: 'Lưu mật khẩu mới',
    signOut: 'Đăng xuất',
    needAccount: 'Chưa có tài khoản?',
    haveAccount: 'Đã có tài khoản?',
    forgotLink: 'Quên mật khẩu?',
    continueAsGuest: 'Tiếp tục không cần tài khoản',
    /** Where to return after signing in; middleware sets this on the redirect. */
    nextHint: 'Bạn sẽ được đưa trở lại trang vừa truy cập.',
    signedUpTitle: 'Đã gửi email xác minh',
    signedUpBody:
      'Kiểm tra hộp thư và bấm liên kết xác minh để hoàn tất tạo tài khoản. Nếu liên kết hết hạn, hãy yêu cầu gửi lại.',
    resetSentTitle: 'Đã gửi liên kết đặt lại',
    resetSentBody:
      'Nếu email này có tài khoản, một liên kết đặt lại mật khẩu đã được gửi. Kiểm tra cả thư rác.',
    verifying: 'Đang xác minh liên kết…',
    verifyOkTitle: 'Đã xác minh email',
    verifyOkBody: 'Email đã được xác minh. Bạn có thể tiếp tục vào phòng lab.',
    verifyFailedTitle: 'Liên kết không hợp lệ',
    verifyFailedBody:
      'Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu một liên kết mới.',
    resendVerification: 'Gửi lại email xác minh',
    errors: {
      emailUnconfirmed: 'Email chưa được xác minh. Mở email xác minh hoặc yêu cầu gửi lại để tiếp tục.',
      invalidCredentials: 'Email hoặc mật khẩu không đúng.',
      emailTaken: 'Email này đã có tài khoản. Hãy đăng nhập.',
      weakPassword: 'Mật khẩu quá yếu. Dùng tối thiểu 8 ký tự.',
      passwordMismatch: 'Hai mật khẩu không khớp nhau.',
      invalidEmail: 'Email không hợp lệ.',
      tooManyRequests: 'Quá nhiều yêu cầu. Vui lòng chờ vài phút rồi thử lại.',
      notConfigured:
        'Chức năng tài khoản hiện chưa sẵn sàng. Bạn vẫn có thể thực hành ở chế độ khách và lưu tiến độ trên trình duyệt này.',
      generic: 'Không thực hiện được. Vui lòng thử lại.',
      signOutFailed: 'Không đăng xuất được. Thử lại hoặc đóng tab.',
    },
  },

  errors: {
    genericTitle: 'Đã xảy ra lỗi',
    notConfiguredTitle: 'Chưa cấu hình Supabase',
    notConfiguredBody:
      'Ứng dụng chưa có NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Chế độ khách vẫn hoạt động; tài khoản và đồng bộ thì không.',
    backHome: 'Về trang chủ',
  },
} as const

/** Storage-mode label a surface shows next to the save indicator. */
export function storageModeLabel(mode: 'local' | 'cloud'): string {
  return mode === 'local' ? APP_STRINGS.storage.localLabel : APP_STRINGS.storage.cloudLabel
}
