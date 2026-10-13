'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loginHref } from '@/lib/redirect';
import {
  joinTournament,
  leaveTournament,
  listTournamentPlayers,
  loadTournamentDraft,
  publicName,
  registrationState,
  MAX_PLAYER_NAME,
  type TournamentDraft,
  type TournamentPlayer,
} from '@/lib/tournamentService';

type Tournament = Omit<TournamentDraft, 'status'> & { status: string };

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-lg p-6 mb-6 ${className}`}>{children}</div>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900 text-right break-words">{value}</span>
    </div>
  );
}

function formatDescription(format: string, players: number) {
  if (format === 'monrad') {
    return {
      title: 'Monrad',
      text: `Every player plays every round; winners play winners and losers play losers.${players > 1 ? ` About ${Math.ceil(Math.log2(players))} rounds for ${players} players.` : ''}`,
    };
  }
  return {
    title: 'Round robin',
    text: `Every player plays every other player.${players > 1 ? ` ${(players * (players - 1)) / 2} matches for ${players} players.` : ''}`,
  };
}

export default function JoinTournamentPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const params = useParams();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loadError, setLoadError] = useState<'not-found' | 'failed' | null>(null);
  const [loading, setLoading] = useState(true);

  const [playerName, setPlayerName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([loadTournamentDraft(tournamentId), listTournamentPlayers(tournamentId)]);
      if (!t) {
        setLoadError('not-found');
        return;
      }
      setTournament(t as Tournament);
      setPlayers(p);
      setLoadError(null);
    } catch (error) {
      console.error('Could not load tournament', error);
      const code = (error as { code?: string })?.code;
      setLoadError(code === 'permission-denied' || code === 'not-found' ? 'not-found' : 'failed');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setPlayerName((name) => name || publicName(currentUser, ''));
    load();
  }, [authLoading, currentUser, load]);

  const joined = Boolean(currentUser && players.some((p) => p.id === currentUser.uid));
  const state = tournament ? registrationState(tournament, players.length, joined) : null;
  const spotsLeft = tournament?.maxPlayers ? Math.max(tournament.maxPlayers - players.length, 0) : null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !playerName.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await joinTournament(tournamentId, currentUser.uid, playerName);
      setMessage({ kind: 'success', text: `You're in. See you on court, ${playerName.trim()}!` });
    } catch (error) {
      const text =
        (error as Error).message === 'already-joined'
          ? 'You are already registered for this tournament.'
          : 'Registration failed. The tournament may be full or closed; refresh and try again.';
      setMessage({ kind: 'error', text });
    } finally {
      await load();
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUser || !confirm('Withdraw from this tournament?')) return;
    setBusy(true);
    setMessage(null);
    try {
      await leaveTournament(tournamentId, currentUser.uid);
      setMessage({ kind: 'success', text: 'You have withdrawn from the tournament.' });
    } catch (error) {
      console.error('Could not withdraw', error);
      setMessage({ kind: 'error', text: 'Could not withdraw. Please try again.' });
    } finally {
      await load();
      setBusy(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center p-4">
      <div className="max-w-md w-full py-8">{children}</div>
    </div>
  );

  if (authLoading || loading) {
    return shell(<p className="text-center text-gray-600 mt-24">Loading tournament...</p>);
  }

  if (!currentUser) {
    const back = `/tournament/join/${tournamentId}`;
    return shell(
      <Card className="text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join this tournament</h1>
        <p className="text-gray-600 mb-6">Log in or create a free account to see the details and register.</p>
        <div className="flex gap-3">
          <Link href={loginHref(back)} className="flex-1 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold">
            Log in
          </Link>
          <Link href={loginHref(back, 'signup')} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold">
            Sign up
          </Link>
        </div>
      </Card>,
    );
  }

  if (loadError || !tournament) {
    return shell(
      <Card className="text-center">
        <div className="text-5xl mb-4">🔎</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {loadError === 'failed' ? 'Could not load the tournament' : 'Tournament not found'}
        </h1>
        <p className="text-gray-600 mb-6">
          {loadError === 'failed'
            ? 'Check your connection and try again.'
            : 'The link may be wrong, or the organiser deleted the tournament.'}
        </p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Go to your dashboard
        </Link>
      </Card>,
    );
  }

  const format = formatDescription(tournament.format, tournament.maxPlayers || players.length);
  const dates = [tournament.startDate, tournament.endDate]
    .filter((d): d is Date => d instanceof Date)
    .map((d) => d.toLocaleDateString())
    .join(' – ');

  return shell(
    <>
      <div className="text-center mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-1">Tournament</p>
        <h1 className="text-3xl font-bold text-gray-900 break-words">{tournament.name}</h1>
        <p className="text-gray-600 mt-1">Hosted by {tournament.hostName || 'the organiser'}</p>
      </div>

      {message && (
        <div
          role="status"
          className={`rounded-lg p-4 mb-6 text-sm ${
            message.kind === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
        <div className="space-y-2 text-sm">
          <Detail label="Format" value={format.title} />
          <Detail label="Dates" value={dates} />
          <Detail label="Venue" value={tournament.venue} />
          <Detail label="Address" value={tournament.address} />
          <Detail label="Entry fee" value={tournament.entryFee} />
          <Detail label="Contact" value={tournament.contactInfo} />
        </div>
        {tournament.description && <p className="mt-4 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{tournament.description}</p>}
        {tournament.prizes && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-1">Prizes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{tournament.prizes}</p>
          </div>
        )}
        {tournament.rules && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-1">Rules and notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{tournament.rules}</p>
          </div>
        )}
        <p className="mt-4 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{format.text}</p>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Players</h2>
          <span className="text-sm text-gray-600">
            {players.length}
            {tournament.maxPlayers ? ` / ${tournament.maxPlayers}` : ''} registered
          </span>
        </div>

        {players.length === 0 ? (
          <p className="text-sm text-gray-500">Nobody has registered yet.</p>
        ) : (
          <ol className="text-sm text-gray-800 space-y-1 list-decimal list-inside">
            {players.map((p) => (
              <li key={p.id} className={p.id === currentUser.uid ? 'font-semibold text-blue-700' : ''}>
                {p.name}
                {p.id === currentUser.uid && ' (you)'}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card>
        {state === 'open' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Register</h2>
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Name shown on the draw
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                maxLength={MAX_PLAYER_NAME}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={busy}
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy || !playerName.trim()}
              className="w-full py-3 px-4 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {busy ? 'Registering...' : `Join tournament${spotsLeft !== null ? ` (${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left)` : ''}`}
            </button>
          </form>
        )}

        {state === 'joined' && (
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">You are registered</h2>
            <p className="text-sm text-gray-600 mb-4">The organiser will publish the draw before play starts.</p>
            {tournament.status === 'registration' && (
              <button onClick={handleLeave} disabled={busy} className="text-sm text-red-600 hover:underline disabled:opacity-50">
                Withdraw
              </button>
            )}
          </div>
        )}

        {state === 'full' && (
          <div className="text-center">
            <div className="text-4xl mb-2">⛔</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Tournament full</h2>
            <p className="text-sm text-gray-600">All {tournament.maxPlayers} places are taken. Contact the organiser to join a waiting list.</p>
          </div>
        )}

        {state === 'not-open' && (
          <div className="text-center">
            <div className="text-4xl mb-2">🕒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Registration has not opened yet</h2>
            <p className="text-sm text-gray-600">The organiser has not published this tournament. Check back later.</p>
          </div>
        )}

        {state === 'closed' && (
          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Registration is closed</h2>
            <p className="text-sm text-gray-600">This tournament is already under way or finished.</p>
          </div>
        )}
      </Card>

      <div className="text-center">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
          ← Dashboard
        </Link>
      </div>
    </>,
  );
}
