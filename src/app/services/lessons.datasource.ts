import {CollectionViewer, DataSource} from "@angular/cdk/collections";
import {Observable} from "rxjs/Observable";
import {Lesson} from "../model/lesson";
import {CoursesService} from "./courses.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {catchError, finalize} from "rxjs/operators";
import {of} from "rxjs/observable/of";
import {MatPaginator} from '@angular/material';



export class LessonsDataSource implements DataSource<Lesson> {

  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);

  private loadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();

  constructor(private coursesService: CoursesService) {

  }

  loadLessons(courseId:number,
              filter:string,
              sortDirection:string,
              pageIndex:number,
              pageSize:number) {

    this.loadingSubject.next(true);

    this.coursesService.findLessons(courseId, filter, sortDirection,
      pageIndex, pageSize).pipe(
      catchError(() => of([])),
      finalize(() => this.loadingSubject.next(false))
    )
      .subscribe((lessonList: LessonList) => {
        this.lessonsSubject.next(lessonList.payload)
        this._updatePaginator(lessonsList.total)
      });
  }

  get paginator(): MatPaginator | null { return this._paginator; }
  set paginator(paginator: MatPaginator|null) {
    this._paginator = paginator;
    // this._updateChangeSubscription();
  }
  private _paginator: MatPaginator|null;

  _updatePaginator(filteredDataLength: number) {
    Promise.resolve().then(() => {
      if (!this.paginator) { return; }

      this.paginator.length = filteredDataLength;

      // If the page index is set beyond the page, reduce it to the last page.
      if (this.paginator.pageIndex > 0) {
        const lastPageIndex = Math.ceil(this.paginator.length / this.paginator.pageSize) - 1 || 0;
        this.paginator.pageIndex = Math.min(this.paginator.pageIndex, lastPageIndex);
      }
    });
  }

  connect(collectionViewer: CollectionViewer): Observable<Lesson[]> {
    console.log("Connecting data source");
    return this.lessonsSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.lessonsSubject.complete();
    this.loadingSubject.complete();
  }

}
