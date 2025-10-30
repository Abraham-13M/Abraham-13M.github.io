# Download real product photos from Unsplash into assets/images
# Run this script from the repository root in PowerShell:
#   .\scripts\download-images.ps1

$images = @{
  'manzanilla.jpg' = 'https://source.unsplash.com/1200x900/?chamomile,tea'
  'romero.jpg'     = 'https://source.unsplash.com/1200x900/?rosemary,herb'
  'valeriana.jpg'  = 'https://source.unsplash.com/1200x900/?valerian,herb'
  'tomillo.jpg'    = 'https://source.unsplash.com/1200x900/?thyme,tea'
  'eucalipto.jpg'  = 'https://source.unsplash.com/1200x900/?eucalyptus,leaf'
  'jengibre.jpg'   = 'https://source.unsplash.com/1200x900/?ginger,root'
  'menta.jpg'      = 'https://source.unsplash.com/1200x900/?mint,tea'
  'propoleo.jpg'   = 'https://source.unsplash.com/1200x900/?propolis,bee'
  'aloe.jpg'       = 'https://source.unsplash.com/1200x900/?aloe,vera'
  'salvia.jpg'     = 'https://source.unsplash.com/1200x900/?sage,herb'
  'lavanda.jpg'    = 'https://source.unsplash.com/1200x900/?lavender,flowers'
  'curcuma.jpg'    = 'https://source.unsplash.com/1200x900/?turmeric,root'
  'infusion.jpg'   = 'https://source.unsplash.com/1200x900/?herbal,tea'
}

$dest = Join-Path -Path $PSScriptRoot -ChildPath '..\assets\images'
if(-not (Test-Path $dest)){
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

Write-Output "Downloading images to: $dest"
foreach($name in $images.Keys){
  $url = $images[$name]
  $out = Join-Path $dest $name
  Write-Output "Fetching $url -> $out"
  try{
    # Some PowerShell versions warn about -UseBasicParsing; it's fine to omit on newer versions
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -ErrorAction Stop
  }catch{
    Write-Warning "Failed to download $url : $_"
  }
}

Write-Output "Done. Review images in assets/images and commit them if you want the repo to contain the photos."