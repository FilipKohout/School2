--[[
Property of Per Games

Creator: Filip Kohout
Created: 7/5/2021 for Aiport Control Tycoon
Original Place: https://www.roblox.com/games/6780502598/ACT-Remake-Storage
Version of this script: 3.1 for Zombie Defence

A lot of features for Zombie Defence version has beed removed to clear the script, 
contact Filip Kohout if you need to restore some of the features

!!DO NOT DISTRIBUTE WITHOUT PERMISSION FROM Filip Kohout!!
]]--


--services
local Players           = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TS                = game:GetService("TweenService")
local UIS               = game:GetService("UserInputService")
local RS                = game:GetService("RunService")
local MPS               = game:GetService("MarketplaceService")
--instances
local plr        = Players.LocalPlayer
local GUI        = plr:WaitForChild("PlayerGui")
local Camera     = game.Workspace.CurrentCamera
local ScreenSize = Camera.ViewportSize
local Mouse      = plr:GetMouse()
--setting
local MinHeight                 = 3
local MaxHeight                 = MinHeight+300
local RotationDeg               = 90
local GridSize                  = 3
local NoHeightLimitPass         = 8496669
local MouseRayDistance          = 1000    
local MouseRaySettings          = RaycastParams.new(
	{},
	Enum.RaycastFilterType.Blacklist,
	false,
	"Default"
)
local TweenSettings           = TweenInfo.new(
	0.1,
	Enum.EasingStyle.Quad,
	Enum.EasingDirection.Out
)
--modules
local OpenModule     = require(GUI:WaitForChild("MainGui").OpenFrame)
local MessagesModule = require(GUI:WaitForChild("OtherGui").Messages.Main)

--devices
local DeviceVal = GUI:WaitForChild("Devices"):WaitForChild("Device").Value

local BuildingEnabled = false

--Model settings
local Model          = nil
local Box            = nil
local ModelData      = nil
local Color          = Color3.fromRGB(0,0,0)
local Anchored       = true
local Welded         = true
local Rotation       = Vector3.new(0,0,0)
local Fakeplr        = nil
local IsHeightLocked = false
local LockedHeight   = 0
local HeightBorder   = nil
local CanPlace       = false
local GoalPosition   = Vector3.new(0,0,0)

--Model tweens
local TweenInstance = nil
local TweenValue    = nil

local PlaceDebounce = false


