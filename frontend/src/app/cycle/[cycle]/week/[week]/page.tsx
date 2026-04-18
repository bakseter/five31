import type { Metadata } from 'next';

import Workout from '@/components/server/workout';
import { days } from '@/utils/constants';
import { intCoerciveDecoder } from '@/utils/helpers';

interface Props {
    params: Promise<{
        cycle: string;
        week: string;
    }>;
}

const generateMetadata = async (props: Props): Promise<Metadata> => {
    const { cycle, week } = await props.params;

    return {
        title: `Cycle ${cycle} | Week ${week}`,
    };
};

const WeekPage = async (props: Props) => {
    const params = await props.params;
    const cycle = intCoerciveDecoder(params.cycle);
    const week = intCoerciveDecoder(params.week);
    if ((week !== 1 && week !== 2 && week !== 3) || !cycle) throw new Error('breh');

    return days.map((day) => (
        <div className="mx-2" key={`workout-${String(day)}-${String(week)}-${String(cycle)}`}>
            <Workout cycle={cycle} week={week} day={day} />
        </div>
    ));
};

export { generateMetadata };
export default WeekPage;
