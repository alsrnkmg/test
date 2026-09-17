export default function Page() {
    return (
        <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 24px' }}>
            <h1>TypeScript MCP Server</h1>
            <p>
                Streamable HTTP MCP 엔드포인트는{' '}
                <code>/api/mcp</code> 입니다.
            </p>
            <ul>
                <li>도구: greet, calculator, timezone, geocode, getWeather, generate-image</li>
                <li>프롬프트: code-review</li>
                <li>리소스: brick-network, brick-server</li>
            </ul>
            <p>
                이미지 생성에는 Hugging Face 토큰이 필요합니다. Cursor MCP 설정에서{' '}
                <code>x-hf-token</code> 헤더를 보내거나, Vercel 환경변수{' '}
                <code>HF_TOKEN</code>을 설정하세요.
            </p>
        </main>
    )
}
