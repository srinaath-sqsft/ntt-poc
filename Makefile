ifndef PR_DEMO_NAME
	BUILD_NUM=$(shell cat ./properties.json | jq -r ".build_num // 0")
	BEDEN_VERSION=$(shell cat ./.beden_version 2>/dev/null || echo latest)
	DOCKER_DIR=docker
	DEMO_NAME=$(shell cat ./properties.json | jq -r ".name")
else
	DEMO_NAME=$(PR_DEMO_NAME)
endif

ifndef BEDEN_DOCKER_IMAGE
	ES_VERSION=$(shell cat ./properties.json | jq -r ".es_version")
	ES_VERSION_MAJOR=$(shell cat ./properties.json | jq -r ".es_version | split(\".\")[0]")
ifeq ($(shell echo $(BEDEN_VERSION) | egrep "^1\.[0-9]+b$$"), $(BEDEN_VERSION))
	BEDEN_DOCKER_IMAGE=docker.elastic.co/sa/beden-$(ES_VERSION_MAJOR):$(BEDEN_VERSION)
else
	BEDEN_DOCKER_IMAGE=docker.elastic.co/sa/beden:$(BEDEN_VERSION)
endif
endif

ifndef CLOUD_REGION
  CLOUD_REGION='gcp-europe-west2'
endif

.PHONY: build
build: load-build-env
ifndef PR_BUILD_NAME
	@docker run --rm -v $(ARTEFACTS_DIR):/artefacts-dir \
	    -e EDEN_ENV=$(EDEN_ENV) \
	    -e NO_PROFILE=1 \
		$(BEDEN_DOCKER_IMAGE) deploy \
		--secret-store-data base64:$(SECRET_STORE_DATA) \
		--cloud-region $(CLOUD_REGION) \
		--cloud-api-key $(CLOUD_API_KEY) \
		--set-replicas 2 \
		--verbose \
		--cluster-name $(BUILD_NAME) | xargs vault write $(BUILD_VAULT_PATH)
else
	@docker run --rm -v $(ARTEFACTS_DIR):/artefacts-dir \
	    -e EDEN_ENV=$(EDEN_ENV) \
	    -e NO_PROFILE=1 \
		$(BEDEN_DOCKER_IMAGE) deploy \
		--secret-store-data base64:$(SECRET_STORE_DATA) \
		--cloud-region $(CLOUD_REGION) \
		--cloud-api-key $(CLOUD_API_KEY) \
		--set-replicas 2 \
		--verbose-redact \
		--cluster-name $(PR_BUILD_NAME) | xargs vault write $(BUILD_VAULT_PATH)
endif

.PHONY: dump
dump: load-dump-env
	@docker run --rm -v $(ARTEFACTS_DIR):/artefacts-dir \
		-u $(shell id -u):$(shell id -g) \
	    -e EDEN_ENV=$(EDEN_ENV) \
		$(BEDEN_DOCKER_IMAGE) dump \
		--no-profile \
		--secret-store-data base64:$(SECRET_STORE_DATA) \
		--cloud-api-key $(CLOUD_API_KEY) \
		--cloud-region $(CLOUD_REGION) \
		--cluster-id $(CLUSTER_ID) \
		--cluster-password $(ELASTICSEARCH_PASSWORD) \
		--demo-name $(DEMO_NAME) \
		--verbose-redact

.PHONY: delete
delete: load-delete-env
	@docker run --rm \
	    -e EDEN_ENV=$(EDEN_ENV) \
		$(BEDEN_DOCKER_IMAGE) delete \
		--cloud-username $(CLOUD_USERNAME) \
		--cloud-password $(CLOUD_PASSWORD) \
		--cloud-region $(CLOUD_REGION) \
		--cluster-name $(DELETE_CLUSTER_NAME)

.PHONY: docker_build
docker_build: check-docker-env
	@for f in $(shell ls $(DOCKER_DIR));\
		do docker build  --platform linux/amd64 --build-arg ES_VERSION=$(ES_VERSION) $(DOCKER_DIR)/$$f -t docker.elastic.co/sa/$(DEMO_NAME)-$$f:$(ES_VERSION)-$(BUILD_NUM);\
	done\

