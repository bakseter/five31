import { redirect } from 'next/navigation';

import { getBaseWeights } from '@/actions/base-weights';
import { getWorkoutCount } from '@/actions/workout';
import { auth } from '@/api/auth';
import BaseWeightsForm from '@/components/server/base-weights-form';
import { backendUrl } from '@/utils/constants';

const IndexPage = async () => {
    void fetch(`${backendUrl}/status`);

    const session = await auth();
    if (!session?.idToken) redirect('/api/auth/signin');

    const baseWeights = await getBaseWeights();
    const count = (await getWorkoutCount()) ?? 0;

    if (!baseWeights && count === 0) return <BaseWeightsForm isFirstTime />;

    const cycle = Math.floor(count / 12) + 1;
    const week = Math.floor((count % 12) / 4) + 1;

    return redirect(`/cycle/${String(cycle)}/week/${String(week)}`);
};

export default IndexPage;
