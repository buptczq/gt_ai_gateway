import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import config, { DB_CONFIG, SERVER_CONFIG, TEST_OPTIONS, WORKER_CONFIG, TEST_MODE, logTest } from './config'
import { init as initLocalDB, cleanup as cleanupLocalDB } from './helpers/dbHelper'
import { startMockServer, stopMockServer } from './helpers/mockServer'

let testServerProcess: ChildProcess | null = null
let mockServerProcess: any | null = null

export async function setup(): Promise<void> {
    console.log('=== Test Environment Setup ===')
    console.log('[GLOBAL_SETUP] setup() called at', new Date().toISOString())
    console.log('[GLOBAL_SETUP] Test mode:', TEST_MODE)

    const isWorkerMode = TEST_MODE === 'worker'

    if (isWorkerMode) {
        console.log('[GLOBAL_SETUP] Worker mode: D1 database managed by wrangler, no local init needed')
    } else {
        cleanupTestDatabaseFile()
        console.log('[GLOBAL_SETUP] Database file deleted')

        console.log('Initializing test database...')
        await initLocalDB()
        console.log('[GLOBAL_SETUP] Database initialized')
    }

    if (config.useMockServer) {
        console.log('Starting mock AI server...')
        mockServerProcess = await startMockServer()
        console.log('[GLOBAL_SETUP] Mock AI server started')
    }

    await startTestServer()
    console.log('[GLOBAL_SETUP] Test server started')

    console.log('Test environment ready!')
}

export async function teardown(): Promise<void> {
    console.log('=== Test Environment Teardown ===')
    console.log('[GLOBAL_TEARDOWN] teardown() called at', new Date().toISOString())

    await stopTestServer()
    console.log('[GLOBAL_TEARDOWN] Test server stopped')

    if (mockServerProcess) {
        await stopMockServer(mockServerProcess)
        mockServerProcess = null
        console.log('[GLOBAL_TEARDOWN] Mock AI server stopped')
    }

    if (TEST_OPTIONS.cleanup) {
        const isWorkerMode = TEST_MODE === 'worker'

        if (isWorkerMode) {
            console.log('[GLOBAL_TEARDOWN] Worker mode: D1 database cleanup skipped (managed by wrangler)')
        } else {
            console.log('Cleaning up test database...')
            await cleanupLocalDB()
            cleanupTestDatabaseFile()
            console.log('[GLOBAL_TEARDOWN] Database cleaned up and file deleted')
        }
    }

    console.log('Test environment teardown complete!')
}

function startTestServer(): Promise<void> {
    return new Promise((resolve, reject) => {
        const isWorkerMode = TEST_MODE === 'worker'

        let command: string[]
        let env: NodeJS.ProcessEnv = { ...process.env }

        if (isWorkerMode) {
            // Worker mode: use wrangler dev
            command = ['wrangler', 'dev', '--local', '--port', SERVER_CONFIG.port.toString()]
            env.PORT = SERVER_CONFIG.port.toString()
        } else {
            // Node mode: use tsx src/local.ts
            const serverPath = join(process.cwd(), 'src', 'local.ts')
            command = ['tsx', serverPath]
            env.PORT = SERVER_CONFIG.port.toString()
            env.DB_PATH = DB_CONFIG.path
        }

        console.log(`Starting test server in ${TEST_MODE} mode on port ${ SERVER_CONFIG.port}`)
        if (!isWorkerMode) {
            console.log('Database path:', DB_CONFIG.path)
        }

        testServerProcess = spawn('npx', command, {
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
        })

        let serverStarted = false

        testServerProcess.stdout?.on('data', (data) => {
            const output = data.toString().trim()
            if (TEST_OPTIONS.verbose) {
                console.log('[SERVER]', output)
            }
            // 监听服务器启动成功的消息
            if (!serverStarted) {
                if (isWorkerMode) {
                    // Wrangler dev typically outputs something like:
                    // "Ready on http://localhost:8787" or contains "Ready"
                    if (output.includes('Ready') || output.includes('localhost:' + SERVER_CONFIG.port)) {
                        serverStarted = true
                        resolve()
                    }
                } else {
                    if (output.includes('Starting server on')) {
                        serverStarted = true
                        resolve()
                    }
                }
            }
        })

        testServerProcess.stderr?.on('data', (data) => {
            const error = data.toString().trim()
            // Some wrangler output goes to stderr but is not an error
            if (isWorkerMode && (error.includes('⛅️') || error.includes('http://'))) {
                if (TEST_OPTIONS.verbose) {
                    console.log('[SERVER INFO]', error)
                }
                if (!serverStarted && error.includes('Ready') || error.includes('localhost:' + SERVER_CONFIG.port)) {
                    serverStarted = true
                    resolve()
                }
                return
            }
            console.error('[SERVER ERROR]', error)
            reject(new Error(error))
        })

        testServerProcess.on('error', (err) => {
            reject(err)
        })

        // 设置超时 - worker mode needs more time
        const timeout = isWorkerMode ? WORKER_CONFIG.startupTimeout : 3000
        setTimeout(() => {
            if (!serverStarted) {
                reject(new Error(`Server startup timeout (${timeout}ms)`))
            }
        }, timeout)
    })
}

function stopTestServer(): Promise<void> {
    return new Promise((resolve) => {
        if (testServerProcess) {
            console.log('Stopping test server...')
            testServerProcess.kill('SIGTERM')
            testServerProcess = null
        }
        resolve()
    })
}

function cleanupTestDatabaseFile(): void {
    const isWorkerMode = TEST_MODE === 'worker'

    if (isWorkerMode) {
        // Worker mode uses D1, no local file to delete
        console.log('[WORKER_MODE] Using D1 database, no local file to delete')
        return
    }

    if (existsSync(DB_CONFIG.path)) {
        console.log('Removing test database file:', DB_CONFIG.path)
        unlinkSync(DB_CONFIG.path)
    }
}
