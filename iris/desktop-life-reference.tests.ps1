$ErrorActionPreference='Stop'
$taskSource=Join-Path $PSScriptRoot 'desktop-life-reference.cs'
if(!(Test-Path $taskSource)){throw 'Selected recipe reference reader is missing'}
Add-Type -Path @($taskSource,(Join-Path $PSScriptRoot 'desktop-life-policy.cs')) -ReferencedAssemblies @('System.Core','System.Web.Extensions')
$taskRaw='{"items":[{"DisplayName":"gear","ProducedPerCraft":1,"MissingIngredients":[{"DisplayName":"wood","Required":3,"Owned":999}]}]}'
$taskValue=[IrisDesktop.DesktopLifeReference]::Normalize('crafting','gear',$taskRaw,10000)|ConvertTo-Json -Depth 12 -Compress|ConvertFrom-Json
if($taskValue.complete -ne $false -or $taskValue.source -ne 'installed-reference' -or $taskValue.ingredients[0].required -ne 3 -or $taskValue.ingredients[0].PSObject.Properties.Name -contains 'Owned'){throw 'Reference became live inventory or complete BOM'}
if($taskValue.outputPerUnit -ne 1 -or $taskValue.modifiedAt -ne 10000){throw 'Reference production units or source date missing'}
if($null -ne [IrisDesktop.DesktopLifeReference]::Normalize('crafting','absent',$taskRaw,10000)){throw 'Missing recipe fabricated'}
foreach($taskBroken in @('{"items":[{"DisplayName":"gear","ProducedPerCraft":1,"MissingIngredients":[{"DisplayName":"wood","Required":-1}]}]}','{"items":[{"DisplayName":"gear","ProducedPerCraft":1,"MissingIngredients":[]},{"DisplayName":"gear","ProducedPerCraft":1,"MissingIngredients":[]}]}')){
 $taskFailed=$false;try{$null=[IrisDesktop.DesktopLifeReference]::Normalize('crafting','gear',$taskBroken,10000)}catch{$taskFailed=$true};if(!$taskFailed){throw 'Invalid or ambiguous reference accepted'}
}
$taskFailed=$false;try{$null=[IrisDesktop.DesktopLifeReference]::Normalize('../settings','gear',$taskRaw,10000)}catch{$taskFailed=$true};if(!$taskFailed){throw 'Arbitrary file kind accepted'}
Write-Output 'PASS selected reference quantity/provenance/date/partial-only/no cached Owned/duplicate+invalid guard; synthetic JSON only'
