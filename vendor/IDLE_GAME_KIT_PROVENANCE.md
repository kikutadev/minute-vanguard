# idle-game-kit vendored package provenance

- Source repository: `https://github.com/kikutadev/idle-game-kit.git`
- Source commit: `6d7af6e`
- Package version: `0.2.0`
- Build command: `pnpm build:kit`
- Vendored from the built package at the local source commit above. The source commit is intentionally local-only until the current product work is reviewed.
- Reason for vendoring: `idle-game-kit` is not yet published as an installable registry package. Minute Vanguard must remain independently buildable and must not depend on a sibling worktree.

When the kit is published to a package registry, replace this vendored package with an immutable registry version and remove this vendored directory.
