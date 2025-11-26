import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

type Estado = 'PENDIENTE' | 'ENTREGADA' | 'CALIFICADA';

interface Entrega {
  archivo: string | null;
  comentario: string | null;
  calificacion: number | null;
  retroalimentacion: string | null;
  entregado_en: string | null;
  link_url?: string | null;
}

interface BackendItem {
  id_tarea: number;
  titulo: string;
  instrucciones: string | null;
  fecha_publicacion: string | null;
  fecha_cierre: string | null;
  activa: 0 | 1 | string;
  id_nino: number;
  estado_entrega: 'pendiente' | 'entregado' | 'revisado';

  // NUEVO: id de la entrega (ajusta tu listar.php para enviarlo)
  id_entrega: number | null;

  // NUEVOS CAMPOS que vienen de listar.php
  entrega_fecha: string | null;
  entrega_archivo: string | null;
  entrega_comentario: string | null;
  entrega_calificacion: string | null | number;
  entrega_retroalimentacion: string | null;
  entrega_link: string | null;
  entrega_revisado_en: string | null;
}

interface BackendKpis {
  total_tareas: number;
  pendientes: number;
  entregadas: number;
  revisadas: number;
}

interface BackendResp {
  ok: boolean;
  items?: BackendItem[];
  kpis?: BackendKpis;
  msg?: string;
}

interface TareaVM {
  id: number;
  // NUEVO: id de la entrega asociada (o null si no hay)
  id_entrega: number | null;

  titulo: string;
  descripcion: string;
  fecha_entrega: string | null;
  maestro_id: number | null;
  estado: Estado;
  entrega: Entrega;
}

@Component({
  selector: 'app-tareas-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.scss']
})
export class TareasComponent implements OnInit {
  cargando = false;
  error: string | null = null;

  q = '';
  estado: '' | Estado = '';

  tareas: TareaVM[] = [];
  kpis: BackendKpis | null = null;

  private apiListar   = 'http://localhost/gestion_e/TareasAlumno/listar.php';
  private apiEntregar = 'http://localhost/gestion_e/TareasAlumno/entregar.php';
  private apiAnular   = 'http://localhost/gestion_e/TareasAlumno/anular_entrega.php';
  private apiResolver = 'http://localhost/gestion_e/Estudiantes/resolver_id.php';

