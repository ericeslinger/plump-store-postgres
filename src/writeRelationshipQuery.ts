import { ModelSchema } from 'plump';
import { ParameterizedQuery } from './semiQuery';

export function writeRelationshipQuery(
  schema: ModelSchema,
  relName: string,
): ParameterizedQuery {
  const rel = schema.relationships[relName].type;
  const otherRelName = rel.sides[relName].otherName;
  const writeTable = rel.storeData.sql.writeView || rel.storeData.sql.tableName;
  if (rel.storeData && rel.storeData.sql) {
    const sqlData = rel.storeData.sql;
    if (rel.extras) {
      const extraArray = Object.keys(rel.extras).concat();
      const insertArray = [
        sqlData.joinFields[otherRelName],
        sqlData.joinFields[relName],
      ].concat(extraArray);
      const insertString = `insert into "${writeTable}" (${insertArray.join(
        ', ',
      )})
      values (${insertArray.map(() => '?').join(', ')})
      on conflict ("${sqlData.joinFields[otherRelName]}", "${
        sqlData.joinFields[relName]
      }") `;
      return {
        queryString: `${insertString} do update set ${extraArray
          .map(v => `${v} = ?`)
          .join(', ')};`,
        fields: ['child.id', 'item.id'].concat(extraArray).concat(extraArray),
      };
    } else {
      const insertArray = [
        sqlData.joinFields[otherRelName],
        sqlData.joinFields[relName],
      ];
      const insertString = `insert into "${writeTable}" (${insertArray.join(
        ', ',
      )})
      values (${insertArray.map(() => '?').join(', ')})
      on conflict ("${sqlData.joinFields[otherRelName]}", "${
        sqlData.joinFields[relName]
      }") `;
      return {
        queryString: `${insertString} do nothing;`,
        fields: ['child.id', 'item.id'],
      };
    }
  } else {
    return null;
  }
}
