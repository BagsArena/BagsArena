param(
  [string]$BannerOutputPath = "public/twitter-banner-simple.png",
  [string]$LogoOutputPath = "public/twitter-logo.png"
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

function Ensure-OutputDirectory {
  param([string]$Path)

  $resolved = Join-Path (Get-Location) $Path
  $directory = Split-Path -Parent $resolved
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  return $resolved
}

function Initialize-Graphics {
  param([System.Drawing.Graphics]$Graphics)

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
}

function Draw-Banner {
  param([string]$OutputPath)

  $resolvedOutput = Ensure-OutputDirectory -Path $OutputPath
  $bitmap = New-Object System.Drawing.Bitmap 1500, 500
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    Initialize-Graphics -Graphics $graphics

    $paper = New-Color "#101114"
    $ink = New-Color "#0fdf38"
    $accent = New-Color "#0fdf38"
    $panel = New-Object System.Drawing.SolidBrush (New-Color "#111318" 236)
    $panelBorder = New-Object System.Drawing.Pen (New-Color "#0fdf38" 34), 1
    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $inkBrush = New-Object System.Drawing.SolidBrush $ink
    $glowBrush = New-Object System.Drawing.SolidBrush (New-Color "#0fdf38" 28)
    $gridPen = New-Object System.Drawing.Pen (New-Color "#0fdf38" 12), 1
    $titleFont = New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold)
    $titleFormat = New-Object System.Drawing.StringFormat
    $titleFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $titleFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

    $graphics.Clear($paper)
    $graphics.FillEllipse($glowBrush, -120, -120, 520, 320)
    $graphics.FillEllipse($glowBrush, 1080, 300, 420, 240)

    for ($x = 0; $x -le 1500; $x += 60) {
      $graphics.DrawLine($gridPen, $x, 0, $x, 500)
    }

    for ($y = 0; $y -le 500; $y += 60) {
      $graphics.DrawLine($gridPen, 0, $y, 1500, $y)
    }

    Draw-RoundedBox -Graphics $graphics -X 86 -Y 86 -Width 1328 -Height 328 -Radius 34 -Brush $panel -Pen $panelBorder
    $graphics.DrawString(
      "Bags Arena",
      $titleFont,
      $inkBrush,
      (New-Object System.Drawing.RectangleF 130, 118, 1240, 264),
      $titleFormat
    )

    $bitmap.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function Draw-Logo {
  param([string]$OutputPath)

  $resolvedOutput = Ensure-OutputDirectory -Path $OutputPath
  $bitmap = New-Object System.Drawing.Bitmap 800, 800
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    Initialize-Graphics -Graphics $graphics

    $background = New-Color "#101114"
    $accent = New-Color "#0fdf38"
    $softAccent = New-Color "#0fdf38" 34
    $outerRingPen = New-Object System.Drawing.Pen (New-Color "#0fdf38" 54), 10
    $innerRingPen = New-Object System.Drawing.Pen (New-Color "#0fdf38" 150), 8
    $backgroundBrush = New-Object System.Drawing.SolidBrush $background
    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $glowBrush = New-Object System.Drawing.SolidBrush $softAccent
    $textFont = New-Object System.Drawing.Font("Segoe UI", 178, [System.Drawing.FontStyle]::Bold)
    $stringFormat = New-Object System.Drawing.StringFormat
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

    $graphics.Clear($background)
    $graphics.FillEllipse($glowBrush, 110, 110, 580, 580)
    $graphics.FillEllipse($backgroundBrush, 120, 120, 560, 560)
    $graphics.DrawEllipse($outerRingPen, 128, 128, 544, 544)
    $graphics.DrawEllipse($innerRingPen, 168, 168, 464, 464)
    $graphics.DrawString(
      "BA",
      $textFont,
      $accentBrush,
      (New-Object System.Drawing.RectangleF 170, 160, 460, 470),
      $stringFormat
    )

    $bitmap.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

Draw-Banner -OutputPath $BannerOutputPath
Draw-Logo -OutputPath $LogoOutputPath
