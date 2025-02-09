/**
 * Forked from https://github.com/parcel-bundler/parcel/blob/19fe7ff00f28f44300fe803c4e594b9fc02b25ad/packages/core/core/src/Parcel.js
 * MIT License
 */

import invariant from "assert"
import { createWorkerFarm } from "@parcel/core"
import dumpGraphToGraphViz from "@parcel/core/lib/dumpGraphToGraphViz"
import ParcelConfig from "@parcel/core/lib/ParcelConfig"
import { toProjectPath } from "@parcel/core/lib/projectPath"
import { assetFromValue } from "@parcel/core/lib/public/Asset"
import { PackagedBundle } from "@parcel/core/lib/public/Bundle"
import BundleGraph from "@parcel/core/lib/public/BundleGraph"
import ReporterRunner from "@parcel/core/lib/ReporterRunner"
import createParcelBuildRequest from "@parcel/core/lib/requests/ParcelBuildRequest"
import { loadParcelConfig } from "@parcel/core/lib/requests/ParcelConfigRequest"
import createValidationRequest from "@parcel/core/lib/requests/ValidationRequest"
import RequestTracker, {
  getWatcherOptions,
  requestGraphEdgeTypes
} from "@parcel/core/lib/RequestTracker"
import {
  BuildAbortError,
  registerCoreWithSerializer
} from "@parcel/core/lib/utils"
import ThrowableDiagnostic, {
  anyToDiagnostic,
  type Diagnostic
} from "@parcel/diagnostic"
import { Disposable, ValueEmitter } from "@parcel/events"
import { init as initHash } from "@parcel/hash"
import logger from "@parcel/logger"
import { init as initSourcemaps } from "@parcel/source-map"
import type {
  AsyncSubscription,
  BuildEvent,
  BuildSuccessEvent,
  InitialParcelOptions,
  PackagedBundle as IPackagedBundle
} from "@parcel/types"
import { PromiseQueue } from "@parcel/utils"
import { type Options as ParcelWatcherOptions } from "@parcel/watcher"
// eslint-disable-next-line no-unused-vars
import { AbortController } from "abortcontroller-polyfill/dist/cjs-ponyfill"
import nullthrows from "nullthrows"

import { resolveOptions, type ResolvedOptions } from "./resolve-options"

registerCoreWithSerializer()

export const INTERNAL_TRANSFORM: symbol = Symbol("internal_transform")
export const INTERNAL_RESOLVE: symbol = Symbol("internal_resolve")

type SharedReference = number

