export type Locale = "en" | "ko";

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
  "💌 Parents": "💌 부모님",
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
  "💌 Parents only": "💌 부모님만",
  "(can't change once saved)": "(저장 후에는 변경할 수 없어요)",
  "Title (optional)": "제목 (선택)",
  "What happened today?": "오늘 무슨 일이 있었나요?",
  "No milestone": "마일스톤 없음",
  "e.g. First broccoli": "예: 첫 브로콜리",
  "Remove photo": "사진 삭제",
  "⏹ Stop recording": "⏹ 녹음 중지",
  "🎤 Voice memo": "🎤 음성 메모",
  "🎥 Video (max 1 min)": "🎥 동영상 (최대 1분)",
  "Videos must be {max}s or shorter (this one is {actual}s).": "동영상은 {max}초 이하여야 해요 (이 파일은 {actual}초).",
  "Couldn't read that video file.": "이 동영상 파일을 읽지 못했어요.",
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
  "renews {date}": "{date}에 갱신",
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
  "English & Korean": "영어 & 한국어",
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
  "🌱 Welcome to Sprout": "🌱 Sprout에 오신 것을 환영해요",
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

  // Calendar / PhotoLightbox
  "Previous month": "이전 달",
  "Next month": "다음 달",
  "Clear selected date": "선택한 날짜 지우기",
  Close: "닫기",
  "{count} photos — swipe to browse": "사진 {count}장 — 넘겨서 보기",
};

export function translate(locale: Locale, text: string): string {
  if (locale === "en") return text;
  return ko[text] ?? text;
}

// Simple {placeholder} substitution for translated strings that need interpolation,
// e.g. fill(t("Uploaded {time}"), { time: "..." }).
export function fill(text: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text,
  );
}
