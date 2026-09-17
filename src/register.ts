import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { McpContext } from './lib/mcp-context'
import { registerCodeReviewPrompt } from './prompts/code-review'
import { registerBrickResources } from './resources/brick'
import { registerCalculator } from './tools/calculator'
import { registerGenerateImage } from './tools/generate-image'
import { registerGeocode } from './tools/geocode'
import { registerGetWeather } from './tools/get-weather'
import { registerGreet } from './tools/greet'
import { registerTimezone } from './tools/timezone'

export const SERVER_NAME = 'typescript-mcp-server'
export const SERVER_VERSION = '1.0.0'
export type { McpContext }

export function registerMcpFeatures(
    server: McpServer,
    context: McpContext = {}
) {
    registerGreet(server)
    registerCalculator(server)
    registerTimezone(server)
    registerGeocode(server)
    registerGetWeather(server)
    registerGenerateImage(server, context)
    registerCodeReviewPrompt(server)
    registerBrickResources(server)
}
