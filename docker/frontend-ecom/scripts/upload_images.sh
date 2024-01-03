#!/usr/bin/env bash

IMAGE_BUCKET="gs://eden-images/products"

for product_image in ../src/images/products/*.jpeg; do
    echo "Uploading $product_image"
    filename=$(basename $product_image)
    gsutil cp -r $product_image $IMAGE_BUCKET/$filename
    gsutil acl ch -u AllUsers:R $IMAGE_BUCKET/$filename
done