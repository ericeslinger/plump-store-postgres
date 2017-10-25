"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function writeRelationshipQuery(schema, relName) {
    var rel = schema.relationships[relName].type;
    var otherRelName = rel.sides[relName].otherName;
    if (rel.storeData && rel.storeData.sql) {
        var sqlData = rel.storeData.sql;
        if (rel.extras) {
            var extraArray = Object.keys(rel.extras).concat();
            var insertArray = [
                sqlData.joinFields[otherRelName],
                sqlData.joinFields[relName],
            ].concat(extraArray);
            var insertString = "insert into \"" + sqlData.tableName + "\" (" + insertArray.join(', ') + ")\n      values (" + insertArray.map(function () { return '?'; }).join(', ') + ")\n      on conflict (\"" + sqlData.joinFields[otherRelName] + "\", \"" + sqlData.joinFields[relName] + "\") ";
            return {
                queryString: insertString + " do update set " + extraArray
                    .map(function (v) { return v + " = ?"; })
                    .join(', ') + ";",
                fields: ['child.id', 'item.id'].concat(extraArray).concat(extraArray),
            };
        }
        else {
            var insertArray = [
                sqlData.joinFields[otherRelName],
                sqlData.joinFields[relName],
            ];
            var insertString = "insert into \"" + sqlData.tableName + "\" (" + insertArray.join(', ') + ")\n      values (" + insertArray.map(function () { return '?'; }).join(', ') + ")\n      on conflict (\"" + sqlData.joinFields[otherRelName] + "\", \"" + sqlData.joinFields[relName] + "\") ";
            return {
                queryString: insertString + " do nothing;",
                fields: ['child.id', 'item.id'],
            };
        }
    }
    else {
        return null;
    }
}
exports.writeRelationshipQuery = writeRelationshipQuery;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93cml0ZVJlbGF0aW9uc2hpcFF1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsZ0NBQ0UsTUFBbUIsRUFDbkIsT0FBZTtJQUVmLElBQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQy9DLElBQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ2xELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLElBQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO1FBQ2xDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2YsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEQsSUFBTSxXQUFXLEdBQUc7Z0JBQ2xCLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDO2dCQUNoQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQzthQUM1QixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNyQixJQUFNLFlBQVksR0FBRyxtQkFBZ0IsT0FBTyxDQUFDLFNBQVMsWUFBTSxXQUFXLENBQUMsSUFBSSxDQUMxRSxJQUFJLENBQ0wseUJBQ1MsV0FBVyxDQUFDLEdBQUcsQ0FBQyxjQUFNLE9BQUEsR0FBRyxFQUFILENBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0NBQy9CLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGNBQU8sT0FBTyxDQUFDLFVBQVUsQ0FDdkUsT0FBTyxDQUNSLFNBQUssQ0FBQztZQUNQLE1BQU0sQ0FBQztnQkFDTCxXQUFXLEVBQUssWUFBWSx1QkFBa0IsVUFBVTtxQkFDckQsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUcsQ0FBQyxTQUFNLEVBQVYsQ0FBVSxDQUFDO3FCQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQUc7Z0JBQ2hCLE1BQU0sRUFBRSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQzthQUN0RSxDQUFDO1FBQ0osQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBTSxXQUFXLEdBQUc7Z0JBQ2xCLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDO2dCQUNoQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQzthQUM1QixDQUFDO1lBQ0YsSUFBTSxZQUFZLEdBQUcsbUJBQWdCLE9BQU8sQ0FBQyxTQUFTLFlBQU0sV0FBVyxDQUFDLElBQUksQ0FDMUUsSUFBSSxDQUNMLHlCQUNTLFdBQVcsQ0FBQyxHQUFHLENBQUMsY0FBTSxPQUFBLEdBQUcsRUFBSCxDQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdDQUMvQixPQUFPLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxjQUFPLE9BQU8sQ0FBQyxVQUFVLENBQ3ZFLE9BQU8sQ0FDUixTQUFLLENBQUM7WUFDUCxNQUFNLENBQUM7Z0JBQ0wsV0FBVyxFQUFLLFlBQVksaUJBQWM7Z0JBQzFDLE1BQU0sRUFBRSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUM7YUFDaEMsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDTixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztBQUNILENBQUM7QUEvQ0Qsd0RBK0NDIiwiZmlsZSI6IndyaXRlUmVsYXRpb25zaGlwUXVlcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbFNjaGVtYSB9IGZyb20gJ3BsdW1wJztcbmltcG9ydCB7IFBhcmFtZXRlcml6ZWRRdWVyeSB9IGZyb20gJy4vc2VtaVF1ZXJ5JztcblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlUmVsYXRpb25zaGlwUXVlcnkoXG4gIHNjaGVtYTogTW9kZWxTY2hlbWEsXG4gIHJlbE5hbWU6IHN0cmluZ1xuKTogUGFyYW1ldGVyaXplZFF1ZXJ5IHtcbiAgY29uc3QgcmVsID0gc2NoZW1hLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0udHlwZTtcbiAgY29uc3Qgb3RoZXJSZWxOYW1lID0gcmVsLnNpZGVzW3JlbE5hbWVdLm90aGVyTmFtZTtcbiAgaWYgKHJlbC5zdG9yZURhdGEgJiYgcmVsLnN0b3JlRGF0YS5zcWwpIHtcbiAgICBjb25zdCBzcWxEYXRhID0gcmVsLnN0b3JlRGF0YS5zcWw7XG4gICAgaWYgKHJlbC5leHRyYXMpIHtcbiAgICAgIGNvbnN0IGV4dHJhQXJyYXkgPSBPYmplY3Qua2V5cyhyZWwuZXh0cmFzKS5jb25jYXQoKTtcbiAgICAgIGNvbnN0IGluc2VydEFycmF5ID0gW1xuICAgICAgICBzcWxEYXRhLmpvaW5GaWVsZHNbb3RoZXJSZWxOYW1lXSxcbiAgICAgICAgc3FsRGF0YS5qb2luRmllbGRzW3JlbE5hbWVdLFxuICAgICAgXS5jb25jYXQoZXh0cmFBcnJheSk7XG4gICAgICBjb25zdCBpbnNlcnRTdHJpbmcgPSBgaW5zZXJ0IGludG8gXCIke3NxbERhdGEudGFibGVOYW1lfVwiICgke2luc2VydEFycmF5LmpvaW4oXG4gICAgICAgICcsICdcbiAgICAgICl9KVxuICAgICAgdmFsdWVzICgke2luc2VydEFycmF5Lm1hcCgoKSA9PiAnPycpLmpvaW4oJywgJyl9KVxuICAgICAgb24gY29uZmxpY3QgKFwiJHtzcWxEYXRhLmpvaW5GaWVsZHNbb3RoZXJSZWxOYW1lXX1cIiwgXCIke3NxbERhdGEuam9pbkZpZWxkc1tcbiAgICAgICAgcmVsTmFtZVxuICAgICAgXX1cIikgYDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBgJHtpbnNlcnRTdHJpbmd9IGRvIHVwZGF0ZSBzZXQgJHtleHRyYUFycmF5XG4gICAgICAgICAgLm1hcCh2ID0+IGAke3Z9ID0gP2ApXG4gICAgICAgICAgLmpvaW4oJywgJyl9O2AsXG4gICAgICAgIGZpZWxkczogWydjaGlsZC5pZCcsICdpdGVtLmlkJ10uY29uY2F0KGV4dHJhQXJyYXkpLmNvbmNhdChleHRyYUFycmF5KSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluc2VydEFycmF5ID0gW1xuICAgICAgICBzcWxEYXRhLmpvaW5GaWVsZHNbb3RoZXJSZWxOYW1lXSxcbiAgICAgICAgc3FsRGF0YS5qb2luRmllbGRzW3JlbE5hbWVdLFxuICAgICAgXTtcbiAgICAgIGNvbnN0IGluc2VydFN0cmluZyA9IGBpbnNlcnQgaW50byBcIiR7c3FsRGF0YS50YWJsZU5hbWV9XCIgKCR7aW5zZXJ0QXJyYXkuam9pbihcbiAgICAgICAgJywgJ1xuICAgICAgKX0pXG4gICAgICB2YWx1ZXMgKCR7aW5zZXJ0QXJyYXkubWFwKCgpID0+ICc/Jykuam9pbignLCAnKX0pXG4gICAgICBvbiBjb25mbGljdCAoXCIke3NxbERhdGEuam9pbkZpZWxkc1tvdGhlclJlbE5hbWVdfVwiLCBcIiR7c3FsRGF0YS5qb2luRmllbGRzW1xuICAgICAgICByZWxOYW1lXG4gICAgICBdfVwiKSBgO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcXVlcnlTdHJpbmc6IGAke2luc2VydFN0cmluZ30gZG8gbm90aGluZztgLFxuICAgICAgICBmaWVsZHM6IFsnY2hpbGQuaWQnLCAnaXRlbS5pZCddLFxuICAgICAgfTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==
