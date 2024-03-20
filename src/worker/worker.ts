import { type TransferDescriptor } from "threads";
import { expose } from "threads/worker";

import { Renderer, RendererOption } from "../renderer";
import { LayerSimple } from "../styleEvaluator/types";
import { TileCoordinates } from "../types";

const tileRenderers = new Map<string, Renderer<OffscreenCanvas>>();

function createTileRenderKey({ urlTemplate }: RendererOption): string {
  return `${urlTemplate}`;
}

export interface RenderTileParams extends RendererOption {
  requestedTile: TileCoordinates;
  canvas: OffscreenCanvas;
  scaleFactor: number;
  maximumLevel: number;
  currentLayer?: LayerSimple;
}

export interface PickTileParams extends RendererOption {
  requestedTile: TileCoordinates;
  longitude: number;
  latitude: number;
  currentLayer?: LayerSimple;
}

async function getTileRenderer(options: RendererOption): Promise<Renderer<OffscreenCanvas>> {
  const key = createTileRenderKey(options);
  let tileRenderer;
  if (tileRenderer == null) {
    tileRenderer = new Renderer(options);
    tileRenderers.set(key, tileRenderer);
  }
  return tileRenderer;
}

const renderTile = async ({
  requestedTile,
  canvas,
  scaleFactor,
  maximumLevel,
  ...renderOptions
}: RenderTileParams): Promise<void> => {
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  if (!context) {
    return;
  }

  const tileRenderer = await getTileRenderer(renderOptions);
  await tileRenderer.render(
    canvas,
    requestedTile,
    scaleFactor,
    maximumLevel,
    renderOptions.currentLayer,
  );

  tileRenderer.clearCache();

  await new Promise(resolve => {
    requestAnimationFrame(resolve);
  });
};

expose({
  renderTile,
});

export type RendererWorker = object & {
  renderTile: (params: TransferDescriptor<RenderTileParams>) => void;
};
