import { z } from 'zod';

// Schemas double as runtime validators (via RTK Query transformResponse) and as
// The source of the TypeScript types — one definition, no drift. All weights are
// Kilograms.

const repsSchema = z.number().int().nonnegative().nullable();

// The signed-in identity. Just a default user for now, but the shape is ready
// For real per-user auth.
const userSchema = z.object({
    id: z.number(),
    subject: z.string(),
    name: z.string(),
});
type User = z.infer<typeof userSchema>;

const liftSchema = z.object({
    id: z.number(),
    slug: z.string(),
    name: z.string(),
    trainingMax: z.number(),
    order: z.number(),
    cycleNumber: z.number(),
    repsWeek1: repsSchema,
    repsWeek2: repsSchema,
    repsWeek3: repsSchema,
});
const liftsSchema = z.array(liftSchema);
type Lift = z.infer<typeof liftSchema>;

// One lift's proposed next-cycle max, computed from this cycle's AMRAP results.
const suggestionSchema = z.object({
    slug: z.string(),
    name: z.string(),
    currentMax: z.number(),
    suggestedMax: z.number(),
    estimatedOneRepMax: z.number(),
    reason: z.string(),
});
const suggestionsSchema = z.array(suggestionSchema);
type Suggestion = z.infer<typeof suggestionSchema>;

// One lift within one completed cycle — the permanent training-log record.
const historyEntrySchema = z.object({
    cycleNumber: z.number(),
    completedAt: z.string(),
    slug: z.string(),
    name: z.string(),
    trainingMax: z.number(),
    repsWeek1: repsSchema,
    repsWeek2: repsSchema,
    repsWeek3: repsSchema,
    estimatedOneRepMax: z.number(),
});

const historySchema = z.array(historyEntrySchema);
type HistoryEntry = z.infer<typeof historyEntrySchema>;

const computedSetSchema = z.object({
    percent: z.number(),
    reps: z.string(),
    warmup: z.boolean(),
    amrap: z.boolean(),
    weight: z.number(),
});

const computedLiftSchema = z.object({
    name: z.string(),
    slug: z.string(),
    trainingMax: z.number(),
    sets: z.array(computedSetSchema),
});

const computedWeekSchema = z.object({
    name: z.string(),
    lifts: z.array(computedLiftSchema),
});

const cycleSchema = z.object({
    weeks: z.array(computedWeekSchema),
});

type Cycle = z.infer<typeof cycleSchema>;
type ComputedWeek = z.infer<typeof computedWeekSchema>;
type ComputedLift = z.infer<typeof computedLiftSchema>;

export {
    computedLiftSchema,
    computedSetSchema,
    computedWeekSchema,
    cycleSchema,
    historyEntrySchema,
    historySchema,
    liftSchema,
    liftsSchema,
    suggestionSchema,
    suggestionsSchema,
    userSchema,
};

export type {
    ComputedLift,
    ComputedWeek,
    Cycle,
    HistoryEntry,
    Lift,
    Suggestion,
    User,
};
