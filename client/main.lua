lib.locale()

local isOpen = false
local isOpening = false
local currentBank = nil
local nearAtm = false
local shownText = nil

local function updateText()
    local text

    if not isOpen then
        if currentBank then
            text = locale('textui_bank', Config.InteractKey)
        elseif nearAtm then
            text = locale('textui_atm', Config.InteractKey)
        end
    end

    if text == shownText then return end
    shownText = text

    if text then
        lib.showTextUI(text, { icon = currentBank and 'building-columns' or 'credit-card' })
    else
        lib.hideTextUI()
    end
end

local function closeBank()
    if not isOpen then return end

    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
    TriggerServerEvent('broid-bank:server:close')
    updateText()
end

local function openBank(mode, bankId)
    if isOpen or isOpening then return end

    isOpening = true
    local response = lib.callback.await('broid-bank:server:open', false, mode, bankId)
    isOpening = false

    if not response or not response.ok then
        lib.notify({ description = locale('error_' .. (response and response.error or 'unknown')), type = 'error' })
        return
    end

    isOpen = true
    updateText()
    SetNuiFocus(true, true)

    SendNUIMessage({
        action = 'open',
        data = {
            mode = mode,
            brand = Config.BrandName,
            location = response.location,
            currency = Config.CurrencySymbol,
            locale = lib.getLocales and lib.getLocales() or nil,
            limits = {
                max = Config.MaxAmount,
                atmWithdraw = Config.Atm.maxWithdraw,
                note = Config.NoteMaxLength,
            },
            account = response.account,
        },
    })
end

lib.addKeybind({
    name = 'broid_bank_interact',
    description = locale('keybind_desc'),
    defaultKey = Config.InteractKey,
    onPressed = function()
        if isOpen or cache.vehicle or IsPauseMenuActive() then return end

        if currentBank then
            openBank('bank', currentBank)
        elseif nearAtm then
            openBank('atm')
        end
    end,
})

for id, bank in ipairs(Config.Banks) do
    lib.points.new({
        coords = bank.coords,
        distance = Config.InteractDistance,
        onEnter = function()
            currentBank = id
            updateText()
        end,
        onExit = function()
            if currentBank == id then currentBank = nil end
            updateText()
        end,
    })

    if Config.Blip.enabled then
        local blip = AddBlipForCoord(bank.coords.x, bank.coords.y, bank.coords.z)
        SetBlipSprite(blip, Config.Blip.sprite)
        SetBlipColour(blip, Config.Blip.color)
        SetBlipScale(blip, Config.Blip.scale)
        SetBlipAsShortRange(blip, true)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentSubstringPlayerName(locale('blip_label'))
        EndTextCommandSetBlipName(blip)
    end
end

if Config.Atm.enabled then
    CreateThread(function()
        local models = Config.Atm.models

        while true do
            local found = false

            if not isOpen and not currentBank and not cache.vehicle then
                local coords = GetEntityCoords(cache.ped)

                for i = 1, #models do
                    if GetClosestObjectOfType(coords.x, coords.y, coords.z, Config.InteractDistance, models[i], false, false, false) ~= 0 then
                        found = true
                        break
                    end
                end
            end

            if found ~= nearAtm then
                nearAtm = found
                updateText()
            end

            Wait(found and 300 or 800)
        end
    end)
end

RegisterNUICallback('close', function(_, cb)
    closeBank()
    cb(1)
end)

for _, action in ipairs({ 'deposit', 'withdraw', 'transfer' }) do
    RegisterNUICallback(action, function(data, cb)
        cb(lib.callback.await('broid-bank:server:' .. action, false, data) or { ok = false, error = 'unknown' })
    end)
end

RegisterNetEvent('broid-bank:client:update', function(account)
    if not isOpen then return end
    SendNUIMessage({ action = 'update', data = account })
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', closeBank)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= cache.resource then return end

    if isOpen then SetNuiFocus(false, false) end
    if shownText then lib.hideTextUI() end
end)
