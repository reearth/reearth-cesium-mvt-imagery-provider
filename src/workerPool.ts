import { Pool, spawn, type ModuleThread } from "threads";

import { type RendererWorker } from "./worker";
import WorkerBlob from "./worker?worker&inline";

type WorkerPool = Pool<ModuleThread<RendererWorker>> & {
  taskQueue: readonly unknown[];
  layerId: string;
};

const workerPools: WorkerPool[] = [];

function get(layerId: string): WorkerPool {
  let workerPool = workerPools.find(pool => pool.layerId === layerId);
  if (workerPool == null) {
    workerPool = Pool(async () => await spawn<RendererWorker>(new WorkerBlob()), {
      size: Math.ceil(navigator.hardwareConcurrency / 4),
    }) as unknown as WorkerPool;
    workerPool.layerId = layerId;
    workerPools.push(workerPool);
  }
  return workerPool;
}

type TaskRunFunction<ThreadType, Return> = (thread: ThreadType, layerId: string) => Promise<Return>;

export function queue<Return>(
  task: TaskRunFunction<ModuleThread<RendererWorker>, Return>,
  layerId: string,
): ReturnType<WorkerPool["queue"]> {
  return get(layerId).queue(thread => task(thread, layerId));
}

export function canQueue(layerId: string, maxQueuedJobs: number): boolean {
  const workerPool = workerPools.find(pool => pool.layerId === layerId);
  return workerPool == null || workerPool.taskQueue.length < maxQueuedJobs;
}

export async function destroy(layerId: string): Promise<void> {
  const workerPoolIndex = workerPools.findIndex(pool => pool.layerId === layerId);
  if (workerPoolIndex !== -1) {
    const workerPool = workerPools[workerPoolIndex];
    await workerPool.terminate(true);
    workerPools.splice(workerPoolIndex, 1);
  }
}
