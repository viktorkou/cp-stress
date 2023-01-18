help: $(info This is a Makefile for building and running k6 stress tests.)
	  $(info Usage:)
	  $(info  make all - build and run k6 stress tests)
	  $(info  make install-xk6 - install xk6)
	  $(info  make build - build k6 with xk6-yaml)
	  $(info  make run BASEURL=<control plane url> USERNAME=<username> PASSWORD=<password> - run k6 stress test)

all: install-xk6 build run

install-xk6:
	go install go.k6.io/xk6/cmd/xk6@latest

build:
	xk6 build --with github.com/szkiba/xk6-yaml

run:
	./k6 run ./scripts/start.js -e BASE_URL=$(BASE_URL) -e USERNAME=$(USERNAME) -e PASSWORD=$(PASSWORD)

.PHONY: help install-xk6 build run