/*global Ember*/
/*global DS*/
/*global socket*/
'use strict';

var RSVP = Ember.RSVP;
var get = Ember.get;

DS.SailsAdapter = DS.Adapter.extend({
  init: function () {
    this._listenToSocket();
  },

  find: function(store, type, id) {
    var url = type.url;
    url = url.fmt(id);

    return this.socket(url, 'get');
  },

  createRecord: function(store, type, record) {
    var url = type.url;
    var data = {};
    var serializer = store.serializerFor(type.typeKey);
    serializer.serializeIntoHash(data, type, record, { includeId: true });

    return this.socket(url, 'post', data);
  },

  updateRecord: function(store, type, record) {
    var url = type.url;
    var data = {};
    var serializer = store.serializerFor(type.typeKey);

    serializer.serializeIntoHash(data, type, record);

    var id = get(record, 'id');
    url = url.fmt(id);

    return this.socket(url, 'put', data);
  },

  deleteRecord: function(store, type, record) {
    var url = type.url;
    var data = {};
    var serializer = store.serializerFor(type.typeKey);

    serializer.serializeIntoHash(data, type, record);

    var id = get(record, 'id');
    url = url.fmt(id);

    return this.socket(url, 'delete', data);
  },

  findAll: function(store, type, sinceToken) {
    return this.socket(type.url, 'get');
  },

  findQuery: function(store, type, query) {
    return this.socket(type.url, 'get', query);
  },

  isErrorObject: function(data) {
    return !!data.status;
  },

  socket: function(url, method, data ) {
    method = method.toLowerCase();
    return new RSVP.Promise(function(resolve, reject) {
      socket[method](url, function (data) {
        if (this.isErrorObject(data)) {
          reject(data);
        } else {
          resolve(data);
        }
      });
    });
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
