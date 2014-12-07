# foo

Hi @guybedford
Following https://github.com/systemjs/builder/issues/12#issuecomment-65282004
I made progress in the filtering issue with a more "class" base approach.
I added some test so you can see how it goes.

- Here the `Builder` is instantiable with a `Loader`.
  - A default loader is available as `bundleLoaders.default`
- The `Builder#trace` method return a `ModuleTrace` instance.
- The `ModuleTrace` has a `filter` method to filter the existing
  - `filterExtension` is a shortcut
- The `ModuleTrace` has a `concat` method
