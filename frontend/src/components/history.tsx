import { useGetHistoryQuery } from '../api';
import type { HistoryEntry } from '../schemas';

// The three AMRAP sets, in week order, with their prescribed-rep labels.
const AMRAP_LABELS: { label: string; key: keyof HistoryEntry }[] = [
    { label: '5+', key: 'repsWeek1' },
    { label: '3+', key: 'repsWeek2' },
    { label: '1+', key: 'repsWeek3' },
];

const fmtDate = (iso: string) => {
    const date = new Date(iso);

    return Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          });
};

// Group the flat, already-sorted log (newest cycle first, lifts in order) into
// One block per completed cycle without disturbing that order.
const groupByCycle = (entries: HistoryEntry[]) => {
    const groups: { cycle: number; date: string; lifts: HistoryEntry[] }[] = [];
    for (const entry of entries) {
        let group = groups[groups.length - 1];
        if (!group || group.cycle !== entry.cycleNumber) {
            group = {
                cycle: entry.cycleNumber,
                date: entry.completedAt,
                lifts: [],
            };
            groups.push(group);
        }
        group.lifts.push(entry);
    }
    return groups;
};

const History = () => {
    const { data: history } = useGetHistoryQuery();
    if (!history || history.length === 0) {
        return null;
    }

    const cycles = groupByCycle(history);

    return (
        <section className="history">
            <div className="history-head">
                <h2>Training log</h2>
                <span className="history-count">
                    {cycles.length} completed{' '}
                    {cycles.length === 1 ? 'cycle' : 'cycles'}
                </span>
            </div>

            {cycles.map((cycle) => (
                <article className="log-cycle" key={cycle.cycle}>
                    <div className="log-cycle-head">
                        <span className="log-cycle-n">Cycle {cycle.cycle}</span>
                        {cycle.date && (
                            <span className="log-cycle-date">
                                {fmtDate(cycle.date)}
                            </span>
                        )}
                    </div>

                    <div className="log-lifts">
                        {cycle.lifts.map((lift) => (
                            <div className="log-lift" key={lift.slug}>
                                <div className="log-lift-top">
                                    <span className="lift-name">
                                        {lift.name}
                                    </span>
                                    <span className="tm">
                                        TM {lift.trainingMax}kg
                                    </span>
                                </div>
                                <div className="log-amraps">
                                    {AMRAP_LABELS.map(({ label, key }) => {
                                        const reps = lift[key] as number | null;
                                        return (
                                            <span
                                                className={
                                                    reps
                                                        ? 'amrap-chip'
                                                        : 'amrap-chip empty'
                                                }
                                                key={label}
                                            >
                                                <em>{label}</em>
                                                {reps ? `\u00d7${reps}` : '-'}
                                            </span>
                                        );
                                    })}
                                    {lift.estimatedOneRepMax > 0 && (
                                        <span className="e1rm">
                                            est. 1RM {lift.estimatedOneRepMax}kg
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
};

export default History;
