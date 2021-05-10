import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

/* global HandwritingModelConstraint, HandwritingRecognizer */

// TODO: Forms participation? https://web.dev/more-capable-form-controls/#defining-a-form-associated-custom-element
export class HandwritingTextarea extends LitElement {
  static readonly styles = css`
    canvas {
      border: 1px solid black;
      touch-action: none;
    }
  `;

  @property({ type: String }) languages: string = 'en';

  @state() supported = false;

  #recognizer?: HandwritingRecognizer;

  async connectedCallback() {
    super.connectedCallback();

    if (typeof navigator.createHandwritingRecognizer === 'undefined') {
      return;
    }

    const constraint = {
      languages: this.languages.split(','),
    } as HandwritingModelConstraint;
    try {
      // TODO: Re-initialize recognizer on property changes?
      // TODO: Add API to query support? (queryHandwritingRecognizerSupport)
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

  __onPointerDown(evt: PointerEvent) {
    console.log(evt, this.#recognizer);
  }

  __onPointerMove(evt: PointerEvent) {
    console.log(evt, this.#recognizer);
  }

  __onPointerUp(evt: PointerEvent) {
    console.log(evt, this.#recognizer);
  }

  render() {
    const canvas = html` <canvas
      @pointerdown="${(evt: PointerEvent) => this.__onPointerDown(evt)}"
      @pointermove="${(evt: PointerEvent) => this.__onPointerMove(evt)}"
      @pointerup="${(evt: PointerEvent) => this.__onPointerUp(evt)}"
    ></canvas>`;

    // TODO: Pass-through textarea attributes?
    return html`
      <textarea cols="60" rows="5"></textarea>
      <h2>Handwriting supported? ${this.supported}</h2>
      ${this.supported ? canvas : ''}
    `;
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#recognizer?.finish();
  }
}
