import { MongoClient } from "mongodb";

import { env } from "../config/env.js";
import { store } from "./store.js";

const defaultDatabaseName = "appiconstudio";
const sourceLatestTimestamp = getSourceLatestTimestamp();
const targetLatestTimestamp = Date.now() - (5 * 60 * 1000);
const globalCache = globalThis.__iconforgeMongoCache || {
  clientPromise: null,
  setupPromise: null
};

globalThis.__iconforgeMongoCache = globalCache;

function getSourceLatestTimestamp() {
  const timestamps = [
    store.now,
    ...store.projects.flatMap((project) => [project.createdAt, project.updatedAt]),
    ...store.exports.map((item) => item.createdAt),
    ...store.analyticsEvents.map((event) => event.createdAt)
  ]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  return timestamps.length ? Math.max(...timestamps) : Date.now();
}

function shiftTimestamp(value) {
  const originalTime = new Date(value).getTime();

  if (!Number.isFinite(originalTime)) {
    return new Date().toISOString();
  }

  return new Date(targetLatestTimestamp - (sourceLatestTimestamp - originalTime)).toISOString();
}

function buildSeedProjects() {
  return store.projects.map((project) => ({
    ...project,
    createdAt: shiftTimestamp(project.createdAt),
    updatedAt: shiftTimestamp(project.updatedAt)
  }));
}

function buildSeedExports() {
  return store.exports.map((item) => ({
    ...item,
    createdAt: shiftTimestamp(item.createdAt)
  }));
}

function buildSeedAnalyticsEvents() {
  return store.analyticsEvents.map((event) => ({
    ...event,
    createdAt: shiftTimestamp(event.createdAt)
  }));
}

function resolveDatabaseName() {
  if (env.mongodbDbName) {
    return env.mongodbDbName;
  }

  try {
    const url = new URL(env.mongodbUri);
    const pathname = url.pathname.replace(/^\/+/, "").trim();

    if (pathname) {
      return pathname;
    }
  } catch {
    // Ignore parse issues and use the default name.
  }

  return defaultDatabaseName;
}

async function seedCollection(collection, documents) {
  if (!documents.length) {
    return;
  }

  await collection.bulkWrite(
    documents.map((document) => ({
      updateOne: {
        filter: { id: document.id },
        update: { $setOnInsert: document },
        upsert: true
      }
    })),
    { ordered: false }
  );
}

function ensureMongoConfig() {
  if (!env.mongodbUri) {
    throw new Error("Missing MONGODB_URI. Add it to your local env file and Vercel project settings.");
  }
}

async function getMongoClient() {
  ensureMongoConfig();

  if (!globalCache.clientPromise) {
    const client = new MongoClient(env.mongodbUri, {
      maxPoolSize: 10
    });

    globalCache.clientPromise = client.connect();
  }

  return globalCache.clientPromise;
}

async function ensureDatabaseSetup() {
  if (!globalCache.setupPromise) {
    globalCache.setupPromise = (async () => {
      const client = await getMongoClient();
      const database = client.db(resolveDatabaseName());
      const projects = database.collection("projects");
      const exportsCollection = database.collection("exports");
      const analyticsEvents = database.collection("analyticsEvents");

      await Promise.all([
        projects.createIndex({ id: 1 }, { unique: true }),
        projects.createIndex({ updatedAt: -1 }),
        exportsCollection.createIndex({ id: 1 }, { unique: true }),
        exportsCollection.createIndex({ projectId: 1, createdAt: -1 }),
        analyticsEvents.createIndex({ id: 1 }, { unique: true }),
        analyticsEvents.createIndex({ createdAt: -1 }),
        analyticsEvents.createIndex({ "metadata.projectId": 1, createdAt: -1 })
      ]);

      const [projectCount, exportCount, analyticsCount] = await Promise.all([
        projects.countDocuments(),
        exportsCollection.countDocuments(),
        analyticsEvents.countDocuments()
      ]);

      const seedOperations = [];

      if (projectCount === 0) {
        seedOperations.push(seedCollection(projects, buildSeedProjects()));
      }

      if (exportCount === 0) {
        seedOperations.push(seedCollection(exportsCollection, buildSeedExports()));
      }

      if (analyticsCount === 0) {
        seedOperations.push(seedCollection(analyticsEvents, buildSeedAnalyticsEvents()));
      }

      if (seedOperations.length) {
        await Promise.all(seedOperations);
      }

      return {
        database,
        collections: {
          projects,
          exports: exportsCollection,
          analyticsEvents
        }
      };
    })();
  }

  return globalCache.setupPromise;
}

async function getCollections() {
  const { collections } = await ensureDatabaseSetup();
  return collections;
}

function withoutMongoId(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return rest;
}

export { getCollections, withoutMongoId };
