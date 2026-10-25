import {D,month} from './decimal.mjs';
export const normalizeHeader=v=>String(v??'').replace(/[\s\u3000]/g,'').toLowerCase();
const common={'조사년월':'period','조사연월':'period','사업체코드':'businessId','품목코드':'itemId','품목명':'itemName','품목단위':'measureUnit','사업체명':'businessName','잠정확정구분':'responseState','비고':'note','미반영여부':'excludedFromIndex','사무소ID':'officeCode','사무소명':'officeName','조사담당자ID':'ownerId','조사담당자명':'ownerName'};
const pairs={자체생산:'own',위탁생산:'outsourced',수탁생산:'entrusted',구입:'purchased',재투입:'reprocessed',국내시판:'domestic',수출:'exported',기타출하:'otherShipped',과부족:'adjustment',월말재고:'closingStock',전월재고:'openingStock',생산능력:'capacity',생산실적:'actualOutput'};
const pairHeaders=Object.fromEntries(Object.entries(pairs).flatMap(([k,v])=>[['금액','amount'],['수량','quantity']].map(([a,b])=>[`${k}(${a})`,`${v}.${b}`])));
const orders=Object.fromEntries(Object.entries({전월수주잔량:'openingOrders',당월수주량:'newOrders',당월진척량:'progress',수주잔량:'closingOrders'}).flatMap(([k,v])=>[['내수','domestic'],['수출','export']].map(([a,b])=>[`${k}(${a})`,`${v}.${b}`])));
export const schemas={
 roster:{일련번호:'businessId',사업체명:'businessName',입력여부:'entryState',잠확정:'responseState',CASI입력여부:'casiState',CASI수정일시:'casiEditedAt',조사표수정일시:'interviewEditedAt',조사방법:'responseMethod','응답자(1)':'contactName',도로명주소:'roadAddress','전화번호(1)':'phone1','전화번호(2)':'phone2','휴대폰(1)':'mobile1','휴대폰(2)':'mobile2',팩스번호:'fax','E-MAIL':'email',담당자명:'ownerName',담당자ID:'ownerId',분소코드:'officeCode'},
 employment:{...common,월말종사자수:'workers',조업일수:'operatingDays','1일평균조업시간':'hoursPerDay'},
 dynamics:{...common,...pairHeaders,생산단가:'reportedProductionPrice',출하단가:'reportedShipmentPrice',재고단가:'reportedStockPrice'},
 capacity:{...common,...pairHeaders,가동률:'reportedUtilization',설비보유수:'equipment',표준조업일수:'standardDays','1일표준조업시간':'standardHours',비고사항:'note'},
 orders:{...common,...orders,'완성인도(톤수)':'deliveredTons','완성인도(척)':'deliveredShips'}
};
export const keyFields=type=>type==='roster'?['businessId']:['period','businessId',...(type==='employment'?[]:['itemId'])];
export const keyOf=(r,type)=>JSON.stringify(keyFields(type).map(k=>r[k]));
export function state(v){const m=/^([1-4])(?:\D|$)/.exec(String(v??'').trim());return m?+m[1]:null;}
const textFields=new Set(['businessId','itemId','period','businessName','itemName','measureUnit','note','excludedFromIndex','responseState','officeCode','officeName','ownerId','ownerName']);
function put(o,path,v){const a=path.split('.');if(a.length===1)o[path]=v;else(o[a[0]]??={})[a[1]]=v;}
export function parseTable(type,table,{sheet='자료',file='input',headerRow}={}){
 if(!schemas[type])throw Error('UNKNOWN_DATASET');
 const mapping=new Map(Object.entries(schemas[type]).map(([a,b])=>[normalizeHeader(a),b]));
 const required=keyFields(type), candidates=[];
 for(let i=0;i<Math.min(10,table.length);i++){const fields=new Set(table[i].map(v=>mapping.get(normalizeHeader(v))));if(required.every(k=>fields.has(k)))candidates.push(i);}
 const diagnostics=[];
 const fail=code=>({type,blocked:true,rows:[],fields:[],diagnostics:[...diagnostics,{code,file,sheet}]});
 if(headerRow===undefined){if(candidates.length!==1)return fail(candidates.length?'AMBIGUOUS_HEADER':'MISSING_KEY_HEADER');headerRow=candidates[0];}
 if(!candidates.includes(headerRow))return fail('INVALID_HEADER_SELECTION');
 const raw=table[headerRow],normalized=raw.map(normalizeHeader),nonempty=normalized.filter(Boolean);
 if(new Set(nonempty).size!==nonempty.length)return fail('DUPLICATE_HEADER');
 const fields=raw.map(v=>mapping.get(normalizeHeader(v))??null);
 const assigned=fields.filter(Boolean);if(new Set(assigned).size!==assigned.length)return fail('DUPLICATE_MAPPED_FIELD');
 const unknown=raw.filter((v,i)=>normalized[i]&&!fields[i]);
 if(unknown.length)diagnostics.push({code:'EXTRA_COLUMNS',columns:unknown.map(String),file,sheet});
 const rows=[],seen=new Map();
 for(let i=headerRow+1;i<table.length;i++){
  if(table[i].every(v=>v===null||v===undefined||String(v).trim()===''))continue;
  const r={sourceRows:[{dataset:type,file,sheet,excelRow:i+1}],extraFields:{}};
  table[i].forEach((v,j)=>{let value=v===null||v===undefined||String(v).trim()===''?null:String(v).trim();const f=fields[j];
   if(!f){if(raw[j])r.extraFields[String(raw[j])]=value;return;}
   if(type!=='roster'&&!textFields.has(f)){try{if(value!==null)D.of(value);}catch{diagnostics.push({code:'INVALID_NUMBER',field:f,excelRow:i+1,file,sheet});value={invalid:true,raw:value};}}
   put(r,f,value);
  });
  let invalid=false;
  for(const k of required)if(!r[k]){diagnostics.push({code:'MISSING_KEY',field:k,excelRow:i+1,file,sheet});invalid=true;}
  if(r.period){try{month(r.period);}catch{diagnostics.push({code:'INVALID_PERIOD',excelRow:i+1,file,sheet});invalid=true;}}
  if(r.responseState!==undefined){const v=state(r.responseState);if(v===null)diagnostics.push({code:'UNKNOWN_RESPONSE_STATE',excelRow:i+1,file,sheet});r.responseState=v;}
  if(invalid)continue;
  const key=keyOf(r,type);if(seen.has(key)){diagnostics.push({code:'DUPLICATE_KEY',key,excelRows:[seen.get(key),i+1],file,sheet});}else seen.set(key,i+1);
  rows.push(r);
 }
 const blocked=diagnostics.some(d=>['DUPLICATE_KEY','MISSING_KEY','INVALID_PERIOD'].includes(d.code));
 return {type,blocked,rows:blocked?[]:rows,fields:assigned,diagnostics,headerRow};
}
// Times with only day/hour require explicit collection-month context.
export function parseCasiTime(raw,collectionMonth){
 const s=String(raw??'').trim();let m=/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s),assumed=false;
 if(!m){const p=/^(\d{1,2})일\s*(\d{1,2})시\s*(\d{1,2})분$/.exec(s);if(!p||!collectionMonth)return {status:'UNCOMPUTABLE',code:'TIME_CONTEXT_MISSING'};month(collectionMonth);m=[s,collectionMonth.slice(0,4),collectionMonth.slice(4),...p.slice(1),'0'];assumed=true;}
 const [y,mo,d,h,mi,se]=m.slice(1).map(v=>+(v??0));const ms=Date.UTC(y,mo-1,d,h,mi,se);const t=new Date(ms);
 if(t.getUTCFullYear()!==y||t.getUTCMonth()!==mo-1||t.getUTCDate()!==d||h>23||mi>59||se>59)return {status:'UNCOMPUTABLE',code:'INVALID_TIMESTAMP'};
 return {status:'VALID',epochMs:ms-9*3600000,context:assumed?'ASSUMED_CONTEXT':'EXPLICIT',timezone:'Asia/Seoul'};
}
