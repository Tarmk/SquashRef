'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';

interface Player {
  name: string;
  rank: number;
}

function TournamentCreatedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tournamentType = searchParams.get('type') || 'public';
  const tournamentFormat = searchParams.get('format') || 'round-robin';
  const tournamentId = searchParams.get('id') || '';
  const playersJson = searchParams.get('players') || '[]';
  const maxPlayers = parseInt(searchParams.get('maxPlayers') || '16'); // Default to 16 for public tournaments
  const tournamentInfoJson = searchParams.get('tournamentInfo') || '{}';
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournamentInfo, setTournamentInfo] = useState({
    name: '',
    startDate: '',
    endDate: '',
    venue: '',
    address: '',
    description: '',
    contactInfo: '',
    entryFee: '',
    prizes: '',
    rules: ''
  });

  useEffect(() => {
    try {
      const parsedPlayers = JSON.parse(playersJson);
      setPlayers(parsedPlayers);
    } catch (error) {
      console.error('Error parsing players:', error);
    }

    try {
      const parsedTournamentInfo = JSON.parse(tournamentInfoJson);
      setTournamentInfo(parsedTournamentInfo);
    } catch (error) {
      console.error('Error parsing tournament info:', error);
    }
  }, [playersJson, tournamentInfoJson]);

  const handleContinueToBracket = () => {
    const params = new URLSearchParams({
      type: tournamentType,
      format: tournamentFormat,
      players: playersJson,
      maxPlayers: maxPlayers.toString(),
      tournamentInfo: tournamentInfoJson,
      ...(tournamentId && { id: tournamentId })
    });

    router.push(`/tournament/create/bracket?${params.toString()}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  const qrCodeUrl = `${window.location.origin}/tournament/join/${tournamentId}?format=${tournamentFormat}&maxPlayers=${maxPlayers}&currentPlayers=${players.length}&tournamentInfo=${encodeURIComponent(tournamentInfoJson)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tournament Created Successfully!
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            {tournamentInfo.name ? `${tournamentInfo.name} is ready for players` : `Your ${tournamentFormat === 'round-robin' ? 'Round Robin' : 'Monrad'} tournament is ready for players`}
          </p>
          {tournamentId && (
            <div className="bg-white rounded-lg px-4 py-2 inline-block shadow-sm">
              <p className="text-sm text-gray-700">
                Tournament ID: <span className="font-mono font-semibold text-blue-600">{tournamentId}</span>
              </p>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              📱 Share Your Tournament
            </h2>
            <p className="text-gray-600 mb-6">
              Players can scan this QR code to join your tournament
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-inner">
              <div className="bg-white p-4 rounded-xl shadow-md">
                <QRCodeCanvas
                  value={qrCodeUrl}
                  size={250}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="bg-gray-100 rounded-lg px-4 py-2 inline-block mb-2">
              <p className="text-sm font-mono text-gray-700">
                {qrCodeUrl}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Share this QR code or link with players
            </p>
          </div>

          {/* Tournament Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Tournament Summary</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tournament Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {tournamentInfo.name && (
                    <p>• Name: {tournamentInfo.name}</p>
                  )}
                  <p>• Format: {tournamentFormat === 'round-robin' ? 'Round Robin' : 'Monrad System'}</p>
                  <p>• Maximum Players: {maxPlayers}</p>
                  {tournamentInfo.startDate && (
                    <p>• Start Date: {new Date(tournamentInfo.startDate).toLocaleDateString()}</p>
                  )}
                  {tournamentInfo.venue && (
                    <p>• Venue: {tournamentInfo.venue}</p>
                  )}
                  {tournamentInfo.entryFee && (
                    <p>• Entry Fee: {tournamentInfo.entryFee}</p>
                  )}
                  {players.length > 0 ? (
                    <>
                      <p>• Pre-registered: {players.length}</p>
                      <p>• Available Spots: {maxPlayers - players.length}</p>
                    </>
                  ) : (
                    <p>• Current Players: 0 (waiting for registrations)</p>
                  )}
                  <p>• Total Matches: {tournamentFormat === 'round-robin' 
                    ? Math.floor(maxPlayers * (maxPlayers - 1) / 2)
                    : `${Math.ceil(Math.log2(maxPlayers))} rounds`
                  }</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What Happens Next</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Players scan QR code to join</p>
                  <p>• Tournament fills up to {maxPlayers} players</p>
                  <p>• Bracket is automatically generated</p>
                  <p>• Match schedules are created</p>
                  <p>• Tournament can begin!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-registered Players - Only show if there are any */}
        {players.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Pre-registered Players ({players.length})
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full font-semibold text-sm">
                    {player.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-500">Seed #{player.rank}</div>
                  </div>
                  <div className="text-green-600">✓</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Use</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">For Players</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Scan the QR code with their phone camera</li>
                <li>Enter their name on the registration page</li>
                <li>Submit to join the tournament</li>
                <li>Wait for tournament to start</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">For Tournament Organizer</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Share the QR code with potential players</li>
                <li>Monitor registrations as they come in</li>
                <li>Start tournament when ready</li>
                <li>Manage matches and brackets</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleGoBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ← Edit Tournament
          </button>
          
          <button
            onClick={handleContinueToBracket}
            className="flex-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Continue to Bracket 🚀
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Keep this page open to monitor player registrations, or bookmark it to return later. 
              The tournament will accept up to {maxPlayers} players.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TournamentCreatedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading tournament...</div>
      </div>
    }>
      <TournamentCreatedContent />
    </Suspense>
  );
} 