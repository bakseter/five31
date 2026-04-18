import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const defaultClassNames =
    'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900';

const Button = ({ className, ...props }: ButtonProps) => (
    <button className={`${defaultClassNames} ${className ?? ''}`} {...props} />
);

export { defaultClassNames };
export default Button;
