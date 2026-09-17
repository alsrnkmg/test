import type { ReactNode } from 'react'

export const metadata = {
    title: 'TypeScript MCP Server',
    description: 'Vercel에 배포된 Streamable HTTP MCP 서버'
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko">
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
                {children}
            </body>
        </html>
    )
}
