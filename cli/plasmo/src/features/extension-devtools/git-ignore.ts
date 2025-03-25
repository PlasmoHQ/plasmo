export const generateGitIgnore = () => `
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

#cache
.turbo
.next
.vercel

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*


# local env files
.env*

out/
build/
dist/

# plasmo - https://www.plasmo.com
.plasmo

# bpp - https://github.com/marketplace/actions/browser-platform-publisher
keys.json

# typescript
.tsbuildinfo
`
