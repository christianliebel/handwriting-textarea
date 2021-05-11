/* eslint-disable */

export {};

// https://github.com/WICG/handwriting-recognition/blob/main/idl.md

declare global {
  interface Navigator {
    createHandwritingRecognizer?(
      constraint: HandwritingModelConstraint
    ): Promise<HandwritingRecognizer>;

    queryHandwritingRecognizerSupport?(
      query: HandwritingFeatureQuery
    ): Promise<HandwritingFeatureQueryResult>;
  }

  interface HandwritingRecognizer {
    startDrawing(hints?: HandwritingHints): HandwritingDrawing;

    finish(): void;
  }

  interface HandwritingModelConstraint {
    languages: string[];
  }

  interface HandwritingFeatureQuery {
    languages?: string[];
    alternatives?: any;
    segmentationResult?: any;
  }

  interface HandwritingFeatureQueryResult {
    languages?: boolean;
    alternatives?: boolean;
    segmentationResult?: boolean;
  }

  interface HandwritingHints {
    // graphemeSet?: string[]; - defined in the explainer, but not in the Web IDL yet
    recognitionType?: 'text' | 'email' | 'number' | 'per-character' | string;
    inputType?: 'mouse' | 'touch' | 'pen';
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
    t?: DOMTimeStamp;
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
