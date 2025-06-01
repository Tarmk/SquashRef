'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function WarmupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchFormat = searchParams.get('format') || 'best-of-3';
  const player1 = searchParams.get('player1') || 'Player 1';
  const player2 = searchParams.get('player2') || 'Player 2';
  
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [switchSideAnnounced, setSwitchSideAnnounced] = useState(false);
  const [sidesSwitched, setSidesSwitched] = useState(false);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      // Automatically switch sides at 2:30 (150 seconds remaining)
      if (timeRemaining === 150 && !sidesSwitched) {
        setSwitchSideAnnounced(true);
        setSidesSwitched(true);
      }

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      // Automatically go to break option when timer reaches 0
      router.push(`/break-option?format=${matchFormat}&player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`);
    }
  }, [timeRemaining, sidesSwitched, router, matchFormat, player1, player2]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((300 - timeRemaining) / 300) * 100;
  };

  const handleContinue = () => {
    router.push(`/break-option?format=${matchFormat}&player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`);
  };

  const handleSkip = () => {
    router.push(`/break-option?format=${matchFormat}&player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`);
  };

  const handleSwitchSides = () => {
    setSidesSwitched(true);
    if (!switchSideAnnounced) {
      setSwitchSideAnnounced(true);
    }
    // Jump timer to 2:30 when manually switching sides
    if (timeRemaining > 150) {
      setTimeRemaining(150);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏃‍♂️ Warm-up Time
          </h1>
          <p className="text-lg text-gray-600">
            {player1} vs {player2}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {matchFormat === 'best-of-3' ? 'Best of 3' : 'Best of 5'} Match
          </p>
        </div>

        {/* Timer Display */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Timer */}
          <div className="mb-6">
            <div className="text-6xl font-bold text-green-600 mb-4">
              {formatTime(timeRemaining)}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>

            {/* Sides Switched Confirmation */}
            {sidesSwitched && timeRemaining > 0 && (
              <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                <div className="text-xl font-bold text-green-800 mb-2">
                  ✅ Sides Switched
                </div>
                <p className="text-green-700">
                  Continue warming up on new sides
                </p>
              </div>
            )}

            {/* Current Phase */}
            <p className="text-gray-600">
              {timeRemaining > 150 ? 'First Half - Warm-up Phase' : 
               'Second Half - Continue Warming Up'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Manual Switch Sides Button - only before 2:30 */}
            {timeRemaining > 150 && !sidesSwitched && (
              <button
                onClick={handleSwitchSides}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                🔄 Switch Sides Now
              </button>
            )}

            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Skip Warm-up
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Warm-up Instructions</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Use this time to warm up and practice shots</p>
              <p>• {sidesSwitched ? '✅ Sides have been switched' : '• Switch sides at the 2.5 minute mark'}</p>
              <p>• No official scoring during warm-up</p>
              <p>• Referee can manually control side switching</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 