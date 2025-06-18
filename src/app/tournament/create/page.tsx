'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateTournamentPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<'guided' | 'manual' | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handleGuidedSetup = () => {
    router.push('/tournament/create/type');
  };

  const handleManualSetup = () => {
    // For now, redirect to guided setup - manual setup can be implemented later
    router.push('/tournament/create/type');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🏆 Create Tournament
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Set up and manage your squash tournament
          </p>
          <p className="text-lg text-gray-500">
            Choose how you'd like to create your tournament
          </p>
        </div>

        {/* Setup Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Guided Setup */}
          <div 
            onClick={() => setSelectedPath('guided')}
            className={`
              relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
              ${selectedPath === 'guided' 
                ? 'border-blue-500 bg-blue-50 shadow-2xl' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl'
              }
            `}
          >
            <div className="text-center">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Guided Setup
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Step-by-step tournament creation with helpful guidance
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">✓</span>
                  Choose tournament type (Public/Private)
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">✓</span>
                  Select format (Round Robin/Monrad)
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">✓</span>
                  Manage players and registration
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">✓</span>
                  Automatic bracket generation
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">✓</span>
                  QR code for player registration
                </div>
              </div>
            </div>
            {selectedPath === 'guided' && (
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Manual Setup */}
          <div 
            onClick={() => setSelectedPath('manual')}
            className={`
              relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
              ${selectedPath === 'manual' 
                ? 'border-purple-500 bg-purple-50 shadow-2xl' 
                : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-xl'
              }
            `}
          >
            <div className="text-center">
              <div className="text-6xl mb-6">⚙️</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Manual Setup
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Advanced tournament creation with full customization
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center text-gray-500">
                  <span className="text-purple-500 mr-3">⏳</span>
                  Custom tournament rules
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="text-purple-500 mr-3">⏳</span>
                  Advanced bracket management
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="text-purple-500 mr-3">⏳</span>
                  Seeding and handicap systems
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="text-purple-500 mr-3">⏳</span>
                  Custom scoring formats
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="text-purple-500 mr-3">⏳</span>
                  Multi-division tournaments
                </div>
              </div>
            </div>
            {selectedPath === 'manual' && (
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

        {/* Action Buttons */}
        {selectedPath && (
          <div className="text-center mb-8">
            <button
              onClick={selectedPath === 'guided' ? handleGuidedSetup : handleManualSetup}
              className={`
                px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg
                ${selectedPath === 'guided' 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
                }
              `}
            >
              {selectedPath === 'guided' ? 'Start Guided Setup' : 'Start Manual Setup'}
            </button>
          </div>
        )}

        {/* Manual Setup Notice */}
        {selectedPath === 'manual' && (
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-xl p-6 mb-8">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-purple-800 mb-2">
                🚧 Manual Setup Coming Soon
              </h4>
              <p className="text-purple-700">
                Advanced manual setup features are currently in development. For now, you'll be guided through our standard setup process.
              </p>
            </div>
          </div>
        )}

        {/* Authentication Notice */}
        {!currentUser && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">
                📝 Authentication Recommended
              </h4>
              <p className="text-yellow-700">
                Sign in to save your tournament data and access advanced features. You can still create tournaments without signing in, but they won't be saved.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="text-center">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Tournament creation includes bracket generation, match scheduling, and result tracking.
          </p>
          <div className="flex justify-center space-x-8 text-xs text-gray-400">
            <span>🏆 Multiple Formats</span>
            <span>📱 Mobile Friendly</span>
            <span>⚡ Real-time Updates</span>
            <span>📊 Automatic Standings</span>
          </div>
        </div>
      </div>
    </div>
  );
} 