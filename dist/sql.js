'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PGStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _plump = require('plump');

var _writeRelationshipQuery = require('./writeRelationshipQuery');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PGStore = exports.PGStore = function (_Storage) {
    _inherits(PGStore, _Storage);

    function PGStore() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, PGStore);

        var _this = _possibleConstructorReturn(this, (PGStore.__proto__ || Object.getPrototypeOf(PGStore)).call(this, opts));

        _this.queryCache = {};
        var options = Object.assign({}, {
            client: 'postgres',
            debug: false,
            connection: {
                user: 'postgres',
                host: 'localhost',
                port: 5432,
                password: '',
                charset: 'utf8'
            },
            pool: {
                max: 20,
                min: 0
            }
        }, opts.sql);
        _this.knex = (0, _knex2.default)(options);
        return _this;
    }
    /*
      note that knex.js "then" functions aren't actually promises the way you think they are.
      you can return knex.insert().into(), which has a then() on it, but that thenable isn't
      an actual promise yet. So instead we're returning Promise.resolve(thenable);
    */


    _createClass(PGStore, [{
        key: 'teardown',
        value: function teardown() {
            return Promise.resolve(this.knex.destroy());
        }
    }, {
        key: 'allocateId',
        value: function allocateId(type) {
            return Promise.resolve(this.knex.raw('select nextval(?::regclass);', type + '_id_seq').then(function (data) {
                return data.rows[0].nextval;
            }));
        }
    }, {
        key: 'addSchema',
        value: function addSchema(t) {
            var _this2 = this;

            return _get(PGStore.prototype.__proto__ || Object.getPrototypeOf(PGStore.prototype), 'addSchema', this).call(this, t).then(function () {
                if (t.schema.storeData && t.schema.storeData.sql) {
                    _this2.queryCache[t.type] = {
                        relationships: {}
                    };
                    Object.keys(t.schema.relationships).forEach(function (relName) {
                        var rq = (0, _writeRelationshipQuery.writeRelationshipQuery)(t.schema, relName);
                        if (!!rq) {
                            _this2.queryCache[t.type].relationships[relName] = rq;
                        }
                    });
                }
            });
        }
    }, {
        key: 'rearrangeData',
        value: function rearrangeData(req, data) {
            var schema = this.getSchema(req.item.type);
            var retVal = {
                type: req.item.type,
                attributes: {},
                relationships: {},
                id: data[schema.idAttribute]
            };
            for (var attrName in schema.attributes) {
                retVal.attributes[attrName] = data[attrName];
            }
            if (schema.storeData.sql.views[req.view || 'default'].contains) {
                schema.storeData.sql.views[req.view || 'default'].contains.forEach(function (relName) {
                    return retVal.relationships[relName] = data[relName] || [];
                });
            }
            return retVal;
        }
    }, {
        key: 'writeAttributes',
        value: function writeAttributes(value) {
            var _this3 = this;

            var updateObject = this.validateInput(value);
            var typeInfo = this.getSchema(value.type);
            Object.keys(typeInfo.attributes).filter(function (key) {
                return typeInfo.attributes[key].type === 'object' && updateObject.attributes[key];
            }).forEach(function (objKey) {
                updateObject.attributes[objKey] = JSON.stringify(updateObject.attributes[objKey]);
            });
            return Promise.resolve().then(function () {
                if (updateObject.id === undefined && _this3.terminal) {
                    return _this3.knex(typeInfo.storeData.sql.views.default.name).insert(updateObject.attributes).returning(typeInfo.idAttribute).then(function (createdId) {
                        return _this3.readAttributes({
                            item: { type: value.type, id: createdId[0] },
                            fields: ['attributes']
                        });
                    });
                } else if (updateObject.id !== undefined) {
                    return _this3.knex(updateObject.type).where(_defineProperty({}, typeInfo.idAttribute, updateObject.id)).update(updateObject.attributes).then(function () {
                        return _this3.readAttributes({
                            item: {
                                type: value.type,
                                id: updateObject.id
                            },
                            fields: ['attributes']
                        });
                    });
                } else {
                    throw new Error('Cannot create new content in a non-terminal store');
                }
            }).then(function (result) {
                _this3.fireWriteUpdate(Object.assign({}, result, { invalidate: ['attributes'] }));
                return result;
            });
        }
    }, {
        key: 'readAttributes',
        value: function readAttributes(req) {
            var _this4 = this;

            var schema = this.getSchema(req.item.type);
            var view = schema.storeData.sql.views[req.view || 'default'];
            return Promise.resolve(this.knex(view.name).where(_defineProperty({}, schema.idAttribute, req.item.id)).select().then(function (o) {
                if (o[0]) {
                    return _this4.rearrangeData(req, o[0]);
                } else {
                    return null;
                }
            }));
        }
    }, {
        key: 'readRelationship',
        value: function readRelationship(req) {
            var relName = req.rel.indexOf('relationships.') === 0 ? req.rel.split('.')[1] : req.rel;
            var schema = this.getSchema(req.item.type);
            var rel = schema.relationships[relName].type;
            var otherRelName = rel.sides[relName].otherName;
            var sqlData = rel.storeData.sql;
            var selectBase = '"' + sqlData.tableName + '"."' + sqlData.joinFields[otherRelName] + '" as id';
            var selectExtras = '';
            if (rel.extras) {
                selectExtras = ', jsonb_build_object(' + Object.keys(rel.extras).map(function (extra) {
                    return '\'' + extra + '\', "' + sqlData.tableName + '"."' + extra + '"';
                }).join(', ') + ') as meta'; // tslint:disable-line max-line-length
            }
            return Promise.resolve(this.knex(sqlData.tableName).as(relName).where(_defineProperty({}, sqlData.joinFields[req.rel], req.item.id)).select(this.knex.raw('' + selectBase + selectExtras)).then(function (l) {
                return {
                    type: req.item.type,
                    id: req.item.id,
                    relationships: _defineProperty({}, relName, l)
                };
            }));
        }
    }, {
        key: 'delete',
        value: function _delete(value) {
            var _this5 = this;

            var schema = this.getSchema(value.type);
            return Promise.resolve(this.knex(schema.storeData.sql.views.default.name).where(_defineProperty({}, schema.idAttribute, value.id)).delete().then(function (o) {
                _this5.fireWriteUpdate({
                    id: value.id,
                    type: value.type,
                    invalidate: ['attributes', 'relationships']
                });
                return o;
            }));
        }
    }, {
        key: 'writeRelationshipItem',
        value: function writeRelationshipItem(value, relName, child) {
            var _this6 = this;

            var subQuery = this.queryCache[value.type].relationships[relName];
            var schema = this.getSchema(value.type);
            var childData = schema.relationships[relName].type.sides[relName];
            return Promise.resolve(this.knex.raw(subQuery.queryString, subQuery.fields.map(function (f) {
                if (f === 'item.id') {
                    return value.id;
                } else if (f === 'child.id') {
                    return child.id;
                } else {
                    return child.meta[f];
                }
            })).then(function () {
                _this6.fireWriteUpdate(Object.assign({}, value, {
                    invalidate: ['relationships.' + relName]
                }));
                _this6.fireWriteUpdate({
                    id: child.id,
                    type: childData.otherType,
                    invalidate: ['relationships.' + childData.otherName]
                });
                return null;
            }));
        }
    }, {
        key: 'deleteRelationshipItem',
        value: function deleteRelationshipItem(value, relName, child) {
            var _knex$where3,
                _this7 = this;

            var schema = this.getSchema(value.type);
            var rel = schema.relationships[relName].type;
            var otherRelName = rel.sides[relName].otherName;
            var sqlData = rel.storeData.sql;
            var childData = schema.relationships[relName].type.sides[relName];
            return Promise.resolve(this.knex(sqlData.writeView || sqlData.tableName).where((_knex$where3 = {}, _defineProperty(_knex$where3, sqlData.joinFields[otherRelName], child.id), _defineProperty(_knex$where3, sqlData.joinFields[relName], value.id), _knex$where3)).delete().then(function () {
                _this7.fireWriteUpdate(Object.assign({}, value, {
                    invalidate: ['relationships.' + relName]
                }));
                _this7.fireWriteUpdate({
                    id: child.id,
                    type: childData.otherType,
                    invalidate: ['relationships.' + childData.otherName]
                });
                return null;
            }));
        }
    }, {
        key: 'query',
        value: function query(type, q) {
            return Promise.resolve(this.knex(type).where(q).select('id').then(function (r) {
                return r.map(function (v) {
                    return { type: type, id: v.id };
                });
            }));
        }
    }]);

    return PGStore;
}(_plump.Storage);