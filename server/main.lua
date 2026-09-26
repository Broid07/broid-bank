lib.locale()

local REASON = 'broid-bank'
local sessions = {}
local pendingUpdates = {}

local function getPlayer(source)
    return exports.qbx_core:GetPlayer(source)
end

local function fullName(player)
    local charinfo = player.PlayerData.charinfo
    return ('%s %s'):format(charinfo.firstname, charinfo.lastname)
end

local function formatMoney(amount)
    local separator = locale('thousands_separator')
    if separator == 'thousands_separator' then separator = ',' end

    local formatted = tostring(math.floor(amount)):reverse():gsub('(%d%d%d)', '%1' .. separator):reverse()
    if formatted:sub(1, #separator) == separator then formatted = formatted:sub(#separator + 1) end

    return Config.CurrencySymbol .. formatted
end

local function getTransactions(citizenid)
    return MySQL.query.await([[
        SELECT id, type, amount, party, note, UNIX_TIMESTAMP(created_at) AS date
        FROM broid_bank_transactions
        WHERE citizenid = ?
        ORDER BY id DESC
        LIMIT ?
    ]], { citizenid, Config.HistoryLimit }) or {}
end

local function logTransaction(citizenid, txType, amount, party, note)
    MySQL.insert.await(
        'INSERT INTO broid_bank_transactions (citizenid, type, amount, party, note) VALUES (?, ?, ?, ?, ?)',
        { citizenid, txType, amount, party, note }
    )
end

local function buildAccount(player, mode)
    local data = player.PlayerData

    return {
        name = fullName(player),
        account = data.charinfo.account or data.citizenid,
        cash = data.money.cash,
        bank = data.money.bank,
        -- ATM'de geçmiş gösterilmediği için sorguya gerek yok
        transactions = mode == 'bank' and getTransactions(data.citizenid) or {},
    }
end

local function pushUpdate(source)
    local session = sessions[source]
    local player = session and getPlayer(source)
    if not player then return end

    TriggerClientEvent('broid-bank:client:update', source, buildAccount(player, session.mode))
end

-- Arka arkaya gelen para değişikliklerinde tek güncelleme gönder
local function queueUpdate(source)
    if pendingUpdates[source] then return end
    pendingUpdates[source] = true

    SetTimeout(250, function()
        pendingUpdates[source] = nil
        pushUpdate(source)
    end)
end

local function parseAmount(value)
    local amount = tonumber(value)
    if not amount or amount ~= amount or amount < 1 or amount > Config.MaxAmount or math.floor(amount) ~= amount then
        return nil
    end

    return math.floor(amount)
end

local function sanitizeNote(note)
    if type(note) ~= 'string' or not utf8.len(note) then return nil end

    note = note:gsub('%c', ''):match('^%s*(.-)%s*$')

    local cut = utf8.offset(note, Config.NoteMaxLength + 1)
    if cut then note = note:sub(1, cut - 1) end

    return note ~= '' and note or nil
end

---Oturumu, mesafeyi ve bekleme süresini doğrular; ardından işlemi çalıştırır.
---@param action fun(player: table, session: table): string?, table?
local function runAction(source, actionName, action)
    local session = sessions[source]
    if not session then return { ok = false, error = 'not_allowed' } end
    if session.busy then return { ok = false, error = 'busy' } end

    local now = GetGameTimer()
    if now - session.lastAction < Config.Cooldown then return { ok = false, error = 'busy' } end

    if session.mode == 'atm' and actionName == 'transfer' then
        return { ok = false, error = 'not_allowed' }
    end

    if #(GetEntityCoords(GetPlayerPed(source)) - session.coords) > Config.MaxSessionDistance then
        return { ok = false, error = 'too_far' }
    end

    local player = getPlayer(source)
    if not player then return { ok = false, error = 'unknown' } end

    session.busy = true
    session.lastAction = now

    local ok, err, info = pcall(action, player, session)

    session.busy = false

    if not ok then
        lib.print.error(('%s işlemi başarısız (%s): %s'):format(actionName, source, err))
        return { ok = false, error = 'unknown' }
    end

    if err then return { ok = false, error = err } end

    return { ok = true, account = buildAccount(getPlayer(source) or player, session.mode), info = info }
end

lib.callback.register('broid-bank:server:open', function(source, mode, bankId)
    local player = getPlayer(source)
    if not player then return { ok = false, error = 'unknown' } end

    local pedCoords = GetEntityCoords(GetPlayerPed(source))
    local coords, label

    if mode == 'bank' then
        local bank = Config.Banks[tonumber(bankId)]
        if not bank then return { ok = false, error = 'not_allowed' } end

        -- Ağ gecikmesi için küçük bir pay bırakılır
        if #(pedCoords - bank.coords) > Config.InteractDistance + 3.0 then
            return { ok = false, error = 'too_far' }
        end

        coords, label = bank.coords, bank.label
    elseif mode == 'atm' and Config.Atm.enabled then
        -- ATM prop'ları sunucuda görünmediği için açıldığı konum referans alınır
        coords = pedCoords
    else
        return { ok = false, error = 'not_allowed' }
    end

    sessions[source] = { mode = mode, coords = coords, lastAction = 0, busy = false }

    return { ok = true, account = buildAccount(player, mode), location = label }
end)

lib.callback.register('broid-bank:server:deposit', function(source, data)
    return runAction(source, 'deposit', function(player)
        local amount = parseAmount(type(data) == 'table' and data.amount)
        if not amount then return 'invalid_amount' end
        if player.PlayerData.money.cash < amount then return 'insufficient_cash' end

        if not player.Functions.RemoveMoney('cash', amount, REASON .. ':deposit') then
            return 'insufficient_cash'
        end

        if not player.Functions.AddMoney('bank', amount, REASON .. ':deposit') then
            player.Functions.AddMoney('cash', amount, REASON .. ':refund')
            return 'unknown'
        end

        logTransaction(player.PlayerData.citizenid, 'deposit', amount)
    end)
end)

lib.callback.register('broid-bank:server:withdraw', function(source, data)
    return runAction(source, 'withdraw', function(player, session)
        local amount = parseAmount(type(data) == 'table' and data.amount)
        if not amount then return 'invalid_amount' end
        if session.mode == 'atm' and amount > Config.Atm.maxWithdraw then return 'atm_limit' end
        if player.PlayerData.money.bank < amount then return 'insufficient_bank' end

        if not player.Functions.RemoveMoney('bank', amount, REASON .. ':withdraw') then
            return 'insufficient_bank'
        end

        if not player.Functions.AddMoney('cash', amount, REASON .. ':withdraw') then
            player.Functions.AddMoney('bank', amount, REASON .. ':refund')
            return 'unknown'
        end

        logTransaction(player.PlayerData.citizenid, 'withdraw', amount)
    end)
end)

lib.callback.register('broid-bank:server:transfer', function(source, data)
    return runAction(source, 'transfer', function(player)
        if type(data) ~= 'table' then return 'invalid_amount' end

        -- Olay hedefi olarak kullanılacağı için 12.0 değil 12 olmalı
        local targetId = tonumber(data.target)
        targetId = targetId and math.tointeger(targetId)
        if not targetId then return 'player_not_found' end
        if targetId == source then return 'self_transfer' end

        local target = getPlayer(targetId)
        if not target then return 'player_not_found' end

        local amount = parseAmount(data.amount)
        if not amount then return 'invalid_amount' end
        if player.PlayerData.money.bank < amount then return 'insufficient_bank' end

        if not player.Functions.RemoveMoney('bank', amount, REASON .. ':transfer') then
            return 'insufficient_bank'
        end

        if not target.Functions.AddMoney('bank', amount, REASON .. ':transfer') then
            player.Functions.AddMoney('bank', amount, REASON .. ':refund')
            return 'unknown'
        end

        local note = sanitizeNote(data.note)
        local senderName, targetName = fullName(player), fullName(target)

        logTransaction(player.PlayerData.citizenid, 'transfer_out', amount, targetName, note)
        logTransaction(target.PlayerData.citizenid, 'transfer_in', amount, senderName, note)

        exports.qbx_core:Notify(targetId, locale('notify_transfer_received', senderName, formatMoney(amount)), 'success')

        if sessions[targetId] then queueUpdate(targetId) end

        return nil, { name = targetName }
    end)
end)

RegisterNetEvent('broid-bank:server:close', function()
    sessions[source] = nil
end)

AddEventHandler('playerDropped', function()
    sessions[source] = nil
    pendingUpdates[source] = nil
end)

-- Maaş, fatura, kartla ödeme gibi dışarıdan gelen banka hareketleri
AddEventHandler('QBCore:Server:OnMoneyChange', function(source, moneyType, amount, actionType, reason)
    if type(reason) == 'string' and reason:find(REASON, 1, true) == 1 then return end

    if Config.LogExternal and moneyType == 'bank' and (actionType == 'add' or actionType == 'remove') then
        amount = tonumber(amount)
        local player = getPlayer(source)

        if player and amount and amount > 0 then
            local note = reason ~= 'unknown' and sanitizeNote(reason) or nil

            CreateThread(function()
                logTransaction(player.PlayerData.citizenid, actionType == 'add' and 'other_in' or 'other_out', math.floor(amount), nil, note)
                if sessions[source] then queueUpdate(source) end
            end)

            return
        end
    end

    if sessions[source] then queueUpdate(source) end
end)

CreateThread(function()
    local schema = LoadResourceFile(cache.resource, 'sql/install.sql')
    if schema then MySQL.query.await(schema) end

    if Config.PruneDays > 0 then
        MySQL.query('DELETE FROM broid_bank_transactions WHERE created_at < NOW() - INTERVAL ? DAY', { Config.PruneDays })
    end
end)
