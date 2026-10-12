import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavController } from '@ionic/angular';
import { POKEMON_IDS, PokedexService, PokemonInfo } from '../pokedex.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomePage implements OnInit, OnDestroy {
  private pokedex = inject(PokedexService);
  private nav = inject(NavController);

  readonly maximo = POKEMON_IDS.length;
  readonly total = this.pokedex.total;

  detectado = signal<PokemonInfo | null>(null);
  cargando = signal(false);
  mensaje = signal('');
  yaAtrapado = computed(() => {
    const p = this.detectado();
    return !!p && this.pokedex.capturados().some((c) => c.id === p.id);
  });

  private ultimoId = 0;
  private temporizadorOcultar: ReturnType<typeof setTimeout> | undefined;
  private temporizadorMensaje: ReturnType<typeof setTimeout> | undefined;

  // Mensajes que manda ar.html cuando ve o pierde un marcador
  private alRecibirMensaje = async (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    const d = e.data;
    if (!d || !d.tipo) return;

    if (d.tipo === 'encontrado') {
      clearTimeout(this.temporizadorOcultar);
      if (this.ultimoId === d.id && (this.detectado() || this.cargando())) return;
      this.ultimoId = d.id;
      this.detectado.set(null);
      this.cargando.set(true);
      const info = await this.pokedex.obtener(d.id);
      if (this.ultimoId !== d.id) return; // ya se detectó otro
      this.detectado.set(info);
      this.cargando.set(false);
    }

    if (d.tipo === 'perdido' && d.id === this.ultimoId) {
      // Espera un poco por si el marcador solo parpadeó
      this.temporizadorOcultar = setTimeout(() => {
        this.detectado.set(null);
        this.cargando.set(false);
        this.ultimoId = 0;
      }, 3000);
    }
  };

  ngOnInit() {
    window.addEventListener('message', this.alRecibirMensaje);
  }

  atrapar(p: PokemonInfo) {
    if (this.pokedex.atrapar(p)) {
      this.avisar(`¡${p.nombre} atrapado!`);
    }
  }

  irGaleria() {
    this.nav.navigateRoot('/galeria');
  }

  private avisar(texto: string) {
    this.mensaje.set(texto);
    clearTimeout(this.temporizadorMensaje);
    this.temporizadorMensaje = setTimeout(() => this.mensaje.set(''), 2200);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.alRecibirMensaje);
    clearTimeout(this.temporizadorOcultar);
    clearTimeout(this.temporizadorMensaje);
  }
}
