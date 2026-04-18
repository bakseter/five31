'use client';

import { type ChangeEvent, useEffect, useId, useState } from 'react';

import { getReps, setReps } from '@/actions/workout';
import Spinner from '@/components/client/spinner';
import type { Day, Week } from '@/schema/workout';

interface Props {
    cycle: number;
    week: Week;
    day: Day;
}

const RepsInput = ({ cycle, week, day }: Props) => {
    const maxReps = 15;
    const id = useId();

    const [exsistingReps, setExsistingReps] = useState<number | undefined>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchReps = async () => {
            setLoading(true);

            const reps = await getReps({ cycle, week, day });
            setExsistingReps(reps);

            setLoading(false);
        };
        void fetchReps();
    }, [cycle, day, week]);

    const handleOnChange = async (event: ChangeEvent<HTMLSelectElement>) => {
        setLoading(true);

        const reps = Number.parseInt(event.currentTarget.value, 10);
        await setReps({ cycle, week, day, reps });
        setExsistingReps(reps);

        setLoading(false);
    };

    return (
        <div key={`reps-input-form-${String(cycle)}-${String(week)}-${String(day)}`} className="grid grid-cols-2">
            <select id={id} name="reps" onChange={handleOnChange} value={exsistingReps}>
                <option value={0}></option>
                {/* eslint-disable-next-line id-length */}
                {[...new Array(maxReps).keys()].map((_, index) => (
                    <option
                        value={index + 1}
                        key={`reps-input-form-option-${String(cycle)}-${String(week)}-${String(day)}-${String(index)}`}
                    >
                        {index + 1}
                    </option>
                ))}
            </select>
            <label hidden htmlFor={id}>
                Reps
            </label>
            {loading && <Spinner size="sm" />}
        </div>
    );
};

export default RepsInput;
