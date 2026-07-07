import { useState } from 'react';
import { useUpdateLiftsMutation } from '../api';
import type { Lift, Unit } from '../schemas';

export default function SetupForm({ lifts }: { lifts: Lift[] }) {
  const [updateLifts, { isLoading }] = useUpdateLiftsMutation();

  const [unit, setUnit] = useState<Unit>(lifts[0]?.unit ?? 'kg');
  const [maxes, setMaxes] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      lifts.map((l) => [l.slug, l.trainingMax ? String(l.trainingMax) : '']),
    ),
  );

  const setMax = (slug: string, raw: string) =>
    setMaxes((m) => ({ ...m, [slug]: raw.replace(/[^0-9.]/g, '') }));

  const submit = () =>
    updateLifts(
      lifts.map((l) => ({
        slug: l.slug,
        trainingMax: parseFloat(maxes[l.slug] || '0') || 0,
        unit,
      })),
    );

  return (
    <section className="card setup">
      <div className="card-head">
        <h2>Training maxes</h2>
        <div className="unit-toggle" role="group" aria-label="Weight unit">
          {(['kg', 'lb'] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              className={unit === u ? 'on' : ''}
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <p className="hint">
        Use about 90% of your true one-rep max &mdash; Wendler&rsquo;s rule is
        &ldquo;start too light.&rdquo;
      </p>

      <div className="lift-inputs">
        {lifts.map((l) => (
          <label key={l.slug} className="lift-input">
            <span className="lift-input-name">{l.name}</span>
            <span className="field">
              <input
                inputMode="decimal"
                placeholder="0"
                value={maxes[l.slug] ?? ''}
                onChange={(e) => setMax(l.slug, e.target.value)}
              />
              <span className="field-unit">{unit}</span>
            </span>
          </label>
        ))}
      </div>

      <button className="primary" type="button" onClick={submit} disabled={isLoading}>
        {isLoading ? 'Calculating\u2026' : 'Calculate cycle'}
      </button>
    </section>
  );
}
