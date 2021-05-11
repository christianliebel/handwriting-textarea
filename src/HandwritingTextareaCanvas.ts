import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';
import { RecognizeEvent } from './RecognizeEvent.js';

/* global HandwritingDrawing, HandwritingRecognizer, HandwritingStroke */

// TODO: Overall comments
// TODO: Resize

export class HandwritingTextareaCanvas extends LitElement {
  static readonly styles = css`
    canvas {
      border: 1px solid black;
      touch-action: none;
    }
  `;

  #ctx?: CanvasRenderingContext2D;

  #recognizer?: HandwritingRecognizer;

  #drawing?: HandwritingDrawing;

  #activeOperation?: {
    stroke: HandwritingStroke;
    startTime: number;
  };

  @query('canvas') canvas?: HTMLCanvasElement;

  @property({ type: String }) languages?: string;

  @property({ type: String }) textContext?: string;

  @property({ type: String }) recognitionType?: string;

  firstUpdated() {
    if (!this.canvas) {
      throw new Error('Unable to find canvas.');
    }

    // TODO: Dynamically adjust size
    this.canvas.width = 500 * devicePixelRatio;
    this.canvas.height = 500 * devicePixelRatio;

    const ctx = this.canvas?.getContext('2d', { desynchronized: true });
    if (!ctx) {
      throw new Error('Unable to retrieve 2D context.');
    }

    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    this.#ctx = ctx;
  }

  __onPointerDown(event: PointerEvent) {
    if (this.#activeOperation) {
      // Only support one pointer at a time
      event.preventDefault();
      return;
    }

    if (!this.#recognizer) {
      // TODO: Reset drawing?
      // The recognizer is only created once in the lifetime of this component.
      // We need to create it here to get access of the pointer type to pass
      // it as a hint to the recognizer.
      this.__setUpRecognizer(event);
    }

    this.#activeOperation = {
      stroke: new HandwritingStroke(),
      startTime: Date.now(),
    };
    this.__addPoint(event.offsetX, event.offsetY);
    this.#ctx?.moveTo(event.offsetX, event.offsetY);
  }

  async __setUpRecognizer({ pointerType }: PointerEvent): Promise<void> {
    if (typeof navigator.createHandwritingRecognizer === 'undefined') {
      throw new Error(
        'Handwriting Recognizer API is not supported on this platform.'
      );
    }

    // TODO: Re-initialize recognizer on property changes?
    this.#recognizer = await navigator.createHandwritingRecognizer({
      languages: this.languages?.split(',') ?? [],
    });

    const allowedTypes = ['mouse', 'pen', 'touch'] as const;
    const inputType = allowedTypes.find(type => type === pointerType);
    this.#drawing = this.#recognizer.startDrawing({
      inputType,
      textContext: this.textContext,
      recognitionType: this.recognitionType,
      alternatives: 0,
    });
  }

  __onPointerMove(event: PointerEvent) {
    if (this.#activeOperation) {
      this.__addPoint(event.offsetX, event.offsetY);
      this.#ctx?.lineTo(event.offsetX, event.offsetY);
      this.#ctx?.stroke();
    }
  }

  __onPointerUp() {
    if (this.#drawing && this.#activeOperation) {
      this.#drawing.addStroke(this.#activeOperation.stroke);
      // eslint-disable-next-line no-console
      this.#drawing.getPrediction().then(predictions =>
        // TODO: If prediction is defined.
        this.dispatchEvent(new RecognizeEvent(predictions[0].text))
      );
    }

    this.#activeOperation = undefined;
  }

  __addPoint(x: number, y: number) {
    this.#activeOperation?.stroke.addPoint({
      x,
      y,
      t: Date.now() - this.#activeOperation.startTime,
    });
  }

  render() {
    return html`
      <canvas
        style="width: 500px; height: 500px;"
        @pointerdown="${(event: PointerEvent) => this.__onPointerDown(event)}"
        @pointermove="${(event: PointerEvent) => this.__onPointerMove(event)}"
        @pointerup="${() => this.__onPointerUp()}"
      ></canvas>
    `;
  }
}
