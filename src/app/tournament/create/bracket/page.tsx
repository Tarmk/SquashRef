'use client';

import { useMemo, Suspense } from 'react';
import { monradFirstRound, roundCount, roundRobin, seededRandom } from '@/lib/schedule';
import { useRouter, useSearchParams } from 'next/navigation';

interface Player {
  name: string;
  rank: number;
}

function TournamentBracketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tournamentFormat = searchParams.get('format') || 'round-robin';
  const tournamentId = searchParams.get('id') || '';
  const playersJson = searchParams.get('players') || '[]';
  
  const players = useMemo<Player[]>(() => {
    try {
      const parsed = JSON.parse(playersJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing players:', error);
      return [];
    }
  }, [playersJson]);

  const matches = useMemo(
    () =>
      tournamentFormat === 'round-robin'
        ? roundRobin(players)
        : monradFirstRound(players, seededRandom(playersJson)),
    [players, playersJson, tournamentFormat],
  );

  const handleBack = () => {
    router.back();
  };

  const handleStartTournament = () => {
    // This would navigate to the tournament management/scoring interface
    alert('Tournament starting functionality coming soon!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏆 Tournament Bracket
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            {tournamentFormat === 'round-robin' ? 'Round Robin' : 'Monrad'} Tournament • {players.length} Players
          </p>
          {tournamentId && (
            <p className="text-sm text-gray-500">
              Tournament ID: <span className="font-mono font-semibold">{tournamentId}</span>
            </p>
          )}
        </div>

        {/* Tournament Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Tournament Summary</h3>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{players.length}</div>
              <div className="text-sm text-gray-600">Players</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{matches.length}</div>
              <div className="text-sm text-gray-600">Total Matches</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {roundCount(tournamentFormat, players.length)}
              </div>
              <div className="text-sm text-gray-600">
                {roundCount(tournamentFormat, players.length) === 1 ? 'Round' : 'Rounds'}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {tournamentFormat === 'round-robin' ? 'All Play All' : 'Swiss'}
              </div>
              <div className="text-sm text-gray-600">Format</div>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Registered Players</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.map((player, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-semibold text-sm">
                  {player.rank}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{player.name}</div>
                  <div className="text-sm text-gray-500">Seed #{player.rank}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match Schedule */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {tournamentFormat === 'round-robin' ? 'Match Schedule' : 'Round 1 Matches'}
          </h3>
          
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map((match, index) => (
                <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-500">
                      Round {match.round} · Match {index + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{match.player1.name}</span>
                      <span className="text-gray-500">vs</span>
                      <span className="font-semibold text-gray-900">{match.player2.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      match.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {match.status === 'pending' ? 'Pending' : 'Complete'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No matches generated yet
            </div>
          )}
        </div>

        {/* Tournament Info */}
        {tournamentFormat === 'round-robin' && (
          <div className="bg-blue-50 rounded-2xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Round Robin Format</h4>
            <p className="text-blue-700 mb-4">
              Every player will play against every other player exactly once. The player with the most wins at the end wins the tournament.
            </p>
            <div className="text-sm text-blue-600">
              <p>• Total matches: {matches.length}</p>
              <p>• Each player plays: {players.length - 1} matches</p>
              <p>• Winner determined by: Most wins, then head-to-head if tied</p>
            </div>
          </div>
        )}

        {tournamentFormat === 'monrad' && (
          <div className="bg-purple-50 rounded-2xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-purple-900 mb-2">Monrad System</h4>
            <p className="text-purple-700 mb-4">
              Swiss-style tournament where players are paired based on their current standing after each round.
            </p>
            <div className="text-sm text-purple-600">
              <p>• Players with similar records will be paired together</p>
              <p>• Number of rounds: {Math.ceil(Math.log2(players.length))}</p>
              <p>• Winner determined by: Most points, then tiebreakers</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ← Back to Players
          </button>
          
          <button
            onClick={handleStartTournament}
            className="flex-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            🚀 Start Tournament
          </button>
        </div>

        {/* Development Notice */}
        <div className="mt-8 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-xl p-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">
              🚧 Tournament Management In Development
            </h4>
            <p className="text-yellow-700">
              Tournament bracket and match management features are currently being developed. 
              The bracket structure is generated but active tournament management coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TournamentBracketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading tournament bracket...</div>
      </div>
    }>
      <TournamentBracketContent />
    </Suspense>
  );
} 