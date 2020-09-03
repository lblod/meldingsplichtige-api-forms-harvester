## usage
To run in a docker container clone this repo then run:

### concatenating folder structure files in one file
```
docker run -it --rm -v "$PWD":/app -w /app node:10 ./build-forms.sh
```

Built forms will be put in ./output.ttl.
