import { getJokerAmount } from '@/actions/joker';
import { getBaseWeightsForCycle } from '@/actions/base-weights';
import type { Day, Week } from '@/schema/workout';
import WorkoutTable from '@/components/client/workout-table';
import DateBoxForm from '@/components/client/date-box-form';
import { dayToExercise, exerciseToText } from '@/utils/helpers';

interface Props {
    cycle: number;
    week: Week;
    day: Day;
}

const Workout = async ({ cycle, week, day }: Props) => {
    const baseWeightsForCycle = await getBaseWeightsForCycle({
        cycle,
    });

    const jokerAmount = await getJokerAmount({ cycle, week, day });

    return (
        <>
            <div className="grid grid-flow-col items-center">
                <h3 className="font-bold my-2 inline">{exerciseToText(dayToExercise(day))}</h3>
                <div className="my-2">
                    <DateBoxForm cycle={cycle} week={week} day={day} />
                </div>
            </div>
            <div className="grid grid-cols-1 items-center">
                <WorkoutTable
                    cycle={cycle}
                    week={week}
                    day={day}
                    baseWeightsForCycle={baseWeightsForCycle}
                    initialJokerAmount={jokerAmount}
                />
            </div>
        </>
    );
};

export default Workout;
