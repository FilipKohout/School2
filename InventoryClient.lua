--Created by Filip Kohout
--This script updates the inventory user interface

local module = {}

local plr = game.Players.LocalPlayer
local Plot = plr.Data.Plot.Value --Global value of the player's plot
local Gui = plr:WaitForChild("PlayerGui") --The player's interface

local Frame = script.Parent:WaitForChild("ScrollingFrame") --The frame(canvas) that will be parent of all the shown buttons 
local Template = script:WaitForChild("Example") --The button that's going to be clonned

local ButtonEffects = require(Gui:WaitForChild("Scripts"):WaitForChild("Effects")) --Module for button selection effect
local BuildHandler = require(plr.PlayerScripts.buildHanlder) --Module that manages the building
local Opener = require(Gui:WaitForChild("MainGui"):WaitForChild("Opener")) --Module that opens user interface

--Vizualization
local StarterOffset = CFrame.new(0, 1, -5)
local OffsetPerStudOfModelSize = CFrame.new(0, 0, 0)


function module:Update()
	module:ClearAll() --Clear all the buttons, so new ones can be added
	for _,item in pairs(plr.Inventory:GetChildren()) do	--Add the new buttons, loop all player's items
		module:AddItem(item.Name,item.Value)
	end
	Frame.CanvasSize = UDim2.new(0,0,0,Frame.UIGridLayout.AbsoluteContentSize.Y+25) --Update the scrolling canvas size
end

function module:ClearAll()
	for _,item in pairs(Frame:GetChildren()) do	
		if item:IsA("ImageButton") then
			item:Destroy()
		end
	end
end

function module:AddItem(Item, Number) -- Not preferred, use the update function
	if game.ReplicatedStorage.Models:FindFirstChild(Item) then
		local Ex = Template:Clone() --Create the button
		Ex.Name = Item
		Ex.Number.Text = Number --Set the number text, so the player can see how many items he has
		
    --Vizualization of the item on the buttton
		local Cam = Ex:FindFirstChild("Camera") and Ex:FindFirstChild("Camera") or Instance.new("Camera", Ex) --Creates a virtual camera
		local Object = game.ReplicatedStorage.Models:FindFirstChild(Item):Clone() --Creates a 3D virtual item in the user iterface
		local ModelSize = Object:GetExtentsSize() --The size of the model
		
		Object.Parent = Ex.ViewportFrame 
		Ex.ViewportFrame.CurrentCamera = Cam --Set up the virtual camera
    --Make sure the item fits on the button and can be seen using the virtual camera
		Cam.CFrame = Object.PrimaryPart.CFrame * CFrame.new(StarterOffset.X+(ModelSize.X*OffsetPerStudOfModelSize.X),StarterOffset.Y+(ModelSize.Y*OffsetPerStudOfModelSize.Y),StarterOffset.Z+(ModelSize.Z*OffsetPerStudOfModelSize.Z)) *  CFrame.Angles(math.rad(15), math.rad(180), 0)

		Ex.Parent = Frame --Finalize the button
		
    --Set up the selection effect
		ButtonEffects:SetUpButtonEffect({
			Button = Ex,
			Scale = true,
		})
		
    --Set up the click event
		Ex.MouseButton1Click:Connect(function()
			Opener:Close("Inventory") --Close the inventory interface
			BuildHandler.enableBuild(Item) --Enabled the building system
		end)
	end	
end

return module
