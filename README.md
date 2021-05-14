# \<handwriting-textarea>

[![Node.js CI](https://github.com/christianliebel/handwriting-textarea/actions/workflows/node.js.yml/badge.svg)](https://github.com/christianliebel/handwriting-textarea/actions/workflows/node.js.yml)

A webcomponent that allows users to enter text by handwriting.
In order to use this component, your target platform (i.e., browser and operating system) needs to support the Handwriting Recognition API.

## Installation
```bash
npm i handwriting-textarea
```

## Usage
```html
<script type="module">
  import 'handwriting-textarea/handwriting-textarea.js';
</script>

<handwriting-textarea></handwriting-textarea>
```

## Supported attributes

* `languages`: Comma-separated list of languages that should be recognized (default: `en`).
* `recognitiontype`: The type of content to be recognized (`text`, `email`, `number`, `per-character`).
* `value`: The value to show in the editor control.

## Linting with ESLint, Prettier, and Types
To scan the project for linting errors, run
```bash
npm run lint
```

You can lint with ESLint and Prettier individually as well
```bash
npm run lint:eslint
```
```bash
npm run lint:prettier
```

To automatically fix many linting errors, run
```bash
npm run format
```

You can format using ESLint and Prettier individually as well
```bash
npm run format:eslint
```
```bash
npm run format:prettier
```


## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Local Demo with `web-dev-server`
```bash
npm start
```
To run a local development server that serves the basic demo located in `demo/index.html`
