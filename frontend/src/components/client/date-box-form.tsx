'use client';

import { format, parse } from 'date-fns';
import { nb } from 'date-fns/locale';
import { type ChangeEvent, useEffect, useId, useState } from 'react';

import { getDate, setDate } from '@/actions/date';
import Spinner from '@/components/client/spinner';
import type { Day, Week } from '@/schema/workout';

interface Props {
    cycle: number;
    week: Week;
    day: Day;
}

const DateBoxForm = ({ cycle, week, day }: Props) => {
    const id = useId();
    const [existingDate, setExistingDate] = useState<Date | undefined>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchDate = async () => {
            setLoading(true);
            const date = await getDate({ cycle, week, day });
            setLoading(false);
            if (!date) return;
            setExistingDate(date.date);
        };
        void fetchDate();
    }, [cycle, day, week]);

    const handleOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const parsedDate = parse(event.currentTarget.value, 'yyyy-MM-dd', new Date());
        setLoading(true);
        await setDate({ cycle, week, day, date: parsedDate });
        setExistingDate(parsedDate);
        setLoading(false);
    };

    return (
        <div className="flex items-center gap-3">
            {existingDate ? (
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700">
                        {format(existingDate, 'EEEE dd. MMMM yyyy', { locale: nb })}
                    </p>
                    {loading && <Spinner />}
                </div>
            ) : (
                <>
                    <label htmlFor={id} className="sr-only">
                        Workout date
                    </label>
                    <input
                        id={id}
                        type="date"
                        name="dateStr"
                        onChange={handleOnChange}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                </>
            )}
        </div>
    );
};

export default DateBoxForm;
