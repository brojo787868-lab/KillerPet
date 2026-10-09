import {
  ActiveCompanionPet,
  HAT_COSMETICS,
  PARTICLE_TRAILS,
  PET_SKILL_TREE,
  PetSpeciesConfig,
  PluginGlobalConfig,
} from '../types/petPlugin';
import { ZipFileEntry } from './zipBuilder';

export interface GeneratedPluginFile {
  id: string;
  filename: string;
  relativePath: string;
  language: 'java' | 'yaml' | 'xml' | 'markdown';
  description: string;
  content: string;
}

export function generatePluginFiles(
  config: PluginGlobalConfig,
  speciesList: PetSpeciesConfig[],
  activePet: ActiveCompanionPet,
  githubOwner = 'thekillerdgod',
  githubRepo = 'Pet-Plugin'
): GeneratedPluginFile[] {
  const pkg = config.mainPackage || 'com.thekillerdgod.pet';
  const pkgPath = pkg.replace(/\./g, '/');
  const cleanOwner = githubOwner.trim() || 'thekillerdgod';
  const cleanRepo = githubRepo.trim() || 'Pet-Plugin';
  const repoUrl = `https://github.com/${cleanOwner}/${cleanRepo}`;
  const jarFilename = `${config.pluginName}-${config.pluginVersion}-by-TheKillerDGod.jar`;

  const pluginYml = `# ============================================================
# Plugin: ${config.pluginName}
# Developer: ${config.authorName}
# Target API: Paper / Spigot ${config.apiVersion}
# ============================================================
name: ${config.pluginName}
version: '${config.pluginVersion}'
main: ${pkg}.PetPlugin
api-version: '${config.apiVersion}'
author: '${config.authorName}'
authors: ['${config.authorName}']
description: 'Allow players to tame, level up, and customize their own companion pets.'
website: 'https://github.com/thekillerdgod/pet-plugin'

commands:
  pet:
    description: 'Main command to tame, summon, level up, and customize your companion pet.'
    usage: '/pet <gui|summon|dismiss|info|rename|trail|hat|skill|ride|addxp|reload>'
    aliases: [pets, companion, mypet]
    permission: pet.use
  petadmin:
    description: 'Administrator controls for ${config.pluginName} by ${config.authorName}.'
    usage: '/petadmin <givepet|setlevel|addxp|reload>'
    permission: pet.admin

permissions:
  pet.use:
    description: 'Allows players to summon, view info, and manage their companion pets.'
    default: true
  pet.tame:
    description: 'Allows players to tame wild mobs into loyal companion pets.'
    default: true
  pet.customize:
    description: 'Allows players to customize pet names, particle trails, hats, and dyes.'
    default: true
  pet.ride:
    description: 'Allows players to mount and ride their companion pet at Level ${config.allowPetRidingAtLevel}+.'
    default: true
  pet.admin:
    description: 'Full administrative access to ${config.pluginName} configuration and XP grants.'
    default: op
`;

  const speciesYamlBlocks = speciesList
    .map(
      (s) => `  ${s.id}:
    display-name: "${s.speciesName}"
    entity-type: "${s.bukkitEntity === 'ENDER_DRAGON_CUB' ? 'ALLAY' : s.bukkitEntity === 'WARDEN_CUB' ? 'WARDEN' : s.bukkitEntity}"
    role: "${s.role}"
    taming-item: "${s.tamingItemMaterial}"
    tame-chance-percent: ${s.tameChancePercent}
    base-health: ${s.baseHealth}
    health-per-level: ${s.healthPerLevel}
    base-damage: ${s.baseDamage}
    damage-per-level: ${s.damagePerLevel}
    base-speed: ${s.baseSpeed}
    special-ability: "${s.specialAbilityName}"`
    )
    .join('\n');

  const configYml = `# ============================================================
# ${config.pluginName} v${config.pluginVersion} — Configuration
# Developed by: ${config.authorName}
# ============================================================

plugin-metadata:
  plugin-name: "${config.pluginName}"
  developer: "${config.authorName}"
  storage-mode: "${config.storageBackend}"

leveling-system:
  max-level: ${config.maxPetLevel}
  base-xp-requirement: ${config.baseXpRequirement}
  xp-growth-multiplier: ${config.xpGrowthMultiplier}
  skill-points-per-level: 1
  allow-pet-riding-at-level: ${config.allowPetRidingAtLevel}
  pvp-pet-combat: ${config.enablePvpPetCombat}
  auto-respawn-cooldown-seconds: ${config.autoRespawnCooldownSeconds}

cosmetics:
  default-name-color: "${activePet.nameColorCode}"
  default-particle-trail: "${activePet.particleTrail}"
  default-hat: "${activePet.hatCosmetic}"
  default-collar-color: "${activePet.collarColorName}"

pet-species:
${speciesYamlBlocks}

messages:
  prefix: "&8[&6${config.pluginName}&8] &7"
  tame-success: "&a❤ You tamed a &e%species% &aas your loyal companion! Use &6/pet gui &ato customize it."
  tame-failed: "&7The wild &f%species% &7consumed your &e%item% &7but resisted taming (&c%chance%%&7 chance)."
  level-up: "&6★ LEVEL UP! &fYour pet &e%pet_name% &freached &aLevel %level%&f! (&b+1 Skill Point&f)"
  customize-updated: "&a✔ Updated &e%pet_name%&a's customization in ${config.pluginName} Studio."
`;

  const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.thekillerdgod</groupId>
    <artifactId>Pet</artifactId>
    <version>${config.pluginVersion}</version>
    <packaging>jar</packaging>

    <name>${config.pluginName}</name>
    <description>Companion Pet Taming, Leveling &amp; Customization Plugin by ${config.authorName}</description>

    <properties>
        <java.version>21</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>papermc-repo</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
        <repository>
            <id>spigotmc-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>
    </repositories>

    <dependencies>
        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>1.21.4-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <finalName>${config.pluginName}-${config.pluginVersion}-by-TheKillerDGod</finalName>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
`;

  const petPluginJava = `package ${pkg};

import ${pkg}.command.PetCommandExecutor;
import ${pkg}.gui.PetCustomizationGUI;
import ${pkg}.listener.PetTameAndCombatListener;
import ${pkg}.manager.PetManager;
import org.bukkit.Bukkit;
import org.bukkit.NamespacedKey;
import org.bukkit.plugin.java.JavaPlugin;

/**
 * ${config.pluginName} — Minecraft Companion Pet Plugin
 * Author: ${config.authorName}
 * Allows players to tame, level up, and customize their own companion pets.
 */
public final class PetPlugin extends JavaPlugin {

    private static PetPlugin instance;
    private PetManager petManager;
    private PetCustomizationGUI customizationGUI;

    private NamespacedKey petOwnerKey;
    private NamespacedKey petSpeciesKey;

    @Override
    public void onEnable() {
        instance = this;
        saveDefaultConfig();

        this.petOwnerKey = new NamespacedKey(this, "pet_owner_uuid");
        this.petSpeciesKey = new NamespacedKey(this, "pet_species_id");

        this.petManager = new PetManager(this);
        this.customizationGUI = new PetCustomizationGUI(this, petManager);

        // Register Event Listeners for Taming, Combat XP, Leveling & GUI Clicks
        Bukkit.getPluginManager().registerEvents(new PetTameAndCombatListener(this, petManager), this);
        Bukkit.getPluginManager().registerEvents(customizationGUI, this);

        // Register /pet and /petadmin Commands
        PetCommandExecutor commandExecutor = new PetCommandExecutor(this, petManager, customizationGUI);
        if (getCommand("pet") != null) {
            getCommand("pet").setExecutor(commandExecutor);
            getCommand("pet").setTabCompleter(commandExecutor);
        }
        if (getCommand("petadmin") != null) {
            getCommand("petadmin").setExecutor(commandExecutor);
        }

        // Start Ambient Particle Trail & Pet Aura Scheduler (Every 4 Ticks)
        this.petManager.startParticleAndAuraTask();

        getLogger().info("==================================================");
        getLogger().info(" ${config.pluginName} v${config.pluginVersion} enabled successfully!");
        getLogger().info(" Developer: ${config.authorName}");
        getLogger().info(" Loaded " + petManager.getRegisteredSpeciesCount() + " Tameable Pet Species.");
        getLogger().info("==================================================");
    }

    @Override
    public void onDisable() {
        if (this.petManager != null) {
            this.petManager.saveAllPlayerPets();
            this.petManager.despawnAllActiveEntities();
        }
        getLogger().info("${config.pluginName} by ${config.authorName} has saved all companion data and shut down.");
    }

    public static PetPlugin getInstance() {
        return instance;
    }

    public PetManager getPetManager() {
        return petManager;
    }

    public PetCustomizationGUI getCustomizationGUI() {
        return customizationGUI;
    }

    public NamespacedKey getPetOwnerKey() {
        return petOwnerKey;
    }

    public NamespacedKey getPetSpeciesKey() {
        return petSpeciesKey;
    }
}
`;

  const companionPetJava = `package ${pkg}.model;

import org.bukkit.ChatColor;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Represents a player's tamed, leveled, and customized Companion Pet.
 * Author: ${config.authorName}
 */
public class CompanionPet {

    private final UUID petUniqueId;
    private final UUID ownerUuid;
    private final String speciesId;

    private String customName;
    private String nameColorCode;
    private int level;
    private double currentXp;
    private int skillPoints;

    private String particleTrail;
    private String hatCosmetic;
    private String collarColor;
    private String armorTier;
    private String behaviorMode;
    private final Map<String, Integer> unlockedSkills = new HashMap<>();

    public CompanionPet(UUID ownerUuid, String speciesId, String customName) {
        this.petUniqueId = UUID.randomUUID();
        this.ownerUuid = ownerUuid;
        this.speciesId = speciesId;
        this.customName = customName;
        this.nameColorCode = "${activePet.nameColorCode}";
        this.level = 1;
        this.currentXp = 0.0;
        this.skillPoints = 1;
        this.particleTrail = "${activePet.particleTrail}";
        this.hatCosmetic = "${activePet.hatCosmetic}";
        this.collarColor = "${activePet.collarColorName}";
        this.armorTier = "${activePet.armorTier}";
        this.behaviorMode = "${activePet.behaviorMode}";
    }

    public double getRequiredXpForNextLevel() {
        double base = ${config.baseXpRequirement}.0;
        double mult = ${config.xpGrowthMultiplier};
        return Math.round(base * Math.pow(mult, Math.max(0, this.level - 1)));
    }

    public boolean addExperience(double amount) {
        if (this.level >= ${config.maxPetLevel}) {
            this.currentXp = 0;
            return false;
        }
        this.currentXp += amount;
        boolean leveledUp = false;
        while (this.level < ${config.maxPetLevel} && this.currentXp >= getRequiredXpForNextLevel()) {
            this.currentXp -= getRequiredXpForNextLevel();
            this.level++;
            this.skillPoints++;
            leveledUp = true;
        }
        return leveledUp;
    }

    public String getFormattedNametag(String ownerName) {
        String raw = "&8[&aLv." + this.level + "&8] " + this.nameColorCode + "★ " + this.customName
                + " &7(" + ownerName + "'s Pet)";
        return ChatColor.translateAlternateColorCodes('&', raw);
    }

    public int getSkillRank(String skillId) {
        return unlockedSkills.getOrDefault(skillId, 0);
    }

    public void upgradeSkill(String skillId, int cost) {
        if (this.skillPoints >= cost) {
            this.skillPoints -= cost;
            unlockedSkills.put(skillId, getSkillRank(skillId) + 1);
        }
    }

    public UUID getPetUniqueId() { return petUniqueId; }
    public UUID getOwnerUuid() { return ownerUuid; }
    public String getSpeciesId() { return speciesId; }
    public String getCustomName() { return customName; }
    public void setCustomName(String customName) { this.customName = customName; }
    public String getNameColorCode() { return nameColorCode; }
    public void setNameColorCode(String nameColorCode) { this.nameColorCode = nameColorCode; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public double getCurrentXp() { return currentXp; }
    public int getSkillPoints() { return skillPoints; }
    public String getParticleTrail() { return particleTrail; }
    public void setParticleTrail(String particleTrail) { this.particleTrail = particleTrail; }
    public String getHatCosmetic() { return hatCosmetic; }
    public void setHatCosmetic(String hatCosmetic) { this.hatCosmetic = hatCosmetic; }
    public String getCollarColor() { return collarColor; }
    public void setCollarColor(String collarColor) { this.collarColor = collarColor; }
    public String getArmorTier() { return armorTier; }
    public void setArmorTier(String armorTier) { this.armorTier = armorTier; }
    public String getBehaviorMode() { return behaviorMode; }
    public void setBehaviorMode(String behaviorMode) { this.behaviorMode = behaviorMode; }
    public Map<String, Integer> getUnlockedSkills() { return unlockedSkills; }
}
`;

  const petManagerJava = `package ${pkg}.manager;

import ${pkg}.PetPlugin;
import ${pkg}.model.CompanionPet;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeInstance;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Entity;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.ExperienceOrb;
import org.bukkit.entity.Item;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Tameable;
import org.bukkit.inventory.EntityEquipment;
import org.bukkit.inventory.ItemStack;
import org.bukkit.persistence.PersistentDataType;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Manages active CompanionPet instances, attribute scaling, hats, and particle trails.
 * Author: ${config.authorName}
 */
public class PetManager {

    private final PetPlugin plugin;
    private final Map<UUID, CompanionPet> playerPets = new HashMap<>();
    private final Map<UUID, LivingEntity> spawnedEntities = new HashMap<>();

    public PetManager(PetPlugin plugin) {
        this.plugin = plugin;
    }

    public int getRegisteredSpeciesCount() {
        ConfigurationSection sec = plugin.getConfig().getConfigurationSection("pet-species");
        return sec != null ? sec.getKeys(false).size() : ${speciesList.length};
    }

    public CompanionPet getActivePet(UUID playerUuid) {
        return playerPets.get(playerUuid);
    }

    public CompanionPet createAndBindPet(Player owner, String speciesId, String initialName) {
        CompanionPet pet = new CompanionPet(owner.getUniqueId(), speciesId, initialName);
        playerPets.put(owner.getUniqueId(), pet);
        spawnOrRefreshPetEntity(owner, pet);
        return pet;
    }

    public void spawnOrRefreshPetEntity(Player owner, CompanionPet pet) {
        despawnPetEntity(owner.getUniqueId());

        String entityTypeName = plugin.getConfig().getString(
                "pet-species." + pet.getSpeciesId() + ".entity-type", "WOLF");
        EntityType type;
        try {
            type = EntityType.valueOf(entityTypeName.toUpperCase());
        } catch (IllegalArgumentException ex) {
            type = EntityType.WOLF;
        }

        Location spawnLoc = owner.getLocation().add(owner.getLocation().getDirection().multiply(1.5));
        Entity rawEntity = owner.getWorld().spawnEntity(spawnLoc, type);
        if (!(rawEntity instanceof LivingEntity living)) {
            rawEntity.remove();
            return;
        }

        living.setCustomName(pet.getFormattedNametag(owner.getName()));
        living.setCustomNameVisible(true);
        living.setRemoveWhenFarAway(false);

        // Bind owner & species in PersistentDataContainer
        living.getPersistentDataContainer().set(
                plugin.getPetOwnerKey(), PersistentDataType.STRING, owner.getUniqueId().toString());
        living.getPersistentDataContainer().set(
                plugin.getPetSpeciesKey(), PersistentDataType.STRING, pet.getSpeciesId());

        if (living instanceof Tameable tameable) {
            tameable.setOwner(owner);
            tameable.setTamed(true);
        }

        applyLevelScaledAttributes(living, pet);
        equipCosmeticHat(living, pet);

        spawnedEntities.put(owner.getUniqueId(), living);
    }

    public void applyLevelScaledAttributes(LivingEntity entity, CompanionPet pet) {
        String path = "pet-species." + pet.getSpeciesId() + ".";
        double baseHp = plugin.getConfig().getDouble(path + "base-health", 28.0);
        double hpPerLvl = plugin.getConfig().getDouble(path + "health-per-level", 4.5);
        double baseDmg = plugin.getConfig().getDouble(path + "base-damage", 6.0);
        double dmgPerLvl = plugin.getConfig().getDouble(path + "damage-per-level", 1.4);

        double maxHp = baseHp + (pet.getLevel() - 1) * hpPerLvl;
        double attackDmg = baseDmg + (pet.getLevel() - 1) * dmgPerLvl;

        AttributeInstance hpAttr = entity.getAttribute(Attribute.MAX_HEALTH);
        if (hpAttr != null) {
            hpAttr.setBaseValue(maxHp);
            entity.setHealth(maxHp);
        }

        AttributeInstance dmgAttr = entity.getAttribute(Attribute.ATTACK_DAMAGE);
        if (dmgAttr != null) {
            dmgAttr.setBaseValue(attackDmg);
        }
    }

    public void equipCosmeticHat(LivingEntity entity, CompanionPet pet) {
        EntityEquipment equip = entity.getEquipment();
        if (equip == null) return;

        Material hatMat = switch (pet.getHatCosmetic()) {
            case "ROYAL_GOLD_CROWN" -> Material.GOLDEN_HELMET;
            case "NETHERITE_HELMET" -> Material.NETHERITE_HELMET;
            case "ARCANE_WIZARD_HAT" -> Material.PURPLE_BANNER;
            case "REDSTONE_GOGGLES" -> Material.CARVED_PUMPKIN;
            case "END_CRYSTAL_HALO" -> Material.END_ROD;
            case "EMERALD_TIARA" -> Material.EMERALD_BLOCK;
            default -> Material.AIR;
        };

        equip.setHelmet(hatMat == Material.AIR ? null : new ItemStack(hatMat));
        equip.setHelmetDropChance(0.0f);
    }

    public void refreshLivePetMetadata(Player owner) {
        CompanionPet pet = playerPets.get(owner.getUniqueId());
        LivingEntity entity = spawnedEntities.get(owner.getUniqueId());
        if (pet != null && entity != null && entity.isValid()) {
            entity.setCustomName(pet.getFormattedNametag(owner.getName()));
            applyLevelScaledAttributes(entity, pet);
            equipCosmeticHat(entity, pet);
        }
    }

    public void despawnPetEntity(UUID ownerUuid) {
        LivingEntity existing = spawnedEntities.remove(ownerUuid);
        if (existing != null && existing.isValid()) {
            existing.remove();
        }
    }

    public void despawnAllActiveEntities() {
        for (LivingEntity entity : spawnedEntities.values()) {
            if (entity != null && entity.isValid()) {
                entity.remove();
            }
        }
        spawnedEntities.clear();
    }

    public void startParticleAndAuraTask() {
        Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            double angle = (System.currentTimeMillis() % 3600) / 3600.0 * Math.PI * 2;
            for (Map.Entry<UUID, LivingEntity> entry : spawnedEntities.entrySet()) {
                UUID ownerId = entry.getKey();
                LivingEntity entity = entry.getValue();
                CompanionPet pet = playerPets.get(ownerId);
                Player owner = Bukkit.getPlayer(ownerId);
                if (entity == null || !entity.isValid() || pet == null || owner == null) continue;

                // Render Selected Particle Trail
                Particle particle = switch (pet.getParticleTrail()) {
                    case "FLAME_SPIRAL" -> Particle.FLAME;
                    case "SOUL_FIRE_FLAME" -> Particle.SOUL_FIRE_FLAME;
                    case "ENCHANTMENT_TABLE" -> Particle.ENCHANT;
                    case "DRAGON_BREATH" -> Particle.DRAGON_BREATH;
                    case "CHERRY_LEAVES" -> Particle.CHERRY_LEAVES;
                    case "TOTEM_OF_UNDYING" -> Particle.TOTEM_OF_UNDYING;
                    case "SCULK_SOUL" -> Particle.SCULK_SOUL;
                    default -> null;
                };

                if (particle != null) {
                    Location loc = entity.getLocation().add(Math.cos(angle) * 0.65, 0.7, Math.sin(angle) * 0.65);
                    entity.getWorld().spawnParticle(particle, loc, 2, 0.05, 0.05, 0.05, 0.01);
                }

                // Vacuum Loot Magnet Skill Effect
                int magnetRank = pet.getSkillRank("magnetic_paws");
                if (magnetRank > 0) {
                    double radius = 6.0 + magnetRank * 3.0;
                    Collection<Entity> nearby = entity.getNearbyEntities(radius, radius, radius);
                    for (Entity e : nearby) {
                        if (e instanceof Item item && item.getPickupDelay() <= 0) {
                            item.teleport(owner.getLocation());
                        } else if (e instanceof ExperienceOrb orb) {
                            orb.teleport(owner.getLocation());
                        }
                    }
                }
            }
        }, 10L, 4L);
    }

    public void saveAllPlayerPets() {
        for (Map.Entry<UUID, CompanionPet> entry : playerPets.entrySet()) {
            String base = "saved-pets." + entry.getKey() + ".";
            CompanionPet pet = entry.getValue();
            plugin.getConfig().set(base + "species", pet.getSpeciesId());
            plugin.getConfig().set(base + "name", pet.getCustomName());
            plugin.getConfig().set(base + "color", pet.getNameColorCode());
            plugin.getConfig().set(base + "level", pet.getLevel());
            plugin.getConfig().set(base + "xp", pet.getCurrentXp());
            plugin.getConfig().set(base + "trail", pet.getParticleTrail());
            plugin.getConfig().set(base + "hat", pet.getHatCosmetic());
            plugin.getConfig().set(base + "collar", pet.getCollarColor());
            plugin.getConfig().set(base + "armor", pet.getArmorTier());
            plugin.getConfig().set(base + "behavior", pet.getBehaviorMode());
        }
        plugin.saveConfig();
    }
}
`;

  const petListenerJava = `package ${pkg}.listener;

