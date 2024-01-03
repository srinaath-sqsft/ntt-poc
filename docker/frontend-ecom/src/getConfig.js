
export default async function getConfig() {
  const config = await fetch('/config/credentials.json').then(response => response.text().then(creds => {
    return JSON.parse(creds)
  }))
  const engineNames = 'engineNames' in config ? config['engineNames']: null
  const kbUrl = 'kbUrl' in config ? config['kbUrl']: null
  const apmServerUrl = 'apmServerUrl' in config ? config['apmServerUrl']: null
  return [config['endpointBase'], config['searchKey'], engineNames, kbUrl, apmServerUrl]
}
