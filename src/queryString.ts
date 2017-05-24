import { ParameterizedQuery } from './semiQuery';
import { ModelSchema } from 'plump';

/*
(
  select array_agg(
    jsonb_build_object('id', profile_permissions.document_id, 'meta', jsonb_build_object('perm', profile_permissions.perm))
  )
  from profile_permissions
  where profile_permissions.profile_id = profiles.id
) as conversations
*/

function relationFetch(schema: ModelSchema, relName: string) {
  const rel = schema.relationships[relName].type;
  const sqlBlock = rel.storeData.sql;
  const otherName = rel.sides[relName].otherName;
  const extraAgg = Object.keys(rel.extras || {}).map(extra => `'${extra}', "${sqlBlock.tableName}"."${extra}"`);
  const kv = [
    `'id'`, `"${sqlBlock.tableName}"."${sqlBlock.joinFields[otherName]}"`
  ];
  if (extraAgg.length) {
    kv.push(`'meta'`, `jsonb_build_object(${extraAgg.join(',')})`);
  }
  const where = sqlBlock.joinQuery && sqlBlock.joinQuery[relName]
    ? sqlBlock.joinQuery[relName]
    : `"${sqlBlock.tableName}"."${sqlBlock.joinFields[relName]}" = "${schema.storeData.sql.tableName}"."${schema.idAttribute}"`;

  return `(
    select array_agg(
      jsonb_build_object(${kv.join(', ')})
    )
    from "${sqlBlock.tableName}"
    where ${where}
  ) as "${relName}"`;
}

export function bulkQuery(schema: ModelSchema): ParameterizedQuery {
  let where = `where ${schema.storeData.sql.tableName}.${schema.idAttribute} = ?`;
  if (schema.storeData && schema.storeData.sql && schema.storeData.sql.bulkQuery) {
    where = schema.storeData.sql.bulkQuery;
  } else if (schema.storeData && schema.storeData.sql && schema.storeData.sql.singleQuery) {
    where = schema.storeData.sql.singleQuery;
  }
  const base = [`"${schema.storeData.sql.tableName}".*`];
  const sides = Object.keys(schema.relationships).map((k) => relationFetch(schema, k));
  return {
    queryString: `select ${base.concat(sides).join(', ')} from "${schema.storeData.sql.tableName}" ${where}`, // tslint:disable-line max-line-length
    fields: ['id'],
  };
}


export function readQuery(schema: ModelSchema): ParameterizedQuery {
  const base = [`"${schema.storeData.sql.tableName}".*`];
  const sides = Object.keys(schema.relationships).map((k) => relationFetch(schema, k));
  return {
    queryString: `select ${base.concat(sides).join(', ')} from "${schema.storeData.sql.tableName}" where "${schema.storeData.sql.tableName}"."${schema.idAttribute}" = ?`, // tslint:disable-line max-line-length
    fields: ['id'],
  };
}
