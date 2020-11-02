![warning-forms](https://user-images.githubusercontent.com/23281659/97719334-4007d000-1ac7-11eb-8449-bd21eba87928.png)

## Usage

To run in a docker container clone this repo then run:

### Concatenating folder structure files in one file

```
docker run -it --rm -v "$PWD":/app -w /app node:10 ./build-forms.sh
```

Built forms will be put in ./output.ttl.

## Testing changes

**Make sure to test extensively your updates.**

### Checklists

Loket

- Create a new submission
- Save the empty submission to check validations
- Fill the submission
- Ensure fields and subfields behave property, especially with 
- Save the submission, close it, reopen it
- Send the submission, close it, reopen it
- Open a submission in `Concept` state created with the previous forms version
- Open a submission in `Sent` state created with the previous forms version

Toezicht

- Open a submission with the new form version
- Open a submission with the old form version

Full flow

- Create a submission with the new forms version in Loket, send it, make sure it appears in Toezicht and can be opened
- Same with a submission created with the old forms version but sent with the new forms version in application (env variable)

### Debugging hints

*This list is meant to evolve and get filled by developpers encountering issues.*

- Forms not opening in Toezicht ABB --> double check there is a migration defining the form file as a resource

## Guide to create new fields

This is a little guide of files and services that need to be updated when creating new form fields.

### Create fields

1. Create your new field in `formSkeleton/inputFields/input-fields.ttl` with the appropriated constraints and a `displayType`.
2. If the `displayType` is a new one (it's the case if you need a custom behaviour or if it doesn't exist yet), you will need to create the matching component in [ember-submission-form-fields](https://github.com/lblod/ember-submission-form-fields) and add the correct mappings in the following files :
  - [addon/helpers/component-for-display-type-edit.js](https://github.com/lblod/ember-submission-form-fields/blob/master/addon/helpers/component-for-display-type-edit.js)
  - [addon/helpers/component-for-display-type-show.js](https://github.com/lblod/ember-submission-form-fields/blob/master/addon/helpers/component-for-display-type-show.js)
  - [addon/helpers/component-for-display-type.js](https://github.com/lblod/ember-submission-form-fields/blob/master/addon/helpers/component-for-display-type.js)
3. Use the new field where it's needed in the [forms](https://github.com/lblod/manage-submission-form-tooling/tree/master/formSkeleton/forms)

If your field is using new concept schemes they must be added in `lib/enricher.js` of [enrich-submission-service](https://github.com/lblod/enrich-submission-service)

If your field is using new relationships that are not added in the enrichment yet, they must be added in `lib/enricher.js` of [enrich-submission-service](https://github.com/lblod/enrich-submission-service) as well as in `lib/submission-enricher.js`
of [import-submission-service](https://github.com/lblod/import-submission-service)

### Export configuration to the apps

Generate the output file using the `build-forms.sh` script and paste the output to the apps using it (`app-digitaal-loket`, `app-meldingsplichtige-api`, `app-toezicht-abb`) in the `config/semanticForms/` folder.

If you create a new configuration file, a few things need to be done :
1. The `ACTIVE_FORM_FIELDS` environment variable of the [enrich-submission-service](https://github.com/lblod/enrich-submission-service#add-the-service-to-a-stack) needs to be updated to the new file name
2. Add migrations to the app defining the configuration file as a resource in the database ([migration](https://github.com/lblod/app-digitaal-loket/blob/ed761a8731ffe8fd51226582f0e6223d460e7f50/config/migrations/20200407100352-automatisch-melding/20200904103600-fix-add-the-forms-file-as-a-file-resource.sparql))
