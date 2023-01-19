import http from 'k6/http';
import { createProjectObject, createJobObject } from '../models.js';
import { uuidv4 } from '../utils.js';

export function createJob(clusterId, project, bearerToken) {
    const job = createJobObject(clusterId, project);
    http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/podGroups`, JSON.stringify([job]), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
}

export function createCluster(bearerToken) {
    const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters`, JSON.stringify({"name": `stress-test-cluster-${uuidv4()}`}), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}})
    return res.json();
}
  
  export function createProject(userId, clusterId, nodePoolId, bearerToken) {
    const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/projects`, JSON.stringify(createProjectObject(userId, clusterId, nodePoolId)), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}})
    return res.json();
}