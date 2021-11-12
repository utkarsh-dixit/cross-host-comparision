const fetch = require("node-fetch");
const url = require('url');

const resolveToBackendPath = (path) => {
  return url.resolve("https://backend.crusher.dev", path);
};

(async () => {
  const baseBuildId = await fetch(resolveToBackendPath(`/projects/${process.env.PROJECT_ID}/tests/actions/run`), {
    method: "POST",
    headers: {
      'cookie': `token=${process.env.CRUSHER_TOKEN}`,
    },
    body: {
      githubRepoName: process.env.GITHUB_REPO_NAME,
      disableBaseLineComparisions: true,
      host: "https://headout.com",
    }
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
            'cookie': `token=${process.env.CRUSHER_TOKEN}`,
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

  await fetch(resolveToBackendPath(`/projects/${process.env.PROJECT_ID}/tests/actions/run`), {
    method: "POST",
    headers: {
      'cookie': `token=${process.env.CRUSHER_TOKEN}`,
    },
    body: {
      githubRepoName: process.env.GITHUB_REPO_NAME,
      baselineJobId: baseBuildId,
      githubCommitId: process.env.GIT_COMMIT,
      host: "https://stage-headout.com",
    }
  }).then(async (res) => {
    const responseText = await res.text();
    const { buildId } = JSON.parse(responseText);
    return buildId;
  });

})();

