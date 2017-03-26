import * as Bluebird from 'bluebird';
import * as knex from 'knex';
import { Storage, IndefiniteModelData, ModelData, ModelSchema, ModelReference, RelationshipItem } from 'plump';
import { readQuery, bulkQuery } from './queryString';
import { ParameterizedQuery } from './semiQuery';
import { writeRelationshipQuery } from './writeRelationshipQuery';

function rearrangeData(type: ModelSchema, data: any): ModelData {
  const retVal: ModelData = {
    typeName: type.name,
    attributes: {},
    relationships: {},
    id: data[type.idAttribute],
  };
  for (const attrName in type.attributes) {
    retVal.attributes[attrName] = data[attrName];
  }
  for (const relName in type.relationships) {
    retVal.relationships[relName] = data[relName];
  }
  return retVal;
}

export class PGStore extends Storage {

  private knex;
  private queryCache: {
    [typeName: string]: {
      attributes: ParameterizedQuery,
      bulkRead: ParameterizedQuery,
      relationships: {
        [relName: string]: ParameterizedQuery,
      }
    }
  } = {};

  constructor(opts: {[opt: string]: any} = {}) {
    super(opts);
    const options = Object.assign(
      {},
      {
        client: 'postgres',
        debug: false,
        connection: {
          user: 'postgres',
          host: 'localhost',
          port: 5432,
          password: '',
          charset: 'utf8',
        },
        pool: {
          max: 20,
          min: 0,
        },
      },
      opts.sql
    );
    this.knex = knex(options);
  }

  /*
    note that knex.js "then" functions aren't actually promises the way you think they are.
    you can return knex.insert().into(), which has a then() on it, but that thenable isn't
    an actual promise yet. So instead we're returning Bluebird.resolve(thenable);
  */

  teardown() {
    return this.knex.destroy();
  }

  cache(value: ModelData): Bluebird<ModelData> {
    throw new Error('SQLSTORE is not a cache');
  }
  cacheAttributes(value: ModelData): Bluebird<ModelData> {
    throw new Error('SQLSTORE is not a cache');
  }
  cacheRelationship(value: ModelData): Bluebird<ModelData> {
    throw new Error('SQLSTORE is not a cache');
  }
  wipe(value: ModelReference, key?: string | string[]): void {
    throw new Error('SQLSTORE is not a cache');
  }



  allocateId(typeName: string): Bluebird<number> {
    return this.knex.raw('select nextval(?::regclass);', `${typeName}_id_seq`)
    .then((data) => data.rows[0].nextval);
  }

  addSchema(t: {typeName: string, schema: ModelSchema}) {
    return super.addSchema(t)
    .then(() => {
      this.queryCache[t.typeName] = {
        attributes: readQuery(t.schema),
        bulkRead: bulkQuery(t.schema),
        relationships: {}
      };
      Object.keys(t.schema.relationships).forEach(relName => {
        this.queryCache[t.typeName].relationships[relName] = writeRelationshipQuery(t.schema, relName);
      });
    });
  }


  writeAttributes(value: IndefiniteModelData): Bluebird<ModelData> {
    const updateObject = this.validateInput(value);
    const typeInfo = this.getSchema(value.typeName);
    return Bluebird.resolve()
    .then(() => {
      if ((updateObject.id === undefined) && (this.terminal)) {
        return this.knex(typeInfo.storeData.sql.tableName).insert(updateObject.attributes).returning(typeInfo.idAttribute)
        .then((createdId) => {
          return this.readAttributes({ typeName: value.typeName, id: createdId });
        });
      } else if (updateObject.id !== undefined) {
        return this.knex(updateObject.typeName).where({ [typeInfo.idAttribute]: updateObject.id }).update(updateObject.attributes)
        .then(() => {
          return this.readAttributes({ typeName: value.typeName, id: updateObject.id });
        });
      } else {
        throw new Error('Cannot create new content in a non-terminal store');
      }
    })
    .then((result) => {
      this.fireWriteUpdate(Object.assign({}, result, { invalidate: ['attributes'] }));
      return result;
    });
  }

