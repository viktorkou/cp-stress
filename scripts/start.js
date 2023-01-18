import http from 'k6/http';
import { check } from 'k6';
import { uuidv4, getRandomInt } from './utils.js';
import { getClusterSyncAppToken, getUserId, login } from './auth.js';
import { createProjectObject, createJobObject } from './models.js';


const STRESS_LEVEL_FACTOR = 20
const SETUP_SCEARIOS_DURATION_SECONDS = 30
const TEST_SCEARIOS_DURATION_SECONDS = 60

export const options = {
  thresholds: {
    'http_req_waiting{scenario:getJobs}': [],
    'http_req_waiting{scenario:createJob}': [],
    'http_req_waiting{scenario:audit}': [],
    'http_reqs{scenario:getJobs}': [],
    'http_reqs{scenario:audit}': [],
    'http_reqs{scenario:createJob}': [],
  },
  scenarios: {
    createJobsPreload: {
      executor: 'shared-iterations',
      exec: 'createJobHelper',
      vus: 10*STRESS_LEVEL_FACTOR,
      iterations: 100*STRESS_LEVEL_FACTOR,
      maxDuration: `${SETUP_SCEARIOS_DURATION_SECONDS}s`,
    },
    getJobs: {
      startTime: `${SETUP_SCEARIOS_DURATION_SECONDS}s`,
      executor: 'constant-arrival-rate',
      exec: 'getJobs',
      duration: `${TEST_SCEARIOS_DURATION_SECONDS}s`,
      rate: 20*STRESS_LEVEL_FACTOR,
      // It should start `rate` iterations per second
      timeUnit: '1s',
      preAllocatedVUs: 1*STRESS_LEVEL_FACTOR,
      maxVUs: 20*STRESS_LEVEL_FACTOR,
    },
    audit: {
      startTime: `${SETUP_SCEARIOS_DURATION_SECONDS}s`,
      executor: 'constant-arrival-rate',
      exec: 'audit',
      duration: `${TEST_SCEARIOS_DURATION_SECONDS}s`,
      rate: 10*STRESS_LEVEL_FACTOR,
      timeUnit: '1s',
      preAllocatedVUs: 1*STRESS_LEVEL_FACTOR,
      maxVUs: 10*STRESS_LEVEL_FACTOR,
    },
    createJob: {
      startTime: `${SETUP_SCEARIOS_DURATION_SECONDS}s`,
      executor: 'constant-arrival-rate',
      exec: 'createJob',
      duration: `${TEST_SCEARIOS_DURATION_SECONDS}s`,
      rate: 1*STRESS_LEVEL_FACTOR,
      timeUnit: '1s',
      preAllocatedVUs: 1*STRESS_LEVEL_FACTOR,
      maxVUs: 20*STRESS_LEVEL_FACTOR,
    },
  }
};


// ==================== SETUP ====================

export function setup() {
  const token = login(__ENV.USERNAME, __ENV.PASSWORD)

  const userId = getUserId(token);

  let clusters = []
  for(let i = 0; i < 1; i++) {
    let clusterId = createCluster(token)['uuid'];
    let defaultNodePoolId = getDefaultNodePoolId(clusterId, token);
    let projects = []
    for(let j=0; j < 1; j++) {
      projects.push(createProject(userId, clusterId, defaultNodePoolId, token)['name']);
    }
    const appBearerToken = getClusterSyncAppToken(clusterId, token);
    clusters.push({clusterId: clusterId, defaultNodePoolId: defaultNodePoolId, appBearerToken: appBearerToken, projects: projects});
  }
  console.log(JSON.stringify(clusters));
  return {clusters: clusters, userId: userId, token: token};
}


// ==================== TEARDOWN ====================

export function teardown(data) {
  for(let clusterInfo of data.clusters) {
    let mockJob = createJobObject(clusterInfo.clusterId, clusterInfo.project);
    // This is a dirty way to delete all jobs except the mock job
    http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterInfo.clusterId}/podGroups/sync`, JSON.stringify([mockJob]), {headers: {'Authorization': clusterInfo.appBearerToken, 'Content-Type': 'application/json'}});
    // delete the mock job we created
    http.del(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterInfo.clusterId}/podGroups/${mockJob.podGroupId}`, {}, {headers: {'Authorization': clusterInfo.appBearerToken, 'Content-Type': 'application/json'}});

    // Delete the cluster
    http.del(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterInfo.clusterId}`, JSON.stringify({"uuid": clusterInfo.clusterId}), {headers: {'Authorization': data['token'], 'Content-Type': 'application/json'}});
  }
}


// ==================== TEST VIRTUAL USER FUNCTIONS ====================

// VU code
export function getJobs(data) {
  const clusterInfo = getRandomClusterInfo(data['clusters']);
  let res = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterInfo.clusterId}/jobs?filter=&sortBy=status&sortDirection=asc&from=0&limit=20`, {headers: {'Authorization': data['token']}})
  check(res, {
    "status code should be 200": res => res.status === 200,
  });
}

// VU code
export function audit(data) {
  let res = http.get(`${__ENV.BASE_URL}/v1/k8s/audit?offset=0&limit=10000&start=2023-01-04T00:00:00&end=2023-01-11T23:59:59`, {headers: {'Authorization': data['token']}})
  check(res, {
    "status code should be 200": res => res.status === 200,
  });
}

// VU code
export function createJob(data)  {
  const clusterInfo = getRandomClusterInfo(data['clusters']);
  const job = createJobObject(clusterInfo.clusterId, clusterInfo.project);
  http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterInfo.clusterId}/podGroups`, JSON.stringify([job]), {headers: {'Authorization': clusterInfo.appBearerToken, 'Content-Type': 'application/json'}});
}

// ==================== HELPER VIRTUAL USER FUNCTIONS ====================

// VU code
export function createJobHelper(data)  {
  const clusterInfo = getRandomClusterInfo(data['clusters']);
  const job = createJobObject(clusterInfo.clusterId, clusterInfo.project);
  http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterInfo.clusterId}/podGroups`, JSON.stringify([job]), {headers: {'Authorization': clusterInfo.appBearerToken, 'Content-Type': 'application/json'}});
}


// ==================== HELPER FUNCTIONS ====================

export function createCluster(token) {
  const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters`, JSON.stringify({"name": `stress-test-cluster-${uuidv4()}`}), {headers: {'Authorization': token, 'Content-Type': 'application/json'}})
  return res.json();
}

export function createProject(userId, clusterId, nodePoolId, token) {
  const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/projects`, JSON.stringify(createProjectObject(userId, clusterId, nodePoolId)), {headers: {'Authorization': token, 'Content-Type': 'application/json'}})
  return res.json();
}



function getDefaultNodePoolId(clusterId, token) {
  const res = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/node-pools`, {headers: {'Authorization': token}});
  return res.json()[0]['id'];
}

function getRandomClusterInfo(clusters) {
  const cluster = clusters[getRandomInt(clusters.length)];
  const project = cluster.projects[getRandomInt(cluster.projects.length)];
  return {clusterId: cluster['clusterId'], appBearerToken: cluster['appBearerToken'], project: project};
}