.PHONY: docker_push
docker_push: check-docker-env
	@for f in $(shell ls $(DOCKER_DIR));\
		do docker push docker.elastic.co/sa/$(DEMO_NAME)-$$f:$(ES_VERSION)-$(BUILD_NUM);\
	done\

load-build-env:
ifndef GCS_SECRET_PATH
	$(error GCS_SECRET_PATH is undefined)
endif
ifndef EDEN_ENV
	$(error EDEN_ENV is undefined)
endif
	$(eval TIMESTAMP:=$$(shell date "+%s"))
	$(eval BUILD_NAME=$$(DEMO_NAME)-$$(BUILD_NUM)-$$(TIMESTAMP))
	$(eval CREDS_VAULT_PATH=secret/k8s/eden/$$(EDEN_ENV))
	@vault read $(CREDS_VAULT_PATH) > /dev/null || exit 1
	@vault read $(GCS_SECRET_PATH) > /dev/null || exit 1
	$(eval BUILD_VAULT_PATH=secret/k8s/eden/$$(EDEN_ENV)/$$(DEMO_NAME)/es)
	$(eval ARTEFACTS_DIR=$$(shell pwd))
	$(eval CLOUD_USERNAME=$$(shell vault read $$(CREDS_VAULT_PATH) -format=json | jq -r .data.CLOUD_USERNAME))
	$(eval CLOUD_PASSWORD=$$(shell vault read $$(CREDS_VAULT_PATH) -format=json | jq -r .data.CLOUD_PASSWORD))
	$(eval CLOUD_REGION=$$(shell vault read $$(CREDS_VAULT_PATH) -format=json | jq -r .data.CLOUD_REGION))
	$(eval CLOUD_API_KEY=$$(shell vault read $$(CREDS_VAULT_PATH) -format=json | jq -r .data.CLOUD_API_KEY))
	$(eval GCS_SERVICE_ACCOUNT_CREDS=$$(shell vault read -field value $$(GCS_SECRET_PATH) | awk 'BEGIN{ORS="";} {print}'))
	$(eval SECRET_STORE_DATA=$$(shell jq -n --arg gcs_creds '$$(GCS_SERVICE_ACCOUNT_CREDS)' '{ "gcs.client.default.credentials_file": $$$$gcs_creds }' | base64 -w0))

load-dump-env: load-build-env
	$(eval CLUSTER_ID=$$(shell vault read $$(BUILD_VAULT_PATH) -format=json | jq -r .data.CLUSTER_ID))
	$(eval ELASTICSEARCH_PASSWORD=$$(shell vault read $$(BUILD_VAULT_PATH) -format=json | jq -r .data.ELASTICSEARCH_PASSWORD))

load-delete-env:
ifndef DELETE_CLUSTER_NAME
	$(error DELETE_CLUSTER_NAME is undefined)
endif
ifndef EDEN_ENV
	$(error EDEN_ENV is undefined)
endif
	$(eval CREDS_VAULT_PATH=secret/k8s/eden/$$(EDEN_ENV))
	$(eval CLOUD_USERNAME=$$(shell vault read $$(CREDS_VAULT_PATH) -format=json | jq -r .data.CLOUD_USERNAME))
	$(eval CLOUD_PASSWORD=$$(shell vault read $$(CREDS_VAULT_PATH) -format=json | jq -r .data.CLOUD_PASSWORD))
	$(eval CLOUD_REGION=$$(shell vault read $$(CREDS_VAULT_PATH) -format=json | jq -r .data.CLOUD_REGION))
	$(eval CLOUD_API_KEY=$$(shell vault read $$(CREDS_VAULT_PATH) -format=json | jq -r .data.CLOUD_API_KEY))

check-docker-env:
ifeq (, $(shell which docker))
	$(error "No docker installed")
endif