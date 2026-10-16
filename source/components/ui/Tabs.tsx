'use client';
/**
 * <Tabs> / <Segmented> — one component for every switch on the site:
 * category chips, trending tabs, PDP tabs, account tabs, checkout steps, size guide units, currency, blog categories.
 * - Sliding pill via Framer Motion shared layout (layoutId)
 * - ARIA tablist / tab / aria-selected, roving tabindex, ← → Home End
 * - Optional URL sync (?tab=…) via `urlKey`
 * - Config-driven: pass `items` from config or catalog
 */
import { useCallback, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

export type TabItem<V extends string = string> = { value: V; label: React.ReactNode; count?: number; disabled?: boolean };

type Props<V extends string> = {
  items: TabItem<V>[];
  value: V;
  onChange?: (v: V) => void;
  urlKey?: string;                     // e.g. 'tab' → keeps ?tab=… in sync (shallow replace)
  variant?: 'pill' | 'chip' | 'dark';
  size?: 'sm' | 'md';
  label: string;                       // accessible name
  className?: string;
};

export function Tabs<V extends string>({ items, value, onChange, urlKey, variant = 'pill', size = 'md', label, className }: Props<V>) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromUrl = urlKey ? (params.get(urlKey) as V | null) : null;
  const current = fromUrl && items.some(i => i.value === fromUrl) ? fromUrl : value;

  const select = useCallback((v: V) => {
    onChange?.(v);
    if (urlKey) {
      const q = new URLSearchParams(params.toString());
      q.set(urlKey, v);
      router.replace(`${pathname}?${q}`, { scroll: false });
    }
  }, [onChange, urlKey, params, pathname, router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const enabled = items.filter(i => !i.disabled);
    const i = enabled.findIndex(t => t.value === current);
    const next = { ArrowRight: (i + 1) % enabled.length, ArrowLeft: (i - 1 + enabled.length) % enabled.length, Home: 0, End: enabled.length - 1 }[e.key as 'Home'];
    if (next === undefined) return;
    e.preventDefault();
    select(enabled[next].value);
    ref.current?.querySelector<HTMLButtonElement>(`[data-value="${enabled[next].value}"]`)?.focus();
  };

  return (
    <div ref={ref} role="tablist" aria-label={label} onKeyDown={onKeyDown}
      className={cn('relative inline-flex max-w-full gap-1 overflow-x-auto no-scrollbar isolate',
        variant === 'pill' && 'rounded-full bg-surface p-1', variant === 'dark' && 'rounded-full bg-white/10 p-1', variant === 'chip' && 'gap-2', className)}>
      {items.map(t => {
        const on = t.value === current;
        return (
          <button key={t.value} type="button" role="tab" id={`${id}-${t.value}`} data-value={t.value}
            aria-selected={on} tabIndex={on ? 0 : -1} disabled={t.disabled} onClick={() => select(t.value)}
            className={cn('relative whitespace-nowrap rounded-full font-bold transition-colors',
              size === 'sm' ? 'h-[30px] px-3 text-xs' : 'h-[38px] px-[18px] text-[13px]',
              variant === 'chip' && 'h-10 border border-line',
              on ? (variant === 'dark' ? 'text-ink-fixed' : 'text-paper') : (variant === 'dark' ? 'text-white/75' : 'text-ink'))}>
            {on && (
              <motion.span layoutId={`tabs-pill-${id}`} className={cn('absolute inset-0 -z-10 rounded-full', variant === 'dark' ? 'bg-white' : 'bg-ink')}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 38 }} />
            )}
            {t.label}{t.count != null && <span className="ml-1.5 text-[11px] opacity-60">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Alias: same control, semantic name for 2–3 option switches (cm/in, NGN/USD). */
export const Segmented = Tabs;
