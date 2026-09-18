import { Mark, mergeAttributes } from '@tiptap/core';

export const Insertion = Mark.create({
  name: 'insertion',

  parseHTML() {
    return [
      { tag: 'ins' },
      { tag: 'span[data-track="insertion"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-track': 'insertion',
        class: 'bg-emerald-100 text-emerald-900 border-b-2 border-emerald-500',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setInsertion: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      unsetInsertion: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

export const Deletion = Mark.create({
  name: 'deletion',

  parseHTML() {
    return [
      { tag: 'del' },
      { tag: 'span[data-track="deletion"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-track': 'deletion',
        class: 'bg-rose-100 text-rose-900 line-through decoration-rose-500',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setDeletion: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      unsetDeletion: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

// To provide types for the commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertion: {
      setInsertion: () => ReturnType;
      unsetInsertion: () => ReturnType;
    };
    deletion: {
      setDeletion: () => ReturnType;
      unsetDeletion: () => ReturnType;
    };
  }
}
