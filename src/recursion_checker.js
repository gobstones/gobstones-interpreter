
import {
  N_DefProgram,
  N_DefInteractiveProgram,
  N_DefProcedure,
  N_DefFunction,
  N_StmtProcedureCall,
  N_ExprFunctionCall,
} from './ast';
import { Token } from './token';

export class RecursionChecker {

  /*
   * Each routine call (i.e. procedure or function call) in the source
   * code is of the form:
   *    R(e1, ..., en)
   * where R is the identifier for the routine.
   *
   * The token R is called the 'location' of the call.
   * Observe that the location includes not only the name of the
   * routine but also its position in the source code.
   *
   * The call graph is a dictionary whose keys are strings
   * and whose values are again dictionaries.
   * The outer and the inner dictionaries are indexed by routine names
   * in such a way that:
   *
   *   _callGraph[F][G]
   *
   * is the location of the first call to G inside the body of F.
   */
  constructor() {
    this._currentRoutine = null;
    this._callGraph = {};
  }

  /*
   * If there is a cycle in the call graph (using either procedure calls
   * or function calls), return a list:
   *   [c1, ..., cn]
   * where ci is the i-th call involved in a cycle.
   * A call is of the form:
   *   {caller: F , callee: G, location: L}
   * where F is the name (string) of the caller,
   *       G is the name (string) of the callee,
   *   and L is the location of the call.
   *
   * Otherwise return null.
   */
  callCycle(ast) {
    /* Build the call graph */
    this._visitNode(ast);

    /* Find a cycle in the call graph */
    return this._findCallCycle();
  }

  /* Visitor -- build the call graph */

  _addEdge(caller, callee) {
    if (!(caller in this._callGraph)) {
      this._callGraph[caller] = {};
    }
    if (!(callee.value in this._callGraph[caller])) {
      this._callGraph[caller][callee.value] = callee;
    }
  }

  _visitNode(node) {
    if (node === null || node instanceof Token) {
      /* Skip */
    } else if (node instanceof Array) {
      this._visitNodes(node);
    } else {
      this._visitTaggedNode(node);
    }
  }

  _visitNodes(nodes) {
    for (let node of nodes) {
      this._visitNode(node);
    }
  }

  _visitTaggedNode(node) {
    switch (node.tag) {
    case N_DefProgram:
    case N_DefInteractiveProgram:
      this._visitProgramDefinition(node);
      break;
    case N_DefProcedure:
    case N_DefFunction:
      this._visitRoutineDefinition(node);
      break;
    case N_StmtProcedureCall:
      this._visitProcedureCall(node);
      break;
    case N_ExprFunctionCall:
      this._visitFunctionCall(node);
      break;
    }
    this._visitNodes(node.children);
  }

  _visitProgramDefinition(node) {
    this._currentRoutine = 'program';
  }

  _visitRoutineDefinition(node) {
    this._currentRoutine = node.name.value;
  }

  _visitProcedureCall(node) {
    this._addEdge(this._currentRoutine, node.procedureName);
  }

  _visitFunctionCall(node) {
    this._addEdge(this._currentRoutine, node.functionName);
  }

  /* Find a cycle in the call graph */

  _findCallCycle() {
    let visited = {};
    let parents = {};
    for (let f in this._callGraph) {
      visited[f] = true;
      parents[f] = true;
      let cycle = this._findCallCycleFrom(visited, parents, [], f);
      if (cycle != null) {
        return cycle;
      }
      delete parents[f];
    }
    return null;
  }

  _findCallCycleFrom(visited, parents, path, f) {
    for (let g in this._callGraph[f]) {
      path.push({
        'caller': f,
        'callee': g,
        'location': this._callGraph[f][g]
      });
      if (g in parents) {
        while (path[0].caller !== g) {
          path.shift();
        }
        path.push();
        return path; /* Cycle */
      }
      if (!(g in visited)) {
        visited[g] = true;
        parents[g] = true;
        let cycle = this._findCallCycleFrom(visited, parents, path, g);
        if (cycle !== null) {
          return cycle;
        }
        delete parents[g];
      }
      path.pop();
    }
    return null;
  }

}

