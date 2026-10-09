import React, { useState } from 'react';
import {
  ActiveCompanionPet,
  ARMOR_TIERS,
  COLLAR_DYES,
  HAT_COSMETICS,
  HatCosmeticId,
  MINECRAFT_COLOR_CODES,
  PARTICLE_TRAILS,
  ParticleTrailId,
  PET_SKILL_TREE,
  PetArmorTier,
  PetBehaviorMode,
  PetSpeciesConfig,
} from '../types/petPlugin';
import { soundFX } from '../utils/soundEffects';

interface MinecraftChestGuiPanelProps {
  activePet: ActiveCompanionPet;
  species: PetSpeciesConfig;
  requiredXp: number;
  allowRidingLevel: number;
  onUpdatePet: (updater: (prev: ActiveCompanionPet) => ActiveCompanionPet, logMsg?: string) => void;
  onUpgradeSkill: (skillId: string) => void;
}

interface ChestSlotItem {
  slotIndex: number;
  title: string;
  subtitle: string;
  lore: string[];
  accentHex: string;
  glyph: string;
  onClick: () => void;
}

const BEHAVIOR_MODES: { mode: PetBehaviorMode; label: string; summary: string }[] = [
  {
    mode: 'FOLLOW_OWNER',
    label: 'Follow Owner',
    summary: 'Pathfinds within 3 blocks of owner and teleports if distance exceeds 18 blocks.',
  },
  {
    mode: 'AGGRESSIVE_ESCORT',
    label: 'Aggressive Escort',
    summary: 'Automatically targets any hostile monster or attacker within 12 blocks.',
  },
  {
    mode: 'GUARD_POSITION',
    label: 'Guard Area',
    summary: 'Patrols a 10-block perimeter around current block coordinates.',
  },
  {
    mode: 'PASSIVE_SCAVENGER',
    label: 'Passive Scavenger',
    summary: 'Avoids combat and prioritizes collecting nearby dropped items and XP orbs.',
  },
  {
    mode: 'SIT_STAY',
    label: 'Sit & Stay',
    summary: 'Remains stationary with ambient idle animation until commanded.',
  },
];

