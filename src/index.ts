import {
    McpServer,
    ResourceTemplate
} from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { InferenceClient } from '@huggingface/inference'
import { z } from 'zod'

const SERVER_NAME = 'typescript-mcp-server'
const SERVER_VERSION = '1.0.0'

const server = new McpServer(
    {
        name: SERVER_NAME,
        version: SERVER_VERSION
    },
    {
        capabilities: {
            tools: {},
            resources: {},
            prompts: {}
        }
    }
)

server.registerTool(
    'greet',
    {
        description: '이름과 언어를 입력하면 인사말을 반환합니다.',
        inputSchema: z.object({
            name: z.string().describe('인사할 사람의 이름'),
            language: z
                .enum(['ko', 'en'])
                .optional()
                .default('en')
                .describe('인사 언어 (기본값: en)')
        }),
        outputSchema: z.object({
            content: z
                .array(
                    z.object({
                        type: z.literal('text'),
                        text: z.string().describe('인사말')
                    })
                )
                .describe('인사말')
        })
    },
    async ({ name, language }) => {
        const greeting =
            language === 'ko'
                ? `안녕하세요, ${name}님!`
                : `Hey there, ${name}! 👋 Nice to meet you!`

        return {
            content: [
                {
                    type: 'text' as const,
                    text: greeting
                }
            ],
            structuredContent: {
                content: [
                    {
                        type: 'text' as const,
                        text: greeting
                    }
                ]
            }
        }
    }
)

server.registerTool(
    'calculator',
    {
        title: '계산기',
        description: '두 숫자의 사칙연산(덧셈, 뺄셈, 곱셈, 나눗셈)을 계산합니다.',
        inputSchema: z.object({
            operation: z
                .enum(['add', 'subtract', 'multiply', 'divide'])
                .describe('수행할 연산 (add, subtract, multiply, divide)'),
            a: z.number().describe('첫 번째 숫자'),
            b: z.number().describe('두 번째 숫자')
        }),
        outputSchema: z.object({
            content: z
                .array(
                    z.object({
                        type: z.literal('text'),
                        text: z.string().describe('계산 결과')
                    })
                )
                .describe('계산 결과')
        })
    },
    async ({ operation, a, b }) => {
        let result: number
        switch (operation) {
            case 'add':
                result = a + b
                break
            case 'subtract':
                result = a - b
                break
            case 'multiply':
                result = a * b
                break
            case 'divide':
                if (b === 0) throw new Error('0으로 나눌 수 없습니다')
                result = a / b
                break
        }

        const operationSymbols = {
            add: '+',
            subtract: '-',
            multiply: '×',
            divide: '÷'
        } as const

        const text = `${a} ${operationSymbols[operation]} ${b} = ${result}`

        return {
            content: [
                {
                    type: 'text' as const,
                    text
                }
            ],
            structuredContent: {
                content: [
                    {
                        type: 'text' as const,
                        text
                    }
                ]
            }
        }
    }
)

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
    const alias = TIMEZONE_ALIASES[trimmed.toLowerCase()] ?? TIMEZONE_ALIASES[trimmed]
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
        const text = formatWorldTime(timeZone, language)

        return {
            content: [
                {
                    type: 'text' as const,
                    text
                }
            ],
            structuredContent: {
                content: [
                    {
                        type: 'text' as const,
                        text
                    }
                ]
            }
        }
    }
)

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

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`요청 실패 (HTTP ${response.status}): ${url}`)
    }
    return (await response.json()) as T
}

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

type ForecastResponse = {
    current?: {
        time?: string
        temperature_2m?: number
        relative_humidity_2m?: number
        weather_code?: number
        wind_speed_10m?: number
    }
}

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
                const label = region ? `${place.name} (${region})` : place.name
                return `${index + 1}. ${label}: ${place.latitude}, ${place.longitude}`
            })
            .join('\n')

        return {
            content: [
                {
                    type: 'text' as const,
                    text
                }
            ],
            structuredContent: {
                content: [
                    {
                        type: 'text' as const,
                        text
                    }
                ]
            }
        }
    }
)

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

        return {
            content: [
                {
                    type: 'text' as const,
                    text
                }
            ],
            structuredContent: {
                content: [
                    {
                        type: 'text' as const,
                        text
                    }
                ]
            }
        }
    }
)

