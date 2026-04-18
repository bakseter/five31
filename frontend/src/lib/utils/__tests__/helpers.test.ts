import { expect, test } from 'vitest';

import type { BaseWeights } from '@/schema/base-weights';
import {
    addToBaseWeights,
    calculateWeightFromPercentage,
    dayToExercise,
    exerciseToText,
    floatCoerciveDecoder,
    intCoerciveDecoder,
    jokerWeightsExtend,
    percentageToText,
    weekToBasePercentages,
    weekToDefiningRep,
    weekToPercentages,
    weekToSetsReps,
} from '@/utils/helpers';

const baseWeights: BaseWeights = {
    dl: 100,
    bp: 100,
    sq: 100,
    op: 100,
};

test('addToBaseWeights', () => {
    expect(addToBaseWeights(baseWeights, 1)).toEqual(baseWeights);
    expect(addToBaseWeights(baseWeights, 2)).toEqual({
        dl: 105,
        bp: 102.5,
        sq: 105,
        op: 102.5,
    });
    expect(addToBaseWeights(baseWeights, 3)).toEqual({
        dl: 110,
        bp: 105,
        sq: 110,
        op: 105,
    });
});

test('dayToExercise', () => {
    expect(dayToExercise(1)).toEqual('dl');
    expect(dayToExercise(2)).toEqual('bp');
    expect(dayToExercise(3)).toEqual('sq');
    expect(dayToExercise(4)).toEqual('op');
});

test('weekToDefiningRep', () => {
    expect(weekToDefiningRep(1)).toEqual(5);
    expect(weekToDefiningRep(2)).toEqual(3);
    expect(weekToDefiningRep(3)).toEqual(1);
});

test('exerciseToText', () => {
    expect(exerciseToText('dl')).toEqual('Deadlift');
    expect(exerciseToText('bp')).toEqual('Bench press');
    expect(exerciseToText('sq')).toEqual('Squat');
    expect(exerciseToText('op')).toEqual('Overhead press');
});

test('jokerWeightsExtend', () => {
    expect(jokerWeightsExtend(0.9)).toEqual([]);
    expect(jokerWeightsExtend(0.9, 0)).toEqual([]);
    expect(jokerWeightsExtend(0.9, -1)).toEqual([]);

    expect(jokerWeightsExtend(0.9, 3)).toEqual([expect.closeTo(0.95), expect.closeTo(1), expect.closeTo(1.05)]);
    expect(jokerWeightsExtend(0.9, 4)).toEqual([
        expect.closeTo(0.95),
        expect.closeTo(1),
        expect.closeTo(1.05),
        expect.closeTo(1.1),
    ]);
});

test('weekToBasePercentages', () => {
    expect(weekToBasePercentages(1)).toEqual([0.65, 0.75, 0.85]);
    expect(weekToBasePercentages(2)).toEqual([0.7, 0.8, 0.9]);
    expect(weekToBasePercentages(3)).toEqual([0.75, 0.85, 0.95]);
});

test('weekToPercentages', () => {
    expect(weekToPercentages(1)).toEqual([0.4, 0.5, 0.6, 0.65, 0.75, 0.85]);
    expect(weekToPercentages(2)).toEqual([0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    expect(weekToPercentages(3)).toEqual([0.4, 0.5, 0.6, 0.75, 0.85, 0.95]);

    expect(weekToPercentages(1, 3)).toEqual([
        0.4,
        0.5,
        0.6,
        0.65,
        0.75,
        0.85,
        expect.closeTo(0.9),
        expect.closeTo(0.95),
        expect.closeTo(1),
    ]);
    expect(weekToPercentages(2, 2)).toEqual([0.4, 0.5, 0.6, 0.7, 0.8, 0.9, expect.closeTo(0.95), expect.closeTo(1)]);
    expect(weekToPercentages(3, 1)).toEqual([0.4, 0.5, 0.6, 0.75, 0.85, 0.95, expect.closeTo(1)]);
});

test('weekToSetsReps', () => {
    expect(weekToSetsReps(1)).toEqual([5, 5, 3, 5, 5, 5]);
    expect(weekToSetsReps(2)).toEqual([5, 5, 3, 3, 3, 3]);
    expect(weekToSetsReps(3)).toEqual([5, 5, 3, 5, 3, 1]);
});

test('percentageToText', () => {
    expect(percentageToText(0.65)).toEqual('65%');
    expect(percentageToText(0.75)).toEqual('75%');
    expect(percentageToText(0.85)).toEqual('85%');
    expect(percentageToText(0.9)).toEqual('90%');
    expect(percentageToText(0.95)).toEqual('95%');
    expect(percentageToText(1)).toEqual('100%');
});

test('intCoerciveDecoder', () => {
    expect(intCoerciveDecoder('1')).toEqual(1);
    expect(intCoerciveDecoder('1.1')).toEqual(1);
    expect(intCoerciveDecoder('1.9')).toEqual(1);
    expect(intCoerciveDecoder('1.5')).toEqual(1);
    expect(intCoerciveDecoder('1.6')).toEqual(1);
    expect(intCoerciveDecoder('1.4')).toEqual(1);
    expect(intCoerciveDecoder(1)).toEqual(1);
});

test('floatCoerciveDecoder', () => {
    expect(floatCoerciveDecoder('1')).toEqual(1);
    expect(floatCoerciveDecoder('1.1')).toEqual(1.1);
    expect(floatCoerciveDecoder('1.9')).toEqual(1.9);
    expect(floatCoerciveDecoder('1.5')).toEqual(1.5);
    expect(floatCoerciveDecoder('1.6')).toEqual(1.6);
    expect(floatCoerciveDecoder('1.4')).toEqual(1.4);
    expect(floatCoerciveDecoder(1)).toEqual(1);
});

test('calculateWeightFromPercentage', () => {
    expect(
        calculateWeightFromPercentage({
            baseWeightsForCycle: baseWeights,
            day: 1,
            percentage: 0.65,
            index: 0,
        }),
    ).toEqual(65);

    expect(
        calculateWeightFromPercentage({
            baseWeightsForCycle: baseWeights,
            day: 2,
            percentage: 0.75,
            index: 1,
        }),
    ).toEqual(75);

    expect(
        calculateWeightFromPercentage({
            baseWeightsForCycle: baseWeights,
            day: 3,
            percentage: 0.85,
            index: 2,
        }),
    ).toEqual(85);

    expect(
        calculateWeightFromPercentage({
            baseWeightsForCycle: baseWeights,
            day: 4,
            percentage: 0.9,
            index: 3,
        }),
    ).toEqual(90);

    expect(
        calculateWeightFromPercentage({
            baseWeightsForCycle: baseWeights,
            day: 1,
            percentage: 0.95,
            index: 4,
        }),
    ).toEqual(95);

    expect(
        calculateWeightFromPercentage({
            baseWeightsForCycle: baseWeights,
            day: 2,
            percentage: 1,
            index: 5,
        }),
    ).toEqual(100);
});
