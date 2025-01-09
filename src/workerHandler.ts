import { Transfer } from "threads";

import { RendererOption } from "./renderer";
import { LayerSimple } from "./styleEvaluator/types";
import { TileCoordinates } from "./types";
import { queue } from "./workerPool";

export async function renderWorker(
  options: RendererOption & {
    canvas: HTMLCanvasElement;
    requestedTile: TileCoordinates;
    scaleFactor: number;
    currentLayer: LayerSimple;
  },
): Promise<void> {
  const { canvas, ...optionsWithoutCanvas } = options;
  const offscreen = canvas.transferControlToOffscreen();

  await queue(async task => {
    await task.renderTile(
      Transfer(
        {
          canvas: offscreen,
          ...optionsWithoutCanvas,
        },
        [offscreen],
      ),
    );
  }, options.currentLayer?.id);
}
