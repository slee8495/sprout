export type Locale = "en" | "ko" | "zh" | "ja" | "es";

// Keyed by the English source string itself — no separate key namespace to maintain.
// Falls back to the English text unchanged if a string isn't in here yet.
const ko: Record<string, string> = {
  // NavBar
  Journal: "저널",
  Feed: "피드",
  Milestones: "마일스톤",
  Settings: "설정",

  // JournalHome
  "'s Journal": "의 저널",
  "'s Feed": "의 피드",

  // Feed
  "💌 Parents": "💌 엄마아빠",
  "🔍 Search entries…": "🔍 항목 검색…",
  "📅 Calendar date": "📅 캘린더 날짜",
  "⏱️ Uploaded date": "⏱️ 업로드 날짜",
  "Latest first": "최신순",
  "Oldest first": "오래된순",
  'No results for "{query}" 🔍': '"{query}"에 대한 결과가 없어요 🔍',

  // Milestones
  "Not yet": "아직 없음",
  Milestone: "마일스톤",
  Food: "음식",
  Social: "사회성",
  Physical: "신체",
  Language: "언어",
  Health: "건강",
  Place: "장소",
  "Special Day": "특별한 날",
  Other: "기타",
  Training: "훈련",

  // Drafts
  "📝 Drafts — only you can see these": "📝 임시저장 — 나만 볼 수 있어요",
  "(empty draft)": "(빈 임시저장)",
  Resume: "이어서 쓰기",
  "Delete this draft? This can't be undone.": "이 임시저장을 삭제할까요? 되돌릴 수 없어요.",

  // On this day
  "✨ On this day": "✨ 오늘 이날",

  // Entry form / card (shared)
  "(can't change once saved)": "(저장 후에는 변경할 수 없어요)",
  "Title (optional)": "제목 (선택)",
  "What happened today?": "오늘 무슨 일이 있었나요?",
  "No milestone": "마일스톤 없음",
  "e.g. First broccoli": "예: 첫 브로콜리",
  "Remove photo": "사진 삭제",
  "📷 Add photos": "📷 사진 추가",
  "⏹ Stop recording": "⏹ 녹음 중지",
  "🎤 Voice memo": "🎤 음성 메모",
  "🎥 Video (max 1 min)": "🎥 동영상 (최대 1분)",
  "Videos must be {max}s or shorter (this one is {actual}s).": "동영상은 {max}초 이하여야 해요 (이 파일은 {actual}초).",
  "Couldn't read that video file.": "이 동영상 파일을 읽지 못했어요.",
  "That video file is too large (max {max}MB).": "동영상 파일이 너무 커요 (최대 {max}MB).",
  Remove: "삭제",
  "Write something first.": "먼저 내용을 입력해주세요.",
  "Saving…": "저장 중…",
  Publish: "게시",
  "Save entry": "일기 저장",
  "Save as draft": "임시저장",
  "Couldn't save that entry — {message}": "일기를 저장하지 못했어요 — {message}",
  "Entry can't be empty.": "내용을 비워둘 수 없어요.",
  "Couldn't save changes — try again.": "변경사항을 저장하지 못했어요 — 다시 시도해주세요.",
  "Delete this entry? This can't be undone.": "이 일기를 삭제할까요? 되돌릴 수 없어요.",
  Save: "저장",
  Cancel: "취소",
  Edit: "수정",
  Delete: "삭제",
  "Uploaded {time}": "{time}에 업로드됨",
  "· Edited": "· 수정됨",

  // Empty states
  "No entries yet — write the first one above 🌱": "아직 일기가 없어요 — 위에서 첫 일기를 써보세요 🌱",

  // Settings — Plan / Storage
  Plan: "플랜",
  "Pro plan": "Pro 플랜",
  "Pro plan (complimentary)": "Pro 플랜 (무료 제공)",
  "free until {date}": "{date}까지 무료",
  "free forever": "평생 무료",
  "renews {date}": "{date}에 갱신",
  "Free trial": "무료 체험",
  "ends {date}": "{date}에 종료",
  "Then {price} after your trial ends.": "체험이 끝나면 {price}로 자동 전환돼요.",
  "Payment failed — update your card to keep your Pro plan.": "결제에 실패했어요 — Pro 플랜을 유지하려면 카드 정보를 업데이트해주세요.",
  "Manage billing": "결제 관리",
  "Buy +5GB storage": "+5GB 저장공간 구매",
  "Free plan (previously subscribed)": "무료 플랜 (이전 구독 이력 있음)",
  "Free plan": "무료 플랜",
  " — 1 child or pet, 1GB storage.": " — 아이/반려동물 1명, 1GB 저장공간.",
  "Upgrade to Pro": "Pro로 업그레이드",
  Storage: "저장 공간",
  "{used} / {quota} used": "{used} / {quota} 사용 중",
  "— delete some photos to free up space": "— 사진을 좀 지워서 공간을 확보하세요",

  // Settings — Kids & Pets
  "Kids & Pets": "아이 & 반려동물",
  "+ Add a kid or pet": "+ 아이 또는 반려동물 추가",
  Name: "이름",
  "👶 Child": "👶 아이",
  "🐾 Pet": "🐾 반려동물",
  "Birthday / adoption day": "생일 / 입양일",
  "Birth date": "생일",
  "Day count starts at": "일수 계산 시작",
  "Day 0 (born day = 0)": "0일부터 (태어난 날 = 0일)",
  "Day 1 (born day = 1)": "1일부터 (태어난 날 = 1일)",
  "Name is required.": "이름을 입력해주세요.",
  "Pick a birth date.": "생일을 선택해주세요.",
  "Couldn't save — try again.": "저장하지 못했어요 — 다시 시도해주세요.",
  Add: "추가",

  // Settings — Family / Appearance
  Family: "가족",
  Timezone: "시간대",
  Appearance: "화면 설정",
  Theme: "테마",
  "☀️ Light": "☀️ 라이트",
  "🌙 Dark": "🌙 다크",
  "🖥️ System": "🖥️ 시스템",
  "Font size": "글자 크기",
  "Color theme": "컬러 테마",
  Sage: "세이지",
  "Dusty Blue": "더스티 블루",
  "Dusty Rose": "더스티 로즈",
  Lavender: "라벤더",
  Terracotta: "테라코타",
  "Couldn't save settings — try again.": "설정을 저장하지 못했어요 — 다시 시도해주세요.",
  "Saved.": "저장했어요.",

  // Settings — Danger zone / delete account
  "Danger zone": "위험 구역",
  "This will permanently delete {name} — {entries} entries, {photos} photos, {members} members — and cancel any active subscription. This cannot be undone.":
    "{name}을(를) 영구적으로 삭제해요 — 일기 {entries}개, 사진 {photos}개, 멤버 {members}명 — 그리고 활성 구독도 취소돼요. 되돌릴 수 없어요.",
  "Type {name} to confirm": "확인하려면 {name}을(를) 입력하세요",
  "Deleting…": "삭제 중…",
  "Permanently delete this family's account": "이 가족 계정을 영구적으로 삭제",

  // Settings — Invite
  "Invite your partner": "파트너 초대하기",
  "Share this family code — they can sign in with Google and join at":
    "이 가족 코드를 공유하세요 — Google로 로그인해서 아래 주소에서 가입할 수 있어요",
  "Copied!": "복사됨!",
  Copy: "복사",

  // Settings — page chrome
  "⚙️ Settings": "⚙️ 설정",
  "Signed in as": "로그인 계정:",
  "Sign out": "로그아웃",
  Terms: "이용약관",
  "Privacy Policy": "개인정보처리방침",

  // Landing page
  "A private, lifelong journal for your family.": "가족을 위한 프라이빗하고 평생 남는 저널이에요.",
  "Photos & voice memos": "사진 & 음성 메모",
  "Capture more than words — attach a photo or a quick voice memo to any entry.":
    "글로만 담기 아쉬울 땐 — 사진이나 짧은 음성 메모를 어떤 일기에도 첨부하세요.",
  "Track firsts, big and small, and revisit them on “On this day.”":
    "크고 작은 처음을 기록하고, “오늘 이날”에서 다시 꺼내보세요.",
  "Private by default": "기본적으로 비공개",
  "Only the family members you invite can ever see your journal.": "초대한 가족 구성원만 일기를 볼 수 있어요.",
  "5 languages": "5개 언어",
  "Switch the app's language anytime from Settings.": "설정에서 언제든 앱 언어를 전환할 수 있어요.",

  // Auth / onboarding pages
  "Your family's private journal.": "가족을 위한 프라이빗 저널이에요.",
  "Sign in with Google": "Google로 로그인",
  "By continuing, you agree to our": "계속 진행하면 아래 약관에 동의하는 거예요:",
  and: "그리고",
  "Create a new family journal or join one with an invite code.":
    "새 가족 저널을 만들거나 초대 코드로 참여하세요.",
  "Create a family": "가족 만들기",
  "Join with an invite code": "초대 코드로 참여하기",
  "Sign in with a different account": "다른 계정으로 로그인",
  "Join your family's journal with the invite code they shared with you.":
    "공유받은 초대 코드로 가족 저널에 참여하세요.",
  "Starting a new family?": "새 가족을 시작하시나요?",
  "Create one": "만들기",
  "Family code": "가족 코드",
  "Your name": "이름",
  "If this name already exists in the family, your Google account will be linked to it.":
    "가족 안에 같은 이름이 이미 있다면, Google 계정이 그 이름에 연결돼요.",
  "Joining…": "참여 중…",
  "Join family": "가족 참여하기",
  "Create your family's private journal.": "가족을 위한 프라이빗 저널을 만드세요.",
  "Joining an existing family?": "이미 있는 가족에 참여하시나요?",
  "Use an invite code": "초대 코드 사용하기",
  "Family name (e.g. The Lee Family)": "가족 이름 (예: 이씨네 가족)",
  "Creating family…": "가족 생성 중…",
  "Create family": "가족 만들기",
  "🌱 Welcome to Roun": "🌱 Roun에 오신 것을 환영해요",
  "A few quick things before we start journaling.": "일기를 쓰기 전에 몇 가지만 확인할게요.",
  "Your kid or pet": "아이 또는 반려동물",
  "Their name": "이름을 입력하세요",
  "Your pet's name is required.": "반려동물 이름을 입력해주세요.",
  "Your child's name is required.": "아이 이름을 입력해주세요.",
  "Pick a date first.": "날짜를 먼저 선택해주세요.",
  "Get started": "시작하기",

  // Chat widget (currently hidden from UI)
  "🌱 Ask about your family": "🌱 가족에 대해 물어보세요",
  "Read replies aloud": "답변을 소리 내어 읽기",
  'Ask things like "when did they first eat solid food?" or "when did they first walk?"':
    '"이유식은 언제 시작했어?" 나 "처음 걸은 날이 언제야?" 같은 질문을 해보세요',
  "Thinking…": "생각 중…",
  "Listening…": "듣는 중…",
  "Transcribing…": "받아쓰는 중…",
  "Ask a question…": "질문을 입력하세요…",
  Send: "보내기",
  "Read this reply aloud": "이 답변을 소리 내어 읽기",
  "Stop recording": "녹음 중지",
  "Ask by voice": "음성으로 질문하기",
  Chat: "채팅",

  // CommentThread
  Someone: "누군가",
  "Add a comment… 💬": "댓글 달기… 💬",
  Post: "게시",

  // NotificationBell
  Notifications: "알림",
  "Mark all as read": "모두 읽음으로 표시",
  "No notifications yet": "아직 알림이 없어요",

  // Calendar / PhotoLightbox
  "Previous month": "이전 달",
  "Next month": "다음 달",
  "Jump to month": "월 바로가기",
  "Clear selected date": "선택한 날짜 지우기",
  Close: "닫기",
  "{count} photos — swipe to browse": "사진 {count}장 — 넘겨서 보기",

  // Family members / roles
  "Family members": "가족 구성원",
  you: "나",
  Owner: "소유자",
  Editor: "편집 가능",
  "View only": "보기 전용",
  "View only members can see everything but can't add or edit entries, comments, or kids/pets.":
    "보기 전용 구성원은 모든 걸 볼 수 있지만 일기, 댓글, 자녀/반려동물을 추가하거나 수정할 수 없어요.",
  "Only the family owner can permanently delete this family's account.": "가족 소유자만 가족 계정을 영구 삭제할 수 있어요.",
  "Switch to Free? You'll keep Pro until your current period ends.":
    "프리 요금제로 전환할까요? 현재 결제 기간이 끝날 때까지는 Pro가 유지돼요.",
  "Switching to Free at the end of this period.": "이번 결제 기간이 끝나면 프리 요금제로 전환됩니다.",
  "Resume Pro plan": "Pro 요금제 재개",
  "Switch to Free": "프리 요금제로 전환",
  "Blocked in your device settings. Enable notifications for Roun there to turn this back on.":
    "기기 설정에서 알림이 차단되어 있어요. Roun 알림을 다시 켜려면 기기 설정에서 허용해주세요.",
  "New entries and comments push to your phone.": "새 일기와 댓글이 폰으로 알림 와요.",
  "Notifications are off.": "알림이 꺼져 있어요.",
};

