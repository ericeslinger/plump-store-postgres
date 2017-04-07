"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function writeRelationshipQuery(schema, relName) {
    var rel = schema.relationships[relName].type;
    var otherRelName = rel.sides[relName].otherName;
    var sqlData = rel.storeData.sql;
    if (rel.extras) {
        var extraArray = Object.keys(rel.extras).concat();
        var insertArray = [
            sqlData.joinFields[otherRelName],
            sqlData.joinFields[relName],
        ].concat(extraArray);
        var insertString = "insert into \"" + sqlData.tableName + "\" (" + insertArray.join(', ') + ")\n      values (" + insertArray.map(function () { return '?'; }).join(', ') + ")\n      on conflict (\"" + sqlData.joinFields[otherRelName] + "\", \"" + sqlData.joinFields[relName] + "\") ";
        return {
            queryString: insertString + " do update set " + extraArray.map(function (v) { return v + " = ?"; }).join(', ') + ";",
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
exports.writeRelationshipQuery = writeRelationshipQuery;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93cml0ZVJlbGF0aW9uc2hpcFF1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsZ0NBQXVDLE1BQW1CLEVBQUUsT0FBZTtJQUN6RSxJQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztJQUMvQyxJQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUNsRCxJQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztJQUVsQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNmLElBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3BELElBQU0sV0FBVyxHQUFHO1lBQ2xCLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDO1lBQ2hDLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO1NBQzVCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JCLElBQU0sWUFBWSxHQUFHLG1CQUFnQixPQUFPLENBQUMsU0FBUyxZQUFNLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHlCQUN0RSxXQUFXLENBQUMsR0FBRyxDQUFDLGNBQU0sT0FBQSxHQUFHLEVBQUgsQ0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQ0FDL0IsT0FBTyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsY0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFLLENBQUM7UUFDMUYsTUFBTSxDQUFDO1lBQ0wsV0FBVyxFQUFLLFlBQVksdUJBQWtCLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBRyxDQUFDLFNBQU0sRUFBVixDQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQUc7WUFDM0YsTUFBTSxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1NBQ3RFLENBQUM7SUFDSixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDTixJQUFNLFdBQVcsR0FBRztZQUNsQixPQUFPLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQztZQUNoQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztTQUM1QixDQUFDO1FBQ0YsSUFBTSxZQUFZLEdBQUcsbUJBQWdCLE9BQU8sQ0FBQyxTQUFTLFlBQU0sV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMseUJBQ3RFLFdBQVcsQ0FBQyxHQUFHLENBQUMsY0FBTSxPQUFBLEdBQUcsRUFBSCxDQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdDQUMvQixPQUFPLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxjQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQUssQ0FBQztRQUMxRixNQUFNLENBQUM7WUFDTCxXQUFXLEVBQUssWUFBWSxpQkFBYztZQUMxQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDO1NBQ2hDLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQztBQS9CRCx3REErQkMiLCJmaWxlIjoid3JpdGVSZWxhdGlvbnNoaXBRdWVyeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGVsU2NoZW1hIH0gZnJvbSAncGx1bXAnO1xuaW1wb3J0IHsgUGFyYW1ldGVyaXplZFF1ZXJ5IH0gZnJvbSAnLi9zZW1pUXVlcnknO1xuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVSZWxhdGlvbnNoaXBRdWVyeShzY2hlbWE6IE1vZGVsU2NoZW1hLCByZWxOYW1lOiBzdHJpbmcpOiBQYXJhbWV0ZXJpemVkUXVlcnkge1xuICBjb25zdCByZWwgPSBzY2hlbWEucmVsYXRpb25zaGlwc1tyZWxOYW1lXS50eXBlO1xuICBjb25zdCBvdGhlclJlbE5hbWUgPSByZWwuc2lkZXNbcmVsTmFtZV0ub3RoZXJOYW1lO1xuICBjb25zdCBzcWxEYXRhID0gcmVsLnN0b3JlRGF0YS5zcWw7XG5cbiAgaWYgKHJlbC5leHRyYXMpIHtcbiAgICBjb25zdCBleHRyYUFycmF5ID0gT2JqZWN0LmtleXMocmVsLmV4dHJhcykuY29uY2F0KCk7XG4gICAgY29uc3QgaW5zZXJ0QXJyYXkgPSBbXG4gICAgICBzcWxEYXRhLmpvaW5GaWVsZHNbb3RoZXJSZWxOYW1lXSxcbiAgICAgIHNxbERhdGEuam9pbkZpZWxkc1tyZWxOYW1lXSxcbiAgICBdLmNvbmNhdChleHRyYUFycmF5KTtcbiAgICBjb25zdCBpbnNlcnRTdHJpbmcgPSBgaW5zZXJ0IGludG8gXCIke3NxbERhdGEudGFibGVOYW1lfVwiICgke2luc2VydEFycmF5LmpvaW4oJywgJyl9KVxuICAgICAgdmFsdWVzICgke2luc2VydEFycmF5Lm1hcCgoKSA9PiAnPycpLmpvaW4oJywgJyl9KVxuICAgICAgb24gY29uZmxpY3QgKFwiJHtzcWxEYXRhLmpvaW5GaWVsZHNbb3RoZXJSZWxOYW1lXX1cIiwgXCIke3NxbERhdGEuam9pbkZpZWxkc1tyZWxOYW1lXX1cIikgYDtcbiAgICByZXR1cm4ge1xuICAgICAgcXVlcnlTdHJpbmc6IGAke2luc2VydFN0cmluZ30gZG8gdXBkYXRlIHNldCAke2V4dHJhQXJyYXkubWFwKHYgPT4gYCR7dn0gPSA/YCkuam9pbignLCAnKX07YCxcbiAgICAgIGZpZWxkczogWydjaGlsZC5pZCcsICdpdGVtLmlkJ10uY29uY2F0KGV4dHJhQXJyYXkpLmNvbmNhdChleHRyYUFycmF5KSxcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGluc2VydEFycmF5ID0gW1xuICAgICAgc3FsRGF0YS5qb2luRmllbGRzW290aGVyUmVsTmFtZV0sXG4gICAgICBzcWxEYXRhLmpvaW5GaWVsZHNbcmVsTmFtZV0sXG4gICAgXTtcbiAgICBjb25zdCBpbnNlcnRTdHJpbmcgPSBgaW5zZXJ0IGludG8gXCIke3NxbERhdGEudGFibGVOYW1lfVwiICgke2luc2VydEFycmF5LmpvaW4oJywgJyl9KVxuICAgICAgdmFsdWVzICgke2luc2VydEFycmF5Lm1hcCgoKSA9PiAnPycpLmpvaW4oJywgJyl9KVxuICAgICAgb24gY29uZmxpY3QgKFwiJHtzcWxEYXRhLmpvaW5GaWVsZHNbb3RoZXJSZWxOYW1lXX1cIiwgXCIke3NxbERhdGEuam9pbkZpZWxkc1tyZWxOYW1lXX1cIikgYDtcbiAgICByZXR1cm4ge1xuICAgICAgcXVlcnlTdHJpbmc6IGAke2luc2VydFN0cmluZ30gZG8gbm90aGluZztgLFxuICAgICAgZmllbGRzOiBbJ2NoaWxkLmlkJywgJ2l0ZW0uaWQnXSxcbiAgICB9O1xuICB9XG59XG4iXX0=
