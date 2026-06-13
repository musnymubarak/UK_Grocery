import React from 'react';
import { cn } from '../../lib/cn';

/** Icon component shape compatible with lucide-react icons. */
export type IconType = React.ComponentType<{ size?: number | string; className?: string }>;

/* ============================== Spinner ============================== */
export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
    return (
        <span
            className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)}
            style={{ width: size, height: size }}
            aria-hidden
        />
    );
}

/* ============================== Button ============================== */
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const BTN_VARIANT: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-on-primary shadow-sm hover:opacity-95 hover:shadow active:translate-y-px',
    secondary: 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container',
    danger: 'bg-error text-white shadow-sm hover:opacity-95 active:translate-y-px',
    success: 'bg-success text-white shadow-sm hover:opacity-95 active:translate-y-px',
    ghost: 'text-on-surface-variant hover:bg-surface-container',
};
const BTN_SIZE: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: IconType;
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    className,
    children,
    disabled,
    ...rest
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center font-semibold rounded-md transition-colors whitespace-nowrap',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue/40',
                'disabled:opacity-50 disabled:pointer-events-none',
                BTN_VARIANT[variant],
                BTN_SIZE[size],
                className,
            )}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? <Spinner size={size === 'sm' ? 14 : 16} /> : Icon ? <Icon size={size === 'sm' ? 14 : 18} /> : null}
            {children}
        </button>
    );
}

export function IconButton({
    icon: Icon,
    label,
    className,
    size = 18,
    ...rest
}: { icon: IconType; label: string; size?: number } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            aria-label={label}
            title={label}
            className={cn(
                'inline-flex items-center justify-center h-9 w-9 rounded-md text-on-surface-variant',
                'border border-outline-variant bg-surface-container-lowest hover:bg-surface-container hover:text-on-surface transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue/40',
                className,
            )}
            {...rest}
        >
            <Icon size={size} />
        </button>
    );
}

/* ============================== Badge ============================== */
type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
const BADGE_TONE: Record<BadgeTone, string> = {
    success: 'bg-success/12 text-success ring-1 ring-inset ring-success/20',
    warning: 'bg-warning/15 text-warning ring-1 ring-inset ring-warning/25',
    danger: 'bg-error/12 text-error ring-1 ring-inset ring-error/20',
    info: 'bg-info/12 text-info ring-1 ring-inset ring-info/20',
    primary: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/15',
    neutral: 'bg-surface-container text-on-surface-variant ring-1 ring-inset ring-outline-variant/60',
};
const DOT_TONE: Record<BadgeTone, string> = {
    success: 'bg-success', warning: 'bg-warning', danger: 'bg-error',
    info: 'bg-info', primary: 'bg-primary', neutral: 'bg-on-surface-variant',
};
export function Badge({ tone = 'neutral', dot, children, className }: { tone?: BadgeTone; dot?: boolean; children: React.ReactNode; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', BADGE_TONE[tone], className)}>
            {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_TONE[tone])} />}
            {children}
        </span>
    );
}

/* ============================== Card ============================== */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('bg-surface-container-lowest border border-outline-variant rounded-xl elev-card', className)} {...rest}>
            {children}
        </div>
    );
}

/* ============================== Form fields ============================== */
export function FormField({ label, error, hint, required, children, className }: {
    label?: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={cn('mb-4', className)}>
            {label && (
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    {label}{required && <span className="text-error"> *</span>}
                </label>
            )}
            {children}
            {error ? <p className="mt-1 text-xs text-error">{error}</p> : hint ? <p className="mt-1 text-xs text-on-surface-variant">{hint}</p> : null}
        </div>
    );
}

const FIELD_BASE =
    'w-full rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface text-sm ' +
    'placeholder:text-on-surface-variant/60 transition-colors ' +
    'focus:outline-none focus:border-action-blue focus:ring-2 focus:ring-action-blue/20 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    function Input({ className, ...rest }, ref) {
        return <input ref={ref} className={cn(FIELD_BASE, 'h-10 px-3', className)} {...rest} />;
    },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    function Textarea({ className, ...rest }, ref) {
        return <textarea ref={ref} className={cn(FIELD_BASE, 'px-3 py-2 min-h-[80px]', className)} {...rest} />;
    },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    function Select({ className, children, ...rest }, ref) {
        return (
            <select ref={ref} className={cn(FIELD_BASE, 'h-10 px-3 pr-9 cursor-pointer appearance-none bg-no-repeat', className)}
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2374777f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundPosition: 'right 10px center',
                    backgroundSize: '16px',
                }}
                {...rest}
            >
                {children}
            </select>
        );
    },
);

/* ============================== Toggle ============================== */
export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue/40 disabled:opacity-50',
                checked ? 'bg-action-blue' : 'bg-surface-container-highest',
            )}
        >
            <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
        </button>
    );
}

/* ============================== Skeleton ============================== */
export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded-md bg-surface-container-high', className)} />;
}

/* ============================== EmptyState ============================== */
export function EmptyState({ icon: Icon, title, message, action }: {
    icon?: IconType; title: string; message?: string; action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            {Icon && <div className="mb-4 text-on-surface-variant/50"><Icon size={44} /></div>}
            <h3 className="font-headline text-lg font-bold text-on-surface">{title}</h3>
            {message && <p className="mt-1 text-sm text-on-surface-variant max-w-sm">{message}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

/* ============================== PageHeader ============================== */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
                <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

/* ============================== StatCard ============================== */
type StatTone = 'primary' | 'blue' | 'green' | 'amber' | 'red';
const STAT_TONE: Record<StatTone, string> = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-action-blue/10 text-action-blue',
    green: 'bg-success/10 text-success',
    amber: 'bg-warning/15 text-warning',
    red: 'bg-error/10 text-error',
};
export function StatCard({ icon: Icon, label, value, tone = 'primary', trend, loading }: {
    icon?: IconType; label: string; value: React.ReactNode; tone?: StatTone;
    trend?: { value: string; up?: boolean }; loading?: boolean;
}) {
    return (
        <Card className="p-5 flex items-center gap-4">
            {Icon && (
                <div className={cn('h-12 w-12 shrink-0 rounded-lg flex items-center justify-center', STAT_TONE[tone])}>
                    <Icon size={22} />
                </div>
            )}
            <div className="min-w-0">
                <div className="text-xs font-medium text-on-surface-variant truncate">{label}</div>
                {loading ? (
                    <Skeleton className="h-6 w-20 mt-1" />
                ) : (
                    <div className="font-headline text-2xl font-extrabold text-on-surface leading-tight">{value}</div>
                )}
                {trend && <div className={cn('text-xs font-semibold mt-0.5', trend.up ? 'text-success' : 'text-error')}>{trend.up ? '▲' : '▼'} {trend.value}</div>}
            </div>
        </Card>
    );
}
