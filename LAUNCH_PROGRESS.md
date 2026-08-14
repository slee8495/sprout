# Roun 시판 준비 — 진행 상황 (2026-08-13 기준)

이 파일은 다음 Claude Code 세션(재부팅 후 포함)에서 이어서 작업하기 위한 핸드오프 노트입니다.
새 세션에서 이 repo를 열고 "LAUNCH_PROGRESS.md 읽고 이어서 진행해줘" 라고 하면 됩니다.

**이전 버전(2026-08-10 기준) 내용은 대부분 완료되었거나 상황이 바뀌어서 이 문서로 교체함.**
앱 이름이 **Sprout → Roun**으로 리브랜딩 완료된 상태에서 시작합니다.

## 현재 상태 요약

- **리브랜딩(Sprout → Roun) 완료.** 앱 이름, 아이콘, 도메인(`roun.sl-studio.dev`), Play Store 설명/웹사이트/Feature graphic까지 전부 교체 완료.
- **오늘 발견한 실제 버그: 네이티브 앱 안에서 구글 로그인 시 "서버 에러" 재현.** 원인 진단 완료, 수정 코드 작성 완료. **아직 배포 전** — 이 문서의 최우선 순위.
- Play Store Closed testing: 테스터 이메일 리스트엔 5명, **실제 opt-in 완료는 2명뿐** — 12명 필요.
- Apple Developer Program: 결제($99)는 됐는데 App Store Connect 로그인이 풀려있어서 상태 재확인 못함 — 사용자가 직접 로그인해서 확인 필요.
- **맥북이 메모리 부족 상태 (스왑 4.9GB 사용, 21일 무재부팅) — 재부팅 예정.** 재부팅과 이 작업은 무관.

---

## 🔴 최우선 — 네이티브 앱 로그인 버그 (진단 완료, 수정 완료, 배포 전)

### 증상
장모님 삼성폰으로 Play 테스터 링크를 통해 앱을 설치하고, **앱 안에서** "Sign in with Google"을 누르면 여전히 "서버 에러"가 남. 몇 주 전에 고쳤던 것과 똑같아 보이는 에러.

### 진단
Vercel 로그(`vercel logs https://roun.sl-studio.dev`)에서 실시간 확인:
```
[auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed
```
- 몇 주 전 고친 Cache-Control 헤더 픽스(`next.config.ts`)는 **여전히 정상 적용 중**임을 `curl -sI`로 직접 확인함 (`cache-control: no-store, private` 응답 확인). 그러니까 이전 버그가 재발한 게 아니라 **다른 원인**.
- **진짜 원인**: Roun 앱은 Capacitor로 감싼 웹앱이라 "Sign in with Google"을 누르면 **앱에 내장된 WebView 안에서** 구글 로그인 페이지로 이동함. 그런데:
  1. 구글은 정책상 앱에 내장된 WebView에서의 OAuth 로그인을 신뢰하지 않음
  2. 특히 제조사가 커스터마이즈한 WebView(삼성폰 등)에서는 로그인 중간에 쓰는 PKCE 임시 쿠키가 리다이렉트 왕복 사이에 유실되는 경우가 흔함
  3. 게다가 앱의 내장 WebView와 휴대폰의 시스템 브라우저(Chrome/Samsung Internet)는 **쿠키 저장소 자체가 분리**되어 있어서, 설령 로그인이 성공해도 세션이 앱 쪽에 반영이 안 됨

### 해결 방식 (구현 완료)
네이티브 앱에서 로그인할 때는 **시스템 브라우저(Custom Tabs / SFSafariViewController)를 열어서** 로그인시키고, 끝나면 **커스텀 URL 스킴 딥링크**로 앱에 세션을 안전하게 넘기는 표준 하이브리드 앱 패턴으로 변경.

**플로우**: 앱에서 로그인 버튼 클릭 → 시스템 브라우저가 열려서 구글 로그인 진행 → 성공하면 우리 서버가 60초~2분짜리 1회용 서명된 토큰을 발급 → `dev.slstudio.sprout://mobile-auth?token=...` 딥링크로 앱을 다시 열게 함 → 앱이 그 토큰으로 자기 자신의 WebView 안에서 정식 로그인 완료.