function Start(ModelName,PlayerInventory)
	if ModelName and PlayerInventory then
		Model = ReplicatedStorage.Models:FindFirstChild(ModelName)				
		if Model and Model.PrimaryPart then --check if found model and model's primarypart exist
			ModelData = Model:FindFirstChild("Data")	
			if ModelData then --check if found model's data exist
				local Plot = plr.Data.Plot.Value

				--Disable other tools to prevent glitches
				game.ReplicatedStorage.Events.EditMode.DeleteModeEnd:Fire()
				game.ReplicatedStorage.Events.EditMode.PaintModeEnd:Fire()

				--Update screen size
				ScreenSize = Camera.ViewportSize

				--GUIs
				OpenModule:Close("Build")
				if DeviceVal == "Mobile" then
					OpenModule:Open("BuildingButtonsMobile")
				else
					OpenModule:Open("BuildingButtons")
				end

				Model        = ReplicatedStorage.Models:FindFirstChild(ModelName):Clone()
				Model.Parent = Plot.Models
				--Set raycasting and mouse to ignoring model and player's character (MouseRaySettings for PC and mobile, mouse targetfilter for console)
				MouseRaySettings.FilterDescendantsInstances = {Model, plr.Character}
				Mouse.TargetFilter = Model and plr.Character
				--Set model can collide, tranparency, save model's color and inactive some instances
				for i,p in pairs(Model:GetDescendants()) do
					if p:IsA("BasePart") then
						p.CanCollide = false
						if p:FindFirstChild("CanColor") then
							Color = p.Color
						end
					elseif p:IsA("ProximityPrompt") then
						p:Destroy()
					elseif p:IsA("Seat") then
						p:Destroy()
					end
				end
				--Create range circle
				if (Model:FindFirstChild("IsATurret") or Model:FindFirstChild("IsATower") and Model:FindFirstChild("Settings")) or (Model.Data:FindFirstChild("Settings") and Model.Data.Settings:FindFirstChild("Range")) then
					local Range = 0
					if Model:FindFirstChild("IsATurret") then
						local module = require(Model:FindFirstChild("Settings"))
						Range = module.Range
					elseif Model:FindFirstChild("IsATower") then
						if Model:FindFirstChildWhichIsA("ModuleScript") then
							local module = require(Model:FindFirstChildWhichIsA("ModuleScript"))
							Range = module["MaxRange"]
						else
							Range = Model:FindFirstChild("Settings"):FindFirstChild("MaxRange").Value
						end
					else
						Range = Model.Data.Settings.Range.Value
					end

					local CPart = Instance.new("Part", Model.PrimaryPart)
					CPart.Anchored = true
					CPart.Transparency = 1
					CPart.CanCollide = false
					CPart.Size = Vector3.new(0,0,0)
					CPart.Position = Model.PrimaryPart.Position + Vector3.new(0,-(Model.PrimaryPart.Size.Y/2)+0.25,0)
					CPart.Orientation = Vector3.new(90,0,0)
					local Circle = Instance.new("CylinderHandleAdornment",Model.PrimaryPart)
					Circle.Radius = Range
					Circle.Height = 0.25
					Circle.Adornee = CPart
					Circle.Transparency = 0.98
					Circle.Color3 = Color3.fromRGB(0, 170, 255)
					Circle.Angle = 0
					spawn(function()
						for i=0,360,10 do
							if Model and Model.Parent then
								Circle.Angle = i
								wait()
							end
						end
					end)
				end
				--Create and set model's box
				Box               = Instance.new("SelectionBox",Model)
				Box.Adornee       = Model.PrimaryPart
				Box.LineThickness = 0.01
				Box.Color3        = Color3.new(1, 0, 0)
				--Set up model's data
				Model.Data.Color.Value = Color
				--Save model do GUI
				game.ReplicatedStorage.Events.EditMode.SetModel:Fire(Model)
				--Set up plot
				Plot.Plot.HitBox.Transparency = 0.5
				--Set inventory owner(inventory sharing)
				Fakeplr = game.Players:FindFirstChild(PlayerInventory) or game.Players.LocalPlayer

				wait(0.5)
				BuildingEnabled = true
			end
		end
	end
