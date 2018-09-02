import {
  Action,
  DATASET_RECEIVE,
  DATASET_REQUEST,
  DATASET_SCHEMA_CHANGE_FIELD_TYPE,
  DATASET_SCHEMA_CHANGE_ORDINAL_DOMAIN,
} from '../actions';
import {Dataset, DEFAULT_DATASET} from '../models';

import {ExpandedType} from 'compassql/build/src/query/expandedtype';
import {FieldSchema, Schema} from 'compassql/build/src/schema';
import {QUANTITATIVE} from 'vega-lite/build/src/type';

export function datasetReducer(dataset: Readonly<Dataset> = DEFAULT_DATASET, action: Action): Dataset {
  switch (action.type) {
    case DATASET_REQUEST: {
      return {
        ...dataset,
        isLoading: true
      };
    }

    case DATASET_RECEIVE: {
      const { name, data, schema } = action.payload;
      let newSchame = schema;
      if(name == '학생') {
        // auto field change for task 2
        // console.log(name);
        // console.log(schema);
        newSchame = changeFieldType(newSchame, '기말 점수(2nd)', QUANTITATIVE);
        newSchame = changeFieldType(newSchame, '나이', QUANTITATIVE);
        newSchame = changeFieldType(newSchame, '중간 점수(1st)', QUANTITATIVE);
        newSchame = changeFieldType(newSchame, '최종 점수(3rd)', QUANTITATIVE);
      }
      return {
        ...dataset,
        isLoading: false,
        name,
        schema: newSchame,
        data,
      };
    }
  }

  const schema = schemaReducer(dataset.schema, action);
  if (dataset.schema !== schema) {
    return {
      ...dataset,
      schema
    };
  } else {
    return dataset;
  }
}

export function schemaReducer(schema = DEFAULT_DATASET.schema, action: Action): Schema {
  switch (action.type) {
    case DATASET_SCHEMA_CHANGE_FIELD_TYPE: {
      const {field, type} = action.payload;
      return changeFieldType(schema, field, type);
    }

    case DATASET_SCHEMA_CHANGE_ORDINAL_DOMAIN: {
      const {field, domain} = action.payload;
      return changeOrdinalDomain(schema, field, domain);
    }
  }

  return schema;
}

function updateSchema(schema: Schema, field: string, changedFieldSchema: FieldSchema) {
  const originalTableSchema = schema.tableSchema();
  const updatedTableSchemaFields: FieldSchema[] = originalTableSchema.fields.map(fieldSchema => {
    if (fieldSchema.name !== field) {
      return fieldSchema;
    }
    return changedFieldSchema;
  });

  return new Schema({
    ...originalTableSchema,
    fields: updatedTableSchemaFields
  });
}

export function changeFieldType(schema: Schema, field: string, type: ExpandedType) {
  return updateSchema(schema, field, {...schema.fieldSchema(field), vlType: type});
}

export function changeOrdinalDomain(schema: Schema, field: string, domain: string[]) {
  return updateSchema(schema, field, {...schema.fieldSchema(field), ordinalDomain: domain});
}