### 변경된/새로 만든 파일
**신규:**
- `src/lib/mobileAuth.ts` — 1회용 핸드오프 토큰 서명/검증 (jose, HS256, `AUTH_SECRET` 재사용, 2분 만료)
- `src/app/api/mobile-login/route.ts` — 앱이 시스템 브라우저로 여는 진입점, 서버사이드로 `signIn("google", { redirectTo: "/api/auth/mobile-callback" })` 호출
- `src/app/api/auth/mobile-callback/route.ts` — 구글 로그인 성공 직후(시스템 브라우저 안에서) 호출됨, 토큰 발급 후 `dev.slstudio.sprout://mobile-auth?token=...`로 리다이렉트
- `src/app/login/GoogleSignInButton.tsx` — 로그인 버튼을 클라이언트 컴포넌트로 분리. `Capacitor.isNativePlatform()`이면 `Browser.open()`으로 시스템 브라우저 열기, 웹이면 기존 서버 액션 폼 그대로
- `src/app/MobileAuthListener.tsx` — 앱 전역에 마운트, `@capacitor/app`의 `appUrlOpen` 이벤트를 리스닝하다가 딥링크로 토큰이 오면 `signIn("mobile-handoff", { token })` 호출해서 앱 자체 WebView 세션 완성

**수정:**
- `src/auth.ts` — `"mobile-handoff"`라는 Credentials provider 추가 (토큰 검증 후 유저 조회, 기존 `jwt` 콜백이 그대로 재사용됨)
- `src/app/login/page.tsx` — 새 `GoogleSignInButton` 사용하도록 교체
- `src/app/layout.tsx` — `MobileAuthListener` 마운트
- `src/db/queries.ts` — `getUserById()` 추가
- `android/app/src/main/AndroidManifest.xml` — 커스텀 스킴(`dev.slstudio.sprout`, 기존 `strings.xml`의 `custom_url_scheme` 재사용) 받는 intent-filter 추가
- `ios/App/App/Info.plist` — `CFBundleURLTypes`에 같은 스킴 등록 (iOS `SceneDelegate.swift`는 Capacitor 기본 boilerplate가 이미 딥링크를 플러그인으로 포워딩하고 있어서 별도 코드 수정 불필요)

**패키지:**
- `@capacitor/browser`, `@capacitor/app` 신규 설치 완료
- `npx cap sync` 실행 완료 — Android/iOS 양쪽에 두 플러그인 정상 등록 확인함 (`@capacitor/app@8.1.1`, `@capacitor/browser@8.0.4`)

### 검증 상태
- `tsc --noEmit` 통과 확인함
- eslint 검사는 시스템이 느려서(아래 "맥북 메모리 부족" 참고) 백그라운드로 오래 걸리는 중 — **다음 세션에서 결과 먼저 확인할 것**

### 진행 상황 업데이트 (2026-08-13, 같은 날 이어서 — 전부 완료)
1. ✅ eslint 통과 (에러 없음)
2. ✅ Vercel 프로덕션 배포 — 배포 직후 **실제 버그 하나 더 발견**: `/api/mobile-login`이 `src/proxy.ts`의 미들웨어 matcher에서 빠져있어서, 로그아웃 상태로 이 경로를 치면 우리 라우트 로직이 실행되기도 전에 `/login`으로 리다이렉트되던 문제 발견 → matcher에 `api/mobile-login` 추가하고 재배포, `curl`로 정상적으로 구글 OAuth URL까지 리다이렉트되는 것 확인함.
3. ✅ `android/app/build.gradle`: `versionCode 2/versionName "1.1"` → **`versionCode 3/versionName "1.2"`**
4. ✅ Android 릴리즈 빌드 (`./gradlew bundleRelease`) — 빌드 중간에 `android/app/build/` 캐시 폴더가 깨져있어서(`splash 2.png` 같은 " 2" 중복 파일, gitignore된 순수 빌드 산출물이라 안전하게 삭제) 클린 후 재빌드로 성공. `app-release.aab` (7.4MB) 생성됨.
5. ✅ Play Console → Test and release → Closed testing → Alpha 트랙에 새 릴리즈 업로드 → 릴리즈 노트(`Fixes Google sign-in inside the app for some devices.`) 작성 → **"1 change sent for review"로 Google에 제출 완료**. 자동 검사(보통 몇 분~시간) 통과하면 기존 테스터들에게 자동 반영됨 — 새로 재설치 안 해도 Play Store 자동 업데이트로 받게 됨.
6. ⬜ iOS는 아직 손 안 댐 — Apple 계정 로그인이 풀려있어서 상태 재확인 필요 (위 "Apple Developer Program" 섹션 참고). 웹/iOS 딥링크 설정(`Info.plist`)은 코드에 이미 반영되어 있음 — Xcode 아카이브 재빌드 + 제출만 남음, Apple 쪽 막힘과는 별개로 언제든 진행 가능.
7. ⬜ **다음 세션에서 확인할 것**: Play Console에서 릴리즈 3(1.2)가 실제로 "Active"로 바뀌었는지, 그리고 장모님 계정으로 다시 로그인 테스트 재시도 결과.