end
function CalculateModelPosition(Position)
	if Position then
		local X,Y,Z = Position.X,Position.Y,Position.Z
		local MoveX,MoveY,MoveZ = false,false,false

		--Calculate position in to the grid
		if X < (math.floor(X/GridSize)*GridSize) +GridSize/2 then
			X = math.floor((X/GridSize)+0.5)*GridSize
		elseif X == math.floor(X/GridSize)*GridSize +GridSize/2 then
			X = math.floor(X/GridSize)*GridSize
			MoveX = true
		else
			X = math.ceil((X/GridSize)-0.5)*GridSize
		end

		if Y < math.floor(Y/GridSize) +GridSize/2 then
			Y = math.floor((Y/GridSize)+0.5)*GridSize
		elseif Y == math.floor(Y/GridSize)*GridSize +GridSize/2 then
			Y = math.floor(Y/GridSize)*GridSize
			MoveY = true
		else
			Y = math.ceil((Y/GridSize)-0.5)*GridSize
		end

		if Z < (math.floor(Z/GridSize)*GridSize) +GridSize/2 then
			Z = math.floor((Z/GridSize)+0.5)*GridSize
		elseif Z == math.floor(Z/GridSize)*GridSize +GridSize/2 then
			Z = math.floor(Z/GridSize)*GridSize
			MoveZ = true
		else
			Z = math.ceil((Z/GridSize)-0.5)*GridSize
		end

		--corect position
		if Rotation.Y == 0 or Rotation.Y == 180 or Rotation.Y == 360 then 
			if Model.PrimaryPart.Size.X <= 9 and Model.PrimaryPart.Size.Z < 9  then
				if Model.PrimaryPart.Size.X > 5.9 then
					X = X - (GridSize/2)
				end
				if Model.PrimaryPart.Size.Z > 5.9 then
					Z = Z - (GridSize/2)
				end
			end
		else
			if Model.PrimaryPart.Size.X < 9 and Model.PrimaryPart.Size.Z < 9 then
				if Model.PrimaryPart.Size.X == 3 and Model.PrimaryPart.Size.Z == 6 then
					X = X - (GridSize/2)
				elseif Model.PrimaryPart.Size.X == 6 and Model.PrimaryPart.Size.Z == 3 then
					Z = Z - (GridSize/2)
				else
					if Model.PrimaryPart.Size.X > 5.9 then
						X = X + (GridSize/2)
					end
					if Model.PrimaryPart.Size.Z > 5.9 then
						Z = Z + (GridSize/2)
					end
				end
			end
		end

		--check minimum height
		if Y < MinHeight then
			Y = MinHeight
		end

		--recalculate height if object is bigger than grid size and height lock
		if Model.PrimaryPart.Size.Y > GridSize+0.1 then
			Y = ((Y-(GridSize/2))+(Model.PrimaryPart.Size.Y/2))
			if IsHeightLocked then
				Y = LockedHeight
			end
		else
			if IsHeightLocked then
				Y = LockedHeight
			end
		end

		--special position edits
		if Model and (Model.Name == "Machine Gun" or Model.Name == "Manual Cannon") then
			Y += 0.1
		end

		--fix colliding
		local RecalculatedPosition = Vector3.new(X,Y,Z)	

		if CheckModelValidPosition(RecalculatedPosition) == false and Mouse.Target and not IsHeightLocked then
			local NewPosition = RecalculatedPosition

			--Recalculate in individual axis
			if MoveX then
				NewPosition = NewPosition + Vector3.new(GridSize,0,0)
			end
			if MoveY then
				NewPosition = NewPosition + Vector3.new(0,GridSize,0)
			end
			if MoveZ then
				NewPosition = NewPosition + Vector3.new(0,0,GridSize)
			end

			--Final check if repair was success
			if CheckModelValidPosition(NewPosition) then
				RecalculatedPosition = NewPosition
			end
		end

		return RecalculatedPosition
	end
end
function SetModelPosition(Position,Tween,Effects)
	if Position then	
		if Tween then
			if TweenInstance then
				TweenInstance:Cancel()
			end

			local TweenGoal = {
				Value = CFrame.new(Position) * CFrame.Angles(math.rad(Rotation.X),math.rad(Rotation.Y),math.rad(Rotation.Z))
			}		
			TweenValue       = Instance.new("CFrameValue",Model)             --Create tween and effect value that will keep actual tween value and then set model position to it
			TweenValue.Value = Model:GetPrimaryPartCFrame()                  --Set starting position
			TweenInstance    = TS:Create(TweenValue,TweenSettings,TweenGoal) --Create tween and set up it
			TweenInstance:Play()
			
			GoalPosition = Position

			TweenValue.Changed:connect(function()
				Model:SetPrimaryPartCFrame(TweenValue.Value)
			end)
			TweenInstance.Completed:connect(function()
				TweenInstance = nil
				if TweenValue then
					TweenValue:Destroy()
					TweenValue = nil
				end
			end)

			return						
		else
			Model:SetPrimaryPartCFrame(CFrame.new(Position) * CFrame.Angles(math.rad(Rotation.X),math.rad(Rotation.Y),math.rad(Rotation.Z)))
		end
	end
