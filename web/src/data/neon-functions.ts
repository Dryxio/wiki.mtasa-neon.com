import {
  neonCategories as baseNeonCategories,
  neonFunctions as baseNeonFunctions,
  neonTaskGroups,
} from './neon-functions-base';
import type {
  NeonArgument,
  NeonFunction as BaseNeonFunction,
  NeonNativeTask,
  NeonSide,
  NeonTaskGroup,
} from './neon-functions-base';

export { neonTaskGroups };
export type { NeonArgument, NeonNativeTask, NeonSide, NeonTaskGroup };

export const neonCategories = {
  ...baseNeonCategories,
  mapping: {
    title: 'SA-MP maps and object streaming',
    guide: '/neon/samp-maps',
    test: 'test-resources/samp-map-loader',
    lifecycle: 'Parsing creates inert data. Objects, custom models, material overrides, removals, and any temporary streaming-limit split remain owned by the calling client resource and must be cleaned up when that resource stops.',
  },
  radio: {
    title: 'Native GTA radio playback',
    guide: '/neon/native-radio',
    test: 'test-resources/native-radio-playback',
    lifecycle: 'The snapshot describes one client\'s native GTA radio manager. Neon does not synchronize it automatically; a resource that wants shared playback must relay and restore snapshots itself.',
  },
  visuals: {
    title: 'Neon client visuals',
    guide: '/neon/skygfx',
    test: null,
    lifecycle: 'Visual overrides belong to the calling client resource, stack by resource ownership, never replace the player\'s saved preferences, and are removed automatically when the resource stops.',
  },
  browser: {
    title: 'External browser integration',
    guide: '/neon/client-experience',
    test: null,
    lifecycle: 'External URLs are opened only when the HTTPS destination is allowed by the client browser-domain permission state or is a fixed first-party exception. The call creates no persistent handle.',
  },
} as const;

export type NeonFunction = Omit<BaseNeonFunction, 'category'> & {
  category: keyof typeof neonCategories;
};

const arg = (name: string, type: string, description: string, optional = false, defaultValue?: string): NeonArgument => ({
  name,
  type,
  description,
  optional,
  default: defaultValue,
});

