export type PetEntityType =
  | 'WOLF'
  | 'BLAZE'
  | 'ENDER_DRAGON_CUB'
  | 'AXOLOTL'
  | 'WARDEN_CUB'
  | 'FOX'
  | 'IRON_GOLEM'
  | 'ALLAY';

export type ParticleTrailId =
  | 'FLAME_SPIRAL'
  | 'SOUL_FIRE_FLAME'
  | 'ENCHANTMENT_TABLE'
  | 'DRAGON_BREATH'
  | 'CHERRY_LEAVES'
  | 'TOTEM_OF_UNDYING'
  | 'SCULK_SOUL'
  | 'NONE';

export type HatCosmeticId =
  | 'ROYAL_GOLD_CROWN'
  | 'NETHERITE_HELMET'
  | 'ARCANE_WIZARD_HAT'
  | 'REDSTONE_GOGGLES'
  | 'END_CRYSTAL_HALO'
  | 'EMERALD_TIARA'
  | 'NONE';

export type PetBehaviorMode =
  | 'FOLLOW_OWNER'
  | 'AGGRESSIVE_ESCORT'
  | 'GUARD_POSITION'
  | 'PASSIVE_SCAVENGER'
  | 'SIT_STAY';

export type PetArmorTier = 'NONE' | 'LEATHER' | 'IRON' | 'DIAMOND' | 'NETHERITE';

export interface PetSpeciesConfig {
  id: string;
  speciesName: string;
  bukkitEntity: PetEntityType;
  role: string;
  tamingItemMaterial: string;
  tamingItemLabel: string;
  tameChancePercent: number; // e.g., 35
  baseHealth: number;
  healthPerLevel: number;
  baseDamage: number;
  damagePerLevel: number;
  baseSpeed: number;
  specialAbilityName: string;
  specialAbilityDescription: string;
  primaryHex: string;
  secondaryHex: string;
  eyeHex: string;
}

export interface PetSkillNode {
  id: string;
  name: string;
  branch: 'COMBAT' | 'UTILITY' | 'AURA';
  requiredLevel: number;
  costPoints: number;
  maxRank: number;
  description: string;
  bukkitEffectSummary: string;
}

export interface ActiveCompanionPet {
  uuid: string;
  speciesId: string;
  customName: string;
  nameColorCode: string; // e.g. "&6", "&b", "&d", "&a", "&c", "&e"
  ownerName: string;
  level: number;
  currentXp: number;
  skillPoints: number;
  unlockedSkills: Record<string, number>; // skillId -> rank
  particleTrail: ParticleTrailId;
  hatCosmetic: HatCosmeticId;
  collarHex: string;
  collarColorName: string;
  armorTier: PetArmorTier;
  behaviorMode: PetBehaviorMode;
  rideableUnlocked: boolean;
  isMounted: boolean;
  currentHp: number;
  killsCount: number;
  tamedTimestamp: string;
}

export interface PluginGlobalConfig {
  pluginName: string;
  pluginVersion: string;
  authorName: string;
  mainPackage: string;
  apiVersion: string;
  maxPetLevel: number;
  baseXpRequirement: number;
  xpGrowthMultiplier: number;
  maxActivePetsPerPlayer: number;
  allowPetRidingAtLevel: number;
  enablePvpPetCombat: boolean;
  autoRespawnCooldownSeconds: number;
  storageBackend: 'YAML_PDC' | 'SQLITE_PDC';
}

export const MINECRAFT_COLOR_CODES: {
  code: string;
  label: string;
  hex: string;
}[] = [
  { code: '&6', label: 'Gold (§6)', hex: '#FFAA00' },
  { code: '&b', label: 'Aqua (§b)', hex: '#55FFFF' },
  { code: '&a', label: 'Emerald (§a)', hex: '#55FF55' },
  { code: '&d', label: 'Light Purple (§d)', hex: '#FF55FF' },
  { code: '&c', label: 'Crimson (§c)', hex: '#FF5555' },
  { code: '&e', label: 'Yellow (§e)', hex: '#FFFF55' },
  { code: '&9', label: 'Lapis Blue (§9)', hex: '#5555FF' },
  { code: '&f', label: 'Pure White (§f)', hex: '#FFFFFF' },
];

