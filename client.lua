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

-- ─────────────── animations ───────────────

local animState = nil

local function LoadAnimDict(dict)
    if HasAnimDictLoaded(dict) then return end
    RequestAnimDict(dict)
    local t = GetGameTimer()
    while not HasAnimDictLoaded(dict) do
        if GetGameTimer() - t > 5000 then return end
        Citizen.Wait(10)
    end
end

RegisterNUICallback('PLAY_ANIM', function(data, cb)
    local ped = PlayerPedId()
    LoadAnimDict(data.dict)
    TaskPlayAnim(
        ped,
        data.dict,
        data.anim,
        data.blendIn      + 0.0,
        data.blendOut     + 0.0,
        math.floor(data.duration),
        math.floor(data.flags),
        data.playbackRate + 0.0,
        false, false, false
    )
    animState = data
    cb({})
end)

RegisterNUICallback('STOP_ANIM', function(_, cb)
    if animState then
        StopAnimTask(PlayerPedId(), animState.dict, animState.anim, -8.0)
        animState = nil
    end
    cb({})
end)

RegisterNUICallback('UPDATE_ANIM_SPEED', function(data, cb)
    if animState then
        SetEntityAnimSpeed(PlayerPedId(), animState.dict, animState.anim, data.playbackRate + 0.0)
        animState.playbackRate = data.playbackRate
    end
    cb({})
end)

-- ─────────────── victim ped ───────────────

local victimPed       = nil
local victimAnimState = nil

local function GetVictimCoords(data)
    local ped  = PlayerPedId()
    local pos  = GetEntityCoords(ped, false)
    local fwd  = GetEntityForwardVector(ped)
    -- right vector = fwd rotated 90° clockwise in XY
    local rx, ry = fwd.y, -fwd.x

    local wx = pos.x + fwd.x * data.offsetY + rx * data.offsetX
    local wy = pos.y + fwd.y * data.offsetY + ry * data.offsetX
    local wz = pos.z + data.offsetZ
    local wh = GetEntityHeading(ped) + data.heading

    return wx, wy, wz, wh
end

RegisterNUICallback('SPAWN_VICTIM_PED', function(data, cb)
    -- delete any existing victim
    if victimPed and DoesEntityExist(victimPed) then
        ClearPedTasks(victimPed)
        DeleteEntity(victimPed)
        victimPed = nil
    end

    local model = GetHashKey(data.model)

    RequestModel(model)
    local t = GetGameTimer()
    while not HasModelLoaded(model) do
        if GetGameTimer() - t > 5000 then
            cb({ ok = false })
            return
        end
        Citizen.Wait(10)
    end

    local wx, wy, wz, wh = GetVictimCoords(data)

    victimPed = CreatePed(4, model, wx, wy, wz, wh, false, false)
    SetEntityInvincible(victimPed, true)
    SetBlockingOfNonTemporaryEvents(victimPed, true)
    SetPedCanRagdoll(victimPed, false)
    SetModelAsNoLongerNeeded(model)

    cb({ ok = true })
end)

RegisterNUICallback('DESPAWN_VICTIM_PED', function(_, cb)
    if victimPed and DoesEntityExist(victimPed) then
        ClearPedTasks(victimPed)
        DeleteEntity(victimPed)
        victimPed = nil
    end
    victimAnimState = nil
    cb({})
end)

RegisterNUICallback('UPDATE_VICTIM_TRANSFORM', function(data, cb)
    if not victimPed or not DoesEntityExist(victimPed) then cb({}) return end
    local wx, wy, wz, wh = GetVictimCoords(data)
    SetEntityCoords(victimPed, wx, wy, wz, false, false, false, false)
    SetEntityHeading(victimPed, wh)
    cb({})
end)

RegisterNUICallback('PLAY_VICTIM_ANIM', function(data, cb)
    if not victimPed or not DoesEntityExist(victimPed) then cb({}) return end
    LoadAnimDict(data.dict)
    TaskPlayAnim(
        victimPed,
        data.dict,
        data.anim,
        data.blendIn      + 0.0,
        data.blendOut     + 0.0,
        math.floor(data.duration),
        math.floor(data.flags),
        data.playbackRate + 0.0,
        false, false, false
    )
    victimAnimState = data
    cb({})
end)

