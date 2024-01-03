import { init } from "@elastic/apm-rum";
import getConfig from './getConfig'

getConfig().then(([endpointBase, searchKey, engineNames, kbUrl, apmServerUrl]) => {
      init({
          serviceName: "frontend-rum",
          breakdownMetrics: true,
          environment: "production",
          propagateTracestate: true,
          serverUrl: apmServerUrl,
          distributedTracingOrigins: [/https:\/\/.*\.cloud\.es\.io/],
          logLevel: "debug",
      });

      console.log(apmServerUrl);
}).catch(error => {
    console.log(error)
});