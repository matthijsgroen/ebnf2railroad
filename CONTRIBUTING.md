# Introduction

Thanks for taking the interest in making the `ebnf2railroad` tool even better!

# Your First Contribution

**Working on your first Pull Request?** You can learn how from this _free_ series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

# Prerequisites

- Node >= 11.0
- Yarn >= 1.12.0
- Watch (optional)

On mac, using [homebrew](https://brew.sh/): `brew install node yarn watch`

# Getting started

- Install dependencies: `yarn install`
- Run tests with: `yarn test`
- Check your syntax with: `yarn lint`
- Update example files with: `yarn update-examples`
- Generate new parser with: `yarn build-parser` (when you make changes in the ebnf.jison file)

The easiest development flow for browser related work is:

```
watch -n 1 'yarn build-parser; yarn update-examples'
```

This will continuously rebuild the parser and update the examples every second.
and then use `open examples/optimizations.html` to check the file in your browser.

Just mutate the code, and reload the browser for effect.

The easiest way for technical implementations like optimalisations is:

```
yarn test --watch
```

This will automatically rerun the tests when files change.
