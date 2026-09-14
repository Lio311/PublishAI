import React from 'react';
export default function AITiptapEditor({ initialContent }: { initialContent: string }) {
    return (
        <div data-testid="tiptap-editor">
            {initialContent}
        </div>
    );
}
