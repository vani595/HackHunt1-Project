import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Rocket, User, Settings2, ShieldCheck, UserPlus, Hammer, Menu, X, Home, Info, Mail } from 'lucide-react';
import NavbarDropdownButton from '../NavbarDropdownButton';

const Header = () => {
  const { pathname } = useLocation();
  const isDarkHero = pathname === '/' || pathname === '/hackathons';
  const isLanding = pathname === '/';
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const scrollTo = (id) => {
    setDrawerOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 350);
  };

  const loginItems = [
    { href: '/login-user', icon: <User className="h-5 w-5 text-purple-600" />, iconBg: 'bg-purple-100', title: 'Login as User', description: 'Explore and join hackathons' },
    { href: '/login-organizer', icon: <Settings2 className="h-5 w-5 text-purple-600" />, iconBg: 'bg-purple-100', title: 'Login as Organizer', description: 'Manage your hackathons' },
    { href: '/login-admin', icon: <ShieldCheck className="h-5 w-5 text-purple-600" />, iconBg: 'bg-purple-100', title: 'Login as Admin', description: 'System administration' },
  ];

  const signupItems = [
    { href: '/signup-user', icon: <UserPlus className="h-5 w-5 text-purple-600" />, iconBg: 'bg-purple-100', title: 'Sign up as User', description: 'Explore and join hackathons' },
    { href: '/signup-organizer', icon: <Hammer className="h-5 w-5 text-purple-600" />, iconBg: 'bg-purple-100', title: 'Sign up as Organizer', description: 'Organize hackathons' },
  ];

  const navItems = [
    { label: 'Home', icon: Home, action: () => { setDrawerOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    { label: 'About Us', icon: Info, action: () => scrollTo('about') },
    { label: 'Contact Us', icon: Mail, action: () => scrollTo('contact') },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDarkHero
            ? 'border-white/8 bg-[#0d0a18]/85 shadow-[0_18px_45px_rgba(3,7,18,0.45)]'
            : 'border-white/60 bg-white/75 shadow-[0_12px_40px_rgba(15,23,42,0.08)]'
        }`}
      >
        <div className="mx-auto max-w-screen-xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">

            {/* Left — hamburger + Logo */}
            <div className="flex min-w-0 flex-1 items-center">
              {isLanding && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(o => !o)}
                  className={`mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition lg:mr-3 ${
                    isDarkHero
                      ? 'border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}
              <Link to="/" className="group flex min-w-0 items-center space-x-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 transition duration-300 group-hover:scale-110">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <span className={`text-4xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent ${
                  isDarkHero
                    ? 'from-white via-violet-100 to-cyan-200'
                    : 'from-violet-600 via-purple-600 to-blue-600'
                }`}>
                  HackHunt
                </span>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-10 lg:flex">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <NavbarDropdownButton label="Login" items={loginItems} variant={isDarkHero ? 'ghost-dark' : 'filled'} />
                <NavbarDropdownButton label="Sign up" items={signupItems} variant="filled" />
              </div>
            </nav>

            {/* Mobile nav */}
            <nav className="flex items-center space-x-3 lg:hidden">
              <NavbarDropdownButton label="Login" items={loginItems} variant={isDarkHero ? 'ghost-dark' : 'filled'} />
              <NavbarDropdownButton label="Sign up" items={signupItems} variant="filled" />
            </nav>

          </div>
        </div>
      </header>

      {/* Dark Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* LEFT Slide-in Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: '280px',
          zIndex: 70,
          background: 'linear-gradient(180deg, #0f0c1f 0%, #0d0a18 100%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '8px 0 40px rgba(0,0,0,0.5)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Rocket size={18} color="white" />
            </div>
            <span style={{
              fontSize: '20px', fontWeight: 800,
              background: 'linear-gradient(to right, #fff, #c4b5fd, #67e8f9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>HackHunt</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav Links — only Home, About Us, Contact Us */}
        <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          <p style={{
            fontSize: '10px', color: '#475569', textTransform: 'uppercase',
            letterSpacing: '0.1em', fontWeight: 600, padding: '0 10px', marginBottom: '8px',
          }}>
            Navigation
          </p>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: '100%', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 12px', borderRadius: '12px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#cbd5e1', fontSize: '14px', fontWeight: 500,
                transition: 'all 0.15s', marginBottom: '2px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <span style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <item.icon size={15} color="#a78bfa" />
              </span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Drawer Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link
            to="/signup-user"
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'block', textAlign: 'center',
              padding: '12px', borderRadius: '12px',
              background: 'linear-gradient(to right, #7c3aed, #3b82f6)',
              color: '#fff', fontWeight: 600, fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}
          >
            Get Started →
          </Link>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '12px' }}>
            © 2026 HackHunt
          </p>
        </div>
      </div>
    </>
  );
};

export default Header;