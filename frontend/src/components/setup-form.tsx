import { useState } from 'react';

import { useUpdateLiftsMutation } from '../api';
import type { Lift } from '../schemas';

const SetupForm = ({ lifts }: { lifts: Lift[] }) => {
    const [updateLifts, { isLoading }] = useUpdateLiftsMutation();

    const [maxes, setMaxes] = useState<Record<string, string>>(() =>
        Object.fromEntries(
            lifts.map((lift) => [
                lift.slug,
                lift.trainingMax ? String(lift.trainingMax) : '',
            ])
        )
    );

    const setMax = (slug: string, raw: string) => {
        setMaxes((max) => ({ ...max, [slug]: raw.replace(/[^0-9.]/g, '') }));
    };

    const submit = () =>
        updateLifts(
            lifts.map((lift) => ({
                slug: lift.slug,
                trainingMax: parseFloat(maxes[lift.slug] || '0') || 0,
            }))
        );

    return (
        <section className="card setup">
            <div className="card-head">
                <h2>Training maxes</h2>
                <span className="unit-note">kilograms</span>
            </div>

            <p className="hint">
                Use about 90% of your true one-rep max &mdash; Wendler&rsquo;s
                rule is &ldquo;start too light.&rdquo;
            </p>

            <div className="lift-inputs">
                {lifts.map((lift) => (
                    <label key={lift.slug} className="lift-input">
                        <span className="lift-input-name">{lift.name}</span>
                        <span className="field">
                            <input
                                inputMode="decimal"
                                placeholder="0"
                                value={maxes[lift.slug] ?? ''}
                                onChange={(event) => {
                                    setMax(lift.slug, event.target.value);
                                }}
                            />
                            <span className="field-unit">kg</span>
                        </span>
                    </label>
                ))}
            </div>

            <button
                className="primary"
                type="button"
                onClick={submit}
                disabled={isLoading}
            >
                {isLoading ? 'Calculating\u2026' : 'Calculate cycle'}
            </button>
        </section>
    );
};

export default SetupForm;
