'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loadTournamentDraft, saveTournamentDraft, finalizeTournamentDraft, deleteTournamentDraft } from '@/lib/tournamentService';
import Header from '@/components/Header';

interface Tournament {
  id: string;
  name: string;
  type: 'public' | 'private';
  format: 'round-robin' | 'monrad';
  status: 'draft' | 'registration' | 'active' | 'completed';
  hostId: string;
  hostName: string;
  startDate?: Date;
  endDate?: Date;
  venue?: string;
  address?: string;
  playerCount: number;
  maxPlayers?: number;
  entryFee?: string;
  description?: string;
  contactInfo?: string;
  prizes?: string;
  rules?: string;
  createdAt: Date;
  updatedAt: Date;
  draftData?: {
    step: string;
    formData: any;
  };
}

type ActiveTab = 'overview' | 'edit' | 'qr' | 'players';

export default function TournamentManagePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Tournament>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    fetchTournament();
  }, [currentUser, tournamentId]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const tournamentData = await loadTournamentDraft(tournamentId);
      
      if (!tournamentData) {
        setError('Tournament not found');
        return;
      }

      if (tournamentData.hostId !== currentUser?.uid) {
        setError('You do not have permission to manage this tournament');
        return;
      }

      // Ensure the tournament has an id
      const fullTournament: Tournament = {
        ...tournamentData,
        id: tournamentData.id || tournamentId
      };
      
      setTournament(fullTournament);
      setEditForm(fullTournament);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setError('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!tournament || !currentUser) return;

    try {
      setSaving(true);
      
      const updateData: any = {
        name: editForm.name || tournament.name,
      };

      // Only add fields that have values
      if (editForm.description?.trim()) updateData.description = editForm.description;
      if (editForm.venue?.trim()) updateData.venue = editForm.venue;
      if (editForm.address?.trim()) updateData.address = editForm.address;
      if (editForm.contactInfo?.trim()) updateData.contactInfo = editForm.contactInfo;
      if (editForm.entryFee?.trim()) updateData.entryFee = editForm.entryFee;
      if (editForm.prizes?.trim()) updateData.prizes = editForm.prizes;
      if (editForm.rules?.trim()) updateData.rules = editForm.rules;
      if (editForm.maxPlayers) updateData.maxPlayers = editForm.maxPlayers;
      if (editForm.startDate) updateData.startDate = editForm.startDate;
      if (editForm.endDate) updateData.endDate = editForm.endDate;

      await saveTournamentDraft(
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'User',
        updateData,
        tournamentId
      );

      // Refresh tournament data
      await fetchTournament();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Failed to update tournament. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!tournament || tournament.status !== 'draft') return;

    if (!confirm('Are you sure you want to publish this tournament? Once published, it will be visible to players.')) {
      return;
    }

    try {
      setSaving(true);
      
      // Create the final data with only the fields needed for finalization
      const finalData: any = {};
      if (editForm.name?.trim()) finalData.name = editForm.name;
      if (editForm.description?.trim()) finalData.description = editForm.description;
      if (editForm.venue?.trim()) finalData.venue = editForm.venue;
      if (editForm.address?.trim()) finalData.address = editForm.address;
      if (editForm.contactInfo?.trim()) finalData.contactInfo = editForm.contactInfo;
      if (editForm.entryFee?.trim()) finalData.entryFee = editForm.entryFee;
      if (editForm.prizes?.trim()) finalData.prizes = editForm.prizes;
      if (editForm.rules?.trim()) finalData.rules = editForm.rules;
      if (editForm.maxPlayers) finalData.maxPlayers = editForm.maxPlayers;
      if (editForm.startDate) finalData.startDate = editForm.startDate;
      if (editForm.endDate) finalData.endDate = editForm.endDate;
      
      await finalizeTournamentDraft(tournamentId, finalData);
      await fetchTournament();
    } catch (error) {
      console.error('Error publishing tournament:', error);
      alert('Failed to publish tournament. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournament) return;

    const confirmMessage = tournament.status === 'draft' 
      ? 'Are you sure you want to delete this draft? This action cannot be undone.'
      : 'Are you sure you want to delete this tournament? This will permanently remove all data and cannot be undone.';

    if (!confirm(confirmMessage)) return;

    try {
      setSaving(true);
      await deleteTournamentDraft(tournamentId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Failed to delete tournament. Please try again.');
      setSaving(false);
    }
  };

  const copyJoinLink = () => {
    const joinUrl = `${window.location.origin}/tournament/join/${tournamentId}`;
    navigator.clipboard.writeText(joinUrl);
    alert('Join link copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header showBackButton={true} backUrl="/dashboard" title="Tournament Management" />
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tournament data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header showBackButton={true} backUrl="/dashboard" title="Tournament Management" />
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-12">
            <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const joinUrl = `${window.location.origin}/tournament/join/${tournamentId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header showBackButton={true} backUrl="/dashboard" title={tournament.name} />
      
      <div className="max-w-6xl mx-auto p-4">
        {/* Tournament Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tournament.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
                  {tournament.status === 'draft' ? '📝 DRAFT' :
                   tournament.status === 'registration' ? 'Registration Open' : 
                   tournament.status === 'active' ? 'Active' : 'Completed'}
                </span>
                <span className="text-sm text-gray-600">
                  {tournament.format === 'round-robin' ? 'Round Robin' : 'Monrad'} • {tournament.type.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  Created: {tournament.createdAt.toLocaleDateString()}
                </span>
              </div>
              {tournament.description && (
                <p className="text-gray-600 mb-4">{tournament.description}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              {tournament.status === 'draft' && (
                <button
                  onClick={handlePublishDraft}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  🚀 Publish Tournament
                </button>
              )}
              
              {tournament.type === 'public' && tournament.status !== 'draft' && (
                <button
                  onClick={copyJoinLink}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  📋 Copy Join Link
                </button>
              )}
              
              <button
                onClick={handleDeleteTournament}
                disabled={saving}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {(['overview', 'edit', 'qr', 'players'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize
                  ${activeTab === tab
                    ? 'bg-white text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab === 'overview' && '📊 '}
                {tab === 'edit' && '✏️ '}
                {tab === 'qr' && '📱 '}
                {tab === 'players' && '👥 '}
                {tab === 'overview' ? 'Overview' : 
                 tab === 'qr' ? 'QR Code' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{tournament.playerCount}</div>
                  <div className="text-sm text-blue-700">Players Registered</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{tournament.entryFee || 'Free'}</div>
                  <div className="text-sm text-green-700">Entry Fee</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{tournament.maxPlayers || '∞'}</div>
                  <div className="text-sm text-purple-700">Max Players</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {tournament.format === 'round-robin' ? 'Round Robin' : 'Monrad'}
                  </div>
                  <div className="text-sm text-yellow-700">Format</div>
                </div>
              </div>

              {/* Tournament Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-2 text-gray-600">{tournament.type === 'public' ? 'Public Tournament' : 'Private Tournament'}</span>
                    </div>
                    {tournament.venue && (
                      <div>
                        <span className="font-medium text-gray-700">Venue:</span>
                        <span className="ml-2 text-gray-600">{tournament.venue}</span>
                      </div>
                    )}
                    {tournament.address && (
                      <div>
                        <span className="font-medium text-gray-700">Address:</span>
                        <span className="ml-2 text-gray-600">{tournament.address}</span>
                      </div>
                    )}
                    {tournament.startDate && (
                      <div>
                        <span className="font-medium text-gray-700">Start Date:</span>
                        <span className="ml-2 text-gray-600">{tournament.startDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    {tournament.endDate && (
                      <div>
                        <span className="font-medium text-gray-700">End Date:</span>
                        <span className="ml-2 text-gray-600">{tournament.endDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    {tournament.contactInfo && (
                      <div>
                        <span className="font-medium text-gray-700">Contact:</span>
                        <span className="ml-2 text-gray-600">{tournament.contactInfo}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Status</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${getStatusColor(tournament.status)}`}>
                        {tournament.status === 'draft' ? 'Draft' :
                         tournament.status === 'registration' ? 'Registration Open' : 
                         tournament.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="ml-2 text-gray-600">{tournament.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2 text-gray-600">{tournament.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(tournament.prizes || tournament.rules) && (
                <div className="space-y-4">
                  {tournament.prizes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Prizes & Awards</h3>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{tournament.prizes}</p>
                    </div>
                  )}
                  {tournament.rules && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Rules & Notes</h3>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{tournament.rules}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Edit Tournament Details</h3>
                <div className="space-x-2">
                  {isEditing && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm(tournament);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditSubmit}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                      >
                        {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      ✏️ Edit Details
                    </button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tournament Name *</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                    <input
                      type="text"
                      value={editForm.venue || ''}
                      onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Entry Fee</label>
                    <input
                      type="text"
                      value={editForm.entryFee || ''}
                      onChange={(e) => setEditForm({ ...editForm, entryFee: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g., $25 or Free"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Players</label>
                    <input
                      type="number"
                      value={editForm.maxPlayers || ''}
                      onChange={(e) => setEditForm({ ...editForm, maxPlayers: parseInt(e.target.value) || undefined })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={editForm.startDate ? editForm.startDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value ? new Date(e.target.value) : undefined })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={editForm.endDate ? editForm.endDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                    <input
                      type="text"
                      value={editForm.contactInfo || ''}
                      onChange={(e) => setEditForm({ ...editForm, contactInfo: e.target.value })}
                      disabled={!isEditing}
                      placeholder="email@example.com or phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prizes & Awards</label>
                  <textarea
                    value={editForm.prizes || ''}
                    onChange={(e) => setEditForm({ ...editForm, prizes: e.target.value })}
                    disabled={!isEditing}
                    rows={2}
                    placeholder="e.g., Trophies for top 3, prize money, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Rules & Notes</label>
                  <textarea
                    value={editForm.rules || ''}
                    onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Any special tournament rules, equipment requirements, dress code, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="text-center space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Tournament Registration</h3>
              
              {tournament.status === 'draft' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="text-yellow-800 text-lg mb-2">📝 Tournament is still in draft</div>
                  <p className="text-yellow-700 mb-4">
                    You need to publish this tournament before players can register.
                  </p>
                  <button
                    onClick={handlePublishDraft}
                    disabled={saving}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    🚀 Publish Tournament Now
                  </button>
                </div>
              ) : tournament.type === 'private' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-blue-800 text-lg mb-2">🔒 Private Tournament</div>
                  <p className="text-blue-700 mb-4">
                    This is a private tournament. You can manage players directly or share the join link with specific people.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">Join Link:</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={joinUrl}
                          readOnly
                          className="flex-1 px-4 py-2 border border-blue-300 rounded-lg bg-white"
                        />
                        <button
                          onClick={copyJoinLink}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="text-green-800 text-lg mb-2">🌟 Public Tournament - Registration Open</div>
                    <p className="text-green-700">
                      Players can scan the QR code below or use the join link to register for your tournament.
                    </p>
                  </div>

                  {/* QR Code would go here - for now showing placeholder */}
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📱</div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">QR Code</h4>
                      <p className="text-gray-600 mb-4">
                        QR code generation feature coming soon!<br/>
                        For now, you can share the join link below.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tournament Join Link:</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={joinUrl}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <button
                          onClick={copyJoinLink}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                        >
                          📋 Copy Link
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                      <p><strong>💡 How players can join:</strong></p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Share the join link directly with players</li>
                        <li>Post the link on social media or forums</li>
                        <li>Email the link to potential participants</li>
                        <li>Include it in tournament announcements</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'players' && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">👥 Player Management</div>
              <p className="text-gray-400 mb-4">
                Player management features coming soon. You'll be able to:
              </p>
              <ul className="text-gray-400 text-left max-w-md mx-auto space-y-2">
                <li>• View all registered players</li>
                <li>• Add players manually</li>
                <li>• Remove players if needed</li>
                <li>• Send notifications to participants</li>
                <li>• Export player lists</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 