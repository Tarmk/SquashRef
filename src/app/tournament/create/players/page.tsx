'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';

interface Player {
  id: string;
  name: string;
  rank: number;
  isRegistered: boolean;
}

function PlayerManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tournamentType = searchParams.get('type') || 'private';
  const tournamentFormat = searchParams.get('format') || 'round-robin';
  const tournamentId = searchParams.get('id') || '';
  
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showPlayerInputs, setShowPlayerInputs] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(tournamentType === 'private');

  // Initialize players when player count changes
  useEffect(() => {
    const newPlayers: Player[] = [];
    for (let i = 1; i <= playerCount; i++) {
      newPlayers.push({
        id: `player-${i}`,
        name: '',
        rank: i,
        isRegistered: false
      });
    }
    setPlayers(newPlayers);
  }, [playerCount]);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setShowPlayerInputs(true);
  };

  const handlePlayerNameChange = (playerId: string, name: string) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, name: name.trim(), isRegistered: name.trim() !== '' }
        : player
    ));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(players);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update ranks based on new order
    const updatedItems = items.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    setPlayers(updatedItems);
  };

  const handleContinue = () => {
    const registeredPlayers = players.filter(p => p.isRegistered);
    
    if (registeredPlayers.length < 2) {
      alert('Please register at least 2 players to continue.');
      return;
    }

    // Navigate to tournament created page with all the data
    const playerData = registeredPlayers.map(p => ({
      name: p.name,
      rank: p.rank
    }));

    const params = new URLSearchParams({
      type: tournamentType,
      format: tournamentFormat,
      players: JSON.stringify(playerData),
      maxPlayers: playerCount.toString(),
      ...(tournamentId && { id: tournamentId })
    });

    if (tournamentType === 'public') {
      router.push(`/tournament/create/created?${params.toString()}`);
    } else {
      router.push(`/tournament/create/bracket?${params.toString()}`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const toggleEntryMode = () => {
    setIsManualEntry(!isManualEntry);
    setShowQRCode(!isManualEntry && tournamentType === 'public');
  };

  const registeredCount = players.filter(p => p.isRegistered).length;
  const canContinue = registeredCount >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            👥 Player Management
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            {tournamentFormat === 'round-robin' ? 'Round Robin' : 'Monrad'} Tournament • {tournamentType === 'public' ? 'Public' : 'Private'}
          </p>
          {tournamentId && (
            <p className="text-sm text-gray-500">
              Tournament ID: <span className="font-mono font-semibold">{tournamentId}</span>
            </p>
          )}
        </div>

        {/* Tournament Type Toggle (for public tournaments) */}
        {tournamentType === 'public' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Registration Method</h3>
              <button
                onClick={toggleEntryMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isManualEntry 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isManualEntry ? 'Switch to QR Registration' : 'Switch to Manual Entry'}
              </button>
            </div>
            
            {showQRCode && !isManualEntry && (
              <div className="text-center bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Share this QR code for players to self-register
                </p>
                <div className="flex justify-center mb-4">
                  <QRCodeCanvas
                    value={`${window.location.origin}/tournament/join/${tournamentId}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Players can scan this code to register themselves
                </p>
              </div>
            )}
          </div>
        )}

        {/* Player Count Selection */}
        {!showPlayerInputs && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              How many players will participate?
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[4, 6, 8, 12, 16, 20, 24, 32].map(count => (
                <button
                  key={count}
                  onClick={() => handlePlayerCountChange(count)}
                  className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {count} Players
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom number of players:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="2"
                  max="64"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(Math.max(2, Math.min(64, parseInt(e.target.value) || 2)))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => handlePlayerCountChange(playerCount)}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Player Input/Management */}
        {showPlayerInputs && isManualEntry && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Player Registration ({registeredCount}/{playerCount})
              </h3>
              <button
                onClick={() => setShowPlayerInputs(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Change Count
              </button>
            </div>

            {/* Registration Status Alert */}
            {registeredCount === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-500 mt-1">⚠️</div>
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">No Players Registered Yet</h4>
                    <p className="text-sm text-yellow-700">
                      You need to add at least 2 player names before you can confirm the tournament. 
                      Fill in the player names below to get started.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {registeredCount > 0 && registeredCount < 2 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-500 mt-1">📝</div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Almost Ready!</h4>
                    <p className="text-sm text-blue-700">
                      You have {registeredCount} player{registeredCount === 1 ? '' : 's'} registered. 
                      Add at least {2 - registeredCount} more player{2 - registeredCount === 1 ? '' : 's'} to confirm the tournament.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {registeredCount >= 2 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-green-500 mt-1">✅</div>
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Ready to Confirm!</h4>
                    <p className="text-sm text-green-700">
                      You have {registeredCount} players registered. 
                      {tournamentType === 'public' 
                        ? ` After confirmation, additional players can join via QR code up to ${playerCount} total.`
                        : ' You can now proceed to create the tournament bracket.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <span className="mr-2">💡</span>
                Drag and drop players to reorder their ranking
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="players">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {players.map((player, index) => (
                      <Draggable key={player.id} draggableId={player.id} index={index}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`
                              flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200
                              ${snapshot.isDragging 
                                ? 'border-blue-500 bg-blue-50 shadow-lg' 
                                : player.isRegistered 
                                  ? 'border-green-200 bg-green-50' 
                                  : 'border-gray-200 bg-white'
                              }
                            `}
                          >
                            {/* Rank */}
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full font-semibold text-gray-700">
                              {player.rank}
                            </div>
                            
                            {/* Drag Handle */}
                            <div className="text-gray-400 cursor-grab">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M2 4h2v2H2V4zm0 4h2v2H2V8zm0 4h2v2H2v-2zm4-8h2v2H6V4zm0 4h2v2H6V8zm0 4h2v2H6v-2zm4-8h2v2h-2V4zm0 4h2v2h-2V8zm0 4h2v2h-2v-2z"/>
                              </svg>
                            </div>

                            {/* Player Name Input */}
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder={`Player ${player.rank} name`}
                                value={player.name}
                                onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            {/* Status */}
                            <div className="flex items-center">
                              {player.isRegistered ? (
                                <span className="text-green-600 font-medium">✓ Registered</span>
                              ) : (
                                <span className="text-gray-400">Not registered</span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ← Back
          </button>
          
          {showPlayerInputs && (
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`
                flex-2 px-8 py-3 rounded-lg font-semibold transition-all duration-300
                ${canContinue
                  ? 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {!canContinue 
                ? `Need ${2 - registeredCount} more players to continue`
                : tournamentType === 'public' 
                  ? `Confirm Tournament (${registeredCount} players)` 
                  : `Continue to Bracket (${registeredCount} players)`
              }
            </button>
          )}
        </div>

        {/* Tournament Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Tournament Details</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Format:</span>
              <span className="ml-2 text-gray-600">
                {tournamentFormat === 'round-robin' ? 'Round Robin' : 'Monrad System'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-600">
                {tournamentType === 'public' ? 'Public (QR Registration)' : 'Private (Manual Entry)'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Players:</span>
              <span className="ml-2 text-gray-600">{playerCount}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Registered:</span>
              <span className="ml-2 text-gray-600">{registeredCount}</span>
            </div>
          </div>
          
          {tournamentFormat === 'round-robin' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Round Robin:</strong> Every player will play against every other player. 
                Total matches: {Math.floor(registeredCount * (registeredCount - 1) / 2)}
              </p>
            </div>
          )}
          
          {tournamentFormat === 'monrad' && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>Monrad System:</strong> Swiss-style tournament with progressive pairings based on results.
                Players with similar records will be paired together.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayerManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    }>
      <PlayerManagementContent />
    </Suspense>
  );
} 