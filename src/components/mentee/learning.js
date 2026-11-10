export function resourceStatus(resource,now=Date.now()){
  if(resource.completed)return resource.type==='project'&&!resource.verified?'SUBMITTED':'GRADED';
  return +new Date(resource.deadline)<now?'MISSED':'PENDING';
}
export function videoEmbed(value){
  try{
    const url=new URL(value),host=url.hostname.toLowerCase();
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return null;
    if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host)){
      const id=host==='youtu.be'?url.pathname.split('/')[1]:url.searchParams.get('v')||url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1];
      return id&&/^[\w-]{6,20}$/.test(id)?`https://www.youtube-nocookie.com/embed/${id}`:null;
    }
    if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){const id=url.pathname.match(/(?:\/video)?\/(\d+)/)?.[1];return id?`https://player.vimeo.com/video/${id}`:null;}
    if(host==='drive.google.com'){const id=url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1]||url.searchParams.get('id');return id&&/^[\w-]+$/.test(id)?`https://drive.google.com/file/d/${id}/preview`:null;}
  }catch{}
  return null;
}
export function safeUrl(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}}
