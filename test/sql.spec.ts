/* eslint-env node, mocha*/
/* eslint no-shadow: 0 */

import * as pg from 'pg';
import * as chai from 'chai';

import { PGStore } from '../dist/index';
import { TestType } from './testType';
import { testSuite } from './storageTests';

import { IndefiniteModelData } from 'plump';

const expect = chai.expect;

// TestType.$schema.queryChildren.relationship.$sides.queryChildren.self.query.rawJoin =
// 'left outer join query_children as querychildren on querychildren.parent_id = tests.id and querychildren.perm >= 2';
// TestType.$schema.queryParents.relationship.$sides.queryParents.self.query.rawJoin =
// 'left outer join query_children as queryparents on queryparents.child_id = tests.id and queryparents.perm >= 2';
//

function runSQL(command, opts = {}) {
  const connOptions = Object.assign(
    {},
    {
      user: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      charset: 'utf8',
    },
    opts,
  );
  const client = new pg.Client(connOptions);
  return new Promise(resolve => {
    client.connect(err => {
      if (err) {
        throw err;
      }
      client.query(command, err2 => {
        // tslint:disable-line no-shadowed-variable
        if (err2) {
          throw err2;
        }
        client.end(err3 => {
          // tslint:disable-line no-shadowed-variable
          if (err3) {
            throw err3;
          }
          resolve();
        });
      });
    });
  });
}

function createDatabase(name) {
  return runSQL(`DROP DATABASE if exists ${name};`)
    .then(() => runSQL(`CREATE DATABASE ${name};`))
    .then(() => {
      return runSQL(
        `
      CREATE TABLE tests (
        id serial not null primary key,
        name text,
        "otherName" text,
        extended jsonb not null default '{}'::jsonb
      );
      CREATE TABLE parent_child_relationship (parent_id integer not null, child_id integer not null);
      CREATE UNIQUE INDEX children_join on parent_child_relationship (parent_id, child_id);
      CREATE TABLE valence_children (parent_id integer not null, child_id integer not null, perm integer not null);
      CREATE UNIQUE INDEX valence_children_join on valence_children (parent_id, child_id);
      CREATE TABLE dated_tests (
        id serial not null primary key,
        name text,
        "when" timestamptz
      );
      CREATE VIEW view_tests_full as
        select
        tests.*,
        (select array_agg(jsonb_build_object('id', parent_child_relationship.parent_id) )
          from parent_child_relationship where parent_child_relationship.child_id = tests.id ) as parents,
        (select array_agg(jsonb_build_object('id', parent_child_relationship.child_id) )
          from parent_child_relationship where parent_child_relationship.parent_id = tests.id ) as children,
        (select array_agg(jsonb_build_object('id', valence_children.parent_id, 'meta', jsonb_build_object('perm', valence_children.perm)))
          from valence_children where valence_children.child_id = tests.id ) as "valenceParents",
        (select array_agg(jsonb_build_object('id', valence_children.child_id, 'meta', jsonb_build_object('perm', valence_children.perm)))
          from valence_children where valence_children.parent_id = tests.id ) as "valenceChildren"
        from tests;
    `,
        { database: name },
      );
    });
}

testSuite(
  {
    describe,
    it,
    before,
    after,
  },
  {
    ctor: PGStore,
    opts: {
      sql: {
        debug: process.env.DBDEBUG === 'true',
        connection: {
          database: 'plump_test',
          user: 'postgres',
          host: 'localhost',
          port: 5432,
        },
      },
      terminal: true,
    },
    name: 'Plump Postgres Store',
    before: () => createDatabase('plump_test'),
    after: driver => {
      return driver.teardown().then(() => runSQL('DROP DATABASE plump_test;'));
    },
  },
);

const sampleObject: IndefiniteModelData = {
  type: 'tests',
  attributes: {
    name: 'potato',
    otherName: 'elephantine',
    extended: {
      actual: 'rutabaga',
      otherValue: 42,
    },
  },
};

describe('postgres-specific behaviors', () => {
  let store: PGStore;
  before(() => {
    return createDatabase('secondary_plump_test').then(() => {
      store = new PGStore({
        sql: {
          debug: process.env.DBDEBUG === 'true',
          connection: {
            database: 'secondary_plump_test',
            user: 'postgres',
            host: 'localhost',
            port: 5432,
          },
        },
        terminal: true,
      });
      return store.addSchema(TestType);
    });
  });

  it('Returns extra contents', () => {
    return store.writeAttributes(sampleObject).then(createdObject => {
      return store
        .writeRelationshipItem(createdObject, 'valenceChildren', {
          id: 100,
          type: 'tests',
          meta: { perm: 1 },
        })
        .then(() => {
          return store
            .read({
              item: { id: createdObject.id, type: createdObject.type },
              fields: ['attributes', 'relationships'],
              view: 'full',
            })
            .then(res => {
              expect(res.relationships.valenceChildren).to.deep.include.members(
                [{ id: 100, type: TestType.type, meta: { perm: 1 } }],
              );
              expect(res.relationships.children).to.deep.equal([]);
              expect(res.relationships.parents).to.deep.equal([]);
              expect(res.relationships.valenceParents).to.deep.equal([]);
            });
        });
    });
  });

  it('supports all hasMany relationships', () => {
    return store.writeAttributes(sampleObject).then(createdObject => {
      return store
        .writeRelationshipItem(createdObject, 'children', {
          id: 102,
          type: 'tests',
        })
        .then(() =>
          store.writeRelationshipItem(createdObject, 'children', {
            id: 103,
            type: 'tests',
          }),
        )
        .then(() =>
          store.writeRelationshipItem(createdObject, 'valenceChildren', {
            id: 102,
            type: 'tests',
            meta: { perm: 20 },
          }),
        )
        .then(() =>
          store.writeRelationshipItem(createdObject, 'valenceChildren', {
            id: 103,
            type: 'tests',
            meta: { perm: 30 },
          }),
        )
        .then(() =>
          store.readRelationship({
            item: createdObject,
            rel: 'children',
            fields: ['relationships.children'],
          }),
        )
        .then(v =>
          expect(v.relationships.children).to.deep.include.members([
            { id: 102 },
            { id: 103 },
          ]),
        )
        .then(() =>
          store.readRelationship({
            item: createdObject,
            rel: 'valenceChildren',
            fields: ['relationships.valenceChildren'],
          }),
        )
        .then(v =>
          expect(v.relationships.valenceChildren).to.deep.include.members([
            { id: 102, meta: { perm: 20 } },
            { id: 103, meta: { perm: 30 } },
          ]),
        );
    });
  });

  after(() => {
    return store
      .teardown()
      .then(() => runSQL('DROP DATABASE secondary_plump_test;'));
  });
});
