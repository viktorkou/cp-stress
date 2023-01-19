import http from "k6/http";

export function getJobs(clusterId, bearerToken) {
    let res = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/jobs?filter=&sortBy=status&sortDirection=asc&from=0&limit=20`, {headers: {'Authorization': bearerToken}})
    return res.json();
}

export function getAudit(bearerToken) {
    let res = http.get(`${__ENV.BASE_URL}/v1/k8s/audit?offset=0&limit=10000&start=2023-01-04T00:00:00&end=2023-01-11T23:59:59`, {headers: {'Authorization': bearerToken}})
    return res.json();
}

export function getJobsCount(clusterId, bearerToken) {
    let res = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/jobs/count`, {headers: {'Authorization': bearerToken}})
    return res.json()['count'];
}