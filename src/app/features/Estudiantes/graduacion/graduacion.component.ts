import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  // Necesario para *ngIf y *ngFor
import { DatePipe } from '@angular/common';  // Necesario para la tubería 'date'

@Component({
  selector: 'app-graduacion',
  templateUrl: './graduacion.component.html',
  styleUrls: ['./graduacion.component.scss'],
  imports: [CommonModule]  // Necesario para usar *ngIf y *ngFor
})
export class GraduacionComponent implements OnInit {
  errorMsg: string | null = null;
  successMsg: string | null = null;
  certificados: any[] = [];  // Aquí deberías almacenar los certificados

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {
    // Código de inicialización si lo necesitas, por ejemplo, obtener los certificados de una API
  }

  // Método para ver el certificado (abre el archivo en una nueva pestaña)
  verCertificado(certificado: any) {
    window.open(certificado.archivo, '_blank');
  }

  // Método para descargar el certificado
  descargarCertificado(certificado: any) {
    const link = document.createElement('a');
    link.href = certificado.archivo;
    link.download = certificado.nombre + '.pdf';  // Descargar el archivo como .pdf
    link.click();
  }

  // Método para filtrar los certificados (ajustar según tus necesidades)
  certificadosFiltrados() {
    return this.certificados;
  }
}
