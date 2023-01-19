export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
  
  export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  export function chooseRandomClusterInfo(clusters) {
    const cluster = clusters[getRandomInt(clusters.length)];
    const project = cluster.projects[getRandomInt(cluster.projects.length)];
    return {clusterId: cluster['clusterId'], appBearerToken: cluster['appBearerToken'], project: project};
  }