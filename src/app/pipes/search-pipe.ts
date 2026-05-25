import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'SearchFilter'
})

export class SearchPipe implements PipeTransform {
    transform(items: any[], searchTerm: string, searchKey: string): any {

        if (!items) return [];
        if (!searchTerm) return items;

        searchTerm = searchTerm.toLowerCase();

        return items.filter(item => {
        // Customize this logic based on your search criteria
        // return item[searchKey].toLowerCase().includes(searchTerm);
            const value = this.getNestedValue(item, searchKey);
            return value && value.toLowerCase().includes(searchTerm);
        });
    }

    /**
     * Helper method to retrieve a value from an object, handling both direct properties and nested properties.
     * @param obj The object to search in.
     * @param path The path to the property (e.g., "propertyName" or "obj.propertyName").
     */
    private getNestedValue(obj: any, path: string): any {
        if (!obj || !path) return null;

        // Check if the key is nested or direct
        if (path.includes('.')) {
            // Handle nested property (e.g., "obj.propertyName")
            return path.split('.').reduce((acc, key) => (acc ? acc[key] : null), obj);
        } else {
            // Handle direct property
            return obj[path];
        }
    }
}
