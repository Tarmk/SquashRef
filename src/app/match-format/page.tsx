'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MatchFormatSelection() {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const router = useRouter();

  const handleMatchSelection = (matchType: string) => {
    setSelectedMatch(matchType);
  };

  const handleStartMatch = () => {
    if (selectedMatch) {
      router.push(`/players?format=${selectedMatch}`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Individual Match Format
          </h1>
          <p className="text-xl text-gray-600">
            Select your match format to get started
          </p>
        </div>

        {/* Match Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Best of 3 */}
          <div 
            onClick={() => handleMatchSelection('best-of-3')}
            className={`
              relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
              ${selectedMatch === 'best-of-3' 
                ? 'border-blue-500 bg-blue-50 shadow-xl' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
              }
            `}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-3">3</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Best of 3
              </h3>
              <p className="text-gray-600 mb-4">
                First to win 2 games wins the match
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              </div>
            </div>
            {selectedMatch === 'best-of-3' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Best of 5 */}
          <div 
            onClick={() => handleMatchSelection('best-of-5')}
            className={`
              relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
              ${selectedMatch === 'best-of-5' 
                ? 'border-green-500 bg-green-50 shadow-xl' 
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-lg'
              }
            `}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-3">5</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Best of 5
              </h3>
              <p className="text-gray-600 mb-4">
                First to win 3 games wins the match
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              </div>
            </div>
            {selectedMatch === 'best-of-5' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ← Back to Mode Selection
          </button>
          
          {selectedMatch && (
            <button 
              onClick={handleStartMatch}
              className={`
                flex-2 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105
                ${selectedMatch === 'best-of-3' 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-green-500 hover:bg-green-600'
                }
              `}
            >
              Continue to Player Names
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Professional squash matches are typically played as best of 5 games,
            while recreational matches often use best of 3 format.
          </p>
        </div>
      </div>
    </div>
  );
} 