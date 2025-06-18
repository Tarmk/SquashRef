'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function JoinTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const tournamentId = params.id as string;
  
  const [playerName, setPlayerName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [tournamentInfo, setTournamentInfo] = useState({
    format: 'round-robin',
    currentPlayers: 0,
    maxPlayers: 16,
    isActive: true,
    // Tournament details
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
    // Read tournament parameters from URL
    const format = searchParams.get('format') || 'round-robin';
    const maxPlayers = parseInt(searchParams.get('maxPlayers') || '16');
    const currentPlayers = parseInt(searchParams.get('currentPlayers') || '0');
    const tournamentInfoJson = searchParams.get('tournamentInfo') || '{}';
    
    let parsedTournamentInfo = {};
    try {
      parsedTournamentInfo = JSON.parse(tournamentInfoJson);
    } catch (error) {
      console.error('Error parsing tournament info:', error);
    }
    
    setTournamentInfo(prev => ({
      ...prev,
      format,
      currentPlayers,
      maxPlayers,
      isActive: currentPlayers < maxPlayers,
      ...parsedTournamentInfo
    }));
    
    console.log('Loading tournament info for ID:', tournamentId, {
      format,
      maxPlayers,
      currentPlayers,
      info: parsedTournamentInfo
    });
  }, [tournamentId, searchParams]);

  const handleJoinTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsRegistering(true);
    
    try {
      // Simulate API call to register player
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you'd make an API call here to register the player
      console.log('Registering player:', playerName, 'for tournament:', tournamentId);
      
      setRegistrationStatus('success');
      
      // Auto-redirect after successful registration
      setTimeout(() => {
        setRegistrationStatus('idle');
        setPlayerName('');
      }, 3000);
      
    } catch (error) {
      console.error('Registration failed:', error);
      setRegistrationStatus('error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBack = () => {
    router.push('/tournament/create');
  };

  if (registrationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Welcome to the tournament, <strong>{playerName}</strong>!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">
              You've been successfully registered for Tournament <strong>{tournamentId}</strong>
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <p>You'll receive updates about match schedules and tournament progress.</p>
            <p className="mt-2">Keep this page bookmarked for tournament updates!</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏆 Join Tournament
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            {tournamentInfo.name || 'Register for the tournament'}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              Tournament ID: <span className="font-mono font-semibold">{tournamentId}</span>
            </p>
          </div>
        </div>

        {/* Tournament Information */}
        {(tournamentInfo.name || tournamentInfo.venue || tournamentInfo.startDate) && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Tournament Details</h3>
            
            {tournamentInfo.name && (
              <h4 className="text-lg font-bold text-gray-900 mb-3">{tournamentInfo.name}</h4>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium text-gray-900">
                    {tournamentInfo.format === 'round-robin' ? 'Round Robin' : 'Monrad System'}
                  </span>
                </div>
                {tournamentInfo.startDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(tournamentInfo.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {tournamentInfo.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(tournamentInfo.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {tournamentInfo.entryFee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-medium text-gray-900">{tournamentInfo.entryFee}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {tournamentInfo.venue && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue:</span>
                    <span className="font-medium text-gray-900">{tournamentInfo.venue}</span>
                  </div>
                )}
                {tournamentInfo.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium text-gray-900 text-right">{tournamentInfo.address}</span>
                  </div>
                )}
                {tournamentInfo.contactInfo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium text-gray-900">{tournamentInfo.contactInfo}</span>
                  </div>
                )}
              </div>
            </div>

            {tournamentInfo.description && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700">{tournamentInfo.description}</p>
              </div>
            )}

            {tournamentInfo.prizes && (
              <div className="mb-4">
                <h5 className="font-medium text-gray-900 mb-1">Prizes & Awards</h5>
                <p className="text-sm text-gray-600">{tournamentInfo.prizes}</p>
              </div>
            )}

            {tournamentInfo.rules && (
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Special Rules & Notes</h5>
                <p className="text-sm text-gray-600">{tournamentInfo.rules}</p>
              </div>
            )}
          </div>
        )}

        {/* Tournament Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Registration Status</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Players:</span>
              <span className="font-medium text-gray-900">
                {tournamentInfo.currentPlayers}/{tournamentInfo.maxPlayers}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available Spots:</span>
              <span className="font-medium text-blue-600">
                {tournamentInfo.maxPlayers - tournamentInfo.currentPlayers} remaining
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${tournamentInfo.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {tournamentInfo.isActive ? '🟢 Open for Registration' : '🔴 Registration Full'}
              </span>
            </div>
          </div>

          {/* Tournament Format Description */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            {tournamentInfo.format === 'round-robin' ? (
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Round Robin Format</h5>
                <p className="text-sm text-gray-600">
                  Every player plays against every other player. Total matches: {Math.floor(tournamentInfo.maxPlayers * (tournamentInfo.maxPlayers - 1) / 2)}
                </p>
              </div>
            ) : (
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Monrad System</h5>
                <p className="text-sm text-gray-600">
                  Swiss-style tournament with progressive pairings. Rounds: {Math.ceil(Math.log2(tournamentInfo.maxPlayers))}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Registration Form */}
        {tournamentInfo.isActive ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Player Registration</h3>
            
            {tournamentInfo.currentPlayers > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>{tournamentInfo.currentPlayers}</strong> players have already been pre-registered by the tournament organizer.
                </p>
              </div>
            )}
            
            <form onSubmit={handleJoinTournament} className="space-y-4">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isRegistering}
                  required
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• You'll be added to the tournament roster</li>
                  <li>• Match schedules will be generated automatically</li>
                  <li>• You'll receive updates about your matches</li>
                  <li>• Tournament bracket will be available to view</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isRegistering || !playerName.trim()}
                className={`
                  w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300
                  ${isRegistering || !playerName.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                  }
                `}
              >
                {isRegistering ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Registering...
                  </div>
                ) : (
                  `🎯 Join Tournament (${tournamentInfo.maxPlayers - tournamentInfo.currentPlayers} spots left)`
                )}
              </button>
            </form>

            {registrationStatus === 'error' && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">
                  Registration failed. Please try again or contact the tournament organizer.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-4">⛔</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tournament Full</h3>
              <p className="text-gray-600 mb-4">
                This tournament has reached its maximum capacity of {tournamentInfo.maxPlayers} players.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-700 text-sm">
                  Contact the tournament organizer if you'd like to be added to a waiting list.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Tournament Rules</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• All matches follow official squash rules</p>
            <p>• Players must arrive on time for scheduled matches</p>
            <p>• Disputes will be handled by tournament organizers</p>
            <p>• Fair play and good sportsmanship expected</p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Tournament Setup
          </button>
        </div>
      </div>
    </div>
  );
} 