'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  addPlayerAsHost,
  listTournamentPlayers,
  removeTournamentPlayer,
  MAX_PLAYER_NAME,
  type TournamentPlayer,
} from '@/lib/tournamentService';

interface Props {
  tournamentId: string;
  maxPlayers?: number;
  /** Called after a player is added or removed, so the parent can refresh its counts. */
  onChange?: () => void;
}

/** Host view of the registered players: list, add someone by name, remove. */
export default function TournamentPlayers({ tournamentId, maxPlayers, onChange }: Props) {
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlayers(await listTournamentPlayers(tournamentId));
      setError(null);
    } catch (e) {
      console.error('Could not load players', e);
      setError('Could not load the player list.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const full = Boolean(maxPlayers && players.length >= maxPlayers);

  const run = async (action: () => Promise<void>, failure: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
      onChange?.();
    } catch (e) {
      console.error(failure, e);
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    run(async () => {
      await addPlayerAsHost(tournamentId, newName);
      setNewName('');
    }, 'Could not add the player.');
  };

  const handleRemove = (player: TournamentPlayer) => {
    if (!confirm(`Remove ${player.name} from the tournament?`)) return;
    run(() => removeTournamentPlayer(tournamentId, player.id), 'Could not remove the player.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Registered players</h3>
        <span className="text-sm text-gray-600">
          {players.length}
          {maxPlayers ? ` / ${maxPlayers}` : ''}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading players...</p>
      ) : players.length === 0 ? (
        <p className="text-gray-500">Nobody has registered yet. Share the join link or QR code, or add players below.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
          {players.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-2">
              <span className="text-gray-900">
                <span className="text-gray-400 mr-3 tabular-nums">{i + 1}.</span>
                {p.name}
                {p.addedByHost && <span className="ml-2 text-xs text-gray-500">added by you</span>}
              </span>
              <button onClick={() => handleRemove(p)} disabled={busy} className="text-sm text-red-600 hover:underline disabled:opacity-50">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          maxLength={MAX_PLAYER_NAME}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={full ? 'Tournament is full' : 'Add a player by name'}
          disabled={busy || full}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={busy || full || !newName.trim()}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:bg-gray-300 disabled:text-gray-500"
        >
          Add
        </button>
      </form>
    </div>
  );
}
