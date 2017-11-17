'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.writeRelationshipQuery = writeRelationshipQuery;
function writeRelationshipQuery(schema, relName) {
    var rel = schema.relationships[relName].type;
    var otherRelName = rel.sides[relName].otherName;
    var writeTable = rel.storeData.sql.writeView || rel.storeData.sql.tableName;
    if (rel.storeData && rel.storeData.sql) {
        var sqlData = rel.storeData.sql;
        if (rel.extras) {
            var extraArray = Object.keys(rel.extras).concat();
            var insertArray = [sqlData.joinFields[otherRelName], sqlData.joinFields[relName]].concat(extraArray);
            var insertString = 'insert into "' + writeTable + '" (' + insertArray.join(', ') + ')\n      values (' + insertArray.map(function () {
                return '?';
            }).join(', ') + ')\n      on conflict ("' + sqlData.joinFields[otherRelName] + '", "' + sqlData.joinFields[relName] + '") ';
            return {
                queryString: insertString + ' do update set ' + extraArray.map(function (v) {
                    return v + ' = ?';
                }).join(', ') + ';',
                fields: ['child.id', 'item.id'].concat(extraArray).concat(extraArray)
            };
        } else {
            var _insertArray = [sqlData.joinFields[otherRelName], sqlData.joinFields[relName]];
            var _insertString = 'insert into "' + writeTable + '" (' + _insertArray.join(', ') + ')\n      values (' + _insertArray.map(function () {
                return '?';
            }).join(', ') + ')\n      on conflict ("' + sqlData.joinFields[otherRelName] + '", "' + sqlData.joinFields[relName] + '") ';
            return {
                queryString: _insertString + ' do nothing;',
                fields: ['child.id', 'item.id']
            };
        }
    } else {
        return null;
    }
}