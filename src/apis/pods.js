import http from 'k6/http';
import { check } from 'k6';
import { createPodObject } from '../models.js';


export function deletePod(clusterId, podId, bearerToken) {
    const res = http.del(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/pods/${podId}`, {}, {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
    check(res, {
        'is status 201 at delete pod': (r) => r.status === 201,
      });
}

export function createPod(clusterId, jobId, bearerToken, namePrefix = 'stress-test-pod') {
    const pod = createPodObject(clusterId, jobId, namePrefix);
    const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/pods`, JSON.stringify([pod]), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
    check(res, {
        'is status 201 at create pod': (r) => r.status === 201,
    });
    return pod.podId;
}

export function syncPods(clusterId, bearerToken, pods) {
    const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/pods/sync`, JSON.stringify(pods), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
    check(res, {
        'is status 201 at sync pods': (r) => r.status === 201,
    });
}