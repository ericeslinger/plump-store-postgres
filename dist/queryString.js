'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bulkQuery = bulkQuery;
exports.readQuery = readQuery;
/* eslint prefer-template: 0*/

function selects(Model) {
  var selectArray = [];
  for (var attrName in Model.$schema.attributes) {
    selectArray.push('"' + Model.$name + '"."' + attrName + '"');
  }
  for (var relName in Model.$schema.relationships) {
    var rel = Model.$schema.relationships[relName].type;
    var otherName = rel.$sides[relName].otherName;
    var otherFieldName = rel.$storeData.sql.joinFields[otherName];
    var extraAgg = [];
    if (rel.$extras) {
      for (var extra in rel.$extras) {
        extraAgg.push('\'' + extra + '\'', '"' + relName + '"."' + extra + '"');
      }
    }
    var extraString = ', \'meta\', jsonb_build_object(' + extraAgg.join(', ') + ')';
    selectArray.push('COALESCE(\n        array_agg(\n          distinct(\n            jsonb_build_object(\n              \'id\', "' + relName + '"."' + otherFieldName + '"\n              ' + (extraAgg.length ? extraString : '') + '\n            )\n          )\n        )\n        FILTER (WHERE "' + relName + '"."' + otherFieldName + '" IS NOT NULL),\n        \'{}\')\n      as "' + relName + '"');
  }
  return 'select ' + selectArray.join(', ');
}

function joins(Model) {
  var joinStrings = [];
  for (var relName in Model.$schema.relationships) {
    var rel = Model.$schema.relationships[relName].type;
    var sqlBlock = rel.$storeData.sql;
    if (sqlBlock.joinQuery) {
      joinStrings.push('left outer join ' + rel.$name + ' as "' + relName + '" ' + sqlBlock.joinQuery[relName]);
    } else {
      joinStrings.push('left outer join ' + rel.$name + ' as "' + relName + '" ' + ('on "' + relName + '".' + sqlBlock.joinFields[relName] + ' = ' + Model.$name + '.' + Model.$id));
    }
  }
  return joinStrings.join('\n');
}

function singleWhere(Model) {
  if (Model.$storeData && Model.$storeData.sql && Model.$storeData.sql.singleQuery) {
    return Model.$storeData.sql.singleQuery;
  } else {
    return 'where ' + Model.$name + '.' + Model.$id + ' = ?';
  }
}

function bulkWhere(Model) {
  if (Model.$storeData && Model.$storeData.sql && Model.$storeData.sql.bulkQuery) {
    return Model.$storeData.sql.bulkQuery;
  } else if (Model.$storeData && Model.$storeData.sql && Model.$storeData.sql.singleQuery) {
    return Model.$storeData.sql.singleQuery;
  } else {
    return 'where ' + Model.$name + '.' + Model.$id + ' = ?';
  }
}

function groupBy(Model) {
  return 'group by ' + Object.keys(Model.$schema.attributes).map(function (attrName) {
    return '"' + attrName + '"';
  }).join(', ');
}

function bulkQuery(Model) {
  return selects(Model) + ' \nfrom ' + Model.$name + ' \n' + joins(Model) + ' \n' + bulkWhere(Model) + ' \n' + groupBy(Model) + ';';
}