import ${pkg}.PetPlugin;
import ${pkg}.manager.PetManager;
import ${pkg}.model.CompanionPet;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.attribute.Attribute;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.player.PlayerInteractEntityEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.persistence.PersistentDataType;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Handles custom wild mob taming, pet combat XP leveling, skill procs, and mounting.
 * Author: ${config.authorName}
 */
public class PetTameAndCombatListener implements Listener {

    private final PetPlugin plugin;
    private final PetManager petManager;

    public PetTameAndCombatListener(PetPlugin plugin, PetManager petManager) {
        this.plugin = plugin;
        this.petManager = petManager;
    }

    @EventHandler
    public void onPlayerTameOrInteractEntity(PlayerInteractEntityEvent event) {
        if (event.getHand() != EquipmentSlot.HAND) return;
        Player player = event.getPlayer();
        Entity clicked = event.getRightClicked();
        if (!(clicked instanceof LivingEntity living)) return;

        // Check if this entity is already a tamed Companion Pet
        String ownerUuidStr = living.getPersistentDataContainer().get(
                plugin.getPetOwnerKey(), PersistentDataType.STRING);

        if (ownerUuidStr != null) {
            if (ownerUuidStr.equals(player.getUniqueId().toString())) {
                CompanionPet pet = petManager.getActivePet(player.getUniqueId());
                if (pet != null) {
                    if (player.isSneaking()) {
                        event.setCancelled(true);
                        plugin.getCustomizationGUI().openGUI(player, pet);
                    } else if (pet.getLevel() >= ${config.allowPetRidingAtLevel}
                            && player.getInventory().getItemInMainHand().getType() == Material.AIR) {
                        event.setCancelled(true);
                        living.addPassenger(player);
                        player.sendMessage(ChatColor.translateAlternateColorCodes('&',
                                "&8[&6${config.pluginName}&8] &aMounted &e" + pet.getCustomName() + "&a!"));
                    }
                }
            }
            return;
        }

        // Wild Mob Taming Logic
        if (!player.hasPermission("pet.tame")) return;
        ItemStack handItem = player.getInventory().getItemInMainHand();
        if (handItem.getType() == Material.AIR) return;

        ConfigurationSection speciesSec = plugin.getConfig().getConfigurationSection("pet-species");
        if (speciesSec == null) return;

        for (String speciesKey : speciesSec.getKeys(false)) {
            String entityTypeStr = speciesSec.getString(speciesKey + ".entity-type", "WOLF");
            String tameMatStr = speciesSec.getString(speciesKey + ".taming-item", "BONE");
            int chance = speciesSec.getInt(speciesKey + ".tame-chance-percent", 35);
            String displayName = speciesSec.getString(speciesKey + ".display-name", speciesKey);

            if (living.getType().name().equalsIgnoreCase(entityTypeStr)
                    && handItem.getType().name().equalsIgnoreCase(tameMatStr)) {
                event.setCancelled(true);
                handItem.setAmount(handItem.getAmount() - 1);

                int roll = ThreadLocalRandom.current().nextInt(100);
                if (roll < chance) {
                    living.getWorld().spawnParticle(Particle.HEART, living.getLocation().add(0, 1.2, 0), 18, 0.4, 0.4, 0.4, 0.02);
                    living.getWorld().playSound(living.getLocation(), Sound.ENTITY_PLAYER_LEVELUP, 1.0f, 1.3f);
                    living.remove();

                    CompanionPet newPet = petManager.createAndBindPet(player, speciesKey, displayName);
                    player.sendMessage(ChatColor.translateAlternateColorCodes('&',
                            "&8[&6${config.pluginName}&8] &a❤ You tamed a &e" + newPet.getCustomName()
                                    + " &aas your companion! Use &6/pet gui &ato customize it."));
                } else {
                    living.getWorld().spawnParticle(Particle.SMOKE, living.getLocation().add(0, 1.0, 0), 12, 0.3, 0.3, 0.3, 0.02);
                    living.getWorld().playSound(living.getLocation(), Sound.ENTITY_VILLAGER_NO, 0.9f, 1.0f);
                    player.sendMessage(ChatColor.translateAlternateColorCodes('&',
                            "&8[&6${config.pluginName}&8] &7The wild &f" + displayName
                                    + " &7resisted taming (&e" + chance + "% &7chance). Try feeding another &6" + tameMatStr + "&7!"));
                }
                break;
            }
        }
    }

