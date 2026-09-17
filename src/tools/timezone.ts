import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { textResult } from '../lib/text-result'

const TIMEZONE_ALIASES: Record<string, string> = {
    seoul: 'Asia/Seoul',
    서울: 'Asia/Seoul',
    korea: 'Asia/Seoul',
    한국: 'Asia/Seoul',
    tokyo: 'Asia/Tokyo',
    도쿄: 'Asia/Tokyo',
    일본: 'Asia/Tokyo',
    japan: 'Asia/Tokyo',
    beijing: 'Asia/Shanghai',
    shanghai: 'Asia/Shanghai',
    china: 'Asia/Shanghai',
    베이징: 'Asia/Shanghai',
    상하이: 'Asia/Shanghai',
    중국: 'Asia/Shanghai',
    singapore: 'Asia/Singapore',
    싱가포르: 'Asia/Singapore',
    london: 'Europe/London',
    런던: 'Europe/London',
    uk: 'Europe/London',
    영국: 'Europe/London',
    paris: 'Europe/Paris',
    파리: 'Europe/Paris',
    france: 'Europe/Paris',
    프랑스: 'Europe/Paris',
    berlin: 'Europe/Berlin',
    베를린: 'Europe/Berlin',
    germany: 'Europe/Berlin',
    독일: 'Europe/Berlin',
    nyc: 'America/New_York',
    'new york': 'America/New_York',
    뉴욕: 'America/New_York',
    usa: 'America/New_York',
    미국: 'America/New_York',
    la: 'America/Los_Angeles',
    'los angeles': 'America/Los_Angeles',
    로스앤젤레스: 'America/Los_Angeles',
    chicago: 'America/Chicago',
    시카고: 'America/Chicago',
    utc: 'UTC',
    gmt: 'UTC'
}

function resolveTimeZone(location: string): string {
    const trimmed = location.trim()
    const alias =
        TIMEZONE_ALIASES[trimmed.toLowerCase()] ?? TIMEZONE_ALIASES[trimmed]
    if (alias) return alias

    try {
        Intl.DateTimeFormat('en-US', { timeZone: trimmed })
        return trimmed
    } catch {
        throw new Error(
            `알 수 없는 시간대입니다: ${location}. IANA 이름(예: Asia/Seoul)이나 도시명(예: 서울, London)을 입력하세요.`
        )
    }
}

function formatWorldTime(timeZone: string, locale: 'ko' | 'en'): string {
    const now = new Date()
    const dateTime = new Intl.DateTimeFormat(
        locale === 'ko' ? 'ko-KR' : 'en-US',
        {
            timeZone,
            dateStyle: 'full',
            timeStyle: 'long'
        }
    ).format(now)
    const offset =
        new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'shortOffset',
            hour: '2-digit'
        })
            .formatToParts(now)
            .find((part) => part.type === 'timeZoneName')?.value ?? ''

    return locale === 'ko'
        ? `${timeZone} 현재 시각: ${dateTime} (${offset})`
        : `Current time in ${timeZone}: ${dateTime} (${offset})`
}

export function registerTimezone(server: McpServer) {
    server.registerTool(
        'timezone',
        {
            title: '세계 시간',
            description:
                '도시, 국가, 또는 IANA 시간대 이름을 받아 해당 지역의 현재 세계 시간을 알려줍니다.',
            inputSchema: z.object({
                location: z
                    .string()
                    .describe(
                        '시간을 조회할 도시/국가/시간대 (예: 서울, New York, Asia/Tokyo, UTC)'
                    ),
                language: z
                    .enum(['ko', 'en'])
                    .optional()
                    .default('ko')
                    .describe('응답 언어 (기본값: ko)')
            }),
            outputSchema: z.object({
                content: z
                    .array(
                        z.object({
                            type: z.literal('text'),
                            text: z.string().describe('현재 시각')
                        })
                    )
                    .describe('현재 시각')
            })
        },
        async ({ location, language }) => {
            const timeZone = resolveTimeZone(location)
            return textResult(formatWorldTime(timeZone, language))
        }
    )
}
