let testCallback
export function registerTestCallback(callback) {
  testCallback = callback
}
export function hook1(event, resource) {
  if (testCallback) testCallback("hook1", event, resource)
}