    @EventHandler
    public void onPetCombatDamage(EntityDamageByEntityEvent event) {
        Entity damager = event.getDamager();
        String ownerUuidStr = damager.getPersistentDataContainer().get(
                plugin.getPetOwnerKey(), PersistentDataType.STRING);
        if (ownerUuidStr == null) return;

        UUID ownerUuid = UUID.fromString(ownerUuidStr);
        CompanionPet pet = petManager.getActivePet(ownerUuid);
        if (pet == null) return;

        // Apply Ferocious Fangs Skill Bonus (+12% damage per rank)
        int fangsRank = pet.getSkillRank("ferocious_fangs");
        if (fangsRank > 0) {
            event.setDamage(event.getDamage() * (1.0 + 0.12 * fangsRank));
        }

        // Apply Vampiric Life Siphon Skill (+10% lifesteal per rank)
        int siphonRank = pet.getSkillRank("vampiric_siphon");
        Player owner = plugin.getServer().getPlayer(ownerUuid);
        if (siphonRank > 0 && owner != null && owner.isOnline()) {
            double heal = event.getFinalDamage() * (0.10 * siphonRank);
            double maxOwnerHp = owner.getAttribute(Attribute.MAX_HEALTH).getValue();
            owner.setHealth(Math.min(maxOwnerHp, owner.getHealth() + heal));
        }
    }