function readQuery(Model) {
  return selects(Model) + ' \nfrom ' + Model.$name + ' \n' + joins(Model) + ' \n' + singleWhere(Model) + ' \n' + groupBy(Model) + ';';
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5U3RyaW5nLmpzIl0sIm5hbWVzIjpbImJ1bGtRdWVyeSIsInJlYWRRdWVyeSIsInNlbGVjdHMiLCJNb2RlbCIsInNlbGVjdEFycmF5IiwiYXR0ck5hbWUiLCIkc2NoZW1hIiwiYXR0cmlidXRlcyIsInB1c2giLCIkbmFtZSIsInJlbE5hbWUiLCJyZWxhdGlvbnNoaXBzIiwicmVsIiwidHlwZSIsIm90aGVyTmFtZSIsIiRzaWRlcyIsIm90aGVyRmllbGROYW1lIiwiJHN0b3JlRGF0YSIsInNxbCIsImpvaW5GaWVsZHMiLCJleHRyYUFnZyIsIiRleHRyYXMiLCJleHRyYSIsImV4dHJhU3RyaW5nIiwiam9pbiIsImxlbmd0aCIsImpvaW5zIiwiam9pblN0cmluZ3MiLCJzcWxCbG9jayIsImpvaW5RdWVyeSIsIiRpZCIsInNpbmdsZVdoZXJlIiwic2luZ2xlUXVlcnkiLCJidWxrV2hlcmUiLCJncm91cEJ5IiwiT2JqZWN0Iiwia2V5cyIsIm1hcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUE2RWdCQSxTLEdBQUFBLFM7UUFJQUMsUyxHQUFBQSxTO0FBakZoQjs7QUFFQSxTQUFTQyxPQUFULENBQWlCQyxLQUFqQixFQUF3QjtBQUN0QixNQUFNQyxjQUFjLEVBQXBCO0FBQ0EsT0FBSyxJQUFNQyxRQUFYLElBQXVCRixNQUFNRyxPQUFOLENBQWNDLFVBQXJDLEVBQWlEO0FBQy9DSCxnQkFBWUksSUFBWixPQUFxQkwsTUFBTU0sS0FBM0IsV0FBc0NKLFFBQXRDO0FBQ0Q7QUFDRCxPQUFLLElBQU1LLE9BQVgsSUFBc0JQLE1BQU1HLE9BQU4sQ0FBY0ssYUFBcEMsRUFBbUQ7QUFDakQsUUFBTUMsTUFBTVQsTUFBTUcsT0FBTixDQUFjSyxhQUFkLENBQTRCRCxPQUE1QixFQUFxQ0csSUFBakQ7QUFDQSxRQUFNQyxZQUFZRixJQUFJRyxNQUFKLENBQVdMLE9BQVgsRUFBb0JJLFNBQXRDO0FBQ0EsUUFBTUUsaUJBQWlCSixJQUFJSyxVQUFKLENBQWVDLEdBQWYsQ0FBbUJD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QUFBQSxpQkFBa0JBLFFBQWxCO0FBQUEsR0FBMUMsRUFBeUVtQixJQUF6RSxDQUE4RSxJQUE5RSxDQUFuQjtBQUNEOztBQUVNLFNBQVN4QixTQUFULENBQW1CRyxLQUFuQixFQUEwQjtBQUMvQixTQUFVRCxRQUFRQyxLQUFSLENBQVYsZ0JBQW1DQSxNQUFNTSxLQUF6QyxXQUFvRGlCLE1BQU12QixLQUFOLENBQXBELFdBQXNFOEIsVUFBVTlCLEtBQVYsQ0FBdEUsV0FBNEYrQixRQUFRL0IsS0FBUixDQUE1RjtBQUNEOztBQUVNLFNBQVNGLFNBQVQsQ0FBbUJFLEtBQW5CLEVBQTBCO0FBQy9CLFNBQVVELFFBQVFDLEtBQVIsQ0FBVixnQkFBbUNBLE1BQU1NLEtBQXpDLFdBQW9EaUIsTUFBTXZCLEtBQU4sQ0FBcEQsV0FBc0U0QixZQUFZNUIsS0FBWixDQUF0RSxXQUE4RitCLFFBQVEvQixLQUFSLENBQTlGO0FBQ0QiLCJmaWxlIjoicXVlcnlTdHJpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQgcHJlZmVyLXRlbXBsYXRlOiAwKi9cblxuZnVuY3Rpb24gc2VsZWN0cyhNb2RlbCkge1xuICBjb25zdCBzZWxlY3RBcnJheSA9IFtdO1xuICBmb3IgKGNvbnN0IGF0dHJOYW1lIGluIE1vZGVsLiRzY2hlbWEuYXR0cmlidXRlcykge1xuICAgIHNlbGVjdEFycmF5LnB1c2goYFwiJHtNb2RlbC4kbmFtZX1cIi5cIiR7YXR0ck5hbWV9XCJgKTtcbiAgfVxuICBmb3IgKGNvbnN0IHJlbE5hbWUgaW4gTW9kZWwuJHNjaGVtYS5yZWxhdGlvbnNoaXBzKSB7XG4gICAgY29uc3QgcmVsID0gTW9kZWwuJHNjaGVtYS5yZWxhdGlvbnNoaXBzW3JlbE5hbWVdLnR5cGU7XG4gICAgY29uc3Qgb3RoZXJOYW1lID0gcmVsLiRzaWRlc1tyZWxOYW1lXS5vdGhlck5hbWU7XG4gICAgY29uc3Qgb3RoZXJGaWVsZE5hbWUgPSByZWwuJHN0b3JlRGF0YS5zcWwuam9pbkZpZWxkc1tvdGhlck5hbWVdO1xuICAgIGNvbnN0IGV4dHJhQWdnID0gW107XG4gICAgaWYgKHJlbC4kZXh0cmFzKSB7XG4gICAgICBmb3IgKGNvbnN0IGV4dHJhIGluIHJlbC4kZXh0cmFzKSB7XG4gICAgICAgIGV4dHJhQWdnLnB1c2goYCcke2V4dHJhfSdgLCBgXCIke3JlbE5hbWV9XCIuXCIke2V4dHJhfVwiYCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGV4dHJhU3RyaW5nID0gYCwgJ21ldGEnLCBqc29uYl9idWlsZF9vYmplY3QoJHtleHRyYUFnZy5qb2luKCcsICcpfSlgO1xuICAgIHNlbGVjdEFycmF5LnB1c2goXG4gICAgICBgQ09BTEVTQ0UoXG4gICAgICAgIGFycmF5X2FnZyhcbiAgICAgICAgICBkaXN0aW5jdChcbiAgICAgICAgICAgIGpzb25iX2J1aWxkX29iamVjdChcbiAgICAgICAgICAgICAgJ2lkJywgXCIke3JlbE5hbWV9XCIuXCIke290aGVyRmllbGROYW1lfVwiXG4gICAgICAgICAgICAgICR7ZXh0cmFBZ2cubGVuZ3RoID8gZXh0cmFTdHJpbmcgOiAnJ31cbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgICAgRklMVEVSIChXSEVSRSBcIiR7cmVsTmFtZX1cIi5cIiR7b3RoZXJGaWVsZE5hbWV9XCIgSVMgTk9UIE5VTEwpLFxuICAgICAgICAne30nKVxuICAgICAgYXMgXCIke3JlbE5hbWV9XCJgXG4gICAgKTtcbiAgfVxuICByZXR1cm4gYHNlbGVjdCAke3NlbGVjdEFycmF5LmpvaW4oJywgJyl9YDtcbn1cblxuZnVuY3Rpb24gam9pbnMoTW9kZWwpIHtcbiAgY29uc3Qgam9pblN0cmluZ3MgPSBbXTtcbiAgZm9yIChjb25zdCByZWxOYW1lIGluIE1vZGVsLiRzY2hlbWEucmVsYXRpb25zaGlwcykge1xuICAgIGNvbnN0IHJlbCA9IE1vZGVsLiRzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICAgIGNvbnN0IHNxbEJsb2NrID0gcmVsLiRzdG9yZURhdGEuc3FsO1xuICAgIGlmIChzcWxCbG9jay5qb2luUXVlcnkpIHtcbiAgICAgIGpvaW5TdHJpbmdzLnB1c2goXG4gICAgICAgIGBsZWZ0IG91dGVyIGpvaW4gJHtyZWwuJG5hbWV9IGFzIFwiJHtyZWxOYW1lfVwiICR7c3FsQmxvY2suam9pblF1ZXJ5W3JlbE5hbWVdfWBcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGpvaW5TdHJpbmdzLnB1c2goXG4gICAgICAgIGBsZWZ0IG91dGVyIGpvaW4gJHtyZWwuJG5hbWV9IGFzIFwiJHtyZWxOYW1lfVwiIGBcbiAgICAgICAgKyBgb24gXCIke3JlbE5hbWV9XCIuJHtzcWxCbG9jay5qb2luRmllbGRzW3JlbE5hbWVdfSA9ICR7TW9kZWwuJG5hbWV9LiR7TW9kZWwuJGlkfWBcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIHJldHVybiBqb2luU3RyaW5ncy5qb2luKCdcXG4nKTtcbn1cblxuZnVuY3Rpb24gc2luZ2xlV2hlcmUoTW9kZWwpIHtcbiAgaWYgKE1vZGVsLiRzdG9yZURhdGEgJiYgTW9kZWwuJHN0b3JlRGF0YS5zcWwgJiYgTW9kZWwuJHN0b3JlRGF0YS5zcWwuc2luZ2xlUXVlcnkpIHtcbiAgICByZXR1cm4gTW9kZWwuJHN0b3JlRGF0YS5zcWwuc2luZ2xlUXVlcnk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGB3aGVyZSAke01vZGVsLiRuYW1lfS4ke01vZGVsLiRpZH0gPSA/YDtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWxrV2hlcmUoTW9kZWwpIHtcbiAgaWYgKE1vZGVsLiRzdG9yZURhdGEgJiYgTW9kZWwuJHN0b3JlRGF0YS5zcWwgJiYgTW9kZWwuJHN0b3JlRGF0YS5zcWwuYnVsa1F1ZXJ5KSB7XG4gICAgcmV0dXJuIE1vZGVsLiRzdG9yZURhdGEuc3FsLmJ1bGtRdWVyeTtcbiAgfSBlbHNlIGlmIChNb2RlbC4kc3RvcmVEYXRhICYmIE1vZGVsLiRzdG9yZURhdGEuc3FsICYmIE1vZGVsLiRzdG9yZURhdGEuc3FsLnNpbmdsZVF1ZXJ5KSB7XG4gICAgcmV0dXJuIE1vZGVsLiRzdG9yZURhdGEuc3FsLnNpbmdsZVF1ZXJ5O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBgd2hlcmUgJHtNb2RlbC4kbmFtZX0uJHtNb2RlbC4kaWR9ID0gP2A7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ3JvdXBCeShNb2RlbCkge1xuICByZXR1cm4gYGdyb3VwIGJ5ICR7T2JqZWN0LmtleXMoTW9kZWwuJHNjaGVtYS5hdHRyaWJ1dGVzKS5tYXAoKGF0dHJOYW1lKSA9PiBgXCIke2F0dHJOYW1lfVwiYCkuam9pbignLCAnKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVsa1F1ZXJ5KE1vZGVsKSB7XG4gIHJldHVybiBgJHtzZWxlY3RzKE1vZGVsKX0gXFxuZnJvbSAke01vZGVsLiRuYW1lfSBcXG4ke2pvaW5zKE1vZGVsKX0gXFxuJHtidWxrV2hlcmUoTW9kZWwpfSBcXG4ke2dyb3VwQnkoTW9kZWwpfTtgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFF1ZXJ5KE1vZGVsKSB7XG4gIHJldHVybiBgJHtzZWxlY3RzKE1vZGVsKX0gXFxuZnJvbSAke01vZGVsLiRuYW1lfSBcXG4ke2pvaW5zKE1vZGVsKX0gXFxuJHtzaW5nbGVXaGVyZShNb2RlbCl9IFxcbiR7Z3JvdXBCeShNb2RlbCl9O2A7XG59XG4iXX0=
