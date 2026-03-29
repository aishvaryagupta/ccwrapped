# How the Plugin Marketplace Works

Think of it like an app store:

- **Marketplace** = the app store (a GitHub repo with a `marketplace.json` listing available plugins)
- **Plugin** = an app in that store

## The Flow

### 1. Add the marketplace

```
/plugin marketplace add https://github.com/aishvaryagupta/ccwrapped-plugin.git
```

"Add this app store to my phone." It clones the GitHub repo to your machine so Claude Code knows what plugins are available.

### 2. Install the plugin

```
/plugin install ccwrapped@ccwrapped-marketplace
```

"Install the app called `ccwrapped` from the store called `ccwrapped-marketplace`." Claude Code reads the marketplace.json, finds the plugin entry, downloads it to a local cache, and activates the hooks.

### 3. After install

The plugin's hooks fire on every session end, automatically syncing stats. No manual action needed.

## Repo Structure

In our case, it's a single repo doing double duty:

```
ccwrapped-plugin/
├── .claude-plugin/
│   ├── marketplace.json   ← "I am an app store, here's my catalog"
│   └── plugin.json        ← "I am also an app"
├── hooks/                  ← the actual plugin code
└── dist/
```

The `marketplace.json` says: "I have one plugin called `ccwrapped`, and its source is `./`" (i.e., this same repo). So the repo is both the store and the only app in it.

## Why Two Steps?

Claude Code's plugin system requires going through a marketplace — there's no "install from URL" shortcut. That's why you need both the `marketplace add` and `plugin install` steps.
