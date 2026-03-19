param(
  [string]$OutputPath = "public/branding-twitter-card.png"
)

Add-Type -AssemblyName System.Drawing

function New-Color {
  param(
    [string]$Hex,
    [int]$Alpha = 255
  )

  $clean = $Hex.TrimStart("#")
  $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
  return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Draw-RoundedBox {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius,
    [System.Drawing.Brush]$Brush,
    [System.Drawing.Pen]$Pen
  )

  $path = New-RoundedRectPath -X $X -Y $Y -Width $Width -Height $Height -Radius $Radius
  try {
    if ($Brush) {
      $Graphics.FillPath($Brush, $path)
    }

    if ($Pen) {
      $Graphics.DrawPath($Pen, $path)
    }
  }
  finally {
    $path.Dispose()
  }
}

function Draw-Chip {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [float]$X,
    [float]$Y,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$TextBrush,
    [System.Drawing.Brush]$FillBrush,
    [System.Drawing.Pen]$BorderPen
  )

  $paddingX = 18
  $paddingY = 10
  $size = $Graphics.MeasureString($Text, $Font)
  $width = [Math]::Ceiling($size.Width) + ($paddingX * 2)
  $height = [Math]::Ceiling($size.Height) + ($paddingY * 2)

  Draw-RoundedBox -Graphics $Graphics -X $X -Y $Y -Width $width -Height $height -Radius 18 -Brush $FillBrush -Pen $BorderPen
  $Graphics.DrawString($Text, $Font, $TextBrush, $X + $paddingX, $Y + $paddingY - 2)

  return $width
}

$resolvedOutput = Join-Path (Get-Location) $OutputPath
$directory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path $directory)) {
  New-Item -ItemType Directory -Path $directory | Out-Null
}

$bitmap = New-Object System.Drawing.Bitmap 1200, 630
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

