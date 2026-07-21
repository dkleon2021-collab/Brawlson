import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';

type Fighter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  color: string;
  trim: string;
  health: number;
  energy: number;
  grounded: boolean;
  attacking: number;
  hitCooldown: number;
  fireCooldown: number;
  shotTimer: number;
  stun: number;
  wins: number;
};

type Fireball = {
  x: number;
  y: number;
  vx: number;
  owner: 'p1' | 'p2';
  age: number;
  element: 'fire' | 'water';
};

type Burst = {
  x: number;
  y: number;
  life: number;
  color: string;
};

type GameState = {
  p1: Fighter;
  p2: Fighter;
  fireballs: Fireball[];
  bursts: Burst[];
  roundOver: number;
  message: string;
};

type AdventureRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AdventureBoss = AdventureRect & {
  health: number;
  maxHealth: number;
  vx: number;
  minX: number;
  maxX: number;
  facing: 1 | -1;
  action: 'spawn' | 'walk' | 'slam' | 'whip' | 'summon' | 'damage' | 'death';
  actionTimer: number;
  attackCooldown: number;
  hasSummoned: boolean;
};

type AdventureMinion = AdventureRect & {
  vx: number;
  minX: number;
  maxX: number;
  health: number;
  facing: 1 | -1;
  action: 'spawn' | 'idle' | 'walk' | 'damage' | 'death';
  actionTimer: number;
};

type AdventureShot = {
  x: number;
  y: number;
  vx: number;
  age: number;
  element?: 'fire' | 'vine';
};

type AdventurePlayer = AdventureRect & {
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  health: number;
  fireCooldown: number;
  punchCooldown: number;
  invincible: number;
  stamina: number;
};

type AdventureState = {
  player: AdventurePlayer;
  boss: AdventureBoss;
  minions: AdventureMinion[];
  shots: AdventureShot[];
  minionPortal: { x: number; y: number; timer: number };
  chapter: number;
  crystals: number;
  bossName: string;
  travelerMet: boolean;
  travelerDialogueIndex: number;
  postBossTimer: number;
  cameraShake: number;
  message: string;
  won: boolean;
};

type Hud = {
  p1Health: number;
  p2Health: number;
  p1Energy: number;
  p2Energy: number;
  p1Wins: number;
  p2Wins: number;
  message: string;
};

type AppView = 'registration' | 'game';
type GameScreen =
  | 'main-menu'
  | 'mode-menu'
  | 'map-menu'
  | 'adventure-splash'
  | 'adventure-video'
  | 'adventure-start-video'
  | 'adventure-level'
  | 'playing';
type PlayerMode = '1p' | '2p';
type StageId = 'desert' | 'space' | 'ocean' | 'forest' | 'hell';
type Language = 'en' | 'ru';
type SpriteFrame = { x: number; y: number; width: number; height: number };
type AdventureProgress = {
  introIndex: number;
  introComplete: boolean;
  journeyVideoComplete: boolean;
  phase: 'intro' | 'splash' | 'journey-video' | 'boss';
};

const STAGES: Array<{ id: StageId; name: string; number: string }> = [
  { id: 'forest', name: 'Forest', number: '1' },
  { id: 'desert', name: 'Desert', number: '2' },
  { id: 'ocean', name: 'Ocean', number: '3' },
  { id: 'hell', name: 'Inferno', number: '4' },
  { id: 'space', name: 'Space', number: '5' },
];

const STAGE_TITLES: Record<StageId, string> = {
  desert: 'STAGE 1: THE CANYON',
  space: 'STAGE 2: OUTER REACH',
  ocean: 'STAGE 3: SUNKEN SHORES',
  forest: 'STAGE 4: FOREST OF BEGINNINGS',
  hell: 'STAGE 5: INFERNAL WASTES',
};

const STAGE_TITLES_RU: Record<StageId, string> = {
  desert: 'ЭТАП 1: КАНЬОН',
  space: 'ЭТАП 2: ДАЛЬНИЙ КОСМОС',
  ocean: 'ЭТАП 3: ЗАТОНУВШИЕ БЕРЕГА',
  forest: 'ЭТАП 4: ЛЕС НАЧАЛА',
  hell: 'ЭТАП 5: АДСКИЕ ПУСТОШИ',
};

const STAGE_NAMES_RU: Record<StageId, string> = {
  forest: 'Лес',
  desert: 'Пустыня',
  ocean: 'Океан',
  hell: 'Инферно',
  space: 'Космос',
};

const TEXT = {
  en: {
    on: 'ON',
    off: 'OFF',
    signOut: 'Sign out',
    startMenu: 'Start menu',
    pixelQuest: 'Pixel Quest',
    selectMode: 'Select Mode',
    onePlayerMode: '1 Player Mode',
    twoPlayerMode: '2 Player Mode',
    chooseMap: 'Choose Map',
    gameTitle: 'Brawlson',
    play: 'Play',
    adventureMode: 'Adventure Mode',
    adventureIntro: 'For centuries the pixel world was held together by one divine crystal',
    adventureIntroDark: 'Until one day a dark figure stole the crystal and vanished',
    adventureIntroChaos: 'Without its power the world fell into chaos',
    adventureIntroHero: 'There is only one hero who can restore balance',
    adventureJourney: 'Begin your quest',
    travelerCrystalRumor: [
      'Hello, what are you doing here?',
      "This place, it's full of mysteries.",
      "I've heard rumors of an ancient crystal hidden beyond these gates.",
      'But something dark has awakened...',
      "If you truly seek the crystal, you'd better be ready.",
    ],
    travelerAfterBoss: 'You did it... but that was only the beginning.',
    crystalCollected: '1/5 Pixel Crystals',
    nextBossPreview: 'Next boss approaches...',
    menuSettings: 'Settings',
    previousWorld: 'Previous world',
    nextWorld: 'Next world',
    selectWorld: 'Select world',
    settings: 'Settings',
    soundVolume: 'Sound volume',
    sound: 'Sound',
    language: 'Language',
    onePlayer: '1 Player',
    twoPlayers: '2 Players',
    level: 'Lv. 12',
    resetProgress: 'Reset Progress',
    back: 'Back',
    skip: 'Skip to Start',
    pressStart: 'Press Enter or Space',
    pressStage: 'Press 1-5 to pick a stage',
    tutorial: 'Tutorial',
    characters: 'Characters',
    controls: 'Controls',
    arenaPaused: 'Brawlson fighting arena paused',
    arena: 'Brawlson fighting arena',
    rotateTitle: 'Flip your phone',
    rotateBody: 'Turn sideways to play',
    tutorialIntro: 'Pick a world, choose 1 Player or 2 Players, then press Play.',
    player1: 'Player 1',
    player2: 'Player 2',
    pause: 'Pause',
    mobile: 'Mobile',
    tutorialP1: 'A/D move, W jump, F punch, G fireball, H water ball.',
    tutorialP2: 'Arrow keys move and jump, / punch, . fireball, , water ball.',
    tutorialPause: 'Esc pauses. Space continues. Esc again opens the menu.',
    tutorialMobile: 'Turn your phone sideways. Touch controls appear during the fight.',
    adventureTutorialIntro: 'Defeat the Forest Guardian. Watch your stamina and do not spam fireballs.',
    adventureTutorialMove: 'A/D or Arrow keys move. W, Arrow Up, or Space jumps.',
    adventureTutorialAttack: 'F punches nearby enemies. G shoots a fireball when stamina is ready.',
    adventureTutorialStamina: 'Fireballs spend stamina. The yellow bar refills over time.',
    gotIt: 'Got it',
    left: 'Left',
    jump: 'Jump',
    right: 'Right',
    punch: 'Punch',
    fire: 'Fire',
    water: 'Water',
    newRound: 'New Round',
    cpuControls: (name: string) => `Computer controls ${name} in 1 Player mode`,
    p2Controls: (move: string) => `Arrows move/jump, / punch, . fireball, , ${move}`,
    p1Controls: (move: string) => `A/D move, W jump, F punch, G ${move}, H water ball`,
    paused: 'PAUSED',
    continue: 'PRESS SPACE TO CONTINUE',
    menu: 'PRESS ESC AGAIN TO GO TO MENU',
    playerVsCpu: 'Player vs CPU',
    playerVsPlayer: 'Player vs Player',
    cpu: 'CPU',
    wins: (name: string) => `${name} wins!`,
  },
  ru: {
    on: 'ВКЛ',
    off: 'ВЫКЛ',
    signOut: 'Выйти',
    startMenu: 'Главное меню',
    pixelQuest: 'Пиксельный квест',
    selectMode: 'Выбор режима',
    onePlayerMode: 'Режим 1 игрока',
    twoPlayerMode: 'Режим 2 игроков',
    chooseMap: 'Выбери карту',
    gameTitle: 'Brawlson',
    play: 'Играть',
    adventureMode: 'Приключение',
    adventureIntro: 'Веками пиксельный мир держался на одном божественном кристалле',
    adventureIntroDark: 'Однажды темная фигура украла кристалл и исчезла',
    adventureIntroChaos: 'Без его силы мир погрузился в хаос',
    adventureIntroHero: 'Есть только один герой, способный вернуть равновесие',
    adventureJourney: 'Начни свой путь',
    travelerCrystalRumor: [
      'Привет, что ты здесь делаешь?',
      'Это место полно тайн.',
      'Я слышал слухи о древнем кристалле, скрытом за этими вратами.',
      'Но пробудилось что-то темное...',
      'Если ты правда ищешь кристалл, тебе лучше быть готовым.',
    ],
    travelerAfterBoss: 'У тебя получилось... но это только начало.',
    crystalCollected: '1/5 Пиксельных кристаллов',
    nextBossPreview: 'Следующий босс приближается...',
    menuSettings: 'Настройки',
    previousWorld: 'Предыдущий мир',
    nextWorld: 'Следующий мир',
    selectWorld: 'Выбор мира',
    settings: 'Настройки',
    soundVolume: 'Громкость',
    sound: 'Звук',
    language: 'Язык',
    onePlayer: '1 игрок',
    twoPlayers: '2 игрока',
    level: 'Ур. 12',
    resetProgress: 'Сбросить прогресс',
    back: 'Назад',
    skip: 'К началу',
    pressStart: 'Нажми Enter или Space',
    pressStage: 'Нажми 1-5 чтобы выбрать этап',
    tutorial: 'Обучение',
    characters: 'Персонажи',
    controls: 'Управление',
    arenaPaused: 'Арена Brawlson на паузе',
    arena: 'Арена Brawlson',
    rotateTitle: 'Поверни телефон',
    rotateBody: 'Играй горизонтально',
    tutorialIntro: 'Выбери мир, выбери 1 или 2 игроков, затем нажми Играть.',
    player1: 'Игрок 1',
    player2: 'Игрок 2',
    pause: 'Пауза',
    mobile: 'Телефон',
    tutorialP1: 'A/D движение, W прыжок, F удар, G огонь, H вода.',
    tutorialP2: 'Стрелки движение и прыжок, / удар, . огонь, , вода.',
    tutorialPause: 'Esc ставит паузу. Space продолжает. Esc снова открывает меню.',
    tutorialMobile: 'Поверни телефон боком. Сенсорные кнопки появятся во время боя.',
    adventureTutorialIntro: 'Победи Лесного Стража. Следи за выносливостью и не спамь огнем.',
    adventureTutorialMove: 'A/D или стрелки двигают. W, стрелка вверх или Space прыжок.',
    adventureTutorialAttack: 'F бьет врагов рядом. G стреляет огнем, если есть выносливость.',
    adventureTutorialStamina: 'Огненные шары тратят выносливость. Желтая полоска восстанавливается.',
    gotIt: 'Понятно',
    left: 'Влево',
    jump: 'Прыжок',
    right: 'Вправо',
    punch: 'Удар',
    fire: 'Огонь',
    water: 'Вода',
    newRound: 'Новый раунд',
    cpuControls: (name: string) => `Компьютер управляет ${name} в режиме 1 игрока`,
    p2Controls: (move: string) => `Стрелки движение/прыжок, / удар, . огонь, , ${move}`,
    p1Controls: (move: string) => `A/D движение, W прыжок, F удар, G ${move}, H вода`,
    paused: 'ПАУЗА',
    continue: 'НАЖМИ SPACE ЧТОБЫ ПРОДОЛЖИТЬ',
    menu: 'НАЖМИ ESC СНОВА ЧТОБЫ ВЫЙТИ В МЕНЮ',
    playerVsCpu: 'Игрок против компьютера',
    playerVsPlayer: 'Игрок против игрока',
    cpu: 'Бот',
    wins: (name: string) => `${name} победил!`,
  },
} satisfies Record<Language, Record<string, unknown>>;

const CHARACTERS = {
  p1: {
    name: 'Kazan',
    title: 'Red Headband Karate',
    move: 'Dragon Flame',
  },
  p2: {
    name: 'Riptide',
    title: 'Red Fireball Brawler',
    move: 'Tidal Knuckle',
  },
};

const RIPTIDE_SPRITES: Record<'idle' | 'walk' | 'jab' | 'shoot', SpriteFrame[]> = {
  idle: [
    { x: 36, y: 70, width: 106, height: 184 },
    { x: 168, y: 70, width: 106, height: 184 },
    { x: 300, y: 70, width: 106, height: 184 },
    { x: 434, y: 70, width: 106, height: 184 },
  ],
  walk: [
    { x: 594, y: 70, width: 108, height: 184 },
    { x: 726, y: 70, width: 108, height: 184 },
    { x: 860, y: 70, width: 108, height: 184 },
    { x: 992, y: 70, width: 108, height: 184 },
    { x: 1128, y: 70, width: 108, height: 184 },
    { x: 1260, y: 70, width: 108, height: 184 },
  ],
  jab: [
    { x: 38, y: 344, width: 136, height: 174 },
    { x: 214, y: 344, width: 140, height: 174 },
    { x: 386, y: 344, width: 132, height: 174 },
  ],
  shoot: [
    { x: 38, y: 590, width: 136, height: 168 },
    { x: 196, y: 590, width: 166, height: 168 },
    { x: 368, y: 590, width: 158, height: 168 },
  ],
};

const KAZAN_SPRITES: Record<'idle' | 'walk' | 'jab' | 'shoot', SpriteFrame[]> = {
  idle: [
    { x: 36, y: 70, width: 106, height: 184 },
    { x: 168, y: 70, width: 106, height: 184 },
    { x: 300, y: 70, width: 106, height: 184 },
    { x: 434, y: 70, width: 106, height: 184 },
  ],
  walk: [
    { x: 594, y: 70, width: 108, height: 184 },
    { x: 726, y: 70, width: 108, height: 184 },
    { x: 860, y: 70, width: 108, height: 184 },
    { x: 992, y: 70, width: 108, height: 184 },
    { x: 1128, y: 70, width: 108, height: 184 },
    { x: 1260, y: 70, width: 108, height: 184 },
  ],
  jab: [
    { x: 38, y: 344, width: 136, height: 174 },
    { x: 214, y: 344, width: 140, height: 174 },
    { x: 386, y: 344, width: 132, height: 174 },
  ],
  shoot: [
    { x: 38, y: 590, width: 136, height: 168 },
    { x: 196, y: 590, width: 166, height: 168 },
    { x: 368, y: 590, width: 158, height: 168 },
  ],
};

const FOREST_GUARDIAN_SPRITES: Record<
  'idle' | 'walk' | 'slam' | 'summon',
  SpriteFrame[]
> = {
  idle: [34, 263, 480, 687, 891, 1085].map((x) => ({
    x,
    y: 66,
    width: 164,
    height: 178,
  })),
  walk: [34, 232, 421, 610, 790, 970, 1155, 1344].map((x) => ({
    x,
    y: 319,
    width: 156,
    height: 170,
  })),
  summon: [34, 274, 512, 746, 973, 1184].map((x) => ({
    x,
    y: 560,
    width: 174,
    height: 170,
  })),
  slam: [32, 222, 413, 599, 789, 974, 1165, 1354].map((x) => ({
    x,
    y: 800,
    width: 160,
    height: 168,
  })),
};

const FOREST_GUARDIAN_WHIP_SPRITES: SpriteFrame[] = [
  { x: 20, y: 202, width: 330, height: 300 },
  { x: 378, y: 202, width: 330, height: 300 },
  { x: 740, y: 202, width: 330, height: 300 },
  { x: 1102, y: 202, width: 360, height: 300 },
  { x: 1486, y: 202, width: 330, height: 300 },
  { x: 1830, y: 202, width: 324, height: 300 },
];

const FOREST_GUIDE_IDLE_SPRITES: SpriteFrame[] = [
  { x: 24, y: 50, width: 130, height: 208 },
  { x: 156, y: 50, width: 130, height: 208 },
  { x: 290, y: 50, width: 130, height: 208 },
  { x: 424, y: 50, width: 130, height: 208 },
];

const FOREST_GUARDIAN_MINION_SPRITES: Record<'spawn' | 'idle' | 'walk' | 'damage' | 'death', SpriteFrame[]> = {
  spawn: [24, 248, 459, 669, 876, 1085].map((x) => ({
    x: x + 8,
    y: 55,
    width: 194,
    height: 164,
  })),
  idle: [26, 235, 445, 654, 864, 1073].map((x) => ({
    x: x + 8,
    y: 288,
    width: 182,
    height: 146,
  })),
  walk: [24, 201, 379, 548, 720, 865, 1019, 1172, 1348].map((x) => ({
    x: x + 8,
    y: 505,
    width: 150,
    height: 122,
  })),
  damage: [25, 245, 455, 666].map((x) => ({
    x: x + 8,
    y: 690,
    width: 189,
    height: 120,
  })),
  death: [25, 236, 455, 675, 908, 1130].map((x) => ({
    x: x + 8,
    y: 878,
    width: 184,
    height: 109,
  })),
};

const FOREST_GUARDIAN_EXTRA_SPRITES: Record<'spawn' | 'damage' | 'death', SpriteFrame[]> = {
  spawn: [24, 252, 484, 714, 964, 1156].map((x) => ({
    x: x + 8,
    y: 60,
    width: 196,
    height: 182,
  })),
  damage: [20, 253, 485, 717, 947, 1176].map((x) => ({
    x: x + 8,
    y: 320,
    width: 196,
    height: 178,
  })),
  death: [20, 260, 499, 738, 967, 1197].map((x) => ({
    x: x + 8,
    y: 568,
    width: 196,
    height: 174,
  })),
};

const WIDTH = 960;
const HEIGHT = 540;
const GROUND = 438;
const GRAVITY = 0.8;
const SPEED = 5.2;
const JUMP = -16;
const FRICTION = 0.78;
const SHOT_ANIMATION_TIME = 28;
const FIRE_SOUND_START = 0.76;
const TUTORIAL_STORAGE_KEY = 'brawlson:tutorial-seen';
const ADVENTURE_PROGRESS_STORAGE_KEY = 'pixel-quest:adventure-progress';
const TRAVELER_X = 784;
const DEFAULT_ADVENTURE_PROGRESS: AdventureProgress = {
  introIndex: 0,
  introComplete: false,
  journeyVideoComplete: false,
  phase: 'intro',
};
const ADVENTURE_NARRATION_SEGMENTS: Record<Language, Array<{ start: number; end: number }>> = {
  en: [
    { start: 0, end: 4.55 },
    { start: 4.55, end: 8.3 },
    { start: 8.3, end: 11.45 },
    { start: 11.45, end: 14.99 },
  ],
  ru: [
    { start: 0, end: 3.45 },
    { start: 3.9, end: 7.1 },
    { start: 7.75, end: 10.2 },
    { start: 10.6, end: 14.15 },
  ],
};

