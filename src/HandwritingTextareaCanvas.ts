import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';
import { RecognizeEvent } from './RecognizeEvent.js';

/* global HandwritingDrawing, HandwritingRecognizer, HandwritingStroke */

// TODO: Resize

export class HandwritingTextareaCanvas extends LitElement {
  static readonly styles = css`
    canvas {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border: 1px solid black;
      touch-action: none;

      background-color: rgba(255 255 255 / 0.5);
      backdrop-filter: blur(3px);
    }

    button {
      position: absolute;
      bottom: 10px;
      right: 10px;
    }
  `;

  #ctx?: CanvasRenderingContext2D;

  #recognizer?: HandwritingRecognizer;

  #drawing?: HandwritingDrawing;

  #activeOperation?: {
    stroke: HandwritingStroke;
    startTime: number;
    pointerId: number;
  };

  #recognitionTimeoutHandle?: number;

  @query('canvas') canvas?: HTMLCanvasElement;

  @property({ type: String }) languages?: string;

  @property({ type: String }) textContext?: string;

  @property({ type: String }) recognitionType?: string;

  firstUpdated() {
    if (!this.canvas) {
      throw new Error('Unable to find canvas.');
    }

    const clientRect = this.canvas.getBoundingClientRect();
    this.canvas.width = clientRect.width * devicePixelRatio;
    this.canvas.height = clientRect.height * devicePixelRatio;

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

  private __onPointerDown(event: PointerEvent) {
    if (this.#activeOperation) {
      // Only support one pointer at a time
      return;
    }

    if (!this.#recognizer) {
      // The recognizer is only created once in the lifetime of this component.
      // We need to create it here to get access of the pointer type to pass
      // it as a hint to the recognizer.
      this.__setUpRecognizer(event);
    }

    this.#activeOperation = {
      stroke: new HandwritingStroke(),
      startTime: Date.now(),
      pointerId: event.pointerId,
    };
    this.__addPoint(event.offsetX, event.offsetY);
    this.#ctx?.moveTo(event.offsetX, event.offsetY);
  }

  private async __setUpRecognizer({
    pointerType,
  }: PointerEvent): Promise<void> {
    if (typeof navigator.createHandwritingRecognizer === 'undefined') {
      throw new Error(
        'Handwriting Recognizer API is not supported on this platform.'
      );
    }

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

  private __onPointerMove(event: PointerEvent) {
    if (
      this.#activeOperation &&
      this.#activeOperation.pointerId === event.pointerId
    ) {
      this.__clearRecognitionTimeout();
      this.__addPoint(event.offsetX, event.offsetY);
      this.#ctx?.lineTo(event.offsetX, event.offsetY);
      this.#ctx?.stroke();
    }
  }

  private __addPoint(x: number, y: number) {
    this.#activeOperation?.stroke.addPoint({
      x,
      y,
      t: Date.now() - this.#activeOperation.startTime,
    });
  }

  private __onPointerUp(event: PointerEvent) {
    if (
      this.#drawing &&
      this.#activeOperation &&
      this.#activeOperation.pointerId === event.pointerId
    ) {
      this.#drawing.addStroke(this.#activeOperation.stroke);
      this.__setRecognitionTimeout();
    }

    this.#activeOperation = undefined;
  }

  private __setRecognitionTimeout() {
    this.__clearRecognitionTimeout();
    this.#recognitionTimeoutHandle = window.setTimeout(
      () => this.__predictAndSendEvent(),
      1000
    ); // TODO: get from outside
  }

  private __clearRecognitionTimeout() {
    if (this.#recognitionTimeoutHandle) {
      clearTimeout(this.#recognitionTimeoutHandle);
    }
  }

  private async __predictAndSendEvent() {
    let text = '';
    if (this.#drawing) {
      const [prediction] = await this.#drawing.getPrediction();
      text = prediction?.text ?? '';
    }

    this.dispatchEvent(new RecognizeEvent(text));
  }

  render() {
    return html`
      <canvas
        @pointerdown="${(event: PointerEvent) => this.__onPointerDown(event)}"
        @pointermove="${(event: PointerEvent) => this.__onPointerMove(event)}"
        @pointerup="${(event: PointerEvent) => this.__onPointerUp(event)}"
      ></canvas>
      <button @click="${() => this.__predictAndSendEvent()}">OK</button>
    `;
  }
}
