# Plasmo Persistent runtime

This library contains a couple of hacks to keep the BGSW alive for MV3 transitioning.

Usage in a background service worker:

```ts
import { keepAlive } from "@plasmohq/persistent/background"

keepAlive()
```
