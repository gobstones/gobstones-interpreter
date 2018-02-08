
import { LOCALE_ES } from './es';

export const LOCALE_EN = {};

for (let key in LOCALE_ES) {
  LOCALE_EN[key] = LOCALE_ES[key];
}

LOCALE_EN['TYPE:Color'] = 'Color';
LOCALE_EN['CONS:Color0'] = 'Blue';
LOCALE_EN['CONS:Color1'] = 'Black';
LOCALE_EN['CONS:Color2'] = 'Red';
LOCALE_EN['CONS:Color3'] = 'Green';

LOCALE_EN['TYPE:Dir'] = 'Dir';
LOCALE_EN['CONS:Dir0'] = 'North';
LOCALE_EN['CONS:Dir1'] = 'East';
LOCALE_EN['CONS:Dir2'] = 'South';
LOCALE_EN['CONS:Dir3'] = 'West';

LOCALE_EN['PRIM:PutStone'] = 'PutStone';
LOCALE_EN['PRIM:RemoveStone'] = 'RemoveStone';
LOCALE_EN['PRIM:Move'] = 'Move';
LOCALE_EN['PRIM:GoToEdge'] = 'GoToEdge';
LOCALE_EN['PRIM:EmptyBoardContents'] = 'EmptyBoardContents';
LOCALE_EN['PRIM:numStones'] = 'numStones';
LOCALE_EN['PRIM:anyStones'] = 'anyStones';
LOCALE_EN['PRIM:canMove'] = 'canMove';
LOCALE_EN['PRIM:next'] = 'next';
LOCALE_EN['PRIM:prev'] = 'prev';
LOCALE_EN['PRIM:opposite'] = 'opposite';
LOCALE_EN['PRIM:minBool'] = 'minBool';
LOCALE_EN['PRIM:maxBool'] = 'maxBool';
LOCALE_EN['PRIM:minColor'] = 'minColor';
LOCALE_EN['PRIM:maxColor'] = 'maxColor';
LOCALE_EN['PRIM:minDir'] = 'minDir';
LOCALE_EN['PRIM:maxDir'] = 'maxDir';

LOCALE_EN['PRIM:head'] = 'head';
LOCALE_EN['PRIM:tail'] = 'tail';
LOCALE_EN['PRIM:init'] = 'init';
LOCALE_EN['PRIM:last'] = 'last';

