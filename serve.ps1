param(
  [int]$Port = 8000
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try{
  $listener.Start()
  Write-Output "Servidor estático iniciado en http://localhost:$Port/"
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    Start-Job -ScriptBlock {
      param($ctx, $root)
      try{
        $req = $ctx.Request
        $res = $ctx.Response
        $path = $req.Url.AbsolutePath
        if ($path -eq "/") { $path = "/index.html" }
        $localPath = Join-Path $root ($path.TrimStart('/') -replace '/','\\')
        if (-not (Test-Path $localPath)){
          $res.StatusCode = 404
          $msg = "404 Not Found"
          $buf = [System.Text.Encoding]::UTF8.GetBytes($msg)
          $res.OutputStream.Write($buf,0,$buf.Length)
          $res.Close()
          return
        }
        $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
        switch ($ext) {
          '.html' { $ctype='text/html' }
          '.css'  { $ctype='text/css' }
          '.js'   { $ctype='application/javascript' }
          '.json' { $ctype='application/json' }
          '.png'  { $ctype='image/png' }
          '.jpg'  { $ctype='image/jpeg' }
          '.jpeg' { $ctype='image/jpeg' }
          '.svg'  { $ctype='image/svg+xml' }
          default { $ctype='application/octet-stream' }
        }
        $res.ContentType = $ctype
        $bytes = [System.IO.File]::ReadAllBytes($localPath)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes,0,$bytes.Length)
        $res.Close()
      } catch {
        try{ $ctx.Response.StatusCode = 500; $ctx.Response.Close() } catch {}
      }
    } -ArgumentList $context, $root | Out-Null
  }
} finally {
  if ($listener -and $listener.IsListening) { $listener.Stop(); $listener.Close() }
}
