import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: any) => void;
    style?: React.CSSProperties;
    className?: string;
    disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    style,
    className,
    disabled
}) => {
    const [isOpen, setIsOpen] = useState(false);
    // Which option is keyboard-highlighted while open (-1 = none). Focus stays
    // on the trigger button the whole time — this follows the ARIA "select-only
    // combobox" pattern (aria-activedescendant) rather than moving DOM focus
    // into the popup, which is simpler to get right and avoids focus-trap bugs.
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const getOptionId = (index: number) => `${baseId}-option-${index}`;

    // Previously fell back to options[0] when `value` wasn't in the list,
    // which silently displayed a WRONG option instead of the real value —
    // e.g. an order dropdown showing "Placed" for an order that was actually
    // "Refunded" just because that status wasn't in the offered list. Falling
    // back to the raw value is honest even if unstyled, rather than lying.
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label ?? String(value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && activeIndex >= 0) {
            document.getElementById(getOptionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeIndex]);

    const handleSelect = (val: string | number) => {
        if (disabled) return;
        onChange(val);
        setIsOpen(false);
    };

    const openWithActiveIndex = () => {
        const selIdx = options.findIndex(opt => opt.value === value);
        setActiveIndex(selIdx >= 0 ? selIdx : 0);
        setIsOpen(true);
    };

    const handleTriggerClick = () => {
        if (disabled) return;
        if (isOpen) {
            setIsOpen(false);
        } else {
            openWithActiveIndex();
        }
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                openWithActiveIndex();
            }
            // Enter / Space: the native <button> click already opens it via
            // handleTriggerClick — nothing extra needed here.
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, options.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
            case ' ':
                // Prevent the native button click the browser would otherwise
                // also fire for Enter/Space, which would immediately re-toggle
                // isOpen right after handleSelect closes it.
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < options.length) {
                    handleSelect(options[activeIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`custom-select-container ${className || ''}`}
            onBlur={handleBlur}
            style={{
                position: 'relative',
                width: '100%',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                ...style
            }}
        >
            <button
                type="button"
                className="form-select"
                onClick={handleTriggerClick}
                onKeyDown={handleTriggerKeyDown}
                disabled={disabled}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={isOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 14px',
                    background: 'var(--bg-input)',
                    border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)',
                    boxShadow: isOpen ? '0 0 0 3px rgba(46, 125, 50, 0.1)' : 'none',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s',
                    backgroundImage: 'none', // Remove native arrow
                    userSelect: 'none',
                    font: 'inherit',
                    textAlign: 'left',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
            >
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {displayLabel}
                </span>
                <ChevronDown
                    size={16}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                        color: 'var(--text-muted)'
                    }}
                />
            </button>

            {isOpen && (
                <div
                    id={listboxId}
                    role="listbox"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 2000,
                        overflow: 'hidden',
                        animation: 'fadeInSlide 0.2s ease-out'
                    }}
                >
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {options.map((opt, index) => (
                            <div
                                key={opt.value}
                                id={getOptionId(index)}
                                role="option"
                                aria-selected={value === opt.value}
                                onClick={() => handleSelect(opt.value)}
                                onMouseEnter={() => setActiveIndex(index)}
                                style={{
                                    padding: '10px 14px',
                                    fontSize: '0.9rem',
                                    fontWeight: value === opt.value ? 700 : 500,
                                    color: value === opt.value ? 'var(--primary-dark)' : 'var(--text-primary)',
                                    background: value === opt.value
                                        ? 'var(--primary-50)'
                                        : activeIndex === index
                                            ? 'var(--bg-elevated)'
                                            : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInSlide {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