export const COLLAR_DYES: { name: string; bukkitDye: string; hex: string }[] = [
  { name: 'Crimson Red', bukkitDye: 'RED', hex: '#EF4444' },
  { name: 'Diamond Cyan', bukkitDye: 'CYAN', hex: '#06B6D4' },
  { name: 'Emerald Green', bukkitDye: 'LIME', hex: '#10B981' },
  { name: 'Royal Gold', bukkitDye: 'YELLOW', hex: '#F59E0B' },
  { name: 'Amethyst Purple', bukkitDye: 'PURPLE', hex: '#A855F7' },
  { name: 'Sculk Deep Blue', bukkitDye: 'BLUE', hex: '#3B82F6' },
  { name: 'Cherry Blossom', bukkitDye: 'PINK', hex: '#EC4899' },
  { name: 'Netherite Obsidian', bukkitDye: 'BLACK', hex: '#334155' },
];

export const PARTICLE_TRAILS: {
  id: ParticleTrailId;
  label: string;
  bukkitParticle: string;
  colorHex: string;
  description: string;
}[] = [
  {
    id: 'FLAME_SPIRAL',
    label: 'Flame Spiral',
    bukkitParticle: 'Particle.FLAME',
    colorHex: '#F97316',
    description: 'Orbiting Nether embers that spiral around your pet as it moves.',
  },
  {
    id: 'SOUL_FIRE_FLAME',
    label: 'Soul Fire Vortex',
    bukkitParticle: 'Particle.SOUL_FIRE_FLAME',
    colorHex: '#38BDF8',
    description: 'Ethereal turquoise soul flames from the Soul Sand Valley.',
  },
  {
    id: 'ENCHANTMENT_TABLE',
    label: 'Galactic Runes',
    bukkitParticle: 'Particle.ENCHANT',
    colorHex: '#A855F7',
    description: 'Floating Standard Galactic Alphabet glyphs cascading around the pet.',
  },
  {
    id: 'DRAGON_BREATH',
    label: 'Void Dragon Breath',
    bukkitParticle: 'Particle.DRAGON_BREATH',
    colorHex: '#D946EF',
    description: 'Dense magenta End plasma clouds trailing every step.',
  },
  {
    id: 'CHERRY_LEAVES',
    label: 'Cherry Blossom Drift',
    bukkitParticle: 'Particle.CHERRY_LEAVES',
    colorHex: '#F472B6',
    description: 'Gentle pink petals swirling in the breeze.',
  },
  {
    id: 'TOTEM_OF_UNDYING',
    label: 'Totem Emerald Sparks',
    bukkitParticle: 'Particle.TOTEM_OF_UNDYING',
    colorHex: '#10B981',
    description: 'Golden and emerald life sparks radiating from the companion.',
  },
  {
    id: 'SCULK_SOUL',
    label: 'Deep Dark Sculk Pulse',
    bukkitParticle: 'Particle.SCULK_SOUL',
    colorHex: '#0EA5E9',
    description: 'Bioluminescent Warden sonic rings and sculk wisps.',
  },
  {
    id: 'NONE',
    label: 'No Trail',
    bukkitParticle: 'null',
    colorHex: '#64748B',
    description: 'Disables ambient particle rendering for stealth play.',
  },
];

