'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { autoSaveDraft, loadTournamentDraft, finalizeTournamentDraft } from '@/lib/tournamentService';
import Header from '@/components/Header';

interface TournamentInfo {
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  description: string;
  contactInfo: string;
  entryFee: string;
  prizes: string;
  rules: string;
}

function TournamentInfoContent() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tournamentType = searchParams.get('type') || 'private';
  const tournamentFormat = searchParams.get('format') || 'round-robin';
  const tournamentId = searchParams.get('id') || '';
  const draftId = searchParams.get('draft') || '';
  
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo>({
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
  
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Load existing draft if editing
  useEffect(() => {
    if (draftId && currentUser) {
      loadExistingDraft();
    }
  }, [draftId, currentUser]);

  const loadExistingDraft = async () => {
    if (!draftId) return;
    
    setIsLoading(true);
    try {
      const draft = await loadTournamentDraft(draftId);
      if (draft && draft.hostId === currentUser?.uid) {
        setTournamentInfo({
          name: draft.name || '',
          startDate: draft.startDate ? draft.startDate.toISOString().split('T')[0] : '',
          endDate: draft.endDate ? draft.endDate.toISOString().split('T')[0] : '',
          venue: draft.venue || '',
          address: draft.address || '',
          description: draft.description || '',
          contactInfo: draft.contactInfo || '',
          entryFee: draft.entryFee || '',
          prizes: draft.prizes || '',
          rules: draft.rules || ''
        });
        setCurrentDraftId(draft.id || null);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save functionality
  const performAutoSave = async () => {
    if (!currentUser || !tournamentInfo.name.trim()) return;

    setAutoSaveStatus('saving');
    try {
      const draftData: any = {
        name: tournamentInfo.name,
        type: tournamentType as 'public' | 'private',
        format: tournamentFormat as 'round-robin' | 'monrad',
        draftData: {
          step: 'info' as const,
          formData: tournamentInfo
        }
      };

      // Only add fields that have values
      if (tournamentInfo.venue?.trim()) draftData.venue = tournamentInfo.venue;
      if (tournamentInfo.address?.trim()) draftData.address = tournamentInfo.address;
      if (tournamentInfo.description?.trim()) draftData.description = tournamentInfo.description;
      if (tournamentInfo.contactInfo?.trim()) draftData.contactInfo = tournamentInfo.contactInfo;
      if (tournamentInfo.entryFee?.trim()) draftData.entryFee = tournamentInfo.entryFee;
      if (tournamentInfo.prizes?.trim()) draftData.prizes = tournamentInfo.prizes;
      if (tournamentInfo.rules?.trim()) draftData.rules = tournamentInfo.rules;
      if (tournamentInfo.startDate) draftData.startDate = new Date(tournamentInfo.startDate);
      if (tournamentInfo.endDate) draftData.endDate = new Date(tournamentInfo.endDate);

      const savedDraftId = await autoSaveDraft(
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'User',
        draftData,
        currentDraftId || undefined
      );
      
      if (!currentDraftId) {
        setCurrentDraftId(savedDraftId);
      }
      
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus(null), 3000);
    }
  };

  // Trigger auto-save when form data changes
  useEffect(() => {
    if (currentUser && tournamentInfo.name.trim()) {
      const timer = setTimeout(performAutoSave, 1500);
      return () => clearTimeout(timer);
    }
  }, [tournamentInfo, currentUser, tournamentType, tournamentFormat]);

  const handleInputChange = (field: keyof TournamentInfo, value: string) => {
    setTournamentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = async () => {
    // Validate required fields
    if (!tournamentInfo.name.trim()) {
      alert('Please enter a tournament name');
      return;
    }

    if (!currentUser) {
      alert('Please sign in to continue');
      return;
    }

    try {
      setIsLoading(true);

      let finalDraftId = currentDraftId;

              // Save current state as draft if not already saved
        if (!finalDraftId) {
          const draftData: any = {
            name: tournamentInfo.name,
            type: tournamentType as 'public' | 'private',
            format: tournamentFormat as 'round-robin' | 'monrad',
            draftData: {
              step: 'info' as const,
              formData: tournamentInfo
            }
          };

          // Only add fields that have values
          if (tournamentInfo.venue?.trim()) draftData.venue = tournamentInfo.venue;
          if (tournamentInfo.address?.trim()) draftData.address = tournamentInfo.address;
          if (tournamentInfo.description?.trim()) draftData.description = tournamentInfo.description;
          if (tournamentInfo.contactInfo?.trim()) draftData.contactInfo = tournamentInfo.contactInfo;
          if (tournamentInfo.entryFee?.trim()) draftData.entryFee = tournamentInfo.entryFee;
          if (tournamentInfo.prizes?.trim()) draftData.prizes = tournamentInfo.prizes;
          if (tournamentInfo.rules?.trim()) draftData.rules = tournamentInfo.rules;
          if (tournamentInfo.startDate) draftData.startDate = new Date(tournamentInfo.startDate);
          if (tournamentInfo.endDate) draftData.endDate = new Date(tournamentInfo.endDate);

          finalDraftId = await autoSaveDraft(
            currentUser.uid,
            currentUser.displayName || currentUser.email || 'User',
            draftData
          );
          setCurrentDraftId(finalDraftId);
        }

      // Create URL parameters with all data
      const params = new URLSearchParams({
        type: tournamentType,
        format: tournamentFormat,
        tournamentInfo: JSON.stringify(tournamentInfo),
        ...(tournamentId && { id: tournamentId }),
        ...(finalDraftId && { draft: finalDraftId })
      });

              if (tournamentType === 'public') {
          // For public tournaments, finalize the draft and go to created page
          if (finalDraftId) {
            const finalData: any = {
              name: tournamentInfo.name,
            };
            
            // Only add fields that have values
            if (tournamentInfo.venue?.trim()) finalData.venue = tournamentInfo.venue;
            if (tournamentInfo.address?.trim()) finalData.address = tournamentInfo.address;
            if (tournamentInfo.description?.trim()) finalData.description = tournamentInfo.description;
            if (tournamentInfo.contactInfo?.trim()) finalData.contactInfo = tournamentInfo.contactInfo;
            if (tournamentInfo.entryFee?.trim()) finalData.entryFee = tournamentInfo.entryFee;
            if (tournamentInfo.prizes?.trim()) finalData.prizes = tournamentInfo.prizes;
            if (tournamentInfo.rules?.trim()) finalData.rules = tournamentInfo.rules;
            if (tournamentInfo.startDate) finalData.startDate = new Date(tournamentInfo.startDate);
            if (tournamentInfo.endDate) finalData.endDate = new Date(tournamentInfo.endDate);
            
            await finalizeTournamentDraft(finalDraftId, finalData);
          }
          router.push(`/tournament/create/created?${params.toString()}`);
        } else {
          // For private tournaments, go to player management
          router.push(`/tournament/create/players?${params.toString()}`);
        }
    } catch (error) {
      console.error('Error saving tournament:', error);
      alert('Failed to save tournament. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = tournamentInfo.name.trim() !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header 
        showBackButton={true} 
        backUrl="/tournament/create/format" 
        title="Tournament Information"
      />
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1"></div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                📋 Tournament Information
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              {/* Auto-save Status */}
              {autoSaveStatus && (
                <div className={`
                  px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1
                  ${autoSaveStatus === 'saved' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : autoSaveStatus === 'saving'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                  }
                `}>
                  {autoSaveStatus === 'saved' && <span>✓ Draft Saved</span>}
                  {autoSaveStatus === 'saving' && <span>💾 Saving Draft...</span>}
                  {autoSaveStatus === 'error' && <span>⚠️ Save Failed</span>}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-lg text-gray-600 mb-2">
            Add details about your {tournamentFormat === 'round-robin' ? 'Round Robin' : 'Monrad'} tournament
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
            <p className="text-sm text-blue-700">
              Type: <span className="font-semibold">{tournamentType === 'public' ? 'Public' : 'Private'}</span>
              {tournamentId && (
                <span className="ml-3">
                  ID: <span className="font-mono">{tournamentId}</span>
                </span>
              )}
              {currentDraftId && (
                <span className="ml-3">
                  <span className="text-red-600 font-medium">DRAFT</span>
                </span>
              )}
            </p>
          </div>
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="mt-4">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Required Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-red-500 mr-2">*</span>
            Required Information
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="tournamentName" className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="tournamentName"
                value={tournamentInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Spring Squash Championship 2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={tournamentInfo.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={tournamentInfo.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name
              </label>
              <input
                type="text"
                id="venue"
                value={tournamentInfo.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                placeholder="e.g., City Sports Complex"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={tournamentInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="e.g., 123 Sports Lane, City, State"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Optional Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-gray-400 mr-2">📝</span>
            Optional Details
          </h3>

          <div className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Description
              </label>
              <textarea
                id="description"
                value={tournamentInfo.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the tournament, skill level, special rules, etc."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information
                </label>
                <input
                  type="text"
                  id="contactInfo"
                  value={tournamentInfo.contactInfo}
                  onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                  placeholder="email@example.com or phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="entryFee" className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Fee
                </label>
                <input
                  type="text"
                  id="entryFee"
                  value={tournamentInfo.entryFee}
                  onChange={(e) => handleInputChange('entryFee', e.target.value)}
                  placeholder="e.g., $25 or Free"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="prizes" className="block text-sm font-medium text-gray-700 mb-2">
                Prizes & Awards
              </label>
              <textarea
                id="prizes"
                value={tournamentInfo.prizes}
                onChange={(e) => handleInputChange('prizes', e.target.value)}
                placeholder="e.g., Trophies for top 3, prize money, etc."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label htmlFor="rules" className="block text-sm font-medium text-gray-700 mb-2">
                Special Rules & Notes
              </label>
              <textarea
                id="rules"
                value={tournamentInfo.rules}
                onChange={(e) => handleInputChange('rules', e.target.value)}
                placeholder="Any special tournament rules, equipment requirements, dress code, etc."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {tournamentInfo.name && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-xl font-bold text-gray-900 mb-2">{tournamentInfo.name}</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">
                    <strong>Format:</strong> {tournamentFormat === 'round-robin' ? 'Round Robin' : 'Monrad'}
                  </p>
                  {tournamentInfo.startDate && (
                    <p className="text-gray-600">
                      <strong>Start:</strong> {new Date(tournamentInfo.startDate).toLocaleDateString()}
                    </p>
                  )}
                  {tournamentInfo.endDate && (
                    <p className="text-gray-600">
                      <strong>End:</strong> {new Date(tournamentInfo.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  {tournamentInfo.venue && (
                    <p className="text-gray-600">
                      <strong>Venue:</strong> {tournamentInfo.venue}
                    </p>
                  )}
                  {tournamentInfo.entryFee && (
                    <p className="text-gray-600">
                      <strong>Entry Fee:</strong> {tournamentInfo.entryFee}
                    </p>
                  )}
                </div>
              </div>
              {tournamentInfo.description && (
                <p className="text-gray-600 mt-2 text-sm">{tournamentInfo.description}</p>
              )}
            </div>
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
          
          <button
            onClick={handleContinue}
            disabled={!isFormValid || isLoading}
            className={`
              flex-2 px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center
              ${isFormValid && !isLoading
                ? 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                {tournamentType === 'public' 
                  ? 'Create Tournament & Generate QR' 
                  : 'Continue to Player Management'
                } →
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> This information will be visible to players who join your tournament. 
              {tournamentType === 'public' && ' It will also appear on the QR code registration page.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TournamentInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    }>
      <TournamentInfoContent />
    </Suspense>
  );
} 