<#
.SYNOPSIS
  Scratch voiceover with the Windows built-in voices (SAPI), plus exact word timings.

.DESCRIPTION
  For timing drafts and animatics only: these voices sound robotic. Replace the read with a human
  take or a generated voice before anything ships, and say so in the delivery note.

  The script file holds one caption phrase per line. An optional [id] prefix names the cue
  ("[hook] You did the work weeks ago."). Blank lines and lines starting with # are ignored.

  Writes <Out> (WAV, 48 kHz mono) and <Out>.words.json (word start/end seconds), which
  align_vo.py can take with --words-from to skip transcription.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tts_local.ps1 -Script script.txt -Out public\film\vo.wav
  powershell -ExecutionPolicy Bypass -File tts_local.ps1 -List
#>
param(
	[string]$Script,
	[string]$Out,
	[string]$Voice = "",
	[int]$Rate = 0,
	[int]$PauseMs = 260,
	[switch]$List
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

if ($List) {
	$synth.GetInstalledVoices() | ForEach-Object { "{0} | {1} | {2}" -f $_.VoiceInfo.Name, $_.VoiceInfo.Culture, $_.VoiceInfo.Gender }
	exit 0
}
if (-not $Script -or -not $Out) { throw "Pass -Script <file> and -Out <wav> (or -List)." }

if ($Voice) { $synth.SelectVoice($Voice) }
$synth.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))
$voiceName = $synth.Voice.Name

# {display|spoken} pronunciation pairs: the voice reads the spoken side.
$lines = Get-Content -LiteralPath $Script -Encoding UTF8 |
	Where-Object { $_.Trim() -and -not $_.Trim().StartsWith('#') } |
	ForEach-Object { (($_ -replace '^\s*\[[^\]]+\]\s*', '') -replace '\{([^|{}]*)\|([^{}]*)\}', '$2').Trim() }
if (-not $lines) { throw "No script lines found in $Script" }

$outFull = [System.IO.Path]::GetFullPath($Out)
$dir = Split-Path -Parent $outFull
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }

# Keep the voice's native format: forcing another sample rate makes SAPI report word positions on the
# wrong clock (a 26 s read reported as 70 s). Resample with ffmpeg afterwards instead.
$native = [System.IO.Path]::ChangeExtension($outFull, ".native.wav")
$synth.SetOutputToWaveFile($native)

$pb = New-Object System.Speech.Synthesis.PromptBuilder
foreach ($l in $lines) {
	$pb.AppendText($l)
	$pb.AppendBreak([TimeSpan]::FromMilliseconds($PauseMs))
}
# SAPI reports positions on its own clock (observed: 16 kHz while writing 22.05 kHz, a 1.378x error).
# A bookmark at the very end gives the reported length; the real file length calibrates every word.
$pb.AppendBookmark("md-end")

# Events are queued by PowerShell (thread-safe) and read after the read completes.
$null = Register-ObjectEvent -InputObject $synth -EventName SpeakProgress -SourceIdentifier MD_SP
$null = Register-ObjectEvent -InputObject $synth -EventName BookmarkReached -SourceIdentifier MD_BM
$null = Register-ObjectEvent -InputObject $synth -EventName SpeakCompleted -SourceIdentifier MD_SC
try {
	$null = $synth.SpeakAsync($pb)
	$done = Wait-Event -SourceIdentifier MD_SC -Timeout 600
	if (-not $done) { throw "Speech synthesis timed out" }
	$events = @(Get-Event -SourceIdentifier MD_SP -ErrorAction SilentlyContinue)
	$bm = @(Get-Event -SourceIdentifier MD_BM -ErrorAction SilentlyContinue)
}
finally {
	$synth.SetOutputToNull()
	Unregister-Event -SourceIdentifier MD_SP -ErrorAction SilentlyContinue
	Unregister-Event -SourceIdentifier MD_BM -ErrorAction SilentlyContinue
	Unregister-Event -SourceIdentifier MD_SC -ErrorAction SilentlyContinue
	Get-Event -ErrorAction SilentlyContinue | Remove-Event -ErrorAction SilentlyContinue
	$synth.Dispose()
}

$scale = 1.0
$reportedEnd = if ($bm.Count) { $bm[-1].SourceEventArgs.AudioPosition.TotalSeconds } else { 0 }
$ffprobe = (Get-Command ffprobe -ErrorAction SilentlyContinue).Source
if ($ffprobe -and $reportedEnd -gt 0) {
	$realEnd = [double](& $ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $native)
	if ($realEnd -gt 0) { $scale = $realEnd / $reportedEnd }
}
if ([Math]::Abs($scale - 1) -gt 0.02) { "timing clock corrected by x{0:N3}" -f $scale }
elseif ($reportedEnd -le 0) { "WARNING: no end bookmark; word timings are uncalibrated (run align_vo.py with whisper instead)" }

$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if ($ffmpeg) {
	& $ffmpeg -y -v error -i $native -ar 48000 -ac 1 -c:a pcm_s16le $outFull
	Remove-Item $native -Force
} else {
	Move-Item $native $outFull -Force
}

# SAPI raises word events out of order: sort by audio position. (PowerShell names are case-insensitive,
# so nothing here may be called $out: that IS the -Out parameter.)
$raw = foreach ($ev in $events) {
	$a = $ev.SourceEventArgs
	[pscustomobject]@{ text = $a.Text; start = [Math]::Round($a.AudioPosition.TotalSeconds * $scale, 3) }
}
$sorted = @($raw | Sort-Object start)
$timed = New-Object System.Collections.ArrayList
for ($i = 0; $i -lt $sorted.Count; $i++) {
	$s = $sorted[$i].start
	$e = if ($i + 1 -lt $sorted.Count) { [Math]::Max($s + 0.08, $sorted[$i + 1].start - 0.03) } else { $s + 0.45 }
	[void]$timed.Add([ordered]@{ text = $sorted[$i].text; start = $s; end = [Math]::Round($e, 3) })
}
$json = ConvertTo-Json -InputObject ([ordered]@{ words = @($timed); method = "sapi"; voice = $voiceName }) -Depth 5
[System.IO.File]::WriteAllText("$outFull.words.json", $json, (New-Object System.Text.UTF8Encoding($false)))
"wrote $outFull ($($timed.Count) words) and $outFull.words.json"
"SCRATCH VOICE: replace with a human or generated read before delivery."
