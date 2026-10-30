export function externalTarget(href,origin){try{const url=new URL(href,origin);return url.protocol==='https:'&&url.origin!==origin?url.href:null}catch{return null}}
