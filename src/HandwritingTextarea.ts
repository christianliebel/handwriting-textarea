import { html, LitElement } from 'lit';

export class HandwritingTextarea extends LitElement {
  static get handwritingSupported() {
    return 'createHandwritingRecognizer' in navigator;
  }

  render() {
    return html`
      <h2>
        Handwriting supported? ${HandwritingTextarea.handwritingSupported}
      </h2>
    `;
  }
}
