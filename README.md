<div id="top" />
<br />
<div align="center">
  <img src="./.github/assets/topos_logo.png#gh-light-mode-only" alt="Logo" width="200">
  <img src="./.github/assets/topos_logo_dark.png#gh-dark-mode-only" alt="Logo" width="200">
  <br />
  <p align="center">
  <b>Topos Playground</b> is a CLI make it simple to run a local Topos devnet 🚀
  </p>
  <br />
</div>

## Getting Started

### Requirements

- Git
- NodeJS (tested with 16+)
- Docker

### [Optional] Install the package globally

```
$ npm install -g @topos-protocol/topos-playground
```

### Run the CLI

If you have installed the package manually, you can run it like so:

```
$ topos-playground --help
```

The playground respects XDG Base Directory Specifications, so by default, it will store
data used while running in `$HOME/.local/share/topos-playground` and it will store logs
in `$HOME/.state/topos-playground/logs`.

To override these default locations, you can set your `HOME`, `XDG_DATA_HOME` and `XDG_STATE_HOME`
environment variables, or specify them in a `.env` file.

```
$ HOME=/tmp topos-playground start
```

By default, topos-playground sends output to both your console and to a log file when it is running.
To disable this, you can use the `--quiet` flag to prevent output from going to the console, or the
`--no-log` flag to prevent output from going to the log file.

```
$ topos-playground start --quiet
```

Otherwise, you can use `npx` to abstract the installation

```
$ npx @topos-protocol/topos-plaground [start|clean]
```

## Development

### Build

```
npm run build
```

### Rum

```
node dist/main [start|clean]
```
