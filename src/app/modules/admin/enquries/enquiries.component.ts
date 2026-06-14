import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    OnInit,
    ViewChild,
    inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { EnquiryService } from './enquiry.service';

type EnquiryType = 'general' | 'career' | 'product';
type EnquiryRow = Record<string, string | number | null | undefined>;

interface EnquiryColumn {
    key: string;
    label: string;
}

interface EnquiryTableConfig {
    title: string;
    defaultSort: string;
    columns?: EnquiryColumn[];
}

const ENQUIRY_TABLE_CONFIG: Record<EnquiryType, EnquiryTableConfig> = {
    general: {
        title: 'General Enquiries',
        defaultSort: 'name',
        columns: [
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'emailId', label: 'Email ID' },
            { key: 'purpose', label: 'Purpose' },
            { key: 'message', label: 'Message' },
            { key: 'enquiredOn', label: 'Enquired On' },
        ],
    },
    career: {
        title: 'Career Enquiries',
        defaultSort: 'name',
        columns: [
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'emailId', label: 'Email ID' },
            { key: 'job_title', label: 'Job Title' },
            { key: 'message', label: 'Message' },
            { key: 'enquiredOn', label: 'Enquired On' },
        ],
    },
    product: {
        title: 'Product Enquiries',
        defaultSort: 'name',
    },
};

const COLUMN_LABEL_OVERRIDES: Record<string, string> = {
    emailId: 'Email ID',
    enquiredOn: 'Enquired On',
    job_title: 'Job Title',
    product_name: 'Product Name',
    productName: 'Product Name',
};

const HIDDEN_DYNAMIC_COLUMNS = new Set([
    'id',
    'autoNo',
    'createdAt',
    'updatedAt',
    '__v',
]);

const PRIORITY_COLUMN_ORDER = [
    'name',
    'phone',
    'emailId',
    'productName',
    'product_name',
    'purpose',
    'job_title',
    'message',
    'enquiredOn',
];

@Component({
    selector: 'app-enquiries',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSortModule,
        MatTableModule,
    ],
    templateUrl: './enquiries.component.html',
    styleUrl: './enquiries.component.scss',
})
export class EnquiriesComponent implements OnInit, AfterViewInit {
    @ViewChild(MatSort) private _sort!: MatSort;

    type: EnquiryType = 'general';
    pageTitle = ENQUIRY_TABLE_CONFIG.general.title;
    columns: EnquiryColumn[] = ENQUIRY_TABLE_CONFIG.general.columns ?? [];
    displayedColumns: string[] = this.columns.map(({ key }) => key);
    readonly dataSource = new MatTableDataSource<EnquiryRow>([]);

    private readonly _destroyRef = inject(DestroyRef);

    constructor(
        private readonly route: ActivatedRoute,
        private readonly _changeDetectorRef: ChangeDetectorRef,
        private readonly _enquiryService: EnquiryService
    ) {
        this.dataSource.sortingDataAccessor = (
            item: EnquiryRow,
            property: string
        ): string | number => {
            const value = item[property];

            return typeof value === 'string'
                ? value.toLocaleLowerCase()
                : value ?? '';
        };
    }

    ngOnInit(): void {
        this.route.data
            .pipe(
                map((data) => data['type'] as EnquiryType),
                takeUntilDestroyed(this._destroyRef)
            )
            .subscribe((routeType) => {
                this.updateRouteType(routeType);
                this.dataSource.data = [];
            });

        this._enquiryService.enquiries$
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe((enquiries) => {
                this.columns = this.resolveColumns(enquiries);
                this.displayedColumns = this.columns.map(({ key }) => key);
                this.dataSource.data = enquiries;
                this.applyDefaultSort();
            });
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this._sort;
        this.applyDefaultSort();
    }

    downloadExcel(): void {
        this._enquiryService.downloadExcel(this.type);
    }

    private applyDefaultSort(): void {
        if (!this._sort || this.displayedColumns.length === 0) {
            return;
        }

        const configuredSortColumn =
            ENQUIRY_TABLE_CONFIG[this.type].defaultSort;
        const sortColumn = this.displayedColumns.includes(configuredSortColumn)
            ? configuredSortColumn
            : this.displayedColumns[0];

        this._sort.sort({
            id: sortColumn,
            start: 'asc',
            disableClear: true,
        });

        this._changeDetectorRef.detectChanges();
    }

    private updateRouteType(routeType: EnquiryType): void {
        this.type = ENQUIRY_TABLE_CONFIG[routeType] ? routeType : 'general';
        this.pageTitle = ENQUIRY_TABLE_CONFIG[this.type].title;
        this.columns = this.resolveColumns();
        this.displayedColumns = this.columns.map(({ key }) => key);
    }

    private resolveColumns(enquiries: EnquiryRow[] = []): EnquiryColumn[] {
        const configuredColumns = ENQUIRY_TABLE_CONFIG[this.type].columns;

        if (configuredColumns?.length) {
            return configuredColumns;
        }

        if (!enquiries.length) {
            return [];
        }

        return this.buildDynamicColumns(enquiries[0]);
    }

    private buildDynamicColumns(enquiry: EnquiryRow): EnquiryColumn[] {
        const availableKeys = Object.keys(enquiry).filter(
            (key) => !HIDDEN_DYNAMIC_COLUMNS.has(key)
        );

        const orderedKeys = [
            ...PRIORITY_COLUMN_ORDER.filter((key) => availableKeys.includes(key)),
            ...availableKeys.filter(
                (key) => !PRIORITY_COLUMN_ORDER.includes(key)
            ),
        ];

        return orderedKeys.map((key) => ({
            key,
            label:
                COLUMN_LABEL_OVERRIDES[key] ?? this.formatColumnLabel(key),
        }));
    }

    private formatColumnLabel(key: string): string {
        return key
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }
}
