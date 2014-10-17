//   Disapproval.js 0.0.9
//   (c) 2014 Aaron O'Connell, 42Floors
// 
//   with lots of the internals taken from Backbone.js
//   (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//   http://backbonejs.org
// 
//   Disapproval may be freely distributed under the MIT license.

(function (root, factory) {

  // Set up Disapproval appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function (_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Disapproval.
      root.Disapproval = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Disapproval = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function (root, Disapproval, _, $) {

  var previousDisapproval = root.Disapproval;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var slice = array.slice;

  // Current version of the library. Keep in sync with `package.json`.
  Disapproval.VERSION = '0.0.9';

  // For Disapproval's purposes, jQuery, Zepto, or Ender the `$` variable.
  Disapproval.$ = $;

  // Runs Disapproval.js in *noConflict* mode, returning the `Disapproval` variable
  // to its previous owner. Returns a reference to this Disapproval object.
  Disapproval.noConflict = function () {
    root.Disapproval = previousDisapproval;
    return this;
  };

  var Events = Disapproval.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function (name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({ callback: callback, context: context, ctx: context || this });
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function (name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function () {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function (name, callback, context) {
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;

      // Remove all callbacks for all events.
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }

      var names = name ? [name] : _.keys(this._events);
      for (var i = 0, length = names.length; i < length; i++) {
        name = names[i];

        // Bail out if there are no events stored.
        var events = this._events[name];
        if (!events) continue;

        // Remove all callbacks for this event.
        if (!callback && !context) {
          delete this._events[name];
          continue;
        }

        // Find any remaining events.
        var remaining = [];
        for (var j = 0, k = events.length; j < k; j++) {
          var event = events[j];
          if (
            callback && callback !== event.callback &&
            callback !== event.callback._callback ||
            context && context !== event.context
          ) {
            remaining.push(event);
          }
        }

        // Replace events if there are any remaining.  Otherwise, clean up.
        if (remaining.length) {
          this._events[name] = remaining;
        } else {
          delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function (name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function (obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{ change: action }`
  // in terms of the existing API.
  var eventsApi = function (obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, length = names.length; i < length; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Disapproval events have 3 arguments).
  var triggerEvents = function (events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = { listenTo: 'on', listenToOnce: 'once' };

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function (implementation, method) {
    Events[method] = function (obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Allow the `Disapproval` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Disapproval, Events);


  // Disapproval.Model
  // --------------

  // Disapproval **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Disapproval.Model = function (attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function () {},

    // Return a copy of the model's `attributes` object.
    toJSON: function (options) {
      return _.clone(this.attributes);
    },

    // Get the value of an attribute.
    get: function (attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function (attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function (attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function (key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{ key: value }` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, length = changes.length; i < length; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function (attr, options) {
      return this.set(attr, void 0, _.extend({}, options, { unset: true }));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function (options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, { unset: true }));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function (attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function (diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function (attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function () {
      return _.clone(this._previousAttributes);
    },

    // Create a new model with identical attributes to this one.
    clone: function () {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function () {
      return !this.has(this.idAttribute);
    }
  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit', 'chain', 'isEmpty'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function (method) {
    if (!_[method]) return;
    Model.prototype[method] = function () {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });


  // Disapproval.Collection
  // -------------------

  // If models tend to represent a single row of data, a Disapproval Collection is
  // more analogous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Disapproval.Collection = function (models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({ silent: true }, options));
  };

  // Default options for `Collection#set`.
  var setOptions = { add: true, remove: true, merge: true };
  var addOptions = { add: true, remove: false };

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function () {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // The default model for a collection is just a **Disapproval.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function () {},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function (options) {
      return this.map(function (model) { return model.toJSON(options); });
    },

    // Add a model, or list of models to the set.
    add: function (models, options) {
      return this.set(models, _.extend({ merge: false }, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function (models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      for (var i = 0, length = models.length; i < length; i++) {
        var model = models[i] = this.get(models[i]);
        if (!model) continue;
        var id = this.modelId(model.attributes);
        if (id != null) delete this._byId[id];
        delete this._byId[model.cid];
        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function (models, options) {
      options = _.defaults({}, options, setOptions);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : models.slice();
      var id, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references
      for (var i = 0, length = models.length; i < length; i++) {
        attrs = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(attrs)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge && attrs !== existing) {
            attrs = this._isModel(attrs) ? attrs.attributes : attrs;
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (!model) continue;
        id = this.modelId(model.attributes);
        if (order && (model.isNew() || !modelMap[id])) order.push(model);
        modelMap[id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (var i = 0, length = this.length; i < length; i++) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (var i = 0, length = toAdd.length; i < length; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (var i = 0, length = orderedModels.length; i < length; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({ silent: true });

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        var addOpts = at != null ? _.clone(options) : options;
        for (var i = 0, length = toAdd.length; i < length; i++) {
          if (at != null) addOpts.index = at + i;
          (model = toAdd[i]).trigger('add', model, this, addOpts);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function (models, options) {
      options || (options = {});
      for (var i = 0, length = this.models.length; i < length; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({ silent: true }, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function (model, options) {
      return this.add(model, _.extend({ at: this.length }, options));
    },

    // Remove a model from the end of the collection.
    pop: function (options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function (model, options) {
      return this.add(model, _.extend({ at: 0 }, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function (options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function () {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function (obj) {
      if (obj == null) return void 0;
      var id = this.modelId(this._isModel(obj) ? obj.attributes : obj);
      return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function (index) {
      if (index < 0) index += this.length;
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function (attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function (model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function (attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function (options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function (attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Create a new collection with an identical list of models as this one.
    clone: function () {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator
      });
    },

    // Define how to uniquely identify models in the collection.
    modelId: function (attrs) {
      return attrs[this.model.prototype.idAttribute || 'id'];
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function () {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function (attrs, options) {
      if (this._isModel(attrs)) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options = options ? _.clone(options) : {};
      options.collection = this;
      return new this.model(attrs, options);
    },

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel: function (model) {
      return model instanceof Model;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function (model, options) {
      this._byId[model.cid] = model;
      var id = this.modelId(model.attributes);
      if (id != null) this._byId[id] = model;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function (model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function (event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (event === 'change') {
        var prevId = this.modelId(model.previousAttributes());
        var id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Disapproval Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample', 'partition'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function (method) {
    if (!_[method]) return;
    Collection.prototype[method] = function () {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function (method) {
    if (!_[method]) return;
    Collection.prototype[method] = function (value, context) {
      var iterator = _.isFunction(value) ? value : function (model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Disapproval.View
  // -------------

  // Disapproval Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Disapproval.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Disapproval.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Disapproval.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"svg"`.
    tagName: 'svg',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Disapproval.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Disapproval.$ ? element : Disapproval.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Disapproval views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el;
        if (_.include(svg_tags, _.result(this, 'tagName'))) {
          $el = Disapproval.$(document.createElementNS('http://www.w3.org/2000/svg', _.result(this, 'tagName'))).attr(attrs);
        } else {
          $el = Disapproval.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        }
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Disapproval.Chart
  // -------------------

  // If models tend to represent a single row of data, a Disapproval Collection is
  // more analogous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.

  var Chart = Disapproval.Chart = function (data, options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, chartOptions));
    this._ensureElement();
    this._attachToContainer();
    this._reset();
    this.initialize.apply(this, arguments);
    this.listenTo(Disapproval, 'window:shrink', this._shrink);
    this.listenTo(Disapproval, 'window:grow', this._grow);
    this.listenTo(Disapproval, 'window:set_size', this._setSize);
    this.listenTo(Disapproval, 'window:set_canvas', this._setCanvas);
    this.listenTo(Disapproval, 'window:set_axes', this._setAxes);
    this.listenTo(Disapproval, 'window:set_threshold', this._setThreshold);
    if (data) this.reset(data, _.extend({ silent: true }, options));
    this.delegateEvents();
    this.render();
  };

  // List of chart options to be merged as properties.
  var chartOptions = ['container', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  _.extend(Chart.prototype, View.prototype, {
    aspectRatio: 16 / 9,
    container: 'body',

    events: {
      'mousemove': '_triggerMousemove',
      'mouseleave': '_triggerMouseleave'
    },

    _triggerMousemove: function (event) {
      var offset = this.$el.offset();
      Disapproval.trigger('chart:mousemove', {
        x: event.pageX - offset.left,
        y: event.pageY - offset.top,
        chart: this
      });
    },

    _triggerMouseleave: function (event) {
      if (!$(event.relatedTarget).hasClass('tooltip')) {
        Disapproval.trigger('chart:mouseleave', { chart: this });
      }
    },

    _attachToContainer: function () {
      this.$container = $(this.container);
      this.$container.append(this.$el);
    },

    _reset: function () {
      this.datasets = [];
      this.data_range = { x_min: Infinity, x_max: -Infinity, y_min: Infinity, y_max: -Infinity };
      this.canvas = {
        left: { width: 0, height: 0, offset: { x: 0, y: 0 }},
        bottom: { width: 0, height: 0, offset: { x: 0, y: 0 }},
        main: { width: 0, height: 0, offset: { x: 0, y: 0 }}
      };
      this.tooltipCollection = new Disapproval.Collection([], { comparator: function (model) { return -model.get('y'); } });
      this.tooltipCollection.chart = this;
    },

    _setBounds: function () {
      // TODO: this could be optimized, especially for fixed x-range
      _.each(this.datasets, function (dataset) {
        var x_min = _.min(dataset.pluck('x'));
        var x_max = _.max(dataset.pluck('x'));
        var y_min = _.min(dataset.pluck('y'));
        var y_max = _.max(dataset.pluck('y'));
        if ( x_min < this.data_range.x_min) this.data_range.x_min = x_min;
        if ( x_max > this.data_range.x_max) this.data_range.x_max = x_max;
        if ( y_min < this.data_range.y_min) this.data_range.y_min = y_min;
        if ( y_max > this.data_range.y_max) this.data_range.y_max = y_max;
      }, this);

      var natural_y_bounds = this._naturalBoundsY();
      var natural_x_bounds = this._naturalBoundsX();
      this.bounds = {
        y_min: natural_y_bounds.min,
        y_max: natural_y_bounds.max,
        y_step: natural_y_bounds.step,
        x_min: natural_x_bounds.min,
        x_max: natural_x_bounds.max,
        x_step: natural_x_bounds.step
      }
    },

    _naturalBoundsY: function () {
      var range = this.data_range.y_max - this.data_range.y_min
      var step = Math.pow(10, String(Math.floor(range)).length - 1);
      while (range / step < 11) {
        step /= 2;
      }
      var lower_bound;
      if (this.data_range.y_min >= 0 && this.data_range.y_min <= step) {
        lower_bound = 0;
      } else {
        lower_bound = Math.floor(this.data_range.y_min / step) * step;
      }

      var upper_bound = this.data_range.y_max + step / 2;
      return { min: lower_bound, max: upper_bound, step: step };
    },

    _naturalBoundsX: function () {
      var step = (this.data_range.x_max - this.data_range.x_min) / (this.max_points - 1)
      var lower_bound;
      if (this.data_range.x_min >= 0 && this.data_range.x_min <= step) {
        lower_bound = 0;
      } else {
        lower_bound = Math.floor(this.data_range.x_min - step);
      }
      var upper_bound = this.data_range.x_max + step / 2;

      return { min: lower_bound, max: upper_bound, step: step };
    },

    _setAxes: function () {
      var padding = 7;

      // y-axis
      var y_step = this.bounds.y_step;
      while ((this.canvas.left.label.height + padding) * _.range(this.bounds.y_min, this.bounds.y_max, y_step).length > this.canvas.left.height) {
        y_step *= 2;
      }
      var y_values = _.map(_.range(this.bounds.y_min, this.bounds.y_max, y_step), function (y) {
        return {
          y: y,
          label: String(y) // TODO: format as desired
        };
      }, this);
      if (this.y_axis) {
        this.y_axis.set(y_values);
      } else {
        this.y_axis = new Disapproval.Collection(y_values);
        this.y_axis.chart = this;
      }

      // x-axis
      var labels = this.labels;
      while ((this.canvas.bottom.label.height + padding) * labels.length + this.canvas.bottom.label.width > this.canvas.bottom.width) {
        labels = _.select(labels, function (x, i) { return i % 2 == 0; });
      }
      if (this.x_axis) {
        this.x_axis.set(labels);
      } else {
        this.x_axis = new Disapproval.Collection(labels);
        this.x_axis.chart = this;
      }
    },

    _setThreshold: function () {
      this.threshold = this.xScale(this.data_range.x_max - this.data_range.x_min) / (this.max_points - 1) / 2;
    },

    _shrink: function () {
      this.$el.attr({ width: 0, height: 0 });
    },

    _grow: function () {
      // set height of container
      this.$container.height(Math.round(this.$container.width() / this.aspectRatio));
      // reset height with possibly updated width from scrollbar being added to screen
      this.$container.height(Math.round(this.$container.width() / this.aspectRatio));
    },

    _setSize: function () {
      this.width = this.$container.width();
      this.height = this.$container.height();
      this.$el.attr({
        width: this.width,
        height: this.height
      });
    },

    _setCanvas: function () {
      this._setCanvasWidths();
      this._setCanvasHeights();
    },

    _setCanvasWidths: function () {
      var temp_svg = svg$el('svg');
      var label = svg$el('text').html(String(this.bounds.y_max)).attr({
        fill: globalOptions.axes_font_color,
        'font-family': globalOptions.axes_font_family,
        'font-size': globalOptions.axes_font_size
      }); // Change from String to the correct function this if labels are formatted
      temp_svg.append(label);
      $('body').append(temp_svg);

      this.canvas.left.label = {
        width: label.width(),
        height: globalOptions.axes_font_size
      }
      temp_svg.remove();

      var padding = 10;
      var width = this.canvas.left.label.width + padding;
      if (width < globalOptions.y_axis_min_width) width = globalOptions.y_axis_min_width;
      this.canvas.left.width = this.canvas.bottom.offset.x = this.canvas.main.offset.x = width;
      this.canvas.bottom.width = this.canvas.main.width = this.width - width;
    },

    _setCanvasHeights: function () {
      var padding = 10;

      var temp_svg = svg$el('svg');
      $('body').append(temp_svg);

      this.canvas.bottom.label = {
        width: 0,
        height: 0
      };

      _.each(this.labels, function (label) {
        label = svg$el('text').html(label.label);
        temp_svg.append(label);
        var width = label.width();
        var height = parseInt(label.css('font-size'));
        if (width > this.canvas.bottom.label.width) this.canvas.bottom.label.width = width;
        if (height > this.canvas.bottom.label.height) this.canvas.bottom.label.height = height;
      }, this);
      temp_svg.remove();

      var label_width = this.canvas.bottom.label.width + padding;
      var max_available_label_space = this.canvas.bottom.width / _.range(this.bounds.x_min, this.bounds.x_max, this.bounds.x_step).length;
      var height;

      
      var first_x_tick_x_offset = this.xScale(this.data_range.x_min) + this.canvas.main.offset.x

      if (label_width > max_available_label_space || label_width / 2 > first_x_tick_x_offset) {
        this.canvas.bottom.label.is_tilted = true;
        height = this.canvas.bottom.label.width / Math.sqrt(2) + 2 * padding;
        this.canvas.bottom.width = this.canvas.main.width = this.canvas.bottom.width - this.canvas.bottom.label.width / Math.sqrt(2);
      } else {
        height = this.canvas.bottom.label.height + 2 * padding;
        this.canvas.bottom.label.is_tilted = false;
      }
      this.canvas.bottom.height = height;
      this.canvas.left.height = this.canvas.main.height = this.canvas.bottom.offset.y = this.height - height;
    },

    // public methods
    reset: function (data, options) {
      options || (options = {});
      this._reset();
      this.labels = data.labels;
      var color_palette = data.datasets.length > 10 ? color_palette_20 : color_palette_10;
      this.datasets = _.map(data.datasets, function (dataset, i) {
        var points = _.map(dataset.x, function (x, j) {
          return {
            x: dataset.x[j],
            y: dataset.y[j],
            meta: dataset.meta[j]
          };
        });
        var dataset_collection = new Disapproval.Collection(points);
        dataset_collection.name = dataset.name;
        dataset_collection.color = lineChartColoring(i, color_palette);
        dataset_collection.chart = this;
        return dataset_collection;
      }, this);
      this.max_points = _.max(_.map(this.datasets, function (dataset) { return dataset.length; }));
      this._setBounds();
      if (!options.silent) this.trigger('reset', this, options);
      // break apart resizing into steps so that all chart instances can execute each step together
      // before going on to the next
      Disapproval.trigger('window:shrink');
      Disapproval.trigger('window:grow');
      Disapproval.trigger('window:set_size');
      Disapproval.trigger('window:set_canvas');
      Disapproval.trigger('window:set_axes');
      Disapproval.trigger('window:set_threshold');
      Disapproval.trigger('window:render');
      return this;
    },

    xScale: function (x) {
      return x * this.canvas.main.width / (this.bounds.x_max - this.bounds.x_min);
    },

    yScale: function (y) {
      return this.canvas.main.height - y * this.canvas.main.height / (this.bounds.y_max - this.bounds.y_min);
    },

    render: function () {
      this.$el.append(new LeftView({ model: this }).$el);
      this.$el.append(new BottomView({ model: this }).$el);
      this.$el.append(new MainView({ model: this }).$el);
      this.tooltipCollection.$container = $('<div>', { class: 'tooltip container' }).css({
        position: 'absolute',
        'border-radius': 3,
        'background-color': 'rgba(0,0,0,0.8)',
        '-webkit-box-shadow': '0px 1px 2px rgba(0,0,0,0.2)',
        '-moz-box-shadow': '0px 1px 2px rgba(0,0,0,0.2)',
        'box-shadow': '0px 1px 2px rgba(0,0,0,0.2)'
      }).hide();
      $('body').append(this.tooltipCollection.$container.append(new TooltipView({ collection: this.tooltipCollection }).$el));
    },

    initialize: function () {}
  });






  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function (protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function () { return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function () { this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection.
  Model.extend = Collection.extend = View.extend = Chart.extend = extend;

  $(window).resize(_.debounce(function () {
    Disapproval.trigger('window:shrink');
    Disapproval.trigger('window:grow');
    Disapproval.trigger('window:set_size');
    Disapproval.trigger('window:set_canvas');
    Disapproval.trigger('window:set_axes');
    Disapproval.trigger('window:set_threshold');
    Disapproval.trigger('window:render');
  }, 300));

  var svg_tags = [
    'circle',
    'line',
    'polyline',
    'svg',
    'text'
  ];

  var color_palette_10 = [
    '151,187,205',
    '255,127,14',
    '44,160,44',
    '214,39,40',
    '148,103,189',
    '140,86,75',
    '227,119,194',
    '127,127,127',
    '188,189,34',
    '23,190,207'
  ];

  var color_palette_20 = [
    '151,187,205',
    '31,119,180',
    '255,127,14',
    '255,187,120',
    '44,160,44',
    '152,223,138',
    '214,39,40',
    '255,152,150',
    '148,103,189',
    '197,176,213',
    '140,86,75',
    '196,156,148',
    '227,119,194',
    '247,182,210',
    '127,127,127',
    '199,199,199',
    '188,189,34',
    '219,219,141',
    '23,190,207',
    '158,218,229'
  ];

  var globalOptions = {
    grid_stroke_color: "rgba(0,0,0,0.06)",
    grid_stroke_width: 1,
    grid_show_lines: true,

    axes_stroke_color: "rgba(0,0,0,0.15)",
    axes_stroke_width: 1,
    axes_font_family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    axes_font_size: 12,
    axes_font_color: "rgba(0,0,0,0.7)",
    y_axis_lower_bound_zero: false,
    x_axis_lower_bound_zero: false,
    y_axis_min_width: 0,

    point_radius: 3.8,
    point_stroke_width: 1.2,

    line_stroke_width: 2,

    tooltip_offset: 10,
    tooltip_font_family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    tooltip_font_size: 15,
    tooltip_font_weight: 'lighter',
    tooltip_letter_spacing: 1.8
  };

  function lineChartColoring(i, color_palette) {
    i = i % color_palette.length;
    return {
      fillColor: 'rgba(' + color_palette[i] + ',0.2)',
      strokeColor: 'rgba(' + color_palette[i] + ',1)',
      pointColor: 'rgba(' + color_palette[i] + ',1)',
      pointStrokeColor: "#fff",
      pointHighlightFill: "#fff",
      pointHighlightStroke: 'rgba(' + color_palette[i] + ',1)',
    };
  }

  function svg$el(tag_name, attributes) {
    attributes || (attributes = {});
    return Disapproval.$(document.createElementNS('http://www.w3.org/2000/svg', tag_name)).attr(attributes);
  }

  // LineView 
  // -------------------

  // A view extention for rendering polylines

  var LineView = Disapproval.View.extend({
    tagName: 'polyline',

    initialize: function () {
      this.listenTo(Disapproval, 'window:render', this.render);
      this.render();
    },

    render: function () {
      var points = this.collection.map(function (point) {
        var x = this.collection.chart.xScale(point.get('x')) + this.collection.chart.canvas.main.offset.x;
        var y = this.collection.chart.yScale(point.get('y')) + this.collection.chart.canvas.main.offset.y;
        return x + ' ' + y
      }, this).join(',');
      
      this.$el.attr({
        points: points,
        stroke: this.collection.color.strokeColor,
        fill: 'transparent',
        'stroke-width': globalOptions.line_stroke_width
      });
    }
  });

  // PointView
  // -------------------

  // A view extention for rendering points

  var PointView = Disapproval.View.extend({
    tagName: 'circle',

    initialize: function () {
      this.chart = this.model.collection.chart;
      this.listenTo(Disapproval, 'window:render', this.render);
      this.listenTo(Disapproval, 'chart:mousemove', this.checkProximity);
      this.listenTo(Disapproval, 'chart:mouseleave', this.removeHighlight);
      this.render();
    },

    render: function () {
      var x = this.chart.xScale(this.model.get('x')) + this.chart.canvas.main.offset.x;
      var y = this.chart.yScale(this.model.get('y')) + this.chart.canvas.main.offset.y;
      this.$el.attr({
        cx: x,
        cy: y,
        r: globalOptions.point_radius,
        'stroke-width': globalOptions.point_stroke_width
      });
      this.style();
    },

    checkProximity: function (event) {
      if (this.chart == event.chart) {
        var delta_x = event.x - this.chart.xScale(this.model.get('x')) - this.chart.canvas.main.offset.x;
        if (Math.abs(delta_x) < this.chart.threshold) {
          if (!this.is_highlighted) this.highlight();
        } else if (this.is_highlighted) {
          this.removeHighlight(event);
        }
      }
    },

    removeHighlight: function (event) {
      if (this.chart == event.chart) {
        this.is_highlighted = false;
        this.chart.tooltipCollection.remove(this.model);
        this.style();
      }
    },

    style: function () {
      this.$el.attr({
        fill: this.model.collection.color.pointColor,
        stroke: this.model.collection.color.pointStrokeColor
      });
    },

    highlight: function () {
      this.$el.attr({
        fill: this.model.collection.color.pointHighlightFill,
        stroke: this.model.collection.color.pointHighlightStroke
      });
      this.is_highlighted = true;
      this.chart.tooltipCollection.add(this.model);
    }
  });

  // LeftView 
  // -------------------

  // A view extention for rendering the y-axis and labels

  var LeftView = Disapproval.View.extend({
    className: 'canvas-left',

    initialize: function () {
      this.listenTo(this.model.y_axis, 'add', this.renderYTick);
      this.render();
    },

    render: function () {
      this.renderYLine();
      this.model.y_axis.each( function (model) {
        this.renderYTick(model);
      }, this);
    },

    renderYLine: function () {
      this.$el.append(new YLineView({ collection: this.model.x_axis }).$el);
    },

    renderYTick: function (model) {
      this.$el.append(new YTickView({ model: model }).$el);
      this.$el.append(new YLabelView({ model: model }).$el);
      if (globalOptions.grid_show_lines) {
        if (model.get('y') != this.model.bounds.y_min) {
          this.$el.append(new YGridView({ model: model }).$el);
        }
      }
    }
  });

  var YLineView = Disapproval.View.extend({
    tagName: 'line',

    initialize: function () {
      this.listenTo(this.collection, 'sort', this.render); // sort fires when collect set is finshed
      this.render();
    },

    render: function () {
      this.$el.attr({
        x1: this.collection.chart.canvas.left.width,
        x2: this.collection.chart.canvas.left.width,
        y1: this.collection.chart.canvas.left.offset.y,
        y2: this.collection.chart.canvas.left.offset.y + this.collection.chart.canvas.left.height,
        stroke: globalOptions.axes_stroke_color,
        'stroke-width': globalOptions.axes_stroke_width,
        'shape-rendering': 'crispEdges'
      });
    }
  });


  var YTickView = Disapproval.View.extend({
    tagName: 'line',

    initialize: function () {
      this.listenTo(this.model, 'remove', this.remove);
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function () {
      var tick_width = 5;
      var position = this.model.collection.chart.yScale(this.model.get('y'));
      this.$el.attr({
        x1: this.model.collection.chart.canvas.left.width - tick_width,
        x2: this.model.collection.chart.canvas.left.width,
        y1: position,
        y2: position,
        stroke: globalOptions.axes_stroke_color,
        'stroke-width': globalOptions.axes_stroke_width,
        'shape-rendering': 'crispEdges'
      });
    }
  });

  var YLabelView = Disapproval.View.extend({
    tagName: 'text',

    initialize: function () {
      this.listenTo(this.model, 'remove', this.remove);
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function () {
      var position = this.model.collection.chart.yScale(this.model.get('y'));

      this.$el.html(this.model.get('label'));
      this.$el.attr({
        fill: globalOptions.axes_font_color,
        'font-family': globalOptions.axes_font_family,
        'font-size': globalOptions.axes_font_size
      });

      var temp_svg = svg$el('svg');
      temp_svg.append(this.$el);
      $('body').append(temp_svg);
      var width = this.$el.width();
      temp_svg.remove();

      var label_margin_right = 10;
      this.$el.attr({
        x: this.model.collection.chart.canvas.left.width - width - label_margin_right,
        y: position + globalOptions.axes_font_size / 2 - 1 // Don't know why I need a 1 here, maybe lineheight of tick
      });

    }
  });

  var YGridView = Disapproval.View.extend({
    tagName: 'line',

    initialize: function () {
      this.listenTo(this.model, 'remove', this.remove);
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function () {
      var position = this.model.collection.chart.yScale(this.model.get('y'));
      this.$el.attr({
        x1: this.model.collection.chart.canvas.main.offset.x,
        x2: this.model.collection.chart.canvas.main.offset.x + this.model.collection.chart.canvas.main.width,
        y1: position,
        y2: position,
        stroke: globalOptions.grid_stroke_color,
        'stroke-width': globalOptions.grid_stroke_width,
        'shape-rendering': 'crispEdges'
      });
    }
  });

  var BottomView = Disapproval.View.extend({
    className: 'canvas-bottom',

    initialize: function () {
      this.listenTo(this.model.x_axis, 'add', this.renderXTick);
      this.render();
    },

    render: function () {
      this.$el.append(new XLineView({ collection: this.model.x_axis }).$el);
      this.model.x_axis.each(function (model) {
        this.renderXTick(model);
      }, this);
    },

    renderXTick: function (model) {
      this.$el.append(new XTickView({ model: model }).$el);
      this.$el.append(new XLabelView({ model: model }).$el);
      if (globalOptions.grid_show_lines) {
        if (model.get('x') != this.model.bounds.x_min) {
          this.$el.append(new XGridView({ model: model }).$el);
        }
      }
    }

  });

  var XLineView = Disapproval.View.extend({
    tagName: 'line',

    initialize: function () {
      this.listenTo(this.collection, 'sort', this.render); // sort fires when collect set is finshed
      this.render();
    },

    render: function () {
      this.$el.attr({
        x1: this.collection.chart.canvas.bottom.offset.x,
        x2: this.collection.chart.canvas.bottom.offset.x + this.collection.chart.canvas.bottom.width,
        y1: this.collection.chart.canvas.bottom.offset.y,
        y2: this.collection.chart.canvas.bottom.offset.y,
        stroke: globalOptions.axes_stroke_color,
        'stroke-width': globalOptions.axes_stroke_width,
        'shape-rendering': 'crispEdges'
      });
    }
  });

  var XTickView = Disapproval.View.extend({
    tagName: 'line',

    initialize: function () {
      this.listenTo(this.model, 'remove', this.remove);
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function () {
      var tick_width = 5;
      var position = this.model.collection.chart.xScale(this.model.get('x'));
      this.$el.attr({
        x1: position + this.model.collection.chart.canvas.bottom.offset.x,
        x2: position + this.model.collection.chart.canvas.bottom.offset.x,
        y1: this.model.collection.chart.canvas.bottom.offset.y + tick_width,
        y2: this.model.collection.chart.canvas.bottom.offset.y,
        stroke: globalOptions.axes_stroke_color,
        'stroke-width': globalOptions.axes_stroke_width,
        'shape-rendering': 'crispEdges'
      });
    }
  });

  var XLabelView = Disapproval.View.extend({
    tagName: 'text',

    initialize: function () {
      this.listenTo(this.model, 'remove', this.remove);
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function () {
      var position = this.model.collection.chart.xScale(this.model.get('x'));

      this.$el.html(this.model.get('label'));
      this.$el.attr({
        fill: globalOptions.axes_font_color,
        'font-family': globalOptions.axes_font_family,
        'font-size': globalOptions.axes_font_size
      });

      var temp_svg = svg$el('svg');
      temp_svg.append(this.$el);
      $('body').append(temp_svg);
      var width = this.$el.width();
      temp_svg.remove();

      var label_margin_top = 8;
      var tilted_label_margin_top = 2;
      var y = this.model.collection.chart.canvas.bottom.offset.y + globalOptions.axes_font_size;
      var x = position + this.model.collection.chart.canvas.bottom.offset.x;
      if (this.model.collection.chart.canvas.bottom.label.is_tilted) {
        this.$el.attr({
          x: x,
          y: y + tilted_label_margin_top,
          transform: 'rotate(45 ' + x + ',' + y + ')'
        });
      } else {
        this.$el.attr({
          x: x - width / 2,
          y: y + label_margin_top
        });
      }
    }
  });

  var XGridView = Disapproval.View.extend({
    tagName: 'line',

    initialize: function () {
      this.listenTo(this.model, 'remove', this.remove);
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },

    render: function () {
      var position = this.model.collection.chart.xScale(this.model.get('x'));
      this.$el.attr({
        x1: position + this.model.collection.chart.canvas.main.offset.x,
        x2: position + this.model.collection.chart.canvas.main.offset.x,
        y1: this.model.collection.chart.canvas.main.offset.y + this.model.collection.chart.canvas.main.height,
        y2: this.model.collection.chart.canvas.main.offset.y,
        stroke: globalOptions.grid_stroke_color,
        'stroke-width': globalOptions.grid_stroke_width,
        'shape-rendering': 'crispEdges'
      });
    }
  });


  // MainView
  // -------------------

  // A view extention for rendering the main section of the chart

  var MainView = Disapproval.View.extend({
    className: 'canvas-main',

    initialize: function () {
      this.render();
    },

    render: function () {
      _.each(this.model.datasets, function (dataset) {
        var line_view = new LineView({
          collection: dataset
        });

        this.$el.append(line_view.$el);

        dataset.each(function (point) {
          var point_view = new PointView({
            model: point
          });

          this.$el.append(point_view.$el);
        }, this);
      }, this);
    }
  });

  var TooltipView = Disapproval.View.extend({
    tagName: 'ul',
    className: 'tooltip list',

    events: {
      'mousemove': '_triggerMousemove',
    },

    initialize: function () {
      this.listenTo(this.collection, 'add', this.render);
      this.listenTo(this.collection, 'remove', this.hideTooltip);
      this.$el.css({
        padding: 10,
        margin: 0,
        'list-style': 'none'
      });
    },

    render: _.debounce(function () {

      this.collection.each(function (point) {
        this.$el.append(new TooltipPointView({ model: point }).$el);
      }, this);

      this.setTooltipPosition();
    }, 100),

    setTooltipPosition: function () {
      if (this.collection.models.length > 0) {
        var x = this.collection.first().get('x');
        var x_screen = this.collection.chart.xScale(x);
        if (x_screen > this.collection.chart.canvas.main.width / 2) {
          this.collection.side = 'left';
        } else {
          this.collection.side = 'right';
        }

        if (this.collection.side == 'left') {
          this.collection.max_width = x_screen - 2 * globalOptions.tooltip_offset;
        } else {
          this.collection.max_width = this.collection.chart.canvas.main.width - x_screen - 2 * globalOptions.tooltip_offset;
        }

        this.collection.$container.css('max-width', this.collection.max_width);

        var $main_container = this.collection.chart.$container.find('.canvas-main');

        this.collection.$container.show();
        this.collection.$container.offset({
          top: $main_container.offset().top,
        });

        if (this.collection.side == 'left') {
          this.collection.$container.offset({
            left: $main_container.offset().left + x_screen - this.collection.$container.width() - globalOptions.tooltip_offset
          });
        } else {
          this.collection.$container.offset({
            left: $main_container.offset().left + x_screen + globalOptions.tooltip_offset
          })
        }
      }

    },

    hideTooltip: function () {
        this.collection.$container.hide();
    },

    _triggerMousemove: function (event) {
      var offset = this.collection.chart.$el.offset();
      Disapproval.trigger('chart:mousemove', {
        x: event.pageX - offset.left,
        y: event.pageY - offset.top,
        chart: this.collection.chart
      });
    },

  });

  var TooltipPointView = Disapproval.View.extend({
     tagName: 'li',
     className: 'tooltip point',

    initialize: function () {
      this.listenTo(this.model, 'remove', this.remove);
      this.render();
      this.$el.css({
        margin: 0,
        padding: 0
      });
    },

    render: function () {
      this.$el.append($('<div>', { class: 'tooltip point-color' }).css({
        position: 'absolute',
        width: 8,
        height: 8,
        'margin-top': 4,
        'background-color': this.model.collection.color.pointColor
      }));

      var tooltip_point = $('<div>', { class: 'tooltip point-text' });
      var text = this.model.get('y');
      if (this.model.get('meta')) {
        text = this.model.get('meta') + ': ' + text;
      }

      tooltip_point.html(text);

      tooltip_point.css({
        'margin-left': 20,
        'color': 'rgba(255,255,255,1)',
        'font-family': globalOptions.tooltip_font_family,
        'font-size': globalOptions.tooltip_font_size,
        'font-weight': globalOptions.tooltip_font_weight,
        'letter-spacing': globalOptions.tooltip_letter_spacing,
        'cursor': 'default'
      })

      this.$el.append(tooltip_point)
    }

  });


  return Disapproval;

}));





