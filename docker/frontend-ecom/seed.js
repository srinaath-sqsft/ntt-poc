const dotenv = require('dotenv')
const result = dotenv.config()

if (!process.env.AS_PRIVATE_API_KEY) {
    console.log('AS_PRIVATE_API_KEY env variable is required')
    process.exit(1)
}
if (!process.env.AS_BASE_URL) {
    console.log('AS_BASE_URL env variable is required')
    process.exit(1)
}
if (!process.env.ENGINE_NAME) {
    console.log('ENGINE_NAME env variable is required')
    process.exit(1)
}

console.log(`Connecting to ${process.env.ENGINE_NAME} at ${process.env.AS_BASE_URL}`)

const AppSearchClient = require('@elastic/app-search-node')
const Client = require('./node_modules/@elastic/app-search-node/lib/client')

const LineByLineReader = require('line-by-line')
const fs = require('fs')
const endpointBase = process.env.AS_BASE_URL
const engineName = process.env.ENGINE_NAME

const args = process.argv.slice(2);
console.log('Args: ', args)

const input_file = args[0]
const ids = new Set()

try {
    if (!fs.existsSync(input_file)) {
        console.log(`File ${input_file} does not exist. Run "gatsby build" to generate. Exiting..`)
        process.exit(1)
    }
} catch(err) {
    console.log(`Unable to check if file ${input_file} exists`)
    console.error(err)
    process.exit(1)
}

const schema_file = args[1]
try {
    if (!fs.existsSync(schema_file)) {
        console.log(`Schema File ${schema_file} does not exist.`)
        process.exit(1)
    }
} catch(err) {
    console.log(`Unable to read schema file ${input_file} exists`)
    console.log(err)
    process.exit(1)
}
const schema = JSON.parse(fs.readFileSync(schema_file, 'utf8'));
const client =  new AppSearchClient(undefined, process.env.AS_PRIVATE_API_KEY, () => `${endpointBase}/api/as/v1/`)
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

async function deleteEngine() {
    let attempts = 0
    //deletes aren't immediate on engines so retry
    while (attempts < 2) {
        console.log(`Removing current engine ${engineName}...`)
        try {
            await client.destroyEngine(engineName)
            console.log(`Successfully removed engine ${engineName}. Sleeping for 60s to avoid document conflicts`)
            await sleep(60000)
            return true
        } catch (e) {
            console.log(e)
            console.log(`WARNING: Unable to remove engine ${engineName}. Trying again in 5 secs`)
            attempts += 1
            await sleep(5000)
        }
    }
}

async function createEngine() {
    let attempts = 0
    //deletes aren't immediate on engines so retry
    while (attempts < 12) {
        console.log(`Creating engine ${engineName}...`)
        try {
            await client.createEngine(engineName, { language: 'en' })
            console.log(`Successfully created engine ${engineName}`)
            return true
        } catch (e) {
            console.log(e)
            console.log(`Unable to create engine ${engineName}. Retrying in 5 secs`)
            attempts += 1
            await sleep(5000)
        }
    }
    console.log('Max Attempts reached on engine creation.')
    process.exit(1)
    return false
}


async function configureSchema() {
  console.log(`Configuring schema for engine ${engineName}`)
  try {
    const client = new Client(process.env.AS_PRIVATE_API_KEY, endpointBase)
    await client.post(`/api/as/v1/engines/${engineName}/schema`, schema)
    console.log(`Successfully configured engine ${engineName} schema`)
  } catch (e) {
    console.log(`Unable to configure engine ${engineName} schema`)
    console.log(e)
    process.exit(1)
  }
}

async function indexDocuments() {
    console.log('Indexing documents...')
    const batch_size = 100
    const lr = new LineByLineReader(input_file)

    let batch = []
    let total = 0
    await lr.on('line', async (line) => {
        if (batch.length < batch_size) {
            const doc = JSON.parse(line)
            batch.push(doc)
            ids.add(doc['id'])
        } else {
            try {
                lr.pause()
                const response = await client.indexDocuments(engineName, batch)
                const errors = response.filter(doc => doc.errors && doc.errors.length > 0)
                if (errors.length > 0) {
                    console.log(`WARNING: Documents indexed with error...`)
                    console.log(errors)
                }
                total += batch.length
                console.log(`Indexed ${total} documents`)
                batch = []
                lr.resume()
            } catch (e) {
                console.log(`Unable to index ${total} documents`)
                console.log(e)
                process.exit(1)
            }
        }
    })

    lr.on('end', async () => {
        if (batch.length > 0) {
            try {
                await client.indexDocuments(engineName, batch)
                total += batch.length
                console.log(`Indexed ${total} documents`)
                console.log(`Index complete with ${total} documents and ${ids.size} ids`)
            } catch (e) {
                console.log(`Unable to index ${batch.length} documents`)
                console.log(e)
                process.exit(1)
            }
        } else {
            console.log(`Index complete with ${total} documents and ${ids.size} ids`)
        }
    })
}

async function setupEngine() {
    await deleteEngine()
    await createEngine()
    await configureSchema()
    await indexDocuments()
}

setupEngine()
