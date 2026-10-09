import React, { useMemo, useState } from 'react';
import {
  Download,
  Volume2,
  VolumeX,
  Swords,
  Heart,
  Sparkles,
  Terminal,
  Plus,
  RotateCcw,
  Shield,
  Award,
  Code2,
  Sliders,
  FolderGit2,
} from 'lucide-react';
import {
  ActiveCompanionPet,
  ARMOR_TIERS,
  calculateRequiredXp,
  COMBAT_ENCOUNTERS,
  CombatEncounterMob,
  getEvolutionTitle,
  HAT_COSMETICS,
  INITIAL_PET_SPECIES,
  MINECRAFT_COLOR_CODES,
  PARTICLE_TRAILS,
  PET_SKILL_TREE,
  PetEntityType,
  PetSpeciesConfig,
  PluginGlobalConfig,
} from './types/petPlugin';
import {
  FloatingTextParticle,
  PixelPetCanvas,
} from './components/PixelPetCanvas';
import { MinecraftChestGuiPanel } from './components/MinecraftChestGuiPanel';
import { PluginSourceIde } from './components/PluginSourceIde';
import { GitHubHostingPanel } from './components/GitHubHostingPanel';
import {
  convertToZipEntries,
  generatePluginFiles,
} from './utils/javaCodeGenerator';
import { buildZipBlob, triggerDownloadBlob } from './utils/zipBuilder';
import { soundFX } from './utils/soundEffects';

