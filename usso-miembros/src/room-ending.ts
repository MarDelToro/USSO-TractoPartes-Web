import type {Lot} from './member-service.ts';
export type RoomEnding='won'|'lost'|'pending'|'closed';
export function roomEnding(lot:Lot,now:number):RoomEnding|null{
 if(lot.status!=='closed'&&(!Number.isFinite(Date.parse(lot.endsAt))||now<Date.parse(lot.endsAt)))return null;
 // The local countdown and highest offer alone never determine a winner.
 if(!lot.resultConfirmed)return 'pending';
 if(lot.outcome==='won')return 'won';
 if(lot.myBid!==undefined)return lot.outcome==='lost'?'lost':'pending';
 return 'closed';
}