export const HAT_COSMETICS: {
  id: HatCosmeticId;
  label: string;
  bukkitMaterial: string;
  bonusText: string;
}[] = [
  {
    id: 'ROYAL_GOLD_CROWN',
    label: 'Royal Gold Crown',
    bukkitMaterial: 'GOLDEN_HELMET',
    bonusText: '+10% XP Gain Aura',
  },
  {
    id: 'NETHERITE_HELMET',
    label: 'Netherite War Helm',
    bukkitMaterial: 'NETHERITE_HELMET',
    bonusText: '+15% Knockback Resistance',
  },
  {
    id: 'ARCANE_WIZARD_HAT',
    label: 'Arcane Wizard Hat',
    bukkitMaterial: 'PURPLE_BANNER',
    bonusText: '-15% Ability Cooldown',
  },
  {
    id: 'REDSTONE_GOGGLES',
    label: 'Redstone Engineer Goggles',
    bukkitMaterial: 'CARVED_PUMPKIN',
    bonusText: '+12% Critical Strike Chance',
  },
  {
    id: 'END_CRYSTAL_HALO',
    label: 'End Crystal Halo',
    bukkitMaterial: 'END_ROD',
    bonusText: '+2.0 HP/s Passive Regen',
  },
  {
    id: 'EMERALD_TIARA',
    label: 'Emerald Sovereign Tiara',
    bukkitMaterial: 'EMERALD_BLOCK',
    bonusText: '+20% Mob Loot Drop Chance',
  },
  {
    id: 'NONE',
    label: 'Unadorned (No Hat)',
    bukkitMaterial: 'AIR',
    bonusText: 'Default natural appearance',
  },
];

export const ARMOR_TIERS: {
  tier: PetArmorTier;
  label: string;
  defenseBonus: number;
  damageReductionPercent: number;
  hex: string;
}[] = [
  { tier: 'NONE', label: 'No Armor', defenseBonus: 0, damageReductionPercent: 0, hex: '#475569' },
  { tier: 'LEATHER', label: 'Wolf Leather Barding', defenseBonus: 4, damageReductionPercent: 12, hex: '#B45309' },
  { tier: 'IRON', label: 'Forged Iron Barding', defenseBonus: 10, damageReductionPercent: 25, hex: '#CBD5E1' },
  { tier: 'DIAMOND', label: 'Enchanted Diamond Barding', defenseBonus: 18, damageReductionPercent: 42, hex: '#22D3EE' },
  { tier: 'NETHERITE', label: 'Netherite Sovereign Barding', defenseBonus: 28, damageReductionPercent: 60, hex: '#475569' },
];

