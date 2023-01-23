import http from 'k6/http';
import { check } from 'k6';
import { uuidv4 } from '../utils.js';


export function deleteCluster(clusterId, bearerToken) {
    http.del(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}`, JSON.stringify({"uuid": clusterId}), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}});
}

export function createCluster(bearerToken, namePrefix = 'stress-test-cluster') {
    const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters`, JSON.stringify({"name": `${namePrefix}-${uuidv4()}`}), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}})
    check(res, {
        'is status 200 at create cluster': (r) => r.status === 200,
    });
    return res.json();
}