  private fileMap = new Map<number, File>();
  private linkMap = new Map<number, string>();
  private comentarioMap = new Map<number, string>();
  subiendoId: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.iniciarCarga();
  }

  cargar(): void {
    this.iniciarCarga();
  }

  // ===== identidad =====
  private async iniciarCarga() {
    this.cargando = true;
    this.error = null;

    let id = this.getAlumnoId();
    if (!id) {
      const correo = this.getCorreo();
      if (correo) id = await this.resolverIdPorCorreo(correo);
    }
    if (!id) {
      this.cargando = false;
      this.error = 'No se detectó tu identidad. Inicia sesión o pasa ?alumno_id= / ?id_nino= o ?correo= en la URL.';
      this.tareas = [];
      this.kpis = null;
      return;
    }
    this.cargarConId(id);
  }

  private cargarConId(idNino: number) {
    const params = new HttpParams()
      .set('id_nino', String(idNino))
      .set('q', this.q)
      .set('offset', '0')
      .set('limit', '25')
      .set('solo_activas', '0');

    this.http.get<BackendResp>(this.apiListar, { params }).subscribe({
      next: (resp) => {
        if (!resp?.ok) {
          this.error = resp?.msg || 'No se pudieron cargar tus tareas.';
          this.tareas = [];
          this.kpis = null;
        } else {
          const items = resp.items ?? [];
          let mapped = items.map(this.mapItemToVM);

          if (this.estado) mapped = mapped.filter(t => t.estado === this.estado);

          this.tareas = mapped;
          this.kpis = resp.kpis ?? null;
          this.error = null;
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('GET listar.php error', err);
        this.error = `Error de conexión con el servidor. Status: ${err?.status ?? '0'}`;
        this.cargando = false;
      }
    });
  }

  private getAlumnoId(): number | null {
    const qs = new URLSearchParams(location.search);
    const qId = qs.get('alumno_id') ?? qs.get('id_nino');
    const lsId = localStorage.getItem('alumno_id') ?? localStorage.getItem('id_nino');
    const id = qId && !isNaN(+qId) ? +qId : (lsId && !isNaN(+lsId) ? +lsId : null);
    if (qId && !isNaN(+qId)) localStorage.setItem('alumno_id', String(id!));
    return id;
  }

  private getCorreo(): string | null {
    const qs = new URLSearchParams(location.search);
    const qMail = qs.get('correo');
    const lsMail = localStorage.getItem('correo') ?? localStorage.getItem('alumno_email');
    const mail = (qMail && qMail.trim()) ? qMail.trim()
               : (lsMail && lsMail.trim()) ? lsMail.trim()
               : null;
    if (qMail && qMail.trim()) localStorage.setItem('correo', qMail.trim());
    return mail;
  }

  private async resolverIdPorCorreo(correo: string): Promise<number | null> {
    try {
      const resp = await this.http.get<{ ok: boolean; id_nino?: number; msg?: string; correo?: string }>(
        this.apiResolver, { params: new HttpParams().set('correo', correo) }
      ).toPromise();
      if (resp?.ok && resp?.id_nino) {
        localStorage.setItem('alumno_id', String(resp.id_nino));
        if (resp.correo) localStorage.setItem('correo', resp.correo);
        return resp.id_nino;
      } else {
        this.error = resp?.msg || 'No se pudo resolver el alumno por correo.';
        return null;
      }
    } catch (e) {
      console.error('resolver_id.php error', e);
      this.error = 'Error al resolver el alumno por correo.';
      return null;
    }
  }

  // ===== mapping =====
  private mapItemToVM = (it: BackendItem): TareaVM => {
    const estado: Estado =
      it.estado_entrega === 'pendiente' ? 'PENDIENTE'
      : it.estado_entrega === 'entregado' ? 'ENTREGADA'
      : 'CALIFICADA';

    const cal =
      it.entrega_calificacion === null || it.entrega_calificacion === undefined
        ? null
        : Number(it.entrega_calificacion);

    return {
      id: it.id_tarea,
      id_entrega: it.id_entrega ?? null,
      titulo: it.titulo,
      descripcion: it.instrucciones ?? '',
      fecha_entrega: it.fecha_cierre ?? null,
      maestro_id: null, // si luego tu backend envía maestro, lo mapeas aquí
      estado,
      entrega: {
        archivo: it.entrega_archivo ?? null,
        comentario: it.entrega_comentario ?? null,
        calificacion: isNaN(cal as number) ? null : cal,
        retroalimentacion: it.entrega_retroalimentacion ?? null,
        entregado_en: it.entrega_fecha ?? null,
        link_url: it.entrega_link ?? null
      }
    };
  };

  badgeClase(est: Estado): string {
    switch (est) {
      case 'CALIFICADA': return 'b-green';
      case 'ENTREGADA':  return 'b-amber';
      default:           return 'b-gray';
    }
  }

  diasRestantes(fecha: string | null): string {
    if (!fecha) return '—';
    const fin = new Date(fecha);
    if (isNaN(fin.getTime())) return '—';
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    fin.setHours(0,0,0,0);
    const diff = Math.ceil((fin.getTime() - hoy.getTime()) / 86400000);
    if (diff > 1)  return `${diff} días`;
    if (diff === 1) return `1 día`;
    if (diff === 0) return `hoy`;
    return `${Math.abs(diff)} días tarde`;
  }

  // ===== estado local (entregar) =====
  archivoDe(id: number)            { return this.fileMap.get(id) || null; }
  linkDe(id: number)               { return this.linkMap.get(id) || ''; }
  comentarioDe(id: number)         { return this.comentarioMap.get(id) || ''; }
  nombreArchivo(id: number)        { return this.fileMap.get(id)?.name || ''; }

  seleccionarArchivo(id: number, ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    if (!file) return;
    const maxMB = 25;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`El archivo supera ${maxMB} MB.`);
      input.value = '';
      return;
    }
    this.fileMap.set(id, file);
  }

  setLink(id: number, v: string)        { this.linkMap.set(id, (v ?? '').trim()); }
  setComentario(id: number, v: string)  { this.comentarioMap.set(id, (v ?? '').trim()); }

  // ===== enviar / editar entrega =====
  entregar(t: TareaVM) {
    const archivo    = this.archivoDe(t.id);
    const link       = this.linkDe(t.id);
    const comentario = this.comentarioDe(t.id);

    // Si ya tenía algo entregado pero el alumno quiere cambiar solo archivo o solo comentario,
    // permitimos que alguno venga vacío siempre y cuando haya algo nuevo o ya existía algo.
    if (!archivo && !link && !comentario && !t.entrega.archivo && !t.entrega.link_url && !t.entrega.comentario) {
      alert('Debes adjuntar un archivo o pegar un enlace o escribir un comentario.');
      return;
    }

    const alumnoId = localStorage.getItem('alumno_id') ?? localStorage.getItem('id_nino');
    const correo   = localStorage.getItem('correo') ?? localStorage.getItem('alumno_email');

    if (!alumnoId && !correo) {
      alert('No se detectó tu identidad. Vuelve a iniciar sesión.');
      return;
    }

    const fd = new FormData();
    fd.append('tarea_id', String(t.id));
    if (alumnoId)  fd.append('alumno_id', String(alumnoId));
    // if (correo)    fd.append('correo', correo); // si quieres también por correo

    // Si ya existe id_entrega, lo mandamos para que entregar.php haga UPDATE
    if (t.id_entrega) {
      fd.append('id_entrega', String(t.id_entrega));
    }

    if (archivo)    fd.append('archivo', archivo);
    if (link)       fd.append('link_url', link);
    if (comentario) fd.append('comentario', comentario);

    this.subiendoId = t.id;

    this.http.post(this.apiEntregar, fd, { responseType: 'text' as const })
      .subscribe({
        next: (txt: string) => {
          console.log('[entregar.php RAW]:', txt);
          try {
            const r = JSON.parse(txt) as { ok: boolean; msg?: string; id_entrega?: number };
            if (!r.ok) {
              alert(r.msg || 'No se pudo enviar la tarea.');
              return;
            }

            // Limpiamos inputs locales
            this.fileMap.delete(t.id);
            this.linkMap.delete(t.id);
            this.comentarioMap.delete(t.id);

            // Opcional: actualizar id_entrega localmente si vino
            if (r.id_entrega) {
              t.id_entrega = r.id_entrega;
            }

            const id = Number(alumnoId ?? 0);
            if (id) this.cargarConId(id);
          } catch {
            console.error('entregar.php devolvió algo que no es JSON:', txt);
            alert('El servidor respondió, pero no en JSON. Revisa echo/notice en PHP.');
          }
        },
        error: (err) => {
          console.error('POST entregar.php error', err);
          const status = err?.status ?? 0;
          if (status === 0)        alert('No se pudo conectar (CORS o servidor caído).');
          else if (status === 413) alert('El archivo es demasiado grande.');
          else if (status >= 500)  alert('Error del servidor. Intenta más tarde.');
          else                     alert(`Error al enviar. Status: ${status}`);
        },
        complete: () => this.subiendoId = null
      });
  }

  // ===== anular entrega =====
  anularEntrega(t: TareaVM) {
    const alumnoId = localStorage.getItem('alumno_id') ?? localStorage.getItem('id_nino');
    if (!alumnoId) {
      alert('No se detectó tu identidad. Vuelve a iniciar sesión.');
      return;
    }

    if (!confirm('¿Seguro que quieres anular esta entrega y volver la tarea a pendiente?')) {
      return;
    }

    const fd = new FormData();
    fd.append('tarea_id', String(t.id));
    fd.append('alumno_id', String(alumnoId));

    if (t.id_entrega) {
      fd.append('id_entrega', String(t.id_entrega));
    }

    this.subiendoId = t.id;

    this.http.post(this.apiAnular, fd, { responseType: 'text' as const })
      .subscribe({
        next: (txt: string) => {
          console.log('[anular_entrega.php RAW]:', txt);
          try {
            const r = JSON.parse(txt) as { ok: boolean; msg?: string };
            if (!r.ok) {
              alert(r.msg || 'No se pudo anular la entrega.');
              return;
            }
            const id = Number(alumnoId ?? 0);
            if (id) this.cargarConId(id);
          } catch {
            console.error('anular_entrega.php devolvió algo que no es JSON:', txt);
            alert('El servidor respondió, pero no en JSON. Revisa echo/notice en PHP.');
          }
        },
        error: (err) => {
          console.error('POST anular_entrega.php error', err);
          alert(`Error al anular entrega. Status: ${err?.status ?? '0'}`);
        },
        complete: () => this.subiendoId = null
      });
  }
}
