NODE_IMAGE := node:22
WORKDIR := /app
GIT_CURRENT_BRANCH_NAME := $(shell (echo $(shell git branch --show-current) | sed 's/\//./g' ))

help: ## Outputs this help screen
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

bash:  ## Enter in container with bash
	docker run -it --rm \
		-v .:${WORKDIR} \
		-w ${WORKDIR} \
		${NODE_IMAGE} bash -c '\
		bash'

install: ## Install dependencies
	docker run --rm \
		-v .:${WORKDIR} \
		-w ${WORKDIR} \
		${NODE_IMAGE} bash -c '\
		yarn cache clean && \
		yarn install'

dev: ## Run project for dev
	docker run -it --rm -v .:${WORKDIR} -w ${WORKDIR} -p 5174:5174  ${NODE_IMAGE} bash -c "yarn run dev --host"

preview: ## Run test server
	make build
	docker run -it --rm -v .:${WORKDIR} -w ${WORKDIR} -p 4174:4174  ${NODE_IMAGE} bash -c "yarn run preview --host"

build: ## Build production package
	docker run -it --rm -v .:${WORKDIR} -w ${WORKDIR} ${NODE_IMAGE} bash -c "yarn run build"

lint-js: ## Lint project
	docker run --rm -v .:${WORKDIR} -w ${WORKDIR} ${NODE_IMAGE} bash -c "yarn run lint-js"

fix-js: ## Fix lint project
	docker run --rm -v .:${WORKDIR} -w ${WORKDIR} ${NODE_IMAGE} bash -c "yarn run lint-js --fix"
