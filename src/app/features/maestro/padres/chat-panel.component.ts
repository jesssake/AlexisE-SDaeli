import {
  Component, Input, Output, EventEmitter, OnDestroy, OnInit, OnChanges,
  SimpleChanges, ViewChild, ElementRef, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams, HttpHeaders } from '@angular/common/http';
import { Subscription, timer, switchMap, of, catchError, map, concatMap } from 'rxjs';

export interface ChatMensaje {
  id: number;
  alumno_id: number;
  tutor_id: number | null;
  emisor: 'MAESTRO' | 'ALUMNO' | 'TUTOR' | 'SISTEMA';
  texto: string;
  creado_en: string;
}

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat-panel.component.html',
  styleUrls: ['./chat-panel.component.scss'],
})
export class ChatPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) alumnoId!: number;
  @Input() tutorId: number | null = null;
  @Input() titulo = 'Chat';
  @Input() floating = true;
  /** 🔹 NUEVO: rol que envía los mensajes (MAESTRO/ALUMNO/TUTOR) */
  @Input() role: 'MAESTRO' | 'ALUMNO' | 'TUTOR' = 'MAESTRO';

  @Output() closed = new EventEmitter<void>();

  cargando = true;
  enviando = false;
  errorMsg: string | null = null;
  minimized = signal<boolean>(false);
  compact = signal<boolean>(false);

  mensajes = signal<ChatMensaje[]>([]);
  nuevo = signal<string>('');

  editingId = signal<number | null>(null);
  editBuffer = '';

  private http = inject(HttpClient);
  private base = '/api/chat';
  private sub?: Subscription;

  chatId = signal<number | null>(null);
  legacyMode = signal<'none' | 'maestro+tutor' | 'maestro+alumno'>('none');

  private get maestroId(): number {
    const x = Number(localStorage.getItem('maestro_id'));
    return Number.isFinite(x) && x > 0 ? x : 1;
  }

  // Ventana flotante: posición/tamaño
  posX = signal<number>(window.innerWidth - 420 - 24);
  posY = signal<number>(96);
  width = signal<number>(380);
  height = signal<number>(520);
  private dragging = false; private dragOffX = 0; private dragOffY = 0;

  @ViewChild('scroller') scroller!: ElementRef<HTMLDivElement>;

  /* =========================
     CICLO DE VIDA
  ========================== */
  ngOnInit(): void { this.reopen(); }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia alumno o tutor, volvemos a abrir el chat con los nuevos IDs
    if (changes['alumnoId'] || changes['tutorId']) {
      this.reopen();
    }
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  /** Resetea estado y vuelve a resolver el chat con los @Input actuales */
  private reopen() {
    this.sub?.unsubscribe();
    this.cargando = true;
    this.errorMsg = null;
    this.enviando = false;
    this.mensajes.set([]);
    this.editingId.set(null);
    this.editBuffer = '';
    this.chatId.set(null);
    this.legacyMode.set('none');

    this.resolveChat().subscribe({
      next: cid => {
        this.cargando = false;
        if (cid) this.chatId.set(cid);
        else if (this.tutorId != null) this.legacyMode.set('maestro+tutor');
        else if (this.alumnoId > 0)    this.legacyMode.set('maestro+alumno');
        else this.errorMsg = 'No se pudo iniciar el chat.';
        this.startPolling();
      },
      error: _ => { this.cargando = false; this.errorMsg = 'No se pudo iniciar el chat.'; }
    });
  }

  /* =========================
     HTTP helpers
  ========================== */
  private getText(url: string, params?: HttpParams) {
    return this.http.get(url, { params, responseType: 'text' });
  }
  private postFormText(url: string, data: Record<string, any>) {
    const body = new URLSearchParams();
    Object.entries(data).forEach(([k,v]) => v!=null && body.set(k,String(v)));
    const headers = new HttpHeaders({'Content-Type':'application/x-www-form-urlencoded'});
    return this.http.post(url, body.toString(), { headers, responseType: 'text' });
  }
  private postJsonText(url: string, data: Record<string, any>) {
    const headers = new HttpHeaders({'Content-Type':'application/json'});
    return this.http.post(url, data, { headers, responseType: 'text' });
  }
  private safeParse<T=any>(txt: string | null | undefined): T | null {
    const s = (txt ?? '').toString().trim();
    if (!s) return null;
    if (s==='null') return null;
    if (s==='[]') return [] as any;
    const n = Number(s); if (!Number.isNaN(n) && s===String(n)) return n as any;
    try { return JSON.parse(s) as T; } catch { return null; }
  }
  private pickChatId(res: any): number | null {
    if (res==null) return null;
    if (typeof res==='number') return res||null;
    const v = res.chat_id ?? res.id ?? (Array.isArray(res)&&res[0]?.chat_id);
    return v!=null ? Number(v) : null;
  }

  /* =========================
     Resolver chat
  ========================== */
  private resolveChat() {
    const hasAlumno = this.alumnoId > 0;
    const hasTutor  = this.tutorId != null;

    let p = new HttpParams().set('maestro_id', String(this.maestroId));
    if (hasAlumno) p = p.set('alumno_id', String(this.alumnoId)).set('nino_id', String(this.alumnoId));
    if (hasTutor)  p = p.set('tutor_id', String(this.tutorId));

    return this.getText(`${this.base}/participants.php`, p).pipe(
      map(t => this.pickChatId(this.safeParse(t))),
      concatMap(cid => {
        if (cid) return of(cid);
        const data: Record<string, any> = {
          maestro_id: this.maestroId,
          alumno_id: hasAlumno ? this.alumnoId : undefined,
          nino_id:   hasAlumno ? this.alumnoId : undefined,
          tutor_id:  hasTutor  ? this.tutorId  : undefined,
        };
        return this.postFormText(`${this.base}/participants.php`, data).pipe(
          map(t => this.pickChatId(this.safeParse(t))),
          catchError(() => of(null))
        );
      }),
      concatMap(cid => {
        if (cid) return of(cid);
        let lp = new HttpParams().set('maestro_id', String(this.maestroId));
        if (hasAlumno) lp = lp.set('alumno_id', String(this.alumnoId)).set('nino_id', String(this.alumnoId));
        if (hasTutor)  lp = lp.set('tutor_id', String(this.tutorId));
        return this.getText(`${this.base}/list.php`, lp).pipe(
          map(t => this.pickChatId(this.safeParse(t))),
          catchError(() => of(null))
        );
      }),
      concatMap(cid => {
        if (cid) return of(cid);
        if (!hasAlumno && !hasTutor) return of(null);
        const payload: Record<string, any> = {
          maestro_id: this.maestroId,
          alumno_id: hasAlumno ? this.alumnoId : undefined,
          nino_id:   hasAlumno ? this.alumnoId : undefined,
          tutor_id:  hasTutor  ? this.tutorId  : undefined,
          tipo:'direct', direct:1
        };
        return this.postFormText(`${this.base}/create_direct.php`, payload).pipe(
          map(t => this.pickChatId(this.safeParse(t))),
          catchError(() => this.postJsonText(`${this.base}/create_direct.php`, payload).pipe(
            map(t => this.pickChatId(this.safeParse(t))),
            catchError(() => of(null))
          ))
        );
      })
    );
  }

  /* =========================
     Polling
  ========================== */
  private startPolling() {
    this.sub?.unsubscribe();
    this.sub = timer(0, 4000).pipe(
      switchMap(() => {
        const cid = this.chatId(); const legacy = this.legacyMode();
        if (cid) {
          const p = new HttpParams().set('chat_id', String(cid));
          return this.getText(`${this.base}/messages.php`, p).pipe(map(t => this.safeParse<any[]>(t) ?? []));
        }
        if (legacy==='maestro+tutor' && this.tutorId!=null) {
          const p = new HttpParams().set('maestro_id', String(this.maestroId)).set('tutor_id', String(this.tutorId));
          return this.getText(`${this.base}/messages.php`, p).pipe(map(t => this.safeParse<any[]>(t) ?? []));
        }
        if (legacy==='maestro+alumno' && this.alumnoId>0) {
          const p = new HttpParams()
            .set('maestro_id', String(this.maestroId))
            .set('alumno_id', String(this.alumnoId))
            .set('nino_id',   String(this.alumnoId));
          return this.getText(`${this.base}/messages.php`, p).pipe(map(t => this.safeParse<any[]>(t) ?? []));
        }
        return of<any[]>([]);
      }),
      catchError(_ => of<any[]>([]))
    ).subscribe(rows => {
      const normalizados: ChatMensaje[] = (rows ?? []).map((m: any) => ({
        id: Number(m.id ?? m.msg_id ?? m.message_id ?? 0),
        alumno_id: Number(m.alumno_id ?? m.nino_id ?? this.alumnoId ?? 0),
        tutor_id: m.tutor_id != null ? Number(m.tutor_id) : this.tutorId,
        emisor: (m.emisor ?? m.from ?? 'SISTEMA') as any,
        texto: String(m.texto ?? m.message ?? m.mensaje ?? ''),
        creado_en: String(m.creado_en ?? m.created_at ?? new Date().toISOString()),
      }));
      this.mensajes.set(normalizados.sort((a,b)=>a.id-b.id));
      queueMicrotask(()=>this.scrollBottom());
    });
  }

  /* =========================
     Enviar / Editar / Borrar
  ========================== */
  enviar() {
    const txt = this.nuevo().trim();
    if (!txt) return;
    this.enviando = true;

    const cid = this.chatId();
    const legacy = this.legacyMode();

    // 🔹 ahora usa el rol actual para emisor/from
    const common: Record<string, any> = {
      maestro_id: this.maestroId,
      texto: txt, mensaje: txt,
      emisor: this.role, from: this.role
    };

    let body: Record<string, any> = {};
    if (cid) body = { ...common, chat_id: cid, alumno_id: this.alumnoId||undefined, nino_id: this.alumnoId||undefined, tutor_id: this.tutorId??undefined };
    else if (legacy==='maestro+tutor' && this.tutorId!=null) body = { ...common, tutor_id: this.tutorId };
    else if (legacy==='maestro+alumno' && this.alumnoId>0) body = { ...common, alumno_id: this.alumnoId, nino_id: this.alumnoId };
    else { this.enviando=false; return; }

    this.postFormText(`${this.base}/send.php`, body).pipe(
      map(()=>true),
      catchError(()=>this.postJsonText(`${this.base}/send.php`, body).pipe(map(()=>true), catchError(()=>of(false))))
    ).subscribe(ok=>{
      if(ok){ this.nuevo.set(''); this.startPolling(); }
      this.enviando=false;
    });
  }

  beginEdit(m: ChatMensaje){ this.editingId.set(m.id); this.editBuffer = m.texto; }
  cancelEdit(){ this.editingId.set(null); this.editBuffer=''; }

  saveEdit(m: ChatMensaje){
    const texto = this.editBuffer.trim();
    if(!texto) return;
    const cid = this.chatId(); if(!cid){ this.cancelEdit(); return; }
    const body = { chat_id: cid, mensaje_id: m.id, texto, emisor: this.role };
    this.postFormText(`${this.base}/edit.php`, body).pipe(
      catchError(()=>this.postJsonText(`${this.base}/edit.php`, body))
    ).subscribe(_=>{
      this.cancelEdit();
      const arr = this.mensajes().map(x => x.id===m.id ? {...x, texto} : x);
      this.mensajes.set(arr);
    });
  }

  deleteForAll(m: ChatMensaje){
    if(!confirm('¿Eliminar mensaje para todos?')) return;
    const cid = this.chatId(); if(!cid) return;
    const body = { chat_id: cid, mensaje_id: m.id, emisor: this.role };
    this.postFormText(`${this.base}/delete_for_all.php`, body).pipe(
      catchError(()=>this.postJsonText(`${this.base}/delete_for_all.php`, body))
    ).subscribe(_=>{
      this.mensajes.set(this.mensajes().filter(x=>x.id!==m.id));
    });
  }

  /* =========================
     Ventana
  ========================== */
  dragStart(ev: MouseEvent|TouchEvent){
    if(!this.floating) return;
    this.dragging = true;
    const p = ('touches' in ev) ? ev.touches[0] : ev as MouseEvent;
    this.dragOffX = p.clientX - this.posX();
    this.dragOffY = p.clientY - this.posY();
    window.addEventListener('mousemove', this.dragMove);
    window.addEventListener('touchmove', this.dragMove, {passive:false});
    window.addEventListener('mouseup', this.dragEnd);
    window.addEventListener('touchend', this.dragEnd);
  }
  dragMove = (ev: MouseEvent|TouchEvent) => {
    if(!this.dragging) return;
    const p = ('touches' in ev) ? ev.touches[0] : ev as MouseEvent;
    if('touches' in ev) ev.preventDefault();
    const nx = Math.min(Math.max(8, p.clientX - this.dragOffX), window.innerWidth - this.width() - 8);
    const ny = Math.min(Math.max(56, p.clientY - this.dragOffY), window.innerHeight - 80);
    this.posX.set(nx); this.posY.set(ny);
  };
  dragEnd = () => {
    this.dragging = false;
    window.removeEventListener('mousemove', this.dragMove);
    window.removeEventListener('touchmove', this.dragMove);
    window.removeEventListener('mouseup', this.dragEnd);
    window.removeEventListener('touchend', this.dragEnd);
  };

  toggleMin(){ this.minimized.set(!this.minimized()); }
  toggleCompact(){
    this.compact.set(!this.compact());
    this.width.set(this.compact() ? 340 : 380);
    this.height.set(this.compact() ? 460 : 520);
  }
  closeWindow(){ this.closed.emit(); }

  // Utils
  scrollBottom(){ if(!this.scroller) return; const el=this.scroller.nativeElement; el.scrollTop=el.scrollHeight; }
  fmtFecha = (iso: string) => new Date(iso).toLocaleString();
  trackMsg = (_:number, m:ChatMensaje)=>m.id;
}
