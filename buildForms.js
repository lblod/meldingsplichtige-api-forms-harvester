const fs = require('fs');
const read = require('fs-readdir-recursive')

//1-READ ALL OUTPUT FILES AND CONCAT THEM
const outputDirPath = './formSkeleton/';

let output=fs.readFileSync(outputDirPath+"inputFields/input-fields.ttl", "utf8");;

read(outputDirPath+"forms/").forEach((fileDir, i)=>{
  output+=fs.readFileSync(outputDirPath+"forms/"+fileDir, "utf8");
});

fs.writeFileSync("./output.ttl", output);

