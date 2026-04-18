import { redirect } from 'next/navigation';

import { getBaseWeightsForCycle, getBaseWeightsModifier, putBaseWeightsModifier } from '@/actions/base-weights';
import { auth } from '@/api/auth';
import Button from '@/components/client/button';
import { baseWeightsModifierDecoder, comps } from '@/schema/base-weights';
import { exerciseToText } from '@/utils/helpers';

interface Props {
    cycle: number;
}

const BaseWeightsModifierForm = async ({ cycle }: Props) => {
    const session = await auth();
    if (!session?.idToken) redirect('/api/auth/signin');

    const setBaseWeightsModifier = async (formData: FormData) => {
        'use server';
        const rawBaseWeightsMod = {
            dl: formData.get('dl'),
            bp: formData.get('bp'),
            sq: formData.get('sq'),
            op: formData.get('op'),
            cycle,
        };
        const baseWeightsModifier = baseWeightsModifierDecoder(rawBaseWeightsMod);
        await putBaseWeightsModifier({ baseWeightsModifier });
    };

    const baseWeightsMod = await getBaseWeightsModifier({ cycle });
    const baseWeightsForCycle = await getBaseWeightsForCycle({ cycle });

    return (
        <form action={setBaseWeightsModifier} className="flex flex-col gap-2 m-2">
            {comps.map((exercise) => (
                <div
                    key={`bm-mod-select-${exercise}`}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                >
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                        {exerciseToText(exercise)}
                    </h4>
                    <div className="flex items-center gap-4">
                        <select
                            name={exercise}
                            defaultValue={baseWeightsMod?.[exercise]}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            <option value={0}>+ 0 kg</option>
                            {/* eslint-disable-next-line id-length */}
                            {[1, 2, 3, 4, 5].map((_, index) => (
                                <option key={`bm-mod-select-${exercise}-option-${String(index)}`} value={index + 1}>
                                    + {2.5 * (index + 1)} kg
                                </option>
                            ))}
                        </select>
                        <p className="text-sm font-medium text-slate-500">
                            ={' '}
                            <span className="text-base font-semibold text-slate-800">
                                {baseWeightsForCycle[exercise]} kg
                            </span>
                        </p>
                    </div>
                </div>
            ))}
            <div className="pt-2">
                <Button
                    type="submit"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                    Save weights
                </Button>
            </div>
        </form>
    );
};

export default BaseWeightsModifierForm;
