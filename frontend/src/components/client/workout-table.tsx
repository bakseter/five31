'use client';

import { Fragment, useState } from 'react';
import type { BaseWeights } from '@/schema/base-weights';
import type { Day, Week } from '@/schema/workout';
import {
    calculateWeightFromPercentage,
    percentageToText,
    weekToDefiningRep,
    weekToPercentages,
    weekToSetsReps,
} from '@/utils/helpers';
import Button from '@/components/client/button';
import JokerInput from '@/components/client/joker-input';
import RepsInput from '@/components/client/reps-input';
import { jokerCutoff } from '@/utils/constants';

const indexToHeading = (index: number): string | undefined => {
    if (index === 0) return 'Warmup';
    if (index === 3) return 'Main sets';
    if (index === 6) return 'Joker sets';

    return undefined;
};

interface Props {
    cycle: number;
    week: Week;
    day: Day;
    baseWeightsForCycle: BaseWeights;
    initialJokerAmount?: number;
}

const WorkoutTable = ({ cycle, week, day, baseWeightsForCycle, initialJokerAmount = 0 }: Props) => {
    const reps = (index: number): number | undefined => weekToSetsReps(week)[index] ?? weekToDefiningRep(week);

    const [jokerAmount, setJokerAmount] = useState<number>(initialJokerAmount);

    const tableRowStyle = 'p-2';
    const tableRowStyleAlt = `${tableRowStyle} bg-slate-200`;

    const RepsField = ({ index }: { index: number }) => {
        if (index === jokerCutoff) return <RepsInput cycle={cycle} week={week} day={day} />;

        if (index > jokerCutoff) return <JokerInput cycle={cycle} week={week} day={day} num={index - jokerCutoff} />;

        return '-';
    };

    return (
        <>
            <table className="border-collapse border-spacing-2 border border-slate-400 table-auto">
                <thead>
                    <tr className="border border-slate-400">
                        <th className={tableRowStyle}>Sets</th>
                        <th className={tableRowStyle}>Percent</th>
                        <th className={tableRowStyle}>Weight</th>
                        <th className={tableRowStyle}>Actual</th>
                    </tr>
                </thead>
                <tbody>
                    {weekToPercentages(week, jokerAmount).map((percentage, index) => {
                        const headingText: string | undefined = indexToHeading(index);

                        return (
                            <Fragment key={`week-to-percentages-${percentage}-${index}`}>
                                {index % 3 === 0 && index <= 6 && headingText && (
                                    <tr className="px-2 py-4 pt-8 font-bold">
                                        <td>{headingText}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className={index % 2 === 0 ? tableRowStyle : tableRowStyleAlt}>
                                        {`1x${reps(index) ?? weekToDefiningRep(week)}${index === 5 ? '+' : ''}`}
                                    </td>
                                    <td className={index % 2 === 0 ? tableRowStyle : tableRowStyleAlt}>
                                        {percentageToText(percentage)}
                                    </td>
                                    <td className={index % 2 === 0 ? tableRowStyle : tableRowStyleAlt}>
                                        {`${calculateWeightFromPercentage({
                                            baseWeightsForCycle,
                                            day,
                                            percentage,
                                            index,
                                        })} kg`}
                                    </td>
                                    <td className={index % 2 === 0 ? tableRowStyle : tableRowStyleAlt}>
                                        <RepsField index={index} />
                                    </td>
                                </tr>
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
            <Button
                className="mx-auto"
                onClick={() => {
                    setJokerAmount((value) => value + 1);
                }}
            >
                Add joker set
            </Button>
        </>
    );
};

export default WorkoutTable;
