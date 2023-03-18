- need to deploy from GHA so that i can keep the secrets in GH rather than publish as plain text in CF. 
- need to continue to test, figure out why some grafana entries are dropped... if that's still the case.
- have grafana page me when there is
  - no data

  wrangler d1 execute ph_log --local --file=./src/schema.sql

    wrangler d1 execute ph_log --file=./src/schema.sql

  wrangler d1 execute ph_log --local --command='SELECT * FROM ph_data'

    wrangler d1 execute ph_log --command='SELECT * FROM ph_data'