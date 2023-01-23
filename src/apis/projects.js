import http from 'k6/http';
import { check } from 'k6';
import { createProjectObject } from '../models.js';

export function createProject(userId, clusterId, nodePoolId, bearerToken, namePrefix = 'stress-test-project') {
    const res = http.post(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/projects`, JSON.stringify(createProjectObject(userId, clusterId, nodePoolId, namePrefix)), {headers: {'Authorization': bearerToken, 'Content-Type': 'application/json'}})
    check(res, {
        'is status 200 at create project': (r) => r.status === 200,
    });
    return res.json();
}