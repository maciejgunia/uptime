const environments = {};
const currentEnv = typeof(process.env.NODE_ENV) === "string" ? process.env.NODE_ENV : "";

let exportedEnv;

environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: "staging",
    hasingSecret: "secret",
    maxChecks: 5,
};

environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: "production",
    hasingSecret: "secret",
    maxChecks: 5,
};

exportedEnv = typeof(environments[currentEnv]) === "object" ? environments[currentEnv] : environments.staging;

module.exports = exportedEnv;
