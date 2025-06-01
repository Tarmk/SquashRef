'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ServePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const matchFormat = searchParams.get('format') || 'best-of-3';
  const player1 = searchParams.get('player1') || 'Player 1';
  const player2 = searchParams.get('player2') || 'Player 2';
  
  // Game state parameters (if continuing from a break)
  const gameNumber = searchParams.get('gameNumber') || '1';
  const player1Games = searchParams.get('player1Games') || '0';
  const player2Games = searchParams.get('player2Games') || '0';
  const player1Score = searchParams.get('player1Score') || '0';
  const player2Score = searchParams.get('player2Score') || '0';
  const lastServer = searchParams.get('lastServer');
  const lastServingSide = searchParams.get('lastServingSide') || 'left';
  
  const [servingPlayer, setServingPlayer] = useState<string | null>(lastServer || null);
  const [player1Side, setPlayer1Side] = useState<string | null>(null);

  const handleStartGame = () => {
    if (servingPlayer && player1Side) {
      const params = new URLSearchParams({
        format: matchFormat,
        player1: player1,
        player2: player2,
        player1Side: player1Side,
        server: servingPlayer,
        player1Score: player1Score,
        player2Score: player2Score,
        gameNumber: gameNumber,
        player1Games: player1Games,
        player2Games: player2Games,
        lastServingSide: lastServingSide
      });
      
      router.push(`/game?${params.toString()}`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = servingPlayer && player1Side;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Match Setup
          </h1>
          <p className="text-lg text-gray-600">
            {matchFormat === 'best-of-3' ? 'Best of 3' : 'Best of 5'} Match
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {player1} vs {player2}
          </p>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          
          {/* Who Serves First */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Who serves first?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setServingPlayer(player1)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-300 font-medium
                  ${servingPlayer === player1
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700'
                  }
                `}
              >
                {player1}
              </button>
              <button
                onClick={() => setServingPlayer(player2)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-300 font-medium
                  ${servingPlayer === player2
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300 text-gray-700'
                  }
                `}
              >
                {player2}
              </button>
            </div>
          </div>

          {/* Side Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Which side does {player1} play on?
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPlayer1Side('left')}
                className={`
                  p-6 rounded-lg border-2 transition-all duration-300 text-center
                  ${player1Side === 'left'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                <div className="font-semibold text-gray-900 mb-2">Left Side</div>
                <div className="text-sm text-gray-600">
                  {player1} plays left
                  <br />
                  {player2} plays right
                </div>
              </button>
              <button
                onClick={() => setPlayer1Side('right')}
                className={`
                  p-6 rounded-lg border-2 transition-all duration-300 text-center
                  ${player1Side === 'right'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                <div className="font-semibold text-gray-900 mb-2">Right Side</div>
                <div className="text-sm text-gray-600">
                  {player1} plays right
                  <br />
                  {player2} plays left
                </div>
              </button>
            </div>
          </div>

          {/* Summary */}
          {isFormValid && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Match Summary:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {servingPlayer} serves first</li>
                <li>• {player1} plays on the {player1Side} side</li>
                <li>• {player2} plays on the {player1Side === 'left' ? 'right' : 'left'} side</li>
              </ul>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleStartGame}
              disabled={!isFormValid}
              className={`
                flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300
                ${isFormValid
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Start Game
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            In squash, players switch sides after each game. The winner of each game serves first in the next game.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ServePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ServePageContent />
    </Suspense>
  );
} 