const zh: Record<string, string> = {
  // NavBar
  Journal: "日记",
  Feed: "动态",
  Milestones: "里程碑",
  Settings: "设置",

  // JournalHome
  "'s Journal": "的日记",
  "'s Feed": "的动态",

  // Feed
  "💌 Parents": "💌 爸爸妈妈",
  "🔍 Search entries…": "🔍 搜索日记…",
  "📅 Calendar date": "📅 日历日期",
  "⏱️ Uploaded date": "⏱️ 上传日期",
  "Latest first": "最新优先",
  "Oldest first": "最早优先",
  'No results for "{query}" 🔍': '未找到"{query}"的结果 🔍',

  // Milestones
  "Not yet": "还没有",
  Milestone: "里程碑",
  Food: "饮食",
  Social: "社交",
  Physical: "身体",
  Language: "语言",
  Health: "健康",
  Place: "地点",
  "Special Day": "特别的日子",
  Other: "其他",
  Training: "训练",

  // Drafts
  "📝 Drafts — only you can see these": "📝 草稿 — 只有你能看到",
  "(empty draft)": "（空草稿）",
  Resume: "继续编辑",
  "Delete this draft? This can't be undone.": "删除这条草稿吗？此操作无法撤销。",

  // On this day
  "✨ On this day": "✨ 那年今日",

  // Entry form / card (shared)
  "(can't change once saved)": "（保存后无法更改）",
  "Title (optional)": "标题（可选）",
  "What happened today?": "今天发生了什么？",
  "No milestone": "无里程碑",
  "e.g. First broccoli": "例如：第一次吃西兰花",
  "Remove photo": "删除照片",
  "📷 Add photos": "📷 添加照片",
  "⏹ Stop recording": "⏹ 停止录音",
  "🎤 Voice memo": "🎤 语音留言",
  "🎥 Video (max 1 min)": "🎥 视频（最长1分钟）",
  "Videos must be {max}s or shorter (this one is {actual}s).": "视频时长不能超过{max}秒（这段视频为{actual}秒）。",
  "Couldn't read that video file.": "无法读取该视频文件。",
  "That video file is too large (max {max}MB).": "该视频文件过大（最大{max}MB）。",
  Remove: "删除",
  "Write something first.": "请先写点什么。",
  "Saving…": "保存中…",
  Publish: "发布",
  "Save entry": "保存日记",
  "Save as draft": "保存为草稿",
  "Couldn't save that entry — {message}": "无法保存该日记 — {message}",
  "Entry can't be empty.": "内容不能为空。",
  "Couldn't save changes — try again.": "无法保存更改 — 请重试。",
  "Delete this entry? This can't be undone.": "删除这条日记吗？此操作无法撤销。",
  Save: "保存",
  Cancel: "取消",
  Edit: "编辑",
  Delete: "删除",
  "Uploaded {time}": "{time}上传",
  "· Edited": "· 已编辑",

  // Empty states
  "No entries yet — write the first one above 🌱": "还没有日记 — 在上面写下第一篇吧 🌱",

  // Settings — Plan / Storage
  Plan: "套餐",
  "Pro plan": "Pro 套餐",
  "Pro plan (complimentary)": "Pro 套餐（赠送）",
  "free until {date}": "免费至{date}",
  "free forever": "永久免费",
  "renews {date}": "{date}续订",
  "Free trial": "免费试用",
  "ends {date}": "{date}结束",
  "Then {price} after your trial ends.": "试用结束后自动变为{price}。",
  "Payment failed — update your card to keep your Pro plan.": "支付失败 — 请更新您的卡以保留 Pro 套餐。",
  "Manage billing": "管理账单",
  "Buy +5GB storage": "购买 +5GB 存储空间",
  "Free plan (previously subscribed)": "免费套餐（曾订阅过）",
  "Free plan": "免费套餐",
  " — 1 child or pet, 1GB storage.": " — 1个孩子或宠物，1GB存储空间。",
  "Upgrade to Pro": "升级到 Pro",
  Storage: "存储空间",
  "{used} / {quota} used": "已使用 {used} / {quota}",
  "— delete some photos to free up space": "— 删除一些照片以释放空间",

  // Settings — Kids & Pets
  "Kids & Pets": "孩子与宠物",
  "+ Add a kid or pet": "+ 添加孩子或宠物",
  Name: "姓名",
  "👶 Child": "👶 孩子",
  "🐾 Pet": "🐾 宠物",
  "Birthday / adoption day": "生日 / 领养日",
  "Birth date": "出生日期",
  "Day count starts at": "天数计算从",
  "Day 0 (born day = 0)": "第0天开始（出生当天 = 第0天）",
  "Day 1 (born day = 1)": "第1天开始（出生当天 = 第1天）",
  "Name is required.": "请输入姓名。",
  "Pick a birth date.": "请选择出生日期。",
  "Couldn't save — try again.": "保存失败 — 请重试。",
  Add: "添加",

  // Settings — Family / Appearance
  Family: "家庭",
  Timezone: "时区",
  Appearance: "外观",
  Theme: "主题",
  "☀️ Light": "☀️ 浅色",
  "🌙 Dark": "🌙 深色",
  "🖥️ System": "🖥️ 系统",
  "Font size": "字体大小",
  "Color theme": "配色主题",
  Sage: "鼠尾草绿",
  "Dusty Blue": "灰蓝色",
  "Dusty Rose": "灰玫瑰色",
  Lavender: "薰衣草紫",
  Terracotta: "赤陶色",
  "Couldn't save settings — try again.": "设置保存失败 — 请重试。",
  "Saved.": "已保存。",

  // Settings — Danger zone / delete account
  "Danger zone": "危险区域",
  "This will permanently delete {name} — {entries} entries, {photos} photos, {members} members — and cancel any active subscription. This cannot be undone.":
    "此操作将永久删除{name} — {entries}篇日记，{photos}张照片，{members}位成员 — 并取消任何有效订阅。此操作无法撤销。",
  "Type {name} to confirm": '输入"{name}"以确认',
  "Deleting…": "删除中…",
  "Permanently delete this family's account": "永久删除此家庭账户",

  // Settings — Invite
  "Invite your partner": "邀请伴侣",
  "Share this family code — they can sign in with Google and join at":
    "分享这个家庭代码 — 对方可以用 Google 登录并加入",
  "Copied!": "已复制！",
  Copy: "复制",

  // Settings — page chrome
  "⚙️ Settings": "⚙️ 设置",
  "Signed in as": "登录账号：",
  "Sign out": "退出登录",
  Terms: "服务条款",
  "Privacy Policy": "隐私政策",

  // Landing page
  "A private, lifelong journal for your family.": "为您的家庭打造的私密、伴随一生的日记。",
  "Photos & voice memos": "照片和语音留言",
  "Capture more than words — attach a photo or a quick voice memo to any entry.":
    "不止是文字 — 为任何一篇日记添加照片或语音留言。",
  "Track firsts, big and small, and revisit them on “On this day.”":
    "记录大大小小的\"第一次\"，在\"那年今日\"重温这些瞬间。",
  "Private by default": "默认私密",
  "Only the family members you invite can ever see your journal.": "只有您邀请的家庭成员才能看到您的日记。",
  "5 languages": "5种语言",
  "Switch the app's language anytime from Settings.": "随时可在设置中切换应用语言。",

  // Auth / onboarding pages
  "Your family's private journal.": "您家庭的私密日记。",
  "Sign in with Google": "使用 Google 登录",
  "By continuing, you agree to our": "继续即表示您同意我们的",
  and: "和",
  "Create a new family journal or join one with an invite code.":
    "创建一个新的家庭日记，或使用邀请代码加入现有的。",
  "Create a family": "创建家庭",
  "Join with an invite code": "使用邀请代码加入",
  "Sign in with a different account": "使用其他账号登录",
  "Join your family's journal with the invite code they shared with you.":
    "使用家人分享给您的邀请代码加入家庭日记。",
  "Starting a new family?": "要创建新的家庭吗？",
  "Create one": "立即创建",
  "Family code": "家庭代码",
  "Your name": "您的姓名",
  "If this name already exists in the family, your Google account will be linked to it.":
    "如果家庭中已存在此姓名，您的 Google 账号将与其关联。",
  "Joining…": "加入中…",
  "Join family": "加入家庭",
  "Create your family's private journal.": "创建您家庭的私密日记。",
  "Joining an existing family?": "要加入现有的家庭吗？",
  "Use an invite code": "使用邀请代码",
  "Family name (e.g. The Lee Family)": "家庭名称（例如：李氏家族）",
  "Creating family…": "正在创建家庭…",
  "Create family": "创建家庭",
  "🌱 Welcome to Roun": "🌱 欢迎使用 Roun",
  "A few quick things before we start journaling.": "在开始写日记之前，先确认几件小事。",
  "Your kid or pet": "您的孩子或宠物",
  "Their name": "请输入姓名",
  "Your pet's name is required.": "请输入宠物的姓名。",
  "Your child's name is required.": "请输入孩子的姓名。",
  "Pick a date first.": "请先选择日期。",
  "Get started": "开始使用",

  // Chat widget (currently hidden from UI)
  "🌱 Ask about your family": "🌱 询问关于家庭的问题",
  "Read replies aloud": "朗读回复",
  'Ask things like "when did they first eat solid food?" or "when did they first walk?"':
    '可以问"第一次吃辅食是什么时候？"或"第一次走路是什么时候？"',
  "Thinking…": "思考中…",
  "Listening…": "聆听中…",
  "Transcribing…": "转录中…",
  "Ask a question…": "输入问题…",
  Send: "发送",
  "Read this reply aloud": "朗读此回复",
  "Stop recording": "停止录音",
  "Ask by voice": "语音提问",
  Chat: "聊天",

  // CommentThread
  Someone: "某人",
  "Add a comment… 💬": "添加评论… 💬",
  Post: "发布",

  // NotificationBell
  Notifications: "通知",
  "Mark all as read": "全部标为已读",
  "No notifications yet": "暂时没有通知",

  // Calendar / PhotoLightbox
  "Previous month": "上个月",
  "Next month": "下个月",
  "Jump to month": "跳转到月份",
  "Clear selected date": "清除选中日期",
  Close: "关闭",
  "{count} photos — swipe to browse": "{count} 张照片 — 滑动浏览",

  // Family members / roles
  "Family members": "家庭成员",
  you: "我",
  Owner: "所有者",
  Editor: "可编辑",
  "View only": "仅查看",
  "View only members can see everything but can't add or edit entries, comments, or kids/pets.":
    "仅查看成员可以看到所有内容，但无法添加或编辑日记、评论或孩子/宠物。",
  "Only the family owner can permanently delete this family's account.": "只有家庭所有者可以永久删除此家庭账户。",
  "Switch to Free? You'll keep Pro until your current period ends.": "切换到免费版？在当前计费周期结束前，您仍可使用 Pro。",
  "Switching to Free at the end of this period.": "本计费周期结束后将切换到免费版。",
  "Resume Pro plan": "恢复 Pro 计划",
  "Switch to Free": "切换到免费版",
  "Blocked in your device settings. Enable notifications for Roun there to turn this back on.":
    "已在设备设置中被屏蔽。请在设备设置中为 Roun 开启通知以重新打开。",
  "New entries and comments push to your phone.": "新日记和评论会推送到您的手机。",
  "Notifications are off.": "通知已关闭。",
};

