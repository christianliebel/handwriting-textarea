import { html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { RecognizeEvent } from './RecognizeEvent.js';

// TODO: Forms participation? https://web.dev/more-capable-form-controls/#defining-a-form-associated-custom-element
export class HandwritingTextarea extends LitElement {
  @property({ type: String }) languages = 'en';

  @property({ type: String }) recognitionType = 'text';

  @state() supported = false;

  @query('textarea') textarea?: HTMLTextAreaElement;

  async connectedCallback() {
    super.connectedCallback();

    this.supported = await this.__checkSupport();
  }

  private async __checkSupport() {
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
    }
  }

  render() {
    const canvas = html` <handwriting-textarea-canvas
      languages="en"
      @recognize="${(event: RecognizeEvent) => this.__onRecognize(event)}"
    ></handwriting-textarea-canvas>`;

    // TODO: Pass-through textarea attributes?
    return html`
      <textarea cols="60" rows="5"></textarea>
      <h2>Handwriting recognition supported? ${this.supported}</h2>
      <p>
        ${this.supported
          ? 'Handwriting recognition is supported on this platform, so feel free to draw here:'
          : 'Too bad! Handwriting recognition is not supported on this platform.'}
      </p>
      ${this.supported ? canvas : ''}
    `;
  }
}
