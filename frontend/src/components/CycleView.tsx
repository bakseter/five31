import { useState } from 'react';
import { useGetCycleQuery, useUpdateAmrapMutation } from '../api';
import type { Lift } from '../schemas';

// Local per-lift AMRAP reps, one string per loading week (index 0–2).
type RepState = Record<string, [string, string, string]>;

const seed = (lifts: Lift[]): RepState =>
  Object.fromEntries(
    lifts.map((l) => [
      l.slug,
      [
        l.repsWeek1?.toString() ?? '',
        l.repsWeek2?.toString() ?? '',
        l.repsWeek3?.toString() ?? '',
      ] as [string, string, string],
    ]),
  );

const toReps = (s: string): number | null => {
  if (s.trim() === '') return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : Math.max(0, n);
};

export default function CycleView({ lifts }: { lifts: Lift[] }) {
  const { data: cycle } = useGetCycleQuery();
  const [updateAmrap] = useUpdateAmrapMutation();
  const [reps, setReps] = useState<RepState>(() => seed(lifts));

  if (!cycle) return null;

  const hasMaxes = cycle.weeks.some((w) => w.lifts.some((l) => l.trainingMax > 0));
  if (!hasMaxes) {
    return (
      <section className="empty">
        Enter a training max above to generate your first cycle.
      </section>
    );
  }

  const setRep = (slug: string, week: number, raw: string) =>
    setReps((prev) => {
      const next = { ...prev, [slug]: [...(prev[slug] ?? ['', '', ''])] as [string, string, string] };
      next[slug][week] = raw.replace(/[^0-9]/g, '');
      return next;
    });

  // Persist every lift's logged reps in one call (backend upserts by slug).
  const save = () =>
    updateAmrap(
      lifts.map((l) => {
        const r = reps[l.slug] ?? ['', '', ''];
        return {
          slug: l.slug,
          repsWeek1: toReps(r[0]),
          repsWeek2: toReps(r[1]),
          repsWeek3: toReps(r[2]),
        };
      }),
    );

  return (
    <section className="cycle">
      {cycle.weeks.map((week, wi) => (
        <article className="week" key={week.name}>
          <h3 className="week-name">{week.name}</h3>
          <div className="lift-grid">
            {week.lifts.map((lift) => (
              <div className="lift-card" key={lift.slug}>
                <div className="lift-card-head">
                  <span className="lift-name">{lift.name}</span>
                  <span className="tm">
                    TM {lift.trainingMax}
                    {cycle.unit}
                  </span>
                </div>
                <ol className="sets">
                  {lift.sets.map((s, i) => (
                    <li key={i} className={s.amrap ? 'set amrap' : 'set'}>
                      <span className="pct">{s.percent}%</span>
                      <span className="wt">
                        {s.weight}
                        <em>{cycle.unit}</em>
                      </span>
                      <span className="reps">&times;{s.reps}</span>
                      {s.amrap && (
                        <label className="set-log">
                          <span>reps done</span>
                          <input
                            inputMode="numeric"
                            placeholder="—"
                            value={reps[lift.slug]?.[wi] ?? ''}
                            onChange={(e) => setRep(lift.slug, wi, e.target.value)}
                            onBlur={save}
                          />
                        </label>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
