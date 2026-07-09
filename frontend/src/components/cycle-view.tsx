import { useState } from 'react';

import { useGetCycleQuery, useUpdateAmrapMutation } from '../api';
import type { Lift } from '../schemas';

// Local per-lift AMRAP reps, one string per loading week (index 0–2).
type RepState = Record<string, [string, string, string]>;

const seed = (lifts: Lift[]): RepState =>
    Object.fromEntries(
        lifts.map((lift) => [
            lift.slug,
            [
                lift.repsWeek1?.toString() ?? '',
                lift.repsWeek2?.toString() ?? '',
                lift.repsWeek3?.toString() ?? '',
            ] as [string, string, string],
        ])
    );

const toReps = (str: string): number | null => {
    if (str.trim() === '') {
        return null;
    }

    const num = parseInt(str, 10);
    return Number.isNaN(num) ? null : Math.max(0, num);
};

const CycleView = ({ lifts }: { lifts: Lift[] }) => {
    const { data: cycle } = useGetCycleQuery();
    const [updateAmrap] = useUpdateAmrapMutation();
    const [reps, setReps] = useState<RepState>(() => seed(lifts));

    if (!cycle) {
        return null;
    }

    const hasMaxes = cycle.weeks.some((week) =>
        week.lifts.some((lift) => lift.trainingMax > 0)
    );
    if (!hasMaxes) {
        return (
            <section className="empty">
                Enter a training max above to generate your first cycle.
            </section>
        );
    }

    const setRep = (slug: string, week: number, raw: string) => {
        setReps((prev) => {
            const next = {
                ...prev,
                [slug]: [...(prev[slug] ?? ['', '', ''])] as [
                    string,
                    string,
                    string,
                ],
            };
            next[slug][week] = raw.replace(/[^0-9]/g, '');
            return next;
        });
    };

    // Persist every lift's logged reps in one call (backend upserts by slug).
    const save = () =>
        updateAmrap(
            lifts.map((lift) => {
                const repsToSave = reps[lift.slug] ?? ['', '', ''];
                return {
                    slug: lift.slug,
                    repsWeek1: toReps(repsToSave[0]),
                    repsWeek2: toReps(repsToSave[1]),
                    repsWeek3: toReps(repsToSave[2]),
                };
            })
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
                                    <span className="lift-name">
                                        {lift.name}
                                    </span>
                                    <span className="tm">
                                        TM {lift.trainingMax}kg
                                    </span>
                                </div>
                                <ol className="sets">
                                    {lift.sets.map((set, index) => (
                                        <li
                                            key={index}
                                            className={
                                                set.amrap ? 'set amrap' : 'set'
                                            }
                                        >
                                            <span className="pct">
                                                {set.percent}%
                                            </span>
                                            <span className="wt">
                                                {set.weight}
                                                <em>kg</em>
                                            </span>
                                            <span className="reps">
                                                &times;{set.reps}
                                            </span>
                                            {set.amrap && (
                                                <label className="set-log">
                                                    <span>reps done</span>
                                                    <input
                                                        inputMode="numeric"
                                                        placeholder="—"
                                                        value={
                                                            reps[lift.slug][wi]
                                                        }
                                                        onChange={(event) => {
                                                            setRep(
                                                                lift.slug,
                                                                wi,
                                                                event.target
                                                                    .value
                                                            );
                                                        }}
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
};

export default CycleView;
