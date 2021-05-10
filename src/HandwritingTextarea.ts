import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

/* global HandwritingModelConstraint, HandwritingRecognizer */

export class HandwritingTextarea extends LitElement {
  @property({ type: String }) languages: string = 'en';

  #recognizer?: HandwritingRecognizer;

  @state() supported = false;

  async connectedCallback() {
    super.connectedCallback();

    if (typeof navigator.createHandwritingRecognizer === 'undefined') {
      return;
    }

    const constraint = {
      languages: this.languages.split(','),
    } as HandwritingModelConstraint;
    try {
      this.#recognizer = await navigator.createHandwritingRecognizer(
        constraint
      );
    } catch (err) {
      // Creating the handwriting recognizer may fail if constraints can't be met.
      // In this case, we behave as if Handwriting Recognition API would not available.
      // eslint-disable-next-line no-console
      console.error(err);
      return;
    }

    // At this point, Handwriting Recognition API is supported and the constraints are met.
    this.supported = true;
  }

  render() {
    // TODO: Pass-through textarea attributes?
    return html`
      <textarea cols="60" rows="5"></textarea>
      <h2>Handwriting supported? ${this.supported}</h2>
    `;
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#recognizer?.finish();
  }
}
