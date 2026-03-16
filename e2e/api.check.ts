/**
 * Global setup — verifies the API is reachable before any tests run.
 *
 * The API is a .NET app that must be started manually:
 *   cd src/UpToU.API && dotnet watch run
 *
 * If the API is not running this script exits immediately with a clear message
 * rather than letting 70+ tests fail with cryptic "Login failed" errors.
 */
import http from 'http'

const API_HEALTH = 'http://localhost:5070/api/v1/auth/me'
const TIMEOUT_MS = 5_000

function ping(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const req = http.get(url, { timeout: TIMEOUT_MS }, () => resolve(true))
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

export default async function globalSetup() {
  const ok = await ping(API_HEALTH)
  if (!ok) {
    console.error('\n' +
      '╔══════════════════════════════════════════════════════════════╗\n' +
      '║  UpToU API is not running on http://localhost:5070           ║\n' +
      '║                                                              ║\n' +
      '║  Start it first:                                             ║\n' +
      '║    cd src/UpToU.API && dotnet watch run                      ║\n' +
      '║                                                              ║\n' +
      '║  Then re-run: npm run test:e2e                               ║\n' +
      '╚══════════════════════════════════════════════════════════════╝\n'
    )
    process.exit(1)
  }
  console.log('  ✓ API reachable at http://localhost:5070')
}
