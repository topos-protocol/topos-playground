<div id="top" />
<br />
<div align="center">
  <img src="./.github/assets/topos_logo.png#gh-light-mode-only" alt="Logo" width="200">
  <img src="./.github/assets/topos_logo_dark.png#gh-dark-mode-only" alt="Logo" width="200">
  <br />
  <p align="center">
  <b>Topos Playground</b> is the CLI to run a local devnet to test the Topos ecosystem 🚀
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

If you installed the package manually, you can run it like so

```
$ topos-playground [start|clean]
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
