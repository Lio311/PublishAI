export function GET(request: Request) {
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('data: {"status": "connected"}\n\n'));
            controller.close();
        }
    });
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
