const fetch = require("node-fetch");
const url = require('url');

const PROJECT_ID = process.env.PROJECT_ID || 264;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || "crusherdev/cross-host-comparision";
const GIT_COMMIT = process.env.GIT_COMMIT || "280500bc8d6e4a163a0b9cff7351184a4024c337";
const CRUSHER_TOKEN = process.env.CRUSHER_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyODgsInRlYW1faWQiOjIyNSwiaWF0IjoxNjM1MTE1MDQ5LCJleHAiOjE2NjY2NTEwNDl9.FvAN8P9tREKZlw2DOlXXk81xVd4Zq-p6-c3ahTjFIj0";

const resolveToBackendPath = (path) => {
  return url.resolve("https://backend.crusher.dev", path);
};

(async () => {
  const baseBuildId = await fetch(resolveToBackendPath(`/projects/${PROJECT_ID}/tests/actions/run`), {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'cookie': `token=${CRUSHER_TOKEN}`,
    },
    body: JSON.stringify({
      disableBaseLineComparisions: true,
      host: "https://headout.com",
    })
  }).then(async (res) => {
    const responseText = await res.text();
    const { buildId } = JSON.parse(responseText);
    return buildId;
  });
  console.log("Build id is this", baseBuildId);

  const waitTillBuildIsFinished = (buildId) => {
    return new Promise((resolve, reject) => {
      // Send a request to "builds/:build_id/status" every 10s
      // to verify build status
      const interval = setInterval(async () => {
        const response = await fetch(resolveToBackendPath(`/builds/${buildId}/status`), {
          method: "GET",
          headers: {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'cookie': `token=${CRUSHER_TOKEN}`,
          },
        });
        const responseText = await response.text();
        const { status } = JSON.parse(responseText);

        if (status === "FINISHED") {
          console.log("Build executed");

          clearInterval(interval);
          resolve();
        }
      }, 10000);
    });
  }

  await waitTillBuildIsFinished(baseBuildId);

  console.loog("Build finished");
})();