end
function CheckModelValidPosition(Position)
	if Position and Model then
		--Resize hitbox
		Model.BoxPart.Size -= Vector3.new(0.1,0.1,0.1)

		local OldPosition = Vector3.new(Model:GetPrimaryPartCFrame().X,Model:GetPrimaryPartCFrame().Y,Model:GetPrimaryPartCFrame().Z)

		--Set Testing Position
		SetModelPosition(Position,false,false)

		--Border checking
		local Result = false
		local Border = plr.Data.Plot.Value.Plot

		local x1 = (Border.Position.X - 0.5 * Border.Size.X) + Model.PrimaryPart.Size.X/2
		local x2 = (Border.Position.X + 0.5 * Border.Size.X) - Model.PrimaryPart.Size.X/2

		local z1 = (Border.Position.Z - 0.5 * Border.Size.Z) + Model.PrimaryPart.Size.Z/2
		local z2 = (Border.Position.Z + 0.5 * Border.Size.Z) - Model.PrimaryPart.Size.Z/2

		if Position.X > x1 and Position.X < x2 and Position.Z > z1 and Position.Z < z2 then
			Result = true
		end

		if Model.PrimaryPart.Position.Y > MaxHeight and MPS:UserOwnsGamePassAsync(plr.UserId, NoHeightLimitPass) == false then
			Result = false
		end

		local Touch    = Model.BoxPart.Touched:Connect(function() end)
		local Touching = Model.BoxPart:GetTouchingParts()

		for _,p in pairs(Touching) do
			if not(p.Parent == Model) and ((p.Name == "BoxPart" and p.Parent.Parent == Model.Parent) or p.Parent:FindFirstChild("Flag") or p.Parent:FindFirstChild("HeightPart")) then
				Result = false
				break
			end	
		end

		--Diconnect touch checking
		Touch:Disconnect()

		--Set back old position
		SetModelPosition(OldPosition,false,false)

		--Resize hitbox back
		Model.BoxPart.Size += Vector3.new(0.1,0.1,0.1)

		return Result
	end
end
function MouseMove()
	if BuildingEnabled then
		--Update raycasting and mouse to ignoring model and player's character (MouseRaySettings for PC and mobile, mouse targetfilter for console)
		if Mouse and plr.Character then
			MouseRaySettings.FilterDescendantsInstances = {Model, plr.Character}
			Mouse.TargetFilter = Model and plr.Character
		end

		--Check mobile buttons
		if not CheckMousePosition(UIS:GetMouseLocation()) then
			return
		end

		--Checking place mode
		local RecalculatedPosition = CalculateModelPosition(GetMouseTargetPosition())

		SetModelPosition(RecalculatedPosition,true,true)

		if CheckModelValidPosition(RecalculatedPosition) then
			Box.Color3 = Color3.new(0, 1, 0)
		else
			Box.Color3 = Color3.new(1, 0, 0)
		end
		
		--Set color
		for i,v in pairs(Model:GetDescendants()) do
			if v:FindFirstChild("CanColor") then
				v.Color = Model.Data.Color.Value
			end
		end
		
		--multiple placing
		if not(DeviceVal == "Mobile") then
			if CanPlace and plr.Settings.MultiPlacing.Value then
				PlaceModel(RecalculatedPosition,true)
				return
			end
		end
	end
end
function Rotate(Axis)
	if Axis then
		--Rotate
		if Axis == "X" then
			if Model.PrimaryPart.Size.Y < GridSize+0.1 and Model.PrimaryPart.Size.X < GridSize+0.1 and Model.PrimaryPart.Size.Z < GridSize+0.1 then
				Rotation = Vector3.new(Rotation.X+RotationDeg,Rotation.Y,Rotation.Z)
				if Rotation.X >= 360 then
					Rotation = Vector3.new(0,Rotation.Y,Rotation.Z)
				end
			end
		elseif Axis == "Y" then
			Rotation = Vector3.new(Rotation.X,Rotation.Y+RotationDeg,Rotation.Z)
			if Rotation.Y >= 360 then
				Rotation = Vector3.new(Rotation.X,0,Rotation.Z)
			end
		elseif Axis == "Z" then
			if Model.PrimaryPart.Size.Y < GridSize+0.1 and Model.PrimaryPart.Size.X < GridSize+0.1 and Model.PrimaryPart.Size.Z < GridSize+0.1 then
				Rotation = Vector3.new(Rotation.X,Rotation.Y,Rotation.Z+RotationDeg)
				if Rotation.Z >= 360 then
					Rotation = Vector3.new(Rotation.X,Rotation.Y,0)
				end
			end
		end
		--Apply change and make tween effect
		SetModelPosition(Vector3.new(Model:GetPrimaryPartCFrame().X,Model:GetPrimaryPartCFrame().Y,Model:GetPrimaryPartCFrame().Z),true,false)
	end
