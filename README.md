# TypeScript MCP Server (Vercel)

Next.js App Router와 `mcp-handler`로 Streamable HTTP MCP 서버를 제공합니다. stdio transport는 사용하지 않습니다.

## 엔드포인트

- MCP: `/api/mcp`
- 로컬: `http://localhost:3000/api/mcp`
- 배포: `https://<your-app>.vercel.app/api/mcp`

## 시작하기

```bash
npm install
npm run dev
```

이미지 생성 도구는 Hugging Face 토큰이 필요합니다. 우선순위는 다음과 같습니다.

1. MCP 요청 헤더 `x-hf-token`
2. 서버 환경변수 `HF_TOKEN`

`.env.example`을 참고해 로컬 `.env`를 만들 수 있습니다. 토큰은 Git에 커밋하지 마세요.

## Cursor 연결

`.cursor/mcp.json` 예시:

```json
{
    "mcpServers": {
        "typescript-mcp-server": {
            "url": "https://<your-app>.vercel.app/api/mcp",
            "headers": {
                "x-hf-token": "hf_..."
            }
        }
    }
}
```

## 프로젝트 구조

```
app/
  api/[transport]/route.ts   # createMcpHandler 진입점
  layout.tsx
  page.tsx
src/
  tools/                     # MCP 도구
  prompts/
  resources/
  register.ts
```

## 배포

GitHub 저장소를 Vercel에 연결한 뒤 Production 배포합니다. `HF_TOKEN`은 클라이언트 헤더로 보내면 Vercel 환경변수는 선택 사항입니다.

```bash
npx vercel --prod
```
