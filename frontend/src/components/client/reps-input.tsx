'use client';

import { type ChangeEvent, useEffect, useId, useState } from 'react';
import { getReps, setReps } from '@/actions/workout';
import type { Day, Week } from '@/schema/workout';
import Spinner from '@/components/client/spinner';

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

        const reps = Number.parseInt(event.currentTarget.value);
        await setReps({ cycle, week, day, reps });
        setExsistingReps(reps);

        setLoading(false);
    };

    return (
        <div key={`reps-input-form-${cycle}-${week}-${day}`} className="grid grid-cols-2">
            <select id={id} name="reps" onChange={handleOnChange} value={exsistingReps}>
                <option value={0}></option>
                {[...new Array(maxReps).keys()].map((_, index) => (
                    <option value={index + 1} key={`reps-input-form-option-${cycle}-${week}-${day}-${index}`}>
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
