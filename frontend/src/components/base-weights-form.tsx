import { useForm } from 'react-hook-form';
import { Spinner, Text, Heading, Flex, Input, VStack } from '@chakra-ui/react';
import useBaseWeights from '@hooks/use-base-weights';
import { comps, exerciseToText, type CompExercise } from '@utils/helpers';
import { type BaseWeights } from '@api/base-weights';

type FormValues = BaseWeights;

const BaseWeightsForm = () => {
    const { baseWeights, setBaseWeights, error, loading, setError, setLoading } = useBaseWeights();
    const { register, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            dl: baseWeights?.dl,
            bp: baseWeights?.bp,
            sq: baseWeights?.sq,
            op: baseWeights?.op,
        },
    });

    const onSubmit = (data: FormValues) => setBaseWeights(data);

    return (
        <>
            {error && <Text>{error}</Text>}
            {loading && <Spinner />}
            {!error && !loading && (
                <Flex py="4rem">
                    <VStack gap="2">
                        <Heading size="md">Enter base weights:</Heading>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <VStack gap="1" alignItems="start">
                                {comps.map((value: CompExercise) => (
                                    <>
                                        <Text fontWeight="bold">{exerciseToText(value)}</Text>
                                        <Input
                                            type="number"
                                            step=".25"
                                            key={`input-${value}`}
                                            placeholder={exerciseToText(value)}
                                            {...register(value)}
                                        />
                                    </>
                                ))}
                                <Input type="submit" value="Submit" />
                            </VStack>
                        </form>
                    </VStack>
                </Flex>
            )}
            <Input
                type="button"
                value="Reset"
                onClick={() => {
                    setLoading(false);
                    setError(null);
                }}
            />
        </>
    );
};

export default BaseWeightsForm;
