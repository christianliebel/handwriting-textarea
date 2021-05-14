import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';
import { AnimationHelper } from './AnimationHelper.js';
import { RecognizeEvent } from './RecognizeEvent.js';
import { RequestAnimationDataEvent } from './RequestAnimationDataEvent.js';

/* global HandwritingDrawing, HandwritingRecognizer, HandwritingStroke */

const RECOGNITION_TIMEOUT_IN_MS = 1_000;

export class HandwritingTextareaCanvas extends LitElement {
  static readonly styles = css`
    canvas {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border: 1px solid dimgray;
      touch-action: none;

      background-color: rgba(255 255 255 / 0.5);
      backdrop-filter: blur(3px);
    }

    handwriting-textarea-button {
      position: absolute;
      bottom: 10px;
      right: 10px;
      background-color: #4caf50;
    }

    handwriting-textarea-button:hover {
      background-color: #66bb6a;
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

  #resizeObserver?: ResizeObserver;

  #animationHelper = new AnimationHelper();

  @query('canvas') canvas?: HTMLCanvasElement;

  @property({ type: String }) languages?: string;

  @property({ type: String }) textContext?: string;

  @property({ type: String }) recognitionType?: string;

  firstUpdated() {
    // Resize the canvas when the textarea size changes
    this.#resizeObserver = new ResizeObserver(() => this.__initializeCanvas());
    this.#resizeObserver.observe(this);
  }

  private __initializeCanvas() {
    if (!this.canvas) {
      throw new Error('Unable to find canvas.');
    }

    // assign canvas's width & height for high-DPI screens
    const clientRect = this.canvas.getBoundingClientRect();
    this.canvas.width = clientRect.width * window.devicePixelRatio;
    this.canvas.height = clientRect.height * window.devicePixelRatio;

    // after canvas resize, all state is lost, so we re-create the context
    // use desynchronized context for performant drawing
    const ctx = this.canvas.getContext('2d', { desynchronized: true });
    if (!ctx) {
      throw new Error('Unable to retrieve 2D context.');
    }

    // initialize pointer style
    ctx.strokeStyle = 'black';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;

    // map canvas pixels to match pointer pixels
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.#ctx = ctx;
  }

  private __onPointerDown(event: PointerEvent) {
    event.preventDefault();

    if (this.#activeOperation) {
      // Only support one pointer at a time
      return;
    }

    if (!this.#recognizer) {
      // The recognizer is only created once in the lifetime of this component.
      // We need to create it here to get access of the pointer type to pass
      // it as a hint to the recognizer.
      this.__setUpRecognizer(event.pointerType);
    }

    this.#activeOperation = {
      stroke: new HandwritingStroke(),
      // store startTime as a reference point for subsequent events
      startTime: Date.now(),
      // store ID to recognize the pointer during pointermove & pointerup
      pointerId: event.pointerId,
    };

    this.__addPoint(event.offsetX, event.offsetY);
    this.#ctx?.moveTo(event.offsetX, event.offsetY);

    // Clear any previous recognition timeout, canvas won't disappear anymore
    this.__clearRecognitionTimeout();
  }

  private async __setUpRecognizer(pointerType: string): Promise<void> {
    if (typeof navigator.createHandwritingRecognizer === 'undefined') {
      throw new Error(
        'Handwriting Recognizer API is not supported on this platform.'
      );
    }

    this.#recognizer = await navigator.createHandwritingRecognizer({
      languages: this.languages?.split(',') ?? [],
    });

    // Make sure the pointerType matches the allowed values for recognitionType
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
    if (this.#activeOperation?.pointerId === event.pointerId) {
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
    if (this.#drawing && this.#activeOperation?.pointerId === event.pointerId) {
      this.#drawing.addStroke(this.#activeOperation.stroke);
      this.#activeOperation = undefined;

      // Set a timeout for recognizing the text and hiding the canvas
      this.__setRecognitionTimeout();
    }
  }

  private __setRecognitionTimeout() {
    this.__clearRecognitionTimeout();
    this.#recognitionTimeoutHandle = window.setTimeout(
      () => this.__predictAndSendEvent(),
      RECOGNITION_TIMEOUT_IN_MS
    );
  }

  private __clearRecognitionTimeout() {
    if (this.#recognitionTimeoutHandle) {
      window.clearTimeout(this.#recognitionTimeoutHandle);
    }
  }

  private async __predictAndSendEvent() {
    const [prediction] = (await this.#drawing?.getPrediction()) ?? [];
    if (prediction && this.#drawing && this.#ctx) {
      // request animation data from the textarea
      const requestAnimationDataEvent = new RequestAnimationDataEvent();
      this.dispatchEvent(requestAnimationDataEvent);

      // play the recognition animation
      await this.#animationHelper.animate(
        this.textContext ?? '',
        prediction,
        this.#drawing,
        this.#ctx,
        requestAnimationDataEvent.data
      );

      this.dispatchEvent(new RecognizeEvent(prediction?.text ?? ''));
    } else {
      this.dispatchEvent(new RecognizeEvent(''));
    }
  }

  render() {
    return html`
      <canvas
        @pointerdown="${(event: PointerEvent) => this.__onPointerDown(event)}"
        @pointermove="${(event: PointerEvent) => this.__onPointerMove(event)}"
        @pointerup="${(event: PointerEvent) => this.__onPointerUp(event)}"
      ></canvas>
      <handwriting-textarea-button
        @click="${() => this.__predictAndSendEvent()}"
        >✓
      </handwriting-textarea-button>
    `;
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    super.disconnectedCallback();
  }
}