### 🔴 배포 직후 발생한 2차 장애 (같은 날, 발견 즉시 수정·배포 완료)

**증상**: 위 릴리즈 제출 직후, "Sign in with Google" 눌러도 다음 화면으로 전혀 안 넘어감. Sentry에 실시간 에러 수신:
```
Error: "App" plugin is not implemented on android
  at node_modules/@capacitor/core/build/runtime.js
device: Samsung SM-A716U, Android 13, Chrome Mobile WebView
```

**원인**: 이 앱은 Capacitor **"remote URL" 방식**이라 웹 프론트엔드를 APK에 내장하지 않고 `roun.sl-studio.dev`에서 실시간으로 불러옴. 즉 **Vercel 배포는 이미 설치된 모든 앱에 즉시 반영**되지만, 새로 추가한 `@capacitor/app`/`@capacitor/browser` 같은 **네이티브 플러그인은 그 플러그인이 포함된 새 APK를 설치해야만 존재**함. 그래서 아직 새 APK(3/1.2, Google 리뷰 중이라 아직 미배포)를 못 받은 기존 설치 앱 전부가 "없는 플러그인을 호출"하면서 로그인 버튼이 먹통이 됨 — 원래 버그를 고치려다 기존 유저 전원의 로그인을 일시적으로 더 깨버린 상황.

**수정 (완료, 배포됨)**: `Capacitor.isNativePlatform()` 체크에 `Capacitor.isPluginAvailable("Browser")` / `Capacitor.isPluginAvailable("App")`을 추가 — 플러그인이 실제로 없으면(옛날 APK) 자동으로 기존 내장 WebView 로그인 방식으로 폴백. 새 APK가 깔린 기기는 새 시스템 브라우저 방식 사용. 두 버전이 공존하는 롤아웃 기간에도 로그인이 깨지지 않도록 방어함.
- `src/app/login/GoogleSignInButton.tsx`, `src/app/MobileAuthListener.tsx` 수정
- `tsc --noEmit` 통과 확인 후 즉시 `vercel deploy --prod`로 프로덕션 재배포 완료

**교훈 (다음에 remote-URL Capacitor 앱에 네이티브 플러그인 추가할 때 항상 적용)**: 새 Capacitor 플러그인을 쓰는 웹 코드를 배포하기 **전에** 반드시 `Capacitor.isPluginAvailable()` 가드를 먼저 넣을 것 — 이 앱 구조상 웹 배포와 네이티브 앱 롤아웃 사이에 항상 시차가 생기고, 그 사이엔 신/구 조합이 공존함.

**다음 세션 확인할 것**: 장모님(또는 아무 기존 설치 앱 사용자)이 지금 다시 로그인 시도했을 때 정상 동작하는지, Sentry에 같은 에러가 더 안 올라오는지.

### ✅ 릴리즈 3(1.2) Google 리뷰 통과 (같은 날, 2026-08-13 오후 1:43)

제출 후 약 30분 만에 통과, "Available to selected testers"로 전환됨. 이후 장모님이 실제로 테스트:
- 로그인 자체(구글 인증)는 성공했음 — 그런데 로그인 끝난 뒤에도 **시스템 브라우저(Custom Tab) 화면에 그대로 남아있고 앱으로 안 돌아와지는** 문제 발견. Custom Tab이 URL 바 있는 채로 "웹사이트처럼" 보이고 네이티브 앱으로 안 넘어감.

**원인**: 딥링크(`dev.slstudio.sprout://...`)로 OS가 앱을 전면에 띄우긴 하지만, 그걸 열었던 시스템 브라우저(Custom Tab) 자체를 명시적으로 닫아주지 않으면 뒤에 그대로 남아있을 수 있음 — `MobileAuthListener.tsx`에 `Browser.close()` 호출이 빠져있었음.

**수정 (완료, 배포됨)**: `src/app/MobileAuthListener.tsx`에서 딥링크 수신 시 `Browser.close()`를 명시적으로 호출하도록 추가. **이건 네이티브 플러그인 자체는 이미 3(1.2)에 들어있고 JS 쪽 호출만 빠졌던 거라, 새 APK 빌드 없이 이번 Vercel 배포만으로 바로 반영됨** (장모님이 이미 3(1.2)를 갖고 있으므로).

