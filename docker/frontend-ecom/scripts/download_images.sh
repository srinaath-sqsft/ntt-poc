fullpath=$(realpath $0)
BASE_DIR=$(dirname $fullpath)
BASE_DIR=$(dirname $BASE_DIR)
IMAGE_FOLDER=$BASE_DIR/src/images/products
mkdir -p $IMAGE_FOLDER
gsutil -m cp -R gs://eden-images/products/* ${IMAGE_FOLDER}