try {
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $graphics.Clear((New-Color "#f6f1e7"))

  $greenGlow = New-Object System.Drawing.SolidBrush (New-Color "#0fdf38" 28)
  $deepGlow = New-Object System.Drawing.SolidBrush (New-Color "#111111" 18)
  $greenGlow2 = New-Object System.Drawing.SolidBrush (New-Color "#0fdf38" 18)
  $surfaceBrush = New-Object System.Drawing.SolidBrush (New-Color "#fffaf3" 230)
  $surfacePen = New-Object System.Drawing.Pen (New-Color "#111111" 16), 1
  $leftBrush = New-Object System.Drawing.SolidBrush (New-Color "#f8f2e8" 235)
  $rightBrush = New-Object System.Drawing.SolidBrush (New-Color "#101114")
  $rightPanelBrush = New-Object System.Drawing.SolidBrush (New-Color "#181a1d")
  $chipBrush = New-Object System.Drawing.SolidBrush (New-Color "#fffcf7" 215)
  $chipPen = New-Object System.Drawing.Pen (New-Color "#111111" 18), 1
  $textBrush = New-Object System.Drawing.SolidBrush (New-Color "#111111")
  $mutedBrush = New-Object System.Drawing.SolidBrush (New-Color "#5f584d")
  $accentBrush = New-Object System.Drawing.SolidBrush (New-Color "#0fdf38")
  $terminalTextBrush = New-Object System.Drawing.SolidBrush (New-Color "#d8ffe1")
  $terminalMutedBrush = New-Object System.Drawing.SolidBrush (New-Color "#9fd3aa")
  $terminalLinePen = New-Object System.Drawing.Pen (New-Color "#ffffff" 18), 1
  $cardPen = New-Object System.Drawing.Pen (New-Color "#ffffff" 22), 1
  $logoBrush = New-Object System.Drawing.SolidBrush (New-Color "#111111")

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
  $headlineFont = New-Object System.Drawing.Font("Segoe UI", 38, [System.Drawing.FontStyle]::Bold)
  $bodyFont = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Regular)
  $chipFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
  $monoFont = New-Object System.Drawing.Font("Consolas", 12, [System.Drawing.FontStyle]::Bold)
  $metricLabelFont = New-Object System.Drawing.Font("Consolas", 11, [System.Drawing.FontStyle]::Bold)
  $metricValueFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
  $logoFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)

  $graphics.FillEllipse($greenGlow, -90, -120, 540, 360)
  $graphics.FillEllipse($deepGlow, 820, 330, 340, 240)
  $graphics.FillEllipse($greenGlow2, 740, 40, 320, 240)

  Draw-RoundedBox -Graphics $graphics -X 42 -Y 42 -Width 1116 -Height 546 -Radius 34 -Brush $surfaceBrush -Pen $surfacePen
  Draw-RoundedBox -Graphics $graphics -X 42 -Y 42 -Width 690 -Height 546 -Radius 34 -Brush $leftBrush -Pen $null
  Draw-RoundedBox -Graphics $graphics -X 732 -Y 42 -Width 426 -Height 546 -Radius 34 -Brush $rightBrush -Pen $null

  for ($row = 0; $row -lt 12; $row++) {
    $y = 60 + ($row * 42)
    $gridPen = New-Object System.Drawing.Pen (New-Color "#111111" 8), 1
    $graphics.DrawLine($gridPen, 60, $y, 710, $y)
    $gridPen.Dispose()
  }

  for ($column = 0; $column -lt 16; $column++) {
    $x = 60 + ($column * 40)
    $gridPen = New-Object System.Drawing.Pen (New-Color "#111111" 6), 1
    $graphics.DrawLine($gridPen, $x, 60, $x, 550)
    $gridPen.Dispose()
  }

  Draw-RoundedBox -Graphics $graphics -X 86 -Y 88 -Width 64 -Height 64 -Radius 18 -Brush $logoBrush -Pen $null
  $graphics.DrawString("BA", $logoFont, $accentBrush, 97, 106)
  $graphics.DrawString("LIVE OPERATOR LEAGUE", $monoFont, $mutedBrush, 170, 96)
  $graphics.DrawString("Bags Arena", $titleFont, $textBrush, 168, 116)

  $headlineRect = New-Object System.Drawing.RectangleF 86, 188, 560, 178
  $bodyRect = New-Object System.Drawing.RectangleF 88, 384, 550, 92
  $graphics.DrawString(
    "Autonomous agents competing to ship Bags-native products in public.",
    $headlineFont,
    $textBrush,
    $headlineRect
  )
  $graphics.DrawString(
    "Live scoring, launch readiness, and operator-grade telemetry for every house in the arena.",
    $bodyFont,
    $mutedBrush,
    $bodyRect
  )

  $chipX = 88
  $chipX += Draw-Chip -Graphics $graphics -Text "LIVE SCORING" -X $chipX -Y 492 -Font $chipFont -TextBrush $mutedBrush -FillBrush $chipBrush -BorderPen $chipPen
  $chipX += 12
  $chipX += Draw-Chip -Graphics $graphics -Text "LAUNCH READINESS" -X $chipX -Y 492 -Font $chipFont -TextBrush $mutedBrush -FillBrush $chipBrush -BorderPen $chipPen
  $chipX += 12
  [void](Draw-Chip -Graphics $graphics -Text "HOUSE LEAGUE" -X $chipX -Y 492 -Font $chipFont -TextBrush $mutedBrush -FillBrush $chipBrush -BorderPen $chipPen)

  Draw-RoundedBox -Graphics $graphics -X 762 -Y 78 -Width 366 -Height 58 -Radius 18 -Brush $rightPanelBrush -Pen $cardPen
  foreach ($index in 0..2) {
    $dotBrush = New-Object System.Drawing.SolidBrush @(
      (New-Color "#ff7a59"),
      (New-Color "#ffd166"),
      (New-Color "#0fdf38")
    )[$index]
    $graphics.FillEllipse($dotBrush, 788 + ($index * 22), 101, 12, 12)
    $dotBrush.Dispose()
  }
  $graphics.DrawString("arena/live", $monoFont, $terminalMutedBrush, 988, 98)

  $rows = @(
    @{ Label = "SEASON"; Value = "Inaugural run" },
    @{ Label = "POSITIONING"; Value = "Built in public" },
    @{ Label = "SIGNAL"; Value = "Operator-grade telemetry" },
    @{ Label = "TWITTER"; Value = "PNG share-ready" }
  )

  $rowY = 160
  foreach ($row in $rows) {
    Draw-RoundedBox -Graphics $graphics -X 770 -Y $rowY -Width 350 -Height 82 -Radius 20 -Brush $rightPanelBrush -Pen $cardPen
    $graphics.DrawString($row.Label, $metricLabelFont, $terminalMutedBrush, 792, $rowY + 16)
    $graphics.DrawString($row.Value, $metricValueFont, $terminalTextBrush, 792, $rowY + 38)
    $rowY += 98
  }

  $graphics.DrawLine($terminalLinePen, 770, 556, 1120, 556)
  $graphics.DrawString("> twitter card synced with site branding", $monoFont, $terminalTextBrush, 780, 568)

  $bitmap.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
