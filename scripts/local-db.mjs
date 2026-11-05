// Starts a local PostgreSQL server without Docker, using the embedded-postgres package.
// Data lives in ./.pgdata (git-ignored). Stop with Ctrl+C.
//
//   npm run db:local
//
// Connection string: postgres://postgres:postgres@127.0.0.1:5433/go_travels
import EmbeddedPostgres from 'embedded-postgres'
import fs from 'node:fs'
import path from 'node:path'

const port = Number(process.env.PGPORT || 5433)
const databaseDir = path.resolve('.pgdata')
const firstRun = !fs.existsSync(path.join(databaseDir, 'PG_VERSION'))

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'postgres',
  password: 'postgres',
  port,
  persistent: true,
})

if (firstRun) await pg.initialise()
await pg.start()

try {
  await pg.createDatabase('go_travels')
} catch {
  // Database already exists.
}

console.log(`\nPostgres ready: postgres://postgres:postgres@127.0.0.1:${port}/go_travels\n`)

const stop = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
