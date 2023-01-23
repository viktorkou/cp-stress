import { uuidv4 } from './utils.js';

export function createProjectObject(userId, clusterId, nodePoolId, namePrefix = 'stress-test-project') {
    const id = uuidv4();
    return {
      "name": `${namePrefix}-${id}`,
      "departmentId": 1,
      "deservedGpus": 1,
      "clusterUuid": clusterId,
      "nodeAffinity": {
        "train": {
          "affinityType": "no_limit",
          "selectedTypes": []
        },
        "interactive": {
          "affinityType": "no_limit",
          "selectedTypes": []
        }
      },
      "permissions": {
        "users": [
          userId
        ],
        "groups": [],
        "applications": []
      },
      "interactiveJobTimeLimitSecs": null,
      "interactiveJobMaxIdleDurationSecs": null,
      "interactivePreemptibleJobMaxIdleDurationSecs": null,
      "trainingJobMaxIdleDurationSecs": null,
      "gpuOverQuotaWeight": 2,
      "maxAllowedGpus": -1,
      "swapEnabled": false,
      "resources": {
        "gpu": {
          "deserved": 1,
          "maxAllowed": -1,
          "overQuotaWeight": 2
        },
        "cpu": {
          "deserved": null,
          "maxAllowed": null,
          "overQuotaWeight": 0
        },
        "memory": {
          "deserved": null,
          "maxAllowed": null,
          "overQuotaWeight": 0
        }
      },
      "nodePoolsResources": [
        {
          "nodePool": {
            "id": nodePoolId,
            "name": "default"
          },
          "gpu": {
            "deserved": 0,
            "maxAllowed": -1,
            "overQuotaWeight": 2
          },
          "cpu": {
            "deserved": null,
            "maxAllowed": null,
            "overQuotaWeight": 0
          },
          "memory": {
            "deserved": null,
            "maxAllowed": null,
            "overQuotaWeight": 0
          }
        }
      ]
    }
  }
  
export function createJobObject(clusterId, project, namePrefix = 'stress-test-job') {
    const id = uuidv4();
    return {
      "jobId": id,
      "podGroupId": id,
      "podGroupUuid": id,
      "existsInCluster": true,
      "podGroupName": `${namePrefix}-${id}`,
      "workloadName": `${namePrefix}-${id}`,
      "workloadType": "Train",
      "clusterUuid": clusterId,
      "podGroupPhase": "Running",
      "jobPhase": "Running",
      "project": project,
      "workloadUser": "placeholder",
      "nodeId": "placeholder",
      "created": `${Date.now()}`,
      "nodePool": "default",
      "workloadKind": "RunaiJob",
      "parentWorkloadName": `${namePrefix}-${id}-parent`,
    }
}

export function createPodObject(clusterId, jobId, namePrefix = 'stress-test-pod') {
  const id = uuidv4();
  return {
    "podId": id,
    "podUuid": id,
    "jobId": jobId,
    "podGroupId": jobId,
    "imageName": "placeholder",
    "status": "Running",
    "phase": "Running",
    "podGroupUuid": jobId,
    "existsInCluster": true,
    "podName": `${namePrefix}-${id}`,
    "name": `${namePrefix}-${id}`,
    "clusterUuid": clusterId,
    "workloadUser": "placeholder",
    "nodeId": "placeholder",
    "created": `${Date.now()}`,
    "nodePool": "default",
  }
}