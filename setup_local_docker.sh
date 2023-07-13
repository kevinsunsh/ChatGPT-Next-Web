#!/bin/bash
docker build --tag frontend_next . 
docker run -p 3000:3000 frontend_next