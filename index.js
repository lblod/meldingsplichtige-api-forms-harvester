const fs = require('fs');
const rdf = require('rdflib');
const csvParse = require('csv-parse/lib/sync');

//1-READ ALL INPUT FILES AND PARSE THEM WITH RDFLIB AND CSV PARSE
const inputDirPath = './inputFiles/';
const inputDirFileNames = fs.readdirSync(inputDirPath);

let inputFiles = [
  //{filename: str, fileContent: str},
  //...
];

inputDirFileNames.forEach((e, i)=>{
  inputFiles[i] = {};
  inputFiles[i].fileName = e;
  inputFiles[i].fileContent = fs.readFileSync(inputDirPath+e, "utf8");
});

let parsedInputFiles = [
  //{filename: str, parsedData: var},
  //...
];

inputFiles.forEach((e, i)=>{
  parsedInputFiles[i] = {};
  parsedInputFiles[i].fileName = e.fileName;
  
  if(e.fileName.match(/\.ttl/g)){
    const uri = 'https://lblod/newFields';
    const mimeType = 'text/turtle';
    const store = rdf.graph();

    rdf.parse(e.fileContent, store, uri, mimeType);
    
    parsedInputFiles[i].parsedData = store;
  }
  else{
    parsedInputFiles[i].parsedData = csvParse(e.fileContent,{
      columns: true,
      skip_empty_lines: true
    });
  }
});

//2-MATCH FIELDS FROM OLD FORMS TO NEW FIELDS
const compareFieldsFileName="eigenschap-aangepast.csv";
const newFieldsFileName="form-fields.ttl";

let oldIdNewFieldMap=[
  //{oldId: str, newField: arr},
  //...
];

let counter=0;

parsedInputFiles.find(e=>e.fileName==compareFieldsFileName).parsedData.forEach((e, i)=>{
  if(e["ID"] && e["INPUT-FIELD\n"].match(/fields:/g)){

    const newFieldUri=e["INPUT-FIELD\n"].replace("fields:", "http://data.lblod.info/fields/");
    const store=parsedInputFiles.find(e=>e.fileName==newFieldsFileName).parsedData;
    const fieldTriples=store.match(rdf.sym(newFieldUri));
    
    oldIdNewFieldMap.push({
      oldId: e["ID"], 
      newField: fieldTriples});
    //adding validations
    let constraintUris=store.match(
      rdf.sym(newFieldUri),
      rdf.sym("http://lblod.data.gift/vocabularies/forms/validations")
    );
    constraintUris.forEach((ee, ii)=>{
      
      const validations=store.match(ee.object);

      oldIdNewFieldMap[counter].newField=
        oldIdNewFieldMap[counter].newField.concat(validations);
    });
    counter++;    
  }
});
debugger;
//3-MATCH NEW FIELDS TO OLD FORMS
const formsFileName = "type-besluit-aangepast.csv";
const formsFieldsFileName = "type-besluit-eigenschap-rel.csv";

let fieldList=[
  //{form: str, fields: arr}
  //...
];

parsedInputFiles.find(e=>e.fileName==formsFileName).parsedData.forEach((e, i)=>{
  
  fieldList[i]={};
  fieldList[i].fields=[];

  parsedInputFiles.find(e=>e.fileName==formsFieldsFileName).parsedData.forEach((ee, ii)=>{
    if(e["ID"]==ee["TYPEBESLUITID"]){
      fieldList[i].form=e["CODE"];
      fieldList[i].fields.push(ee["EIGENSCHAPID"]);
    }
  });
});

fieldList.forEach((e, i)=>{
  e.fields.forEach((ee, ii)=>{
    e.fields[ii]=oldIdNewFieldMap.find(eee => eee.oldId==e.fields[ii]);
  });
  fieldList[i].fields=e.fields;
});

//form
fieldList.forEach((form, i)=>{
  
  const uri = 'https://lblod/formToPrint';
  const mimeType = 'text/turtle';
  const formStore = rdf.graph();
  //fields
  form.fields.forEach((field, ii)=>{
    
    //triples for field
    field.newField.forEach((triple, iii)=>{
      formStore.add(triple);
    });
  });
  const test=rdf.serialize(null, formStore, 'https://lblod/formToPrint', 'text/turtle');
  debugger;
});
//TODO: REMOVE : REPLACE WITH SLASH, GO BACK TO PREFIXES