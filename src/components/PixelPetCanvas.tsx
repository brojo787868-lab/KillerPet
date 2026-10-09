import React, { useEffect, useRef } from 'react';
import {
  ActiveCompanionPet,
  CombatEncounterMob,
  MINECRAFT_COLOR_CODES,
  PARTICLE_TRAILS,
  PetSpeciesConfig,
} from '../types/petPlugin';

export interface FloatingTextParticle {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface PixelPetCanvasProps {
  activePet: ActiveCompanionPet;
  species: PetSpeciesConfig;
  wildSpecies: PetSpeciesConfig | null; // If in wild taming mode
  activeEnemy: CombatEncounterMob | null;
  enemyCurrentHp: number;
  floatingTexts: FloatingTextParticle[];
  onCanvasAttackOrInteract: () => void;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  glyph?: string;
}

const GALACTIC_GLYPHS = ['ᔑ', '🄱', '🄲', '🄳', '🄴', '🄵', 'ᚷ', '⚚', '✦', '❖'];

export const PixelPetCanvas: React.FC<PixelPetCanvasProps> = ({
  activePet,
  species,
  wildSpecies,
  activeEnemy,
  enemyCurrentHp,
  floatingTexts,
  onCanvasAttackOrInteract,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<AmbientParticle[]>([]);
  const localTextsRef = useRef<FloatingTextParticle[]>([]);

  // Sync incoming floating texts
  useEffect(() => {
    localTextsRef.current = floatingTexts.map((t) => ({ ...t }));
  }, [floatingTexts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const trailMeta =
      PARTICLE_TRAILS.find((t) => t.id === activePet.particleTrail) || PARTICLE_TRAILS[0];
    const nameColorObj =
      MINECRAFT_COLOR_CODES.find((c) => c.code === activePet.nameColorCode) ||
      MINECRAFT_COLOR_CODES[0];

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Night Sky & Minecraft Biome Horizon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.68);
      skyGrad.addColorStop(0, '#070b14');
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Blocky Stars
      ctx.fillStyle = 'rgba(248, 250, 252, 0.35)';
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 97) % (w - 20)) + 10;
        const sy = ((i * 43) % Math.floor(h * 0.45)) + 12;
        const twinkle = Math.sin(tick * 0.04 + i) > 0.3 ? 3 : 2;
        ctx.fillRect(sx, sy, twinkle, twinkle);
      }

