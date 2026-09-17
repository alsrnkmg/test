import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function registerCodeReviewPrompt(server: McpServer) {
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
                    .describe(
                        '특별히 보고 싶은 점 (예: 버그, 보안, 성능, 가독성)'
                    )
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
}