type WorkspaceTab =
  | 'SANDBOX'
  | 'CUSTOMIZE'
  | 'SKILL_TREE'
  | 'CONFIGURATOR'
  | 'SOURCE_CODE'
  | 'GITHUB_HOSTING';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('GITHUB_HOSTING');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [githubOwner, setGithubOwner] = useState<string>('thekillerdgod');
  const [githubRepo, setGithubRepo] = useState<string>('Pet-Plugin');

  // 1. Plugin Global Configuration
  const [pluginConfig, setPluginConfig] = useState<PluginGlobalConfig>({
    pluginName: 'Pet',
    pluginVersion: '1.2.0',
    authorName: 'The Killer D God',
    mainPackage: 'com.thekillerdgod.pet',
    apiVersion: '1.21',
    maxPetLevel: 50,
    baseXpRequirement: 100,
    xpGrowthMultiplier: 1.22,
    maxActivePetsPerPlayer: 1,
    allowPetRidingAtLevel: 5,
    enablePvpPetCombat: true,
    autoRespawnCooldownSeconds: 15,
    storageBackend: 'YAML_PDC',
  });

  // 2. Registered Tameable Pet Species
  const [speciesList, setSpeciesList] = useState<PetSpeciesConfig[]>(
    INITIAL_PET_SPECIES
  );

  // 3. Player's Tamed Pet Kennel & Active Companion Pet
  const [tamedPets, setTamedPets] = useState<ActiveCompanionPet[]>([
    {
      uuid: 'pet-uuid-shadow-01',
      speciesId: 'shadow_wolf',
      customName: 'Fenrir',
      nameColorCode: '&6',
      ownerName: 'The Killer D God',
      level: 6,
      currentXp: 90,
      skillPoints: 3,
      unlockedSkills: { ferocious_fangs: 2, magnetic_paws: 1 },
      particleTrail: 'SOUL_FIRE_FLAME',
      hatCosmetic: 'ROYAL_GOLD_CROWN',
      collarHex: '#06B6D4',
      collarColorName: 'Diamond Cyan',
      armorTier: 'DIAMOND',
      behaviorMode: 'AGGRESSIVE_ESCORT',
      rideableUnlocked: true,
      isMounted: false,
      currentHp: 50.5,
      killsCount: 14,
      tamedTimestamp: 'Tamed in Taiga Biome',
    },
    {
      uuid: 'pet-uuid-dragon-02',
      speciesId: 'ender_dragon_cub',
      customName: 'Nyxis',
      nameColorCode: '&d',
      ownerName: 'The Killer D God',
      level: 12,
      currentXp: 240,
      skillPoints: 4,
      unlockedSkills: { ferocious_fangs: 3, vampiric_siphon: 2, scholar_blessing: 2 },
      particleTrail: 'DRAGON_BREATH',
      hatCosmetic: 'END_CRYSTAL_HALO',
      collarHex: '#A855F7',
      collarColorName: 'Amethyst Purple',
      armorTier: 'NETHERITE',
      behaviorMode: 'FOLLOW_OWNER',
      rideableUnlocked: true,
      isMounted: false,
      currentHp: 102,
      killsCount: 39,
      tamedTimestamp: 'Tamed in The End',
    },
  ]);

  const [activePetUuid, setActivePetUuid] = useState<string>('pet-uuid-shadow-01');

  const activePet = useMemo(
    () => tamedPets.find((p) => p.uuid === activePetUuid) || tamedPets[0],
    [tamedPets, activePetUuid]
  );

  const activeSpecies = useMemo(
    () =>
      speciesList.find((s) => s.id === activePet.speciesId) || speciesList[0],
    [speciesList, activePet.speciesId]
  );

  // 4. Sandbox Arena Mode: Either Taming a Wild Mob or Fighting a Dungeon Mob
  const [arenaMode, setArenaMode] = useState<'COMBAT' | 'TAMING'>('COMBAT');
  const [selectedWildSpeciesId, setSelectedWildSpeciesId] =
    useState<string>('inferno_blaze');
  const [tameAttemptsOnCurrent, setTameAttemptsOnCurrent] = useState<number>(0);

  const [selectedEnemyId, setSelectedEnemyId] =
    useState<string>('skeleton_marksman');
  const activeEnemy = useMemo(
    () =>
      COMBAT_ENCOUNTERS.find((e) => e.id === selectedEnemyId) ||
      COMBAT_ENCOUNTERS[0],
    [selectedEnemyId]
  );
  const [enemyCurrentHp, setEnemyCurrentHp] = useState<number>(
    COMBAT_ENCOUNTERS[1].maxHp
  );

  // 5. Floating Canvas Numbers & Server Console Logs
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextParticle[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[Server] Loading Pet v1.2.0 by The Killer D God (Paper 1.21.4-R0.1-SNAPSHOT)...',
    '[Pet] Registered 6 tameable companion species and 54-slot /pet gui.',
    '[Pet] Active companion "Fenrir" (Lv.6 Shadow Direwolf) bound to The Killer D God.',
  ]);
  const [commandInput, setCommandInput] = useState<string>('/pet info');

  // 6. Custom Species Form State (in Configurator Tab)
  const [newSpeciesName, setNewSpeciesName] = useState<string>('Sculk Phantom Wyrm');
  const [newSpeciesEntity, setNewSpeciesEntity] = useState<PetEntityType>('ALLAY');
  const [newSpeciesItem, setNewSpeciesItem] = useState<string>('AMETHYST_SHARD');
  const [newSpeciesChance, setNewSpeciesChance] = useState<number>(30);
  const [newSpeciesBaseHp, setNewSpeciesBaseHp] = useState<number>(32);
  const [newSpeciesBaseDmg, setNewSpeciesBaseDmg] = useState<number>(8);
  const [newSpeciesAbility, setNewSpeciesAbility] = useState<string>('Amethyst Resonance');

  const appendLog = (msg: string) => {
    setConsoleLogs((prev) => [...prev.slice(-28), msg]);
  };

  const spawnFloatingText = (text: string, color: string, xOffset = 0) => {
    setFloatingTexts((prev) => [
      ...prev.slice(-10),
      {
        id: Date.now() + Math.random(),
        x: 380 + xOffset + (Math.random() - 0.5) * 60,
        y: 120 + (Math.random() - 0.5) * 20,
        text,
        color,
        alpha: 1,
        vy: -1.1,
      },
    ]);
  };

  // Computed Pet Stats
  const requiredXp = useMemo(
    () =>
      calculateRequiredXp(
        activePet.level,
        pluginConfig.baseXpRequirement,
        pluginConfig.xpGrowthMultiplier
      ),
    [activePet.level, pluginConfig.baseXpRequirement, pluginConfig.xpGrowthMultiplier]
  );

  const computedStats = useMemo(() => {
    const maxHp = +(
      activeSpecies.baseHealth +
      (activePet.level - 1) * activeSpecies.healthPerLevel
    ).toFixed(1);
    const rawDamage =
      activeSpecies.baseDamage +
      (activePet.level - 1) * activeSpecies.damagePerLevel;
    const fangsRank = activePet.unlockedSkills['ferocious_fangs'] || 0;
    const finalDamage = +(rawDamage * (1 + 0.12 * fangsRank)).toFixed(1);

    const armorObj =
      ARMOR_TIERS.find((a) => a.tier === activePet.armorTier) || ARMOR_TIERS[0];
    const wisdomRank = activePet.unlockedSkills['scholar_blessing'] || 0;
    const hatXpBonus = activePet.hatCosmetic === 'ROYAL_GOLD_CROWN' ? 0.1 : 0;
    const xpMultiplier = +(1 + 0.15 * wisdomRank + hatXpBonus).toFixed(2);

    return {
      maxHp,
      finalDamage,
      defenseBonus: armorObj.defenseBonus,
      damageReductionPercent: armorObj.damageReductionPercent,
      xpMultiplier,
      evolutionTitle: getEvolutionTitle(activePet.level),
    };
  }, [activeSpecies, activePet]);

  // Update active pet helper
  const updateActivePet = (
    updater: (prev: ActiveCompanionPet) => ActiveCompanionPet,
    logMsg?: string
  ) => {
    setTamedPets((prevList) =>
      prevList.map((pet) => (pet.uuid === activePet.uuid ? updater(pet) : pet))
    );
    if (logMsg) appendLog(logMsg);
  };

  // Grant XP & handle Level-Up loop
  const grantPetExperience = (rawAmount: number, reasonLabel: string) => {
    const boostedXp = Math.round(rawAmount * computedStats.xpMultiplier);
    let didLevelUp = false;
    let finalLvl = activePet.level;

    updateActivePet((pet) => {
      if (pet.level >= pluginConfig.maxPetLevel) {
        return { ...pet, currentXp: 0 };
      }
      let xp = pet.currentXp + boostedXp;
      let lvl = pet.level;
      let sp = pet.skillPoints;

      while (
        lvl < pluginConfig.maxPetLevel &&
        xp >=
          calculateRequiredXp(
            lvl,
            pluginConfig.baseXpRequirement,
            pluginConfig.xpGrowthMultiplier
          )
      ) {
        xp -= calculateRequiredXp(
          lvl,
          pluginConfig.baseXpRequirement,
          pluginConfig.xpGrowthMultiplier
        );
        lvl++;
        sp++;
        didLevelUp = true;
      }
      finalLvl = lvl;
      return {
        ...pet,
        level: lvl,
        currentXp: xp,
        skillPoints: sp,
        rideableUnlocked: lvl >= pluginConfig.allowPetRidingAtLevel || pet.rideableUnlocked,
      };
    });

    if (didLevelUp) {
      soundFX.playLevelUp();
      spawnFloatingText(`★ LEVEL UP! Lv.${finalLvl}`, '#FACC15', -30);
      appendLog(
        `[Pet] ★ LEVEL UP! ${activePet.customName} reached Level ${finalLvl} (+1 Skill Point)!`
      );
    } else {
      soundFX.playXpOrb();
      spawnFloatingText(`+${boostedXp} XP`, '#10B981', -20);
      appendLog(
        `[Pet] ${activePet.customName} gained +${boostedXp} XP (${reasonLabel}).`
      );
    }
  };

  // Combat Attack Handler
  const handlePetCombatStrike = (useSpecialAbility: boolean) => {
    soundFX.playCombatHit();
    const mult = useSpecialAbility ? 1.85 : 1.0;
    const dmgDealt = +(computedStats.finalDamage * mult).toFixed(1);
    const nextHp = Math.max(0, +(enemyCurrentHp - dmgDealt).toFixed(1));

    spawnFloatingText(
      useSpecialAbility
        ? `⚡ ${activeSpecies.specialAbilityName} -${dmgDealt}`
        : `-${dmgDealt} DMG`,
      useSpecialAbility ? '#F59E0B' : '#F87171',
      170
    );

    if (nextHp <= 0) {
      // Mob defeated!
      setEnemyCurrentHp(activeEnemy.maxHp);
      updateActivePet((p) => ({ ...p, killsCount: p.killsCount + 1 }));
      grantPetExperience(activeEnemy.xpReward, `Slain ${activeEnemy.name}`);
      appendLog(
        `[Combat] ${activePet.customName} defeated ${activeEnemy.name}! Loot: ${activeEnemy.dropLabel}.`
      );
    } else {
      setEnemyCurrentHp(nextHp);
    }
  };

  // Wild Mob Taming Attempt Handler
  const wildSpeciesTarget = useMemo(
    () =>
      speciesList.find((s) => s.id === selectedWildSpeciesId) || speciesList[1],
    [speciesList, selectedWildSpeciesId]
  );

  const handleFeedWildMob = () => {
    const roll = Math.floor(Math.random() * 100);
    // Increase effective chance slightly after each attempt so user never gets frustrated
    const effectiveChance = Math.min(
      95,
      wildSpeciesTarget.tameChancePercent + tameAttemptsOnCurrent * 15
    );

    if (roll < effectiveChance) {
      soundFX.playTameSuccess();
      spawnFloatingText(`❤ TAMED ${wildSpeciesTarget.speciesName}!`, '#10B981', 140);
      setTameAttemptsOnCurrent(0);

      const newPet: ActiveCompanionPet = {
        uuid: `pet-uuid-${Date.now()}`,
        speciesId: wildSpeciesTarget.id,
        customName: wildSpeciesTarget.speciesName.split(' ')[0],
        nameColorCode: '&a',
        ownerName: pluginConfig.authorName,
        level: 1,
        currentXp: 0,
        skillPoints: 1,
        unlockedSkills: {},
        particleTrail: 'FLAME_SPIRAL',
        hatCosmetic: 'NONE',
        collarHex: '#10B981',
        collarColorName: 'Emerald Green',
        armorTier: 'NONE',
        behaviorMode: 'FOLLOW_OWNER',
        rideableUnlocked: false,
        isMounted: false,
        currentHp: wildSpeciesTarget.baseHealth,
        killsCount: 0,
        tamedTimestamp: 'Just Tamed in Sandbox',
      };

      setTamedPets((prev) => [...prev, newPet]);
      setActivePetUuid(newPet.uuid);
      appendLog(
        `[Pet] ❤ TAME SUCCESS! Bound ${wildSpeciesTarget.speciesName} ("${newPet.customName}") to ${pluginConfig.authorName}!`
      );
    } else {
      soundFX.playTameAttemptFail();
      setTameAttemptsOnCurrent((c) => c + 1);
      spawnFloatingText(`Resisted (${effectiveChance}% chance)`, '#94A3B8', 140);
      appendLog(
        `[Pet] Wild ${wildSpeciesTarget.speciesName} ate 1x ${wildSpeciesTarget.tamingItemMaterial} but resisted taming (Rolled ${roll} vs ${effectiveChance}%). Feed again!`
      );
    }
  };

  // Skill Upgrade Handler
  const handleUpgradeSkill = (skillId: string) => {
    const skillNode = PET_SKILL_TREE.find((s) => s.id === skillId);
    if (!skillNode) return;

    const currentRank = activePet.unlockedSkills[skillId] || 0;
    if (activePet.level < skillNode.requiredLevel) {
      soundFX.playTameAttemptFail();
      appendLog(
        `[Skills] Requires Companion Level ${skillNode.requiredLevel} to unlock ${skillNode.name}.`
      );
      return;
    }
    if (currentRank >= skillNode.maxRank) {
      soundFX.playGuiClick();
      appendLog(`[Skills] ${skillNode.name} is already at Maximum Rank (${skillNode.maxRank}).`);
      return;
    }
    if (activePet.skillPoints < skillNode.costPoints) {
      soundFX.playTameAttemptFail();
      appendLog(
        `[Skills] Not enough Skill Points! Need ${skillNode.costPoints} SP (Have ${activePet.skillPoints} SP). Level up your pet to earn more.`
      );
      return;
    }

    soundFX.playLevelUp();
    updateActivePet(
      (prev) => ({
        ...prev,
        skillPoints: prev.skillPoints - skillNode.costPoints,
        unlockedSkills: {
          ...prev.unlockedSkills,
          [skillId]: currentRank + 1,
        },
      }),
      `[Skills] Upgraded ${skillNode.name} to Rank ${currentRank + 1}/${skillNode.maxRank}!`
    );
  };

  const handleRespecSkills = () => {
    soundFX.playGuiClick();
    const totalSpent = Object.entries(activePet.unlockedSkills).reduce(
      (acc, [id, rank]) => {
        const node = PET_SKILL_TREE.find((s) => s.id === id);
        return acc + (node ? node.costPoints * rank : rank);
      },
      0
    );
    updateActivePet(
      (prev) => ({
        ...prev,
        skillPoints: prev.skillPoints + totalSpent,
        unlockedSkills: {},
      }),
      `[Skills] Reset skill tree for ${activePet.customName} and refunded +${totalSpent} Skill Points.`
    );
  };

  // Execute in-game `/pet` command in Sandbox Console
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = commandInput.trim();
    if (!raw) return;
    soundFX.playGuiClick();

    const parts = raw.replace(/^\//, '').split(/\s+/);
    const rootCmd = parts[0]?.toLowerCase();
    const subCmd = parts[1]?.toLowerCase() || 'help';

    if (rootCmd !== 'pet' && rootCmd !== 'pets' && rootCmd !== 'petadmin') {
      appendLog(`> ${raw}`);
      appendLog(`[Server] Unknown command. Try /pet help, /pet info, /pet rename, /pet trail, /pet addxp`);
      return;
    }

    appendLog(`> ${raw}`);
    if (subCmd === 'help') {
      appendLog(
        `[Pet] Commands by ${pluginConfig.authorName}: /pet gui | /pet info | /pet rename <name> | /pet trail <id> | /pet summon <species> | /pet addxp <amount> | /pet ride`
      );
    } else if (subCmd === 'info') {
      appendLog(
        `[Pet] ★ ${activePet.customName} (Lv.${activePet.level} ${activeSpecies.speciesName}) · HP: ${computedStats.maxHp} · DMG: ${computedStats.finalDamage} · Trail: ${activePet.particleTrail} · Owner: ${activePet.ownerName}`
      );
    } else if (subCmd === 'gui' || subCmd === 'customize') {
      setActiveTab('CUSTOMIZE');
      appendLog(`[Pet] Opened 54-slot Pet Studio GUI for ${activePet.customName}.`);
    } else if (subCmd === 'rename') {
      const newName = parts.slice(2).join(' ');
      if (!newName) {
        appendLog(`[Pet] Usage: /pet rename <NewCompanionName>`);
      } else {
        updateActivePet((p) => ({ ...p, customName: newName }));
        appendLog(`[Pet] Renamed active companion to "${newName}".`);
      }
    } else if (subCmd === 'addxp') {
      const amt = parseInt(parts[2] || '200', 10) || 200;
      grantPetExperience(amt, '/pet addxp command');
    } else if (subCmd === 'trail') {
      const trailArg = (parts[2] || '').toUpperCase();
      const match = PARTICLE_TRAILS.find((t) => t.id === trailArg);
      if (match) {
        updateActivePet((p) => ({ ...p, particleTrail: match.id }));
        appendLog(`[Pet] Set particle trail to ${match.label}.`);
      } else {
        appendLog(
          `[Pet] Available trails: ${PARTICLE_TRAILS.map((t) => t.id).join(', ')}`
        );
      }
    } else if (subCmd === 'ride') {
      updateActivePet((p) => ({ ...p, isMounted: !p.isMounted }));
      appendLog(
        `[Pet] Toggled mounted state on ${activePet.customName}.`
      );
    } else if (subCmd === 'summon') {
      const spArg = (parts[2] || '').toLowerCase();
      const foundSp = speciesList.find((s) => s.id === spArg);
      if (foundSp) {
        updateActivePet((p) => ({ ...p, speciesId: foundSp.id }));
        appendLog(`[Pet] Summoned species ${foundSp.speciesName}!`);
      } else {
        appendLog(
          `[Pet] Available species IDs: ${speciesList.map((s) => s.id).join(', ')}`
        );
      }
    } else {
      appendLog(`[Pet] Executed /pet ${subCmd}. Type /pet help for subcommands.`);
    }
    setCommandInput('');
  };

  // Add Custom Species in Configurator
  const handleCreateCustomSpecies = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newSpeciesName.trim();
    if (!cleanName) return;
    soundFX.playTameSuccess();

    const idSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    const created: PetSpeciesConfig = {
      id: idSlug || `custom_pet_${speciesList.length + 1}`,
      speciesName: cleanName,
      bukkitEntity: newSpeciesEntity,
      role: 'Custom Server Companion',
      tamingItemMaterial: newSpeciesItem.toUpperCase().trim() || 'GOLDEN_APPLE',
      tamingItemLabel: newSpeciesItem.replace(/_/g, ' '),
      tameChancePercent: Math.max(5, Math.min(100, newSpeciesChance)),
      baseHealth: Math.max(10, newSpeciesBaseHp),
      healthPerLevel: 4.5,
      baseDamage: Math.max(2, newSpeciesBaseDmg),
      damagePerLevel: 1.6,
      baseSpeed: 0.35,
      specialAbilityName: newSpeciesAbility.trim() || 'Arcane Strike',
      specialAbilityDescription:
        'Custom server species ability configured in Pet Studio by The Killer D God.',
      primaryHex: '#38BDF8',
      secondaryHex: '#0284C7',
      eyeHex: '#FACC15',
    };

    setSpeciesList((prev) => [...prev, created]);
    setSelectedWildSpeciesId(created.id);
    appendLog(
      `[Configurator] Added new tameable species "${created.speciesName}" (${created.id}) to config.yml!`
    );
  };

  // Generate All Java / YAML / Maven / GitHub Workflow Files dynamically
  const generatedFiles = useMemo(
    () =>
      generatePluginFiles(
        pluginConfig,
        speciesList,
        activePet,
        githubOwner,
        githubRepo
      ),
    [pluginConfig, speciesList, activePet, githubOwner, githubRepo]
  );

  // Download Full Maven Plugin ZIP
  const handleDownloadFullPluginZip = () => {
    soundFX.playLevelUp();
    const entries = convertToZipEntries(generatedFiles);
    const zipBlob = buildZipBlob(entries);
    triggerDownloadBlob(
      zipBlob,
      `${pluginConfig.pluginName}-${pluginConfig.pluginVersion}-by-TheKillerDGod.zip`
    );
    appendLog(
      `[Export] Downloaded ${pluginConfig.pluginName}-${pluginConfig.pluginVersion}-by-TheKillerDGod.zip (${generatedFiles.length} project files).`
    );
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFX.enabled = next;
    if (next) soundFX.playGuiClick();
  };

  const xpProgressPercent = Math.min(
    100,
    Math.round((activePet.currentXp / Math.max(1, requiredXp)) * 100)
  );
  const nameColorHex =
    MINECRAFT_COLOR_CODES.find((c) => c.code === activePet.nameColorCode)?.hex ||
    '#FFAA00';

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#0B0F17]/95 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('SANDBOX');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 font-display whitespace-nowrap shrink-0"
        >
          Pet Studio
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={() => {
              soundFX.playGuiClick();
              setActiveTab('SANDBOX');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'SANDBOX'
                ? 'text-emerald-400 underline underline-offset-8 decoration-2'
                : 'hover:text-slate-100'
            }`}
          >
            Live Sandbox
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playGuiClick();
              setActiveTab('CUSTOMIZE');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'CUSTOMIZE'
                ? 'text-emerald-400 underline underline-offset-8 decoration-2'
                : 'hover:text-slate-100'
            }`}
          >
            Customization GUI
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playGuiClick();
              setActiveTab('SKILL_TREE');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'SKILL_TREE'
                ? 'text-emerald-400 underline underline-offset-8 decoration-2'
                : 'hover:text-slate-100'
            }`}
          >
            Skill Tree
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playGuiClick();
              setActiveTab('SOURCE_CODE');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'SOURCE_CODE'
                ? 'text-emerald-400 underline underline-offset-8 decoration-2'
                : 'hover:text-slate-100'
            }`}
          >
            Java Source
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playGuiClick();
              setActiveTab('GITHUB_HOSTING');
            }}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'GITHUB_HOSTING'
                ? 'text-emerald-400 underline underline-offset-8 decoration-2'
                : 'hover:text-slate-100'
            }`}
          >
            GitHub &amp; Release
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadFullPluginZip}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Download Plugin (.zip)
          </button>
        </div>
      </header>

      {/* Main Container (1440px Desktop Presence) */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Plugin Identity & Active Companion Telemetry Bar */}
        <section className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              {/* Clean unboxed metadata with typographic separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="text-amber-400 font-semibold">
                  Plugin: {pluginConfig.pluginName} v{pluginConfig.pluginVersion}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-semibold">
                  Developer: {pluginConfig.authorName}
                </span>
                <span aria-hidden="true">·</span>
                <span>Paper &amp; Spigot {pluginConfig.apiVersion}.4</span>
                <span aria-hidden="true">·</span>
                <span>Package: {pluginConfig.mainPackage}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-display">
                Companion Pet Taming, Leveling &amp; Customization Workbench
              </h1>
            </div>

            {/* Mobile/Tablet Workspace Mode Switcher + Sound Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleSound}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Toggle synthesized Minecraft sound effects"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SFX On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    <span>SFX Muted</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playGuiClick();
                  setActiveTab('CONFIGURATOR');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Configurator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playGuiClick();
                  setActiveTab('GITHUB_HOSTING');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>GitHub Hosting &amp; .JAR Download</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playGuiClick();
                  setActiveTab('SOURCE_CODE');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Java Files ({generatedFiles.length})</span>
              </button>
            </div>
          </div>

          {/* Persistent Active Companion HUD & Minecraft XP Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">Active Bound Companion:</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: nameColorHex }}
                  >
                    [Lv.{activePet.level}] ★ {activePet.customName}
                  </span>
                  <span className="text-xs text-slate-400">
                    · {activeSpecies.speciesName}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  <span>Rank: {computedStats.evolutionTitle}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="text-emerald-400 font-mono tabular-nums">
                    {activePet.skillPoints} Skill Points Available
                  </span>
                </div>
              </div>

              {/* Quick Companion Switcher */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {tamedPets.map((pet) => {
                  const isCurrent = pet.uuid === activePet.uuid;
                  return (
                    <button
                      key={pet.uuid}
                      type="button"
                      onClick={() => {
                        soundFX.playGuiClick();
                        setActivePetUuid(pet.uuid);
                        appendLog(
                          `[/pet summon] Switched active companion to ${pet.customName} (Lv.${pet.level}).`
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pet.customName} (Lv.{pet.level})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minecraft Experience Progress Bar */}
            <div className="lg:col-span-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-emerald-400 font-semibold">
                  EXP Level {activePet.level} / {pluginConfig.maxPetLevel}
                </span>
                <span className="text-slate-300">
                  {activePet.currentXp} / {requiredXp} XP ({xpProgressPercent}%)
                </span>
              </div>
              <div className="w-full h-3.5 rounded bg-slate-950 border border-slate-700 overflow-hidden p-0.5">
                <div
                  className="h-full bg-emerald-500 transition-transform duration-150 origin-left"
                  style={{ transform: `scaleX(${xpProgressPercent / 100})` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                XP Gain Multiplier: {computedStats.xpMultiplier}x · Kills: {activePet.killsCount}
              </div>
            </div>

            {/* Live Scaled Bukkit Attributes */}
            <div className="lg:col-span-3 grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
              <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800">
                <div className="text-[11px] text-slate-400">MAX HP</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">
                  {computedStats.maxHp} ❤
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800">
                <div className="text-[11px] text-slate-400">ATTACK</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">
                  {computedStats.finalDamage} ⚔
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800">
                <div className="text-[11px] text-slate-400">DEFENSE</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">
                  +{computedStats.defenseBonus} 🛡
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Bar (visible on small screens) */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800">
            {(
              [
                ['SANDBOX', 'Live Sandbox'],
                ['CUSTOMIZE', 'Customize GUI'],
                ['SKILL_TREE', 'Skill Tree'],
                ['CONFIGURATOR', 'Configurator'],
                ['SOURCE_CODE', 'Java Source'],
                ['GITHUB_HOSTING', 'GitHub & .JAR'],
              ] as [WorkspaceTab, string][]
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap shrink-0 ${
                  activeTab === tabKey
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* =====================================================================
            TAB 1: LIVE SANDBOX (TAMING, COMBAT LEVELING & SERVER CONSOLE)
           ===================================================================== */}
        {activeTab === 'SANDBOX' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Live 2D Minecraft Pet Arena + Mode Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Arena Viewport Card */}
              <div className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">
                      Live Minecraft Companion Arena
                    </h2>
                    <p className="text-xs text-slate-400">
                      Test taming mechanics, combat XP leveling, particle trails, and headgear in real time
                    </p>
                  </div>

                  {/* Interactive Segmented Mode Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playGuiClick();
                        setArenaMode('COMBAT');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        arenaMode === 'COMBAT'
                          ? 'bg-emerald-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Combat &amp; XP Training</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playGuiClick();
                        setArenaMode('TAMING');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        arenaMode === 'TAMING'
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>Wild Mob Taming</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Pixel Pet Canvas */}
                <PixelPetCanvas
                  activePet={activePet}
                  species={activeSpecies}
                  wildSpecies={arenaMode === 'TAMING' ? wildSpeciesTarget : null}
                  activeEnemy={arenaMode === 'COMBAT' ? activeEnemy : null}
                  enemyCurrentHp={enemyCurrentHp}
                  floatingTexts={floatingTexts}
                  onCanvasAttackOrInteract={() => {
                    if (arenaMode === 'TAMING') {
                      handleFeedWildMob();
                    } else {
                      handlePetCombatStrike(false);
                    }
                  }}
                />

                {/* Mode-Specific Action Controls Below Canvas */}
                {arenaMode === 'COMBAT' ? (
                  <div className="space-y-4 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-300 font-medium">
                        Select Target Dungeon Mob to Train Your Companion:
                      </div>
                      <div className="text-xs font-mono text-amber-400 tabular-nums">
                        Target HP: {enemyCurrentHp} / {activeEnemy.maxHp}
                      </div>
                    </div>

                    {/* Enemy Selector Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {COMBAT_ENCOUNTERS.map((mob) => {
                        const selected = mob.id === activeEnemy.id;
                        return (
                          <button
                            key={mob.id}
                            type="button"
                            onClick={() => {
                              soundFX.playGuiClick();
                              setSelectedEnemyId(mob.id);
                              setEnemyCurrentHp(mob.maxHp);
                            }}
                            className={`p-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                              selected
                                ? 'bg-slate-900 border-rose-500 text-slate-100'
                                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="text-xs font-semibold truncate">{mob.name}</div>
                            <div className="text-[11px] font-mono text-emerald-400 tabular-nums mt-0.5">
                              Lv.{mob.level} · +{mob.xpReward} XP
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Combat Strike & Instant XP Catalyst Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handlePetCombatStrike(false)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Swords className="w-4 h-4" />
                        <span>Pet Strike (-{computedStats.finalDamage} HP)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePetCombatStrike(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          Cast {activeSpecies.specialAbilityName} (185% DMG)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          grantPetExperience(120, "Bottle o' Enchanting")
                        }
                        className="px-3.5 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-xs font-mono text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        +120 XP Bottle
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          grantPetExperience(450, 'Enchanted Golden Apple')
                        }
                        className="px-3.5 py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-xs font-mono text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        +450 XP Golden Apple
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-slate-300 font-medium">
                        Select Wild Species to Encounter &amp; Tame (Right-Click Simulation):
                      </div>
                      <div className="text-xs font-mono text-amber-400 tabular-nums">
                        Base Tame Rate: {wildSpeciesTarget.tameChancePercent}%
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {speciesList.map((sp) => {
                        const isSelected = sp.id === wildSpeciesTarget.id;
                        return (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => {
                              soundFX.playGuiClick();
                              setSelectedWildSpeciesId(sp.id);
                              setTameAttemptsOnCurrent(0);
                            }}
                            className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 border-amber-500 text-slate-100'
                                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-100 truncate">
                                {sp.speciesName}
                              </span>
                              <span className="text-[11px] font-mono text-amber-400 tabular-nums shrink-0">
                                {sp.tameChancePercent}%
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                              Catalyst: {sp.tamingItemMaterial}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      <div className="text-xs text-slate-300">
                        Required Catalyst:{' '}
                        <span className="font-mono text-amber-400 font-semibold">
                          1x {wildSpeciesTarget.tamingItemLabel} ({wildSpeciesTarget.tamingItemMaterial})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleFeedWildMob}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Heart className="w-4 h-4" />
                        <span>
                          Feed {wildSpeciesTarget.tamingItemLabel} to Tame
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Quick Customization Matrix + Live /pet Server Console */}
            <div className="lg:col-span-5 space-y-6">
              {/* Quick Companion Customization Card */}
              <div className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      Instant Companion Loadout
                    </h3>
                    <p className="text-xs text-slate-400">
                      Modify trails, hats, and stance or open the 54-slot GUI
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playGuiClick();
                      setActiveTab('CUSTOMIZE');
                    }}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Open /pet gui →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Particle Trail Effect
                    </label>
                    <select
                      value={activePet.particleTrail}
                      onChange={(e) => {
                        soundFX.playGuiClick();
                        updateActivePet(
                          (p) => ({
                            ...p,
                            particleTrail: e.target.value as ActiveCompanionPet['particleTrail'],
                          }),
                          `[/pet trail] Equipped ${e.target.value}`
                        );
                      }}
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    >
                      {PARTICLE_TRAILS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label} ({t.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Headgear Cosmetic
                    </label>
                    <select
                      value={activePet.hatCosmetic}
                      onChange={(e) => {
                        soundFX.playGuiClick();
                        updateActivePet(
                          (p) => ({
                            ...p,
                            hatCosmetic: e.target.value as ActiveCompanionPet['hatCosmetic'],
                          }),
                          `[/pet hat] Equipped ${e.target.value}`
                        );
                      }}
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    >
                      {HAT_COSMETICS.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Skill Upgrade Strip */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      Active Companion Skills:
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('SKILL_TREE')}
                      className="text-emerald-400 hover:underline text-xs cursor-pointer"
                    >
                      Full Skill Tree ({activePet.skillPoints} SP)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {PET_SKILL_TREE.slice(0, 3).map((sk) => {
                      const rank = activePet.unlockedSkills[sk.id] || 0;
                      return (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => handleUpgradeSkill(sk.id)}
                          className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500/60 text-left transition-colors cursor-pointer"
                        >
                          <div className="text-[11px] font-semibold text-slate-200 truncate">
                            {sk.name}
                          </div>
                          <div className="text-[10px] font-mono text-emerald-400 tabular-nums mt-0.5">
                            Rank {rank}/{sk.maxRank} (+Upgrade)
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Interactive Server Command Console (/pet) */}
              <div className="p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Paper 1.21.4 Command Console
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    PetCommandExecutor.java
                  </span>
                </div>

                <div className="h-44 overflow-y-auto rounded bg-[#080b12] border border-slate-800 p-3 font-mono text-xs space-y-1.5">
                  {consoleLogs.map((log, index) => (
                    <div
                      key={index}
                      className={
                        log.startsWith('>')
                          ? 'text-amber-300 font-semibold'
                          : log.includes('LEVEL UP') || log.includes('TAME SUCCESS')
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCommandSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="Type /pet info, /pet rename Draco, /pet addxp 300..."
                    className="flex-1 px-3 py-2 rounded bg-slate-950 border border-slate-700 font-mono text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Run Command
                  </button>
                </form>

                {/* Quick Command Preset Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '/pet info',
                    '/pet addxp 250',
                    '/pet trail ENCHANTMENT_TABLE',
                    '/pet ride',
                    '/pet help',
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => {
                        setCommandInput(cmd);
                      }}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: CUSTOMIZATION GUI (/pet gui 54-Slot Chest + Live Preview)
           ===================================================================== */}
        {activeTab === 'CUSTOMIZE' && (
          <MinecraftChestGuiPanel
            activePet={activePet}
            species={activeSpecies}
            requiredXp={requiredXp}
            allowRidingLevel={pluginConfig.allowPetRidingAtLevel}
            onUpdatePet={updateActivePet}
            onUpgradeSkill={handleUpgradeSkill}
          />
        )}

        {/* =====================================================================
            TAB 3: SKILL TREE & LEVELING CURVE
           ===================================================================== */}
        {activeTab === 'SKILL_TREE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: 3-Branch Companion Skill Tree */}
            <div className="lg:col-span-8 p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    Companion Skill Tree &amp; Passive Perks
                  </h2>
                  <p className="text-xs text-slate-400">
                    Each level-up grants +1 Skill Point · Stored in{' '}
                    <code className="text-amber-400">CompanionPet#unlockedSkills</code>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
                    Available Points: {activePet.skillPoints} SP
                  </span>
                  <button
                    type="button"
                    onClick={handleRespecSkills}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Skills</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PET_SKILL_TREE.map((node) => {
                  const rank = activePet.unlockedSkills[node.id] || 0;
                  const isMaxed = rank >= node.maxRank;
                  const levelLocked = activePet.level < node.requiredLevel;
                  return (
                    <div
                      key={node.id}
                      className={`p-4 rounded-lg border flex flex-col justify-between gap-3 ${
                        rank > 0
                          ? 'bg-slate-900/90 border-emerald-500/70'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-100">
                            {node.name}
                          </span>
                          <span className="text-xs font-mono text-amber-400 tabular-nums">
                            Rank {rank} / {node.maxRank}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span>Branch: {node.branch}</span>
                          <span aria-hidden="true">·</span>
                          <span>Req Lv.{node.requiredLevel}</span>
                          <span aria-hidden="true">·</span>
                          <span>Cost: {node.costPoints} SP</span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {node.description}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500">
                          Bukkit Hook: {node.bukkitEffectSummary}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isMaxed || levelLocked || activePet.skillPoints < node.costPoints}
                        onClick={() => handleUpgradeSkill(node.id)}
                        className={`w-full py-2 px-3 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          isMaxed
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 cursor-default'
                            : levelLocked
                            ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                            : activePet.skillPoints >= node.costPoints
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        {isMaxed
                          ? 'Maximum Rank Unlocked'
                          : levelLocked
                          ? `Requires Companion Level ${node.requiredLevel}`
                          : `Upgrade Skill (${node.costPoints} SP)`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 4 Columns: Leveling Formula & Attribute Scaling Table */}
            <div className="lg:col-span-4 p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Leveling Curve &amp; Attribute Table
                </h3>
                <p className="text-xs text-slate-400">
                  Live projection for <span className="text-slate-200">{activeSpecies.speciesName}</span>
                </p>
              </div>

              <div className="overflow-x-auto rounded border border-slate-800 bg-slate-950">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                      <th className="py-2 px-3">Level</th>
                      <th className="py-2 px-3 text-right">Req XP</th>
                      <th className="py-2 px-3 text-right">Max HP</th>
                      <th className="py-2 px-3 text-right">Attack</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {[1, 5, 10, 15, 20, 25, 30, 40, pluginConfig.maxPetLevel].map(
                      (lvl) => {
                        const xpReq = calculateRequiredXp(
                          lvl,
                          pluginConfig.baseXpRequirement,
                          pluginConfig.xpGrowthMultiplier
                        );
                        const hp = +(
                          activeSpecies.baseHealth +
                          (lvl - 1) * activeSpecies.healthPerLevel
                        ).toFixed(1);
                        const dmg = +(
                          activeSpecies.baseDamage +
                          (lvl - 1) * activeSpecies.damagePerLevel
                        ).toFixed(1);
                        const isCurrent = lvl === activePet.level;
                        return (
                          <tr
                            key={lvl}
                            className={
                              isCurrent
                                ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-900/40'
                            }
                          >
                            <td className="py-2 px-3">Lv.{lvl}</td>
                            <td className="py-2 px-3 text-right">{xpReq}</td>
                            <td className="py-2 px-3 text-right text-rose-400">
                              {hp}
                            </td>
                            <td className="py-2 px-3 text-right text-amber-400">
                              {dmg}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => grantPetExperience(requiredXp, 'Instant Level Boost')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Grant Instant Level-Up (+{requiredXp} XP)</span>
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: PLUGIN CONFIGURATOR (config.yml & Custom Species Creator)
           ===================================================================== */}
        {activeTab === 'CONFIGURATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 Columns: Global Plugin & Leveling Mechanics Settings */}
            <div className="lg:col-span-6 p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-base font-semibold text-slate-100">
                    Global Plugin Configuration (config.yml)
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Author: {pluginConfig.authorName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Plugin Name (plugin.yml)
                  </label>
                  <input
                    type="text"
                    value={pluginConfig.pluginName}
                    onChange={(e) =>
                      setPluginConfig((p) => ({
                        ...p,
                        pluginName: e.target.value || 'Pet',
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Developer Author Name
                  </label>
                  <input
                    type="text"
                    value={pluginConfig.authorName}
                    onChange={(e) =>
                      setPluginConfig((p) => ({
                        ...p,
                        authorName: e.target.value || 'The Killer D God',
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Max Companion Level
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={pluginConfig.maxPetLevel}
                    onChange={(e) =>
                      setPluginConfig((p) => ({
                        ...p,
                        maxPetLevel: Math.max(5, parseInt(e.target.value, 10) || 50),
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Base Level 1 XP Requirement
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={5000}
                    value={pluginConfig.baseXpRequirement}
                    onChange={(e) =>
                      setPluginConfig((p) => ({
                        ...p,
                        baseXpRequirement: Math.max(
                          20,
                          parseInt(e.target.value, 10) || 100
                        ),
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    XP Curve Growth Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    min={1.05}
                    max={2.0}
                    value={pluginConfig.xpGrowthMultiplier}
                    onChange={(e) =>
                      setPluginConfig((p) => ({
                        ...p,
                        xpGrowthMultiplier: Math.max(
                          1.05,
                          parseFloat(e.target.value) || 1.22
                        ),
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Minimum Level to Ride Pet (/pet ride)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={pluginConfig.allowPetRidingAtLevel}
                    onChange={(e) =>
                      setPluginConfig((p) => ({
                        ...p,
                        allowPetRidingAtLevel: Math.max(
                          1,
                          parseInt(e.target.value, 10) || 5
                        ),
                      }))
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Changes immediately update <code className="text-emerald-400">config.yml</code> and{' '}
                  <code className="text-amber-400">CompanionPet.java</code>.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('SOURCE_CODE')}
                  className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  View Updated YAML →
                </button>
              </div>
            </div>

            {/* Right 6 Columns: Add Custom Tameable Pet Species */}
            <div className="lg:col-span-6 p-5 rounded-lg border border-slate-800 bg-[#131B2E] space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <h2 className="text-base font-semibold text-slate-100">
                    Register Custom Tameable Species
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {speciesList.length} Species Active
                </span>
              </div>

              <form onSubmit={handleCreateCustomSpecies} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Species Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newSpeciesName}
                      onChange={(e) => setNewSpeciesName(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Bukkit EntityType
                    </label>
                    <select
                      value={newSpeciesEntity}
                      onChange={(e) =>
                        setNewSpeciesEntity(e.target.value as PetEntityType)
                      }
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
                    >
                      <option value="WOLF">WOLF</option>
                      <option value="BLAZE">BLAZE</option>
                      <option value="ALLAY">ALLAY</option>
                      <option value="AXOLOTL">AXOLOTL</option>
                      <option value="FOX">FOX</option>
                      <option value="IRON_GOLEM">IRON_GOLEM</option>
                      <option value="WARDEN_CUB">WARDEN</option>
                      <option value="ENDER_DRAGON_CUB">ENDER_DRAGON_CUB</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Taming Catalyst Material (Bukkit Material)
                    </label>
                    <input
                      type="text"
                      required
                      value={newSpeciesItem}
                      onChange={(e) => setNewSpeciesItem(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Taming Success Chance (%)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={newSpeciesChance}
                      onChange={(e) =>
                        setNewSpeciesChance(parseInt(e.target.value, 10) || 30)
                      }
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Base Health (HP)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={newSpeciesBaseHp}
                      onChange={(e) =>
                        setNewSpeciesBaseHp(parseInt(e.target.value, 10) || 30)
                      }
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Base Attack Damage
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={newSpeciesBaseDmg}
                      onChange={(e) =>
                        setNewSpeciesBaseDmg(parseInt(e.target.value, 10) || 8)
                      }
                      className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Special Ability Name
                  </label>
                  <input
                    type="text"
                    value={newSpeciesAbility}
                    onChange={(e) => setNewSpeciesAbility(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Species to Plugin &amp; Sandbox</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: JAVA SOURCE CODE & MAVEN PROJECT EXPORT
           ===================================================================== */}
        {activeTab === 'SOURCE_CODE' && (
          <PluginSourceIde
            files={generatedFiles}
            onDownloadFullZip={handleDownloadFullPluginZip}
          />
        )}

        {/* =====================================================================
            TAB 6: GITHUB HOSTING & AUTOMATIC .JAR RELEASE BUILDER
           ===================================================================== */}
        {activeTab === 'GITHUB_HOSTING' && (
          <GitHubHostingPanel
            config={pluginConfig}
            githubOwner={githubOwner}
            githubRepo={githubRepo}
            onChangeGithubOwner={setGithubOwner}
            onChangeGithubRepo={setGithubRepo}
            files={generatedFiles}
            onDownloadZip={handleDownloadFullPluginZip}
            onLog={appendLog}
          />
        )}
      </main>

      {/* Quiet, Clean Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">
              {pluginConfig.pluginName} v{pluginConfig.pluginVersion}
            </span>
            <span aria-hidden="true">·</span>
            <span>Developed by {pluginConfig.authorName}</span>
            <span aria-hidden="true">·</span>
            <span>Spigot &amp; Paper {pluginConfig.apiVersion}.4 API</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('SOURCE_CODE')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Inspect plugin.yml
            </button>
            <button
              type="button"
              onClick={handleDownloadFullPluginZip}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
            >
              Export Maven Project (.zip)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
