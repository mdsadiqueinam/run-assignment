/**
 * Checks if the specified node is any type of text input element.
 * @param node A DOM node to test.
 * @returns True if the node is a text input element.
 */
export function isTextInput(node: Node | Element | null): node is Element {
  return (
    Boolean(node) &&
    node!.nodeType === Node.ELEMENT_NODE &&
    (node as Element).matches(
      'input, textarea, select, option, [contenteditable=""], [contenteditable=true], .CodeMirror, .ql-editor, .mce-content-body, .tiptap'
    )
  );
}
