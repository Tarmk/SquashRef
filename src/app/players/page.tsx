'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PlayersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchFormat = searchParams.get('format') || 'best-of-3';
  
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');

  const handleStartMatch = () => {
    if (player1Name.trim() && player2Name.trim()) {
      router.push(`/warmup?format=${matchFormat}&player1=${encodeURIComponent(player1Name.trim())}&player2=${encodeURIComponent(player2Name.trim())}`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = player1Name.trim() && player2Name.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Player Names
          </h1>
          <p className="text-lg text-gray-600">
            {matchFormat === 'best-of-3' ? 'Best of 3' : 'Best of 5'} Match
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Player 1 Input */}
            <div>
              <label htmlFor="player1" className="block text-sm font-medium text-gray-700 mb-2">
                Player 1 Name
              </label>
              <input
                type="text"
                id="player1"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                placeholder="Enter player 1 name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* VS Divider */}
            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-gray-100 rounded-full text-gray-600 font-semibold">
                VS
              </span>
            </div>

            {/* Player 2 Input */}
            <div>
              <label htmlFor="player2" className="block text-sm font-medium text-gray-700 mb-2">
                Player 2 Name
              </label>
              <input
                type="text"
                id="player2"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                placeholder="Enter player 2 name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleStartMatch}
              disabled={!isFormValid}
              className={`
                flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300
                ${isFormValid
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Start Match
            </button>
          </div>
        </div>

        {/* Match Format Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {matchFormat === 'best-of-3' 
              ? 'First player to win 2 games wins the match'
              : 'First player to win 3 games wins the match'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayersPageContent />
    </Suspense>
  );
} 