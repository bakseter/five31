'use server';

import { auth } from '@/api/auth';
import { backendUrl, cycles } from '@/utils/constants';
import { addToBaseWeights } from '@/utils/helpers';
import {
    type BaseWeights,
    type BaseWeightsModifier,
    baseWeightsDecoder,
    baseWeightsModifierDecoder,
} from '@/schema/base-weights';

const profile = 1;

const getBaseWeights = async (): Promise<BaseWeights | undefined> => {
    const session = await auth();
    if (!session?.idToken) throw new Error('no session');

    const response = await fetch(`${backendUrl}/base-weights?profile=${profile}`, {
        headers: { Authorization: `Bearer ${session.idToken}` },
    });

    if (response.status === 200) {
        const json = await response.json();

        return baseWeightsDecoder(json);
    }
};

const putBaseWeights = async ({ baseWeights }: { baseWeights: BaseWeights }): Promise<void> => {
    const session = await auth();
    if (!session?.idToken) throw new Error('no session');

    const { status } = await fetch(`${backendUrl}/base-weights?profile=${profile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` },
        body: JSON.stringify(baseWeights),
    });

    if (status !== 200 && status !== 202) throw new Error('Failed to update base weights');
};

const getBaseWeightsModifier = async ({ cycle }: { cycle: number }): Promise<BaseWeightsModifier | undefined> => {
    const session = await auth();
    if (!session?.idToken) throw new Error('no session');

    const response = await fetch(`${backendUrl}/base-weights/modifier/${cycle}?profile=${profile}`, {
        headers: { Authorization: `Bearer ${session.idToken}` },
    });

    if (response.status === 200) {
        const json = await response.json();
        return baseWeightsModifierDecoder(json);
    }
};

const putBaseWeightsModifier = async ({
    baseWeightsModifier,
}: {
    baseWeightsModifier: BaseWeightsModifier;
}): Promise<void> => {
    const session = await auth();
    if (!session?.idToken) throw new Error('no session');

    const { status } = await fetch(`${backendUrl}/base-weights/modifier?profile=${profile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` },
        body: JSON.stringify(baseWeightsModifier),
    });

    if (status !== 200 && status !== 202) throw new Error('Failed to update base weights modifier');
};

const getBaseWeightsForCycle = async ({ cycle }: { cycle: number }): Promise<BaseWeights> => {
    const baseWeights = await getBaseWeights();

    const response = await Promise.all(
        Array.from({ length: cycles.length }, (_, i) => i + 1).map((c) =>
            getBaseWeightsModifier({
                cycle: c,
            }),
        ),
    );

    const baseWeightsModifiersRaw = response.filter((mod: BaseWeightsModifier | undefined) => mod !== undefined);

    const baseWeightsModifiersFilledCycle: Array<BaseWeightsModifier> = [...new Array(cycle).keys()].map(
        (index) =>
            baseWeightsModifiersRaw.find((mod) => mod.cycle === index + 1) ?? {
                dl: 0,
                bp: 0,
                sq: 0,
                op: 0,
                cycle: index + 1,
            },
    );

    const modSumToCycle = baseWeightsModifiersFilledCycle.reduce(
        (prev, curr) => ({
            dl: prev.dl + curr.dl,
            bp: prev.bp + curr.bp,
            sq: prev.sq + curr.sq,
            op: prev.op + curr.op,
            cycle,
        }),
        {
            dl: 0,
            bp: 0,
            sq: 0,
            op: 0,
            cycle,
        },
    );

    const modCycleBaseWeightsToCycle: BaseWeights = {
        dl: (baseWeights?.dl ?? 0) + 2.5 * modSumToCycle.dl,
        bp: (baseWeights?.bp ?? 0) + 2.5 * modSumToCycle.bp,
        sq: (baseWeights?.sq ?? 0) + 2.5 * modSumToCycle.sq,
        op: (baseWeights?.op ?? 0) + 2.5 * modSumToCycle.op,
    };

    return addToBaseWeights(modCycleBaseWeightsToCycle, cycle);
};

export { getBaseWeights, putBaseWeights, getBaseWeightsModifier, putBaseWeightsModifier, getBaseWeightsForCycle };
