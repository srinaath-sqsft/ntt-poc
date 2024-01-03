# Elastic App Search Ecommerce Demo

Forked from https://github.com/elastic/eas-ecom-demo

## Getting Started

### Requirements
- Node ~11.9.0
- Yarn
- NVM

### Switch to node version

- `nvm use`

### Download Images

Images are held in a GCS bucket and can be downloaded for local development. This requires approx. 500mb and should take a few minutes. Donot check these images into github.

- `./scripts/download_images.sh`

### Install Gatsby-CLI Globally

- `npm install -g gatsby-cli`

### Install dependencies
- `yarn`

### Configure app search engine

Modify `./static/config/credentials.json` to the app search instance you plan to use.

### Start Gatsby

- `yarn run develop`

This step will output a `products.json` file, containing app search documents to be indexed, to the base directory. These contain references to the processed images. The script `seed.js` (see below) allows these to be indexed.

### Index Documents

Set the environment variables `AS_PRIVATE_API_KEY`, `AS_BASE_URL` and `ENGINE_NAME`  to index the generated `products.json` to your app search engine i.e.

- `AS_PRIVATE_API_KEY=private-examplekey AS_BASE_URL=https://23c2d66528d54bcd88d06f304bcb50cb.app-search.europe-west1.gcp.cloud.es.io ENGINE_NAME=ecommerce node seed.js products.json ./static/config/productSchema.json`

Ensure the `ENGINE_NAME` and `AS_BASE_URL` is consistent with that used in the config file `./static/config/credentials.json`. The script supports a local `.env` file if desired.

## Deploying to production

1. Usual EDEN `make docker_build` from base demo directory. This will perform the above steps and produce a docker image.
2. The image requires the environment variables `AS_PRIVATE_API_KEY`, `ENGINE_NAME`, `AS_USERNAME` and `AS_PASSWORD` to run. The latter 2 represent the cloud default login credentials.
3. To index to an engine run the script `./scripts/setup.sh` within the container passing the above variables.

The above are handed by the helm chart.

## Notes

- Currently, the first startup takes a *very* long time. There are over 6,300 images, all of which are processed by a plugin called `gatsby-image`. This processing of all images should only happen once, though smaller, much faster processing may also happen as you make changes to the demo. We should explore a way to separate the optimization task from startup, which is noted below. This is only relevant to development as the the images are processsed in the `docker build` once and stored in the image.

## TODOs

- Add autocomplete and query suggestions
- Explore a separate image optimization task (https://www.gatsbyjs.org/docs/preoptimizing-images/)
- Add more facet UIs
  - Range sliders
  - Boolean toggles
  - etc.
- Variable App Search credentials
- Possible create a standalone App Search indexing plugin for Gatsby?
