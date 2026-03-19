// Prepend shebang to compiled CLI entry point and make it executable.
import { readFileSync, writeFileSync, chmodSync } from 'node:fs'

const entry = 'dist/bin/agent-env.js'
const content = readFileSync(entry, 'utf-8')
writeFileSync(entry, '#!/usr/bin/env node\n' + content)
chmodSync(entry, 0o755)
console.log(`✓ Shebang added to ${entry}`)
