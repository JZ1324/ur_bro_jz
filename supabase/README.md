# Private Archive Setup

Private photos must not be committed to this repo. Keep them in a non-public Supabase Storage bucket and let the Edge Function return short-lived signed URLs after it verifies the access key.

Current Supabase project:

```text
Name: JZ's about me
Ref: uajpewjagduzdpwlynrv
Function: https://uajpewjagduzdpwlynrv.supabase.co/functions/v1/get-private-archive
Bucket: private-archive
```

## 1. Create Storage Bucket

Create a Supabase Storage bucket named `private-archive` with `public = false`.

Recommended layout:

```text
private-archive/
  metadata/
    school.json
    music.json
    leadership.json
  photos/
    school/...
    music/...
    leadership/...
```

Manifest shape for each `metadata/<section>.json`:

```json
{
  "id": "school",
  "title": "School Archive",
  "subtitle": "Coursework, learning goals, and study notes",
  "summary": "Private section summary shown after the access key is accepted.",
  "items": [
    "Private note one.",
    "Private note two."
  ],
  "photos": [
    {
      "id": "example-photo",
      "alt": "Private archive image",
      "caption": "Private caption.",
      "path": "photos/<section>/<file-name>"
    }
  ]
}
```

Do not put real private captions, filenames, or photos in `src/`, `public/`, or committed docs.

## 2. Set Secrets

Generate a SHA-256 hash of the access key:

```bash
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update(process.argv[1]).digest('hex'))" "your-access-key"
```

Set Supabase Edge Function secrets:

```bash
supabase secrets set ARCHIVE_ACCESS_KEY_HASH="paste-hash-here"
supabase secrets set SECRET_NAME_HASH="paste-normalized-name-hash-here"
supabase secrets set SECRET_NAME_REVEAL="paste-display-name-here"
supabase secrets set ARCHIVE_BUCKET="private-archive"
supabase secrets set SIGNED_URL_TTL_SECONDS="600"
supabase secrets set ALLOWED_ORIGINS="https://your-site.example,http://localhost:3000"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to hosted Edge Functions by Supabase. The service role key must never appear in frontend code.

## 3. Deploy Function

The function uses its own access-key check, so deploy it as a public Edge Function with JWT verification disabled:

```bash
supabase functions deploy get-private-archive --no-verify-jwt
supabase functions deploy check-secret-name --no-verify-jwt
```

The endpoint will be:

```text
https://uajpewjagduzdpwlynrv.supabase.co/functions/v1/get-private-archive
```

## 4. Configure Vite

Set either value in the frontend environment:

```bash
VITE_SUPABASE_URL="https://uajpewjagduzdpwlynrv.supabase.co"
```

or:

```bash
VITE_SUPABASE_FUNCTION_URL="https://uajpewjagduzdpwlynrv.supabase.co/functions/v1/get-private-archive"
```

The app fails closed when neither value is configured.
