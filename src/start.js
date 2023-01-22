import http from 'k6/http';
import { chooseRandomClusterInfo } from './utils.js';
import { getClusterSyncAppToken, getUserId, login } from './auth.js';
import { createJob, syncJobs, createCluster, createProject } from './requests/post.js';
import { getJobs, getAudit, getJobsCount } from './requests/get.js';
import { deleteJob, deleteCluster } from './requests/delete.js';
import { createJobObject } from './models.js';


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
      exec: 'createJobHelperVU',
      vus: 1,
      iterations: 1,
      maxDuration: `${SETUP_SCEARIOS_DURATION_SECONDS}s`,
    },
    getJobs: {
      startTime: `${SETUP_SCEARIOS_DURATION_SECONDS}s`,
      executor: 'constant-arrival-rate',
      exec: 'getJobsVU',
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
      exec: 'auditVU',
      duration: `${TEST_SCEARIOS_DURATION_SECONDS}s`,
      rate: 10*STRESS_LEVEL_FACTOR,
      timeUnit: '1s',
      preAllocatedVUs: 1*STRESS_LEVEL_FACTOR,
      maxVUs: 10*STRESS_LEVEL_FACTOR,
    },
    createJob: {
      startTime: `${SETUP_SCEARIOS_DURATION_SECONDS}s`,
      executor: 'constant-arrival-rate',
      exec: 'createJobVU',
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
    let job = createJobObject(clusterInfo.clusterId, clusterInfo.project);
    // This is a dirty way to delete all jobs except the mock job
    syncJobs(clusterInfo.clusterId, clusterInfo.appBearerToken, [job]);
    // delete the mock job we created
    deleteJob(clusterInfo.clusterId, clusterInfo.appBearerToken, job.podGroupId)

    // Delete the cluster
    deleteCluster(clusterInfo.clusterId, data.token);
  }
}


// ==================== TEST VIRTUAL USER FUNCTIONS ====================

// VU code
export function getJobsVU(data) {
  const clusterInfo = chooseRandomClusterInfo(data['clusters']);
  getJobs(clusterInfo.clusterId, data['token']);
}

// VU code
export function auditVU(data) {
  getAudit(data['token'])
}

// VU code
export function createJobVU(data)  {
  const clusterInfo = chooseRandomClusterInfo(data['clusters']);
  createJob(clusterInfo.clusterId, clusterInfo.project, clusterInfo.appBearerToken);
}

// ==================== HELPER VIRTUAL USER FUNCTIONS ====================

// VU code
export function createJobHelperVU(data)  {
  const clusterInfo = chooseRandomClusterInfo(data['clusters']);
  createJob(clusterInfo.clusterId, clusterInfo.project, clusterInfo.appBearerToken);
}


// ==================== HELPER FUNCTIONS ====================



function getDefaultNodePoolId(clusterId, token) {
  const res = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/node-pools`, {headers: {'Authorization': token}});
  return res.json()[0]['id'];
}



