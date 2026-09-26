# v1.0.0 release process

This process preserves the required `master → pre-release → release/v1.0.0` history and ensures the deployed commit matches the final release.

## 1. Cut pre-release

Start from the clean, pushed MVP:

```powershell
git checkout master
git pull origin master
git checkout -b pre-release
```

Apply the Step 15 package and make the documented logical commits. Then run:

```powershell
npm install
npm run db:generate
npm run test:typecheck
npm run test:unit
npm run build
git push -u origin pre-release
```

The `Release verification` GitHub Actions workflow must pass both jobs:

- Typecheck, 44 unit tests, and production build
- Fresh `docker compose up --build`, health checks, seed check, six real integration/concurrency scenarios

A green Docker job is the independent-environment Docker verification.

## 2. Record the walkthrough

Use the deployed production application and [the timed script](video-script.md). Keep the recording at or below six minutes.

Before recording:

- wake the Render API through `/health`;
- use a private browser session;
- reset the demo scenario to a clear state;
- hide bookmarks, notifications, credentials, `.env`, and provider dashboards;
- show the repository architecture and ERD;
- demonstrate passenger, driver, pooling, fare/status, and one edge case.

Upload through a free provider such as Loom or an accessible unlisted video. Confirm an evaluator can open the link without requesting permission.

Replace the pending video text in `README.md`, then commit on `pre-release`:

```powershell
git add README.md docs/submission-checklist.md
git commit -m "docs(video): add final walkthrough link"
git push origin pre-release
```

## 3. Final release check

After the video URL is committed:

```powershell
npm run release:check
git status
```

The working tree must be clean. Confirm GitHub Actions is green on the latest `pre-release` commit.

## 4. Cut the release branch

```powershell
git checkout pre-release
git pull origin pre-release
git checkout -b release/v1.0.0
git push -u origin release/v1.0.0
```

Do not add feature work directly to the release branch.

## 5. Align master and production

Merge the verified release back to `master` so Vercel's production deployment uses the same source:

```powershell
git checkout master
git merge --no-ff release/v1.0.0 -m "release: publish v1.0.0"
git push origin master
```

Wait for Render/Vercel deployment checks, then verify:

```text
Frontend: https://dhaka-tesla-pool-v2-web.vercel.app
API:      https://dhaka-tesla-pool-api-1h5u.onrender.com/health
```

## 6. Optional annotated tag

The branch is mandatory; an annotated tag improves discoverability:

```powershell
git tag -a v1.0.0 -m "Dhaka Tesla Pool v1.0.0"
git push origin v1.0.0
```

## 7. Final evidence

- `master`, `pre-release`, and `release/v1.0.0` exist remotely.
- Feature branch history remains visible.
- Both GitHub Actions jobs are green.
- Live frontend and API URLs work.
- README contains the live and video links.
- The public video is no longer than six minutes.
- `npm run release:check` passes.