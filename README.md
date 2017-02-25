# Kaufhof plugins for OpenDataLayer
Collection of more or less Kaufhof-specific plugins for ODL. Most of them using very special attributes
that are not universally applicable. Before they can become universal ODL plugins we need to sort out
the issues and make them more generalized.

## Usage
The plugins should be used together with ODL Builder. Install them as a local npm dependency.

    npm install opendatalayer-plugins-kaufhof --save-dev

Then you can directly reference them in your ODL Builder configuration like this:

```javascript
odlBuilder.configure({
  plugins: {
    './node_modules/opendatalayer-plugins-kaufhof/dist/econda': {
      config: { }
    }
  }
})
```

*NOTE: All existing hacks are necessary because of the poor ES6 module support in node. As soon as the support becomes native,
we can get rid of many ES6->ES5 transpilation workarounds that are currently used throughout the ODL project.*

## TODO
- find a way to pass runtime configuration to plugins (e.g. breakpoints, tenant, etc.) ... maybe using some onLoad callback?
  ```javascript
  // ...
  outputPath: '',
  plugins: {},
  onBeforeLoad: function (data) {
    // execute during runtime, _before_ plugins are loaded?
    data.breakpoint = 'XL_to_XXL';  // ??
  }
  // ...

  ```