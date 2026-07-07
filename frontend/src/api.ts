import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  cycleSchema,
  historySchema,
  liftsSchema,
  suggestionsSchema,
  type Cycle,
  type HistoryEntry,
  type Lift,
  type Suggestion,
} from './schemas';

export interface LiftUpdate {
  slug: string;
  trainingMax: number;
  unit: string;
}

// reps are null when a week's AMRAP set hasn't been logged.
export interface AmrapUpdate {
  slug: string;
  repsWeek1: number | null;
  repsWeek2: number | null;
  repsWeek3: number | null;
}

export interface AdvanceUpdate {
  slug: string;
  trainingMax: number;
}

// Every response is parsed through its Zod schema, so a shape mismatch surfaces
// immediately instead of leaking `undefined` into the UI.
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Lifts', 'Cycle', 'Next', 'History'],
  endpoints: (build) => ({
    getLifts: build.query<Lift[], void>({
      query: () => 'lifts',
      transformResponse: (raw) => liftsSchema.parse(raw),
      providesTags: ['Lifts'],
    }),
    updateLifts: build.mutation<Lift[], LiftUpdate[]>({
      query: (body) => ({ url: 'lifts', method: 'PUT', body }),
      transformResponse: (raw) => liftsSchema.parse(raw),
      invalidatesTags: ['Lifts', 'Cycle', 'Next'],
    }),
    getCycle: build.query<Cycle, void>({
      query: () => 'cycle',
      transformResponse: (raw) => cycleSchema.parse(raw),
      providesTags: ['Cycle'],
    }),
    // Log the reps hit on this cycle's AMRAP sets. Only the next-cycle preview
    // depends on these, so the four-week plan itself needn't refetch.
    updateAmrap: build.mutation<Lift[], AmrapUpdate[]>({
      query: (body) => ({ url: 'amrap', method: 'PUT', body }),
      transformResponse: (raw) => liftsSchema.parse(raw),
      invalidatesTags: ['Next'],
    }),
    // Preview only — never mutates. The client can override before advancing.
    getNextCycle: build.query<Suggestion[], void>({
      query: () => 'cycle/next',
      transformResponse: (raw) => suggestionsSchema.parse(raw),
      providesTags: ['Next'],
    }),
    advanceCycle: build.mutation<Lift[], AdvanceUpdate[]>({
      query: (body) => ({ url: 'cycle/advance', method: 'POST', body }),
      transformResponse: (raw) => liftsSchema.parse(raw),
      invalidatesTags: ['Lifts', 'Cycle', 'Next', 'History'],
    }),
    // Every completed cycle, newest first — the permanent training log.
    getHistory: build.query<HistoryEntry[], void>({
      query: () => 'history',
      transformResponse: (raw) => historySchema.parse(raw),
      providesTags: ['History'],
    }),
  }),
});

export const {
  useGetLiftsQuery,
  useUpdateLiftsMutation,
  useGetCycleQuery,
  useUpdateAmrapMutation,
  useGetNextCycleQuery,
  useAdvanceCycleMutation,
  useGetHistoryQuery,
} = api;