server.registerTool(
    'generate-image',
    {
        title: '이미지 생성',
        description:
            'HuggingFace Inference API(FLUX.1-schnell)로 텍스트 프롬프트에서 이미지를 생성합니다.',
        inputSchema: z.object({
            prompt: z.string().describe('이미지 생성 프롬프트'),
            num_inference_steps: z
                .number()
                .int()
                .min(1)
                .max(10)
                .optional()
                .default(4)
                .describe('추론 스텝 수 (1–10, 기본값: 4)')
        })
    },
    async ({ prompt, num_inference_steps }) => {
        const hfToken = process.env.HF_TOKEN
        if (!hfToken) {
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: 'HF_TOKEN 환경변수가 설정되어 있지 않습니다.'
                    }
                ]
            }
        }

        try {
            const client = new InferenceClient(hfToken)
            const blob = await client.textToImage(
                {
                    provider: 'together',
                    model: 'black-forest-labs/FLUX.1-schnell',
                    inputs: prompt,
                    parameters: { num_inference_steps }
                },
                { outputType: 'blob' }
            )
            const base64 = Buffer.from(await blob.arrayBuffer()).toString(
                'base64'
            )

            return {
                content: [
                    {
                        type: 'image' as const,
                        data: base64,
                        mimeType: 'image/png'
                    }
                ]
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `이미지 생성에 실패했습니다: ${message}`
                    }
                ]
            }
        }
    }
)

type BrickServerStatus = 'online' | 'maintenance' | 'offline'

type BrickServer = {
    id: string
    name: string
    role: string
    host: string
    port: number
    protocol: string
    status: BrickServerStatus
    gamemode: string
    maxPlayers: number
    onlinePlayers: number
    motd: string
    world: string
    plugins: string[]
    proxy: string
}

const BRICK_SERVERS: Record<string, BrickServer> = {
    lobby: {
        id: 'lobby',
        name: 'Brick Lobby',
        role: '허브 / 프록시 진입점',
        host: 'lobby.brick.local',
        port: 25565,
        protocol: 'minecraft-java',
        status: 'online',
        gamemode: 'adventure',
        maxPlayers: 200,
        onlinePlayers: 47,
        motd: 'Brick Network에 오신 것을 환영합니다',
        world: 'hub',
        plugins: ['LuckPerms', 'VelocityBridge', 'ServerSelector'],
        proxy: 'velocity'
    },
    survival: {
        id: 'survival',
        name: 'Brick Survival',
        role: '생존 월드 샤드',
        host: 'survival.brick.local',
        port: 25566,
        protocol: 'minecraft-java',
        status: 'online',
        gamemode: 'survival',
        maxPlayers: 80,
        onlinePlayers: 31,
        motd: '함께 살아남기',
        world: 'overworld',
        plugins: ['CoreProtect', 'GriefPrevention', 'EssentialsX'],
        proxy: 'velocity'
    },
    creative: {
        id: 'creative',
        name: 'Brick Creative',
        role: '건축 / 크리에이티브 샤드',
        host: 'creative.brick.local',
        port: 25567,
        protocol: 'minecraft-java',
        status: 'online',
        gamemode: 'creative',
        maxPlayers: 40,
        onlinePlayers: 12,
        motd: '자유롭게 지어보세요',
        world: 'plots',
        plugins: ['PlotSquared', 'WorldEdit', 'FastAsyncWorldEdit'],
        proxy: 'velocity'
    },
    minigames: {
        id: 'minigames',
        name: 'Brick Mini Games',
        role: '미니게임 샤드',
        host: 'minigames.brick.local',
        port: 25568,
        protocol: 'minecraft-java',
        status: 'maintenance',
        gamemode: 'adventure',
        maxPlayers: 60,
        onlinePlayers: 0,
        motd: '미니게임 서버 점검 중',
        world: 'arcade',
        plugins: ['BedWars', 'SkyWars', 'PartyAndFriends'],
        proxy: 'velocity'
    }
}