      // Pixel Moon
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w - 76, 26, 28, 28);
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(w - 72, 30, 20, 20);

      // Distant Blocky spruce/taiga hills
      ctx.fillStyle = '#0f1d2d';
      for (let x = 0; x < w; x += 32) {
        const hillH = 26 + ((x * 13) % 36);
        ctx.fillRect(x, h * 0.68 - hillH, 32, hillH);
      }

      // Ground: Minecraft Grass Block Top + Dirt Grid
      const groundY = Math.floor(h * 0.68);
      ctx.fillStyle = '#15803d'; // Grass top
      ctx.fillRect(0, groundY, w, 12);
      ctx.fillStyle = '#166534'; // Grass overhang pixels
      for (let x = 0; x < w; x += 16) {
        ctx.fillRect(x + 4, groundY + 12, 8, 4);
      }

      // Dirt sub-layer
      ctx.fillStyle = '#3f2e21';
      ctx.fillRect(0, groundY + 12, w, h - groundY - 12);
      ctx.fillStyle = '#2e2118';
      for (let x = 0; x < w; x += 24) {
        for (let y = groundY + 18; y < h; y += 20) {
          ctx.fillRect(x + ((y * 7) % 12), y, 8, 8);
        }
      }

      // 2. Draw Player Avatar ("The Killer D God") on Left
      const playerX = activePet.isMounted ? w * 0.36 : w * 0.18;
      const bobPlayer = Math.sin(tick * 0.08) * 2;
      const playerY = activePet.isMounted ? groundY - 76 + bobPlayer : groundY - 56 + bobPlayer;

      if (!activePet.isMounted) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(playerX + 16, groundY + 2, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(playerX + 6, playerY + 38, 8, 18);
        ctx.fillRect(playerX + 18, playerY + 38, 8, 18);
        // Tunic (Diamond/Netherite Dev Trim)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(playerX + 4, playerY + 18, 24, 20);
        ctx.fillStyle = '#f59e0b'; // Gold trim
        ctx.fillRect(playerX + 12, playerY + 20, 8, 16);
        // Arms
        ctx.fillStyle = '#334155';
        ctx.fillRect(playerX - 2, playerY + 18, 6, 16);
        ctx.fillRect(playerX + 28, playerY + 18, 6, 16);
        // Head
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(playerX + 6, playerY, 20, 18);
        // Eyes
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(playerX + 18, playerY + 7, 5, 4);
        // Dev Crown on The Killer D God
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(playerX + 5, playerY - 5, 22, 5);
        ctx.fillRect(playerX + 5, playerY - 9, 4, 4);
        ctx.fillRect(playerX + 14, playerY - 9, 4, 4);
        ctx.fillRect(playerX + 23, playerY - 9, 4, 4);

        // Player Nameplate
        ctx.font = '600 11px "JetBrains Mono", monospace';
        const devTag = '[DEV] The Killer D God';
        const tagW = ctx.measureText(devTag).width + 12;
        ctx.fillStyle = 'rgba(11, 15, 23, 0.78)';
        ctx.fillRect(playerX + 16 - tagW / 2, playerY - 28, tagW, 16);
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText(devTag, playerX + 16, playerY - 16);
      }

      // 3. Draw Companion Pet (Center)
      const petX = w * 0.44 + Math.cos(tick * 0.045) * (activePet.behaviorMode === 'SIT_STAY' ? 0 : 12);
      const isFloatingSpecies =
        species.bukkitEntity === 'BLAZE' ||
        species.bukkitEntity === 'ENDER_DRAGON_CUB' ||
        species.bukkitEntity === 'ALLAY';
      const petBob =
        activePet.behaviorMode === 'SIT_STAY'
          ? 0
          : Math.sin(tick * 0.11) * (isFloatingSpecies ? 7 : 3);
      const petBaseY = isFloatingSpecies ? groundY - 62 + petBob : groundY - 46 + petBob;

      // Collar / Aura Ground Circle
      ctx.strokeStyle = activePet.collarHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(petX + 22, groundY + 3, 28 + Math.sin(tick * 0.08) * 3, 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Spawn & Update Particle Trail around Pet
      if (activePet.particleTrail !== 'NONE' && tick % 2 === 0) {
        const angle = (tick * 0.14) % (Math.PI * 2);
        particlesRef.current.push({
          x: petX + 22 + Math.cos(angle) * 26,
          y: petBaseY + 22 + Math.sin(angle) * 14,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.7 - Math.random() * 0.8,
          size: activePet.particleTrail === 'ENCHANTMENT_TABLE' ? 11 : 5,
          alpha: 1,
          color: trailMeta.colorHex,
          glyph:
            activePet.particleTrail === 'ENCHANTMENT_TABLE'
              ? GALACTIC_GLYPHS[Math.floor(Math.random() * GALACTIC_GLYPHS.length)]
              : undefined,
        });
      }

      // Render Particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.05);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.024;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        if (p.glyph) {
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.fillText(p.glyph, p.x, p.y);
        } else {
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
      }

      // Draw Voxel Pet Body
      // Legs/Base
      ctx.fillStyle = species.secondaryHex;
      if (species.bukkitEntity === 'BLAZE') {
        // Orbiting Blaze Rods
        for (let r = 0; r < 4; r++) {
          const rx = petX + 20 + Math.cos(tick * 0.12 + r * 1.57) * 20;
          const ry = petBaseY + 18 + Math.sin(tick * 0.12 + r * 1.57) * 8;
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(rx, ry, 5, 18);
        }
      } else {
        const legOffset = activePet.behaviorMode === 'SIT_STAY' ? 0 : Math.sin(tick * 0.2) * 3;
        ctx.fillRect(petX + 6, petBaseY + 32, 8, 14 + legOffset);
        ctx.fillRect(petX + 28, petBaseY + 32, 8, 14 - legOffset);
      }

      // Torso
      ctx.fillStyle = species.primaryHex;
      ctx.fillRect(petX + 4, petBaseY + 12, 36, 22);

      // Armor Barding Overlay if equipped
      if (activePet.armorTier !== 'NONE') {
        const armorColor =
          activePet.armorTier === 'DIAMOND'
            ? '#22d3ee'
            : activePet.armorTier === 'NETHERITE'
            ? '#334155'
            : activePet.armorTier === 'IRON'
            ? '#e2e8f0'
            : '#b45309';
        ctx.fillStyle = armorColor;
        ctx.fillRect(petX + 6, petBaseY + 14, 24, 14);
      }

      // Collar Band
      ctx.fillStyle = activePet.collarHex;
      ctx.fillRect(petX + 26, petBaseY + 10, 6, 24);

      // Head
      ctx.fillStyle = species.primaryHex;
      ctx.fillRect(petX + 24, petBaseY - 4, 22, 20);

      // Ears / Horns
      ctx.fillStyle = species.secondaryHex;
      ctx.fillRect(petX + 26, petBaseY - 10, 6, 6);
      ctx.fillRect(petX + 38, petBaseY - 10, 6, 6);

      // Glowing Eyes
      ctx.fillStyle = species.eyeHex;
      ctx.fillRect(petX + 38, petBaseY + 3, 5, 4);

      // Dragon / Allay Wings if applicable
      if (species.bukkitEntity === 'ENDER_DRAGON_CUB' || species.bukkitEntity === 'ALLAY') {
        const wingFlap = Math.sin(tick * 0.25) * 8;
        ctx.fillStyle = species.secondaryHex;
        ctx.fillRect(petX + 8, petBaseY - 4 + wingFlap, 16, 10);
      }

      // Equipped Hat Cosmetic on Pet Head
      if (activePet.hatCosmetic !== 'NONE') {
        if (activePet.hatCosmetic === 'ROYAL_GOLD_CROWN') {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(petX + 24, petBaseY - 12, 22, 6);
          ctx.fillRect(petX + 24, petBaseY - 16, 4, 4);
          ctx.fillRect(petX + 33, petBaseY - 16, 4, 4);
          ctx.fillRect(petX + 42, petBaseY - 16, 4, 4);
        } else if (activePet.hatCosmetic === 'NETHERITE_HELMET') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(petX + 23, petBaseY - 11, 24, 10);
        } else if (activePet.hatCosmetic === 'ARCANE_WIZARD_HAT') {
          ctx.fillStyle = '#7e22ce';
          ctx.fillRect(petX + 20, petBaseY - 9, 30, 4);
          ctx.fillRect(petX + 26, petBaseY - 19, 18, 10);
          ctx.fillRect(petX + 31, petBaseY - 26, 8, 7);
        } else if (activePet.hatCosmetic === 'END_CRYSTAL_HALO') {
          const haloY = petBaseY - 18 + Math.sin(tick * 0.15) * 2;
          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 3;
          ctx.strokeRect(petX + 25, haloY, 20, 5);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(petX + 24, petBaseY - 11, 22, 6);
        }
      }

      // If Player is Riding the Pet
      if (activePet.isMounted) {
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(petX + 10, petBaseY - 16, 16, 16);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(petX + 9, petBaseY - 20, 18, 4);
      }

      // Floating Hologram Nametag above Pet
      ctx.font = '600 12px "JetBrains Mono", monospace';
      const nametagText = `[Lv.${activePet.level}] ★ ${activePet.customName}`;
      const ownerSubText = `${activePet.ownerName}'s Companion · ${activePet.behaviorMode.replace('_', ' ')}`;
      const tagWidth = Math.max(
        ctx.measureText(nametagText).width,
        ctx.measureText(ownerSubText).width
      ) + 20;

      const tagBoxX = petX + 22 - tagWidth / 2;
      const tagBoxY = petBaseY - 52;
      ctx.fillStyle = 'rgba(11, 15, 23, 0.85)';
      ctx.fillRect(tagBoxX, tagBoxY, tagWidth, 32);
      ctx.strokeStyle = activePet.collarHex;
      ctx.lineWidth = 1;
      ctx.strokeRect(tagBoxX, tagBoxY, tagWidth, 32);

      ctx.textAlign = 'center';
      ctx.fillStyle = nameColorObj.hex;
      ctx.fillText(nametagText, petX + 22, tagBoxY + 14);
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(ownerSubText, petX + 22, tagBoxY + 27);

      // 4. Right Side: Either Wild Mob (Taming Target) OR Combat Enemy Mob
      if (wildSpecies) {
        const wildX = w * 0.76 + Math.sin(tick * 0.06) * 6;
        const wildY = groundY - 44;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
        ctx.beginPath();
        ctx.ellipse(wildX + 20, groundY + 2, 26, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wild Body
        ctx.fillStyle = wildSpecies.primaryHex;
        ctx.fillRect(wildX + 4, wildY + 12, 32, 20);
        ctx.fillRect(wildX + 2, wildY - 2, 20, 18);
        ctx.fillStyle = wildSpecies.eyeHex;
        ctx.fillRect(wildX + 5, wildY + 4, 4, 4);
        ctx.fillStyle = wildSpecies.secondaryHex;
        ctx.fillRect(wildX + 8, wildY + 32, 7, 12);
        ctx.fillRect(wildX + 24, wildY + 32, 7, 12);

        // Wild Nametag
        ctx.font = '600 11px "JetBrains Mono", monospace';
        const wildTitle = `WILD ${wildSpecies.speciesName.toUpperCase()}`;
        const wildSub = `Feed ${wildSpecies.tamingItemLabel} (${wildSpecies.tameChancePercent}% Chance)`;
        const ww = Math.max(ctx.measureText(wildTitle).width, ctx.measureText(wildSub).width) + 16;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(wildX + 18 - ww / 2, wildY - 38, ww, 28);
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(wildTitle, wildX + 18, wildY - 25);
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(wildSub, wildX + 18, wildY - 14);
      } else if (activeEnemy) {
        const enemyX = w * 0.77 + Math.sin(tick * 0.09) * 5;
        const enemyY = groundY - 58;

        // Enemy Shadow
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.ellipse(enemyX + 18, groundY + 2, 24, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Enemy Body
        ctx.fillStyle = activeEnemy.hexColor;
        ctx.fillRect(enemyX + 4, enemyY + 18, 28, 24);
        ctx.fillRect(enemyX + 6, enemyY, 24, 18);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(enemyX + 8, enemyY + 42, 8, 16);
        ctx.fillRect(enemyX + 20, enemyY + 42, 8, 16);
        // Hostile Red Eyes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(enemyX + 9, enemyY + 7, 5, 4);
        ctx.fillRect(enemyX + 19, enemyY + 7, 5, 4);

        // Enemy Health Bar
        const hpRatio = Math.max(0, Math.min(1, enemyCurrentHp / activeEnemy.maxHp));
        const barW = 110;
        const barX = enemyX + 18 - barW / 2;
        const barY = enemyY - 34;

        ctx.fillStyle = 'rgba(11, 15, 23, 0.9)';
        ctx.fillRect(barX - 4, barY - 16, barW + 8, 28);
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText(`[Lv.${activeEnemy.level}] ${activeEnemy.name}`, enemyX + 18, barY - 5);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(barX, barY, barW, 7);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(barX, barY, barW * hpRatio, 7);
      }

      // 5. Render Floating Combat / Tame / XP Numbers
      for (const ft of localTextsRef.current) {
        ft.y += ft.vy;
        ft.alpha = Math.max(0, ft.alpha - 0.016);
        if (ft.alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = ft.alpha;
          ctx.font = 'bold 13px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#000000';
          ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activePet, species, wildSpecies, activeEnemy, enemyCurrentHp]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      <canvas
        ref={canvasRef}
        width={760}
        height={270}
        onClick={onCanvasAttackOrInteract}
        className="w-full h-[250px] sm:h-[270px] block cursor-pointer"
        title="Click arena to trigger companion action"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-medium">{species.speciesName}</span>
          <span aria-hidden="true">·</span>
          <span>Ability: {species.specialAbilityName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">Trail: {activePet.particleTrail}</span>
        </div>
        <div className="text-slate-400 font-mono tabular-nums">
          Click arena to command pet action
        </div>
      </div>
    </div>
  );
};
