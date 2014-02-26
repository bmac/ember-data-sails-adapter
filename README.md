ember-data-sails-adapter
========================

An Ember data adapter for Sails.js sockets


```bash
bower install ember-data-sails-adapter
```

```html
<script type="text/javascript" src="/bower_components/ember-data-sails-adapter/sails-adapter.js"></script>
```

```javascript
App.ApplicationAdapter = DS.SailsAdapter.extend({
    prefix: '/api/v1',
    log: false,
    modelNameMap: {
      userprofile: 'UserProfile'
    }
});
```


## Options

#### prefix
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

#### method
Type: `String`
Default value: `ajax`
Supported Options `ajax` or `socket`

Determines what networking method to use when requesting or sending data to/from the server. Ajax is the default options because websockets do not support compression yet. Note even when using `ajax` the sails adapter will still attempt to listen to Sails' socketIO events and add new records or update existing records in the store.

