import {
  createTypes,
  parseOptions,
  createCreators,
  reduceActionTypes,
} from '../src/asyncActionHelpers';
import { apiActionCreatorFactory } from '../src/apiActionCreator';

const urlFunction = (params) => `/${params.test}/`;

const baseConfigs = {
  list: { url: 'endpoint', method: 'get' },
  listWithUrlFunction: { url: urlFunction, method: 'get' },
  read: { url: 'endpoint/:id', method: 'put' },
  readWithExtras: {
    url: 'endpoint/:id',
    method: 'put',
    middlewares: ['myMiddleware'],
  },
};

const baseTypes = {
  list: {
    uppercaseName: 'LIST',
    REQUEST: 'MY_LIST_REQUEST',
    RESPONSE: 'MY_LIST_RESPONSE',
  },
  listWithUrlFunction: {
    uppercaseName: 'LIST_WITH_URL_FUNCTION',
    REQUEST: 'MY_LIST_REQUEST',
    RESPONSE: 'MY_LIST_RESPONSE',
  },
  read: {
    uppercaseName: 'READ',
    REQUEST: 'MY_READ_REQUEST',
    RESPONSE: 'MY_READ_RESPONSE',
  },
  readWithExtras: {
    uppercaseName: 'READ_WITH_EXTRAS',
    REQUEST: 'MY_READ_WITH_EXTRAS_REQUEST',
    RESPONSE: 'MY_READ_WITH_EXTRAS_RESPONSE',
  },
};

describe('createTypes', () => {
  it('should return an object with the respective action types', () => {
    const actionTypes = createTypes(['list', 'softDelete'], 'MY');
    expect(actionTypes).toEqual({
      list: {
        uppercaseName: 'LIST',
        REQUEST: 'MY_LIST_REQUEST',
        RESPONSE: 'MY_LIST_RESPONSE',
      },
      softDelete: {
        uppercaseName: 'SOFT_DELETE',
        REQUEST: 'MY_SOFT_DELETE_REQUEST',
        RESPONSE: 'MY_SOFT_DELETE_RESPONSE',
      },
    });
  });
});

describe('parseOptions', () => {
  it('should return a parsed url accordingly to modifier method', () => {
    const config = {
      modifier: options => ({ a: '1'}),
    };
    const option = {a: 1};
    expect(parseOptions({}, config).a).toBe('1')
    expect(parseOptions(option, {})).toBe(option);
  });
});

describe('createCreators', () => {
  it('should return an action creator', () => {

    const creators = createCreators(baseConfigs, baseTypes, 'MY', apiActionCreatorFactory);

    expect(creators.list()).toEqual({
      type: [baseTypes.list.REQUEST, baseTypes.list.RESPONSE],
      meta: {
        url: 'endpoint',
        method: 'get',
      },
    });

    expect(creators.listWithUrlFunction({ test: 1232 })).toEqual({
      type: [baseTypes.list.REQUEST, baseTypes.list.RESPONSE],
      meta: {
        url: urlFunction({ test: 1232 }),
        method: 'get',
        test: 1232,
      },
    });

    expect(creators.read({ id: '123' })).toEqual({
      type: [baseTypes.read.REQUEST, baseTypes.read.RESPONSE],
      meta: {
        url: 'endpoint/123',
        method: 'put',
        id: '123',
      },
    });

    expect(creators.readWithExtras({ id: '123' })).toEqual({
      type: [baseTypes.readWithExtras.REQUEST, baseTypes.readWithExtras.RESPONSE],
      meta: {
        url: 'endpoint/123',
        method: 'put',
        id: '123',
        middlewares: ['myMiddleware'],
      },
    });
  });
});

describe('reduceActionTypes', () => {
  const reducedTypes = reduceActionTypes(baseTypes);

  expect(reducedTypes).toEqual({
    LIST: {
      REQUEST: 'MY_LIST_REQUEST',
      RESPONSE: 'MY_LIST_RESPONSE',
    },
    LIST_WITH_URL_FUNCTION: {
      REQUEST: 'MY_LIST_REQUEST',
      RESPONSE: 'MY_LIST_RESPONSE',
    },
    READ: {
      REQUEST: 'MY_READ_REQUEST',
      RESPONSE: 'MY_READ_RESPONSE',
    },
    READ_WITH_EXTRAS: {
      REQUEST: 'MY_READ_WITH_EXTRAS_REQUEST',
      RESPONSE: 'MY_READ_WITH_EXTRAS_RESPONSE',
    },
  });
});
