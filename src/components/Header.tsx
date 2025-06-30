'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  title?: string;
}

export default function Header({ showBackButton = false, backUrl = '/dashboard', title }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'New Match', href: '/match-format', icon: '🆕' },
    { name: 'Tournaments', href: '/tournament', icon: '🏆' },
  ];

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Back Button (if needed) */}
            {showBackButton && (
              <Link
                href={backUrl}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
                title="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}

            {/* Logo and Brand */}
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="text-2xl group-hover:scale-110 transition-transform">🏸</div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  SquashRef
                </span>
                <span className="text-xs text-gray-500 -mt-1">Professional Referee Support</span>
              </div>
            </Link>

            {/* Page Title (if provided) */}
            {title && (
              <div className="hidden md:flex items-center">
                <div className="w-px h-6 bg-gray-300 mx-4"></div>
                <h1 className="text-lg font-semibold text-gray-700">{title}</h1>
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActivePath(item.href)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side - User Menu and Mobile Toggle */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <Link
                href="/match-format"
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>⚡</span>
                <span>Quick Match</span>
              </Link>
              <Link
                href="/tournament/create"
                className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>🏆</span>
                <span>New Tournament</span>
              </Link>
            </div>

            {/* Notifications (placeholder) */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5-5 5h5zm0 0v1a3 3 0 01-6 0v-1m6-12V9a3 3 0 01-6 0V9" />
              </svg>
              {/* Notification badge (when there are notifications) */}
              {/* <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span> */}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900 hidden sm:block">
                    {currentUser?.displayName || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 hidden sm:block">
                    {currentUser?.email}
                  </span>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
                </div>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser?.displayName || 'User Account'}
                    </p>
                    <p className="text-sm text-gray-500">{currentUser?.email}</p>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span className="mr-3">🏠</span>
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span className="mr-3">👤</span>
                      Profile Settings
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span className="mr-3">⚙️</span>
                      Preferences
                    </Link>
                  </div>

                  <div className="border-t border-gray-200 py-2">
                    <Link
                      href="/help"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <span className="mr-3">❓</span>
                      Help & Support
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <span className="mr-3">🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors
                    ${isActivePath(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Quick Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <Link
                href="/match-format"
                className="flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-2">⚡</span>
                Start Quick Match
              </Link>
              <Link
                href="/tournament/create"
                className="flex items-center justify-center px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-2">🏆</span>
                Create Tournament
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </header>
  );
} 