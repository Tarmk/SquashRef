'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TournamentTypePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'public' | 'private' | null>(null);

  const handleTypeSelect = (type: 'public' | 'private') => {
    setSelectedType(type);
    
    if (type === 'public') {
      // Generate a unique tournament ID for public tournaments
      const id = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/tournament/create/format?type=public&id=${id}`);
    } else {
      router.push('/tournament/create/format?type=private');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tournament Type</h1>
          <p className="text-gray-600 mb-8">
            Choose how players will join your tournament
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleTypeSelect('public')}
            className="w-full p-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg bg-white border-2 border-green-500 text-green-600 hover:bg-green-50"
          >
            🌐 Public Tournament
            <div className="text-sm font-normal mt-2">
              QR code will be generated after tournament setup
            </div>
          </button>

          <button
            onClick={() => handleTypeSelect('private')}
            className="w-full p-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            🔒 Private Tournament
            <div className="text-sm font-normal mt-2">
              Manually add players to your tournament
            </div>
          </button>
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-2">Tournament Setup Flow</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Public:</strong> Type → Format → Players → QR Code Generated</p>
              <p><strong>Private:</strong> Type → Format → Players → Bracket Ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 