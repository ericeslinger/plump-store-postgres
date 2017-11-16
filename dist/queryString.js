// import { ParameterizedQuery } from './semiQuery';
// import { ModelSchema } from 'plump';
//
// function relationFetch(schema: ModelSchema, relName: string) {
//   const rel = schema.relationships[relName].type;
//   if (rel.storeData && rel.storeData.sql) {
//     const sqlBlock = rel.storeData.sql;
//     const otherName = rel.sides[relName].otherName;
//     if (sqlBlock.joinQuery && sqlBlock.joinQuery[relName]) {
//       return `(${sqlBlock.joinQuery[relName]}) as "${relName}"`;
//     } else {
//       const extraAgg = Object.keys(rel.extras || {}).map(
//         extra => `'${extra}', "${sqlBlock.tableName}"."${extra}"`
//       );
//       const kv = [
//         `'id'`,
//         `"${sqlBlock.tableName}"."${sqlBlock.joinFields[otherName]}"`,
//       ];
//       if (extraAgg.length) {
//         kv.push(`'meta'`, `jsonb_build_object(${extraAgg.join(',')})`);
//       }
//       const where =
//         sqlBlock.joinQuery && sqlBlock.joinQuery[relName]
//           ? sqlBlock.joinQuery[relName]
//           : `"${sqlBlock.tableName}"."${sqlBlock.joinFields[
//               relName
//             ]}" = "${schema.storeData.sql.tableName}"."${schema.idAttribute}"`;
//       return `(
//           select array_agg(
//             jsonb_build_object(${kv.join(', ')})
//           )
//           from "${sqlBlock.tableName}"
//           where ${where}
//         ) as "${relName}"`.replace(/\s+/g, ' ');
//     }
//   } else {
//     return null;
//   }
// }
//
// export function bulkQuery(schema: ModelSchema): ParameterizedQuery {
//   let where = `where ${schema.storeData.sql
//     .tableName}.${schema.idAttribute} = ?`;
//   if (
//     schema.storeData &&
//     schema.storeData.sql &&
//     schema.storeData.sql.bulkQuery
//   ) {
//     where = schema.storeData.sql.bulkQuery;
//   } else if (
//     schema.storeData &&
//     schema.storeData.sql &&
//     schema.storeData.sql.singleQuery
//   ) {
//     where = schema.storeData.sql.singleQuery;
//   }
//   const base = [`"${schema.storeData.sql.tableName}".*`];
//   const sides = Object.keys(schema.relationships)
//     .map(k => relationFetch(schema, k))
//     .filter(v => !!v);
//   return {
//     queryString: `select ${base.concat(sides).join(', ')} from "${schema
//       .storeData.sql.tableName}" ${where}`.replace(/\s+/g, ' '), // tslint:disable-line max-line-length
//     fields: ['id'],
//   };
// }
//
// export function readQuery(schema: ModelSchema): ParameterizedQuery {
//   const base = [`"${schema.storeData.sql.tableName}".*`];
//   const sides = Object.keys(schema.relationships)
//     .map(k => relationFetch(schema, k))
//     .filter(v => !!v);
//   return {
//     queryString: `select ${base.concat(sides).join(', ')} from "${schema
//       .storeData.sql.tableName}" where "${schema.storeData.sql
//       .tableName}"."${schema.idAttribute}" = ?`, // tslint:disable-line max-line-length
//     fields: ['id'],
//   };
// }
"use strict";