export async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`요청 실패 (HTTP ${response.status}): ${url}`)
    }
    return (await response.json()) as T
}
