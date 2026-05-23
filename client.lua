local Builder = {
    Slots   = {},   -- [id] = looped handle (number)
    Playing = false,
}

-- ─────────────── helpers ───────────────

local function LoadAsset(dict)
    if HasNamedPtfxAssetLoaded(dict) then return end
    RequestNamedPtfxAsset(dict)
    local t = GetGameTimer()
    while not HasNamedPtfxAssetLoaded(dict) do
        if GetGameTimer() - t > 5000 then return end
        Citizen.Wait(10)
    end
end

local function StartSlot(slot)
    -- stop old handle for this id
    local old = Builder.Slots[slot.id]
    if old and DoesParticleFxLoopedExist(old) then
        RemoveParticleFx(old, false)
    end

    LoadAsset(slot.dict)
    UseParticleFxAssetNextCall(slot.dict)

    local ped = PlayerPedId()
    local handle = StartParticleFxLoopedOnPedBone(
        slot.fx,
        ped,
        slot.offset.x + 0.0,
        slot.offset.y + 0.0,
        slot.offset.z + 0.0,
        slot.rotation.x + 0.0,
        slot.rotation.y + 0.0,
        slot.rotation.z + 0.0,
        slot.bone,
        slot.scale + 0.0,
        false, false, false
    )

    Builder.Slots[slot.id] = handle

    if slot.color then
        SetParticleFxLoopedColour(handle,
            slot.color.r + 0.0,
            slot.color.g + 0.0,
            slot.color.b + 0.0,
            false)
        SetParticleFxLoopedAlpha(handle, slot.color.a + 0.0)
    end

    if slot.evolution then
        for k, v in pairs(slot.evolution) do
            SetParticleFxLoopedEvolution(handle, k, v + 0.0, false)
        end
    end
end

local function StopSlot(id)
    local h = Builder.Slots[id]
    if h and DoesParticleFxLoopedExist(h) then
        RemoveParticleFx(h, false)
    end
    Builder.Slots[id] = nil
end

local function StopAll()
    for _, h in pairs(Builder.Slots) do
        if DoesParticleFxLoopedExist(h) then
            RemoveParticleFx(h, false)
        end
    end
    Builder.Slots = {}
end

-- ─────────────── NUI callbacks ───────────────

RegisterNUICallback('SET_CURSOR_STATE', function(data, cb)
    if data.state then
        SetNuiFocus(true, true)
        InvalidateIdleCam()
        InvalidateVehicleIdleCam()
        DisableIdleCamera(true)
    else
        SetNuiFocus(false, false)
        DisableIdleCamera(false)
    end
    cb({})
end)

RegisterNUICallback('SET_ALL_PLAYING', function(data, cb)
    Builder.Playing = true
    for _, slot in ipairs(data.slots) do
        StartSlot(slot)
    end
    cb({})
end)

RegisterNUICallback('STOP_ALL', function(_, cb)
    Builder.Playing = false
    StopAll()
    cb({})
end)

RegisterNUICallback('ADD_PARTICLE_SLOT', function(data, cb)
    if Builder.Playing then
        StartSlot(data.slot)
    end
    cb({})
end)

RegisterNUICallback('REMOVE_PARTICLE_SLOT', function(data, cb)
    StopSlot(data.id)
    cb({})
end)

-- restart (bone/offset/rotation/particle changed)
RegisterNUICallback('UPDATE_SLOT_TRANSFORM', function(data, cb)
    if Builder.Playing then
        StartSlot(data.slot)
    end
    cb({})
end)

RegisterNUICallback('UPDATE_SLOT_SCALE', function(data, cb)
    local h = Builder.Slots[data.id]
    if h and DoesParticleFxLoopedExist(h) then
        SetParticleFxLoopedScale(h, data.scale + 0.0)
    end
    cb({})
end)

RegisterNUICallback('UPDATE_SLOT_COLOR', function(data, cb)
    local h = Builder.Slots[data.id]
    if h and DoesParticleFxLoopedExist(h) then
        SetParticleFxLoopedColour(h,
            data.color.r + 0.0,
            data.color.g + 0.0,
            data.color.b + 0.0,
            false)
        SetParticleFxLoopedAlpha(h, data.color.a + 0.0)
    end
    cb({})
end)

RegisterNUICallback('UPDATE_SLOT_EVOLUTION', function(data, cb)
    local h = Builder.Slots[data.id]
    if h and DoesParticleFxLoopedExist(h) then
        SetParticleFxLoopedEvolution(h, data.name, data.value + 0.0, false)
    end
    cb({})
end)

-- ─────────────── preview ───────────────

local previewHandle = nil
local previewToken  = 0

RegisterNUICallback('PREVIEW_PARTICLE', function(data, cb)
    -- stop any running preview
    if previewHandle and DoesParticleFxLoopedExist(previewHandle) then
        RemoveParticleFx(previewHandle, false)
        previewHandle = nil
    end

    LoadAsset(data.dict)
    UseParticleFxAssetNextCall(data.dict)

    local ped = PlayerPedId()
    local fwd = GetEntityForwardVector(ped)
    local pos = GetEntityCoords(ped, false)

    previewHandle = StartParticleFxLoopedAtCoord(
        data.fx,
        pos.x + fwd.x * 1.2,
        pos.y + fwd.y * 1.2,
        pos.z + 0.9,
        0.0, 0.0, 0.0,
        1.0, false, false, false, false
    )

    previewToken = previewToken + 1
    local myToken = previewToken

    Citizen.CreateThread(function()
        Citizen.Wait(3000)
        if previewToken == myToken then
            if previewHandle and DoesParticleFxLoopedExist(previewHandle) then
                RemoveParticleFx(previewHandle, false)
                previewHandle = nil
            end
            SendNUIMessage({ event = 'PREVIEW_STOPPED' })
        end
    end)

    cb({})
end)

RegisterNUICallback('STOP_PREVIEW', function(_, cb)
    previewToken = previewToken + 1
    if previewHandle and DoesParticleFxLoopedExist(previewHandle) then
        RemoveParticleFx(previewHandle, false)
        previewHandle = nil
    end
    cb({})
end)

-- ─────────────── open / close ───────────────

local function Send(event, state)
    SendNUIMessage({ event = event, state = state })
end

RegisterCommand('pb_open', function()  Send('SET_OPEN_STATE', true)  end, false)
RegisterCommand('pb_close', function() Send('SET_OPEN_STATE', false) end, false)

exports('Open',  function() Send('SET_OPEN_STATE', true)  end)
exports('Close', function() Send('SET_OPEN_STATE', false) end)
