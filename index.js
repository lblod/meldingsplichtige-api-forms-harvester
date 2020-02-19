const fs = require('fs');
const rdf = require('rdflib');
const csvParse = require('csv-parse/lib/sync');
const uuid = require('uuid/v4');
const rimraf = require('rimraf');

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

let oldIdNewIdMap=[
  //{oldId: str, newId: str},
  //...
];

parsedInputFiles.find(e=>e.fileName==compareFieldsFileName).parsedData.forEach((e, i)=>{
  if(e["ID"] && e["INPUT-FIELD\n"].match(/fields:/g)){

    e["INPUT-FIELD\n"]=e["INPUT-FIELD\n"].replace("fields:", "");
    oldIdNewIdMap.push({oldId:e["ID"], newId:e["INPUT-FIELD\n"]});
  }
});

//3-PARSE FORMS
const formsFileName = "type-besluit-aangepast.csv";
const formsFieldsFileName = "type-besluit-eigenschap-rel.csv";

let forms=[
  //{formName: str, serialName: str, formFields: arr(uuids of fields), formId: uuid(gen)}, 
  //...
];

parsedInputFiles.find(e=>e.fileName==formsFileName).parsedData.forEach((form, i)=>{
  forms[i]={
    formName: form["CODE"],
    serialName: form["CODE"].replace(/\s/g, "-"),
    formId: uuid(),
    formFields: []
  };
  const oldFormId=form["ID"];
  
  parsedInputFiles.find(e=>e.fileName==formsFieldsFileName).parsedData.forEach((field, ii)=>{
    
    if(oldFormId==field["TYPEBESLUITID"]){
      
      const newFieldId=oldIdNewIdMap.find(id=>id.oldId==field["EIGENSCHAPID"]).newId;
      forms[i].formFields.push(newFieldId);
    }
  });
});

const newFieldsFileName="form-fields.ttl";
//4-WRITE TO DISK
forms.forEach((form, i)=>{
  
  let fields='';
  let additionalTriples='';

  form.formFields.forEach((field, i)=>{
    fields+="fields:"+field;
    if(i==form.formFields.length-1){
      fields+="."
    }
    else{
      fields+=", "
    }
  });

  let data=`\
fieldGroups:`+form.formId+` a form:FieldGroup ;
    mu:uuid "`+form.formId+`" ; 
    form:hasField `+fields;

  const tempuuid=uuid();
  additionalTriples=`\
fields:0827fafe-ad19-49e1-8b2e-105d2c08a54a form:hasConditionalFieldGroup fields:`+tempuuid+`;

fields:`+tempuuid+` a form:ConditionalFieldGroup ;
    mu:uuid "`+tempuuid+`";
    form:conditions
      [ a form:SingleCodelistValue ;
        form:grouping form:Bag ;
        sh:path rdf:type;
        form:conceptScheme <https://data.vlaanderen.be/id/conceptscheme/BesluitDocumentType> ;
        #based on document-type
        form:customValue <https://data.vlaanderen.be/id/concept/BesluitDocumentType/8e791b27-7600-4577-b24e-c7c29e0eb773>.
      ] ;
    form:hasFieldGroup fieldGroups:`+form.formId+` .`;

  try{
    fs.mkdirSync("./outputFiles/forms/"+form.serialName);
    fs.writeFileSync("./outputFiles/forms/"+form.serialName+"/form.ttl", data);
  }
  catch(error){
    rimraf.sync("./outputFiles/forms/"+form.serialName);
    fs.mkdirSync("./outputFiles/forms/"+form.serialName);
    fs.writeFileSync("./outputFiles/forms/"+form.serialName+"/form.ttl", data);
  }
});

debugger;

forms.forEach((form, i)=>{
  rimraf.sync("./outputFiles/forms/"+form.serialName);
});










//2-MATCH FIELDS FROM OLD FORMS TO NEW FIELDS
// const compareFieldsFileName="eigenschap-aangepast.csv";
// const newFieldsFileName="form-fields.ttl";

// let oldIdNewFieldMap=[
//   //{oldId: str, newField: arr},
//   //...
// ];

// let counter=0;

// parsedInputFiles.find(e=>e.fileName==compareFieldsFileName).parsedData.forEach((e, i)=>{
//   if(e["ID"] && e["INPUT-FIELD\n"].match(/fields:/g)){

//     const newFieldUri=e["INPUT-FIELD\n"].replace("fields:", "http://data.lblod.info/fields/");
//     const store=parsedInputFiles.find(e=>e.fileName==newFieldsFileName).parsedData;
//     const fieldTriples=store.match(
//       rdf.sym(newFieldUri),
//       rdf.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
//       rdf.sym('http://lblod.data.gift/vocabularies/forms/Field')
//     );
//     debugger;
//     oldIdNewFieldMap.push({
//       oldId: e["ID"], 
//       newField: fieldTriples});
//     //adding validations
//     let constraintUris=store.match(
//       rdf.sym(newFieldUri),
//       rdf.sym("http://lblod.data.gift/vocabularies/forms/validations")
//     );
//     constraintUris.forEach((ee, ii)=>{
      
//       const validations=store.match(ee.object);

//       oldIdNewFieldMap[counter].newField=
//         oldIdNewFieldMap[counter].newField.concat(validations);
//     });
//     counter++;    
//   }
// });
// debugger;
// //3-MATCH NEW FIELDS TO OLD FORMS
// const formsFileName = "type-besluit-aangepast.csv";
// const formsFieldsFileName = "type-besluit-eigenschap-rel.csv";

// let fieldList=[
//   //{form: str, fields: arr}
//   //...
// ];

// parsedInputFiles.find(e=>e.fileName==formsFileName).parsedData.forEach((e, i)=>{
  
//   fieldList[i]={};
//   fieldList[i].fields=[];

//   parsedInputFiles.find(e=>e.fileName==formsFieldsFileName).parsedData.forEach((ee, ii)=>{
//     if(e["ID"]==ee["TYPEBESLUITID"]){
//       fieldList[i].form=e["CODE"];
//       fieldList[i].fields.push(ee["EIGENSCHAPID"]);
//     }
//   });
// });

// fieldList.forEach((e, i)=>{
//   e.fields.forEach((ee, ii)=>{
//     e.fields[ii]=oldIdNewFieldMap.find(eee => eee.oldId==e.fields[ii]);
//   });
//   fieldList[i].fields=e.fields;
// });

// //form
// fieldList.forEach((form, i)=>{
  
//   const uri = 'https://lblod/formToPrint';
//   const mimeType = 'text/turtle';
//   const formStore = rdf.graph();
//   //fields
//   form.fields.forEach((field, ii)=>{
    
//     //triples for field
//     field.newField.forEach((triple, iii)=>{
//       formStore.add(triple);
//     });
//   });
//   const test=rdf.serialize(null, formStore, 'https://lblod/formToPrint', 'text/turtle');
//   debugger;
// });
// //TODO: REMOVE : REPLACE WITH SLASH, GO BACK TO PREFIXES