### ✅ 노티피케이션 두 가지 개선 (같은 날, 배포 완료)

1. **Feed 화면에 이미 머물러 있는 상태에서 다른 알림을 누르면 탭이 안 바뀌던 버그** — `FeedTabs.tsx`의 `useState(() => ...)` lazy initializer가 마운트 시 딱 한 번만 실행되는 게 원인. Next.js App Router가 같은 `/feed` 라우트 안에서의 클라이언트 네비게이션 시 컴포넌트 인스턴스를 재사용해서, `highlightEntryId`가 바뀌어도 재계산이 안 되고 있었음. `useEffect`로 `highlightEntryId` 변경을 감지해서 탭을 다시 계산하도록 수정 (`resolveHighlightTab` 헬퍼로 로직 공유, `appliedHighlightRef`로 중복 적용 방지).
2. **알림에 아들 것인지 강아지 것인지 Parents인지 표시** — `src/app/actions.ts`의 `createEntry`/`updateDraft`/`addComment`에서 알림 제목에 `subjectLabel()` 추가 (예: `🌱 Baby 1 · Dad`, `🐾 Brownie · Mom`, `💌 Parents · Dad`, 댓글은 `💬 Baby 1 · Mom` 형태). `addComment`가 대상 엔트리의 child 정보를 알 수 있도록 `src/db/queries.ts`의 `createComment`가 `audience`/`childId`도 함께 반환하도록 수정.

**다음 세션에서 확인**: 위 두 노티 개선사항과 Browser.close() 수정 모두 실제로 정상 동작하는지 (장모님 로그인 재시도, 아들/강아지 알림 텍스트, Feed 안에 있을 때 다른 알림 탭 전환).

### ✅ 로그인 후 앱으로 안 돌아오던 문제 추가 조치 (같은 날)

장모님 폰 스크린샷으로 확인: Custom Tab이 아니라 **완전한 Chrome 브라우저 앱 자체**가 열려서 갇혀있었음(구글 번역 아이콘 등 일반 브라우저 UI 확인됨). `/api/auth/mobile-callback`이 순수 HTTP `Location` 헤더로 커스텀 스킴(`dev.slstudio.sprout://...`)을 리다이렉트하던 방식은 크롬이 "사용자 제스처 없는 자동 리다이렉트"로 판단해 앱으로 안 넘겨버릴 수 있음 — 이게 진짜 근본 원인으로 보임.

**수정**: `/api/auth/mobile-callback`을 순수 리다이렉트 대신 **HTML 페이지 반환**으로 변경 — 페이지 로드시 JS로 자동 리다이렉트 시도 + "앱이 안 열리면 여기를 탭하세요" 버튼을 항상 같이 보여줌. 자동 전환이 막혀도 사용자가 직접 탭하면 100% 확실하게 앱으로 돌아감 (진짜 사용자 제스처이므로).

### ✅ 로그아웃 후 다른 계정으로 로그인 안 되던 문제

원인: `src/auth.ts`의 Google provider에 `prompt` 파라미터가 없어서, 브라우저에 구글 세션이 남아있으면 계정 선택 화면 자체를 안 보여주고 마지막 계정으로 조용히 재로그인시킴. `prompt: "select_account"` 추가해서 매번 계정 선택 화면이 뜨도록 수정. `curl`로 실제 리다이렉트 URL에 `prompt=select_account` 파라미터 포함된 것 확인함.

### ✅ Pro ⇄ Free 요금제 언제든 전환 가능하게 + 저장공간 꽉 찼을 때 푸시 알림

1. **Pro→Free 전환**: 기존엔 "Manage billing" 버튼으로 Stripe 호스팅 포털에 보내는 방식뿐이었는데, 포털에 "구독 취소" 기능이 실제로 켜져 있는지 Claude가 직접 확인할 방법이 없었음(Stripe 시크릿 키는 Vercel에서 "Sensitive"로 막혀있어 CLI로도 못 읽음 — 의도된 보안 정책이라 그대로 둠). 대신 **앱 안에 직접 "Switch to Free" 버튼을 추가**해서 Stripe 대시보드 설정에 의존하지 않고 확실하게 전환 가능하게 만듦.
   - `billingActions.ts`: `cancelSubscription()`(현재 결제 기간 끝에 취소 예약, `cancel_at_period_end: true`) / `resumeSubscription()`(취소 예약 취소 — Free→Pro 재구독 시 이중 결제 나는 것 방지 위해 별도로 만듦) 추가
   - `settings/page.tsx`: `cancel_at_period_end` 상태는 DB에 안 남기고 Stripe에서 매번 라이브로 조회 (기존 price label 조회 패턴과 동일)
   - `BillingCard.tsx`: Pro 상태에서 "Switch to Free" 링크, 취소 예약된 상태면 "Resume Pro plan" 버튼 + "이번 결제 기간 끝나면 Free로 전환됩니다" 안내문 표시
   - Free→Pro는 기존 "Upgrade to Pro" 버튼 그대로 (이미 잘 됐음)