export const MinecraftChestGuiPanel: React.FC<MinecraftChestGuiPanelProps> = ({
  activePet,
  species,
  requiredXp,
  allowRidingLevel,
  onUpdatePet,
  onUpgradeSkill,
}) => {
  const [hoveredSlot, setHoveredSlot] = useState<ChestSlotItem | null>(null);
  const [nameInput, setNameInput] = useState(activePet.customName);

  const cycleTrail = () => {
    soundFX.playGuiClick();
    const idx = PARTICLE_TRAILS.findIndex((t) => t.id === activePet.particleTrail);
    const next = PARTICLE_TRAILS[(idx + 1) % PARTICLE_TRAILS.length];
    onUpdatePet(
      (prev) => ({ ...prev, particleTrail: next.id }),
      `[GUI] Set particle trail to ${next.label} (${next.bukkitParticle})`
    );
  };

  const cycleHat = () => {
    soundFX.playGuiClick();
    const idx = HAT_COSMETICS.findIndex((h) => h.id === activePet.hatCosmetic);
    const next = HAT_COSMETICS[(idx + 1) % HAT_COSMETICS.length];
    onUpdatePet(
      (prev) => ({ ...prev, hatCosmetic: next.id }),
      `[GUI] Equipped cosmetic hat: ${next.label}`
    );
  };

  const cycleCollar = () => {
    soundFX.playGuiClick();
    const idx = COLLAR_DYES.findIndex((d) => d.name === activePet.collarColorName);
    const next = COLLAR_DYES[(idx + 1) % COLLAR_DYES.length];
    onUpdatePet(
      (prev) => ({ ...prev, collarColorName: next.name, collarHex: next.hex }),
      `[GUI] Dyed pet collar & aura to ${next.name}`
    );
  };

  const cycleArmor = () => {
    soundFX.playGuiClick();
    const idx = ARMOR_TIERS.findIndex((a) => a.tier === activePet.armorTier);
    const next = ARMOR_TIERS[(idx + 1) % ARMOR_TIERS.length];
    onUpdatePet(
      (prev) => ({ ...prev, armorTier: next.tier }),
      `[GUI] Equipped ${next.label} (+${next.defenseBonus} Defense)`
    );
  };

  const cycleBehavior = () => {
    soundFX.playGuiClick();
    const idx = BEHAVIOR_MODES.findIndex((b) => b.mode === activePet.behaviorMode);
    const next = BEHAVIOR_MODES[(idx + 1) % BEHAVIOR_MODES.length];
    onUpdatePet(
      (prev) => ({ ...prev, behaviorMode: next.mode }),
      `[GUI] Switched AI Behavior Stance to ${next.label}`
    );
  };

  const toggleMount = () => {
    soundFX.playGuiClick();
    if (activePet.level < allowRidingLevel && (activePet.unlockedSkills['saddle_mastery'] || 0) === 0) {
      onUpdatePet(
        (prev) => prev,
        `[Pet] Companion must reach Level ${allowRidingLevel} or unlock Mounted Swiftness to ride!`
      );
      return;
    }
    onUpdatePet(
      (prev) => ({ ...prev, isMounted: !prev.isMounted }),
      activePet.isMounted
        ? `[Pet] Dismounted ${activePet.customName}.`
        : `[Pet] Mounted ${activePet.customName} (/pet ride)!`
    );
  };

  // Build 54-slot map matching PetCustomizationGUI.java
  const slotMap: Record<number, ChestSlotItem> = {
    4: {
      slotIndex: 4,
      title: `★ ${activePet.customName} (Lv.${activePet.level})`,
      subtitle: 'Material.NETHER_STAR · Companion Emblem',
      lore: [
        `Owner: ${activePet.ownerName}`,
        `Species: ${species.speciesName} (${species.bukkitEntity})`,
        `XP Progress: ${ activePet.currentXp } / ${requiredXp}`,
        `Available Skill Points: ${activePet.skillPoints}`,
        `Developer: The Killer D God`,
      ],
      accentHex: '#F59E0B',
      glyph: '★',
      onClick: () => soundFX.playGuiClick(),
    },
    19: {
      slotIndex: 19,
      title: `Particle Trail: ${activePet.particleTrail}`,
      subtitle: 'Material.BLAZE_POWDER · Click to Cycle',
      lore: [
        'Cycles ambient Bukkit Particle effects around pet.',
        `Active: ${activePet.particleTrail}`,
        'Click slot to switch to next particle effect.',
      ],
      accentHex: '#F97316',
      glyph: '✦',
      onClick: cycleTrail,
    },
    20: {
      slotIndex: 20,
      title: `Pet Barding: ${activePet.armorTier}`,
      subtitle: 'Material.DIAMOND_HORSE_ARMOR · Click to Cycle',
      lore: [
        'Equips protective companion armor barding.',
        `Current Tier: ${activePet.armorTier}`,
        'Click slot to cycle armor tier.',
      ],
      accentHex: '#22D3EE',
      glyph: '🛡',
      onClick: cycleArmor,
    },
    21: {
      slotIndex: 21,
      title: `Cosmetic Hat: ${activePet.hatCosmetic}`,
      subtitle: 'Material.GOLDEN_HELMET · Click to Cycle',
      lore: [
        'Equips crowns, helmets, wizard hats & halos.',
        `Equipped: ${activePet.hatCosmetic}`,
        'Click slot to equip next cosmetic headgear.',
      ],
      accentHex: '#FACC15',
      glyph: '♛',
      onClick: cycleHat,
    },
    23: {
      slotIndex: 23,
      title: `Collar & Aura Dye: ${activePet.collarColorName}`,
      subtitle: 'Material.CYAN_DYE · Click to Cycle',
      lore: [
        'Updates collar band & hologram border color.',
        `Active Dye: ${activePet.collarColorName}`,
        'Click slot to cycle Minecraft dye colors.',
      ],
      accentHex: activePet.collarHex,
      glyph: '◈',
      onClick: cycleCollar,
    },
    24: {
      slotIndex: 24,
      title: `Mount / Ride Companion (${activePet.isMounted ? 'Mounted' : 'Dismounted'})`,
      subtitle: 'Material.SADDLE · /pet ride',
      lore: [
        `Requires Pet Level ${allowRidingLevel}+ or Mounted Swiftness skill.`,
        `Status: ${activePet.isMounted ? 'Currently Riding' : 'Click to Mount'}`,
      ],
      accentHex: '#10B981',
      glyph: '🏇',
      onClick: toggleMount,
    },
    25: {
      slotIndex: 25,
      title: `AI Behavior Mode: ${activePet.behaviorMode}`,
      subtitle: 'Material.COMPASS · Click to Cycle',
      lore: [
        'Configures PathfinderGoal behavior for your pet.',
        `Current Stance: ${activePet.behaviorMode}`,
        'Click slot to switch AI mode.',
      ],
      accentHex: '#38BDF8',
      glyph: '🧭',
      onClick: cycleBehavior,
    },
    38: {
      slotIndex: 38,
      title: `Skill: Ferocious Fangs [Rank ${activePet.unlockedSkills['ferocious_fangs'] || 0}/5]`,
      subtitle: 'Material.DIAMOND_SWORD · Cost: 1 SP',
      lore: [
        '+12% Companion Attack Damage per rank.',
        `Available Skill Points: ${activePet.skillPoints}`,
        'Click to upgrade skill rank.',
      ],
      accentHex: '#EF4444',
      glyph: '⚔',
      onClick: () => onUpgradeSkill('ferocious_fangs'),
    },
    40: {
      slotIndex: 40,
      title: `Skill: Vacuum Loot Magnet [Rank ${activePet.unlockedSkills['magnetic_paws'] || 0}/3]`,
      subtitle: 'Material.HOPPER · Cost: 1 SP',
      lore: [
        'Pulls dropped loot & XP orbs within radius to owner.',
        `Available Skill Points: ${activePet.skillPoints}`,
        'Click to upgrade skill rank.',
      ],
      accentHex: '#06B6D4',
      glyph: '🧲',
      onClick: () => onUpgradeSkill('magnetic_paws'),
    },
    42: {
      slotIndex: 42,
      title: `Skill: Wisdom XP Resonance [Rank ${activePet.unlockedSkills['scholar_blessing'] || 0}/4]`,
      subtitle: 'Material.EXPERIENCE_BOTTLE · Cost: 1 SP',
      lore: [
        '+15% Player & Pet XP Gain from all combat sources.',
        `Available Skill Points: ${activePet.skillPoints}`,
        'Click to upgrade skill rank.',
      ],
      accentHex: '#10B981',
      glyph: '✦',
      onClick: () => onUpgradeSkill('scholar_blessing'),
    },
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    if (!cleaned) return;
    soundFX.playGuiClick();
    onUpdatePet(
      (prev) => ({ ...prev, customName: cleaned }),
      `[/pet rename] Renamed companion pet to "${cleaned}"`
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Cols: Direct Customization Controls (Name, Color Codes, Trails, Hats, Dyes, Armor, Stance) */}
      <div className="lg:col-span-7 space-y-6">
        {/* 1. Custom Name & Minecraft Color Code Picker */}
        <div className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                01. Companion Identity & Color Codes
              </h3>
              <p className="text-xs text-slate-400">
                Customizes the hologram nametag rendered via <code className="text-amber-400">Entity#setCustomName</code>
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              Command: /pet rename &lt;name&gt;
            </span>
          </div>

          <form onSubmit={handleRenameSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              maxLength={24}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter custom pet name..."
              className="flex-1 px-3.5 py-2 rounded-md bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Apply Pet Name
            </button>
          </form>

          <div>
            <div className="text-xs text-slate-400 mb-2">
              Minecraft ChatColor Formatting Code:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MINECRAFT_COLOR_CODES.map((cc) => {
                const active = activePet.nameColorCode === cc.code;
                return (
                  <button
                    key={cc.code}
                    type="button"
                    onClick={() => {
                      soundFX.playGuiClick();
                      onUpdatePet(
                        (prev) => ({ ...prev, nameColorCode: cc.code }),
                        `[/pet color] Applied color code ${cc.code} (${cc.label})`
                      );
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-md border text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-slate-900 border-amber-500 text-slate-100'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span style={{ color: cc.hex }} className="font-semibold">
                      {cc.label}
                    </span>
                    <span>{cc.code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Particle Trail Selector */}
        <div className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                02. Particle Trail Aura
              </h3>
              <p className="text-xs text-slate-400">
                Rendered every 4 ticks via <code className="text-amber-400">World#spawnParticle</code>
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              Command: /pet trail &lt;id&gt;
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PARTICLE_TRAILS.map((trail) => {
              const isSelected = activePet.particleTrail === trail.id;
              return (
                <button
                  key={trail.id}
                  type="button"
                  onClick={() => {
                    soundFX.playGuiClick();
                    onUpdatePet(
                      (prev) => ({ ...prev, particleTrail: trail.id as ParticleTrailId }),
                      `[/pet trail] Equipped ${trail.label} (${trail.bukkitParticle})`
                    );
                  }}
                  className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-100 whitespace-nowrap shrink-0">
                      {trail.label}
                    </span>
                    <span
                      className="text-[11px] font-mono tabular-nums"
                      style={{ color: trail.colorHex }}
                    >
                      {trail.bukkitParticle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{trail.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Cosmetic Hats, Collar Dye & Armor Barding */}
        <div className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              03. Headgear Cosmetics, Collar Dyes & Barding
            </h3>
            <p className="text-xs text-slate-400">
              Equips item stacks onto <code className="text-amber-400">EntityEquipment#setHelmet</code> and updates defense attributes
            </p>
          </div>

          {/* Hat Selector */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-300">Cosmetic Hat Slot:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HAT_COSMETICS.map((hat) => {
                const active = activePet.hatCosmetic === hat.id;
                return (
                  <button
                    key={hat.id}
                    type="button"
                    onClick={() => {
                      soundFX.playGuiClick();
                      onUpdatePet(
                        (prev) => ({ ...prev, hatCosmetic: hat.id as HatCosmeticId }),
                        `[/pet hat] Equipped ${hat.label} (${hat.bonusText})`
                      );
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-md border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 border-amber-500 text-slate-100'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{hat.label}</div>
                      <div className="text-[11px] text-emerald-400 font-mono truncate">
                        {hat.bonusText}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 ml-2 shrink-0">
                      {hat.bukkitMaterial}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collar Dye & Armor Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <div className="text-xs font-medium text-slate-300 mb-2">
                Collar & Aura Ring Dye:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {COLLAR_DYES.map((dye) => {
                  const active = activePet.collarColorName === dye.name;
                  return (
                    <button
                      key={dye.name}
                      type="button"
                      onClick={() => {
                        soundFX.playGuiClick();
                        onUpdatePet(
                          (prev) => ({
                            ...prev,
                            collarColorName: dye.name,
                            collarHex: dye.hex,
                          }),
                          `[GUI] Applied ${dye.name} collar dye`
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded border text-xs text-left transition-colors whitespace-nowrap truncate cursor-pointer ${
                        active
                          ? 'bg-slate-900 border-slate-300 text-white font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      style={{ borderColor: active ? dye.hex : undefined }}
                    >
                      <span style={{ color: dye.hex }}>◆ </span>
                      {dye.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-300 mb-2">
                Companion Armor Barding:
              </div>
              <div className="space-y-1.5">
                {ARMOR_TIERS.map((armor) => {
                  const active = activePet.armorTier === armor.tier;
                  return (
                    <button
                      key={armor.tier}
                      type="button"
                      onClick={() => {
                        soundFX.playGuiClick();
                        onUpdatePet(
                          (prev) => ({ ...prev, armorTier: armor.tier as PetArmorTier }),
                          `[GUI] Equipped ${armor.label} (-${armor.damageReductionPercent}% DMG taken)`
                        );
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded border text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-slate-900 border-cyan-500 text-slate-100 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{armor.label}</span>
                      <span className="font-mono text-emerald-400 tabular-nums">
                        +{armor.defenseBonus} DEF
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right 5 Cols: Authentic In-Game 54-Slot Chest GUI Simulator (/pet gui) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                In-Game 54-Slot Chest GUI
              </h3>
              <p className="text-xs text-slate-400">
                Interactive preview of <code className="text-amber-400">/pet gui</code> · Click highlighted slots
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 tabular-nums">54 Slots (6×9)</span>
          </div>

          {/* Minecraft Dark Inventory Frame */}
          <div className="p-3 rounded-md bg-[#18181b] border-2 border-slate-700">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
              <span className="text-slate-300 font-semibold">
                Pet Studio · <span className="text-amber-400">The Killer D God</span>
              </span>
              <span className="text-emerald-400 tabular-nums">
                SP: {activePet.skillPoints}
              </span>
            </div>

            {/* 6 Rows x 9 Columns = 54 Slots */}
            <div className="grid grid-cols-9 gap-1.5">
              {Array.from({ length: 54 }).map((_, idx) => {
                const slotItem = slotMap[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setHoveredSlot(slotItem || null)}
                    onClick={() => {
                      if (slotItem) {
                        slotItem.onClick();
                        setHoveredSlot(slotItem);
                      }
                    }}
                    className={`aspect-square rounded flex flex-col items-center justify-center border text-sm font-mono transition-transform duration-150 ${
                      slotItem
                        ? 'bg-slate-900 border-slate-600 hover:border-amber-400 hover:scale-105 cursor-pointer'
                        : 'bg-[#090d16] border-slate-800/80 text-slate-700 cursor-default'
                    }`}
                    title={slotItem ? slotItem.title : `Empty Slot #${idx}`}
                  >
                    {slotItem ? (
                      <>
                        <span
                          className="text-base leading-none"
                          style={{ color: slotItem.accentHex }}
                        >
                          {slotItem.glyph}
                        </span>
                        <span className="text-[9px] text-slate-400 tabular-nums mt-0.5">
                          #{idx}
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] text-slate-800 tabular-nums">{idx}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Minecraft Item Tooltip Box */}
            <div className="mt-3 p-3 rounded bg-[#110c1d] border border-purple-500/60 min-h-[116px]">
              {hoveredSlot ? (
                <div className="space-y-1 font-mono">
                  <div
                    className="text-xs font-bold"
                    style={{ color: hoveredSlot.accentHex }}
                  >
                    {hoveredSlot.title}
                  </div>
                  <div className="text-[11px] text-slate-400">{hoveredSlot.subtitle}</div>
                  <div className="pt-1 space-y-0.5 text-[11px] text-slate-300">
                    {hoveredSlot.lore.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1 font-mono text-xs text-slate-400">
                  <div className="text-amber-400 font-semibold">
                    Hover or click any active chest slot (4, 19, 20, 21, 23, 24, 25, 38, 40, 42)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Every click runs the exact handler defined in{' '}
                    <span className="text-slate-200">PetCustomizationGUI.java</span> and updates
                    your companion in real time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI Behavior Mode Direct Selector */}
          <div className="pt-2 space-y-2">
            <div className="text-xs font-medium text-slate-300">
              AI Pathfinder Behavior Stance:
            </div>
            <div className="space-y-1.5">
              {BEHAVIOR_MODES.map((bm) => {
                const active = activePet.behaviorMode === bm.mode;
                return (
                  <button
                    key={bm.mode}
                    type="button"
                    onClick={() => {
                      soundFX.playGuiClick();
                      onUpdatePet(
                        (prev) => ({ ...prev, behaviorMode: bm.mode }),
                        `[GUI] Set companion AI behavior to ${bm.label}`
                      );
                    }}
                    className={`w-full p-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 border-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-100">
                      <span>{bm.label}</span>
                      <span className="font-mono text-[11px] text-emerald-400">
                        {bm.mode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{bm.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
