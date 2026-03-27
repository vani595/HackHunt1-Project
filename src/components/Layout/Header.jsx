import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Rocket, User, Settings2, ShieldCheck, UserPlus, Hammer } from 'lucide-react';
import NavbarDropdownButton from '../NavbarDropdownButton';

const Header = () => {
  const { pathname } = useLocation();
  const isHomePage = pathname === '/';

  // prepare menu items for login and signup
  const loginItems = [
    {
      href: '/login-user',
      icon: <User className="h-5 w-5 text-purple-600" />, // user icon
      iconBg: 'bg-purple-100',
      title: 'Login as User',
      description: 'Explore and join hackathons',
    },
    {
      href: '/login-organizer',
      icon: <Settings2 className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
      title: 'Login as Organizer',
      description: 'Manage your hackathons',
    },
    {
      href: '/login-admin',
      icon: <ShieldCheck className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
      title: 'Login as Admin',
      description: 'System administration',
    },
  ];

  const signupItems = [
    {
      href: '/signup-user',
      icon: <UserPlus className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
      title: 'Sign up as User',
      description: 'Explore and join hackathons',
    },
    {
      href: '/signup-organizer',
      icon: <Hammer className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
      title: 'Sign up as Organizer',
      description: 'Organize hackathons',
    },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
        isHomePage
          ? 'border-white/8 bg-[#0d0a18]/85 shadow-[0_18px_45px_rgba(3,7,18,0.45)]'
          : 'border-white/60 bg-white/75 shadow-[0_12px_40px_rgba(15,23,42,0.08)]'
      }`}
    >
      <div className="mx-auto max-w-screen-xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Left side - Logo and text */}
          <div className="flex items-center">
            <Link to="/" className="group flex items-center space-x-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 transition duration-300 group-hover:scale-110">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <div>
                <span className={`text-4xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent ${
                  isHomePage
                    ? 'from-white via-violet-100 to-cyan-200'
                    : 'from-violet-600 via-purple-600 to-blue-600'
                }`}>
                  HackHunt
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-10 lg:flex">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <NavbarDropdownButton label="Login" items={loginItems} variant={isHomePage ? 'ghost-dark' : 'filled'} />
              <NavbarDropdownButton label="Sign up" items={signupItems} variant="filled" />
            </div>
          </nav>

          <nav className="flex items-center space-x-3 lg:hidden">
            <NavbarDropdownButton label="Login" items={loginItems} variant={isHomePage ? 'ghost-dark' : 'filled'} />
            <NavbarDropdownButton label="Sign up" items={signupItems} variant="filled" />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
