import { Transfer } from "threads";

import { LayerSimple } from "./styleEvaluator/types";
import { TileCoordinates, URLTemplate } from "./types";
import { queue } from "./workerPool";

export async function renderWorker(options: {
  canvas: HTMLCanvasElement;
  requestedTile: TileCoordinates;
  scaleFactor: number;
  urlTemplate: URLTemplate;
  layerNames: string[];
  maximumLevel: number;
  currentLayer: LayerSimple;
}): Promise<void> {
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
