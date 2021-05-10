import { css, html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';

/* global HandwritingDrawing, HandwritingHints, HandwritingModelConstraint, HandwritingRecognizer, HandwritingStroke */

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

  @query('canvas') canvas?: HTMLCanvasElement;

  #recognizer?: HandwritingRecognizer;

  #drawing?: HandwritingDrawing;

  #activeStroke?: { startTimestamp: number; stroke: HandwritingStroke };

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
    // TODO: Only allow a single pointer
    const hints = {
      recognitionType: 'text', // TODO: Pass in via property?
      inputType: evt.pointerType,
      textContext: '', // TODO: existing text from textarea?
      alternatives: 0, // TODO: Pass in via property?
    } as HandwritingHints;
    this.#drawing = this.#recognizer?.startDrawing(hints);
    this.#activeStroke = {
      startTimestamp: Date.now(),
      stroke: new HandwritingStroke(),
    };
    this.#drawing?.addStroke(this.#activeStroke.stroke);
    this.__addPoint(evt);
  }

  __onPointerMove(evt: PointerEvent) {
    this.__addPoint(evt);
  }

  async __onPointerUp(evt: PointerEvent) {
    if (this.#activeStroke && this.#drawing) {
      this.__addPoint(evt);

      const [prediction] = await this.#drawing.getPrediction();
      console.log(prediction);
    }
  }

  __addPoint({ offsetX: x, offsetY: y }: PointerEvent) {
    if (this.#activeStroke) {
      const t = Date.now() - this.#activeStroke.startTimestamp;
      this.#activeStroke.stroke.addPoint({ x, y, t });

      // TODO: Continuous drawing, devicePixelRatio
      const ctx = this.canvas?.getContext('2d', { desynchronized: true });
      ctx?.fillRect(x, y, 2, 2);
    }
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