RegisterNUICallback('STOP_VICTIM_ANIM', function(_, cb)
    if victimAnimState and victimPed and DoesEntityExist(victimPed) then
        StopAnimTask(victimPed, victimAnimState.dict, victimAnimState.anim, -8.0)
        victimAnimState = nil
    end
    cb({})
end)

RegisterNUICallback('UPDATE_VICTIM_SPEED', function(data, cb)
    if victimAnimState and victimPed and DoesEntityExist(victimPed) then
        SetEntityAnimSpeed(victimPed, victimAnimState.dict, victimAnimState.anim, data.playbackRate + 0.0)
        victimAnimState.playbackRate = data.playbackRate
    end
    cb({})
end)

-- ─────────────── props ───────────────

local Props = {}  -- [id] = entity handle

local function LoadPropModel(hash)
    if HasModelLoaded(hash) then return true end
    RequestModel(hash)
    local t = GetGameTimer()
    while not HasModelLoaded(hash) do
        if GetGameTimer() - t > 5000 then return false end
        Citizen.Wait(10)
    end
    return true
end

local function SpawnProp(slot)
    local old = Props[slot.id]
    if old and DoesEntityExist(old) then
        DeleteEntity(old)
        Props[slot.id] = nil
    end

    local hash = GetHashKey(slot.model)
    if not LoadPropModel(hash) then return end

    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped, false)
    local obj = CreateObject(hash, pos.x, pos.y, pos.z, false, false, false)
    SetModelAsNoLongerNeeded(hash)
    SetEntityVisible(obj, slot.visible, false)

    local boneIdx = GetPedBoneIndex(ped, slot.bone)
    AttachEntityToEntity(
        obj, ped, boneIdx,
        slot.offset.x + 0.0,   slot.offset.y + 0.0,   slot.offset.z + 0.0,
        slot.rotation.x + 0.0, slot.rotation.y + 0.0, slot.rotation.z + 0.0,
        false, false, false, false, 2, true
    )

    Props[slot.id] = obj
end

local function RemoveProp(id)
    local h = Props[id]
    if h and DoesEntityExist(h) then
        DetachEntity(h, true, true)
        DeleteEntity(h)
    end
    Props[id] = nil
end

local function RemoveAllProps()
    for _, h in pairs(Props) do
        if DoesEntityExist(h) then
            DetachEntity(h, true, true)
            DeleteEntity(h)
        end
    end
    Props = {}
end

RegisterNUICallback('SPAWN_PROP', function(data, cb)
    SpawnProp(data.slot)
    cb({})
end)

RegisterNUICallback('REMOVE_PROP', function(data, cb)
    RemoveProp(data.id)
    cb({})
end)

RegisterNUICallback('UPDATE_PROP_TRANSFORM', function(data, cb)
    local h = Props[data.slot.id]
    if not h or not DoesEntityExist(h) then cb({}) return end
    local ped = PlayerPedId()
    local boneIdx = GetPedBoneIndex(ped, data.slot.bone)
    AttachEntityToEntity(
        h, ped, boneIdx,
        data.slot.offset.x + 0.0,   data.slot.offset.y + 0.0,   data.slot.offset.z + 0.0,
        data.slot.rotation.x + 0.0, data.slot.rotation.y + 0.0, data.slot.rotation.z + 0.0,
        false, false, false, false, 2, true
    )
    cb({})
end)

RegisterNUICallback('TOGGLE_PROP_VISIBLE', function(data, cb)
    local h = Props[data.id]
    if h and DoesEntityExist(h) then
        SetEntityVisible(h, data.visible, false)
    end
    cb({})
end)

RegisterNUICallback('SPAWN_ALL_PROPS', function(data, cb)
    for _, slot in ipairs(data.slots) do
        SpawnProp(slot)
    end
    cb({})
end)

RegisterNUICallback('REMOVE_ALL_PROPS', function(_, cb)
    RemoveAllProps()
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
