'use client';

import { type ChangeEvent, useEffect, useId, useState } from 'react';
import { format, parse } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getDate, setDate } from '@/actions/date';
import type { Day, Week } from '@/schema/workout';
import Spinner from '@/components/client/spinner';

interface Props {
    cycle: number;
    week: Week;
    day: Day;
}

const DateBoxForm = ({ cycle, week, day }: Props) => {
    const id = useId();

    const [exsistingDate, setExsistingDate] = useState<Date | undefined>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchReps = async () => {
            setLoading(true);
            const date = await getDate({ cycle, week, day });
            setLoading(false);

            if (!date) return;

            // :)
            setExsistingDate(date.date);
        };
        void fetchReps();
    }, [cycle, day, week]);

    const handleOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const parsedDate = parse(event.currentTarget.value, 'yyyy-MM-dd', new Date());

        setLoading(true);
        await setDate({ cycle, week, day, date: parsedDate });
        setExsistingDate(parsedDate);

        setLoading(false);
    };

    return (
        <>
            {!exsistingDate && (
                <>
                    <input
                        id={id}
                        className="border-2 rounded-md border-sky-500"
                        type="date"
                        name="dateStr"
                        onChange={handleOnChange}
                    />
                    <label htmlFor={id} hidden>
                        Workout date
                    </label>
                </>
            )}
            {exsistingDate && (
                <>
                    <div className="grid grid-flow-col items-center text-start">
                        <p className="text-sm">{format(exsistingDate, 'EEEE dd. MMMM yyyy', { locale: nb })}</p>
                    </div>
                    {loading && <Spinner />}
                </>
            )}
        </>
    );
};

export default DateBoxForm;
