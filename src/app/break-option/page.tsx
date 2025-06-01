'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function BreakOptionPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchFormat = searchParams.get('format') || 'best-of-3';
  const player1 = searchParams.get('player1') || 'Player 1';
  const player2 = searchParams.get('player2') || 'Player 2';
  
  // Game state parameters (if continuing from a game)
  const gameNumber = searchParams.get('gameNumber') || '1';
  const player1Games = searchParams.get('player1Games') || '0';
  const player2Games = searchParams.get('player2Games') || '0';
  const player1Score = searchParams.get('player1Score') || '0';
  const player2Score = searchParams.get('player2Score') || '0';
  const lastServer = searchParams.get('lastServer') || player1;
  const lastServingSide = searchParams.get('lastServingSide') || 'left';
  
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute in seconds
  const [isBreakComplete, setIsBreakComplete] = useState(false);

  useEffect(() => {
    if (isBreakActive && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isBreakActive && timeRemaining === 0) {
      setIsBreakComplete(true);
    }
  }, [isBreakActive, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((60 - timeRemaining) / 60) * 100;
  };

  const handleTakeBreak = () => {
    setIsBreakActive(true);
  };

  const handleSkipBreak = () => {
    proceedToServe();
  };

  const handleSkipRemainingBreak = () => {
    setIsBreakComplete(true);
  };

  const proceedToServe = () => {
    router.push(`/serve?format=${matchFormat}&player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}&gameNumber=${gameNumber}&player1Games=${player1Games}&player2Games=${player2Games}&player1Score=${player1Score}&player2Score=${player2Score}&lastServer=${encodeURIComponent(lastServer)}&lastServingSide=${encodeURIComponent(lastServingSide)}`);
  };

  const handleContinueAfterBreak = () => {
    proceedToServe();
  };

  if (isBreakActive && !isBreakComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ⏱️ Break Time
            </h1>
            <p className="text-lg text-gray-600">
              {player1} vs {player2}
            </p>
          </div>

          {/* Timer Display */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {formatTime(timeRemaining)}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>

              <p className="text-gray-600">1-minute break in progress</p>
            </div>

            {/* Skip Button */}
            <button
              onClick={handleSkipRemainingBreak}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Skip Remaining Break
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isBreakComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ✅ Break Complete
            </h1>
            <p className="text-lg text-gray-600">
              {player1} vs {player2}
            </p>
          </div>

          {/* Completion Display */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="text-4xl mb-4">🏃‍♂️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Ready to Start
              </h3>
              <p className="text-gray-600">
                Proceeding to serve selection
              </p>
            </div>

            <button
              onClick={handleContinueAfterBreak}
              className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Continue to Serve Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Break Option
          </h1>
          <p className="text-lg text-gray-600">
            {player1} vs {player2}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Choose whether to take a 1-minute break
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          {/* Take Break Option */}
          <div 
            onClick={handleTakeBreak}
            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-transparent hover:border-blue-300"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">⏰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Take 1-Minute Break
              </h3>
              <p className="text-gray-600 mb-4">
                Official 1-minute break before match starts
              </p>
              <div className="flex justify-center">
                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                  Recommended
                </div>
              </div>
            </div>
          </div>

          {/* Skip Break Option */}
          <div 
            onClick={handleSkipBreak}
            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-transparent hover:border-green-300"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">▶️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Skip Break
              </h3>
              <p className="text-gray-600 mb-4">
                Proceed directly to serve selection
              </p>
              <div className="flex justify-center">
                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                  Quick Start
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Break Information</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Official rules allow for a 1-minute break</p>
            <p>• Use this time for final preparation</p>
            <p>• Break is optional and can be skipped</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BreakOptionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BreakOptionPageContent />
    </Suspense>
  );
} 