import { uuidv4 } from './utils.js';

export function createProjectObject(userId, clusterId, nodePoolId) {
    const id = uuidv4();
    return {
      "name": `stress-test-project-${id}`,
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
  
export function createJobObject(clusterId, project) {
    const id = uuidv4();
    return {
      "jobId": id,
      "podGroupId": id,
      "podGroupUuid": id,
      "existsInCluster": true,
      "podGroupName": `stress-${id}`,
      "workloadName": `stress-${id}`,
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
      "parentWorkloadName": `stress-${id}-parent`,
    }
}