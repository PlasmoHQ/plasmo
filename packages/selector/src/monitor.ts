export {}

document.querySelector = new Proxy(document.querySelector, {
  apply: (target, thisArg, args) => {}
})
