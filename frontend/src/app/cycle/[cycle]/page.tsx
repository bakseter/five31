import type { Metadata } from 'next';

import MenuLink from '@/components/server/menu-link';
import { weeks } from '@/utils/constants';

interface Props {
    params: Promise<{
        cycle: string;
    }>;
}

const generateMetadata = async (props: Props): Promise<Metadata> => {
    const { cycle } = await props.params;

    return {
        title: `Cycle ${cycle}`,
    };
};

const CyclePage = async (props: Props) => {
    const { cycle } = await props.params;

    return (
        <div className="flex flex-col items-center py-16">
            <h3 className="pb-6">Please select a week 👇</h3>
            <div className="flex flex-row">
                {weeks.map((week) => (
                    <MenuLink
                        className="bg-sky-500 rounded-md p-4 m-4"
                        key={`page-link-week-${String(week)}`}
                        href={`/cycle/${cycle}/week/${String(week)}`}
                    >
                        Week {week}
                    </MenuLink>
                ))}
            </div>
        </div>
    );
};

export { generateMetadata };
export default CyclePage;
