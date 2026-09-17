import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { fetchJson } from '../lib/fetch-json'
import { textResult } from '../lib/text-result'

const WMO_WEATHER_CODES: Record<number, string> = {
    0: '맑음',
    1: '대체로 맑음',
    2: '부분적으로 흐림',
    3: '흐림',
    45: '안개',
    48: '착빙 안개',
    51: '약한 이슬비',
    53: '이슬비',
    55: '강한 이슬비',
    56: '약한 어는 이슬비',
    57: '강한 어는 이슬비',
    61: '약한 비',
    63: '비',
    65: '강한 비',
    66: '약한 어는 비',
    67: '강한 어는 비',
    71: '약한 눈',
    73: '눈',
    75: '강한 눈',
    77: '싸라기눈',
    80: '약한 소나기',
    81: '소나기',
    82: '강한 소나기',
    85: '약한 눈 소나기',
    86: '강한 눈 소나기',
    95: '뇌우',
    96: '약한 우박을 동반한 뇌우',
    99: '강한 우박을 동반한 뇌우'
}

type ForecastResponse = {
    current?: {
        time?: string
        temperature_2m?: number
        relative_humidity_2m?: number
        weather_code?: number
        wind_speed_10m?: number
    }
}

export function registerGetWeather(server: McpServer) {
    server.registerTool(
        'getWeather',
        {
            title: '겟웨더',
            description:
                '위도·경도 좌표로 Open-Meteo에서 현재 날씨를 조회합니다. 좌표는 geocode 도구 결과를 사용하세요.',
            inputSchema: z.object({
                latitude: z.number().describe('위도'),
                longitude: z.number().describe('경도')
            }),
            outputSchema: z.object({
                content: z
                    .array(
                        z.object({
                            type: z.literal('text'),
                            text: z.string().describe('현재 날씨')
                        })
                    )
                    .describe('현재 날씨')
            })
        },
        async ({ latitude, longitude }) => {
            const url = new URL('https://api.open-meteo.com/v1/forecast')
            url.searchParams.set('latitude', String(latitude))
            url.searchParams.set('longitude', String(longitude))
            url.searchParams.set(
                'current',
                'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
            )
            url.searchParams.set('timezone', 'auto')

            const data = await fetchJson<ForecastResponse>(url.toString())
            const current = data.current
            if (!current) {
                throw new Error(
                    `날씨 정보를 가져올 수 없습니다: ${latitude}, ${longitude}`
                )
            }

            const condition =
                current.weather_code === undefined
                    ? '알 수 없음'
                    : (WMO_WEATHER_CODES[current.weather_code] ??
                      `기타 (코드 ${current.weather_code})`)

            const text = [
                `좌표: ${latitude}, ${longitude}`,
                `시각: ${current.time ?? '알 수 없음'}`,
                `날씨: ${condition}`,
                `기온: ${current.temperature_2m ?? '알 수 없음'}°C`,
                `습도: ${current.relative_humidity_2m ?? '알 수 없음'}%`,
                `풍속: ${current.wind_speed_10m ?? '알 수 없음'} km/h`
            ].join('\n')

            return textResult(text)
        }
    )
}