2. **저장공간 꽉 찼을 때 푸시 알림**: 사진/동영상 업로드가 용량 초과로 막히는 그 순간(`api/photos/upload`, `api/video/raw-upload`) `src/lib/push.ts`의 새 `notifyStorageFull()`이 가족 전원에게 푸시 발송 — "저장공간이 꽉 찼어요, +5GB 추가하려면 Settings로" + 실제 addon 가격(Stripe에서 라이브 조회) 표시. 탭하면 `/settings`로 이동.
3. `src/lib/i18n.ts`에 새 문구 4개 ko/zh/ja/es 번역 추가 (Switch to Free 관련 문구).

**다음 세션 확인**: Pro 계정으로 Switch to Free → Resume 왕복 실제 테스트, 저장공간 꽉 채워서 푸시 알림 실제로 오는지 확인.

### ✅ 실제 폰 푸시 알림이 전혀 안 오던 문제 (근본 원인 발견 및 수정)

증상: 앱 안 종모양(in-app bell)은 정상 작동하는데 실제 폰 알림(백그라운드 푸시)이 전혀 안 옴 — 안드로이드/아이폰 둘 다.

**진단 과정**:
1. 처음엔 "Android WebView/iOS Safari가 Web Push를 원래 잘 지원 안 한다"고 생각했는데, 사용자가 "예전엔 아이폰에서 됐었는데?"라고 정정해줌 — iOS 16.4+ 홈 화면 PWA는 실제로 Web Push 지원됨, 틀린 진단이었음.
2. `src/lib/push.ts`의 발송 실패 처리가 구독 만료(404/410) 외의 모든 에러를 조용히 삼키고 있어서 실제 실패 원인이 안 보였음 → Sentry 캡처 추가.
3. DB 확인: `sanlee8495@gmail.com`의 유일한 구독이 **2026-07-23** 것 — 오늘 도메인이 `roun.sl-studio.dev`로 바뀌기 전 예전 도메인 시절 구독. 임시 진단 라우트(`/api/debug/test-push`, CRON_SECRET 인증)로 실제 발송 테스트 → 애플 푸시 서버는 201(정상 접수) 응답했지만 폰엔 아무것도 안 옴 → 웹 푸시는 도메인(origin)에 완전히 종속되므로 옛날 도메인 구독은 새 도메인에서 무효라고 판단, 홈 화면 아이콘 재설치 요청함.
4. 재설치 후에도 여전히 안 됨 + DB에 새 구독 row가 전혀 안 생김 → **`<PushNotifications />` 컴포넌트가 `src/app/layout.tsx`에서 아예 렌더링되고 있지 않았던 것을 발견** (`grep`으로 확인, 렌더링 코드가 없었음). 알림 켜기 버튼 자체가 없었으니 도메인 이전과 무관하게 애초에 새 구독이 생길 방법이 없었음. git log 확인 결과 예전엔 wire되어 있었는데 이번 세션들의 여러 미커밋 리팩토링 과정에서 layout.tsx가 여러 번 갈아엎이며 빠진 것으로 추정.

**수정 (완료, 배포됨)**:
- `src/app/layout.tsx`: `<PushNotifications />` 복구, 로그인 + 가족 연결된 사용자에게만 렌더링되도록 조건부 처리
- `src/app/PushNotifications.tsx`: 구독 실패 시 조용히 무시하던 걸 Sentry로 캡처 + 사용자에게 에러 문구 표시하도록 개선
- `src/lib/push.ts`: 발송 실패(404/410 아닌 경우) Sentry 캡처 추가
- 임시 진단 라우트 `src/app/api/debug/test-push/route.ts` 남아있음 — 문제 해결 확인되면 삭제할 것 (지금은 재테스트용으로 유지 중)

**다음 세션 확인**: 사용자가 새로고침 후 "🔔 Enable notifications" 버튼 눌러서 새 구독 생성 → 실제 폰 푸시 도착 확인. 확인되면 `/api/debug/test-push` 라우트와 `src/proxy.ts`의 `api/debug` 예외 제거할 것.

### ✅ Settings에 알림 켜기/끄기 토글 추가

