import BaseWeightsModifierForm from '@/components/server/base-weights-modifier-form';
import { intCoerciveDecoder } from '@/utils/helpers';

interface Props {
    params: Promise<{
        cycle: string;
    }>;
}

const CycleEditPage = async (props: Props) => {
    const params = await props.params;
    const currentCycle = intCoerciveDecoder(params.cycle);

    if (!currentCycle) throw new Error(`Invalid cycle '${String(currentCycle)}'`);

    return <BaseWeightsModifierForm cycle={currentCycle} />;
};

export default CycleEditPage;