export const INITIAL_PET_SPECIES: PetSpeciesConfig[] = [
  {
    id: 'shadow_wolf',
    speciesName: 'Shadow Direwolf',
    bukkitEntity: 'WOLF',
    role: 'Melee Bleed Striker',
    tamingItemMaterial: 'BONE',
    tamingItemLabel: 'Enchanted Bone',
    tameChancePercent: 35,
    baseHealth: 28,
    healthPerLevel: 4.5,
    baseDamage: 6.0,
    damagePerLevel: 1.4,
    baseSpeed: 0.34,
    specialAbilityName: 'Alpha Pack Howl',
    specialAbilityDescription: 'Grants owner Strength I and lunges at hostile targets for 180% critical bite damage.',
    primaryHex: '#64748B',
    secondaryHex: '#334155',
    eyeHex: '#38BDF8',
  },
  {
    id: 'inferno_blaze',
    speciesName: 'Inferno Blaze Sentinel',
    bukkitEntity: 'BLAZE',
    role: 'Ranged Fireball Artillery',
    tamingItemMaterial: 'BLAZE_ROD',
    tamingItemLabel: 'Molten Blaze Rod',
    tameChancePercent: 25,
    baseHealth: 24,
    healthPerLevel: 3.8,
    baseDamage: 7.5,
    damagePerLevel: 1.8,
    baseSpeed: 0.31,
    specialAbilityName: 'Nether Tri-Volley',
    specialAbilityDescription: 'Launches 3 rapid-fire explosive fireballs that ignite enemies for 5 seconds.',
    primaryHex: '#F59E0B',
    secondaryHex: '#EA580C',
    eyeHex: '#FEF08A',
  },
  {
    id: 'ender_dragon_cub',
    speciesName: 'Enderling Void Drake',
    bukkitEntity: 'ENDER_DRAGON_CUB',
    role: 'Mythic Void Assassin',
    tamingItemMaterial: 'DRAGON_BREATH',
    tamingItemLabel: 'Dragon Breath Flask',
    tameChancePercent: 15,
    baseHealth: 36,
    healthPerLevel: 6.0,
    baseDamage: 9.0,
    damagePerLevel: 2.2,
    baseSpeed: 0.38,
    specialAbilityName: 'Void Blink Nova',
    specialAbilityDescription: 'Teleports behind the target and releases a Dragon Breath AoE cloud dealing true damage.',
    primaryHex: '#1E1B4B',
    secondaryHex: '#9333EA',
    eyeHex: '#E879F9',
  },
  {
    id: 'crystal_axolotl',
    speciesName: 'Crystal Tide Axolotl',
    bukkitEntity: 'AXOLOTL',
    role: 'Support Regeneration Healer',
    tamingItemMaterial: 'TROPICAL_FISH_BUCKET',
    tamingItemLabel: 'Bucket of Tropical Fish',
    tameChancePercent: 45,
    baseHealth: 26,
    healthPerLevel: 4.2,
    baseDamage: 4.5,
    damagePerLevel: 1.1,
    baseSpeed: 0.33,
    specialAbilityName: 'Tidal Restoration',
    specialAbilityDescription: 'Applies Regeneration II to the owner and cleanses Mining Fatigue & Poison.',
    primaryHex: '#F472B6',
    secondaryHex: '#DB2777',
    eyeHex: '#06B6D4',
  },
  {
    id: 'ancient_warden_cub',
    speciesName: 'Ancient Sculk Warden Cub',
    bukkitEntity: 'WARDEN_CUB',
    role: 'Heavy Sonic Juggernaut',
    tamingItemMaterial: 'ECHO_SHARD',
    tamingItemLabel: 'Resonant Echo Shard',
    tameChancePercent: 12,
    baseHealth: 48,
    healthPerLevel: 8.0,
    baseDamage: 10.5,
    damagePerLevel: 2.5,
    baseSpeed: 0.28,
    specialAbilityName: 'Mini Sonic Boom',
    specialAbilityDescription: 'Fires an armor-piercing sculk shockwave that knocks back all nearby monsters.',
    primaryHex: '#0F766E',
    secondaryHex: '#115E59',
    eyeHex: '#22D3EE',
  },
  {
    id: 'golden_fox',
    speciesName: 'Gilded Taiga Kitsune',
    bukkitEntity: 'FOX',
    role: 'Agile Loot Scavenger',
    tamingItemMaterial: 'GLOW_BERRIES',
    tamingItemLabel: 'Golden Glow Berries',
    tameChancePercent: 40,
    baseHealth: 22,
    healthPerLevel: 3.5,
    baseDamage: 5.5,
    damagePerLevel: 1.35,
    baseSpeed: 0.40,
    specialAbilityName: 'Fortune Pounce',
    specialAbilityDescription: 'Dashes across the arena collecting dropped items and doubling XP orbs.',
    primaryHex: '#FB923C',
    secondaryHex: '#C2410C',
    eyeHex: '#10B981',
  },
];

