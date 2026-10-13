import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  setLogLevel,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Denied writes are the point of most tests; keep the SDK from logging each one.
setLogLevel('silent');

let env: RulesTestEnvironment;

const HOST = 'host-uid';
const ALICE = 'alice-uid';
const BOB = 'bob-uid';
const T = 'tournament-1';

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-squashref',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

/** Seed a tournament (rules disabled) and return nothing. */
async function seedTournament(data: Record<string, unknown>, players: Record<string, Record<string, unknown>> = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const fs = modular(ctx.firestore());
    await setDoc(doc(fs, 'tournaments', T), { hostId: HOST, hostName: 'Host', type: 'public', status: 'registration', playerCount: 0, ...data });
    for (const [id, p] of Object.entries(players)) {
      await setDoc(doc(fs, 'tournaments', T, 'players', id), p);
    }
  });
}

// rules-unit-testing hands back the compat Firestore type; the modular API accepts it at runtime.
const modular = (fs: unknown) => fs as Firestore;
const as = (uid: string): Firestore => modular(env.authenticatedContext(uid).firestore());

function join(fs: Firestore, uid: string, name = 'Alice', by = 1) {
  const batch = writeBatch(fs);
  batch.set(doc(fs, 'tournaments', T, 'players', uid), { userId: uid, name, joinedAt: serverTimestamp(), addedByHost: false });
  batch.update(doc(fs, 'tournaments', T), { playerCount: increment(by) });
  return batch.commit();
}

function leave(fs: Firestore, playerId: string) {
  const batch = writeBatch(fs);
  batch.delete(doc(fs, 'tournaments', T, 'players', playerId));
  batch.update(doc(fs, 'tournaments', T), { playerCount: increment(-1) });
  return batch.commit();
}

beforeEach(async () => {
  await env.clearFirestore();
});

describe('reading tournaments', () => {
  it('lets any signed-in user open a private tournament by id (join links)', async () => {
    await seedTournament({ type: 'private' });
    await assertSucceeds(getDoc(doc(as(ALICE), 'tournaments', T)));
  });

  it('does not let signed-out users read tournaments', async () => {
    await seedTournament({});
    await assertFails(getDoc(doc(modular(env.unauthenticatedContext().firestore()), 'tournaments', T)));
  });

  it('only lists public tournaments, or your own', async () => {
    await seedTournament({ type: 'private' });
    const fs = as(ALICE);
    await assertSucceeds(getDocs(query(collection(fs, 'tournaments'), where('type', '==', 'public'))));
    await assertFails(getDocs(collection(fs, 'tournaments')));
    await assertSucceeds(getDocs(query(collection(as(HOST), 'tournaments'), where('hostId', '==', HOST))));
  });
});

describe('joining', () => {
  it('lets a player register themselves while registration is open', async () => {
    await seedTournament({ maxPlayers: 4 });
    await assertSucceeds(join(as(ALICE), ALICE));
  });

  it('rejects joining without bumping playerCount', async () => {
    await seedTournament({});
    const fs = as(ALICE);
    await assertFails(
      setDoc(doc(fs, 'tournaments', T, 'players', ALICE), { userId: ALICE, name: 'Alice', joinedAt: serverTimestamp(), addedByHost: false }),
    );
  });

  it('rejects bumping playerCount by more than one', async () => {
    await seedTournament({});
    await assertFails(join(as(ALICE), ALICE, 'Alice', 2));
  });

  it('rejects registering someone else', async () => {
    await seedTournament({});
    const fs = as(ALICE);
    const batch = writeBatch(fs);
    batch.set(doc(fs, 'tournaments', T, 'players', BOB), { userId: BOB, name: 'Bob', joinedAt: serverTimestamp(), addedByHost: false });
    batch.update(doc(fs, 'tournaments', T), { playerCount: increment(1) });
    await assertFails(batch.commit());
  });

  it('rejects joining twice', async () => {
    await seedTournament({ playerCount: 1 }, { [ALICE]: { userId: ALICE, name: 'Alice', addedByHost: false } });
    await assertFails(join(as(ALICE), ALICE));
  });

  it('rejects joining a full tournament', async () => {
    await seedTournament({ maxPlayers: 1, playerCount: 1 }, { [BOB]: { userId: BOB, name: 'Bob', addedByHost: false } });
    await assertFails(join(as(ALICE), ALICE));
  });

  it('rejects joining a draft', async () => {
    await seedTournament({ status: 'draft' });
    await assertFails(join(as(ALICE), ALICE));
  });

  it('rejects empty and over-long names', async () => {
    await seedTournament({});
    await assertFails(join(as(ALICE), ALICE, ''));
    await assertFails(join(as(ALICE), ALICE, 'x'.repeat(61)));
  });

  it('rejects a player changing anything else on the tournament', async () => {
    await seedTournament({});
    await assertFails(updateDoc(doc(as(ALICE), 'tournaments', T), { name: 'Mine now' }));
    await assertFails(updateDoc(doc(as(ALICE), 'tournaments', T), { playerCount: 99 }));
  });
});

describe('leaving and host management', () => {
  const seeded = { [ALICE]: { userId: ALICE, name: 'Alice', addedByHost: false }, [BOB]: { userId: BOB, name: 'Bob', addedByHost: false } };

  it('lets a player leave', async () => {
    await seedTournament({ playerCount: 2 }, seeded);
    await assertSucceeds(leave(as(ALICE), ALICE));
  });

  it('does not let a player remove someone else', async () => {
    await seedTournament({ playerCount: 2 }, seeded);
    await assertFails(leave(as(ALICE), BOB));
    await assertFails(deleteDoc(doc(as(ALICE), 'tournaments', T, 'players', BOB)));
  });

  it('lets the host remove anyone and add players by hand', async () => {
    await seedTournament({ playerCount: 2 }, seeded);
    const fs = as(HOST);
    await assertSucceeds(leave(fs, BOB));
    const batch = writeBatch(fs);
    batch.set(doc(collection(fs, 'tournaments', T, 'players')), { userId: null, name: 'Walk-in', joinedAt: serverTimestamp(), addedByHost: true });
    batch.update(doc(fs, 'tournaments', T), { playerCount: increment(1) });
    await assertSucceeds(batch.commit());
  });

  it('only lets the host edit tournament details', async () => {
    await seedTournament({});
    await assertSucceeds(updateDoc(doc(as(HOST), 'tournaments', T), { name: 'Club Champs' }));
    await assertFails(updateDoc(doc(as(HOST), 'tournaments', T), { hostId: ALICE }));
  });

  it('does not allow editing a player entry in place', async () => {
    await seedTournament({ playerCount: 2 }, seeded);
    await assertFails(updateDoc(doc(as(ALICE), 'tournaments', T, 'players', ALICE), { name: 'Alicia' }));
  });
});

describe('matches', () => {
  it('keeps matches private to the referee who scored them', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(modular(ctx.firestore()), 'matches', 'm1'), { userId: ALICE });
    });
    await assertSucceeds(getDoc(doc(as(ALICE), 'matches', 'm1')));
    await assertFails(getDoc(doc(as(BOB), 'matches', 'm1')));
    await assertFails(setDoc(doc(as(BOB), 'matches', 'm2'), { userId: ALICE }));
  });
});
