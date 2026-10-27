// Club identities are global; a club follow applies in every covered competition.
export function followsMatch(event,clubs=[],leagues=[]){return leagues.includes(event.league)||(event.competitions?.[0]?.competitors||[]).some(c=>clubs.some(t=>String(t.id)===String(c.id||c.team?.id)))}
export function followingCount(clubs=[],leagues=[]){return new Set(clubs.map(c=>String(c.id))).size+new Set(leagues).size}
export function mergeFollows(a,b){return {clubs:[...new Map([...(a.clubs||[]),...(b.clubs||[])].map(t=>[String(t.id),t])).values()],leagues:[...new Set([...(a.leagues||[]),...(b.leagues||[])])]}}
