
import { useEffect, useRef, useState } from 'react';

function parseCount(value) {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return {
      number: value,
      format: (n) => new Intl.NumberFormat().format(n),
    };
  }

  if (
    typeof value !== 'string' ||
    !/^\s*-?\d[\d,]*(?:\.\d+)?\s*$/.test(value)
  ) {
    return null;
  }

  const number = Number(value.replace(/,/g, '').trim());

  if (!Number.isFinite(number)) return null;

  const decimals = (value.split('.')[1] || '').length;

  return {
    number,
    format: (n) =>
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      }).format(n),
  };
}

export default function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = 'navy',
}) {
  const tones = {
    navy: {
      background: 'var(--asems-stat-navy-bg)',
      color: 'var(--asems-stat-navy-text)',
    },
    gold: {
      background: 'var(--asems-stat-gold-bg)',
      color: 'var(--asems-stat-gold-text)',
    },
    teal: {
      background: 'var(--asems-stat-teal-bg)',
      color: 'var(--asems-stat-teal-text)',
    },
    slate: {
      background: 'var(--asems-stat-slate-bg)',
      color: 'var(--asems-stat-slate-text)',
    },
  };

  const iconTone = tones[tone] || tones.navy;
  const cardRef = useRef(null);
  const frameRef = useRef(null);

  const [displayValue, setDisplayValue] = useState(
    value ?? '—'
  );

  useEffect(() => {
    const parsed = parseCount(value);

    if (!parsed) {
      setDisplayValue(value ?? '—');
      return undefined;
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      ).matches
    ) {
      setDisplayValue(parsed.format(parsed.number));
      return undefined;
    }

    let start;
    let frame;

    const duration = 650;

    const animate = (now) => {
      if (start === undefined) start = now;

      const progress = Math.min(
        (now - start) / duration,
        1
      );

      const eased = 1 - (1 - progress) ** 3;

      setDisplayValue(
        parsed.format(parsed.number * eased)
      );

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  const handlePointerMove = (event) => {
    if (
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      ).matches ||
      !cardRef.current
    ) {
      return;
    }

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    frameRef.current = window.requestAnimationFrame(() => {
      card.style.setProperty(
        '--stat-rotate-x',
        `${(0.5 - y) * 4}deg`
      );

      card.style.setProperty(
        '--stat-rotate-y',
        `${(x - 0.5) * 5}deg`
      );

      card.style.setProperty(
        '--stat-glow-x',
        `${x * 100}%`
      );

      card.style.setProperty(
        '--stat-glow-y',
        `${y * 100}%`
      );
    });
  };

  const resetTilt = () => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }

    if (!cardRef.current) return;

    cardRef.current.style.setProperty(
      '--stat-rotate-x',
      '0deg'
    );

    cardRef.current.style.setProperty(
      '--stat-rotate-y',
      '0deg'
    );
  };

  return (
    <article
      ref={cardRef}
      className={`asems-stat-card asems-stat-card--${tone} min-w-0 p-5`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div className="asems-stat-card__content flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="asems-muted text-sm font-medium">
            {label}
          </p>

          <p
            className="asems-text-primary asems-stat-value mt-2 text-3xl font-semibold tracking-tight"
            aria-live="off"
          >
            {displayValue}
          </p>
        </div>

        {Icon && (
          <span
            className="asems-stat-icon rounded-xl p-3"
            style={{
              background: iconTone.background,
              color: iconTone.color,
            }}
          >
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
      </div>

      {note && (
        <p className="asems-muted mt-3 text-xs leading-5">
          {note}
        </p>
      )}
    </article>
  );
}
