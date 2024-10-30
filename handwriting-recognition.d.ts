/* eslint-disable */

export {};

// https://github.com/WICG/handwriting-recognition/blob/main/idl.md

declare global {
  interface Navigator {
    createHandwritingRecognizer?(
      constraints: HandwritingModelConstraints
    ): Promise<HandwritingRecognizer>;

    queryHandwritingRecognizer?(
      constraints: HandwritingModelConstraints
    ): Promise<HandwritingRecognizerQueryResult | null>;
  }

  interface HandwritingModelConstraints {
    languages: string[];
  }

  type HandwritingRecognitionType =
    | 'text'
    | 'email'
    | 'number'
    | 'per-character';

  type HandwritingInputType = 'mouse' | 'stylus' | 'touch';

  interface HandwritingRecognizerQueryResult {
    textAlternatives?: boolean;
    textSegmentation?: boolean;
    hints?: HandwritingHintsQueryResult;
  }

  interface HandwritingHintsQueryResult {
    recognitionType?: HandwritingRecognitionType[];
    inputType?: HandwritingInputType[];
    textContext?: boolean;
    alternatives?: boolean;
  }

  interface HandwritingRecognizer {
    startDrawing(hints?: HandwritingHints): HandwritingDrawing;

    finish(): void;
  }

  interface HandwritingHints {
    graphemeSet?: string[];
    recognitionType?: HandwritingRecognitionType;
    inputType?: HandwritingInputType;
    textContext?: string;
    alternatives?: number;
  }

  interface HandwritingStroke {
    addPoint(point: HandwritingPoint): void;

    getPoints(): HandwritingPoint[];

    clear(): void;
  }

  var HandwritingStroke: {
    prototype: HandwritingStroke;
    new (): HandwritingStroke;
  };

  interface HandwritingPoint {
    x?: number;
    y?: number;
    t?: DOMHighResTimeStamp;
  }

  interface HandwritingDrawing {
    addStroke(stroke: HandwritingStroke): void;

    removeStroke(stroke: HandwritingStroke): void;

    clear(): void;

    getStrokes(): HandwritingStroke[];

    getPrediction(): Promise<HandwritingPrediction[]>;
  }

  interface HandwritingPrediction {
    text: string;
    segmentationResult?: HandwritingSegment[];
  }

  interface HandwritingSegment {
    grapheme: string;
    beginIndex: number;
    endIndex: number;
    drawingSegments: HandwritingDrawingSegment[];
  }

  interface HandwritingDrawingSegment {
    strokeIndex: number;
    beginPointIndex: number;
    endPointIndex: number;
  }
}
