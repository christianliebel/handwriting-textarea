import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';

export class HandwritingTextarea extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 25px;
      color: var(--handwriting-textarea-text-color, #000);
    }
  `;

  @property({ type: String }) title = 'Hey there';

  @property({ type: Number }) counter = 5;

  __increment() {
    this.counter += 1;
  }

  render() {
    return html`
      <h2>${this.title} Nr. ${this.counter}!</h2>
      <button @click=${this.__increment}>increment</button>
    `;
  }
}