const updates: NeonFunction[] = [
  {
    name: 'getAmbientPedSpawnCandidate', category: 'population', side: 'client',
    signature: 'table|false, string? getAmbientPedSpawnCandidate(Vector3 origin [, string selection = "auto", int gangId = -1])',
    summary: 'Asks GTA for one read-only civilian, gang, or dealer spawn proposal using the current native population state.',
    arguments: [
      arg('origin', 'Vector3', 'Finite population origin.'),
      arg('selection', 'string', 'auto, civilian, gang, or dealer.', true, '"auto"'),
      arg('gangId', 'int', 'Required only for gang selection; supported native gang IDs are 0 through 7.', true, '-1'),
    ],
    returns: 'A candidate table with model, pedType, position, direction, pathLerp, populationClass, and gang; or false plus a bounded miss reason.',
    notes: ['The function creates no ped and grants no authority.', 'Forced gang or dealer queries do not silently fall back to civilians.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaWorldDefs.cpp', commit: '083927c23', test: 'test-resources/native-ped-traffic',
    example: 'local candidate = getAmbientPedSpawnCandidate(localPlayer.position, "dealer")\nif candidate then\n    outputDebugString(("dealer model: %d"):format(candidate.model))\nend',
  },
  {
    name: 'getAmbientPedPopulationProfile', category: 'population', side: 'client',
    signature: 'table|false getAmbientPedPopulationProfile()',
    summary: 'Returns GTA\'s current ambient population targets, zone state, density multipliers, and gang weights.',
    returns: 'A table containing civilian, cop, gang and dealer targets, supportedTarget, density and creation-distance fields, zone metadata, and ten gang weights; false when the native population state is not active.',
    notes: ['The profile is read-only. A server still decides how many shared MTA peds to create.', 'dealerTarget is part of the current native popcycle calculation even though dealers are not counted as ordinary GTA total-ped occupancy.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaWorldDefs.cpp', commit: '083927c23', test: 'test-resources/native-ped-traffic',
  },
  {
    name: 'resetAmbientPedPopulationZonesToBootstrap', category: 'population', side: 'client',
    signature: 'bool resetAmbientPedPopulationZonesToBootstrap()',
    summary: "Restores the stock main.scm population-zone bootstrap inside Neon's reversible population world state.",
    returns: 'true when the bootstrap state was restored; false when the population world is not available.',
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaWorldDefs.cpp', commit: '1004257b9', test: 'test-resources/native-ped-traffic',
  },
  {
    name: 'setAmbientPedPopulationZoneState', category: 'population', side: 'client',
    signature: 'bool setAmbientPedPopulationZoneState(string zoneLabel, table state)',
    summary: 'Overrides selected native population fields for one GTA navigation zone inside the reversible population world state.',
    arguments: [
      arg('zoneLabel', 'string', 'GTA navigation-zone label.'),
      arg('state', 'table', 'Optional populationType, races, dealerStrength, noCops and gangStrengths fields.'),
    ],
    returns: 'true when the named zone and supplied fields were accepted; false otherwise.',
    notes: ['Only fields present in the table are changed.', 'Use resetAmbientPedPopulationZonesToBootstrap to return to the stock campaign bootstrap.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaWorldDefs.cpp', commit: '1004257b9', test: 'test-resources/native-ped-traffic',
  },
  {
    name: 'isAmbientPedSphereVisible', category: 'population', side: 'client',
    signature: 'bool isAmbientPedSphereVisible(Vector3 position, float radius)',
    summary: 'Runs GTA\'s camera-frustum sphere test without creating an entity.',
    arguments: [arg('position', 'Vector3', 'Sphere center.'), arg('radius', 'float', 'Sphere radius.')],
    returns: 'true when the sphere is visible to the current GTA camera; false otherwise.',
    notes: ['The reference population resource uses this as one input to a multi-client spawn veto.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaWorldDefs.cpp', commit: '75dd85f77', test: 'test-resources/native-ped-traffic',
  },
  {
    name: 'getAmbientPedGangGroupCandidate', category: 'population', side: 'client',
    signature: 'table|false, string? getAmbientPedGangGroupCandidate(Vector3 origin, int gangId [, int maxMembers = 4])',
    summary: 'Asks GTA for a native ambient gang-group placement with two to four proposed members.',
    arguments: [arg('origin', 'Vector3', 'Finite population origin.'), arg('gangId', 'int', 'Supported native gang ID from 0 through 7.'), arg('maxMembers', 'int', 'Maximum proposed group size from 2 through 4.', true, '4')],
    returns: 'An array of member candidates with model, pedType, position, heading and gang metadata; or false plus a bounded miss reason.',
    notes: ['This is a placement oracle only. The server must validate and create the real group elements.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaWorldDefs.cpp', commit: '39f782fd9', test: 'test-resources/native-ped-traffic',
  },
  {
    name: 'acquirePedNativeGroup', category: 'population', side: 'client', group: 'movement',
    signature: 'int|false acquirePedNativeGroup(table peds, string profile)',
    summary: 'Places two to five locally simulated script peds into one owner-only GTA native ambient group.',
    arguments: [arg('peds', 'table', 'Array of two to five script peds simulated by this client.'), arg('profile', 'string', 'Currently ambient-random.')],
    returns: 'A resource-private group token, or false when membership, ownership, streaming, or native group-slot checks fail.',
    notes: ['The token is resource-owned and must be reacquired after a syncer handoff.', 'Only the current owner runs the native group intelligence.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaPedDefs.cpp', commit: '39f782fd9', test: 'test-resources/native-ai-test-harness',
  },
  {
    name: 'releasePedNativeGroup', category: 'population', side: 'client', group: 'movement',
    signature: 'bool releasePedNativeGroup(int token)',
    summary: 'Releases a native ambient group token owned by the calling resource.',
    arguments: [arg('token', 'int', 'Token returned by acquirePedNativeGroup.')],
    returns: 'true when the owned group was released; false for an unknown, stale, or foreign token.',
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaPedDefs.cpp', commit: '39f782fd9', test: 'test-resources/native-ai-test-harness',
  },
  {
    name: 'isPedNativeGroupActive', category: 'population', side: 'client', group: 'movement',
    signature: 'bool isPedNativeGroupActive(int token)',
    summary: 'Reports whether the calling resource still owns a live native ambient group.',
    arguments: [arg('token', 'int', 'Group token.')],
    returns: 'true only while the resource and native group lease are current.',
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaPedDefs.cpp', commit: '39f782fd9', test: 'test-resources/native-ai-test-harness',
  },
  {
    name: 'getPedNativeGroupDiagnostic', category: 'population', side: 'client', group: 'movement',
    signature: 'table|false getPedNativeGroupDiagnostic(int token)',
    summary: 'Returns focused ownership and native-member diagnostics for one ambient group token.',
    arguments: [arg('token', 'int', 'Group token owned by the calling resource.')],
    returns: 'A diagnostic table with active/reason, group/member state and task pointers; false when no resource context exists.',
    notes: ['This is a debugging surface, not gameplay state to synchronize.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaPedDefs.cpp', commit: '39f782fd9', test: 'test-resources/native-ai-test-harness',
  },
  {
    name: 'addPedNativeBikeJackTask', category: 'population', side: 'client', group: 'combat',
    signature: 'bool addPedNativeBikeJackTask(player victim, ped jacker, vehicle bike, int door, int draggedPedDownTime, bool victimIsDriver, int token)',
    summary: 'Installs GTA\'s canonical bike-jacked task on the authoritative local player after a synchronized ambient gang carjack is validated.',
    arguments: [
      arg('victim', 'player', 'Local player currently occupying the target bike.'),
      arg('jacker', 'ped', 'Ambient script ped that owns the validated native event profile.'),
      arg('bike', 'vehicle', 'Bike, BMX, or quadbike being jacked.'),
      arg('door', 'int', 'Canonical native bike door index 10 or 11.'),
      arg('draggedPedDownTime', 'int', 'Canonical task value: 0 for the driver or 200 for the passenger path.'),
      arg('victimIsDriver', 'bool', 'Whether the local victim occupies the driver seat.'),
      arg('token', 'int', 'Native event-profile lease token for the jacker.'),
    ],
    returns: 'true when the owner-authorized native task was queued on the local victim; false when seat, vehicle, token, or task validation fails.',
    notes: ['This is the low-level victim-side bridge used by synchronized ambient carjacks; ordinary gameplay resources normally use the higher-level population runtime instead.'],
    nativeTask: { tasks: ['CTaskSimpleBikeJacked'], note: 'GTA owns the BIKE_HIT/knock-off lifecycle after the validated task is installed.' },
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaPedDefs.cpp', commit: '53478fdb3', test: 'test-resources/native-ai-test-harness',
  },

  {
    name: 'engineParseSAMPMap', category: 'mapping', side: 'client',
    signature: 'table engineParseSAMPMap(string source)',
    summary: 'Parses Texture Studio / SA-MP Pawn map source into inert objects, building removals, material overrides, and diagnostics.',
    arguments: [arg('source', 'string', 'Complete Pawn map source text.')],
    returns: 'A result table with success, counts, objects, removedBuildings and diagnostics.',
    notes: ['Parsing does not create elements or load models.', 'Object records preserve virtual world, interior, stream/draw distance and source location metadata.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaEngineDefs.cpp', commit: '28dfcff23', test: 'test-resources/samp-map-loader',
    example: 'local parsed = engineParseSAMPMap(mapSource)\nif not parsed.success then\n    outputDebugString(parsed.diagnostics[1].message, 1)\nend',
  },
  {
    name: 'engineGetTXDIDFromName', category: 'mapping', side: 'client',
    signature: 'int|false engineGetTXDIDFromName(string txdName)',
    summary: 'Resolves a loaded GTA texture-dictionary name to its current TXD slot.',
    arguments: [arg('txdName', 'string', 'Texture dictionary name used by the map/material description.')],
    returns: 'The current TXD slot ID, or false when the dictionary is not registered.',
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaEngineDefs.cpp', commit: '28dfcff23', test: 'test-resources/samp-map-loader',
  },
  {
    name: 'setObjectMaterial', category: 'mapping', side: 'client',
    signature: 'bool setObjectMaterial(object theObject, int slot, int sourceModel, string txdName, string textureName [, int materialColor = 0])',
    summary: 'Applies an SA-MP-style texture and/or color override to one DFF material slot on a client object.',
    arguments: [
      arg('theObject', 'object', 'Client object to modify.'),
      arg('slot', 'int', 'Material slot from 0 through 15.'),
      arg('sourceModel', 'int', 'Model that owns the source TXD, or 0/-1 for color-only behavior.'),
      arg('txdName', 'string', 'Source TXD name.'),
      arg('textureName', 'string', 'Source texture name; none may be used for color-only behavior.'),
      arg('materialColor', 'int', 'SA-MP ARGB material color; 0 preserves the target color.', true, '0'),
    ],
    returns: 'true when the material definition and source texture were accepted; false otherwise.',
    notes: ['The override survives object stream-out and is reapplied when the GTA object is recreated.', 'Slot N is applied to material N on every atomic in the model, matching SA-MP indexing.'],
    oop: ['object:setMaterial(slot, sourceModel, txdName, textureName, materialColor)'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaObjectDefs.cpp', commit: '28dfcff23', test: 'test-resources/samp-map-loader',
  },
  {
    name: 'removeObjectMaterial', category: 'mapping', side: 'client',
    signature: 'bool removeObjectMaterial(object theObject, int slot)',
    summary: 'Removes one SA-MP-style material-slot override from a client object.',
    arguments: [arg('theObject', 'object', 'Client object.'), arg('slot', 'int', 'Material slot from 0 through 15.')],
    returns: 'true when the slot was valid and reset.',
    oop: ['object:removeMaterial(slot)'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaObjectDefs.cpp', commit: '28dfcff23', test: 'test-resources/samp-map-loader',
  },
  {
    name: 'engineSetObjectStreamingLimits', category: 'mapping', side: 'client',
    signature: 'bool engineSetObjectStreamingLimits(int maxObjects, int maxLowLodObjects)',
    summary: 'Redistributes MTA\'s fixed 1000-slot object streaming budget between normal and low-LOD objects.',
    arguments: [arg('maxObjects', 'int', 'Maximum normal streamed objects.'), arg('maxLowLodObjects', 'int', 'Maximum low-LOD streamed objects.')],
    returns: 'true when the split is valid; invalid values raise an argument error.',
    notes: ['The combined limit cannot exceed 1000.', 'The default split remains 500/500.', 'Lowering a category below current usage restreams that category so the new quota takes effect.'],
    oop: ['Engine.setObjectStreamingLimits(maxObjects, maxLowLodObjects)'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaEngineDefs.cpp', commit: 'c1d052e9d', test: 'test-resources/object-streaming-limits',
    example: 'engineSetObjectStreamingLimits(1000, 0)',
  },
  {
    name: 'engineGetObjectStreamingLimits', category: 'mapping', side: 'client',
    signature: 'int, int, int engineGetObjectStreamingLimits()',
    summary: 'Returns the current normal-object quota, low-LOD quota, and fixed combined maximum.',
    returns: 'maxObjects, maxLowLodObjects, hardMaximum.',
    oop: ['Engine.getObjectStreamingLimits()'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaEngineDefs.cpp', commit: 'c1d052e9d', test: 'test-resources/object-streaming-limits',
  },

  {
    name: 'getRadioPlaybackState', category: 'radio', side: 'client',
    signature: 'table|false getRadioPlaybackState()',
    summary: 'Captures GTA\'s current native radio station, track, playback position, flags, and queued track state.',
    returns: 'A complete playback snapshot with radioOn, station, mode, trackId, trackType, trackIndex, position, length, flags and queue; false when the native manager is unavailable.',
    notes: ['This is GTA radio state, not an MTA sound element.', 'The snapshot is client-local until a resource chooses to synchronize it.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaRadioPlaybackDefs.cpp', commit: 'ebd8931b9', test: 'test-resources/native-radio-playback',
    example: 'local saved = getRadioPlaybackState()\n-- later\nif saved then setRadioPlaybackState(saved) end',
  },
  {
    name: 'setRadioPlaybackState', category: 'radio', side: 'client',
    signature: 'bool setRadioPlaybackState(table state)',
    summary: 'Restores a validated native GTA radio playback snapshot, including the requested seek position and queue.',
    arguments: [arg('state', 'table', 'A complete snapshot compatible with getRadioPlaybackState().')],
    returns: 'true when GTA accepted the requested playback state; false when the snapshot is incomplete, out of range, or the manager is unavailable.',
    notes: ['Neon lets GTA finish its asynchronous stopping transition before applying the requested restore, avoiding silent restore races.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaRadioPlaybackDefs.cpp', commit: 'ebd8931b9', test: 'test-resources/native-radio-playback',
  },

  {
    name: 'getNeonClientSetting', category: 'visuals', side: 'client',
    signature: 'bool|number|string getNeonClientSetting(string name)',
    summary: 'Reads one allowlisted effective Neon radar or SkyGFX setting.',
    arguments: [arg('name', 'string', 'Allowlisted radar.* or skygfx.* setting name.')],
    returns: 'The effective boolean, number, or string value; false for an unknown setting.',
    notes: ['Readable settings include radar style/position/size and SkyGFX status/effect fields.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaClientDefs.cpp', commit: 'fb8ee02c4', test: null,
  },
  {
    name: 'setNeonClientSetting', category: 'visuals', side: 'client',
    signature: 'bool setNeonClientSetting(string name, bool|number|string value)',
    summary: 'Applies a resource-owned session override for an allowlisted Neon radar or SkyGFX setting.',
    arguments: [arg('name', 'string', 'Allowlisted setting name.'), arg('value', 'bool|number|string', 'Value with the type and range required by that setting.')],
    returns: 'true when the override was validated and applied; false otherwise.',
    notes: ['Overrides never overwrite the player\'s saved preference.', 'Setting radar.style also applies the neutral Neon radar geometry baseline for that profile.', 'Later resource overrides stack; stopping a resource reveals the previous effective value.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaClientDefs.cpp', commit: 'fb8ee02c4', test: null,
    example: 'setNeonClientSetting("radar.style", "definitive")',
  },
  {
    name: 'resetNeonClientSettings', category: 'visuals', side: 'client',
    signature: 'bool resetNeonClientSettings()',
    summary: 'Clears every Neon visual override owned by the calling resource.',
    returns: 'true when a valid client resource released its overrides; false without resource context.',
    notes: ['Resource shutdown performs the same cleanup automatically.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaClientDefs.cpp', commit: 'fb8ee02c4', test: null,
  },

  {
    name: 'openExternalURL', category: 'browser', side: 'client',
    signature: 'bool openExternalURL(string url)',
    summary: 'Opens an approved HTTPS destination in the operating system browser without exposing arbitrary shell execution.',
    arguments: [arg('url', 'string', 'HTTPS URL up to 4096 characters.')],
    returns: 'true when the destination passed the permission policy and the system open request was started; false otherwise.',
    notes: ['Normal destinations must already be allowed by the client CEF domain-permission state.', 'A small immutable first-party onboarding/purchase allowlist bypasses the generic prompt; arbitrary server-provided URLs do not.'],
    source: 'Client/mods/deathmatch/logic/luadefs/CLuaBrowserDefs.cpp', commit: 'c5c5cba3d', test: null,
  },
];

const updateNames = new Set(updates.map((entry) => entry.name));

export const neonFunctions: NeonFunction[] = [
  ...(baseNeonFunctions as NeonFunction[]).filter((entry) => !updateNames.has(entry.name)),
  ...updates,
];

export const neonFunctionByName = new Map(neonFunctions.map((entry) => [entry.name, entry]));
