// Input workflow metadata. Dynamics-1 defines the default inspection month.
export function inferInspectionPeriod(datasets,override=null){
 const valid=v=>/^\d{4}(0[1-9]|1[0-2])$/.test(String(v??''));
 const available=[...new Set((datasets.dynamics?.rows??[]).map(r=>r.period).filter(valid))].sort();
 if(override&&valid(override))return {period:override,source:'USER_OVERRIDE',available};
 return {period:available.at(-1)??null,source:'DYNAMICS_LATEST',available};
}
export function describeDataset(p){
 if(!p)return {state:'MISSING',rows:0,months:0,first:null,last:null};
 const periods=[...new Set((p.rows??[]).map(r=>r.period).filter(Boolean))].sort();
 return {state:p.blocked?'BLOCKED':'READY',rows:p.rows?.length??0,months:periods.length,first:periods[0]??null,last:periods.at(-1)??null};
}
export function searchHandbook(items,{query='',volume='ALL',codes=null}={}){
 const norm=v=>String(v??'').normalize('NFKC').replace(/[\s·ㆍ]/g,'').toLowerCase();
 const tokens=String(query).trim().split(/\s+/).map(norm).filter(Boolean);
 return items.filter(r=>(volume==='ALL'||String(r.volume)===String(volume))&&(!codes||codes.has(r.code))&&tokens.every(q=>norm(r.code+' '+r.name+' '+r.text).includes(q))).sort((a,b)=>{
 const q=norm(query),score=r=>norm(r.code)===q?0:norm(r.name)===q?1:norm(r.code+' '+r.name).includes(q)?2:3;return score(a)-score(b)||a.code.localeCompare(b.code);
 });
}
