import { Easing, Group, Tween } from '@tweenjs/tween.js';
import { AnimationData } from './AnimationData.js';

/* global HandwritingDrawing, HandwritingDrawingSegment, HandwritingPrediction, HandwritingSegment */

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CharacterPosition {
  row: number;
  column: number;
}

const ANIMATION_DURATION_IN_MS = 280;

export class AnimationHelper {
  private static readonly characterMetrics = new Map<string, TextMetrics>();

  #animationTimeoutHandle: number = 0;

  animate(
    textContext: string,
    prediction: HandwritingPrediction,
    drawing: HandwritingDrawing,
    ctx: CanvasRenderingContext2D,
    animationData: AnimationData
  ) {
    // set canvas to textarea font
    ctx.font = `normal ${animationData.fontSize} monospace`;

    // pre-calculate target positions
    const targetPositions = AnimationHelper.__getTargetPositionMap(
      `${textContext}${prediction.text}`,
      animationData,
      ctx
    );
    const group = AnimationHelper.__getTweenGroupForSegments(
      textContext,
      prediction,
      drawing,
      ctx,
      targetPositions,
      animationData
    );
    this.__render(ctx, group);

    return new Promise(res => {
      setTimeout(() => {
        res(null);
        cancelAnimationFrame(this.#animationTimeoutHandle);
      }, ANIMATION_DURATION_IN_MS);
    });
  }

  private __render(ctx: CanvasRenderingContext2D, tweenGroup: Group) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    tweenGroup.update();

    this.#animationTimeoutHandle = requestAnimationFrame(() =>
      this.__render(ctx, tweenGroup)
    );
  }

  private static __getTargetPositionMap(
    text: string,
    { width, padding }: AnimationData,
    ctx: CanvasRenderingContext2D
  ): Map<number, CharacterPosition> {
    const map = new Map<number, CharacterPosition>();
    const maxWidth = width - padding;

    let rollingLength = 0;
    let row = 0;
    let column = 0;

    // Perform basic layouting. Does not take word breaks into account.
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i <= text.length; i++) {
      const character = text[i];
      if (character === '\n') {
        row += 1;
        column = 0;
        rollingLength = 0;
      } else {
        // As we're only using a monospace font right now, the actual character
        // doesn't matter
        rollingLength += this.__getCharacterMetrics('X', ctx).width;

        if (rollingLength > maxWidth) {
          row += 1;
          column = 0;
          rollingLength = 0;
        } else {
          column += 1;
        }
      }

      map.set(i, { row, column });
    }

    return map;
  }

  private static __getTweenGroupForSegments(
    textContext: string,
    prediction: HandwritingPrediction,
    drawing: HandwritingDrawing,
    ctx: CanvasRenderingContext2D,
    positionMap: Map<number, CharacterPosition>,
    animationData: AnimationData
  ) {
    const tweenGroup = new Group();
    prediction.segmentationResult
      ?.map(segment => ({
        segment,
        sourceRect: this.__getSourceRect(
          segment.drawingSegments,
          drawing,
          ctx.canvas
        ),
      }))
      .map(({ segment, sourceRect }) => ({
        sourceRect,
        canvas: this.__getCanvas(sourceRect, ctx),
        targetRect: this.__getTargetRect(
          textContext.length,
          segment,
          positionMap,
          animationData,
          ctx
        ),
      }))
      .forEach(({ sourceRect, targetRect, canvas }) => {
        this.__startTween(sourceRect, targetRect, canvas, tweenGroup, ctx);
      });

    return tweenGroup;
  }

  private static __startTween(
    from: Rect,
    to: Rect,
    graphemeCanvas: OffscreenCanvas,
    tweenGroup: Group,
    ctx: CanvasRenderingContext2D
  ) {
    new Tween({ opacity: 1, ...from }, tweenGroup)
      .to({ opacity: 0, ...to }, ANIMATION_DURATION_IN_MS)
      .easing(Easing.Quadratic.Out)
      .onUpdate(({ x, y, width, height, opacity }) => {
        ctx.canvas.style.opacity = `${opacity}`;

        if (width <= 0 && height <= 0) {
          return;
        }

        ctx.drawImage(graphemeCanvas, x, y, width, height);
      })
      .start();
  }

  private static __getCanvas(
    { x, y, width, height }: Rect,
    ctx: CanvasRenderingContext2D
  ) {
    const safeWidth = Math.max(width * devicePixelRatio, devicePixelRatio);
    const safeHeight = Math.max(height * devicePixelRatio, devicePixelRatio);
    // ctx is scaled to devicePixelRatio, but getImageData and putImageData
    // don't respect the transformation matrix
    const imageData = ctx.getImageData(
      Math.max(x * devicePixelRatio, 0),
      Math.max(y * devicePixelRatio, 0),
      safeWidth,
      safeHeight
    );
    const canvas = new OffscreenCanvas(safeWidth, safeHeight);
    canvas.getContext('2d')?.putImageData(imageData, 0, 0);
    return canvas;
  }

  private static __getCharacterMetrics(
    character: string,
    ctx: CanvasRenderingContext2D
  ): TextMetrics {
    let metrics = AnimationHelper.characterMetrics.get(character);
    if (metrics) {
      return metrics;
    }

    // cache metrics for given character
    metrics = ctx.measureText(character);
    AnimationHelper.characterMetrics.set(character, metrics);
    return metrics;
  }

  private static __getTargetRect(
    textContextLength: number,
    { beginIndex, endIndex }: HandwritingSegment,
    posMap: Map<number, any>,
    { padding, scrollTop }: AnimationData,
    ctx: CanvasRenderingContext2D
  ): Rect {
    const length = endIndex - beginIndex;
    // As we're using monospace fonts, the particular character does not matter
    const { width, emHeightAscent } = AnimationHelper.__getCharacterMetrics(
      'X',
      ctx
    );
    const { row, column } = posMap.get(textContextLength + beginIndex);

    return {
      x: padding + column * width,
      y: padding - scrollTop + row * emHeightAscent,
      width: length * width,
      height: emHeightAscent,
    };
  }

  private static __getSourceRect(
    drawingSegments: HandwritingDrawingSegment[],
    drawing: HandwritingDrawing,
    canvas: HTMLCanvasElement
  ): Rect {
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    for (const segment of drawingSegments) {
      const stroke = drawing.getStrokes()[segment.strokeIndex];
      const points =
        stroke
          ?.getPoints()
          .filter(
            (_, index) =>
              index >= segment.beginPointIndex && index <= segment.endPointIndex
          ) ?? [];

      const xPoints = points
        .filter((point): point is { x: number } => 'x' in point)
        .map(point => point.x);
      const yPoints = points
        .filter((point): point is { y: number } => 'y' in point)
        .map(point => point.y);

      minX = Math.min(minX, ...xPoints);
      minY = Math.min(minY, ...yPoints);
      maxX = Math.max(maxX, ...xPoints);
      maxY = Math.max(maxY, ...yPoints);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}
