'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function ModeSelection() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const { currentUser, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();

  const handleModeSelection = (mode: string) => {
    setSelectedMode(mode);
  };

  const handleContinue = () => {
    if (selectedMode === 'individual') {
      router.push('/match-format');
    } else if (selectedMode === 'tournament') {
      router.push('/tournament');
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Squash Ref Support
          </h1>
          <p className="text-2xl text-gray-600 mb-4">
            Professional Squash Refereeing Made Easy
          </p>
          <p className="text-lg text-gray-500">
            {currentUser ? `Welcome back, ${currentUser.displayName || currentUser.email}` : 'Choose your mode to get started'}
          </p>
        </div>

        {/* Authentication Status */}
        {isFirebaseConfigured ? (
          currentUser ? (
            <div className="text-center mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-700">
                  ✅ Signed in - Your matches will be saved automatically
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  📊 View Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-700 mb-3">
                  ⚠️ Guest mode - Matches won&apos;t be saved
                </p>
                <div className="flex justify-center gap-4">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="text-center mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-700 mb-3">
                🔧 Firebase not configured - Running in guest mode only
              </p>
              <p className="text-blue-600 text-sm">
                To enable match saving, follow the setup guide in FIREBASE_SETUP.md
              </p>
            </div>
          </div>
        )}

        {/* Mode Selection Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Individual Game Mode */}
          <div 
            onClick={() => handleModeSelection('individual')}
            className={`
              relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
              ${selectedMode === 'individual' 
                ? 'border-blue-500 bg-blue-50 shadow-2xl' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl'
              }
            `}
          >
            <div className="text-center">
              <div className="text-6xl mb-6">🏸</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Individual Games
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Score individual squash matches with professional refereeing tools
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Real-time scoring and serving tracking
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Automatic handout detection
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Game break timers
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Printable game transcripts
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Best of 3 or Best of 5 formats
                </div>
                {currentUser && (
                  <div className="flex items-center text-gray-700">
                    <span className="text-blue-500 mr-3">✓</span>
                    Automatic match saving
                  </div>
                )}
              </div>
            </div>
            {selectedMode === 'individual' && (
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Tournament Mode */}
          <div 
            onClick={() => handleModeSelection('tournament')}
            className={`
              relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
              ${selectedMode === 'tournament' 
                ? 'border-purple-500 bg-purple-50 shadow-2xl' 
                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-xl'
              }
            `}
          >
            <div className="text-center">
              <div className="text-6xl mb-6">🏆</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Tournament Mode
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Manage complete tournaments with multiple players and matches
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center text-gray-700">
                  <span className="text-purple-500 mr-3">✓</span>
                  Multi-player tournament brackets
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-purple-500 mr-3">✓</span>
                  Round-robin and knockout formats
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-purple-500 mr-3">✓</span>
                  Automatic scheduling and progression
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-purple-500 mr-3">✓</span>
                  Tournament results and rankings
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-purple-500 mr-3">✓</span>
                  Complete tournament reports
                </div>
                {currentUser && (
                  <div className="flex items-center text-gray-700">
                    <span className="text-blue-500 mr-3">✓</span>
                    Tournament data persistence
                  </div>
                )}
              </div>
            </div>
            {selectedMode === 'tournament' && (
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        {selectedMode && (
          <div className="text-center">
            <button 
              onClick={handleContinue}
              className={`
                px-12 py-4 rounded-2xl font-bold text-xl text-white transition-all duration-300 transform hover:scale-105 shadow-lg
                ${selectedMode === 'individual' 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
                }
              `}
            >
              Continue with {selectedMode === 'individual' ? 'Individual Games' : 'Tournament Mode'}
            </button>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Professional Squash Refereeing Tools
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold text-gray-900 mb-2">Fast & Efficient</h4>
                <p className="text-gray-600">Quick scoring with minimal interruptions to game flow</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📋</div>
                <h4 className="font-semibold text-gray-900 mb-2">Complete Records</h4>
                <p className="text-gray-600">Detailed game transcripts and match documentation</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold text-gray-900 mb-2">Rule Compliant</h4>
                <p className="text-gray-600">Follows official squash rules and procedures</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
