/**
 * Todos Service
 * 
 * Service for accessing the todos facet using Angular patterns.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MyceliaService } from './mycelia.service';

@Injectable({ providedIn: 'root' })
export class TodosService {
  constructor(private mycelia: MyceliaService) {}

  getTodosFacet() {
    return this.mycelia.useFacet('todos');
  }

  getTodos$(): Observable<any[]> {
    return this.mycelia.system$.pipe(
      map(system => {
        const todos = system?.find?.('todos');
        return todos?.getAll() ?? [];
      })
    );
  }
}


