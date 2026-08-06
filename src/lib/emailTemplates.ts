// Transactional emails are bilingual (Korean + English) rather than following the app's
// locale toggle, since that preference lives in browser localStorage only — there's no
// server-side record of a family's language to pick from when sending from a webhook or
// server action.

const WRAPPER_STYLE =
  "font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; color: #27272a;";
const BUTTON_STYLE =
  "display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 999px; font-weight: 600; margin-top: 12px;";

export function welcomeEmail(input: { familyName: string; appUrl: string }): { subject: string; html: string } {
  return {
    subject: "🌱 Sprout에 오신 것을 환영해요 / Welcome to Sprout",
    html: `
      <div style="${WRAPPER_STYLE}">
        <h1 style="color: #047857;">🌱 Sprout</h1>
        <p><strong>${input.familyName}</strong>, 환영해요! 이제 우리 아이/반려동물의 소중한 순간들을 기록할 준비가 됐어요.</p>
        <p style="color: #71717a; font-size: 14px;">
          Welcome, ${input.familyName}! You're all set to start journaling your family's moments.
        </p>
        <a href="${input.appUrl}" style="${BUTTON_STYLE}">저널 시작하기 / Start journaling</a>
        <p style="margin-top: 24px; font-size: 13px; color: #a1a1aa;">
          Settings에서 파트너를 초대하거나 언어(한국어/영어)를 바꿀 수 있어요.<br/>
          You can invite a partner or switch languages anytime from Settings.
        </p>
      </div>
    `,
  };
}

export function subscriptionCanceledEmail(input: { appUrl: string }): { subject: string; html: string } {
  return {
    subject: "Pro 구독이 종료됐어요 / Your Pro subscription has ended",
    html: `
      <div style="${WRAPPER_STYLE}">
        <h1 style="color: #047857;">🌱 Sprout</h1>
        <p>Pro 구독이 종료되어 무료 플랜으로 전환됐어요.</p>
        <p style="font-weight: 600;">지금까지 쓴 모든 일기, 사진, 동영상은 그대로 안전하게 남아있고 계속 볼 수 있어요 — 아무것도 삭제되지 않아요.</p>
        <p>다만 무료 플랜에서는:</p>
        <ul>
          <li>아이/반려동물을 새로 추가할 수 없어요 (이미 등록된 아이는 그대로 유지)</li>
          <li>저장공간 1GB를 넘으면 새 사진/동영상을 추가할 수 없어요 (기존 파일은 그대로 유지)</li>
        </ul>
        <p style="color: #71717a; font-size: 14px; margin-top: 20px;">
          Your Pro subscription has ended and your account is now on the Free plan.
          <strong>Everything you've already written or uploaded stays exactly as it is — nothing is deleted.</strong>
          On the Free plan you just can't add a new child/pet beyond your first one, or upload new photos/videos
          once you're over 1GB — your existing content is unaffected either way.
        </p>
        <a href="${input.appUrl}/settings" style="${BUTTON_STYLE}">다시 구독하기 / Resubscribe</a>
      </div>
    `,
  };
}
