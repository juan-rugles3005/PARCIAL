import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { NavController } from '@ionic/angular';
import { POKEMON_IDS, PokedexService, PokemonInfo } from '../pokedex.service';

@Component({
  selector: 'app-galeria',
  templateUrl: 'galeria.page.html',
  styleUrls: ['galeria.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [],
})
export class GaleriaPage {
  private pokedex = inject(PokedexService);
  private nav = inject(NavController);

  readonly ids = POKEMON_IDS;
  readonly maximo = POKEMON_IDS.length;
  readonly total = this.pokedex.total;
  abierto = signal(0);

  buscar(id: number): PokemonInfo | undefined {
    return this.pokedex.capturados().find((p) => p.id === id);
  }

  alternar(id: number) {
    this.abierto.set(this.abierto() === id ? 0 : id);
  }

  liberar(id: number, evento: Event) {
    evento.stopPropagation();
    this.pokedex.liberar(id);
    this.abierto.set(0);
  }

  volver() {
    this.nav.navigateRoot('/home');
  }
}
