import { createMcpHandler } from 'mcp-handler'
import {
    registerMcpFeatures,
    SERVER_NAME,
    SERVER_VERSION
} from '@/src/register'

export const runtime = 'nodejs'
export const maxDuration = 60

const handler = async (request: Request) => {
    const hfToken =
        request.headers.get('x-hf-token')?.trim() || process.env.HF_TOKEN

    const mcpHandler = createMcpHandler(
        (server) => {
            registerMcpFeatures(server, { hfToken })
        },
        {
            serverInfo: {
                name: SERVER_NAME,
                version: SERVER_VERSION
            }
        },
        {
            basePath: '/api',
            disableSse: true,
            verboseLogs: process.env.NODE_ENV !== 'production'
        }
    )

    return mcpHandler(request)
}

export { handler as GET, handler as POST, handler as DELETE }
