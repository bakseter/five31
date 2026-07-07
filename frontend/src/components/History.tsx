import { useGetHistoryQuery } from '../api';
import type { HistoryEntry } from '../schemas';

// The three AMRAP sets, in week order, with their prescribed-rep labels.
const AMRAP_LABELS: Array<{ label: string; key: keyof HistoryEntry }> = [
  { label: '5+', key: 'repsWeek1' },
  { label: '3+', key: 'repsWeek2' },
  { label: '1+', key: 'repsWeek3' },
];

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
};

// Group the flat, already-sorted log (newest cycle first, lifts in order) into
// one block per completed cycle without disturbing that order.
function groupByCycle(entries: HistoryEntry[]) {
  const groups: Array<{ cycle: number; date: string; lifts: HistoryEntry[] }> =
    [];
  for (const e of entries) {
    let g = groups[groups.length - 1];
    if (!g || g.cycle !== e.cycleNumber) {
      g = { cycle: e.cycleNumber, date: e.completedAt, lifts: [] };
      groups.push(g);
    }
    g.lifts.push(e);
  }
  return groups;
}

export default function History() {
  const { data: history } = useGetHistoryQuery();
  if (!history || history.length === 0) return null;

  const cycles = groupByCycle(history);

  return (
    <section className="history">
      <div className="history-head">
        <h2>Training log</h2>
        <span className="history-count">
          {cycles.length} completed {cycles.length === 1 ? 'cycle' : 'cycles'}
        </span>
      </div>

      {cycles.map((c) => (
        <article className="log-cycle" key={c.cycle}>
          <div className="log-cycle-head">
            <span className="log-cycle-n">Cycle {c.cycle}</span>
            {c.date && (
              <span className="log-cycle-date">{fmtDate(c.date)}</span>
            )}
          </div>

          <div className="log-lifts">
            {c.lifts.map((l) => (
              <div className="log-lift" key={l.slug}>
                <div className="log-lift-top">
                  <span className="lift-name">{l.name}</span>
                  <span className="tm">TM {l.trainingMax}kg</span>
                </div>
                <div className="log-amraps">
                  {AMRAP_LABELS.map(({ label, key }) => {
                    const reps = l[key] as number | null;
                    return (
                      <span
                        className={
                          reps == null ? 'amrap-chip empty' : 'amrap-chip'
                        }
                        key={label}
                      >
                        <em>{label}</em>
                        {reps == null ? '—' : `\u00d7${reps}`}
                      </span>
                    );
                  })}
                  {l.estimatedOneRepMax > 0 && (
                    <span className="e1rm">
                      est. 1RM {l.estimatedOneRepMax}kg
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
