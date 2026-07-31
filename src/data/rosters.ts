/**
 * Squad data seeded from the ESPN national-team squad pages listed in `sourceUrl`.
 * Player names are real; every graphic in this app is drawn from scratch in SVG.
 */

import { assignTones, type SkinTone } from "./appearance";

export type Position = "G" | "D" | "M" | "F";

export type Player = {
  name: string;
  position: Position;
  number?: number;
  /**
   * Skin tone this player is drawn with. Left off, one is dealt below when the
   * rosters load, which keeps every squad — including ones added later — half
   * darker skinned without a tone written out for each entry.
   */
  skin?: SkinTone;
};

export type TeamRoster = {
  country: string;
  code: string;
  flag: string;
  nickname: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Kit colours used by the drawn players, kept separate from brand colours. */
  kit: {
    shirt: string;
    shorts: string;
    socks: string;
    keeper: string;
    keeperShorts: string;
  };
  sourceUrl: string;
  goalkeepers: Player[];
  outfieldPlayers: Player[];
};

export const ROSTERS: Record<string, TeamRoster> = {
  france: {
    country: "France",
    code: "FRA",
    flag: "🇫🇷",
    nickname: "Les Bleus",
    colors: { primary: "#1e40af", secondary: "#ffffff", accent: "#ef4444" },
    kit: {
      shirt: "#1e3fae",
      shorts: "#ffffff",
      socks: "#c8102e",
      keeper: "#22c55e",
      keeperShorts: "#15803d",
    },
    sourceUrl: "https://www.espn.com/soccer/team/squad/_/id/478/france",
    goalkeepers: [
      { name: "Mike Maignan", position: "G", number: 16 },
      { name: "Brice Samba", position: "G", number: 1 },
      { name: "Robin Risser", position: "G", number: 23 },
    ],
    outfieldPlayers: [
      { name: "Kylian Mbappé", position: "F", number: 10 },
      { name: "Ousmane Dembélé", position: "F", number: 7 },
      { name: "Michael Olise", position: "M", number: 11 },
      { name: "Adrien Rabiot", position: "M", number: 14 },
      { name: "Aurélien Tchouaméni", position: "M", number: 8 },
      { name: "Bradley Barcola", position: "F", number: 12 },
      { name: "Désiré Doué", position: "F", number: 20 },
      { name: "Marcus Thuram", position: "F", number: 9 },
      { name: "Rayan Cherki", position: "M", number: 24 },
      { name: "Theo Hernández", position: "D", number: 19 },
      { name: "Jules Koundé", position: "D", number: 5 },
      { name: "Dayot Upamecano", position: "D", number: 4 },
      { name: "William Saliba", position: "D", number: 17 },
      { name: "Ibrahima Konaté", position: "D", number: 15 },
      { name: "Lucas Digne", position: "D", number: 3 },
    ],
  },

  england: {
    country: "England",
    code: "ENG",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    nickname: "Three Lions",
    colors: { primary: "#e2e8f0", secondary: "#0f2f6b", accent: "#dc2626" },
    kit: {
      shirt: "#f8fafc",
      shorts: "#12306e",
      socks: "#f8fafc",
      keeper: "#f59e0b",
      keeperShorts: "#78350f",
    },
    sourceUrl: "https://www.espn.com/soccer/team/squad/_/id/448/england",
    goalkeepers: [
      { name: "Jordan Pickford", position: "G", number: 1 },
      { name: "Dean Henderson", position: "G", number: 13 },
      { name: "James Trafford", position: "G", number: 23 },
    ],
    outfieldPlayers: [
      { name: "Harry Kane", position: "F", number: 9 },
      { name: "Jude Bellingham", position: "M", number: 10 },
      { name: "Bukayo Saka", position: "F", number: 7 },
      { name: "Declan Rice", position: "M", number: 4 },
      { name: "Marcus Rashford", position: "F", number: 11 },
      { name: "Eberechi Eze", position: "M", number: 21 },
      { name: "Anthony Gordon", position: "F", number: 18 },
      { name: "Morgan Rogers", position: "M", number: 17 },
      { name: "Ollie Watkins", position: "F", number: 19 },
      { name: "Noni Madueke", position: "F", number: 20 },
      { name: "Elliot Anderson", position: "M", number: 8 },
      { name: "Marc Guéhi", position: "D", number: 6 },
      { name: "John Stones", position: "D", number: 5 },
      { name: "Ezri Konsa", position: "D", number: 2 },
      { name: "Reece James", position: "D", number: 24 },
    ],
  },

  argentina: {
    country: "Argentina",
    code: "ARG",
    flag: "🇦🇷",
    nickname: "La Albiceleste",
    colors: { primary: "#6fb7e8", secondary: "#ffffff", accent: "#f4c542" },
    kit: {
      shirt: "#79bdf0",
      shorts: "#0f172a",
      socks: "#f8fafc",
      keeper: "#0ea5e9",
      keeperShorts: "#0c4a6e",
    },
    sourceUrl: "https://www.espn.com/soccer/team/squad/_/id/202/argentina",
    goalkeepers: [
      { name: "Emiliano Martínez", position: "G", number: 23 },
      { name: "Gerónimo Rulli", position: "G", number: 12 },
      { name: "Juan Musso", position: "G", number: 1 },
    ],
    outfieldPlayers: [
      { name: "Lionel Messi", position: "F", number: 10 },
      { name: "Julián Álvarez", position: "F", number: 9 },
      { name: "Lautaro Martínez", position: "F", number: 22 },
      { name: "Enzo Fernández", position: "M", number: 24 },
      { name: "Alexis Mac Allister", position: "M", number: 20 },
      { name: "Rodrigo De Paul", position: "M", number: 7 },
      { name: "Leandro Paredes", position: "M", number: 5 },
      { name: "Thiago Almada", position: "M", number: 16 },
      { name: "Giovani Lo Celso", position: "M", number: 11 },
      { name: "Nico González", position: "F", number: 15 },
      { name: "Nico Paz", position: "F", number: 18 },
      { name: "Nicolás Otamendi", position: "D", number: 19 },
      { name: "Cristian Romero", position: "D", number: 13 },
      { name: "Nicolás Tagliafico", position: "D", number: 3 },
      { name: "Gonzalo Montiel", position: "D", number: 4 },
    ],
  },

  spain: {
    country: "Spain",
    code: "ESP",
    flag: "🇪🇸",
    nickname: "La Roja",
    colors: { primary: "#c60b1e", secondary: "#ffc400", accent: "#1e293b" },
    kit: {
      shirt: "#c8102e",
      shorts: "#1e3a8a",
      socks: "#1e3a8a",
      keeper: "#a855f7",
      keeperShorts: "#4c1d95",
    },
    sourceUrl: "https://www.espn.com/soccer/team/squad/_/id/164/spain",
    goalkeepers: [
      { name: "Unai Simón", position: "G", number: 23 },
      { name: "David Raya", position: "G", number: 1 },
      { name: "Joan García", position: "G", number: 13 },
    ],
    outfieldPlayers: [
      { name: "Lamine Yamal", position: "F", number: 19 },
      { name: "Mikel Oyarzabal", position: "F", number: 21 },
      { name: "Dani Olmo", position: "M", number: 10 },
      { name: "Pedri", position: "M", number: 20 },
      { name: "Rodri", position: "M", number: 16 },
      { name: "Nico Williams", position: "F", number: 17 },
      { name: "Ferran Torres", position: "F", number: 7 },
      { name: "Mikel Merino", position: "M", number: 6 },
      { name: "Fabián Ruiz", position: "M", number: 8 },
      { name: "Álex Baena", position: "M", number: 15 },
      { name: "Gavi", position: "M", number: 9 },
      { name: "Marc Cucurella", position: "D", number: 24 },
      { name: "Pau Cubarsí", position: "D", number: 22 },
      { name: "Aymeric Laporte", position: "D", number: 14 },
      { name: "Pedro Porro", position: "D", number: 12 },
    ],
  },

  canada: {
    country: "Canada",
    code: "CAN",
    flag: "🇨🇦",
    nickname: "Les Rouges",
    colors: { primary: "#d81e2c", secondary: "#ffffff", accent: "#111827" },
    kit: {
      shirt: "#d81e2c",
      shorts: "#d81e2c",
      socks: "#ffffff",
      keeper: "#facc15",
      keeperShorts: "#713f12",
    },
    sourceUrl: "https://www.espn.com/soccer/team/squad/_/id/206/canada",
    goalkeepers: [
      { name: "Maxime Crépeau", position: "G", number: 16 },
      { name: "Dayne St. Clair", position: "G", number: 1 },
      { name: "Owen Goodman", position: "G", number: 18 },
    ],
    outfieldPlayers: [
      { name: "Jonathan David", position: "F", number: 10 },
      { name: "Alphonso Davies", position: "D", number: 19 },
      { name: "Cyle Larin", position: "F", number: 9 },
      { name: "Tajon Buchanan", position: "F", number: 17 },
      { name: "Stephen Eustáquio", position: "M", number: 7 },
      { name: "Tani Oluwaseyi", position: "F", number: 12 },
      { name: "Promise David", position: "F", number: 24 },
      { name: "Jacob Shaffelburg", position: "F", number: 14 },
      { name: "Liam Millar", position: "F", number: 11 },
      { name: "Ismaël Koné", position: "M", number: 8 },
      { name: "Nathan Saliba", position: "M", number: 25 },
      { name: "Ali Ahmed", position: "M", number: 20 },
      { name: "Alistair Johnston", position: "D", number: 2 },
      { name: "Derek Cornelius", position: "D", number: 13 },
      { name: "Moïse Bombito", position: "D", number: 15 },
    ],
  },

  brazil: {
    country: "Brazil",
    code: "BRA",
    flag: "🇧🇷",
    nickname: "A Seleção",
    colors: { primary: "#f7d117", secondary: "#009c3b", accent: "#002776" },
    kit: {
      shirt: "#f5cf1b",
      shorts: "#1e3a8a",
      socks: "#ffffff",
      keeper: "#14b8a6",
      keeperShorts: "#0f5f57",
    },
    sourceUrl: "https://www.espn.com/soccer/team/squad/_/id/205/brazil",
    goalkeepers: [
      { name: "Alisson Becker", position: "G", number: 1 },
      { name: "Ederson", position: "G", number: 23 },
      { name: "Weverton", position: "G", number: 12 },
    ],
    outfieldPlayers: [
      { name: "Vinícius Júnior", position: "F", number: 7 },
      { name: "Matheus Cunha", position: "F", number: 9 },
      { name: "Neymar", position: "F", number: 10 },
      { name: "Raphinha", position: "F", number: 11 },
      { name: "Gabriel Martinelli", position: "F", number: 22 },
      { name: "Endrick", position: "F", number: 19 },
      { name: "Casemiro", position: "M", number: 5 },
      { name: "Bruno Guimarães", position: "M", number: 8 },
      { name: "Lucas Paquetá", position: "M", number: 20 },
      { name: "Éderson", position: "M", number: 2 },
      { name: "Danilo Santos", position: "M", number: 18 },
      { name: "Gabriel Magalhães", position: "D", number: 3 },
      { name: "Marquinhos", position: "D", number: 4 },
      { name: "Danilo", position: "D", number: 13 },
      { name: "Douglas Santos", position: "D", number: 16 },
    ],
  },

  unitedStates: {
    country: "United States",
    code: "USA",
    flag: "🇺🇸",
    nickname: "The Stars and Stripes",
    colors: { primary: "#0a3161", secondary: "#ffffff", accent: "#b31942" },
    kit: {
      shirt: "#122a5e",
      shorts: "#ffffff",
      socks: "#b31942",
      keeper: "#84cc16",
      keeperShorts: "#3f6212",
    },
    sourceUrl: "https://www.espn.com/soccer/team/squad/_/id/660/united-states",
    goalkeepers: [
      { name: "Matt Turner", position: "G", number: 1 },
      { name: "Matt Freese", position: "G", number: 24 },
      { name: "Chris Brady", position: "G", number: 25 },
    ],
    outfieldPlayers: [
      { name: "Folarin Balogun", position: "F", number: 20 },
      { name: "Ricardo Pepi", position: "F", number: 9 },
      { name: "Haji Wright", position: "F", number: 19 },
      { name: "Timothy Weah", position: "F", number: 21 },
      { name: "Christian Pulisic", position: "M", number: 10 },
      { name: "Weston McKennie", position: "M", number: 8 },
      { name: "Giovanni Reyna", position: "M", number: 7 },
      { name: "Malik Tillman", position: "M", number: 17 },
      { name: "Brenden Aaronson", position: "M", number: 11 },
      { name: "Tyler Adams", position: "M", number: 4 },
      { name: "Antonee Robinson", position: "D", number: 5 },
      { name: "Sergiño Dest", position: "D", number: 2 },
      { name: "Chris Richards", position: "D", number: 3 },
      { name: "Alex Freeman", position: "D", number: 16 },
      { name: "Tim Ream", position: "D", number: 13 },
    ],
  },

  bosnia: {
    country: "Bosnia-Herzegovina",
    code: "BIH",
    flag: "🇧🇦",
    nickname: "Zmajevi",
    colors: { primary: "#0b3a8f", secondary: "#f4c400", accent: "#ffffff" },
    kit: {
      shirt: "#2563eb",
      shorts: "#f4c400",
      socks: "#2563eb",
      keeper: "#f97316",
      keeperShorts: "#7c2d12",
    },
    sourceUrl: "https://www.espn.com/soccer/team/squad/_/id/452/bosnia-herzegovina",
    goalkeepers: [
      { name: "Nikola Vasilj", position: "G", number: 1 },
      { name: "Martin Zlomislić", position: "G", number: 22 },
      { name: "Mladen Jurkas", position: "G", number: 12 },
    ],
    outfieldPlayers: [
      { name: "Edin Džeko", position: "F", number: 11 },
      { name: "Ermedin Demirović", position: "F", number: 10 },
      { name: "Kerim Alajbegović", position: "F", number: 19 },
      { name: "Esmir Bajraktarević", position: "F", number: 20 },
      { name: "Haris Tabaković", position: "F", number: 23 },
      { name: "Ermin Mahmić", position: "M", number: 26 },
      { name: "Benjamin Tahirović", position: "M", number: 6 },
      { name: "Ivan Bašić", position: "M", number: 13 },
      { name: "Armin Gigović", position: "M", number: 8 },
      { name: "Amar Memić", position: "M", number: 15 },
      { name: "Amar Dedić", position: "D", number: 7 },
      { name: "Sead Kolašinac", position: "D", number: 5 },
      { name: "Nikola Katić", position: "D", number: 18 },
      { name: "Tarik Muharemović", position: "D", number: 4 },
      { name: "Dennis Hadžikadunić", position: "D", number: 3 },
    ],
  },
};

for (const team of Object.values(ROSTERS)) {
  assignTones([...team.goalkeepers, ...team.outfieldPlayers]);
}

export type CountryId = keyof typeof ROSTERS;

export const COUNTRY_IDS = [
  "brazil",
  "france",
  "spain",
  "argentina",
  "england",
  "unitedStates",
  "canada",
  "bosnia",
] as const;

export function getTeam(id: string): TeamRoster {
  const team = ROSTERS[id];
  if (!team) throw new Error(`Unknown country: ${id}`);
  return team;
}

/** Picks a random opponent from the nations the player did not choose. */
export function randomOpponent(exclude: string): string {
  const pool = COUNTRY_IDS.filter((id) => id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Penalty takers, ordered the way a manager would: forwards and creative
 * midfielders first, defenders last. Five for regulation plus backups for
 * sudden death.
 */
export function penaltyOrder(team: TeamRoster): Player[] {
  const rank: Record<Position, number> = { F: 0, M: 1, D: 2, G: 3 };
  return [...team.outfieldPlayers].sort(
    (a, b) => rank[a.position] - rank[b.position],
  );
}
