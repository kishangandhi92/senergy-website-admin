import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'sort',
    pure: true,
})
export class SortPipe implements PipeTransform {
    transform(list: any[], column: string, order: string = 'asc'): any[] {
        let sortedArray = list.sort((a, b) => {
            if (a[column] > b[column]) {
                return order === 'asc' ? 1 : -1;
            }
            if (a[column] < b[column]) {
                return order === 'asc' ? -1 : 1;
            }
            return 0;
        });
        return sortedArray;
    }
}