    @EventHandler
    public void onMobSlainGrantPetXp(EntityDeathEvent event) {
        LivingEntity slain = event.getEntity();
        Player killer = slain.getKiller();
        if (killer == null) return;

        CompanionPet pet = petManager.getActivePet(killer.getUniqueId());
        if (pet == null) return;

        double baseXpGain = 35.0;
        int wisdomRank = pet.getSkillRank("scholar_blessing");
        double finalXp = baseXpGain * (1.0 + 0.15 * wisdomRank);

        boolean leveledUp = pet.addExperience(finalXp);
        petManager.refreshLivePetMetadata(killer);

        if (leveledUp) {
            killer.playSound(killer.getLocation(), Sound.UI_TOAST_CHALLENGE_COMPLETE, 1.0f, 1.15f);
            killer.getWorld().spawnParticle(Particle.TOTEM_OF_UNDYING, killer.getLocation().add(0, 1.0, 0), 35, 0.5, 0.5, 0.5, 0.15);
            killer.sendMessage(ChatColor.translateAlternateColorCodes('&',
                    "&8[&6${config.pluginName}&8] &6★ LEVEL UP! &fYour companion &e" + pet.getCustomName()
                            + " &freached &aLevel " + pet.getLevel() + "&f! (&b+1 Skill Point&f)"));
        }
    }
}
`;

  const petGuiJava = `package ${pkg}.gui;

