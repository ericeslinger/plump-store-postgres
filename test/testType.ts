import {
  ModelSchema,
  RelationshipSchema,
  Model,
  ModelData,
  Schema,
  RelationshipItem,
} from 'plump';

export const ChildrenSchema: RelationshipSchema = {
  sides: {
    parents: { otherType: 'tests', otherName: 'children' },
    children: { otherType: 'tests', otherName: 'parents' },
  },
  storeData: {
    sql: {
      tableName: 'parent_child_relationship',
      joinFields: {
        parents: 'child_id',
        children: 'parent_id',
      },
    },
  },
};

export const ValenceChildrenSchema: RelationshipSchema = {
  sides: {
    valenceParents: { otherType: 'tests', otherName: 'valenceChildren' },
    valenceChildren: { otherType: 'tests', otherName: 'valenceParents' },
  },
  storeData: {
    sql: {
      tableName: 'valence_children',
      joinFields: {
        valenceParents: 'child_id',
        valenceChildren: 'parent_id',
      },
    },
  },
  extras: {
    perm: {
      type: 'number',
    },
  },
};

export const TestSchema: ModelSchema = {
  name: 'tests',
  idAttribute: 'id',
  attributes: {
    id: { type: 'number', readOnly: true },
    name: { type: 'string', readOnly: false },
    otherName: { type: 'string', default: '', readOnly: false },
    extended: { type: 'object', default: {}, readOnly: false },
  },
  relationships: {
    children: { type: ChildrenSchema },
    parents: { type: ChildrenSchema },
    valenceChildren: { type: ValenceChildrenSchema },
    valenceParents: { type: ValenceChildrenSchema },
  },
  storeData: {
    sql: {
      views: {
        default: { name: 'tests' },
        full: {
          name: 'view_tests_full',
          contains: [
            'parents',
            'children',
            'valenceParents',
            'valenceChildren',
          ],
        },
      },
    },
  },
};

export interface PermRelationshipItem extends RelationshipItem {
  meta: {
    perm: number;
  };
}

export interface TestData extends ModelData {
  type: 'tests';
  id: number;
  attributes?: {
    id: number;
    name: string;
    otherName: string;
    extended: { [key: string]: any };
  };
  relationships?: {
    children: RelationshipItem[];
    parents: RelationshipItem[];
    valenceChildren: PermRelationshipItem[];
    valenceParents: PermRelationshipItem[];
  };
}

@Schema(TestSchema)
export class TestType extends Model<TestData> {
  static type = 'tests';
}
