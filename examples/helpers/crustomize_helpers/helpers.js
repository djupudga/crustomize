
// Example of a custom helper function.
// You use it like this:
// CRUSTOMIZE_HELPERS=./examples/crusomize_helpers/helpers.js crustomize <command> <path>
export function getRandomInt() {
  return function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}