import ${pkg}.PetPlugin;
import ${pkg}.manager.PetManager;
import ${pkg}.model.CompanionPet;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.List;

/**
 * 54-Slot Interactive Customization GUI (/pet gui) for ${config.pluginName}
 * Author: ${config.authorName}
 */
public class PetCustomizationGUI implements Listener {

    private static final String GUI_TITLE = ChatColor.translateAlternateColorCodes('&',
            "&8${config.pluginName} Studio &7· &6${config.authorName}");

    private final PetPlugin plugin;
    private final PetManager petManager;

    public PetCustomizationGUI(PetPlugin plugin, PetManager petManager) {
        this.plugin = plugin;
        this.petManager = petManager;
    }

    public void openGUI(Player player, CompanionPet pet) {
        Inventory inv = Bukkit.createInventory(null, 54, GUI_TITLE);

        // Slot 4: Companion Overview Emblem
        inv.setItem(4, createItem(Material.NETHER_STAR,
                "&6★ " + pet.getCustomName() + " &8(&aLv." + pet.getLevel() + "&8)",
                List.of(
                        "&7Owner: &f" + player.getName(),
                        "&7Species: &e" + pet.getSpeciesId(),
                        "&7XP Progress: &a" + (int) pet.getCurrentXp() + " &7/ &a" + (int) pet.getRequiredXpForNextLevel(),
                        "&7Available Skill Points: &b" + pet.getSkillPoints(),
                        "&8Plugin by ${config.authorName}"
                )));

        // Slot 19: Cycle Particle Trail
        inv.setItem(19, createItem(Material.BLAZE_POWDER,
                "&eParticle Trail: &f" + pet.getParticleTrail(),
                List.of("&7Click to cycle particle aura effects", "&aCurrently Active: &6" + pet.getParticleTrail())));

        // Slot 21: Cycle Hat Cosmetic
        inv.setItem(21, createItem(Material.GOLDEN_HELMET,
                "&6Cosmetic Hat: &f" + pet.getHatCosmetic(),
                List.of("&7Click to equip royal crowns, helmets & halos", "&aEquipped: &e" + pet.getHatCosmetic())));

        // Slot 23: Cycle Collar & Aura Dye
        inv.setItem(23, createItem(Material.CYAN_DYE,
                "&bCollar & Aura Dye: &f" + pet.getCollarColor(),
                List.of("&7Click to dye collar & nameplate accent", "&aSelected: &b" + pet.getCollarColor())));

        // Slot 25: Cycle AI Behavior Stance
        inv.setItem(25, createItem(Material.COMPASS,
                "&aAI Behavior Mode: &f" + pet.getBehaviorMode(),
                List.of("&7Switch between Follow, Escort, Guard & Sit", "&aStance: &e" + pet.getBehaviorMode())));

        // Skill Tree Upgrade Slots (Slots 38, 40, 42)
        inv.setItem(38, createItem(Material.DIAMOND_SWORD,
                "&cSkill: Ferocious Fangs &8[Rank " + pet.getSkillRank("ferocious_fangs") + "/5]",
                List.of("&7+12% Companion Attack Damage per rank", "&eClick to spend 1 Skill Point")));

        inv.setItem(40, createItem(Material.HOPPER,
                "&bSkill: Vacuum Loot Magnet &8[Rank " + pet.getSkillRank("magnetic_paws") + "/3]",
                List.of("&7Pulls nearby loot & XP orbs to owner", "&eClick to spend 1 Skill Point")));

        inv.setItem(42, createItem(Material.EXPERIENCE_BOTTLE,
                "&aSkill: Wisdom XP Resonance &8[Rank " + pet.getSkillRank("scholar_blessing") + "/4]",
                List.of("&7+15% Player & Pet XP Gain per rank", "&eClick to spend 1 Skill Point")));

        player.openInventory(inv);
    }

