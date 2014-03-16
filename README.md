ember-data-sails-adapter
========================

An Ember data adapter for Sails.js v0.9 sockets


```bash
bower install ember-data-sails-adapter
```

```html
<script type="text/javascript" src="/bower_components/ember-data-sails-adapter/sails_adapter.js"></script>
```

```javascript
App.ApplicationAdapter = DS.SailsSocketAdapter.extend({
    namespace: '/api/v1',
    log: false,
    modelNameMap: {
      userprofile: 'UserProfile'
    }
});
```

```javascript
App.ApplicationAdapter = DS.SailsRESTAdapter.extend({
    namespace: '/api/v1'
});
```

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


## Options

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
