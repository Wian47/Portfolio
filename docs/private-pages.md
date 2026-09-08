# Private pages

`/build` is owner-only. This is how it stays that way.

## How it works

The page component ships in the public bundle as a lazy chunk. It holds no content.
All the content lives in `public/private/cx3-build.json`, which the page fetches at
runtime. Two consequences follow.

The file is git-ignored, because this repository is public. It exists only on the
machine that builds the site, and `wrangler deploy` uploads it as a static asset.

The file is served from a predictable path, so Cloudflare Access can gate it. Without
that gate the JSON is readable by anyone who guesses the URL.

## Set up Cloudflare Access

Access is free for up to 50 users. One application covers both paths.

1. Cloudflare dashboard, then **Zero Trust**, then **Access controls**, then
   **Applications**, then **Add an application**, then **Self-hosted**.
2. Under **Destinations**, leave Subdomain blank, set Domain to `wianschoeman.com`,
   and set Path to `build`. The UI supplies the leading slash.
3. Click **Add public hostname** and add a second row with the same domain and Path
   `private`.
4. Under **Access policies**, **Create new policy**. Action **Allow**, Include rule
   **Emails**, value `wian.schoeman1@gmail.com`.
5. Under **Authentication**, leave **Accept all available identity providers** on and
   turn **Apply instant authentication** on.
6. Under **Details**, set Session Duration to **1 month**.
7. **Create**.

Both destinations are required. The first gates the page, the second gates the JSON
the page fetches. Protecting a path also protects everything beneath it, so `private`
covers `/private/cx3-build.json`.

Do not use the **Add Workers** destination type. It targets the whole Worker, which
would put the entire portfolio behind a login.

## Prove it is actually protected

Cloudflare Access is the correct product here, but confirm it reaches Workers static
assets on your account rather than assuming it does. From a machine that is not
logged in, or a private window:

```
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://wianschoeman.com/private/cx3-build.json
```

A `302` to a `cloudflareaccess.com` login URL means the gate is live. A `200` with
JSON means it is not, and the content is public. Do not skip this check.

## Editing the content

Edit `public/private/cx3-build.json`, then `npm run build && npx wrangler deploy`.
The shape is typed as `BuildDoc` in `types.ts`. Task `status` is `done`, `quoted` or
`todo`; `done` seeds the initial tick state. Ticks themselves live in `localStorage`
under `cx3-build-progress`, so they are per-browser and never leave the device.

Back the file up, since git does not hold it:

```
gh gist create public/private/cx3-build.json --desc 'CX-3 build content'
```

## Adding another private page

Add the route to `PRIVATE_ROUTES` in `index.tsx`, put its content under
`public/private/`, and add the new path to the Access application.
