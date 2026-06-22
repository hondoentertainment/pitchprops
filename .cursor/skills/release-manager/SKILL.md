---
name: release-manager
description: Cuts PitchProps releases — bumps the version, finalizes the ROADMAP.md changelog, and ships to GitHub and Vercel. Use when the user asks to release, ship, cut a version, deploy to production, or publish the app.
---

# Release Manager

Turns verified work into a shipped release. Only runs after `qa-verifier` gives a
✅ verdict.

## Preconditions

```
- [ ] qa-verifier verdict is ✅ (lint + build pass, smoke test clean)
- [ ] ROADMAP.md reflects what's actually shipping
- [ ] Working tree reviewed (git status / git diff)
```

## Release workflow

```
- [ ] 1. Decide version bump (semver): patch/minor/major
- [ ] 2. Bump "version" in package.json
- [ ] 3. Update ROADMAP.md: Current version, Last updated, move ✅ rows, add changelog line
- [ ] 4. Commit (only when the user asks to commit) using conventional commit
- [ ] 5. Deploy to GitHub + Vercel production
- [ ] 6. Report the deployment URL
```

### Versioning

- **patch** — bug fixes, no new user-facing features.
- **minor** — new feature(s), backward compatible (most releases here).
- **major** — breaking change to saved data shape or core UX.

When the saved store shape changes, also bump the `persist` name/version in
`src/lib/store.ts` (currently `soccer-props-store-v1`) to avoid corrupting users'
saved bankrolls, and note it in the changelog.

### Commit message (conventional)

Only commit when explicitly asked. Use a HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
feat(release): vX.Y.Z — <short summary>

- <highlight 1>
- <highlight 2>
EOF
)"
```

### Deploy

Prefer the existing **`gv`** skill (GitHub + Vercel production) if the user has it.
Otherwise:

```bash
git push
vercel --prod
```

Never force-push to main. Don't commit `.env*` files or secrets.

## Report format

```markdown
## Released vX.Y.Z
- Changelog: [summary]
- GitHub: pushed to [branch]
- Vercel: [production URL]
```

Then notify `roadmap-agent` to baseline the next cycle.