end
function PlaceModel(Position,MultiPlace)
	if BuildingEnabled and Model then 
		if PlaceDebounce == false then
			PlaceDebounce = true

			--check mobile buttons
			if not CheckMousePosition(Position) then
				PlaceDebounce = false
				return
			end

			--stop building when player has 0 items
			if Fakeplr.Inventory:FindFirstChild(Model.Name).Number.Value <= 0 then
				print("Lack of items")
				spawn(function()
					MessagesModule:Create(plr,"Items","Lack of items!",1,3)
				end)
				StopBuilding()
				return
			end

			--camera shake
			spawn(function() 
				if not MultiPlace and not(DeviceVal == "Mobile") and plr:WaitForChild("Settings"):WaitForChild("CameraShake").Value then
					local Humanoid = plr.Character.Humanoid
					for i = 1,3,1 do
						local r1 = math.random(-5,5)/100
						local r2 = math.random(-5,5)/100
						local r3 = math.random(-5,5)/100
						Humanoid.CameraOffset = Vector3.new(r1,r2,r3)
						wait()
					end
					Humanoid.CameraOffset = Vector3.new(0,0,0)
				end
			end)

			if CheckModelValidPosition(GoalPosition) then
				if plr.Data.Plot.Value.Data.Game.Value == false then
					game.ReplicatedStorage.Events.EditMode.Place:FireServer(Fakeplr,Model.Name,CFrame.new(GoalPosition.X,GoalPosition.Y,GoalPosition.Z),Vector3.new(Rotation.X,Rotation.Y,Rotation.Z),Color,Anchored,Welded)
				end
			end

			task.wait(0.1)
			PlaceDebounce = false
		end
	end
end
function SetLockHeight(Status,Height,BarrierHeight)
	IsHeightLocked = Status

	if Status then
		local Plot = plr.Data.Plot.Value

		HeightBorder              = Instance.new("Part",Plot)
		HeightBorder.Name         = "HeightPart"
		HeightBorder.Position     = Vector3.new(Plot.Plot.Position.X,BarrierHeight/2,Plot.Plot.Position.Z)
		HeightBorder.Size         = Vector3.new(Plot.Plot.Size.X,BarrierHeight,Plot.Plot.Size.Z)
		HeightBorder.Transparency = 0.5
		HeightBorder.CanCollide   = false
		HeightBorder.Color        = Color3.fromRGB(255, 0, 0)
		HeightBorder.Anchored     = true
		HeightBorder.TopSurface   = Enum.SurfaceType.Smooth

		LockedHeight = Height
	else
		if HeightBorder then
			HeightBorder:Destroy()
			LockedHeight = 0
		end
	end
end
function StopBuilding(Build)
	BuildingEnabled = false
	PlaceDebounce   = false
	Anchored        = true
	Welded          = true
	IsHeightLocked  = false
	Rotation        = Vector3.new(0,0,0)
	Color           = Color3.fromRGB(0,0,0)
	IsHeightLocked  = false
	LockedHeight    = 0

	local Plot = plr.Data.Plot.Value
	if Plot then
		Plot.Plot.HitBox.Transparency = 1
	end

	if HeightBorder then
		HeightBorder:Destroy()
	end

	if Model then
		Model:Destroy()
	end
	--To prevent ghost blocks
	task.delay(0.2,function()
		if Model then
			Model:Destroy()
		end
	end)

	if Build == nil then
		if DeviceVal == "Mobile" then
			OpenModule:Close("BuildingButtonsMobile")
		end
		OpenModule:Close("BuildingButtons")
		OpenModule:Open("Build")
	elseif Build == "Classic" then
		if DeviceVal == "Mobile" then
			OpenModule:Close("BuildingButtonsMobile")
		end
		OpenModule:Close("BuildingButtons")
	else
		if DeviceVal == "Mobile" then
			OpenModule:Close("BuildingButtonsMobile")
		end
		OpenModule:Close("BuildingButtons")
		OpenModule:Close("Build")
	end
