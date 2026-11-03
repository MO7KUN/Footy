export const matchState=event=>event?.status?.type?.state||event?.competitions?.[0]?.status?.type?.state||'';
export function matchesStatus(event,filter){return filter==='all'||matchState(event)===(filter==='live'?'in':filter)}
// Both public provider hosts expose the same schema. Retry transport/provider failures.
export async function scoreJSON(url,fetcher=fetch){
 const urls=url.startsWith('https://site.api.espn.com/')?[url.replace('https://site.api.espn.com/','https://site.web.api.espn.com/'),url]:[url];
 let failure;
 for(const endpoint of urls){try{const response=await fetcher(endpoint,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Feed returned '+response.status);return await response.json()}catch(error){failure=error}}
 throw failure;
}
