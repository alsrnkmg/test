import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { textResult } from '../lib/text-result'

export function registerCalculator(server: McpServer) {
    server.registerTool(
        'calculator',
        {
            title: '계산기',
            description:
                '두 숫자의 사칙연산(덧셈, 뺄셈, 곱셈, 나눗셈)을 계산합니다.',
            inputSchema: z.object({
                operation: z
                    .enum(['add', 'subtract', 'multiply', 'divide'])
                    .describe(
                        '수행할 연산 (add, subtract, multiply, divide)'
                    ),
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

            return textResult(
                `${a} ${operationSymbols[operation]} ${b} = ${result}`
            )
        }
    )
}
