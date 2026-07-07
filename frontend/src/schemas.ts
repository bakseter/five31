import { z } from 'zod';

// Schemas double as runtime validators (via RTK Query transformResponse) and as
// the source of the TypeScript types — one definition, no drift.

export const unitSchema = z.enum(['kg', 'lb']);
export type Unit = z.infer<typeof unitSchema>;

const repsSchema = z.number().int().nonnegative().nullable();

export const liftSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  trainingMax: z.number(),
  unit: unitSchema,
  order: z.number(),
  cycleNumber: z.number(),
  repsWeek1: repsSchema,
  repsWeek2: repsSchema,
  repsWeek3: repsSchema,
});
export const liftsSchema = z.array(liftSchema);
export type Lift = z.infer<typeof liftSchema>;

// One lift's proposed next-cycle max, computed from this cycle's AMRAP results.
export const suggestionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  unit: unitSchema,
  currentMax: z.number(),
  suggestedMax: z.number(),
  estimatedOneRepMax: z.number(),
  reason: z.string(),
});
export const suggestionsSchema = z.array(suggestionSchema);
export type Suggestion = z.infer<typeof suggestionSchema>;

// One lift within one completed cycle — the permanent training-log record.
export const historyEntrySchema = z.object({
  cycleNumber: z.number(),
  completedAt: z.string(),
  slug: z.string(),
  name: z.string(),
  trainingMax: z.number(),
  unit: unitSchema,
  repsWeek1: repsSchema,
  repsWeek2: repsSchema,
  repsWeek3: repsSchema,
  estimatedOneRepMax: z.number(),
});
export const historySchema = z.array(historyEntrySchema);
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const computedSetSchema = z.object({
  percent: z.number(),
  reps: z.string(),
  amrap: z.boolean(),
  weight: z.number(),
});

export const computedLiftSchema = z.object({
  name: z.string(),
  slug: z.string(),
  trainingMax: z.number(),
  sets: z.array(computedSetSchema),
});

export const computedWeekSchema = z.object({
  name: z.string(),
  lifts: z.array(computedLiftSchema),
});

export const cycleSchema = z.object({
  unit: unitSchema,
  weeks: z.array(computedWeekSchema),
});
export type Cycle = z.infer<typeof cycleSchema>;
export type ComputedWeek = z.infer<typeof computedWeekSchema>;
export type ComputedLift = z.infer<typeof computedLiftSchema>;
