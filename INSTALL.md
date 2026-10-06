# Install Espresso

See [README.md](README.md#install) for each harness’s actual capabilities and
installation commands. GitHub hosts the Claude/Codex marketplace and the Pi
package source; no separate marketplace submission is required.

The adapter installer previews its complete file list by default:

```sh
node src/hooks/install.js omp
node src/hooks/install.js pi
node src/hooks/install.js codex
```

Add `--apply` only for the intended harness. Conflicting files cause an error;
existing settings, providers, credentials and companion plugins are untouched.
The installer includes all six bundled Ponytail skills. OMP/Pi load its runtime
through Espresso's extension, enabled in full mode by default. Existing
Ponytail default-mode preferences are respected. Keep this checkout in place
when using a local extension reference. Do not load a standalone Ponytail
extension at the same time: both register the same commands.

Claude Code loads the checkout with `claude --plugin-dir /absolute/path/to/espresso`.
Pi can install the package with `pi install /absolute/path/to/espresso`.
Codex requires a configured marketplace and trust approval for bundled hooks.

## Existing Espresso 1.x installations

Updating the plugin no longer downloads companions or rewrites global settings.
It does not remove previously installed global rules, RTK/GitNexus hooks or
Caveman/Ponytail settings. Those files may now contain user changes; back them
up and review ownership before modifying them. Do not run blanket `rm` commands
against global rules or companion configuration.

## Upgrading from 2.1

Espresso 2.2 removes the model ladder: delegated work keeps the session model.
Earlier `install.js omp|codex --apply` runs created `espresso-sol`,
`espresso-terra` and `espresso-luna` agents pinned to lower GPT models. They
are no longer generated; remove them by hand if you no longer want them
(`~/.omp/agent/agents/espresso-*.md`, `~/.codex/agents/espresso-*.toml`).

## GitNexus

Espresso ships no GitNexus reindex hook. If you keep your own:

- Reindex only after a commit, when `.gitnexus/meta.json` `lastCommit` differs
  from `HEAD`, never on a dirty tree. Each rebuild swaps the store under every
  open `gitnexus mcp` server.
- Run one `gitnexus analyze --index-only` at a time, in the background, with
  its output in a log file rather than `/dev/null`.
- List submodules and vendored code in `.gitnexusignore`: an indexed submodule
  can multiply graph size and rebuild time.
- If the MCP server dropped during a rebuild, reconnect it with `/mcp`.

## Remove the local adapter

Use the preview list to identify the files created for the selected harness.
Remove only files still owned by Espresso, then restart that harness. A package
installed by a harness should be removed by that harness's package manager.
No model roles or credential configuration needs restoring because the installer
does not change them.