기존엔 최초 1회 뜨는 하단 플로팅 버튼으로만 알림을 켤 수 있었고, 끄는 방법이 전혀 없었음(OS 설정 들어가는 것 외엔). Settings 페이지에 켜짐/꺼짐 토글 스위치 추가:
- `src/lib/webPush.ts` (신규) — 구독/해지 로직을 공용 모듈로 분리 (`subscribeToPushNotifications`, `unsubscribeFromPushNotifications`, `getActivePushSubscription`), `PushNotifications.tsx`(최초 프롬프트)와 새 Settings 토글이 같이 씀
- `src/app/settings/NotificationsCard.tsx` (신규) — 켜짐/꺼짐 토글. OS 권한이 "denied"면 토글 대신 "기기 설정에서 허용해주세요" 안내문 표시 (JS로 되돌릴 수 없는 브라우저 제약이라 안내만 함)
- `src/app/settings/page.tsx`에 카드 추가
- SSR/hydration 불일치 방지를 위해 `PushNotifications.tsx`와 동일한 `useSyncExternalStore` 패턴 사용 (권한 상태는 브라우저 전용 API라 서버 렌더링 시점엔 알 수 없음)

---

## Play Store 브랜딩/리스팅 — 완료된 것 (2026-08-13)

- 앱 이름: "Roun" — Live
- 앱 아이콘: 새 새둥지+새싹 로고로 교체, Live
- Store listing 설명(영/한): sl-studio.dev/roun 마케팅 카피 그대로 반영, "이름의 의미(THE NAME)" 섹션 포함, Live
- 웹사이트 필드(Store settings): `https://sl-studio.dev/roun` 저장 완료
- **Feature graphic(스토어 상단 배너)**: 옛날 "Sprout" 로고 배너 → 새 Roun 로고+태그라인 배너로 교체, **Google에 리뷰 제출 완료** ("1 change sent for review", 보통 몇 시간~7일 내 반영)
- 폰 스크린샷 4장: 브랜딩 문제 없음 (제네릭 UI라 옛 이름 안 보임) — 손 안 댐

### 테스터 링크 관련 Q&A (결론)
- **테스터 링크(`https://play.google.com/apps/testing/dev.slstudio.sprout`)의 "sprout"는 그대로 둠.** 이건 안드로이드 패키지 ID(`dev.slstudio.sprout`)라서 리브랜딩 때 일부러 안 바꿈 — 바꾸면 기존 12일치 테스터/리뷰 이력이 전부 날아가고 스토어 리스팅을 처음부터 다시 만들어야 함.
- **새 테스터 링크 필요 없음.** 패키지 ID가 그대로라서 기존 링크 계속 유효, 기존 opt-in 테스터도 유지됨.

### 남은 블로커: 테스터 숫자
- Closed testing "Alpha" 트랙 → Testers 탭 확인: 이메일 리스트("Sprout closed testers")엔 **5명** 등록, 그 중 **opt-in 완료(실제로 링크 눌러서 참여)는 2명뿐**.
- 프로덕션 신청하려면 **12명이 14일 연속 opt-in** 되어 있어야 함.
- 리스트에 이메일만 올라간 걸론 카운트 안 됨 — 각자 `https://play.google.com/apps/testing/dev.slstudio.sprout` 링크를 열고 "테스터 되기"를 실제로 눌러야 함.
- 리스트에 있는 5명(추정): 사용자 본인, 동생(cruzstyle.sy@gmail.com), draleev90@gmail.com, 아빠(ljs54055405@gmail.com), 엄마(jks54055405@gmail.com). 장모님 계정은 이번에 새로 시도 중 — 다만 로그인 버그가 있어서 실제 opt-in/사용 확인은 위 로그인 버그 수정 배포 후 재시도 필요할 수 있음.

---

## 🔴 Apple Developer Program — 결제 미완료로 확인됨 (2026-08-14)

- 이전 세션들에선 "$99 결제 완료된 것으로 파악"이라고 적혀 있었는데, **실제로는 틀렸음.**
- 오늘 로그인 재시도 → App Store Connect에서 "Your Apple Account isn't enabled for App Store Connect" 에러 → `developer.apple.com/account`에서 실제 상태 확인함:
  - 계정 상태: **"Stan Lee (Pending)"**
  - 화면 메시지: "Purchase your membership. To continue your enrollment, **complete your purchase now**. Your purchase may take up to 48 hours to process."
  - 즉 **결제(구매)가 끝까지 처리가 안 되고 Pending에 걸려있던 것**이 App Store Connect 접근 안 되던 진짜 원인. 로그인/2FA 문제가 아니었음.
