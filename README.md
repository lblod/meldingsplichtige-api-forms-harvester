To run in a docker container clone this repo then run
```
docker run -it --rm -v "$PWD":/app -w /app node:10 /bin/bash

npm install

node generateForms.js

node concatForms.js
```
forms will be generated inside the forms folder

concatenated forms will be put in ./concat.ttl