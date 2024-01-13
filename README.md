Alternates
============================

I haven't had much time to maintain this project recently as I am no longer working on a project that uses Sails.js. Here are some alternate projects that you may want to consider instead of this one.

If you would like to modify your Sails.js backend to work with Ember Data out of the box check out @mphasize's [sails-generate-ember-blueprints](https://github.com/mphasize/sails-generate-ember-blueprints).

If you would like an adapter/serializer combo for Ember Data that works well with the stock Sails.js API and supports ember-cli check out @huafu's [ember-data-sails](https://github.com/huafu/ember-data-sails)


ember-data-sails-adapter 2.x
============================

An Ember Data adapter for Sails.js v0.10. If you are looking for Sails.js blueprints that work well with Ember Data be sure to check out [sails-generate-ember-blueprints](https://github.com/mphasize/sails-generate-ember-blueprints).

**Note:** If you like to use this adapter with Sails.js v0.9 please use the [1.x line](https://github.com/bmac/ember-data-sails-adapter#ember-data-sails-adapter-1x).

This package contains 2 Adapters, `DS.SailsSocketAdapter` and `DS.SailsRESTAdapter`. 

```bash
bower install ember-data-sails-adapter
```

```html
<script type="text/javascript" src="/bower_components/ember-data-sails-adapter/ember-data-sails-adapter.js"></script>
```

#### SailsSocketAdapter

The `SailsSocketAdapter` uses Sails's [websocket support](http://sailsjs.org/#!documentation/sockets) to find, create and delete records. This has the benefit of automatically subscribing to the Sails' `update`, `create` and `delete` events for for the model. To enable these events with Blueprint controllers in Sails v0.10 you will need to set the `autosubscribe` property on your Model. The adapter will add or update records in the store when a Sails emits an `updated`, `created` or `destroyed` event.

```javascript
App.ApplicationAdapter = DS.SailsSocketAdapter.extend({
    namespace: '/api/v1',
});
```

#### SailsRESTAdapter

The `SailsRESTAdapter` works similarly to the Ember [RESTAdapter](http://emberjs.com/api/data/classes/DS.RESTAdapter.html). The main differences are this adapter automatically attempts to use the `JSONSerializer` instead of the `RESTSerializer` because it more closely matches the JSON response from Sails. Additionally it will re-format the error messages returned by Sails to match the format that Ember Data expects. With the `SailsRESTAdapter` you will not get the live updateing that comes with the  `SailsSocketAdapter`. However, because websockets do not support compression using the `SailsRESTAdapter` may be beneficial when you are expecting a large response from the Sails api.

```javascript
App.ApplicationAdapter = DS.SailsRESTAdapter.extend({
    namespace: '/api/v1'
});
```

#### Pluralised Routes

By default Sails does not pluralize the model names when creating urls
to a model's route. This is different from the normal Ember Data
conventions. To make it easy to get started the `SailsRESTAdapter` and
`SailsSocketAdapter` will attempt to singularize the model name when
requesting a model's route. If you would like to use a pluralized
model name in the route you can override the default `pathForType`
method.

Example

```js
App.ApplicationAdapter = DS.SailsRESTAdapter.example({
  pathForType: function(type) {
    var camelized = Ember.String.camelize(type);
    return Ember.String.pluralize(camelized);
  }
});
```

You can enable pluralized routes in sails by going to
`config/blueprints.js` and setting the `pluralize` variable to true.

## SailsSocketAdapter Options
The options below are for the SailsSocketAdapter. To see a list of options for the `SailsRESTAdapter` see the [RESTAdapter docs](http://emberjs.com/api/data/classes/DS.RESTAdapter.html).

#### namespace
Type: `String`
Default value: `''`

The prefix to add to the request uris.

#### log
Type: `Boolean`
Default value: `false`

Set to true if you would like to see a log of all requests in the command line.

#### useCSRF
Type: `Boolean`
Default value: `false`

Used to map lowercase model names that sails uses to model names that ember can understand.


ember-data-sails-adapter 1.x
============================

An Ember Data adapter for Sails.js v0.9. 
- [latest release](https://github.com/bmac/ember-data-sails-adapter/releases/tag/1.0.0)
- [github branch](https://github.com/bmac/ember-data-sails-adapter/tree/1.x-master).

This package contains 2 Adapters, `DS.SailsSocketAdapter` and `DS.SailsRESTAdapter`. 

```bash
bower install ember-data-sails-adapter#1.0.1
```

```html
<script type="text/javascript" src="/bower_components/ember-data-sails-adapter/ember-data-sails-adapter.js"></script>
```

#### SailsSocketAdapter

The `SailsSocketAdapter` uses Sails's [websocket support](http://sailsjs.org/#!documentation/sockets) to find, create and delete records. This has the benefit of automatically subscribing to the Sails' `update`, `create` and `delete` events for for the model. The adapter will add or update records in the store when a Sails emits an `update`, `create` and `delete` event.

```javascript
App.ApplicationAdapter = DS.SailsSocketAdapter.extend({
    namespace: '/api/v1',
    log: false,
    modelNameMap: {
      userprofile: 'UserProfile'
    }
});
```

#### SailsRESTAdapter

The `SailsRESTAdapter` works similarly to the Ember [RESTAdapter](http://emberjs.com/api/data/classes/DS.RESTAdapter.html). The main differences are this adapter automatically attempts to use the `JSONSerializer` instead of the `RESTSerializer` because it more closely matches the JSON response from Sails. Additionally it will re-format the error messages returned by Sails to match the format that Ember Data expects. With the `SailsRESTAdapter` you will not get the live updateing that comes with the  `SailsSocketAdapter`. However, because websockets do not support compression using the `SailsRESTAdapter` may be beneficial when you are expecting a large response from the Sails api.

```javascript
App.ApplicationAdapter = DS.SailsRESTAdapter.extend({
    namespace: '/api/v1'
});
```

#### ApplicationSerializer
In Sails v0.9, the `SailsSocketAdapter` and `SailsRESTAdapter` both work best using the `JSONSerializer`. As a result of a bug in the stock `JSONSerializer` it is recommend that you create an `ApplicationSerializer` by extending the `JSONSerializer` like in the example below.

```javascript
App.ApplicationSerializer = DS.JSONSerializer.extend({
  // Fix broken extractArray see:
  // https://github.com/emberjs/data/pull/1479
  extractArray: function(store, type, arrayPayload) {
    var serializer = this;
    return Ember.ArrayPolyfills.map.call(arrayPayload, function(singlePayload) {
      return serializer.extractSingle(store, type, singlePayload);
    });
  },
  // Allow JSONSerializer to work with RESTAdapter
  // https://github.com/emberjs/data/blob/7e83ed158034cf7fedf2a7113a82de5d5ce67e76/packages/ember-data/lib/adapters/rest_adapter.js#L379
  serializeIntoHash: function(hash, type, record, options) {
    Ember.merge(hash, this.serialize(record, options));
  }
});
```


## SailsSocketAdapter Options
The options below are for the SailsSocketAdapter. To see a list of options for the `SailsRESTAdapter` see the [RESTAdapter docs](http://emberjs.com/api/data/classes/DS.RESTAdapter.html).

#### namespace
Type: `String`
Default value: `''`

The prefix to add to the request uris.

#### log
Type: `Boolean`
Default value: `false`

Set to true if you would like to see a log of all requests in the command line.

#### modelNameMap
Type: `Object`
Default value: `{}`

Used to map lowercase model names that sails uses to model names that ember can understand.

## License
[MIT License](http://en.wikipedia.org/wiki/MIT_License)
