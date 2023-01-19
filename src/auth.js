import { parse } from "k6/x/yaml";
import http from 'k6/http';

export function getClusterSyncAppToken(clusterId, token){
    const clientRes = http.get(`${__ENV.BASE_URL}/v1/k8s/clusters/${clusterId}/installfile?cloud=op`, {headers: {'Authorization': token}});
    console.log(clientRes.body)
    const yamlClientRes = parse(clientRes.body);
    const clientId = yamlClientRes['runai-operator']['config']['cluster-sync']['clientId'];
    const clientSecret = yamlClientRes['runai-operator']['config']['cluster-sync']['clientSecret'];
    const clientName = yamlClientRes['runai-operator']['config']['cluster-sync']['clientName'];
    const reqBody = {"id": clientId, "secret": clientSecret, "name": clientName};
    const tokenRes = http.post(`${__ENV.BASE_URL}/v1/k8s/auth/oauth/apptoken`, JSON.stringify(reqBody), {headers: {'Content-Type': 'application/json'}});
    return `Bearer ${tokenRes.json()['access_token']}`;
}
  
export function getUserId(token) {
    const res = http.get(`${__ENV.BASE_URL}/v1/k8s/auth/me`, {headers: {'Authorization': token}});
    return res.json()['id'];
}

export function login(username, password) {
    const realm = getTenantConfig()['authRealm'];
    const data = {grant_type: 'password', username: username, password: password, client_id: 'runai-cli'}
    const res = http.post(`${getKeycloakUrl()}/realms/${realm}/protocol/openid-connect/token`, data, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
    console.log(res.data)
    console.log(res.status)
    return `Bearer ${res.json()['access_token']}`;
}

export function getTenantConfig() {
    const res = http.get(`${__ENV.BASE_URL}/v1/k8s/config`);
    return res.json()
}

function getKeycloakUrl() {
    let protocol = __ENV.BASE_URL.startsWith("http://") ? "http://" : __ENV.BASE_URL.startsWith("https://") ? "https://" : "";
    if(__ENV.BASE_URL.endsWith('.run.ai')) {
        return protocol + __ENV.BASE_URL.split('.').filter((item, index) => index !== 0).join('.') + '/auth';
    }
    else {
        return `${__ENV.BASE_URL}/auth`;
    }
}