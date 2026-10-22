
export default function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = 'navy',
}) {
  const tones = {
    navy: 'bg-blue-50 text-navy-900',
    gold: 'bg-amber-50 text-amber-700',
    teal: 'bg-teal-50 text-teal-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <article className="panel-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value ?? '—'}
          </p>
        </div>

        {Icon && (
          <span className={`rounded-xl p-3 ${tones[tone] || tones.navy}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
        )}
      </div>

      {note && <p className="mt-3 text-xs text-slate-500">{note}</p>}
    </article>
  );
}
