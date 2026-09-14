export async function routeAIRequest(taskType: string, payload: any) {
    if (taskType === 'scientific_review') {
        return { modelUsed: 'o1-preview', output: "Mocked analysis" };
    }
    return { modelUsed: 'claude-3-5-sonnet', output: "Mocked response" };
}
