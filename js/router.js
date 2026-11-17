// hash router. routes look like #album/after-hours. the original app's
// routes (#home, #search, #playlist/x, #category/x ...) still work.

export function parseHash(hash) {
  const clean = decodeURIComponent(String(hash || "").replace(/^#\/?/, ""));
  const [name, ...rest] = clean.split("/");
  return { name: name || "home", param: rest.join("/") };
}

export function createRouter({ routes, fallback, onRender }) {
  let current = null;
  let nextOptions = null;

  function resolve() {
    const route = parseHash(location.hash);
    const view = routes[route.name] ? route : { name: fallback, param: "", unknown: !!location.hash && route.name !== fallback };
    return view;
  }

  function render(options = {}) {
    const route = resolve();
    const isNew = !current || current.name !== route.name || current.param !== route.param;
    current = route;
    onRender(route, { ...options, isNew });
  }

  window.addEventListener("hashchange", () => {
    const options = nextOptions || {};
    nextOptions = null;
    render(options);
  });

  return {
    start: () => render({ initial: true }),
    refresh: (options) => render({ ...options, refresh: true }),
    // options apply to the render that this navigation causes
    go(hash, options = null) {
      if (location.hash === hash || (hash === "#home" && !location.hash)) {
        render(options || {});
        return;
      }
      nextOptions = options;
      location.hash = hash;
    },
    get current() {
      return current;
    }
  };
}
