import { redirect } from 'next/navigation';

import { getBaseWeights } from '@/actions/base-weights';
import { auth } from '@/api/auth';
import BaseWeightsFormInput from '@/components/client/base-weights-form-input';
import Button from '@/components/client/button';
import { baseWeightsDecoder, type CompExercise, comps } from '@/schema/base-weights';
import { backendUrl } from '@/utils/constants';

interface Props {
    isFirstTime?: boolean;
}

const BaseWeightsForm = async ({ isFirstTime = false }: Props) => {
    const session = await auth();
    if (!session?.idToken) redirect('/api/auth/signin');

    const setBaseWeights = async (formData: FormData) => {
        'use server';
        const rawBaseWeights = {
            dl: formData.get('dl'),
            bp: formData.get('bp'),
            sq: formData.get('sq'),
            op: formData.get('op'),
        };
        const baseWeights = baseWeightsDecoder(rawBaseWeights);
        const { status } = await fetch(`${backendUrl}/base-weights?profile=1`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` },
            body: JSON.stringify(baseWeights),
        });
        if (status !== 200 && status !== 202) throw new Error(`something went wrong: ${String(status)}`);
        if (isFirstTime) redirect('/cycle/1/week/1');
    };

    const baseWeights = await getBaseWeights();

    return (
        <div className={`flex justify-center ${isFirstTime ? 'py-12' : ''}`}>
            <div className="flex w-full max-w-sm flex-col gap-4">
                {isFirstTime && (
                    <div className="text-center">
                        <h3 className="text-base font-semibold text-slate-800">Enter your base weights</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            These will be used to calculate your working sets.
                        </p>
                    </div>
                )}
                <form action={setBaseWeights}>
                    <div className="flex flex-col gap-2">
                        {comps.map((comp: CompExercise, index) => (
                            <BaseWeightsFormInput
                                comp={comp}
                                key={`${comp}-${String(index)}`}
                                initialValue={baseWeights?.[comp]}
                            />
                        ))}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                                Save weights
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BaseWeightsForm;
