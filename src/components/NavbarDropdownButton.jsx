import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * A dropdown button used in the navbar. It keeps its own open/close state,
 * handles outside clicks and escape key, and renders a glassmorphism menu.
 *
 * Props:
 *  - label: string shown on the button
 *  - items: Array<{ href, icon, iconBg?, title, description? }>
 *  - variant: 'filled' | 'outlined' | 'ghost-dark' (defaults to 'filled')
 */
const NavbarDropdownButton = ({ label, items, variant = 'filled' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // close on outside click or Escape
  useEffect(() => {
    const handleClick = (e) => {
      if (open && containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keyup', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keyup', handleKey);
    };
  }, [open]);

  const buttonClasses = `flex items-center space-x-1 px-5 py-2 min-w-[4rem] rounded-xl font-semibold focus:outline-none transition-all duration-200 ${
    variant === 'ghost-dark'
      ? 'border border-white/10 bg-white/[0.03] text-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.18)] hover:border-violet-400/40 hover:bg-white/[0.08]'
      : variant === 'filled'
        ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600'
        : 'border border-slate-200 bg-white text-purple-700 hover:border-purple-300 hover:bg-purple-50'
  }`;

  const menuClasses = `absolute top-full mt-2 right-0 w-64 rounded-2xl border shadow-2xl backdrop-blur-xl transform transition-all duration-200 ${
    variant === 'ghost-dark' || variant === 'filled'
      ? 'border-slate-600 bg-slate-700/95 divide-y divide-slate-600'
      : 'border-white/30 bg-white/85 divide-y divide-white/40'
  } ${
    open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
  }`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={buttonClasses}
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={menuClasses} style={{ zIndex: 9999 }}>
        {items.map((itm, idx) => (
          <Link
            key={idx}
            to={itm.href}
            onClick={() => setOpen(false)}
            className={`flex items-start space-x-3 p-4 transition-transform duration-150 ${
              idx === 0 ? 'rounded-t-2xl' : ''
            } ${idx === items.length - 1 ? 'rounded-b-2xl' : ''} ${
              variant === 'ghost-dark' || variant === 'filled'
                ? 'hover:bg-slate-600'
                : 'hover:bg-white/40'
            } hover:-translate-y-0.5`}
          >
            <div className={`${itm.iconBg || 'bg-purple-100'} rounded-lg p-2 flex-shrink-0`}>{itm.icon}</div>
            <div className="flex flex-col text-left">
              <span className={`font-medium ${variant === 'ghost-dark' || variant === 'filled' ? 'text-slate-100' : 'text-gray-800'}`}>{itm.title}</span>
              {itm.description && (
                <span className={`text-xs ${variant === 'ghost-dark' || variant === 'filled' ? 'text-slate-300' : 'text-gray-600'}`}>{itm.description}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NavbarDropdownButton;
