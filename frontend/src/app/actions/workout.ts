'use server';

import { number, record } from 'typescript-json-decoder';
import { auth } from '@/api/auth';
import { backendUrl } from '@/utils/constants';
import { type Day, type Week, workoutDecoder } from '@/schema/workout';

const profile = 1;

const setReps = async ({ cycle, week, day, reps }: { cycle: number; week: Week; day: Day; reps: number }) => {
    const session = await auth();
    if (!session?.idToken) throw new Error('no session');

    const workout = workoutDecoder({
        cycle,
        week,
        day,
        reps,
    });

    const { status } = await fetch(`${backendUrl}/workout?profile=${profile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.idToken}` },
        body: JSON.stringify(workout),
    });

    if (status !== 200 && status !== 202) throw new Error(`something went wrong: ${status}`);
};

const getReps = async ({ cycle, week, day }: { cycle: number; week: Week; day: Day }): Promise<number | undefined> => {
    const session = await auth();
    if (!session?.idToken) throw new Error('no session');

    const response = await fetch(`${backendUrl}/workout?cycle=${cycle}&week=${week}&day=${day}&profile=${profile}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.idToken}` },
    });

    if (response.status === 200) {
        const json = await response.json();
        return workoutDecoder(json).reps;
    }

    if (response.status !== 204) throw new Error(`something went wrong: ${response.status}`);
};

const getWorkoutCount = async (): Promise<number | undefined> => {
    const session = await auth();
    if (!session?.idToken) throw new Error('no session');

    const response = await fetch(`${backendUrl}/workout/count?profile=${profile}`, {
        headers: { Authorization: `Bearer ${session.idToken}` },
    });

    if (response.status === 200) {
        const json = await response.json();
        return record({ count: number })(json).count;
    }
};

export { setReps, getReps, getWorkoutCount };
