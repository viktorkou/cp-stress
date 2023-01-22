import http from 'k6/http';

export function deleteJob(clusterId, jobId, bearerToken) {
    http.del(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/podGroups/${jobId}`, {}, {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
}

export function deleteCluster(clusterId, bearerToken) {
    http.del(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}`, JSON.stringify({"uuid": clusterId}), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
}