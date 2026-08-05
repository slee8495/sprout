# Sprout 시판 준비 — 진행 상황 (2026-07-24 기준)

이 파일은 다음 Claude Code 세션에서 이어서 작업하기 위한 핸드오프 노트입니다.
새 세션에서 이 repo를 열고 "LAUNCH_PROGRESS.md 읽고 이어서 진행해줘" 라고 하면 됩니다.

**실행용 체크리스트는 `LAUNCH_CHECKLIST.md`** 에 별도로 정리되어 있음 — 항목 완료될 때마다 거기서 체크.

## 시판 체크리스트 (원래 8개 항목)

1. ✅ **멀티테넌시** — 완료
2. ✅ **진짜 로그인 (Google OAuth)** — 완료 (아래 상세)
3. ⬜ 스토리지 quota + 압축
4. ⬜ 결제 연동 (가족당 $0.99/월 예정)
5. ✅ **아이 여러 명 지원** — 완료 (아래 상세)
6. ⬜ 개인정보/법적 문서
7. ⬜ 관찰성/운영
8. 🔜 다국어, 브랜딩 일반화 — 하드코딩된 "Roun" 이름/문구는 다 제거함. 다국어(i18n)는 아직 미착수

## 방금 완료한 것 1: Google OAuth 로그인

- 패스프레이즈 방식 완전 제거, next-auth v5 beta의 Google provider(커스텀 `type:"oauth"` 설정 — 아래 "주의" 참고)로 교체
- `/login`: "Sign in with Google" 버튼만 있음
- 첫 Google 로그인 시 기존 계정과 이메일 매칭 안 되면 `/connect` → "가족 만들기"(`/signup`) 또는 "초대코드로 참여"(`/join`) 선택
- `/join`은 이름으로 기존 가족 구성원과 매칭되면 그 계정에 구글 이메일을 연결(같은 user id 유지, 작성 이력 보존), 매칭 안 되면 새 멤버 생성
- 기존 가족(로운이네): Dad(id=1) ↔ `sanlee8495@gmail.com`, Mom(id=3) ↔ `ahnsk215@gmail.com` 연결 완료 — 두 분 다 그냥 Google 로그인만 하면 바로 들어와짐 (초대코드 불필요)
- Settings에 Sign out 버튼 추가함 (이전엔 없었음)

### ⚠️ 중요: Google provider가 built-in이 아니라 커스텀 구현임

`src/auth.ts`의 `GoogleProvider()`는 next-auth의 기본 `next-auth/providers/google`을 안 쓰고 직접 구현했음. 이유:
- next-auth v5 beta(`5.0.0-beta.31`)의 OIDC discovery 경로가 Google의 `authorization_response_iss_parameter_supported: true` 처리에서 버그가 있어서(`response parameter "iss" (issuer) missing` 에러) 로그인 자체가 실패했음
- 해결: `type: "oauth"`(oidc 아님) + `authorization`/`token`/`userinfo` 엔드포인트를 명시적으로 지정해서 discovery 자체를 스킵, `issuer`도 직접 설정
- next-auth를 나중에 업그레이드해서 이 버그가 픽스된 게 확인되면(현재 최신 `5.0.0-beta.32`/`@auth/core@0.41.3`엔 아직 안 고쳐져 있었음), built-in `Google` provider로 되돌려도 됨 — 지금 커스텀 구현 자체가 필수는 아니고 우회책임

## 방금 완료한 것 2: 아이 여러 명 지원 + "Roun" 하드코딩 제거

- 새 `children` 테이블 추가 (`familyId`, `name`, `birthDate`, `dayCountStart`) — 기존엔 `families` 테이블에 birthDate/dayCountStart가 가족당 1개만 있었음 (지금도 컬럼은 남아있지만 앱 코드에서는 더 이상 안 씀 — DROP 안 함)
- `journal_entries.child_id` 컬럼 추가 (nullable — "parents"(부모 전용) 글은 특정 아이와 무관하므로 null)
- `audience` enum 값 `"roun"` → `"child"`로 이름 변경 (라벨만 바꾼 거라 데이터 재작성 없음)
- 기존 가족(로운이네)의 birthDate/dayCountStart로 "Roun" child row 생성, 기존 32개 child-audience 글에 child_id 백필 완료
- 홈/피드/마일스톤 전부 아이별로 동작: 아이가 1명이면 지금처럼 그대로 보이고, 2명 이상이면 아이 전환 탭(pill)이 나타남
- 새 글 작성 시 아이 선택(또는 "Parents only") 가능
- `layout.tsx`, `manifest.ts`, `ChatWidget.tsx`, `api/chat/route.ts`, `chatTools.ts`의 하드코딩된 "Roun" 문구 다 제거 (chatTools.ts는 family별 이름을 DB에서 실시간으로 가져옴)
- **덤으로 고친 버그**: `chatTools.ts`의 `searchJournalEntries`/`getMilestoneEntries`가 원래 `familyId` 필터가 아예 없어서 다른 가족 데이터까지 조회 가능했던 크로스테넌트 취약점 — 이번에 고침

### 배포 중 발생했던 사고 (교훈)

`ALTER TYPE audience RENAME VALUE 'roun' TO 'child'`를 프로덕션 DB에 먼저 실행하고, 새 코드를 아직 배포 안 한 상태로 잠깐 방치했다가 — 그 사이 프로덕션에 떠 있던 **구코드**가 `audience = 'roun'`으로 쿼리하다가 DB 에러 나서 사이트가 잠깐 다운됐었음. **교훈: DB 스키마 변경(특히 enum 값 변경)과 그 변경을 전제로 하는 코드 배포는 반드시 같은 타이밍에 붙여서 해야 함, 사이에 텀을 두면 안 됨.**

## 지켜야 할 원칙 (이전 세션들에서 계속 강조됨)

- **데이터 유실 절대 금지.** DB 스키마 변경은 항상 nullable 추가 → 백필 → notNull 전환 순서로. DROP/TRUNCATE 금지 (컬럼이 안 쓰이게 됐어도 일단 남겨둠).
- 프로덕션 배포 전에는 항상 사용자에게 확인받기. 단, DB 스키마 변경과 그걸 전제로 한 코드 배포는 텀 없이 붙여서 진행할 것 (위 사고 참고).
- `next dev`와 `next build`를 동시에 돌리지 말 것 (`.next`에 " 2" 중복 파일 생기는 버그 있음).
- Vercel 자동 모드 안전장치가 `ALTER TYPE`, `vercel deploy --prod` 같은 명령을 차단할 수 있음 — 이 경우 사용자에게 `!<command>` 형태로 직접 채팅에 입력해달라고 요청하면 그 세션에서 바로 실행됨.

## 참고: Vercel 프로젝트 구조

- 프로덕션: `sprout-theta-rosy.vercel.app`
- 프리뷰 배포(`vercel deploy`, `--prod` 없이)는 Vercel 팀 SSO로 보호되어 있어서, 팀 멤버가 아니면 Google 로그인 테스트가 막힘 — 실제 로그인 플로우 테스트는 프로덕션에서 하는 게 제일 간단함 (데이터는 프리뷰/프로덕션이 같은 Neon DB를 공유하므로 위험은 동일)
- Google OAuth 리다이렉트 URI는 정확히 일치해야 함 — 프리뷰 URL로 테스트하려면 그 배포 URL을 Google Console에 매번 추가해야 함 (프로덕션 URL은 이미 등록되어 있음)