export class Parcel {
  #requestTracker: RequestTracker
  #config: ParcelConfig
  #farm
  #initialized = false
  #disposable: Disposable
  #initialOptions: InitialParcelOptions
  #reporterRunner: ReporterRunner
  #resolvedOptions: ResolvedOptions = null
  #optionsRef: SharedReference
  #watchAbortController /*: AbortController*/
  #watchQueue = new PromiseQueue<BuildEvent>({
    maxConcurrent: 1
  })

  #watchEvents: ValueEmitter<
    | {
        error: Error
        buildEvent?: void
      }
    | {
        buildEvent: BuildEvent
        error?: void
      }
  >

  #watcherSubscription: AsyncSubscription
  #watcherCount = 0
  #requestedAssetIds: Set<string> = new Set()

  isProfiling /*: boolean */

  constructor(options: InitialParcelOptions) {
    this.#initialOptions = options
  }

  async _init(): Promise<void> {
    if (this.#initialized) {
      return
    }

    await initSourcemaps
    await initHash

    let resolvedOptions = await resolveOptions(this.#initialOptions)
    this.#resolvedOptions = resolvedOptions
    let { config } = await loadParcelConfig(resolvedOptions)
    this.#config = new ParcelConfig(config, resolvedOptions)

    if (this.#initialOptions.workerFarm) {
      if (this.#initialOptions.workerFarm["ending"]) {
        throw new Error("Supplied WorkerFarm is ending")
      }
      this.#farm = this.#initialOptions.workerFarm
    } else {
      this.#farm = createWorkerFarm({
        shouldPatchConsole: resolvedOptions.shouldPatchConsole
      })
    }

    // @ts-ignore QUIRK: upstream def is outdated:
    await resolvedOptions.cache.ensure()

    let { dispose: disposeOptions, ref: optionsRef } =
      await this.#farm.createSharedReference(resolvedOptions, false)
    this.#optionsRef = optionsRef

    this.#disposable = new Disposable()
    if (this.#initialOptions.workerFarm) {
      // If we don't own the farm, dispose of only these references when
      // Parcel ends.
      this.#disposable.add(disposeOptions)
    } else {
      // Otherwise, when shutting down, end the entire farm we created.
      this.#disposable.add(() => this.#farm.end())
    }

    this.#watchEvents = new ValueEmitter()
    this.#disposable.add(() => this.#watchEvents.dispose())

    this.#requestTracker = await RequestTracker.init({
      farm: this.#farm,
      options: resolvedOptions
    })

    this.#reporterRunner = new ReporterRunner({
      config: this.#config,
      options: resolvedOptions,
      workerFarm: this.#farm
    })
    this.#disposable.add(this.#reporterRunner)

    this.#initialized = true
  }

  async run(): Promise<BuildSuccessEvent> {
    let startTime = Date.now()
    if (!this.#initialized) {
      await this._init()
    }

    let result = await this._build({ startTime })
    await this._end()

    console.log("Got result type", result.type)

    if (result.type === "buildFailure") {
      throw new BuildError(result.diagnostics)
    }

    return result as BuildSuccessEvent
  }

  async _end(): Promise<void> {
    this.#initialized = false

    await Promise.all([
      this.#disposable.dispose(),
      await this.#requestTracker.writeToCache()
    ])
  }

  async _startNextBuild() {
    this.#watchAbortController = new AbortController()
    await this.#farm.callAllWorkers("clearConfigCache", [])

    try {
      let buildEvent = await this._build({
        signal: this.#watchAbortController.signal
      })

      this.#watchEvents.emit({
        buildEvent
      })

      return buildEvent
    } catch (err) {
      // Ignore BuildAbortErrors and only emit critical errors.
      if (!(err instanceof BuildAbortError)) {
        throw err
      }
    }
  }

  async watch(
    cb?: (err: Error, buildEvent?: BuildEvent) => any
  ): Promise<AsyncSubscription> {
    if (!this.#initialized) {
      await this._init()
    }

    let watchEventsDisposable
    if (cb) {
      watchEventsDisposable = this.#watchEvents.addListener(
        ({ error, buildEvent }) => cb(error, buildEvent)
      )
    }

    if (this.#watcherCount === 0) {
      this.#watcherSubscription = await this._getWatcherSubscription()
      await this.#reporterRunner.report({ type: "watchStart" })

      // Kick off a first build, but don't await its results. Its results will
      // be provided to the callback.
      this.#watchQueue.add(() => this._startNextBuild())
      this.#watchQueue.run()
    }

    this.#watcherCount++

    let unsubscribePromise
    const unsubscribe = async () => {
      if (watchEventsDisposable) {
        watchEventsDisposable.dispose()
      }

      this.#watcherCount--
      if (this.#watcherCount === 0) {
        await nullthrows(this.#watcherSubscription).unsubscribe()
        this.#watcherSubscription = null
        await this.#reporterRunner.report({ type: "watchEnd" })
        this.#watchAbortController.abort()
        await this.#watchQueue.run()
        await this._end()
      }
    }

    return {
      unsubscribe() {
        if (unsubscribePromise == null) {
          unsubscribePromise = unsubscribe()
        }

        return unsubscribePromise
      }
    }
  }

  async _build({
    signal = null,
    startTime = Date.now()
  } = {}): Promise<BuildEvent> {
    this.#requestTracker.setSignal(signal)
    let options = nullthrows(this.#resolvedOptions)
    try {
      if (options.shouldProfile) {
        await this.startProfiling()
      }

      this.#watchEvents.emit({
        buildEvent: { type: "buildStart" }
      })

      this.#reporterRunner.report({
        type: "buildStart"
      })

      this.#requestTracker.graph.invalidateOnBuildNodes()

      let request = createParcelBuildRequest({
        optionsRef: this.#optionsRef,
        requestedAssetIds: this.#requestedAssetIds,
        signal
      })

      let { bundleGraph, bundleInfo, changedAssets, assetRequests } =
        await this.#requestTracker.runRequest(request, { force: true })

      this.#requestedAssetIds.clear()

      await dumpGraphToGraphViz(
        // $FlowFixMe
        this.#requestTracker.graph,
        "RequestGraph",
        requestGraphEdgeTypes
      )

      let event = {
        type: "buildSuccess" as const,
        changedAssets: new Map(
          Array.from(changedAssets).map(([id, asset]) => [
            id,
            assetFromValue(asset, options)
          ])
        ),
        bundleGraph: new BundleGraph<IPackagedBundle>(
          bundleGraph,
          (bundle, bundleGraph, options) =>
            PackagedBundle.getWithInfo(
              bundle,
              bundleGraph,
              options,
              bundleInfo.get(bundle.id)
            ),
          options
        ),
        buildTime: Date.now() - startTime,
        requestBundle: async (bundle) => {
          let bundleNode = bundleGraph._graph.getNodeByContentKey(bundle.id)
          invariant(bundleNode?.type === "bundle", "Bundle does not exist")

          if (!bundleNode.value.isPlaceholder) {
            // Nothing to do.
            return {
              type: "buildSuccess",
              changedAssets: new Map(),
              bundleGraph: event.bundleGraph,
              buildTime: 0,
              requestBundle: event.requestBundle
            }
          }

          for (let assetId of bundleNode.value.entryAssetIds) {
            this.#requestedAssetIds.add(assetId)
          }

          if (this.#watchQueue.getNumWaiting() === 0) {
            if (this.#watchAbortController) {
              this.#watchAbortController.abort()
            }

            this.#watchQueue.add(() => this._startNextBuild())
          }

          let results = await this.#watchQueue.run()
          let result = results.filter(Boolean).pop()
          if (result.type === "buildFailure") {
            throw new BuildError(result.diagnostics)
          }

          return result
        }
      }

      await this.#reporterRunner.report(event)
      await this.#requestTracker.runRequest(
        createValidationRequest({
          optionsRef: this.#optionsRef,
          assetRequests
        }),
        { force: assetRequests.length > 0 }
      )
      return event
    } catch (e) {
      if (e instanceof BuildAbortError) {
        throw e
      }

      let diagnostic = anyToDiagnostic(e)
      let event = {
        type: "buildFailure" as const,
        diagnostics: Array.isArray(diagnostic) ? diagnostic : [diagnostic]
      }

      await this.#reporterRunner.report(event)

      return event
    } finally {
      if (this.isProfiling) {
        await this.stopProfiling()
      }

      await this.#farm.callAllWorkers("clearConfigCache", [])
    }
  }

  async _getWatcherSubscription(): Promise<AsyncSubscription> {
    invariant(this.#watcherSubscription == null)

    // TODO: This is where the resolvedOptions - the watch project root, need to be fixed

    let resolvedOptions = nullthrows(this.#resolvedOptions)
    let opts: ParcelWatcherOptions = getWatcherOptions(resolvedOptions)

    opts.ignore.push(process.env.PLASMO_BUILD_DIR)

    let sub = await resolvedOptions.inputFS.watch(
      resolvedOptions.projectRoot,
      (err, events) => {
        if (err) {
          this.#watchEvents.emit({ error: err })
          return
        }

        let isInvalid = this.#requestTracker.respondToFSEvents(
          events.map((e) => ({
            type: e.type,
            path: toProjectPath(resolvedOptions.projectRoot, e.path)
          }))
        )
        if (isInvalid && this.#watchQueue.getNumWaiting() === 0) {
          if (this.#watchAbortController) {
            this.#watchAbortController.abort()
          }

          this.#watchQueue.add(() => this._startNextBuild())
          this.#watchQueue.run()
        }
      },
      opts
    )
    return { unsubscribe: () => sub.unsubscribe() }
  }

  async startProfiling(): Promise<void> {
    if (this.isProfiling) {
      throw new Error("Parcel is already profiling")
    }

    logger.info({ origin: "@parcel/core", message: "Starting profiling..." })
    this.isProfiling = true
    await this.#farm.startProfile()
  }

  stopProfiling(): Promise<void> {
    if (!this.isProfiling) {
      throw new Error("Parcel is not profiling")
    }

    logger.info({ origin: "@parcel/core", message: "Stopping profiling..." })
    this.isProfiling = false
    return this.#farm.endProfile()
  }

  takeHeapSnapshot(): Promise<void> {
    logger.info({ origin: "@parcel/core", message: "Taking heap snapshot..." })
    return this.#farm.takeHeapSnapshot()
  }
}

class BuildError extends ThrowableDiagnostic {
  constructor(diagnostic: Array<Diagnostic> | Diagnostic) {
    super({ diagnostic })
    this.name = "BuildError"
  }
}