    @EventHandler
    public void onInventoryClick(InventoryClickEvent event) {
        if (!event.getView().getTitle().equals(GUI_TITLE)) return;
        event.setCancelled(true);
        if (!(event.getWhoClicked() instanceof Player player)) return;

        CompanionPet pet = petManager.getActivePet(player.getUniqueId());
        if (pet == null) return;

        int slot = event.getRawSlot();
        if (slot == 19) {
            List<String> trails = List.of(${PARTICLE_TRAILS.map((t) => `"${t.id}"`).join(', ')});
            int next = (trails.indexOf(pet.getParticleTrail()) + 1) % trails.size();
            pet.setParticleTrail(trails.get(next));
            player.playSound(player.getLocation(), Sound.BLOCK_ENCHANTMENT_TABLE_USE, 0.8f, 1.2f);
        } else if (slot == 21) {
            List<String> hats = List.of(${HAT_COSMETICS.map((h) => `"${h.id}"`).join(', ')});
            int next = (hats.indexOf(pet.getHatCosmetic()) + 1) % hats.size();
            pet.setHatCosmetic(hats.get(next));
            player.playSound(player.getLocation(), Sound.ITEM_ARMOR_EQUIP_GOLD, 1.0f, 1.1f);
        } else if (slot == 25) {
            List<String> modes = List.of("FOLLOW_OWNER", "AGGRESSIVE_ESCORT", "GUARD_POSITION", "PASSIVE_SCAVENGER", "SIT_STAY");
            int next = (modes.indexOf(pet.getBehaviorMode()) + 1) % modes.size();
            pet.setBehaviorMode(modes.get(next));
            player.playSound(player.getLocation(), Sound.UI_BUTTON_CLICK, 0.9f, 1.2f);
        } else if (slot == 38) {
            pet.upgradeSkill("ferocious_fangs", 1);
            player.playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 1.0f, 1.3f);
        } else if (slot == 40) {
            pet.upgradeSkill("magnetic_paws", 1);
            player.playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 1.0f, 1.3f);
        } else if (slot == 42) {
            pet.upgradeSkill("scholar_blessing", 1);
            player.playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 1.0f, 1.3f);
        } else {
            return;
        }

        petManager.refreshLivePetMetadata(player);
        openGUI(player, pet);
    }

    private ItemStack createItem(Material material, String name, List<String> lore) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(ChatColor.translateAlternateColorCodes('&', name));
            meta.setLore(lore.stream()
                    .map(line -> ChatColor.translateAlternateColorCodes('&', line))
                    .toList());
            item.setItemMeta(meta);
        }
        return item;
    }
}
`;

  const petCommandJava = `package ${pkg}.command;

import ${pkg}.PetPlugin;
import ${pkg}.gui.PetCustomizationGUI;
import ${pkg}.manager.PetManager;
import ${pkg}.model.CompanionPet;
import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Command Executor & TabCompleter for /pet and /petadmin
 * Author: ${config.authorName}
 */
public class PetCommandExecutor implements CommandExecutor, TabCompleter {

    private final PetPlugin plugin;
    private final PetManager petManager;
    private final PetCustomizationGUI gui;

    public PetCommandExecutor(PetPlugin plugin, PetManager petManager, PetCustomizationGUI gui) {
        this.plugin = plugin;
        this.petManager = petManager;
        this.gui = gui;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("${config.pluginName} commands must be run by an in-game player.");
            return true;
        }

        if (args.length == 0 || args[0].equalsIgnoreCase("gui") || args[0].equalsIgnoreCase("customize")) {
            CompanionPet pet = petManager.getActivePet(player.getUniqueId());
            if (pet == null) {
                pet = petManager.createAndBindPet(player, "${activePet.speciesId}", "${activePet.customName}");
            }
            gui.openGUI(player, pet);
            return true;
        }

