# Sprout 시판 준비 — 진행 상황 (2026-07-22 기준)

이 파일은 다음 Claude Code 세션에서 이어서 작업하기 위한 핸드오프 노트입니다.
새 세션에서 이 repo를 열고 "LAUNCH_PROGRESS.md 읽고 이어서 진행해줘" 라고 하면 됩니다.

같은 세션을 그대로 이어가고 싶다면, 최근 커밋 메시지에 적힌 세션 링크로도 복귀할 수 있습니다:
`https://claude.ai/code/session_01Q37XobaFP3vS8romQd7j7H`

## 시판 체크리스트 (원래 8개 항목)

1. ✅ **멀티테넌시** — 완료 (아래 상세)
2. 🔜 **진짜 로그인** — 지금 방향 전환 중: Google OAuth로 가기로 결정함 (아래 "다음 작업" 참고)
3. ⬜ 스토리지 quota + 압축
4. ⬜ 결제 연동 (가족당 $0.99/월 예정)
5. ⬜ 아이 여러 명 지원
6. ⬜ 개인정보/법적 문서
7. ⬜ 관찰성/운영
8. ⬜ 다국어, 브랜딩 일반화

## 방금 완료한 것: 멀티테넌시

- `families` 테이블에 `invite_code`(초대코드), `passphrase_hash`(가족 공유 패스프레이즈 해시) 추가
- `/signup`: 가족 대표가 이메일+가족명+패스프레이즈로 새 가족 생성
- `/join`: 초대코드+이름+패스프레이즈로 기존 가족에 합류 (이메일 불필요)
- `/login`: 가족코드+이름+패스프레이즈로 로그인 (기존 PARENT_NAMES/APP_PASSPHRASE env변수 방식 완전히 대체)
- 기존 가족(로운이네) 데이터 100% 보존 — 마이그레이션 전후 row count 동일 확인함 (journal_entries 35, users 3, photos 86)
- **기존 가족 초대코드: `3982BXBP`** (로그인 시 필요, 패스프레이즈는 기존 그대로)
- 커밋: `29929f7`, 배포 완료 (READY)

## 다음 작업: 패스프레이즈 방식 → Google 로그인으로 전환

**결정된 방향**: 지금 만든 "가족코드+공유패스프레이즈" 로그인을 걷어내고 Google OAuth로 교체.
이유: 비밀번호 찾기 기능을 따로 만들 필요가 없어짐 (Google이 계정 복구 처리), 진짜 로그인 문제도 동시에 해결됨.

### 사용자가 먼저 해야 할 일 (외부 작업, Claude가 대신 못 함)
Google Cloud Console에서 OAuth 클라이언트 생성:
1. https://console.cloud.google.com/ 에서 프로젝트 생성 (또는 기존 프로젝트 사용)
2. "APIs & Services" → "OAuth consent screen" 설정 (External, 앱 이름/로고/지원 이메일 입력)
3. "Credentials" → "Create Credentials" → "OAuth client ID" → Application type: Web application
4. Authorized redirect URI 등록: `https://sprout-theta-rosy.vercel.app/api/auth/callback/google` (로컬 개발용으로 `http://localhost:3000/api/auth/callback/google` 도 추가)
5. 발급된 **Client ID**와 **Client Secret**을 Claude에게 전달 (또는 직접 Vercel env에 등록해도 됨: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)

### Claude가 이어서 할 작업 (Client ID/Secret 받으면)
1. `next-auth/providers/google` 추가, `src/auth.ts`에 Google provider 연결
2. 가족 연결 흐름 재설계:
   - 첫 로그인(Google) 시 소속 가족이 없으면 → "가족 만들기(가족명 입력)" 또는 "초대코드로 합류" 선택 화면
   - 가족 생성 시 여전히 invite code 발급 (공유 패스프레이즈는 이제 불필요)
   - 합류 시 invite code만 입력하면 됨 (패스프레이즈 입력란 제거)
3. `families.passphraseHash` 컬럼 및 관련 로직(`/login`, `/signup`, `/join`의 패스프레이즈 부분) 제거
4. 기존 가족(로운이네) 마이그레이션: 두 분 다 Google 계정으로 최초 로그인 시 기존 family(id=1)에 연결되도록 처리 필요 — **이 부분은 신중하게, 데이터 유실 없이** 처리할 것. (예: 이메일 매칭이 아니라, 최초 1회 초대코드 입력받아 연결하는 방식이 안전함)
5. `/login`, `/signup`, `/join` 페이지 UI를 "Sign in with Google" 버튼 중심으로 재작성
6. `.env.local`과 Vercel 프로덕션 env에 `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` 추가
7. 배포 전 반드시: 기존 가족 로그인 경로가 안 끊기는지 확인, 데이터 row count 재확인

## 지켜야 할 원칙 (사용자가 여러 번 강조함)

- **데이터 유실 절대 금지.** DB 스키마 변경은 항상 nullable 추가 → 백필 → notNull 전환 순서로. DROP/TRUNCATE 금지.
- 프로덕션 배포 전에는 항상 사용자에게 확인받기.
- `next dev`와 `next build`를 동시에 돌리지 말 것 (`.next`에 " 2" 중복 파일 생기는 버그 있음 — 메모리에 기록됨).

## 참고: 이 세션에서 이미 완료된 다른 작업들 (멀티테넌시 이전)

- Milestone에 Place, Special Day 카테고리 추가
- 아이폰 푸시 알림 (Web Push, 새 글/댓글 시 배우자에게 알림, 특정 포스팅으로 딥링크)
- 챗봇 위젯 UI에서 숨김 (코드는 남아있음)
- Settings 페이지 (타임존/생일/Day카운트기준/테마/글씨크기) + 첫 실행 온보딩
- Feed: 업로드된 날짜 표시, Calendar/Uploaded date × Latest/Oldest 필터, Edited 표시
- 본인 글만 Edit/Delete 가능하도록 권한 제한 (서버+클라이언트 양쪽)