const BRICK_NETWORK = {
    name: 'Brick Network',
    architecture: {
        proxy: 'Velocity',
        pattern: 'lobby + game shards',
        description:
            '클라이언트가 Velocity 프록시(lobby)로 접속한 뒤 생존·크리에이티브·미니게임 샤드로 이동하는 구성입니다.'
    },
    servers: Object.values(BRICK_SERVERS).map((item) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        status: item.status,
        uri: `brick://servers/${item.id}`
    }))
}

server.registerPrompt(
    'code-review',
    {
        title: '코드 리뷰',
        description:
            '언어와 무관하게 코드를 확인하고, 목적·구조·정확성·리스크를 단계적으로 리뷰합니다.',
        argsSchema: {
            code: z.string().describe('리뷰할 코드'),
            language: z
                .string()
                .optional()
                .describe('프로그래밍 언어 (모르면 비워도 됨)'),
            focus: z
                .string()
                .optional()
                .describe('특별히 보고 싶은 점 (예: 버그, 보안, 성능, 가독성)')
        }
    },
    async ({ code, language, focus }) => {
        const languageLine = language?.trim()
            ? `언어 힌트: ${language.trim()}`
            : '언어 힌트: 없음 (코드에서 추론하거나, 언어에 종속되지 말고 리뷰하세요)'
        const focusLine = focus?.trim()
            ? `추가 초점: ${focus.trim()}`
            : '추가 초점: 없음 (전반적으로 리뷰하세요)'

        return {
            description: '코드를 단계적으로 확인하고 리뷰합니다.',
            messages: [
                {
                    role: 'user' as const,
                    content: {
                        type: 'text' as const,
                        text: [
                            '당신은 코드를 확인하는 리뷰어입니다.',
                            '프로그래밍 언어는 상관없습니다. 주어진 코드를 읽고, 한 번에 결론만 내지 말고 아래 순서로 단계적으로 살펴보세요.',
                            '',
                            '1. 이 코드가 하려는 일과 입력/출력부터 파악하세요.',
                            '2. 구조와 흐름을 따라가며, 각 구간이 그 목적을 어떻게 구현하는지 설명하세요.',
                            '3. 정확성, 엣지 케이스, 오류 처리를 점검하세요.',
                            '4. 보안, 성능, 유지보수성에서 실제 위험이 있는지 확인하세요.',
                            '5. 심각도(치명/중요/제안)와 함께 구체적인 개선안을 제시하세요. 가능하면 수정 예시 코드도 보여주세요.',
                            '',
                            '근거 없는 추측은 하지 말고, 코드에서 확인한 내용만 리뷰하세요.',
                            '',
                            languageLine,
                            focusLine,
                            '',
                            '리뷰할 코드:',
                            '```',
                            code,
                            '```'
                        ].join('\n')
                    }
                }
            ]
        }
    }
)

server.registerResource(
    'brick-network',
    'brick://network',
    {
        title: 'Brick Network 구성',
        description: '브릭 서버 네트워크 전체 구성과 샤드 목록',
        mimeType: 'application/json'
    },
    async (uri) => ({
        contents: [
            {
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify(BRICK_NETWORK, null, 2)
            }
        ]
    })
)

server.registerResource(
    'brick-server',
    new ResourceTemplate('brick://servers/{id}', {
        list: async () => ({
            resources: Object.values(BRICK_SERVERS).map((item) => ({
                uri: `brick://servers/${item.id}`,
                name: item.id,
                title: item.name,
                description: `${item.role} (${item.host}:${item.port})`,
                mimeType: 'application/json'
            }))
        }),
        complete: {
            id: (value) =>
                Object.keys(BRICK_SERVERS).filter((id) =>
                    id.toLowerCase().startsWith(value.toLowerCase())
                )
        }
    }),
    {
        title: '브릭 서버',
        description: '개별 브릭 서버의 호스트, 포트, 플러그인 등 구성 정보',
        mimeType: 'application/json'
    },
    async (uri, { id }) => {
        const serverId = Array.isArray(id) ? id[0] : id
        const brickServer = serverId ? BRICK_SERVERS[serverId] : undefined
        if (!brickServer) {
            throw new Error(`알 수 없는 브릭 서버입니다: ${serverId}`)
        }

        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(brickServer, null, 2)
                }
            ]
        }
    }
)

server
    .connect(new StdioServerTransport())
    .catch(console.error)
    .then(() => {
        console.log('MCP server started')
    })
