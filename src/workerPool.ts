import { Pool, spawn, type ModuleThread } from "threads";

import { type RendererWorker } from "./worker";
import WorkerBlob from "./worker?worker&inline";

type WorkerPool = Pool<ModuleThread<RendererWorker>> & {
  taskQueue: readonly unknown[];
};

let workerPool: WorkerPool | undefined;

function get(): WorkerPool {
  if (workerPool == null) {
    workerPool = Pool(async () => await spawn<RendererWorker>(new WorkerBlob()), {
      size: Math.ceil(navigator.hardwareConcurrency / 4),
    }) as unknown as WorkerPool;
  }
  return workerPool;
}

export function queue(...args: Parameters<WorkerPool["queue"]>): ReturnType<WorkerPool["queue"]> {
  return get().queue(...args);
}

export function canQueue(maxQueuedJobs: number): boolean {
  return workerPool == null || workerPool.taskQueue.length < maxQueuedJobs;
}

export async function destroy(): Promise<void> {
  if (workerPool == null) {
    return;
  }
  await workerPool.terminate(true);
  workerPool = undefined;
}
