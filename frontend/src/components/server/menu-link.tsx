import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';

type MenuLinkProps = LinkProps & {
    className?: string;
    children: ReactNode;
};

const MenuLink = ({ className, children, ...props }: MenuLinkProps) => (
    <Link
        className={`inline-block rounded-lg border border-slate-200 bg-white m-1.5 py-2 text-center text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 ${className ?? ''}`}
        {...props}
    >
        {children}
    </Link>
);

export default MenuLink;
