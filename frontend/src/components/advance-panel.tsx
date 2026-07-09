import { useEffect, useState } from 'react';

import { useAdvanceCycleMutation, useGetNextCycleQuery } from '../api';
import type { Lift } from '../schemas';

// The end-of-cycle step: review the maxes suggested from your AMRAP results,
// Override any of them, then commit to start the next cycle.
const AdvancePanel = ({ lifts }: { lifts: Lift[] }) => {
    const [open, setOpen] = useState(false);
    const { data: suggestions } = useGetNextCycleQuery(undefined, {
        skip: !open,
    });
    const [advance, { isLoading }] = useAdvanceCycleMutation();

    // Editable chosen max per lift, seeded from the server's suggestion.
    const [chosen, setChosen] = useState<Record<string, string>>({});
    useEffect(() => {
        if (suggestions) {
            setChosen(
                Object.fromEntries(
                    suggestions.map((suggestion) => [
                        suggestion.slug,
                        String(suggestion.suggestedMax),
                    ])
                )
            );
        }
    }, [suggestions]);

    const ready = lifts.some((lift) => lift.trainingMax > 0);
    if (!ready) {
        return null;
    }

    const cycle = lifts[0]?.cycleNumber ?? 1;

    if (!open) {
        return (
            <section className="advance-cta">
                <div>
                    <h2>Finished the cycle?</h2>
                    <p className="hint">
                        Log your AMRAP reps above, then review the maxes for
                        cycle {cycle + 1}.
                    </p>
                </div>
                <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                        setOpen(true);
                    }}
                >
                    Review next cycle &rarr;
                </button>
            </section>
        );
    }

    const commit = async () => {
        await advance(
            lifts.map((lift) => ({
                slug: lift.slug,
                trainingMax:
                    parseFloat(chosen[lift.slug] ?? '') || lift.trainingMax,
            }))
        ).unwrap();
        setOpen(false);
    };

    return (
        <section className="card advance">
            <div className="card-head">
                <h2>
                    Cycle {cycle} &rarr; {cycle + 1}
                </h2>
                <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                        setOpen(false);
                    }}
                >
                    Cancel
                </button>
            </div>
            <p className="hint">
                Suggested from your logged AMRAP sets. Edit any max before
                committing.
            </p>

            {!suggestions && <p className="note">Calculating&hellip;</p>}

            {suggestions && (
                <>
                    <div className="suggest-list">
                        {suggestions.map((suggestion) => (
                            <div className="suggest-row" key={suggestion.slug}>
                                <div className="suggest-lift">
                                    <span className="lift-name">
                                        {suggestion.name}
                                    </span>
                                    <span className="suggest-reason">
                                        {suggestion.reason}
                                    </span>
                                    {suggestion.estimatedOneRepMax > 0 && (
                                        <span className="e1rm">
                                            est. 1RM{' '}
                                            {suggestion.estimatedOneRepMax}kg
                                        </span>
                                    )}
                                </div>
                                <div className="suggest-nums">
                                    <span className="from">
                                        {suggestion.currentMax}kg
                                    </span>
                                    <span className="arrow">&rarr;</span>
                                    <span className="field small">
                                        <input
                                            inputMode="decimal"
                                            value={
                                                chosen[suggestion.slug] ?? ''
                                            }
                                            onChange={(event) => {
                                                setChosen((newChosen) => ({
                                                    ...newChosen,
                                                    [suggestion.slug]:
                                                        event.target.value.replace(
                                                            /[^0-9.]/g,
                                                            ''
                                                        ),
                                                }));
                                            }}
                                        />
                                        <span className="field-unit">kg</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="primary"
                        type="button"
                        onClick={commit}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? 'Advancing\u2026'
                            : `Start cycle ${cycle + 1}`}
                    </button>
                </>
            )}
        </section>
    );
};

export default AdvancePanel;
