# How the browser holds a trip

The design behind `trip/ops.ts`, `trip/sync.ts` and `components/trip/useTrip.ts`.
Synthesised from three independent design candidates explored in parallel; the
candidates and their full rationales are outside this repository, in
`Projects/Trip/arch/`.

## The problem

The Worker's only write is a whole-document `PUT` guarded by `If-Match`. There
is no PATCH and no per-stop endpoint, so every edit, however small, eventually
becomes the same request. Meanwhile a drag has to feel instant, a dropped
connection is the normal condition on a road trip, and two devices editing one
trip must not lose a write.

## The shape

The browser holds `base`, the last document the server confirmed, and `log`, the
edits made since. It renders `applyAll(base.trip, log)`. The server writes
`base`, the person writes `log`, and there is no third mutable document for the
two of them to fight over. A 409 is then two assignments rather than a dialog:
`base` becomes the server's document and `log` replays on top of it. The most
visible property of this design is the conflict prompt it does not have.

## Ops record intent, not result

A drag records "put this after Barrydale", as a `StopSlot` naming its
neighbours. It does not record the `OrderKey`. The key is minted inside
`applyOp`, against whichever document is being applied to.

This is the load-bearing decision and it removes a failure rather than detecting
one. Two devices inserting into the same gap both mint the same key, and
`parseTrip` refuses two stops sharing a `(dayId, order)` slot, so the second one
would come back 422. Storing the intent makes that unrepresentable. A candidate
that stored absolute keys had to add collision repair to the fold; this one has
nothing to repair.

Ops never cross the wire. The wire carries whole documents. So the op union
carries no compatibility debt and can change freely.

## The mutation id rule is not the obvious one

Reuse the id while the payload is unchanged. Mint a new one when it changes.

The trap is specific. `rememberMutation` in `worker/cache.ts` stores every
response below 500, the 409 included, and replays it verbatim for 24 hours. So
retrying a rebased payload under the id that earned the conflict replays that
conflict until the KV entry expires, and the save silently never happens again.
The name `X-Mutation-Id` invites exactly this mistake, because it reads like one
id per logical edit.

The rule is enforced by a type rather than by a comment. A `Flush` is immutable,
carries its id and its bytes together, and `planFlush` is its only constructor.
There is no way to hold a payload without an id, and no way to change a payload
without minting a new one.

## Validating before sending, not after

`planFlush` runs `parseTrip` on the candidate document before serialising it.
The client and the Worker import the same validator, so this is not an
approximation of the server's answer, it is the server's answer computed
locally. A 422 stops being a round trip and a mystery and becomes a local error
with the field path attached. That branch should be dead code, and if it fires
it is our bug with the evidence already in hand.

## Signed out looks exactly like offline

Verified in a browser against the live site on 2026-09-09, not assumed. When the
Access session lapses, the request redirects cross-origin to
`cloudflareaccess.com`, CORS blocks reading the response, and `fetch` throws a
bare `TypeError`. It is byte for byte the failure you get with no network at
all. A client that treats every thrown fetch as "offline, retry later" will show
a signed-out person "saving..." forever.

So the two are told apart by a probe against an ungated same-origin path. If
that succeeds while the API keeps throwing, the session lapsed and the answer is
to sign in, not to retry. This is why `SyncState` has a `signedOut` arm.

## What this deliberately does not do

No persistence of unsaved edits across a reload. A reload during a connectivity
gap loses whatever had not reached the server. Adding a durable outbox means a
second storage format with its own staleness rules, and Phase 2's own
done-criterion is a server round trip, not local durability. It belongs in Phase
5 if it is ever wanted.

No editing before the first save, no reconcile-time diff highlighting, no
day-level dragging, and no exponential backoff beyond a simple retry. Each was
in a candidate and each was cut for the same reason: Phase 2 does not need it
and every one of them is additive later.