end
function CheckMousePosition(Position)
	--Check mobile buttons
	if DeviceVal == "Mobile" then
		local PosToCheck

		if typeof(Position) == "Vector2" then
			PosToCheck = Position
		else
			PosToCheck = Camera:WorldToScreenPoint(Vector3.new(Position.X,Position.Y,Position.Z))
		end

		if GUI:FindFirstChild("TouchGui") and GUI.TouchGui:FindFirstChild("TouchControlFrame") and (GUI.TouchGui.TouchControlFrame:FindFirstChild("DynamicThumbstickFrame") or GUI.TouchGui.TouchControlFrame:FindFirstChild("ThumbstickFrame")) then
			local Thumb = GUI.TouchGui.TouchControlFrame:FindFirstChild("DynamicThumbstickFrame") or GUI.TouchGui.TouchControlFrame:FindFirstChild("ThumbstickFrame")
			local ThumbX1 = Thumb.AbsolutePosition.X
			local ThumbX2 = Thumb.AbsolutePosition.X+Thumb.AbsoluteSize.X
			local ThumbY1 = Thumb.AbsolutePosition.Y
			local ThumbY2 = Thumb.AbsolutePosition.Y+Thumb.AbsoluteSize.Y

			if PosToCheck.X > ThumbX1 and PosToCheck.X < ThumbX2 and PosToCheck.Y > ThumbY1 and PosToCheck.Y < ThumbY2 then
				return false
			end

			for _,Button in pairs(GUI.MainGui:FindFirstChild("BuildingButtonsMobile"):GetChildren()) do
				if Button:IsA("ImageButton") then
					local ButtonX1 = Button.AbsolutePosition.X
					local ButtonX2 = Button.AbsolutePosition.X+Button.AbsoluteSize.X
					local ButtonY1 = 0
					local ButtonY2 = Button.AbsoluteSize.Y

					if PosToCheck.X > ButtonX1 and PosToCheck.X < ButtonX2 and PosToCheck.Y > ButtonY1 and PosToCheck.Y < ButtonY2 then
						return false
					end
				end
			end
		end
		return true
	else
		return true
	end
end
function GetMouseTargetPosition()
	local mousePos
	if not(DeviceVal == "Console") then
		mousePos = UIS:GetMouseLocation()
	else
		mousePos = Vector2.new(Mouse.X,Mouse.Y)
	end

	local viewportMouseRay = Camera:ViewportPointToRay(mousePos.X, mousePos.Y)
	local rayCastResult    = workspace:Raycast( --Set up raycast
		viewportMouseRay.Origin, 
		viewportMouseRay.Direction * MouseRayDistance, 
		MouseRaySettings
	)

	if rayCastResult then
		return rayCastResult.Position
	else
		return viewportMouseRay.Direction * MouseRayDistance
	end
end
function UpdateStartingData(Data)
	if Model:FindFirstChild("Data") and not (Data[1] == nil) and not (Data[2] == nil) and not (Data[3] == nil) then
		local An = Data[1]
		local We = Data[2]
		local Co = Data[3]

		Color = Co
		Anchored = An
		Welded = We

		Model.Data.Color.Value = Co
		Model.Data.Anchored.Value = An
		Model.Data.Welded.Value = We
	end
end
function CancelSharing(plr2)
	if Fakeplr and plr2 then
		if plr2.Name == Fakeplr.Name then
			StopBuilding()
		end
	end
end
function Action(Name,Parm1)
	if Name == "End" then
		StopBuilding(Parm1)
	elseif Name == "Place" then
		PlaceModel(Model:GetPrimaryPartCFrame(),false)
	elseif Name == "Rotate1" then
		Rotate("Y")
	elseif Name == "Rotate2" then
		Rotate("X")
	elseif Name == "Rotate3" then
		Rotate("Z")
	end
