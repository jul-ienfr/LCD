$lignes = Get-Content ".env.demo.local" | Where-Object { $_ -match '^\s*[A-Z_][A-Z0-9_]*=' }
foreach ($l in $lignes) {
  $i = $l.IndexOf('='); $nom = $l.Substring(0, $i).Trim(); $val = $l.Substring($i + 1).Trim().Trim('"')
  [System.Environment]::SetEnvironmentVariable($nom, $val, 'Process')
}
$env:PORT = "4180"; $env:HOST = "127.0.0.1"
$env:ORIGIN = "http://127.0.0.1:4180"; $env:APP_URL = "http://127.0.0.1:4180"; $env:BETTER_AUTH_URL = "http://127.0.0.1:4180"
$env:ENQUIRY_ENABLED = "true"
node build 2>&1 | Tee-Object -FilePath ".artifacts\prod-ergo.log"