        String sub = args[0].toLowerCase();
        switch (sub) {
            case "summon" -> {
                String species = args.length >= 2 ? args[1] : "${activePet.speciesId}";
                CompanionPet pet = petManager.createAndBindPet(player, species, "${activePet.customName}");
                player.sendMessage(color("&8[&6${config.pluginName}&8] &aSummoned companion &e" + pet.getCustomName() + "&a!"));
            }
            case "dismiss" -> {
                petManager.despawnPetEntity(player.getUniqueId());
                player.sendMessage(color("&8[&6${config.pluginName}&8] &7Dismissed your active companion pet."));
            }
            case "rename" -> {
                if (args.length < 2) {
                    player.sendMessage(color("&cUsage: /pet rename <NewName>"));
                    return true;
                }
                CompanionPet pet = petManager.getActivePet(player.getUniqueId());
                if (pet != null) {
                    String newName = String.join(" ", Arrays.copyOfRange(args, 1, args.length));
                    pet.setCustomName(newName);
                    petManager.refreshLivePetMetadata(player);
                    player.sendMessage(color("&8[&6${config.pluginName}&8] &aRenamed your pet to &e" + newName + "&a!"));
                }
            }
            case "trail" -> {
                if (args.length < 2) {
                    player.sendMessage(color("&cUsage: /pet trail <FLAME_SPIRAL|SOUL_FIRE_FLAME|ENCHANTMENT_TABLE|DRAGON_BREATH>"));
                    return true;
                }
                CompanionPet pet = petManager.getActivePet(player.getUniqueId());
                if (pet != null) {
                    pet.setParticleTrail(args[1].toUpperCase());
                    petManager.refreshLivePetMetadata(player);
                    player.sendMessage(color("&8[&6${config.pluginName}&8] &aUpdated particle trail to &e" + args[1].toUpperCase()));
                }
            }
            case "addxp" -> {
                if (!player.hasPermission("pet.admin")) {
                    player.sendMessage(color("&cYou need pet.admin permission."));
                    return true;
                }
                double amount = args.length >= 2 ? Double.parseDouble(args[1]) : 250.0;
                CompanionPet pet = petManager.getActivePet(player.getUniqueId());
                if (pet != null) {
                    pet.addExperience(amount);
                    petManager.refreshLivePetMetadata(player);
                    player.sendMessage(color("&8[&6${config.pluginName}&8] &aGranted &e+" + (int) amount + " XP &ato &f" + pet.getCustomName()));
                }
            }
            case "info" -> {
                CompanionPet pet = petManager.getActivePet(player.getUniqueId());
                if (pet == null) {
                    player.sendMessage(color("&7You do not have an active companion pet. Use &e/pet summon&7!"));
                } else {
                    player.sendMessage(color("&8&m----------------------------------------"));
                    player.sendMessage(color("&6&l${config.pluginName} &7by &e${config.authorName}"));
                    player.sendMessage(color("&7Companion: " + pet.getNameColorCode() + pet.getCustomName() + " &8(&aLv." + pet.getLevel() + "&8)"));
                    player.sendMessage(color("&7Species: &f" + pet.getSpeciesId() + " &8| &7Stance: &e" + pet.getBehaviorMode()));
                    player.sendMessage(color("&7Cosmetics: &6" + pet.getHatCosmetic() + " &8| &b" + pet.getParticleTrail()));
                    player.sendMessage(color("&8&m----------------------------------------"));
                }
            }
            default -> player.sendMessage(color("&8[&6${config.pluginName}&8] &7Use &e/pet <gui|summon|dismiss|rename|trail|info|addxp>"));
        }
        return true;
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command command, String alias, String[] args) {
        if (args.length == 1) {
            return List.of("gui", "summon", "dismiss", "rename", "trail", "hat", "info", "addxp");
        }
        if (args.length == 2 && args[0].equalsIgnoreCase("summon")) {
            return List.of(${speciesList.map((s) => `"${s.id}"`).join(', ')});
        }
        if (args.length == 2 && args[0].equalsIgnoreCase("trail")) {
            return List.of(${PARTICLE_TRAILS.map((t) => `"${t.id}"`).join(', ')});
        }
        return Collections.emptyList();
    }

    private String color(String msg) {
        return ChatColor.translateAlternateColorCodes('&', msg);
    }
}
`;

  const githubWorkflowYml = `name: Build & Release ${config.pluginName} Plugin (.jar)

on:
  push:
    branches: [ "main", "master" ]
    tags: [ "v*" ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-plugin-jar:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout ${config.pluginName} Repository
        uses: actions/checkout@v4

      - name: Set up JDK 21 (Paper / Spigot 1.21.4)
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Compile ${jarFilename} with Maven
        run: mvn -B clean package --file pom.xml

      - name: Upload Compiled Server Plugin (.jar) Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${config.pluginName}-${config.pluginVersion}-Server-Plugin
          path: target/${jarFilename}

      - name: Publish Automatic GitHub Release (.jar Download)
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${config.pluginVersion}
          name: "${config.pluginName} v${config.pluginVersion} by ${config.authorName}"
          body: |
            ## ${config.pluginName} v${config.pluginVersion} — Minecraft Companion Plugin
            **Developer:** ${config.authorName}
            **Server Compatibility:** Paper / Spigot / Purpur ${config.apiVersion}.4+ (Java 21)

            ### Direct Server Installation
            1. Download **\`${jarFilename}\`** from the Assets section below.
            2. Place the \`.jar\` file inside your Minecraft server's \`plugins/\` folder.
            3. Restart your server and run \`/pet gui\` in-game.
          files: target/${jarFilename}
          prerelease: false
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

  const gitignoreContent = `target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### IntelliJ IDEA ###
.idea/
*.iws
*.iml
*.ipr

### Eclipse / NetBeans / VSCode ###
.classpath
.project
.settings/
.vscode/

### OS ###
.DS_Store
Thumbs.db
`;

  const readmeMd = `# ${config.pluginName} — Minecraft Companion Pet Plugin

[![Build & Release Plugin (.jar)](${repoUrl}/actions/workflows/build-and-release.yml/badge.svg)](${repoUrl}/actions/workflows/build-and-release.yml)
[![Download Latest .JAR Release](https://img.shields.io/badge/Download_Plugin-.JAR_Release-10b981?style=for-the-badge&logo=github)](${repoUrl}/releases/latest/download/${jarFilename})

- **Plugin Name:** \`${config.pluginName}\`
- **Developer:** \`${config.authorName}\`
- **Target Server API:** Paper / Spigot \`${config.apiVersion}.4+\` (Java 21)
- **Main Class:** \`${pkg}.PetPlugin\`
- **GitHub Repository:** [${repoUrl}](${repoUrl})

---

## Direct \`.jar\` Download from GitHub Releases

Once pushed to GitHub, **GitHub Actions** automatically compiles the Java source code with Maven and publishes the ready-to-use server \`.jar\` file:

- **Direct \`.jar\` Download Link:** [\`${jarFilename}\`](${repoUrl}/releases/latest/download/${jarFilename})
- **All GitHub Releases:** [\`${repoUrl}/releases\`](${repoUrl}/releases)

---

## Core Features

1. **Wild Mob Taming System**:
   - Feed configured taming catalysts (${speciesList.map((s) => `\`${s.tamingItemMaterial}\` for ${s.speciesName}`).join(', ')}) to wild mobs.
   - Displays heart/smoke particle bursts, plays level-up chimes, and binds the companion to the player's UUID via Bukkit \`PersistentDataContainer\`.

