import { Component, Input, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiService } from '../../../core/services/api.service';
import { dateValidator } from '../../../shared/validators/date.validator';
import { textValidator } from '../../../shared/validators/text.validator';

// FLOWBITE MODAL
import { ModalOptions, InstanceOptions, Modal } from 'flowbite';
@Component({
  selector: 'app-edit-appointment',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './edit-appointment.component.html',
  styleUrl: './edit-appointment.component.css'
})
export class EditAppointmentComponent implements OnInit {

  @Input() modalId?: string;
  
  apiService = inject(ApiService);

  dayAppointments: any[] = [];
  
  doctors: any = [];
  filteredDoctor: any [] = [];
  
  ngOnInit(): void {
    this.getDoctors();
  }

  createAppointmentForm = new FormGroup({
    searchAppointment: new FormGroup({
      date : new FormControl('', [Validators.required, dateValidator]),
      selectAppointment: new FormControl('', Validators.required),
    }),
    patientName: new FormControl('', Validators.required),
    searchDataDoctorForm: new FormGroup({
      dataToSearch: new FormControl(''),
      dataSelect : new FormControl('', Validators.required)

    }),
    appointmentComment: new FormControl('', [Validators.required, textValidator])
  });

  getAppointments(date: string): void {

    const data = {
      date: date,
      token: localStorage.getItem('token')
    }

    this.apiService.getDayAppointments(data).subscribe((data: any) => {

      this.createAppointmentForm.patchValue({
        searchAppointment: {
          selectAppointment: '',
        },
        searchDataDoctorForm: {
          dataToSearch: '',
          dataSelect: '',
        },
        patientName: '',
        appointmentComment: '',
      });
      
      if (data.data.length == 1) {

        this.createAppointmentForm.patchValue({
          searchAppointment: {
            selectAppointment: data.data[0].id
          },
          patientName: `${data.data[0].patientFirstname} ${data.data[0].patientLastname}`,
          searchDataDoctorForm: {
            dataToSearch: `${data.data[0].doctorFirstname} ${data.data[0].doctorLastname}`,
            dataSelect: data.data[0].dniDoctor
        },
        appointmentComment: data.data[0].comment,
        })

        this.dayAppointments = data.data;
      } else {
        this.dayAppointments = data.data;
      }

      // console.log(this.dayAppointments);

    }, (error) => {
      Swal.fire({
        icon: 'error',
        toast: true,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        position: 'bottom',
        text: error.error.message
      });
    });
  }

  loadData(id: string): void {

    const dataAppointment = this.dayAppointments;
    const patientInfo = dataAppointment.findIndex((appointment) => appointment.id == id);

    this.createAppointmentForm.patchValue({
      patientName: `${dataAppointment[patientInfo].patientFirstname} ${dataAppointment[patientInfo].patientLastname}`,
      searchDataDoctorForm: {
        dataToSearch: `${dataAppointment[patientInfo].doctorFirstname} ${dataAppointment[patientInfo].doctorLastname}`,
        dataSelect: dataAppointment[patientInfo].dniDoctor
      },
      appointmentComment: dataAppointment[patientInfo].comment,
    });
  }

  getDoctors(): void{

    const token = localStorage.getItem('token')!;

    this.apiService.getDoctors(token).subscribe((data: any) => {

      if (data.success){
        this.doctors = data.data
        this.filteredDoctor = this.doctors.slice();
      } else {
        console.log(data);
      }

    });
  }

  updateAppointment(): void {

    const data = {
      token: localStorage.getItem('token'),
      appointmentData: {
        id: this.createAppointmentForm.value.searchAppointment?.selectAppointment,
        dniDoctor: this.createAppointmentForm.value.searchDataDoctorForm?.dataSelect,
        comment: this.createAppointmentForm.value.appointmentComment
      }
    }

    // console.log(dataAppointment);

    Swal.fire({
      title: 'Do you want to save changes?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.updateAppointments(data).subscribe(
          (data: any) => {
            // console.log(data);

             if (data.message) {
                Swal.fire({
                  title: 'Appointment edited!',
                  icon: 'success',
                  toast: true,
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                  position: 'bottom'
                });
      
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
            
             } else {
               Swal.fire({
                 title: 'Error',
                 text: 'Error updating appointment. Please try again.',
                 icon: 'error',
               });
             }
           },
           (error) => {
             console.error('Error updating appointment:', error);

             Swal.fire({
               title: 'Error',
               text: 'Error updating appointment. Please try again.',
               icon: 'error',
             });
           }
         );
       }
     });
  }

  filterDoctors(dataToSearch: string): void {
    if (!dataToSearch) {
      this.filteredDoctor = this.doctors.slice();
    } else {
      const searchName = this.doctors.filter((dataDoctorToFilter: any) =>
        dataDoctorToFilter.firstname.toLowerCase().includes(dataToSearch.toLowerCase()) ||
        dataDoctorToFilter.lastname.toLowerCase().includes(dataToSearch.toLowerCase()) ||
        dataDoctorToFilter.dni.toLowerCase().includes(dataToSearch.toLowerCase()) ||
        dataDoctorToFilter.email.toLowerCase().includes(dataToSearch.toLowerCase())

      );

      if (searchName.length > 0) {

        if (searchName.length === 1){

          this.createAppointmentForm.patchValue({
            searchDataDoctorForm: {
              dataSelect: searchName[0].dni,
            },
          });

          this.filteredDoctor = searchName;

        } else {
          this.filteredDoctor = searchName;
        }

      } else {
        this.filteredDoctor = this.doctors;

        Swal.fire({
          icon: 'error',
          toast: true,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          position: 'bottom',
          text: "We didn't found any doctors..."
        });
      }

    }
  }

  deleteAppointment(): void {

    const id = this.createAppointmentForm.value.searchAppointment!.selectAppointment;

    console.log(id);

    Swal.fire({
      title: 'Do you want to delete this appointment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes!',
    }).then((result) => {
      if (result.isConfirmed) {

        const data = {
          token: localStorage.getItem('token'),
          id: id
        }

        this.apiService.deleteAppointments(data).subscribe(
          (data: any) => {
            // console.log(data);

             if (data.message) {
                Swal.fire({
                  title: 'Appointment deleted!',
                  icon: 'success',
                  toast: true,
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                  position: 'bottom'
                });
      
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
            
             } else {
               Swal.fire({
                 title: 'Error',
                 text: 'Error deleting appointment. Please try again.',
                 icon: 'error',
               });
             }
           },
           (error) => {
             console.error('Error deleting appointment:', error);

             Swal.fire({
               title: 'Error',
               text: 'Error deleting appointment. Please try again.',
               icon: 'error',
             });
           }
         );
       }
    });

  }

  onSubmit(event: Event): void{
    event.preventDefault();
  }

  returnBack(): void {
    const modalElement: HTMLElement = document.getElementById('edit-appointment')!;

    if (modalElement) {
      const options: ModalOptions = {
        placement: 'bottom-right',
        backdrop: 'dynamic',
        backdropClasses:
          'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
        closable: true,
      };

      const instanceOptions: InstanceOptions = {
        id: this.modalId,
        override: true,
      };

      const modal: Modal = new Modal(modalElement, options, instanceOptions);

      modal.hide();
    } else {
      console.error('We did not found ID:', this.modalId);
    }
  }

}
