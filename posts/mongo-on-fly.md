---
title: Mongo on Fly
publish_date: 2022-07-15
---

# How to set up a mongo replica set on fly.io

## Setting up Mongo

This post will take you through creating a 3-node mongo cluster on fly.io. You'll probably want to select your own name/size/location for your cluster. In the post we'll be provisioning a 3gb database called `blerpy` in the USA. Make sure you've got the fly cli installed.

Let's start by creating our mongo nodes. Create a new folder and navigate into it. Create a file called `Dockerfile` and paste the following into it. Replace `blerpy` with whatever name you chose.

```dockerfile
FROM mongo:5
ENV FLY_REGION=404
CMD mongod --replSet blerpy --ipv6 --bind_ip localhost,$FLY_REGION.blerpy.internal
```

Run `fly launch --name blerpy --no-deploy` to auto create a fly.toml in that folder. Now that you've got an app provisioned in fly, run `fly volumes create -r ewr -s 3 blerpy_data` and `fly volumes create -r dfw -s 3 blerpy_data` and `fly volumes create -r lax -s 3 blerpy_data`. Replace `3` with your desired size, `ewr`/`dfw`/`lax` with your desired regions, and `blerpy_data` with `<YOUR_NAME>_data`. Next you'll want to run `fly scale count 3` and `fly scale vm dedicated-cpu-1x`. This ensures our mongo nodes have enough resources to do their things.

Modify your fly.toml to look something like this. Add `[mounts]` so mongo stores its data in our newly created volumes. Update the internal_port to 27017. Remove the public endpoint. Bump the concurrency limits up. We're also temporarily disabling the tcp checks. We can turn them back on once the replica set has been configured.

```toml
app = "blerpy"

kill_signal = "SIGINT"
kill_timeout = 5
processes = []

[env]

[mounts]
  source = "blerpy_data"
  destination = "/data/db"

[experimental]
  allowed_public_ports = []
  auto_rollback = true

[[services]]
  http_checks = []
  internal_port = 27017
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 250
    soft_limit = 200
    type = "connections"

  # [[services.tcp_checks]]
  #   grace_period = "1s"
  #   interval = "15s"
  #   restart_limit = 0
  #   timeout = "2s"
```

The time has come! Run `fly deploy`. Once that's finished we'll need to configure the replicaset inside mongo. Run `fly ssh console`. Once that has been set up, paste the following into the terminal. Replace the regions and names with the ones you chose.

```sh
mongosh --eval "rs.initiate({
 _id: \"blerpy\",
 members: [
   {_id: 0, host: \"ewr.blerpy.internal\"},
   {_id: 1, host: \"dfw.blerpy.internal\"},
   {_id: 2, host: \"lax.blerpy.internal\"}
 ]
})"
```

That's it! Your cluster is now up and running. You can see more details about it by running `mongosh --eval "rs.status()"` over ssh. Use this connection string to connect to your db (with your regions/names replaced): `mongodb://dfw.blerpy.internal:27017,ewr.blerpy.internal:27017,lax.blerpy.internal:27017/?replicaSet=blerpy`.

## Setting up a UI to validate your cluster

```sh
yarn create remix
# Just the basics -> Fly.io -> Javascript
npm i mongodb
fly launch --no-deploy
```

Add `MONGO_URI = "mongodb://dfw.blerpy.internal:27017,ewr.blerpy.internal:27017,lax.blerpy.internal:27017/?replicaSet=blerpy"` to the env in the fly.toml.

Create `app/db.server.js` with the following content

```js
import { MongoClient, ObjectId } from 'mongodb'

// Connection URI
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/'

// Create a new MongoClient
const client = new MongoClient(uri)

async function items () {
  await client.connect()
  const db = client.db('todos')
  return db.collection('items')
}

export async function getItems () {
  return (await items()).find({}).toArray()
}

export async function createItem (name) {
  return (await items()).insertOne({ name, completed: false })
}

export async function removeItem (id) {
  return (await items()).findOneAndDelete({ _id: ObjectId(id) })
}

export async function toggleItem (id, completed) {
  return (await items()).findOneAndUpdate(
    { _id: ObjectId(id) },
    { $set: { completed } }
  )
}
```

Replace `app/routes/index.jsx` with

```js
import { json } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'

import * as db from '../db.server'

export async function loader ({ request }) {
  const items = await db.getItems()
  return json({ items })
}

export async function action ({ request }) {
  const formData = await request.formData()

  switch (formData.get('_action')) {
    case 'new': {
      const name = formData.get('name')
      return db.createItem(name)
    }
    case 'toggle': {
      const id = formData.get('id')
      const completed = formData.get('completed') === 'true'
      return db.toggleItem(id, completed)
    }
    case 'remove': {
      const id = formData.get('id')
      return db.removeItem(id)
    }
  }
}

export default function Index () {
  const { items } = useLoaderData()
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        lineHeight: '1.4',
        padding: '0 32px'
      }}
    >
      <h1>Todo</h1>
      <Form method='post' onSubmit={e => setTimeout(() => e.target.reset())}>
        <input type='hidden' name='_action' value='new' />
        <input type='text' name='name'></input>
        <button type='submit'>Add</button>
      </Form>
      <ul
        style={{ margin: '8px 0', padding: 0, borderBottom: '1px solid #ccc' }}
      >
        {items.map(item => (
          <li
            key={item._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid #ccc',
              padding: '8px 0',
              textDecoration: item.completed ? 'line-through' : undefined
            }}
          >
            <Form method='post'>
              <input type='hidden' name='_action' value='toggle' />
              <input type='hidden' name='id' value={item._id} />
              <input type='hidden' name='completed' value={!item.completed} />
              <button
                type='submit'
                style={{
                  cursor: 'pointer',
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: item.completed ? '#21d278' : 'none',
                  border: '2px solid black',
                  marginRight: 8
                }}
                aria-label='Toggle'
              />
            </Form>
            {item.name}
            <div style={{ flex: 1 }} />
            <Form method='post'>
              <input type='hidden' name='_action' value='remove' />
              <input type='hidden' name='id' value={item._id} />
              <button type='submit'>X</button>
            </Form>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## What's next?

- Probably should add a username/password onto the cluster for much great security!
- Test what happens when you deploy a new version of the mongo docker container while the app is running
- Test what happens when you kill and then re-deploy one of the nodes
- Test what happens when you scale up the storage while the app is running
