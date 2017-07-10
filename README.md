<img src="https://github.com/viniciusdacal/redux-arc/blob/master/arc-64.png?raw=true" height="64" />

Arc is a dependency free, 2kb lib to handle async requests in redux.

[![build status](https://img.shields.io/travis/viniciusdacal/redux-arc/master.svg?style=flat-square)](https://travis-ci.org/viniciusdacal/redux-arc) [![npm version](https://img.shields.io/npm/v/redux-arc.svg?style=flat-square)](https://www.npmjs.com/package/redux-arc)

## Why
Many applications are built with react and redux, and api calls are critical to this process. With the available alternatives, you end up writing and repeating code a lot.

With a declarative way, you can write less code and make it easier to understand and maintain. All of it leads you to have less bugs and have a better code base. This is powerful and flexible. **We make things easier for you for the most common cases, and we allow you to take full control when you need!**

**Oh, I forgot to mention, this is 100% covered by tests!**

**Say no more to having a bunch of files just to talk with your api.**

with Arc, you can turn a lot of files in a few lines, take a look:

```js
import { createApiActions } from 'redux-arc';

const { creators, types } = createApiActions(
  {
    list: { url: 'path/to/resource', method: 'get' },
    read: { url: 'path/to/resource/:id', method: 'get' },
    create: { url: 'path/to/resource', method: 'post' },
  },
  { prefix: 'MY_RESOURCE_'}
);

// dispatch the actions using creators
dispatch(creators.list());

//provide the params for the url
dispatch(creators.read({ id: '123' }));

//provide the payload for your request
dispatch(creators.create({ payload: { name: 'John Doe' } }));

// use types in your reducers:
types.LIST.REQUEST // MY_RESOURCE_LIST_REQUEST
types.LIST.RESPONSE // MY_RESOURCE_LIST_RESPONSE

```

# Getting started
```bash
yarn add redux-arc
```
or
```bash
npm i --save redux-arc
```

In your store config file, you must configure the middleware:

```js
import { createAsyncMiddleware } from 'redux-arc';

const asyncTask = store => done => (options) => {
  // optoins = { url, method, payload }
  // do your request and call done(err, response) when you are ready
  done(err, response);

  // if you like, return the respective value to create a chain. The value you
  // return here, will be passed as the result of an action dispatch.
  return response;
};

// create the async middleware
const asyncMiddleware = createAsyncMiddleware(asyncTask);

// set it to the Store
const store = createStore(
  reducer,
  applyMiddleware(asyncMiddleware),
);
```

> We let the request with you. This way, you can use whatever you want: promises, generators, etc...

And now, you can use `createApiActions` to define your action creators and types.

```js
import { createApiActions } from 'redux-arc';

const { creators, types } = createApiActions(
  {
    list: { url: 'path/to/resource', method: 'get' },
    read: { url: 'path/to/resource/:id', method: 'get' },
    create: { url: 'path/to/resource', method: 'post' },
    update: { url: 'path/to/resource/:id', method: 'put' },
  },
  { prefix: 'MY_RESOURCE_'}
);
```
> The action creators name is up to you! We only care about the config inside it. You can create a `softDelete`, for example.

## Action Creators
`creators` is just an object that contains the action creators you defined (`list`, `read`, `create`, `update`).


you can execute any of them passing an object, which can contain a `payload`, used in the request, and any other value, that will be used to parse the url params that you declare, and will be forwarded to `asyncTask`

```js
dispatch(creators.read({ id: '123'}));
```

The above code, would dispatch an action like this:
```js
{
  type: ['MY_RESOURCE_LIST_REQUEST', 'MY_RESOURCE_LIST_RESPONSE'],
  meta: {
    url: 'path/to/resource/123',
    method: 'get',
    id: '123',
  },
}
```

> If you don't like using asyncActionCreator, you can always create and dispatch an object as the above, it will work out of the box.

Our middleware will intercept that action, and will dispatch actions
`MY_RESOURCE_LIST_REQUEST` and `MY_RESOURCE_LIST_RESPONSE` in the respective time.

To perform the request, the middleware uses the function you provide (`asyncTask`). It will execute the asyncTask passing `store => done => options`,
  - store: if you like, you can access the state through the `store.getState()`.
  - done: the function you must call with the `err` and `response`:  `done(err, response)` when the request finishes.
  - options: the object containing information regarding to the request, as the example bellow:

```js
{
  url: 'path/to/resource/123',
  method: 'get',
  payload: {},
}
```

> If you provide extra params in the actionCreator call, all of them will be under the options object.

## Types
When you call `createApiActions`, you also receive types. Types is just an object that contains all your action types, including request and response.

Basically, what we do, is converting to uppercase the name you gave for your action creators. So, if you provide a name like `list`, you will have
`types.LIST`, which is and object containing `REQUEST` and `RESPONSE`
so, in your reducers, you could use `types.LIST.REQUEST` to check for an action type. The respective type, has a value like this:
`'MY_RESOURCE_LIST_REQUEST'`. Remember we provided a prefix option (`MY_RESOURCE_`)? This helps you avoid conflicts across the application.

# Policies
We know there are sometimes when you need perform operations changing a request or response. For those cases, you can use policies.

A policy is basically another middleware, as the follow example:

```js
const policy store => done => (action, error, response) =>
  done(action, error, response);
```

A policy must have an applyPoint attribute, so:

```js
policy.applyPoint = 'beforeRequest' // (beforeRequest, onResponse)
```

You can imagine, in the cases your policy has an applyPoint `'beforeRequest'`, you would only have access to  `action` object, unless another policy create and  `error` or `response` in the ``beforeRequest` chain.

To use a policy, you do as the follow:

```js
import { createApiActions, policies } from 'redux-arc';

const { creators, types } = createApiActions(
  {
    update: {
      url: 'path/to/resource/:id',
      method: 'put',
      policies: ['omitId'], // define policies in your config.
    },
  },
  { prefix: 'MY_RESOURCE_'},
);

// this is the policy
function omitId(options) {
  return store => done => (action, ...params) => {
    const { id, ...restAction } = action;
    return done(restAction, ...params);
  }
}
omitId.applyPoint = 'beforeRequest';

// you must register your policy using policies.register, passing the name and the policy.
policies.register('omitId', omitId);

```

> Usually, for `beforeRequest` you would change only the action value, and for `onResponse`, you would change only the response. But feel free to change the action inside  `onResponse` cycle if that makes sense.


The best way to use a policy, is defining it in the action creators config, as we saw above, but if you **need**, you can provide policies when you are calling the action creator, just like this:

```js
dispatch(creators.read({
  id: '123',
  policies: ['omitId'],
}));
```


### License
MIT