end
function TouchTap(Positions,GPE)
	if DeviceVal == "Mobile" and not GPE and BuildingEnabled then
		local RecalculatedPosition = CalculateModelPosition(GetMouseTargetPosition())

		--check mobile buttons
		if not CheckMousePosition(UIS:GetMouseLocation()) then
			return
		end

		PlaceModel(RecalculatedPosition,false)
	end
end
function InputBegan(Input,GPE)
	if BuildingEnabled then
		if Input and not GPE then
			if Input.UserInputType == Enum.UserInputType.Keyboard then
				--Key pressed
				if Input.KeyCode == Enum.KeyCode.R then
					Rotate("Y")
				elseif Input.KeyCode == Enum.KeyCode.T then
					Rotate("X")
				elseif Input.KeyCode == Enum.KeyCode.Y or Input.KeyCode == Enum.KeyCode.Z then
					Rotate("Z")
				elseif Input.KeyCode == Enum.KeyCode.C then
					StopBuilding()
				elseif Input.KeyCode == Enum.KeyCode.LeftControl then
					SetLockHeight(true,GoalPosition.Y,GoalPosition.Y-(Model.PrimaryPart.Size.Y/2))
				elseif Input.KeyCode == Enum.KeyCode.U then
					Rotation = Vector3.new(0, 0, 0)
				end
			elseif Input.UserInputType == Enum.UserInputType.MouseButton1 then
				if not(DeviceVal == "Mobile") then
					--Check if player doesnt select any button
					for _,button in pairs(GUI:FindFirstChild("MainGui"):GetChildren()) do
						if button:IsA("GuiButton") then
							if button.Selected then
								return
							end
						end
					end

					--Mouse button 1 pressed
					local RecalculatedPosition = CalculateModelPosition(GetMouseTargetPosition())

					PlaceModel(RecalculatedPosition,false)

					spawn(function()
						while UIS:IsMouseButtonPressed(Enum.UserInputType.MouseButton1) and BuildingEnabled do
							CanPlace = true
							wait()
						end
						CanPlace = false
					end)
				end
			elseif Input.UserInputType == Enum.UserInputType.Gamepad1 then
				if Input.KeyCode == Enum.KeyCode.ButtonR2 then
					--Place button
					local RecalculatedPosition = CalculateModelPosition(GetMouseTargetPosition())

					PlaceModel(RecalculatedPosition,false)

					spawn(function()
						while UIS:IsGamepadButtonDown(Enum.UserInputType.Gamepad1, Enum.KeyCode.ButtonR2) and BuildingEnabled do
							CanPlace = true
							wait()
						end
						CanPlace = false
					end)
				elseif Input.KeyCode == Enum.KeyCode.ButtonX then
					Rotate("Y")	
				elseif Input.KeyCode == Enum.KeyCode.ButtonY then
					Rotate("X")
				elseif Input.KeyCode == Enum.KeyCode.ButtonB then
					StopBuilding()
				end
			end
		end
	end
end
function InputEnded(Input,GPE)
	if BuildingEnabled then
		if Input and not GPE then
			if Input.UserInputType == Enum.UserInputType.Keyboard then
				if Input.KeyCode == Enum.KeyCode.LeftControl then
					SetLockHeight(false)
				end
			end
		end
	end
end


game.ReplicatedStorage.Events.EditMode.UpdateStartingData.Event:Connect(UpdateStartingData)
game.ReplicatedStorage.Events.EditMode.BuildingButton.Event:Connect(Action)
game.ReplicatedStorage.Events.EditMode.StartBuilding.Event:Connect(Start)
game.ReplicatedStorage.Events.Sharing.CancelSharing.OnClientEvent:Connect(CancelSharing)
RS.Heartbeat:connect(MouseMove)
UIS.InputBegan:connect(InputBegan)
UIS.InputEnded:connect(InputEnded)
UIS.TouchTap:Connect(TouchTap)
