--Created by Filip Kohout
--This is Flamethrower weapon server script from Zombie Defence
--This script turns on/off the flamethrower, changes its global server values, changes its effects, plays its animations and its sounds 

local WeaponsModule = require(game.ServerScriptService.Main.Attack.Damages) --Module that handles core things for every weapon
local Settings = require(script.Parent.Settings) --This is where the settings are stored

local TweenService = game:GetService("TweenService")

local Touch = Settings.HitPart.Touched:connect(function() end) --Set listener for touch event, collisions can be detected without this

local IsEquipped = false
local HoldAnimation

local ToolOwner
local DmgDebounce = false
local GasTween


function Clicked(plr) --(Called from client) When the player clicks on the screen this function is called
	if IsEquipped then
		ToolOwner = plr

		--The gas must be at least 1/10 of the capacity to be able to turn on
		if script.Parent.Turned.Value == false and script.Parent.Gas.Value < Settings.MaxGas/10 then
			script.Parent.Turned.Value = true
		end

		--Turning the gas off/on
		script.Parent.Turned.Value = not script.Parent.Turned.Value
		local LastVal = script.Parent.Turned.Value

		--Turn on all particles
		for _, p in pairs(script.Parent.Handle.Particles:GetChildren()) do
			p.Enabled = script.Parent.Turned.Value
		end

		--Set volume
		Settings.UseSound.Volume = (script.Parent.Turned.Value and 0 or 1)
		Settings.UseSound.Playing = true

		--Make the volume transition smooth
		for volume = Settings.UseSound.Volume, (script.Parent.Turned.Value and 1 or 0), (script.Parent.Turned.Value and 0.1 or -0.1) do
			if not(LastVal == script.Parent.Turned.Value) then
				break
			end
			Settings.UseSound.Volume = volume
			task.wait(0.025)
		end
		Settings.UseSound.Playing = script.Parent.Turned.Value
	end
end

function UpdateGas() --(Called from client)
	if IsEquipped and script.Parent.Gas.Value < 1 and script.Parent.Turned.Value then
		--Turn it off if it's on
		Clicked(ToolOwner)
	end
end

function Equipped() --When the tool gets equipped
	IsEquipped = true 

	--Turn on the hold animation
	if Settings.HoldAnimEnabled then
		local Humanoid = script.Parent.Parent:WaitForChild("Humanoid")

		HoldAnimation          = Humanoid:LoadAnimation(Settings.HoldAnimation)
		HoldAnimation.Priority = Enum.AnimationPriority.Action
		HoldAnimation:Play()
	end

	--Set up loop while the tool is equipped to change the gas value
	while IsEquipped do
		if GasTween then
			GasTween:Cancel()
		end

		--Set the gas using a tween
		if script.Parent.Turned.Value then
			GasTween = TweenService:Create(script.Parent.Gas, TweenInfo.new(0.1, Enum.EasingStyle.Linear), {Value = math.clamp(script.Parent.Gas.Value - Settings.GasConsumptionPerSecond/10, 0, Settings.MaxGas)})
		else
			GasTween = TweenService:Create(script.Parent.Gas, TweenInfo.new(0.1, Enum.EasingStyle.Linear), {Value = math.clamp(script.Parent.Gas.Value + Settings.GasProductionPerSecond/10, 0, Settings.MaxGas)})
		end
		GasTween:Play()

		task.wait(0.1)
		UpdateGas() --Check if the gas is at 0
	end
end

function Unequipped() --When the tool gets unequipped
	--Turn it off if it's on
	if script.Parent.Turned.Value then
		Clicked(ToolOwner)
	end

	IsEquipped = false

	if HoldAnimation then
		HoldAnimation:Stop()
	end
end

function RenderStepped() --This function gets called each time the game renders a frame
	if IsEquipped and DmgDebounce == false and script.Parent.Turned.Value and script.Parent.Gas.Value > 0 then
		for _,hit in pairs(Settings.HitPart:GetTouchingParts()) do --Check up for the touching parts
			if WeaponsModule:CheckWeaponTarget(hit) then
				DmgDebounce = true

				WeaponsModule:TakeDamageByWeapon(ToolOwner,hit,Settings.Damage)
				wait(Settings.DamageWait)

				DmgDebounce = false
				break
			end
		end
	end
end

game:GetService("RunService").RenderStepped:Connect(RenderStepped)

--Client events
Settings.ClickEvent.OnServerEvent:Connect(Clicked)

--Server global value events
script.Parent.Unequipped:Connect(Unequipped)
script.Parent.Equipped:Connect(Equipped)
script.Parent.Gas.Changed:Connect(UpdateGas)
