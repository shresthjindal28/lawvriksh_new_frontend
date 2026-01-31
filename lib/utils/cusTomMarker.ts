export default class HighlightInlineTool {
  static get isInline() {
    return true;
  }

  private api: any;
  private button: HTMLButtonElement | null = null;
  private color: string;
  private tag = 'SPAN';
  private class = 'custom-highlight';

  constructor({ api, config }: any) {
    this.api = api;
    this.color = config?.color || '#FACC15'; // default yellow
  }

  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.innerHTML = '';
    this.button.style.width = '18px';
    this.button.style.height = '18px';
    this.button.style.borderRadius = '3px';
    this.button.style.background = this.color;
    this.button.style.border = '1px solid #ccc';
    this.button.style.cursor = 'pointer';

    return this.button;
  }

  surround(range: Range) {
    if (!range) return;

    // Check if selection is inside a highlight span
    const parentTag = this.api.selection.findParentTag(this.tag, this.class);

    if (parentTag) {
      // If already highlighted - unwrap (deselect)
      this.unwrap(parentTag);
      return;
    }

    // Otherwise, wrap selection with highlight span
    const selected = range.extractContents();
    const mark = document.createElement(this.tag);
    mark.classList.add(this.class);
    mark.style.backgroundColor = this.color;
    mark.appendChild(selected);
    range.insertNode(mark);

    this.api.selection.expandToTag(mark);
  }

  // Helper to unwrap the highlight tag
  unwrap(element: HTMLElement) {
    const parent = element.parentNode;
    if (!parent) return;

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  checkState() {
    const tag = this.api.selection.findParentTag(this.tag, this.class);
    if (this.button) {
      this.button.classList.toggle('active', !!tag);
    }
  }

  static get sanitize() {
    return {
      span: {
        class: true,
        style: true,
      },
    };
  }
}
