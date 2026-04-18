'use client';

import { Fragment, useState } from 'react';

import Button from '@/components/client/button';
import JokerInput from '@/components/client/joker-input';
import RepsInput from '@/components/client/reps-input';
import type { BaseWeights } from '@/schema/base-weights';
import type { Day, Week } from '@/schema/workout';
import { jokerCutoff } from '@/utils/constants';
import {
    calculateWeightFromPercentage,
    percentageToText,
    weekToDefiningRep,
    weekToPercentages,
    weekToSetsReps,
} from '@/utils/helpers';

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

    const RepsField = ({ index }: { index: number }) => {
        if (index === jokerCutoff) return <RepsInput cycle={cycle} week={week} day={day} />;
        if (index > jokerCutoff) return <JokerInput cycle={cycle} week={week} day={day} num={index - jokerCutoff} />;
        return <span className="text-slate-400">—</span>;
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full table-auto text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3">Sets</th>
                            <th className="px-4 py-3">%</th>
                            <th className="px-4 py-3">Weight</th>
                            <th className="px-4 py-3">Actual</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {weekToPercentages(week, jokerAmount).map((percentage, index) => {
                            const headingText = indexToHeading(index);

                            return (
                                <Fragment key={`week-to-percentages-${String(percentage)}-${String(index)}`}>
                                    {index % 3 === 0 && index <= 6 && headingText && (
                                        <tr className="bg-slate-50/60">
                                            <td
                                                colSpan={4}
                                                className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-widest text-slate-400"
                                            >
                                                {headingText}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="transition-colors hover:bg-slate-50/80">
                                        <td className="px-4 py-2.5 font-mono text-slate-700">
                                            {`1×${String(reps(index) ?? weekToDefiningRep(week))}${index === 5 ? '+' : ''}`}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">{percentageToText(percentage)}</td>
                                        <td className="px-4 py-2.5 font-medium text-slate-800">
                                            {`${String(
                                                calculateWeightFromPercentage({
                                                    baseWeightsForCycle,
                                                    day,
                                                    percentage,
                                                    index,
                                                }),
                                            )} kg`}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <RepsField index={index} />
                                        </td>
                                    </tr>
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Button
                className="flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                onClick={() => {
                    setJokerAmount((value) => value + 1);
                }}
            >
                + Add joker set
            </Button>
        </div>
    );
};

export default WorkoutTable;
