import { useEntryStore } from '../stores/entry.store';

/**
 * 入口页(第一屏,在签桶界面之前)
 * 米白底 + 品牌区「孩子气 / 真心话」+ 两个版本入口卡片:
 *  - 情侣版:红底白字主卡(视觉主角),可点击 → 进入情侣版签桶界面(couple 页抽签流程)
 *  - 朋友版:浅米白底卡片,可点击 → 进入朋友版抽卡台(table 页)
 */

function HeartDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20.2c-4.6-3.1-8-6.3-8-10.1 0-2.9 2.2-5.1 5-5.1 1.3 0 2.5.6 3 1.6.5-1 1.7-1.6 3-1.6 2.8 0 5 2.2 5 5.1 0 3.8-3.4 7-8 10.1z" />
    </svg>
  );
}

function ArrowDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export default function EntryPage() {
  const focusedEdition = useEntryStore((s) => s.focusedEdition);
  const setFocus = useEntryStore((s) => s.setFocus);

  const goCouple = () => {
    setFocus('couple');
    window.App.transitionTo('couple');
  };

  const goFriend = () => {
    setFocus('friend');
    window.location.assign('/truth-or-dare/friend/table.html');
  };

  return (
    <div className="antialiased relative flex min-h-dvh w-full flex-col overflow-hidden bg-surface-front font-zh">
      {/* 品牌区:居上不贴边,上下留白均衡 */}
      <header
        className="flex flex-col items-center gap-tight px-comfortable"
        style={{ paddingTop: 'max(var(--spacing-stack-lg), env(safe-area-inset-top, 0px))' }}
      >
        <HeartDoodle className="h-7 w-7 text-brand-primary" />
        <h1
          className="text-center font-zh text-h1 font-extrabold text-brand-primary"
          style={{
            lineHeight: 'var(--line-height-h1)',
            letterSpacing: 'var(--letter-spacing-h1)',
          }}
        >
          孩子气
        </h1>
        <p
          className="text-center font-zh text-body font-bold text-text-secondary"
          style={{ letterSpacing: '0.28em' }}
        >
          真心话
        </p>
      </header>

      {/* 版本入口卡片 */}
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-comfortable px-comfortable py-stack-md">
        {/* 情侣版(视觉主角,可点击) */}
        <button
          type="button"
          onClick={goCouple}
          aria-label="进入情侣版签桶"
          className="relative flex w-[82%] max-w-[320px] cursor-pointer flex-col items-start gap-tight overflow-hidden rounded-2xl bg-brand-primary text-left text-text-inverse transition-all duration-200 ease-out hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98]"
          style={{
            padding: 'var(--spacing-comfortable)',
            boxShadow: 'var(--shadow-card-hover)',
            transform: focusedEdition === 'couple' ? 'translateY(-2px) scale(1.02)' : undefined,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* 手绘爱心装饰 */}
          <HeartDoodle className="absolute -right-3 -top-3 h-20 w-20 rotate-12 opacity-25" />
          <HeartDoodle className="absolute bottom-4 right-8 h-8 w-8 -rotate-12 opacity-20" />

          <span
            className="font-body text-caption uppercase"
            style={{ letterSpacing: '0.18em', opacity: 0.7 }}
          >
            COUPLES
          </span>
          <span className="flex w-full items-center justify-between gap-tight">
            <span
              className="font-zh text-h2 font-extrabold"
              style={{
                lineHeight: 'var(--line-height-h2)',
                letterSpacing: 'var(--letter-spacing-h2)',
              }}
            >
              情侣版
            </span>
            <ArrowDoodle className="h-6 w-6 shrink-0" />
          </span>
          <span className="font-zh text-caption" style={{ opacity: 0.8 }}>
            两个人的默契考验
          </span>
          <span
            className="mt-tight inline-flex items-center rounded-full bg-text-inverse font-zh text-caption font-bold text-brand-primary"
            style={{ padding: 'var(--spacing-micro) var(--spacing-snug)' }}
          >
            立即开玩
          </span>
        </button>

        {/* 朋友版(可点击 → 进入朋友版抽卡台) */}
        <button
          type="button"
          onClick={goFriend}
          aria-label="进入朋友版抽卡台"
          className="relative flex w-[82%] max-w-[320px] cursor-pointer flex-col items-start gap-tight overflow-hidden rounded-2xl border border-border-subtle bg-surface-doodle-light text-left transition-all duration-200 ease-out hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98]"
          style={{
            padding: 'var(--spacing-comfortable)',
            boxShadow: 'var(--shadow-card)',
            transform: focusedEdition === 'friend' ? 'translateY(-2px) scale(1.02)' : undefined,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span
            className="font-body text-caption uppercase text-text-secondary"
            style={{ letterSpacing: '0.18em', opacity: 0.7 }}
          >
            FRIENDS
          </span>
          <span className="flex w-full items-center justify-between gap-tight">
            <span
              className="font-zh text-h2 font-extrabold text-text-primary"
              style={{
                lineHeight: 'var(--line-height-h2)',
                letterSpacing: 'var(--letter-spacing-h2)',
              }}
            >
              朋友版
            </span>
            <ArrowDoodle className="h-6 w-6 shrink-0 text-text-secondary" />
          </span>
          <span className="font-zh text-caption text-text-secondary">
            和朋友们的心动问答
          </span>
          <span
            className="mt-tight inline-flex items-center rounded-full bg-brand-primary font-zh text-caption font-bold text-text-inverse"
            style={{ padding: 'var(--spacing-micro) var(--spacing-snug)' }}
          >
            开始抽卡
          </span>
        </button>
      </main>

      {/* 底部小字 */}
      <footer
        className="flex justify-center px-comfortable"
        style={{ paddingBottom: 'max(var(--spacing-stack-md), env(safe-area-inset-bottom, 0px))' }}
      >
        <p className="font-zh text-caption text-text-secondary" style={{ opacity: 0.7 }}>
          你这样看世界啊 · KIDULT
        </p>
      </footer>
    </div>
  );
}
