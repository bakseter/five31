import { type decodeType, intersection, number, record } from 'typescript-json-decoder';

import { floatCoerciveDecoder } from '@/utils/helpers';

const baseWeightsDecoder = record({
    dl: floatCoerciveDecoder,
    bp: floatCoerciveDecoder,
    sq: floatCoerciveDecoder,
    op: floatCoerciveDecoder,
});
type BaseWeights = decodeType<typeof baseWeightsDecoder>;

type CompExercise = keyof BaseWeights;

const comps: Array<CompExercise> = ['dl', 'bp', 'sq', 'op'];

const baseWeightsModifierDecoder = intersection(baseWeightsDecoder, record({ cycle: number }));
type BaseWeightsModifier = decodeType<typeof baseWeightsModifierDecoder>;

export {
    type BaseWeights,
    baseWeightsDecoder,
    type BaseWeightsModifier,
    baseWeightsModifierDecoder,
    type CompExercise,
    comps,
};
