ember-data-sails-adapter
========================

An Ember data adaptor for Sails.js sockets


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


### Options

#### prefix
Type: `String`
Default value: `''`

The filename used to store the access token after a successful auth.

#### log
Type: `Boolean`
Default value: `false`

Set to true if you would like to see a log of all requests in the command line.

#### modelNameMap
Type: `Object`
Default value: `{}`

Used to map lowercase model names that sails uses to model names that ember can understand.