const getMinionHitbox = (minion: AdventureMinion): AdventureRect => ({
  x: minion.x - 18,
  y: minion.y - 14,
  width: minion.width + 36,
  height: minion.height + 24,
});

const createAdventureState = (chapter = 1, crystals = 0): AdventureState => {
  const isFirstBoss = chapter === 1;
  return {
    player: {
      x: 170,
      y: 354,
      width: 42,
      height: 90,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      health: 3,
      fireCooldown: 0,
      punchCooldown: 0,
      invincible: 0,
      stamina: 100,
    },
    boss: {
      x: 592,
      y: 330,
      width: 90,
      height: 112,
      health: isFirstBoss ? 18 : 22,
      maxHealth: isFirstBoss ? 18 : 22,
      vx: 1.25,
      minX: 430,
      maxX: 720,
      facing: -1,
      action: 'spawn',
      actionTimer: 96,
      attackCooldown: 90,
      hasSummoned: false,
    },
    minions: [],
    shots: [],
    minionPortal: { x: 0, y: 0, timer: 0 },
    chapter,
    crystals,
    bossName: isFirstBoss ? 'FOREST GUARDIAN' : 'SHADOW GUARDIAN',
    travelerMet: !isFirstBoss,
    travelerDialogueIndex: -1,
    postBossTimer: 0,
    cameraShake: 0,
    message: isFirstBoss ? 'Forest Guardian' : 'Next boss fight begins',
    won: false,
  };
};

const makeFighter = (
  x: number,
  color: string,
  trim: string,
  facing: 1 | -1,
): Fighter => ({
  x,
  y: GROUND - 116,
  vx: 0,
  vy: 0,
  width: 56,
  height: 116,
  facing,
  color,
  trim,
  health: 100,
  energy: 100,
  grounded: true,
  attacking: 0,
  hitCooldown: 0,
  fireCooldown: 0,
  shotTimer: 0,
  stun: 0,
  wins: 0,
});

