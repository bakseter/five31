'use client';

import { useId } from 'react';

import type { CompExercise } from '@/schema/base-weights';
import { exerciseToText } from '@/utils/helpers';

interface BaseWeightsFormInputProps {
    comp: CompExercise;
    initialValue?: number;
}

const BaseWeightsFormInput = ({ comp, initialValue }: BaseWeightsFormInputProps) => {
    const id = useId();

    return (
        <>
            <label htmlFor={id} className="text-2xl font-bold py-2">
                {exerciseToText(comp)}
            </label>
            <input
                id={id}
                name={comp}
                type="number"
                step=".25"
                key={`input-${comp}`}
                defaultValue={initialValue}
                className="border-2 border-gray-300 rounded-md p-2"
            />
        </>
    );
};

export default BaseWeightsFormInput;