- **다음 세션 확인할 것**: 사용자가 `developer.apple.com/account`에서 "complete your purchase now" 눌러서 결제 직접 마무리했는지, 그리고 최대 48시간 처리 후 App Store Connect가 정상적으로 열리는지.
- 결제 완료 후에는 Marketing URL / Support URL 필드에 `https://sl-studio.dev/roun` 등록 작업 이어서 진행 (Play Store 웹사이트 필드와 동일한 목적).
- 참고: 결제/구매는 카드 정보 입력이 필요해서 Claude가 대신 처리 안 함 — 사용자가 직접 완료해야 함.

---

## 맥북 메모리 부족 (재부팅 권장, 코드와 무관)

`2026-08-13` 확인 결과:
- 스왑 사용량 **4.9GB / 여유 1.2GB** — 물리 메모리 부족으로 디스크 스왑 심하게 사용 중
- 여유 물리 메모리 거의 없음 (free page 기준 ~100MB 수준)
- **21일째 재부팅 안 함** — VS Code, Chrome(여러 탭), iCloud 동기화 데몬(cloudd, bird) 등이 누적됨

**"여기저기 다 느리다"는 증상은 코드/작업과 무관한 시스템 전체 메모리 압박.** 재부팅하면 해결될 것으로 예상. eslint 백그라운드 작업이 유독 오래 걸리는 것도 이 때문일 가능성 높음.

재부팅 후 이 문서(`LAUNCH_PROGRESS.md`)부터 다시 읽고 "🔴 최우선" 섹션의 남은 작업부터 이어가면 됨.

---

## 지켜야 할 원칙 (이전 세션들에서 계속 강조됨, 계속 유효)

- **데이터 유실 절대 금지.** DB 스키마 변경은 항상 nullable 추가 → 백필 → notNull 전환 순서로. DROP/TRUNCATE 금지.
- 프로덕션 배포 전에는 항상 사용자에게 확인받기. 단, DB 스키마 변경과 그걸 전제로 한 코드 배포는 텀 없이 붙여서 진행할 것.
- `next dev`와 `next build`를 동시에 돌리지 말 것 (`.next`에 " 2" 중복 파일 생기는 버그 있음).
- Vercel 자동 모드 안전장치가 프로덕션 env var 수정 같은 명령을 차단할 수 있음 — 이 경우 사용자에게 `!<command>` 형태로 직접 채팅에 입력해달라고 요청.
- **재무/개인정보(카드번호, 신분증, 법적 이름/주소, 비밀번호)는 Claude가 직접 입력하지 않음.**
- iCloud 동기화 폴더 안에서 Xcode 빌드하면 `codesign`이 `resource fork` 에러로 실패함 — DerivedData는 iCloud 밖(`~/Library/Developer/Xcode/DerivedData`) 기본 경로 사용.
- 안드로이드 패키지 ID(`dev.slstudio.sprout`)는 절대 안 바꿈 — Closed testing 이력 보존 목적.

## 🟡 대기 중 — Android "Browser" 플러그인 미구현 에러 (실기기 옆에 두고 고치기로 함, 2026-08-13)

### 증상
새 테스터(준근)가 Play 테스터 링크로 앱 설치 → 앱 열어서 "Sign in with Google" 눌렀는데, 원래 떠야 할 "✅ Signed in to Roun / Return to the app" 중간 화면이 안 뜨고, 그냥 브라우저(Chrome) 안에서 로그인이 계속 진행되어 온보딩 화면까지 브라우저 주소창이 보이는 상태로 렌더링됨. 네이티브 앱으로 안 돌아옴.
장모님 폰에서는 같은 플로우가 정상 작동했음 (앱으로 정상 복귀).

### 진단 (Sentry로 확인, 추측 아님)
Sentry(`sl-studio-le` 프로젝트)에 실제 에러 발견:
```
Error: "Browser" plugin is not implemented on android
mechanism: auto.browser.global_handlers.onunhandledrejection
url: https://roun.sl-studio.dev/login
Frontend: Chrome Mobile WebView 150.0.7871, Android 13
release: eee0bd2c33c7
```
스택트레이스가 `@capacitor/core`의 `createPluginMethodWrapper`가 던지는 `CapacitorException(...Unimplemented)` 그대로 — `src/app/login/GoogleSignInButton.tsx`에서 `Browser.open(...)`을 호출하는 지점.

