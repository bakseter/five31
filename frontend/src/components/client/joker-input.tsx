'use client';

import { useEffect, useId, useState } from 'react';

import { getJoker, setJoker } from '@/actions/joker';
import Spinner from '@/components/client/spinner';
import type { Day, Week } from '@/schema/workout';

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
        const fetchJoker = async () => {
            setLoading(true);
            const joker = await getJoker({ cycle, week, day, num });
            setLoading(false);
            if (!joker) return;
            setChecked(true);
        };
        void fetchJoker();
    }, [cycle, day, week, num]);

    const handleOnChange = async () => {
        setLoading(true);
        await setJoker({ cycle, week, day, num });
        setChecked(!checked);
        setLoading(false);
    };

    return (
        <div className="flex items-center gap-2">
            <label htmlFor={id} className="sr-only">
                Joker {num}
            </label>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={handleOnChange}
                className="h-4 w-4 rounded border-slate-300 text-slate-700 accent-slate-700 transition-colors"
            />
            {loading && <Spinner size="xs" />}
        </div>
    );
};

export default JokerInput;
