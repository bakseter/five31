import { redirect } from 'next/navigation';
import { getBaseWeightsForCycle, getBaseWeightsModifier, putBaseWeightsModifier } from '@/actions/base-weights';
import { baseWeightsModifierDecoder, comps } from '@/schema/base-weights';
import { auth } from '@/api/auth';
import Button from '@/components/client/button';
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
    const baseWeightsForCycle = await getBaseWeightsForCycle({
        cycle,
    });

    return (
        <form action={setBaseWeightsModifier}>
            {comps.map((exercise) => (
                <div className="m-8" key={`bm-mod-select-${exercise}`}>
                    <h4 className="my-2 font-bold">{exerciseToText(exercise)}</h4>
                    <div className="grid grid-cols-2 gap-5">
                        <select className="text-center p-1" name={exercise} defaultValue={baseWeightsMod?.[exercise]}>
                            <option value={0}>+ 0 kg</option>
                            {[1, 2, 3, 4, 5].map((_, index) => (
                                <option key={`bm-mod-select-${exercise}-option-${index}`} value={index + 1}>
                                    + {2.5 * (index + 1)} kg
                                </option>
                            ))}
                        </select>
                        <p>
                            {'= '}
                            {baseWeightsForCycle[exercise]} kg
                        </p>
                    </div>
                </div>
            ))}
            <Button type="submit">Submit</Button>
        </form>
    );
};

export default BaseWeightsModifierForm;
