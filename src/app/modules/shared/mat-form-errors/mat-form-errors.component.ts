import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormControl, FormGroup, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-mat-form-errors',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './mat-form-errors.component.html',
  styleUrl: './mat-form-errors.component.scss'
})
export class MatFormErrorsComponent implements OnInit {

    public form: UntypedFormGroup
    public control : FormControl;

    @Input() controlName!: string;

    constructor(private controlContainer: ControlContainer) {}

    ngOnInit(): void {
        this.form = <FormGroup>this.controlContainer.control;
        this.control = <FormControl>this.form.get(this.controlName);
    }

}
