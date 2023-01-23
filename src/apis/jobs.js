import http from 'k6/http';
import { check } from 'k6';
import { createJobObject } from '../models.js';


export function getJobs(clusterId, bearerToken, filter = "", from = 0, limit = 20) {
    if (filter) {
        filter = `text:${filter}`;
    }
    let res = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/jobs?filter=${filter}&sortBy=status&sortDirection=asc&from=${from}&limit=${limit}`, {headers: {'Authorization': bearerToken}})
    return res.json();
}

export function getJobsCount(clusterId, bearerToken, filter = "") {
    if (filter) {
        filter = `text:${filter}`;
    }
    let res = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/jobs/count?filter=${filter}`, {headers: {'Authorization': bearerToken}})
    return res.json()['count'];
}

export function deleteJob(clusterId, jobId, bearerToken) {
    const res = http.del(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/podGroups/${jobId}`, {}, {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
    check(res, {
        'is status 200 at delete job': (r) => r.status === 200,
      });
}

export function createJob(clusterId, project, bearerToken, namePrefix = 'stress-test-job') {
    const job = createJobObject(clusterId, project, namePrefix);
    const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/podGroups`, JSON.stringify([job]), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
    check(res, {
        'is status 201 at create job': (r) => r.status === 201,
    });
    return job.jobId;
}

export function syncJobs(clusterId, bearerToken, jobs) {
    const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/podGroups/sync`, JSON.stringify(jobs), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
    check(res, {
        'is status 201 at sync pods': (r) => r.status === 201,
    });
}