2. **Experience, Leveling & Skill Tree**:
   - Pets earn XP alongside their owner in combat (up to Level \`${config.maxPetLevel}\`).
   - Dynamic attribute scaling increases Max Health and Attack Damage every level.
   - Spend Skill Points in \`/pet gui\` on **Ferocious Fangs**, **Vampiric Life Siphon**, **Elemental Nova Proc**, **Vacuum Loot Magnet**, **Mounted Swiftness**, and **Wisdom XP Resonance**.

3. **54-Slot In-Game Customization Studio (\`/pet gui\`)**:
   - Customize pet display names with Minecraft color codes (\`&6\`, \`&b\`, \`&d\`, \`&a\`).
   - Equip **Particle Trails** (\`FLAME_SPIRAL\`, \`SOUL_FIRE_FLAME\`, \`ENCHANTMENT_TABLE\`, \`DRAGON_BREATH\`, \`CHERRY_LEAVES\`, \`TOTEM_OF_UNDYING\`, \`SCULK_SOUL\`).
   - Equip **Cosmetic Hats** (\`ROYAL_GOLD_CROWN\`, \`NETHERITE_HELMET\`, \`ARCANE_WIZARD_HAT\`, \`END_CRYSTAL_HALO\`) and **Collar Dyes**.

## How to Compile Locally with Maven

\`\`\`bash
mvn clean package
\`\`\`

Copy the compiled \`target/${jarFilename}\` into your Minecraft server's \`plugins/\` folder and restart the server.
`;

  return [
    {
      id: 'github_workflow_yml',
      filename: 'build-and-release.yml',
      relativePath: '.github/workflows/build-and-release.yml',
      language: 'yaml',
      description: 'GitHub Actions CI/CD workflow that compiles the Java plugin into a .jar and publishes a GitHub Release automatically.',
      content: githubWorkflowYml,
    },
    {
      id: 'plugin_yml',
      filename: 'plugin.yml',
      relativePath: 'src/main/resources/plugin.yml',
      language: 'yaml',
      description: 'Bukkit/Spigot plugin manifest defining name: Pet and author: The Killer D God.',
      content: pluginYml,
    },
    {
      id: 'config_yml',
      filename: 'config.yml',
      relativePath: 'src/main/resources/config.yml',
      language: 'yaml',
      description: 'Server configuration for XP curves, taming probabilities, species stats, and messages.',
      content: configYml,
    },
    {
      id: 'pet_plugin_java',
      filename: 'PetPlugin.java',
      relativePath: `src/main/java/${pkgPath}/PetPlugin.java`,
      language: 'java',
      description: 'Main JavaPlugin entry point initializing managers, PDC keys, listeners, and schedulers.',
      content: petPluginJava,
    },
    {
      id: 'companion_pet_java',
      filename: 'CompanionPet.java',
      relativePath: `src/main/java/${pkgPath}/model/CompanionPet.java`,
      language: 'java',
      description: 'Data model representing a tamed pet with level, XP, skill ranks, and cosmetics.',
      content: companionPetJava,
    },
    {
      id: 'pet_manager_java',
      filename: 'PetManager.java',
      relativePath: `src/main/java/${pkgPath}/manager/PetManager.java`,
      language: 'java',
      description: 'Handles spawning, attribute scaling, particle trail ticks, loot magnet, and YAML persistence.',
      content: petManagerJava,
    },
    {
      id: 'pet_listener_java',
      filename: 'PetTameAndCombatListener.java',
      relativePath: `src/main/java/${pkgPath}/listener/PetTameAndCombatListener.java`,
      language: 'java',
      description: 'Event listener for custom taming interactions, combat lifesteal/damage skills, and XP drops.',
      content: petListenerJava,
    },
    {
      id: 'pet_gui_java',
      filename: 'PetCustomizationGUI.java',
      relativePath: `src/main/java/${pkgPath}/gui/PetCustomizationGUI.java`,
      language: 'java',
      description: '54-slot Bukkit Chest GUI (/pet gui) for trails, hats, collar dyes, AI modes, and skills.',
      content: petGuiJava,
    },
    {
      id: 'pet_command_java',
      filename: 'PetCommandExecutor.java',
      relativePath: `src/main/java/${pkgPath}/command/PetCommandExecutor.java`,
      language: 'java',
      description: 'CommandExecutor and TabCompleter for /pet and /petadmin subcommands.',
      content: petCommandJava,
    },
    {
      id: 'pom_xml',
      filename: 'pom.xml',
      relativePath: 'pom.xml',
      language: 'xml',
      description: 'Maven build configuration targeting Paper/Spigot 1.21.4 and Java 21.',
      content: pomXml,
    },
    {
      id: 'gitignore_file',
      filename: '.gitignore',
      relativePath: '.gitignore',
      language: 'markdown',
      description: 'Git ignore rules for Maven target/ directory and IDE metadata.',
      content: gitignoreContent,
    },
    {
      id: 'readme_md',
      filename: 'README.md',
      relativePath: 'README.md',
      language: 'markdown',
      description: 'GitHub repository README with direct .jar Release download button and server setup guide.',
      content: readmeMd,
    },
  ];
}

export function convertToZipEntries(files: GeneratedPluginFile[]): ZipFileEntry[] {
  return files.map((f) => ({
    path: f.relativePath,
    content: f.content,
  }));
}
