(function() {
/*global Ember*/
/*global DS*/
/*global io*/
'use strict';

var RSVP = Ember.RSVP;
var get = Ember.get;

DS.SailsRESTAdapter = DS.RESTAdapter.extend({
  defaultSerializer: '-default',
  ajaxError: function(jqXHR) {
    var error = this._super(jqXHR);
    var data = Ember.$.parseJSON(jqXHR.responseText);

    if (data.errors) {
      return new DS.InvalidError(this.formatError(data));
    } else {
      return error;
    }
  },
  /*
   Sails error objects look something like this:

     error: "E_VALIDATION",
     model: "User",
     summary: "1 attribute is invalid",
     status: 400,
     invalidAttributes: {
       name: [
         {
           rule: "minLength",
           message: "Validation error: "bar" Rule "minLength(10)" failed."
         }
       ]
     }

   */
  formatError: function(error) {
    return Object.keys(error.invalidAttributes).reduce(function(memo, property) {
      memo[property] = error.invalidAttributes[property].map(function(err) {
        return err.message;
      });
      return memo;
    }, {});
  },

  pathForType: function(type) {
    var camelized = Ember.String.camelize(type);
    return Ember.String.singularize(camelized);
  }
});

DS.SailsSocketAdapter = DS.SailsAdapter = DS.SailsRESTAdapter.extend({
  useCSRF: false,
  CSRFToken: '',
  listeningModels: {},
  init: function () {
    this._super();
    if(this.useCSRF) {
      io.socket.get('/csrfToken', function response(tokenObject) {
        this.CSRFToken = tokenObject._csrf;
      }.bind(this));
    }
  },

  isErrorObject: function(data) {
    return !!(data.error && data.model && data.summary && data.status);
  },


  ajax: function(url, method, data) {
    return this.socket(url, method, data);
  },

  socket: function(url, method, data) {
    var isErrorObject = this.isErrorObject.bind(this);
    method = method.toLowerCase();
    var adapter = this;
    adapter._log(method, url, data);
    if(method !== 'get')
      this.checkCSRF(data);
    return new RSVP.Promise(function(resolve, reject) {
      io.socket[method](url, data, function (data) {
        if (isErrorObject(data)) {
          adapter._log('error:', data);
          if (data.errors) {
            reject(new DS.InvalidError(adapter.formatError(data)));
          } else {
            reject(data);
          }
        } else {
          resolve(data);
        }
      });
    });
  },

  buildURL: function(type, id) {
    this._listenToSocket(type);
    return this._super.apply(this, arguments);
  },

  _listenToSocket: function(model) {
    if(model in this.listeningModels) {
      return;
    }
    var self = this;
    var store = this.container.lookup('store:main');
    var socketModel = model;

    function findModelName(model) {
      var mappedName = self.modelNameMap[model];
      return mappedName || model;
    }

    function pushMessage(message) {
      var type = store.modelFor(socketModel);
      var serializer = store.serializerFor(type.typeKey);
      // Messages from 'created' don't seem to be wrapped correctly,
      // however messages from 'updated' are, so need to double check here.
      if(!(model in message.data)) {
        var obj = {};
        obj[model] = message.data;
        message.data = obj;
      }
      var record = serializer.extractSingle(store, type, message.data);
      // If the id is not present in the record, get it from the message
      if (!record[socketModel].id) {
        record[socketModel].id = message.id;
      }
      store.push(socketModel, record[socketModel]);
    }

    function destroy(message) {
      var type = store.modelFor(socketModel);
      var record = store.getById(type, message.id);

      if ( record && typeof record.get('dirtyType') === 'undefined' ) {
        record.unloadRecord();
      }
    }

    var eventName = Ember.String.camelize(model).toLowerCase();
    io.socket.on(eventName, function (message) {
      // Left here to help further debugging.
      //console.log("Got message on Socket : " + JSON.stringify(message));
      if (message.verb === 'created') {
        // Run later to prevent creating duplicate records when calling store.createRecord
        Ember.run.later(null, pushMessage, message, 50);
      }
      if (message.verb === 'updated') {
        pushMessage(message);
      }
      if (message.verb === 'destroyed') {
        destroy(message);
      }
    });

    // We add an emtpy property instead of using an array
    // ao we can utilize the 'in' keyword in first test in this function.
    this.listeningModels[model] = 0;
  },

  _log: function() {
    if (this.log) {
      console.log.apply(console, arguments);
    }
  },

  checkCSRF: function(data) {
    if(!this.useCSRF) return data;
    if(this.CSRFToken.length === 0) {
      throw new Error("CSRF Token not fetched yet.");
    }
    data._csrf = this.CSRFToken;
    return data;
  }
});

})();
