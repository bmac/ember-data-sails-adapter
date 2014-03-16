var socket = {on: function(){}};

test( "DS.SailsAdapter exists", function() {
  ok(DS.SailsAdapter);
  ok(DS.SailsSocketAdapter);
  ok(DS.SailsRESTAdapter);
});

test( "SailsSocketAdapter supports ember adapter methods", function() {
  var adapter = DS.SailsSocketAdapter.create();
  equal(typeof adapter.find, 'function');
  equal(typeof adapter.createRecord, 'function');
  equal(typeof adapter.updateRecord, 'function');
  equal(typeof adapter.deleteRecord, 'function');
  equal(typeof adapter.findQuery, 'function');
});


asyncTest( "SailsSocketAdapter supports a url namespace", function() {
  DS.SailsSocketAdapter.reopen({
    namespace: 'prefix/v1',
    socket: function(url) {
      start();
      equal(url, 'prefix/v1/');
    }
  });

  var adapter = DS.SailsSocketAdapter.create();
  var store = {};
  adapter.findAll(store, DS.Model);
});


test( "SailsSocketAdapter should reformat sails errors", function() {
  var adapter = DS.SailsSocketAdapter.create();
  var error = adapter.formatError({
    "status":500,
    "errors":[{
      "ValidationError": {
        "endDate":[{"data":"Mon, 02 Jan 2012 02:00:00 GMT",
                    "message":"Validation error: \"Mon, 02 Jan 2012 02:00:00 GMT\" Rule \"after(Wed, 01 Jan 2014 01:00:00 GMT)\" failed.",
                    "rule":"after",
                    "args":["Wed, 01 Jan 2014 01:00:00 GMT"]}
                  ]}
    }]
  });

  equal(error.endDate, "Validation error: \"Mon, 02 Jan 2012 02:00:00 GMT\" Rule \"after(Wed, 01 Jan 2014 01:00:00 GMT)\" failed.");
});
