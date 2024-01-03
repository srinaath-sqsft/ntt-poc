# similar image service

The service accepts image in POST request and responds with JSON response from ES cluster with ID's and a dense vector 
for image-embeddings. The vector can be used in the KNN search against an index.  

### Example POST 
```bash
$ curl --location --request POST 'http://127.0.0.1:5001/simim' \
--form 'image=@"/Users/rado/pmm_workspace/ecom-python/tmp/tmp/AN621CA3OQ11.png"'
```

## Req
- Python 3.9.10+
- ES cluster with the dataset

## How to run app locally
This option does not require Docker, but you can run it directly from CLI (unix based only)

```bash
$ # get the source code
$ cd similar-image-service
$ python3 -m venv .venv
$ source .venv/bin/activate
$ pip install -r requirements.txt
# !!! configure file `.env` with values pointing to your Elasticsearch cluster
$ flask run --port=5001
# Send POST request with the image to process
```

## How to run app in Docker
To run the application in a Docker container you have 2 options.

```bash
$ cd flask-elastic-nlp
```

### Option 1: Configure .env file
1. Configure correct values in `.env` file with access to Elasticsearch cluster
   ```
   ES_HOST='http://localhost:9200'
   ES_USER='elastic'
   ES_PWD='changeit'
   K_RESULTS=5
    ```
2. Build the image: `docker build . --tag elastic-ecom/sim-image-service:0.0.1`
3. Run: `docker run -p 5001:5001 --rm  elastic-ecom/sim-image-service:0.0.1`
4. Send POST request with the image to process

### Option 2: Use environment variables
1. Build the image with no config for `.env`: `docker build . --tag elastic-ecom/sim-image-service:0.0.1`
2. Run with environment variables instead: `docker run -p 5001:5001 --rm -e ES_HOST='http://localhost:9200' -e ES_USER='elastic' -e ES_PWD='password' -e K_RESULTS=5 elastic-ecom/sim-image-service:0.0.1`
3. Send POST request with the image to process