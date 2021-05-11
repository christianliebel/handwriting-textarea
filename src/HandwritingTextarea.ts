import { css, html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { RecognizeEvent } from './RecognizeEvent.js';

// TODO: Forms participation? https://web.dev/more-capable-form-controls/#defining-a-form-associated-custom-element
// TODO: Styled buttons
// TODO: Selection handling
// TODO: Overall comments

export class HandwritingTextarea extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-grid;
        position: relative;
      }

      button {
        position: absolute;
        bottom: 10px;
        right: 10px;
      }

      handwriting-textarea-canvas {
        position: absolute;
        height: 100%;
        width: 100%;
        z-index: 1;
      }
    `;
  }

  @property({ type: String }) languages = 'en';

  @property({ type: String }) recognitionType = 'text';

  @state() supported = false;

  @state() enabled = false;

  @query('textarea') textarea?: HTMLTextAreaElement;

  async connectedCallback() {
    super.connectedCallback();

    this.supported = await this.__isHandwritingRecognitionSupported();
  }

  private async __isHandwritingRecognitionSupported() {
    if (typeof navigator.queryHandwritingRecognizerSupport === 'undefined') {
      return false;
    }

    const result = await navigator.queryHandwritingRecognizerSupport({
      languages: this.languages.split(','),
      alternatives: 0,
    });

    if (!result.languages || !result.alternatives) {
      // Creating the handwriting recognizer may fail if constraints can't be met.
      // In this case, we behave as if Handwriting Recognition API would not available.
      return false;
    }

    // At this point, Handwriting Recognition API is supported and the constraints are met.
    return true;
  }

  private __onRecognize(event: RecognizeEvent) {
    if (this.textarea) {
      this.textarea.value = event.detail.text;
      this.__toggleCanvas();
    }
  }

  private __toggleCanvas() {
    this.enabled = this.supported && !this.enabled;
  }

  render() {
    const drawButton = html`
      <button @click="${() => this.__toggleCanvas()}">Draw</button>
    `;

    const canvas = html`
      <handwriting-textarea-canvas
        languages="en"
        @recognize="${(event: RecognizeEvent) => this.__onRecognize(event)}"
      ></handwriting-textarea-canvas>
    `;

    return html`
      <textarea style="width: 500px; height: 300px;"></textarea>
      ${this.supported && !this.enabled ? drawButton : ''}
      ${this.enabled ? canvas : ''}
    `;
  }
}
