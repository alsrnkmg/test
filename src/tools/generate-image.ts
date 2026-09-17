import { InferenceClient } from '@huggingface/inference'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { McpContext } from '../lib/mcp-context'
import { textResult } from '../lib/text-result'

export function registerGenerateImage(
    server: McpServer,
    context: McpContext = {}
) {
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
            const hfToken = context.hfToken || process.env.HF_TOKEN
            if (!hfToken) {
                return textResult(
                    'HF_TOKEN이 없습니다. MCP 클라이언트에서 x-hf-token 헤더를 보내거나 서버 환경변수 HF_TOKEN을 설정하세요.'
                )
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
                return textResult(`이미지 생성에 실패했습니다: ${message}`)
            }
        }
    )
}
