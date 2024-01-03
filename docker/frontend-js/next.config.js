const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

module.exports = (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      env: {
        API_ENDPOINT: "http://localhost:3001",
      },
    };
  }
  return {
    env: {
      API_ENDPOINT: process.env.API_ENDPOINT,
    },
  };
};
