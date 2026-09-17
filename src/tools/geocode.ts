import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { fetchJson } from '../lib/fetch-json'
import { textResult } from '../lib/text-result'

type GeocodeHit = {
    name: string
    country?: string
    admin1?: string
    latitude: number
    longitude: number
}

type GeocodeResponse = {
    results?: GeocodeHit[]
}

export function registerGeocode(server: McpServer) {
    server.registerTool(
        'geocode',
        {
            title: '지오코드',
            description:
                '주소나 도시 이름을 입력하면 Open-Meteo로 해당 위치의 위도·경도를 조회합니다.',
            inputSchema: z.object({
                query: z.string().describe('검색할 주소 또는 도시 이름'),
                count: z
                    .number()
                    .int()
                    .min(1)
                    .max(10)
                    .optional()
                    .default(5)
                    .describe('반환할 후보 개수 (1–10, 기본값: 5)'),
                language: z
                    .enum(['ko', 'en'])
                    .optional()
                    .default('ko')
                    .describe('결과 언어 (기본값: ko)')
            }),
            outputSchema: z.object({
                content: z
                    .array(
                        z.object({
                            type: z.literal('text'),
                            text: z.string().describe('위도 경도 목록')
                        })
                    )
                    .describe('위도 경도 목록')
            })
        },
        async ({ query, count, language }) => {
            const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
            url.searchParams.set('name', query)
            url.searchParams.set('count', String(count))
            url.searchParams.set('language', language)

            const data = await fetchJson<GeocodeResponse>(url.toString())
            const results = data.results ?? []
            if (results.length === 0) {
                throw new Error(`위치를 찾을 수 없습니다: ${query}`)
            }

            const text = results
                .map((place, index) => {
                    const region = [place.admin1, place.country]
                        .filter(Boolean)
                        .join(', ')
                    const label = region
                        ? `${place.name} (${region})`
                        : place.name
                    return `${index + 1}. ${label}: ${place.latitude}, ${place.longitude}`
                })
                .join('\n')

            return textResult(text)
        }
    )
}
