To run in a docker container clone this repo then run
```
docker run -it --rm -v "$PWD":/app -w /app node:10 ./run.sh
```
forms will be generated inside ./outputFiles/forms

concatenated forms will be put in ./concat.ttl