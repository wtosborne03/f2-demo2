export type PatternType = 'solid' | 'pinto' | 'dappled' | 'socks' | 'metallic';

export interface HorseAttributes {
  name: string;
  speed: number;        // 0 to 100
  stamina: number;      // 0 to 100
  aggression: number;   // 0 to 100
  elegance: number;     // 0 to 100
  height: number;       // 0 to 100 (scales model size and leg length)
  
  coatColor: string;    // Hex string e.g. "#4a2c11"
  patternColor: string; // Hex string e.g. "#ffffff"
  maneColor: string;    // Hex string e.g. "#1a1008"
  hoofColor: string;    // Hex string e.g. "#2a2421"
  patternType: PatternType;
  coatSheen: number;    // 0 to 100 (roughness/metalness)
  
  personality: string;
}

export interface HorseStats {
  topSpeedMph: number;
  acceleration: number;
  staminaMinutes: number;
  temperament: string;
  archetype: string;
  overallRating: number;
}

export type AnimationMode = 'idle' | 'trot' | 'gallop';
export type CameraPreset = 'side' | 'front' | 'chase' | 'orbit';

export interface HorsePreset {
  id: string;
  label: string;
  description: string;
  attributes: HorseAttributes;
}

export const DEFAULT_HORSE_ATTRIBUTES: HorseAttributes = {
  name: "Storm Charger",
  speed: 50,
  stamina: 50,
  aggression: 50,
  elegance: 50,
  height: 50, // Agility
  coatColor: "#854d0e",
  patternColor: "#ffffff",
  maneColor: "#18181b",
  hoofColor: "#27272a",
  patternType: "pinto",
  coatSheen: 40,
  personality: ""
};

export const HORSE_PRESETS: HorsePreset[] = [
  {
    id: "storm-charger",
    label: "Storm Charger",
    description: "High speed sprinter with fierce aggression and striking pinto coat.",
    attributes: { ...DEFAULT_HORSE_ATTRIBUTES }
  },
  {
    id: "golden-emperor",
    label: "Golden Emperor",
    description: "Regal Palomino stallion featuring maximum elegance and stamina.",
    attributes: {
      name: "Golden Emperor",
      speed: 68,
      stamina: 90,
      aggression: 45,
      elegance: 95,
      height: 70,
      coatColor: "#d9a74a",
      patternColor: "#fff8dc",
      maneColor: "#faf5e8",
      hoofColor: "#4a3c28",
      patternType: "metallic",
      coatSheen: 85,
      personality: "Graceful champion of royal descent. Possesses incredible lung capacity and majestic trotting stride."
    }
  },
  {
    id: "shadow-mirage",
    label: "Shadow Mirage",
    description: "Sleek jet-black endurance runner with intense focus.",
    attributes: {
      name: "Shadow Mirage",
      speed: 82,
      stamina: 85,
      aggression: 70,
      elegance: 80,
      height: 60,
      coatColor: "#111115",
      patternColor: "#33333d",
      maneColor: "#08080a",
      hoofColor: "#1c1c24",
      patternType: "solid",
      coatSheen: 70,
      personality: "Silent as twilight, lightning on the turf. Thrives in long distance endurance duels."
    }
  },
  {
    id: "iron-mustang",
    label: "Iron Mustang",
    description: "Rugged heavy-set mustang built like a tank with extreme stamina.",
    attributes: {
      name: "Iron Mustang",
      speed: 55,
      stamina: 98,
      aggression: 88,
      elegance: 35,
      height: 85,
      coatColor: "#5c3a21",
      patternColor: "#ffffff",
      maneColor: "#2b180a",
      hoofColor: "#1a120b",
      patternType: "socks",
      coatSheen: 25,
      personality: "Unforgiving power and grit. Undaunted by rough terrain or muddy tracks."
    }
  },
  {
    id: "cyber-bolt",
    label: "Neon Cyber Bolt",
    description: "High-tech synth runner with glowing coat highlights and peak agility.",
    attributes: {
      name: "Neon Cyber Bolt",
      speed: 95,
      stamina: 60,
      aggression: 90,
      elegance: 75,
      height: 50,
      coatColor: "#161b2e",
      patternColor: "#00f0ff",
      maneColor: "#ff0077",
      hoofColor: "#00f0ff",
      patternType: "dappled",
      coatSheen: 95,
      personality: "Hyper-tuned racing android horse engineered for maximum speed threshold and futuristic velocity."
    }
  }
];

export function calculateHorseStats(attributes: HorseAttributes): HorseStats {
  const topSpeedMph = Math.round(35 + (attributes.speed * 0.22) + (attributes.height * 0.05));
  const acceleration = Math.round((attributes.speed * 0.6) + (attributes.aggression * 0.4));
  const staminaMinutes = Math.round(15 + (attributes.stamina * 0.45));
  
  let temperament = "Balanced";
  if (attributes.aggression > 75) temperament = "Fiery & Aggressive";
  else if (attributes.aggression < 35) temperament = "Calm & Docile";
  else if (attributes.elegance > 75) temperament = "Proud & Elegant";
  
  let archetype = "All-Rounder";
  if (attributes.speed >= 80 && attributes.stamina < 70) archetype = "Pure Sprinter";
  else if (attributes.stamina >= 80 && attributes.speed < 70) archetype = "Distance Crusher";
  else if (attributes.speed >= 75 && attributes.stamina >= 75) archetype = "Apex Champion";
  else if (attributes.elegance >= 85) archetype = "Showstander";
  else if (attributes.aggression >= 85) archetype = "Wild Thoroughbred";
  
  const overallRating = Math.round(
    (attributes.speed * 0.35) +
    (attributes.stamina * 0.30) +
    (attributes.aggression * 0.15) +
    (attributes.elegance * 0.15) +
    (attributes.height * 0.05)
  );

  return {
    topSpeedMph,
    acceleration,
    staminaMinutes,
    temperament,
    archetype,
    overallRating
  };
}
