ember-data-sails-adapter
========================

An Ember Data adapter for Sails.js v0.9. This package contains 2 Adapters, `DS.SailsSocketAdapter` and `DS.SailsRESTAdapter`. 

```bash
bower install ember-data-sails-adapter
```

```html
<script type="text/javascript" src="/bower_components/ember-data-sails-adapter/ember-data-sails-adapter.js"></script>
```

#### SailsSocketAdapter

The `SailsSocketAdapter` uses Sails's [websocket support](http://sailsjs.org/#!documentation/sockets) to find, create and delete records. This has the benifit of automatically subscribing to the Sails' `update`, `create` and `delete` events for for the model. The adapter will add or update records in the store when a Sails emits an `update`, `create` and `delete` event.

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

The `SailsRESTAdapter` works similarly to the Ember [RESTAdapter](http://emberjs.com/api/data/classes/DS.RESTAdapter.html). The main differences are this adapter automatically attempts to use the `JSONSerializer` instead of the `RESTSerializer` because it more closely matches the JSON response from Sails. Additionally it will re-format the error messages returned by Sails to match the format that Ember Data expects. With the `SailsRESTAdapter` you will not get the live updateing that comes with the  `SailsSocketAdapter`. However, because websockets do not support compression using the `SailsRESTAdapter` may be benificial when you are expecting a large response from the Sails api.

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
    return map.call(arrayPayload, function(singlePayload) {
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
