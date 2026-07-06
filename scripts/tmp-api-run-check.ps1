$ErrorActionPreference = 'Stop'

$endpoint = 'http://localhost:3000/api/run'
$timeoutSeconds = 600

$cases = @(
  @{
    language = 'python'
    code = @'
class Solution:
    def add(self, a, b):
        return a + b
'@
  },
  @{
    language = 'java'
    code = @'
class Solution {
    public int add(int a, int b) { return a + b; }
}
'@
  },
  @{
    language = 'cpp'
    code = @'
class Solution {
public:
    int add(int a, int b) { return a + b; }
};
'@
  }
)

foreach ($test in $cases) {
  Write-Host "START $($test.language)"
  $payload = @{
    code = $test.code
    language = $test.language
    functionName = 'add'
    inputType = 'int,int'
    outputType = 'int'
    testcases = @(@{ input = '2,3'; expectedOutput = '5'; isHidden = $false })
    wait = $true
  } | ConvertTo-Json -Depth 8

  try {
    $response = Invoke-WebRequest -Uri $endpoint -Method Post -ContentType 'application/json' -Body $payload -TimeoutSec $timeoutSeconds
    Write-Host "STATUS $($test.language): $($response.StatusCode)"
    Write-Host $response.Content
  } catch {
    if ($_.Exception.Response) {
      $resp = $_.Exception.Response
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $text = $reader.ReadToEnd()
      $reader.Close()
      Write-Host "STATUS $($test.language): $([int]$resp.StatusCode)"
      Write-Host $text
    } else {
      Write-Host "STATUS $($test.language): ERROR"
      Write-Host $_.Exception.Message
    }
  }

  Write-Host "END $($test.language)"
}