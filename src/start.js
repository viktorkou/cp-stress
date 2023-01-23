import { group } from 'k6';
import http from 'k6/http';
import { chooseRandomClusterInfo, generateShortUuid } from './utils.js';
import { getClusterSyncAppToken, getUserId, login } from './apis/auth.js';
import { createCluster, deleteCluster } from './apis/clusters.js';
import { createJob, syncJobs, getJobs, getJobsCount, deleteJob } from './apis/jobs.js';
import { createPod, deletePod, syncPods } from './apis/pods.js';
import { createProject } from './apis/projects.js';
import { getAudit } from './apis/audit.js';
import { createJobObject, createPodObject } from './models.js';


const STRESS_LEVEL_FACTOR = 20
const SETUP_SCEARIOS_DURATION_SECONDS = 1
const TEST_SCEARIOS_DURATION_SECONDS = 1

export const options = {
  thresholds: {
    'http_req_waiting{scenario:getJobs}': [],
    'http_req_waiting{group:::getjobcount}': [],
    'http_req_waiting{group:::getjobs}': [],
    'http_req_waiting{scenario:createJob}': [],
    'http_req_waiting{scenario:audit}': [],
    'http_reqs{scenario:getJobs}': [],
    'http_reqs{group:::getjobcount}': [],
    'http_reqs{group:::getjobs}': [],
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
  const flowUuid = generateShortUuid();
  console.log(`====================     Flow UUID: ${flowUuid}     ====================`)
  const token = login(__ENV.USERNAME, __ENV.PASSWORD)

  const userId = getUserId(token);

  let clusters = []
  for(let i = 0; i < 1; i++) {
    let clusterId = createCluster(token, `stress-test-cluster-${flowUuid}`)['uuid'];
    let defaultNodePoolId = getDefaultNodePoolId(clusterId, token);
    let projects = []
    for(let j=0; j < 1; j++) {
      projects.push(createProject(userId, clusterId, defaultNodePoolId, token, `stress-test-project-${flowUuid}`)['name']);
    }
    const appBearerToken = getClusterSyncAppToken(clusterId, token);
    clusters.push({clusterId: clusterId, defaultNodePoolId: defaultNodePoolId, appBearerToken: appBearerToken, projects: projects});
  }
  return {clusters: clusters, flowUuid: flowUuid, userId: userId, token: token};
}


// ==================== TEARDOWN ====================

export function teardown(data) {
  for(let clusterInfo of data.clusters) {
    let job = createJobObject(clusterInfo.clusterId, clusterInfo.project, `mock-job-${data.flowUuid}`);
    let pod = createPodObject(clusterInfo.clusterId, job.jobId, `mock-pod-${data.flowUuid}`);

    // This is a dirty way to delete all pods except the mock pod
    syncPods(clusterInfo.clusterId, clusterInfo.appBearerToken, [pod])
    // delete the mock pod we created
    deletePod(clusterInfo.clusterId, pod.podId, clusterInfo.appBearerToken)
    // This is a dirty way to delete all jobs except the mock job
    syncJobs(clusterInfo.clusterId, clusterInfo.appBearerToken, [job]);
    // delete the mock job we created
    deleteJob(clusterInfo.clusterId, job.jobId, clusterInfo.appBearerToken)


    // Delete the cluster
    deleteCluster(clusterInfo.clusterId, data.token);
  }
}


// ==================== TEST VIRTUAL USER FUNCTIONS ====================

// VU code
export function getJobsVU(data) {
  const clusterInfo = chooseRandomClusterInfo(data['clusters']);
  group('getjobcount', function () {
    let c = getJobsCount(clusterInfo.clusterId, data['token']);
  });
  group('getjobs', function () {
    getJobs(clusterInfo.clusterId, data['token'], 'stress');
  });
  
}

// VU code
export function auditVU(data) {
  getAudit(data['token'])
}

// VU code
export function createJobVU(data)  {
  const clusterInfo = chooseRandomClusterInfo(data['clusters']);
  let jobId = ''
  group('createjob', function () {
    jobId = createJob(clusterInfo.clusterId, clusterInfo.project, clusterInfo.appBearerToken, `stress-test-job-${data.flowUuid}`);
  });
  group('createpod', function () {
    createPod(clusterInfo.clusterId, jobId, clusterInfo.appBearerToken, `stress-test-job-${data.flowUuid}`);
  });

}

// ==================== HELPER VIRTUAL USER FUNCTIONS ====================

// VU code
export function createJobHelperVU(data)  {
  const clusterInfo = chooseRandomClusterInfo(data['clusters']);
  const jobId = createJob(clusterInfo.clusterId, clusterInfo.project, clusterInfo.appBearerToken, `stress-test-job-${data.flowUuid}`);
  createPod(clusterInfo.clusterId, jobId, clusterInfo.appBearerToken, `stress-test-job-${data.flowUuid}`);
}


// ==================== HELPER FUNCTIONS ====================



function getDefaultNodePoolId(clusterId, token) {
  const res = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/node-pools`, {headers: {'Authorization': token}});
  return res.json()[0]['id'];
}



