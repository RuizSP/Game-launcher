// ==========================================
// Tipos Compartilhados do Game Launcher
// ==========================================

export type GameLibrary = 'steam' | 'epic' | 'legendary' | 'gog' | 'local';

export interface IGameGenre {
  id?: number;
  description: string;
}

export interface IGame {
  title: string;
  appid?: number | string;
  description?: string;
  cover?: string;
  library?: GameLibrary;
  timePlayed?: number;
  tags?: IGameGenre[];
  icon?: string;
  exe?: string;
  genres?: number[];
  isInstalled?: boolean;
}

export interface IGameParams {
  title: string;
  appid?: number | string;
  description?: string;
  cover?: string;
  library?: GameLibrary;
  timePlayed?: number;
  tags?: IGameGenre[];
  icon?: string;
  exe?: string;
  genres?: number[];
  isInstalled?: boolean;
}

export interface IGameFinderResult {
  title: string;
  exe: string;
}

export interface ILegendaryStatus {
  loggedIn: boolean;
  data?: ILegendaryStatusData;
  error?: string;
}

export interface ILegendaryStatusData {
  account_id?: string;
  display_name?: string;
  [key: string]: unknown;
}

export interface ILegendaryInstalledGame {
  app_name: string;
  app_title: string;
  base_urls: string[];
  can_run_offline: boolean;
  executable: string;
  install_path: string;
  install_size: number;
  is_dlc: boolean;
  title: string;
  version: string;
  [key: string]: unknown;
}

export interface IIGDBGame {
  id: number;
  name: string;
  cover?: number;
  summary?: string;
  storyline?: string;
  genres?: number[];
  [key: string]: unknown;
}

export interface IIGDBCover {
  id: number;
  url: string;
}

export interface IEpicAuthData {
  sid?: string;
  authorizationCode?: string;
}

export interface ISteamGameDetails {
  name: string;
  short_description?: string;
  header_image?: string;
  genres?: IGameGenre[];
  [key: string]: unknown;
}

export interface ISteamOwnedGame {
  appid: number;
  name?: string;
  playtime_forever: number;
  img_icon_url?: string;
  [key: string]: unknown;
}

export interface IElectronAPI {
  openForm: () => void;
  saveGamesJson: (games: IGame[]) => Promise<string>;
  playGame: (executablePath: string) => Promise<string>;
  runSteamApp: (steamId: number | string) => void;
  syncLibraries: (library: string) => Promise<void>;
  openFileDialog: (name: string, extension: string[]) => Promise<string | null>;
  navigate: (page: string, game: IGame | null) => void;
  loadGameData: () => Promise<IGame>;
  quitApp: () => Promise<void>;
  fetchGameData: () => Promise<IGame[]>;
  checkLegendaryStatus: () => Promise<ILegendaryStatus>;
  loginEpicGames: () => Promise<string>;
  runLegendaryApp: (appName: string) => Promise<string>;
  installLegendaryApp: (appName: string) => Promise<string>;
  checkLegendaryInstalled: (appName: string) => Promise<boolean>;
}

declare global {
  type GameLibrary = 'steam' | 'epic' | 'legendary' | 'gog' | 'local';
  interface IGameGenre {
    id?: number;
    description: string;
  }
  interface IGame {
    title: string;
    appid?: number | string;
    description?: string;
    cover?: string;
    library?: GameLibrary;
    timePlayed?: number;
    tags?: IGameGenre[];
    icon?: string;
    exe?: string;
    genres?: number[];
    isInstalled?: boolean;
  }
  interface ILegendaryStatus {
    loggedIn: boolean;
    data?: ILegendaryStatusData;
    error?: string;
  }
  interface ILegendaryStatusData {
    account_id?: string;
    display_name?: string;
    [key: string]: unknown;
  }
  interface IElectronAPI {
    openForm: () => void;
    saveGamesJson: (games: IGame[]) => Promise<string>;
    playGame: (executablePath: string) => Promise<string>;
    runSteamApp: (steamId: number | string) => void;
    syncLibraries: (library: string) => Promise<void>;
    openFileDialog: (name: string, extension: string[]) => Promise<string | null>;
    navigate: (page: string, game: IGame | null) => void;
    loadGameData: () => Promise<IGame>;
    quitApp: () => Promise<void>;
    fetchGameData: () => Promise<IGame[]>;
    checkLegendaryStatus: () => Promise<ILegendaryStatus>;
    loginEpicGames: () => Promise<string>;
    runLegendaryApp: (appName: string) => Promise<string>;
    installLegendaryApp: (appName: string) => Promise<string>;
    checkLegendaryInstalled: (appName: string) => Promise<boolean>;
  }
  interface Window {
    electron: IElectronAPI;
  }
}
