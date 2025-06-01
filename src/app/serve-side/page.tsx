'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ServeSidePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get all the game state from URL parameters
  const matchFormat = searchParams.get('format') || 'best-of-3';
  const player1 = searchParams.get('player1') || 'Player 1';
  const player2 = searchParams.get('player2') || 'Player 2';
  const player1Side = searchParams.get('player1Side') || 'left';
  const currentServer = searchParams.get('currentServer') || player1;
  const lastServingSide = searchParams.get('lastServingSide') || 'left';
  const scoringPlayer = searchParams.get('scoringPlayer') || player1;
  const isHandout = searchParams.get('isHandout') === 'true';
  
  // Current scores
  const player1Score = parseInt(searchParams.get('player1Score') || '0');
  const player2Score = parseInt(searchParams.get('player2Score') || '0');
  const gameNumber = parseInt(searchParams.get('gameNumber') || '1');
  const player1Games = parseInt(searchParams.get('player1Games') || '0');
  const player2Games = parseInt(searchParams.get('player2Games') || '0');

  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [autoRedirect, setAutoRedirect] = useState(false);

  // Calculate new scores
  const newPlayer1Score = scoringPlayer === player1 ? player1Score + 1 : player1Score;
  const newPlayer2Score = scoringPlayer === player2 ? player2Score + 1 : player2Score;
  
  // Determine new server
  const newServer = isHandout ? scoringPlayer : currentServer;
  
  // Determine serving side automatically for handouts or manual selection for continued serves
  useEffect(() => {
    if (isHandout) {
      // On handout, new server can choose their side (let's default to left for simplicity)
      setSelectedSide('left');
      setAutoRedirect(true);
    } else {
      // Same server continues but from opposite side
      const oppositeSide = lastServingSide === 'left' ? 'right' : 'left';
      setSelectedSide(oppositeSide);
      setAutoRedirect(true);
    }
  }, [isHandout, lastServingSide]);

  // Auto redirect after 2 seconds if automatic selection
  useEffect(() => {
    if (autoRedirect && selectedSide) {
      const timer = setTimeout(() => {
        handleContinueGame();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoRedirect, selectedSide]);

  const handleContinueGame = () => {
    if (!selectedSide) return;

    // Check if game is won
    const gameWon = (newPlayer1Score >= 11 && newPlayer1Score - newPlayer2Score >= 2) || 
                   (newPlayer2Score >= 11 && newPlayer2Score - newPlayer1Score >= 2) ||
                   newPlayer1Score >= 15 || newPlayer2Score >= 15;

    if (gameWon) {
      // Handle game completion - this would need another page
      alert(`Game ${gameNumber} won by ${newPlayer1Score > newPlayer2Score ? player1 : player2}!`);
      return;
    }

    // Continue with current game
    const params = new URLSearchParams({
      format: matchFormat,
      player1: player1,
      player2: player2,
      player1Side: player1Side,
      server: newServer,
      player1Score: newPlayer1Score.toString(),
      player2Score: newPlayer2Score.toString(),
      gameNumber: gameNumber.toString(),
      player1Games: player1Games.toString(),
      player2Games: player2Games.toString(),
      lastServingSide: selectedSide
    });

    router.push(`/game?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Point Scored!
          </h1>
          <p className="text-xl text-green-600 font-semibold mb-2">
            {scoringPlayer} scores!
          </p>
          <p className="text-lg text-gray-600">
            {newPlayer1Score} - {newPlayer2Score}
          </p>
        </div>

        {/* Serving Information */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {isHandout ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Handout!</h3>
              <p className="text-gray-600 mb-4">
                {newServer} is now serving
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  {newServer} will serve from the <strong>{selectedSide}</strong> side
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Continue Serving</h3>
              <p className="text-gray-600 mb-4">
                {newServer} continues serving
              </p>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  {newServer} will serve from the <strong>{selectedSide}</strong> side
                  <br />
                  <span className="text-xs">(opposite from last serve)</span>
                </p>
              </div>
            </div>
          )}

          {/* Manual side selection for handouts (if we want to implement this) */}
          {isHandout && !autoRedirect && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Choose serving side:</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedSide('left')}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-300 font-medium
                    ${selectedSide === 'left'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }
                  `}
                >
                  Left Side
                </button>
                <button
                  onClick={() => setSelectedSide('right')}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-300 font-medium
                    ${selectedSide === 'right'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 text-gray-700'
                    }
                  `}
                >
                  Right Side
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Continue Button or Auto-redirect message */}
        {autoRedirect ? (
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                Automatically continuing in 2 seconds...
              </p>
            </div>
            <button
              onClick={handleContinueGame}
              className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Continue Now
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={handleContinueGame}
              disabled={!selectedSide}
              className={`
                w-full px-6 py-3 rounded-lg font-medium transition-all duration-300
                ${selectedSide
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Continue Game
            </button>
          </div>
        )}

        {/* Rules Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {isHandout 
              ? 'On handout, the new server can choose their serving side'
              : 'When continuing to serve, alternate between left and right service boxes'
            }
          </p>
        </div>
      </div>
    </div>
  );
} 