const ja: Record<string, string> = {
  // NavBar
  Journal: "日記",
  Feed: "フィード",
  Milestones: "マイルストーン",
  Settings: "設定",

  // JournalHome
  "'s Journal": "の日記",
  "'s Feed": "のフィード",

  // Feed
  "💌 Parents": "💌 パパママ",
  "🔍 Search entries…": "🔍 記録を検索…",
  "📅 Calendar date": "📅 カレンダー日付",
  "⏱️ Uploaded date": "⏱️ アップロード日",
  "Latest first": "新しい順",
  "Oldest first": "古い順",
  'No results for "{query}" 🔍': '「{query}」の検索結果はありません 🔍',

  // Milestones
  "Not yet": "まだ",
  Milestone: "マイルストーン",
  Food: "食事",
  Social: "社会性",
  Physical: "運動",
  Language: "言語",
  Health: "健康",
  Place: "場所",
  "Special Day": "特別な日",
  Other: "その他",
  Training: "しつけ",

  // Drafts
  "📝 Drafts — only you can see these": "📝 下書き — あなただけが見られます",
  "(empty draft)": "（空の下書き）",
  Resume: "再開する",
  "Delete this draft? This can't be undone.": "この下書きを削除しますか？元に戻せません。",

  // On this day
  "✨ On this day": "✨ この日の思い出",

  // Entry form / card (shared)
  "(can't change once saved)": "（保存後は変更できません）",
  "Title (optional)": "タイトル（任意）",
  "What happened today?": "今日は何がありましたか？",
  "No milestone": "マイルストーンなし",
  "e.g. First broccoli": "例：はじめてのブロッコリー",
  "Remove photo": "写真を削除",
  "📷 Add photos": "📷 写真を追加",
  "⏹ Stop recording": "⏹ 録音を停止",
  "🎤 Voice memo": "🎤 ボイスメモ",
  "🎥 Video (max 1 min)": "🎥 動画（最大1分）",
  "Videos must be {max}s or shorter (this one is {actual}s).": "動画は{max}秒以内にしてください（この動画は{actual}秒です）。",
  "Couldn't read that video file.": "この動画ファイルを読み込めませんでした。",
  "That video file is too large (max {max}MB).": "この動画ファイルは大きすぎます（最大{max}MB）。",
  Remove: "削除",
  "Write something first.": "まず何か入力してください。",
  "Saving…": "保存中…",
  Publish: "公開する",
  "Save entry": "記録を保存",
  "Save as draft": "下書きとして保存",
  "Couldn't save that entry — {message}": "記録を保存できませんでした — {message}",
  "Entry can't be empty.": "内容を空にはできません。",
  "Couldn't save changes — try again.": "変更を保存できませんでした。もう一度お試しください。",
  "Delete this entry? This can't be undone.": "この記録を削除しますか？元に戻せません。",
  Save: "保存",
  Cancel: "キャンセル",
  Edit: "編集",
  Delete: "削除",
  "Uploaded {time}": "{time}にアップロード",
  "· Edited": "・編集済み",

  // Empty states
  "No entries yet — write the first one above 🌱": "まだ記録がありません — 上から最初の記録を書いてみましょう 🌱",

  // Settings — Plan / Storage
  Plan: "プラン",
  "Pro plan": "Pro プラン",
  "Pro plan (complimentary)": "Pro プラン（無料提供）",
  "free until {date}": "{date}まで無料",
  "free forever": "永久無料",
  "renews {date}": "{date}に更新",
  "Free trial": "無料トライアル",
  "ends {date}": "{date}に終了",
  "Then {price} after your trial ends.": "トライアル終了後は{price}に自動移行します。",
  "Payment failed — update your card to keep your Pro plan.": "支払いに失敗しました — Pro プランを維持するにはカード情報を更新してください。",
  "Manage billing": "請求情報を管理",
  "Buy +5GB storage": "+5GB ストレージを購入",
  "Free plan (previously subscribed)": "無料プラン（過去に契約あり）",
  "Free plan": "無料プラン",
  " — 1 child or pet, 1GB storage.": " — 子供またはペット1人、ストレージ1GB。",
  "Upgrade to Pro": "Pro にアップグレード",
  Storage: "ストレージ",
  "{used} / {quota} used": "{used} / {quota} 使用中",
  "— delete some photos to free up space": "— 写真を削除して空き容量を確保してください",

  // Settings — Kids & Pets
  "Kids & Pets": "子供とペット",
  "+ Add a kid or pet": "+ 子供またはペットを追加",
  Name: "名前",
  "👶 Child": "👶 子供",
  "🐾 Pet": "🐾 ペット",
  "Birthday / adoption day": "誕生日 / お迎え日",
  "Birth date": "誕生日",
  "Day count starts at": "日数の数え方",
  "Day 0 (born day = 0)": "0日目から（生まれた日 = 0日目）",
  "Day 1 (born day = 1)": "1日目から（生まれた日 = 1日目）",
  "Name is required.": "名前を入力してください。",
  "Pick a birth date.": "誕生日を選択してください。",
  "Couldn't save — try again.": "保存できませんでした。もう一度お試しください。",
  Add: "追加",

  // Settings — Family / Appearance
  Family: "家族",
  Timezone: "タイムゾーン",
  Appearance: "外観",
  Theme: "テーマ",
  "☀️ Light": "☀️ ライト",
  "🌙 Dark": "🌙 ダーク",
  "🖥️ System": "🖥️ システム",
  "Font size": "文字サイズ",
  "Color theme": "カラーテーマ",
  Sage: "セージ",
  "Dusty Blue": "ダスティブルー",
  "Dusty Rose": "ダスティローズ",
  Lavender: "ラベンダー",
  Terracotta: "テラコッタ",
  "Couldn't save settings — try again.": "設定を保存できませんでした。もう一度お試しください。",
  "Saved.": "保存しました。",

  // Settings — Danger zone / delete account
  "Danger zone": "危険な操作",
  "This will permanently delete {name} — {entries} entries, {photos} photos, {members} members — and cancel any active subscription. This cannot be undone.":
    "これにより{name}が完全に削除されます — 記録{entries}件、写真{photos}枚、メンバー{members}人 — 有効なサブスクリプションもすべて解約されます。元に戻すことはできません。",
  "Type {name} to confirm": "確認のため「{name}」と入力してください",
  "Deleting…": "削除中…",
  "Permanently delete this family's account": "この家族のアカウントを完全に削除する",

  // Settings — Invite
  "Invite your partner": "パートナーを招待",
  "Share this family code — they can sign in with Google and join at":
    "この家族コードを共有してください — 相手は Google でログインして参加できます",
  "Copied!": "コピーしました！",
  Copy: "コピー",

  // Settings — page chrome
  "⚙️ Settings": "⚙️ 設定",
  "Signed in as": "ログイン中：",
  "Sign out": "ログアウト",
  Terms: "利用規約",
  "Privacy Policy": "プライバシーポリシー",

  // Landing page
  "A private, lifelong journal for your family.": "家族のための、一生続くプライベートな日記。",
  "Photos & voice memos": "写真とボイスメモ",
  "Capture more than words — attach a photo or a quick voice memo to any entry.":
    "言葉だけじゃない — どの記録にも写真やボイスメモを添付できます。",
  "Track firsts, big and small, and revisit them on “On this day.”":
    "大小さまざまな「はじめて」を記録して、「この日の思い出」でまた出会えます。",
  "Private by default": "デフォルトで非公開",
  "Only the family members you invite can ever see your journal.": "招待した家族だけがあなたの日記を見ることができます。",
  "5 languages": "5つの言語",
  "Switch the app's language anytime from Settings.": "設定からいつでもアプリの言語を切り替えられます。",

  // Auth / onboarding pages
  "Your family's private journal.": "あなたの家族のプライベートな日記。",
  "Sign in with Google": "Google でログイン",
  "By continuing, you agree to our": "続行することで、以下に同意したものとみなされます：",
  and: "と",
  "Create a new family journal or join one with an invite code.":
    "新しく家族の日記を作成するか、招待コードで参加してください。",
  "Create a family": "家族を作成",
  "Join with an invite code": "招待コードで参加",
  "Sign in with a different account": "別のアカウントでログイン",
  "Join your family's journal with the invite code they shared with you.":
    "共有された招待コードで家族の日記に参加しましょう。",
  "Starting a new family?": "新しく家族を始めますか？",
  "Create one": "作成する",
  "Family code": "家族コード",
  "Your name": "お名前",
  "If this name already exists in the family, your Google account will be linked to it.":
    "この名前がすでに家族内にある場合、その名前に Google アカウントが紐づけられます。",
  "Joining…": "参加中…",
  "Join family": "家族に参加",
  "Create your family's private journal.": "あなたの家族のプライベートな日記を作成しましょう。",
  "Joining an existing family?": "既存の家族に参加しますか？",
  "Use an invite code": "招待コードを使う",
  "Family name (e.g. The Lee Family)": "家族の名前（例：田中家）",
  "Creating family…": "家族を作成中…",
  "Create family": "家族を作成",
  "🌱 Welcome to Roun": "🌱 Roun へようこそ",
  "A few quick things before we start journaling.": "日記を始める前に、いくつか確認しましょう。",
  "Your kid or pet": "お子さまやペット",
  "Their name": "名前を入力",
  "Your pet's name is required.": "ペットの名前を入力してください。",
  "Your child's name is required.": "お子さまの名前を入力してください。",
  "Pick a date first.": "先に日付を選択してください。",
  "Get started": "はじめる",

  // Chat widget (currently hidden from UI)
  "🌱 Ask about your family": "🌱 家族について質問する",
  "Read replies aloud": "返信を読み上げる",
  'Ask things like "when did they first eat solid food?" or "when did they first walk?"':
    '「はじめて離乳食を食べたのはいつ？」「はじめて歩いたのはいつ？」のように聞いてみましょう',
  "Thinking…": "考え中…",
  "Listening…": "聞き取り中…",
  "Transcribing…": "文字起こし中…",
  "Ask a question…": "質問を入力…",
  Send: "送信",
  "Read this reply aloud": "この返信を読み上げる",
  "Stop recording": "録音を停止",
  "Ask by voice": "音声で質問",
  Chat: "チャット",

  // CommentThread
  Someone: "誰か",
  "Add a comment… 💬": "コメントを追加… 💬",
  Post: "投稿",

  // NotificationBell
  Notifications: "通知",
  "Mark all as read": "すべて既読にする",
  "No notifications yet": "まだ通知はありません",

  // Calendar / PhotoLightbox
  "Previous month": "前の月",
  "Next month": "次の月",
  "Jump to month": "月へ移動",
  "Clear selected date": "選択した日付を解除",
  Close: "閉じる",
  "{count} photos — swipe to browse": "{count}枚の写真 — スワイプして見る",

  // Family members / roles
  "Family members": "家族メンバー",
  you: "自分",
  Owner: "オーナー",
  Editor: "編集可能",
  "View only": "閲覧のみ",
  "View only members can see everything but can't add or edit entries, comments, or kids/pets.":
    "閲覧のみのメンバーはすべて見られますが、日記やコメント、子ども/ペットの追加・編集はできません。",
  "Only the family owner can permanently delete this family's account.": "家族アカウントを完全に削除できるのはオーナーのみです。",
  "Switch to Free? You'll keep Pro until your current period ends.":
    "無料プランに切り替えますか？現在の請求期間が終わるまではProをご利用いただけます。",
  "Switching to Free at the end of this period.": "今の請求期間が終わると無料プランに切り替わります。",
  "Resume Pro plan": "Proプランを再開",
  "Switch to Free": "無料プランに切り替え",
  "Blocked in your device settings. Enable notifications for Roun there to turn this back on.":
    "端末の設定でブロックされています。再度オンにするには端末の設定でRounの通知を許可してください。",
  "New entries and comments push to your phone.": "新しい日記やコメントがスマホにプッシュされます。",
  "Notifications are off.": "通知はオフになっています。",
};

