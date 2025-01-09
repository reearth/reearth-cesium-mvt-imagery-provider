/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ImageryProvider,
  ImageryTypes,
  Rectangle,
  Request,
  WebMercatorTilingScheme,
  Event as CesiumEvent,
  Credit,
  ImageryLayerFeatureInfo,
} from "cesium";
import { isEqual } from "lodash-es";
import { LRUCache } from "lru-cache";

import { Renderer } from "./renderer";
import { LayerSimple } from "./styleEvaluator/types";
import {
  CESIUM_CANVAS_SIZE,
  FeatureHandler,
  ImageryProviderOption,
  TileCoordinates,
  URLTemplate,
} from "./types";
import { renderWorker } from "./workerHandler";
import { canQueue, destroy } from "./workerPool";

type ImageryProviderTrait = ImageryProvider;

let layerUsed: LayerSimple | undefined;

export class MVTImageryProvider implements ImageryProviderTrait {
  static maximumTasks = 50;
  static maximumTasksPerImagery = 6;
  private taskCount = 0;

  private readonly tileCache: LRUCache<string, HTMLCanvasElement> | undefined;

  // Options
  private readonly _minimumLevel: number;
  private readonly _maximumLevel: number;
  private readonly _credit?: string;
  private readonly _resolution?: number;

  // Internal variables
  private readonly _tilingScheme: WebMercatorTilingScheme;
  private readonly _tileWidth: number;
  private readonly _tileHeight: number;
  private readonly _rectangle: Rectangle;
  private readonly _ready: boolean;
  private readonly _readyPromise: Promise<boolean> = Promise.resolve(true);
  private readonly _errorEvent = new CesiumEvent();
  private readonly _currentLayer?: LayerSimple;
  private readonly _useWorker?: boolean;

  private readonly _urlTemplate: URLTemplate;
  private readonly _layerNames: string[];

  private _pickPointRadius?: number | FeatureHandler<number>;
  private _pickLineWidth?: number | FeatureHandler<number>;

  constructor(options: ImageryProviderOption) {
    this._minimumLevel = options.minimumLevel ?? 0;
    this._maximumLevel = options.maximumLevel ?? 24;
    this._credit = options.credit;
    this._resolution = options.resolution ?? 10;

    this._tilingScheme = new WebMercatorTilingScheme();

    // Maybe these pixels are same with Cesium's tile size.
    this._tileWidth = CESIUM_CANVAS_SIZE;
    this._tileHeight = CESIUM_CANVAS_SIZE;

    this._rectangle = this._tilingScheme.rectangle;

    this._ready = true;

    this._urlTemplate = options.urlTemplate;
    this._layerNames = options.layerName.split(/, */).filter(Boolean);
    this._currentLayer = options.layer;
    this._useWorker = options.worker ?? false;

    this._pickPointRadius = options.pickPointRadius;
    this._pickLineWidth = options.pickLineWidth;
  }

  get tileWidth() {
    return this._tileWidth;
  }
  get tileHeight() {
    return this._tileHeight;
  }
  // The `requestImage` is called when user zoom the globe.
  // But this invocation is restricted depends on `maximumLevel` or `minimumLevel`.
  get maximumLevel() {
    return this._maximumLevel;
  }
  get minimumLevel() {
    return this._minimumLevel;
  }
  get tilingScheme() {
    return this._tilingScheme;
  }
  get rectangle() {
    return this._rectangle;
  }
  get errorEvent() {
    return this._errorEvent;
  }
  get ready() {
    return this._ready;
  }
  get hasAlphaChannel() {
    return true;
  }
  get credit() {
    return this._credit ? new Credit(this._credit) : <any>undefined;
  }

  // Unused values
  get defaultNightAlpha() {
    return undefined;
  }
  get defaultDayAlpha() {
    return undefined;
  }
  get defaultAlpha() {
    return <any>undefined;
  }
  get defaultBrightness() {
    return <any>undefined;
  }
  get defaultContrast() {
    return <any>undefined;
  }
  get defaultHue() {
    return <any>undefined;
  }
  get defaultSaturation() {
    return <any>undefined;
  }
  get defaultGamma() {
    return <any>undefined;
  }
  get defaultMinificationFilter() {
    return <any>undefined;
  }
  get defaultMagnificationFilter() {
    return <any>undefined;
  }
  get readyPromise() {
    return this._readyPromise;
  }
  get tileDiscardPolicy() {
    return <any>undefined;
  }
  get proxy() {
    return <any>undefined;
  }
  getTileCredits(_x: number, _y: number, _level: number) {
    return [];
  }

  requestImage(
    x: number,
    y: number,
    level: number,
    _request?: Request | undefined,
  ): Promise<ImageryTypes> | undefined {
    const currentLayer = this._currentLayer;

    if (!currentLayer) return;

    if (
      layerUsed &&
      currentLayer &&
      !isEqual(layerUsed, currentLayer) &&
      layerUsed.id === currentLayer.id
    ) {
      destroy(layerUsed.id);
    }
    layerUsed = currentLayer;
    if (
      this._useWorker &&
      (this.taskCount >= MVTImageryProvider.maximumTasksPerImagery ||
        !canQueue(currentLayer?.id, MVTImageryProvider.maximumTasks))
    ) {
      return;
    }

    const cacheKey = `${x}/${y}/${level}`;
    if (this.tileCache?.has(cacheKey) === true) {
      const canvas = this.tileCache.get(cacheKey);
      return Promise.resolve(canvas as ImageryTypes);
    }
    const canvas = document.createElement("canvas");
    const requestedTile: TileCoordinates = {
      x,
      y,
      level,
    };

    const scaleFactor = (level >= this.maximumLevel ? this._resolution : undefined) ?? 1;
    canvas.width = this._tileWidth * scaleFactor;
    canvas.height = this._tileHeight * scaleFactor;
    const urlTemplate = this._urlTemplate;
    const layerNames = this._layerNames;
    const maximumLevel = this._maximumLevel;

    ++this.taskCount;

    return renderWorker({
      canvas,
      requestedTile,
      scaleFactor,
      urlTemplate,
      layerNames,
      maximumLevel,
      currentLayer,
      pickPointRadius: this._pickPointRadius,
      pickLineWidth: this._pickLineWidth,
    })
      .then(() => {
        this.tileCache?.set(cacheKey, canvas);
        return canvas;
      })
      .catch(error => {
        if (error instanceof Error && error.message.startsWith("Unimplemented type")) {
          return canvas;
        }
        throw error;
      })
      .finally(() => {
        --this.taskCount;
      });
  }

  async pickFeatures(
    x: number,
    y: number,
    level: number,
    longitude: number,
    latitude: number,
  ): Promise<ImageryLayerFeatureInfo[]> {
    const requestedTile = {
      x: x,
      y: y,
      level: level,
    };

    const currentLayer = this._currentLayer;
    const urlTemplate = this._urlTemplate;
    const layerNames = this._layerNames;

    return (
      (await new Renderer({ urlTemplate, layerNames }).pickFeatures(
        requestedTile,
        longitude,
        latitude,
        currentLayer,
      )) ?? []
    );
  }
}
