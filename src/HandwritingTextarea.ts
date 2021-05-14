import { css, html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { RecognizeEvent } from './RecognizeEvent.js';
import { RequestAnimationDataEvent } from './RequestAnimationDataEvent.js';

export class HandwritingTextarea extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;
      }

      .wrapper {
        display: grid;
        position: relative;
        height: 100%;
      }

      textarea {
        resize: none;
      }

      handwriting-textarea-button {
        position: absolute;
        bottom: 10px;
        right: 10px;
        transform: scale(-1, 1);
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

  @property({ type: String }) value = '';

  @state() supported = false;

  @state() enabled = false;

  @state() textContext = '';

  @query('textarea') textarea?: HTMLTextAreaElement;

  #hadFocus = false;

  async connectedCallback() {
    super.connectedCallback();

    this.supported = await this.__isHandwritingRecognitionSupported();
  }

  private async __isHandwritingRecognitionSupported() {
    if (typeof navigator.queryHandwritingRecognizerSupport === 'undefined') {
      // API is not available on this platform
      return false;
    }

    const result = await navigator.queryHandwritingRecognizerSupport({
      languages: this.languages.split(','),
      alternatives: 0,
    });

    if (!result.languages || !result.alternatives) {
      // Handwriting features are not supported. Behave as if API would not be available.
      return false;
    }

    // At this point, both the Handwriting Recognition API and our constraints are supported.
    return true;
  }

  private __onRecognize(event: RecognizeEvent) {
    if (this.textarea) {
      // Replace the selected text with the recognized text
      const { before, after } = this.__splitTextAtSelection();
      this.textarea.value = `${before}${event.detail.text}${after}`;

      this.__toggleCanvas();
    }
  }

  private __splitTextAtSelection(): { before: string; after: string } {
    const text = this.textarea?.value ?? '';
    const { start, end } = this.__getSelection();
    return { before: text.substr(0, start), after: text.substr(end) };
  }

  private __getSelection(): { start: number; end: number } {
    if (!this.#hadFocus) {
      // if the textarea never had focus, we assume that the user wants to add
      // text add the end (selectionStart and selectionEnd would be 0)
      const length = this.textarea?.value.length ?? 0;
      return { start: length, end: length };
    }

    return {
      start: this.textarea?.selectionStart ?? 0,
      end: this.textarea?.selectionEnd ?? 0,
    };
  }

  private __toggleCanvas() {
    this.enabled = this.supported && !this.enabled;
    if (this.enabled) {
      // Set the text before the selection as the context for recognition
      this.textContext = this.__splitTextAtSelection().before;
    }
  }

  private __setFocus() {
    this.#hadFocus = true;
  }

  private __setValue(event: Event) {
    this.value = (event.target as HTMLInputElement)?.value;
  }

  private __onRequestAnimationData(event: RequestAnimationDataEvent) {
    if (!this.textarea) {
      throw new Error('Unable to find textarea');
    }

    const { padding, fontSize } = window.getComputedStyle(this.textarea);
    event.setAnimationData({
      width: this.textarea.getBoundingClientRect().width,
      padding: parseInt(padding, 10),
      scrollTop: this.textarea.scrollTop,
      fontSize,
    });
  }

  render() {
    const drawButton = html`
      <handwriting-textarea-button @click="${() => this.__toggleCanvas()}"
        >✎
      </handwriting-textarea-button>
    `;

    const canvas = html`
      <handwriting-textarea-canvas
        languages="${this.languages}"
        recognitiontype="${this.recognitionType}"
        textcontext="${this.textContext}"
        @recognize="${(event: RecognizeEvent) => this.__onRecognize(event)}"
        @requestanimationdata="${(event: RequestAnimationDataEvent) =>
          this.__onRequestAnimationData(event)}"
      ></handwriting-textarea-canvas>
    `;

    return html`
      <div class="wrapper">
        <textarea
          .value="${this.value}"
          @input="${(evt: Event) => this.__setValue(evt)}"
          @focus="${() => this.__setFocus()}"
        ></textarea>
        ${this.supported && !this.enabled ? drawButton : ''}
        ${this.enabled ? canvas : ''}
      </div>
    `;
  }
}
