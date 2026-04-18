'use client';

import { useEffect, useId, useState } from 'react';
import { getJoker, setJoker } from '@/actions/joker';
import type { Day, Week } from '@/schema/workout';
import Spinner from '@/components/client/spinner';

interface Props {
    cycle: number;
    week: Week;
    day: Day;
    num: number;
}

const JokerInput = ({ cycle, week, day, num }: Props) => {
    const id = useId();

    const [checked, setChecked] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchReps = async () => {
            setLoading(true);
            const joker = await getJoker({ cycle, week, day, num });
            setLoading(false);

            if (!joker) return;

            setChecked(true);
        };
        void fetchReps();
    }, [cycle, day, week, num]);

    const handleOnChange = async () => {
        setLoading(true);
        await setJoker({ cycle, week, day, num });
        setChecked(!checked);
        setLoading(false);
    };

    return (
        <div className="grid grid-cols-2">
            <input type="checkbox" id={id} className="rounded w-4 h-4" checked={checked} onChange={handleOnChange} />
            <label hidden htmlFor={id}>
                Joker {num}
            </label>
            <div>{loading && <Spinner size="xs" />}</div>
        </div>
    );
};

export default JokerInput;