const es: Record<string, string> = {
  // NavBar
  Journal: "Diario",
  Feed: "Novedades",
  Milestones: "Hitos",
  Settings: "Ajustes",

  // JournalHome
  "'s Journal": " - Diario",
  "'s Feed": " - Novedades",

  // Feed
  "💌 Parents": "💌 Papá y mamá",
  "🔍 Search entries…": "🔍 Buscar entradas…",
  "📅 Calendar date": "📅 Fecha del calendario",
  "⏱️ Uploaded date": "⏱️ Fecha de subida",
  "Latest first": "Más recientes primero",
  "Oldest first": "Más antiguos primero",
  'No results for "{query}" 🔍': 'Sin resultados para "{query}" 🔍',

  // Milestones
  "Not yet": "Aún no",
  Milestone: "Hito",
  Food: "Comida",
  Social: "Social",
  Physical: "Físico",
  Language: "Idioma",
  Health: "Salud",
  Place: "Lugar",
  "Special Day": "Día especial",
  Other: "Otro",
  Training: "Entrenamiento",

  // Drafts
  "📝 Drafts — only you can see these": "📝 Borradores — solo tú puedes verlos",
  "(empty draft)": "(borrador vacío)",
  Resume: "Continuar",
  "Delete this draft? This can't be undone.": "¿Eliminar este borrador? No se puede deshacer.",

  // On this day
  "✨ On this day": "✨ Este día",

  // Entry form / card (shared)
  "(can't change once saved)": "(no se puede cambiar después de guardar)",
  "Title (optional)": "Título (opcional)",
  "What happened today?": "¿Qué pasó hoy?",
  "No milestone": "Sin hito",
  "e.g. First broccoli": "p. ej. Primer brócoli",
  "Remove photo": "Eliminar foto",
  "📷 Add photos": "📷 Agregar fotos",
  "⏹ Stop recording": "⏹ Detener grabación",
  "🎤 Voice memo": "🎤 Nota de voz",
  "🎥 Video (max 1 min)": "🎥 Video (máx. 1 min)",
  "Videos must be {max}s or shorter (this one is {actual}s).": "Los videos deben durar {max}s o menos (este dura {actual}s).",
  "Couldn't read that video file.": "No se pudo leer ese archivo de video.",
  "That video file is too large (max {max}MB).": "Ese archivo de video es demasiado grande (máx. {max}MB).",
  Remove: "Quitar",
  "Write something first.": "Escribe algo primero.",
  "Saving…": "Guardando…",
  Publish: "Publicar",
  "Save entry": "Guardar entrada",
  "Save as draft": "Guardar como borrador",
  "Couldn't save that entry — {message}": "No se pudo guardar la entrada — {message}",
  "Entry can't be empty.": "La entrada no puede estar vacía.",
  "Couldn't save changes — try again.": "No se pudieron guardar los cambios — inténtalo de nuevo.",
  "Delete this entry? This can't be undone.": "¿Eliminar esta entrada? No se puede deshacer.",
  Save: "Guardar",
  Cancel: "Cancelar",
  Edit: "Editar",
  Delete: "Eliminar",
  "Uploaded {time}": "Subido {time}",
  "· Edited": "· Editado",

  // Empty states
  "No entries yet — write the first one above 🌱": "Aún no hay entradas — escribe la primera arriba 🌱",

  // Settings — Plan / Storage
  Plan: "Plan",
  "Pro plan": "Plan Pro",
  "Pro plan (complimentary)": "Plan Pro (cortesía)",
  "free until {date}": "gratis hasta el {date}",
  "free forever": "gratis para siempre",
  "renews {date}": "se renueva el {date}",
  "Free trial": "Prueba gratuita",
  "ends {date}": "termina el {date}",
  "Then {price} after your trial ends.": "Cuando termine la prueba, pasarás automáticamente a {price}.",
  "Payment failed — update your card to keep your Pro plan.": "El pago falló — actualiza tu tarjeta para mantener tu plan Pro.",
  "Manage billing": "Gestionar facturación",
  "Buy +5GB storage": "Comprar +5GB de almacenamiento",
  "Free plan (previously subscribed)": "Plan gratuito (con suscripción anterior)",
  "Free plan": "Plan gratuito",
  " — 1 child or pet, 1GB storage.": " — 1 hijo o mascota, 1GB de almacenamiento.",
  "Upgrade to Pro": "Mejorar a Pro",
  Storage: "Almacenamiento",
  "{used} / {quota} used": "{used} / {quota} usado",
  "— delete some photos to free up space": "— elimina algunas fotos para liberar espacio",

  // Settings — Kids & Pets
  "Kids & Pets": "Hijos y mascotas",
  "+ Add a kid or pet": "+ Añadir hijo o mascota",
  Name: "Nombre",
  "👶 Child": "👶 Hijo/a",
  "🐾 Pet": "🐾 Mascota",
  "Birthday / adoption day": "Cumpleaños / día de adopción",
  "Birth date": "Fecha de nacimiento",
  "Day count starts at": "El conteo de días empieza en",
  "Day 0 (born day = 0)": "Día 0 (día de nacimiento = 0)",
  "Day 1 (born day = 1)": "Día 1 (día de nacimiento = 1)",
  "Name is required.": "El nombre es obligatorio.",
  "Pick a birth date.": "Elige una fecha de nacimiento.",
  "Couldn't save — try again.": "No se pudo guardar — inténtalo de nuevo.",
  Add: "Añadir",

  // Settings — Family / Appearance
  Family: "Familia",
  Timezone: "Zona horaria",
  Appearance: "Apariencia",
  Theme: "Tema",
  "☀️ Light": "☀️ Claro",
  "🌙 Dark": "🌙 Oscuro",
  "🖥️ System": "🖥️ Sistema",
  "Font size": "Tamaño de fuente",
  "Color theme": "Tema de color",
  Sage: "Salvia",
  "Dusty Blue": "Azul apagado",
  "Dusty Rose": "Rosa apagado",
  Lavender: "Lavanda",
  Terracotta: "Terracota",
  "Couldn't save settings — try again.": "No se pudieron guardar los ajustes — inténtalo de nuevo.",
  "Saved.": "Guardado.",

  // Settings — Danger zone / delete account
  "Danger zone": "Zona de peligro",
  "This will permanently delete {name} — {entries} entries, {photos} photos, {members} members — and cancel any active subscription. This cannot be undone.":
    "Esto eliminará permanentemente {name} — {entries} entradas, {photos} fotos, {members} miembros — y cancelará cualquier suscripción activa. Esta acción no se puede deshacer.",
  "Type {name} to confirm": "Escribe {name} para confirmar",
  "Deleting…": "Eliminando…",
  "Permanently delete this family's account": "Eliminar permanentemente la cuenta de esta familia",

  // Settings — Invite
  "Invite your partner": "Invita a tu pareja",
  "Share this family code — they can sign in with Google and join at":
    "Comparte este código familiar — pueden iniciar sesión con Google y unirse en",
  "Copied!": "¡Copiado!",
  Copy: "Copiar",

  // Settings — page chrome
  "⚙️ Settings": "⚙️ Ajustes",
  "Signed in as": "Sesión iniciada como",
  "Sign out": "Cerrar sesión",
  Terms: "Términos",
  "Privacy Policy": "Política de privacidad",

  // Landing page
  "A private, lifelong journal for your family.": "Un diario privado y para toda la vida, para tu familia.",
  "Photos & voice memos": "Fotos y notas de voz",
  "Capture more than words — attach a photo or a quick voice memo to any entry.":
    "Más que palabras — adjunta una foto o una nota de voz a cualquier entrada.",
  "Track firsts, big and small, and revisit them on “On this day.”":
    "Registra los primeros momentos, grandes y pequeños, y revívelos en \"Este día\".",
  "Private by default": "Privado por defecto",
  "Only the family members you invite can ever see your journal.": "Solo los familiares que invites podrán ver tu diario.",
  "5 languages": "5 idiomas",
  "Switch the app's language anytime from Settings.": "Cambia el idioma de la app en cualquier momento desde Ajustes.",

  // Auth / onboarding pages
  "Your family's private journal.": "El diario privado de tu familia.",
  "Sign in with Google": "Iniciar sesión con Google",
  "By continuing, you agree to our": "Al continuar, aceptas nuestros",
  and: "y",
  "Create a new family journal or join one with an invite code.":
    "Crea un nuevo diario familiar o únete a uno con un código de invitación.",
  "Create a family": "Crear una familia",
  "Join with an invite code": "Unirse con un código de invitación",
  "Sign in with a different account": "Iniciar sesión con otra cuenta",
  "Join your family's journal with the invite code they shared with you.":
    "Únete al diario de tu familia con el código de invitación que te compartieron.",
  "Starting a new family?": "¿Empezando una familia nueva?",
  "Create one": "Crear una",
  "Family code": "Código familiar",
  "Your name": "Tu nombre",
  "If this name already exists in the family, your Google account will be linked to it.":
    "Si este nombre ya existe en la familia, tu cuenta de Google se vinculará a él.",
  "Joining…": "Uniéndose…",
  "Join family": "Unirse a la familia",
  "Create your family's private journal.": "Crea el diario privado de tu familia.",
  "Joining an existing family?": "¿Te unes a una familia existente?",
  "Use an invite code": "Usar un código de invitación",
  "Family name (e.g. The Lee Family)": "Nombre familiar (p. ej. Familia García)",
  "Creating family…": "Creando familia…",
  "Create family": "Crear familia",
  "🌱 Welcome to Roun": "🌱 Bienvenido a Roun",
  "A few quick things before we start journaling.": "Unas cosas rápidas antes de empezar a escribir.",
  "Your kid or pet": "Tu hijo/a o mascota",
  "Their name": "Su nombre",
  "Your pet's name is required.": "El nombre de tu mascota es obligatorio.",
  "Your child's name is required.": "El nombre de tu hijo/a es obligatorio.",
  "Pick a date first.": "Elige primero una fecha.",
  "Get started": "Empezar",

  // Chat widget (currently hidden from UI)
  "🌱 Ask about your family": "🌱 Pregunta sobre tu familia",
  "Read replies aloud": "Leer respuestas en voz alta",
  'Ask things like "when did they first eat solid food?" or "when did they first walk?"':
    'Pregunta cosas como "¿cuándo comió sólidos por primera vez?" o "¿cuándo caminó por primera vez?"',
  "Thinking…": "Pensando…",
  "Listening…": "Escuchando…",
  "Transcribing…": "Transcribiendo…",
  "Ask a question…": "Haz una pregunta…",
  Send: "Enviar",
  "Read this reply aloud": "Leer esta respuesta en voz alta",
  "Stop recording": "Detener grabación",
  "Ask by voice": "Preguntar por voz",
  Chat: "Chat",

  // CommentThread
  Someone: "Alguien",
  "Add a comment… 💬": "Añadir un comentario… 💬",
  Post: "Publicar",

  // NotificationBell
  Notifications: "Notificaciones",
  "Mark all as read": "Marcar todo como leído",
  "No notifications yet": "Aún no hay notificaciones",

  // Calendar / PhotoLightbox
  "Previous month": "Mes anterior",
  "Next month": "Mes siguiente",
  "Jump to month": "Ir a un mes",
  "Clear selected date": "Borrar fecha seleccionada",
  Close: "Cerrar",
  "{count} photos — swipe to browse": "{count} fotos — desliza para ver",

  // Family members / roles
  "Family members": "Miembros de la familia",
  you: "tú",
  Owner: "Propietario",
  Editor: "Editor",
  "View only": "Solo ver",
  "View only members can see everything but can't add or edit entries, comments, or kids/pets.":
    "Los miembros de solo lectura pueden ver todo, pero no pueden añadir ni editar entradas, comentarios ni hijos/mascotas.",
  "Only the family owner can permanently delete this family's account.":
    "Solo el propietario de la familia puede eliminar permanentemente esta cuenta familiar.",
  "Switch to Free? You'll keep Pro until your current period ends.":
    "¿Cambiar a Gratis? Conservarás Pro hasta que termine tu periodo actual.",
  "Switching to Free at the end of this period.": "Cambiarás a Gratis al final de este periodo.",
  "Resume Pro plan": "Reanudar plan Pro",
  "Switch to Free": "Cambiar a Gratis",
  "Blocked in your device settings. Enable notifications for Roun there to turn this back on.":
    "Bloqueadas en la configuración de tu dispositivo. Actívalas para Roun allí para volver a encenderlas.",
  "New entries and comments push to your phone.": "Las nuevas entradas y comentarios se envían a tu teléfono.",
  "Notifications are off.": "Las notificaciones están desactivadas.",
};

const DICTIONARIES: Partial<Record<Locale, Record<string, string>>> = { ko, zh, ja, es };

export function translate(locale: Locale, text: string): string {
  if (locale === "en") return text;
  return DICTIONARIES[locale]?.[text] ?? text;
}

// Simple {placeholder} substitution for translated strings that need interpolation,
// e.g. fill(t("Uploaded {time}"), { time: "..." }).
export function fill(text: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text,
  );
}

// Korean/Chinese/Japanese count nouns with a counter word; English/Spanish just use the number.
const COUNT_SUFFIX: Partial<Record<Locale, string>> = { ko: "개", zh: "个", ja: "個" };
export function localizedCount(locale: Locale, count: number): string {
  return `${count}${COUNT_SUFFIX[locale] ?? ""}`;
}
