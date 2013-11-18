/*global Ember*/
/*global DS*/
/*global socket*/
'use strict';

var RSVP = Ember.RSVP;
var get = Ember.get;

DS.SailsAdapter = DS.Adapter.extend({
  prefix: '',
  init: function () {
    this._listenToSocket();
    this._super();
  },

  find: function(store, type, id) {
    return this.socket(this.buildURL(type.typeKey, id), 'get');
  },

  createRecord: function(store, type, record) {
    var data = {};
    var serializer = store.serializerFor(type.typeKey);
    serializer.serializeIntoHash(data, type, record, { includeId: true });

    return this.socket(this.buildURL(type.typeKey), 'post', data);
  },

  updateRecord: function(store, type, record) {
    var data = {};
    var serializer = store.serializerFor(type.typeKey);

    serializer.serializeIntoHash(data, type, record);

    var id = get(record, 'id');

    return this.socket(this.buildURL(type.typeKey, id), 'put', data);
  },

  deleteRecord: function(store, type, record) {
    var data = {};
    var serializer = store.serializerFor(type.typeKey);
    var id = get(record, 'id');

    serializer.serializeIntoHash(data, type, record);

    return this.socket(this.buildURL(type.typeKey, id), 'delete', data);
  },

  findAll: function(store, type, sinceToken) {
    return this.socket(this.buildURL(type.typeKey), 'get');
  },

  findQuery: function(store, type, query) {
    return this.socket(this.buildURL(type.typeKey), 'get', query);
  },

  isErrorObject: function(data) {
    return !!data.status;
  },

  socket: function(url, method, data ) {
    var isErrorObject = this.isErrorObject.bind(this);
    method = method.toLowerCase();
    return new RSVP.Promise(function(resolve, reject) {
      socket[method](url, function (data) {
        if (isErrorObject(data)) {
          reject(data);
        } else {
          resolve(data);
        }
      });
    });
  },

  buildURL: function(type, id) {
    var url = [];

    if (type) { url.push(type); }
    if (id) { url.push(id); }

    url = url.join('/');
    url = this.prefix + '/' + url;

    return url;
  },

  _listenToSocket: function() {
    var store = this.container.lookup('store:main');
    socket.on('message', function (message) {
      if (message.verb === 'create') {
        store.push(message.model, message.data);
      }
      if (message.verb === 'update') {
        store.push(message.model, message.data);
      }
      if (message.verb === 'destroy') {
        store.deleteRecord({id: message.id});
      }
    });
  }
});
