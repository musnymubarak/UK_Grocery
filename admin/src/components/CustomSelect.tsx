import React, { useState, useRef, useEffect } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string | number) => {
        if (disabled) return;
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div 
            ref={containerRef} 
            className={`custom-select-container ${className || ''}`}
            style={{ 
                position: 'relative', 
                width: '100%',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                ...style 
            }}
        >
            <div 
                className="form-select" 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    background: 'var(--bg-input)',
                    border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)',
                    boxShadow: isOpen ? '0 0 0 3px rgba(46, 125, 50, 0.1)' : 'none',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s',
                    backgroundImage: 'none', // Remove native arrow
                    userSelect: 'none'
                }}
            >
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedOption?.label}
                </span>
                <ChevronDown 
                    size={16} 
                    style={{ 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                        color: 'var(--text-muted)'
                    }} 
                />
            </div>

            {isOpen && (
                <div 
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
                        {options.map((opt) => (
                            <div 
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                style={{
                                    padding: '10px 14px',
                                    fontSize: '0.9rem',
                                    fontWeight: value === opt.value ? 700 : 500,
                                    color: value === opt.value ? 'var(--primary-dark)' : 'var(--text-primary)',
                                    background: value === opt.value ? 'var(--primary-50)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== opt.value) e.currentTarget.style.background = 'var(--bg-elevated)';
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== opt.value) e.currentTarget.style.background = 'transparent';
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
