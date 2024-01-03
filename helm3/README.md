# Helm Install

## Necessary Routes
observe.ENV => reverse proxy Kibana
observe-todo.ENV => todo frontend
hipster.ENV => hipster frontend


helm upgrade -i observe ./helm --set environment=<staging/prod> --set image_version=<version> --set build_number=<build_num>

e.g.


`helm upgrade -i observe ./helm --set environment=staging --set image_version=7.5.0 --set build_number=be0850bafa591ebbaaedd2671ae60d3941d8453e --values ./helm/values-staging.yaml`

`helm upgrade -i observe ./helm --set environment=prod --set image_version=7.5.1 --set build_number=11cc03402c7eb46fd5efff3920a9f018c5709d17 --values ./helm/values-prod.yaml`


`helm3 upgrade -i observe-green ./helm3 --set environment=staging-3 --set username=green --set build_num=1 --set deploy_num=0 --set es_version=7.8.0`



# Useful commands for upgrading


```
remove ilm and aliases


DELETE *2021*/_alias/*
GET apm-7.11.0*/_search
PUT *2021*/_settings
{
  "index.lifecycle.name": null,
  "index.lifecycle.rollover_alias": null
}


timeshift

{
  "timeshift-twitter" : {
    "description" : "Time shifts data by X for a field Y",
    "processors" : [
      {
        "script" : {
          "lang" : "painless",
          "params" : {
            "date_format" : "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "field" : "@timestamp",
            "time_shift_seconds" : -3718500
          },
          "source" : "if (ctx[params.field] != null) { def formatter = DateTimeFormatter.ofPattern(params.date_format); def current_time = ZonedDateTime.parse(ctx[params.field]); current_time = current_time.plusSeconds(params.time_shift_seconds);  ctx[params.field] = current_time.format(formatter);  }"
        }
      }
    ]
  }
}


```