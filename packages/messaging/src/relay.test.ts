import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import exp from "constants"

import type { PlasmoMessaging } from "./types"

const { relay, sendViaRelay } = await import("./relay")

class MessagePortMock {
  callbacks = new Set<Function>()
  addEventListener = (_message, callback) => {
    this.callbacks.add(callback)
  }
  removeEventListener = (_message, callback) => {
    this.callbacks.delete(callback)
  }
  postMessage = (data) => {
    const event = {
      data,
      source: globalThis.window
    }

    this.callbacks.forEach((callback) => {
      callback(event)
    })
  }
  clear() {
    this.callbacks.clear()
  }
}

/**
 * Message port callbacks happen synchronously
 * But promises get resolved in event queue
 */
const waitForMicroTasks = () => Promise.resolve()

describe("sendViaRelay", () => {
  const port = new MessagePortMock()
  const req: PlasmoMessaging.Request = {
    name: "test",
    body: { foo: "bar" },
    relayId: "1"
  }

  beforeEach(() => {
    port.clear()
  })

  test("posts message to provided message port", (done) => {
    port.addEventListener("message", (event) => {
      expect(event.data).toMatchObject(req)
      done()
    })

    sendViaRelay(req, port)
    expect(port.callbacks.size).toBe(2)
  })

  test("appends random instanceId to relayed request", (done) => {
    port.addEventListener("message", (event) => {
      expect(Object.hasOwn(event.data, "instanceId")).toBeTruthy()
      done()
    })

    sendViaRelay(req, port)
  })

  test("only resolves body with matching instanceId", (done) => {
    let response = null

    port.addEventListener("message", async (event) => {
      if (event.data.relayed) {
        return
      }

      port.postMessage({
        ...event.data,
        body: { bar: "foo" },
        relayed: true,
        instanceId: "123"
      })
      await waitForMicroTasks()

      expect(response).toEqual(null)

      port.postMessage({
        ...event.data,
        body: { bar: "foo" },
        relayed: true
      })
      await waitForMicroTasks()

      expect(response).toEqual({ bar: "foo" })

      done()
    })

    sendViaRelay(req, port).then((res) => (response = res))
  })
})

describe("relay", () => {
  const port = new MessagePortMock()
  const req: PlasmoMessaging.Request = {
    name: "test",
    relayId: "1"
  }
  const handler = (data) => {
    return Promise.resolve({ echo: data.body })
  }

  beforeEach(() => {
    port.clear()
  })

  test("returns cleanup function", () => {
    const cleanup = relay(req, handler, port)

    expect(port.callbacks.size).toBe(1)

    cleanup()

    expect(port.callbacks.size).toBe(0)
  })

  test("does not handle relayed messages", () => {
    const notCalledHandler = jest.fn((data) => Promise.resolve(data))
    relay(req, notCalledHandler, port)

    port.postMessage({ ...req, relayed: true })

    expect(notCalledHandler).not.toBeCalled()
  })

  test("posts back resolution result and instanceId", (done) => {
    relay(req, handler, port)

    const mockedReq = { ...req, instanceId: "123", body: { foo: "bar" } }

    port.addEventListener("message", async (event) => {
      if (!event.data.relayed) {
        return
      }

      expect(event.data.body).toEqual({ echo: mockedReq.body })
      expect(event.data.instanceId).toEqual(mockedReq.instanceId)

      done()
    })

    port.postMessage(mockedReq)
  })
})
