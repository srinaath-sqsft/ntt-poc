from app import app, img_model
from flask import request
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
import requests
import os
from PIL import Image

KNN_SEARCH_IMAGES = '/image-embeddings2/_knn_search'

HOST = app.config['ELASTICSEARCH_HOST']
AUTH = (app.config['ELASTICSEARCH_USER'], app.config['ELASTICSEARCH_PASSWORD'])
HEADERS = {'Content-Type': 'application/json'}
K = app.config['K_RESULTS']

cors = CORS(app)


@app.route('/simim', methods=['POST'])
@cross_origin()
def simim():
    print("Starting.")
    if request.files['image'].filename == '':
        return "Where is the file??"

    filename = secure_filename(request.files['image'].filename)

    url_dir = 'static/simim-uploads/'
    upload_dir = 'app/' + url_dir
    upload_dir_exists = os.path.exists(upload_dir)
    if not upload_dir_exists:
        # Create a new directory because it does not exist
        os.makedirs(upload_dir)

    # physical file-dir path
    file_path = upload_dir + filename
    # Save the image
    request.files['image'].save(dst=file_path)

    image = Image.open(file_path)
    embedding = image_embedding(image, img_model)

    # Execute KN search over the image dataset
    search_response = knn_search_images(embedding.tolist(), K)

    # file cleanup
    if os.path.exists(file_path):
        os.remove(file_path)

    return search_response.json()


def knn_search_images(dense_vector: list, k: int):
    query = (
        '{ "knn" : '
        '{"field": "image_embedding",'
        '"k": ' + str(k) + ','
        '"num_candidates": 100,'
        '"query_vector" : ' + str(dense_vector) + '},'
        '"fields": ["image_id"],'
        '"_source": false'
        '}'
        )

    return requests.get(HOST + KNN_SEARCH_IMAGES, auth=AUTH, headers=HEADERS, data=query)


def image_embedding(image, model):
    return model.encode(image)
