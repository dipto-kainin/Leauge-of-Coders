#!/bin/bash

# run with nodemon
nodemon --watch './**/*.go' --signal SIGTERM --exec 'go' run main.go