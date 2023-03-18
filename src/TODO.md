- need to deploy from GHA so that i can keep the secrets in GH rather than publish as plain text in CF. or maybe put secrets in wrangler.toml, and just not commit it.
- need to build proper dashboards in grafana.
- need to continue to test, figure out why some grafana entries are dropped... if that's still the case.
- have grafana page me when there is
  - no data
  - ph out of range
  - connected is 0


  wrangler d1 execute ph_log --local --file=./src/schema.sql

  wrangler d1 execute ph_log --local --command='SELECT * FROM ph_data'