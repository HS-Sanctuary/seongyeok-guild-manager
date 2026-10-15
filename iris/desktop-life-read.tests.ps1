$ErrorActionPreference='Stop'
$source=@('desktop-life-read.cs','desktop-cli-activity.cs')|ForEach-Object{Join-Path $PSScriptRoot $_}
if(!(Test-Path $source)){throw 'Life read normalizer missing'}
Add-Type -Path $source -ReferencedAssemblies @('System.Core','System.Web.Extensions')
function Read($kind,$raw){[IrisDesktop.DesktopLifeReader]::Normalize($kind,$raw)|ConvertTo-Json -Depth 20 -Compress|ConvertFrom-Json}
function Assert($ok,$message){if(!$ok){throw $message}}
function Reject($kind,$raw){try{$null=Read $kind $raw}catch{return};throw 'Invalid life snapshot accepted'}
$materials=Read 'materials' '[{"DisplayName":"wood","Category":"Ingredient","CategoryDisplayName":"Material","Location":"inventory","Count":3,"IsLocked":false},{"DisplayName":"wood","Category":"Ingredient","CategoryDisplayName":"Material","Location":"account_storage","Count":8,"IsLocked":true}]'
Assert ($materials.kind -eq 'materials' -and $materials.schemaVersion -eq 1 -and $materials.source -eq 'official-cli' -and $materials.observedAt -gt 0) 'Life envelope wrong'
Assert ($materials.data.items.Count -eq 2 -and $materials.data.items[0].count -eq 3 -and $materials.data.items[1].location -eq 'account_storage' -and $materials.data.items[1].locked) 'Storage or locked quantity merged'
$inventory=Read 'inventory' '{"CurrentInventoryWeight":999,"CurrentInventoryWeightAsDecimal":12.5,"MaxInventoryWeightAsDecimal":100}'
Assert ($inventory.data.weight -eq 12.5) 'Decimal weight lost'
$craft=Read 'crafting' '{"craftingUnlocked":true,"items":[{"DisplayName":"wood","Craftable":true,"ProducedPerCraft":3}]}'
Assert ($craft.data.items[0].missing -eq $null -and $craft.data.items[0].producedPerUnit -eq 3) 'Unknown BOM invented'
$activity=Read 'activity' '{"IsInCombat":false,"Dungeon":{"State":"NotInDungeon"}}'
Assert ($activity.data.inCombat -eq $false -and $activity.data.autoPlaying -eq $null -and $activity.data.dungeonState -eq 'NotInDungeon') 'Missing state became safe'
$taskInteraction=Read 'activity' '{"IsAbyssResultSequencePlaying":true,"Interaction":{"LastRunningInteractionType":"Gathering"}}'
Assert ($taskInteraction.data.abyssSequence -eq $true -and $taskInteraction.data.interactionType -eq 'Gathering') 'Action safety fields discarded'
$idleAfterDungeon=Read 'activity' '{"Interaction":{"LastRunningInteractionType":"EnterDungeon"},"Mode":{"MainButtonState":"Compass"}}'
Assert ($idleAfterDungeon.data.mainButtonState -eq 'Compass' -and $idleAfterDungeon.data.interactionType -eq 'EnterDungeon') 'Current main button state missing or historical interaction overwritten'
Assert ($activity.data.mainButtonState -eq $null) 'Unknown main button became safe'
Reject 'execute_gathering' '{}';Reject 'inventory' '{"pipe":"disconnected"}'
Reject 'inventory' '{"status":"rejected","body":{"error":"game_off"}}'
Reject 'activity' '{"status":"accepted","body":{"error":"unavailable"}}'
Reject 'materials' '[{"DisplayName":"wood","Category":"Ingredient","Location":"inventory","Count":-1}]'
Reject 'gathering' '{"items":[{"DisplayName":"wood","ToolOk":"false"}]}'
$row='{"DisplayName":"'+('x'*120)+'","Category":"Ingredient","Location":"inventory","Count":3}'
$large='['+((1..1000|ForEach-Object{$row}) -join ',')+']'
Assert ((Read 'materials' $large).data.items.Count -eq 1000) 'Catalog larger than old 64KiB truncated'
Reject 'materials' ('['+((1..2049|ForEach-Object{$row}) -join ',')+']')
Reject 'inventory' ((' '*1048576)+'{}')
Write-Output 'PASS life native normalizers, unknown values, separated inventory and large catalog limits'
