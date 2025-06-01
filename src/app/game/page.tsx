'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMatchPersistence } from '../../../hooks/useMatchPersistence';

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const matchFormat = searchParams.get('format') || 'best-of-3';
  const player1 = searchParams.get('player1') || 'Player 1';
  const player2 = searchParams.get('player2') || 'Player 2';
  const initialServer = searchParams.get('server') || player1;
  const player1Side = searchParams.get('player1Side') || 'left';
  
  // Game state - read from URL parameters
  const [currentServer, setCurrentServer] = useState(searchParams.get('server') || initialServer);
  const [lastServingSide, setLastServingSide] = useState<'left' | 'right'>(
    (searchParams.get('lastServingSide') as 'left' | 'right') || 'left'
  );
  const [player1Score, setPlayer1Score] = useState(parseInt(searchParams.get('player1Score') || '0'));
  const [player2Score, setPlayer2Score] = useState(parseInt(searchParams.get('player2Score') || '0'));
  const [gameNumber, setGameNumber] = useState(parseInt(searchParams.get('gameNumber') || '1'));
  const [player1Games, setPlayer1Games] = useState(parseInt(searchParams.get('player1Games') || '0'));
  const [player2Games, setPlayer2Games] = useState(parseInt(searchParams.get('player2Games') || '0'));
  
  // Timing tracking
  const [matchStartTime] = useState<Date>(new Date());
  const [gameStartTime, setGameStartTime] = useState<Date>(new Date());
  const [currentGameDuration, setCurrentGameDuration] = useState<number>(0);
  
  // Toast notification for scoring feedback
  const [toast, setToast] = useState<{ message: string; type: 'score' | 'handout' } | null>(null);
  
  // Side selection after handout
  const [awaitingSideSelection, setAwaitingSideSelection] = useState(false);
  const [pendingServer, setPendingServer] = useState<string | null>(null);
  
  // Break timer between games
  const [showBreakTimer, setShowBreakTimer] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(60); // 60 seconds = 1 minute
  const [timerRunning, setTimerRunning] = useState(false);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  
  // Side selection for new game start
  const [awaitingGameStartSideSelection, setAwaitingGameStartSideSelection] = useState(false);
  
  // Match completion state
  const [matchComplete, setMatchComplete] = useState(false);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  
  // Flag to prevent duplicate game processing
  const [gameProcessed, setGameProcessed] = useState(false);
  
  // Flag to track when we're progressing between games (to prevent URL sync interference)
  const [gameProgressing, setGameProgressing] = useState(false);
  
  // Game history tracking for transcripts with timing
  const [gameHistory, setGameHistory] = useState<Array<{
    gameNumber: number;
    points: Array<{
      scorer: string;
      score: string;
      isHandout: boolean;
      servingSide: 'left' | 'right';
      server: string;
    }>;
    winner: string;
    finalScore: string;
    duration: number; // Game duration in seconds
    startTime: Date;
    endTime: Date;
  }>>([]);
  
  const [currentGamePoints, setCurrentGamePoints] = useState<Array<{
    scorer: string;
    score: string;
    isHandout: boolean;
    servingSide: 'left' | 'right';
    server: string;
  }>>([]);

  const requiredGames = matchFormat === 'best-of-3' ? 2 : 3;
  const gameToPoints = 11; // Standard squash game to 11 points

  // Helper function to get total match duration
  const getTotalMatchDuration = (): number => {
    const now = new Date();
    return Math.floor((now.getTime() - matchStartTime.getTime()) / 1000);
  };

  // Firestore integration for match persistence
  const { matchId, isUserLoggedIn } = useMatchPersistence({
    player1,
    player2,
    matchFormat,
    gameHistory,
    currentGameState: {
      gameNumber,
      player1Score,
      player2Score,
      player1Games,
      player2Games,
      currentServer,
      lastServingSide,
      currentGamePoints,
    },
    isComplete: matchComplete,
    matchWinner: matchWinner || undefined,
    totalDuration: getTotalMatchDuration(),
    matchStartTime,
  });

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerRunning && breakTimeRemaining > 0) {
      interval = setInterval(() => {
        setBreakTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, breakTimeRemaining]);

  // Update current game duration every second
  useEffect(() => {
    // Don't update timer if match is complete
    if (matchComplete) return;

    const interval = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - gameStartTime.getTime()) / 1000);
      setCurrentGameDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStartTime, matchComplete]);

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayerScore = (scoringPlayer: string) => {
    const isHandout = scoringPlayer !== currentServer;
    
    // Show toast notification
    setToast({
      message: isHandout ? `${scoringPlayer} scores! Handout!` : `${scoringPlayer} scores!`,
      type: isHandout ? 'handout' : 'score'
    });
    
    // Clear toast after 2 seconds
    setTimeout(() => setToast(null), 2000);
    
    // Update scores
    const newPlayer1Score = scoringPlayer === player1 ? player1Score + 1 : player1Score;
    const newPlayer2Score = scoringPlayer === player2 ? player2Score + 1 : player2Score;
    
    if (scoringPlayer === player1) {
      setPlayer1Score(newPlayer1Score);
    } else {
      setPlayer2Score(newPlayer2Score);
    }
    
    // Track this point in game history
    const pointRecord = {
      scorer: scoringPlayer,
      score: `${newPlayer1Score}-${newPlayer2Score}`,
      isHandout: isHandout,
      servingSide: lastServingSide,
      server: currentServer
    };
    const updatedPoints = [...currentGamePoints, pointRecord];
    setCurrentGamePoints(updatedPoints);
    
    // Handle serving logic
    if (isHandout) {
      // Handout: wait for referee to select serving side
      setPendingServer(scoringPlayer);
      setAwaitingSideSelection(true);
    } else {
      // Same server continues: alternate serving side
      setLastServingSide(lastServingSide === 'left' ? 'right' : 'left');
    }
    
    // Check for game win (but don't process if waiting for side selection)
    const gameWon = (newPlayer1Score >= 11 && newPlayer1Score - newPlayer2Score >= 2) || 
                   (newPlayer2Score >= 11 && newPlayer2Score - newPlayer1Score >= 2) ||
                   newPlayer1Score >= 15 || newPlayer2Score >= 15;
    
    if (gameWon && !isHandout) {
      // Only process game win immediately if it's not a handout
      processGameWin(newPlayer1Score, newPlayer2Score, updatedPoints);
    }
  };

  const handleSideSelection = (selectedSide: 'left' | 'right') => {
    if (pendingServer) {
      setCurrentServer(pendingServer);
      setLastServingSide(selectedSide);
      setAwaitingSideSelection(false);
      setPendingServer(null);
      
      // Check if this was a game-winning point that we need to process
      const gameWon = (player1Score >= 11 && player1Score - player2Score >= 2) || 
                     (player2Score >= 11 && player2Score - player1Score >= 2) ||
                     player1Score >= 15 || player2Score >= 15;
      
      if (gameWon) {
        processGameWin(player1Score, player2Score, currentGamePoints);
      }
    }
  };

  const processGameWin = (newPlayer1Score: number, newPlayer2Score: number, finalGamePoints: Array<{
    scorer: string;
    score: string;
    isHandout: boolean;
    servingSide: 'left' | 'right';
    server: string;
  }>) => {
    // Prevent duplicate processing of the same game
    if (gameProcessed) return;
    setGameProcessed(true);
    
    const winner = newPlayer1Score > newPlayer2Score ? player1 : player2;
    
    // Save completed game to history with the final points array
    const completedGame = {
      gameNumber: gameNumber,
      points: finalGamePoints,
      winner: winner,
      finalScore: `${newPlayer1Score}-${newPlayer2Score}`,
      duration: currentGameDuration,
      startTime: gameStartTime,
      endTime: new Date()
    };
    setGameHistory(prev => [...prev, completedGame]);
    setCurrentGamePoints([]); // Reset for next game
    
    // Calculate new game counts BEFORE setting state
    const newPlayer1Games = winner === player1 ? player1Games + 1 : player1Games;
    const newPlayer2Games = winner === player2 ? player2Games + 1 : player2Games;
    
    // Update games won using the calculated values
    setPlayer1Games(newPlayer1Games);
    setPlayer2Games(newPlayer2Games);
    
    // Check if match is won using the calculated values
    const matchWon = newPlayer1Games >= requiredGames || newPlayer2Games >= requiredGames;
    
    // Debug logging to track the issue
    console.log('Game Win Debug:', {
      winner,
      gameNumber,
      finalScore: `${newPlayer1Score}-${newPlayer2Score}`,
      pointsRecorded: finalGamePoints.length,
      lastPointScore: finalGamePoints[finalGamePoints.length - 1]?.score,
      oldPlayer1Games: player1Games,
      oldPlayer2Games: player2Games,
      newPlayer1Games,
      newPlayer2Games,
      requiredGames,
      matchWon,
      matchFormat
    });
    
    if (matchWon) {
      // Show match completion screen
      setMatchComplete(true);
      setMatchWinner(winner);
    } else {
      // Show break timer for next game
      setGameWinner(winner);
      setShowBreakTimer(true);
      setBreakTimeRemaining(60); // Reset to 1 minute
      setTimerRunning(false);
    }
  };

  const handleStartBreak = () => {
    setTimerRunning(true);
  };

  const handleStopBreak = () => {
    setTimerRunning(false);
  };

  const handleSkipBreak = () => {
    startNextGame();
  };

  const startNextGame = () => {
    if (gameWinner) {
      setGameProgressing(true); // Prevent URL sync during game progression
      setPlayer1Score(0);
      setPlayer2Score(0);
      setGameNumber(gameNumber + 1);
      setCurrentServer(gameWinner); // Winner of previous game serves first
      setShowBreakTimer(false);
      setGameProcessed(false); // Reset for next game
      
      // Reset game timer for new game
      setGameStartTime(new Date());
      setCurrentGameDuration(0);
      
      // Show side selection for new game start
      setAwaitingGameStartSideSelection(true);
    }
  };

  const handleGameStartSideSelection = (selectedSide: 'left' | 'right') => {
    setLastServingSide(selectedSide);
    setAwaitingGameStartSideSelection(false);
    setGameWinner(null);
    setGameProgressing(false); // Game progression complete, allow normal operation
  };

  const handleFoulCall = () => {
    // Navigate to foul selection page (to be implemented)
    alert('Foul calling functionality - to be implemented');
  };

  const printGameTranscript = () => {
    const lastGame = gameHistory[gameHistory.length - 1];
    if (!lastGame) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Game ${lastGame.gameNumber} Transcript</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6; 
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .match-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            .game-summary { 
              background: #f5f5f5; 
              padding: 15px; 
              border-radius: 8px; 
              margin-bottom: 20px; 
            }
            .points-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
            }
            .points-table th, .points-table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: center; 
            }
            .points-table th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
            }
            .handout { 
              background-color: #fff3cd; 
            }
            .winner { 
              background-color: #d4edda; 
            }
            @media print { 
              body { margin: 0; } 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Squash Match Transcript</h1>
            <h2>Game ${lastGame.gameNumber}</h2>
          </div>
          
          <div class="match-info">
            <div><strong>Match Format:</strong> ${matchFormat === 'best-of-3' ? 'Best of 3' : 'Best of 5'}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="game-summary">
            <h3>Game Summary</h3>
            <p><strong>Players:</strong> ${player1} vs ${player2}</p>
            <p><strong>Winner:</strong> ${lastGame.winner}</p>
            <p><strong>Final Score:</strong> ${lastGame.finalScore}</p>
            <p><strong>Game Duration:</strong> ${formatDuration(lastGame.duration)}</p>
            <p><strong>Start Time:</strong> ${lastGame.startTime.toLocaleTimeString()}</p>
            <p><strong>End Time:</strong> ${lastGame.endTime.toLocaleTimeString()}</p>
            <p><strong>Total Points:</strong> ${lastGame.points.length}</p>
          </div>
          
          <h3>Point-by-Point Breakdown</h3>
          <table class="points-table">
            <thead>
              <tr>
                <th>Point #</th>
                <th>Scorer</th>
                <th>Score</th>
                <th>Server</th>
                <th>Serving Side</th>
                <th>Handout</th>
              </tr>
            </thead>
            <tbody>
              ${lastGame.points.map((point, index) => `
                <tr class="${point.isHandout ? 'handout' : ''}">
                  <td>${index + 1}</td>
                  <td><strong>${point.scorer}</strong></td>
                  <td>${point.score}</td>
                  <td>${point.server}</td>
                  <td>${point.servingSide}</td>
                  <td>${point.isHandout ? '✓' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            Generated by Squash Ref Support App
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const printSpecificGameTranscript = (game: {
    gameNumber: number;
    points: Array<{
      scorer: string;
      score: string;
      isHandout: boolean;
      servingSide: 'left' | 'right';
      server: string;
    }>;
    winner: string;
    finalScore: string;
    duration: number;
    startTime: Date;
    endTime: Date;
  }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Game ${game.gameNumber} Transcript</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6; 
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .match-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            .game-summary { 
              background: #f5f5f5; 
              padding: 15px; 
              border-radius: 8px; 
              margin-bottom: 20px; 
            }
            .points-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
            }
            .points-table th, .points-table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: center; 
            }
            .points-table th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
            }
            .handout { 
              background-color: #fff3cd; 
            }
            @media print { 
              body { margin: 0; } 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Squash Match Transcript</h1>
            <h2>Game ${game.gameNumber}</h2>
          </div>
          
          <div class="match-info">
            <div><strong>Match Format:</strong> ${matchFormat === 'best-of-3' ? 'Best of 3' : 'Best of 5'}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="game-summary">
            <h3>Game Summary</h3>
            <p><strong>Players:</strong> ${player1} vs ${player2}</p>
            <p><strong>Winner:</strong> ${game.winner}</p>
            <p><strong>Final Score:</strong> ${game.finalScore}</p>
            <p><strong>Game Duration:</strong> ${formatDuration(game.duration)}</p>
            <p><strong>Start Time:</strong> ${game.startTime.toLocaleTimeString()}</p>
            <p><strong>End Time:</strong> ${game.endTime.toLocaleTimeString()}</p>
            <p><strong>Total Points:</strong> ${game.points.length}</p>
          </div>
          
          <h3>Point-by-Point Breakdown</h3>
          <table class="points-table">
            <thead>
              <tr>
                <th>Point #</th>
                <th>Scorer</th>
                <th>Score</th>
                <th>Server</th>
                <th>Serving Side</th>
                <th>Handout</th>
              </tr>
            </thead>
            <tbody>
              ${game.points.map((point, index) => `
                <tr class="${point.isHandout ? 'handout' : ''}">
                  <td>${index + 1}</td>
                  <td><strong>${point.scorer}</strong></td>
                  <td>${point.score}</td>
                  <td>${point.server}</td>
                  <td>${point.servingSide}</td>
                  <td>${point.isHandout ? '✓' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            Generated by Squash Ref Support App
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const printMatchTranscript = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Complete Match Transcript</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6; 
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .match-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 20px; 
            }
            .match-summary { 
              background: #e8f5e8; 
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 30px; 
              border-left: 5px solid #28a745; 
            }
            .game-section { 
              margin-bottom: 40px; 
              page-break-inside: avoid; 
            }
            .game-header { 
              background: #f8f9fa; 
              padding: 10px; 
              border-radius: 5px; 
              margin-bottom: 15px; 
              border-left: 3px solid #007bff; 
            }
            .points-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px; 
              font-size: 12px; 
            }
            .points-table th, .points-table td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: center; 
            }
            .points-table th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
            }
            .handout { 
              background-color: #fff3cd; 
            }
            @media print { 
              body { margin: 0; } 
              .game-section { page-break-inside: avoid; } 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Complete Squash Match Transcript</h1>
            <h2>${player1} vs ${player2}</h2>
          </div>
          
          <div class="match-info">
            <div><strong>Match Format:</strong> ${matchFormat === 'best-of-3' ? 'Best of 3' : 'Best of 5'}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="match-summary">
            <h3>Match Result</h3>
            <p><strong>Winner:</strong> ${matchWinner}</p>
            <p><strong>Final Score:</strong> ${player1} ${player1Games} - ${player2Games} ${player2}</p>
            <p><strong>Match Duration:</strong> ${formatDuration(getTotalMatchDuration())}</p>
            <p><strong>Match Start:</strong> ${matchStartTime.toLocaleTimeString()}</p>
            <p><strong>Games Played:</strong> ${gameHistory.length}</p>
            <p><strong>Total Points:</strong> ${gameHistory.reduce((total, game) => total + game.points.length, 0)}</p>
            <div style="margin-top: 15px;">
              <strong>Game Durations:</strong>
              <ul style="margin: 5px 0 0 20px; padding: 0;">
                ${gameHistory.map(game => `
                  <li>Game ${game.gameNumber}: ${formatDuration(game.duration)} (${game.startTime.toLocaleTimeString()} - ${game.endTime.toLocaleTimeString()})</li>
                `).join('')}
              </ul>
            </div>
          </div>
          
          ${gameHistory.map(game => `
            <div class="game-section">
              <div class="game-header">
                <h3>Game ${game.gameNumber} - Winner: ${game.winner} (${game.finalScore}) - Duration: ${formatDuration(game.duration)}</h3>
              </div>
              
              <table class="points-table">
                <thead>
                  <tr>
                    <th>Point #</th>
                    <th>Scorer</th>
                    <th>Score</th>
                    <th>Server</th>
                    <th>Side</th>
                    <th>Handout</th>
                  </tr>
                </thead>
                <tbody>
                  ${game.points.map((point, index) => `
                    <tr class="${point.isHandout ? 'handout' : ''}">
                      <td>${index + 1}</td>
                      <td><strong>${point.scorer}</strong></td>
                      <td>${point.score}</td>
                      <td>${point.server}</td>
                      <td>${point.servingSide}</td>
                      <td>${point.isHandout ? '✓' : ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            Generated by Squash Ref Support App
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Toast Notification */}
        {toast && (
          <div className={`
            fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300
            ${toast.type === 'handout' ? 'bg-orange-500' : 'bg-green-500'}
          `}>
            {toast.message}
          </div>
        )}

        {/* Match Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {matchFormat === 'best-of-3' ? 'Best of 3' : 'Best of 5'} Match
          </h1>
          <div className="text-lg text-gray-600 mb-4">
            Game {gameNumber}
          </div>
          
          {/* Match Score */}
          <div className="flex justify-center items-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Games Won</div>
              <div className="text-2xl font-bold text-blue-600">{player1Games}</div>
              <div className="text-lg font-medium text-gray-700">{player1}</div>
            </div>
            <div className="text-3xl font-bold text-gray-400">-</div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Games Won</div>
              <div className="text-2xl font-bold text-green-600">{player2Games}</div>
              <div className="text-lg font-medium text-gray-700">{player2}</div>
            </div>
          </div>
        </div>

        {/* Current Game Score */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Game Score</h2>
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{player1Score}</div>
                <div className={`text-lg font-medium ${currentServer === player1 ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                  {player1} {currentServer === player1 && '(Serving)'}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-400">-</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{player2Score}</div>
                <div className={`text-lg font-medium ${currentServer === player2 ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
                  {player2} {currentServer === player2 && '(Serving)'}
                </div>
              </div>
            </div>
          </div>

          {/* Serving Info */}
          <div className="text-center text-sm text-gray-500 mb-6">
            {currentServer} is serving from the {lastServingSide} side
          </div>

          {/* Timing Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Current Game</div>
                <div className="text-lg font-bold text-blue-600">{formatDuration(currentGameDuration)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Match</div>
                <div className="text-lg font-bold text-green-600">{formatDuration(getTotalMatchDuration())}</div>
              </div>
            </div>
            
            {/* Save Status */}
            {isUserLoggedIn && (
              <div className="text-center text-sm">
                <span className="text-green-600">💾 Match auto-saving</span>
                {matchId && (
                  <span className="text-gray-500 ml-2">ID: {matchId.slice(-6)}</span>
                )}
              </div>
            )}
            {!isUserLoggedIn && (
              <div className="text-center text-sm text-orange-600">
                ⚠️ Guest mode - Match not being saved
              </div>
            )}
          </div>
        </div>

        {/* Scoring Buttons */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {matchComplete ? (
            /* Match Completion Screen */
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">🏆 Match Complete!</h2>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                  <p className="text-2xl font-bold text-green-700 mb-3">
                    Match Winner: {matchWinner}
                  </p>
                  <p className="text-xl text-gray-700 mb-2">
                    Final Match Score: {player1} {player1Games} - {player2Games} {player2}
                  </p>
                  <p className="text-lg text-gray-600">
                    {matchFormat === 'best-of-3' ? 'Best of 3' : 'Best of 5'} Match
                  </p>
                </div>
              </div>

              {/* Game Results Summary */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Game Results</h3>
                <div className="grid gap-3">
                  {gameHistory.map((game, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                      <div>
                        <span className="font-medium">Game {game.gameNumber}: </span>
                        <span className="font-bold text-green-600">{game.winner}</span>
                        <span className="text-gray-600 ml-2">({game.finalScore})</span>
                        <span className="text-gray-500 ml-2">- {formatDuration(game.duration)}</span>
                      </div>
                      <button
                        onClick={() => printSpecificGameTranscript(game)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        📄 Print Game {game.gameNumber}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Actions */}
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={printMatchTranscript}
                  className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  📋 Print Complete Match Transcript
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🏠 New Match
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  🎉 Congratulations {matchWinner} on winning the match!
                </p>
              </div>
            </div>
          ) : showBreakTimer ? (
            /* Break Timer between Games */
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 Game Complete!</h3>
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <p className="text-xl font-bold text-green-700 mb-2">
                    Game {gameNumber} Winner: {gameWinner}
                  </p>
                  <p className="text-lg text-gray-600">
                    Final Score: {gameHistory.length > 0 ? gameHistory[gameHistory.length - 1]?.finalScore : `${player1Score}-${player2Score}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Total Points Played: {gameHistory.length > 0 ? gameHistory[gameHistory.length - 1]?.points.length : currentGamePoints.length}
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-md text-blue-700 font-medium">
                    Match Score: {player1} {player1Games} - {player2Games} {player2}
                  </p>
                </div>
                
                <p className="text-md text-gray-500">
                  1-minute break before Game {gameNumber + 1}
                </p>
              </div>
              
              {/* Timer Display */}
              <div className="text-center mb-8">
                <style jsx>{`
                  .flash-red {
                    animation: flash 0.8s infinite;
                  }
                  @keyframes flash {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                  }
                `}</style>
                <div className={`
                  text-6xl font-bold mb-4 transition-all duration-300
                  ${breakTimeRemaining <= 15 ? 'text-red-500 flash-red' : 'text-blue-600'}
                `}>
                  {Math.floor(breakTimeRemaining / 60)}:{(breakTimeRemaining % 60).toString().padStart(2, '0')}
                </div>
                <div className={`
                  text-lg font-medium
                  ${timerRunning ? 'text-green-600' : 'text-gray-500'}
                `}>
                  {timerRunning ? '⏱️ Timer Running' : '⏸️ Timer Stopped'}
                </div>
                {breakTimeRemaining <= 15 && (
                  <div className="text-red-500 font-bold text-lg mt-2 flash-red">
                    ⚠️ TIME RUNNING OUT!
                  </div>
                )}
              </div>
              
              {/* Timer Controls */}
              <div className="grid grid-cols-1 gap-4">
                {breakTimeRemaining > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={timerRunning ? handleStopBreak : handleStartBreak}
                      className={`
                        p-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg
                        ${timerRunning 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                        }
                      `}
                    >
                      {timerRunning ? '⏹️ Stop Timer' : '▶️ Start Timer'}
                    </button>
                    <button
                      onClick={handleSkipBreak}
                      className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      ⏭️ Skip Break
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startNextGame}
                    className="p-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    🏁 Start Game {gameNumber + 1}
                  </button>
                )}
              </div>
              
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  🏆 {gameWinner} will serve first in the next game
                </p>
              </div>
            </div>
          ) : awaitingGameStartSideSelection ? (
            /* Side Selection for New Game Start */
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Starting Side</h3>
                <p className="text-lg text-gray-600 mb-2">
                  Game {gameNumber} - {currentServer} to serve first
                </p>
                <p className="text-md text-gray-500">
                  Which side does {currentServer} want to serve from?
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleGameStartSideSelection('left')}
                  className="p-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Left Side
                </button>
                <button
                  onClick={() => handleGameStartSideSelection('right')}
                  className="p-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Right Side
                </button>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Winner of the previous game can choose their starting serving side
                </p>
              </div>
            </div>
          ) : awaitingSideSelection ? (
            /* Side Selection after Handout */
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Serving Side</h3>
                <p className="text-lg text-gray-600">
                  {pendingServer} can serve from which side?
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSideSelection('left')}
                  className="p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Left Side
                </button>
                <button
                  onClick={() => handleSideSelection('right')}
                  className="p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Right Side
                </button>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  The new server can choose their preferred serving side
                </p>
              </div>
            </div>
          ) : (
            /* Normal Scoring Buttons */
            <>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePlayerScore(player1)}
                  className="p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {player1} Scores
                </button>
                <button
                  onClick={() => handlePlayerScore(player2)}
                  className="p-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {player2} Scores
                </button>
              </div>
              
              {/* Foul Button - Disabled for now */}
              <button
                disabled
                className="p-4 bg-gray-300 text-gray-500 rounded-xl font-semibold transition-all duration-300 shadow-lg cursor-not-allowed opacity-60"
                title="Feature coming soon"
              >
                Call Foul / Let / Stroke (Coming Soon)
              </button>
            </>
          )}
        </div>

        {/* Game Rules Info */}
        <div className="text-center text-sm text-gray-500">
          <p>First to {gameToPoints} points wins the game</p>
          <p>Must win by 2 points (or first to 15 if tied at 10-10)</p>
        </div>
      </div>
    </div>
  );
} 