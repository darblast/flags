## `@darblast/flags`

[![](https://img.shields.io/npm/v/@darblast/flags)](https://www.npmjs.com/package/@darblast/flags)
[![License: MIT](https://img.shields.io/github/license/darblast/flags)](https://github.com/darblast/flags/blob/master/LICENSE)
[![Node.js CI](https://github.com/darblast/flags/actions/workflows/node.js.yml/badge.svg)](https://github.com/darblast/flags/actions/workflows/node.js.yml)

Allows receiving typed parameters in the URL and manages parsing.

Provides traits for common flag types: booleans, strings, integers, floating point numbers, `Date`
objects, and JSON objects.

With this module you can easily create a global typed parameter that the user can pass in the query
part of the URL. For example, the following creates an integer flag:

```js
import { defineInt } from '@darblast/flags';

const paramFlag = defineInt(
  'param', // name of the flag.
  42, // default value in case it's not specified or parsing fails.
  'An optional description documenting the flag.'
);
```

The user can then specify it in the URL by visiting e.g. `www.example.com?param=123`.

Flags are parsed in response to the `DOMContentLoaded` event and can later be accessed with
`getValue`:

```js
function printParam() {
  console.log(paramFlag.getValue());
}
```
