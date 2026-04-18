import { type decodeType, number, record } from 'typescript-json-decoder';

import { intCoerciveDecoder } from '@/utils/helpers';

const weekDecoder = (value: unknown) => {
    if (value === 1 || value === 2 || value === 3) return value;
    throw new TypeError('Invalid week');
};
type Week = decodeType<typeof weekDecoder>;

const dayDecoder = (value: unknown) => {
    if (value === 1 || value === 2 || value === 3 || value === 4) return value;
    throw new TypeError('Invalid day');
};
type Day = decodeType<typeof dayDecoder>;

const workoutDecoder = record({
    cycle: number,
    week: weekDecoder,
    day: dayDecoder,
    reps: intCoerciveDecoder,
});
type Workout = decodeType<typeof workoutDecoder>;

const profileDecoder = (value: unknown) => {
    if (value === 1 || value === 2 || value === 3 || value === 4) return value;
    throw new TypeError('Invalid profile');
};
type Profile = decodeType<typeof profileDecoder>;

export { type Day, dayDecoder, type Profile, profileDecoder, type Week, weekDecoder, type Workout, workoutDecoder };