export const PET_SKILL_TREE: PetSkillNode[] = [
  {
    id: 'ferocious_fangs',
    name: 'Ferocious Fangs',
    branch: 'COMBAT',
    requiredLevel: 1,
    costPoints: 1,
    maxRank: 5,
    description: 'Increases companion pet base melee and ranged damage by +12% per rank.',
    bukkitEffectSummary: 'Multiplies EntityDamageByEntityEvent final damage by (1 + 0.12 * rank).',
  },
  {
    id: 'vampiric_siphon',
    name: 'Vampiric Life Siphon',
    branch: 'COMBAT',
    requiredLevel: 3,
    costPoints: 1,
    maxRank: 3,
    description: 'Heals both the pet and owner for 10% of combat damage dealt per rank.',
    bukkitEffectSummary: 'Restores owner & pet Attribute.MAX_HEALTH on each successful attack.',
  },
  {
    id: 'sonic_fire_burst',
    name: 'Elemental Nova Proc',
    branch: 'COMBAT',
    requiredLevel: 6,
    costPoints: 2,
    maxRank: 3,
    description: 'Every 4th attack triggers an elemental AoE blast dealing 160% bonus damage.',
    bukkitEffectSummary: 'Spawns World#spawnParticle + nearby LivingEntity AoE damage.',
  },
  {
    id: 'magnetic_paws',
    name: 'Vacuum Loot Magnet',
    branch: 'UTILITY',
    requiredLevel: 1,
    costPoints: 1,
    maxRank: 3,
    description: 'Automatically pulls dropped items and XP orbs within 6 blocks (+3 blocks/rank) into owner inventory.',
    bukkitEffectSummary: 'Scans World#getNearbyEntities for Item & ExperienceOrb every 10 ticks.',
  },
  {
    id: 'saddle_mastery',
    name: 'Mounted Swiftness',
    branch: 'UTILITY',
    requiredLevel: 5,
    costPoints: 2,
    maxRank: 3,
    description: 'Unlocks `/pet ride` mounting and increases mounted movement speed by +15% per rank.',
    bukkitEffectSummary: 'Calls petEntity.addPassenger(owner) with custom WASD velocity control.',
  },
  {
    id: 'totem_guardian',
    name: 'Sovereign Totem Aegis',
    branch: 'AURA',
    requiredLevel: 8,
    costPoints: 3,
    maxRank: 1,
    description: 'Prevents fatal damage to the owner once every 180 seconds, granting Absorption III & Fire Resistance.',
    bukkitEffectSummary: 'Intercepts lethal EntityDamageEvent on owner and triggers Totem effect.',
  },
  {
    id: 'scholar_blessing',
    name: 'Wisdom XP Resonance',
    branch: 'AURA',
    requiredLevel: 2,
    costPoints: 1,
    maxRank: 4,
    description: 'Boosts both Player and Pet experience gain from all sources by +15% per rank.',
    bukkitEffectSummary: 'Scales PlayerExpChangeEvent and PetManager#addPetExperience.',
  },
];

export interface CombatEncounterMob {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  damage: number;
  xpReward: number;
  dropLabel: string;
  hexColor: string;
}

export const COMBAT_ENCOUNTERS: CombatEncounterMob[] = [
  {
    id: 'zombie_raider',
    name: 'Husk Dungeon Raider',
    level: 2,
    maxHp: 35,
    damage: 4,
    xpReward: 45,
    dropLabel: 'Rotten Flesh & Enchanted Bone',
    hexColor: '#65A30D',
  },
  {
    id: 'skeleton_marksman',
    name: 'Stray Marksman',
    level: 5,
    maxHp: 65,
    damage: 8,
    xpReward: 95,
    dropLabel: 'Spectral Arrow & XP Bottle',
    hexColor: '#94A3B8',
  },
  {
    id: 'piglin_brute',
    name: 'Bastion Piglin Brute',
    level: 10,
    maxHp: 130,
    damage: 14,
    xpReward: 210,
    dropLabel: 'Gilded Blackstone & Gold Ingot',
    hexColor: '#D97706',
  },
  {
    id: 'ender_sentinel',
    name: 'Enderman Void Stalker',
    level: 16,
    maxHp: 220,
    damage: 21,
    xpReward: 420,
    dropLabel: 'Ender Pearl & Dragon Breath',
    hexColor: '#A855F7',
  },
  {
    id: 'wither_champion',
    name: 'Nether Wither Overlord (Boss)',
    level: 25,
    maxHp: 450,
    damage: 32,
    xpReward: 1100,
    dropLabel: 'Nether Star & Mythic Pet Relic',
    hexColor: '#EF4444',
  },
];

export function calculateRequiredXp(
  level: number,
  baseXp: number,
  multiplier: number
): number {
  return Math.round(baseXp * Math.pow(multiplier, Math.max(0, level - 1)));
}

export function getEvolutionTitle(level: number): string {
  if (level >= 25) return 'Mythic Sovereign';
  if (level >= 15) return 'Ascended Guardian';
  if (level >= 7) return 'Loyal Companion';
  return 'Wild Hatchling';
}
