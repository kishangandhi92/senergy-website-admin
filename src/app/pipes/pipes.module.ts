import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchPipe } from './search-pipe';
import { SortPipe } from './sorting.pipe';

@NgModule({
  imports: [
    CommonModule,
    SearchPipe,
    SortPipe
  ],
  exports: [SearchPipe, SortPipe]
})
export class PipesModule { }
