import type { BaseWeights, CompExercise } from '@/schema/base-weights';
import type { Day, Week } from '@/schema/workout';
import { warmupCutoff } from '@/utils/constants';

const addToBaseWeights = (baseWeights: BaseWeights, cycle: number): BaseWeights => ({
    dl: baseWeights.dl + (cycle - 1) * 5,
    bp: baseWeights.bp + (cycle - 1) * 2.5,
    sq: baseWeights.sq + (cycle - 1) * 5,
    op: baseWeights.op + (cycle - 1) * 2.5,
});

/* eslint-disable default-case,consistent-return */
const dayToExercise = (day: Day): CompExercise => {
    switch (day) {
        case 1: {
            return 'dl';
        }
        case 2: {
            return 'bp';
        }
        case 3: {
            return 'sq';
        }
        case 4: {
            return 'op';
        }
    }
};

const weekToDefiningRep = (week: Week): number => {
    switch (week) {
        case 1: {
            return 5;
        }
        case 2: {
            return 3;
        }
        case 3: {
            return 1;
        }
    }
};

const exerciseToText = (exercise: CompExercise): string => {
    switch (exercise) {
        case 'dl': {
            return 'Deadlift';
        }
        case 'bp': {
            return 'Bench press';
        }
        case 'sq': {
            return 'Squat';
        }
        case 'op': {
            return 'Overhead press';
        }
    }
};

const weekToBasePercentages = (week: Week): [number, number, number] => {
    switch (week) {
        case 1: {
            return [0.65, 0.75, 0.85];
        }
        case 2: {
            return [0.7, 0.8, 0.9];
        }
        case 3: {
            return [0.75, 0.85, 0.95];
        }
    }
};
/* eslint-enable default-case,consistent-return */

const jokerWeightsExtend = (lastVal: number, jokersAmount?: number): Array<number> => {
    if (!jokersAmount || jokersAmount < 0) return [];

    return new Array(jokersAmount).fill(lastVal).map((value: number, index) => value + 0.05 * (index + 1));
};

const weekToPercentages = (week: Week, customJokersLengthAdd?: number): Array<number> => {
    const warmupPercentages = [0.4, 0.5, 0.6];
    const basePercentages = weekToBasePercentages(week);
    const jokerPercentages = jokerWeightsExtend(basePercentages[basePercentages.length - 1], customJokersLengthAdd);

    return [...warmupPercentages, ...basePercentages, ...jokerPercentages];
};

const weekToSetsReps = (week: Week): Array<number> => {
    const warmupReps = [5, 5, 3];
    const defRep = weekToDefiningRep(week);
    const defReps = week === 3 ? [5, 3, defRep] : [defRep, defRep, defRep];

    return [...warmupReps, ...defReps];
};

const percentageToText = (percentage: number): string => `${(percentage * 100).toFixed(0)}%`;

const intCoerciveDecoder = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number.parseInt(value, 10);
    throw new Error(`Expected number or string, got ${typeof value}`);
};

const floatCoerciveDecoder = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number.parseFloat(value);
    throw new Error(`Expected number or string, got ${typeof value}`);
};

const roundToNearest = (index: number) => (index <= warmupCutoff ? 5 : 2.5);

const calculateWeightFromPercentage = ({
    baseWeightsForCycle,
    day,
    percentage,
    index,
}: {
    baseWeightsForCycle: BaseWeights;
    day: Day;
    percentage: number;
    index: number;
}): number =>
    Math.max(
        20,
        roundToNearest(index) *
            Math.ceil((baseWeightsForCycle[dayToExercise(day)] * percentage) / roundToNearest(index)),
    );

export {
    dayToExercise,
    exerciseToText,
    weekToBasePercentages,
    weekToPercentages,
    percentageToText,
    weekToSetsReps,
    addToBaseWeights,
    weekToDefiningRep,
    intCoerciveDecoder,
    floatCoerciveDecoder,
    jokerWeightsExtend,
    calculateWeightFromPercentage,
};
