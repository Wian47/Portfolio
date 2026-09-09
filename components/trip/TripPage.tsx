/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import type { TripId } from '../../trip/model';
import type { SyncState } from '../../trip/sync';
import { Itinerary } from './Itinerary';
import { Loading, Notice, Shell, SignedOut } from './Shell';
import { TripList } from './TripList';
import { usePath } from './usePath';
import { useTrip } from './useTrip';

const SAVE_LABEL: Record<SyncState['kind'], string> = {
  idle: 'Saved',
  saving: 'Saving',
  retrying: 'No connection',
  signedOut: 'Signed out',
  blocked: 'Not saved'
};

const SaveState: React.FC<{ sync: SyncState; unsaved: boolean; onRetry: () => void }> = ({
  sync, unsaved, onRetry
}) => {
  const label = sync.kind === 'idle' && unsaved ? 'Unsaved' : SAVE_LABEL[sync.kind];
  const warn = sync.kind === 'retrying' || sync.kind === 'blocked';

  return (
    <span className="flex items-center gap-3">
      <span
        title={sync.kind === 'blocked' ? sync.reason : undefined}
        className={`font-mono text-[10px] uppercase tracking-label ${warn ? 'text-ember' : 'text-paper-faint'}`}
      >
        {label}
      </span>
      {sync.kind === 'blocked' && (
        <button
          type="button"
          onClick={onRetry}
          className="font-mono text-[10px] uppercase tracking-label text-paper-dim underline transition-colors hover:text-paper"
        >
          Try again
        </button>
      )}
    </span>
  );
};

const OneTrip: React.FC<{ id: TripId; onSignedOut: () => void; onBack: () => void }> = ({
  id, onSignedOut, onBack
}) => {
  const { view, edit, retry } = useTrip(id);

  useEffect(() => {
    if (view.kind === 'signedOut') onSignedOut();
  }, [view.kind, onSignedOut]);

  if (view.kind === 'loading') return <Loading />;
  if (view.kind === 'signedOut') return <SignedOut />;
  if (view.kind === 'missing') {
    return <Notice title="No such trip">It was archived, or the link is wrong.</Notice>;
  }

  return (
    <Shell
      back={{ label: 'All trips', href: '/build', onNavigate: onBack }}
      status={<SaveState sync={view.sync} unsaved={view.unsaved} onRetry={retry} />}
    >
      <Itinerary trip={view.trip} edit={edit} onSignedOut={onSignedOut} />
    </Shell>
  );
};

/**
 * Access decides on a document request, so a lapsed session is answered by
 * replacing the page rather than by trying to recover in place. Everything
 * unsaved is already gone at that point and the notice says so.
 */
const TripPage: React.FC = () => {
  const { route, navigate } = usePath();
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    document.title = 'Trips · Wian Schoeman';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  if (signedOut) {
    return <Shell back={{ label: 'Portfolio', href: '/' }}><SignedOut /></Shell>;
  }

  if (route.kind === 'trip') {
    return (
      <OneTrip
        id={route.id}
        onSignedOut={() => setSignedOut(true)}
        onBack={() => navigate({ kind: 'list' })}
      />
    );
  }

  return (
    <Shell back={{ label: 'Portfolio', href: '/' }}>
      <TripList
        onOpen={(id) => navigate({ kind: 'trip', id })}
        onSignedOut={() => setSignedOut(true)}
      />
    </Shell>
  );
};

export default TripPage;