const createGame = (): GameState => ({
  p1: makeFighter(190, '#2f7de1', '#ffe45e', 1),
  p2: makeFighter(710, '#d9405f', '#9ef3ff', -1),
  fireballs: [],
  bursts: [],
  roundOver: 0,
  message: 'Fight!',
});

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const rectsOverlap = (a: AdventureRect, b: AdventureRect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

const getShootFrameIndex = (shotTimer: number, frameCount: number) => {
  if (frameCount <= 1) return 0;

  const elapsed = SHOT_ANIMATION_TIME - shotTimer;
  if (frameCount === 3) {
    if (elapsed < 5) return 0;
    if (elapsed < 10) return 1;
    return 2;
  }
  if (frameCount === 6) {
    if (elapsed < 4) return 0;
    if (elapsed < 8) return 1;
    if (elapsed < 18) return 2;
    if (elapsed < 22) return 3;
    if (elapsed < 25) return 4;
    return 5;
  }

  return clamp(Math.floor((elapsed / SHOT_ANIMATION_TIME) * frameCount), 0, frameCount - 1);
};

const overlap = (
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

const hitFighter = (
  target: Fighter,
  attacker: Fighter,
  damage: number,
  push: number,
) => {
  if (target.hitCooldown > 0 || target.health <= 0) return false;

  target.health = clamp(target.health - damage, 0, 100);
  target.hitCooldown = 18;
  target.stun = 10;
  target.vx = attacker.facing * push;
  target.vy = Math.min(target.vy, -4);
  attacker.energy = clamp(attacker.energy + 12, 0, 100);
  return true;
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const adventureVideoRef = useRef<HTMLVideoElement | null>(null);
  const gameRef = useRef<GameState>(createGame());
  const adventureRef = useRef<AdventureState>(createAdventureState());
  const keysRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const fireSoundRef = useRef<HTMLAudioElement | null>(null);
  const waterSoundRef = useRef<HTMLAudioElement | null>(null);
  const punchSoundRef = useRef<HTMLAudioElement | null>(null);
  const adventureNarrationRef = useRef<HTMLAudioElement | null>(null);
  const adventureNarrationTimerRef = useRef<number | null>(null);
  const screenRef = useRef<GameScreen>('main-menu');
  const pausedRef = useRef(false);
  const playerModeRef = useRef<PlayerMode>('1p');
  const stageRef = useRef<StageId>('forest');
  const languageRef = useRef<Language>('en');
  const soundLevelRef = useRef(7);
  const lastTravelerDialogueAdvanceRef = useRef(0);
  const kazanSheetRef = useRef<HTMLImageElement | null>(null);
  const kazanFrameCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const riptideSheetRef = useRef<HTMLImageElement | null>(null);
  const riptideFrameCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const desertStageRef = useRef<HTMLImageElement | null>(null);
  const spaceStageRef = useRef<HTMLImageElement | null>(null);
  const oceanStageRef = useRef<HTMLImageElement | null>(null);
  const forestStageRef = useRef<HTMLImageElement | null>(null);
  const hellStageRef = useRef<HTMLImageElement | null>(null);
  const forestBossArenaRef = useRef<HTMLImageElement | null>(null);
  const forestGuideSheetRef = useRef<HTMLImageElement | null>(null);
  const forestGuideFrameCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const forestGuardianSheetRef = useRef<HTMLImageElement | null>(null);
  const forestGuardianWhipSheetRef = useRef<HTMLImageElement | null>(null);
  const forestGuardianFrameCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const forestGuardianExtraSheetRef = useRef<HTMLImageElement | null>(null);
  const forestGuardianMinionSheetRef = useRef<HTMLImageElement | null>(null);
  const forestGuardianMinionFrameCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const rafRef = useRef<number>();
  const [view, setView] = useState<AppView>('registration');
  const [screen, setScreen] = useState<GameScreen>('main-menu');
  const [paused, setPaused] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('1p');
  const [stage, setStage] = useState<StageId>('forest');
  const [soundLevel, setSoundLevel] = useState(7);
  const [language, setLanguage] = useState<Language>('en');
  const [showTutorial, setShowTutorial] = useState(false);
  const [adventureVideoIndex, setAdventureVideoIndex] = useState(0);
  const [hud, setHud] = useState<Hud>({
    p1Health: 100,
    p2Health: 100,
    p1Energy: 100,
    p2Energy: 100,
    p1Wins: 0,
    p2Wins: 0,
    message: 'Fight!',
  });

  const enterGame = (email?: string | null) => {
    void email;
    setView('game');
    if (localStorage.getItem(TUTORIAL_STORAGE_KEY) !== 'yes') {
      setShowTutorial(true);
    }
  };

  const closeTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'yes');
    setShowTutorial(false);
  };

  const t = TEXT[language];
  const getStageName = (stageId: StageId) =>
    language === 'ru' ? STAGE_NAMES_RU[stageId] : STAGES.find((item) => item.id === stageId)?.name ?? 'Desert';

  const toggleLanguage = () => {
    setLanguage((current) => {
      const next = current === 'en' ? 'ru' : 'en';
      languageRef.current = next;
      return next;
    });
  };

  const ensureAudioContext = () => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContextRef.current = new AudioContextCtor();
    return audioContextRef.current;
  };

  const playProjectileSound = (element: Fireball['element']) => {
    const level = getSoundLevel();
    if (level <= 0) return;

    if (element === 'fire') {
      if (!fireSoundRef.current) {
        fireSoundRef.current = new Audio('/sounds/fire-swoosh.wav');
      }
      fireSoundRef.current.volume = Math.min(1, level);
      fireSoundRef.current.currentTime = FIRE_SOUND_START;
      void fireSoundRef.current.play();
      return;
    }

    if (!waterSoundRef.current) {
      waterSoundRef.current = new Audio('/sounds/water-splash.wav');
    }
    waterSoundRef.current.volume = Math.min(1, level);
    waterSoundRef.current.currentTime = 0;
    void waterSoundRef.current.play();
  };

  const playPunchSound = () => {
    const level = getSoundLevel();
    if (level <= 0) return;

    if (!punchSoundRef.current) {
      punchSoundRef.current = new Audio('/sounds/punch.wav');
    }
    punchSoundRef.current.volume = Math.min(1, level);
    punchSoundRef.current.currentTime = 0;
    void punchSoundRef.current.play();
  };

  const playHitSound = () => {
    const level = getSoundLevel();
    if (level <= 0) return;

    const audioContext = ensureAudioContext();
    if (!audioContext) return;
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }

    const now = audioContext.currentTime;
    const thud = audioContext.createOscillator();
    const snap = audioContext.createOscillator();
    const gain = audioContext.createGain();
    thud.type = 'square';
    snap.type = 'triangle';
    thud.frequency.setValueAtTime(118, now);
    thud.frequency.exponentialRampToValueAtTime(58, now + 0.11);
    snap.frequency.setValueAtTime(520, now);
    snap.frequency.exponentialRampToValueAtTime(170, now + 0.08);
    gain.gain.setValueAtTime(0.34 * level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    thud.connect(gain);
    snap.connect(gain);
    gain.connect(audioContext.destination);
    thud.start(now);
    snap.start(now);
    thud.stop(now + 0.15);
    snap.stop(now + 0.1);
  };

  const cycleStage = (direction: 1 | -1) => {
    const currentIndex = STAGES.findIndex((item) => item.id === stageRef.current);
    const nextIndex = (currentIndex + direction + STAGES.length) % STAGES.length;
    const nextStage = STAGES[nextIndex].id;
    stageRef.current = nextStage;
    setStage(nextStage);
  };

  const chooseMode = (mode: PlayerMode) => {
    playerModeRef.current = mode;
    setPlayerMode(mode);
  };

  const getSoundLevel = () => (soundLevelRef.current <= 1 ? 0 : (soundLevelRef.current - 1) / 9);

  const applySoundVolume = () => {
    const level = getSoundLevel();
    if (fireSoundRef.current) fireSoundRef.current.volume = Math.min(1, level);
    if (waterSoundRef.current) waterSoundRef.current.volume = Math.min(1, level);
    if (punchSoundRef.current) punchSoundRef.current.volume = Math.min(1, level);
    if (adventureNarrationRef.current) adventureNarrationRef.current.volume = Math.min(1, level);
  };

  const changeSoundLevel = (nextLevel: number) => {
    soundLevelRef.current = nextLevel;
    setSoundLevel(nextLevel);
    applySoundVolume();
  };

  const stopAdventureNarration = () => {
    if (adventureNarrationTimerRef.current !== null) {
      window.clearTimeout(adventureNarrationTimerRef.current);
      adventureNarrationTimerRef.current = null;
    }
    if (!adventureNarrationRef.current) return;
    adventureNarrationRef.current.pause();
    adventureNarrationRef.current.currentTime = 0;
  };

  const pauseAdventureNarration = () => {
    if (adventureNarrationTimerRef.current !== null) {
      window.clearTimeout(adventureNarrationTimerRef.current);
      adventureNarrationTimerRef.current = null;
    }
    adventureNarrationRef.current?.pause();
  };

  const playAdventureNarrationSegment = (sceneIndex: number) => {
    pauseAdventureNarration();
    const narrationSrc =
      languageRef.current === 'ru'
        ? '/stages/adventure-narration-ru.mp3'
        : '/stages/adventure-narration-en.mp3';
    const segment = ADVENTURE_NARRATION_SEGMENTS[languageRef.current][sceneIndex];
    if (!segment) return;
    const level = getSoundLevel();
    if (!adventureNarrationRef.current || !adventureNarrationRef.current.src.endsWith(narrationSrc)) {
      adventureNarrationRef.current = new Audio(narrationSrc);
    }
    adventureNarrationRef.current.volume = Math.min(1, level);
    adventureNarrationRef.current.currentTime = segment.start;
    void adventureNarrationRef.current.play();
    adventureNarrationTimerRef.current = window.setTimeout(() => {
      adventureNarrationTimerRef.current = null;
      adventureNarrationRef.current?.pause();
    }, Math.max(0, segment.end - segment.start) * 1000);
  };

  const startGame = (mode: PlayerMode, selectedStage: StageId) => {
    stopAdventureNarration();
    if (!fireSoundRef.current) {
      fireSoundRef.current = new Audio('/sounds/fire-swoosh.wav');
      fireSoundRef.current.load();
    }
    if (!waterSoundRef.current) {
      waterSoundRef.current = new Audio('/sounds/water-splash.wav');
      waterSoundRef.current.load();
    }
    if (!punchSoundRef.current) {
      punchSoundRef.current = new Audio('/sounds/punch.wav');
      punchSoundRef.current.load();
    }
    applySoundVolume();
    const audioContext = ensureAudioContext();
    if (audioContext?.state === 'suspended') {
      void audioContext.resume();
    }
    gameRef.current = createGame();
    const stageName = getStageName(selectedStage);
    const modeLabel = mode === '1p' ? t.playerVsCpu : t.playerVsPlayer;
    gameRef.current.message = `${modeLabel} - ${stageName}`;
    keysRef.current.clear();
    pausedRef.current = false;
    playerModeRef.current = mode;
    stageRef.current = selectedStage;
    screenRef.current = 'playing';
    setPlayerMode(mode);
    setStage(selectedStage);
    setScreen('playing');
    setPaused(false);
    setHud({
      p1Health: 100,
      p2Health: 100,
      p1Energy: 100,
      p2Energy: 100,
      p1Wins: 0,
      p2Wins: 0,
      message: `${modeLabel} - ${stageName}`,
    });
  };

  const startAdventureLevel = () => {
    stopAdventureNarration();
    saveAdventureProgress({ introComplete: true, journeyVideoComplete: true, phase: 'boss' });
    adventureRef.current = createAdventureState();
    keysRef.current.clear();
    pausedRef.current = false;
    screenRef.current = 'adventure-level';
    setScreen('adventure-level');
    setPaused(false);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email;
      if (mounted && email) {
        setView('game');
        if (localStorage.getItem(TUTORIAL_STORAGE_KEY) !== 'yes') {
          setShowTutorial(true);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email;
      if (email) {
        setView('game');
        if (localStorage.getItem(TUTORIAL_STORAGE_KEY) !== 'yes') {
          setShowTutorial(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (view !== 'game') return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const kazanSheet = new Image();
    kazanSheet.src = '/sprites/kazan-sheet.png';
    kazanSheet.onload = () => {
      kazanSheetRef.current = kazanSheet;
    };

    const riptideSheet = new Image();
    riptideSheet.src = '/sprites/riptide-sheet.png';
    riptideSheet.onload = () => {
      riptideSheetRef.current = riptideSheet;
    };

    const desertStage = new Image();
    desertStage.src = '/stages/desert-canyon.png';
    desertStage.onload = () => {
      desertStageRef.current = desertStage;
    };

    const spaceStage = new Image();
    spaceStage.src = '/stages/outer-reach.png';
    spaceStage.onload = () => {
      spaceStageRef.current = spaceStage;
    };

    const oceanStage = new Image();
    oceanStage.src = '/stages/sunken-shores.png';
    oceanStage.onload = () => {
      oceanStageRef.current = oceanStage;
    };

    const forestStage = new Image();
    forestStage.src = '/stages/forest-beginnings.png';
    forestStage.onload = () => {
      forestStageRef.current = forestStage;
    };

    const hellStage = new Image();
    hellStage.src = '/stages/infernal-wastes.png';
    hellStage.onload = () => {
      hellStageRef.current = hellStage;
    };

    const forestBossArena = new Image();
    forestBossArena.src = '/stages/forgotten-forest-boss-arena.png';
    forestBossArena.onload = () => {
      forestBossArenaRef.current = forestBossArena;
    };

    const forestGuideSheet = new Image();
    forestGuideSheet.src = '/sprites/forest-guide-sheet.png?v=1';
    forestGuideSheet.onload = () => {
      forestGuideSheetRef.current = forestGuideSheet;
    };

    const forestGuardianSheet = new Image();
    forestGuardianSheet.src = '/sprites/forest-guardian-sheet.png?v=6';
    forestGuardianSheet.onload = () => {
      forestGuardianSheetRef.current = forestGuardianSheet;
    };

    const forestGuardianWhipSheet = new Image();
    forestGuardianWhipSheet.src = '/sprites/forest-guardian-whip-sheet.png?v=1';
    forestGuardianWhipSheet.onload = () => {
      forestGuardianWhipSheetRef.current = forestGuardianWhipSheet;
    };

    const forestGuardianExtraSheet = new Image();
    forestGuardianExtraSheet.src = '/sprites/forest-guardian-extra-sheet.png?v=3';
    forestGuardianExtraSheet.onload = () => {
      forestGuardianExtraSheetRef.current = forestGuardianExtraSheet;
    };

    const forestGuardianMinionSheet = new Image();
    forestGuardianMinionSheet.src = '/sprites/forest-guardian-minion-sheet.png?v=4';
    forestGuardianMinionSheet.onload = () => {
      forestGuardianMinionSheetRef.current = forestGuardianMinionSheet;
    };

    const advanceTravelerDialogue = () => {
      const state = adventureRef.current;
      if (screenRef.current !== 'adventure-level' || !state.travelerMet || state.travelerDialogueIndex < 0) return false;
      const now = performance.now();
      if (now - lastTravelerDialogueAdvanceRef.current < 120) return true;
      lastTravelerDialogueAdvanceRef.current = now;
      const lineCount = TEXT[languageRef.current].travelerCrystalRumor.length;
      if (state.travelerDialogueIndex < lineCount - 1) {
        state.travelerDialogueIndex += 1;
      } else {
        state.travelerDialogueIndex = -1;
      }
      keysRef.current.clear();
      return true;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (advanceTravelerDialogue()) {
        event.preventDefault();
        return;
      }

      if (event.code === 'Escape' && screenRef.current === 'playing') {
        if (pausedRef.current) {
          pausedRef.current = false;
          keysRef.current.clear();
          screenRef.current = 'main-menu';
          setScreen('main-menu');
          setPaused(false);
          event.preventDefault();
          return;
        }
        pausedRef.current = true;
        keysRef.current.clear();
        setPaused(true);
        event.preventDefault();
        return;
      }

      if (event.code === 'Space' && screenRef.current === 'playing' && pausedRef.current) {
        pausedRef.current = false;
        keysRef.current.clear();
        setPaused(false);
        event.preventDefault();
        return;
      }

      if (screenRef.current === 'adventure-level' && (event.code === 'Escape' || event.code === 'Backspace')) {
        openMenu();
        event.preventDefault();
        return;
      }

      if (screenRef.current === 'adventure-video' && event.code === 'KeyS') {
        openAdventureSplash();
        event.preventDefault();
        return;
      }

      if (screenRef.current === 'adventure-start-video' && event.code === 'KeyS') {
        finishAdventureJourneyVideo();
        event.preventDefault();
        return;
      }

      if (
        (screenRef.current === 'adventure-splash' ||
          screenRef.current === 'adventure-video' ||
          screenRef.current === 'adventure-start-video') &&
        (event.code === 'Escape' || event.code === 'Backspace')
      ) {
        openMenu();
        event.preventDefault();
        return;
      }

      if (screenRef.current === 'main-menu' && (event.code === 'Enter' || event.code === 'Space')) {
        startGame(playerModeRef.current, stageRef.current);
        event.preventDefault();
        return;
      }

      if (
        (screenRef.current === 'main-menu' || screenRef.current === 'mode-menu') &&
        (event.code === 'ArrowLeft' || event.code === 'ArrowRight')
      ) {
        cycleStage(event.code === 'ArrowRight' ? 1 : -1);
        event.preventDefault();
        return;
      }

      if (screenRef.current === 'main-menu' && (event.code === 'Digit1' || event.code === 'Digit2')) {
        const mode = event.code === 'Digit1' ? '1p' : '2p';
        chooseMode(mode);
        event.preventDefault();
        return;
      }

      if (screenRef.current === 'map-menu') {
        const pickedStage = STAGES.find((item) => event.code === `Digit${item.number}`);
        if (pickedStage) {
          startGame(playerModeRef.current, pickedStage.id);
        }
        event.preventDefault();
        return;
      }

      if (pausedRef.current) {
        event.preventDefault();
        return;
      }

      keysRef.current.add(event.code);
      if (
        [
          'KeyA',
          'KeyD',
          'KeyW',
          'KeyF',
          'KeyG',
          'KeyH',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'Slash',
          'Period',
          'Comma',
          'Space',
        ].includes(event.code)
      ) {
        event.preventDefault();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };

    const onDialogueInput = (event: Event) => {
      if (advanceTravelerDialogue()) event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerdown', onDialogueInput, true);
    window.addEventListener('mousedown', onDialogueInput, true);
    window.addEventListener('click', onDialogueInput, true);
    window.addEventListener('touchstart', onDialogueInput, { capture: true, passive: false });

    let lastHud = 0;

    const adventurePlatforms: AdventureRect[] = [
      { x: 74, y: 444, width: 812, height: 34 },
      { x: 108, y: 348, width: 28, height: 96 },
      { x: 168, y: 292, width: 116, height: 20 },
      { x: 380, y: 258, width: 192, height: 22 },
      { x: 678, y: 292, width: 116, height: 20 },
      { x: 808, y: 348, width: 28, height: 96 },
    ];

    const damageAdventurePlayer = (state: AdventureState) => {
      const player = state.player;
      if (player.invincible > 0) return;
      state.cameraShake = Math.max(state.cameraShake, 14);
      player.health -= 1;
      player.invincible = 70;
      if (player.health <= 0) {
        adventureRef.current = createAdventureState();
        adventureRef.current.message = 'Try again';
        adventureRef.current.cameraShake = 18;
        return;
      }
      player.vx = -player.facing * 6;
      player.vy = -9;
      state.message = 'Ouch!';
    };

    const updateAdventure = () => {
      const state = adventureRef.current;
      const { player, boss } = state;
      const keys = keysRef.current;
      if (state.won) {
        state.postBossTimer += 1;
        player.vx *= 0.86;
        player.fireCooldown = Math.max(0, player.fireCooldown - 1);
        player.punchCooldown = Math.max(0, player.punchCooldown - 1);
        state.cameraShake = Math.max(0, state.cameraShake - 0.75);
        if (state.postBossTimer === 135) {
          state.crystals = Math.max(state.crystals, 1);
          state.message = TEXT[languageRef.current].crystalCollected;
        }
        if (state.postBossTimer > 520) {
          adventureRef.current = createAdventureState(state.chapter + 1, Math.max(state.crystals, 1));
          adventureRef.current.cameraShake = 12;
        }
        return;
      }

      if (keys.has('KeyA') || keys.has('ArrowLeft')) {
        player.vx = Math.max(player.vx - 0.75, -5.2);
        player.facing = -1;
      } else if (keys.has('KeyD') || keys.has('ArrowRight')) {
        player.vx = Math.min(player.vx + 0.75, 5.2);
        player.facing = 1;
      } else {
        player.vx *= player.grounded ? 0.78 : 0.9;
      }

      if ((keys.has('KeyW') || keys.has('ArrowUp') || keys.has('Space')) && player.grounded) {
        player.vy = -14;
        player.grounded = false;
      }

      const attacksLockedBeforeBoss = boss.action === 'spawn' && (!state.travelerMet || state.travelerDialogueIndex >= 0 || boss.actionTimer > 58);

      if (keys.has('KeyF') && player.punchCooldown <= 0 && !attacksLockedBeforeBoss) {
        const punchBox = {
          x: player.x + (player.facing === 1 ? player.width - 2 : -42),
          y: player.y + 24,
          width: 44,
          height: 42,
        };
        let hitSomething = false;
        state.minions.forEach((minion) => {
          if (minion.health > 0 && minion.action !== 'spawn' && rectsOverlap(punchBox, getMinionHitbox(minion))) {
            minion.health -= 1;
            minion.action = minion.health <= 0 ? 'death' : 'damage';
            minion.actionTimer = minion.health <= 0 ? 44 : 22;
            hitSomething = true;
          }
        });
        if (boss.health > 0 && rectsOverlap(punchBox, boss)) {
          boss.health -= 1;
          boss.action = boss.health <= 0 ? 'death' : 'damage';
          boss.actionTimer = boss.health <= 0 ? 96 : 34;
          state.message = boss.health <= 0 ? 'Guardian defeated' : `Forest Guardian ${boss.health}/${boss.maxHealth}`;
          hitSomething = true;
        }
        player.punchCooldown = 22;
        state.cameraShake = Math.max(state.cameraShake, hitSomething ? 8 : 2);
        playPunchSound();
      }

      if (keys.has('KeyG') && player.fireCooldown <= 0 && player.stamina >= 28 && !attacksLockedBeforeBoss) {
        state.shots.push({
          x: player.x + player.width / 2 + player.facing * 22,
          y: player.y + 22,
          vx: player.facing * 9,
          age: 0,
        });
        player.stamina -= 28;
        player.fireCooldown = 24;
        playProjectileSound('fire');
      }

      player.fireCooldown = Math.max(0, player.fireCooldown - 1);
      player.punchCooldown = Math.max(0, player.punchCooldown - 1);
      player.invincible = Math.max(0, player.invincible - 1);
      player.stamina = clamp(player.stamina + 0.55, 0, 100);
      player.vy = Math.min(player.vy + 0.78, 15);

      player.x += player.vx;
      player.x = clamp(player.x, 82, WIDTH - player.width - 82);

      const previousBottom = player.y + player.height;
      player.grounded = false;
      player.y += player.vy;
      adventurePlatforms.forEach((platform) => {
        if (
          player.vy >= 0 &&
          previousBottom <= platform.y + 8 &&
          rectsOverlap(player, platform)
        ) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.grounded = true;
        }
      });
      if (player.y > HEIGHT + 80) damageAdventurePlayer(state);

      const travelerX = TRAVELER_X;
      const travelerEncounterActive = boss.action === 'spawn' && !state.travelerMet;
      const travelerDialogueActive = state.travelerDialogueIndex >= 0;
      if (travelerEncounterActive || travelerDialogueActive) {
        boss.actionTimer = 96;
        boss.vx = 0;
        if (!state.travelerMet && Math.abs(player.x + player.width / 2 - travelerX) < 78) {
          state.travelerMet = true;
          state.travelerDialogueIndex = 0;
          state.message = 'Traveler';
          player.vx *= 0.25;
        }
        state.cameraShake = Math.max(0, state.cameraShake - 0.75);
        return;
      }

      if (boss.health > 0 || boss.action === 'death') {
        const bossCenter = boss.x + boss.width / 2;
        const playerCenter = player.x + player.width / 2;
        const distance = Math.abs(playerCenter - bossCenter);
        boss.facing = playerCenter < bossCenter ? -1 : 1;

        if (boss.actionTimer > 0) {
          boss.actionTimer -= 1;
          boss.vx = 0;

          if (boss.action === 'slam' && boss.actionTimer === 28) {
            const slamBox = {
              x: boss.x + (boss.facing === -1 ? -78 : boss.width - 10),
              y: boss.y + 72,
              width: 88,
              height: 54,
            };
            state.cameraShake = Math.max(state.cameraShake, 22);
            if (rectsOverlap(player, slamBox)) damageAdventurePlayer(state);
          }

          if (boss.action === 'whip' && boss.actionTimer === 30) {
            const whipBox = {
              x: boss.x + (boss.facing === -1 ? -208 : boss.width - 12),
              y: boss.y + 44,
              width: 220,
              height: 58,
            };
            state.cameraShake = Math.max(state.cameraShake, 12);
            if (rectsOverlap(player, whipBox)) damageAdventurePlayer(state);
          }

          if (boss.action === 'whip' && boss.actionTimer === 20) {
            state.shots.push({
              x: boss.x + boss.width / 2 + boss.facing * 108,
              y: boss.y + 72,
              vx: boss.facing * 6.6,
              age: 0,
              element: 'vine',
            });
          }

          if (boss.action === 'summon' && boss.actionTimer === 46 && state.minions.length === 0) {
            const portalX = clamp(boss.x + boss.width / 2 + boss.facing * 118, 145, WIDTH - 145);
            state.minionPortal = { x: portalX, y: 444, timer: 92 };
            state.minions = [
              {
                x: portalX - 42,
                y: 384,
                width: 34,
                height: 58,
                vx: -1.15,
                minX: Math.max(100, portalX - 190),
                maxX: Math.min(WIDTH - 120, portalX + 90),
                health: 2,
                facing: -1,
                action: 'spawn',
                actionTimer: 58,
              },
              {
                x: portalX + 18,
                y: 384,
                width: 34,
                height: 58,
                vx: 1.15,
                minX: Math.max(100, portalX - 90),
                maxX: Math.min(WIDTH - 120, portalX + 190),
                health: 2,
                facing: 1,
                action: 'spawn',
                actionTimer: 58,
              },
            ];
            state.message = 'The Guardian summons minions!';
            state.cameraShake = Math.max(state.cameraShake, 12);
          }

          if (boss.actionTimer <= 0) {
            if (boss.action === 'death') {
              state.won = true;
              state.message = 'Guardian defeated';
              return;
            }
            boss.action = 'walk';
            boss.attackCooldown = 48;
          }
        } else if (boss.health > 0) {
          boss.attackCooldown = Math.max(0, boss.attackCooldown - 1);
          boss.vx = boss.facing * (distance > 148 ? 2.35 : 1.15);
          boss.x += boss.vx;
          boss.x = clamp(boss.x, boss.minX, boss.maxX);

          if (boss.health <= boss.maxHealth / 2 && !boss.hasSummoned) {
            boss.action = 'summon';
            boss.actionTimer = 76;
            boss.hasSummoned = true;
            boss.vx = 0;
          } else if (boss.attackCooldown <= 0) {
            boss.action = distance > 128 ? 'whip' : 'slam';
            boss.actionTimer = boss.action === 'whip' ? 62 : 72;
            boss.vx = 0;
          }
        }

        if (boss.action === 'walk' && rectsOverlap(player, boss)) damageAdventurePlayer(state);
      }

      state.minionPortal.timer = Math.max(0, state.minionPortal.timer - 1);

      state.minions.forEach((minion) => {
        if (minion.actionTimer > 0) {
          minion.actionTimer -= 1;
          if (minion.actionTimer <= 0) {
            if (minion.action === 'death') return;
            minion.action = minion.health <= 0 ? 'death' : 'walk';
            minion.actionTimer = minion.health <= 0 ? 44 : 0;
          }
        }

        if (minion.health > 0 && minion.action !== 'spawn' && minion.action !== 'damage') {
          const playerCenter = player.x + player.width / 2;
          const minionCenter = minion.x + minion.width / 2;
          const chaseDirection: 1 | -1 = playerCenter >= minionCenter ? 1 : -1;
          minion.vx += chaseDirection * 0.16;
          minion.vx = clamp(minion.vx, -2.45, 2.45);
          minion.x += minion.vx;
          if (minion.x < minion.minX || minion.x > minion.maxX) {
            minion.x = clamp(minion.x, minion.minX, minion.maxX);
            minion.vx *= -0.35;
          }
          minion.facing = minion.vx < 0 ? -1 : 1;
          if (rectsOverlap(player, getMinionHitbox(minion))) damageAdventurePlayer(state);
        }
      });
      state.minions = state.minions.filter((minion) => minion.action !== 'death' || minion.actionTimer > 0);

      state.shots = state.shots
        .map((shot) => ({ ...shot, x: shot.x + shot.vx, age: shot.age + 1 }))
        .filter((shot) => shot.age < 75 && shot.x > -40 && shot.x < WIDTH + 40);

      state.shots.forEach((shot) => {
        state.minions.forEach((minion) => {
          if (
            minion.health > 0 &&
            minion.action !== 'spawn' &&
            shot.element !== 'vine' &&
            rectsOverlap({ x: shot.x - 12, y: shot.y - 12, width: 24, height: 24 }, getMinionHitbox(minion))
          ) {
            minion.health -= 1;
            shot.age = 999;
            state.cameraShake = Math.max(state.cameraShake, 6);
            state.message = 'Minion hit';
            minion.action = minion.health <= 0 ? 'death' : 'damage';
            minion.actionTimer = minion.health <= 0 ? 44 : 22;
          }
        });
        if (boss.health > 0 && shot.element !== 'vine' && rectsOverlap({ x: shot.x - 8, y: shot.y - 8, width: 16, height: 16 }, boss)) {
          boss.health -= 1;
          shot.age = 999;
          state.cameraShake = Math.max(state.cameraShake, 10);
          state.message = `Forest Guardian ${boss.health}/${boss.maxHealth}`;
          if (boss.health <= 0) {
            boss.action = 'death';
            boss.actionTimer = 96;
            boss.vx = 0;
            state.message = 'Guardian defeated';
          } else if (boss.actionTimer <= 0) {
            boss.action = 'damage';
            boss.actionTimer = 34;
            boss.vx = 0;
          }
        }
        if (shot.element === 'vine' && rectsOverlap({ x: shot.x - 14, y: shot.y - 14, width: 28, height: 28 }, player)) {
          shot.age = 999;
          damageAdventurePlayer(state);
        }
      });
      state.shots = state.shots.filter((shot) => shot.age < 900);
      state.cameraShake = Math.max(0, state.cameraShake - 0.75);
    };

    const getLightFrameCanvas = (
      sheet: HTMLImageElement | null,
      frame: SpriteFrame,
      cacheRef: MutableRefObject<Map<string, HTMLCanvasElement>>,
      key: string,
    ) => {
      const cached = cacheRef.current.get(key);
      if (cached) return cached;
      if (!sheet || !frame) return null;

      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = frame.width;
      frameCanvas.height = frame.height;
      const frameContext = frameCanvas.getContext('2d');
      if (!frameContext) return null;

      frameContext.drawImage(
        sheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        0,
        0,
        frame.width,
        frame.height,
      );

      try {
        const pixels = frameContext.getImageData(0, 0, frame.width, frame.height);
        for (let index = 0; index < pixels.data.length; index += 4) {
          const r = pixels.data[index];
          const g = pixels.data[index + 1];
          const b = pixels.data[index + 2];
          const lightCheckerBackground = r > 205 && g > 205 && b > 205;
          if (lightCheckerBackground) pixels.data[index + 3] = 0;
        }
        frameContext.putImageData(pixels, 0, 0);
      } catch {
        // If pixel access fails, draw the unedited frame.
      }

      cacheRef.current.set(key, frameCanvas);
      return frameCanvas;
    };

    const drawAdventure = (time: number) => {
      const state = adventureRef.current;
      const { player, boss } = state;
      const shakeX = state.cameraShake > 0 ? Math.sin(time * 0.09) * state.cameraShake : 0;
      const shakeY = state.cameraShake > 0 ? Math.cos(time * 0.11) * state.cameraShake * 0.45 : 0;
      const arena = forestBossArenaRef.current;

      context.save();
      context.translate(shakeX, shakeY);
      if (arena?.complete) {
        context.drawImage(arena, 0, 8, arena.width, arena.height - 16, 0, 0, WIDTH, HEIGHT);
      } else {
        context.fillStyle = '#0b241d';
        context.fillRect(0, 0, WIDTH, HEIGHT);
      }

      state.shots.forEach((shot) => {
        if (shot.element === 'vine') {
          const glow = context.createRadialGradient(shot.x, shot.y, 1, shot.x, shot.y, 22);
          glow.addColorStop(0, 'rgba(236, 255, 132, 0.95)');
          glow.addColorStop(0.42, 'rgba(119, 245, 42, 0.58)');
          glow.addColorStop(1, 'rgba(35, 115, 12, 0)');
          context.fillStyle = glow;
          context.beginPath();
          context.arc(shot.x, shot.y, 22, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = 'rgba(184, 247, 109, 0.8)';
          context.lineWidth = 3;
          context.beginPath();
          context.moveTo(shot.x - shot.vx * 3.8, shot.y + 3);
          context.lineTo(shot.x - shot.vx * 1.4, shot.y - 1);
          context.stroke();
          context.fillStyle = '#cfff66';
          context.beginPath();
          context.arc(shot.x, shot.y, 7, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillStyle = '#ffb02e';
          context.beginPath();
          context.arc(shot.x, shot.y, 9, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#fff2a6';
          context.fillRect(shot.x - 2, shot.y - 4, 7, 7);
        }
      });

      if (state.minionPortal.timer > 0) {
        const pulse = Math.sin(time * 0.02) * 0.12 + 1;
        context.save();
        context.globalAlpha = Math.min(1, state.minionPortal.timer / 18);
        context.translate(state.minionPortal.x, state.minionPortal.y);
        context.scale(pulse, 1);
        context.fillStyle = 'rgba(83, 255, 23, 0.22)';
        context.beginPath();
        context.ellipse(0, 0, 68, 14, 0, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = '#9aff37';
        context.lineWidth = 3;
        context.beginPath();
        context.ellipse(0, 0, 54, 10, 0, 0, Math.PI * 2);
        context.stroke();
        for (let spark = 0; spark < 12; spark += 1) {
          const angle = spark * 1.7 + time * 0.004;
          const radius = 18 + ((spark * 9 + state.minionPortal.timer) % 36);
          context.fillStyle = spark % 2 === 0 ? '#d7ff78' : '#63e629';
          context.fillRect(Math.cos(angle) * radius, -8 - ((spark * 7 + time / 12) % 34), 3, 3);
        }
        context.restore();
      }

      const guideIntroActive =
        state.chapter === 1 &&
        boss.action === 'spawn' &&
        (!state.travelerMet || state.travelerDialogueIndex >= 0 || boss.actionTimer > 58);
      if (guideIntroActive) {
        drawForestGuide(time);
        if (state.travelerMet && state.travelerDialogueIndex >= 0) drawTravelerDialogue();
      }

      state.minions.forEach((minion, index) => {
        const sheet = forestGuardianMinionSheetRef.current;
        const group: keyof typeof FOREST_GUARDIAN_MINION_SPRITES =
          minion.actionTimer > 0 ? minion.action : Math.abs(minion.vx) > 0.05 ? 'walk' : 'idle';
        const frames = FOREST_GUARDIAN_MINION_SPRITES[group];
        const frameIndex =
          minion.actionTimer > 0
            ? clamp(
                Math.floor(
                  ((group === 'spawn' ? 58 : group === 'damage' ? 22 : group === 'death' ? 44 : 1) -
                    minion.actionTimer) /
                    (group === 'spawn' ? 58 : group === 'damage' ? 22 : group === 'death' ? 44 : 1) *
                    frames.length,
                ),
                0,
                frames.length - 1,
              )
            : Math.floor(time / 105 + index) % frames.length;
        const frame = frames[frameIndex];
        const frameCanvas = getLightFrameCanvas(
          sheet,
          frame,
          forestGuardianMinionFrameCacheRef,
          `new-minion-crop-only-${group}-${frameIndex}`,
        );
        if (sheet?.complete) {
          context.save();
          context.translate(minion.x + minion.width / 2, minion.y + minion.height);
          context.scale(minion.facing < 0 ? -1 : 1, 1);
          if (frameCanvas) {
            const drawWidth = group === 'spawn' ? 104 : group === 'death' ? 108 : 98;
            const drawHeight = group === 'death' ? 68 : group === 'spawn' ? 100 : 94;
            context.drawImage(frameCanvas, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
          }
          context.restore();
        } else {
          context.fillStyle = '#7ec641';
          context.fillRect(minion.x, minion.y, minion.width, minion.height);
        }
      });

      if ((boss.health > 0 || boss.action === 'death') && !guideIntroActive) {
        const group: AdventureBoss['action'] | 'idle' =
          boss.actionTimer > 0 ? boss.action : Math.abs(boss.vx) > 0.05 ? 'walk' : 'idle';
        const extraGroup: keyof typeof FOREST_GUARDIAN_EXTRA_SPRITES | null =
          group === 'spawn' || group === 'damage' || group === 'death' ? group : null;
        const isWhip = group === 'whip';
        const mainGroup = group as keyof typeof FOREST_GUARDIAN_SPRITES;
        const sheet = extraGroup
          ? forestGuardianExtraSheetRef.current
          : isWhip
            ? forestGuardianWhipSheetRef.current
            : forestGuardianSheetRef.current;
        const frames = extraGroup
          ? FOREST_GUARDIAN_EXTRA_SPRITES[extraGroup]
          : isWhip
            ? FOREST_GUARDIAN_WHIP_SPRITES
            : FOREST_GUARDIAN_SPRITES[mainGroup];
        const animationDuration =
          group === 'spawn' || group === 'death'
            ? 96
            : group === 'damage'
              ? 34
              : group === 'whip'
                ? 62
                : group === 'summon'
                  ? 76
                  : 72;
        const frameIndex =
          boss.actionTimer > 0
            ? clamp(
                Math.floor(
                  ((animationDuration - boss.actionTimer) / animationDuration) *
                    frames.length,
                ),
                0,
                frames.length - 1,
              )
            : Math.floor(time / (group === 'walk' ? 125 : 160)) % frames.length;
        const frame = frames[frameIndex];
        const frameCanvas = getLightFrameCanvas(
          sheet,
          frame,
          forestGuardianFrameCacheRef,
          `boss-crop-only-${extraGroup ?? (isWhip ? 'whip' : 'main')}-${group}-${frameIndex}`,
        );
        if (sheet?.complete) {
          context.save();
          context.translate(boss.x + boss.width / 2, boss.y + boss.height);
          context.scale(boss.facing < 0 ? -1 : 1, 1);
          const drawWidth =
            group === 'whip'
              ? 260
              : group === 'slam'
              ? 190
              : group === 'summon' || group === 'spawn' || group === 'damage' || group === 'death'
                ? 196
                : group === 'walk'
                  ? 178
                  : 176;
          const drawHeight =
            group === 'whip'
              ? 174
              : group === 'slam'
              ? 186
              : group === 'summon' || group === 'spawn' || group === 'damage' || group === 'death'
                ? 174
                : group === 'walk'
                  ? 170
                  : 164;
          if (frameCanvas) {
            context.drawImage(frameCanvas, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
          }
          context.restore();
        } else {
          context.fillStyle = '#263b25';
          context.beginPath();
          context.ellipse(boss.x + 45, boss.y + 56, 46, 58, 0, 0, Math.PI * 2);
          context.fill();
        }
      }

      const kazanGroup: keyof typeof KAZAN_SPRITES =
        player.fireCooldown > 13
          ? 'shoot'
          : player.punchCooldown > 10
            ? 'jab'
            : player.grounded && Math.abs(player.vx) > 0.45
              ? 'walk'
              : 'idle';
      const kazanFrames = KAZAN_SPRITES[kazanGroup];
      const kazanFrameIndex =
        kazanGroup === 'shoot'
          ? getShootFrameIndex(player.fireCooldown, kazanFrames.length)
          : kazanGroup === 'jab'
            ? clamp(Math.floor(((22 - player.punchCooldown) / 22) * kazanFrames.length), 0, kazanFrames.length - 1)
          : Math.floor(time / (kazanGroup === 'walk' ? 105 : 180)) % kazanFrames.length;
      const kazanFrameCanvas = getKazanFrameCanvas(kazanGroup, kazanFrameIndex);
      context.save();
      context.translate(player.x + player.width / 2, player.y + player.height + 4);
      context.scale(player.facing, 1);
      context.globalAlpha = player.invincible > 0 && Math.floor(time / 80) % 2 === 0 ? 0.45 : 1;
      if (kazanFrameCanvas) {
        const kazanScale = kazanGroup === 'shoot' ? 0.48 : 0.52;
        const drawWidth = kazanFrameCanvas.width * kazanScale;
        const drawHeight = kazanFrameCanvas.height * kazanScale;
        context.drawImage(kazanFrameCanvas, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
      } else {
        context.fillStyle = '#25315c';
        context.fillRect(-16, -52, 32, 52);
      }
      context.globalAlpha = 1;
      context.restore();
      context.restore();

      context.fillStyle = 'rgba(6, 12, 8, 0.72)';
      context.fillRect(14, 14, 250, 98);
      context.fillStyle = '#fff1c7';
      context.font = '900 18px monospace';
      context.textAlign = 'left';
      context.fillText(`HP ${Math.max(0, player.health)}`, 28, 38);
      context.fillStyle = '#101216';
      context.fillRect(28, 50, 198, 14);
      context.strokeStyle = '#fff1c7';
      context.lineWidth = 2;
      context.strokeRect(28, 50, 198, 14);
      context.fillStyle = player.stamina >= 28 ? '#ffe45e' : '#785f3b';
      context.fillRect(32, 54, Math.max(0, 190 * (player.stamina / 100)), 6);
      context.fillStyle = '#fff1c7';
      context.font = '900 12px monospace';
      context.fillText('STAMINA', 28, 82);
      context.fillText('F PUNCH  G FIREBALL', 116, 82);
      context.fillText(`${state.crystals}/5 CRYSTALS`, 28, 102);

      context.fillStyle = '#101216';
      context.fillRect(WIDTH - 286, 20, 250, 18);
      context.strokeStyle = '#fff1c7';
      context.lineWidth = 2;
      context.strokeRect(WIDTH - 286, 20, 250, 18);
      context.fillStyle = '#ff4f78';
      context.fillRect(WIDTH - 281, 25, Math.max(0, 240 * (boss.health / boss.maxHealth)), 8);
      context.fillStyle = '#fff1c7';
      context.font = '900 13px monospace';
      context.textAlign = 'right';
      context.fillText(state.bossName, WIDTH - 36, 17);

      context.fillStyle = '#fff1c7';
      context.textAlign = 'center';
      context.fillText(state.message, WIDTH / 2, 34);

      if (state.won) {
        drawPostBossSequence(time);
      }
    };

    const updateFighter = (
      fighter: Fighter,
      opponent: Fighter,
      left: string,
      right: string,
      jump: string,
      punch: string,
      fire: string,
      water: string,
      owner: 'p1' | 'p2',
    ) => {
      const keys = keysRef.current;

      fighter.facing = fighter.x + fighter.width / 2 < opponent.x + opponent.width / 2 ? 1 : -1;

      if (fighter.stun <= 0) {
        if (keys.has(left)) fighter.vx -= SPEED * 0.24;
        if (keys.has(right)) fighter.vx += SPEED * 0.24;
        if (keys.has(jump) && fighter.grounded) {
          fighter.vy = JUMP;
          fighter.grounded = false;
        }
        if (keys.has(punch) && fighter.attacking <= 0) {
          fighter.attacking = 16;
          playPunchSound();
        }
        if (keys.has(fire) && fighter.fireCooldown <= 0 && fighter.energy >= 25) {
          fighter.fireCooldown = 34;
          fighter.shotTimer = SHOT_ANIMATION_TIME;
          fighter.energy -= 25;
          gameRef.current.fireballs.push({
            x: fighter.x + fighter.width / 2 + fighter.facing * 38,
            y: fighter.y + 42,
            vx: fighter.facing * 9.5,
            owner,
            age: 0,
            element: 'fire',
          });
          playProjectileSound('fire');
        }
        if (keys.has(water) && fighter.fireCooldown <= 0 && fighter.energy >= 35) {
          fighter.fireCooldown = 42;
          fighter.shotTimer = SHOT_ANIMATION_TIME;
          fighter.energy -= 35;
          gameRef.current.fireballs.push({
            x: fighter.x + fighter.width / 2 + fighter.facing * 38,
            y: fighter.y + 48,
            vx: fighter.facing * 7.4,
            owner,
            age: 0,
            element: 'water',
          });
          playProjectileSound('water');
        }
      }

      fighter.vx *= fighter.grounded ? FRICTION : 0.94;
      fighter.vy += GRAVITY;
      fighter.x += fighter.vx;
      fighter.y += fighter.vy;
      fighter.x = clamp(fighter.x, 24, WIDTH - fighter.width - 24);

      if (fighter.y + fighter.height >= GROUND) {
        fighter.y = GROUND - fighter.height;
        fighter.vy = 0;
        fighter.grounded = true;
      }

      fighter.energy = clamp(fighter.energy + 0.12, 0, 100);
      fighter.attacking = Math.max(0, fighter.attacking - 1);
      fighter.hitCooldown = Math.max(0, fighter.hitCooldown - 1);
      fighter.fireCooldown = Math.max(0, fighter.fireCooldown - 1);
      fighter.shotTimer = Math.max(0, fighter.shotTimer - 1);
      fighter.stun = Math.max(0, fighter.stun - 1);
    };

    const driveCpu = (cpu: Fighter, opponent: Fighter) => {
      if (cpu.stun > 0 || cpu.health <= 0) return;

      const game = gameRef.current;
      const cpuCenter = cpu.x + cpu.width / 2;
      const opponentCenter = opponent.x + opponent.width / 2;
      const distance = opponentCenter - cpuCenter;
      const direction = distance > 0 ? 1 : -1;
      const gap = Math.abs(distance);

      if (gap > 112) {
        cpu.vx += direction * SPEED * 0.18;
      } else if (gap < 72) {
        cpu.vx -= direction * SPEED * 0.12;
      }

      if (gap < 86 && cpu.attacking <= 0 && cpu.grounded) {
        cpu.attacking = 16;
        playPunchSound();
      }

      if (gap > 170 && cpu.fireCooldown <= 0 && cpu.energy >= 25) {
        const element: Fireball['element'] = cpu.energy > 62 ? 'water' : 'fire';
        const cost = element === 'water' ? 35 : 25;
        cpu.fireCooldown = element === 'water' ? 58 : 46;
        cpu.shotTimer = SHOT_ANIMATION_TIME;
        cpu.energy -= cost;
        game.fireballs.push({
          x: cpu.x + cpu.width / 2 + cpu.facing * 38,
          y: cpu.y + (element === 'water' ? 48 : 42),
          vx: cpu.facing * (element === 'water' ? 7.4 : 9.5),
          owner: 'p2',
          age: 0,
          element,
        });
        playProjectileSound(element);
      }

      if (opponent.y + opponent.height < cpu.y + 76 && cpu.grounded && gap < 120) {
        cpu.vy = JUMP * 0.82;
        cpu.grounded = false;
      }
    };

    const update = () => {
      const game = gameRef.current;

      if (screenRef.current !== 'playing') return;
      if (pausedRef.current) return;

      if (game.roundOver > 0) {
        game.roundOver -= 1;
        if (game.roundOver === 0) {
          const p1Wins = game.p1.wins;
          const p2Wins = game.p2.wins;
          gameRef.current = createGame();
          gameRef.current.p1.wins = p1Wins;
          gameRef.current.p2.wins = p2Wins;
        }
        return;
      }

      updateFighter(game.p1, game.p2, 'KeyA', 'KeyD', 'KeyW', 'KeyF', 'KeyG', 'KeyH', 'p1');
      if (playerModeRef.current === '1p') {
        driveCpu(game.p2, game.p1);
      }
      updateFighter(
        game.p2,
        game.p1,
        playerModeRef.current === '2p' ? 'ArrowLeft' : 'CpuLeft',
        playerModeRef.current === '2p' ? 'ArrowRight' : 'CpuRight',
        playerModeRef.current === '2p' ? 'ArrowUp' : 'CpuJump',
        playerModeRef.current === '2p' ? 'Slash' : 'CpuPunch',
        playerModeRef.current === '2p' ? 'Period' : 'CpuFire',
        playerModeRef.current === '2p' ? 'Comma' : 'CpuWater',
        'p2',
      );

      const testPunch = (attacker: Fighter, defender: Fighter) => {
        if (attacker.attacking !== 10) return;
        const reachX = attacker.facing === 1 ? attacker.x + attacker.width : attacker.x - 44;
        if (overlap(reachX, attacker.y + 24, 44, 42, defender.x, defender.y, defender.width, defender.height)) {
          if (hitFighter(defender, attacker, 8, 7)) {
            playHitSound();
            game.bursts.push({
              x: defender.x + defender.width / 2,
              y: defender.y + 45,
              life: 16,
              color: attacker.trim,
            });
          }
        }
      };

      testPunch(game.p1, game.p2);
      testPunch(game.p2, game.p1);

      game.fireballs.forEach((fireball) => {
        fireball.x += fireball.vx;
        fireball.age += 1;
      });

      const cancelledProjectiles = new Set<Fireball>();
      for (let i = 0; i < game.fireballs.length; i += 1) {
        const first = game.fireballs[i];
        for (let j = i + 1; j < game.fireballs.length; j += 1) {
          const second = game.fireballs[j];
          if (
            first.owner !== second.owner &&
            first.element !== second.element &&
            overlap(first.x - 20, first.y - 20, 40, 40, second.x - 20, second.y - 20, 40, 40)
          ) {
            cancelledProjectiles.add(first);
            cancelledProjectiles.add(second);
            game.bursts.push({
              x: (first.x + second.x) / 2,
              y: (first.y + second.y) / 2,
              life: 28,
              color: '#dffbff',
            });
          }
        }
      }

      game.fireballs = game.fireballs.filter((fireball) => {
        if (cancelledProjectiles.has(fireball)) return false;

        const target = fireball.owner === 'p1' ? game.p2 : game.p1;
        const attacker = fireball.owner === 'p1' ? game.p1 : game.p2;
        const size = fireball.element === 'water' ? 44 : 36;
        if (
          overlap(
            fireball.x - size / 2,
            fireball.y - size / 2,
            size,
            size,
            target.x,
            target.y,
            target.width,
            target.height,
          )
        ) {
          const didHit = hitFighter(
            target,
            attacker,
            fireball.element === 'water' ? 10 : 13,
            fireball.element === 'water' ? 5 : 10,
          );
          if (didHit && fireball.element === 'water') {
            target.stun = 22;
            target.vx *= 0.35;
          }
          if (didHit) {
            playHitSound();
          }
          game.bursts.push({
            x: fireball.x,
            y: fireball.y,
            life: fireball.element === 'water' ? 26 : 22,
            color: fireball.element === 'water' ? '#7af0ff' : '#ffb02e',
          });
          return false;
        }
        return fireball.x > -50 && fireball.x < WIDTH + 50 && fireball.age < 130;
      });

      game.bursts = game.bursts
        .map((burst) => ({ ...burst, life: burst.life - 1 }))
        .filter((burst) => burst.life > 0);

      if (game.p1.health <= 0 || game.p2.health <= 0) {
        const winner = game.p1.health > game.p2.health ? game.p1 : game.p2;
        winner.wins += 1;
        const languageCopy = TEXT[languageRef.current];
        game.message = languageCopy.wins(winner === game.p1 ? CHARACTERS.p1.name : CHARACTERS.p2.name);
        game.roundOver = 115;
      }
    };

    const getRiptideFrameCanvas = (group: keyof typeof RIPTIDE_SPRITES, index: number) => {
      const key = `${group}-${index}`;
      const cached = riptideFrameCacheRef.current.get(key);
      if (cached) return cached;

      const sheet = riptideSheetRef.current;
      const frame = RIPTIDE_SPRITES[group][index];
      if (!sheet || !frame) return null;

      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = frame.width;
      frameCanvas.height = frame.height;
      const frameContext = frameCanvas.getContext('2d');
      if (!frameContext) return null;

      frameContext.drawImage(
        sheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        0,
        0,
        frame.width,
        frame.height,
      );

      try {
        const pixels = frameContext.getImageData(0, 0, frame.width, frame.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const r = pixels.data[i];
          const g = pixels.data[i + 1];
          const b = pixels.data[i + 2];
          const greyBackground = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && r > 70 && r < 185;
          if (greyBackground) pixels.data[i + 3] = 0;
        }
        frameContext.putImageData(pixels, 0, 0);
      } catch {
        // Keep the animation running even if pixel cleanup is blocked by the browser.
      }
      riptideFrameCacheRef.current.set(key, frameCanvas);
      return frameCanvas;
    };

    const getKazanFrameCanvas = (group: keyof typeof KAZAN_SPRITES, index: number) => {
      const key = `${group}-${index}`;
      const cached = kazanFrameCacheRef.current.get(key);
      if (cached) return cached;

      const sheet = kazanSheetRef.current;
      const frame = KAZAN_SPRITES[group][index];
      if (!sheet || !frame) return null;

      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = frame.width;
      frameCanvas.height = frame.height;
      const frameContext = frameCanvas.getContext('2d');
      if (!frameContext) return null;

      frameContext.drawImage(
        sheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        0,
        0,
        frame.width,
        frame.height,
      );
      try {
        const pixels = frameContext.getImageData(0, 0, frame.width, frame.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const r = pixels.data[i];
          const g = pixels.data[i + 1];
          const b = pixels.data[i + 2];
          const greyBackground = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && r > 70 && r < 185;
          if (greyBackground) pixels.data[i + 3] = 0;
        }
        frameContext.putImageData(pixels, 0, 0);
      } catch {
        // Keep the animation running even if pixel cleanup is blocked by the browser.
      }
      kazanFrameCacheRef.current.set(key, frameCanvas);
      return frameCanvas;
    };

    const getForestGuideFrameCanvas = (index: number) => {
      const key = `idle-${index}`;
      const cached = forestGuideFrameCacheRef.current.get(key);
      if (cached) return cached;

      const sheet = forestGuideSheetRef.current;
      const frame = FOREST_GUIDE_IDLE_SPRITES[index];
      if (!sheet || !frame) return null;

      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = frame.width;
      frameCanvas.height = frame.height;
      const frameContext = frameCanvas.getContext('2d');
      if (!frameContext) return null;

      frameContext.drawImage(
        sheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        0,
        0,
        frame.width,
        frame.height,
      );

      try {
        const pixels = frameContext.getImageData(0, 0, frame.width, frame.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const r = pixels.data[i];
          const g = pixels.data[i + 1];
          const b = pixels.data[i + 2];
          const greyBackground = Math.abs(r - g) < 12 && Math.abs(g - b) < 12 && r > 70 && r < 190;
          if (greyBackground) pixels.data[i + 3] = 0;
        }
        frameContext.putImageData(pixels, 0, 0);
      } catch {
        // Keep the guide visible even if pixel cleanup is blocked.
      }

      forestGuideFrameCacheRef.current.set(key, frameCanvas);
      return frameCanvas;
    };

    const drawForestGuide = (time: number) => {
      const frameIndex = Math.floor(time / 180) % FOREST_GUIDE_IDLE_SPRITES.length;
      const frameCanvas = getForestGuideFrameCanvas(frameIndex);
      if (!frameCanvas) return;

      const bob = Math.sin(time * 0.005) * 1.5;
      const drawWidth = frameCanvas.width * 0.62;
      const drawHeight = frameCanvas.height * 0.62;
      context.save();
      context.translate(TRAVELER_X, 446 + bob);
      context.fillStyle = 'rgba(4, 10, 9, 0.42)';
      context.beginPath();
      context.ellipse(0, 0, 34, 7, 0, 0, Math.PI * 2);
      context.fill();
      context.drawImage(frameCanvas, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
      context.restore();
    };

    const drawTravelerDialogue = () => {
      const lines = TEXT[languageRef.current].travelerCrystalRumor;
      const lineIndex = clamp(adventureRef.current.travelerDialogueIndex, 0, lines.length - 1);
      const copy = lines[lineIndex];
      const longBubble = lineIndex === 2 || lineIndex === 4;
      const boxX = longBubble ? 402 : 492;
      const boxY = longBubble ? 270 : 294;
      const boxWidth = longBubble ? 460 : 330;
      const boxHeight = longBubble ? 86 : 54;
      context.save();
      context.fillStyle = '#fffdf0';
      context.strokeStyle = '#151515';
      context.lineWidth = 4;
      context.beginPath();
      context.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(boxX + boxWidth - 102, boxY + boxHeight - 2);
      context.lineTo(TRAVELER_X - 12, boxY + boxHeight + 25);
      context.lineTo(boxX + boxWidth - 62, boxY + boxHeight - 2);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = '#111111';
      context.font = '15px "Geist Pixel", "Press Start 2P", monospace';
      context.textAlign = 'left';
      context.textBaseline = 'top';
      const words = copy.split(' ');
      const wrapped: string[] = [];
      let line = '';
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (context.measureText(next).width > boxWidth - 44 && line) {
          wrapped.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      if (line) wrapped.push(line);
      wrapped.slice(0, 3).forEach((text, index) => {
        context.fillText(text, boxX + 22, boxY + 14 + index * 20);
      });
      context.restore();
    };

    const drawPostBossSequence = (time: number) => {
      const state = adventureRef.current;
      const timer = state.postBossTimer;
      const crystalX = 618;
      const crystalY = 336 + Math.sin(time * 0.006) * 5;
      context.save();

      if (timer > 18) {
        const glow = context.createRadialGradient(crystalX, crystalY, 4, crystalX, crystalY, 64);
        glow.addColorStop(0, 'rgba(133, 238, 255, 0.95)');
        glow.addColorStop(0.35, 'rgba(62, 173, 255, 0.42)');
        glow.addColorStop(1, 'rgba(43, 84, 255, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(crystalX, crystalY, 64, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#8eefff';
        context.strokeStyle = '#ffffff';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(crystalX, crystalY - 34);
        context.lineTo(crystalX + 22, crystalY - 7);
        context.lineTo(crystalX + 10, crystalY + 32);
        context.lineTo(crystalX - 14, crystalY + 32);
        context.lineTo(crystalX - 24, crystalY - 7);
        context.closePath();
        context.fill();
        context.stroke();
      }

      if (timer > 92 && timer < 210) {
        drawForestGuide(time);
        const boxX = 374;
        const boxY = 278;
        const boxWidth = 430;
        const boxHeight = 66;
        context.fillStyle = '#fffdf0';
        context.strokeStyle = '#151515';
        context.lineWidth = 4;
        context.beginPath();
        context.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
        context.fill();
        context.stroke();
        context.fillStyle = '#111111';
        context.font = '15px "Geist Pixel", "Press Start 2P", monospace';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(TEXT[languageRef.current].travelerAfterBoss, boxX + 20, boxY + 20);
      }

      if (timer > 130) {
        context.fillStyle = '#fff1c7';
        context.font = '20px "Geist Pixel", "Press Start 2P", monospace';
        context.textAlign = 'center';
        context.fillText(TEXT[languageRef.current].crystalCollected, WIDTH / 2, 88);
      }

      if (timer > 230) {
        const portalX = 810;
        const portalY = 374;
        const pulse = 1 + Math.sin(time * 0.01) * 0.08;
        context.save();
        context.translate(portalX, portalY);
        context.scale(pulse, 1);
        context.fillStyle = 'rgba(93, 211, 255, 0.22)';
        context.strokeStyle = '#7af0ff';
        context.lineWidth = 6;
        context.beginPath();
        context.ellipse(0, 0, 46, 82, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.beginPath();
        context.ellipse(0, 0, 28, 58, 0, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }

      if (timer > 330) {
        context.fillStyle = 'rgba(0, 0, 0, 0.54)';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = '#fff1c7';
        context.font = '20px "Geist Pixel", "Press Start 2P", monospace';
        context.textAlign = 'center';
        context.fillText(TEXT[languageRef.current].nextBossPreview, WIDTH / 2, 92);
        context.save();
        context.translate(WIDTH / 2, 334);
        context.fillStyle = 'rgba(4, 7, 12, 0.92)';
        context.beginPath();
        context.ellipse(0, -22, 54, 88, 0, 0, Math.PI * 2);
        context.fill();
        context.fillRect(-46, -94, 92, 130);
        context.fillStyle = '#63f034';
        context.fillRect(-18, -72, 10, 10);
        context.fillRect(8, -72, 10, 10);
        context.strokeStyle = '#63f034';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(-62, -10);
        context.quadraticCurveTo(-112, 26, -82, 84);
        context.moveTo(62, -10);
        context.quadraticCurveTo(112, 26, 82, 84);
        context.stroke();
        context.restore();
      }

      context.restore();
    };

    const drawKazanSprite = (fighter: Fighter, label: string) => {
      const now = performance.now();
      const shooting = fighter.attacking <= 0 && fighter.shotTimer > 0;
      const walking = fighter.grounded && Math.abs(fighter.vx) > 0.45 && fighter.attacking <= 0 && !shooting;
      const group: keyof typeof KAZAN_SPRITES = shooting ? 'shoot' : fighter.attacking > 0 ? 'jab' : walking ? 'walk' : 'idle';
      const frameCount = KAZAN_SPRITES[group].length;
      const index =
        shooting
          ? getShootFrameIndex(fighter.shotTimer, frameCount)
          : group === 'jab'
          ? clamp(Math.floor(((16 - fighter.attacking) / 16) * frameCount), 0, frameCount - 1)
          : Math.floor((now / (group === 'walk' ? 105 : 180)) % frameCount);
      const frameCanvas = getKazanFrameCanvas(group, index);
      if (!frameCanvas) return false;

      const blink = fighter.hitCooldown > 0 && fighter.hitCooldown % 4 < 2;
      const idle = Math.sin((now + fighter.x * 13) * 0.006) * 2;
      const scale = group === 'shoot' ? 0.82 : group === 'jab' ? 0.9 : 0.88;
      const drawWidth = frameCanvas.width * scale;
      const drawHeight = frameCanvas.height * scale;

      context.save();
      context.globalAlpha = blink ? 0.45 : 1;
      context.translate(fighter.x + fighter.width / 2, fighter.y + 116 + idle);
      context.scale(fighter.facing, 1);
      context.fillStyle = '#14121a';
      context.fillRect(-32, -5, 64, 6);
      context.drawImage(frameCanvas, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);

      context.restore();

      context.fillStyle = '#fff8d6';
      context.strokeStyle = '#101216';
      context.lineWidth = 4;
      context.font = '900 13px monospace';
      context.textAlign = 'center';
      context.strokeText(label, fighter.x + fighter.width / 2, fighter.y + 116 + idle - drawHeight - 8);
      context.fillText(label, fighter.x + fighter.width / 2, fighter.y + 116 + idle - drawHeight - 8);
      return true;
    };

    const drawRiptideSprite = (fighter: Fighter, label: string) => {
      const now = performance.now();
      const shooting = fighter.attacking <= 0 && fighter.shotTimer > 0;
      const walking = fighter.grounded && Math.abs(fighter.vx) > 0.45 && fighter.attacking <= 0 && !shooting;
      const group: keyof typeof RIPTIDE_SPRITES = shooting ? 'shoot' : fighter.attacking > 0 ? 'jab' : walking ? 'walk' : 'idle';
      const frameCount = RIPTIDE_SPRITES[group].length;
      const index =
        shooting
          ? getShootFrameIndex(fighter.shotTimer, frameCount)
          : group === 'jab'
          ? clamp(Math.floor(((16 - fighter.attacking) / 16) * frameCount), 0, frameCount - 1)
          : Math.floor((now / (group === 'walk' ? 105 : 180)) % frameCount);
      const frameCanvas = getRiptideFrameCanvas(group, index);
      if (!frameCanvas) return false;

      const blink = fighter.hitCooldown > 0 && fighter.hitCooldown % 4 < 2;
      const idle = Math.sin((now + fighter.x * 13) * 0.006) * 2;
      const scale = group === 'shoot' ? 0.74 : group === 'jab' ? 0.74 : 0.7;
      const drawWidth = frameCanvas.width * scale;
      const drawHeight = frameCanvas.height * scale;

      context.save();
      context.globalAlpha = blink ? 0.45 : 1;
      context.translate(fighter.x + fighter.width / 2, fighter.y + 116 + idle);
      context.scale(fighter.facing, 1);
      context.fillStyle = '#14121a';
      context.fillRect(-32, -5, 64, 6);
      context.drawImage(frameCanvas, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);

      context.restore();

      context.fillStyle = '#fff8d6';
      context.strokeStyle = '#101216';
      context.lineWidth = 4;
      context.font = '900 13px monospace';
      context.textAlign = 'center';
      context.strokeText(label, fighter.x + fighter.width / 2, fighter.y + 116 + idle - drawHeight - 8);
      context.fillText(label, fighter.x + fighter.width / 2, fighter.y + 116 + idle - drawHeight - 8);
      return true;
    };

    const drawFighter = (fighter: Fighter, label: string, variant: 'p1' | 'p2') => {
      if (variant === 'p1' && drawKazanSprite(fighter, label)) return;
      if (variant === 'p2' && drawRiptideSprite(fighter, label)) return;

      const blink = fighter.hitCooldown > 0 && fighter.hitCooldown % 4 < 2;
      const isBlue = variant === 'p1';
      const now = performance.now();
      const idle = Math.sin((now + fighter.x * 13) * 0.006) * 2;
      const walking = fighter.grounded && Math.abs(fighter.vx) > 0.45 && fighter.attacking <= 0;
      const blasting = fighter.attacking <= 0 && fighter.fireCooldown > 20;
      const stride = walking ? Math.sin(now * 0.018 + fighter.x * 0.04) : 0;
      const stepA = Math.round(stride * 5);
      const stepB = Math.round(-stride * 5);
      const liftA = walking && stride > 0 ? -3 : 0;
      const liftB = walking && stride < 0 ? -3 : 0;
      context.save();
      context.translate(fighter.x + fighter.width / 2, fighter.y + idle);
      context.scale(fighter.facing, 1);

      context.fillStyle = '#14121a';
      context.fillRect(-32, 112, 64, 6);

      if (isBlue) {
        context.translate(-4, 0);

        context.fillStyle = '#101216';
        context.fillRect(-14, 3, 28, 26);
        context.fillRect(-25, 31, 50, 48);
        context.fillRect(-32, 37, 16, 34);
        context.fillRect(16, 35, 17, 32);
        context.fillRect(-23, 80, 20, 35);
        context.fillRect(3, 82, 22, 34);
        context.fillRect(23, 37, 37, 18);
        context.fillRect(-57, 39, 38, 19);

        context.fillStyle = '#f1b178';
        context.fillRect(-12, 5, 24, 22);
        context.fillRect(-7, 27, 14, 8);
        context.fillStyle = '#c77b48';
        context.fillRect(-3, 16, 7, 8);
        context.fillRect(-10, 23, 20, 4);

        context.fillStyle = '#ce263d';
        context.fillRect(-18, -1, 34, 8);
        context.fillRect(-24, 2, 10, 21);
        context.fillRect(14, 1, 18, 5);
        context.fillRect(-30, 4, 7, 6);
        context.fillRect(-33, 11, 10, 5);
        context.fillRect(27, 5, 17, 4);
        context.fillRect(35, 10, 12, 4);
        context.fillStyle = '#f04b56';
        context.fillRect(-22, 5, 5, 13);
        context.fillRect(17, 3, 10, 3);

        context.fillStyle = '#101216';
        context.fillRect(-7, 13, 5, 4);
        context.fillRect(6, 13, 5, 4);
        context.fillRect(-9, 11, 7, 2);
        context.fillRect(5, 11, 7, 2);
        context.fillRect(-5, 25, 12, 3);
        context.fillStyle = '#f6ca9a';
        context.fillRect(-10, 8, 5, 4);
        context.fillRect(2, 8, 7, 4);

        context.fillStyle = blink ? '#ffffff' : '#f2f0df';
        context.fillRect(-24, 32, 45, 43);
        context.fillRect(-30, 39, 13, 29);
        context.fillRect(17, 37, 14, 27);
        context.fillRect(-21 + stepA, 82 + liftA, 17, 31);
        context.fillRect(4 + stepB, 84 + liftB, 18, 29);

        context.fillStyle = '#ffffff';
        context.fillRect(-19, 34, 12, 36);
        context.fillRect(6, 34, 11, 35);
        context.fillRect(-29, 41, 5, 24);
        context.fillRect(20, 40, 5, 20);
        context.fillStyle = '#eee9d5';
        context.fillRect(-23, 64, 11, 10);
        context.fillRect(12, 63, 10, 10);
        context.fillRect(-21 + stepA, 90 + liftA, 7, 7);
        context.fillRect(8 + stepB, 91 + liftB, 7, 7);
        context.fillStyle = '#c8c0a7';
        context.fillRect(-24, 32, 45, 4);
        context.fillRect(-22, 58, 12, 4);
        context.fillRect(10, 57, 12, 4);
        context.fillRect(-21 + stepA, 98 + liftA, 17, 4);
        context.fillRect(4 + stepB, 101 + liftB, 18, 4);
        context.fillRect(-18 + stepA, 86 + liftA, 5, 24);
        context.fillRect(15 + stepB, 88 + liftB, 5, 21);
        context.fillRect(-3, 36, 3, 35);
        context.fillRect(2, 36, 3, 35);

        context.fillStyle = '#d8d4bd';
        context.fillRect(-19, 48, 37, 7);
        context.fillRect(-15, 36, 5, 36);
        context.fillRect(11, 36, 4, 34);
        context.fillStyle = '#17121a';
        context.fillRect(-23, 73, 45, 9);
        context.fillRect(-18, 74, 8, 15);
        context.fillRect(8, 74, 8, 15);
        context.fillRect(-27, 78, 10, 4);
        context.fillRect(17, 78, 10, 4);
        context.fillStyle = '#2c2630';
        context.fillRect(-5, 77, 10, 13);

        context.fillStyle = '#242026';
        context.fillRect(-26 + stepA, 108 + liftA, 24, 8);
        context.fillRect(2 + stepB, 109 + liftB, 25, 7);
        context.fillStyle = '#3b333b';
        context.fillRect(-22 + stepA, 108 + liftA, 12, 3);
        context.fillRect(7 + stepB, 109 + liftB, 12, 3);

        context.fillStyle = '#ce263d';
        context.fillRect(25 - Math.round(stride * 2), walking ? 34 : 39, 25, 11);
        context.fillRect(45, walking ? 31 : 37, 12, 15);
        context.fillRect(-44 + Math.round(stride * 2), walking ? 36 : 43, 24, 10);
        context.fillRect(-54, walking ? 33 : 40, 12, 16);
        context.fillRect(19, 36, 8, 6);
        context.fillRect(-27, 42, 8, 6);
        context.fillStyle = '#f04b56';
        context.fillRect(47, walking ? 34 : 40, 8, 8);
        context.fillRect(-52, walking ? 36 : 43, 8, 8);
        context.fillRect(31, 40, 12, 4);
        context.fillRect(-43, 44, 12, 4);
        context.fillStyle = '#8d1f2d';
        context.fillRect(25, walking ? 44 : 49, 30, 4);
        context.fillRect(-54, walking ? 46 : 53, 33, 4);
        context.fillStyle = '#f1b178';
        context.fillRect(20, 42, 7, 8);
        context.fillRect(-24, 46, 7, 8);
      } else {
        context.translate(4, 0);

        context.fillStyle = '#101216';
        context.fillRect(-13, 3, 27, 25);
        context.fillRect(-23, 29, 46, 51);
        context.fillRect(-30, 37, 15, 33);
        context.fillRect(15, 35, 16, 31);
        context.fillRect(-21, 78, 20, 38);
        context.fillRect(4, 80, 22, 36);
        context.fillRect(20, 27, 34, 22);
        context.fillRect(-49, 42, 32, 18);

        context.fillStyle = '#f1b178';
        context.fillRect(-11, 5, 23, 22);
        context.fillRect(-7, 27, 15, 9);
        context.fillStyle = '#c77b48';
        context.fillRect(-2, 16, 7, 8);
        context.fillRect(-9, 23, 19, 4);

        context.fillStyle = '#151116';
        context.fillRect(-16, -7, 32, 10);
        context.fillRect(-10, -12, 20, 7);
        context.fillRect(-18, -3, 10, 13);
        context.fillRect(10, -2, 12, 9);
        context.fillRect(-7, -16, 16, 5);
        context.fillRect(15, 2, 7, 10);
        context.fillStyle = '#30232a';
        context.fillRect(8, -5, 9, 10);
        context.fillRect(-13, -9, 20, 5);
        context.fillRect(-18, 6, 7, 7);

        context.fillStyle = '#101216';
        context.fillRect(-7, 13, 5, 4);
        context.fillRect(6, 13, 5, 4);
        context.fillRect(-8, 11, 7, 2);
        context.fillRect(5, 11, 7, 2);
        context.fillRect(-4, 25, 11, 3);
        context.fillStyle = '#f6ca9a';
        context.fillRect(-9, 8, 5, 4);

        context.fillStyle = blink ? '#ffffff' : '#24365e';
        context.fillRect(-21, 31, 42, 47);
        context.fillRect(-28, 39, 13, 29);
        context.fillRect(16, 37, 13, 26);
        context.fillStyle = '#344978';
        context.fillRect(-19, 33, 13, 42);
        context.fillRect(10, 34, 9, 39);
        context.fillRect(-28, 41, 6, 20);
        context.fillRect(18, 38, 6, 19);
        context.fillRect(21, 35, 7, 12);
        context.fillRect(-31, 44, 6, 13);
        context.fillStyle = '#121c34';
        context.fillRect(-21, 31, 42, 4);
        context.fillRect(-21, 72, 42, 7);
        context.fillRect(-30, 64, 13, 6);
        context.fillRect(17, 63, 13, 6);
        context.fillRect(-4, 32, 4, 46);
        context.fillRect(3, 32, 4, 46);
        context.fillStyle = '#f2f0df';
        context.fillRect(-12, 35, 24, 40);
        context.fillStyle = '#d8d4bd';
        context.fillRect(-10, 50, 20, 5);
        context.fillRect(-8, 62, 16, 4);
        context.fillStyle = '#f1b178';
        context.fillRect(-11, 34, 7, 16);
        context.fillRect(4, 34, 7, 16);

        context.fillStyle = '#274458';
        context.fillRect(-19 + stepA, 80 + liftA, 17, 34);
        context.fillRect(6 + stepB, 82 + liftB, 17, 32);
        context.fillStyle = '#3f687d';
        context.fillRect(-15 + stepA, 83 + liftA, 7, 25);
        context.fillRect(10 + stepB, 85 + liftB, 8, 23);
        context.fillRect(-18 + stepA, 90 + liftA, 4, 18);
        context.fillRect(19 + stepB, 91 + liftB, 4, 17);
        context.fillStyle = '#162b39';
        context.fillRect(-19, 80, 42, 8);
        context.fillRect(-19 + stepA, 102 + liftA, 17, 5);
        context.fillRect(6 + stepB, 100 + liftB, 17, 5);
        context.fillRect(-3, 86, 6, 28);
        context.fillRect(-16 + stepA, 94 + liftA, 14, 3);
        context.fillRect(8 + stepB, 96 + liftB, 14, 3);
        context.fillStyle = '#d8a65c';
        context.fillRect(-13 + stepA, 94 + liftA, 6, 7);
        context.fillRect(12 + stepB, 91 + liftB, 6, 7);

        context.fillStyle = '#24181a';
        context.fillRect(-23 + stepA, 110 + liftA, 24, 6);
        context.fillRect(4 + stepB, 110 + liftB, 25, 6);
        context.fillStyle = '#f2f0df';
        context.fillRect(-20 + stepA, 107 + liftA, 18, 4);
        context.fillRect(8 + stepB, 107 + liftB, 18, 4);
        context.fillStyle = '#3b2a1e';
        context.fillRect(-18 + stepA, 110 + liftA, 12, 3);
        context.fillRect(10 + stepB, 110 + liftB, 12, 3);

        context.fillStyle = '#101216';
        context.fillRect(22, walking ? 31 : 37, 13, 12);
        context.fillRect(32, walking ? 26 : 32, 13, 12);
        context.fillRect(-39, walking ? 38 : 45, 20, 10);
        context.fillRect(35, walking ? 20 : 24, 17, 13);
        context.fillStyle = '#2f2b2d';
        context.fillRect(39, walking ? 22 : 28, 12, 16);
        context.fillRect(-47, walking ? 36 : 43, 11, 15);
        context.fillRect(25, walking ? 32 : 38, 7, 7);
        context.fillRect(-38, walking ? 39 : 46, 8, 5);
        context.fillStyle = '#000000';
        context.fillRect(38, walking ? 35 : 41, 13, 5);
        context.fillRect(-47, walking ? 48 : 55, 11, 4);
        context.fillStyle = '#ffffff';
        context.fillRect(41, walking ? 24 : 29, 6, 4);
        context.fillRect(-45, walking ? 38 : 45, 5, 4);
        context.fillStyle = '#f1b178';
        context.fillRect(19, 41, 6, 8);
        context.fillRect(-22, 48, 7, 8);
      }

      if (blasting) {
        const blastProgress = clamp((fighter.fireCooldown - 20) / 22, 0, 1);
        const pulse = Math.round(Math.sin(now * 0.04) * 3);
        const glowColor = fighter.energy < 40 ? '#7af0ff' : '#ffe45e';
        const gloveColor = isBlue ? '#ce263d' : '#101216';
        const gloveLight = isBlue ? '#f04b56' : '#ffffff';

        context.fillStyle = '#101216';
        context.fillRect(18, 30, 54, 12);
        context.fillRect(18, 48, 54, 12);
        context.fillStyle = '#f1b178';
        context.fillRect(20, 33, 42, 7);
        context.fillRect(20, 50, 42, 7);
        context.fillStyle = gloveColor;
        context.fillRect(58, 27, 18, 18);
        context.fillRect(58, 45, 18, 18);
        context.fillStyle = gloveLight;
        context.fillRect(63, 31, 7, 6);
        context.fillRect(63, 49, 7, 6);
        context.fillStyle = glowColor;
        context.fillRect(76, 37, 12 + pulse, 12 + pulse);
        context.fillStyle = '#ffffff';
        context.fillRect(80, 41, 5 + Math.round(blastProgress * 4), 5);
      } else if (fighter.attacking > 0) {
        const progress = (16 - fighter.attacking) / 16;
        const windup = progress < 0.35;
        const extension = windup ? progress / 0.35 : 1 - Math.max(0, progress - 0.78) / 0.22;
        const reach = 20 + Math.round(extension * 58);
        const armY = windup ? 42 : 34;
        const gloveColor = isBlue ? '#ce263d' : '#101216';
        const gloveLight = isBlue ? '#f04b56' : '#ffffff';

        context.fillStyle = '#101216';
        context.fillRect(19, armY - 4, reach + 18, isBlue ? 22 : 18);
        context.fillStyle = '#f1b178';
        context.fillRect(21, armY, Math.max(12, reach - 18), isBlue ? 10 : 8);
        context.fillStyle = gloveColor;
        context.fillRect(20 + reach, armY - 4, isBlue ? 22 : 24, isBlue ? 20 : 16);
        context.fillStyle = gloveLight;
        context.fillRect(25 + reach, armY, isBlue ? 9 : 10, isBlue ? 7 : 4);
        context.fillStyle = '#8d1f2d';
        context.fillRect(20 + reach, armY + 13, isBlue ? 22 : 24, 4);

        if (progress > 0.36 && progress < 0.7) {
          context.fillStyle = '#ffffff';
          context.fillRect(48 + reach, armY - 8, 12, 5);
          context.fillRect(54 + reach, armY + 8, 8, 4);
          context.fillStyle = '#ffe45e';
          context.fillRect(61 + reach, armY - 2, 8, 8);
        }
      }

      context.restore();

      context.fillStyle = '#fff8d6';
      context.font = '900 13px monospace';
      context.textAlign = 'center';
      context.fillText(label, fighter.x + fighter.width / 2, fighter.y - 14);
    };

    const drawGround = (top: string, stripe: string, tileA: string, tileB: string) => {
      context.fillStyle = top;
      context.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
      context.fillStyle = stripe;
      context.fillRect(0, GROUND, WIDTH, 7);
      context.fillStyle = tileB;
      context.fillRect(0, GROUND + 7, WIDTH, 6);

      for (let x = 0; x < WIDTH; x += 64) {
        context.fillStyle = x % 128 === 0 ? tileA : tileB;
        context.fillRect(x, GROUND + 8, 64, HEIGHT - GROUND);
      }
    };

    const drawDesertStage = (time: number) => {
      const desertStage = desertStageRef.current;
      if (desertStage?.complete) {
        context.drawImage(desertStage, 0, 52, 1408, 716, 0, 0, WIDTH, HEIGHT);
        context.fillStyle = 'rgba(255, 236, 177, 0.1)';
        for (let i = 0; i < 5; i += 1) {
          const x = (i * 211 + time * 0.008) % (WIDTH + 160) - 120;
          context.fillRect(x, 270 + (i % 3) * 32, 96, 2);
        }
        return;
      }

      const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, '#075bb8');
      sky.addColorStop(0.48, '#2295df');
      sky.addColorStop(1, '#f4c577');
      context.fillStyle = sky;
      context.fillRect(0, 0, WIDTH, HEIGHT);

      context.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (let y = 34; y < 260; y += 14) context.fillRect(0, y, WIDTH, 2);
      context.fillStyle = 'rgba(255, 236, 177, 0.18)';
      for (let i = 0; i < 9; i += 1) {
        const x = (i * 137 + time * 0.012) % (WIDTH + 120) - 80;
        context.fillRect(x, 270 + (i % 4) * 26, 74, 3);
      }

      const rock = (points: Array<[number, number]>, fill: string, shade = '#7b421f') => {
        context.fillStyle = fill;
        context.beginPath();
        points.forEach(([x, y], index) => {
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.closePath();
        context.fill();
        context.strokeStyle = shade;
        context.lineWidth = 3;
        context.stroke();
      };

      const crack = (x: number, y: number, segments: Array<[number, number]>, color = '#6b3a1e') => {
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(x, y);
        segments.forEach(([dx, dy]) => context.lineTo(x + dx, y + dy));
        context.stroke();
      };

      rock([[82, 106], [178, 94], [224, 176], [210, 260], [58, 264], [40, 160]], '#d89a54', '#9c6136');
      rock([[410, 164], [504, 150], [564, 224], [548, 318], [368, 320], [350, 218]], '#d58e43', '#8d512c');
      rock([[640, 86], [760, 76], [830, 160], [820, 326], [612, 330], [592, 154]], '#bc7135', '#6b391e');
      rock([[760, 174], [936, 138], [960, 364], [720, 368], [696, 258]], '#d9914a', '#7c421f');

      context.fillStyle = '#b97339';
      context.fillRect(110, 154, 82, 10);
      context.fillRect(436, 214, 92, 12);
      context.fillRect(658, 130, 92, 14);
      context.fillStyle = '#7b421f';
      context.fillRect(138, 178, 8, 54);
      context.fillRect(702, 156, 10, 126);
      context.fillRect(798, 210, 8, 82);
      crack(650, 164, [[16, 24], [8, 52], [30, 88]], '#5d2f18');
      crack(735, 128, [[-18, 34], [-10, 66], [-36, 108]], '#5d2f18');
      crack(458, 222, [[-20, 28], [-8, 64], [-42, 98]], '#70401f');

      rock([[-30, 0], [20, 0], [42, 118], [28, 230], [58, 338], [30, 462], [-30, 540]], '#5b2d1f', '#2d1713');
      rock([[920, 0], [992, 0], [992, 540], [928, 484], [906, 330], [936, 220], [904, 114]], '#7a3e24', '#351812');
      context.fillStyle = '#9c5b32';
      context.fillRect(0, 84, 34, 16);
      context.fillRect(920, 146, 40, 18);
      context.fillRect(918, 272, 42, 18);

      rock([[328, 322], [430, 278], [602, 286], [696, 330], [642, 392], [386, 388]], '#c9813d', '#7a421f');
      rock([[356, 284], [468, 242], [596, 250], [668, 300], [606, 332], [420, 328]], '#d9944b', '#8a4d24');
      context.fillStyle = '#5e3219';
      context.fillRect(474, 308, 104, 16);
      context.fillStyle = '#e6a856';
      context.fillRect(390, 292, 72, 9);
      context.fillRect(514, 270, 78, 10);

      context.fillStyle = '#9d5a2a';
      context.beginPath();
      context.moveTo(0, 344);
      context.lineTo(106, 328);
      context.lineTo(208, 336);
      context.lineTo(322, 314);
      context.lineTo(420, 348);
      context.lineTo(0, 404);
      context.closePath();
      context.fill();
      context.fillStyle = '#d4914d';
      context.fillRect(0, 326, 184, 62);
      context.fillStyle = '#5a2f1d';
      context.fillRect(0, 382, 212, 36);
      context.fillStyle = '#c57b3d';
      context.fillRect(76, 310, 82, 78);

      context.fillStyle = '#a86632';
      context.beginPath();
      context.moveTo(698, 330);
      context.lineTo(826, 300);
      context.lineTo(960, 306);
      context.lineTo(960, 410);
      context.lineTo(744, 398);
      context.closePath();
      context.fill();
      context.fillStyle = '#4fa4b2';
      context.beginPath();
      context.moveTo(718, 396);
      context.bezierCurveTo(780, 362, 842, 378, 918, 338);
      context.lineTo(940, 358);
      context.bezierCurveTo(852, 414, 792, 404, 720, 434);
      context.closePath();
      context.fill();
      context.fillStyle = 'rgba(214, 251, 255, 0.48)';
      context.fillRect(788, 382, 62, 5);
      context.fillRect(838, 360, 48, 4);

      context.fillStyle = '#c27b38';
      context.fillRect(330, 244, 92, 96);
      context.fillStyle = '#e1a253';
      context.fillRect(338, 250, 76, 12);
      context.fillStyle = '#6d391e';
      context.fillRect(364, 278, 8, 44);
      context.fillRect(392, 294, 8, 28);
      crack(342, 286, [[20, 8], [34, 28], [62, 34]], '#6d391e');
      context.fillStyle = '#5c301b';
      context.fillRect(354, 270, 8, 8);
      context.fillRect(382, 274, 6, 12);
      context.fillRect(404, 288, 8, 8);

      context.fillStyle = '#4a2a1c';
      context.fillRect(248, 304, 8, 88);
      context.fillRect(276, 316, 7, 76);
      context.fillRect(236, 316, 58, 8);
      context.fillStyle = '#d1b18a';
      context.fillRect(286, 324, 30, 48);
      context.fillStyle = '#745236';
      context.fillRect(292, 332, 16, 30);
      context.fillStyle = '#7b512f';
      context.fillRect(82, 354, 38, 38);
      context.strokeStyle = '#3d2418';
      context.lineWidth = 3;
      context.strokeRect(82, 354, 38, 38);
      context.strokeRect(90, 362, 22, 22);

      context.fillStyle = '#2d5c34';
      context.fillRect(742, 352, 8, 42);
      context.fillRect(728, 364, 8, 26);
      context.fillRect(756, 364, 8, 30);
      context.fillRect(718, 386, 56, 8);
      context.fillStyle = '#356c3e';
      for (let i = 0; i < 9; i += 1) {
        context.fillRect(710 + i * 9, 384 - (i % 3) * 12, 5, 24 + (i % 2) * 12);
      }

      const groundGradient = context.createLinearGradient(0, GROUND - 56, 0, HEIGHT);
      groundGradient.addColorStop(0, '#e8aa57');
      groundGradient.addColorStop(0.35, '#d58c42');
      groundGradient.addColorStop(1, '#5f321d');
      context.fillStyle = groundGradient;
      context.beginPath();
      context.moveTo(0, GROUND - 42);
      context.lineTo(88, GROUND - 34);
      context.lineTo(210, GROUND - 30);
      context.lineTo(342, GROUND - 42);
      context.lineTo(468, GROUND - 32);
      context.lineTo(628, GROUND - 42);
      context.lineTo(762, GROUND - 28);
      context.lineTo(960, GROUND - 48);
      context.lineTo(960, HEIGHT);
      context.lineTo(0, HEIGHT);
      context.closePath();
      context.fill();

      context.strokeStyle = '#70401f';
      context.lineWidth = 4;
      crack(122, GROUND - 26, [[54, -12], [112, -8], [164, -22]], '#70401f');
      crack(346, GROUND - 14, [[40, -18], [82, -10], [132, -28]], '#70401f');
      crack(522, GROUND - 46, [[32, 18], [68, 12], [100, 32]], '#70401f');
      crack(718, GROUND - 24, [[44, -14], [86, -2], [124, -22]], '#70401f');

      context.fillStyle = '#f2c06c';
      for (let i = 0; i < 28; i += 1) {
        const x = (i * 43) % WIDTH;
        const y = GROUND - 38 + ((i * 17) % 52);
        context.fillRect(x, y, 22 + (i % 4) * 9, 3);
      }

      context.strokeStyle = '#eee5c8';
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(104, 424);
      context.lineTo(130, 410);
      context.lineTo(158, 424);
      context.stroke();
      context.beginPath();
      context.arc(96, 428, 14, 0.2, Math.PI * 1.4);
      context.stroke();
      context.fillStyle = '#eee5c8';
      context.fillRect(68, 430, 44, 5);
      context.fillRect(82, 418, 5, 18);
      context.fillRect(162, 422, 8, 6);

      context.strokeStyle = '#3d2418';
      context.lineWidth = 4;
      context.beginPath();
      context.arc(52, 470, 12, Math.PI, Math.PI * 2);
      context.stroke();
      context.fillRect(50, 470, 6, 26);
      context.fillRect(36, 488, 36, 5);
      context.fillStyle = '#2d5c34';
      context.fillRect(894, 444, 46, 5);
      context.fillRect(918, 424, 6, 25);
    };

    const drawSpaceStage = (time: number) => {
      const spaceStage = spaceStageRef.current;
      if (spaceStage?.complete) {
        context.drawImage(spaceStage, 0, 58, 1701, 867, 0, 0, WIDTH, HEIGHT);
        context.fillStyle = 'rgba(190, 146, 255, 0.16)';
        for (let i = 0; i < 7; i += 1) {
          const x = (i * 173 - time * 0.018) % (WIDTH + 120);
          context.fillRect(x, 80 + (i % 4) * 58, 3, 3);
        }
        return;
      }

      const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, '#050716');
      sky.addColorStop(1, '#20113d');
      context.fillStyle = sky;
      context.fillRect(0, 0, WIDTH, HEIGHT);

      context.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i += 1) {
        const x = (i * 97) % WIDTH;
        const y = (i * 53) % 330;
        context.fillRect(x, y, i % 4 === 0 ? 4 : 2, i % 4 === 0 ? 4 : 2);
      }

      context.strokeStyle = '#b18cff';
      context.lineWidth = 8;
      context.beginPath();
      context.ellipse(760, 118, 98, 24, -0.22, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = '#5a2bbd';
      context.lineWidth = 4;
      context.beginPath();
      context.ellipse(760, 118, 114, 31, -0.22, 0, Math.PI * 2);
      context.stroke();

      context.fillStyle = '#7b4ce2';
      context.beginPath();
      context.arc(760, 118, 58, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(35, 14, 83, 0.34)';
      context.beginPath();
      context.arc(780, 132, 42, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = '#d2b7ff';
      context.lineWidth = 5;
      context.beginPath();
      context.ellipse(760, 118, 96, 24, -0.22, Math.PI * 0.04, Math.PI * 0.96);
      context.stroke();

      const flyByProgress = (time % 5000) / 5000;
      const flyByKind = Math.floor(time / 5000) % 2;
      const flyX = WIDTH + 120 - flyByProgress * (WIDTH + 260);
      const flyY = flyByKind === 0 ? 96 + Math.sin(flyByProgress * Math.PI) * 42 : 154;
      if (flyByKind === 0) {
        context.fillStyle = '#9b8069';
        context.beginPath();
        context.arc(flyX, flyY, 24, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#5d4b42';
        context.fillRect(flyX - 9, flyY - 8, 9, 7);
        context.fillRect(flyX + 6, flyY + 5, 10, 7);
      } else {
        context.fillStyle = '#dffbff';
        context.fillRect(flyX - 34, flyY - 10, 56, 20);
        context.fillStyle = '#7af0ff';
        context.fillRect(flyX - 18, flyY - 18, 34, 8);
        context.fillStyle = '#ff4f78';
        context.fillRect(flyX + 22, flyY - 5, 18, 10);
        context.fillStyle = '#ffb02e';
        context.fillRect(flyX + 40, flyY - 3, 18, 6);
      }

      context.fillStyle = '#858e9e';
      context.beginPath();
      context.moveTo(0, 354);
      context.bezierCurveTo(170, 318, 338, 388, 492, 346);
      context.bezierCurveTo(660, 302, 790, 372, 960, 338);
      context.lineTo(960, 438);
      context.lineTo(0, 438);
      context.closePath();
      context.fill();

      const moonShade = context.createLinearGradient(0, 324, 0, 438);
      moonShade.addColorStop(0, 'rgba(255,255,255,0.24)');
      moonShade.addColorStop(1, 'rgba(36,42,56,0.55)');
      context.fillStyle = moonShade;
      context.fillRect(0, 320, WIDTH, 118);

      context.fillStyle = '#6f7888';
      for (let x = 42; x < WIDTH; x += 130) {
        context.beginPath();
        context.arc(x, 382 + (x % 3) * 12, 23, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#505968';
        context.fillRect(x - 14, 380 + (x % 3) * 12, 28, 7);
        context.fillStyle = '#6f7888';
      }

      context.fillStyle = 'rgba(255,255,255,0.16)';
      for (let x = 20; x < WIDTH; x += 82) {
        context.fillRect(x, 356 + (x % 5) * 12, 46, 4);
      }

      drawGround('#5b6270', '#dffbff', '#4a515f', '#373f4d');
    };

    const drawOceanStage = (time: number) => {
      const oceanStage = oceanStageRef.current;
      if (oceanStage?.complete) {
        context.drawImage(oceanStage, 0, 58, 1695, 870, 0, 0, WIDTH, HEIGHT);
        context.strokeStyle = 'rgba(160, 246, 255, 0.44)';
        context.lineWidth = 2;
        for (let i = 0; i < 7; i += 1) {
          const x = (i * 151 + time * 0.018) % WIDTH;
          const y = 96 + ((i * 67 - time * 0.026) % 330);
          context.beginPath();
          context.arc(x, y, 5 + (i % 3) * 3, 0, Math.PI * 2);
          context.stroke();
        }
        return;
      }

      const water = context.createLinearGradient(0, 0, 0, HEIGHT);
      water.addColorStop(0, '#8ff8ff');
      water.addColorStop(0.22, '#35b8df');
      water.addColorStop(0.58, '#0b7092');
      water.addColorStop(1, '#032f46');
      context.fillStyle = water;
      context.fillRect(0, 0, WIDTH, HEIGHT);

      context.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let x = 42; x < WIDTH; x += 138) {
        const sway = Math.sin(time * 0.0014 + x) * 22;
        context.beginPath();
        context.moveTo(x + sway, 0);
        context.lineTo(x + 52 + sway, 0);
        context.lineTo(x - 18, 438);
        context.lineTo(x - 98, 438);
        context.closePath();
        context.fill();
      }

      for (let y = 54; y < 340; y += 34) {
        const offset = (time * 0.02 + y * 3) % 90;
        context.fillStyle = y % 68 === 0 ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.1)';
        for (let x = -90; x < WIDTH; x += 90) {
          context.fillRect(x + offset, y, 48, 4);
        }
      }

      context.fillStyle = 'rgba(4, 54, 76, 0.42)';
      context.beginPath();
      context.moveTo(0, 332);
      context.bezierCurveTo(130, 286, 286, 358, 430, 310);
      context.bezierCurveTo(606, 254, 748, 344, 960, 288);
      context.lineTo(960, 438);
      context.lineTo(0, 438);
      context.closePath();
      context.fill();

      context.fillStyle = '#2bbf9b';
      for (let x = 12; x < WIDTH; x += 82) {
        const sway = Math.sin(time * 0.003 + x) * 6;
        context.fillRect(x + sway, 286, 10, 96);
        context.fillRect(x - 13 + sway, 318, 36, 9);
        context.fillRect(x - 8 + sway, 350, 28, 9);
        context.fillStyle = '#1d947f';
        context.fillRect(x + 6 + sway, 302, 7, 76);
        context.fillStyle = '#2bbf9b';
      }

      context.fillStyle = '#174b72';
      context.fillRect(628, 238, 210, 100);
      context.fillStyle = '#0d3b5a';
      context.fillRect(650, 216, 156, 26);
      context.fillRect(660, 328, 170, 20);
      context.fillStyle = '#7af0ff';
      context.fillRect(668, 266, 32, 22);
      context.fillRect(742, 266, 32, 22);
      context.fillStyle = '#dffbff';
      context.fillRect(676, 272, 10, 8);
      context.fillRect(750, 272, 10, 8);
      context.fillStyle = 'rgba(5, 35, 48, 0.34)';
      context.fillRect(628, 314, 210, 34);

      for (let i = 0; i < 22; i += 1) {
        const x = (time * 0.038 + i * 68) % (WIDTH + 90) - 48;
        const y = 82 + (i * 31) % 250 + Math.sin(time * 0.003 + i) * 8;
        context.fillStyle = i % 3 === 0 ? '#ffe45e' : i % 3 === 1 ? '#ff4f78' : '#7af0ff';
        context.fillRect(x, y, 24 + (i % 2) * 8, 10);
        context.fillRect(x - 7, y + 3, 8, 5);
        context.fillRect(x + 9, y - 4, 7, 4);
        context.fillStyle = '#101216';
        context.fillRect(x + 18, y + 2, 3, 3);
      }

      for (let i = 0; i < 4; i += 1) {
        const x = WIDTH + 160 - ((time * 0.055 + i * 290) % (WIDTH + 330));
        const y = 148 + i * 54 + Math.sin(time * 0.002 + i) * 10;
        context.fillStyle = '#31475c';
        context.fillRect(x, y, 70, 18);
        context.fillRect(x + 20, y - 12, 24, 12);
        context.fillRect(x - 18, y + 5, 20, 10);
        context.fillStyle = '#1b2d3f';
        context.fillRect(x + 10, y + 12, 46, 8);
        context.fillStyle = '#dffbff';
        context.fillRect(x + 58, y + 4, 8, 3);
        context.fillStyle = '#243546';
        context.fillRect(x - 18, y + 5, 14, 9);
      }

      for (let i = 0; i < 26; i += 1) {
        const x = (i * 57 + Math.sin(time * 0.001 + i) * 16) % WIDTH;
        const y = 330 - ((time * 0.026 + i * 37) % 260);
        context.fillStyle = i % 3 === 0 ? 'rgba(223,251,255,0.58)' : 'rgba(223,251,255,0.34)';
        context.fillRect(x, y, 4 + (i % 3) * 2, 4 + (i % 3) * 2);
      }

      context.fillStyle = '#d7b56f';
      context.beginPath();
      context.moveTo(0, 374);
      context.bezierCurveTo(140, 344, 268, 392, 430, 360);
      context.bezierCurveTo(616, 324, 778, 388, 960, 352);
      context.lineTo(960, 438);
      context.lineTo(0, 438);
      context.closePath();
      context.fill();

      context.fillStyle = '#ff8da1';
      for (let x = 36; x < WIDTH; x += 116) {
        context.fillRect(x, 404 + (x % 3) * 6, 20, 20);
        context.fillStyle = '#ffb02e';
        context.fillRect(x + 34, 394 + (x % 2) * 10, 12, 34);
        context.fillStyle = '#7af0ff';
        context.fillRect(x + 58, 410, 18, 12);
        context.fillStyle = '#ff8da1';
      }

      context.fillStyle = 'rgba(255,255,255,0.28)';
      for (let x = 0; x < WIDTH; x += 76) {
        context.fillRect(x + 20, 386 + (x % 4) * 9, 42, 4);
      }

      const sand = context.createLinearGradient(0, GROUND, 0, HEIGHT);
      sand.addColorStop(0, '#d7b56f');
      sand.addColorStop(1, '#7d522d');
      context.fillStyle = sand;
      context.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
      context.fillStyle = '#dffbff';
      context.fillRect(0, GROUND, WIDTH, 7);
      context.fillStyle = '#8f5e2e';
      for (let x = 0; x < WIDTH; x += 58) {
        context.fillRect(x, GROUND + 10, 38, 12);
        context.fillStyle = '#b77d3d';
        context.fillRect(x + 18, GROUND + 30, 44, 10);
        context.fillStyle = '#8f5e2e';
      }
    };

    const drawForestStage = (time: number) => {
      const forestStage = forestStageRef.current;
      if (forestStage?.complete) {
        context.drawImage(forestStage, 0, 58, 1690, 873, 0, 0, WIDTH, HEIGHT);
        context.fillStyle = 'rgba(239, 255, 166, 0.42)';
        for (let i = 0; i < 8; i += 1) {
          const x = (i * 113 + Math.sin(time * 0.002 + i) * 18) % WIDTH;
          const y = 92 + ((i * 53 + Math.cos(time * 0.0018 + i) * 16) % 320);
          context.fillRect(x, y, 3, 3);
        }
        return;
      }

      const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, '#c8f09a');
      sky.addColorStop(0.34, '#76bd70');
      sky.addColorStop(0.72, '#2f6b46');
      sky.addColorStop(1, '#122f24');
      context.fillStyle = sky;
      context.fillRect(0, 0, WIDTH, HEIGHT);

      context.fillStyle = 'rgba(255, 244, 171, 0.68)';
      context.beginPath();
      context.arc(178, 82, 42, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = 'rgba(22, 64, 39, 0.46)';
      for (let x = -100; x < WIDTH; x += 92) {
        context.beginPath();
        context.moveTo(x, 334);
        context.lineTo(x + 48, 138 + (x % 4) * 8);
        context.lineTo(x + 118, 334);
        context.closePath();
        context.fill();
      }

      context.fillStyle = 'rgba(255, 232, 142, 0.18)';
      for (let x = 16; x < WIDTH; x += 150) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + 68, 0);
        context.lineTo(x + 8, 356);
        context.lineTo(x - 70, 356);
        context.closePath();
        context.fill();
      }

      context.fillStyle = '#183927';
      for (let x = -18; x < WIDTH; x += 78) {
        const trunkW = 18 + (x % 3) * 4;
        context.fillRect(x + 34, 178, trunkW, 220);
        context.fillStyle = '#2b5b35';
        context.fillRect(x + 38, 190, 4, 174);
        context.fillRect(x + 47, 214, 5, 126);
        context.fillStyle = '#3f7b46';
        context.beginPath();
        context.arc(x + 44, 168, 60, 0, Math.PI * 2);
        context.fill();
        context.fillRect(x - 4, 156, 104, 34);
        context.fillStyle = '#2f6f55';
        context.fillRect(x + 4, 174, 84, 20);
        context.fillStyle = '#183927';
      }

      context.fillStyle = '#21442c';
      for (let x = 26; x < WIDTH; x += 128) {
        const sway = Math.sin(time * 0.002 + x) * 7;
        context.fillRect(x + sway, 116, 6, 136);
        context.fillRect(x + sway - 16, 174, 38, 6);
        context.fillRect(x + sway - 10, 224, 26, 5);
      }

      context.fillStyle = 'rgba(202, 255, 176, 0.26)';
      for (let y = 232; y < 338; y += 28) {
        context.fillRect(0, y, WIDTH, 4);
      }

      context.fillStyle = '#6f4a2a';
      context.fillRect(104, 302, 752, 58);
      context.fillStyle = '#54351f';
      context.fillRect(104, 342, 752, 18);
      context.fillStyle = '#d8a65c';
      for (let x = 132; x < 820; x += 126) {
        context.fillRect(x, 316 + (x % 2) * 8, 56, 10);
        context.fillRect(x + 24, 336, 38, 7);
      }

      context.fillStyle = '#2f6f55';
      for (let x = 0; x < WIDTH; x += 42) {
        context.fillRect(x, 358 + (x % 3) * 6, 30, 16);
        context.fillStyle = '#5aa866';
        context.fillRect(x + 12, 350 + (x % 4) * 5, 14, 14);
        context.fillStyle = '#2f6f55';
      }

      for (let i = 0; i < 5; i += 1) {
        const x = (time * 0.018 + i * 196) % (WIDTH + 120) - 60;
        const y = 330 + (i % 2) * 30;
        context.fillStyle = '#8b5a35';
        context.fillRect(x, y, 38, 17);
        context.fillRect(x + 27, y - 9, 13, 13);
        context.fillStyle = '#f1ca89';
        context.fillRect(x + 34, y - 5, 4, 4);
        context.fillStyle = '#3b2418';
        context.fillRect(x + 3, y + 15, 7, 10);
        context.fillRect(x + 25, y + 15, 7, 10);
        context.fillStyle = '#d8a65c';
        context.fillRect(x + 7, y + 3, 12, 5);
      }

      for (let i = 0; i < 8; i += 1) {
        const x = WIDTH - ((time * 0.045 + i * 150) % (WIDTH + 150));
        const y = 58 + (i * 37) % 148;
        context.fillStyle = '#151116';
        context.fillRect(x, y, 22, 7);
        context.fillRect(x + 18, y - 4, 10, 4);
        context.fillStyle = '#ffe45e';
        context.fillRect(x - 5, y + 2, 8, 3);
      }

      for (let i = 0; i < 16; i += 1) {
        const x = (i * 83 + Math.sin(time * 0.002 + i) * 8) % WIDTH;
        const y = 186 + (i * 41) % 162;
        context.fillStyle = i % 2 === 0 ? '#ffe45e' : '#dffbff';
        context.fillRect(x, y, 4, 4);
      }

      for (let x = 18; x < WIDTH; x += 118) {
        context.fillStyle = '#dbe84d';
        context.fillRect(x, 404 + (x % 3) * 5, 8, 8);
        context.fillStyle = '#f04b56';
        context.fillRect(x + 18, 414, 7, 7);
        context.fillStyle = '#fff8d6';
        context.fillRect(x + 36, 398 + (x % 2) * 8, 6, 6);
      }

      const groundShade = context.createLinearGradient(0, GROUND, 0, HEIGHT);
      groundShade.addColorStop(0, '#49612f');
      groundShade.addColorStop(1, '#1f2d1c');
      context.fillStyle = groundShade;
      context.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
      context.fillStyle = '#b8d95c';
      context.fillRect(0, GROUND, WIDTH, 7);
      context.fillStyle = '#27361f';
      for (let x = 0; x < WIDTH; x += 50) {
        context.fillRect(x, GROUND + 9, 34, 18);
        context.fillStyle = '#314928';
        context.fillRect(x + 14, GROUND + 28, 40, 18);
        context.fillStyle = '#27361f';
      }
    };

    const drawHellStage = (time: number) => {
      const hellStage = hellStageRef.current;
      if (hellStage?.complete) {
        context.drawImage(hellStage, 0, 58, 1671, 883, 0, 0, WIDTH, HEIGHT);
        context.fillStyle = 'rgba(255, 176, 46, 0.42)';
        for (let i = 0; i < 16; i += 1) {
          const x = (i * 73 + Math.sin(time * 0.003 + i) * 20) % WIDTH;
          const y = 84 + ((i * 47 - time * 0.035) % 350);
          context.fillRect(x, y, 3 + (i % 3), 6 + (i % 4));
        }
        return;
      }

      const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, '#14020a');
      sky.addColorStop(0.48, '#5b0d18');
      sky.addColorStop(1, '#d33f1f');
      context.fillStyle = sky;
      context.fillRect(0, 0, WIDTH, HEIGHT);

      context.fillStyle = 'rgba(255, 176, 46, 0.2)';
      for (let i = 0; i < 22; i += 1) {
        const x = (i * 67 + time * 0.025) % WIDTH;
        const y = 48 + (i * 41) % 220;
        context.fillRect(x, y, 4 + (i % 3) * 3, 12);
      }

      context.fillStyle = '#ffb02e';
      for (let x = 0; x < WIDTH; x += 120) {
        const flame = Math.sin(time * 0.009 + x) * 12;
        context.fillRect(x + 30, 276 + flame, 16, 80 - flame);
        context.fillRect(x + 16, 302 + flame * 0.3, 44, 22);
        context.fillStyle = '#ff4f78';
        context.fillRect(x + 35, 304 + flame, 8, 42);
        context.fillStyle = '#ffb02e';
      }

      context.fillStyle = '#19040b';
      context.beginPath();
      context.moveTo(0, 370);
      context.lineTo(120, 232);
      context.lineTo(240, 370);
      context.lineTo(370, 210);
      context.lineTo(520, 370);
      context.lineTo(690, 224);
      context.lineTo(960, 370);
      context.closePath();
      context.fill();

      context.fillStyle = '#3b0710';
      context.beginPath();
      context.moveTo(0, 386);
      context.lineTo(98, 278);
      context.lineTo(190, 386);
      context.lineTo(330, 254);
      context.lineTo(472, 386);
      context.lineTo(636, 270);
      context.lineTo(960, 386);
      context.closePath();
      context.fill();

      context.fillStyle = '#ff4f78';
      context.fillRect(0, 360, WIDTH, 22);
      context.fillStyle = '#ffb02e';
      for (let x = 0; x < WIDTH; x += 52) {
        const flame = Math.sin(time * 0.014 + x * 0.2) * 10;
        context.fillRect(x, 356 + flame, 30, 22 - flame);
        context.fillStyle = '#ffe45e';
        context.fillRect(x + 8, 364 + flame, 12, 12);
        context.fillStyle = '#ffb02e';
      }

      for (let x = -20; x < WIDTH; x += 72) {
        const flame = Math.sin(time * 0.018 + x) * 8;
        context.fillStyle = '#ff4f78';
        context.fillRect(x + 18, GROUND - 34 + flame, 18, 34 - flame);
        context.fillStyle = '#ffb02e';
        context.fillRect(x + 23, GROUND - 24 + flame, 8, 24 - flame);
      }

      drawGround('#321018', '#ffb02e', '#250b12', '#18070d');
    };

    const drawStage = (selectedStage: StageId, time: number) => {
      if (selectedStage === 'space') drawSpaceStage(time);
      else if (selectedStage === 'ocean') drawOceanStage(time);
      else if (selectedStage === 'forest') drawForestStage(time);
      else if (selectedStage === 'hell') drawHellStage(time);
      else drawDesertStage(time);
    };

    const draw = (time: number) => {
      const game = gameRef.current;
      context.clearRect(0, 0, WIDTH, HEIGHT);
      context.imageSmoothingEnabled = false;
      drawStage(stageRef.current, time);

      const drawHealthBar = (x: number, y: number, width: number, health: number, align: 'left' | 'right') => {
        const fillWidth = Math.round((width - 10) * (health / 100));
        context.fillStyle = '#101216';
        context.fillRect(x, y, width, 16);
        context.strokeStyle = '#f2f0df';
        context.lineWidth = 2;
        context.strokeRect(x, y, width, 16);
        context.fillStyle = '#3b3d51';
        context.fillRect(x + 5, y + 5, width - 10, 6);
        context.fillStyle = '#6ee058';
        if (align === 'left') {
          context.fillRect(x + 5, y + 5, fillWidth, 6);
        } else {
          context.fillRect(x + width - 5 - fillWidth, y + 5, fillWidth, 6);
        }
      };

      context.fillStyle = '#ff6b5f';
      context.font = '900 18px monospace';
      context.textAlign = 'left';
      context.fillText('P1', 16, 28);
      drawHealthBar(48, 15, 190, game.p1.health, 'left');
      context.fillStyle = '#5f8fff';
      context.textAlign = 'right';
      context.fillText('P2', WIDTH - 16, 28);
      drawHealthBar(WIDTH - 238, 15, 190, game.p2.health, 'right');

      context.fillStyle = '#d9d9d9';
      context.strokeStyle = '#101216';
      context.lineWidth = 4;
      context.font = '900 22px monospace';
      context.textAlign = 'center';
      const stageTitle = languageRef.current === 'ru' ? STAGE_TITLES_RU[stageRef.current] : STAGE_TITLES[stageRef.current];
      context.strokeText(stageTitle, WIDTH / 2, 30);
      context.fillText(stageTitle, WIDTH / 2, 30);

      context.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let y = 0; y < HEIGHT; y += 6) {
        context.fillRect(0, y, WIDTH, 2);
      }

      game.fireballs.forEach((fireball) => {
        if (fireball.element === 'water') {
          const wobble = Math.sin(fireball.age * 0.38) * 4;
          const glow = context.createRadialGradient(fireball.x, fireball.y, 5, fireball.x, fireball.y, 34);
          glow.addColorStop(0, '#ffffff');
          glow.addColorStop(0.32, '#7af0ff');
          glow.addColorStop(1, 'rgba(47, 125, 225, 0)');
          context.fillStyle = glow;
          context.beginPath();
          context.arc(fireball.x, fireball.y, 34, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#2f7de1';
          context.beginPath();
          context.arc(fireball.x - wobble, fireball.y, 15, 0, Math.PI * 2);
          context.arc(fireball.x + wobble * 0.7, fireball.y - 2, 12, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = '#dffbff';
          context.fillRect(fireball.x - 5, fireball.y - 8, 8, 8);
          context.fillRect(fireball.x + 11, fireball.y + 5, 6, 6);
          context.fillRect(fireball.x - 22, fireball.y + 12, 6, 6);
          return;
        }

        const flicker = Math.sin(fireball.age * 0.48) * 3;
        const direction = fireball.vx >= 0 ? 1 : -1;
        context.save();
        context.translate(fireball.x, fireball.y);
        context.scale(direction, 1);

        const glow = context.createRadialGradient(8, 0, 5, -10, 0, 43);
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        glow.addColorStop(0.22, 'rgba(255, 228, 94, 0.9)');
        glow.addColorStop(0.52, 'rgba(255, 93, 31, 0.55)');
        glow.addColorStop(1, 'rgba(255, 47, 20, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.ellipse(-6, 0, 48 + flicker, 27, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#ff3b1f';
        context.beginPath();
        context.moveTo(-54, -18);
        context.lineTo(-18, -22 - flicker);
        context.lineTo(18, -8);
        context.lineTo(25, 0);
        context.lineTo(18, 8);
        context.lineTo(-18, 22 + flicker);
        context.lineTo(-54, 18);
        context.lineTo(-34, 0);
        context.closePath();
        context.fill();

        context.fillStyle = '#ff9a22';
        context.beginPath();
        context.moveTo(-42, -11);
        context.lineTo(-8, -15);
        context.lineTo(18, -5);
        context.lineTo(26, 0);
        context.lineTo(18, 5);
        context.lineTo(-8, 15);
        context.lineTo(-42, 11);
        context.lineTo(-24, 0);
        context.closePath();
        context.fill();

        context.fillStyle = '#fff2a6';
        context.beginPath();
        context.ellipse(5, 0, 18, 11, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.ellipse(11, -1, 9, 6, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = 'rgba(255, 176, 46, 0.9)';
        context.fillRect(-62, -18, 14, 4);
        context.fillRect(-70, -3, 20, 5);
        context.fillRect(-58, 15, 12, 4);
        context.fillStyle = 'rgba(255, 83, 31, 0.75)';
        context.fillRect(-78, -12, 12, 3);
        context.fillRect(-82, 9, 18, 3);
        context.restore();
      });

      drawFighter(game.p1, CHARACTERS.p1.name.toUpperCase(), 'p1');
      drawFighter(game.p2, CHARACTERS.p2.name.toUpperCase(), 'p2');

      game.bursts.forEach((burst) => {
        context.globalAlpha = burst.life / 22;
        context.strokeStyle = burst.color;
        context.lineWidth = 4;
        context.beginPath();
        context.arc(burst.x, burst.y, 30 - burst.life, 0, Math.PI * 2);
        context.stroke();
        context.globalAlpha = 1;
      });

      if (game.roundOver > 0) {
        context.fillStyle = 'rgba(8, 10, 14, 0.58)';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = '#ffe45e';
        context.font = '900 44px monospace';
        context.textAlign = 'center';
        context.fillText(game.message, WIDTH / 2, HEIGHT / 2);
      }

      if (pausedRef.current) {
        context.fillStyle = 'rgba(8, 10, 14, 0.62)';
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = '#ffe45e';
        context.strokeStyle = '#101216';
        context.lineWidth = 6;
        context.font = '900 54px monospace';
        context.textAlign = 'center';
        const languageCopy = TEXT[languageRef.current];
        context.strokeText(languageCopy.paused, WIDTH / 2, HEIGHT / 2 - 12);
        context.fillText(languageCopy.paused, WIDTH / 2, HEIGHT / 2 - 12);
        context.font = '900 16px monospace';
        context.fillStyle = '#fff8d6';
        context.fillText(languageCopy.continue, WIDTH / 2, HEIGHT / 2 + 28);
        context.fillText(languageCopy.menu, WIDTH / 2, HEIGHT / 2 + 54);
      }
    };

    const loop = (time: number) => {
      if (screenRef.current === 'adventure-level') {
        updateAdventure();
        context.clearRect(0, 0, WIDTH, HEIGHT);
        context.imageSmoothingEnabled = false;
        drawAdventure(time);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      update();
      draw(time);

      if (time - lastHud > 120) {
        const game = gameRef.current;
        setHud({
          p1Health: game.p1.health,
          p2Health: game.p2.health,
          p1Energy: game.p1.energy,
          p2Energy: game.p2.energy,
          p1Wins: game.p1.wins,
          p2Wins: game.p2.wins,
          message: game.message,
        });
        lastHud = time;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onDialogueInput, true);
      window.removeEventListener('mousedown', onDialogueInput, true);
      window.removeEventListener('click', onDialogueInput, true);
      window.removeEventListener('touchstart', onDialogueInput, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [view]);

  const press = (code: string) => {
    keysRef.current.add(code);
  };

  const release = (code: string) => {
    keysRef.current.delete(code);
  };

  const pressTouch = (code: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    press(code);
  };

  const releaseTouch = (code: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    release(code);
  };

  const restart = () => {
    const p1Wins = gameRef.current.p1.wins;
    const p2Wins = gameRef.current.p2.wins;
    gameRef.current = createGame();
    gameRef.current.p1.wins = p1Wins;
    gameRef.current.p2.wins = p2Wins;
    gameRef.current.message = hud.message;
  };

  const fullReset = () => {
    localStorage.removeItem(ADVENTURE_PROGRESS_STORAGE_KEY);
    gameRef.current = createGame();
    adventureRef.current = createAdventureState();
    const stageName = getStageName(stage);
    const modeLabel = playerMode === '1p' ? t.playerVsCpu : t.playerVsPlayer;
    gameRef.current.message = `${modeLabel} - ${stageName}`;
    setAdventureVideoIndex(0);
    pausedRef.current = false;
    keysRef.current.clear();
    setPaused(false);
  };

  const openMenu = () => {
    stopAdventureNarration();
    keysRef.current.clear();
    pausedRef.current = false;
    screenRef.current = 'main-menu';
    setScreen('main-menu');
    setPaused(false);
  };

  const readAdventureProgress = (): AdventureProgress => {
    try {
      const saved = localStorage.getItem(ADVENTURE_PROGRESS_STORAGE_KEY);
      if (!saved) return DEFAULT_ADVENTURE_PROGRESS;
      return { ...DEFAULT_ADVENTURE_PROGRESS, ...JSON.parse(saved) } as AdventureProgress;
    } catch {
      return DEFAULT_ADVENTURE_PROGRESS;
    }
  };

  const saveAdventureProgress = (progress: Partial<AdventureProgress>) => {
    const next = { ...readAdventureProgress(), ...progress };
    localStorage.setItem(ADVENTURE_PROGRESS_STORAGE_KEY, JSON.stringify(next));
    return next;
  };

  const openAdventureSplash = () => {
    stopAdventureNarration();
    saveAdventureProgress({ introComplete: true, phase: 'splash' });
    keysRef.current.clear();
    pausedRef.current = false;
    screenRef.current = 'adventure-splash';
    setScreen('adventure-splash');
    setPaused(false);
  };

  const startAdventureVideo = () => {
    const progress = readAdventureProgress();
    keysRef.current.clear();
    pausedRef.current = false;
    screenRef.current = 'adventure-video';
    setAdventureVideoIndex(progress.introComplete ? 0 : progress.introIndex);
    saveAdventureProgress({ phase: 'intro' });
    setScreen('adventure-video');
    setPaused(false);
  };

  const startAdventureJourneyVideo = () => {
    keysRef.current.clear();
    pausedRef.current = false;
    screenRef.current = 'adventure-start-video';
    saveAdventureProgress({ introComplete: true, phase: 'journey-video' });
    setScreen('adventure-start-video');
    setPaused(false);
  };

  const finishAdventureJourneyVideo = () => {
    saveAdventureProgress({ introComplete: true, journeyVideoComplete: true, phase: 'boss' });
    startAdventureLevel();
  };

  const continueAdventure = () => {
    const progress = readAdventureProgress();
    if (progress.phase === 'boss' || progress.journeyVideoComplete) {
      startAdventureLevel();
      return;
    }
    if (progress.introComplete) {
      openAdventureSplash();
      return;
    }
    startAdventureVideo();
  };

  const signOutToRegistration = () => {
    stopAdventureNarration();
    void supabase.auth.signOut();
    keysRef.current.clear();
    pausedRef.current = false;
    screenRef.current = 'main-menu';
    setScreen('main-menu');
    setPaused(false);
    setView('registration');
  };

  if (view === 'registration') {
    return <Auth language={language} onAuthenticated={enterGame} onContinueGuest={() => enterGame()} />;
  }

  const adventureVideos = [
    {
      src: '/stages/adventure-mode.mp4',
      caption: t.adventureIntro,
    },
    {
      src: '/stages/adventure-dark-figure.mp4',
      caption: t.adventureIntroDark,
    },
    {
      src: '/stages/adventure-chaos.mp4',
      caption: t.adventureIntroChaos,
    },
    {
      src: '/stages/adventure-hero.mp4',
      caption: t.adventureIntroHero,
    },
  ];
  const currentAdventureVideo = adventureVideos[adventureVideoIndex] ?? adventureVideos[0];

  return (
    <main className="game-shell">
      <section className={`arena-wrap ${screen !== 'playing' && screen !== 'adventure-level' ? 'arena-wrap--menu' : ''}`}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          aria-label={paused ? t.arenaPaused : t.arena}
        />
        {screen !== 'playing' && screen !== 'adventure-level' && (
          <div className={`start-menu start-menu--${screen}`} role="dialog" aria-label={t.startMenu}>
            <p className="start-menu__eyebrow">
              {screen === 'main-menu'
                ? t.pixelQuest
                : screen === 'mode-menu'
                ? t.selectMode
                : playerMode === '1p'
                ? t.onePlayerMode
                : t.twoPlayerMode}
            </p>
            <h2>{screen === 'map-menu' ? t.chooseMap : t.gameTitle}</h2>

            {screen === 'main-menu' ? (
              <div className="start-menu__options start-menu__options--play">
                <button type="button" onClick={() => startGame(playerModeRef.current, stageRef.current)}>
                  {t.play}
                </button>
              </div>
            ) : null}
            {screen === 'main-menu' && (
              <button type="button" className="start-menu__adventure" onClick={continueAdventure}>
                {t.adventureMode}
              </button>
            )}
            {screen === 'main-menu' && (
              <button type="button" className="start-menu__bottom-play" onClick={() => startGame(playerModeRef.current, stageRef.current)}>
                {t.play}
              </button>
            )}
            {screen === 'main-menu' && (
              <button type="button" className="start-menu__sign-out" onClick={signOutToRegistration}>
                {t.signOut}
              </button>
            )}
            {screen === 'main-menu' && (
              <span className="menu-sign-out-copy" aria-hidden="true">
                {t.signOut}
              </span>
            )}
            {screen === 'main-menu' && language === 'ru' && (
              <div className="menu-copy-overlay" aria-hidden="true">
                <span className="menu-copy menu-copy--center-play">{t.play}</span>
                <span className="menu-copy menu-copy--center-adventure">{t.adventureMode}</span>
                <span className="menu-copy menu-copy--center-settings">{t.menuSettings}</span>
                <span className="menu-copy menu-copy--world-title">{t.selectWorld}</span>
                <span className="menu-copy menu-copy--settings-title">{t.settings}</span>
                <span className="menu-copy menu-copy--one-player">{t.onePlayer}</span>
                <span className="menu-copy menu-copy--two-players">{t.twoPlayers}</span>
                <span className="menu-copy menu-copy--sound">{t.sound}</span>
                <span className="menu-copy menu-copy--language">{t.language}</span>
                <span className="menu-copy menu-copy--reset">{t.resetProgress}</span>
                <span className="menu-copy menu-copy--back">‹ {t.back}</span>
                <span className="menu-copy menu-copy--bottom-play">{t.play}</span>
              </div>
            )}
            {screen === 'adventure-splash' && (
              <div className="adventure-splash-panel" aria-label={t.adventureMode}>
                <img src="/stages/adventure-splash.png" alt={t.adventureMode} />
                <button
                  type="button"
                  className="adventure-splash-panel__start"
                  onClick={() => {
                    if (readAdventureProgress().journeyVideoComplete) {
                      startAdventureLevel();
                      return;
                    }
                    startAdventureJourneyVideo();
                  }}
                >
                  {t.play}
                </button>
                <button type="button" className="adventure-video-panel__back" onClick={openMenu}>
                  {t.back}
                </button>
              </div>
            )}
            {screen === 'adventure-video' && (
              <div className="adventure-video-panel" aria-label={t.adventureMode}>
                <video
                  key={currentAdventureVideo.src}
                  ref={adventureVideoRef}
                  className="adventure-video-panel__video"
                  src={currentAdventureVideo.src}
                  autoPlay
                  controls
                  playsInline
                  onPlay={() => playAdventureNarrationSegment(adventureVideoIndex)}
                  onEnded={() => {
                    pauseAdventureNarration();
                    if (adventureVideoIndex >= adventureVideos.length - 1) {
                      openAdventureSplash();
                      return;
                    }
                    setAdventureVideoIndex((index) => {
                      const next = index + 1;
                      saveAdventureProgress({ introIndex: next, phase: 'intro' });
                      return next;
                    });
                  }}
                />
                <p className="adventure-video-panel__caption">{currentAdventureVideo.caption}</p>
                <button type="button" className="adventure-video-panel__back" onClick={openMenu}>
                  {t.back}
                </button>
                <button type="button" className="adventure-video-panel__skip" onClick={openAdventureSplash}>
                  {t.skip}
                </button>
              </div>
            )}
            {screen === 'adventure-start-video' && (
              <div className="adventure-video-panel" aria-label={t.adventureJourney}>
                <video
                  ref={adventureVideoRef}
                  className="adventure-video-panel__video"
                  src="/stages/adventure-start-journey.mp4"
                  autoPlay
                  controls
                  playsInline
                  onEnded={finishAdventureJourneyVideo}
                />
                <p className="adventure-video-panel__caption">{t.adventureJourney}</p>
                <button type="button" className="adventure-video-panel__back" onClick={openMenu}>
                  {t.back}
                </button>
                <button type="button" className="adventure-video-panel__skip" onClick={finishAdventureJourneyVideo}>
                  {t.skip}
                </button>
              </div>
            )}
            {screen !== 'adventure-splash' && screen !== 'adventure-video' && screen !== 'adventure-start-video' && (
              <div className="world-carousel" aria-label={t.selectWorld}>
                <button type="button" className="world-carousel__arrow world-carousel__arrow--left" onClick={() => cycleStage(-1)}>
                  {t.previousWorld}
                </button>
                <div className={`world-carousel__preview world-carousel__preview--${stage}`}>
                  <span>{getStageName(stage)}</span>
                </div>
                <button type="button" className="world-carousel__arrow world-carousel__arrow--right" onClick={() => cycleStage(1)}>
                  {t.nextWorld}
                </button>
              </div>
            )}

            {screen !== 'adventure-splash' && screen !== 'adventure-video' && screen !== 'adventure-start-video' && (
              <div className={`settings-panel settings-panel--${playerMode}`} aria-label={t.settings}>
                <button type="button" className="settings-panel__hotspot settings-panel__hotspot--one" onClick={() => chooseMode('1p')}>
                  {playerMode === '1p' ? t.on : t.off}
                </button>
                <button type="button" className="settings-panel__hotspot settings-panel__hotspot--two" onClick={() => chooseMode('2p')}>
                  {playerMode === '2p' ? t.on : t.off}
                </button>
                <label className="settings-panel__sound" aria-label={t.soundVolume}>
                  <span>{t.sound}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={soundLevel}
                    onChange={(event) => changeSoundLevel(Number(event.target.value))}
                  />
                </label>
                <button type="button" className="settings-panel__language" onClick={toggleLanguage}>
                  {language.toUpperCase()}
                </button>
                <button type="button" className="settings-panel__hotspot settings-panel__hotspot--reset" onClick={fullReset}>
                  {t.resetProgress}
                </button>
                <button type="button" className="settings-panel__hotspot settings-panel__hotspot--back" onClick={openMenu}>
                  {t.back}
                </button>
              </div>
            )}

            <p className="start-menu__hint">
              {screen === 'main-menu' ? t.pressStart : t.pressStage}
            </p>
            {screen === 'main-menu' && (
              <div className="character-roster" aria-label={t.characters}>
                <article className="character-roster__card character-roster__card--p1">
                  <span>{t.player1}</span>
                  <strong>{CHARACTERS.p1.name}</strong>
                  <p>{CHARACTERS.p1.move}</p>
                </article>
                <article className="character-roster__card character-roster__card--p2">
                  <span>{t.player2}</span>
                  <strong>{CHARACTERS.p2.name}</strong>
                  <p>{CHARACTERS.p2.move}</p>
                </article>
              </div>
            )}
          </div>
        )}
        {(screen === 'playing' || screen === 'adventure-level') && (
          <button type="button" className="tutorial-sign" onClick={() => setShowTutorial(true)}>
            {t.tutorial}
          </button>
        )}
      </section>

      <section className={`controls-grid controls-grid--${screen}`} aria-label={t.controls}>
        <div className="controls-card">
          <h2>{CHARACTERS.p1.name}</h2>
          <p>{t.p1Controls(CHARACTERS.p1.move)}</p>
          <div className="touch-row">
            {[
              [t.left, 'KeyA'],
              [t.jump, 'KeyW'],
              [t.right, 'KeyD'],
              [t.punch, 'KeyF'],
              [t.fire, 'KeyG'],
              [t.water, 'KeyH'],
            ].map(([label, code]) => (
              <button
                key={code}
                type="button"
                className={`touch-button touch-button--${code}`}
                onPointerDown={pressTouch(code)}
                onPointerUp={releaseTouch(code)}
                onPointerLeave={releaseTouch(code)}
                onPointerCancel={releaseTouch(code)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="restart-button" onClick={restart}>
          {t.newRound}
        </button>

        <div className="controls-card">
          <h2>{playerMode === '1p' ? `${t.cpu} ${CHARACTERS.p2.name}` : CHARACTERS.p2.name}</h2>
          <p>
            {playerMode === '1p'
              ? t.cpuControls(CHARACTERS.p2.name)
              : t.p2Controls(CHARACTERS.p2.move)}
          </p>
          {playerMode === '2p' && (
            <div className="touch-row">
              {[
                [t.left, 'ArrowLeft'],
                [t.jump, 'ArrowUp'],
                [t.right, 'ArrowRight'],
                [t.punch, 'Slash'],
                [t.fire, 'Period'],
                [t.water, 'Comma'],
              ].map(([label, code]) => (
                <button
                  key={code}
                  type="button"
                  className={`touch-button touch-button--${code}`}
                  onPointerDown={pressTouch(code)}
                  onPointerUp={releaseTouch(code)}
                  onPointerLeave={releaseTouch(code)}
                  onPointerCancel={releaseTouch(code)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="rotate-phone" role="status" aria-live="polite">
        <strong>{t.rotateTitle}</strong>
        <span>{t.rotateBody}</span>
      </div>
      {showTutorial && (
        <section className="tutorial-modal" role="dialog" aria-modal="true" aria-label={t.tutorial}>
          <div className="tutorial-card">
            <h2>{t.tutorial}</h2>
            <p>{screen === 'adventure-level' ? t.adventureTutorialIntro : t.tutorialIntro}</p>
            {screen === 'adventure-level' ? (
              <div className="tutorial-grid">
                <div>
                  <h3>{t.controls}</h3>
                  <p>{t.adventureTutorialMove}</p>
                </div>
                <div>
                  <h3>{t.fire}</h3>
                  <p>{t.adventureTutorialAttack}</p>
                </div>
                <div>
                  <h3>Stamina</h3>
                  <p>{t.adventureTutorialStamina}</p>
                </div>
                <div>
                  <h3>{t.pause}</h3>
                  <p>{t.tutorialPause}</p>
                </div>
              </div>
            ) : (
              <div className="tutorial-grid">
                <div>
                  <h3>{t.player1}</h3>
                  <p>{t.tutorialP1}</p>
                </div>
                <div>
                  <h3>{t.player2}</h3>
                  <p>{t.tutorialP2}</p>
                </div>
                <div>
                  <h3>{t.pause}</h3>
                  <p>{t.tutorialPause}</p>
                </div>
                <div>
                  <h3>{t.mobile}</h3>
                  <p>{t.tutorialMobile}</p>
                </div>
              </div>
            )}
            <button type="button" onClick={closeTutorial}>
              {t.gotIt}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
