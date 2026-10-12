import { Injectable, computed, signal } from '@angular/core';

// Números de la Pokédex de los 5 Pokémon del proyecto
export const POKEMON_IDS = [25, 4, 1, 7, 133];

export interface PokemonInfo {
  id: number;
  nombre: string;
  tipos: string[];
  altura: number; // metros
  peso: number; // kilogramos
  stats: { nombre: string; valor: number }[];
  descripcion: string;
  imagen: string;
}

const NOMBRES_RESPALDO: Record<number, string> = {
  25: 'Pikachu',
  4: 'Charmander',
  1: 'Bulbasaur',
  7: 'Squirtle',
  133: 'Eevee',
};

const TIPOS_ES: Record<string, string> = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta',
  ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
  psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
  dark: 'Siniestro', steel: 'Acero', fairy: 'Hada',
};

const STATS_ES: Record<string, string> = {
  hp: 'PS', attack: 'Ataque', defense: 'Defensa',
  'special-attack': 'At. especial', 'special-defense': 'Def. especial', speed: 'Velocidad',
};

const CLAVE = 'pokedex-capturados';

@Injectable({ providedIn: 'root' })
export class PokedexService {
  private cache = new Map<number, PokemonInfo>();

  readonly capturados = signal<PokemonInfo[]>(this.leer());
  readonly total = computed(() => this.capturados().length);

  tiene(id: number): boolean {
    return this.capturados().some((p) => p.id === id);
  }

  buscar(id: number): PokemonInfo | undefined {
    return this.capturados().find((p) => p.id === id);
  }

  atrapar(p: PokemonInfo): boolean {
    if (this.tiene(p.id)) return false;
    const lista = [...this.capturados(), p];
    this.capturados.set(lista);
    this.guardar(lista);
    return true;
  }

  liberar(id: number): void {
    const lista = this.capturados().filter((p) => p.id !== id);
    this.capturados.set(lista);
    this.guardar(lista);
  }

  // Pide los datos del Pokémon a PokéAPI (necesita internet)
  async obtener(id: number): Promise<PokemonInfo> {
    const guardado = this.buscar(id) ?? this.cache.get(id);
    if (guardado) return guardado;

    try {
      const [p, e] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((r) => {
          if (!r.ok) throw new Error('pokemon');
          return r.json();
        }),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((r) => {
          if (!r.ok) throw new Error('species');
          return r.json();
        }),
      ]);

      const nombreEs = e.names.find((n: any) => n.language.name === 'es')?.name ?? p.name;
      const textoEs = e.flavor_text_entries.find((t: any) => t.language.name === 'es')?.flavor_text ?? '';

      const info: PokemonInfo = {
        id,
        nombre: nombreEs,
        tipos: p.types.map((t: any) => TIPOS_ES[t.type.name] ?? t.type.name),
        altura: p.height / 10,
        peso: p.weight / 10,
        stats: p.stats.map((s: any) => ({
          nombre: STATS_ES[s.stat.name] ?? s.stat.name,
          valor: s.base_stat,
        })),
        descripcion: textoEs.replace(/[\n\f]/g, ' '),
        imagen: `/assets/pokemon/${id}.png`,
      };
      this.cache.set(id, info);
      return info;
    } catch {
      // Sin internet: se muestra lo mínimo
      return {
        id,
        nombre: NOMBRES_RESPALDO[id] ?? `Pokémon #${id}`,
        tipos: [],
        altura: 0,
        peso: 0,
        stats: [],
        descripcion: 'No se pudieron cargar los datos. Revisa la conexión a internet.',
        imagen: `/assets/pokemon/${id}.png`,
      };
    }
  }

  private leer(): PokemonInfo[] {
    try {
      const texto = localStorage.getItem(CLAVE);
      return texto ? (JSON.parse(texto) as PokemonInfo[]) : [];
    } catch {
      return [];
    }
  }

  private guardar(lista: PokemonInfo[]): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
    } catch {}
  }
}
