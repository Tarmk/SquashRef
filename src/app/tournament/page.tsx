'use client';

import { useRouter } from 'next/navigation';

export default function TournamentPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🏆 Tournament Mode
          </h1>
          <p className="text-2xl text-gray-600 mb-4">
            Professional Tournament Management
          </p>
          <p className="text-lg text-gray-500">
            Coming Soon - Advanced tournament features
          </p>
        </div>

        {/* Coming Soon Features */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Planned Tournament Features
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-blue-700 mb-4">Tournament Setup</h4>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Multi-player registration
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Round-robin brackets
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Knockout tournament trees
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Swiss system tournaments
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Seeding and rankings
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-blue-700 mb-4">Tournament Management</h4>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Automatic match scheduling
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Live tournament brackets
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Real-time standings
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Match result tracking
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-blue-500 mr-3">🔲</span>
                  Tournament statistics
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h4 className="text-xl font-semibold text-blue-700 mb-4">Reporting & Analysis</h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <h5 className="font-semibold text-gray-900 mb-2">Tournament Reports</h5>
                <p className="text-sm text-gray-600">Complete tournament documentation and results</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏅</div>
                <h5 className="font-semibold text-gray-900 mb-2">Player Rankings</h5>
                <p className="text-sm text-gray-600">Automatic ranking calculation and updates</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📈</div>
                <h5 className="font-semibold text-gray-900 mb-2">Statistics</h5>
                <p className="text-sm text-gray-600">Detailed player and match analytics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Temporary Message */}
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">
              🚧 Tournament Mode In Development
            </h4>
            <p className="text-blue-700">
              Tournament functionality is currently being developed. For now, please use Individual Game Mode for single match refereeing.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <button
            onClick={handleBack}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            ← Back to Mode Selection
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Tournament mode will provide comprehensive tournament management tools for squash competitions of all sizes.
          </p>
        </div>
      </div>
    </div>
  );
} 