  readAttributes(value: ModelReference): Bluebird<ModelData> {
    return this.knex.raw(this.queryCache[value.typeName].attributes.queryString, value.id)
    .then((o) => {
      if (o.rows[0]) {
        return rearrangeData(this.getSchema(value.typeName), o.rows[0]);
      } else {
        return null;
      }
    });
  }

  bulkRead(item: ModelReference) {
    const schema = this.getSchema(item.typeName);
    const query = this.queryCache[item.typeName].bulkRead;
    return this.knex.raw(query.queryString, item.id)
    .then((o) => {
      if (o.rows[0]) {
        const arrangedArray = o.rows.map((row) => rearrangeData(schema, row));
        const rootItem = arrangedArray.filter((it) => it.id === item.id)[0];
        return {
          data: rootItem,
          included: arrangedArray.filter((it) => it.id !== item.id),
        };
      } else {
        return null;
      }
    });
  }

  readRelationship(value: ModelReference, relRefName: string): Bluebird<ModelData> {
    const relName = relRefName.indexOf('relationships.') === 0
      ? relRefName.split('.')[1]
      : relRefName;
    const schema = this.getSchema(value.typeName);
    const rel = schema.relationships[relName].type;
    const otherRelName = rel.sides[relName].otherName;
    const sqlData = rel.storeData.sql;
    const selectBase = `"${sqlData.tableName}"."${sqlData.joinFields[otherRelName]}" as id`;
    let selectExtras = '';
    if (rel.extras) {
      selectExtras = `, jsonb_build_object(${Object.keys(rel.extras).map((extra) => `'${extra}', "${sqlData.tableName}"."${extra}"`).join(', ')}) as meta`; // tslint:disable-line max-line-length
    }

    const where = sqlData.where === undefined
      ? { [sqlData.joinFields[relName]]: value.id }
      : this.knex.raw(sqlData.where[relName], value.id);

    return this.knex(sqlData.tableName)
    .as(relName)
    .where(where)
    .select(this.knex.raw(`${selectBase}${selectExtras}`))
    .then((l) => {
      return {
        typeName: value.typeName,
        id: value.id,
        relationships: {
          [relName]: l,
        }
      };
    });
  }

  delete(value: ModelReference) {
    const schema = this.getSchema(value.typeName);
    return this.knex(schema.storeData.sql.tableName).where({ [schema.idAttribute]: value.id }).delete()
    .then((o) => {
      this.fireWriteUpdate({ id: value.id, typeName: value.typeName, invalidate: ['attributes', 'relationships'] });
      return o;
    });
  }

  writeRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem) {
    const subQuery = this.queryCache[value.typeName].relationships[relName];
    const schema = this.getSchema(value.typeName);
    const childData = schema.relationships[relName].type.sides[relName];
    return this.knex.raw(
      subQuery.queryString,
      subQuery.fields.map((f) => {
        if (f === 'item.id') {
          return value.id;
        } else if (f === 'child.id') {
          return child.id;
        } else {
          return child.meta[f];
        }
      })
    )
    .then(() => {
      this.fireWriteUpdate(Object.assign({}, value, { invalidate: [`relationships.${relName}`] }));
      this.fireWriteUpdate({
        id: child.id,
        typeName: childData.otherType,
        invalidate: [`relationships.${childData.otherName}`],
      });
    });
  }

  deleteRelationshipItem(value: ModelReference, relName: string, child: RelationshipItem) {
    const schema = this.getSchema(value.typeName);
    const rel = schema.relationships[relName].type;
    const otherRelName = rel.sides[relName].otherName;
    const sqlData = rel.storeData.sql;
    const childData = schema.relationships[relName].type.sides[relName];
    return this.knex(sqlData.tableName)
    .where({
      [sqlData.joinFields[otherRelName]]: child.id,
      [sqlData.joinFields[relName]]: value.id,
    })
    .delete()
    .then(() => {
      this.fireWriteUpdate(Object.assign({}, value, { invalidate: [`relationships.${relName}`] }));
      this.fireWriteUpdate({
        id: child.id,
        typeName: childData.otherType,
        invalidate: [`relationships.${childData.otherName}`],
      });
    });
  }

  query(q) {
    return Bluebird.resolve(this.knex.raw(q.query))
    .then((d) => d.rows);
  }
}
