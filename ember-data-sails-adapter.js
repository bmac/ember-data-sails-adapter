(function() {
    /*global Ember*/
    /*global DS*/
    /*global io*/
    'use strict';

    var RSVP = Ember.RSVP;
    var get = Ember.get;

    var SailsAdapterMixin = Ember.Mixin.create({
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
        }
    });

    DS.SailsRESTAdapter = DS.RESTAdapter.extend(SailsAdapterMixin, {
        ajaxError: function(jqXHR) {
            var error = this._super(jqXHR);
            var data = Ember.$.parseJSON(jqXHR.responseText);

            if (data.errors) {
                return new DS.InvalidError(this.formatError(data));
            } else {
                return error;
            }
        }
    });

    DS.SailsSocketAdapter = DS.SailsAdapter = DS.Adapter.extend(SailsAdapterMixin, {
        defaultSerializer: '-default',
        prefix: '',
        camelize: true,
        log: false,
        useCSRF: false,
        CSRFToken: "",
        pluralize: false,
        listeningModels: {},
        ready: false,
        init: function() {

            if (this.useCSRF) {
                io.socket.get('/csrfToken', function response(tokenObject) {
                    this.CSRFToken = tokenObject._csrf;
                    this.ready = true;
                }.bind(this));
            } else {
                this.ready = true;
            }
        },


        // TODO find a better way to handle this

        // Reason: In a Sails Model updated, created, or destoryed message
        // the model name is always lowercase. This makes it difficult to
        // lookup models with multipart names on the ember container.

        // One solution could be to implement a custom resolveModel method
        // on the resolver to work with lowercase names. But in some cases
        // we don't want to impose a custom resolver requirement on users of
        // the sails_adapter.

        // This modelName hash is an ugly escape has that allows a user to
        // define a mapping between the sails lowercase model name and a
        // string that ember can use to recognize a model with multiple
        // parts.

        // For Example A `User` model would not need to be registered with
        // this map because ember can use the string 'user' to look up the
        // model just fine. However a `ContentType` model will need to be
        // registered with this map because attempting to lookup a model
        // named 'contenttype' will not return the `ContentType` model.

        // modelNameMap: {'contenttype': 'ContentType'}
        modelNameMap: {},

        find: function(store, type, id) {
            this._listenToSocket(type.typeKey);
            return this.socket(this.buildURL(type.typeKey, id), 'get');
        },

        createRecord: function(store, type, record) {
            this._listenToSocket(type.typeKey);
            var serializer = store.serializerFor(type.typeKey);
            var data = serializer.serialize(record, {
                includeId: true
            });

            return this.socket(this.buildURL(type.typeKey), 'post', data);
        },

        updateRecord: function(store, type, record) {
            this._listenToSocket(type.typeKey);
            var serializer = store.serializerFor(type.typeKey);
            var data = serializer.serialize(record);

            var id = get(record, 'id');

            return this.socket(this.buildURL(type.typeKey, id), 'put', data);
        },

        deleteRecord: function(store, type, record) {
            this._listenToSocket(type.typeKey);
            var serializer = store.serializerFor(type.typeKey);
            var id = get(record, 'id');

            var data = serializer.serialize(record);

            return this.socket(this.buildURL(type.typeKey, id), 'delete', data);
        },

        findAll: function(store, type, sinceToken) {
            this._listenToSocket(type.typeKey);
            return this.socket(this.buildURL(type.typeKey), 'get');
        },

        findQuery: function(store, type, query) {
            this._listenToSocket(type.typeKey);
            return this.socket(this.buildURL(type.typeKey), 'get', query);
        },

        isErrorObject: function(data) {
            return !!(data.error && data.model && data.summary && data.status);
        },

        socket: function(url, method, data) {
            var isErrorObject = this.isErrorObject.bind(this);
            method = method.toLowerCase();
            var adapter = this;
            adapter._log(method, url, data);
            adapter.method = method;
            adapter.data = data;
            adapter.url = url;

            return new RSVP.Promise(this.promise.bind(adapter));


        },

        promise: function(resolve, reject) {

            this.checkCSRF(this.method, this.data, function() {
                var adapter = this;

                io.socket[adapter.method](adapter.url, adapter.data, function(data) {
                    if (adapter.isErrorObject(data)) {
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

            }.bind(this));
        },

        buildURL: function(type, id) {

            var url = [];

            type = type || '';
            if (this.camelize) {
                type = Ember.String.camelize(type);
            }

            if (this.pluralize) {
                var inflector = Ember.Inflector.inflector;
                type = inflector.pluralize(type);
            }

            if (type) {
                url.push(type);
            }
            if (id) {
                url.push(id);
            }

            url = url.join('/');
            var namespace = this.namespace || this.prefix;
            url = namespace + '/' + url;

            return url;
        },

        _listenToSocket: function(model) {
            if (model in this.listeningModels) {
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
                if (!(model in message.data)) {
                    var obj = {};

                    if (message.id) {
                        message.data.id = message.id;
                    }

                    obj[model] = message.data;
                }

                var record = serializer.extractSingle(store, type, obj[model]);
                store.push(socketModel, record);
            }

            function destroy(message) {
                var type = store.modelFor(socketModel);
                var record = store.getById(type, message.id);

                if (record && typeof record.get('dirtyType') === 'undefined') {
                    record.unloadRecord();
                }
            }

            var eventName = Ember.String.camelize(model).toLowerCase();

            io.socket.on(eventName, function(message) {
                // Left here to help further debugging.
                console.log("Got message on Socket : " + JSON.stringify(message));

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
        // We use ready state incase our application is waitng on the CSRF pull
        readyState: function(callback) {
            if (this.ready)
                callback();
            else
                setTimeout(function() {
                    this.readyState(callback);
                }.bind(this), 100);
        },

        checkCSRF: function(method, data, callback) {
            if (method !== 'get')
                this.readyState(function() {
                    if (!this.useCSRF) return data;
                    if (this.CSRFToken.length === 0) {
                        throw new Error("CSRF Token not fetched yet.");
                    }
                    data['_csrf'] = this.CSRFToken;
                    //return data;
                    callback(data);

                }.bind(this));
            else
                callback(data);
        }
    });

})();