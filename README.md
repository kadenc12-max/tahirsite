# Tahir Russell – Media & Communications

One-page portfolio site for Tahir Russell, media producer and digital marketing strategist, with a password-protected editor at `/saturdaynightlive`.

The public site is plain HTML, CSS and JavaScript. The editor uses a few small Vercel serverless functions (in `api/`) that save changes as commits to this repo, which makes Vercel redeploy the site.

| File | What it is |
|---|---|
| `content.json` | **All the words, colors, stats, jobs, clips and skills.** The editor changes this file. |
| `index.html` | The homepage. Generated from `content.json`; don't edit by hand. |
| `lib/render.js` | Turns `content.json` into `index.html`. Page layout lives here. |
| `styles.css` | Colors for light and dark themes, layout, animations |
| `script.js` | Theme toggle, click-to-play clips, skills departure board |
| `headshot.jpg` | Hero photo, 480×480 square |
| `saturdaynightlive/` | The editor page |
| `api/` | Editor backend: login, load content, save |
| `scripts/build.mjs` | Rebuilds `index.html` after editing `content.json` or `lib/render.js` by hand |
| `scripts/dev-server.mjs` | Runs the site and editor on your computer |
| `fonts.html`, `stats.html`, `skills.html` | Design test pages |

## The editor

Go to `/saturdaynightlive` on the live site and log in. Everything on the page can be changed: accent color, heading font, all text, stats, jobs and their YouTube clips, the skills board, and the headshot. The preview on the right updates as you type. **Save** commits the change to GitHub, and the live site updates about a minute later. Every save is in the repo's history, so any change can be undone there.

### One-time setup on Vercel

The editor needs five environment variables. In Vercel, open the project, then go to **Settings → Environment Variables** and add these for **Production**:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | The editor password. At least 12 characters; a long passphrase is best. |
| `SESSION_SECRET` | A random string of at least 32 characters. Make one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `GITHUB_TOKEN` | A fine-grained GitHub token (see below) |
| `GITHUB_REPO` | `kadenc12-max/tahirsite` |
| `GITHUB_BRANCH` | `main` |

To make the GitHub token: GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Set **Repository access** to *Only select repositories* → `tahirsite`, and under **Permissions → Repository permissions** set **Contents** to *Read and write*. Nothing else is needed.

After adding the variables, redeploy once (Deployments → ⋯ on the latest → Redeploy) so the functions pick them up.

Changing the password later: edit `ADMIN_PASSWORD` in Vercel and redeploy. To log everyone out at once, change `SESSION_SECRET` too.

### Security notes

- The password is checked on the server. It's never in the page or the repo.
- Logins last 12 hours, in a cookie that page scripts can't read.
- Each wrong password waits a moment before replying, to slow down guessing.
- Requests from other websites are refused.
- Everything typed into the editor is escaped, so it shows as text and can't inject code.
- A save is refused if the site changed since the editor was opened, so one person can't overwrite another's edits.
- The editor URL is hidden from search engines, but the password is what protects it.

### Trying the editor on your computer

```powershell
$env:ADMIN_PASSWORD = 'pick-a-local-password'; $env:SESSION_SECRET = 'any-32-plus-character-string-for-local-use'; node scripts/dev-server.mjs
```

Open http://localhost:3000/saturdaynightlive. Local saves write straight to the files in this folder instead of GitHub, so check them with `git diff` before committing.

### Editing by hand

Change `content.json` (or `lib/render.js` for layout), then run `node scripts/build.mjs` to regenerate `index.html`, and commit both.
