# Trip planner

The planner that replaces `/build`, built to `TRIP-PLANNER-SPEC.md`. Phase 1 is
the infrastructure underneath it: a Worker script, Access verification in code,
a D1 database and the trips API. The `/build` page itself is untouched and still
serves the CX-3 build, which is deliberate. A regression in the first deploy
that carries a Worker script should be obvious.

## What runs where

`trip/` is the domain: types, the fractional index, money, the coordinate
boundary and the document validator. No React, no DOM, no fetch. The browser and
the Worker both import it, so it is also the contract between them. `npm test`
covers it.

`worker/index.ts` handles `/build/api/*` and nothing else. Every other path is
served straight from the asset store by `run_worker_first`, so the public
portfolio never touches the script.

D1 holds one row per trip with the document stored whole as JSON. KV holds only
derived data: the Access JWKS for an hour, and each mutation's response for a
day so a retry on bad signal replays instead of reapplying.

## One-time Cloudflare setup

The repository ships with placeholder ids. `wrangler deploy` fails until they
are real, which is the intended behaviour.

```sh
npx wrangler d1 create portfolio-trips        # copy database_id into wrangler.jsonc
npx wrangler kv namespace create CACHE        # copy id into wrangler.jsonc
npx wrangler d1 migrations apply portfolio-trips --remote
```

`ACCESS_AUD` in `wrangler.jsonc` is blank and must be filled in. It is the
**Application Audience (AUD) Tag** on the Overview tab of the Access application
set up in `private-pages.md`. The Worker refuses every request while it is
blank, rather than opening up.

The routing key is a secret, never a var:

```sh
npx wrangler secret put ORS_API_KEY
```

## Verifying before you deploy

```sh
npm test              # the pure core
npm run verify:worker # the API, end to end, against local D1
```

`verify-worker.mjs` generates an RSA keypair, serves the matching JWKS on
localhost and points the Worker at it, so signature checking, audience,
issuer, expiry and the owner-email check all run for real. It then exercises
create, read, list, the `If-Match` version conflict, an idempotent replay and
archiving. Nothing in it touches Cloudflare or the internet.

The one thing it cannot cover is the edge: whether Cloudflare Access itself
redirects a logged-out request before it reaches the Worker. Check that against
the deployed site.

```sh
curl -sI https://wianschoeman.com/build/api/trips | head -3   # expect a 302 to cloudflareaccess.com
```

## Deploying

`wrangler deploy` uploads `./dist`, which is whatever the working tree last
built, not what is committed. With uncommitted work in the tree it ships that
work. Build from a clean checkout of HEAD:

```sh
git worktree add --detach /tmp/pf-deploy HEAD
ln -s "$PWD/node_modules" /tmp/pf-deploy/node_modules
mkdir -p /tmp/pf-deploy/public/private && cp public/private/cx3-build.json /tmp/pf-deploy/public/private/
cd /tmp/pf-deploy && npm run build && npx wrangler deploy
```

This is the first deploy that carries a Worker script rather than assets alone.
Keep `npx wrangler rollback` to hand.
