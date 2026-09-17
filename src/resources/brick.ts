import {
    type McpServer,
    ResourceTemplate
} from '@modelcontextprotocol/sdk/server/mcp.js'

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

export function registerBrickResources(server: McpServer) {
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
}
