import type { ReactNode } from 'react';
import MenuLink from '@/components/server/menu-link';
import { cycles } from '@/utils/constants';
import { intCoerciveDecoder } from '@/utils/helpers';

interface Props {
    children: ReactNode;
    params: Promise<{
        cycle: string;
    }>;
}

const CycleLayout = async (props: Props) => {
    const params = await props.params;

    const { cycle } = params;

    const { children } = props;

    const cyclePrefix = String.fromCodePoint(0x1f504); // 🔄
    const profileHeader = String.fromCodePoint(0x1f464); // 👤

    const currentCycle = intCoerciveDecoder(cycle);
    if (!currentCycle) throw new Error('params.cycle is not a number');

    return (
        <>
            <div className="grid grid-flow-col md:gap-1 lg:gap-2 xl:gap-4">
                {cycles.map((cycle) => (
                    <MenuLink
                        href={`/cycle/${cycle}/week/1`}
                        key={`link-cycle-${cycle}`}
                        className={currentCycle === cycle ? 'bg-sky-500' : ''}
                    >{`${cyclePrefix} ${cycle}`}</MenuLink>
                ))}
                <MenuLink href="/profile">{profileHeader}</MenuLink>
            </div>
            {children}
        </>
    );
};

export default CycleLayout;
