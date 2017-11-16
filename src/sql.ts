import * as Knex from 'knex';
import {
  Storage,
  IndefiniteModelData,
  ModelData,
  ModelSchema,
  StorageReadRequest,
  ModelReference,
  RelationshipItem,
  TerminalStore,
} from 'plump';
// import { readQuery, bulkQuery } from './queryString';
import { ParameterizedQuery } from './semiQuery';
import { writeRelationshipQuery } from './writeRelationshipQuery';

export class PGStore extends Storage implements TerminalStore {
  public knex: Knex;
  public queryCache: {
    [type: string]: {
      relationships: {
        [relName: string]: ParameterizedQuery;
      };
    };
  } = {};

  constructor(opts: { [opt: string]: any } = {}) {
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
      opts.sql,
    );
    this.knex = Knex(options);
  }

  /*
    note that knex.js "then" functions aren't actually promises the way you think they are.
    you can return knex.insert().into(), which has a then() on it, but that thenable isn't
    an actual promise yet. So instead we're returning Promise.resolve(thenable);
  */

  teardown() {
    return Promise.resolve(this.knex.destroy());
  }

  allocateId(type: string): Promise<number> {
    return Promise.resolve(
      this.knex
        .raw('select nextval(?::regclass);', `${type}_id_seq`)
        .then(data => data.rows[0].nextval),
    );
  }

  addSchema(t: { type: string; schema: ModelSchema }) {
    return super.addSchema(t).then(() => {
      if (t.schema.storeData && t.schema.storeData.sql) {
        this.queryCache[t.type] = {
          relationships: {},
        };
        Object.keys(t.schema.relationships).forEach(relName => {
          const rq = writeRelationshipQuery(t.schema, relName);
          if (!!rq) {
            this.queryCache[t.type].relationships[relName] = rq;
          }
        });
      }
    });
  }
  rearrangeData(req: StorageReadRequest, data: any): ModelData {
    const schema = this.getSchema(req.item.type);
    const retVal: ModelData = {
      type: req.item.type,
      attributes: {},
      relationships: {},
      id: data[schema.idAttribute],
    };
    for (const attrName in schema.attributes) {
      retVal.attributes[attrName] = data[attrName];
    }
    if (schema.storeData.sql.views[req.view || 'default'].contains) {
      schema.storeData.sql.views[req.view || 'default'].contains.forEach(
        relName => (retVal.relationships[relName] = data[relName] || []),
      );
    }
    return retVal;
  }
  writeAttributes(value: IndefiniteModelData): Promise<ModelData> {
    const updateObject = this.validateInput(value);
    const typeInfo = this.getSchema(value.type);
    return Promise.resolve()
      .then(() => {
        if (updateObject.id === undefined && this.terminal) {
          return this.knex(typeInfo.storeData.sql.views.default.name)
            .insert(updateObject.attributes)
            .returning(typeInfo.idAttribute)
            .then(createdId => {
              return this.readAttributes({
                item: { type: value.type, id: createdId[0] },
                fields: ['attributes'],
              });
            });
        } else if (updateObject.id !== undefined) {
          return this.knex(updateObject.type)
            .where({ [typeInfo.idAttribute]: updateObject.id })
            .update(updateObject.attributes)
            .then(() => {
              return this.readAttributes({
                item: {
                  type: value.type,
                  id: updateObject.id,
                },
                fields: ['attributes'],
              });
            });
        } else {
          throw new Error('Cannot create new content in a non-terminal store');
        }
      })
      .then(result => {
        this.fireWriteUpdate(
          Object.assign({}, result, { invalidate: ['attributes'] }),
        );
        return result;
      });
  }

  readAttributes(req: StorageReadRequest): Promise<ModelData> {
    const schema = this.getSchema(req.item.type);
    const view = schema.storeData.sql.views[req.view || 'default'];
    return Promise.resolve(
      this.knex(view.name)
        .where({ [schema.idAttribute]: req.item.id })
        .select()
        .then(o => {
          if (o[0]) {
            return this.rearrangeData(req, o[0]);
          } else {
            return null;
          }
        }),
    );
  }

  readRelationship(req: StorageReadRequest): Promise<ModelData> {
    const relName =
      req.rel.indexOf('relationships.') === 0 ? req.rel.split('.')[1] : req.rel;
    const schema = this.getSchema(req.item.type);
    const rel = schema.relationships[relName].type;
    const otherRelName = rel.sides[relName].otherName;
    const sqlData = rel.storeData.sql;
    const selectBase = `"${sqlData.tableName}"."${
      sqlData.joinFields[otherRelName]
    }" as id`;
    let selectExtras = '';
    if (rel.extras) {
      selectExtras = `, jsonb_build_object(${Object.keys(rel.extras)
        .map(extra => `'${extra}', "${sqlData.tableName}"."${extra}"`)
        .join(', ')}) as meta`; // tslint:disable-line max-line-length
    }

    return Promise.resolve(
      this.knex(sqlData.tableName)
        .as(relName)
        .where({ [sqlData.joinFields[req.rel]]: req.item.id })
        .select(this.knex.raw(`${selectBase}${selectExtras}`))
        .then(l => {
          return {
            type: req.item.type,
            id: req.item.id,
            relationships: {
              [relName]: l,
            },
          };
        }),
    );
  }

  delete(value: ModelReference) {
    const schema = this.getSchema(value.type);
    return Promise.resolve(
      this.knex(schema.storeData.sql.views.default.name)
        .where({ [schema.idAttribute]: value.id })
        .delete()
        .then(o => {
          this.fireWriteUpdate({
            id: value.id,
            type: value.type,
            invalidate: ['attributes', 'relationships'],
          });
          return o;
        }),
    );
  }

  writeRelationshipItem(
    value: ModelReference,
    relName: string,
    child: RelationshipItem,
  ) {
    const subQuery = this.queryCache[value.type].relationships[relName];
    const schema = this.getSchema(value.type);
    const childData = schema.relationships[relName].type.sides[relName];
    return Promise.resolve(
      this.knex
        .raw(
          subQuery.queryString,
          subQuery.fields.map(f => {
            if (f === 'item.id') {
              return value.id;
            } else if (f === 'child.id') {
              return child.id;
            } else {
              return child.meta[f];
            }
          }),
        )
        .then(() => {
          this.fireWriteUpdate(
            Object.assign({}, value, {
              invalidate: [`relationships.${relName}`],
            }),
          );
          this.fireWriteUpdate({
            id: child.id,
            type: childData.otherType,
            invalidate: [`relationships.${childData.otherName}`],
          });
          return null;
        }),
    );
  }

  deleteRelationshipItem(
    value: ModelReference,
    relName: string,
    child: RelationshipItem,
  ) {
    const schema = this.getSchema(value.type);
    const rel = schema.relationships[relName].type;
    const otherRelName = rel.sides[relName].otherName;
    const sqlData = rel.storeData.sql;
    const childData = schema.relationships[relName].type.sides[relName];
    return Promise.resolve(
      this.knex(sqlData.tableName)
        .where({
          [sqlData.joinFields[otherRelName]]: child.id,
          [sqlData.joinFields[relName]]: value.id,
        })
        .delete()
        .then(() => {
          this.fireWriteUpdate(
            Object.assign({}, value, {
              invalidate: [`relationships.${relName}`],
            }),
          );
          this.fireWriteUpdate({
            id: child.id,
            type: childData.otherType,
            invalidate: [`relationships.${childData.otherName}`],
          });
          return null;
        }),
    );
  }

  query(type: string, q: any) {
    return Promise.resolve(
      this.knex(type)
        .where(q)
        .select('id')
        .then(r => r.map(v => ({ type: type, id: v.id }))),
    );
  }
}
