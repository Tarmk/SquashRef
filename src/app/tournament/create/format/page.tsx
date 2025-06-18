'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function TournamentFormatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFormat, setSelectedFormat] = useState<'round-robin' | 'monrad' | null>(null);
  
  const tournamentType = searchParams.get('type');
  const tournamentId = searchParams.get('id');

  const handleFormatSelect = (format: 'round-robin' | 'monrad') => {
    setSelectedFormat(format);
  };

  const handleContinue = () => {
    if (!selectedFormat) return;
    
    const params = new URLSearchParams({
      type: tournamentType || '',
      format: selectedFormat,
      ...(tournamentId && { id: tournamentId })
    });
    
    // Both public and private tournaments now go to tournament info page
    router.push(`/tournament/create/info?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tournament Format</h1>
          <p className="text-gray-600 mb-8">
            Choose how your tournament will be structured
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleFormatSelect('round-robin')}
            className={`w-full p-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
              selectedFormat === 'round-robin'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50'
            }`}
          >
            🔄 Round Robin
            <div className="text-sm font-normal mt-2">
              Every player plays against every other player
            </div>
          </button>

          <button
            onClick={() => handleFormatSelect('monrad')}
            className={`w-full p-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
              selectedFormat === 'monrad'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
            }`}
          >
            🏆 Monrad
            <div className="text-sm font-normal mt-2">
              Swiss-style tournament with progressive pairings
            </div>
          </button>
        </div>

        {selectedFormat && (
          <div className="mt-8">
            <button
              onClick={handleContinue}
              className="w-full p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Continue to Tournament Info
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          {selectedFormat === 'round-robin' && (
            <p>Round Robin is best for smaller tournaments where everyone plays everyone</p>
          )}
          {selectedFormat === 'monrad' && (
            <p>Monrad is ideal for larger tournaments with progressive pairings</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TournamentFormatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl text-gray-600">Loading...</div>
        </div>
      </div>
    }>
      <TournamentFormatContent />
    </Suspense>
  );
} 