# Install Espresso 2.0

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
Keep this checkout in place when using a local extension reference.

Claude Code loads the checkout with `claude --plugin-dir /absolute/path/to/espresso`.
Pi can install the package with `pi install /absolute/path/to/espresso`.
Codex requires a configured marketplace and trust approval for bundled hooks.

## Existing Espresso 1.x installations

Updating the plugin stops new automatic installation/configuration actions.
It does not remove previously installed global rules, RTK/GitNexus hooks or
Caveman/Ponytail settings. Those files may now contain user changes; back them
up and review ownership before modifying them. Do not run blanket `rm` commands
against global rules or companion configuration.

## Remove the local adapter

Use the preview list to identify the files created for the selected harness.
Remove only files still owned by Espresso, then restart that harness. A package
installed by a harness should be removed by that harness's package manager.
No model roles or credential configuration needs restoring because the installer
does not change them.