**핵심 문제**: 코드에 이미 `Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Browser")` 가드가 있는데도 이 에러가 발생함 — 즉 `isPluginAvailable("Browser")`가 **거짓 양성(false positive)**을 낸 것으로 보임. JS 쪽은 "Browser 플러그인 있음"이라 판단해서 네이티브 브라우저를 여는 버튼을 렌더링했지만, 실제 `Browser.open()` 호출 시 그 기기의 네이티브 쪽엔 플러그인이 없거나 등록이 깨져있음.
- `android/app/capacitor.build.gradle`엔 `capacitor-browser`가 정상적으로 dependency로 들어가 있음 (현재 소스 트리 기준).
- `android/app/build.gradle`에 `minifyEnabled false` — ProGuard 난독화로 인한 리플렉션 깨짐은 아님.
- 정확한 근본 원인(오래된 APK 캐시 문제인지, 다른 기기별 이슈인지)은 미확정.

### 왜 단순 try/catch 폴백이 위험한가
`GoogleSignInButton.tsx`의 "regular web" 폴백 분기(`loginWithGoogle` → `src/app/login/actions.ts` → `signIn("google", {redirectTo: "/"})`)는 **앱 내장 WebView 안에서 그대로 구글 로그인을 시도하는 방식**임 — 이게 바로 이 문서 최상단에 있는, 몇 주 전 발견/수정했던 원래의 "서버 에러"(구글이 내장 WebView OAuth를 정책상 거부) 버그 그 자체. `Browser.open()` 실패 시 단순히 이 경로로 폴백시키면, Browser 플러그인이 고장난 기기들한테 **원래 고쳤던 심각한 버그를 다시 되살리는 것**이 됨.

### 다음에 할 일 (실기기 옆에 두고)
- `Browser.open()` 호출을 try/catch(`.catch()`, unhandled rejection이었으므로)로 감싸기
- 실패 시 폴백은 `loginWithGoogle`(내장 WebView 내 구글 로그인)이 아니라, WebView 밖으로 확실히 탈출하는 다른 방법을 실기기에서 검증하며 찾을 것 (예: 순수 `<a target="_blank">`, 안드로이드 intent URL 등 — Capacitor의 기본 WebViewClient가 이런 네비게이션을 어떻게 처리하는지 실기기 없이는 확신 못 함)
- 검증 없이는 배포 금지

---

## 🟡 대기 중 — 인앱 리뷰 요청 (코드 완성, 네이티브 빌드/배포 전, 2026-08-14)

`@capacitor-community/in-app-review` 설치 + `npx cap sync` 완료. `src/lib/inAppReview.ts`의 `maybeRequestReview()`가 실제 엔트리를 3개 발행(초안 아님)한 시점에 OS 자체 리뷰 팝업(iOS `SKStoreReviewController` / Android Play In-App Review)을 한 번 요청하도록 `EntryForm.tsx`의 발행 성공 지점에 연결해둠. `Capacitor.isPluginAvailable("InAppReview")` 가드 + try/catch로, 이 플러그인이 없는 구버전 네이티브 앱이나 그냥 웹 브라우저에서는 안전하게 아무 일도 안 일어남.

**중요**: 이건 웹 배포(`vercel deploy --prod`)만으로는 절대 작동 안 함 — 네이티브 플러그인이라서 Android/iOS 양쪽 다 **새 빌드를 만들어서 각 스토어에 릴리즈해야만** 실제로 팝업이 뜸. 사용자가 명시적으로 "지금은 코드만 준비, 배포는 나중에"라고 결정함.

**다음에 할 일** (Android/iOS 배포 타이밍에 같이 진행):
- Android: `versionCode`/`versionName` 올리고 `./gradlew bundleRelease` → Play Console Closed testing에 업로드
- iOS: Apple Developer Program 결제 문제 해결되고 App Store Connect 정상화된 이후에 진행 (위 Apple 섹션 참고)
- 웹 코드(`src/lib/inAppReview.ts`, `src/app/EntryForm.tsx`)는 이미 커밋되어 있고, 언제 `vercel deploy --prod` 해도 안전함 (네이티브 빌드 전까지는 그냥 비활성 상태로 있음)

---

## 참고: 아직 git commit 안 된 변경사항 많음

이 저장소는 여러 세션에 걸쳐 쌓인 미커밋 변경사항이 많음 (리브랜딩, 권한 시스템, i18n 확장, admin 패널, 오늘 작업한 로그인 수정 등). `git status`로 전체 목록 확인 가능. **커밋 시점은 사용자와 상의해서 결정** — 아직 명시적으로 요청받지 않았으면 임의로 커밋하지 말 것.
